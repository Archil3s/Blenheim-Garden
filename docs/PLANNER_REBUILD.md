# Planner rebuild progress

2 November 2026. Branch: `feature/planner-rebuild`.

## Implemented in this change

- The expanded plant catalogue includes all 411 names observed in the regional
  reference, alongside existing Blenheim crops. The familiar crop shortlist is
  retained; enable **Full plant catalogue** to search the expanded list.
- New catalogue names have original local SVG silhouettes. These illustrate
  growth forms; they are not GrowVeg graphics or cultivar-accurate illustrations.
  Existing detailed artwork takes precedence where available.
- Existing crop spacing and variety defaults remain. Entries without established
  spacing explicitly request seed-packet spacing; 30 cm is a drawing starting
  value, not a horticultural recommendation. Spacing and variety can be edited
  before placement and are retained in the planted plan.
- Full structure catalogue contains 71 presets. The familiar 36 remain the
  default shortlist. New objects have original schematic icons, configurable
  dimensions, rotation, and compatible procedural 3D representations.
- Plant List supports variety aggregation, individual plantings, ordering by
  bed/row, search, spacing/counts, CSV download and printing.
- Parts List calculates bed edging, bed area, path length/surface, trellis
  length/post counts and structure quantities, with CSV and printing.
- Export current unsaved design as JSON backup, SVG schematic or a 2000px-wide
  PNG, with height adjusted to include the existing overhanging Bed 12.
- 3D return links now go to `/planner`, retaining garden query parameters where
  used. Previously they opened the homepage after the route separation.

Designer tools add outline/filled rectangles, triangles, ellipses and lines, colour/width controls, drag resizing, rotation, per-shape locks, front/back ordering, clipboard duplication, undo/redo and layer views. Shapes persist per garden and render in 3D and exports.

An idempotent designer_shapes table is created automatically. Named-garden layout IDs are namespaced on save to prevent collisions with another garden. No dependency or Cloudflare binding change is required.
New structure kind values use the existing validated structure storage path.
Protected writes, private media, named gardens and the measured base plan remain.

## Verification

The added test file checks catalogue coverage, structure rendering mappings,
variety aggregation, physical measurements, CSV escaping, SVG text escaping,
expanded catalogue selection, custom spacing/variety, reports and downloads.
The browser flow runs at all four configured viewport sizes and captures screenshots.
Final verification results are logged in `DESIGN_PROGRESS.md`.

## Exact-copy limitations and remaining work

This change is an independent planner expansion, not a complete GrowVeg clone.
The reference collection did not supply a complete plant/structure sprite atlas,
all individual object variants, full plant descriptions or the server algorithms.
Catalogue type grouping and added structure dimensions are local implementation
choices, not extracted GrowVeg data. Some new 3D objects use a related existing
procedural model rather than a distinct physical model.

Still needed for feature parity:

- independently verified spacing, traits, botanical information and calendars for
  every catalogue entry; new names do not automatically extend seasonal advice;
- detailed artwork and individual variants for the full library;
- texture fills and richer text formatting;
- broader layer locking, ordering and clipboard workflows for every item type;
- square-foot density controls and dedicated container planting associations;
- plant-specific temporal occupancy, succession planning and season-extender
  calendar adjustment;
- seed-packet inventory and stock-aware filtering;
- favorites, trait filters and an independently sourced companion-plant dataset;
- configurable whole-garden dimensions and imperial units;
- follow-on-year plan history and sharing/publication workflows;
- validated JSON restore/import (the current action is export-only).

Deployment has not been performed by this change. Production should not be
described as a full copy, nor should incomplete library data be described as
verified growing guidance.
