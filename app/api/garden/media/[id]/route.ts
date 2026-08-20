import { getGardenDb, getGardenMediaBucket } from "@/lib/garden/cloudflare-db";
import { GARDEN_ID } from "@/lib/garden/storage-contract";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";

export const dynamic = "force-dynamic";

type MediaObjectRow = {
  id: string;
  r2_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number | null;
};

function safeHeaderFileName(fileName: string) {
  return fileName.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "garden-media";
}

async function findMedia(id: string) {
  const db = getGardenDb();
  return db.prepare(`
    SELECT id, r2_key, file_name, content_type, size_bytes
    FROM media
    WHERE garden_id = ? AND id = ?
    LIMIT 1
  `).bind(GARDEN_ID, id).first<MediaObjectRow>();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const media = await findMedia(id);
    if (!media) return new Response("Not found", { status: 404 });

    const object = await getGardenMediaBucket().get(media.r2_key);
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    headers.set("content-type", object.httpMetadata?.contentType ?? media.content_type ?? "application/octet-stream");
    headers.set("content-disposition", `inline; filename="${safeHeaderFileName(media.file_name)}"`);
    headers.set("cache-control", "private, max-age=3600");
    headers.set("x-content-type-options", "nosniff");
    if (media.size_bytes != null) headers.set("content-length", String(media.size_bytes));

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to read garden media.",
    }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const db = getGardenDb();
    const media = await findMedia(id);
    if (!media) return Response.json({ ok: false, error: "Media item not found." }, { status: 404 });

    await getGardenMediaBucket().delete(media.r2_key);
    await db.prepare("DELETE FROM media WHERE garden_id = ? AND id = ?")
      .bind(GARDEN_ID, id)
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to delete garden media.",
    }, { status: 503 });
  }
}
