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
- crop markers should read like a garden plan, not scattered emoji
- planting-area boundaries should recede until hover, selection or drag interaction
- labels should stay contextual and secondary to plant positions
- preserve real centimetre spacing and measured layout while simplifying the visual presentation

## Stack and storage constraints

- Next.js `16.2.11`, React `19.2.x`, TypeScript `5.9.x`
- D1 `blenheim-garden` binding `DB`
- private R2 `blenheim-garden-media` binding `GARDEN_MEDIA`
- protected writes via `GARDEN_WRITE_TOKEN`
- edit key remains in browser `sessionStorage`

Never commit or expose `GARDEN_WRITE_TOKEN`.

## Planner interaction model

- Select/move/resize existing objects
- Plants: pick crop → preview footprint → click for patch / drag for row
- Shift: horizontal/vertical row lock
- Ctrl: repeated placement of the same crop/variety
- Bed/path/trellis/tree/text drawing retained
- 10 cm snap retained

## True spacing

`lib/garden/plant-spacing-layout.ts` remains the source of truth for counts and plant-centre coordinates. The botanical icon pass does **not** alter `spacingCm`, counts or the saved plan.

Supported planting patterns remain grid/block, staggered, rows, natural and single.

## Botanical plant markers

`components/botanical-plant-icons-bridge.tsx` and `app/botanical-plant-icons.css` replace displayed emoji glyphs with original top-down crop markers while preserving the existing saved `cropIcon` values as fallback metadata.

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

The same visual marker language is used in:

- crop catalogue cards
- selected crop / ready strip
- click-placement ghost previews
- planted areas
- drag-row previews
- saved planting rows

Visual scaling is crop-aware: dense carrots/beans render smaller so centres remain readable; pumpkin/blueberry markers can carry more visual mass because their real spacing is wider. Existing natural-layout rotations continue to come from the spacing engine.

Unknown crops retain the previous fallback rendering.

## Other retained UX layers

- physical raised-bed / soil styling
- quieter planting-area borders
- contextual hover information outside planted geometry
- click-to-pick-up / ghost placement
- drag-to-draw rows with live length/count
- modifier shortcuts
- mobile/reduced-motion support

## Seasonal guide

Blenheim Now remains additive and outside the saved-plan schema. **Use in planner** still syncs month and selects the recommended crop ready for placement.

## Notes, harvests and media

Notes/harvests continue to use the existing D1 schema. Photos/video continue through private R2 with the existing quota rules and protected writes.

## Important files

- `components/garden-planner.tsx`
- `components/botanical-plant-icons-bridge.tsx`
- `app/botanical-plant-icons.css`
- `components/growveg-click-place-bridge.tsx`
- `components/growveg-modifier-keys-bridge.tsx`
- `app/growveg-v4.css`
- `app/planner-ux-polish.css`
- `app/planting-flow-polish.css`
- `app/growveg-hover-info.css`
- `app/growveg-click-place.css`
- `app/growveg-row-draw.css`
- `app/growveg-modifier-keys.css`
- `lib/garden/plant-spacing-layout.ts`
- `app/api/garden/route.ts`
- `app/api/garden/records/route.ts`
- `app/api/garden/media/route.ts`

## Deployment

```text
Production branch: main
Build:  npx @opennextjs/cloudflare build
Deploy: npx @opennextjs/cloudflare deploy
```

## Current checkpoint

1. Measured GrowVeg-style drawing interface.
2. Multiple planting areas with true centimetre spacing/counts.
3. D1 plan persistence, Notes & Harvests, private R2 media.
4. Blenheim seasonal guide/action bridge.
5. Physical garden visual polish and contextual labels.
6. Click-to-place ghost planting and drag-row creation.
7. Shift straight-row lock and Ctrl repeat placement.
8. Original crop-specific botanical markers replacing rendered emoji while preserving true positions and saved metadata.

## Next priorities

1. Visually test the markers at several planner zoom levels and tune only if density/readability needs it.
2. Refine selected bed/planting handles and dimension feedback.
3. Bring paths, trellises, trees and labels into the same physical visual language.
4. Run build/lint and production smoke tests before merge/deploy.

## New-chat bootstrap

```text
Work on Archil3s/Blenheim-Garden. Read PROJECT_CONTEXT.md first. Preserve true centimetre plant spacing, measured layout, D1/R2 bindings, protected writes, Blenheim seasonal guidance/actions, click-to-place / drag-row interactions, modifier keys, and the botanical crop marker layer. Prioritise core planner UI/UX refinement over adding new feature surface.
```
