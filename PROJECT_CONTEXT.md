# Blenheim Garden — Project Context

_Last updated: 21 August 2026_

**Repository:** `Archil3s/Blenheim-Garden`  
**Production branch:** `main`

## Product

Blenheim Garden is a visual home-garden planner for Blenheim, Marlborough. The measured garden canvas is the application: keep it visually dominant, keep controls compact, and use a GrowVeg-like interaction model without copying proprietary code or artwork.

The working canvas is **900 × 1080 cm-equivalent pixels**, treated as approximately **9 m × 10.8 m**. The base plan contains the existing 12 numbered beds plus the berry/cane area.

### Current UX direction

Prioritise refinement of the existing planning experience over adding more feature surface.

The canvas should read as a **garden first and an editor second**:

- beds should feel like physical raised beds / soil rather than white UI rectangles
- planted crops and their real spacing should be the dominant visual information
- planting-area boundaries should recede until hover, selection or drag interaction
- selection state should be obvious without covering the garden in permanent outlines
- drag/drop should clearly answer “where can I put this?” and “what will happen if I release?”
- crop labels should remain readable but secondary to plant positions
- inspector/catalogue controls should feel calm, compact and tactile rather than form-heavy
- preserve real centimetre spacing and measured layout even while simplifying the visual presentation

## Stack and live Cloudflare storage

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- D1 database `blenheim-garden`, binding `DB`
- private R2 bucket `blenheim-garden-media`, binding `GARDEN_MEDIA`
- protected writes via Worker secret `GARDEN_WRITE_TOKEN`

D1 has the 12 original beds saved. R2 photo/video upload, viewing and deletion are live. Notes, harvests and crop milestone dates use the existing D1 schema.

Never commit or expose `GARDEN_WRITE_TOKEN`. The browser stores an entered edit key only in `sessionStorage`.

## Drawing / GrowVeg V4 interface

The planner uses the compact GrowVeg V4-style workspace while preserving the Drawing Interface V2 object model and persistence.

Application chrome:

- title bar: garden, Settings, Save, Plan/Photos/Notes
- quick bar: Undo, Redo, 10 cm Snap toggle, Zoom, Month, cloud state
- readable left drawing rail
- context-sensitive inspector/tool panel
- measured grid/rulers and live X/Y coordinates

Real drawing tools:

- **Select** — move/edit objects; resize beds/trees; reshape rows/paths/trellises using handles
- **Plants** — pick up crops, preview the footprint, click for patches, drag for rows
- **Rows** — draw planting rows with live length/plant count
- **Bed** — click-drag a new bed with live dimensions
- **Path** — click-drag a path and edit width/label
- **Trellis** — click-drag and edit height/post spacing/label
- **Tree** — click to place, then move/resize canopy and rename
- **Text** — click to place, then move/edit text and font size

Objects use 10 cm snap by default and display live drawing measurements. Selected objects support duplicate/delete where appropriate.

### Planting areas and true centimetre spacing

GrowVeg V4 planting areas support multiple crops in one bed and can be dragged/resized independently.

`lib/garden/plant-spacing-layout.ts` is the source of truth for plant counts and icon coordinates. Plant centres are positioned using the actual `spacingCm` value at the garden's centimetre scale instead of cosmetic CSS gaps.

Supported patterns:

- grid / block
- staggered
- rows
- natural
- single

The planting inspector displays actual spacing in centimetres and recalculates count after area or bed resizing. Large planting areas are sampled for rendering performance while preserving the logical plant count.

### Planner UX polish layers

The current UI passes are additive and do not change planner persistence or true spacing logic.

They currently:

- give beds a warmer raised-bed / soil treatment with subtle texture
- reduce permanent planting-area borders/backgrounds so plants carry the visual weight
- strengthen hover/selection states only when needed
- keep planting labels and row captions contextual instead of permanently covering plants
- add hover/selection information cards outside the planted patch
- add click-to-pick-up planting with a live ghost footprint
- add click-and-drag row drawing with live length/count feedback
- support **Shift** for horizontal/vertical row lock
- support **Ctrl** for repeated placement of the same crop/variety
- preserve existing drag/drop as a fallback
- include mobile and reduced-motion adjustments

