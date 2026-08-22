# Blenheim Garden

A visual home-garden planner for Blenheim, Marlborough.

_Last updated: 22 August 2026_

## Current status

The measured garden canvas is the main application. The working plan is approximately **9 m × 10.8 m** and preserves the original 12 numbered beds plus the berry/cane area.

### Drawing Interface V2

The planner currently supports:

- **Select** — move/edit objects; resize beds and trees; reshape rows, paths and trellises
- **Plants** — choose crop/variety and fill a bed
- **Rows** — drag planting rows with live length and plant count
- **Bed** — click-drag new beds with live dimensions
- **Path** — draw paths and edit width/label
- **Trellis** — draw trellises and edit height/post spacing/label
- **Tree** — place, move and resize tree canopies
- **Text** — place and edit garden labels
- 10 cm snapping by default
- live X/Y coordinates and measurements
- duplicate/delete controls where appropriate
- true centimetre-based plant spacing on the canvas

### Persistence and storage

- Next.js 16
- React 19
- TypeScript 5.9
- OpenNext for Cloudflare Workers
- Cloudflare D1 database: `blenheim-garden`
- private R2 media bucket: `blenheim-garden-media`
- protected writes via `GARDEN_WRITE_TOKEN`

D1 stores beds, planting rows, layout objects, notes, harvests and crop milestone dates. Removed beds are archived rather than destructively deleted so historical planting and media relationships are preserved.

### Notes & harvests

The planner supports:

- current crop/variety per bed
- Sown, Germinated and Transplanted dates
- dated bed or planting notes
- harvest date
- weight in g/kg
- quantity/unit
- harvest notes
- chronological history including finished plantings
- deletion of individual notes and harvest records
- whole-garden notes from the top Notes tab

### Photos & video

Private R2-backed media upload, viewing and deletion are live for both individual beds and the whole garden.

Current application limits:

```text
2 GB total
6 MB per photo
25 MB per video
500 files
```

Supported media includes JPEG, PNG, WebP, HEIC/HEIF, MP4, WebM and MOV/QuickTime.

## Local development

```bash
npm install
npm run dev
```

## Cloudflare deployment

Production branch:

```text
main
```

Build and deploy:

```text
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy
```

The Worker name is:

```text
blenheim-garden
```

Keep the normal package build script as:

```text
npm run build -> next build
```

Do not change it to run OpenNext itself when Cloudflare is already running the OpenNext build command. Preserve both the D1 and R2 bindings in `wrangler.jsonc`.

Never commit or expose `GARDEN_WRITE_TOKEN`.

## Next priorities

1. Visually test Drawing V2 and Notes & Harvests on production, including Save → refresh persistence.
2. Polish alignment, snapping and keyboard shortcuts based on actual use.
3. Add Blenheim-specific planting and frost windows plus **Today / This Week** actions.
4. Add seasonal occupancy and crop-rotation history views.
5. Link photos directly to harvest records and richer crop timelines if useful.

## Development handoff

Read `PROJECT_CONTEXT.md` before making substantial changes. It is the detailed source of truth for current architecture, storage and implementation constraints.
