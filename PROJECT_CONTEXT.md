# Blenheim Garden — Project Context

_Last updated: 20 August 2026_

**Repository:** `Archil3s/Blenheim-Garden`  
**Production branch:** `main`

## Product

Blenheim Garden is a visual home-garden planner for Blenheim, Marlborough. The measured garden canvas is the application: keep it visually dominant, keep controls compact, and use a GrowVeg-like interaction model without copying proprietary code or artwork.

The working canvas is **900 × 1080 cm-equivalent pixels**, treated as approximately **9 m × 10.8 m**. The base plan contains the existing 12 numbered beds plus the berry/cane area.

## Stack and live Cloudflare storage

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- D1 database `blenheim-garden`, binding `DB`
- private R2 bucket `blenheim-garden-media`, binding `GARDEN_MEDIA`
- protected writes via Worker secret `GARDEN_WRITE_TOKEN`

D1 has the 12 original beds saved. R2 photo/video upload, viewing and deletion are live.

Never commit or expose `GARDEN_WRITE_TOKEN`. The browser stores an entered edit key only in `sessionStorage`.

## Drawing Interface V2

The planner now uses a simplified two-row application chrome:

- title bar: garden, Settings, Save, Plan/Photos/Notes
- quick bar: Undo, Redo, 10 cm Snap toggle, Zoom, Month, cloud state
- readable left drawing rail
- context-sensitive inspector/tool panel
- measured grid/rulers and live X/Y coordinates

Real drawing tools:

- **Select** — move/edit objects; resize beds/trees; reshape rows/paths/trellises using handles
- **Plants** — select crop/variety and fill a bed
- **Rows** — drag planting rows with live length/plant count
- **Bed** — click-drag a new bed with live dimensions
- **Path** — click-drag a path and edit width/label
- **Trellis** — click-drag and edit height/post spacing/label
- **Tree** — click to place, then move/resize canopy and rename
- **Text** — click to place, then move/edit text and font size

Objects use 10 cm snap by default and display live drawing measurements. Selected objects support duplicate/delete where appropriate.

### Saved planner payload

`lib/garden/planner-plan.ts` defines:

- `beds`
- `rows`
- `objects` (`path`, `trellis`, `tree`, `text`)

Older local plans without `objects` are normalised to the built-in physical layout.

### D1 layout persistence

`lib/garden/layout-schema.ts` idempotently bootstraps Drawing V2 schema from the Worker when `/api/garden` first runs:

- adds nullable `beds.archived_at` when missing
- creates `layout_objects` when missing
- creates its index
- seeds the original main/cross paths, north trellis/tree, Entrance and Exit as editable layout objects only when the table is first created

This runtime bootstrap is intentional so the existing production D1 upgrades without a manual dashboard SQL step.

`app/api/garden/route.ts` now:

- loads/saves beds, planting rows and layout objects
- excludes archived beds from the current plan
- archives a removed bed instead of deleting the bed row, preserving historical planting/media relationships
- preserves the existing planting-history behaviour when crops/rows change

Do not add a duplicate non-idempotent migration for this runtime-bootstrap schema without first redesigning the migration/bootstrap coordination.

## Media

Bed **Photos & video** and the top **Photos** tab use private R2 through Worker APIs. Bed media targeting uses the stable bed ID rather than the editable bed name.

Strict app limits:

```text
2 GB total
6 MB per photo
25 MB per video
500 files
```

Allowed: JPEG, PNG, WebP, HEIC/HEIF, MP4, WebM, MOV/QuickTime. The browser validates for UX and the Worker validates again before R2 writes.

## Important files

- `components/garden-planner.tsx` — Drawing Interface V2 and planner interactions
- `app/growveg-workspace.css` — V2 workspace/canvas styling
- `app/planner-interactions.css` — pointer/cursor interaction rules
- `lib/garden/planner-plan.ts` — shared planner state types
- `lib/garden/layout-schema.ts` — idempotent D1 Drawing V2 bootstrap
- `app/api/garden/route.ts` — planner GET/PUT persistence
- `lib/garden/cloudflare-db.ts` — DB/R2 bindings
- `app/api/garden/media/route.ts` — media list/upload
- `app/api/garden/media/[id]/route.ts` — media stream/delete
- `components/garden-media-dialog-bridge.tsx` — media UI
- `docs/CLOUDFLARE_STORAGE.md` — storage reference

## Deployment

```text
Production branch: main
Build:  npx @opennextjs/cloudflare build
Deploy: npx @opennextjs/cloudflare deploy
```

Keep package `build` as `next build`, keep `next.config.ts` output `standalone`, and preserve both DB and R2 bindings in `wrangler.jsonc`.

## Next priorities after V2 verification

1. Visually test every drawing tool and Save → refresh persistence.
2. Polish alignment/snapping/keyboard shortcuts based on actual use.
3. Add Notes & harvests UI using existing D1 tables.
4. Add Blenheim-specific planting/frost windows and Today/This Week tasks.
5. Add seasonal occupancy and crop-rotation history views.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first.
Preserve Drawing Interface V2, the measured physical garden layout, D1 DB binding, private R2 GARDEN_MEDIA binding, protected GARDEN_WRITE_TOKEN writes, and strict media quotas. Inspect the current implementation before changing it.
```
