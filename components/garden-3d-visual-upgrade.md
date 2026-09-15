# Renderer hook points

Use `garden-3d-visual-upgrade.ts` from `garden-webgl-visual.tsx`.

- `naturalPlantTransform` + `plantBillboardScale` in planting-area and row loops.
- `addContactShadow` immediately below detailed plants.
- `makeSoilMaterial`, `addSoilDetail`, `makeTimberMaterial`, `addWoodGrain` in `addBed`.
- `makePathMaterial` + `addPathDetail` in `addPath`.
- `addTrellisNetting` in detailed `addTrellis`.
- `addTreeBranches` in detailed `addTree`.
- `addGroundVariation` after garden ground creation.
- `detailedGardenCamera` / `compactGardenCamera` at camera creation and Fit garden reset.
- `cropInspectorLines` for planting-area inspector details.

Do not alter saved planner coordinates, counts, spacing or the existing `plantIconSprite` resolver.
