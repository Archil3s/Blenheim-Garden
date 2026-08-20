# Cloudflare storage setup

This project is ready to move from browser-only `localStorage` to Cloudflare persistence, but the real Cloudflare resources must exist before `wrangler.jsonc` is changed.

## Required resources

Create these in the same Cloudflare account as the `blenheim-garden` Worker:

- D1 database: `blenheim-garden`
- R2 bucket: `blenheim-garden-media`

## Intended bindings

Use these binding names in the Worker:

```text
D1 binding: DB
R2 binding: GARDEN_MEDIA
```

Do not invent or paste placeholder database IDs into production configuration. After the D1 database exists, use its real `database_id`.

The final Wrangler shape will be approximately:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blenheim-garden",
      "database_id": "<REAL_D1_DATABASE_ID>"
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

The existing Worker name, OpenNext entrypoint, assets binding, compatibility date and `nodejs_compat` settings must remain intact when these bindings are added.

## Database migration

The first migration is:

```text
migrations/0001_garden_storage.sql
```

It creates:

- `gardens`
- `beds`
- `planting_rows`
- `plantings`
- `notes`
- `harvests`
- `media`
- `tasks`
- `seed_inventory`

It also creates the initial `blenheim-garden` garden record.

After the real D1 resource is bound, apply the migration with Wrangler against the real database.

## Storage model

### D1

D1 stores structured, searchable data:

- garden/canvas settings
- bed geometry
- planting-row geometry
- crop and variety occupancy/history
- sow/germination/transplant dates
- notes
- harvests
- task records
- seed inventory
- photo/video metadata

### R2

R2 stores only the media bytes:

```text
gardens/blenheim-garden/photos/<uuid>.<ext>
gardens/blenheim-garden/videos/<uuid>.<ext>
```

Each R2 object gets a matching row in D1 `media` containing its target bed/row/planting, content type, file size, date and caption.

This allows a bed to be replanted later without losing historical photos, videos or harvest records.

## Integration sequence

1. Create D1 `blenheim-garden`.
2. Create R2 `blenheim-garden-media`.
3. Add the real bindings to `wrangler.jsonc`.
4. Generate/update Cloudflare binding types if required.
5. Apply `0001_garden_storage.sql`.
6. Add `/api/garden` load/save endpoints using `DB`.
7. Keep localStorage as a temporary local fallback/cache.
8. Add media upload/list/delete endpoints using `GARDEN_MEDIA` plus the D1 `media` table.
9. Wire the existing Photos & video, Notes and Harvest UI controls to those APIs.
