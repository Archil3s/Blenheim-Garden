# Blenheim Garden — Realistic 3D Upgrade Agent TODO

## Mission

Upgrade the existing **Blenheim Garden** project from a primarily icon/simple-geometry garden planner into a realistic, performant, interactive 3D vegetable-garden visualisation.

Do **not** rebuild the application from scratch.

Preserve:

- Existing garden data
- Existing 2D planner
- Existing plant library
- Existing plant placement
- Existing bed dimensions
- Existing controls and functionality
- Existing saved garden layouts
- Existing production behaviour

The new 3D system must consume the same underlying garden data wherever practical.

## Agent operating rules

Before changing code:

1. Inspect the repository.
2. Identify the current garden renderer.
3. Identify the plant data model.
4. Identify how beds and plant positions are stored.
5. Identify the existing 2D/3D switching system.
6. Identify existing Three.js/WebGL/React Three Fiber dependencies.
7. Run the existing build/tests.
8. Document the current architecture before making major structural changes.

Do not replace a large working renderer simply because modifying it is difficult. Prefer small patches, reusable modules, feature flags where appropriate, backwards-compatible data changes, and incremental commits.

After each substantial change, run type checking, linting if configured, tests if configured, and the production build. Fix regressions before continuing. Never knowingly push broken code to `main`.

## Target experience

The 3D garden should eventually resemble a realistic garden visualisation rather than a collection of icons. Target realistic plants, soil, timber raised beds, mulch/compost, natural plant variation, correct plant scale and spacing, sunlight, dynamic shadows, wind movement, trellises, growth, fruit/vegetable development, seasonal changes, and smooth camera controls.

The 3D view must remain a **garden planning tool**, not merely a decorative scene.

## Phase 1 — Audit current 3D system

- [x] Locate current 3D renderer.
- [x] Locate garden scene component.
- [x] Locate plant rendering logic.
- [x] Locate bed rendering logic.
- [x] Locate camera controls.
- [x] Locate lighting system.
- [x] Locate plant icon/image assets.
- [x] Locate plant database.
- [x] Locate spacing data.
- [x] Locate garden coordinate system.
- [x] Determine units currently used and whether 1 world unit corresponds to 1 metre.
- [x] Identify performance bottlenecks.
- [ ] Record current draw calls if practical.
- [ ] Record approximate FPS on desktop.
- [x] Check mobile/iPhone behaviour.
- [x] Document findings.

Do not start a major renderer rewrite until this audit is complete.

## Phase 2 — Establish real-world scale

Use real metric dimensions throughout the 3D garden wherever possible. Target `1 Three.js world unit = 1 metre`. A 2 m × 4 m garden bed must visually occupy 2 × 4 world units.

- [x] Standardise world scale.
- [x] Preserve existing bed dimensions.
- [ ] Correct plant scale and spacing.
- [ ] Correct trellis heights, path widths and raised-bed heights.
- [ ] Add conversion utilities if existing data uses another unit.

Plant models must not simply be scaled until they look right. Use botanical dimensions from plant metadata where available.

## Phase 3 — Build one realistic demonstration bed

Before converting the entire garden, create one high-quality **2 m × 4 m raised vegetable bed** containing tomato, lettuce, carrot, strawberry, climbing bean, trellis, soil and mulch. This becomes the visual and performance benchmark.

- [x] Realistic timber raised-bed geometry and PBR timber material.
- [ ] Realistic soil material with normal/bump variation.
- [x] Mulch layer.
- [x] Realistic plant placement and scale.
- [x] Natural plant variation.
- [x] Trellis geometry.
- [x] Correct shadows and daylight lighting.
- [x] Test desktop and iPhone/mobile.

Do not convert the whole garden until this benchmark works well.

## Phase 4 — 3D plant asset system

Prefer GLB/GLTF for detailed close-range plants. Create a central reusable plant registry rather than hard-coding assets throughout renderer components.

Suggested definition:

```ts
Plant3DDefinition {
  species
  modelFamily
  growthStages
  matureHeight
  matureSpread
  growthHabit
  fruitType
  fruitColour
  lodLevels
  billboard
}
```

