# GrowVeg planner/designer parity audit

## Subsequent UX work

Release baseline: `119ded5` is on main and its GitHub deployment succeeded. The historical
matrix below records the earlier audit state; the following changes supersede
its findings for the workflows listed here.

The next UX pass adds workspace Plant List/Parts List views with live header-tab
switching, a plan-wide Notes textarea saved through the main Save action, a
visible Settings action, plan year, New/Open ribbon entry points, general
single-selection cut/copy/paste/delete and keyboard shortcuts. Bed clipboard
copies retain child planting geometry and generate independent identifiers.
Named-garden notes use a separate idempotent D1 table and existing write-token
protection; local drafts survive reload and failed writes.

Plant palettes now expose Favorites, Include Perennials, companion filtering,
Easy/Frost/Shade/Autumn/Tropical filters, crop-rotation-family filtering and plant
information with original factual metadata. Favorites persist in this browser;
account-wide synchronization is not implemented. Variety/spacing controls appear
after choosing a plant. The original fontello icon font replaces approximations
for observed toolbar and drawing-tool glyphs, with provenance recorded.

These changes improve the Header, Edit ribbon, Basic/Advanced plant controls,
Plant information, Plant List navigation and Plan Notes rows below. They do not
establish whole-product parity. Legacy extra tools/catalogue modes remain; full
settings, inventory, temporal planning, print/PDF, rich-text/texture workflows,
full layout/layer operations and other documented gaps remain.

Cloudflare's separate Workers Builds connection reports a stale build token.
The user chose "Leave Cloudflare unchanged"; the unsaved selection was discarded.
No build credentials or settings were changed. The existing GitHub Actions
deployment workflow for `fa66ff5` independently succeeded (run 41408565902), so
that separate dashboard error does not establish a production deployment failure.

## Selection and movement follow-up — 6 November 2026

P-008 adds box selection, additive Shift/Ctrl/Cmd selection, visible-layer
Select All, mixed-item group dragging, group clipboard/delete/duplicate and
one-step undo/redo. Bed children move with their parent and copy once with fresh
identities. One common boundary-limited translation preserves group spacing and
row lengths; standalone planting areas remain constrained to their own beds.
Locked shapes are omitted from box selection and Select All. Pointer cancellation
restores the pre-drag group snapshot. The two selection/edit ribbon controls use
the observed source glyphs.

The live reference currently has no plan open. Its dedicated selection-box and
edit controls were observed, but no private plan was opened or changed to test
reference gestures. This is an implementation milestone, not a certification of
exact source selection semantics. Persistent grouping, all-item locking/order,
complete layer semantics, exact text hit bounds and source end-to-end comparison
remain unverified or incomplete. The historical matrix below predates this work.

## Stable scale correction and planting observations — 6 November 2026

P-009 corrects the reported wide-screen Mobile-layout column conflict, removes
selection-driven automatic zoom and gives coincident-endpoint single plants a
nonzero hit target. Selection preserves zoom; explicit Fit still recalculates.
Existing measured positions and saved data are unchanged.

A reference plan is now open. Temporary, fully undone tests confirm click for a
single plant, drag for a row and corner resize from single to block. Tomato uses
50cm single spacing, 45cm in-row and 60cm row gap; SFG uses one-foot cells and
cannot drag rows. The complete gesture set remains pending. P-010 now implements direct click for
a single plant and drag for a row through both Plants and Rows, using source
in-row spacing or a custom override. Live drafts show every plant symbol, count
and length; saved rows share the renderer and no longer have a 24-symbol cap.
P-012 adds corner expansion, independent row gaps and square-foot cells with
catalogued density. Full container/calendar behaviour remains incomplete.
Tools are compact/expandable in touch mode and hide during drawing.
No private plan data or notes were copied; no reference plan was saved.

## Existing-row resize and drag correction — 6 November 2026

P-011 reflows explicit rows when their endpoints or spacing change. The previous
saved-position count no longer pins a stretched one-plant row to one icon.
Existing IDs are reused where possible, new IDs stay stable within the gesture,
and translation retains custom positions/counts. Frozen pointer coordinates,
capture and stable scroll layout remove moving-origin drag feedback; cancellation
restores the starting plan. P-012 subsequently adds the block/SFG planting workflow described below.

## Historical audit — 2 November 2026

Audit date: 2 November 2026. Reference: the signed-in Australian GrowVeg garden
planner, inspected through the user's open browser. Candidate: branch
`feature/planner-rebuild`, PR #52, based on `0a19faa` plus the audit corrections.

**Result: FAIL for exact whole-product parity. Do not merge this as a verified
1:1 rebuild.** Passing regression tests establishes existing behaviour, not
equivalence to GrowVeg. This was the historical merge recommendation; the user
later explicitly requested the main push. The current release remains an
incremental implementation, not a verified 1:1 rebuild.

The user's existing bed positions are intentionally retained. Account billing,
GrowVeg identity, private saved gardens and unrelated subscription services are
outside the requested planner-feature scope. No reference plan was saved,
published, deleted or imported. Private notes, account details and authenticated
asset URLs are excluded from this report and repository.

