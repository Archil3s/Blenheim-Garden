# Blenheim Garden — design overhaul, progress & feedback

**Started:** 1 November 2026  
**Source of truth:** [DESIGN.md](../DESIGN.md)  
**Phase 1 branch:** `design/editorial-garden-overhaul-01` (merged as PR #48)\n**3D comparison branch:** `feature/3d-showcase-comparison`  
**Review:** [Pull Request #48](https://github.com/Archil3s/Blenheim-Garden/pull/48)  
**Production:** Phase 1 was deployed from main. The separate 3D showcase is not deployed or connected to saved plans until its PR is reviewed and merged.

## Status board

| ID | Workstream | Status | Next verification |
| --- | --- | --- | --- |
| D-001 | Establish visual identity and design quality contract | Implemented · review pending | Review `DESIGN.md` |
| D-002 | Add agent skills: ui-design, art-direction, Taste redesign | Implemented · review pending | Licences and skill names inspected |
| D-003 | Editorial, task-led homepage | Implemented · visual QA pending | Render `/` at 4 viewport sizes |
| D-004 | Seedling Companion visual overhaul | Implemented · visual QA pending | Test add/edit/delete, local-only state, task visibility |
| D-005 | Planner chrome, toolbar and measured canvas polish | Queued | No changes to coordinates/persistence |
| D-006 | 3D plant geometry and material study | Prototype CI passed; user review pending | Compare `/3d-showcase` current/botanical modes and assess realism against intended reference |
| D-007 | Three.js postprocessing pilot | Research only | Benchmark on iPhone-like/mobile and laptop before use |
| D-008 | Mobile QA, accessibility, motion | In progress | Playwright, responsive screenshots and keyboard verification |
| D-009 | Genuine user feedback rounds | Awaiting feedback | Log issue + expected change below |

### Current 3D showcase (prototype)\n\n- **Route:** `/3d-showcase`, isolated from the production garden editor.\n- **Current mode:** the original `createGardenPlant3D` models.\n- **Botanical mode:** separately authored plant silhouettes with procedural leaf textures, fruit/flower structures, and PBR materials.\n- **Shared:** 2 × 4 m bed, camera, trellis, soil/timber, lighting and fixed plant positions.\n- **Limits:** prototype geometry; not photorealistic GLBs, no PlantStudio-Blender or Procedural Plant Lab runtime integration.\n- **Acceptance and limitations:** [3d-showcase-acceptance.md](3d-showcase-acceptance.md).\n\n### Delivery gates
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
| 2026-11-01 | D-006 | Use Procplants Lab for conceptual morphology research before copying any code | Preserve current Three.js integration and performance | Not integrated |\n| 2026-11-01 | D-006 | Add standalone model comparison using the actual existing low-poly renderer and a separate botanical renderer | Compare like-for-like before altering production renderer | Implemented on feature/3d-showcase-comparison; screenshot CI pending |
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
### Feedback received — 1 November 2026\n- **Screen:** `/3d`; comparison with previously generated design concept image.\n- **Observation:** “It doesn’t look anything like the proposed photos.”\n- **Expected:** Recognizable, botanically convincing species in a credible garden scene, rather than flat leaves and geometric fruit.\n- **Priority:** High.\n- **Status:** Accepted; isolated `/3d-showcase` prototype implemented for comparison. Do not mark validated until the user has reviewed actual screenshots.\n- **Review:** tomato compound leaves, strawberry trifoliates, pea tendrils, materials and realistic scale.\n

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

## 3D showcase QA evidence\n\n| Check | Outcome | Notes |\n| --- | --- | --- |\n| New route build + lint | Passed | [Build run #41290231598](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231598) |\n| Toggle current/botanical & reset camera | Passed in Chromium | [Showcase test #41290231475](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231475) |\n| Desktop, laptop, tablet and phone screenshots | Captured for both modes | [Showcase artifact, 14-day retention](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231475) |\n| Safe from garden API/storage | Code path reviewed | No garden API or localStorage access in showcase modules |\n| Detailed close-up fidelity | Below intended photographic reference | A separate Blender/glTF asset library is still required |\n\n## 3D comparison — screenshot feedback, 1 November 2026

- **Tested:** `d677c1b3` (followed by documentation-only changes), 4 responsive viewports, both modes, no page errors or horizontal overflow.
- **Visual conclusion:** botanical mode improves foliage and crop identification, especially tomatoes and strawberries, but the overall plant geometry is still visibly stylized. Does **not** match the earlier photorealistic concept render.
- **Evidence:** [focused screenshot CI #41290231475](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231475).
- **Decision:** leave /3d unchanged; seek user feedback on the standalone /3d-showcase before any integration. Next quality milestone is authentic, optimized Blender/glTF assets rather than further generic procedural leaf tweaks.

## How to continue in a future chat
Read `AGENTS.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, this log, and the current UI source. Keep existing garden state safe. Complete the oldest unverified in-progress item, log screenshots/test results, then collect feedback before the next phase. Do not merge prematurely.
