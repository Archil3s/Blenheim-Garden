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

The planner supports:

- Select — move, resize and edit
- Plants — click a crop to pick it up, move over a bed, click to place a patch, or drag to draw a row
- Rows — draw planting rows directly
- Bed — click-drag to create and resize measured beds
- Path — click-drag and edit width/label
- Trellis — click-drag and edit height/post spacing/label
- Tree — click to place, then move/resize canopy and rename
- Text — click to place, then move/edit text and font size

Objects use 10 cm snap by default and display live drawing measurements. Selected objects support duplicate/delete where appropriate.

### Planting areas and true centimetre spacing

GrowVeg-style planting areas support multiple crops in one bed and can be dragged/resized independently.

`lib/garden/plant-spacing-layout.ts` is the source of truth for plant counts and icon coordinates. Plant centres are positioned using the actual `spacingCm` value at the garden's centimetre scale instead of using cosmetic CSS gaps.

Supported patterns:

- grid / block
- staggered
- rows
- natural
- single

The planting inspector displays actual spacing in centimetres and recalculates count after area or bed resizing. Large planting areas are sampled for rendering performance while preserving the logical plant count.

### Planner UX polish layer

The UI polish is intentionally implemented as additive CSS/bridge layers without changing planner persistence or spacing logic.

It currently:

- gives beds a warmer raised-bed / soil treatment with a subtle soil texture
- reduces permanent planting-area borders/backgrounds so plant markers carry the visual weight
- strengthens hover/selection states only when needed
- gives empty beds a quieter add/empty treatment instead of another heavy label
- improves grab/grabbing cursor feedback for beds, planting areas, rows and layout objects
- improves selected-bed and selected-planting handles/outlines
- makes crop catalogue cards and placement modes easier to scan and target
- adds a concise planting flow and contextual explanations for Block, Stagger, Rows, Natural and Single
- softens the inspector into clearer grouped surfaces
- reduces visual weight of the canvas grid while preserving the 10 cm / 50 cm planning scale
- includes mobile and reduced-motion adjustments

Keep this direction: avoid reverting to large opaque planting rectangles or permanently loud editing chrome.

### GrowVeg-style hover information

`app/growveg-hover-info.css` adds contextual plant information without copying GrowVeg code or artwork.

Current behaviour:

- planted crop labels are hidden at rest
- hover or selection reveals the existing crop / variety / count / spacing text as a compact tooltip outside the planted patch
- the parent bed temporarily allows contextual tooltip/handle overflow only while a planting is hovered or selected
- the plant marker layer remains clipped to the planted patch, so markers never spill into neighbouring beds
- the separate spacing badge is hidden because spacing is already present in the tooltip
- row captions follow the same contextual hover/selection principle
- touch devices rely on selected state rather than hover

### GrowVeg-style planting gestures

The current planting flow includes:

- click a crop to pick it up
- move over a bed to see a live planting footprint preview
- click to place a patch at that position
- click-drag to draw a real planting row through the existing row engine
- live row length and approximate plant count during drawing
- **Shift** while dragging locks the row horizontal/vertical
- **Ctrl** while finishing a patch or row re-arms the same crop/variety for repeated placement
- Escape/right-click cancels pickup
- native drag/drop remains as a fallback

### Botanical crop marker system

`components/botanical-plant-icons-bridge.tsx` tags crop render nodes while preserving the existing stored `cropIcon` emoji as fallback metadata.

`app/botanical-plant-icons.css` replaces rendered emoji with original top-down botanical markers for:

- tomato
- strawberry
- bean
- lettuce
- pumpkin
- carrot
- broccoli
- raspberry
- blueberry
- herbs

The same crop marker language is used in the catalogue, selected crop strip, placement ghosts, planted areas, row previews and saved planting rows.

Dense crops such as carrots/beans are visually smaller and wide-spaced crops such as pumpkins/blueberries are visually larger, but the true plant centres remain unchanged.

### Zoom-aware botanical detail

`app/botanical-zoom-detail.css` adds three canvas-only visual detail levels driven by the planner zoom. The catalogue and inspector remain stable/full-detail.

- **50–70% — low detail:** clean CSS crop silhouettes with reduced marker scale so dense plantings remain readable from a whole-garden view
- **80–110% — mid detail:** the standard top-down botanical SVG marker artwork
- **120–150% — high detail:** subtle crop-specific leaf veins, fruit highlights, centres and surface detail layered over the botanical marker

Important geometry guarantees:

- zoom detail never changes `spacingCm`, logical count or `plant-spacing-layout.ts`
- marker scale uses visual `scale`, so neighbouring layout geometry is not reflowed
- absolutely positioned planting icons retain their measured `left` / `top` centre coordinates and inline rotation
- high-detail pseudo overlays do not change planting icon positioning mode
- crop catalogue icons do not switch detail as the garden zoom changes

### Saved planner payload

`lib/garden/planner-plan.ts` defines `beds`, `plantingAreas`, `rows`, and `objects` (`path`, `trellis`, `tree`, `text`). Older local plans without planting areas or objects are normalised to the current model.

### D1 layout persistence

`lib/garden/layout-schema.ts` idempotently bootstraps Drawing V2/V4 schema when `/api/garden` runs.

Safety rules remain:

- no D1 migration for visual-only planner work
- no saved-plan schema changes for UI-only work
- no change to `GARDEN_WRITE_TOKEN` handling
- no R2/media changes unless explicitly required
- keep crop spacing/count logic separate from visual marker styling

## Current verification status

Before merge/deploy still run:

1. visual desktop testing specifically at 50%, 70%, 80%, 110%, 120% and 150% zoom to verify each detail threshold
2. mobile/touch visual testing
3. build / TypeScript / lint checks
4. production smoke testing

Do not claim those checks passed until they have actually run.