## Phase 5 — Plant model families

Do not create an entirely unique 3D mesh for every cultivar. Build reusable botanical families with metadata-driven variation.

Tomato base models should include cherry, standard, beefsteak, Roma/plum, dwarf and indeterminate. Variety metadata should control fruit colour, size, shape, cluster size, plant height/spread and growth habit. For example, Black Krim maps to beefsteak with large dark fruit; Yellow Pear maps to small yellow pear-shaped fruit; Roma maps to elongated red plum fruit.

## Phase 6 — Core vegetable model library

- [ ] Fruiting: tomato, capsicum, chilli, eggplant, cucumber, zucchini, pumpkin, butternut, squash, kamo kamo.
- [ ] Brassicas: broccoli, cauliflower, cabbage, kale, Brussels sprouts, kohlrabi.
- [ ] Roots: carrot, beetroot, radish, daikon, turnip, parsnip.
- [ ] Alliums: onion, garlic, leek, spring onion.
- [ ] Legumes: bush bean, climbing bean, runner bean, broad bean, pea.
- [ ] Leaf crops: lettuce, spinach, silverbeet, rocket, Asian greens.
- [ ] Other: corn, potato, kumara, asparagus, celery.

## Phase 7 — Fruit, berries and herbs

- [ ] Berries: strawberry, raspberry, blackberry, blueberry, gooseberry, currant.
- [ ] Herbs: basil, parsley, coriander, rosemary, thyme, sage, mint, dill, chives, oregano.
- [ ] Add further families required by the existing catalogue.

## Phase 8 — Growth stages

Support species-appropriate stages: seed/newly planted, seedling, young, established, mature, flowering, fruiting and harvest-ready. Not every species needs every stage.

- [ ] Growth-stage data model.
- [ ] Date-based growth calculation.
- [ ] Manual development override for testing.
- [ ] Smooth scale/morph transitions where appropriate.
- [ ] Swap GLB growth models where necessary.
- [ ] Flower appearance, fruit appearance and fruit ripening.

## Phase 9 — Natural plant variation

Repeated plants must not look cloned. Deterministically vary each plant using its unique ID as a random seed. Vary rotation, height, width, leaf orientation/size, stem lean, fruit distribution, subtle colour and growth progress. Keep scale variation roughly ±5–15% and all variation botanically believable. The same garden must reproduce the same variation after reload.

## Phase 10 — Plant growth habits

- [ ] Vertical plants such as corn, tomato and sunflower grow vertically.
- [ ] Climbers such as peas, climbing beans, runner beans and cucumbers visually interact with nearby trellises.
- [ ] Pumpkins, squash, melons and kamo kamo spread horizontally.
- [ ] Strawberry, lettuce and herbs remain appropriately low-growing.
- [ ] Carrot, potato, beetroot, radish, garlic and onion show appropriate foliage above ground.
- [ ] Consider an optional future soil-cutaway mode for underground crops.

## Phase 11 — Trellis system

Create reusable vertical mesh, string, A-frame, bean frame, pea support, tomato stake and tomato cage objects. Plant metadata should determine support compatibility. Climbers should orient toward or attach visually to the nearest compatible support.

## Phase 12 — Realistic materials

Use physically based rendering for soil, compost, bark mulch, straw, timber, metal, stone, grass, leaves, fruit and water. Use base colour/albedo, normal maps, roughness and ambient occlusion where useful. Optimise texture sizes for mobile.

## Phase 13 — Lighting

Replace flat/game-like lighting with realistic outdoor lighting. Investigate hemisphere/ambient illumination, directional sunlight, environment lighting, physically correct materials, tone mapping, colour management and soft shadows. Keep the garden readable without unrealistically dark shadows.

## Phase 14 — Blenheim sun simulation

Create location-aware sunlight for **Blenheim, Marlborough, New Zealand** using latitude, longitude, date, time and garden orientation. Calculate sun azimuth/elevation, directional-light position, shadow direction and shadow length.

