import fs from "node:fs";

const file = "components/garden-webgl.tsx";
let source = fs.readFileSync(file, "utf8");
const before = "  const addRail = (rw, rd, rx, rz) => {";
const after = "  const addRail = (rw: number, rd: number, rx: number, rz: number) => {";
if (!source.includes(before)) throw new Error("WebGL addRail signature not found");
source = source.replace(before, after);
fs.writeFileSync(file, source);

const normalBuild = `name: Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: 1.2.15\n      - run: bun install\n      - run: bun run build\n`;
fs.writeFileSync(".github/workflows/build.yml", normalBuild);
fs.rmSync("scripts/fix-webgl-live-types.mjs");
