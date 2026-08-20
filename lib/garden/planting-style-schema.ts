import type { D1DatabaseLike } from "@/lib/garden/cloudflare-db";

export async function ensurePlantingStyleSchema(db: D1DatabaseLike) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS planting_styles (
      garden_id TEXT NOT NULL,
      bed_id TEXT NOT NULL,
      icon_size_px REAL NOT NULL DEFAULT 14,
      density_percent INTEGER NOT NULL DEFAULT 70,
      pattern TEXT NOT NULL DEFAULT 'grid' CHECK (pattern IN ('grid', 'staggered', 'rows', 'natural', 'single')),
      visual_spacing TEXT NOT NULL DEFAULT 'normal' CHECK (visual_spacing IN ('tight', 'normal', 'wide')),
      auto_fit INTEGER NOT NULL DEFAULT 1 CHECK (auto_fit IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (garden_id, bed_id),
      FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
      FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_planting_styles_bed
    ON planting_styles(garden_id, bed_id)
  `).run();
}
