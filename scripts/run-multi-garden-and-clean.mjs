import fs from "node:fs";

const patchPath = "scripts/apply-multi-garden-stability.mjs";
let patchSource = fs.readFileSync(patchPath, "utf8");
patchSource = patchSource.replace(
  'const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(gardenId)}`, { cache: "no-store" });',
  'const response = await fetch("/api/garden?gardenId=" + encodeURIComponent(gardenId), { cache: "no-store" });',
);
fs.writeFileSync(patchPath, patchSource);

await import("./apply-multi-garden-stability.mjs");

const normalBuild = `name: Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1.2.15\n      - run: bun install\n      - run: bun run build\n`;

fs.writeFileSync(".github/workflows/build.yml", normalBuild);
for (const path of ["scripts/run-multi-garden-and-clean.mjs"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
