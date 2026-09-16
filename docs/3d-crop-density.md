# Dense 3D crop rendering

The unified Three.js garden renderer uses a hybrid crop rendering system designed to make full garden beds read as planted crops rather than sparse symbolic markers.

## Rendering strategy

`components/garden-crop-patch-3d.ts` renders dense crops with `THREE.InstancedMesh` and keeps larger or structurally distinctive crops on the detailed species renderer in `components/garden-plant-3d.ts`.

Dense instanced crop families include:

- leafy rosettes such as lettuce and spinach
- alliums such as onion, garlic and leek
- root-crop tops such as carrot, beetroot, radish, daikon and turnip
- compact herbs such as basil, parsley, coriander, mint, oregano, thyme and sage

Detailed crop families retain individual plant geometry, including tomatoes, corn, brassicas, beans, peas, berries and cucurbits.

## Visual goals

- honour the planner's intended plant count and spacing more closely
- preserve grid, staggered, row and natural planting patterns
- introduce deterministic rotation, scale and placement variation
- avoid clone-like repetition within a bed
- keep desktop beds visually dense without creating hundreds of separate draw calls
- use lower instance limits on mobile

## Performance

Dense crop patches use a small number of shared geometries and materials with per-instance transforms and colours. Desktop dense patches are capped at a practical visual maximum while mobile uses lower caps. Large plants use lower per-bed limits and the crop-specific procedural model.

The unified renderer calls `addGardenCropPatch3D` for planting areas and `addGardenCropRow3D` for rows.
