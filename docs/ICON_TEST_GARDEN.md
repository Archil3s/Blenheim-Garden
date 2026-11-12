# Icon Test Garden (read-only)
 
Route: `/test-garden` (also linked from the homepage and Garden Planner > More).
 
## Purpose
 
This is an isolated QA template, **not** an existing garden plan or a planting recommendation. It does not call garden save APIs, mutate D1, write to R2, publish live plans or override local drafts. It intentionally has no "Save" action.
 
## Coverage (computed from source on the server)
 
- **Kings Seeds**: every record in `lib/garden/kings-seeds-varieties.json`. Renders the same source path as `supplierPlantIcon()`, including supplied-art overrides.
- **Rasmussen**: every record in `lib/garden/rasmussen-varieties.json`, showing its catalogue SVG and (where one exists) a separate concept PNG comparison from batches 11–14.
- **Reference catalogue**: every key in `lib/garden/catalogue-art.ts`, using actual `public/plant-icons/catalogue` SVG files.
- **Planner extras**: crop/variety combinations built by `lib/garden/plant-catalog.ts` that are not already represented by a supplier pair. Renders through the actual `PlantArt` fallback stack (reference atlas, v2, sprites and generic fallback).
 
This includes duplicate varieties across different *sources* intentionally, so artists can compare their icon representations without one silently replacing the other.
 
## Interaction
 
1. Open `/test-garden`.
2. Filter by catalogue, crop or search.
3. View in **Garden beds** or **Icon gallery** mode.
4. Select a plot to see crop, variety, source and icon URL/renderer.
5. Open the linked source SVG, and compare with a separate PNG where available.
6. Broken image counts track only icons loaded during the current session; use **Show all** and scroll through the page for more coverage. Generic fallback art may still require manual review.
 
Default page limit is 72 plots for mobile performance; pagination and **Show all** make every entry accessible. This is a visual audit, not a live model of true crop spacing or garden-scale beds.
 
## Known artwork caveats
 
Rasmussen concept batches include adapted/reused AI drawings not verified against cultivars. In particular, batches 09–10 only have GitHub manifests at the time of this QA page's creation, not their individual PNGs on `main`. The test page does not report those as confirmed PNG assets. There are existing supplier SVG icons independent of the PNG concept batches.
 
## Verification
 
Run `bun run build` and check the `/test-garden` route on desktop and mobile. Select a supplier crop, a planner-only crop and a Rasmussen variety with a concept PNG; check that saved gardens remain unchanged after visiting the route.

## All new icons · showcase bed

Open `/test-garden#generated-bed` or use **Garden → All new icons · showcase bed** from the 2D planner.
This dedicated read-only mode places **every `generated_qa_passed` catalogue illustration** in **one display bed**, one plot per supplier variety, with the crop and variety labelled beneath the 2D PNG.
It currently includes 429 Kings Seeds and 20 Rasmussen images. Supplier identities are kept separate, including the two Anaheim artworks, which cannot be distinguished by the live planner's crop/variety-only key.

Use the search and catalogue controls to inspect a subset; **Reset filters** restores the complete approved-artwork bed.
Selecting an icon opens the existing artwork inspector with its 512px master and botanical reference.
The bed is a visual QA display, **not a physically spaced planting recommendation**. It never loads or saves the user's working plan, never modifies D1/R2, and never overrides local garden drafts.


## Editable sample in the real 2D planner

Use **/planner → Garden → Editable icon sample bed · all approved varieties**.
Unlike the read-only `/test-garden` gallery, this loads a real, editable planner template with one large bed and one actual planting area for each QA-approved supplier PNG. Plantings have correct crop and variety identifiers, are selectable in the standard inspector, and display the approved 2D icons.

When two suppliers have the same crop and variety (currently Anaheim chilli), the sample planting adds a supplier suffix to the displayed variety name to retain the two distinct approved image mappings. Saved ordinary plantings are unaffected.

**Safety:** Loading a template replaces the current unsaved draft after confirmation. The existing Undo and **Restore previous draft** actions can recover that draft. To save the test bed without replacing an existing cloud garden, first create a separate named garden. Clicking the template alone does not write to D1. This oversized botanical icon sample is for visual verification, not for physically accurate planting densities or seasonal cultivation.
