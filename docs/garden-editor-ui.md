# Garden editing interface

The shared detailed 3D and pixel editor groups its tools into **Select**, **Build**,
**Plant** and **View**. Selecting a mode reveals the relevant tools. Undo, Redo,
Save and the Navigate/Edit switch remain available. **More tools** opens object
search, Garden studio, Design tools, Garden size and the model library, plus
selection actions. Clicking outside the menu or pressing Escape dismisses it.

## Selection and mobile controls

Select soil for Plant, Move, Copy and Lock. **More** contains dimensions,
coordinates, growing/seasonal tools, arrangement, templates and removal. Locked
objects keep their protected controls. Copy still opens a click-to-place draft;
no object is created until placement commits. More tools also exposes Rotate
and Resize. Existing shortcuts and Undo/Redo remain available in Edit mode.

On phones, object and planting controls sit below the garden. Tap the sheet
heading to collapse/expand it. The canvas reserves the sheet's measured height,
so controls do not cover the active garden. Camera and display controls sit
above the sheet. Hide controls keeps planting active with a compact card.

## Navigate and Edit

Navigate allows camera gestures and protects objects from dragging or Delete.
It cancels active placement drafts. Edit restores canvas editing; explicitly
choosing a drawing tool also enters Edit. A locked camera still stays fixed.
Navigation is temporary view state; it does not save a garden modification.
View mode also enters Navigate. Selecting soil through Objects or a bed label
returns to editing explicitly. On phones, opening a sheet during a drag waits
until the gesture ends before resizing the canvas.

## Add to garden

Use **+ Add** to search indexed crops, beds, paths and structures. Crop thumbnails
reuse the existing artwork. Choose an item, then set its dimensions/variety and
place it in the garden. Choosing alone does not spawn an object. Star items for
Favourites; Recent lists the last eight choices. These lists stay in this browser
and contain catalogue IDs only, independently of named gardens and cloud data.

## Labels and orientation

**Beds** opens a soil-only list with Previous/Next, Focus and Plant this bed.
**Pick beds through crops** ignores foliage; Alt-click also picks soil directly.
Planting starts with the bed's existing crop when present. **Planting bed**
switches the target without changing the chosen crop. Single, paint, row and
patch placement share soil, lock and mixed-crop spacing checks. Fill previews
preserve existing crops; small planters can accept a centred plant.

Detailed 3D's **Move view** offers Pan/Orbit, directional controls and zoom.
In Navigate, WASD or arrows move across the ground, +/- zoom, Home fits the
garden and F focuses the selection. Text fields retain their normal keys.
Pan makes dragging move the view, including one-finger touch; Orbit rotates.
Scroll zoom follows the pointer. Camera lock disables gestures and movement
controls. Explicit Focus/Fit commands remain available.

The selected/hovered soil shows its name and current crops. View → **Show bed
labels** adds labels across the garden; crowded/offscreen labels are hidden.
With labels enabled, click a label to select its soil. Label positions follow
both WebGL and pixel cameras and derive from the canonical plan.

The north compass uses the garden's recorded true-north angle and current view.
Click it to reset the garden view; the plan and north setting do not change.

## Feedback and saving

The Save control shows Ready, Unsaved changes, Saving, Saved to cloud or a local/
failed state. Phones show a compact status below Save. Editing displays a short
action message with Undo. Errors remain visible in the existing status panel.
There is no automatic cloud Save: regular Save/Ctrl-S uses the protected garden
API and retains planting history. Enter an edit key through the existing control.

The UI adds no dependencies, artwork, migrations or API fields. Geometry, plant
IDs/counts, locks, named gardens, private R2 and archived history are unchanged.
