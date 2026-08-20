# Cloudflare storage setup

The real D1 database is created, bound, and the first schema has been applied successfully.

## Current resources

- D1 database: `blenheim-garden` ✅
- D1 binding: `DB` ✅
- D1 migration `0001_garden_storage.sql` applied to production ✅
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

It also creates the initial `blenheim-garden` garden record.

The production schema was applied manually through the Cloudflare D1 Console on 20 August 2026 and verified with:

```sql
SELECT * FROM gardens;
```

## Garden API

The app exposes:

```text
GET /api/garden/status
GET /api/garden
PUT /api/garden
```

`GET /api/garden/status` verifies the D1 binding/schema.

`GET /api/garden` loads the current planner state from D1. It is read-only and does not require the edit key.

`PUT /api/garden` saves bed geometry, planting rows, and active plantings. It is intentionally protected by a Worker secret called:

```text
GARDEN_WRITE_TOKEN
```

Do not put that value in GitHub, `wrangler.jsonc`, source files, or a public Cloudflare variable. Configure it as a **secret/encrypted variable** in the Cloudflare Worker settings.

The browser asks for the edit key when a cloud save is attempted and keeps it only in `sessionStorage` for that browser session. If the key is absent, incorrect, or the network is unavailable, the plan is still written to browser `localStorage` and the UI reports `Local only`.

## Planner persistence behaviour

On startup:

1. The built-in garden plan is available immediately.
2. A browser `localStorage` copy is loaded if present.
3. `/api/garden` is requested.
4. If D1 contains saved beds, the D1 plan becomes authoritative and refreshes the local cache.

On Save:

1. The current plan is always written to `localStorage` first.
2. The browser uses the session edit key to call `PUT /api/garden`.
3. A successful D1 save reports `Saved ✓` / `Cloud synced`.
4. A failed or unauthorised cloud save reports `Local only` and does not expose D1 to anonymous writes.

When a bed changes crop/variety, the previously active planting is marked `finished` and a new active planting row is created instead of overwriting planting history. Deleted planting rows are hidden by finishing their active planting record rather than deleting historical planting data.

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

## Remaining setup

1. Configure Worker secret `GARDEN_WRITE_TOKEN`.
2. Deploy the current `main` branch and verify `/api/garden/status` and `/api/garden`.
3. Save the planner once to seed the 12 beds into D1.
4. Create R2 `blenheim-garden-media`.
5. Bind R2 as `GARDEN_MEDIA`.
6. Add media upload/list/delete endpoints using R2 plus the D1 `media` table.
7. Wire Photos & video, Notes and Harvest UI controls to those APIs.
