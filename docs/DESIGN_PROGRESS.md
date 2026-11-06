# Blenheim Garden — design overhaul, progress & feedback

**Started:** 1 November 2026  
**Source of truth:** [DESIGN.md](../DESIGN.md)  
**Branch:** `design/editorial-garden-overhaul-01`  
**Review:** [Pull Request #48](https://github.com/Archil3s/Blenheim-Garden/pull/48)  
**Production:** `main` is unchanged until a reviewable PR passes checks and is merged.

## Status board

| ID | Workstream | Status | Next verification |
| --- | --- | --- | --- |
| D-001 | Establish visual identity and design quality contract | Implemented · review pending | Review `DESIGN.md` |
| D-002 | Add agent skills: ui-design, art-direction, Taste redesign | Implemented · review pending | Licences and skill names inspected |
| D-003 | Editorial, task-led homepage | Implemented · visual QA pending | Render `/` at 4 viewport sizes |
| D-004 | Seedling Companion visual overhaul | Implemented · visual QA pending | Test add/edit/delete, local-only state, task visibility |
| D-005 | Planner chrome, toolbar and measured canvas polish | Queued | No changes to coordinates/persistence |
| D-006 | 3D plant geometry and material study | Queued | Capture before/after, inspect performance |
| D-007 | Three.js postprocessing pilot | Research only | Benchmark on iPhone-like/mobile and laptop before use |
| D-008 | Mobile QA, accessibility, motion | In progress | Playwright, responsive screenshots and keyboard verification |
| D-009 | Genuine user feedback rounds | Awaiting feedback | Log issue + expected change below |

### Delivery gates
- **Phase 1:** Design standards, homepage and Seedling Companion editorial foundation; visual + build evidence; PR.
- **Phase 2:** Planner visual polish without changing the measured layout, controls or Cloudflare state.
- **Phase 3:** Three.js crop silhouettes, vegetation materials and lighting; assess Procplants Lab as reference.
- **Phase 4:** Optional `postprocessing` pilot, performance comparison, and accept/reject decision.
- **Phase 5:** Live two-site weather, true image stage reference integration, Cloudflare D1 sync and iPhone PWA push — **feature work, not a completed part of this visual overhaul**.

## Change log

| Date | ID | Decision / change | Rationale | Verification |
| --- | --- | --- | --- | --- |
| 2026-11-01 | D-001 | Establish field-notebook art direction, not a generic dashboard | Ground visual identity in garden tasks and real growing seasons | Awaiting PR |
| 2026-11-01 | D-002 | Vendor scoped design agent skills with upstream licence and attribution | Give future Codex agents stable, inspectable design rules | Review GitHub diff |
| 2026-11-01 | D-006 | Use Procplants Lab for conceptual morphology research before copying any code | Preserve current Three.js integration and performance | Not integrated |
| 2026-11-01 | D-007 | Treat pmndrs/postprocessing as optional after geometry work | Extra GPU cost is not justified until measured | Not integrated |
| 2026-11-01 | D-003 | Replaced abstract hero and three feature cards with season note and editorial workspace rows | Prioritise real jobs, locality and hierarchy | In PR #48; browser review pending |
| 2026-11-01 | D-004 | Restructured seedling information styling and added generic seed-leaf/true-leaf stage sketches | More useful plant stages without pretending to have crop-specific photos | In PR #48; browser review pending |
| 2026-11-01 | D-008 | Added responsive homepage and seedling Playwright smoke tests and fixed legacy planner test routes | Make 390px through desktop changes measurable | [Design smoke run #41285059493](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41285059493) passed across four viewports; full suite pending |
| 2026-11-01 | D-003 | After screenshot review, changed seasonal action label from "Now" to "Window" | Historical climate does not guarantee frost-free conditions at Waihopai | Latest commit to be retested |
| 2026-11-01 | D-004 | Clarified tomato/capsicum outdoor **transplant** windows vs direct sowing | Avoid incorrect planting instruction in November | Build passed on commit `b67b04d`; latest visual retest pending |

## Feedback register

Use one entry per round; never overwrite previous feedback.

### Feedback template
- **Date/time (NZ):**
- **Screen and device:** `/`, `/seedlings`, `/planner`, `/3d`; iPhone / desktop; viewport if known
- **Screenshot or description:**
- **What looks wrong:** concrete observation, not just "AI slop"
- **Expected outcome:** e.g. smaller toolbar, fewer pills, more realistic tomato leaf profile
- **Priority:** critical / high / normal / low
- **Status:** new / accepted / designing / implemented / validated / rejected
- **Commit or PR:**
- **Before/after evidence and follow-up:**

### Feedback entries
_None received yet. Add new entries here when the user reviews the browser or screenshots._

## Internal screenshot review, 1 November 2026

- Examined full desktop, laptop, tablet and 390px mobile screenshots from [GitHub design smoke evidence](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41285059493).
- Reviewed the mobile homepage checklist and seedling stage illustrations, including lower-page content; no horizontal overflow detected by smoke tests.
- Identified misleading status presentation: generic November windows for tomatoes and capsicums were labelled direct sow, and "Now" could imply frost safety. Implemented explicit transplant labels and changed the homepage status to "Window". Latest CI checks pending.
- These are **internal QA observations**, not user feedback. Collect feedback once the draft is reviewed.

## QA evidence log

| Check | Outcome | Link / notes |
| --- | --- | --- |
| Bun lint | Passed on commit `3fa4cd9`; latest documentation/CI commit pending | [Build workflow](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41284994702) |
| Bun production build | Passed on commit `3fa4cd9`; latest documentation/CI commit pending | [Build workflow](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41284994702) |
| Desktop 1920×1080 | Passed on design smoke run #41285059493; latest label changes pending | Screenshot in workflow artifact |
| Laptop 1440×900 | Passed on design smoke run #41285059493; latest label changes pending | Screenshot in workflow artifact |
| Tablet 1024×768 | Passed on design smoke run #41285059493; latest label changes pending | Screenshot in workflow artifact |
| iPhone 390×844 | Passed on design smoke run #41285059493; latest label changes pending | Screenshot in workflow artifact |
| Add/edit/delete + refresh seedlings | Passed on design smoke run #41285059493 | Browser localStorage, not cloud; retest latest label changes |
| Original garden planner and /3d | Pending | No regression |
| Cloudflare deployment | Not started | Draft PR; do not deploy without review and QA |

## How to continue in a future chat
Read `AGENTS.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, this log, and the current UI source. Keep existing garden state safe. Complete the oldest unverified in-progress item, log screenshots/test results, then collect feedback before the next phase. Do not merge prematurely.

## Planner rebuild workstream P-001 — 2 November 2026

Branch: `feature/planner-rebuild`. Scope and remaining work:
[PLANNER_REBUILD.md](PLANNER_REBUILD.md).

Added the expanded 411-name catalogue alongside existing crops, original local
silhouettes, 71 structure presets, custom spacing/variety, plant/parts reports,
CSV/JSON/SVG/PNG exports and printable lists. Retained the existing shortlists,
protected storage, measured layout and procedural 3D behavior. Fixed companion
3D return links that still pointed to the homepage. The original 36-preset
`STRUCTURE_PRESETS` contract remains; the expanded list is a separate export.

After evidence: `expanded-catalogue.png` and `plant-list.png` from the new
`planner-catalogue-reports.spec.ts`, at desktop, laptop, tablet and phone sizes.
Inspected all four viewports and the exported PNG schematic.

Validation: `npm run lint` and `npm run build` pass. Full Chromium suite:
**99 passed, 1 failed**. The failure is the existing phone variant of
`plant-art-3d.spec.ts:41`, which expects individual PNG requests after entering
the procedural 3D view. It fails identically on unmodified commit `8bbc746`
in an isolated baseline checkout. The baseline used Webpack because Turbopack
rejects shared dependencies outside its checkout root. No existing tests were
changed, removed or weakened. The new catalogue/report tests pass at all four
sizes, including download contents/dimensions and print visibility.

Flutter checks do not apply: this Next.js repository has no `pubspec.yaml`.
The requested Flutter/Dart commands were attempted but produced no result
during SDK startup and were stopped; they are not reported as passing.

User feedback: requested a full copy. Exact parity is **not complete**. Missing
atlas/database, independently verified growing data, and remaining editing,
inventory and calendar workflows are tracked in PLANNER_REBUILD.md.
Production deployment has not been performed.

## Designer workstream P-002 — 2 November 2026

Implemented drawing geometry, colours, resizing, rotation, per-shape locks,
copy/paste, undo/redo, front/back placement and layer views. Shape objects render
in both existing 3D views and exports. Protected saves use an idempotent separate
shape table; named-garden layout IDs are namespaced to avoid cross-garden
collisions. Existing layout storage and measured beds remain supported.

Validation: lint and production build pass. The combined designer/planner,
report and persistence regression run passed 52 checks. Final designer run
passed all 12 checks across desktop, laptop, tablet and phone, including actual
resize-handle dragging, lock protection, ordering, save/reload and 3D rendering.
The phone inspector was reduced so it does not cover the resize handle.
Screenshots: outputs/designer-preview/{viewport}-shape-tools.png,
{viewport}-designer-shapes.png and {viewport}-designer-shapes-3d.png.
The previously documented baseline phone texture-request test remains separate.
No production deployment. Full third-party feature parity remains incomplete.

## Reference layout P-003 — 2 November 2026

User feedback: the feature expansion did not look like a 1:1 GrowVeg planner.
The reference screenshot is now the visual authority for planner chrome, ahead
of the earlier editorial planner styling. Home and seedlings retain their design.

Replaced the planner shell with a green application strip, compact document/edit
ribbon, direct report tabs, narrow SVG drawing rail, white catalogue rows and a
grey workspace around the white grid. Scoped the old forced soil/grid styling
away from this planner. Individual crop symbols render at readable zoom levels
with bounded sampling; saved counts, centimetre spacing and coordinates do not
change. The full library artwork, object variants and complete ribbon behavior
still differ from GrowVeg and this is not described as exact visual parity.

The first layout pass passed 52 interaction/regression checks at four sizes.
The final crop-rendering/ribbon pass passed all 28 relevant browser checks at four sizes. Lint and production build pass. All four screenshots were inspected. Screenshots
are retained in outputs/reference-layout/ and the Playwright artifacts.

## Original artwork P-004 — 2 November 2026

User explicitly requested exact images/style and then chose to keep the existing
bed positions. Replaced placeholder plant drawings with the original regional
catalogue sprite sheet and high-resolution atlas frames. Imported all 432 source
plant records (including repeated generic names), 203 garden-object variants,
1,086 original texture frames plus the Convolvulus alias, 33 standalone fill
textures and the reference Nunito Sans fonts. Source URLs/hashes are recorded
in REFERENCE_ASSETS.json. No credentials or private garden payloads are included.
New factual plant spacing comes from the reference; existing crop defaults remain.

Object variants are grouped rather than shown as duplicate top-level search
results. Original single-image, path-tile and nine-slice art renders in 2D; local
3D procedural models remain. Existing 36/71-preset exports remain compatible.
Reference kinds are validated separately and stored in the existing structure
path. All original non-null object sprite parts resolve to local atlas frames.

The canvas uses original symbols, flat paths, grey planting zones and canopy,
outlined beds, compact labels and the reference font. Existing bed coordinates
were explicitly checked unchanged by the browser interaction test. Full product
parity and original-art exports remain incomplete; see PLANNER_REBUILD.md.

Validation: the 64-check planner/designer/report/persistence/artwork suite passed across all four sizes. Lint and production build pass. Final canopy and low-zoom corrections passed 12 focused checks across all four sizes; final screenshots were inspected.
No production deployment or merge.

## Source symbol sizing P-005 — 2 November 2026

User feedback: original images still rendered at the wrong sizes. The renderer
was using legacy 14–18 px area sizes and fixed 22/24/36 px row/berry/tree symbols.
It now reads each plant's original sprite width/height as centimetre dimensions
in the measured canvas, then applies the existing garden zoom. Strawberry and
raspberry are 40 cm, blackberry 50 cm, climbing bean 30 cm and generic fruit tree
75 cm. Non-square aspect ratios retain their separate source width/height.
Catalogue symbols use the reference's fixed 36 px size. Row symbols are anchored
to positions without flex shrinking. Legacy custom area sizing remains available
by switching off Original symbol sizes in the planting inspector.

New browser checks measured all these dimensions at 1920/1440/1024/390 widths,
rechecked them after zoom in/out, checked catalogue dimensions and confirmed bed
geometry unchanged: 4/4 passed. Lint and production build pass. Existing planner/artwork regression checks: 32/32 passed. Screenshots: outputs/icon-size-fix/.
No production save, merge or deployment.

## Detailed parity audit P-006 — 2 November 2026

The live source audit covers 44 comparison areas, including settings, drawing,
layers, temporal controls, plant/parts reports, printing, notes and Seed Planner.
Read GROWVEG_PARITY_AUDIT.md for observations, code gaps and verification limits.
Exact whole-product parity fails. Main remains unchanged under the user's
instruction to push after completion; PR #52 remains draft.

The pre-correction full run reproduced CI: 124 passed, four detailed-art 3D
failures. Three are new regressions; the earlier phone-only baseline failure
does not excuse them. The shared plant factory now renders detailed species
artwork where no specific mesh model exists, using crossed mesh planes and a
top-view symbol. Texture arrival invalidates the renderer, and teardown removes
the listener and disposes mesh textures. Other crops retain procedural models.
Default outline and solid shape colours now match the observed #663300.

Final validation: npm run lint and npm run build pass. The complete unchanged
Playwright suite passes **128/128** across 1920×1080, 1440×900, 1024×768 and
390×844. Perspective/top/companion captures were reviewed. Detailed artwork is
visible on desktop/laptop/tablet; the phone perspective fixture is distant and
washed out by fog after camera fit, a remaining visual limitation despite its
functional pass. Do not treat the suite as proof of visual or product parity.
Original icon-dimension, unchanged-bed, persistence and named-garden checks also
pass in that full run. No dependencies, bindings or test assertions changed.
Browser viewport override restored. No production save, merge or deployment.

## Planner UX P-007 — 5 November 2026

Plant List and Parts List now occupy the workspace with working header tab
switching. Plan Notes provides a single textarea saved with the main Save
button; named-garden note records use an idempotent dedicated table, the existing
write-token protection, validation and recoverable browser drafts. Notes do not
replace existing per-bed records or harvests.

The header exposes Settings and plan year, with New/Open ribbon entry points.
Single-selection cut/copy/paste/delete now covers beds and their plantings,
planting areas, rows and objects; keyboard shortcuts preserve normal text editing.
Copied plants receive independent identities. Copied bed IDs avoid reusing
archived history identities.

The palette adds persistent browser favourites, perennial and companion filters,
source Easy/Frost/Shade/Autumn/Tropical/family filters and factual plant dialogs.
Name/Type precede companion/favourite controls; planting details appear after
choosing a plant. Original fontello glyphs replace toolbar/drawing approximations;
observed toolbar and Settings glyph sizes are 14 px and laptop header text 16 px.
Legacy CSS collisions in catalogue padding and hidden Type controls are corrected.
Final visual review also caught blank CSS-sheet catalogue symbols. Palette,
information and report symbols now show the original atlas frames directly,
matching the working canvas renderer while retaining the measured symbol sizes.
Reference ribbon glyphs remain visible at intermediate responsive widths.

Full-product parity remains incomplete; see GROWVEG_PARITY_AUDIT.md. No account
sync for favourites, complete temporal/inventory/PDF/settings/texture workflow,
or multiselection equivalence is claimed. No dependencies or bindings changed.
The user's instruction to leave Cloudflare build-token settings unchanged remains
in effect. The existing GitHub deployment workflow remains the release path.

Release validation: lint and production build pass. All 144 tests pass across
1920×1080, 1440×900, 1024×768 and 390×844, including real SQLite-backed note
protection/isolation, draft/save flow, tab switching, filters and unchanged garden
geometry. All 128 pre-existing tests remain intact. Final responsive glyph CSS
was followed by another successful production build and 4/4 interface checks.
An earlier preview process stopped and caused connection failures; the complete
rerun used a Playwright-managed npm server and passed. The CI configuration and
dependencies are unchanged. Screenshots were reviewed at all required sizes.

Phone release follow-up: a legacy device-mode rule forced the enlarged ribbon
back to 56 px and clipped its lower controls. The reference mobile ribbon now
uses two contained horizontal control rows at 110 px. A regression assertion
checks each control group's vertical bounds. Build/lint and all 10 focused phone
editing/save/report/3D/UX checks pass; the final phone screenshot was inspected.

## Selection and movement P-008 — 6 November 2026

User requested the next port toward exact GrowVeg functionality. Added dedicated
box selection and mixed-item group editing within the existing measured canvas.
Shift/Ctrl/Cmd toggles selection; Ctrl/Cmd+A selects the editable visible layer;
Escape and blank-canvas clicks clear selection. Group movement uses a common
snapped translation, preserves distances and line lengths at boundaries, carries
bed children without double transforms, and constrains standalone planted areas
to their bed. Group clipboard copies generate independent persistent identities.
Cut/delete/duplicate and undo/redo operate on the whole group. Pointer cancel
restores the group snapshot. Locked shapes stay out of box/Select All actions.

Observed source ribbon has distinct box-selection and edit glyphs. Reference
currently has no plan open; no private reference plan or notes were opened or
changed. Source group semantics therefore remain unverified. Do not claim exact
whole-product parity; see GROWVEG_PARITY_AUDIT.md. Existing bed positions, protected
storage, Cloudflare settings and dependencies remain untouched.

Validation: npm run lint and production build pass. All 156 browser checks pass
(7.5 minutes), including 12 new group-geometry and interaction checks at
1920x1080, 1440x900, 1024x768 and 390x844. All 144 existing checks remain intact.
Final screenshots at all four sizes were inspected; group controls have 44px
minimum touch height. Evidence: outputs/selection-port/. Tests use isolated
fixture routes and never save a production garden. Local Bun is unavailable;
the established npm runner config outside the repo starts the test server.
The first restricted build hit sandbox subprocess/network permissions; the
permitted rerun and final build passed. Cloudflare credentials/settings unchanged.

## Stable selection scale P-009 — 6 November 2026

User screenshot showed the garden collapsing to a narrow strip at 25% when
selecting pumpkins. Read-only production geometry confirmed a wide viewport in
explicit Mobile mode: the body had three columns (50px / 280px / remaining),
but the stage was forced into column two. Specific mobile reference rules now
use 50px / remaining regardless of desktop viewport width and align the overlay
inspector with the rail. Responsive height accounts for both ribbon layouts.

Automatic Fit previously observed the stage and depended on inspector state,
so opening/closing it changed zoom and could change coordinates during a drag.
Fit now runs at initial layout, explicit Fit and viewport/layout resize, preserving
manual zoom and selection scale through inspector/catalogue changes. Explicit
Fit always recalculates, including when already in automatic-fit mode.

The new pumpkin regression also exposed a zero-width hit target for single-plant
rows whose endpoints coincide. Their box now uses the original symbol width,
centred at the saved location. Explicit zero-length placements use centimetre
offsets, matching the existing storage/3D convention. No saved coordinates change.

Validation: lint and production build pass. Full suite: 164/164 (8 minutes).
After the final symbol hit-area/explicit-placement alignment correction, a fresh
build/lint and all 24 relevant scale/group-selection/symbol-dimension checks pass
across four sizes. Final screenshots for Desktop and Mobile modes were reviewed.
The new fixture exercises both implicit and explicit single-plant placements and
clicks a symbol corner. Its position oracle includes the canvas content border;
an initial assertion incorrectly measured from the outer border and was corrected.
The original 156 tests remain unchanged. Evidence: outputs/stable-scale/.
No production plan was saved or reloaded. Cloudflare settings remain unchanged.

Planting reference observations for the next port: the user had a reference plan
open this time. Click places one tomato; drag creates a row; dragging a corner
of the single plant expands it into a rectangular block. Tomato reference facts
show single spacing 50cm, in-row 45cm, row gap 60cm, SFG one per square. SFG help
states square cells are one foot and cannot be dragged into rows; Ctrl repeats.
The temporary row and single/block edits were fully undone; the saved-state
indicator returned, no source plan was saved, and no private payload or notes
were copied. These observations do not establish implemented gesture parity.
