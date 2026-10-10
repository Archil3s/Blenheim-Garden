import * as THREE from "three";
import { consolidateGardenMeshes } from "./garden-mesh-optimization";
import type { VegetableModel } from "@/lib/garden/vegetable-model-catalog";

const textures = new Map<string, THREE.CanvasTexture>();
const normals = new Map<string, THREE.CanvasTexture>();
const golden = 2.399963;
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function surfaceTexture(kind: "leaf" | "skin" | "net") {
  const cached = textures.get(kind);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create vegetable surface textures");
  ctx.scale(2, 2);
  ctx.fillStyle = "#e5e7d9"; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const x = (i * 73.13) % 256, y = (i * 131.71) % 256;
    ctx.fillStyle = i % 2 ? "rgba(45,70,32,.045)" : "rgba(255,255,255,.16)";
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  if (kind === "leaf") {
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

function surfaceNormal(kind: "leaf" | "skin" | "net") {
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
  const material = (color: number, surface?: "leaf" | "skin" | "net", roughness = .68) => {
    const key = `${color}:${surface}:${roughness}`;
    let result = materialCache.get(key);
    if (!result) {
      result = new THREE.MeshStandardMaterial({ color, roughness, vertexColors: surface === "leaf", side: surface === "leaf" ? THREE.DoubleSide : THREE.FrontSide, map: surface ? surfaceTexture(surface) : null, normalMap: surface ? surfaceNormal(surface) : null, normalScale: new THREE.Vector2(.45, .45) });
      result.name = `${surface ?? "stem"}-${color.toString(16)}`;
      materialCache.set(key, result);
    }
    return result;
  };
  const green = 0x5c964a, dark = 0x397246, wax = 0x83a18e;
  const add = (geometry: THREE.BufferGeometry, color: number, surface?: "leaf" | "skin" | "net", position = v(), scale = v(1, 1, 1)) => {
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
  // Curved centerlines and fine margins avoid the old folded-paper silhouette.
  const leaf = (base: THREE.Vector3, length: number, width: number, yaw: number, pitch = .9, color = green, lobes = 0, curl = .1, cup = 0) => {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [], colors: number[] = [];
    const small = length < .06;
    const rows = mobile ? small ? 8 : 24 : small ? 12 : lobes > 6 ? 56 : 40;
    const columns = mobile ? small ? 4 : 6 : small || width < .026 ? 4 : 12;
    const phase = Math.sin(yaw * 3.71 + base.y * 9), bend = pitch > .55 ? .2 + phase * .045 : .055;
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
      const t = i / rows, a = j / columns * 2 - 1;
      const envelope = Math.pow(Math.max(0, Math.sin(Math.PI * t)), .78);
      const depth = kind === "raspberry" ? .055 : .18;
      const lobe = lobes ? 1 - depth + depth * Math.cos(t * Math.PI * lobes * 2 + .25) : 1;
      const serration = 1 - (lobes ? .035 : .018) * (.5 + .5 * Math.sin(t * Math.PI * 42));
      const edge = envelope * width / 2 * lobe * serration;
      const x = a * edge + phase * width * .07 * Math.sin(Math.PI * t) * t;
      const ripple = Math.sin(t * Math.PI * (lobes > 5 ? 17 : 7) + a * 2 + phase) * curl * width * .24 * Math.pow(Math.abs(a), 2.5) * envelope;
      const angle = cup * 2.25 * t;
      const y = Math.abs(cup) > .05 ? length * Math.sin(angle) / (cup * 2.25) : length * t;
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
    const mesh = add(geometry, color, "leaf", base);
    mesh.rotation.set(pitch, Math.PI / 2 - yaw, Math.sin(yaw * 3) * .07, "YXZ");
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
  const kind = model.kind;
  if (["lettuce", "spinach", "chard", "cabbage", "kale"].includes(kind)) {
    if (kind === "kale") {
      tube([v(), v(.01, .3, 0), v(0, .68, .01)], .016, wax);
      for (let i = 0; i < (mobile ? 13 : 22); i++) {
        const stage = i * (mobile ? 21 / 12 : 1);
        leaf(v(0, .06 + stage * .025, 0), .28 - stage * .004, .13, i * golden, 1.1 - stage * .022, i % 2 ? wax : dark, 9, .55);
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
        leaf(end, .23, .16, yaw, .65 + i % 3 * .1, green, 2, .3);
      }
    } else rosette(mobile ? 17 : 27, /cos/.test(name) ? .33 : kind === "spinach" ? .2 : .24, /cos/.test(name) ? .1 : .14, kind === "spinach" ? 0x346c3d : 0x74a34d, /loose/.test(name) ? 6 : 0, /loose/.test(name) ? .38 : .13, /cos/.test(name));
  } else if (kind === "broccoli" || kind === "cauliflower") {
    const broccoli = kind === "broccoli", color = broccoli ? (/rudolph/.test(name) ? 0x687c59 : 0x38673d) : 0xeee4c3;
    tube([v(), v(0, .18, 0), v(0, .34, 0)], .032, wax);
    for (let i = 0; i < (mobile ? 8 : 12); i++) leaf(v(0, .07 + i % 3 * .04, 0), .29, .14, i * golden, .9, i % 2 ? wax : dark, 2, .15);
    const clusters = mobile ? 10 : 17;
    for (let i = 0; i < clusters; i++) {
      const a = i * golden, r = .13 * Math.sqrt(i / clusters), center = v(Math.cos(a) * r, .34 + Math.sqrt(1 - r * r / .025) * .075, Math.sin(a) * r);
      tube([v(0, .25, 0), center], .012, wax);
      ball(center, .036, color);
      for (let j = 0; j < (mobile ? 34 : 70); j++) {
        const b = j * golden + i, s = .042 * Math.sqrt(j / (mobile ? 34 : 70));
        const p = center.clone().add(v(Math.cos(b) * s, .014 + Math.sqrt(Math.max(0, .043 ** 2 - s ** 2)) * .7, Math.sin(b) * s));
        ball(p, (.005 + .002 * (.5 + .5 * Math.sin(j * 2.71 + i))) * (mobile ? 1.12 : 1), j % 4 ? color : broccoli ? 0x50844b : 0xf5edda, v(1, 1.25, 1));
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
      for (let i = 0; i < (mobile ? 6 : 10); i++) {
        const yaw = i * golden, end = v(Math.cos(yaw) * .14, length + .19 + i % 3 * .025, Math.sin(yaw) * .14);
        const start = v(0, length - .025, 0); tube([start, end.clone().lerp(start, .4), end], .0025);
        for (let j = 1; j < (mobile ? 5 : 8); j++) for (const side of [-1, 1]) {
          const p = start.clone().lerp(end, j / 9);
          leaf(p, .065 * (1 - j / 12), .016, yaw + side * 1.1, 1.2, i % 2 ? green : dark, 5, .08);
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
        for (let j = 0; j < (broad || kind === "pea" ? 4 : 3); j++) leaf(tip.clone().add(v(Math.cos(yaw + j * 2.1) * .025, 0, Math.sin(yaw + j * 2.1) * .025)), winged ? .075 : broad ? .11 : .135, winged ? .045 : broad ? .055 : .09, yaw + j * 2.1, .95, i % 2 ? green : dark);
        if (i % 2 === 0) {
          const purple = /purple/.test(name), podColor = purple ? 0x624370 : 0x639047;
          const podLength = winged ? .1 : broad ? .16 : .15;
          const points = [tip.clone(), tip.clone().add(v(.025, -.06, .01)), tip.clone().add(v(.015, -podLength, .02))];
          tube(points, broad ? .012 : kind === "pea" ? .008 : .0045, podColor);
          if (kind === "pea" || broad) for (let j = 1; j < 5; j++) ball(tip.clone().add(v(.02, -podLength * j / 5, .015)), broad ? .013 : .008, podColor, v(.75, 1.1, .75));
          if (winged) for (let j = 0; j < 4; j++) leaf(tip.clone().add(v(0, -.1, 0)), .095, .014, j * Math.PI / 2, 0, podColor, 4, .12);
          blossom(tip.clone().add(v(0, .015, 0)), winged || /scarlet/.test(name) ? 0xa82f39 : 0xf1e9dc, .012);
        }
        if (climb && i % 2) tendril(tip, yaw + .8);
      }
    }
  } else if (["pumpkin", "zucchini", "cucumber", "melon"].includes(kind)) {
    const climb = kind === "cucumber", squash = kind === "zucchini";
    for (let arm = 0; arm < (mobile ? 3 : 4); arm++) {
      const yaw = arm * golden, reach = squash ? .23 : .48;
      const start = v(), end = v(Math.cos(yaw) * reach, climb ? .75 + arm * .06 : .05, Math.sin(yaw) * reach);
      tube([start, end.clone().multiplyScalar(.4).add(v(0, .025, .02)), end], squash ? .013 : .008);
      for (let i = 1; i <= (mobile ? 3 : 5); i++) {
        const p = start.clone().lerp(end, i / 6), angle = yaw + (i % 2 ? .9 : -.9), tip = p.clone().add(v(Math.cos(angle) * .08, .12, Math.sin(angle) * .08));
        tube([p, tip], .005); leaf(tip, squash ? .28 : .23, squash ? .23 : .2, angle, .9, i % 2 ? green : dark, kind === "melon" ? 2 : 3, .18);
        if (i % 2) tendril(p, angle);
      }
      blossom(end.clone().add(v(0, .04, 0)), 0xeac64c, .035);
    }
    for (let i = 0; i < (mobile ? 2 : 3); i++) {
      const a = i * golden + .5, pos = v(Math.cos(a) * .19, climb ? .35 + i * .15 : .1, Math.sin(a) * .19);
      if (squash || climb) {
        const mesh = ball(pos, .055, squash ? 0x3b713a : 0x56814b, v(.7, squash ? 2.4 : 2.1, .7), 5);
        mesh.rotation.z = squash ? 1.2 : .13;
        if (climb) for (let j = 0; j < (mobile ? 9 : 18); j++) {
          const b = j * golden; ball(pos.clone().add(v(Math.cos(b) * .039, (j % 5 - 2) * .035, Math.sin(b) * .039)), .0035, 0x92a45e);
        }
      } else {
        const butter = /butternut/.test(name), gem = /gem/.test(name), crown = /crown/.test(name), kabocha = /kabocha/.test(name);
        const color = butter ? 0xc5a876 : crown ? 0x8b9e91 : gem || kabocha ? 0x41694b : kind === "melon" ? 0xb7a369 : 0xd58a36;
        ball(pos, gem ? .075 : .105, color, butter ? v(.65, 1.7, .65) : v(1.2, .8, 1.2), kind === "melon" ? 0 : 10, kind === "melon" ? "net" : "skin");
        if (butter) ball(pos.clone().add(v(0, -.06, 0)), .08, color, v(1, .9, 1), 8);
        tube([pos.clone().add(v(0, .065, 0)), pos.clone().add(v(.01, butter ? .2 : .12, 0))], .01, 0x65733e);
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
    for (let i = 0; i < (mobile ? 10 : 16); i++) leaf(v(0, .07 + i % 4 * .04, 0), .47, .19, i * golden, 1.1, wax, 6, .18);
    for (let bud = 0; bud < 3; bud++) {
      const p = bud ? v(Math.cos(bud * 2) * .16, .5, Math.sin(bud * 2) * .16) : v(0, .68, 0), scale = bud ? .7 : 1;
      if (bud) tube([v(0, .3, 0), p], .014, wax);
      ball(p, .057 * scale, 0x66844d, v(1, 1.2, 1));
      for (let layer = 0; layer < 7; layer++) for (let i = 0; i < (mobile ? 9 : 12); i++) {
        const a = i * Math.PI * 2 / (mobile ? 9 : 12) + layer * .38;
        const mesh = leaf(p, (.09 - layer * .007) * scale, (.044 - layer * .003) * scale, a, 0, layer % 2 ? 0x72905c : 0x879b70, 0, .04);
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
      const end = v(Math.cos(yaw) * .16, height, Math.sin(yaw) * .16);
      const curve = new THREE.CatmullRomCurve3([v(Math.cos(yaw) * .028, 0, Math.sin(yaw) * .028), v(end.x * .2, height * .52, end.z * .2), end]);
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
  } else if (["onion", "garlic", "leek"].includes(kind)) {
    const leek = kind === "leek", garlic = kind === "garlic", base = leek ? .2 : .12;
    if (leek) add(new THREE.CylinderGeometry(.018, .025, .23, 16), 0xe4e3c9, "skin", v(0, .115, 0));
    else if (garlic) for (let i = 0; i < 7; i++) {
      const a = i * golden; ball(v(Math.cos(a) * .025, .055, Math.sin(a) * .025), .023, i % 2 ? 0xdad6bc : 0xf0e6cc, v(.9, 1.6, .9));
    } else ball(v(0, .065, 0), .054, 0xc19c60, v(1, 1.3, 1));
    for (let i = 0; i < (mobile ? 9 : 14); i++) {
      const a = i * golden, h = .33 + i % 4 * .055;
      if (leek || garlic) leaf(v(0, base, 0), h, leek ? .045 : .026, a, .28 + i % 3 * .12, wax, 0, .05, -.2);
      else tube([v(0, base, 0), v(Math.cos(a) * .035, base + h * .65, Math.sin(a) * .035), v(Math.cos(a) * .085, base + h, Math.sin(a) * .085)], .005 - i % 3 * .0006, 0x568468);
    }
  } else if (kind === "corn") {
    tube([v(), v(.02, .7, 0), v(0, 1.6, .015)], .025);
    for (let i = 0; i < (mobile ? 9 : 14); i++) {
      const a = i % 2 ? Math.PI / 2 : -Math.PI / 2;
      const stage = i * (mobile ? 13 / 8 : 1);
      leaf(v(0, .15 + stage * .095, 0), .53 - stage * .009, .065, a + i * .1, .75, i % 3 ? green : dark, 0, .05, -.14);
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
      leaf(end, potato ? .13 : .15, .075, a, .95, i % 2 ? green : dark);
      for (const side of [-1, 1]) leaf(p.clone().lerp(end, .6), .09, .045, a + side * 1.2, 1, green);
      if (i % 3 === 0) {
        blossom(end.clone().add(v(0, .03, 0)), potato ? 0xcbb5d8 : 0xf3eddb, .014);
        if (!potato) {
          const fp = end.clone().add(v(0, -.08, 0));
          ball(fp, .055, i % 2 ? 0xa9362b : 0x568248, v(1, 1.3, 1), 4);
          tube([end, fp.clone().add(v(0, .065, 0))], .004);
          for (let j = 0; j < 5; j++) leaf(fp.clone().add(v(0, .062, 0)), .02, .012, j * golden, 1.3, dark);
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
