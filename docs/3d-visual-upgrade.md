# 3D visual upgrade

Tracking: #44

This branch introduces reusable rendering helpers for the next 3D garden pass:

- deterministic crop-specific plant scale, height, spread, rotation and positional variation;
- richer soil, timber, path and grass materials;
- lightweight plant contact shadows;
- denser trellis netting helpers;
- tree branch detail helpers;
- climbing-crop detection.

The existing `plantIconSprite(crop, variety)` resolver remains the source of truth for uploaded plant artwork, with crop-specific low-poly geometry retained as fallback.

## Integration order

1. Apply `naturalPlantTransform()` to planting areas and rows after representative positions are calculated.
2. Add contact shadows only in detailed desktop rendering.
3. Replace flat bed/path/ground materials with the surface helpers while preserving measured geometry.
4. Add netting to detailed trellises and branch detail to detailed trees.
5. Tighten default camera framing without changing orbit controls or Fit garden semantics.
6. Keep representative rendering caps and true inspector counts.
7. Verify lint/build and Chromium viewports before merging to main.
