# GrowVeg planner/designer parity audit

Audit date: 2 November 2026. Reference: the signed-in Australian GrowVeg garden
planner, inspected through the user's open browser. Candidate: branch
`feature/planner-rebuild`, PR #52, based on `0a19faa` plus the audit corrections.

**Result: FAIL for exact whole-product parity. Do not merge this as a verified
1:1 rebuild.** Passing regression tests establishes existing behaviour, not
equivalence to GrowVeg. Main remains unchanged pending completion of the gaps.

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
