# Cloudflare storage setup

The production garden uses Cloudflare D1 for structured data and a private R2 bucket for photo/video bytes.

## Current resources

- D1 database: `blenheim-garden` ✅
- D1 binding: `DB` ✅
- D1 migration `0001_garden_storage.sql` applied to production ✅
- 12 planner beds seeded into D1 ✅
- R2 bucket: `blenheim-garden-media` ✅
- R2 binding: `GARDEN_MEDIA` ✅
- R2 public access: disabled/private ✅

The production D1 database uses its real Cloudflare `database_id`; do not replace it with placeholders.

## Wrangler bindings

`wrangler.jsonc` contains both durable bindings:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blenheim-garden",
      "database_id": "30f379e1-a03c-4668-8bf3-e9d441b8f72f",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    {
      "binding": "GARDEN_MEDIA",
      "bucket_name": "blenheim-garden-media"
    }
  ]
}
```

The existing Worker name, OpenNext entrypoint, assets binding, compatibility date and `nodejs_compat` settings must remain intact.

## Database schema

`migrations/0001_garden_storage.sql` creates:

- `gardens`
- `beds`
- `planting_rows`
- `plantings`
- `notes`
- `harvests`
- `media`
- `tasks`
- `seed_inventory`

The `media` table already records `r2_key`, target links, media type, content type, file name, `size_bytes`, capture date and caption. No extra migration is required for the first R2 implementation.

## Protected writes

Planner writes, media uploads and media deletes use the Worker secret:

```text
GARDEN_WRITE_TOKEN
```

Never put that value in GitHub, `wrangler.jsonc`, source files, or a public Cloudflare variable. It belongs in Cloudflare Worker **Variables and Secrets** as a secret/encrypted value.

The browser keeps the entered edit key only in `sessionStorage` for that browser session.

## Garden API

```text
GET /api/garden/status
GET /api/garden
PUT /api/garden
```

`GET /api/garden/status` verifies the D1 binding/schema. `GET /api/garden` loads the planner. `PUT /api/garden` saves bed geometry, planting rows and active planting state.

## Media API

```text
GET    /api/garden/media
POST   /api/garden/media
GET    /api/garden/media/:id
DELETE /api/garden/media/:id
```

- `GET /api/garden/media` lists D1 media metadata and current quota usage. It can be filtered by `targetType` and `targetId`.
- `POST /api/garden/media` is protected by `GARDEN_WRITE_TOKEN`, validates the target and quotas, writes the object to private R2, then inserts the matching D1 metadata row. If the D1 insert fails, the R2 object is removed again.
- `GET /api/garden/media/:id` streams an object through the Worker. The bucket itself remains private.
- `DELETE /api/garden/media/:id` is protected and deletes both the R2 object and its D1 metadata row.

R2 object keys use:

```text
gardens/blenheim-garden/photo/<uuid>.<ext>
gardens/blenheim-garden/video/<uuid>.<ext>
```

## Conservative media limits

The application deliberately stops far below the Cloudflare R2 free storage allowance:

```text
Total garden media: 2 GB maximum
Photos:             6 MB maximum each
Videos:             25 MB maximum each
Files:               500 maximum
```

Allowed formats:

- photos: JPEG, PNG, WebP, HEIC, HEIF
- videos: MP4, WebM, MOV/QuickTime

The browser checks type, per-file size and known quota before upload. The Worker repeats all important checks before writing to R2, so bypassing the browser does not bypass the quota.

D1 `media.size_bytes` is summed before every upload. App-managed uploads are rejected if they would exceed 2 GB or 500 files.

## Planner media UI

The existing **Photos & video** button on a selected bed opens a bed-specific media dialog. The top **Photos** tab opens whole-garden media.

The dialog shows:

- current total storage and file count
- the 2 GB / 500-file caps
- per-file photo/video limits
- file picker and optional caption
- photo/video previews
- delete controls

Videos use `preload="metadata"` and do not autoplay, reducing unnecessary reads.

## Next storage work

1. Deploy the R2 media implementation and verify one small photo upload.
2. Confirm the object appears in R2 and its metadata row appears in D1 `media`.
3. Add Notes & harvests UI using the existing D1 tables.
4. Add dated planting milestones and historical media browsing by planting/season.
