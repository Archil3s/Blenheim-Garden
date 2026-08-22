# Blenheim Garden project context

## Product direction

The current priority is planner UI/UX rather than adding more garden-management feature surface.

Core direction:

- the canvas should read as a **garden first and an editor second**
- beds should feel physical / soil-like rather than like white UI cards
- plants and their true centimetre spacing should dominate the plan visually
- planting boundaries, labels and editing chrome should recede until hover/selection/drag state
- placement should clearly communicate where a crop will land and how much space it will occupy
- catalogue and inspector UI should stay compact, calm and tactile
- preserve real measurements and the existing saved-plan model

## Current planner interaction model

The planner supports Select, Plants, Rows, Bed, Path, Trellis, Tree and Text tools. Objects use 10 cm snap by default and display live drawing measurements. Selected objects support duplicate/delete where appropriate.

### Planting areas and true centimetre spacing

GrowVeg-style planting areas support multiple crops in one bed and can be dragged/resized independently.

`lib/garden/plant-spacing-layout.ts` is the source of truth for plant counts and icon coordinates. Plant centres are positioned using the actual `spacingCm` value at the garden's centimetre scale instead of cosmetic CSS gaps.

Supported patterns are grid/block, staggered, rows, natural and single. The planting inspector displays actual spacing in centimetres and recalculates count after area or bed resizing.

### Planner UX polish layer

The UI polish is intentionally additive and does not change planner persistence or spacing logic. Beds use a warmer raised-bed/soil treatment, planting-area chrome is quiet at rest, hover/selection states are contextual, empty beds are subdued, drag/drop and resize states are clearer, and catalogue/inspector surfaces are compact.

Keep this direction: avoid reverting to large opaque planting rectangles or permanently loud editing chrome.

### GrowVeg-style hover information

`app/growveg-hover-info.css` keeps planted crop labels hidden at rest and reveals crop/variety/count/spacing information as a contextual tooltip outside the planted patch. Row captions follow the same principle. Touch devices rely on selected state rather than hover.

### GrowVeg-style planting gestures

The current planting flow includes click-to-pick-up, live bed footprint preview, click-to-place patches, drag-to-draw planting rows, live length/count feedback, Shift horizontal/vertical locking, Ctrl repeat placement, Escape/right-click cancel and native drag/drop fallback.

### Botanical crop marker system

`components/botanical-plant-icons-bridge.tsx` tags crop render nodes while preserving stored `cropIcon` emoji as fallback metadata.

`app/botanical-plant-icons.css` replaces rendered emoji with original top-down botanical markers for tomato, strawberry, bean, lettuce, pumpkin, carrot, broccoli, raspberry, blueberry and herbs. The same marker language is used in the catalogue, selected crop strip, placement ghosts, planted areas, row previews and saved planting rows.

Dense crops such as carrots/beans are visually smaller and wide-spaced crops such as pumpkins/blueberries are visually larger, but true plant centres remain unchanged.

### Zoom-aware botanical detail

`app/botanical-zoom-detail.css` adds three canvas-only visual detail levels driven by planner zoom. Catalogue/inspector markers remain stable and full-detail.

- **50–70%:** simplified CSS crop silhouettes and smaller visual scale for whole-garden readability
- **80–110%:** the standard top-down botanical SVG artwork
- **120–150%:** crop-specific high-detail overlays such as leaf veins, fruit highlights, centres and surface details

Geometry guarantees:

- zoom detail never changes `spacingCm`, logical plant count or `plant-spacing-layout.ts`
- marker scaling is visual only and does not reflow neighbouring geometry
- measured planting icons retain their existing absolute `left`/`top` centres and inline rotation
- high-detail overlays do not change measured planting icon positioning mode
- catalogue icons do not switch detail when canvas zoom changes

### Horizontal crop palette workspace

`app/palette-workspace.css` begins the workspace-architecture redesign.

On desktop, when the context panel contains the Plants/Rows catalogue:

- the old tall crop sidebar becomes a compact horizontal tray above the canvas
- search, plant type and variety controls sit in one slim control row
- Block / Stagger / Rows / Natural / Single becomes a compact segmented control
- the selected crop is represented as a small in-hand chip
- crops render as horizontally scrolling visual cards using the botanical marker system
- crop cards remain click-to-pick-up and drag-capable
- selecting an existing planting/bed/object returns the UI to the normal side inspector rather than leaving the tray open
- medium desktop widths retain the tray while hiding redundant selected-crop chrome

This establishes the intended workspace split:

**palette for picking → canvas for manipulation → inspector for editing**

Mobile is deliberately unchanged in this first workspace pass. The planned touch version should be a bottom sheet rather than a compressed desktop tray.

### Saved planner payload and storage

`lib/garden/planner-plan.ts` defines `beds`, `plantingAreas`, `rows`, and layout objects. Older plans are normalised to the current model. Visual-only planner work must not introduce a D1 migration, saved-plan schema change, R2/media change or `GARDEN_WRITE_TOKEN` change.

## Next UI priorities

1. visually test/refine the horizontal crop palette at common desktop widths
2. design the Plants/Rows mobile bottom sheet
3. reduce permanent chrome in the left tool rail and top bars
4. make selected-object editing more contextual/floating where practical
5. improve visual previews for beds, paths, trellises and trees
6. improve alignment/snap guides and dimension feedback during object editing

## Current verification status

Before merge/deploy still run:

1. visual desktop testing at common viewport widths and 50%, 70%, 80%, 110%, 120% and 150% zoom
2. mobile/touch visual testing
3. click-placement / drag-row / modifier regression checks
4. build / TypeScript / lint checks
5. production smoke testing

Do not claim those checks passed until they have actually run.
