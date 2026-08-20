# Blenheim Garden — Project Context

_Last updated: 20 August 2026_

This file is the handoff/reference document for future ChatGPT/Codex sessions working on this repository.

**Repository:** `Archil3s/Blenheim-Garden`

**Production branch:** `main`

---

## 1. Product goal

Blenheim Garden is a visual home-garden planner for Blenheim, Marlborough.

The primary interface should feel like a simplified GrowVeg-style planner: the **garden map is the application**, not a secondary dashboard feature.

The user should be able to understand the real garden at a glance, then click beds/plants to manage details without cluttering the map.

Core goals:

1. Represent the user's actual physical garden layout, including beds, paths, trellises, trees/shade areas and berry/cane areas.
2. Place crops visually inside beds or along drawn planting rows.
3. Make planning quick with crop/variety selection, automatic spacing estimates and simple month views.
4. Eventually attach dated notes, photos, videos, planting records and harvests to beds/plants.
5. Keep the experience simpler and lower-friction than a full commercial garden-design product.

---

## 2. Current garden model

The base plan currently contains 12 numbered beds and a top fruiting-cane area, with the layout modelled on the user's supplied garden-plan drawings rather than a generic 12-card grid.

The working canvas is 900 × 1080 internal pixels and is treated as approximately **9 m × 10.8 m** for spacing/capacity estimates (1 canvas pixel ≈ 1 cm). This is a practical planner scale, not a surveyed site measurement.

Current browser-side plan state supports:

- 12 editable bed rectangles
- bed x/y position and width/height
- crop, variety, icon, spacing and estimated plant count per bed
- free-drawn planting rows
- crop, variety, spacing and estimated plant count per row
- month selector
- zoom
- undo/redo history
- local browser save via `localStorage`

Durable multi-device persistence is not implemented yet.

---

## 3. Current stack

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- Cloudflare Workers target

Future storage direction when persistence is required:

- Cloudflare D1 for beds, rows, crops, varieties, planting records, notes, tasks and harvests
- Cloudflare R2 for garden photos and ordinary video files
- Cloudflare Stream only if video playback/transcoding needs become substantial

Do not invent D1 database IDs or R2 bucket bindings. Create/bind the real Cloudflare resources first, then commit those real bindings/configuration.

---

## 4. Cloudflare deployment

Known intended production configuration:

```text
Build command:
npx @opennextjs/cloudflare build

Deploy command:
npx @opennextjs/cloudflare deploy

Production branch:
main
```

The package script must remain:

```json
"build": "next build"
```

Do not make `npm run build` invoke OpenNext when Cloudflare already runs the OpenNext build command.

`wrangler.jsonc` uses:

```text
name: blenheim-garden
main: .open-next/worker.js
assets: .open-next/assets
compatibility_flags: nodejs_compat
```

`next.config.ts` keeps:

```ts
output: "standalone"
```

---

## 5. Current UI and behaviour

The homepage is a planner workspace with:

- compact top bar with month, zoom, undo/redo and save controls
- left tool rail including Select, Bed, Path, Trellis, Plant, Row, Tree and Text
- large grid-backed garden canvas
- the user's approximate real-world bed/path/trellis/berry layout
- crop icons inside occupied beds
- selectable and movable beds
- resize handle on the selected bed
- free-drawn planting rows
- bottom searchable plant tray
- variety selector for the active crop
- right-side bed/row inspector
- responsive mobile layout with horizontally scrollable tools and plants

Current functional behaviour:

- choosing a plant switches to Plant mode
- selecting a variety controls what is placed next
- clicking a bed in Plant mode fills it with the selected crop/variety
- bed plant count is estimated from bed dimensions and crop spacing
- Select mode lets beds be dragged around the canvas
- the selected bed can be resized from its bottom-right handle
- planted-bed capacity recalculates after resizing
- Row mode lets the user drag a planting row directly across the plan
- row length and estimated plant count are calculated from crop spacing
- drawn rows can be selected and deleted
- Undo/Redo work for plan edits
- zoom controls change canvas scale
- month selector changes the displayed planning month label
- Save plan stores beds and rows in browser `localStorage`
- existing older localStorage bed-only plans are migrated on load
- Clear bed removes the crop from the selected bed

The Bed, Path, Trellis, Tree and Text drawing tools are still placeholders. Photos & video and Notes & harvests still require durable storage/data-model work.

---

## 6. Design rules

1. Keep the map/canvas visually dominant.
2. Match the interaction model of modern visual garden planners without copying proprietary assets or exact UI.
3. Preserve the user's actual physical garden layout rather than normalising it into a generic grid.
4. Keep controls compact and obvious.
5. Avoid dashboard-card overload and decision fatigue.
6. Make mobile use practical through scroll/zoom rather than rebuilding the garden into a different layout.
7. Use crop icons/visuals wherever they improve scanability.
8. Keep detailed records behind selection/inspector interactions.
9. Spacing/capacity numbers should be clearly treated as planner estimates unless the garden has been accurately measured.

---

## 7. Recommended next build order

1. Create the real Cloudflare D1 database and bind it to the Worker.
2. Move saved beds/rows/varieties from localStorage to D1 while keeping local autosave as a fallback.
3. Create/bind an R2 bucket for photos and ordinary garden video.
4. Implement Photos & video on the selected bed/row with dated uploads and captions.
5. Add Notes & harvests with sowing, transplant and harvest dates.
6. Make Path, Trellis, Tree and Text tools actually drawable/editable.
7. Add Blenheim-specific planting windows and frost timing.
8. Add Today / This Week task generation.
9. Add seasonal occupancy/succession views and crop-rotation history.

---

## 8. New-chat bootstrap prompt

```text
Work on my GitHub repo Archil3s/Blenheim-Garden.
First read PROJECT_CONTEXT.md and inspect the current code before making changes.
Treat the garden canvas as the primary interface. Preserve the GrowVeg-style visual-planner direction, the user's real physical garden layout and the existing Cloudflare/OpenNext deployment.
```
