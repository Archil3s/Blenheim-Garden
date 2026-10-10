# Blenheim Garden

A visual home-garden planner for Blenheim, Marlborough.

_Last updated: 22 August 2026_

## Current status

### Vegetable 3D model library

Open `/3d-models`, or choose **Vegetable models** in the 3D garden toolbar.
All indexed vegetables have textured plant-only GLB models, with desktop/mobile
detail and garden integration. The library covers 29 vegetable types plus
raspberry, with 53 catalogue entries including all 30 indexed vegetable varieties.
Models have smoother curved foliage, fine veins and surface normals, tapered
stems, layered asparagus tips and individually modelled raspberry drupelets.
See [the model library guide](docs/vegetable-model-library.md).

### Detailed tomato model test

Open `/3d-models/tomato`, or choose **Tomato model** in the 3D garden toolbar,
to rotate the revised vegetable-only mesh, adjust its growth/density/ripeness
and download it as GLB. See [the model test guide](docs/tomato-model-test.md).
The revised tomato also renders in live 3D garden beds, rows and editor placements,
using shared desktop/mobile models to keep repeated plants manageable.

### Isolated 3D asset showroom

`/3d-audit` generates a deterministic catalogue from the planner, artwork
registries, production geometry kinds, resolver aliases, structure presets and
public artwork files. It never reads or saves a garden. Search IDs, inspect
measured bounds and warnings, force desktop/mobile detail, compare existing
render paths, and hide panels with Screenshot mode. See
[the audit guide](docs/3d-audit.md).

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

### Blenheim seasonal guidance

The quick bar includes **Today** and **This Week** garden actions tailored to Blenheim conditions.

The first version:

- uses Blenheim 1991–2020 monthly ground-frost normals to grade seasonal frost risk
- gives crop actions as **Do now**, **Under cover**, **Coming up**, or **Wait**
- covers the crops already in the planner: Tomato, Strawberry, Bean, Lettuce, Pumpkin, Carrot, Broccoli, Raspberry, Blueberry and Herbs
- separates protected sowing from outdoor planting for frost-sensitive crops
- lets an action jump directly to that crop in the Plants panel
- links the climate/planting guidance sources inside the seasonal drawer

This is seasonal guidance rather than a live weather forecast. Tender-crop recommendations still tell the user to check the actual local forecast before planting outside.

### Seasonal occupancy & crop rotation

The top navigation now includes **Rotation**, and every selected bed/planting has a **Rotation history** action.

The rotation view:

- reads the existing permanent planting history from D1; no duplicate history table is required
- shows the current and previous occupants of every bed
- groups crops by botanical family for practical rotation guidance
- shows an 18-month month-by-month occupancy timeline for each bed
- highlights repeated recent crop families as a caution
- suggests different crop-family options that can be selected directly in the Plants panel
- treats perennial fruit separately from annual rotation
- keeps rotation advice deliberately advisory rather than presenting it as a hard rule

The history uses existing planting `status`, `start_date`, `end_date`, sow/transplant dates and retained finished planting records.

### Persistence and storage

- Next.js 16
- React 19
- TypeScript 5.9
- OpenNext for Cloudflare Workers
- Cloudflare D1 database: `blenheim-garden`
- private R2 media bucket: `blenheim-garden-media`
- protected writes via `GARDEN_WRITE_TOKEN`

D1 stores beds, planting rows, layout objects, notes, harvests, crop milestone dates and planting history. Removed beds are archived rather than destructively deleted so historical planting and media relationships are preserved.

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

## Build verification

Pull requests and pushes to `main` run the repository **Build** workflow using Bun and `bun run build`.

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

1. Visually test Drawing V2, Notes & Harvests, **Today / This Week**, and **Rotation** on production, including Save → refresh persistence and mobile layout.
2. Polish alignment, snapping and keyboard shortcuts based on actual use.
3. Link photos directly to harvest records and richer crop timelines.
4. Expand the seasonal catalogue beyond the initial planner crops.
5. Consider optional live forecast-aware frost warnings and more detailed bed-health/rotation notes later.

## Development handoff

Read `PROJECT_CONTEXT.md` before making substantial changes. It is the detailed source of truth for current architecture, storage and implementation constraints.


The shared 3D garden editor and compatible placement persistence are described in [docs/3d-editor.md](docs/3d-editor.md).

The upright hoop/cover fixes, crop-specific models and variety artwork are
described in [docs/plant-structure-redesign.md](docs/plant-structure-redesign.md).

The shared vegetable artwork and 3D botanical theme are described in [docs/vegetable-theme.md](docs/vegetable-theme.md).
