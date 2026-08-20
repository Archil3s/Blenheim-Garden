-- Drawing Interface V2: editable non-plant layout features and non-destructive bed removal.
ALTER TABLE beds ADD COLUMN archived_at TEXT;

CREATE TABLE IF NOT EXISTS layout_objects (
  id TEXT PRIMARY KEY,
  garden_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('path', 'trellis', 'tree', 'text')),
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
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_layout_objects_garden ON layout_objects(garden_id, sort_order);

INSERT OR IGNORE INTO layout_objects
  (id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, width_cm, label, sort_order)
VALUES
  ('layout-path-main', 'blenheim-garden', 'path', 485, 180, 485, 930, 45, 'Main path', 0),
  ('layout-path-cross', 'blenheim-garden', 'path', 120, 560, 820, 560, 45, 'Cross path', 1);

INSERT OR IGNORE INTO layout_objects
  (id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, height_cm, post_spacing_cm, label, sort_order)
VALUES
  ('layout-trellis-north', 'blenheim-garden', 'trellis', 240, 180, 240, 500, 180, 150, 'Post & trellis', 2);

INSERT OR IGNORE INTO layout_objects
  (id, garden_id, object_type, diameter_cm, label, point_xy, sort_order)
VALUES
  ('layout-tree-north', 'blenheim-garden', 'tree', 100, 'Fruit tree', '360,210', 3);

INSERT OR IGNORE INTO layout_objects
  (id, garden_id, object_type, text_value, point_xy, font_size, sort_order)
VALUES
  ('layout-text-entrance', 'blenheim-garden', 'text', 'ENTRANCE', '450,28', 13, 4),
  ('layout-text-exit', 'blenheim-garden', 'text', 'EXIT', '28,565', 13, 5);