Eventually provide date and time controls so users can observe changing shade. This should become a planning feature, not merely decoration.

## Phase 15 — Shadow system

Use believable shadows with performance-aware quality: high-quality near the camera, simplified at medium distance, and potentially no individual plant shadows at far distance. Measure performance before increasing shadow-map resolution.

## Phase 16 — Wind

Add subtle shader-based movement rather than expensive CPU/rigid-body animation. Response should vary by species: corn noticeable, beans/tomato moderate, lettuce/rosemary slight. Support wind direction, strength and gust variation.

## Phase 17 — Ground and grass

- [ ] Improve ground material.
- [ ] Add grass, paths, soil patches, mulched areas and garden edges.
- [ ] Optional weeds.
- [ ] Use instanced/procedural grass rather than thousands of independent meshes.

## Phase 18 — Performance / LOD

The finished garden may contain hundreds or thousands of visible plants. Implement Level of Detail. Starting concept: full detailed GLB at 0–5 m, simplified model at 5–15 m, low-poly at 15–30 m and billboard/impostor beyond 30 m. Determine actual distances through testing.

## Phase 19 — Instancing

Use `THREE.InstancedMesh` or equivalent wherever many plants share geometry/material. Good candidates include carrots, onions, garlic, lettuce, corn, strawberries, beans, radishes and grass. Avoid hundreds of unnecessary draw calls.

## Phase 20 — Billboard system

Reuse the existing detailed plant icon/image library where suitable for the 2D planner, plant selector, labels, far-distance LOD and loading placeholders. Investigate generating billboard/impostor assets from realistic 3D models.

## Phase 21 — Camera

Provide garden-planning camera modes: orbit, human-eye walk, top/near-orthographic planning, bed focus and plant focus. Camera controls must work well with mouse, touch, iPhone and tablet.

## Phase 22 — Plant selection

A realistic mesh must remain connected to the underlying plant record. Selecting a plant should expose useful information such as cultivar, planted date, age, growth stage, spacing, mature height and expected harvest. Do not disconnect visual meshes from planner data.

## Phase 23 — Spacing visualisation

Use mature plant dimensions to show overlap. Allow users to preview current versus mature canopy size. This is more useful than showing only seedling size.

## Phase 24 — Overcrowding

Calculate plant footprint using mature spread and provide informative overlap indicators. Do not prevent dense planting; provide information rather than enforcing arbitrary rules.

## Phase 25 — Season simulation

Eventually provide a seasonal timeline. Plants should update based on planting date, species, growth rate, expected maturity and harvest period. Future environmental simulation may incorporate temperature/weather.

## Phase 26 — Harvest visualisation

At appropriate stages show tomatoes, peppers, beans, peas, pumpkins, cucumbers, strawberries, corn ears, broccoli heads and cauliflower heads. Fruit should progress from flower to immature/developing to ripe where practical.

## Phase 27 — Mobile performance

The garden must work on modern iPhones and tablets. Consider Low/Medium/High/Ultra quality presets and automatic reductions to shadow quality, texture resolution, grass density, LOD distances, anti-aliasing, pixel ratio and animation density. Do not reduce botanical accuracy merely to improve graphics performance.

## Phase 28 — Asset loading

Do not load the entire plant catalogue immediately. Lazy-load only model families required by the current garden, preload likely nearby assets opportunistically and provide graceful loading placeholders.

## Phase 29 — Asset cache

Cache loaded GLB models, textures, materials and billboard textures. Never repeatedly download/decode the same model for individual plants.

## Phase 30 — 2D + 3D consistency

Both views must use the same garden, bed, plant, position, spacing, variety and planting-date records. Moving a plant in 2D must change its 3D position. Changes in 3D must update the same underlying record. Avoid separate garden states.

## Phase 31 — Kings Seeds / cultivar library

Map the large cultivar library onto reusable 3D botanical models using `cultivar → species → model family → visual modifiers`. Do not create hundreds of unnecessary meshes.

## Phase 32 — Environment details