## Method and limits

Opened the live reference's plant, object, shape and text palettes; advanced
plant filters; settings tabs; layer, timeline and rotation selectors; plant and
parts reports; notes; print dialog; image generation; publication and Seed
Planner. Compared visible controls and behaviour with repository implementation,
original public asset manifests and four-size browser checks. Reference browser
zoom was 80%; temporary viewport compensation established a 1440-by-900 CSS
viewport. Screenshot pixel dimensions alone must not be used to infer sizes.

Original source metadata contains 432 plant records, 203 object variants in 44
groups, 16 atlases and 33 standalone fill textures. Counts establish resource
coverage, not complete behavioural parity. Atlas frame names can differ from
plant codes, and duplicate display names do not imply missing species.

Status meanings: **Matched** is limited to the stated property; **Partial** means
some equivalent implementation exists; **Missing** means no equivalent was found;
**Unverified** means the workflow could not be established without changing the
reference plan or was unavailable in the reference.

## Comparison matrix

| Area | Reference observation | Candidate finding | Status |
| --- | --- | --- | --- |
| Plant artwork | Original catalogue sheet and high-resolution atlas symbols | Original resources and frame mappings integrated | Matched: resource coverage |
| Plant scale | Catalogue symbols 36 px; canvas symbols use source physical width/height | Source dimensions applied independently to both axes and through zoom; bed positions retained | Matched: measured cases |
| Object artwork | 203 variants, including tiled paths and nine-slice objects | Resources, grouping and source rendering integrated | Partial: geometry constraints remain |
| Font | Nunito Sans regular/semibold | Original font files used by planner shell | Matched: resources |
| Overall shell | Compact green header, ribbon, palette, grid, footer | Similar shell; control locations, spacing and several menus differ | Partial |
| Plan header | Name/year chooser, Settings, Save; Plan/Plant List/Parts List/Notes | Static title; Settings/Notes under More; no corresponding year chooser | Partial |
| Plan ribbon | New, Open, Save, Print, Publish, Generate Image | Save and export subset | Partial |
| Edit ribbon | Selection, undo/redo, cut/copy/paste/delete, zoom controls | Undo/redo and subset; clipboard principally shapes | Partial |
| General layout actions | Lock, send back, bring front on planner items | Per-shape locking/order | Partial |
| Layers | Edit All, View All, Structures, Plants, Text, Irrigation, Layout, Locked Items | Six local layer options; no corresponding Irrigation/Locked Items | Partial |
| Timeline | All Months plus July through June | January-through-December selector; no equivalent occupancy filtering | Partial |
| Crop rotation overlay | Off, Automatic and seven family overlays | Separate history dialog; no equivalent selector/overlay | Missing |
| Main palette | Plants, Garden Objects, Shapes, Text | Ten local drawing categories with different hierarchy | Partial |
| Basic plant controls | Name/type filters, square-foot mode, favourites, perennials, inventory, companions | Search/type/variety/custom spacing and other local controls | Partial |
| Advanced plant filters | Easy, frost, shade, autumn, tropical, family; can sow/plant/harvest in month | Most filters absent | Missing |
| Plant information | Per-plant info button and favourite star | No equivalent per-entry actions | Missing |
| Plant spacing | Single, in-row and between-row spacing; square-foot density | Mostly single spacing; source factual fields imported | Partial |
| Plant placement preferences | Corners, edges, inside; default maximum 100 icons per area | Different icon caps and placement logic | Partial |
| Object constraints | Variant-specific size, proportion, rotation and measurement semantics | Generic editing; some inspector minimums differ | Partial |
| Paths/irrigation geometry | Dedicated path/line style object behaviours | Reference variants generally use structure blocks | Partial |
| Container associations | Recalculate plants within beds/containers | Bed association exists; source container semantics absent | Partial |
| Season extenders | Affect planting calendars | No equivalent calendar adjustment | Missing |
| Outline shapes | Rectangle, triangle, ellipse, line; colour and width | Implemented; default colour corrected to source #663300 in this audit | Partial: palette/UI differs |
| Filled shapes | Rectangle, triangle, ellipse; solid colours and textures | Solid fills; source default colour corrected in this audit | Partial |
| Colour picker | Hex/OK, colour grid, Heritage Colours | Native colour input | Partial |
| Fill textures | Texture selection grid | 33 original resources stored; no selection UI | Missing |
| Text | Font-size selector (default 16), colour and text control | Basic labels; matching text controls absent | Partial |
| This Plan settings | Name/year, dimensions 1–300 m, metric/imperial, grid/rulers/labels, history | Fixed measured garden and local settings; most source settings absent | Partial |
| Plan history | Add/remove/reorder linked earlier plans; follow-on years | Named gardens, no equivalent history chain | Missing |
| Device settings | Touch mode, wheel zoom, snap, edge pan, cursors, icon placement, quality, renderer/DPR, help preferences | Limited local preferences; no matching device-settings panel | Partial |
| Plant List navigation | Full-page view; Default/Individual Plantings/Beds & Containers | Report modal with grouping/search | Partial |
| Plant List columns | Info/favourite/icon/name/spacing/quantity/calendars/notes | Basic counts/spacing/grouping; no full calendars, favourites or corresponding note columns | Partial |
| Plant List display | Perennials/family/scientific name/text calendars/column toggles/table-list-auto | No equivalent display menu | Missing |
| Plant List export | Print/background colours/CSV | CSV and browser printing; different report layout | Partial |
| Parts List | Count/length/area units; extra 10% ordering allowance for length/area | Counts structure instances, with local bed materials | Partial |
| Plan Notes | One editable plan-wide textarea | Existing per-bed Notes & Harvests has different semantics | Missing |
| Print Plan | PDF preview, A4/custom paper, orientation, multipage tiling, headers, download/open | Browser print and schematic exports | Partial |
| Generate Image | Reference currently displays generating an image is not available | Local schematic PNG exists; equivalence cannot be tested | Unverified |
| Publish Plan | Current reference plan exceeds 30 m limit; Publish disabled | No equivalent publication workflow | Missing; reference end-to-end unverified |
| Seed Planner | Inventory lots, expired packets, perennial switch, allocation, deficits, create list | Seedling Companion is a different feature; packet inventory/allocation absent | Missing |
| New/follow-on plans | Follow-on/history described in settings | Named blank gardens exist; follow-on cloning absent | Partial; reference creation unverified |
| Multiselect | Box-selection tool visible | Local single selection; full group operations absent | Partial; reference group behaviours unverified |
| Original-art exports | Source print/rendered plan output | Current SVG/PNG exports use schematic drawing | Partial |
| 3D companion | Outside observed source planner parity | Existing local feature retained; detailed species artwork regression repaired during audit | Local regression scope |

