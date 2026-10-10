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
is included in the vendor directory. The full model is intentionally tested in
isolation before using its geometry for repeated crops across the garden.
