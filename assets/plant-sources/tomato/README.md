# Authored tomato source assets (future)

This directory is reserved for the editable source and license/provenance of **future high-fidelity tomato models**. No external model has been imported.

The working preview currently builds original, deterministic starter GLBs from `scripts/3d/generate-tomato-assets.mjs`. Do **not** put a `.glb` in `public/assets/plants/tomato` and assume it will persist: the build regenerates that directory.

When a vetted Blender/photogrammetry model is ready:

- Record creator, source URL, exact license, attribution, allowed modification and any redistribution restrictions in this folder.
- Keep an editable Blender source/project or documented original authoring pipeline.
- Export stage-specific, self-contained GLBs with PBR textures; validate triangle budgets, origin and metre scale.
- Add an explicit asset-import pipeline step that selects authored GLBs instead of generated starter assets.
- Test all 4 browser viewports and compare directly with the original photorealistic target image before replacing the production `/3d` renderer.

See [3d-tomato-asset-pipeline.md](../../docs/3d-tomato-asset-pipeline.md).
