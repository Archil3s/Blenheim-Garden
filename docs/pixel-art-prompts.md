# Original pixel-garden artwork

Generated with the built-in imagegen tool, with transparent backgrounds.
These are original farming-game illustrations inspired by Stardew-style visual
detail, not copied game assets. The browser renderer uses Canvas 2D.

## Production files

- `public/artwork/pixel-garden/crops-v2.webp`: 6 × 6 cells, 36 plants.
- `public/artwork/pixel-garden/herbs-v2.webp`: 4 × 3 cells, 12 flowers and herbs.
- `public/artwork/pixel-garden/scenery-v1.webp`: 3 × 2 cells, six scenery items.

Plant cells are 192 × 240 pixels; scenery cells are 128 × 160 pixels, all with
a centred ground anchor and transparent margins. Species ordering is defined in
`garden-pixel-assets.ts`. The v2 crop source repairs clipped leaf and flower tips
while retaining the original botanical art direction. Previous v1 assets remain
available for older cached application bundles.
Source images are retained in the task's `outputs/pixel-garden/` directory.
The packing script extracts each cell's main connected sprite bounds, excludes
neighbouring row fragments, resizes with nearest-neighbour sampling and packs
lossless WebP. It does not recolour or repaint generated art.

```powershell
node scripts/pack-pixel-atlas.mjs crops-corrected-source.png public/artwork/pixel-garden/crops-v2.webp 6 6 0,224,437,649,850,1040,1254 192
node scripts/pack-pixel-atlas.mjs herbs-source.png public/artwork/pixel-garden/herbs-v2.webp 4 3 "" 192
node scripts/pack-pixel-atlas.mjs scenery-source.png public/artwork/pixel-garden/scenery-v1.webp 3 2
```

## V2 crop correction prompt

Edit the original garden sprite atlas for production use. Preserve the exact
subjects, ordering, warm detailed botanical pixel-art style, colours, fruit,
veined foliage, upper-left lighting and elevated front viewpoint of every plant.
It is a 6 column by 6 row atlas of 36 sprites. Give every sprite clear transparent
margins on all four sides of its equal square cell, so entire leaf silhouettes,
flower tips and roots are visible, with no cropped tops or sides and no overlap.
Restore missing tips on tomato, carrot, chard, broccoli and Brussels sprout
leaves. Slightly reduce each complete plant within its cell rather than cutting
leaves. Preserve rich illustration detail. Truly transparent background, no soil,
no shadows outside sprites, no labels. Use the original crop ordering listed below.
Consistent bottom-centre anchor; each entire sprite inside its own cell.
This is a corrected game asset atlas, not a garden scene.

Input: original `crops-source.png`. Generated using the built-in imagegen edit
tool with transparency, then packed using the v2 command above. The corrected
source is retained as `outputs/pixel-garden/crops-corrected-source.png` in the
task workspace. Packing preserves native detail without artificial enlargement.

## Crop atlas prompt

Create one original production sprite atlas, exactly six columns by six rows,
36 distinct living vegetable, fruit, herb and native plants. Transparent
background, no labels, grid, soil, pots or UI. Equal square cells, generous
margins, no overlap, bottom-centre plant anchors. Elevated front view for a
classic 16-bit top-down farming garden. Original artwork inspired by the rich
readability of Stardew-style crops; do not copy game assets. High detail: dense
irregular layered leaves, individual branching leaflets, veins, cool shadows,
sunlit edges, textured fruit and flowers, organic asymmetry and hard pixel
clusters. Aim for about 64 × 80 native pixels enlarged with nearest-neighbour
sampling and 8–16 colours per crop. Avoid sparse arrows, flat icons, vector
shapes, photorealism and 3D renders.

Rows, left to right:
1. Tomato, Bean, Lettuce, Pumpkin, Carrot, Broccoli.
2. Raspberry, Strawberry, Blueberry, Basil, Amaranth, Artichoke.
3. Asparagus, Asparagus Pea, Zucchini, Cucumber, Melon, Spinach.
4. Chard, Cauliflower, Cabbage, Kale, Broad Bean, Pea.
5. Beet, Radish, Onion, Garlic, Leek, Corn.
6. Pepper, Potato, Brussels Sprout, Parsley, Lavender, New Zealand native
   broadleaf shrub.

