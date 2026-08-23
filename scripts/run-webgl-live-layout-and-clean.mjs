import fs from "node:fs";

await import("./apply-webgl-live-layout.mjs");

const normalBuild = `name: Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1.2.15\n      - run: bun install\n      - run: bun run build\n`;

fs.writeFileSync(".github/workflows/build.yml", normalBuild);
for (const path of [
  ".github/workflows/apply-webgl-live-layout.yml",
  "notes/webgl-exact-live-layout.md",
  "notes/webgl-exact-live-layout-trigger.txt",
  "notes/webgl-exact-live-layout-status.txt",
  "notes/webgl-exact-live-layout-final-trigger.txt",
  "notes/zz-open-pr.txt",
  "scripts/run-webgl-live-layout-and-clean.mjs",
]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
