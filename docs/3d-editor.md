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
editor. Removing a planted container is blocked until its plants are removed. Duplicating
a container copies its plants with fresh IDs. New row plantings carry an explicit
soil owner; legacy rows retain position-based ownership. Ownership and growing
conditions are stored in an idempotently added gardens.editor_settings_json
column; the existing garden dimension columns are reused. Container plantings use
existing explicit row placements, and standard beds use planting areas.

## Garden building and dimensions

**Garden size** changes the measured boundary from 2–50 metres on each axis.
Existing beds are rebased into the new percentage coordinate system while keeping
their physical positions and sizes. Structures, rows and plant spacing stay in
centimetres. Shrinking is rejected if existing geometry would be cut off. Fence,
ground, rulers, 2D and pixel views follow the same saved dimensions. Defaults
remain 900 × 1080 cm for older plans and the original garden.

Select a bed for **Plant here**, **Focus bed** and **Fill with [crop]**. Planting
targets lock to that bed; 10 cm snapping follows rotated soil. Fill patches,
rows, freehand plant strokes, paths, trellises and timber fences accept dragging;
rows and paths also accept two endpoint taps. Preview dots and counts use the
same placement solver as commit. Single plants also respect mixed-crop spacing;
blocked positions explain whether soil, locks, edges or spacing need attention.
Reduce the explicit spacing setting for closer planting. Open garden covers can
contain planted beds.

**Resize** shows a corner or endpoint handle. **Build options** supports
multi-select, grouped movements/duplication, browser-stored bed templates and
seedling, leafy, flowering/developing and harvest-ready appearance previews.
Detailed 3D uses young-leaf geometry and hides developing flowers/fruit; these
are illustrative previews, not a biological growth simulation. Templates contain empty bed dimensions and type;
they do not overwrite current plantings. Camera focus retains an explicitly
chosen Top view.

Seasonal layouts include mixed strips, salads and a succession layout reserving
half the soil. Sun exposure, usable rooting depth and previous crops influence
automatic mixes. Standard beds read their own named garden's retained rotation
history; containers can use a manually supplied previous crop. These remain
seasonal planning aids with linked NZ sources, not weather predictions.

Use **Undo** for a single planting stroke, resize or grouped move, then **Save**
for protected D1 persistence. Existing history, archived beds, named gardens and
private media bindings are retained. No credentials are stored in templates.

## Persistence compatibility

Areas and rows can carry optional explicit placements. Area coordinates are percentages within the planting area. Row x is a percentage along its line and y is a perpendicular offset in centimetres. A zero-length row stores centimetre offsets from its origin, representing an individual soil plant. Missing placements retain generated-layout behavior.

The API idempotently adds nullable placements_json columns to the existing area and row tables. Existing beds, planting IDs, archived history and media are preserved. Explicit counts equal placement length. Bed resizing preserves crop count and scales positions. Deleting an occupied bed requires removing its plantings first.

Individual editing supports up to 10,000 canonical placements per area. Large scenes render every canonical placement using instanced crop meshes. Desktop crops switch to the shared mobile geometry at distance; selection proxies retain individual identities. Generated plantings above the individual-edit limit must be split before editing individual plants.

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

### Garden builder verification (2026-10-11)

The production Next.js build and ESLint with zero warnings pass. All 84 editor,
geometry, D1 persistence, pixel rendering and raised-bed workflows pass across
1920×1080, 1440×900, 1024×768 and 390×844. New checks cover physical garden
resizing, protected dimension/profile persistence, rotated soil snapping,
fill/brush strokes, fence drawing, resize handles, grouped movement, copied
plant ownership, templates, Save/refresh and 2D mirroring. The phone Build
options control is separated from appearance controls and the inspector.
Screenshots were inspected at every viewport. Test saves use isolated SQLite
or mocked browser requests.

Dart formatting found no files and Flutter analysis reported no issues.
Flutter tests are unavailable because this Next.js repository has no Flutter
`test` directory. The relevant TypeScript/browser suites provide verification.

Shared planner, dialog, replacement, archived-history and named-garden
compatibility checks also passed. Following the final phone inspector and
catalogue correction, all 20 affected workflows passed again across the four
viewports, including protected fence round-tripping. Existing test assertions
and thresholds were retained; one D1 fixture gained a missing type annotation
so it compiles under the existing strict TypeScript configuration.

Build options → Gentle plant breeze adds optional canopy movement in detailed
3D. It pauses for reduced motion and hidden tabs; it is view state, not saved
plan data. Stable plant IDs now choose one of three mesh shapes while retaining
selection, movement, duplication and canonical planting positions.

## Interaction verification (15 October 2026)

The update adds Beds shortcuts, direct soil picking through foliage, scoped
planting with shared spacing/lock/boundary checks, small planter centres, and
Pan/Orbit plus Navigate-only ground movement. Browser checks cover numbered and
rotated raised beds, fill preview/apply/cancel, retained crop ownership, undo,
editing after navigation, camera locking, mobile menus and protected persistence.
Production build, strict TypeScript and zero-warning ESLint pass. Existing test
assertions are retained. Dart format finds no Dart files and Flutter analyze
passes; Flutter tests are unavailable because this Next.js app has no Flutter
`test` directory.
The existing 172 editor/geometry/storage checks passed across 1920×1080,
1440×900, 1024×768 and 390×844. On the final build, all eight new interaction
checks and 12 detailed-model recovery/growth/shape-selection checks passed.
Screenshots were inspected at all four sizes. The new touch test focuses visible
soil before projecting a tap; its initial whole-garden projection landed on the
phone toolbar. Existing test assertions and thresholds were not weakened.
Mobile camera preset hiding is limited to direct HUD children so all eight
nested navigation controls remain available on phones.

## Tomato rows in narrow beds

Select a bed, open Plant and choose Add row. The bed becomes the planting target.
Set the crop/variety and spacing, choose Along the bed or Across the bed, then
Preview row. A centred row is generated from usable soil and existing spacing
and lock checks. Apply preview adds it in one undo step; Cancel changes nothing.
The preview reframes the selected bed after responsive sheets close.

With Any soil selected, Add row still accepts a drag or two endpoint taps. The
first tap now confirms the row start. Rows with no valid positions report soil
edge/spacing guidance. Choosing a planting target also opens the centred preview
controls and cancels an old unfinished row, rather than reusing its first point.

Tomato-row verification (15 October 2026): all 12 new narrow/rotated-bed checks
and 40 related planting, preview, pixel and persistence checks passed at the four
standard viewports. After responsive focus was corrected, all 28 affected row,
interaction, camera-lock and model-detail checks passed again. All screenshots
were inspected, including whole-bed visibility on phone. Production build,
strict TypeScript and zero-warning ESLint pass. Dart format finds no files and
Flutter analyze passes; Flutter test is unavailable because this Next.js app has
no Flutter test directory.
