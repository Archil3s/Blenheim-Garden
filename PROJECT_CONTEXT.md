# Blenheim Garden — Project Context

_Last updated: 22 August 2026_

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

D1 has the 12 original beds saved. R2 photo/video upload, viewing and deletion are live. Notes, harvests, crop milestone dates and planting history use the existing D1 schema.

Never commit or expose `GARDEN_WRITE_TOKEN`. The browser stores an entered edit key only in `sessionStorage`.

## Drawing Interface V2

The planner uses a simplified two-row application chrome:

- title bar: garden, Settings, Save, Plan/Photos/Notes/**Rotation**
- quick bar: Undo, Redo, 10 cm Snap toggle, Zoom, Month, **Today**, **This Week**, cloud state
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

`lib/garden/planner-plan.ts` defines `beds`, `plantingAreas`, `rows`, and `objects` (`path`, `trellis`, `tree`, `text`). Older local plans without newer fields are normalised to the built-in physical layout.

### D1 layout persistence

`lib/garden/layout-schema.ts` idempotently bootstraps Drawing V2 schema when `/api/garden` runs:

- adds nullable `beds.archived_at` when missing
- creates `layout_objects` and its index when missing
- seeds the original main/cross paths, north trellis/tree, Entrance and Exit only when the table is first created

`app/api/garden/route.ts` loads/saves beds, planting areas, planting rows and layout objects. Removed beds are archived instead of deleted so historical planting/media relationships survive.

Do not add a duplicate non-idempotent migration for this runtime-bootstrap schema without first coordinating migration/bootstrap state.

## Blenheim seasonal guidance

Blenheim-specific planting and frost guidance is live through **Today** and **This Week** actions in the planner quick bar.

Implementation:

- `lib/garden/blenheim-calendar.ts` — deterministic Blenheim crop windows, monthly ground-frost normals and action generation
- `components/blenheim-calendar-bridge.tsx` — injects Today / This Week into the existing quick bar and opens the seasonal drawer
- `app/blenheim-calendar.css` — drawer, frost card and action styling
- `app/layout.tsx` — mounts the calendar bridge globally

The first calendar version covers the crops already present in the planner catalogue: Tomato, Strawberry, Bean, Lettuce, Pumpkin, Carrot, Broccoli, Raspberry, Blueberry and Herbs.

Action states are **Do now**, **Under cover**, **Coming up**, and **Wait**. Crop actions include **Choose [crop] in planner →**, which switches to the Plants tool and selects that crop.

Frost guidance uses Blenheim mean monthly ground-frost days for **1991–2020** rather than pretending there is one guaranteed last-frost date. Key values used by the app include approximately 9.6 ground-frost days in August, 4.3 in September, 2.2 in October and 0.6 in November. Guidance sources are linked inside the drawer (NIWA / Earth Sciences NZ, Tui and Yates NZ).

This is seasonal guidance, **not a live weather forecast**. The UI explicitly tells the user to check the actual local forecast before moving tender crops outside.

No D1 schema or migration is required for the seasonal guidance; it is calculated client-side from the browser date and static local climate/crop-window data.

## Seasonal occupancy & crop rotation history

Seasonal occupancy and crop-rotation history are now live through the top **Rotation** tab and a **Rotation history** action injected into selected bed/planting inspectors.

The feature deliberately reads the existing retained `plantings` history rather than adding a duplicate history table. Existing `status`, `start_date`, `end_date`, `sow_date`, `transplant_date`, `created_at` and `updated_at` fields provide the occupancy record.

Implementation:

- `lib/garden/crop-rotation.ts` — crop-family mapping, perennial handling, seasonal labels and rotation advice
- `app/api/garden/rotation/route.ts` — read-only whole-garden/per-bed history API
- `components/crop-rotation-bridge.tsx` — injects the Rotation tab and per-bed action; renders garden overview and bed detail drawer
- `app/crop-rotation.css` — rotation cards, crop-family badges, timeline and mobile styles
- `app/layout.tsx` — mounts the rotation bridge globally

Current rotation behaviour:

- whole-garden overview shows every current bed, active crops, recent crop families, history count and any rotation caution
- bed detail shows a full chronological planting record
- an **18-month monthly occupancy timeline** visualises when each crop occupied the bed
- crop/variety names are mapped to practical botanical families such as Nightshade, Legume, Brassica, Cucurbit, Apiaceae, Asteraceae, Rosaceae, Ericaceae, Lamiaceae and Allium
- generic Herbs use the variety to distinguish common herb families where possible
- repeated recent annual crop families trigger a caution
- suggested different-family crops can jump directly into the Plants tool
- raspberry, blackberry, blueberry and strawberry are treated as perennial occupancy rather than normal annual rotation
- the UI explicitly says rotation is a planning aid, not a hard rule

No new D1 migration is required. The feature is read-only and builds on the history already retained when planting areas are replaced/finished.

The feature was implemented through PR #10 and verified by the repository Build workflow using `bun run build` before merge.

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

- `components/garden-planner.tsx` — Drawing Interface V2 and planner interactions
- `components/blenheim-calendar-bridge.tsx` — Today / This Week seasonal UI
- `lib/garden/blenheim-calendar.ts` — Blenheim crop/frost guidance engine
- `app/blenheim-calendar.css` — seasonal drawer styling
- `components/crop-rotation-bridge.tsx` — Rotation overview/detail UI
- `lib/garden/crop-rotation.ts` — crop-family/rotation engine
- `app/api/garden/rotation/route.ts` — read-only planting-history API
- `app/crop-rotation.css` — rotation/timeline styling
- `app/growveg-workspace.css` — V2 workspace/canvas styling
- `app/planner-interactions.css` — pointer/cursor interaction rules
- `lib/garden/planner-plan.ts` — shared planner state types
- `lib/garden/layout-schema.ts` — idempotent D1 Drawing V2 bootstrap
- `app/api/garden/route.ts` — planner GET/PUT persistence
- `app/api/garden/records/route.ts` — notes, harvests and milestone API
- `components/garden-records-dialog-bridge.tsx` — Notes & Harvests UI
- `lib/garden/cloudflare-db.ts` — DB/R2 bindings
- `app/api/garden/media/route.ts` — media list/upload
- `app/api/garden/media/[id]/route.ts` — media stream/delete
- `components/garden-media-dialog-bridge.tsx` — media UI
- `.github/workflows/build.yml` — permanent Bun/Next build verification for PRs and `main`
- `docs/CLOUDFLARE_STORAGE.md` — storage reference

## Build verification

The repository now has a permanent **Build** workflow for pull requests and pushes to `main`:

```text
bun install
bun run build
```

The crop-rotation feature passed this workflow before merge.

## Deployment

```text
Production branch: main
Build:  npx @opennextjs/cloudflare build
Deploy: npx @opennextjs/cloudflare deploy
```

Keep package `build` as `next build`, keep `next.config.ts` output `standalone`, and preserve both DB and R2 bindings in `wrangler.jsonc`.

## Next priorities

1. Visually test Drawing V2, Notes & Harvests, **Today / This Week**, and **Rotation** on production, including Save → refresh persistence and mobile layout.
2. Polish alignment/snapping/keyboard shortcuts based on actual use.
3. Link photos directly to harvest records and richer crop timelines.
4. Expand the seasonal catalogue beyond the initial planner crops.
5. Consider optional live forecast-aware frost warnings and more detailed bed-health/rotation notes later.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first.
Preserve Drawing Interface V2, Today / This Week Blenheim seasonal guidance, Rotation history, Notes & Harvests, the measured physical garden layout, D1 DB binding, private R2 GARDEN_MEDIA binding, protected GARDEN_WRITE_TOKEN writes, and strict media quotas. Inspect the current implementation before changing it.
```


## Live WebGL design mirror

The **Live 3D** planner action opens `/3d` as a companion window. The 2D planner publishes its current in-memory `PlannerPlan` to a separate local live-preview key on every plan change; this does **not** write D1. The WebGL view listens for those changes and rebuilds the scene from the same bed, planting-area, row, path, trellis and tree coordinates, so unsaved edits appear in 3D immediately. Normal **Save** remains the only planner action that persists the design through the protected garden API.


### Persistent WebGL runtime

Live planner updates now rebuild only the WebGL garden-content group rather than recreating the renderer/camera. This preserves the user's 3D viewpoint during 2D dragging and avoids repeated WebGL-context creation. The hard-coded 2D berry/cane strip and north-zone outline are mirrored with the same percentage geometry, and text layout objects render as WebGL sprites.


## Multiple named gardens

The D1 schema already supported multiple garden ids. The planner now stores the selected garden id in browser local storage, scopes local/live plan caches by garden id, sends gardenId to /api/garden, and exposes /api/gardens for listing and creating named blank gardens. Live 3D uses the same garden id. New gardens start blank and do not overwrite the original Blenheim Garden.

WebGL dense planting rendering is deliberately capped and live updates are throttled to keep the browser stable while preserving the real saved plant counts in planner data.