### Botanical plant markers

`components/botanical-plant-icons-bridge.tsx` and `app/botanical-plant-icons.css` replace the displayed emoji glyphs with original top-down crop markers while leaving the saved crop icon and true coordinates untouched.

Current marker set:

- tomato
- strawberry
- bean
- lettuce
- pumpkin
- carrot
- broccoli
- raspberry
- blueberry
- herbs

The marker bridge tags existing rendered plant nodes from the crop emoji and applies the same marker language to:

- crop catalogue cards
- selected crop / ready strip
- click-placement ghost previews
- planted areas
- row-drawing previews
- saved planting rows

Dense crops such as carrots and beans are intentionally rendered smaller so real spacing remains legible; wide-spaced crops such as pumpkins and blueberries can carry more visual mass. Unknown crops retain the existing fallback rendering. This layer must never move plant centres or alter `spacingCm`, counts, plan persistence, D1 data, or saved crop metadata.

### Saved planner payload

`lib/garden/planner-plan.ts` defines `beds`, `plantingAreas`, `rows`, and `objects` (`path`, `trellis`, `tree`, `text`). Older local plans without planting areas or objects are normalised to the current model.

### D1 layout persistence

`lib/garden/layout-schema.ts` idempotently bootstraps Drawing V2/V4 schema when `/api/garden` runs:

- adds nullable `beds.archived_at` when missing
- creates `layout_objects` and its index when missing
- seeds the original main/cross paths, north trellis/tree, Entrance and Exit only when the table is first created

Do not add a duplicate non-idempotent migration for this runtime-bootstrap schema without first coordinating migration/bootstrap state.

## Blenheim Now seasonal guide

The seasonal layer is additive and does not change the saved-plan or D1 schema.

Files:

- `lib/garden/blenheim-season.ts` — Blenheim/Marlborough seasonal crop guidance, frost-risk summaries and weekly tasks
- `lib/garden/planner-actions.ts` — typed browser event used to request a crop in the planner
- `components/blenheim-season-guide.tsx` — compact **Blenheim Now** UI with **Today** and **This Week** views
- `components/season-planner-action-bridge.tsx` — connects seasonal recommendations to the existing planner controls
- `app/blenheim-season-guide.css` — guide and planner-action styling

The guide uses the user's current browser month by default and also lets the user inspect another month. Guidance is intentionally conservative for a Blenheim home garden, especially for frost-tender warm-season crops.

The first crop set mirrors the current planner catalogue: tomato, strawberry, bean, lettuce, pumpkin, carrot, broccoli, raspberry, blueberry and herbs.

Actionable recommendations include **Use in planner** controls. Choosing a recommended crop closes the guide, syncs the planner month, opens Plants, clears hiding filters and selects that crop ready for placement.

Frost guidance uses historical Blenheim climatology as a planning aid, not as a weather forecast.

## Notes & Harvests

The selected-bed **Notes & harvests** button and top **Notes** tab are functional through `components/garden-records-dialog-bridge.tsx` and `app/api/garden/records/route.ts`.

Bed workflow includes crop milestone dates, dated notes, harvest records and chronological history. All writes/deletes use the same `GARDEN_WRITE_TOKEN` edit key.

## Media

Bed **Photos & video** and the top **Photos** tab use private R2 through Worker APIs. Bed media targeting uses the stable bed ID rather than the editable bed name.

Strict app limits:

```text
2 GB total
6 MB per photo
25 MB per video
500 files
```

Allowed: JPEG, PNG, WebP, HEIC/HEIF, MP4, WebM, MOV/QuickTime. The browser validates for UX and the Worker validates again before R2 writes.

## Important files

