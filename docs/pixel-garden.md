# Pixel garden

`/3d` and the planner's inline garden open in a cozy pixel-art view. The existing
**3D** / **Live 3D** planner actions still lead to the same garden workspace.
Choose **Detailed 3D** to use the textured WebGL models, or open `/3d?view=3d`.
The vegetable model library and GLB downloads remain available.

The artwork combines original detailed bitmap sprites with code-drawn soil,
paths, fences and structure sprites, inspired by the readability and warm
palette of farming games. It uses Canvas 2D in the existing browser app;
it does not use MonoGame or Stardew Valley artwork, code or assets. No new
dependency or cloud binding is required.

## Artwork and layout

- Three transparent WebP atlases provide 48 distinct plant sprites and six
  scenery sprites. Layered foliage, veins, textured fruit, flower clusters,
  roots and pods cover every indexed plant and the extra vegetables supported
  by the detailed library. Cultivar appearances are representative; multiple
  varieties share a species sprite. Generic Herbs resolves Basil, Chives,
  Thyme and Parsley separately.
- Grass, soil and path tiles, timber beds, signs and fences create the scene.
  Woodland and flowers sit outside the measured garden boundary.
- The 900 × 1080 cm plot, saved bed dimensions, plant positions, rows and layout
  objects come from the existing plan. Visual soil tiles do not change spacing
  or quantize saved coordinates.
- Crops and objects draw in ground-depth order. Structure sprites remain upright
  while the measured rotated footprint determines their projected width and
  selection outline. These are illustrative sprites, not replacement GLB models.
- Atlas files decode once and sprite canvases are cached. Nearest-neighbour
  drawing at one canvas pixel per CSS pixel preserves detail while zooming.
  Artwork loading and retries repaint without resetting the camera or plan.
  Failed loads retain procedural artwork and editing with an explicit retry.
  Dense areas sample at most 1,500 visible
  plants; saved counts and positions remain intact.

## Interaction and persistence

Drag empty ground to pan. Scroll, pinch, or use **+ / −** to zoom. **Fit garden**
returns to the measured plot. Focus the canvas to use arrow keys for panning
and **+ / −** for zooming.

The existing toolbar supports selecting, moving, placing plants, drawing rows,
adding beds, paths, trellises, trees and structures, editing measurements,
duplicating, deleting, undo/redo and Save. **Move** drags the picked object or
individual plant with the same 10 cm snap and plan validation as the editor.
Placement previews show the proposed location. Paths and non-planter structures
block new plant placements. **Escape** cancels an unfinished drawing.

**Ctrl/Cmd+Z**, **Ctrl+Y**, **Ctrl/Cmd+Shift+Z**, **Delete** and **Ctrl/Cmd+S** retain
the editor shortcuts. Input fields retain their own text-editing behaviour.
Cloud Save still requires the existing session edit key. Unsaved live 2D plan
changes update the pixel scene without resetting its viewpoint or saving D1.
Switching appearances retains the current plan and editing history.

## Implementation and verification

- `components/garden-pixel-art.ts`: original raster sprite and tile generators.
- `components/garden-pixel-assets.ts`: atlas decoding, species mapping and retry.
- `public/artwork/pixel-garden/`: detailed transparent plant and scenery atlases.
- `docs/pixel-art-prompts.md`: art direction, generation prompts and atlas packing.
- `components/garden-pixel-scene.ts`: measured projection, depth ordering and picking.
- `components/garden-pixel-canvas.tsx`: camera, pointer/touch interactions and previews.
- `components/garden-3d-unified.tsx`: shared plan, controller, persistence and appearance switch.
- `app/garden-pixel.css`: warm compact controls and responsive canvas styles.
- `tests/visual/garden-pixel.spec.ts`: crop coverage, screenshots, pan/zoom, phone
  pinch, live mirroring, exact centimetres, drag history, placement rejection,
  mocked protected Save and refresh, artwork failure/recovery on desktop,
  laptop, tablet and phone.

The existing 3D editor and GLB integration tests explicitly select Detailed 3D
so both rendering paths remain covered. Browser tests mock garden writes.
