PRAGMA foreign_keys = ON;

-- Core garden identity and canvas scale.
CREATE TABLE IF NOT EXISTS gardens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  canvas_width_cm INTEGER NOT NULL DEFAULT 900,
  canvas_height_cm INTEGER NOT NULL DEFAULT 1080,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Physical bed geometry. Crop history is intentionally kept in plantings.
CREATE TABLE IF NOT EXISTS beds (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  label TEXT NOT NULL,
  x_percent REAL NOT NULL,
  y_percent REAL NOT NULL,
  width_percent REAL NOT NULL,
  height_percent REAL NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

-- Free-drawn planting row geometry.
CREATE TABLE IF NOT EXISTS planting_rows (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  x1_cm REAL NOT NULL,
  y1_cm REAL NOT NULL,
  x2_cm REAL NOT NULL,
  y2_cm REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

-- One crop/variety occupancy record. A planting belongs to either a bed or a row.
CREATE TABLE IF NOT EXISTS plantings (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  bed_id TEXT,
  row_id TEXT,
  crop_name TEXT NOT NULL,
  crop_icon TEXT,
  variety TEXT,
  spacing_cm REAL,
  estimated_count INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'finished')),
  sow_date TEXT,
  germinated_date TEXT,
  transplant_date TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
  FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE,
  FOREIGN KEY (row_id) REFERENCES planting_rows(id) ON DELETE CASCADE,
  CHECK (
    (bed_id IS NOT NULL AND row_id IS NULL)
    OR (bed_id IS NULL AND row_id IS NOT NULL)
  )
);

-- General dated notes can belong to the garden, a bed, a row, or a planting.
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('garden', 'bed', 'row', 'planting')),
  target_id TEXT NOT NULL,
  body TEXT NOT NULL,
  occurred_on TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

-- Harvest records remain historical even after a bed is replanted.
CREATE TABLE IF NOT EXISTS harvests (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  planting_id TEXT,
  harvested_on TEXT NOT NULL,
  weight_g REAL,
  quantity REAL,
  unit TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
  FOREIGN KEY (planting_id) REFERENCES plantings(id) ON DELETE SET NULL
);

-- R2 owns the file bytes. D1 stores searchable metadata and attachment context.
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  planting_id TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('garden', 'bed', 'row', 'planting', 'harvest')),
  target_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER,
  captured_at TEXT,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
  FOREIGN KEY (planting_id) REFERENCES plantings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('garden', 'bed', 'row', 'planting')),
  target_id TEXT,
  title TEXT NOT NULL,
  due_on TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seed_inventory (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  supplier TEXT,
  packet_count REAL,
  approximate_seeds INTEGER,
  purchased_on TEXT,
  expiry_year INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_beds_garden ON beds(garden_id);
CREATE INDEX IF NOT EXISTS idx_rows_garden ON planting_rows(garden_id);
CREATE INDEX IF NOT EXISTS idx_plantings_garden_status ON plantings(garden_id, status);
CREATE INDEX IF NOT EXISTS idx_plantings_bed ON plantings(bed_id);
CREATE INDEX IF NOT EXISTS idx_plantings_row ON plantings(row_id);
CREATE INDEX IF NOT EXISTS idx_notes_target ON notes(garden_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON harvests(garden_id, harvested_on);
CREATE INDEX IF NOT EXISTS idx_media_target ON media(garden_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(garden_id, status, due_on);
CREATE INDEX IF NOT EXISTS idx_seed_inventory_crop ON seed_inventory(garden_id, crop_name);

INSERT OR IGNORE INTO gardens (
  id,
  name,
  year,
  timezone,
  canvas_width_cm,
  canvas_height_cm
) VALUES (
  'blenheim-garden',
  'Blenheim Garden',
  2026,
  'Pacific/Auckland',
  900,
  1080
);