After core functionality and performance are stable, consider garden fencing, shade house, compost area, water tank, irrigation, hoses, tools, labels, paths, trees, shrubs, flowers, pollinators and birds. These are lower priority than accurate vegetable rendering.

## Phase 33 — Visual quality

Investigate PBR rendering, HDR environment lighting, ACES tone mapping, contact shadows, ambient occlusion, cascaded shadows if justified, alpha-tested foliage, texture atlases, GPU instancing and GPU wind animation. Do not add expensive effects without measuring performance.

## Phase 34 — Open-source references

Study open-source procedural plants/grass, vegetation LOD, billboard impostors, Three.js vegetation, instanced foliage, outdoor lighting, growth simulation and agricultural simulation. Do not copy code or assets without verifying licence compatibility. Record repository, licence, technique studied, any reused code/assets and attribution requirements.

## Phase 35 — Testing

Create benchmark scenes:

- [ ] Scene A: 1 raised bed / 20 plants.
- [ ] Scene B: 5 beds / 100 plants.
- [ ] Scene C: 14 beds / 500 plants.
- [ ] Scene D: full garden / 1000+ plants.

Measure FPS, draw calls, triangles, GPU memory where available, load time, initial bundle size and asset download size on desktop and mobile.

## Phase 36 — Performance targets

Aim for approximately 60 FPS on desktop where practical and 30–60 FPS on modern mobile, with no major interaction freezes and progressive rather than blocking garden loading. Visual quality should degrade gracefully on limited hardware.

## Phase 37 — Development priority

Follow this order unless the repository architecture makes another order clearly safer:

1. Audit existing renderer.
2. Standardise world scale.
3. Build realistic 2×4 m test bed.
4. Implement realistic soil/timber.
5. Add one excellent tomato model.
6. Add lettuce.
7. Add carrot.
8. Add strawberry.
9. Add climbing bean + trellis.
10. Implement natural variation.
11. Implement plant registry.
12. Connect real garden data.
13. Implement instancing.
14. Implement LOD.
15. Implement billboard fallback.
16. Improve lighting/shadows.
17. Add wind.
18. Add Blenheim sun simulation.
19. Add growth stages.
20. Expand vegetable model families.
21. Expand cultivar mappings.
22. Expand herbs/berries/flowers.
23. Performance optimisation.
24. Environmental details.

## First major milestone

The user can open Blenheim Garden, switch to 3D, select a **2 × 4 m vegetable bed**, and see something convincingly resembling a real raised vegetable garden with realistic soil, timber, tomato plants, lettuce, carrots, strawberries, climbing beans, trellis, correct spacing, natural variation, sunlight and shadows. It must run acceptably on mobile.

## Second major milestone

Convert the existing garden layout into the new renderer using existing bed positions, plants, cultivars, spacing and planting information. Do not require the user to rebuild the garden manually.

## Third major milestone

Add growth and seasonal simulation so changing date/time appropriately changes plant size, maturity, fruit development, sun position and shadows.

## Definition of done

The finished system should combine **Garden Planner + Garden Simulator + Realistic 3D Visualiser** and visually help answer:

- What is planted?
- Where is it planted?
- How large will it become?
- Is spacing realistic?
- What will the bed look like when mature?
- Which plants require supports?
- Where will vines spread?
- How will sunlight and shade affect the garden?
- What should the garden look like later in the season?

The existing Blenheim Garden planner remains the source of truth.

## Codex continuation rule

When working autonomously:

1. Read this file.
2. Inspect current repository state.
3. Check completed TODO items.
4. Select the next logical unfinished task.
5. Make the smallest safe implementation.
6. Test it.
7. Update this TODO file.
8. Record relevant architectural decisions.
9. Commit working progress.
10. Continue only when the previous change is stable.

If a task would require a destructive rewrite, stop and document why before proceeding. Do not silently remove existing functionality to simplify implementation.

## Current priority

**Complete the demonstration-bed benchmark.** Record desktop/mobile performance, improve soil surface variation, then extract the five benchmark crops into a shared plant registry before expanding the catalogue.
