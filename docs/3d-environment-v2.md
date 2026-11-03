# Blenheim Garden — Environment V2 study

**Status:** isolated interactive prototype, not production garden.  
**Review branch:** `feature/3d-environment-v2`  
**Route:** `/3d-showcase`  
**References:** [3D tomato GLB pipeline](3d-tomato-asset-pipeline.md) · [design progress](DESIGN_PROGRESS.md)

## New priority

The user clarified that an atmospheric, convincing **entire 3D garden environment** matters more than perfecting one tomato model. PlantGen is a potential **offline vegetation authoring** source, not the intended runtime engine or a substitute for garden hardscape.

## Delivered in this prototype

- **Independent environment comparison:** existing environment versus Environment V2. All three previous plant-rendering modes (current low-poly, earlier procedural plants, and tomato GLB asset) remain selectable.
- **Geometric contract:** same 2 × 4 m bed, 1.8 m pea trellis, original tomato/pea/strawberry placements and plant-scale origin. Neither mode accesses saved plans or the D1/R2 APIs.
- **Ground:** lightly irregular terrain geometry plus repeated multi-scale original grass texture, rather than a uniform flat grey-green plane.
- **Paths:** textured gravel on both sides, front and rear, with edging and instanced stones. These are deliberately outside the bed footprint.
- **Raised beds:** individually laid timber plank geometry, seams, grain texture, end posts/caps, soil aggregates, instanced straw pieces and a drip irrigation line.
- **Garden context:** timber boundary fence, volumetric hedge made from cutout foliage cards with simple branches, patchy instanced grass, sparse flower heads, and a small translucent greenhouse structure on desktop.
- **Daylight:** warm directional sun, soft hemisphere fill, fog and atmospheric sky. Both modes share the same camera pose for useful comparison.
- **Performance:** capped instanced grass/gravel/foliage with reduced mobile budgets; fixed deterministic seeds; proper disposal of V2-only geometry and GPU textures.

**Important limitation:** These are still **original procedural meshes and textures**, not photo-scanned PBR materials or real PlantGen-exported GLB vegetation. Do not label Environment V2 photorealistic solely because the renderer and browser tests work.

## Actual environment performance budgets

| Resource | Desktop / tablet | Phone |
| --- | ---: | ---: |
| Grass card instances | 1,250 | 420 |
| Gravel pebble instances | 1,100 | 380 |
| Hedge foliage cards | 1,485 | 648 |
| Mulch slivers | 670 | 260 |
| Greenhouse | Included | Omitted |
| Ground geometry subdivisions | 44 | 24 |

The visible crop models remain the same across environment modes. These are **instance counts**, not draw calls. Draw-call diagnostics are recorded for QA through the scene dataset; real performance must be measured on representative devices.

## Acceptance criteria

- [ ] Both environment modes load, render and switch without errors across 1920 × 1080, 1440 × 900, 1024 × 768, and 390 × 844.
- [ ] Actual current and V2 environment screenshots exist for **the same camera and same tomato growth stage**.
- [ ] GLB tomato still loads from generated binary in either environment; plant-model modes unchanged.
- [ ] Geometry and mobile budgets are exposed to the browser test; reduced grass/stone/foliage counts on phone.
- [ ] No horizontal overflow and no WebGL errors.
- [ ] Realism passes subjective review against an authentic (non-AI) garden render reference.
- [ ] Mobile GPU performance is measured (real iPhone/Android): avoid opaque claims of 60 FPS.
- [ ] Safe from `/planner` D1/R2 state, writes and `/3d` renderer.

## What PlantGen should and should not do

[PlantGen](https://github.com/jferments/plantgen) includes parametrized tree, shrub and herb species and can export glTF/GLB with multiple LODs. Its tomato and strawberry entries are labelled `procedural_proxy`; PlantGen output cannot simply be assumed realistic. It currently is **not a dependency** of Blenheim Garden.

**Next experiment:** generate a few visually compatible, licensed, offline PlantGen hedge/tree/groundcover GLBs in a separate build/asset-review job, compare *real screenshots* against current instanced greenery, and only then decide whether to replace the procedural foliage. Preserve original source attribution and source-data licenses.

**Afterward:** replace original soil, gravel, weathered wood and foliage textures with responsibly licensed, high-quality PBR atlases, correct normal/roughness maps and better color/lighting calibration. Test these at the normal garden camera distance rather than only close-ups.

## QA evidence

Track the workflow URL, commits and findings in [DESIGN_PROGRESS.md](DESIGN_PROGRESS.md). Treat CI results from predecessor tomato PR #50 as prior evidence only; do not assume they validate this new environment.
