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

1. Represent the actual physical garden layout, including beds, paths, trellises, trees/shade areas and berry/cane areas.
2. Place crops visually inside beds or along drawn planting rows.
3. Make planning quick with crop/variety selection, automatic spacing estimates and month views.
4. Attach dated notes, photos, videos, planting records and harvests to beds/plants using Cloudflare persistence.
5. Keep the experience lower-friction than a full commercial garden-design product.

---

## 2. Current garden model

The base plan contains 12 numbered beds and a top fruiting-cane area, modelled on the supplied garden-plan drawings rather than a generic card grid.

The working canvas is 900 × 1080 internal pixels and is treated as approximately **9 m × 10.8 m** for spacing/capacity estimates (1 canvas pixel ≈ 1 cm). This is a practical planner scale, not a surveyed site measurement.

Current plan state supports:

- editable bed rectangles with x/y position and width/height
- crop, variety, icon, spacing and estimated plant count per bed
- free-drawn planting rows
- crop, variety, spacing and estimated plant count per row
- month selector
- zoom
- undo/redo history
- local browser fallback/cache via `localStorage`
- D1 load/save through `/api/garden`

D1 has been verified with all 12 beds saved successfully.

---

## 3. Current stack and storage

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- Cloudflare Workers target

Live storage resources:

- D1 database: `blenheim-garden`
- D1 binding: `DB`
- R2 bucket: `blenheim-garden-media`
- R2 binding: `GARDEN_MEDIA`
- R2 public access: disabled/private
- Worker write secret: `GARDEN_WRITE_TOKEN`

The production D1 schema from `migrations/0001_garden_storage.sql` is applied and includes:

- gardens
- beds
- planting rows
- planting history
- notes
- harvests
- media metadata
- tasks
- seed inventory

Important implementation files:

- `lib/garden/storage-contract.ts` — durable record types
- `lib/garden/planner-plan.ts` — shared planner payload
- `lib/garden/cloudflare-db.ts` — D1/R2 binding access and write secret
- `lib/garden/media-limits.ts` — conservative app media quotas/types
- `lib/garden/write-auth.ts` — shared protected write authentication
- `app/api/garden/status/route.ts` — D1 health
- `app/api/garden/route.ts` — D1 planner GET/PUT
- `app/api/garden/media/route.ts` — R2 list/upload plus D1 metadata/quota
- `app/api/garden/media/[id]/route.ts` — private R2 streaming/delete
- `components/garden-media-dialog-bridge.tsx` — Photos & video UI
- `docs/CLOUDFLARE_STORAGE.md` — Cloudflare setup/reference

Never commit `GARDEN_WRITE_TOKEN`. The browser keeps the entered edit key only in `sessionStorage`.

---

## 4. Cloudflare deployment

Production configuration:

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

`wrangler.jsonc` must preserve:

```text
name: blenheim-garden
main: .open-next/worker.js
assets: .open-next/assets
compatibility_flags: nodejs_compat
D1 binding: DB -> blenheim-garden
R2 binding: GARDEN_MEDIA -> blenheim-garden-media
```

`next.config.ts` keeps `output: "standalone"` and initialises OpenNext Cloudflare bindings for local development.

---

## 5. Current UI and behaviour

The homepage is organised like a compact professional garden-planning workspace:

- top title bar with garden/year, Settings, Save and section tabs
- second command bar grouped into Plan, Edit, Layout, Layers, Timeline, Seed Inventory and Crop Rotation
- narrow icon-first vertical drawing rail
- approximately 250 px context-sensitive panel beside the rail
- Plants/Rows modes show filters, plant catalogue, crop spacing and variety selection
- Select mode uses the same panel for selected-bed or selected-row details/actions
- measured rulers sit across the top and left of the canvas
- large grid-backed garden canvas dominates the viewport
- context panel can collapse
- mobile layout turns the context panel into an overlay drawer

Functional behaviour:

- crop/variety placement and estimated capacity
- bed dragging/resizing
- free-drawn planting rows
- row selection/deletion
- Undo/Redo
- zoom/month controls
- protected D1 Save with local fallback
- visible Garden Settings dialog for the session edit key
- planting history is finished/recreated rather than overwritten when crops change
- D1 becomes authoritative once saved beds exist

Media behaviour:

- selected-bed **Photos & video** opens a bed-specific media dialog
- top **Photos** tab opens whole-garden media
- media is served through Worker routes while the R2 bucket stays private
- uploads/deletes require `GARDEN_WRITE_TOKEN`
- photos/videos are linked in D1 to their current target and, where available, current planting
- videos use metadata preload and do not autoplay

Conservative app media quotas:

```text
2 GB total garden media
6 MB maximum per photo
25 MB maximum per video
500 files maximum
```

Allowed first-release media formats:

- JPEG, PNG, WebP, HEIC, HEIF
- MP4, WebM, MOV/QuickTime

The browser checks limits for UX and the Worker repeats them before writing to R2. D1 `media.size_bytes` is summed before every upload.

The Bed, Path, Trellis, Tree and Text drawing tools remain placeholders. Notes/harvests UI is not wired yet.

---

## 6. Design rules

1. Keep the measured map/canvas visually dominant.
2. Use GrowVeg-like information architecture and interaction density without copying proprietary assets or exact visual branding.
3. Keep the narrow left rail and context-sensitive panel; avoid a large bottom plant tray or permanent right inspector.
4. Preserve the physical garden layout rather than normalising it into a generic grid.
5. Keep controls compact, obvious and visually quiet.
6. Make mobile use practical through scroll/zoom and overlay dialogs/drawers.
7. Use crop icons/visuals where they improve scanability.
8. Keep detailed records behind selection/context-panel interactions.
9. Treat spacing/capacity numbers as planner estimates unless the garden has been accurately measured.
10. Preserve planting history separately from current bed geometry so replanting does not destroy previous notes, harvests or media relationships.
11. Never expose anonymous garden mutations; D1 and R2 writes/deletes remain protected by the edit secret or future stronger auth.
12. Keep the R2 bucket private. Serve media through the Worker rather than enabling a public R2 domain.
13. Keep app media quotas conservative even if Cloudflare offers larger account-level allowances.

---

## 7. Next build order

1. Deploy and verify the R2 implementation with one small photo upload/delete.
2. Add Notes & harvests with sowing, germination, transplant and harvest dates.
3. Make Bed, Path, Trellis, Tree and Text tools genuinely drawable/editable.
4. Add Blenheim-specific planting windows and frost timing.
5. Add Today / This Week task generation.
6. Add seasonal occupancy/succession views and crop-rotation history.
7. Add media browsing by planting/season and optional client-side image compression if needed.

---

## 8. New-chat bootstrap prompt

```text
Work on my GitHub repo Archil3s/Blenheim-Garden.
First read PROJECT_CONTEXT.md and inspect the current code before making changes.
Treat the measured garden canvas as the primary interface. Preserve the GrowVeg-style workspace structure, the physical garden layout and the existing Cloudflare/OpenNext deployment.
D1 is live as DB and R2 is live as GARDEN_MEDIA using private bucket blenheim-garden-media. Preserve protected writes using GARDEN_WRITE_TOKEN and the strict 2 GB / 6 MB photo / 25 MB video / 500-file media caps.
```
