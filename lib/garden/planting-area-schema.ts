import type { D1DatabaseLike } from "@/lib/garden/cloudflare-db";
import { GARDEN_ID } from "@/lib/garden/storage-contract";

type TableInfoRow = { name: string };
type TableNameRow = { name: string };
type LegacyPlantingRow = {
  id: string;
  bed_id: string;
  pattern?: string | null;
  icon_size_px?: number | null;
  visual_spacing?: string | null;
};

function safePattern(value: string | null | undefined) {
  return ["grid", "staggered", "rows", "natural", "single"].includes(value ?? "") ? value! : "grid";
}

function safeVisualSpacing(value: string | null | undefined) {
  return ["tight", "normal", "wide"].includes(value ?? "") ? value! : "normal";
}

export async function ensureGardenPlantingAreaSchema(db: D1DatabaseLike) {
  const plantingColumns = await db.prepare("PRAGMA table_info(plantings)").all<TableInfoRow>();
  if (!(plantingColumns.results ?? []).some((column) => column.name === "area_id")) {
    try {
      await db.prepare("ALTER TABLE plantings ADD COLUMN area_id TEXT").run();
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
    }
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS planting_areas (
      id TEXT PRIMARY KEY,
      garden_id TEXT NOT NULL,
      bed_id TEXT NOT NULL,
      x_percent REAL NOT NULL DEFAULT 0,
      y_percent REAL NOT NULL DEFAULT 0,
      width_percent REAL NOT NULL DEFAULT 100,
      height_percent REAL NOT NULL DEFAULT 100,
      pattern TEXT NOT NULL DEFAULT 'grid' CHECK (pattern IN ('grid', 'staggered', 'rows', 'natural', 'single')),
      icon_size_px REAL NOT NULL DEFAULT 16,
      visual_spacing TEXT NOT NULL DEFAULT 'normal' CHECK (visual_spacing IN ('tight', 'normal', 'wide')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
      FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE
    )
  `).run();

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_planting_areas_garden ON planting_areas(garden_id, archived_at, sort_order)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_planting_areas_bed ON planting_areas(bed_id, archived_at)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_plantings_area ON plantings(area_id)").run();

  const stylesTable = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'planting_styles' LIMIT 1",
  ).first<TableNameRow>();

  const legacy = stylesTable?.name
    ? await db.prepare(`
        SELECT p.id, p.bed_id, s.pattern, s.icon_size_px, s.visual_spacing
        FROM plantings p
        LEFT JOIN planting_styles s ON s.garden_id = p.garden_id AND s.bed_id = p.bed_id
        WHERE p.garden_id = ? AND p.status = 'active' AND p.bed_id IS NOT NULL AND p.area_id IS NULL
        ORDER BY p.created_at ASC
      `).bind(GARDEN_ID).all<LegacyPlantingRow>()
    : await db.prepare(`
        SELECT p.id, p.bed_id
        FROM plantings p
        WHERE p.garden_id = ? AND p.status = 'active' AND p.bed_id IS NOT NULL AND p.area_id IS NULL
        ORDER BY p.created_at ASC
      `).bind(GARDEN_ID).all<LegacyPlantingRow>();

  const statements = [];
  for (const [index, planting] of (legacy.results ?? []).entries()) {
    const areaId = `area-${planting.id}`;
    statements.push(db.prepare(`
      INSERT OR IGNORE INTO planting_areas (
        id, garden_id, bed_id, x_percent, y_percent, width_percent, height_percent,
        pattern, icon_size_px, visual_spacing, sort_order, archived_at
      ) VALUES (?, ?, ?, 0, 0, 100, 100, ?, ?, ?, ?, NULL)
    `).bind(
      areaId,
      GARDEN_ID,
      planting.bed_id,
      safePattern(planting.pattern),
      Math.min(64, Math.max(8, Number(planting.icon_size_px ?? 16))),
      safeVisualSpacing(planting.visual_spacing),
      index,
    ));
    statements.push(db.prepare(
      "UPDATE plantings SET area_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND area_id IS NULL",
    ).bind(areaId, planting.id));
  }

  if (statements.length) await db.batch(statements);
}
