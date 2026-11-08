# Kings Seeds — individually generated botanical concepts

This is the **staging asset library for Codex**, separate from the planner's currently active `public/plant-icons/kings-seeds/` icons.

## Current uploaded artwork

**3 of 441** catalogue entries are currently uploaded as individual transparent 128 × 128 PNG icons. They were derived from individually generated transparent plant illustrations, **not screenshots cropped from the side-by-side comparison sheets**. These are indexed/downsized previews, not full-resolution originals or fully verified cultivar artwork.

Use `manifest.json` as the source of truth for what is actually uploaded. Do **not** assume other catalogue entries are complete.

## For Codex

1. Pull the latest `main` branch.
2. Read `assets/kings-seeds-botanical-concepts/manifest.json` and `lib/garden/kings-seeds-varieties.json`. Match by the stable `id` field, not by display name alone.
3. Review the transparent PNGs at 128px and 32px. Flag cultivar inaccuracies or indistinct varieties for review.
4. Do **not** overwrite the live `public/plant-icons/kings-seeds/` assets or change `supplier-plant-icons.ts` until artwork is reviewed and explicitly approved for integration.
5. Keep subsequent uploads in this folder and update `manifest.json` in the same atomic commit; preserve existing image files unless approved replacement is available.
6. Do not use the previous '400-icon' crop-based ZIP as production assets: it contains captures from comparison sheets rather than isolated artwork.

## Asset path

`assets/kings-seeds-botanical-concepts/icons/<variety-id>.png`

Target: 441 distinct variety icons. This folder is intentionally not referenced at runtime yet.
