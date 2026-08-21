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
- crop markers should read like a garden plan, not scattered emoji

## Stack and live Cloudflare storage

- Next.js `16.2.11`
- React `19.2.x`
- TypeScript `5.9.x`
- OpenNext Cloudflare `1.20.2`
- Wrangler `4.124.0`
- D1 database `blenheim-garden`, binding `DB`
- private R2 bucket `blenheim-garden-media`, binding `GARDEN_MEDIA`
- protected writes via Worker secret `GARDEN_WRITE_TOKEN`

Never commit or expose `GARDEN_WRITE_TOKEN`. The browser stores an entered edit key only in `sessionStorage`.

## Drawing / GrowVeg V4 interface

The planner uses the compact GrowVeg V4-style workspace while preserving the Drawing Interface V2 object model and persistence.

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

`lib/garden/plant-spacing-layout.ts` is the source of truth for plant counts and icon coordinates. Plant centres are positioned using the actual `spacingCm` value at the garden's centimetre scale instead of cosmetic CSS gaps.

Supported patterns: grid/block, staggered, rows, natural, single.

### Planner UX polish layers

Current additive UX layers:

- physical raised-bed / soil treatment
- quieter planting boundaries
- contextual labels and hover cards
- click-to-pick-up planting with a true-size ghost footprint
- click-and-drag row drawing with live length/count feedback
- **Shift** horizontal/vertical row lock
- **Ctrl** repeated crop/variety placement
- native drag/drop fallback
- mobile and reduced-motion handling

### Botanical plant markers

`components/botanical-plant-icons-bridge.tsx` and `app/botanical-plant-icons.css` replace the displayed emoji glyphs with original top-down crop markers while leaving the saved crop icon, crop metadata, true centimetre positions and counts untouched.

Current markers: tomato, strawberry, bean, lettuce, pumpkin, carrot, broccoli, raspberry, blueberry and herbs.

The same marker language is used in crop catalogue cards, the selected crop ready strip, placement ghosts, planted areas, row previews and saved planting rows. Dense crops such as carrots and beans render smaller; wide-spaced crops such as pumpkins and blueberries render larger without moving their centres. Unknown crops retain the existing fallback rendering.

Marker design goals:

- readable from normal planner zoom without looking like UI badges
- top-down / garden-plan feel rather than emoji
- crop-specific silhouettes and colour cues
- subtle soil/contact shadow rather than heavy outlines
- preserve random/natural rotation where the spacing engine already supplies it
- never fake spacing by shifting or padding plant centres

## Blenheim Now seasonal guide

Seasonal guidance is additive and does not change the saved-plan or D1 schema. **Use in planner** syncs the planner month and selects a recommended crop ready for placement.

## Notes, harvests and media

Notes/harvests use the existing D1 schema. Photos/video use private R2 with the existing strict quota rules. All protected writes continue to use `GARDEN_WRITE_TOKEN`.

## Important files

- `components/garden-planner.tsx` — planner state/interactions/canvas
- `components/botanical-plant-icons-bridge.tsx` — crop marker tagging layer
- `app/botanical-plant-icons.css` — original top-down crop marker artwork/styling
- `components/growveg-click-place-bridge.tsx` — click pickup/placement and drag-row bridge
- `components/growveg-modifier-keys-bridge.tsx` — Shift/Ctrl placement modifiers
- `app/growveg-workspace.css` — base workspace/canvas styling
- `app/growveg-v4.css` — planting-area and V4 styling
- `app/planner-ux-polish.css` — bed/planting/catalogue polish
- `app/planting-flow-polish.css` — planting flow polish
- `app/growveg-hover-info.css` — contextual hover cards
- `app/growveg-click-place.css` — pickup/ghost styling
- `app/growveg-row-draw.css` — row-drawing preview
- `app/growveg-modifier-keys.css` — modifier feedback
- `lib/garden/plant-spacing-layout.ts` — true centimetre layout/count engine
- `lib/garden/blenheim-season.ts` — local seasonal/frost guidance
- `app/api/garden/route.ts` — planner persistence
- `app/api/garden/records/route.ts` — notes/harvests
- `components/garden-records-dialog-bridge.tsx` — notes/harvest UI
- `app/api/garden/media/route.ts` — media list/upload
- `components/garden-media-dialog-bridge.tsx` — media UI

## Deployment

```text
Production branch: main
Build:  npx @opennextjs/cloudflare build
Deploy: npx @opennextjs/cloudflare deploy
```

## Current checkpoint

1. Measured GrowVeg V4 drawing interface.
2. Multiple planting areas per bed with drag/resize.
3. True centimetre plant counts and positions.
4. Cloud persistence, Notes & Harvests and private R2 media.
5. Blenheim seasonal guidance and planner actions.
6. Physical bed/soil UX polish and contextual hover information.
7. Click-to-pick-up planting and live ghost footprint.
8. Drag-to-draw rows with live length/count preview.
9. Shift straight-row lock and Ctrl repeat placement.
10. Original botanical crop markers replacing emoji at rendered plant centres while preserving saved crop metadata and true spacing.

## Next priorities

1. Visually test botanical markers across planner zoom levels and tune crop density if needed.
2. Refine selected planting/bed handles and dimension feedback.
3. Improve catalogue/inspector hierarchy and narrow-width touch targets.
4. Bring paths, trellises, trees and labels into the same physical visual language.
5. Run build/lint and production smoke tests before merge/deploy.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first. Preserve true centimetre plant spacing, the measured physical layout, D1/R2 bindings, GARDEN_WRITE_TOKEN protection, Blenheim seasonal guidance/actions, click-to-place / drag-row interactions, placement modifier keys, and the botanical crop marker layer. Prioritise core planner UI/UX refinement over adding new feature surface.
```
