# Detailed plant artwork

The 16 PNG files in this directory were supplied by the project owner for the
Blenheim Garden planner. They are copied unchanged, including their alpha channel.
The exact crop/variety mapping lives in `lib/garden/plant-icons.ts` and is shared
by the 2D planner, inline simulator, and companion 3D view.

The inline simulator caches one sprite material per crop/variety for each scene
build. It retains procedural plant geometry while textures load or if loading
fails, and releases textures when the scene is rebuilt or unmounted. Plant size
variation is deterministic and does not change saved coordinates or counts.

Soil, timber, and grass use deterministic procedural surface textures. No remote
image service or new package is required.

Verification: `npx playwright test tests/visual/plant-art-3d.spec.ts` exercises all
16 artwork mappings, the inline and companion views, camera controls, remounting,
and page overflow at the four configured viewports.
