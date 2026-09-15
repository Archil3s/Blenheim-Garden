# 3D visual upgrade status

Branch: `feature/3d-visual-upgrade`
Issue: #44

## Added

- Crop-specific visual profiles.
- Stable natural plant variation.
- Climbing crop detection.
- Soil/timber/path/grass material helpers.
- Plant contact-shadow helper.
- Trellis netting helper.
- Tree branch helper.
- Rich crop inspector formatter.
- Path detail helper.
- Ground variation helper.
- More useful camera/rendering defaults.
- Manual viewport and interaction verification checklist.

## Safety

No planner schema, D1 persistence, 2D measurements, plant counts, saved spacing or existing plant-icon resolver has been replaced. Integration into the existing WebGL component must preserve those sources of truth.
