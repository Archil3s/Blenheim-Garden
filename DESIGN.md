# Blenheim Garden — visual design contract

**Status:** v1.0, 1 November 2026. **Owner:** project. **Tracking:** [docs/DESIGN_PROGRESS.md](docs/DESIGN_PROGRESS.md).

## Product thesis
A *Marlborough gardener's field notebook* with professional garden-planning precision. Quiet botanical editorial design, real crop information, clear seasonality, measured plotting tools. The garden canvas and the user's observations—not a generic SaaS dashboard—are the centre of the product.

## Design decisions
- **Identity:** Blenheim, Wairau and Waihopai are real growing sites with distinct microclimates. Label location and evidence (historical seasonal norms, forecast, sensor, observed) correctly.
- **Page composition:** typographic masthead, readable body copy, one primary action, broad editorial sections, ordered task rows. Avoid three identical tiles with emojis and empty filler.
- **Typography:** native system sans for controls/data; expressive but restrained Georgia serif for editorial headings. No dependencies on external font downloads. Heading sizes responsive with `clamp`; body 15–17px, line-height 1.5–1.7.
- **Palette:** parchment `#f7f5ef`, ink `#24372c`, pine `#294e39`, moss `#647b65`, ochre `#aa7e4d`, borders `#dadfd2`. White only for functional surfaces. Status red/amber for real risk, never ornament.
- **Spacing:** 4/8/12/16/24/32/48/64px hierarchy; 1120–1200px comfortable max reading canvas. Control hit area >=44px.
- **Shape:** prefer thin rules and grids. Modest radii (4–10px functional, max 12px); avoid nested round cards, oversized pills, strong shadows, glassmorphism and decorative gradients.
- **Imagery:** authentic garden photography supplied by user, properly licensed botanical diagrams, and accurate crop silhouettes. Never copy Kings Seeds photography without permission. Avoid decorative fake garden metrics and misleading representations of saved beds.
- **Motion:** none by default; subtle focus/hover only. Respect reduced motion and iOS performance.
- **Copy:** gardener's language. Explain actions, decisions and confidence. For moisture: *Check the growing mix; water only if needed*. Frost: historical mean is not the garden's forecast.
- **Mobile:** real 390px layout first, comfortable single column, unclipped forms, link/action controls accessible to touch. Verify laptop, tablet and desktop. Primary jobs work without a mouse.
- **Accessibility:** WCAG AA contrast target, visible focus ring, semantic headings, labels, error and empty states, meaningful text even when icons are hidden.

## Surface hierarchy

1. **Home `/`:** journal masthead, season brief, *open planner* primary action; direct access to Seedling Companion and 3D. Avoid pretending local-only seedling numbers are cloud synced.
2. **Seedlings `/seedlings`:** what to sow, tracked batches, stage checklist, careful condition-based tasks, succession sowing in a calendar-oriented layout. No fabricated precision for germination or watering.
3. **Planner `/planner`:** *measured canvas is the application*. Preserve 12-bed base, centimetre scales, 2D/3D link, edit flows, D1 history and tool reachability. Only polish surrounding chrome after functional tests.
4. **3D `/3d`:** recognizable real crop morphology, credible PBR materials and lighting, stable geometry budgets. Use reference projects for technique, **not copied artwork or wholesale renderer replacement**.

## Agent sources and usage

These are independent open-source references, not mandatory runtime dependencies.

| Source | Role | Implementation policy |
| --- | --- | --- |
| [ui-design](https://github.com/SpellbourneDZ/ui-design-skill) | product-aware interface rules | Vendored MIT-licensed SKILL under `.agents/skills/ui-design`; use for every UI change |
| [ui-art-direction](https://github.com/SpellbourneDZ/ui-design-skill) | visual concept and hierarchy | Vendored MIT-licensed SKILL; use for larger redesigns |
| [redesign-existing-projects](https://github.com/tasteskill/tasteskill) | audit current UI before patching | Vendored MIT-licensed SKILL; compare existing UI and new intent |
| [Procplants Lab](https://github.com/DavinciDreams/procedural-plant-lab) | plant geometry, organ orientation, silhouette, seeded variation | Reference only. Investigate crop-specific implementations and licensing before any source reuse. No runtime dependency in phase 1 |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | optional Three.js rendering pipeline | Reference only, zlib licence. Benchmark WebGL/mobile before dependency or effects are introduced |

Upstream skill licence copies live under `.agents/licenses/`. The files belong to their respective upstream authors. If refreshing them, preserve licences and audit instructions and diffs.

## Anti-slop acceptance checklist
- [ ] Does every block support an actual growing task?
- [ ] Could this screen belong specifically to a Marlborough garden? Can you tell from visible content?
- [ ] Does the layout use editorial hierarchy rather than arbitrary "three cards"?
- [ ] Are dates/times/source labels truthful (NZ time, forecast vs climate, localStorage vs cloud)?
- [ ] Do leaf and fruit forms identify the crop without relying on colour alone?
- [ ] Can someone use it at 390 × 844 without clipping or horizontal scroll?
- [ ] Can keyboard and screen reader users complete the main task?
- [ ] Was the page rendered and interacted with in real Chromium at 1920/1440/1024/390 widths?
- [ ] Were existing planner data and Cloudflare bindings preserved?

## 3D visual upgrade targets (phase 2+)
- Before changing geometry, screenshot a reference garden in full and reduced detail at 1920/1440/1024/390.
- Improve leaf silhouette, petioles, branching and growth habit by crop family; use botanical references and deterministic seeded variation.
- Enhance soil/timber contrast through physically plausible materials, directional shadow softness and restrained fog/ambient fill.
- Only then evaluate postprocessing: sensible antialiasing + ambient occlusion on supported devices, no unconditional bloom, fixed HDR profile, no double tone mapping.
- Guard mobile frame times, shader compilation time, memory and WebGL context loss. Compare with the existing Three.js path before introducing new packages.
- Keep all model/layout coordinates, bed occupancy, selection and inspector interactions intact.

## Sign-off
Do **not** claim a visual overhaul is complete until CI builds and screenshots demonstrate the change. Log screenshots, feedback, open issues and decisions in `docs/DESIGN_PROGRESS.md`.
