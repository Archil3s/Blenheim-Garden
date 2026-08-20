# Blenheim Garden — Project Context

_Last updated: 20 August 2026_

This file is the handoff/reference document for future ChatGPT/Codex sessions working on this repository.

**Repository:** `Archil3s/Blenheim-Garden`

**Production branch:** `main`

---

## 1. Product goal

Blenheim Garden is a visual home-garden planner for Blenheim, Marlborough.

The primary interface follows the interaction model of a simplified GrowVeg-style planner: the **garden map is the application**, not a secondary dashboard feature. Do not copy GrowVeg proprietary artwork or code; use the structural ideas of compact toolbars, a context-sensitive drawing panel and a measured central canvas.

Core goals:

1. Represent the user's actual physical garden layout, including beds, paths, trellises, trees/shade areas and berry/cane areas.
2. Place crops visually inside beds or along drawn planting rows.
3. Make planning quick with crop/variety selection, automatic spacing estimates and month views.
4. Attach dated notes, photos, videos, planting records and harvests to beds/plants once durable storage is connected.
5. Keep the experience lower-friction than a full commercial garden-design product.

---

## 2. Current garden model

The base plan contains 12 numbered beds and a top fruiting-cane area, modelled on the supplied garden-plan drawings rather than a generic card grid.

The working canvas is 900 × 1080 internal pixels and is treated as approximately **9 m × 10.8 m** for spacing/capacity estimates (1 canvas pixel ≈ 1 cm). This is a practical planner scale, not a surveyed site measurement.

Current browser-side plan state supports:

- editable bed rectangles with x/y position and width/height
- crop, variety, icon, spacing and estimated plant count per bed
- free-drawn planting rows
- crop, variety, spacing and estimated plant count per row
- month selector
- zoom
- undo/redo history
- local browser save via `localStorage`

Durable multi-device persistence is not connected yet.

---

## 3. Current stack and storage foundation

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- Cloudflare Workers target

The repository now contains the first durable-storage foundation:

- `migrations/0001_garden_storage.sql`
- `lib/garden/storage-contract.ts`
- `docs/CLOUDFLARE_STORAGE.md`

The migration defines D1 tables for:

- gardens
- beds
- planting rows
- planting history
- notes
- harvests
- media metadata
- tasks
- seed inventory

Intended Cloudflare resources:

- D1 database: `blenheim-garden`
- D1 binding: `DB`
- R2 bucket: `blenheim-garden-media`
- R2 binding: `GARDEN_MEDIA`

R2 will hold photo/video bytes. D1 `media` rows will hold searchable metadata and links back to beds, rows, plantings or harvests.

Do not invent D1 database IDs. The real Cloudflare resources must exist before adding their bindings to `wrangler.jsonc`.

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

`wrangler.jsonc` currently uses:

```text
name: blenheim-garden
main: .open-next/worker.js
assets: .open-next/assets
compatibility_flags: nodejs_compat
```

When storage is connected, preserve all existing settings and add only the real D1/R2 bindings.

`next.config.ts` keeps:

```ts
output: "standalone"
```

---

## 5. Current UI and behaviour

The homepage is organised like a compact professional garden-planning workspace:

- top title bar with garden/year, Settings, Save and section tabs
- second command bar grouped into Plan, Edit, Layout, Layers, Timeline, Seed Inventory and Crop Rotation
- narrow icon-first vertical drawing rail
- approximately 250 px context-sensitive panel beside the rail
- Plants/Rows modes show filters, plant catalogue, crop spacing and variety selection in that panel
- Select mode uses that same panel for selected-bed or selected-row details/actions
- measured rulers sit across the top and left of the canvas
- the large grid-backed garden canvas dominates the remaining viewport
- the supplied bed/path/trellis/berry layout remains the base plan
- the context panel can collapse to maximise canvas space
- mobile layout turns the context panel into an overlay drawer rather than shrinking the garden map

Current functional behaviour:

- choosing a crop/variety controls what is placed next
- clicking a bed in Plant mode fills it with that crop/variety
- bed plant count is estimated from bed dimensions and crop spacing
- Select mode lets beds be dragged around the canvas
- the selected bed can be resized from its bottom-right handle
- planted-bed capacity recalculates after resizing
- Row mode lets the user drag a planting row directly across the plan
- row length and estimated plant count are calculated from crop spacing
- drawn rows can be selected and deleted
- Undo/Redo work for plan edits
- zoom controls change canvas scale
- month/timeline controls change the displayed planning month
- Save stores beds and rows in browser `localStorage`
- existing older localStorage bed-only plans are migrated on load
- Clear bed removes the crop from the selected bed

The Bed, Path, Trellis, Tree and Text drawing tools remain placeholders. Photos/video and Notes/harvests are not wired to D1/R2 yet.

---

## 6. Design rules

1. Keep the measured map/canvas visually dominant.
2. Use GrowVeg-like information architecture and interaction density without copying proprietary assets or exact visual branding.
3. Keep the narrow left rail and context-sensitive panel; avoid bringing back a large bottom plant tray or permanent right inspector.
4. Preserve the user's actual physical garden layout rather than normalising it into a generic grid.
5. Keep controls compact, obvious and visually quiet.
6. Make mobile use practical through scroll/zoom and an overlay context drawer.
7. Use crop icons/visuals where they improve scanability.
8. Keep detailed records behind selection/context-panel interactions.
9. Treat spacing/capacity numbers as planner estimates unless the garden has been accurately measured.
10. Preserve planting history separately from current bed geometry so replanting a bed does not destroy previous notes, harvests or media relationships.

---

## 7. Next build order

1. Create D1 `blenheim-garden` and R2 `blenheim-garden-media` in the real Cloudflare account.
2. Add the real bindings (`DB`, `GARDEN_MEDIA`) to `wrangler.jsonc` without changing existing OpenNext settings.
3. Apply `migrations/0001_garden_storage.sql` to D1.
4. Add `/api/garden` load/save endpoints and migrate browser state into D1, retaining localStorage as a fallback/cache.
5. Implement R2 upload/list/delete endpoints and connect the Photos & video controls.
6. Add Notes & harvests with sowing, germination, transplant and harvest dates.
7. Make Bed, Path, Trellis, Tree and Text tools genuinely drawable/editable.
8. Add Blenheim-specific planting windows and frost timing.
9. Add Today / This Week task generation.
10. Add seasonal occupancy/succession views and crop-rotation history.

---

## 8. New-chat bootstrap prompt

```text
Work on my GitHub repo Archil3s/Blenheim-Garden.
First read PROJECT_CONTEXT.md and inspect the current code before making changes.
Treat the measured garden canvas as the primary interface. Preserve the GrowVeg-style workspace structure, the user's real physical garden layout and the existing Cloudflare/OpenNext deployment.
For durable storage, use the existing D1 migration/storage contract and only add real Cloudflare D1/R2 bindings after the resources exist.
```
