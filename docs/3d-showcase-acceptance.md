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
- [ ] Both modes show exactly the same bed, placement and camera.
- [ ] `Current low-poly` uses the original `createGardenPlant3D` generator without modifying it.
- [ ] `Botanical prototype` uses separate, higher-detail plant silhouettes and textured leaves.
- [ ] No calls to garden read/write APIs; no persisted state, no touches to saved plans.
- [ ] Orbit, pinch zoom and reset work on desktop and mobile.
- [ ] 1920, 1440, 1024 and 390px screenshots captured for *both* modes.
- [ ] No JS exceptions or horizontal page overflow.
- [ ] Mobile performance acceptable; no fatal WebGL context loss when switching repeatedly.
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
