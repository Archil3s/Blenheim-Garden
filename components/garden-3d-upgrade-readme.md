# Garden 3D upgrade modules

These modules are intentionally small so the existing measured WebGL garden can be upgraded without replacing its architecture.

`garden-3d-icon-scale.ts` sizes uploaded transparent plant art according to crop habit.
`garden-3d-surface-materials.ts` supplies richer soil/timber/path/grass surfaces and contact shadows.
`garden-3d-natural-features.ts` adds trellis netting and tree branches.
`garden-3d-path-detail.ts` adds lightweight gravel detail.
`garden-3d-ground-detail.ts` breaks up flat grass in detailed mode.
`garden-3d-inspector.ts` formats richer crop inspection data.
`lib/garden/visual-3d-natural.ts` supplies stable, crop-aware natural variation.

All helpers are deterministic and preserve planner measurements and saved counts.
