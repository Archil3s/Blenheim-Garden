# Building in 2D

Open `/` and use the building bar above the measured garden.

- **Draw bed**: drag from one corner to the opposite corner. The preview shows
  metres before release. New beds immediately switch to Select.
- Select a bed and drag any of its eight green handles to resize. Corners change
  both dimensions; edges change one. The opposite edge stays fixed. Selected
  handles also accept arrow keys in 10 cm increments.
- Raised-bed containers have corner handles. Resizing respects their rotation,
  stays inside the garden boundary, and carries their owned plant positions.
- **Select vegetables** selects vegetable planting patches and rows, including
  plants in raised containers. Fruit and herbs stay unselected.
- **Select all plants** includes fruit, herbs and other planted crops.
- **Box select** selects whole planting patches touched by the box and rows with
  plant centres inside it. It selects whole plantings, not individual plants.
- **Multi-select** lets you tap planting patches or rows to add/remove them.
  Shift-click also toggles them. Selected plantings show a check and green border.
- **Delete selected** removes the selected plantings in one undoable operation.
  Beds, structures, paths, trees and saved history remain. Save commits the change
  through the existing protected garden API; removed crop records are retained
  as planting history.
- Ctrl/Cmd+A selects all plants. Delete/Backspace deletes selected crops;
  Ctrl/Cmd+Z undoes, Shift+Ctrl/Cmd+Z redoes, and Escape clears selection.
  Shortcuts do not intercept form fields or dialogs.

The view retains centimetre coordinates, snapping, named-garden separation,
the existing crop artwork, and live 3D updates. Responsive controls are tested
in real Chromium at desktop, laptop, tablet and phone sizes, including touch
bed drawing/resizing. Save tests use mock APIs, never production garden writes.
