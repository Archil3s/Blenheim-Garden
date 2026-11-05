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
remain procedural with detailed artwork for species without specific models;
exports remain schematic rather than original-art exports.
Do not describe this as a fully verified 1:1 GrowVeg product clone.

Final build/browser verification is recorded in DESIGN_PROGRESS.md.
The user subsequently requested a main push; fa66ff5 was pushed and its existing
GitHub Actions deployment succeeded. The separate Workers Builds token was left
unchanged at the user's request.

The detailed comparison is in GROWVEG_PARITY_AUDIT.md. Whole-product parity
remains incomplete. The UX follow-up adds workspace report navigation, plan-wide
notes with protected named-garden storage and local drafts, original interface
glyphs, measured toolbar sizing, visible Settings/year/New/Open, single-selection
clipboard actions and shortcuts, factual plant information, favourites and
companion/advanced plant filters. It preserves the measured bed positions.
