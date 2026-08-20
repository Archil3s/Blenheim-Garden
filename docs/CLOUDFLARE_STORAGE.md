# Cloudflare storage setup

The real D1 database is now created and bound in `wrangler.jsonc`.

## Current resources

- D1 database: `blenheim-garden`
- D1 binding: `DB`
- R2 bucket: `blenheim-garden-media` (still to be created/bound)
- Intended R2 binding: `GARDEN_MEDIA`

The production D1 database uses its real Cloudflare `database_id`; do not replace it with placeholders.

## D1 binding

`wrangler.jsonc` contains:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blenheim-garden",
      "database_id": "30f379e1-a03c-4668-8bf3-e9d441b8f72f",
      "migrations_dir": "migrations"
    }
  ]
}
```

The existing Worker name, OpenNext entrypoint, assets binding, compatibility date and `nodejs_compat` settings must remain intact.

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

Apply it locally with:

```bash
npm run db:migrate:local
```

Apply it to the real Cloudflare database with:

```bash
npm run db:migrate:remote
```

Wrangler records applied D1 migrations so the same migration is not repeatedly applied.

## Binding verification

The app exposes:

```text
GET /api/garden/status
```

It checks that the `DB` binding responds and reports whether the `gardens` table exists. Before the migration is applied, `ok` can be true while `schemaReady` is false.

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

R2 will store only the media bytes:

```text
gardens/blenheim-garden/photos/<uuid>.<ext>
gardens/blenheim-garden/videos/<uuid>.<ext>
```

Each R2 object gets a matching row in D1 `media` containing its target bed/row/planting, content type, file size, date and caption.

This allows a bed to be replanted later without losing historical photos, videos or harvest records.

## Integration sequence

1. D1 `blenheim-garden` created and bound. ✅
2. Apply `0001_garden_storage.sql` to the remote D1 database.
3. Add `/api/garden` load/save endpoints using `DB`.
4. Keep localStorage as a temporary fallback/cache.
5. Create R2 `blenheim-garden-media`.
6. Bind R2 as `GARDEN_MEDIA`.
7. Add media upload/list/delete endpoints using R2 plus the D1 `media` table.
8. Wire Photos & video, Notes and Harvest UI controls to those APIs.