## Regression finding and correction

The full suite at `0a19faa` reproduced the remote CI result: **124 passed, four
failed**, one failure at each viewport in `plant-art-3d.spec.ts:41`. The latest
2D source-art precedence stopped incidental loading of legacy detailed PNGs;
the unified 3D renderer used generic procedural plants for these species and did
not load their detailed artwork. This is a real regression, not four pre-existing
failures. The baseline phone-only failure must not be used to dismiss the three
new failures.

The correction renders the existing detailed species artwork as actual crossed
mesh planes, with a horizontal symbol for the top camera, for species lacking
specific procedural models. Other procedural crops are retained. Texture arrival
invalidates the on-demand renderer; its listener is removed on teardown and mesh
textures follow the existing disposal path. Both inline and companion routes use
the same factory. No tests were removed, weakened or replaced with preloading.

Final post-correction validation is recorded in DESIGN_PROGRESS.md. The four
required viewports are 1920×1080, 1440×900, 1024×768 and 390×844.
All 128 existing browser checks pass after correction; lint/build also pass.
Screenshot review additionally found the phone perspective fixture is distant
and washed out by fog after camera fit. That visual limitation remains and is
not covered by the passing functional assertions.

## Completion order before the requested main push

1. Finish original-art plan export, object geometry/measurement semantics,
   shape texture/colour controls and exact typography/layout comparisons.
2. Implement complete selection/clipboard/locking/layer operations and text.
3. Implement plan/year/history/settings and temporal/crop-rotation behaviour,
   preserving the existing measured garden and protected storage.
4. Implement plant filters/info/favourites and full report/calendar/notes/print
   workflows, then seed-packet inventory and allocation.
5. Verify unavailable reference workflows when GrowVeg permits them; leave
   explicit limits where equivalent observation remains impossible.
6. Repeat source-vs-candidate interaction and screenshot audit, pass all existing
   checks, inspect the final diff and only then perform the authorized main push.

This report is an actionable gap inventory, not a claim that every hidden or
backend GrowVeg behaviour has been collected. Exact equivalence in every possible
state cannot be established from a single saved reference plan.

## Planting blocks and square-foot workflow — 6 November 2026

P-012 adds corner expansion of single plants/rows into rectangular blocks, reverse
block drawing, separate row gaps, width/depth controls and exact one-foot cells
with catalogued plant density. Shared positions feed 2D/3D, selection, duplication
and exports; optional settings survive protected D1 save/load. Draft coordinates
are frozen across panel shifts to prevent count flashing. This is a functional
port; whole-product pixel/interaction parity and the complete source gesture set
remain unverified. Advanced temporal/container behavior remains outstanding.

## Planned date ranges and succession — 7 November 2026

P-013 adds inclusive date ranges for rows/blocks/areas, same-space succession on
the next day, month/year visibility in 2D and 3D, dated plant-list grouping and
CSV output, and compatible protected persistence. Undated plans remain visible
year-round. Actual recorded history is retained independently. This implements
the core dated planning workflow; complete source calendar dialogs, automatic
sowing/harvest calendars and whole-product interaction parity remain unverified.
