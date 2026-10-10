# Detailed tomato model test

Open `/3d-models/tomato`, or select **Tomato model** in the `/3d` toolbar.
The isolated viewer contains the revised vegetable-only botanical mesh, with
height, canopy, density and ripeness controls, orbit/zoom, automatic rotation,
reset and GLB export. It does not read or write a garden.

The supplied design was extended with curved leaf surfaces, per-leaf vein UVs,
a bump map, thinner stems, fine hairs, longer side shoots and outward fruit
trusses. The initial model uses 160 cm height, 75 cm canopy, density 5/6 and
85% ripeness. Dimensions are growth parameters rather than exact bounds.

`public/models/tomato/tomato-refined.glb` is the downloadable baseline asset,
with embedded textures and metre units. The viewer's Download GLB button exports
the currently adjusted plant. The frame, bed and scenery are excluded.

The viewer and Three.js modules are served as Worker static assets. There are
no CDN dependencies, credentials, APIs or new packages. Three.js's MIT license
is included in the vendor directory.

## Garden rendering

The revised tomato now renders in `/3d` and the inline 3D garden, including
raised-bed planting areas, ground rows and new editor placements. Other crops
retain their existing models. The existing crop counts, coordinates, selection,
move, duplicate, delete and Save payloads are preserved.

Garden and mobile GLBs are exported from the same procedural source with lower
surface tessellation. They retain the foliage layout, fruit clusters and embedded
textures: 69,728 triangles / 2.63 MB for desktop and 43,600 triangles / 1.86 MB
for mobile. The full standalone asset remains available on the model test page.

Two document-lifetime templates share geometry, materials and textures among
plant clones. Scene edits do not dispose shared template resources. Placement
ghosts clone materials before changing transparency. Tomatoes temporarily use
the existing model while the asset loads; successful loading updates tomato
holders without resetting the camera. Load failures show a status message and
leave the basic model usable.
