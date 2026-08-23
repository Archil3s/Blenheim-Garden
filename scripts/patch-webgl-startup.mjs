import fs from "node:fs";

const path = "components/garden-webgl.tsx";
let source = fs.readFileSync(path, "utf8");

const replacements = [
  ["const MAX_AREA_PLANTS = 512;", "const MAX_AREA_PLANTS = 96;"],
  ["const MAX_ROW_PLANTS = 256;", "const MAX_ROW_PLANTS = 96;"],
  ["antialias: true,", "antialias: false,"],
  ["renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));", "renderer.setPixelRatio(1);"],
  ["renderer.shadowMap.type = THREE.PCFSoftShadowMap;", "renderer.shadowMap.type = THREE.PCFShadowMap;"],
  ["sun.shadow.mapSize.set(1024, 1024);", "sun.shadow.mapSize.set(512, 512);"],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Expected startup renderer pattern not found: ${from}`);
  source = source.replace(from, to);
}

fs.writeFileSync(path, source);