- `components/garden-planner.tsx` — GrowVeg V4 planner interactions and canvas
- `components/botanical-plant-icons-bridge.tsx` — crop marker tagging layer
- `app/botanical-plant-icons.css` — original top-down crop marker artwork/styling
- `components/growveg-click-place-bridge.tsx` — click pickup/placement and drag-row bridge
- `components/growveg-modifier-keys-bridge.tsx` — Shift/Ctrl placement modifiers
- `app/growveg-workspace.css` — base workspace/canvas styling
- `app/growveg-v4.css` — planting-area and V4 styling
- `app/planner-ux-polish.css` — bed/planting/catalogue/interaction polish
- `app/planting-flow-polish.css` — planting flow and contextual editing polish
- `app/growveg-hover-info.css` — contextual plant/row hover cards
- `app/growveg-click-place.css` — pickup/ghost footprint styling
- `app/growveg-row-draw.css` — row drawing preview styling
- `app/growveg-modifier-keys.css` — placement modifier feedback
- `app/planner-interactions.css` — pointer/cursor interaction rules
- `lib/garden/planner-plan.ts` — shared planner state types
- `lib/garden/plant-spacing-layout.ts` — true centimetre plant layout/count engine
- `lib/garden/blenheim-season.ts` — local seasonal/frost guidance
- `lib/garden/planner-actions.ts` — seasonal → planner action event contract
- `components/blenheim-season-guide.tsx` — Today / This Week seasonal UI
- `components/season-planner-action-bridge.tsx` — seasonal recommendation planner bridge
- `lib/garden/layout-schema.ts` — idempotent D1 Drawing schema bootstrap
- `app/api/garden/route.ts` — planner GET/PUT persistence
- `app/api/garden/records/route.ts` — notes, harvests and milestone API
- `components/garden-records-dialog-bridge.tsx` — Notes & Harvests UI
- `lib/garden/cloudflare-db.ts` — DB/R2 bindings
- `app/api/garden/media/route.ts` — media list/upload
- `app/api/garden/media/[id]/route.ts` — media stream/delete
- `components/garden-media-dialog-bridge.tsx` — media UI
- `docs/CLOUDFLARE_STORAGE.md` — storage reference

## Deployment

```text
Production branch: main
Build:  npx @opennextjs/cloudflare build
Deploy: npx @opennextjs/cloudflare deploy
```

Keep package `build` as `next build`, keep `next.config.ts` output `standalone`, and preserve both DB and R2 bindings in `wrangler.jsonc`.

## Current checkpoint

Implemented before this handoff:

1. Drawing / GrowVeg V4 interface and measured physical layout.
2. Multiple planting areas per bed with drag/resize.
3. True centimetre-scale plant counts and icon placement.
4. Save → cloud persistence for planner layout.
5. D1 Notes & Harvests with planting milestones.
6. Private R2 photos/video.
7. Blenheim seasonal guidance and **Blenheim Now** Today / This Week UI.
8. Seasonal crop recommendations select the crop directly in the planner and sync the planner month.
9. Physical bed/soil UX polish with quieter editing chrome.
10. Contextual planting hover cards outside plant geometry.
11. Click-to-pick-up planting with a true-size ghost footprint.
12. Drag-to-draw rows with live length/count preview.
13. Shift straight-row lock and Ctrl repeat placement.
14. Original botanical crop markers replacing emoji at rendered plant centres while preserving saved crop metadata and true spacing.

## Next priorities

Keep the next work **UI/interaction-first**, not feature-first:

1. Visually test the botanical markers at 50%, 90%, 100%, 120% and 150% zoom and tune dense-crop legibility.
2. Refine selected planting/bed handles and dimension feedback.
3. Improve catalogue/inspector hierarchy and touch targets at narrower widths.
4. Review paths, trellises, trees and labels so their visual language matches the physical bed/planting style.
5. Polish alignment/snapping feedback and keyboard interactions based on actual use.
6. Run build/lint and production smoke tests before merge/deploy.

Defer larger feature additions such as succession reminders, occupancy history or crop-rotation views until the core planner interaction/design feels settled.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first.
Preserve GrowVeg V4, true centimetre plant spacing, Notes & Harvests, the measured physical garden layout, D1 DB binding, private R2 GARDEN_MEDIA binding, protected GARDEN_WRITE_TOKEN writes, strict media quotas, additive Blenheim Now seasonal guidance/actions, click-to-place / drag-row interactions, placement modifier keys, and the original botanical crop marker layer. Prioritise core planner UI/UX refinement over adding new feature surface. Inspect the current implementation before changing it.
```
