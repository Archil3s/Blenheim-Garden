# Vegetable model library

Open `/3d-models` or choose **Vegetable models** in the 3D garden toolbar.
Choose a vegetable and variety, orbit/zoom the plant, switch to mobile detail,
rotate it and download its GLB. The library makes no garden API calls or saves.

The catalogue covers all 10 vegetable types and all 30 variety entries in
`lib/garden/plant-catalog.ts`, plus 19 additional vegetable types already
supported by production rendering: zucchini, cucumber, melon, spinach, chard,
cauliflower, cabbage, kale, broad bean, pea, beet, radish, onion, garlic, leek,
corn, pepper, potato and Brussels sprout. Raspberry now has a dedicated mesh for
each of its four indexed variety entries, using the same representative cane form.

There are 53 catalogue entries and 100 unique desktop/mobile GLB files. The four
tomato entries retain the existing shared refined tomato model. Other indexed
varieties have separate export files, with common species geometry where their
growth habit is similar. These are representative mature plants, not precise
botanical reconstructions of every cultivar.

Models contain the plant only, use metre units and include embedded surface
textures and normal maps. Leaves use smooth centerline bends, gently rippled
margins, fine serrations, raised midribs, branching vein textures and vertex
colour variation. Stems taper along curved paths. Head lettuce and cabbage
leaves wrap around the head rather than intersecting as folded planes; butterhead
keeps an open outer rosette. Species features include granular florets,
layered artichoke bracts, curved asparagus spears with overlapping tip scales,
compound leaves, winged pods, tendrils, fruit ribs, corn silk and seed plumes.
Desktop and mobile exports use different surface tessellation and foliage counts.
Raspberry fruit is made from individual drupelets around an open rim, with leafy
calyces, compound foliage, fine thorns and arching canes. Carrot roots have rounded
shoulders and fine growth rings. Desktop embeds 512-pixel colour/normal textures;
mobile uses 256-pixel textures and reduced surface tessellation. Leaf colour
attributes use normalized bytes, keeping values valid and reducing buffer size.
Reduced mobile leaf and bud counts are spread across the mature stem height,
preserving the upper canopy and crop silhouette.
Shared indexed geometry reduces download sizes; the largest file is about
6.40 MiB. The total library is about 161.9 MiB, and the garden downloads only the
models needed for the current plan or selected placement crop.

## Garden integration

`components/garden-plant-3d.ts` remains the public entry point. The unified garden
loads required vegetable templates in batches of four. After loading, only
affected planting-area/row holders rebuild. Camera position and planner counts,
placements, coordinates and persistence are preserved. Root and allium models
use planting offsets so roots sit below the soil in the garden while remaining
fully visible in the isolated viewer/download.

Loaded mesh geometry/materials/textures are shared between clones. Scene deletion
must preserve resources marked `sharedPlantResources` or `sharedTomatoResources`.
Placement previews clone materials before applying transparency and refresh when
the selected model finishes loading. Failed downloads show the affected crop
names and retain basic plants and editing. Reloading or requesting the model
again retries failed downloads.

## Regeneration

With existing dependencies and Playwright Chromium installed:

```sh
npm run models:export
```

After a complete export exists, regenerate one crop without dropping other
manifest entries using `npm run models:export -- --crop=Lettuce`.
Use `npm run models:export -- --mobile` to regenerate only mobile files.

The generator uses original code-defined geometry and procedural textures.
It exports binary GLBs and transparent 512-pixel library thumbnails into
`public/models/vegetables/`, then writes `manifest.json` with measured bounds,
triangle counts, texture/mesh counts and file sizes. It validates finite vertices,
nonempty textured geometry and a ground-level origin before writing a model.
It never reads or writes garden storage.

Inspect the complete thumbnail catalogue and real 3D models after regeneration;
export success alone does not prove visual quality. Run lint/build and the model
and editor browser regressions at all four configured viewports:

```sh
npm run lint
npm run build
npx playwright test tests/visual/vegetable-models.spec.ts tests/visual/tomato-garden.spec.ts tests/visual/garden-3d-editor.spec.ts
```

The browser checks parse every unique GLB and verify embedded normal maps,
capture asparagus/raspberry/lettuce/broccoli at both detail levels, exercise library selection/mobile
detail/download, render all indexed vegetables in beds and rows, load newly
selected varieties, verify inline 3D, and simulate download failure/recovery.
Garden API calls are mocked for safe persistence and editing tests.
