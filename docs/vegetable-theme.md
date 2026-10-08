# Shared botanical vegetable theme

Vegetables use the tomato artwork's botanical direction: layered foliage, curved veined leaves, darker leaf margins, natural colours and recognizable harvest shapes. Both production detail levels use the same species geometry. Tomato illustrations remain the reference artwork.

The 2D planner resolves 87 vegetable entries to transparent 1024 × 1024 WebP illustrations rendered from that same production geometry. Existing detailed amaranth, artichoke and asparagus PNG illustrations are retained alongside tomato artwork. The generated set includes the remaining planner vegetable varieties and the additional vegetable types already supported by 3D: leafy greens, brassicas, root crops, alliums, legumes, cucurbits, corn, peppers, potato and Brussels sprouts. Cultivars can share species geometry where cultivar-specific details are unavailable; matching assets do not invent botanical distinctions.

The shared leaf geometry contains a curved surface, midrib, secondary veins and dark margins. Corrected outward leaf angles fill rosettes and vines. Beans and peppers have fuller foliage; cabbage has overlapping inner leaves; broccoli/cauliflower have florets; corn has kernels; carrots taper; peppers have lobes. Smooth plant-specific materials do not change structure materials. Desktop and mobile models retain compatible mesh consolidation and casting shadows.

`lib/garden/botanical-artwork.json` maps normalized crop/variety names. Exact varieties resolve first; unknown varieties of a supported crop use its default image. Existing tomato PNGs, detailed flower/herb artwork, V2 SVGs and public method signatures remain available. Audit references retain historical assets for comparison.

To regenerate after changing geometry, save the `/3d-audit` records JSON and run:

```sh
node scripts/render-botanical-artwork.mjs path/to/audit-records.json
```

The script imports the production TypeScript models into a local Playwright Chromium renderer, uses fixed seeds, lights and an orthographic camera, then writes images and the manifest. No garden API or persistent plan is accessed. Generated WebP files are served directly; browsers do not generate plant artwork at runtime. There are no new dependencies.

The vegetable-theme browser test decodes every image and checks all planner vegetable options have detailed art. It captures 2D and 3D with a mocked garden and verifies switching views at all four existing viewports. Existing geometry, audit, realistic bed, plant-art and planner tests provide regression coverage.

The legacy canvas CSS silhouettes are bypassed only for PlantArt nodes that have a real sprite or SVG. Their children have explicit percentage dimensions so font-size-zero rules cannot hide the artwork. Unknown emoji fallbacks keep their previous behavior.

Fitted cameras move farther back on portrait screens. Fog limits now follow the fitted garden sphere so this distance does not wash out the botanical colours.
The refined leaf surface uses an interior grid and smooth analytical normals. Vein ribbons follow that curvature on both leaf faces. Round harvest shapes have baked tonal shading, tomato branches have paired compound leaflets, and asparagus pea resolves to a low-growing legume.
