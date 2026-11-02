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
