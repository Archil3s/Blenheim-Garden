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

`0001_garden_storage.sql` creates:

- gardens
- beds
- planting_rows
- plantings
- notes
- harvests
- media
- tasks
- seed_inventory

The existing `plantings`, `notes`, and `harvests` tables now power the Notes & Harvests feature; no extra migration is needed for those records.

## Drawing Interface V2 schema

Drawing V2 adds nullable `beds.archived_at` plus `layout_objects` for path, trellis, tree and text objects. The upgrade is performed by the idempotent `lib/garden/layout-schema.ts` bootstrap when `/api/garden` first runs.

The bootstrap checks before changing schema, tolerates concurrent setup, creates indexes safely, and only seeds the original editable layout objects when the table is first created. Do not add an unconditional duplicate `ALTER TABLE beds ADD COLUMN archived_at` migration without coordinating runtime bootstrap and Wrangler migration state.

## Planner persistence

```text
GET /api/garden/status
GET /api/garden
PUT /api/garden
```

`GET /api/garden` returns `beds`, `rows`, and `objects`. `PUT /api/garden` saves those collections. Removing a bed archives its D1 row instead of deleting it, preserving historical planting and media relationships.

Planner writes remain protected by `GARDEN_WRITE_TOKEN`. The browser edit key stays in session storage only.

## Notes & Harvests API

```text
GET    /api/garden/records
GET    /api/garden/records?bedId=<stable-bed-id>
POST   /api/garden/records
DELETE /api/garden/records?kind=note&id=<id>
DELETE /api/garden/records?kind=harvest&id=<id>
```

`GET` is read-only and returns notes/harvest history. Bed-scoped GET also returns the active planting and its sow/germination/transplant dates.

Protected POST actions are:

```text
add-note
add-harvest
save-milestones
```

Notes added while a bed has an active crop are attached to that planting so they remain associated with the crop after replanting. Notes on an empty bed attach to the bed. Garden-level notes attach to the garden. Harvests attach to the active planting and store weight in grams internally, plus optional quantity/unit and notes.

All record writes/deletes require `GARDEN_WRITE_TOKEN`.

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

Bed media links use the stable bed ID, so renaming a bed does not break its media.

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

## Useful verification SQL

```sql
SELECT target_type, COUNT(*) AS notes
FROM notes
GROUP BY target_type;

SELECT COUNT(*) AS harvests, ROUND(SUM(weight_g) / 1000.0, 2) AS total_kg
FROM harvests;

SELECT crop_name, variety, sow_date, germinated_date, transplant_date
FROM plantings
WHERE status = 'active';
```
