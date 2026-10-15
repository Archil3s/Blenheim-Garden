import * as THREE from "three";
import { consolidateGardenMeshes } from "./garden-mesh-optimization";
import type { VegetableModel } from "@/lib/garden/vegetable-model-catalog";

const textures = new Map<string, THREE.CanvasTexture>();
const normals = new Map<string, THREE.CanvasTexture>();
const golden = 2.399963;
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
type Surface = "leaf" | "palmate" | "parallel" | "skin" | "net";
type LeafShape = "lance" | "round" | "heart" | "palmate" | "oak" | "strap";
const leafSurface = (surface?: Surface) => surface === "leaf" || surface === "palmate" || surface === "parallel";

function surfaceTexture(kind: Surface) {
  const cached = textures.get(kind);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create vegetable surface textures");
  ctx.scale(2, 2);
  ctx.fillStyle = "#eef1e3"; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const x = (i * 73.13) % 256, y = (i * 131.71) % 256;
    ctx.fillStyle = i % 2 ? "rgba(45,70,32,.045)" : "rgba(255,255,255,.16)";
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  if (kind === "palmate") {
    ctx.strokeStyle = "rgba(245,250,213,.56)";
    for (const [x, y] of [[18, 142], [44, 58], [128, 3], [212, 58], [238, 142]]) {
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(128, 250); ctx.quadraticCurveTo((x + 128) / 2, 150, x, y); ctx.stroke();
      for (let i = 2; i < 8; i++) { const t = i / 9, px = 128 + (x - 128) * t, py = 250 + (y - 250) * t; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (x < 128 ? -19 : 19), py - 13); ctx.stroke(); }
    }
  } else if (kind === "parallel") {
    for (let i = 0; i < 19; i++) { ctx.strokeStyle = i % 3 ? "rgba(245,250,210,.22)" : "rgba(67,99,48,.14)"; ctx.lineWidth = i === 9 ? 2 : .6; ctx.beginPath(); ctx.moveTo(5 + i * 13.5, 256); ctx.quadraticCurveTo(128 + (i - 9) * 10, 120, 128 + (i - 9) * 3, 0); ctx.stroke(); }
  } else if (kind === "leaf") {
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, "rgba(30,60,20,.18)"); gradient.addColorStop(.5, "rgba(245,255,203,.15)"); gradient.addColorStop(1, "rgba(30,60,20,.18)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(241,247,196,.55)"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(128, 256); ctx.stroke();
    for (let i = 1; i < 10; i++) for (const side of [-1, 1]) {
      const y = i * 24;
      ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(128, y);
      ctx.bezierCurveTo(128 + side * 38, y + 3, 128 + side * 83, y + 24, 128 + side * 125, y + 32); ctx.stroke();
      for (let j = 1; j < 6; j++) {
        const x = 128 + side * j * 20, start = y + j * 4;
        ctx.lineWidth = .3; ctx.beginPath(); ctx.moveTo(x, start);
        ctx.bezierCurveTo(x + side * 7, start - 2, x + side * 12, start - 8, x + side * 19, start - 10); ctx.stroke();
      }
    }
  } else if (kind === "net") {
    ctx.strokeStyle = "rgba(255,249,209,.85)"; ctx.lineWidth = 2;
    for (let i = -256; i < 512; i += 23) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 180, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 180, 256); ctx.stroke();
    }
  } else {
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = "rgba(255,250,209,.16)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(i * 16, 0); ctx.bezierCurveTo(i * 16 + 4, 64, i * 16 - 4, 192, i * 16, 256); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  textures.set(kind, texture);
  return texture;
}

function surfaceNormal(kind: Surface) {
  const cached = normals.get(kind);
  if (cached) return cached;
  const source = surfaceTexture(kind).image as HTMLCanvasElement;
  const pixels = source.getContext("2d")!.getImageData(0, 0, 512, 512);
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const result = ctx.createImageData(512, 512);
  const height = (x: number, y: number) => pixels.data[((y + 512) % 512 * 512 + (x + 512) % 512) * 4] / 255;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const n = v((height(x - 1, y) - height(x + 1, y)) * 2, (height(x, y + 1) - height(x, y - 1)) * 2, 1).normalize();
    const offset = (y * 512 + x) * 4;
    result.data.set([(n.x * .5 + .5) * 255, (n.y * .5 + .5) * 255, (n.z * .5 + .5) * 255, 255], offset);
  }
  ctx.putImageData(result, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  normals.set(kind, texture);
  return texture;
}

