# Planner rebuild progress

2 November 2026. Branch: feature/planner-rebuild. Draft PR #52.

The user's latest instruction is to use the exact artwork and design style
while keeping existing bed positions. The reference artwork now takes priority
over the earlier original schematic placeholders for matching entries.

Implemented:

- Original high-resolution plant and garden-object atlases and fill textures,
  plus the original catalogue sprite sheet and Nunito Sans interface font.
- 432 source plant records, with exact sprite mappings. Duplicate generic plant
  names share the visible catalogue symbol. Existing saved crop/variety defaults
  remain; new entries use source numeric spacing where available. Imported data
  is attributed to the regional reference and is not independently validated.
- 203 original object variants, grouped in the expanded catalogue, with source
  2D footprints, nine-slice borders, tiled path textures and original imagery.
  Existing 36/71-preset exports remain compatible. Reference variants use their
  own validated kind identifiers and existing protected persistence.
- Source-defined plant symbol dimensions are now used on the centimetre canvas, including rows, berries and trees; catalogue symbols are 36 px. Legacy custom area sizing remains optional.
- Green navigation, compact ribbon, report tabs, drawing rail, white catalogue,
  grey workspace, white grid, outlined beds, flat grey paths and planting zones.
  Removed synthetic marker overlays that obscured the original plant art.
- Drawing shapes, colours, resizing, rotation, per-shape locks/order, clipboard,
  undo/redo, layer views, saved geometry, 3D and schematic exports.
- Plant/parts reports, CSV/printing, JSON/SVG/PNG schematic exports.

Existing bed coordinates and saved plants are preserved. No production garden
was overwritten. Writes remain protected. No dependencies or bindings changed.
Asset provenance and hashes: REFERENCE_ASSETS.json. The supplied image is the
style reference; its different garden arrangement is not imported, as requested.

Exact whole-product parity remains incomplete. The ribbon does not expose every
GrowVeg workflow; temporal planning, inventory, texture-selection UI, full-object
locking, rich text and publication/import workflows need further work. 3D models
remain procedural, and exports remain schematic rather than original-art exports.
Do not describe this as a fully verified 1:1 GrowVeg product clone.

Final build/browser verification is recorded in DESIGN_PROGRESS.md.
No production deployment has been performed.
