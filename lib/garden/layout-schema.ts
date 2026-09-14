import type { D1DatabaseLike } from "@/lib/garden/cloudflare-db";
import { GARDEN_ID } from "@/lib/garden/storage-contract";

type TableInfoRow = { name: string };
type TableDefinitionRow = { name: string; sql: string | null };

const seedObjects = [
  ["layout-path-main", "path", 485, 180, 485, 930, 45, null, null, null, null, "Main path", null, 0],
  ["layout-path-cross", "path", 120, 560, 820, 560, 45, null, null, null, null, "Cross path", null, 1],
  ["layout-trellis-north", "trellis", 240, 180, 240, 500, null, 180, null, 150, null, "Post & trellis", null, 2],
  ["layout-tree-north", "tree", null, null, null, null, null, null, 100, null, null, "Fruit tree", "360,210", 3],
  ["layout-text-entrance", "text", null, null, null, null, null, null, null, null, "ENTRANCE", null, "450,28", 4],
  ["layout-text-exit", "text", null, null, null, null, null, null, null, null, "EXIT", null, "28,565", 5],
] as const;

const layoutTableSql = `
  CREATE TABLE IF NOT EXISTS layout_objects (
    id TEXT PRIMARY KEY,
    garden_id TEXT NOT NULL,
    object_type TEXT NOT NULL CHECK (object_type IN ('path', 'trellis', 'tree', 'structure', 'text')),
    x1_cm REAL,
    y1_cm REAL,
    x2_cm REAL,
    y2_cm REAL,
    width_cm REAL,
    height_cm REAL,
    diameter_cm REAL,
    post_spacing_cm REAL,
    text_value TEXT,
    label TEXT,
    point_xy TEXT,
    font_size REAL,
    structure_kind TEXT,
    depth_cm REAL,
    rotation_deg REAL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
  )
`;

async function addLayoutColumnIfMissing(db: D1DatabaseLike, name: string, definition: string) {
  const columns = await db.prepare("PRAGMA table_info(layout_objects)").all<TableInfoRow>();
  if ((columns.results ?? []).some((column) => column.name === name)) return;
  try {
    await db.prepare(`ALTER TABLE layout_objects ADD COLUMN ${name} ${definition}`).run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
  }
}

export async function ensureGardenLayoutSchema(db: D1DatabaseLike) {
  const bedColumns = await db.prepare("PRAGMA table_info(beds)").all<TableInfoRow>();
  if (!(bedColumns.results ?? []).some((column) => column.name === "archived_at")) {
    try {
      await db.prepare("ALTER TABLE beds ADD COLUMN archived_at TEXT").run();
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
    }
  }

  const existing = await db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name = 'layout_objects' LIMIT 1",
  ).first<TableDefinitionRow>();
  const shouldSeed = !existing?.name;

  // The original Drawing V2 table used a CHECK constraint limited to four object
  // types. SQLite cannot alter CHECK constraints in place, so upgrade the table
  // transactionally before structure objects are ever saved.
  if (existing?.name && !(existing.sql ?? "").includes("'structure'")) {
    await db.batch([
      db.prepare("ALTER TABLE layout_objects RENAME TO layout_objects_legacy"),
      db.prepare(layoutTableSql),
      db.prepare(`
        INSERT INTO layout_objects (
          id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, width_cm, height_cm,
          diameter_cm, post_spacing_cm, text_value, label, point_xy, font_size,
          sort_order, created_at, updated_at
        )
        SELECT id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, width_cm, height_cm,
          diameter_cm, post_spacing_cm, text_value, label, point_xy, font_size,
          sort_order, created_at, updated_at
        FROM layout_objects_legacy
      `),
      db.prepare("DROP TABLE layout_objects_legacy"),
    ]);
  } else {
    await db.prepare(layoutTableSql).run();
  }

  // These are also guarded independently so a partially upgraded development DB
  // can repair itself without a one-off destructive migration.
  await addLayoutColumnIfMissing(db, "structure_kind", "TEXT");
  await addLayoutColumnIfMissing(db, "depth_cm", "REAL");
  await addLayoutColumnIfMissing(db, "rotation_deg", "REAL");

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_layout_objects_garden ON layout_objects(garden_id, sort_order)").run();
  if (!shouldSeed) return;

  const statements = seedObjects.map((seed) => db.prepare(`
    INSERT OR IGNORE INTO layout_objects (
      id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm,
      width_cm, height_cm, diameter_cm, post_spacing_cm, text_value,
      label, point_xy, sort_order, font_size, structure_kind, depth_cm, rotation_deg
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
  `).bind(
    seed[0], GARDEN_ID, seed[1], seed[2], seed[3], seed[4], seed[5], seed[6], seed[7],
    seed[8], seed[9], seed[10], seed[11], seed[12], seed[13], seed[1] === "text" ? 13 : null,
  ));

  if (statements.length) await db.batch(statements);
}
