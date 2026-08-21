# Blenheim Garden — Project Context

_Last updated: 21 August 2026_

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

D1 has the 12 original beds saved. R2 photo/video upload, viewing and deletion are live. Notes, harvests and crop milestone dates use the existing D1 schema.

Never commit or expose `GARDEN_WRITE_TOKEN`. The browser stores an entered edit key only in `sessionStorage`.

## Drawing / GrowVeg V4 interface

The planner now uses the compact GrowVeg V4-style workspace while preserving the Drawing Interface V2 object model and persistence.

Application chrome:

- title bar: garden, Settings, Save, Plan/Photos/Notes
- quick bar: Undo, Redo, 10 cm Snap toggle, Zoom, Month, cloud state
- readable left drawing rail
- context-sensitive inspector/tool panel
- measured grid/rulers and live X/Y coordinates

Real drawing tools:

- **Select** — move/edit objects; resize beds/trees; reshape rows/paths/trellises using handles
- **Plants** — drag crop/variety planting areas into beds
- **Rows** — drag planting rows with live length/plant count
- **Bed** — click-drag a new bed with live dimensions
- **Path** — click-drag a path and edit width/label
- **Trellis** — click-drag and edit height/post spacing/label
- **Tree** — click to place, then move/resize canopy and rename
- **Text** — click to place, then move/edit text and font size

Objects use 10 cm snap by default and display live drawing measurements. Selected objects support duplicate/delete where appropriate.

### Planting areas and true centimetre spacing

GrowVeg V4 planting areas support multiple crops in one bed and can be dragged/resized independently.

`lib/garden/plant-spacing-layout.ts` is the source of truth for plant counts and icon coordinates. Plant centres are now positioned using the actual `spacingCm` value at the garden's centimetre scale instead of using cosmetic CSS gaps.

Supported patterns:

- grid / block
- staggered
- rows
- natural
- single

The planting inspector displays actual spacing in centimetres, recalculates count after area or bed resizing, and shows a spacing badge on the selected planting. Large planting areas are sampled for rendering performance while preserving the logical plant count.

### Saved planner payload

`lib/garden/planner-plan.ts` defines `beds`, `plantingAreas`, `rows`, and `objects` (`path`, `trellis`, `tree`, `text`). Older local plans without planting areas or objects are normalised to the current model.

### D1 layout persistence

`lib/garden/layout-schema.ts` idempotently bootstraps Drawing V2/V4 schema when `/api/garden` runs:

- adds nullable `beds.archived_at` when missing
- creates `layout_objects` and its index when missing
- seeds the original main/cross paths, north trellis/tree, Entrance and Exit only when the table is first created

`app/api/garden/route.ts` loads/saves beds, planting rows, planting areas and layout objects. Removed beds are archived instead of deleted so historical planting/media relationships survive.

Do not add a duplicate non-idempotent migration for this runtime-bootstrap schema without first coordinating migration/bootstrap state.

## Blenheim Now seasonal guide

The seasonal layer is additive and does not change the saved-plan or D1 schema.

Files:

- `lib/garden/blenheim-season.ts` — Blenheim/Marlborough seasonal crop guidance, frost-risk summaries and weekly tasks
- `lib/garden/planner-actions.ts` — typed browser event used to request a crop in the planner
- `components/blenheim-season-guide.tsx` — compact **Blenheim Now** UI with **Today** and **This Week** views
- `components/season-planner-action-bridge.tsx` — connects seasonal recommendations to the existing planner controls
- `app/blenheim-season-guide.css` — guide and planner-action styling

The guide uses the user's current browser month by default and also lets the user inspect another month. Guidance is intentionally conservative for a Blenheim home garden, especially for frost-tender warm-season crops.

The first crop set mirrors the current planner catalogue: tomato, strawberry, bean, lettuce, pumpkin, carrot, broccoli, raspberry, blueberry and herbs.

Actionable recommendations now include **Use in planner** controls. Choosing a recommended crop:

1. closes the seasonal panel
2. syncs the planner month to the guide month
3. opens the Plants tool and normal crop catalogue
4. clears catalogue search/type filters that could hide the requested crop
5. selects that crop and its default variety, ready to drag into a bed

