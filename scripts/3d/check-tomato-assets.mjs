#!/usr/bin/env node
/**
 * Validate on-disk binary glTF 2.0 assets generated during a Next/OpenNext build.
 * Avoid silently deploying fake/missing files to the Cloudflare Worker.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve("public/assets/plants/tomato");
const manifestFile = path.join(root, "manifest.json");
if (!existsSync(manifestFile)) throw new Error("Missing tomato asset manifest: run assets:tomato");
const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
if (manifest.files.length !== 9) throw new Error("Expected 3 tomato stages x 3 LODs");
const stages = new Set();
for (const record of manifest.files) {
  if (!["seedling","vegetative","fruiting"].includes(record.stage) || ![0,1,2].includes(record.lod)) {
    throw new Error("Invalid stage/LOD record");
  }
  stages.add(record.stage);
  const file = path.join(root,record.stage,"lod"+record.lod+".glb");
  if (!existsSync(file)) throw new Error("Missing GLB: " + file);
  const data = readFileSync(file);
  if (data.length < 120 || data.toString("ascii",0,4) !== "glTF") throw new Error("Missing glTF binary magic in "+file);
  if (data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) {
    throw new Error("GLB version or byte length incorrect in "+file);
  }
  const jsonLen = data.readUInt32LE(12);
  if (data.toString("ascii",16,20) !== "JSON") throw new Error("Missing JSON chunk in "+file);
  const doc = JSON.parse(data.toString("utf8",20,20+jsonLen).trim());
  const binStart = 20+jsonLen;
  if (data.toString("ascii",binStart+4,binStart+8) !== "BIN\u0000") throw new Error("Missing BIN chunk in "+file);
  const binLength = data.readUInt32LE(binStart);
  if (binStart+8+binLength !== data.length) throw new Error("Truncated or oversized binary chunk in "+file);
  if (doc.buffers?.[0]?.byteLength !== binLength || doc.asset?.version !== "2.0") throw new Error("Invalid glTF metadata");
  if (doc.images?.[0]?.mimeType !== "image/png" || !doc.meshes?.length) throw new Error("GLB lacks leaf texture or meshes");
  for (const view of doc.bufferViews) {
    if (view.byteOffset+view.byteLength > binLength) throw new Error("Buffer view outside BIN chunk");
    if (view.byteOffset%4) throw new Error("Buffer view not 4-byte aligned");
  }
  if (!doc.meshes[0].primitives.length) throw new Error("No meshes present");
  if (doc.extras.stage !== record.stage || doc.extras.lod !== record.lod) throw new Error("Stage metadata mismatch");
  if (record.bytes !== data.length) throw new Error("Manifest byte length mismatch");
  console.log(record.stage+" LOD"+record.lod+" ✔ "+(data.length/1024).toFixed(1)+" KiB, "+record.triangles+" triangles");
}
if (stages.size !== 3) throw new Error("Not all growth stages generated");
for (const stage of stages) {
  const rows = manifest.files.filter(x=>x.stage===stage).sort((a,b)=>a.lod-b.lod);
  if (!(rows[0].triangles >= rows[1].triangles && rows[1].triangles >= rows[2].triangles)) {
    throw new Error(stage+" does not reduce geometry in successive LODs");
  }
}
console.log("Nine real tomato GLB files passed binary and LOD validation.");
