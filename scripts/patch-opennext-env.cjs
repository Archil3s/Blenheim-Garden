const fs = require("node:fs");
const path = require("node:path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "build",
  "open-next",
  "compile-env-files.js",
);

if (!fs.existsSync(target)) {
  console.error(`[opennext patch] Expected file was not found: ${target}`);
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const patchMarker = "BLENHEIM_OPENNEXT_ENV_TRUNCATE_PATCH";

if (source.includes(patchMarker)) {
  console.log("[opennext patch] Duplicate-env guard already applied.");
  process.exit(0);
}

const markers = [
  "fs.mkdirSync(envDir, { recursive: true });",
  "fs.default.mkdirSync(envDir, { recursive: true });",
];

const marker = markers.find((candidate) => source.includes(candidate));
if (!marker) {
  console.error("[opennext patch] Could not locate compileEnvFiles mkdir marker; refusing an unguarded deploy.");
  process.exit(1);
}

const fsRef = marker.startsWith("fs.default") ? "fs.default" : "fs";
const pathRef = source.includes("path.default.join") ? "path.default" : "path";
const guard = `${marker}\n\t${fsRef}.writeFileSync(${pathRef}.join(envDir, \`next-env.mjs\`), \"\"); // ${patchMarker}`;
source = source.replace(marker, guard);
fs.writeFileSync(target, source, "utf8");
console.log("[opennext patch] Applied idempotent next-env.mjs generation guard.");
