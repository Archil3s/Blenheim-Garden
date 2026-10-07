# 3D visual audit

Open `/3d-audit` after starting the application. This route is a generated asset
showroom, not a saved garden. No garden API, active-garden storage, planting
history, records or save controllers are used. The root planner bridges already
exclude routes beginning with `/3d`.

## Catalogue and render paths

The build-time catalogue combines every planner crop/variety, every artwork
mapping and alias, all V2 icon keywords, all canonical geometry kinds, literal
crop aliases from current and legacy resolvers, every structure preset, and all
PNG/SVG/WebP/JPEG files under `public/plant-icons`. Crop aliases are retained
separately so incorrect resolver mappings remain visible. They are not all
independent botanical crops. IDs are deterministic for a given catalogue.

Every structure preset appears at default, half and 1.5× dimensions, respecting
the production renderer's minimum dimensions. Beds, trees, paths, trellises,
rows, boundary fencing, ground decoration and the demonstration bed exercise
the shared production renderers. Tree canopy sizes exercise the single supported
tree visual type; the project has no separate fruit-tree geometry registry.

Production mode calls `createGardenPlant3D` and the existing structure alias.
Legacy artwork uses the existing sprite material/atlas mapping and detail scale;
Legacy geometry calls the existing crop-only factory. Original V2 artwork is
displayed separately as artwork references. It is labelled as such rather than
counted as a canonical production plant renderer.

Opaque meshes with identical material definitions and compatible attributes
are merged within each specimen, preserving vertices, transforms, triangles,
scale and appearance. Transparent meshes retain production ordering. Inspector
counts describe the original factory output; performance counters describe the
actual rendered scene, including labels and debug helpers.

Low detail and phone viewports use smaller label textures with identical text
and world dimensions. Repeated original artwork shares GPU image sources while
retaining the production atlas offsets, materials and per-entry error callbacks.

## Controls

- Show all resets search/filter and frames the complete atlas.
- Search by crop, variety, name or ID. The scrollable catalogue index gives
  access to every specimen at all viewport sizes.
- Select a model, its scene label or an index entry to inspect it and frame a
  close-up. Zone jumps and camera presets keep small plants accessible alongside
  much larger structures.
- High uses production desktop detail. Low or Force mobile uses production
  mobile detail, independently of viewport and camera distance. Medium is an
  explicit High alias because production exposes only two levels.
- Bounds, origins and the 10 cm / 1 m grid use metre coordinates.
- Screenshot mode hides panels/navigation and retains scene labels and badges.
  Escape or the small exit button restores controls. Overview fits all specimens;
  use zone/close-up views or a larger browser viewport to read small labels in
  a catalogue containing hundreds of physically scaled objects.

## Warnings and known limits

Plants have spacing metadata but no authoritative mature height/spread registry.
Their existing geometry is never rescaled to invented dimensions. All plant
entries display SIZE FALLBACK with their measured height/spread in the inspector.
Generic `leafy` resolution is marked GENERIC FALLBACK.

SHARED MODEL compares geometry, transforms and material colours using a constant
internal random seed, so incidental plant variation cannot hide shared models.
Display models use stable crop/variety/ID seeds. Shared geometry is a review
warning, not proof of an error; distinct artwork sharing that geometry is noted.

Conservative bounds checks mark floating (>15 cm above ground), mostly buried,
or extremely small/large plant geometry. Original artwork failures add a magenta
wireframe placeholder and ASSET ERROR without silently hiding the specimen.
Planner text has no current 3D renderer and always shows MISSING.

Structure bounds are compared with requested width, height and depth. Large
differences receive DIMENSION MISMATCH as a review warning: overhangs, additional
coop runs or renderer clamps may explain a difference. All geometry warnings are
also shown on scene labels. Bounds remain visible through the neutral ground so
buried geometry can be inspected.

The verified registry snapshot contains 204 plant pairs (91 named pairs and 113
default/alias pairs), 36 structure types at three sizes, 20 other rendered objects,
16 V2 artwork references and one missing text renderer. The 117 crop names include
aliases; the planner itself has 26 crop options. Production mode uses true 3D for
all 204 plants, including 49 generic fallbacks. The 16 sprites are artwork
references. There are 198 shared-model plant entries, 24 structure dimension
warnings, and three mostly buried hoop-arch specimens (S046–S048). These counts
overlap. Every plant has SIZE FALLBACK because mature-size metadata is absent.

Validation exceptions inherited from the project: the phone
`plant-art-3d.spec.ts:41` expectation for all 16 PNG responses fails on the earlier
unmodified production baseline as well. Standalone `tsc --noEmit` reports the
unchanged implicit `column` parameter in `garden-plan-persistence.spec.ts:16`.
The actual Next production typecheck/build passes. Flutter commands are not
applicable to this Next.js repository: formatting finds no Dart files, analysis
finds no issues, and `flutter test` reports no `test` directory.

Automated tests cover catalogue completeness against the actual registries,
structure variants, IDs, search, filters, inspection, screenshot mode, detail
forcing, deterministic shared-model fingerprints, asset failure placeholders,
and absence of all Storage method calls and `/api/` requests on the audit route.
Run `bun run visual:test tests/visual/3d-audit.spec.ts` for all four viewports.
