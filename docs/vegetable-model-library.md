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

The library also includes indexed strawberries, blueberries, standalone basil,
and separate basil, chive, thyme and parsley models for the Herbs varieties.
There are 65 catalogue entries and 124 unique desktop/mobile GLB files. The four
tomato entries retain the existing shared refined tomato model. Other indexed
varieties have separate export files, with common species geometry where their
growth habit is similar. These are representative mature plants, not precise
botanical reconstructions of every cultivar.

Models contain the plant only, use metre units and include embedded surface
textures, normal maps and roughness maps. Leaves use smooth centerline bends, gently rippled
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
14.1 MiB. The unique GLBs total about 369 MiB, and the garden downloads only the
models needed for the current plan or selected placement crop.

## Recognisable crop forms

### Surface colour and texture

The material revision adds broad chlorophyll mottling, contrasting vein networks,
subtle pores, warmer leaf edges and variation between individual leaves. Dedicated
surface finishes distinguish waxy brassicas, silver flecks, striped squash and
cucumber skins, melon netting, carrot growth marks, papery alliums and blueberry
bloom. Embedded roughness maps give fruit a softer gloss and roots/bulbs a drier
finish; normal maps supply relief without adding polygons. The original refined
tomato assets are retained.

Desktop and mobile GLBs embed the new maps, so the garden, library and downloaded
models use the same materials. The library and thumbnail renderer use matching,
less washed-out lighting. Texture channels share cached resources, and mesh
batching serializes each shared material once instead of repeatedly encoding its
images for every leaf. The material-only revision preserved plant positions and
triangle counts; the later natural-form revision adds foliage tessellation.

### Natural forms and growth previews

Leaves use denser curved surfaces, asymmetric outlines and smoother edge folds.
Lettuce has softer overlapping layers; peppers have three forked stems, more
secondary foliage and smooth fruit with green-to-ripe shoulder colour. Blueberry
shrubs have curved canes, several leaves per twig, mixed-ripeness clusters and
bell-shaped flowers; raspberry canopies include more shoots. Instance variation
uses stable plant IDs to vary height, width, lean and shade without moving roots.

The library's **Growth stage** and the garden's **Build options → Crop appearance**
offer seedlings, leafy growth, flowering/developing and harvest-ready previews.
Seedlings use separate cotyledon/young-leaf geometry. Later stages share mature
geometry but remove flowers or fruit and their attachments as appropriate, then
scale the canopy. Models export leaf/stem/flower/fruit metadata, which remains
intact through batching. The existing tomato is classified by its material
finish. These are illustrative planning stages, not cultivar-specific biological
growth or harvest predictions. Leaf crops need not flower in the developing view.

The GLB download exports the displayed growth stage. Preview meshes share mature
materials; only generated seedling geometry/materials are disposed on stage
changes. Garden cleanup preserves shared leaf materials while releasing seedling
buffers. Normal Save, coordinates, counts, IDs and history remain unchanged.

Warmer ambient fill makes leaf undersides readable. The isolated viewer has soft
ground shadows; its floor is excluded from downloads. Desktop foliage retains
fine tessellation and existing hairs/seeds, while mobile exports reduce it.
The viewer renders when the camera/model changes or rotation is enabled, so
idle inspection avoids repeatedly drawing the detailed canopy and its shadows.
Garden LOD switches each planting group to reduced geometry at 10 m from its
centre; phones use the mobile level. Zoom/focus changes detail without removing
saved planting positions.

The 15 October revision changes exported mesh geometry used in the garden,
including mobile meshes. Leaves use distinct round, heart-shaped, palmate,
divided and strap profiles with branching or parallel vein textures. Bean
trifoliates, paired pea/broad-bean leaflets, compound potato foliage and simple
pepper leaves use different arrangements. Carrots have secondary feathery
leaflets; leeks form flat fans while onions retain tubular leaves and garlic
has flat blades above cloves. Corn has broad arching blades and stem nodes.

Courgettes form compact bushes with deeply lobed leaves and basal fruit;
pumpkins and melons trail, and cucumbers climb with hanging fruit and tendrils.
Peppers use a shouldered, four-lobed fruit mesh. Broccoli and cauliflower have
tighter curds with different surrounding foliage; Winter Rudolph has a purple
head. Strawberry crowns, blueberry shrubs, raspberry canes, chive tufts, low
thyme and divided parsley remain distinguishable alongside basil.

The models are representative growing plants rather than exact cultivar
reconstructions. Botanical habit references include the RHS
[pea guide](https://www.rhs.org.uk/vegetables/peas/grow-your-own),
[courgette crop sheet](https://schoolgardening.rhs.org.uk/resources/info-sheet/courgette-crop-sheet.aspx)
and [leek crop sheet](https://schoolgardening.rhs.org.uk/resources/info-sheet/leek-crop-sheet.aspx).
Geometry and surface textures are original; these references do not change
Blenheim planting guidance or saved crop spacing.

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
Use `npm run models:export -- --helpers-only` after editing only the shared growth
helper. The exporter transpiles `components/garden-plant-growth.ts` into the
standalone library's `growth.js`; do not edit that generated module directly.

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
