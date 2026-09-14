# Garden-first UX sprint

The initial planner opened with a large inspector, fitted only to width, hid
crop labels at overview zoom, and forced a 1,180px desktop minimum on tablets.
The smart-planting portal also caused a hydration mismatch.

The garden now fits the available width and height, starts with details closed,
and shows crop variety and quantity at overview zoom. Detailed positions remain
available above 100%. Coordinates, counts, spacing, storage, protected writes,
and the existing 3D renderers are preserved.

Navigation prioritises Plan, Today, and Save, with secondary actions in More.
Bed inspectors group current planting, records, editing, and danger actions.
Phone sheets scroll internally, controls and labels are larger, and Settings
remains reachable. Save feedback distinguishes unsaved, local-only, saving,
failed, and saved states using the successfully persisted plan snapshot.

Validation:

- Production build passed.
- 20 Chromium browser tests passed across 1920×1080, 1440×900, 1024×768,
  and 390×844; no page overflow or new browser errors.
- Covered selection, all tools, crop choice, move/undo/redo, snap, zoom,
  Today, Notes, Photos, Rotation, Settings, named-garden isolation, save states,
  and standalone 3D navigation. Additional checks covered viewport resizing,
  inline 3D return to Plan, and live companion updates with a persistent canvas.
- Lint remains failing with 13 pre-existing errors and 9 warnings. Untouched
  main at 5a156c6 had 14 errors and 9 warnings under the same dependencies.
  No new lint diagnostics were introduced; these were not suppressed.
- Physical iOS/Safari testing, production persistence writes, and pixel-baseline
  comparison remain unverified. API writes were tested using isolated fixtures.

The browser workflow retains screenshots, traces, and layout diagnostics.
See VISUAL_TESTING.md for commands and the baseline-review process.
