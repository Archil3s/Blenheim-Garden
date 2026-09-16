# Blenheim Garden — Low-Poly 3D Art Direction

## Goal

The 3D planner uses a bright, readable cartoon / low-poly garden style rather than attempting photorealism. The garden should feel like a polished casual farming or garden-design game while preserving real bed dimensions, crop counts, structures, saved plans, selection, and camera controls.

## Visual rules

- Use flat-shaded or lightly shaded low-poly geometry.
- Prefer a few large, recognisable forms over many tiny realistic details.
- Exaggerate identifying crop features: tomato clusters, strawberry fruit, broccoli crowns, pumpkin fruit, corn cobs, root shoulders, and allium bulbs.
- Use warm timber, dark readable soil, clean greens, and saturated but natural fruit colours.
- Keep silhouettes distinct at normal planner camera distances.
- Add deterministic size, lean, and rotation variation so repeated plants do not look cloned.

## Plant families

`components/garden-lowpoly-plants.ts` owns the detailed cartoon plant families. The stable public entry point remains `createGardenPlant3D()` in `components/garden-plant-3d.ts`, so planner data and placement logic remain independent from the art style.

Current families include tomatoes, strawberries, berry shrubs, cucurbits, lettuce/spinach/chard, brassicas, beans/peas, root crops, alliums, corn, peppers/chillies, herbs, and a generic leafy fallback.

## Dense crop patches

`components/garden-crop-patch-3d.ts` remains responsible for high-count beds. Dense crops use instancing and simplified low-poly leaf/root forms for performance. Larger crops use the detailed plant-family models where their individual silhouette matters more.

## Environment and structures

The unified scene uses the same warm cartoon palette for raised beds, paths, trees, and trellises. Trees use faceted low-poly crowns rather than smooth spheres. Garden structures retain their real dimensions and functions but use brighter flat-shaded materials so greenhouses, sheds, coops, tunnels, and related objects belong to the same visual world.

## HIGH vs MOBILE

HIGH mode may render more plants and richer geometry. MOBILE mode reduces counts and secondary detail but should keep the same crop silhouettes, palette, and overall art direction.

## Adding a crop

1. Add or extend the crop-name classification in `garden-lowpoly-plants.ts`.
2. Reuse an existing family when the growth habit is visually similar.
3. Add a new family only when the crop needs a genuinely different silhouette.
4. Keep geometry low-poly and fruit/vegetable features readable from the normal camera distance.
5. Confirm both HIGH and MOBILE rendering before merging.
