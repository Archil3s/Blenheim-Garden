import { getGardenDb, getGardenMediaBucket, type D1DatabaseLike } from "@/lib/garden/cloudflare-db";
import {
  GARDEN_MEDIA_LIMITS,
  classifyGardenMedia,
  extensionForGardenMedia,
  maxBytesForGardenMedia,
} from "@/lib/garden/media-limits";
import { GARDEN_ID } from "@/lib/garden/storage-contract";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";

export const dynamic = "force-dynamic";

const TARGET_TYPES = new Set(["garden", "bed", "row", "planting", "harvest"]);
type TargetType = "garden" | "bed" | "row" | "planting" | "harvest";

type QuotaRow = {
  file_count: number;
  total_bytes: number;
};

type MediaRow = {
  id: string;
  target_type: TargetType;
  target_id: string;
  media_type: "photo" | "video";
  file_name: string;
  content_type: string;
  size_bytes: number | null;
  captured_at: string | null;
  caption: string | null;
  created_at: string;
};

function parseTarget(url: URL) {
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId")?.trim();
  if (!targetType || !TARGET_TYPES.has(targetType) || !targetId) return null;
  return { targetType: targetType as TargetType, targetId };
}

async function quota(db: D1DatabaseLike) {
  const row = await db.prepare(`
    SELECT COUNT(*) AS file_count, COALESCE(SUM(size_bytes), 0) AS total_bytes
    FROM media
    WHERE garden_id = ?
  `).bind(GARDEN_ID).first<QuotaRow>();

  return {
    fileCount: Number(row?.file_count ?? 0),
    totalBytes: Number(row?.total_bytes ?? 0),
  };
}

async function targetExists(db: D1DatabaseLike, targetType: TargetType, targetId: string) {
  if (targetType === "garden") return targetId === GARDEN_ID;

  const table = targetType === "bed"
    ? "beds"
    : targetType === "row"
      ? "planting_rows"
      : targetType === "planting"
        ? "plantings"
        : "harvests";

  const row = await db.prepare(`SELECT id FROM ${table} WHERE garden_id = ? AND id = ? LIMIT 1`)
    .bind(GARDEN_ID, targetId)
    .first<{ id: string }>();
  return Boolean(row?.id);
}

async function linkedPlantingId(db: D1DatabaseLike, targetType: TargetType, targetId: string) {
  if (targetType === "planting") return targetId;
  if (targetType === "bed") {
    const row = await db.prepare(`
      SELECT id FROM plantings
      WHERE garden_id = ? AND bed_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `).bind(GARDEN_ID, targetId).first<{ id: string }>();
    return row?.id ?? null;
  }
  if (targetType === "row") {
    const row = await db.prepare(`
      SELECT id FROM plantings
      WHERE garden_id = ? AND row_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `).bind(GARDEN_ID, targetId).first<{ id: string }>();
    return row?.id ?? null;
  }
  if (targetType === "harvest") {
    const row = await db.prepare(`SELECT planting_id FROM harvests WHERE garden_id = ? AND id = ? LIMIT 1`)
      .bind(GARDEN_ID, targetId)
      .first<{ planting_id: string | null }>();
    return row?.planting_id ?? null;
  }
  return null;
}

function serialise(row: MediaRow) {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    mediaType: row.media_type,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    capturedAt: row.captured_at,
    caption: row.caption,
    createdAt: row.created_at,
    url: `/api/garden/media/${encodeURIComponent(row.id)}`,
  };
}

