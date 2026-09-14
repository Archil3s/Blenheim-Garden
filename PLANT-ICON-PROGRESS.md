# Plant icon progress — 14 September 2026

Goal: complete individual PNG catalogue and connect the shared 2D/3D resolver.

## Current counts
- Required by current app: 58 plant/variety entries.
- Imported existing PNGs: 16 (complete means an available imported file, not a newly generated asset).
- Newly generated assets passing QC: 0.
- Remaining individual PNGs: 42.
- Last imported alphabetical plant: Asparagus Pacific Purple.
- Next missing plant: Asparagus Pea.
- Full Kings Seeds catalogue: not present in the repository or attached bundle; current count is NOT the full Kings catalogue.

## Changes
Imported the 16 supplied PNGs byte-for-byte. Preserved their 512×512 RGBA dimensions and existing artwork; target 256×256 derivatives remain to be prepared. Added manifest.json with explicit crop/variety records for every current catalogue entry. Shared plantIconSprite resolves available PNGs as 1×1 textures, used by both PlantArt and WebGL. Existing sprite fallback retained for unfinished entries.

## Quality and blockers
All imported files decode as RGBA with transparent pixels; a contact-sheet review confirmed the supplied style. Some originals contain stray fragments near lower edges (Angelica, Anise/Anise Hyssop) and the artichoke appears truncated at its top. Preserve masters, but prepare cleaned derivatives before final asset acceptance.
Two built-in image-generation attempts for Asparagus Pea returned RGB with painted checkerboards, even after an explicit transparency extraction retry. Both rejected, excluded from manifest and commits. Do not label either complete.

## Validation
- npm install succeeded (Bun unavailable).
- npm run build passed, including TypeScript.
- npx eslint lib/garden/plant-icons.ts passed.
- Full npm run lint: 13 errors and 9 warnings, all in unchanged files (including app/3d/error.tsx and existing React effect code).
- git diff --check passed.
- Browser verification incomplete: Playwright Chromium download returned HTTP 502. Local next start also reported uv_interface_addresses system error.
- No deployment, merge, production data writes or browser verification claimed.

## Exact next steps
1. Obtain working transparent generation output; regenerate Asparagus Pea as its own PNG, inspect alpha and anatomy before adding.
2. Preserve original imported masters; prepare clean 256×256 derivatives and inspect each at small size on contrasting backgrounds.
3. Continue missing list below, one distinct image generation per plant; update manifest only after QC.
4. Obtain the associated full Kings Seeds catalogue and extend the audit without inventing coverage.
5. Run browser verification at 1920×1080, 1440×900, 1024×768 and 390×844: select available plants, inspect 2D rendering, verify individual texture requests and transparent 3D rendering, selection, pan and zoom.
6. Keep changes on the review branch until browser and asset acceptance gates pass.

## Missing individual PNGs
- asparagus-pea
- aster
- astragalus
- basil-compact
- bean-climbing-bean
- bean-king-purple
- bean-scarlet-runner
- bean-superstar
- blueberry-rabbiteye
- blueberry-southern-highbush
- blueberry-unknown
- broccoli-calabrese
- broccoli-green-dragon
- broccoli-winter-rudolph
- carrot-amsterdam
- carrot-chantenay
- carrot-nantes
- carrot-rainbow
- herbs-basil
- herbs-chives
- herbs-parsley
- herbs-thyme
- lettuce-butterhead
- lettuce-cos
- lettuce-iceberg
- lettuce-loose-leaf
- pumpkin-butternut
- pumpkin-crown
- pumpkin-gem-squash
- pumpkin-kabocha
- raspberry-aspiring
- raspberry-heritage
- raspberry-unknown-cane
- raspberry-waiau
- strawberry-albion
- strawberry-camarosa
- strawberry-monterey
- strawberry-unknown-crown
- tomato-beefsteak
- tomato-black-krim
- tomato-moneymaker
- tomato-roma
