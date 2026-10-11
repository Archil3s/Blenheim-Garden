# Plant artwork and upright structure geometry

## Structure corrections

Both structure renderers share `garden-tunnel-geometry.ts`. Hoops follow an
upright elliptical curve, with their feet on the ground and crown at the
requested height. Covers follow the same ellipse along the requested depth;
they no longer stretch the cylinder's depth axis or offset a circular shell.
Polytunnels, low hoops, walk-through hoops, row covers, insect/frost covers,
cloches and garden/cattle/bean/cucumber arches use this geometry.

Tests cover 11 structure kinds, three sizes, both detail levels and both
renderers: 132 combinations. The showroom retains the actual production
renderers and dimensions. Chicken-coop ramps still trigger a dimension review
warning; they were not arbitrarily resized.

## Plant and icon design

Leaves have folded surfaces, restrained shading, finer lobes and visible veins.
Tomatoes distinguish beefsteak ribbing, Roma/grape elongation, pear tapering,
green/pink/cream/orange fruit, striped colour, and dwarf/trailing habits.
Lettuce, pumpkin and carrot varieties also have distinct production geometry.
Nineteen additional botanical models represent flowers, herbs, asparagus,
artichokes, potato and Brussels sprouts that previously used generic foliage.

Twelve original SVG icons distinguish the four planner varieties of lettuce,
pumpkin and carrot. The 2D planner now prefers mapped detailed artwork over a
generic family SVG. Its existing component interface remains unchanged.
The two corrupt tomato PNGs were replaced with transparent 1280-pixel
illustrations made with the built-in imagegen tool. Other original bitmap
artwork remains unchanged.

Compatible opaque meshes are merged in both production plants and the audit.
Positions, normals, vertex colours and material appearance are preserved.
Dense beds continue using their existing instanced approximations; this change
does not increase saved plant counts or remove mobile rendering limits.

## Audit and limits

Filtered specimens are packed together for comparison. Zone headings are
hidden in focused views, and plant labels are smaller relative to the models.
Show all restores the deterministic complete layout. No garden data is read or
written by the audit route.

The catalogue contains 209 plant entries, including 91 named variety pairs,
108 structure specimens, 20 other rendered objects, 28 artwork references and
one unsupported text renderer: 366 specimens. Three unspecified entries
(Herb, Herbs and Leafy) deliberately retain a generic model. Existing shared
models remain labelled rather than implying every cultivar has unique geometry.
Mature height/spread data is still absent, so plants retain SIZE FALLBACK.
Artwork references do not count as production plant sprites.

Open `/3d-audit` to inspect current per-ID warnings and measured bounds.
Plant IDs can change as newly discovered catalogue entries are added;
structure IDs remain stable. Do not use audit IDs as saved garden identifiers.

## Validation

Run lint, the normal production build and the visual suite. The new
`plant-structure-quality.spec.ts` checks upright arch geometry, important
variety distinctions without random-seed differences, SVG mappings, native
image decoding, high-resolution replacements and showroom screenshots across
desktop, laptop, tablet and phone. Existing tests remain unchanged.

Flutter commands do not apply to this Next.js repository: Dart formatting
finds no files, Flutter analysis finds no issues, and Flutter testing reports
that no `test` directory exists. Next production typechecking is the build gate.
Standalone TypeScript checking has the previously documented implicit `column`
parameter in the existing persistence test.