export async function GET(request: Request) {
  try {
    const db = getGardenDb();
    const url = new URL(request.url);
    const target = parseTarget(url);
    const statement = target
      ? db.prepare(`
          SELECT id, target_type, target_id, media_type, file_name, content_type,
                 size_bytes, captured_at, caption, created_at
          FROM media
          WHERE garden_id = ? AND target_type = ? AND target_id = ?
          ORDER BY COALESCE(captured_at, created_at) DESC, created_at DESC
        `).bind(GARDEN_ID, target.targetType, target.targetId)
      : db.prepare(`
          SELECT id, target_type, target_id, media_type, file_name, content_type,
                 size_bytes, captured_at, caption, created_at
          FROM media
          WHERE garden_id = ?
          ORDER BY COALESCE(captured_at, created_at) DESC, created_at DESC
          LIMIT 200
        `).bind(GARDEN_ID);

    const result = await statement.all<MediaRow>();
    const usage = await quota(db);
    return Response.json({
      ok: true,
      items: (result.results ?? []).map(serialise),
      usage,
      limits: GARDEN_MEDIA_LIMITS,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load garden media.",
    }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > GARDEN_MEDIA_LIMITS.maxVideoBytes + 2 * 1024 * 1024) {
    return Response.json({ ok: false, error: "Upload is larger than the maximum permitted request size." }, { status: 413 });
  }

  try {
    const db = getGardenDb();
    const bucket = getGardenMediaBucket();
    const form = await request.formData();
    const file = form.get("file");
    const targetTypeRaw = form.get("targetType");
    const targetIdRaw = form.get("targetId");
    const captionRaw = form.get("caption");
    const capturedAtRaw = form.get("capturedAt");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Choose a photo or video to upload." }, { status: 400 });
    }

    const targetType = typeof targetTypeRaw === "string" && TARGET_TYPES.has(targetTypeRaw)
      ? targetTypeRaw as TargetType
      : null;
    const targetId = typeof targetIdRaw === "string" ? targetIdRaw.trim() : "";
    if (!targetType || !targetId || !(await targetExists(db, targetType, targetId))) {
      return Response.json({ ok: false, error: "The selected garden target does not exist." }, { status: 400 });
    }

    const mediaType = classifyGardenMedia(file.type);
    if (!mediaType) {
      return Response.json({
        ok: false,
        error: "Unsupported file type. Use JPEG, PNG, WebP, HEIC/HEIF, MP4, WebM, or MOV.",
      }, { status: 415 });
    }

    const perFileLimit = maxBytesForGardenMedia(mediaType);
    if (file.size <= 0 || file.size > perFileLimit) {
      const maxMb = Math.round(perFileLimit / 1024 / 1024);
      return Response.json({ ok: false, error: `${mediaType === "photo" ? "Photos" : "Videos"} must be ${maxMb} MB or smaller.` }, { status: 413 });
    }

    const usage = await quota(db);
    if (usage.fileCount >= GARDEN_MEDIA_LIMITS.maxFiles) {
      return Response.json({ ok: false, error: `Garden media is capped at ${GARDEN_MEDIA_LIMITS.maxFiles} files.` }, { status: 413 });
    }
    if (usage.totalBytes + file.size > GARDEN_MEDIA_LIMITS.maxTotalBytes) {
      return Response.json({ ok: false, error: "The 2 GB garden media quota would be exceeded by this upload." }, { status: 413 });
    }

    const id = crypto.randomUUID();
    const extension = extensionForGardenMedia(file.type);
    const r2Key = `gardens/${GARDEN_ID}/${mediaType}/${id}.${extension}`;
    const fileName = (file.name || `${mediaType}.${extension}`).slice(0, 240);
    const caption = typeof captionRaw === "string" && captionRaw.trim()
      ? captionRaw.trim().slice(0, 1000)
      : null;
    const capturedAt = typeof capturedAtRaw === "string" && capturedAtRaw.trim()
      ? capturedAtRaw.trim().slice(0, 40)
      : null;
    const plantingId = await linkedPlantingId(db, targetType, targetId);

    await bucket.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "private, max-age=3600",
      },
    });

    try {
      await db.prepare(`
        INSERT INTO media (
          id, garden_id, planting_id, target_type, target_id, r2_key,
          media_type, file_name, content_type, size_bytes, captured_at, caption
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        GARDEN_ID,
        plantingId,
        targetType,
        targetId,
        r2Key,
        mediaType,
        fileName,
        file.type,
        file.size,
        capturedAt,
        caption,
      ).run();
    } catch (error) {
      await bucket.delete(r2Key);
      throw error;
    }

    return Response.json({
      ok: true,
      item: {
        id,
        targetType,
        targetId,
        mediaType,
        fileName,
        contentType: file.type,
        sizeBytes: file.size,
        capturedAt,
        caption,
        createdAt: new Date().toISOString(),
        url: `/api/garden/media/${encodeURIComponent(id)}`,
      },
      usage: {
        fileCount: usage.fileCount + 1,
        totalBytes: usage.totalBytes + file.size,
      },
      limits: GARDEN_MEDIA_LIMITS,
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to upload garden media.",
    }, { status: 503 });
  }
}