Include characteristic botanical details: tomato branching leaflets, flowers
and fruit; bean pods and broad foliage; crinkled lettuce rosettes; lobed pumpkin
leaves and ribbed fruit; feathery carrots; granular broccoli; raspberry
drupelets; strawberry seeds and white flowers; blueberry clusters; veined basil;
burgundy amaranth panicles; overlapping artichoke bracts; scaly asparagus tips;
winged asparagus pea pods; striped zucchini and yellow blossoms; cucumber
tendrils; textured melon rind; distinct brassica leaves; colourful chard stems;
pea tendrils and pods; root shoulders, onion and garlic bulbs; leek sheaths;
corn husks, silk and tassels; lobed peppers; potato flowers; Brussels sprouts
along the stem; curly parsley; lavender flower spikes; native shrub flowers.

## Scenery atlas prompt

Create ONE original production-ready pixel-art scenery sprite atlas for a cozy
top-down browser farming garden inspired by classic 16-bit farming games.
TRUE crisp chunky pixel art, clear pixel clusters at about 80 to 100 native
pixels per item, no smooth digital painting or photorealism. Consistent
upper-left sunlight, rich greens, warm brown timber, dark coloured outlines,
layered shadow, subtle texture and expressive silhouettes. Transparent
background, no ground, no labels, no text, no UI. Exactly 3 columns by 2 rows,
SIX equal square cells, one isolated sprite per cell with generous clear
transparent gutters and nothing crossing cell edges. Elevated front/top-down
perspective, ground anchor bottom centre. Row 1 left to right: a lush mature
broadleaf tree with irregular layered dense canopy and visible branched trunk;
a distinct evergreen conifer with tiered shaggy pine branches and trunk; a
fruiting apple tree with layered leaf clusters and scattered small red apples.
Row 2 left to right: a warm timber garden tool shed, mossy shingle roof, pane
window, wood grain and iron door hinges; a glass greenhouse with visible
interior plants, timber frame and bright glass highlights; a low flowering
garden shrub with dense leaves and cream, pink and yellow blossoms. All art
original: do not copy actual Stardew Valley assets. These sprites must read as
high-quality detailed game pixel art rather than clunky geometry. Only these
six isolated sprites. Make each sprite fit fully inside its grid cell.

## Flowers and herbs atlas prompt

ONE original production PIXEL ART sprite atlas of twelve distinct flowering
and herb plants for a cozy top-down farming garden. Exactly FOUR columns by
THREE rows, equal square cells, clearly separated generous transparent gutters,
each whole plant within its own cell. Truly transparent background (no ground,
no backdrop, no shadows outside plants), no labels or text. High-detail crisp
16-bit game pixel clusters at 80–100 native pixels per plant, dense organically
layered foliage, coloured dark outlines, upper-left sun highlights, cool green
shadows, individual recognisable flowers and veins; warm inviting original
farming-game aesthetic, do not copy actual Stardew Valley sprites. Elevated
front/top-down viewpoint, living plants rather than harvested bundles,
bottom-centre ground anchor, roots not visible. Make EACH sprite rich and
detailed, no sparse stick plants, no smooth vector or photorealism.

Row 1 left to right: Achillea/yarrow with feathery leaves and broad flat golden
yellow tiny-flower clusters; Agastache with abundant branching broad leaves
and lavender-purple flower spikes; Ageratum with soft round powder-blue fluffy
flowers above compact oval foliage; Agrostemma/corncockle with tall narrow
grey-green foliage and delicate magenta five-petalled flowers.

Row 2: Alyssum low dense cushion of white and cream tiny four-petalled flowers,
dark green fine foliage; Angelica large bush of divided pale green leaves with
spherical pale yellow-green umbels; Anise thin branching stems, feathery foliage
and small airy white flower umbels; Anise Hyssop compact textured serrated
leaves with several violet flower spikes.

Row 3: Aster bush covered in lavender-blue daisies with golden centres and dense
foliage; Astragalus branching pinnate leaves with many small pale yellow pea
flowers; Chives thick tuft of thin green tubular stems with spherical purple
flower heads; Thyme low dense woody herb shrub with tiny rounded leaves and
scattered soft pink flowers. All sprites fit entirely into their cells, no
touching neighbouring plants. This is one game-ready atlas, not an illustration
of a field.
