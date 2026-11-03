#!/usr/bin/env node
/**
 * Deterministic, dependency-free starter tomato GLB builder.
 *
 * A real glTF 2.0 binary file is emitted for each tomato growth stage/LOD.
 * This is NOT a scanned/hand-authored photorealistic Blender asset. It is the
 * first mechanically verifiable asset in the asset-based rendering pipeline.
 *
 * License: original work for Blenheim Garden. No external textures/models.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";

const OUT = path.resolve("public/assets/plants/tomato");
const STAGES = ["seedling", "vegetative", "fruiting"];
const LODS = [0, 1, 2];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const vec = (x, y, z) => [x, y, z];
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, t) => a.map(v => v * t);
const norm = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function seeded(seed) { let x = seed >>> 0; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296); }

function pngCRC(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function pngChunk(name, payload) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4); size.writeUInt32BE(payload.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(pngCRC(Buffer.concat([type, payload])));
  return Buffer.concat([size, type, payload, crc]);
}
function makeLeafTexture() {
  const width = 128, height = 256;
  const data = Buffer.alloc(height * (1 + width * 4));
  const rand = seeded(24067);
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const off = y * (1 + width * 4);
    data[off] = 0;
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1), spine = Math.abs(u - 0.5) * 2;
      const lateral = Math.max(0, 1 - spine);
      const mainVein = Math.exp(-spine * 37) * 29;
      const branchingVein = Math.max(0, Math.cos((t * 13.5 + spine * 1.2) * Math.PI)) ** 16 * 15;
      const noise = (rand() - .5) * 19 + Math.sin(t * 93 + u * 70) * 4;
      const light = (1 - t) * 7 + mainVein + branchingVein * lateral + noise;
      const i = off + 1 + x * 4;
      data[i] = clamp(46 + light, 0, 255);
      data[i + 1] = clamp(93 + light * .78, 0, 255);
      data[i + 2] = clamp(45 + light * .53, 0, 255);
      data[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(data, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function meshGroup(name) { return {name, p:[], uv:[], faces:[]}; }
function vert(m, position, uv = [0, 0]) {
  const id = m.p.length / 3;
  m.p.push(...position); m.uv.push(...uv);
  return id;
}
function face(m, a, b, c) { m.faces.push(a, b, c); }
function stem(m, start, finish, radius, sides = 7) {
  const axis = norm(sub(finish, start));
  const guide = Math.abs(axis[1]) > .92 ? [1, 0, 0] : [0, 1, 0];
  const tangent = norm(cross(axis, guide));
  const bitangent = norm(cross(axis, tangent));
  const base = m.p.length / 3;
  for (let end = 0; end < 2; end++) {
    const point = end ? finish : start;
    for (let i = 0; i < sides; i++) {
      const ang = i / sides * Math.PI * 2;
      const r = radius * (end ? .82 : 1);
      vert(m, add(point, add(mul(tangent, Math.cos(ang) * r), mul(bitangent, Math.sin(ang) * r))), [i / sides, end]);
    }
  }
  for (let i = 0; i < sides; i++) {
    const a = base + i, b = base + (i + 1) % sides;
    const c = a + sides, d = b + sides;
    face(m, a, c, b); face(m, b, c, d);
  }
}
function bendStem(m, points, r, sides) {
  for (let i = 0; i < points.length - 1; i++) stem(m, points[i], points[i+1], r * (1 - i / points.length * .27), sides);
}
function leaf(m, start, yaw, length, width, tilt = .32, complexity = 16, seed = 1) {
  const random = seeded(seed);
  const forward = [Math.cos(yaw), 0, Math.sin(yaw)];
  const sideways = [-Math.sin(yaw), 0, Math.cos(yaw)];
  const base = m.p.length / 3;
  const rows = complexity, columns = 4;
  const twist = (random() - .5) * .2;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * t)), .73);
    const teeth = 1 + (row % 2 === 0 ? .07 : -.065) * taper;
    for (let col = 0; col <= columns; col++) {
      const s = (col / columns) * 2 - 1;
      const ridge = (1 - Math.abs(s)) * .012 * Math.sin(t * Math.PI);
      const curl = -.016 * Math.abs(s) * Math.sin(t * Math.PI);
      const folded = .009 * s * Math.sin(6 * t + twist);
      const center = add(start, add(mul(forward, length * t * Math.sqrt(1 - tilt * tilt)), [0, length * t * tilt + .01 * Math.sin(Math.PI * t), 0]));
      const point = add(center, add(mul(sideways, s * width * .5 * taper * teeth), [0, ridge + curl + folded, 0]));
      vert(m, point, [col / columns, 1 - t]);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = base + row * (columns+1) + col;
      const b = a + columns + 1;
      face(m, a, b, a + 1); face(m, b, b+1, a+1);
    }
  }
}
function orb(m, pos, radius, rings = 10, sides = 14, shape = 0) {
  const start = m.p.length / 3;
  for (let j = 0; j <= rings; j++) {
    const theta = j / rings * Math.PI;
    for (let i = 0; i <= sides; i++) {
      const a = i / sides * Math.PI * 2;
      const r = 1 + .032 * Math.cos(a * 6) * Math.sin(theta);
      const point = [
        pos[0] + radius * Math.cos(a) * Math.sin(theta) * r,
        pos[1] + radius * Math.cos(theta) * (shape ? 1.14 : .92),
        pos[2] + radius * Math.sin(a) * Math.sin(theta) * r,
      ];
      vert(m, point, [i / sides, j / rings]);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) {
    const a = start + j * (sides+1) + i, b = a + sides+1;
    face(m, a, b, a+1); face(m, b, b+1, a+1);
  }
}
function flower(mStem, mFlower, mYellow, pos, angle, detail) {
  const tip = add(pos, [Math.cos(angle)*.03, -.03, Math.sin(angle)*.03]);
  stem(mStem, pos, tip, .0025, 5);
  orb(mYellow, tip, .012, 6, 8);
  for (let p = 0; p < (detail ? 5 : 4); p++) {
    const a = p * Math.PI * 2 / (detail ? 5 : 4);
    leaf(mFlower, tip, a, .024, .014, -.08, 4, p + 18);
  }
}
function build(stage, lod) {
  const rand = seeded(5631 + stage.length * 43);
  const stemMesh = meshGroup("branching stems");
  const leafMesh = meshGroup("textured pinnate tomato leaflets");
  const fruitMesh = meshGroup("ripening sungold fruit");
  const unripeMesh = meshGroup("green fruit");
  const calyxMesh = meshGroup("sepals and pedicels");
  const blossomMesh = meshGroup("yellow flowers");
  const blossomCentre = meshGroup("flower centres");
  const isSeedling = stage === "seedling";
  const isVegetative = stage === "vegetative";
  const height = isSeedling ? .2 : isVegetative ? .77 : 1.35;
  const nodes = Math.max(2, (isSeedling ? 3 : isVegetative ? 9 : 14) - lod * (isSeedling ? 0 : 2));
  const main = [];
  for (let i = 0; i <= nodes; i++) {
    const t = i / nodes;
    main.push([.025 * Math.sin(t * 8), height * t, .018 * Math.cos(t * 7)]);
  }
  bendStem(stemMesh, main, isSeedling ? .009 : .018, Math.max(5, 9 - lod*2));
  for (let i = 0; i < nodes; i++) {
    const base = main[i+1];
    const radial = (i * 2.39996 + rand() * .15);
    const count = isSeedling && i < 1 ? 2 : (lod === 2 ? 3 : 5);
    const radius = isSeedling ? .055 : .15 + (i < nodes *.45 ? .065 : .035);
    const end = add(base, [Math.cos(radial) * radius, .04 + (isSeedling ? .015 : .05), Math.sin(radial) * radius]);
    stem(stemMesh, base, end, isSeedling ? .0036 : .0058, 6);
    const leafletCount = isSeedling ? 1 : lod === 2 ? 2 : lod === 1 ? 3 : 4;
    for (let j = 0; j < leafletCount; j++) {
      const t = (j + .5) / leafletCount;
      const joint = add(base, mul(sub(end, base), t));
      for (const handed of [-1, 1]) {
        if (isSeedling && j > 0) continue;
        const a = radial + handed * (1.05 + j*.07);
        const leafStart = add(joint, [Math.cos(a) * .018, .01, Math.sin(a) * .018]);
        stem(stemMesh, joint, leafStart, .0018, 4);
        leaf(leafMesh, leafStart, a,
          isSeedling ? .045 : .094 + rand() * .028,
          isSeedling ? .025 : .068 + rand() * .012,
          isSeedling ? .36 : .2 + rand()*.19,
          Math.max(6, 16 - lod*4), i*101+j*7+(handed+1)*13);
      }
    }
    leaf(leafMesh, end, radial, isSeedling ? .06 : .14, isSeedling ? .032 : .09, .33, Math.max(8, 18-lod*4), i*173);
  }
  if (!isSeedling) {
    const clusters = isVegetative ? 1 : lod === 2 ? 2 : 4;
    for (let i = 0; i < clusters; i++) {
      const t = (.33 + i * (isVegetative ? .12 : .15));
      const base = main[Math.min(nodes, Math.floor(t * nodes))];
      const yaw = i * 2.3 + .8;
      const neck = add(base, [Math.cos(yaw)*.13, -.015, Math.sin(yaw)*.13]);
      stem(stemMesh, base, neck, .0047, 6);
      for (let j = 0; j < (isVegetative ? 2 : lod===2 ? 3 : 5); j++) {
        const a = yaw + (j-2)*.4;
        const target = add(neck, [Math.cos(a)*(.055 + j*.006), -.055-j*.023, Math.sin(a)*(.055+j*.006)]);
        stem(stemMesh, neck, add(target,[0,.038,0]), .0023, 5);
        if (isVegetative || (i === clusters - 1 && j === 0)) {
          flower(stemMesh, blossomMesh, blossomCentre, target, a, lod===0);
        } else {
          const radius = .035 + rand() * .008;
          const ripe = i < clusters - 1 || j % 3 !== 0;
          orb(ripe ? fruitMesh : unripeMesh, target, radius, Math.max(7,12-lod*2), Math.max(9,18-lod*3));
          for (let p = 0; p < 5; p++) {
            leaf(calyxMesh, add(target,[0,radius*.85,0]), p * Math.PI*2/5,
              radius*.86, radius*.36, -.36, 6, p*39+j);
          }
        }
      }
    }
  }

  const groups = [
    [stemMesh, 0], [leafMesh, 1], [fruitMesh, 2], [unripeMesh, 3],
    [calyxMesh, 4], [blossomMesh, 5], [blossomCentre, 6],
  ].filter(([g]) => g.faces.length > 0);
  const png = makeLeafTexture();
  const chunks = [];
  let offset = 0;
  const views = [];
  const accessors = [];
  const primitives = [];
  const aligned = () => {
    const pad = (4 - offset % 4) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  };
  function view(buffer, target) {
    aligned(); const id = views.length;
    const result = {buffer: 0, byteOffset: offset, byteLength: buffer.byteLength};
    if (target) result.target = target;
    views.push(result); chunks.push(buffer); offset += buffer.byteLength;
    return id;
  }
  function accessor(buffer, componentType, type, count, target, min, max) {
    const bufferView = view(buffer, target);
    const res = { bufferView, componentType, count, type };
    if (min) res.min = min;
    if (max) res.max = max;
    accessors.push(res);
    return accessors.length - 1;
  }
  let triangles = 0;
  for (const [group, material] of groups) {
    const normals = new Float32Array(group.p.length);
    for (let i=0;i<group.faces.length;i+=3) {
      const a = group.faces[i], b = group.faces[i+1], c = group.faces[i+2];
      const p = k => group.p.slice(k*3,k*3+3);
      const n = cross(sub(p(b),p(a)), sub(p(c),p(a)));
      for (const vertex of [a,b,c]) for (let d=0;d<3;d++) normals[vertex*3+d]+=n[d];
    }
    for (let i=0;i<group.p.length/3;i++) {
      const n = norm(Array.from(normals.slice(i*3,i*3+3)));
      normals.set(n, i*3);
    }
    const p = new Float32Array(group.p);
    const uvs = new Float32Array(group.uv);
    const ids = new Uint32Array(group.faces);
    const min = [Math.min(...group.p.filter((_,i)=>i%3===0)), Math.min(...group.p.filter((_,i)=>i%3===1)), Math.min(...group.p.filter((_,i)=>i%3===2))];
    const max = [Math.max(...group.p.filter((_,i)=>i%3===0)), Math.max(...group.p.filter((_,i)=>i%3===1)), Math.max(...group.p.filter((_,i)=>i%3===2))];
    const positions = accessor(Buffer.from(p.buffer), 5126, "VEC3", p.length/3, 34962, min, max);
    const n = accessor(Buffer.from(normals.buffer), 5126, "VEC3", p.length/3, 34962);
    const uv = accessor(Buffer.from(uvs.buffer), 5126, "VEC2", p.length/3, 34962);
    const indices = accessor(Buffer.from(ids.buffer), 5125, "SCALAR", ids.length, 34963);
    primitives.push({attributes:{POSITION:positions, NORMAL:n, TEXCOORD_0:uv}, indices, material, mode:4});
    triangles+=ids.length/3;
  }
  const imageView = view(png);
  aligned();
  const buffer = Buffer.concat(chunks);
  const material = (name, color, roughness) => ({
    name, pbrMetallicRoughness: {baseColorFactor: color, metallicFactor:0, roughnessFactor:roughness}, doubleSided: true
  });
  const materials = [
    material("green tomato stems", [.25,.4,.19,1], .88),
    {...material("real leaf venation atlas", [1,1,1,1], .86),
      pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.86}},
    material("Sungold ripe orange", [.91,.39,.08,1], .4),
    material("unripe green fruit", [.36,.52,.18,1], .52),
    material("fruit sepals", [.21,.38,.19,1], .87),
    material("pale flowers", [.94,.88,.52,1], .68),
    material("flower centres", [.91,.62,.13,1], .73),
  ];
  const json = {
    asset: {version:"2.0", generator:"Blenheim Garden deterministic tomato GLB asset generator"},
    scene:0, scenes:[{nodes:[0]}],
    nodes:[{name:"Tomato - " + stage + " - LOD" + lod, mesh:0}],
    meshes:[{name:"Tomato plant", primitives}],
    materials, samplers:[{wrapS:10497,wrapT:10497,minFilter:9987,magFilter:9729}],
    images:[{name:"original generated tomato foliage texture",mimeType:"image/png",bufferView:imageView}],
    textures:[{source:0,sampler:0}],
    buffers:[{byteLength:buffer.length}], bufferViews:views, accessors,
    extras:{crop:"Solanum lycopersicum",stage,lod,heightMetres:height,triangles,assetKind:"original-generator-starter"},
  };
  const jsonRaw = Buffer.from(JSON.stringify(json));
  const jsonPad = (4 - jsonRaw.length % 4) % 4;
  const jsonChunk = Buffer.concat([jsonRaw,Buffer.alloc(jsonPad,32)]);
  const header = Buffer.alloc(12);
  const jhead=Buffer.alloc(8); jhead.writeUInt32LE(jsonChunk.length,0); jhead.writeUInt32LE(0x4e4f534a,4);
  const bhead=Buffer.alloc(8); bhead.writeUInt32LE(buffer.length,0); bhead.writeUInt32LE(0x004e4942,4);
  const length = 12 + 8 + jsonChunk.length + 8 + buffer.length;
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2,4); header.writeUInt32LE(length,8);
  const glb = Buffer.concat([header,jhead,jsonChunk,bhead,buffer]);
  if (glb.length!==length || glb.length > 5e6) throw new Error("GLB length invalid");
  const folder=path.join(OUT,stage);
  mkdirSync(folder,{recursive:true});
  writeFileSync(path.join(folder,"lod"+lod+".glb"),glb);
  return {stage,lod,path:"/assets/plants/tomato/"+stage+"/lod"+lod+".glb",bytes:glb.length,triangles,heightMetres:height};
}
mkdirSync(OUT,{recursive:true});
const files=[];
for (const stage of STAGES) for (const lod of LODS) files.push(build(stage,lod));
const manifest={version:1,crop:"Solanum lycopersicum",kind:"original-generated-starter",provenance:"Generated by scripts/3d/generate-tomato-assets.mjs",license:"Project original artwork",files};
writeFileSync(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log("Generated "+files.length+" tomato GLB assets ("+(files.reduce((n,f)=>n+f.bytes,0)/1024).toFixed(0)+" KiB total)");
