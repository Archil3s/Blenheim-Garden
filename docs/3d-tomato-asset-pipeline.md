# Tomato GLB asset pipeline — Blenheim Garden

**Status:** First real binary-asset delivery, **not photorealistic**. Work in [PR #50](https://github.com/Archil3s/Blenheim-Garden/pull/50). Companion isolated 3D showcase [PR #49](https://github.com/Archil3s/Blenheim-Garden/pull/49) is not yet merged into production.

## Current deliverable

- Deterministic **glTF 2.0 binary files**; nine independent `.glb` assets for tomato `seedling`, `vegetative`, `fruiting` × LOD 0/1/2.
- Files written to `public/assets/plants/tomato/<stage>/lod<level>.glb` by `scripts/3d/generate-tomato-assets.mjs`.
- Each GLB contains distinct mesh geometry, normal vectors, PBR material parameters, and a packed original PNG foliage atlas. The binary is produced by Node before `next build` and before OpenNext/Cloudflare packaging.
- `lib/3d/tomato-assets.ts` describes the fixed, typed public paths and mobile LOD policy.
- `GLTFLoader` fetches the GLB over HTTP in `/3d-showcase` and inserts two copies into the unchanged 2 × 4 m demo bed. It is **not** rendering a browser-built Three.js tomato in that mode.
- The mode switch preserves existing `Current low-poly` and `Procedural study` comparisons.
- `scripts/3d/check-tomato-assets.mjs` rejects missing/corrupt GLB headers, missing binary chunks, misplaced buffer views, missing embedded texture, incorrect stage/LOD metadata or mismatched manifest lengths.

## Development commands

```bash
bun install --frozen-lockfile
bun run assets:tomato   # emits all 9 .glb files into public/
bun run assets:test     # verifies binary glTF 2.0 structure
bun run build           # generates + verifies + builds Next.js
bun run dev             # generates assets before starting dev
bun run build:cloudflare # generates + verifies before packaging static assets
```

Generated files are build artifacts; **the editable source of the current starter asset is the generator script**, not the generated binary. The generated assets are excluded from source control (see `.gitignore`). CI uploads the real files and screenshots as short-lived review artifacts.

## Asset coordinate contract (for subsequent Blender replacements)

- World units: **1 unit = 1 metre**. Y is vertical, X/Z ground plane.
- Model pivot: centre of plant at root/soil surface, y = 0.
- Named stages and height reference: seedling ~0.20 m, vegetative ~0.77 m, fruiting ~1.35 m.
- Tomato foliage: pinnate compound leaves, visible leaflet venation and petioles; truss/cluster morphology; separate orange ripe and green unripe fruits; small calyxes; optional blossoms.
- GLB must be *self-contained*, with packed images and no external texture URLs; publish provenance and license for every texture/model.
- Use a separate LOD0 hero mesh (near), LOD1 garden view (medium/mobile), LOD2 distant/thumbnail (far), progressively fewer triangles. Distinct **growth stages** are not interchangeable with LODs.
- Keep PBR material maps in glTF 2.0 conventions; avoid gloss-heavy plastic leaves and uniform solid-green surfaces. Actual high-quality leaf albedo/normal/roughness maps and controlled translucency are still missing.
- Do not embed animation or external dependencies until a real performance comparison justifies them.

## Current hard limit

The generator's curved leaves, procedural vein atlas and truss meshes represent a **starter species prototype**. They are still authored with algorithms, not photoscanned/Blender hand-finished foliage. Better geometry and textured materials must be created or sourced under clear licensing before promising image-like realism. The earlier AI visual concept is a **reference**, not a screenshot or achievable guarantee from this first generator.

## Next milestone — authored GLB replacements

1. Model or acquire a legally usable, botanically accurate **fruiting tomato** in Blender. Build compound leaflet geometry, realistic fruit trusses and appropriate albedo/normal/roughness maps.
2. Export `glTF 2.0 Binary (.glb)`, with packed textures and applied scale. Provide source `.blend` (or documented upstream license) and the model's provenance separately.
3. Author three growth stages, then 2–3 independently optimized LODs. Check plant heights and pivots.
4. **Replace the generation output and version the source files** through an explicit vetted import step; do not simply drop a model into `public/` while the starter generator runs, because that folder is regenerated before every build.
5. Run `glTF-Transform` for mesh/texture optimization, then run file validation, 4-viewport browser screenshot comparison, and real device performance checks.
6. Promote into the saved `/3d` garden only after the user accepts actual rendered screenshots.

## Acceptance and evidence

| Gate | Status |
| --- | --- |
| Generate nine nonempty binary GLBs | Passed in CI on build `f3b6b5e5` |
| Validate GLB header/JSON/BIN, texture, manifest and LOD decrease | Passed in CI on build `f3b6b5e5` |
| Next.js lint and production build | Passed in CI on build `f3b6b5e5` |
| Cloudflare packaging (without production deployment) | Pending |
| Three.js browser glTF loading / screenshot review | Pending |
| External visual acceptance vs photorealistic concept | Not achieved |
| iPhone physical device profiling | Pending |

Track observations in [DESIGN_PROGRESS.md](DESIGN_PROGRESS.md). Do not mark screenshot tests complete based solely on the binary validation.
