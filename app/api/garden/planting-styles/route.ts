import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { ensurePlantingStyleSchema } from "@/lib/garden/planting-style-schema";
import { GARDEN_ID } from "@/lib/garden/storage-contract";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";

export const dynamic = "force-dynamic";

type Pattern = "grid" | "staggered" | "rows" | "natural" | "single";
type VisualSpacing = "tight" | "normal" | "wide";

type StyleRow = {
  bed_id: string;
  label: string;
  sort_order: number;
  icon_size_px: number | null;
  density_percent: number | null;
  pattern: Pattern | null;
  visual_spacing: VisualSpacing | null;
  auto_fit: number | null;
};

const PATTERNS = new Set<Pattern>(["grid", "staggered", "rows", "natural", "single"]);
const SPACING = new Set<VisualSpacing>(["tight", "normal", "wide"]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberValue(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function styleDto(row: StyleRow) {
  return {
    bedId: row.bed_id,
    label: row.label,
    sortOrder: Number(row.sort_order),
    iconSize: clamp(Number(row.icon_size_px ?? 14), 8, 40),
    density: clamp(Math.round(Number(row.density_percent ?? 70)), 10, 100),
    pattern: PATTERNS.has(row.pattern as Pattern) ? row.pattern : "grid",
    visualSpacing: SPACING.has(row.visual_spacing as VisualSpacing) ? row.visual_spacing : "normal",
    autoFit: Number(row.auto_fit ?? 1) !== 0,
  };
}

export async function GET() {
  try {
    const db = getGardenDb();
    await ensurePlantingStyleSchema(db);
    const result = await db.prepare(`
      SELECT b.id AS bed_id, b.label, b.sort_order,
        s.icon_size_px, s.density_percent, s.pattern, s.visual_spacing, s.auto_fit
      FROM beds b
      LEFT JOIN planting_styles s ON s.garden_id = b.garden_id AND s.bed_id = b.id
      WHERE b.garden_id = ? AND b.archived_at IS NULL
      ORDER BY b.sort_order ASC, b.id ASC
    `).bind(GARDEN_ID).all<StyleRow>();

    return Response.json({ ok: true, styles: (result.results ?? []).map(styleDto) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load planting styles." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json() as Record<string, unknown>;
    const bedId = typeof body.bedId === "string" ? body.bedId.trim() : "";
    if (!bedId) return Response.json({ ok: false, error: "Choose a bed first." }, { status: 400 });

    const iconSize = clamp(numberValue(body.iconSize, 14), 8, 40);
    const density = clamp(Math.round(numberValue(body.density, 70)), 10, 100);
    const pattern = PATTERNS.has(body.pattern as Pattern) ? body.pattern as Pattern : "grid";
    const visualSpacing = SPACING.has(body.visualSpacing as VisualSpacing) ? body.visualSpacing as VisualSpacing : "normal";
    const autoFit = body.autoFit !== false;

    const db = getGardenDb();
    await ensurePlantingStyleSchema(db);
    const bed = await db.prepare(`
      SELECT id FROM beds WHERE garden_id = ? AND id = ? AND archived_at IS NULL LIMIT 1
    `).bind(GARDEN_ID, bedId).first<{ id: string }>();
    if (!bed) return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });

    await db.prepare(`
      INSERT INTO planting_styles (
        garden_id, bed_id, icon_size_px, density_percent, pattern, visual_spacing, auto_fit
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(garden_id, bed_id) DO UPDATE SET
        icon_size_px = excluded.icon_size_px,
        density_percent = excluded.density_percent,
        pattern = excluded.pattern,
        visual_spacing = excluded.visual_spacing,
        auto_fit = excluded.auto_fit,
        updated_at = CURRENT_TIMESTAMP
    `).bind(GARDEN_ID, bedId, iconSize, density, pattern, visualSpacing, autoFit ? 1 : 0).run();

    return Response.json({
      ok: true,
      style: { bedId, iconSize, density, pattern, visualSpacing, autoFit },
    });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save planting style." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const bedId = url.searchParams.get("bedId")?.trim() ?? "";
    if (!bedId) return Response.json({ ok: false, error: "Choose a bed first." }, { status: 400 });
    const db = getGardenDb();
    await ensurePlantingStyleSchema(db);
    await db.prepare("DELETE FROM planting_styles WHERE garden_id = ? AND bed_id = ?").bind(GARDEN_ID, bedId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to reset planting style." }, { status: 400 });
  }
}
