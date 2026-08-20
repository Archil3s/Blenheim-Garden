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
2. Place crops visually inside the beds where they are physically growing.
3. Make planning quick with a crop tray, select/plant tools and simple month views.
4. Eventually attach dated notes, photos, videos, planting records and harvests to beds/plants.
5. Keep the experience simpler and lower-friction than a full commercial garden-design product.

---

## 2. Current garden model

The base plan currently contains 12 numbered beds and a top fruiting-cane area, with the layout modelled on the user's supplied garden-plan drawings rather than a generic 12-card grid.

Current browser-side state supports:

- selected bed
- selected crop
- simple crop placement into beds
- crop counts/icons
- month selector
- zoom
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

- Cloudflare D1 for beds, crops, planting records, notes, tasks and harvests
- Cloudflare R2 for garden photos and ordinary video files
- Cloudflare Stream only if video playback/transcoding needs become substantial

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

## 5. Current UI direction

The homepage is now a planner workspace with:

- compact top bar with month, zoom and save controls
- left tool rail: Select, Bed, Path, Trellis, Plant, Tree and Text
- large grid-backed garden canvas
- the user's approximate real-world bed/path/trellis/berry layout
- crop icons inside occupied beds
- selectable beds
- bottom searchable plant tray
- right-side selected-bed inspector
- responsive mobile layout with horizontally scrollable tools and plants

Current functional behaviour:

- choosing a plant switches to Plant mode
- clicking a bed in Plant mode places that crop into the bed
- clicking a bed updates the selected-bed inspector
- zoom controls change canvas scale
- month selector changes the displayed planning month
- Save plan stores the current bed state in browser `localStorage`
- Clear bed removes the crop from the selected bed

The Undo/Redo, Photos & video, and Notes & harvests controls are visual placeholders for later functionality.

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

---

## 7. Recommended next build order

1. Make beds/paths/trellises draggable and resizable.
2. Add proper row/block crop placement and spacing calculations.
3. Add D1 persistence and user garden records.
4. Add photo/video upload with R2.
5. Add crop/variety records, sowing, transplant and harvest dates.
6. Add Blenheim-specific planting windows and frost timing.
7. Add Today / This Week task generation.
8. Add seasonal occupancy/succession views and crop-rotation history.

---

## 8. New-chat bootstrap prompt

```text
Work on my GitHub repo Archil3s/Blenheim-Garden.
First read PROJECT_CONTEXT.md and inspect the current code before making changes.
Treat the garden canvas as the primary interface. Preserve the GrowVeg-style visual-planner direction, the user's real physical garden layout and the existing Cloudflare/OpenNext deployment.
```
