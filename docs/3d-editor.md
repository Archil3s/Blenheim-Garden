# 3D garden editor

The /3d route and the planner's inline 3D view edit the existing PlannerPlan. Both views share local live-plan events, named-garden storage keys and the protected garden API.

Select a plant, bed or structure to inspect it. Move mode drags objects without orbiting the camera. Empty-ground drags in Select mode orbit. Plant, row, bed, path, trellis, tree and structure tools show a preview; line tools use two taps. Plant previews show spacing guidance. Inspector fields edit dimensions, positions, crop settings and rotation. Duplicate, Delete, Undo and Redo use plan snapshots; a drag creates one undo step.

Save writes the same local cache and authenticated PUT /api/garden used by 2D. An edit key is kept in session storage. Without a key, Save reports local-only persistence. Cloud failures remain visible and can be retried.

## Persistence compatibility

Areas and rows can carry optional explicit placements. Area coordinates are percentages within the planting area. Row x is a percentage along its line and y is a perpendicular offset in centimetres. A zero-length row stores centimetre offsets from its origin, representing an individual soil plant. Missing placements retain generated-layout behavior.

The API idempotently adds nullable placements_json columns to the existing area and row tables. Existing beds, planting IDs, archived history and media are preserved. Explicit counts equal placement length. Bed resizing preserves crop count and scales positions. Deleting an occupied bed requires removing its plantings first.

Individual editing supports up to 10,000 canonical placements per area. Large scenes render representative selectable samples (100 per area on desktop, 32 on mobile); stored counts and all canonical positions remain intact. Generated plantings above the individual-edit limit must be split before editing individual plants.

## Verification

Playwright covers individual mutations, protected SQLite-backed D1 save/load and crop history, browser design/save/refresh, 2D mirroring, dragging, resizing, rotation and named-garden isolation at desktop, laptop, tablet and phone sizes. No production database is used by these tests.

### Verification result (2026-10-08)

Lint and the production Next.js build pass. The complete Playwright run passed 79 of 80 checks. All editor, D1 persistence, keyboard, responsive transform, 2D, named-garden, demo, seasonal and structure checks passed. Four additional boundary validation runs passed after the final boundary correction.

The remaining phone test in plant-art-3d.spec.ts:41 expects all 16 PNG artwork responses after opening 3D. The identical failure was reproduced against an unmodified production build of main at f1d08a6. The current 3D renderer uses geometry; mobile 2D lazily loads only visible artwork. Existing tests and artwork were left intact.

The supplied Flutter commands were also attempted: dart format . found no Dart files; flutter analyze reported no issues; flutter test cannot run because this Next.js repository has no Flutter test directory. No production deployment or database writes were performed.
