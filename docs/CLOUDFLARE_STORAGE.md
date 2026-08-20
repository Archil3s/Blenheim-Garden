# Cloudflare storage setup

The production garden uses Cloudflare D1 for structured garden/planner data and a private R2 bucket for photo/video bytes.

## Live resources

- D1 database: `blenheim-garden` ✅
- D1 binding: `DB` ✅
- baseline migration `migrations/0001_garden_storage.sql` applied ✅
- original 12 beds saved ✅
- R2 bucket: `blenheim-garden-media` ✅
- R2 binding: `GARDEN_MEDIA` ✅
- R2 public access: disabled/private ✅
- protected writes: `GARDEN_WRITE_TOKEN` ✅

`wrangler.jsonc` must retain both the D1 and R2 bindings plus the existing OpenNext Worker/assets configuration.

## D1 baseline

`0001_garden_storage.sql` creates the original tables:

- gardens
- beds
- planting_rows
- plantings
- notes
- harvests
- media
- tasks
- seed_inventory

The `media` table already contains target links, R2 key, type, file name, content type, `size_bytes`, dates and caption.

## Drawing Interface V2 schema

Drawing V2 adds two pieces of live schema:

- nullable `beds.archived_at`
- `layout_objects` for `path`, `trellis`, `tree` and `text` objects

The upgrade is deliberately performed by the idempotent `lib/garden/layout-schema.ts` bootstrap when `/api/garden` first runs. This lets the existing production D1 upgrade without requiring the user to paste another SQL migration into Cloudflare.

The bootstrap:

1. checks the current `beds` columns before adding `archived_at`
2. tolerates a concurrent duplicate-column attempt
3. creates `layout_objects` with `IF NOT EXISTS`
4. creates its index with `IF NOT EXISTS`
5. seeds the original main/cross paths, north trellis/tree, Entrance and Exit only when the table is first created

Do not add a later unconditional `ALTER TABLE beds ADD COLUMN archived_at` migration unless the runtime-bootstrap strategy is first coordinated with Wrangler migration state.

### Layout object fields

The table stores the geometry needed by the drawing tools:

- line endpoints for paths/trellises
- path width
- trellis height and post spacing
- tree canopy diameter and point
- text content, point and font size
- optional label and sort order

## Planner persistence

```text
GET /api/garden/status
GET /api/garden
PUT /api/garden
```

`GET /api/garden` now returns:

```text
beds
rows
objects
```

`PUT /api/garden` saves those same three collections.

Removing a bed from the current drawing does **not** delete its D1 row. The API sets `archived_at`, hides the bed from future current-plan GETs, and finishes any active planting. This preserves historical planting and media relationships.

Layout objects are current-plan geometry and may be deleted from `layout_objects` when removed from the drawing.

Planner writes remain protected by `GARDEN_WRITE_TOKEN`. The browser edit key stays in session storage only.

## R2 media

```text
GET    /api/garden/media
POST   /api/garden/media
GET    /api/garden/media/:id
DELETE /api/garden/media/:id
```

- list metadata/quota from D1
- protected upload validates target/quota, writes private R2, then D1 metadata
- object bytes stream through the Worker rather than a public bucket URL
- protected delete removes both R2 object and D1 metadata

Object keys:

```text
gardens/blenheim-garden/photo/<uuid>.<ext>
gardens/blenheim-garden/video/<uuid>.<ext>
```

Bed media links use the stable bed ID, so renaming a bed in Drawing V2 does not break its photos/videos.

## Conservative media limits

```text
Total:  2 GB
Photo:  6 MB each
Video: 25 MB each
Files: 500
```

Allowed photos: JPEG, PNG, WebP, HEIC, HEIF.  
Allowed videos: MP4, WebM, MOV/QuickTime.

Both browser and Worker enforce the limits; D1 `media.size_bytes` is summed before uploads.

## Verification after Drawing V2 deployment

1. Open the planner and confirm the original paths/trellis/tree/Entrance/Exit are editable.
2. Draw one temporary object and Save.
3. Refresh; the object should return from D1.
4. Rename a bed and confirm its Photos & video dialog still shows the same attached media.
5. Optionally inspect D1:

```sql
SELECT object_type, COUNT(*) AS count
FROM layout_objects
GROUP BY object_type;
```
