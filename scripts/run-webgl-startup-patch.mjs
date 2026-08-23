import fs from "node:fs";

await import("./patch-webgl-startup.mjs");

const normalBuild = `name: Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1.2.15\n      - run: bun install\n      - run: bun run build\n`;

fs.writeFileSync(".github/workflows/build.yml", normalBuild);
for (const path of ["scripts/patch-webgl-startup.mjs", "scripts/run-webgl-startup-patch.mjs"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
