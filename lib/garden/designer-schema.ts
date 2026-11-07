import type { D1DatabaseLike } from "./cloudflare-db";

export async function ensureDesignerSchema(db: D1DatabaseLike) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS garden_item_locks (
    garden_id TEXT PRIMARY KEY REFERENCES gardens(id) ON DELETE CASCADE,
    payload_json TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS designer_shapes (
    garden_id TEXT NOT NULL,
    id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (garden_id, id),
    FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
  )`).run();
}