export function createDetailedVegetable(model: VegetableModel, mobile: boolean) {
  const root = new THREE.Group();
  root.name = `${model.crop} · ${model.variety}`;
  const name = `${model.crop} ${model.variety}`.toLowerCase();
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: number, surface?: Surface, roughness = .68) => {
    const key = `${color}:${surface}:${roughness}`;
    let result = materialCache.get(key);
    if (!result) {
      result = new THREE.MeshStandardMaterial({ color, roughness, vertexColors: leafSurface(surface), side: leafSurface(surface) ? THREE.DoubleSide : THREE.FrontSide, map: surface ? surfaceTexture(surface) : null, normalMap: surface ? surfaceNormal(surface) : null, normalScale: new THREE.Vector2(.24, .24) });
      result.name = `${surface ?? "stem"}-${color.toString(16)}`;
      materialCache.set(key, result);
    }
    return result;
  };
  const green = 0x5c964a, dark = 0x397246, wax = 0x83a18e;
  const add = (geometry: THREE.BufferGeometry, color: number, surface?: Surface, position = v(), scale = v(1, 1, 1)) => {
    const mesh = new THREE.Mesh(geometry, material(color, surface));
    mesh.position.copy(position); mesh.scale.copy(scale); mesh.castShadow = !mobile; mesh.receiveShadow = true;
    root.add(mesh); return mesh;
  };
  const tube = (points: THREE.Vector3[], radius = .006, color = green, taper = .58) => {
    if (points.length === 2) {
      const middle = points[0].clone().lerp(points[1], .5);
      middle.x += points[0].distanceTo(points[1]) * .025;
      points = [points[0], middle, points[1]];
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const segments = radius < .0005 ? 4 : Math.max(mobile ? 10 : 18, points.length * 2), sides = radius < .0005 ? 3 : mobile ? 6 : 9;
    const geometry = new THREE.TubeGeometry(curve, segments, radius, sides, false);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, center = curve.getPointAt(t), thickness = .86 * (1 - taper * t);
      for (let j = 0; j <= sides; j++) {
        const index = i * (sides + 1) + j;
        positions.setXYZ(index, center.x + (positions.getX(index) - center.x) * thickness, center.y + (positions.getY(index) - center.y) * thickness, center.z + (positions.getZ(index) - center.z) * thickness);
      }
    }
    geometry.computeVertexNormals();
    return add(geometry, color);
  };
  const ball = (position: THREE.Vector3, radius: number, color: number, scale = v(1, 1, 1), ribs = 0, surface: "skin" | "net" = "skin") => {
    const fine = radius < .026;
    const granule = radius < .009;
    const geometry = new THREE.SphereGeometry(radius, granule ? mobile ? 6 : 8 : fine ? mobile ? 8 : 12 : mobile ? 20 : 36, granule ? mobile ? 4 : 5 : fine ? mobile ? 5 : 8 : mobile ? 12 : 24);
    const positions = geometry.getAttribute("position");
    if (ribs) for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const a = Math.atan2(z, x), amount = 1 + Math.cos(a * ribs) * .11 * Math.sin(Math.acos(Math.max(-1, Math.min(1, y / radius))));
      positions.setXYZ(i, x * amount, y, z * amount);
    }
    geometry.computeVertexNormals();
    return add(geometry, color, surface, position, scale);
  };
  const kind = model.kind;
  const defaultShape: LeafShape = ["pumpkin", "zucchini"].includes(kind) ? "palmate" : ["cucumber", "melon", "spinach"].includes(kind) ? "heart" : ["broccoli", "cauliflower", "cabbage", "lettuce", "chard", "beet", "potato", "broad-bean", "pea", "basil", "strawberry", "blueberry"].includes(kind) ? "round" : ["artichoke", "radish", "parsley"].includes(kind) ? "oak" : ["corn", "garlic", "leek"].includes(kind) ? "strap" : "lance";
  const leaf = (base: THREE.Vector3, length: number, width: number, yaw: number, pitch = .9, color = green, lobes = 0, curl = .1, cup = 0, shape: LeafShape = defaultShape) => {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [], colors: number[] = [];
    const small = length < .06;
    const rows = mobile ? small ? 8 : 24 : small ? 12 : lobes > 6 ? 56 : 40;
    const columns = mobile ? small ? 4 : 6 : small || width < .026 ? 4 : 12;
    const phase = Math.sin(yaw * 3.71 + base.y * 9), bend = pitch > .55 ? .2 + phase * .045 : .055;
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
      const t = i / rows, a = j / columns * 2 - 1;
      const envelope = shape === "round" ? Math.pow(Math.max(0, Math.sin(Math.PI * t)), .43) * (.76 + t * .3) : shape === "heart" ? Math.pow(Math.max(0, Math.sin(Math.PI * t ** .62)), .66) : shape === "strap" ? Math.pow(Math.max(0, Math.sin(Math.PI * t)), .28) * (1 - t * .55) : Math.pow(Math.max(0, Math.sin(Math.PI * t)), .78);
      const depth = shape === "oak" ? kind === "radish" ? .24 : kind === "parsley" ? .35 : .42 : kind === "raspberry" ? .055 : kind === "kale" ? .065 : .15;
      const lobe = lobes ? 1 - depth + depth * Math.cos(t * Math.PI * lobes * 2 + .25) : 1;
      const serration = 1 - (lobes ? .035 : .018) * (.5 + .5 * Math.sin(t * Math.PI * 42));
      const edge = envelope * width / 2 * lobe * serration;
      let x = a * edge + phase * width * .07 * Math.sin(Math.PI * t) * t;
      const ripple = Math.sin(t * Math.PI * (lobes > 5 ? 17 : 7) + a * 2 + phase) * curl * width * .24 * Math.pow(Math.abs(a), 2.5) * envelope;
      const angle = cup * 2.25 * t;
      let y = Math.abs(cup) > .05 ? length * Math.sin(angle) / (cup * 2.25) : length * t;
      if (shape === "palmate") {
        const profile = kind === "zucchini" ? [0, .7, .96, .55, 1, .6, .78, .42, .36, .16, 0] : [0, .68, .91, .86, .99, .86, .85, .62, .4, .2, 0], k = t * 10, index = Math.min(9, Math.floor(k));
        x = a * width * .5 * THREE.MathUtils.lerp(profile[index], profile[index + 1], k - index);
        y += Math.abs(a) * length * .11 * Math.exp(-t * 16);
      } else if (shape === "heart") y += Math.abs(a) * length * .14 * Math.exp(-t * 12);
      const z = Math.abs(cup) > .05 ? length * (1 - Math.cos(angle)) / (cup * 2.25) : 0;
      const vein = Math.exp(-a * a * 90) * width * .018 * envelope;
      positions.push(x, y - bend * length * t ** 3, z + bend * length * t * t + envelope * width * .1 * (1 - a * a) + ripple + vein);
      uv.push(j / columns, t);
      const tone = .88 + .1 * (1 - Math.abs(a)) + .035 * Math.sin(t * 15 + phase);
      colors.push(Math.round(Math.min(1, tone) * 255), Math.round(Math.min(1, tone) * 255), Math.round(tone * .97 * 255));
      if (i < rows && j < columns) {
        const k = i * (columns + 1) + j;
        indices.push(k, k + 1, k + columns + 1, k + 1, k + columns + 2, k + columns + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Uint8BufferAttribute(colors, 3, true));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = add(geometry, color, shape === "palmate" || shape === "heart" ? "palmate" : shape === "strap" ? "parallel" : "leaf", base);
    mesh.rotation.set(pitch, Math.PI / 2 - yaw, Math.sin(yaw * 3) * .07, "YXZ");
    if (length > .16 && (kind === "chard" || kind === "corn" || kind === "kale" || /cos/.test(name))) {
      const midrib = [];
      for (let row = 0; row <= rows; row += Math.max(1, Math.floor(rows / 10))) { const index = row * (columns + 1) + columns / 2; midrib.push(v(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2] + .001).applyEuler(mesh.rotation).add(base)); }
      tube(midrib, kind === "chard" ? .0023 : .0011, kind === "chard" ? color === 0x467b3d ? 0xd15268 : 0xd9ba70 : 0x9cb788);
    }
    return mesh;
  };
  const blossom = (p: THREE.Vector3, color = 0xf5d344, radius = .018, petals = 5) => {
    for (let i = 0; i < petals; i++) {
      const a = i * Math.PI * 2 / petals;
      const mesh = ball(p.clone().add(v(Math.cos(a) * radius, 0, Math.sin(a) * radius)), radius * .7, color, v(1, .22, .6)); mesh.rotation.y = -a;
    }
    ball(p.clone().add(v(0, .006, 0)), radius * .4, 0xe4b830, v(1, .5, 1));
  };
  const tendril = (p: THREE.Vector3, yaw: number, length = .12) => {
    const points = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      return p.clone().add(v(Math.cos(yaw) * length * t + Math.sin(t * Math.PI * 5) * .012 * t, Math.sin(t * Math.PI * 5) * .01, Math.sin(yaw) * length * t + Math.cos(t * Math.PI * 5) * .012 * t));
    });
    tube(points, .0018, 0x8fa354);
  };
  const rosette = (count: number, length: number, width: number, color = green, lobes = 0, curl = .1, upright = false) => {
    for (let i = 0; i < count; i++) {
      const t = i / count, yaw = i * golden;
      leaf(v(Math.cos(yaw) * .015, .025 + t * .07, Math.sin(yaw) * .015), length * (1 - t * .42), width * (1 - t * .3), yaw, upright ? .5 + (1 - t) * .3 : 1.1 - t * .9, i % 3 ? color : dark, lobes, curl, t > .5 ? .22 : 0);
    }
  };
  if (["lettuce", "spinach", "chard", "cabbage", "kale"].includes(kind)) {
    if (kind === "kale") {
      tube([v(), v(.01, .3, 0), v(0, .68, .01)], .016, wax);
      for (let i = 0; i < (mobile ? 13 : 22); i++) {
        const stage = i * (mobile ? 21 / 12 : 1);
        leaf(v(0, .06 + stage * .025, 0), .32 - stage * .004, .15, i * golden, 1.08 - stage * .022, i % 2 ? wax : dark, 3, .28, .08, "round");
      }
    } else if (kind === "cabbage" || /iceberg|butterhead/.test(name)) {
      const cabbage = kind === "cabbage";
      const butter = /butterhead/.test(name);
      rosette(mobile ? butter ? 12 : 9 : butter ? 20 : 14, cabbage ? .3 : butter ? .24 : .21, cabbage ? .22 : butter ? .17 : .15, cabbage ? wax : 0x75a453, 0, butter ? .3 : .18);
      for (let i = 0; i < (mobile ? 18 : 28); i++) {
        const t = i / (mobile ? 18 : 28), yaw = i * golden, radius = (cabbage ? .155 : butter ? .085 : .12) * (1 - t * .64);
        const mesh = leaf(v(0, .12 + t * .026, 0), .23, .19, yaw, 0, cabbage ? 0x8dae79 : i % 3 ? 0x83ac55 : 0x74a14a, 0, .1);
        const positions = mesh.geometry.getAttribute("position"), uv = mesh.geometry.getAttribute("uv");
        for (let j = 0; j < positions.count; j++) {
          const s = uv.getY(j), across = uv.getX(j) * 2 - 1, latitude = -.85 + s * (butter ? 1.98 : 2.2);
          const angle = across * 1.17 * Math.pow(Math.sin(Math.PI * s), .68);
          const ripple = Math.sin(s * 27 + yaw + across * 5) * .003 * Math.abs(across) ** 3 * Math.sin(Math.PI * s);
          const r = radius + ripple;
          positions.setXYZ(j, Math.sin(angle) * Math.cos(latitude) * r, Math.sin(latitude) * radius, Math.cos(angle) * Math.cos(latitude) * r);
        }
        mesh.rotation.set(0, yaw, 0); mesh.geometry.computeVertexNormals();
      }
    } else if (kind === "chard") {
      for (let i = 0; i < (mobile ? 11 : 17); i++) {
        const yaw = i * golden, height = .23 + i % 4 * .035, end = v(Math.cos(yaw) * .09, height, Math.sin(yaw) * .09);
        tube([v(), end.clone().multiplyScalar(.55), end], .007, i % 3 ? 0xd54b64 : 0xe9bc52);
        leaf(end, .29, .19, yaw, .65 + i % 3 * .1, i % 3 ? 0x467b3d : 0x638947, 0, .42, .1);
      }
    } else rosette(mobile ? 17 : 27, /cos/.test(name) ? .36 : kind === "spinach" ? .22 : .24, /cos/.test(name) ? .13 : kind === "spinach" ? .11 : .18, kind === "spinach" ? 0x346c3d : 0x74a34d, /loose/.test(name) ? 3 : 0, /loose/.test(name) ? .65 : .13, /cos/.test(name));
  } else if (kind === "broccoli" || kind === "cauliflower") {
    const broccoli = kind === "broccoli", purple = /rudolph/.test(name), color = broccoli ? purple ? 0x685075 : 0x38673d : 0xeee4c3;
    const headY = broccoli ? .31 : .23;
    tube([v(), v(0, .15, 0), v(0, headY, 0)], .026, wax);
    for (let i = 0; i < (mobile ? 8 : 12); i++) {
      const yaw = i * golden, p = v(Math.cos(yaw) * .055, .06 + i % 3 * .035, Math.sin(yaw) * .055);
      tube([v(0, .04 + i % 3 * .035, 0), p], .004, wax);
      leaf(p, broccoli ? .34 : .3, .19, yaw, broccoli ? 1.02 : .56, i % 2 ? wax : 0x537c60, 1, .12, broccoli ? .06 : .38);
    }
    ball(v(0, headY + .015, 0), .13, color, v(1, .5, 1));
    const clusters = mobile ? 13 : 21;
    for (let i = 0; i < clusters; i++) {
      const a = i * golden, r = .112 * Math.sqrt(i / clusters), center = v(Math.cos(a) * r, headY + Math.sqrt(1 - r * r / .018) * .062, Math.sin(a) * r);
      tube([v(0, headY - .02, 0), center], .008, wax);
      ball(center, .034, color, v(1, .8, 1));
      for (let j = 0; j < (mobile ? 34 : 70); j++) {
        const b = j * golden + i, s = .042 * Math.sqrt(j / (mobile ? 34 : 70));
        const p = center.clone().add(v(Math.cos(b) * s, .014 + Math.sqrt(Math.max(0, .043 ** 2 - s ** 2)) * .7, Math.sin(b) * s));
        ball(p, (.0045 + .0017 * (.5 + .5 * Math.sin(j * 2.71 + i))) * (mobile ? 1.12 : 1), j % 4 ? color : broccoli ? purple ? 0x876b91 : 0x50844b : 0xf5edda, v(1, 1.15, 1));
      }
    }
  } else if (["carrot", "beet", "radish"].includes(kind)) {
    const carrot = kind === "carrot", beet = kind === "beet";
    if (carrot) {
      const color = /rainbow/.test(name) ? 0x9d4770 : 0xd87926;
      const length = /chantenay/.test(name) ? .14 : .21;
      const profile = Array.from({ length: 33 }, (_, i) => {
        const t = i / 32, shoulder = Math.sin(Math.min(1, (1 - t) * 7) * Math.PI / 2);
        return new THREE.Vector2(Math.max(.0008, .033 * Math.pow(t, .72) * shoulder * (1 + Math.sin(t * Math.PI * 28) * .022)), length * t);
      });
      const body = add(new THREE.LatheGeometry(profile, mobile ? 16 : 32), color, "skin");
      body.rotation.z = .03;
      for (let i = 0; i < (mobile ? 6 : 9); i++) {
        const yaw = i * golden, start = v(0, length - .012, 0), end = v(Math.cos(yaw) * .2, length + .22 + i % 3 * .02, Math.sin(yaw) * .2);
        const curve = new THREE.CatmullRomCurve3([start, start.clone().lerp(end, .5).add(v(0, .045, 0)), end]);
        tube(curve.getPoints(5), .0019);
        for (let j = 2; j < (mobile ? 7 : 9); j++) for (const side of [-1, 1]) {
          const p = curve.getPoint(j / 10), reach = .068 * (1 - j / 12), angle = yaw + side * 1.05, tip = p.clone().add(v(Math.cos(angle) * reach, .018, Math.sin(angle) * reach));
          tube([p, tip], .00065);
          for (let k = 1; k <= (mobile ? 3 : 4); k++) for (const twig of [-1, 1]) leaf(p.clone().lerp(tip, k / 5), .025 * (1 - k / 8), .006, angle + twig * .95, 1.05, i % 2 ? green : dark, 2, .03, 0, "oak");
        }
      }
      tube([v(0, .003, 0), v(.004, 0, .01), v(.008, 0, .02)], .0015, color);
    } else {
      ball(v(0, .08, 0), beet ? .065 : .045, beet ? 0x853551 : 0xd74466, v(1, 1.18, 1));
      if (!beet) ball(v(0, .035, 0), .032, 0xe7dfc9, v(.8, 1.4, .8));
      for (let i = 0; i < (mobile ? 9 : 15); i++) {
        const yaw = i * golden, end = v(Math.cos(yaw) * .05, .14 + i % 4 * .025, Math.sin(yaw) * .05);
        tube([v(0, .1, 0), end], .0035, beet ? 0x9b3650 : green);
        leaf(end, beet ? .22 : .12, beet ? .11 : .07, yaw, .8, green, beet ? 0 : 4, .2);
      }
    }
  } else if (["bean", "asparagus-pea", "pea", "broad-bean"].includes(kind)) {
    const climb = /climb|runner/.test(name) || kind === "pea", broad = kind === "broad-bean", winged = kind === "asparagus-pea";
    const height = winged ? .32 : climb ? 1.18 : broad ? .72 : .48;
    for (let stem = 0; stem < (mobile ? 2 : 3); stem++) {
      const baseYaw = stem * golden, end = v(Math.cos(baseYaw) * .09, height * (1 - stem * .1), Math.sin(baseYaw) * .09);
      tube([v(), v(end.x * .5, height * .4, end.z * .5), end], broad ? .009 : .0045);
      for (let i = 1; i <= (mobile ? 5 : 8); i++) {
        const yaw = i * golden + stem, t = i / (mobile ? 6 : 9), p = v(end.x * t, end.y * t, end.z * t), tip = p.clone().add(v(Math.cos(yaw) * .13, .035, Math.sin(yaw) * .13));
        tube([p, tip], .0025);
        if (broad || kind === "pea") {
          for (const t of [.42, .82]) for (const side of [-1, 1]) leaf(p.clone().lerp(tip, t), broad ? .115 : .072, broad ? .064 : .05, yaw + side * 1.12, .94, i % 2 ? green : dark, 0, .04, .08, "round");
          if (!broad) tendril(tip, yaw, .1);
        } else {
          leaf(tip, winged ? .07 : .15, winged ? .045 : .105, yaw, .9, green, 0, .06, .08, "heart");
          for (const side of [-1, 1]) leaf(p.clone().lerp(tip, .7), winged ? .055 : .105, winged ? .036 : .08, yaw + side * 1.05, 1.05, dark, 0, .06, 0, "heart");
        }
        if (i % 2 === 0) {
          const purple = /purple/.test(name), podColor = purple ? 0x624370 : 0x639047;
          const podLength = winged ? .1 : broad ? .16 : .15;
          const points = [tip.clone(), tip.clone().add(v(.025, -.06, .01)), tip.clone().add(v(.015, -podLength, .02))];
          tube(points, broad ? .012 : kind === "pea" ? .008 : .0045, podColor);
          if (kind === "pea" || broad) for (let j = 1; j < 5; j++) ball(tip.clone().add(v(.02, -podLength * j / 5, .015)), broad ? .013 : .008, podColor, v(.75, 1.1, .75));
          if (winged) for (let j = 0; j < 4; j++) leaf(tip.clone().add(v(0, -.1, 0)), .095, .014, j * Math.PI / 2, 0, podColor, 4, .12, 0, "lance");
          blossom(tip.clone().add(v(0, .015, 0)), winged || /scarlet/.test(name) ? 0xa82f39 : 0xf1e9dc, .012);
        }
        if (climb && i % 2) tendril(tip, yaw + .8);
      }
    }
  } else if (["pumpkin", "zucchini", "cucumber", "melon"].includes(kind)) {
    const climb = kind === "cucumber", squash = kind === "zucchini";
    for (let arm = 0; arm < (mobile ? 3 : 4); arm++) {
      const yaw = arm * golden, reach = squash ? .1 : climb ? .12 : .6;
      const start = v(), end = v(Math.cos(yaw) * reach, climb ? .95 + arm * .05 : .035, Math.sin(yaw) * reach);
      tube([start, end.clone().multiplyScalar(.4).add(v(0, .025, .02)), end], squash ? .013 : .008);
      for (let i = 1; i <= (mobile ? 3 : 5); i++) {
        const p = start.clone().lerp(end, i / 6), angle = yaw + (i % 2 ? .9 : -.9), tip = p.clone().add(v(Math.cos(angle) * (squash ? .14 : .08), squash ? .19 : .12, Math.sin(angle) * (squash ? .14 : .08)));
        tube([p, p.clone().lerp(tip, .5).add(v(0, .025, 0)), tip], squash ? .007 : .004);
        leaf(tip, squash ? .3 : climb ? .21 : .25, squash ? .3 : climb ? .22 : .26, angle, squash ? 1.25 : climb ? 1.05 : 1.28, i % 2 ? green : dark, 0, .12, .08, squash || kind === "pumpkin" ? "palmate" : "heart");
        if (!squash && i % 2) tendril(p, angle);
      }
      blossom(end.clone().add(v(0, .04, 0)), 0xeac64c, .035);
    }
    for (let i = 0; i < (mobile ? 2 : 3); i++) {
      const a = i * golden + .5, radius = squash ? .14 : climb ? .1 : .39, pos = v(Math.cos(a) * radius, climb ? .32 + i * .2 : squash ? .07 : .11, Math.sin(a) * radius);
      if (squash || climb) {
        const mesh = ball(pos, .053, squash ? 0x315e32 : 0x4a7841, v(.62, squash ? 2.8 : 2.4, .62), squash ? 5 : 0);
        mesh.rotation.set(squash ? 1.38 : .08, -a, squash ? .1 : .12);
        const attachment = pos.clone().add(v(0, squash ? .025 : .13, 0));
        tube([v(Math.cos(a) * .045, climb ? pos.y + .16 : .045, Math.sin(a) * .045), attachment], .004, 0x719347);
        if (climb) for (let j = 0; j < (mobile ? 9 : 18); j++) {
          const b = j * golden; ball(pos.clone().add(v(Math.cos(b) * .039, (j % 5 - 2) * .035, Math.sin(b) * .039)), .0035, 0x92a45e);
        }
      } else {
        const butter = /butternut/.test(name), gem = /gem/.test(name), crown = /crown/.test(name), kabocha = /kabocha/.test(name);
        const color = butter ? 0xc5a876 : crown ? 0x8b9e91 : gem || kabocha ? 0x41694b : kind === "melon" ? 0xb7a369 : 0xd58a36;
        ball(pos, gem ? .075 : .105, color, butter ? v(.65, 1.7, .65) : v(1.2, .8, 1.2), kind === "melon" ? 0 : 10, kind === "melon" ? "net" : "skin");
        if (butter) ball(pos.clone().add(v(0, -.06, 0)), .08, color, v(1, .9, 1), 8);
        tube([v(Math.cos(a) * .23, .035, Math.sin(a) * .23), pos.clone().add(v(.01, butter ? .2 : .12, 0))], .007, 0x65733e);
      }
    }
  } else if (kind === "amaranth") {
    const red = /garnet/.test(name), leafColor = red ? 0x8c3856 : 0x5b7b48, stemColor = 0x864352;
    tube([v(), v(.01, .45, 0), v(0, .9, .01)], .012, stemColor);
    for (let i = 0; i < (mobile ? 13 : 21); i++) {
      const stage = i * (mobile ? 20 / 12 : 1);
      leaf(v(0, .08 + stage * .029, 0), .2 - stage * .002, .09, i * golden, 1, i % 3 ? leafColor : 0x743850);
    }
    for (let plume = 0; plume < 5; plume++) {
      const a = plume * golden, top = v(Math.cos(a) * .075, .9 - plume * .035, Math.sin(a) * .075);
      tube([v(0, .55, 0), top], .005, stemColor);
      for (let i = 0; i < (mobile ? 16 : 35); i++) {
        const t = i / (mobile ? 16 : 35), b = i * golden, r = .027 * (1 - t);
        ball(top.clone().add(v(Math.cos(b) * r, -.21 + t * .25, Math.sin(b) * r)), .01 * (1 - t * .55), red ? 0x913653 : 0x985254, v(1, 1.2, 1));
      }
    }
  } else if (kind === "artichoke") {
    tube([v(), v(0, .38, 0), v(0, .68, 0)], .025, wax);
    for (let i = 0; i < (mobile ? 10 : 16); i++) leaf(v(0, .07 + i % 4 * .04, 0), .5, .24, i * golden, 1.12, wax, 5, .1);
    for (let bud = 0; bud < 3; bud++) {
      const p = bud ? v(Math.cos(bud * 2) * .18, .5, Math.sin(bud * 2) * .18) : v(0, .68, 0), scale = bud ? .85 : 1.35;
      if (bud) tube([v(0, .3, 0), p], .014, wax);
      ball(p, .057 * scale, 0x66844d, v(1, 1.2, 1));
      for (let layer = 0; layer < 7; layer++) for (let i = 0; i < (mobile ? 9 : 12); i++) {
        const a = i * Math.PI * 2 / (mobile ? 9 : 12) + layer * .38;
        const mesh = leaf(p, (.09 - layer * .007) * scale, (.044 - layer * .003) * scale, a, 0, layer % 2 ? 0x72905c : 0x879b70, 0, .04, 0, "lance");
        const positions = mesh.geometry.getAttribute("position"), uv = mesh.geometry.getAttribute("uv");
        for (let k = 0; k < positions.count; k++) {
          const t = uv.getY(k), across = uv.getX(k) * 2 - 1, latitude = -.9 + layer * .27 + t * .7;
          const angle = across * .45 * Math.pow(Math.sin(Math.PI * t), .55), shell = (.066 - layer * .0012) * scale;
          positions.setXYZ(k, Math.sin(angle) * Math.cos(latitude) * shell, Math.sin(latitude) * .078 * scale, Math.cos(angle) * Math.cos(latitude) * shell);
        }
        mesh.rotation.set(0, Math.PI / 2 - a, 0); mesh.geometry.computeVertexNormals();
      }
    }
  } else if (kind === "asparagus") {
    const purple = /purple/.test(name), color = purple ? 0x80526c : 0x7d9c4b;
    const count = mobile ? 7 : 9;
    for (let i = 0; i < count; i++) {
      const a = i * golden, r = .055 * Math.sqrt(i / count), h = .3 + (.5 + .5 * Math.sin(i * 2.73)) * .22;
      const base = v(Math.cos(a) * r, 0, Math.sin(a) * r), drift = v(Math.cos(a + .3) * .025, 0, Math.sin(a + .3) * .025);
      const curve = new THREE.CatmullRomCurve3([base, base.clone().add(v(0, h * .4, 0)).addScaledVector(drift, .25), base.clone().add(v(0, h, 0)).add(drift)]);
      const segments = mobile ? 18 : 32, sides = mobile ? 12 : 20, stem = new THREE.TubeGeometry(curve, segments, .009, sides, false), positions = stem.getAttribute("position");
      for (let row = 0; row <= segments; row++) {
        const t = row / segments, center = curve.getPointAt(t), scale = 1.16 - t * .38;
        for (let side = 0; side <= sides; side++) {
          const index = row * (sides + 1) + side;
          positions.setXYZ(index, center.x + (positions.getX(index) - center.x) * scale, center.y + (positions.getY(index) - center.y) * scale, center.z + (positions.getZ(index) - center.z) * scale);
        }
      }
      stem.computeVertexNormals(); add(stem, i % 3 ? color : purple ? 0x946879 : 0x8da757, "skin");
      const tip = curve.getPointAt(1);
      ball(tip.clone().add(v(0, .015, 0)), .0055, purple ? 0x64495d : 0x506f38, v(1, 3.6, 1));
      for (let j = 0; j < (mobile ? 8 : 12); j++) {
        const t = .1 + j * .065, angle = j * golden + i, p = curve.getPointAt(t);
        leaf(p.add(v(Math.cos(angle) * .009, 0, Math.sin(angle) * .009)), .018, .01, angle + Math.PI, -.1, purple ? 0x9c657f : 0x8da060, 0, .03, .12);
      }
      for (let layer = 0; layer < 7; layer++) for (let j = 0; j < 5; j++) {
        const angle = j * Math.PI * 2 / 5 + layer * .61, radius = .01 * (1 - layer * .1);
        const mesh = leaf(tip.clone().add(v(0, -.017 + layer * .007, 0)), .024 - layer * .0015, .012, angle, 0, purple ? layer % 2 ? 0x9b657f : 0x765267 : layer % 2 ? 0x6e9149 : 0x98ad66, 0, .02);
        const positions = mesh.geometry.getAttribute("position"), uv = mesh.geometry.getAttribute("uv");
        for (let k = 0; k < positions.count; k++) {
          const t = uv.getY(k), across = uv.getX(k) * 2 - 1, theta = across * .85 * Math.sin(Math.PI * t);
          const r = radius * (1 - t * .86) + .002 * Math.sin(Math.PI * t);
          positions.setXYZ(k, Math.sin(theta) * r, (.024 - layer * .0015) * t, Math.cos(theta) * r);
        }
        mesh.rotation.set(0, Math.PI / 2 - angle, 0); mesh.geometry.computeVertexNormals();
      }
    }
  } else if (kind === "raspberry") {
    const berry = (p: THREE.Vector3, seed: number) => {
      for (let ring = 0; ring < 6; ring++) {
        const t = ring / 5, radius = .017 * Math.sin((.2 + t * .8) * Math.PI), count = Math.max(3, Math.round(radius * 660));
        for (let j = 0; j < count; j++) {
          const angle = j * Math.PI * 2 / count + ring * .45;
          const center = p.clone().add(v(Math.cos(angle) * radius, -.004 - t * .033, Math.sin(angle) * radius));
          ball(center, .0045 * (1 + Math.sin(j * 2.3 + seed) * .08), (j + ring + seed) % 4 ? 0xb92742 : 0xd8444e, v(1, .95, 1));
          if (!mobile && (j + ring) % 4 === 0) tube([center, center.clone().add(v(Math.cos(angle) * .002, -.002, Math.sin(angle) * .002))], .00018, 0xd5a47e, .7);
        }
      }
      // The top stays open between drupelets; the calyx attaches around the rim.
      for (let i = 0; i < 5; i++) leaf(p, .023, .009, i * Math.PI * 2 / 5 + seed, 1.45, 0x658842, 0, .04, .08);
    };
    for (let cane = 0; cane < 3; cane++) {
      const yaw = cane * golden, height = .88 - cane * .09;
      const end = v(Math.cos(yaw) * .25, height * .88, Math.sin(yaw) * .25);
      const curve = new THREE.CatmullRomCurve3([v(Math.cos(yaw) * .028, 0, Math.sin(yaw) * .028), v(end.x * .2, height * .65, end.z * .2), v(end.x * .6, height, end.z * .6), end]);
      tube(curve.getPoints(6), .007, cane ? 0x806f48 : 0x8a594e, .68);
      for (let i = 1; i <= (mobile ? 5 : 7); i++) {
        const angle = yaw + i * golden, start = curve.getPoint(i / (mobile ? 6 : 8)), reach = .12 + .03 * Math.sin(i * 2.1);
        const tip = start.clone().add(v(Math.cos(angle) * reach, .025, Math.sin(angle) * reach));
        tube([start, start.clone().lerp(tip, .5).add(v(0, .02, 0)), tip], .0024, 0x7d8050);
        leaf(tip, .135, .064, angle, .88, i % 2 ? 0x5f8941 : 0x487b3a, 11, .08);
        for (const side of [-1, 1]) leaf(tip.clone().lerp(start, .18), .088, .048, angle + side * .9, 1.08, 0x609344, 10, .07);
        if (i % 2 === 0) for (let fruit = 0; fruit < 3; fruit++) {
          const p = tip.clone().add(v(Math.cos(angle + fruit * .6) * (.023 + fruit * .012), -.042 - fruit * .017, Math.sin(angle + fruit * .6) * (.023 + fruit * .012)));
          tube([tip, p.clone().add(v(0, .015, 0)), p], .0012, 0x788951);
          berry(p, i + cane + fruit);
        }
        if (!mobile && i % 2) {
          const thorn = start.clone().add(v(Math.cos(angle) * .009, -.007, Math.sin(angle) * .009));
          tube([start, thorn], .001, 0x9a705e, .92);
        }
      }
    }
  } else if (kind === "strawberry") {
    for (let i = 0; i < (mobile ? 6 : 10); i++) {
      const yaw = i * golden, end = v(Math.cos(yaw) * .1, .1 + i % 3 * .03, Math.sin(yaw) * .1);
      tube([v(), end.clone().multiplyScalar(.6).add(v(0, .02, 0)), end], .0027, 0x8c9c56);
      leaf(end, .1, .075, yaw, 1.15, green, 7, .04, .07, "round");
      for (const side of [-1, 1]) leaf(end.clone().add(v(Math.cos(yaw + side * 1.1) * .015, 0, Math.sin(yaw + side * 1.1) * .015)), .077, .063, yaw + side * 1.1, 1.2, dark, 7, .04, .05, "round");
    }
    for (let i = 0; i < 4; i++) {
      const a = i * golden, p = v(Math.cos(a) * .14, .07 + i % 2 * .035, Math.sin(a) * .14);
      tube([v(0, .025, 0), p.clone().add(v(0, .055, 0)), p], .0018, 0x87a354);
      if (i === 3) { blossom(p, 0xf5efdc, .011); continue; }
      const profile = [[0, 0], [.012, .012], [.022, .029], [.021, .044], [.012, .05], [0, .051]].map(([x, y]) => new THREE.Vector2(x, y));
      add(new THREE.LatheGeometry(profile, mobile ? 16 : 28), i === 2 ? 0xc99d74 : 0xc63b33, "skin", p.clone().add(v(0, -.049, 0)));
      for (let ring = 1; ring <= 5; ring++) for (let j = 0; j < 7; j++) { const t = ring / 6, angle = j * Math.PI * 2 / 7 + ring * .5, r = .022 * Math.sin(t * Math.PI * .85); ball(p.clone().add(v(Math.cos(angle) * r, -.049 + t * .046, Math.sin(angle) * r)), .00095, 0xd6b76c, v(.65, 1.35, .65)); }
      for (let j = 0; j < 5; j++) leaf(p, .021, .009, j * golden, 1.3, dark, 0, .02, 0, "lance");
    }
  } else if (kind === "blueberry") {
    for (let branch = 0; branch < 4; branch++) {
      const yaw = branch * golden, end = v(Math.cos(yaw) * .18, .72 - branch * .07, Math.sin(yaw) * .18);
      tube([v(), v(end.x * .25, .3, end.z * .25), end], .006, 0x88704e, .7);
      for (let i = 1; i <= (mobile ? 5 : 8); i++) {
        const t = i / (mobile ? 6 : 9), a = yaw + i * golden, p = end.clone().multiplyScalar(t), tip = p.clone().add(v(Math.cos(a) * .09, .035, Math.sin(a) * .09));
        tube([p, tip], .0017, 0x8e8654); leaf(tip, .075, .04, a, .9, i % 2 ? 0x58864e : 0x789c61, 0, .03, .06, "round");
        if (i % 3 === 0) for (let berry = 0; berry < 4; berry++) {
          const b = berry * golden, point = tip.clone().add(v(Math.cos(b) * .021, -.025 - berry % 2 * .012, Math.sin(b) * .021));
          tube([tip, point], .0007, 0x73864b); ball(point, .0135, berry % 2 ? 0x526b9c : 0x697dab, v(1, .92, 1));
          for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; ball(point.clone().add(v(Math.cos(a) * .003, -.012, Math.sin(a) * .003)), .0018, 0x3b526f, v(1, .45, 1)); }
        }
      }
    }
  } else if (kind === "basil") {
    for (let stem = 0; stem < 3; stem++) {
      const a = stem * golden, end = v(Math.cos(a) * .065, .32 - stem * .035, Math.sin(a) * .065);
      tube([v(), end.clone().multiplyScalar(.5), end], .0045, 0x7e9b53);
      for (let node = 1; node <= 5; node++) for (const side of [-1, 1]) {
        const p = end.clone().multiplyScalar(node / 6), yaw = a + node * Math.PI / 2 + (side < 0 ? Math.PI : 0), tip = p.clone().add(v(Math.cos(yaw) * .025, .008, Math.sin(yaw) * .025));
        tube([p, tip], .0014); leaf(tip, .115 - node * .009, .068 - node * .004, yaw, 1.2 - node * .06, node % 2 ? 0x619740 : 0x78a34d, 0, .09, .14, "round");
      }
    }
  } else if (kind === "chives") {
    for (let i = 0; i < (mobile ? 24 : 38); i++) {
      const a = i * golden, r = .035 * Math.sqrt(i / (mobile ? 24 : 38)), h = .22 + (.5 + .5 * Math.sin(i * 2.3)) * .15, base = v(Math.cos(a) * r, 0, Math.sin(a) * r);
      tube([base, base.clone().add(v(Math.cos(a) * .014, h * .7, Math.sin(a) * .014)), base.clone().add(v(Math.cos(a) * .04, h, Math.sin(a) * .04))], .0023, i % 3 ? 0x52834c : 0x71975b, .7);
    }
    for (let flower = 0; flower < 3; flower++) {
      const a = flower * golden, p = v(Math.cos(a) * .035, .38 + flower * .018, Math.sin(a) * .035); tube([v(), p], .0025);
      for (let j = 0; j < (mobile ? 18 : 28); j++) { const t = (j + .5) / (mobile ? 18 : 28), y = 1 - 2 * t, r = Math.sqrt(1 - y * y), a = j * golden; ball(p.clone().add(v(Math.cos(a) * r * .02, y * .02, Math.sin(a) * r * .02)), .0045, j % 2 ? 0xa27aa3 : 0xc597bb, v(1, 1.4, 1)); }
    }
  } else if (kind === "thyme" || kind === "parsley") {
    const parsley = kind === "parsley";
    for (let stem = 0; stem < (mobile ? 7 : 11); stem++) {
      const yaw = stem * golden, end = v(Math.cos(yaw) * (parsley ? .1 : .14), parsley ? .2 + stem % 3 * .02 : .07 + stem % 3 * .013, Math.sin(yaw) * (parsley ? .1 : .14));
      tube([v(), end.clone().multiplyScalar(.5).add(v(0, .02, 0)), end], parsley ? .002 : .0015, parsley ? 0x75a34b : 0x94825c);
      for (let node = parsley ? 2 : 1; node <= 5; node++) for (const side of [-1, 1]) {
        const p = end.clone().multiplyScalar(node / 6), a = yaw + side * 1.05;
        leaf(p, parsley ? .061 : .018, parsley ? .043 : .01, a, 1.05, parsley ? 0x427b3e : 0x71936c, parsley ? 3 : 0, parsley ? .17 : .02, 0, parsley ? "oak" : "round");
        if (!parsley && node % 2 === 0) {
          const tip = p.clone().add(v(Math.cos(a) * .06, .025, Math.sin(a) * .06)); tube([p, tip], .0007, 0x8b8055);
          for (let j = 1; j <= (mobile ? 3 : 5); j++) for (const twig of [-1, 1]) leaf(p.clone().lerp(tip, j / (mobile ? 4 : 6)), .017, .009, a + twig * 1.15, 1.1, 0x68915d, 0, .03, .04, "round");
        }
      }
      if (parsley) for (const side of [-1, 0, 1]) leaf(end, .075, .05, yaw + side * 1.1, 1.2, 0x568b43, 3, .18, .08, "oak");
      else if (stem % 3 === 0) blossom(end, 0xc893ac, .004);
    }
  } else if (["onion", "garlic", "leek"].includes(kind)) {
    const leek = kind === "leek", garlic = kind === "garlic", base = leek ? .2 : .12;
    if (leek) add(new THREE.CylinderGeometry(.018, .025, .23, 16), 0xe4e3c9, "skin", v(0, .115, 0));
    else if (garlic) for (let i = 0; i < 7; i++) {
      const a = i * golden; ball(v(Math.cos(a) * .025, .055, Math.sin(a) * .025), .023, i % 2 ? 0xdad6bc : 0xf0e6cc, v(.9, 1.6, .9));
    } else ball(v(0, .065, 0), .054, 0xc19c60, v(1, 1.3, 1));
    for (let i = 0; i < (mobile ? 9 : 14); i++) {
      const a = i * golden, h = .33 + i % 4 * .055;
      if (leek || garlic) {
        const blade = leaf(v(leek ? (i % 2 ? .004 : -.004) : 0, base - i % 3 * .009, 0), h, leek ? .057 : .028, a, .26 + i % 5 * .12, wax, 0, .07, -.26);
        if (leek) blade.rotation.set(0, (i % 3 - 1) * .08, (i % 2 ? 1 : -1) * (.18 + i % 5 * .14));
      }
      else tube([v(0, base, 0), v(Math.cos(a) * .045, base + h * .75, Math.sin(a) * .045), v(Math.cos(a) * .11, base + h * .92, Math.sin(a) * .11)], .005 - i % 3 * .0006, 0x568468, .9);
    }
    for (let i = 0; i < (mobile ? 5 : 9); i++) { const a = i * golden; tube([v(Math.cos(a) * .012, .025, Math.sin(a) * .012), v(Math.cos(a) * .027, .006, Math.sin(a) * .027), v(Math.cos(a) * .042, 0, Math.sin(a) * .042)], .0007, 0xc2ae81); }
  } else if (kind === "corn") {
    tube([v(), v(.02, .7, 0), v(0, 1.6, .015)], .025);
    for (let i = 0; i < (mobile ? 9 : 14); i++) {
      const a = i % 2 ? Math.PI / 2 : -Math.PI / 2;
      const stage = i * (mobile ? 13 / 8 : 1);
      leaf(v(0, .15 + stage * .095, 0), .62 - stage * .012, .105 - stage * .002, a + i * .06, 1.05 - stage * .025, i % 3 ? green : dark, 0, .05, -.32);
      add(new THREE.TorusGeometry(.023, .0025, 4, mobile ? 10 : 16), 0x8ca363, undefined, v(0, .15 + stage * .095, .005)).rotation.x = Math.PI / 2;
    }
    for (let ear = 0; ear < 2; ear++) {
      const p = v(ear ? -.06 : .06, .65 + ear * .27, 0);
      ball(p, .035, 0xd9b645, v(1, 3.7, 1));
      for (let j = 0; j < 5; j++) leaf(p.clone().add(v(0, -.1, 0)), .21, .047, j * golden, .1, 0x86a45a, 0, .05, .1);
      for (let j = 0; j < (mobile ? 5 : 10); j++) tube([p.clone().add(v(0, .11, 0)), p.clone().add(v(Math.sin(j) * .025, .16, Math.cos(j) * .015)), p.clone().add(v(Math.sin(j) * .025, .2, Math.cos(j) * .015))], .001, 0xb8a172);
    }
    for (let i = 0; i < 7; i++) {
      const a = i * golden, end = v(Math.cos(a) * .1, 1.7 + i % 3 * .035, Math.sin(a) * .1);
      tube([v(0, 1.55, .01), end], .003, 0xb9a46e);
      for (let j = 0; j < 8; j++) ball(v(0, 1.55, .01).lerp(end, j / 8), .004, 0xc5b27a, v(1, 2, 1));
    }
  } else if (kind === "pepper" || kind === "potato") {
    const potato = kind === "potato", height = potato ? .47 : .7;
    tube([v(), v(0, height * .6, 0), v(.01, height, 0)], .012);
    for (let i = 0; i < (mobile ? 9 : 15); i++) {
      const a = i * golden, stage = i * (mobile ? 14 / 8 : 1), p = v(0, .07 + stage * height / 19, 0), end = p.clone().add(v(Math.cos(a) * .15, .1, Math.sin(a) * .15));
      tube([p, end], .004);
      leaf(end, potato ? .12 : .16, potato ? .085 : .075, a, .95, i % 2 ? green : dark, 0, .08, .06, potato ? "round" : "lance");
      if (potato) for (const t of [.36, .7]) for (const side of [-1, 1]) leaf(p.clone().lerp(end, t), .085 * (t + .45), .052, a + side * 1.12, 1, green, 0, .08, 0, "round");
      else { const side = i % 2 ? -1 : 1; leaf(p.clone().lerp(end, .5), .12, .055, a + side * .85, .85, green); }
      if (i % 3 === 0) {
        blossom(end.clone().add(v(0, .03, 0)), potato ? 0xcbb5d8 : 0xf3eddb, .014);
        if (!potato) {
          const fp = end.clone().add(v(0, -.16, 0)), profile = [[0, 0], [.027, .004], [.045, .018], [.049, .065], [.043, .1], [.029, .12], [0, .124]].map(([x, y]) => new THREE.Vector2(x, y));
          const geometry = new THREE.LatheGeometry(profile, mobile ? 20 : 36), positions = geometry.getAttribute("position");
          for (let j = 0; j < positions.count; j++) { const x = positions.getX(j), z = positions.getZ(j), bulge = 1 + Math.cos(Math.atan2(z, x) * 4) * .15; positions.setXYZ(j, x * bulge, positions.getY(j), z * bulge); }
          geometry.computeVertexNormals(); add(geometry, i % 2 ? 0xb53c2b : 0x47773e, "skin", fp);
          const neck = fp.clone().add(v(0, .127, 0)); tube([end, end.clone().lerp(neck, .5).add(v(.014, .01, 0)), neck], .004);
          for (let j = 0; j < 5; j++) leaf(neck, .024, .012, j * golden, 1.35, dark);
        }
      }
    }
  } else if (kind === "brussels-sprout") {
    tube([v(), v(0, .45, 0), v(0, .83, 0)], .029, wax);
    for (let i = 0; i < (mobile ? 18 : 28); i++) {
      const a = i * golden, stage = i * (mobile ? 27 / 17 : 1), p = v(Math.cos(a) * .034, .08 + stage * .022, Math.sin(a) * .034);
      ball(p, .027, 0x70905b);
      for (let j = 0; j < 3; j++) leaf(p.clone().add(v(0, -.015, 0)), .044, .035, a + j * 2.1, .25, 0x91a977, 0, .04, .6);
    }
    for (let i = 0; i < 12; i++) leaf(v(0, .7 + i % 3 * .025, 0), .25, .15, i * golden, .7, wax, 1, .1);
  } else throw new Error(`No detailed vegetable geometry for ${model.crop}`);

  consolidateGardenMeshes(root);
  const bounds = new THREE.Box3().setFromObject(root);
  root.position.y -= bounds.min.y;
  root.userData = { crop: model.crop, variety: model.variety, vegetableModel: model.id, rendererKind: model.kind, detailedVegetable: true, units: "metres", plantOnly: true };
  return root;
}
