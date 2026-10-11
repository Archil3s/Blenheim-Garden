# 3D garden editor

The /3d route and the planner's inline 3D view edit the existing PlannerPlan. Both views share local live-plan events, named-garden storage keys and the protected garden API.

Select a plant, bed or structure to inspect it. Move mode drags objects without orbiting the camera. Empty-ground drags in Select mode orbit. Plant, row, bed, path, trellis, tree and structure tools show a preview; line tools use two taps. Plant previews show spacing guidance. Inspector fields edit dimensions, positions, crop settings and rotation. Duplicate, Delete, Undo and Redo use plan snapshots; a drag creates one undo step.

Save writes the same local cache and authenticated PUT /api/garden used by 2D. An edit key is kept in session storage. Without a key, Save reports local-only persistence. Cloud failures remain visible and can be retried.

## Raised-bed planting and seasonal layouts

Open `/3d?view=3d` for the detailed garden. **Plant a bed** lets you choose a
measured bed or a raised bed/planter without having to pick its mesh. Selecting
a bed in the garden also exposes **Generate seasonal layout** in its inspector.
The preview defaults to the current month in `Pacific/Auckland` and shows
Blenheim's Southern Hemisphere season, local frost normals, mature spacing,
new positions and grey markers for existing plants. Choose a seasonal mix or
one recommended crop, then **Apply seasonal layout**. Only the selected bed is
filled; existing plants and other beds remain intact. Apply is one undo step.
Normal protected **Save** persists the plan.
For an occupied bed, **Replace this bed’s plants** previews a fresh layout
instead. Its replacement count is shown before applying, and Undo restores the
whole previous planting. Other beds are preserved in both modes.

October suggestions favour broccoli, lettuce, carrots and hardy herbs. Tomatoes
are offered in the warmer November–February window. Carrots use 25 cm between
rows and the catalogue's 7 cm within rows. Guidance uses the existing
[Blenheim frost normals](https://niwa.co.nz/climate-and-weather/mean-number-days-ground-frost)
and [Yates NZ calendar](https://www.yates.co.nz/ideas-plans/garden-calendar/yearly/),
including its [October late-frost advice](https://www.yates.co.nz/ideas-plans/garden-calendar/yearly/october/october-garden-digest/).
This is a starter planting plan using monthly climate guidance, not a weather
forecast or crop-rotation analysis.

Manual planting raycasts onto visible soil rather than ground underneath a
container. The same geometry handles timber/corrugated/square raised beds,
round/keyhole beds, wicking beds, planter boxes, troughs, pots, grow bags,
half-barrels and seed-tray cells. Walls, circular corners, keyhole access/compost
and paths do not accept plants. Snapping cannot push a plant off the selected
soil surface. Seed trays accept manual seedlings; mature seasonal layouts need
a larger growing bed.

Container plants follow moves, rotation, height changes and resizing in the 3D
editor. Removing or duplicating a planted container is blocked until its plants
are removed, avoiding accidental orphaning or overlapping duplicates. Plants
are associated by their centimetre position on the visible soil; there is no
new persistent container ID or database migration. Container plantings use
existing explicit row placements, and standard beds use planting areas.

## Persistence compatibility

Areas and rows can carry optional explicit placements. Area coordinates are percentages within the planting area. Row x is a percentage along its line and y is a perpendicular offset in centimetres. A zero-length row stores centimetre offsets from its origin, representing an individual soil plant. Missing placements retain generated-layout behavior.

The API idempotently adds nullable placements_json columns to the existing area and row tables. Existing beds, planting IDs, archived history and media are preserved. Explicit counts equal placement length. Bed resizing preserves crop count and scales positions. Deleting an occupied bed requires removing its plantings first.

Individual editing supports up to 10,000 canonical placements per area. Large scenes render representative selectable samples (100 per area on desktop, 32 on mobile); stored counts and all canonical positions remain intact. Generated plantings above the individual-edit limit must be split before editing individual plants.

## Verification

Playwright covers individual mutations, protected SQLite-backed D1 save/load and crop history, browser design/save/refresh, 2D mirroring, dragging, resizing, rotation and named-garden isolation at desktop, laptop, tablet and phone sizes. No production database is used by these tests.

### Verification result (2026-10-08)

Lint and the production Next.js build pass. The complete Playwright run passed 79 of 80 checks. All editor, D1 persistence, keyboard, responsive transform, 2D, named-garden, demo, seasonal and structure checks passed. Four additional boundary validation runs passed after the final boundary correction.

The remaining phone test in plant-art-3d.spec.ts:41 expects all 16 PNG artwork responses after opening 3D. The identical failure was reproduced against an unmodified production build of main at f1d08a6. The current 3D renderer uses geometry; mobile 2D lazily loads only visible artwork. Existing tests and artwork were left intact.

The supplied Flutter commands were also attempted: dart format . found no Dart files; flutter analyze reported no issues; flutter test cannot run because this Next.js repository has no Flutter test directory. No production deployment or database writes were performed.

### Raised-bed verification (2026-10-11)

Production build and ESLint pass. The 24 new geometry, seasonal, replacement,
browser and D1 checks passed across all four required viewports. After making
the layout action bar stay visible on tablet screens, all eight affected browser
workflows passed again. Screenshots were inspected at each viewport.

The existing editor, transform, pixel and D1 regression run passed 59/60 checks;
one tablet canvas-startup assertion exceeded its five-second wait. That same
test passed unchanged on rerun. Test thresholds and existing tests were retained.
Browser writes were mocked and D1 tests used isolated SQLite databases.

The Flutter commands were repeated: no Dart files to format, analysis reported
no issues, and Flutter tests remain unavailable because this is a Next.js project
without a Flutter test directory.
