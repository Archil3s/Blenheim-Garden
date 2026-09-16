# 3D Architecture Audit

## Runtime map

- `components/garden-workspace-realistic.tsx` is the planner's inline Three.js renderer.
- `components/garden-webgl-visual.tsx` is the standalone 3D visual route.
- `components/garden-view-mode-bridge.tsx` switches the planner between 2D and 3D without changing persisted plan data.
- `components/garden-structure-3d.ts` owns the shared structure meshes.
- `components/garden-scene-artwork.ts` owns procedural surface textures and plant artwork.
- `lib/garden/planner-plan.ts` is the persisted plan schema.
- `components/garden-planner.tsx` currently contains the plant catalogue and default spacing metadata.
- `lib/garden/plant-spacing-layout.ts` calculates planting counts and centre positions.
- `lib/garden/plant-icons.ts` resolves the SVG/PNG artwork under `public/plant-icons/`.

## Scale and coordinates

The plan is stored in centimetres. Both renderers convert centimetres to Three.js world units with `cm / 100`, so one world unit equals one metre. Plan positions are mapped from the 900 × 1080 cm planner surface around the world origin. Bed width/depth and structure width/depth/height are preserved through that conversion. Crop spacing is available as `spacingCm`, but the live renderer still needs one shared plant-definition registry for mature height and spread.

## Camera, lighting, and interaction

The inline scene uses a perspective camera, orbit controls, fog, a hemisphere light, ambient fill, and a shadow-casting directional sun. Mobile lowers pixel ratio, antialiasing, shadow-map size, grass density, and benchmark crop density. Raycasting walks from the hit mesh to inspect metadata and highlights the logical selection root.

## Performance risks

- Inline and standalone renderers duplicate scene setup and plant-placement logic.
- Most plants are independent meshes; large plans will become draw-call bound without instancing or merged geometry.
- There is no distance-based plant LOD yet.
- Material and geometry ownership must remain explicit because scene rebuilds dispose content resources.
- Renderer draw calls, triangle counts, FPS, and mobile memory have not yet been recorded in a repeatable benchmark.

## Incremental decision

The first milestone adds an isolated, deterministic 2 × 4 m demonstration bed behind a non-persisted `Demo bed` toggle. It proves real scale, mature crop silhouettes, crop spacing, trellis support, timber construction, soil/mulch layering, selection metadata, shadows, and mobile degradation without migrating saved plan data. The next milestone should extract the five crop definitions into a shared plant registry, then add repeatable render telemetry before expanding the catalogue.