If an individual planting is selected, the action bridge first selects its parent bed so the planting inspector does not block the crop catalogue. The bridge uses the existing planner controls and does not write seasonal metadata into the saved plan.

Frost guidance uses historical Blenheim climatology as a planning aid, not as a weather forecast. The UI explicitly tells users to check their own microclimate and short-range forecast before exposing tender plants.

Reference basis recorded in the source file:

- Tui Marlborough planting calendar
- Yates New Zealand garden calendar
- NIWA / Earth Sciences New Zealand Marlborough climatology

This seasonal feature should remain additive: do not put static seasonal metadata into the persisted planner payload unless there is a clear future need for user-edited schedules.

## Notes & Harvests

The selected-bed **Notes & harvests** button and top **Notes** tab are functional through `components/garden-records-dialog-bridge.tsx` and `app/api/garden/records/route.ts`.

Bed workflow:

- shows the current active crop/variety
- edit **Sown**, **Germinated**, and **Transplanted** dates on the active planting
- add a dated quick note; when a crop is active the note follows that planting, otherwise it follows the bed
- record harvest date, weight (g/kg), quantity/unit, and optional note
- browse chronological note/harvest history for that bed, including finished plantings
- delete individual notes or harvest records

The top **Notes** tab opens whole-garden history and allows garden-level notes. All writes/deletes use the same `GARDEN_WRITE_TOKEN` edit key. No new migration is required because `notes`, `harvests`, and planting milestone columns already exist in `migrations/0001_garden_storage.sql`.

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

- `components/garden-planner.tsx` — GrowVeg V4 planner interactions and canvas
- `app/growveg-workspace.css` — workspace/canvas styling
- `app/growveg-v4.css` — planting-area and V4 styling
- `app/planner-interactions.css` — pointer/cursor interaction rules
- `lib/garden/planner-plan.ts` — shared planner state types
- `lib/garden/plant-spacing-layout.ts` — true centimetre plant layout/count engine
- `lib/garden/blenheim-season.ts` — local seasonal/frost guidance
- `lib/garden/planner-actions.ts` — seasonal → planner action event contract
- `components/blenheim-season-guide.tsx` — Today / This Week seasonal UI
- `components/season-planner-action-bridge.tsx` — seasonal recommendation planner bridge
- `lib/garden/layout-schema.ts` — idempotent D1 Drawing schema bootstrap
- `app/api/garden/route.ts` — planner GET/PUT persistence
- `app/api/garden/records/route.ts` — notes, harvests and milestone API
- `components/garden-records-dialog-bridge.tsx` — Notes & Harvests UI
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

## Current checkpoint

Implemented before this handoff:

1. Drawing / GrowVeg V4 interface and measured physical layout.
2. Multiple planting areas per bed with drag/resize.
3. True centimetre-scale plant counts and icon placement.
4. Save → cloud persistence for planner layout.
5. D1 Notes & Harvests with planting milestones.
6. Private R2 photos/video.
7. Blenheim seasonal guidance data and **Blenheim Now** Today / This Week UI on the feature branch.
8. Seasonal crop recommendations can select the crop directly in the planner and sync the planner month.

## Next priorities

1. Visually test **Blenheim Now** and its **Use in planner** actions with Drawing V4 on desktop/mobile.
2. Run build/lint and production smoke tests after merging the seasonal feature.
3. Add stronger Blenheim succession logic: sow-this-week quantities, expected harvest windows, and reminders based on actual planting milestone dates.
4. Add seasonal bed occupancy and crop-rotation history views.
5. Link photos directly to harvest records and richer crop timelines if useful.
6. Polish alignment/snapping/keyboard shortcuts based on actual use.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first.
Preserve GrowVeg V4, true centimetre plant spacing, Notes & Harvests, the measured physical garden layout, D1 DB binding, private R2 GARDEN_MEDIA binding, protected GARDEN_WRITE_TOKEN writes, strict media quotas, and the additive Blenheim Now seasonal guidance/action layer. Inspect the current implementation before changing it.
```
