import fs from "node:fs";

const routePath = "app/api/garden/route.ts";
let source = fs.readFileSync(routePath, "utf8");

const before = (source.match(/GARDEN_ID/g) ?? []).length;
source = source.replaceAll(", GARDEN_ID,", ", gardenId,");
const after = (source.match(/GARDEN_ID/g) ?? []).length;

// After this repair the only legitimate GARDEN_ID references are the import and
// the default fallback in gardenIdFromRequest().
if (after !== 2) {
  throw new Error(`Expected exactly 2 GARDEN_ID references after repair; found ${after} (before ${before}).`);
}

fs.writeFileSync(routePath, source);

const buildPath = ".github/workflows/build.yml";
const normalBuild = `name: Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1.2.15\n      - run: bun install\n      - run: bun run build\n`;
fs.writeFileSync(buildPath, normalBuild);

for (const path of ["scripts/fix-multi-garden-bindings.mjs"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
