# 3D Showcase — botanical modelling acceptance

**Route:** `/3d-showcase`  
**Branch:** `feature/3d-showcase-comparison`  
**Phase:** 3D prototype / comparison, 1 November 2026  
**Production plans:** untouched; `/3d` and `/planner` are not altered.

## Purpose

Give the user a genuine side-by-side-in-time toggle of the existing low-poly generator vs a new botanical prototype *inside the running Three.js application*.

## Contents

One measured **2 × 4 m demonstration bed**, shared between the two rendering modes:
- two tomato plants — `Sungold` fruit, compound foliage, clusters and calyxes;
- three climbing pea plants — low-cost stems, pods, opposite leaflets, curling tendrils and a shared 1.8 m trellis;
- four strawberries — low trifoliate crowns, drooping shaped fruit, surface seeds;
- timber grain, soil texture, mulch, stone paths and a fixed lighting configuration;
- orbit camera, reset, fixed comparison arrangement and mode switch.

These are hand-coded procedural **meshes and CanvasTexture materials**, *not* Blender-exported realistic GLBs. The image-generation concept from the prior discussion was a visual target, not an output guarantee. This first experimental model must not be called photorealistic.

## Acceptance criteria
- [x] Both modes show exactly the same bed, placement and camera (source + screenshots verified).
- [x] `Current low-poly` uses the original `createGardenPlant3D` generator without modifying it.
- [x] `Botanical prototype` uses separate, higher-detail plant silhouettes and textured leaves.
- [x] No calls to garden read/write APIs; no persisted state, no touches to saved plans (code path reviewed).
- [ ] Orbit and pinch zoom manual tests on hardware pending. Reset button and mode switch passed browser automation.
- [x] 1920, 1440, 1024 and 390px screenshots captured for *both* modes ([successful screenshot job](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231475)).
- [x] No JS exceptions or horizontal page overflow in the focused four-viewport browser test.
- [ ] Real iPhone performance and repeated toggling/context recovery pending.
- [ ] Independent user review of realism before merging any model renderer into `/3d`.

## Visual feedback questions

1. Are **tomato** compound leaves and fruit clusters believable at normal zoom?
2. Do **pea** vines actually read as climbing peas? Are tendrils and pods visible?
3. Are **strawberries** recognizable, with believable crown and berries?
4. Does the soil/timber lighting improve realism, or does the bed still feel toy-like?
5. Is the difference substantial enough to justify Blender/glTF asset work?

Log specific observations in [DESIGN_PROGRESS.md](DESIGN_PROGRESS.md). Do not replace the production 3D scene based only on generated reference images.

## Next iteration, if prototype lacks realism

Generate/curate authored **Blender assets** with species-correct leaves, high-resolution cutout/albedo/normal/roughness textures, multiple growth stages and 2–3 LOD tiers. Optimize output with `glTF-Transform`, evaluate licensing, test stable 60/30 fps targets on representative desktop/mobile hardware. Procedural Plant Lab and PlantStudio-Blender remain modelling *research references*, not current dependencies.

## Screenshot review — second pass (1 November 2026)

- [GitHub Actions screenshot evidence](https://github.com/Archil3s/Blenheim-Garden/actions/runs/41290231475) includes both rendering modes at four viewport sizes.
- The second pass enlarged the tomato canopy, pea and strawberry leaves, reduced washed-out lighting and moved the camera closer. Tested successfully on `d677c1b3`.
- **Critical limitation:** The result remains a **stylized procedural study**, visibly less realistic than the reference concept image. No true photogrammetry/PBR leaf atlases or Blender-authored GLB assets are present.
- The showcase is valuable as a working control/scene prototype, not as the final botanical asset standard. Before replacing production models, start a separate glTF asset pipeline and compare genuine Blender models.
- The broader pre-existing visual suite has unresolved failures; the dedicated showcase test and standard Build/Design smoke pipelines passed. No claim of complete application-wide regression clearance.
