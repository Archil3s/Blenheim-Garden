import * as THREE from "three";
import { createGardenPlant3D } from "@/components/garden-plant-3d";

export type ShowcaseMode = "botanical" | "classic" | "asset";

/** Shared positions; only model geometry changes across comparison modes. */
export const SHOWCASE_TOMATO_PLACEMENTS = [
  { x: -.43, z: -.35, seed: 122 },
  { x: .48, z: .35, seed: 193 },
] as const;

type BotanicalMaterials = {
  stem: THREE.MeshStandardMaterial;
  stemLight: THREE.MeshStandardMaterial;
  leaf: Record<"tomato" | "pea" | "strawberry", THREE.MeshStandardMaterial>;
  tomato: THREE.MeshStandardMaterial;
  tomatoGreen: THREE.MeshStandardMaterial;
  peaPod: THREE.MeshStandardMaterial;
  strawberry: THREE.MeshStandardMaterial;
  seed: THREE.MeshStandardMaterial;
  calyx: THREE.MeshStandardMaterial;
};

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function leafTexture(species: "tomato" | "pea" | "strawberry") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const base = species === "tomato" ? ["#284a30", "#588c4a", "#799f51"]
    : species === "pea" ? ["#4b784b", "#80a869", "#abc17b"]
    : ["#285431", "#578a43", "#779e4a"];
  const widths = Array.from({ length: 35 }, (_, i) => {
    const t = i / 34;
    const envelope = Math.pow(Math.max(0, Math.sin(Math.PI * t)), species === "pea" ? 0.6 : 0.83);
    const tooth = species === "pea" ? 1 : 1 + 0.055 * Math.sin(t * (species === "strawberry" ? 38 : 26) * Math.PI);
    const fullness = species === "pea" ? 0.46 : 0.39;
    return envelope * tooth * fullness * 128;
  });
  ctx.beginPath();
  ctx.moveTo(64, 250);
  for (let i = 0; i <= 34; i += 1) ctx.lineTo(64 + widths[i], 250 - i / 34 * 238);
  for (let i = 34; i >= 0; i -= 1) ctx.lineTo(64 - widths[i], 250 - i / 34 * 238);
  ctx.closePath();
  const fill = ctx.createLinearGradient(24, 0, 110, 240);
  fill.addColorStop(0, base[0]);
  fill.addColorStop(0.48, base[1]);
  fill.addColorStop(1, base[2]);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(31,59,31,.45)";
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(64, 250);
  ctx.quadraticCurveTo(63, 132, 64, 12);
  ctx.strokeStyle = "rgba(205,222,151,.52)";
  ctx.lineWidth = 2.3;
  ctx.stroke();
  for (let i = 1; i < 10; i += 1) {
    const t = i / 11;
    const y = 250 - t * 238;
    const spread = widths[Math.min(34, Math.round(t * 34))] * .82;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64, y + 3);
      ctx.quadraticCurveTo(64 + side * spread * .45, y - 15, 64 + side * spread, y - 17);
      ctx.strokeStyle = "rgba(210,230,157,.36)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function soilTexture(seed = 93) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.fillStyle = "#493a2c";
  ctx.fillRect(0, 0, 256, 256);
  const rand = random(seed);
  for (let i = 0; i < 7200; i += 1) {
    const l = 22 + Math.floor(rand() * 50);
    ctx.fillStyle = `rgba(${l + 32},${l + 16},${l},${.09 + rand() * .23})`;
    ctx.beginPath();
    ctx.ellipse(rand() * 256, rand() * 256, .3 + rand() * 2.1, .25 + rand() * 1.1, rand() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}

function timberTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.fillStyle = "#967756";
  ctx.fillRect(0, 0, 256, 128);
  const rand = random(64);
  for (let i = 0; i < 230; i += 1) {
    const y = rand() * 128;
    const left = rand() * 40;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(80, y + rand() * 3, 170, y - rand() * 3, 278, y + rand() * 2);
    ctx.strokeStyle = i % 2 ? "rgba(70,45,30,.12)" : "rgba(244,218,168,.13)";
    ctx.lineWidth = .3 + rand() * 1.8;
    ctx.stroke();
    if (left < 6) ctx.fillRect(rand() * 256, y, 1 + rand() * 4, 0.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cuboid(
  root: THREE.Object3D,
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function segment(root: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
  const length = from.distanceTo(to);
  if (length < 0.001) return;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .76, radius, length, 7), material);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  mesh.castShadow = true;
  root.add(mesh);
}

function curvedStem(root: THREE.Object3D, points: THREE.Vector3[], thickness: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, thickness, 6, false), material,
  );
  mesh.castShadow = true;
  root.add(mesh);
}

function leafMesh(material: THREE.MeshStandardMaterial, length: number, width: number) {
  const geometry = new THREE.PlaneGeometry(1, 1, 4, 10);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const t = pos.getY(i) + .5;
    const side = pos.getX(i) * 2;
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * t)), .65);
    pos.setXYZ(i, pos.getX(i) * width * taper, t * length,
      .016 * Math.sin(Math.PI * t) * (1 - Math.abs(side)) - .014 * Math.abs(side) * t);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

function leaf(
  root: THREE.Object3D, material: THREE.MeshStandardMaterial,
  position: THREE.Vector3, length: number, width: number, yaw: number,
  inclination = 1.07, roll = 0,
) {
  const part = leafMesh(material, length, width);
  part.position.copy(position);
  part.rotation.order = "YXZ";
  part.rotation.set(inclination, yaw, roll);
  root.add(part);
}

function fruit(root: THREE.Object3D, position: THREE.Vector3, radius: number, material: THREE.Material, elongated = false) {
  const geo = new THREE.SphereGeometry(radius, 14, 11);
  const coords = geo.attributes.position;
  for (let i = 0; i < coords.count; i += 1) {
    const x = coords.getX(i), y = coords.getY(i), z = coords.getZ(i);
    const angular = Math.atan2(z, x);
    const rib = 1 + .035 * Math.cos(angular * 6);
    coords.setXYZ(i, x * rib, y * (elongated ? 1.18 : .87), z * rib);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  root.add(mesh);
}

function createMaterials(): BotanicalMaterials {
  return {
    stem: new THREE.MeshStandardMaterial({ color: "#46663a", roughness: .91 }),
    stemLight: new THREE.MeshStandardMaterial({ color: "#6c8752", roughness: .92 }),
    leaf: {
      tomato: new THREE.MeshStandardMaterial({ map: leafTexture("tomato"), transparent: false, alphaTest: .32, side: THREE.DoubleSide, roughness: .84 }),
      pea: new THREE.MeshStandardMaterial({ map: leafTexture("pea"), alphaTest: .32, side: THREE.DoubleSide, roughness: .85 }),
      strawberry: new THREE.MeshStandardMaterial({ map: leafTexture("strawberry"), alphaTest: .32, side: THREE.DoubleSide, roughness: .82 }),
    },
    tomato: new THREE.MeshStandardMaterial({ color: "#df542e", roughness: .35, metalness: 0 }),
    tomatoGreen: new THREE.MeshStandardMaterial({ color: "#82983b", roughness: .51 }),
    peaPod: new THREE.MeshStandardMaterial({ color: "#90ae59", roughness: .62 }),
    strawberry: new THREE.MeshStandardMaterial({ color: "#b72f2b", roughness: .61 }),
    seed: new THREE.MeshStandardMaterial({ color: "#d2ba73", roughness: .78 }),
    calyx: new THREE.MeshStandardMaterial({ color: "#527745", roughness: .83 }),
  };
}

function tomatoPlant(root: THREE.Object3D, seed: number, m: BotanicalMaterials, mobile: boolean) {
  const rand = random(seed);
  const height = 1.23 + rand() * .22;
  curvedStem(root, [
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-.03, height * .4, .02),
    new THREE.Vector3(.05, height * .76, -.02),
    new THREE.Vector3(.025, height, .01),
  ], .023, m.stem);
  for (let level = 0; level < (mobile ? 6 : 9); level += 1) {
    const y = .24 + level * height * .093;
    const yaw = level * 2.38 + rand() * .35;
    const origin = new THREE.Vector3(0, y, 0);
    const rachis = new THREE.Vector3(Math.cos(yaw) * .33, y + .12, Math.sin(yaw) * .33);
    segment(root, origin, rachis, .007, m.stemLight);
    leaf(root, m.leaf.tomato, rachis, .23, .19, yaw - Math.PI * .5, .92);
    for (const side of [-1, 1]) {
      for (let j = 1; j <= (mobile ? 1 : 2); j += 1) {
        const joint = origin.clone().lerp(rachis, .3 + j * .19);
        const a = yaw + side * (1.15 + j * .12);
        const end = joint.clone().add(new THREE.Vector3(Math.cos(a) * .09, .025, Math.sin(a) * .09));
        segment(root, joint, end, .004, m.stem);
        leaf(root, m.leaf.tomato, end, .19, .15, a - Math.PI / 2, 1.08);
      }
    }
  }
  for (let cluster = 0; cluster < (mobile ? 2 : 3); cluster += 1) {
    const y = .42 + cluster * .27;
    const angle = .75 + cluster * 2.36;
    const start = new THREE.Vector3(0, y, 0);
    const neck = new THREE.Vector3(Math.cos(angle) * .16, y - .015, Math.sin(angle) * .16);
    segment(root, start, neck, .005, m.stemLight);
    for (let i = 0; i < (mobile ? 3 : 4); i += 1) {
      const theta = angle + (i - 1.3) * .54;
      const top = neck.clone().add(new THREE.Vector3(Math.cos(theta) * .09, -.045 - i * .035, Math.sin(theta) * .09));
      segment(root, neck, top.clone().add(new THREE.Vector3(0, .06, 0)), .003, m.stem);
      fruit(root, top, .056 + rand() * .006, i === 0 && cluster > 0 ? m.tomatoGreen : m.tomato);
      for (let s = 0; s < 4; s += 1) {
        leaf(root, m.leaf.tomato, top.clone().add(new THREE.Vector3(0, .05, 0)), .039, .026,
          s * Math.PI / 2, 1.5);
      }
    }
  }
}

function tendril(root: THREE.Object3D, point: THREE.Vector3, angle: number, material: THREE.Material) {
  const points: THREE.Vector3[] = [];
  for (let j = 0; j < 12; j += 1) {
    const t = j / 11, turn = t * Math.PI * 3.6 + angle;
    points.push(point.clone().add(new THREE.Vector3(
      Math.cos(angle) * t * .14 + Math.cos(turn) * t * .028,
      .025 + Math.sin(turn) * t * .034,
      Math.sin(angle) * t * .14 + Math.sin(turn) * t * .028,
    )));
  }
  curvedStem(root, points, .0026, material);
}

function peaPlant(root: THREE.Object3D, seed: number, m: BotanicalMaterials, mobile: boolean) {
  const rand = random(seed);
  const height = 1.38 + rand() * .15;
  curvedStem(root, [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(.04, .42, -.03),
    new THREE.Vector3(-.04, .96, .025),
    new THREE.Vector3(.025, height, 0),
  ], .011, m.stemLight);
  for (let level = 0; level < (mobile ? 7 : 10); level += 1) {
    const y = .18 + level * height * .085;
    const yaw = level * 2.21 + rand() * .17;
    const origin = new THREE.Vector3(0, y, 0);
    const tip = new THREE.Vector3(Math.cos(yaw) * .15, y + .075, Math.sin(yaw) * .15);
    segment(root, origin, tip, .004, m.stemLight);
    for (const handed of [-1, 1]) {
      const a = yaw + handed * .72;
      const at = origin.clone().lerp(tip, .56)
        .add(new THREE.Vector3(Math.cos(a) * .055, 0, Math.sin(a) * .055));
      leaf(root, m.leaf.pea, at, .17, .145, a - Math.PI / 2, 1.08);
    }
    if (level % 2 === 0) tendril(root, tip, yaw, m.stemLight);
    if (level > 2 && level % 3 === 0) {
      for (let i = 0; i < 2; i += 1) {
        const pod = new THREE.Mesh(new THREE.CapsuleGeometry(.026, .13, 5, 9), m.peaPod);
        pod.position.copy(tip).add(new THREE.Vector3(i * .045, -.095, -.025));
        pod.rotation.z = .22 + i * .17;
        pod.castShadow = true;
        root.add(pod);
      }
    }
  }
}

function strawberryPlant(root: THREE.Object3D, seed: number, m: BotanicalMaterials, mobile: boolean) {
  const rand = random(seed);
  const crown = new THREE.Vector3(0, .015, 0);
  for (let i = 0; i < (mobile ? 5 : 7); i += 1) {
    const angle = i * 2.4 + rand() * .25;
    const tip = new THREE.Vector3(Math.cos(angle) * (.1 + rand() * .04),
      .16 + rand() * .06, Math.sin(angle) * (.1 + rand() * .04));
    curvedStem(root, [crown, new THREE.Vector3(tip.x * .6, .11, tip.z * .6), tip], .0045, m.stemLight);
    for (const j of [-1, 0, 1]) {
      const at = tip.clone().add(new THREE.Vector3(
        -Math.sin(angle) * j * .04, .004, Math.cos(angle) * j * .04,
      ));
      leaf(root, m.leaf.strawberry, at, .155, .138, angle - Math.PI / 2 + j * .5, 1.14);
    }
  }
  for (let i = 0; i < (mobile ? 2 : 3); i += 1) {
    const angle = i * 2.19 + .3;
    const point = new THREE.Vector3(Math.cos(angle) * .2, .07, Math.sin(angle) * .2);
    curvedStem(root, [crown.clone().add(new THREE.Vector3(0, .09, 0)), new THREE.Vector3(point.x * .58, .18, point.z * .6), point], .0038, m.stemLight);
    const berry = new THREE.Mesh(new THREE.ConeGeometry(.041, .096, 12, 4), m.strawberry);
    berry.rotation.z = Math.PI;
    berry.position.copy(point).add(new THREE.Vector3(0, -.025, 0));
    berry.castShadow = true;
    root.add(berry);
    for (let p = 0; p < (mobile ? 5 : 8); p += 1) {
      const t = (p % 3 + .8) / 4;
      const theta = p * 2.4;
      const rad = .039 * (1 - t * .4);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.0032, 5, 4), m.seed);
      dot.position.copy(berry.position).add(new THREE.Vector3(
        Math.cos(theta) * rad, (.5 - t) * .083, Math.sin(theta) * rad,
      ));
      root.add(dot);
    }
  }
}

function makeGround(root: THREE.Group, mobile: boolean) {
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 9),
    new THREE.MeshStandardMaterial({ color: "#9ca98b", roughness: 1 }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -.048;
  surface.receiveShadow = true;
  root.add(surface);
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: "#c4b5a0", roughness: 1 });
  const left = cuboid(root, stoneMaterial, [1.18, .04, 5.2], [-1.72, -.018, 0]);
  const right = cuboid(root, stoneMaterial, [1.18, .04, 5.2], [1.72, -.018, 0]);
  left.castShadow = right.castShadow = false;
  const rand = random(7761);
  const count = mobile ? 95 : 230;
  const geom = new THREE.DodecahedronGeometry(1, 0);
  const pebbles = new THREE.InstancedMesh(geom, stoneMaterial, count);
  const obj = new THREE.Object3D();
  for (let i = 0; i < count; i += 1) {
    obj.position.set((rand() < .5 ? -1 : 1) * (1.14 + rand() * 1.1), -.003, -2.48 + rand() * 4.96);
    obj.scale.set(.014 + rand() * .025, .005 + rand() * .012, .014 + rand() * .025);
    obj.rotation.y = rand() * 6.28;
    obj.updateMatrix();
    pebbles.setMatrixAt(i, obj.matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  root.add(pebbles);
}

function makeBed(root: THREE.Group, mobile: boolean) {
  makeGround(root, mobile);
  const timber = new THREE.MeshStandardMaterial({ map: timberTexture(), roughness: .86 });
  const endgrain = new THREE.MeshStandardMaterial({ color: "#70513b", roughness: .88 });
  const soil = new THREE.MeshStandardMaterial({ map: soilTexture(), roughness: 1 });
  const wire = new THREE.MeshStandardMaterial({ color: "#7b8979", roughness: .57, metalness: .28 });
  cuboid(root, soil, [1.88, .24, 3.88], [0, .175, 0]);
  const width = 2, depth = 4, h = .38, rail = .12;
  for (const z of [-depth / 2, depth / 2]) {
    cuboid(root, timber, [width + .08, h, rail], [0, h / 2, z]);
    cuboid(root, timber, [width + .2, .048, rail + .04], [0, h + .018, z]);
  }
  for (const x of [-width / 2, width / 2]) {
    cuboid(root, timber, [rail, h, depth], [x, h / 2, 0]);
    cuboid(root, timber, [rail + .04, .048, depth], [x, h + .018, 0]);
  }
  for (const x of [-1, 1]) for (const z of [-2, 2]) {
    cuboid(root, endgrain, [.12, h + .045, .12], [x, (h + .045) / 2, z]);
  }
  // The same 1.8m wire trellis appears in both comparison modes.
  const trellis = new THREE.Group();
  trellis.position.z = -1.62;
  for (const x of [-.73, 0, .73]) cuboid(trellis, timber, [.048, 1.79, .055], [x, .895, 0]);
  for (const y of [.42, .77, 1.12, 1.47, 1.75]) {
    cuboid(trellis, wire, [1.48, .009, .009], [0, y, 0]);
  }
  for (const x of [-.5, -.25, .25, .5]) {
    cuboid(trellis, wire, [.009, 1.45, .009], [x, 1.07, 0]);
  }
  root.add(trellis);

  // Fine mulch pieces inside the bed: instanced to avoid hundreds of draw calls.
  const mulchMaterial = new THREE.MeshStandardMaterial({ color: "#765c3e", roughness: 1 });
  const mulch = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mulchMaterial, mobile ? 110 : 260);
  const rand = random(4834);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < mulch.count; i += 1) {
    dummy.position.set(-.89 + rand() * 1.78, .3, -1.85 + rand() * 3.7);
    dummy.scale.set(.015 + rand() * .06, .008, .008 + rand() * .014);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.updateMatrix();
    mulch.setMatrixAt(i, dummy.matrix);
  }
  mulch.instanceMatrix.needsUpdate = true;
  root.add(mulch);
}

export function createShowcaseBed(mode: ShowcaseMode, mobile: boolean) {
  const root = new THREE.Group();
  makeBed(root, mobile);
  const botanical = mode !== "classic";
  const m = botanical ? createMaterials() : null;
  const plants: Array<{ crop: "Tomato" | "Pea" | "Strawberry"; x: number; z: number; seed: number }> = [
    { crop: "Pea", x: -.49, z: -1.49, seed: 20 },
    { crop: "Pea", x: .04, z: -1.48, seed: 41 },
    { crop: "Pea", x: .51, z: -1.49, seed: 62 },
    ...SHOWCASE_TOMATO_PLACEMENTS.map((point) => ({ crop: "Tomato" as const, ...point })),
    { crop: "Strawberry", x: -.56, z: 1.29, seed: 500 },
    { crop: "Strawberry", x: -.08, z: 1.34, seed: 534 },
    { crop: "Strawberry", x: .43, z: 1.3, seed: 569 },
    { crop: "Strawberry", x: .05, z: 1.72, seed: 602 },
  ];
  for (const plant of plants) {
    // The GLB loader adds real tomato assets after these environment plants are ready.
    if (mode === "asset" && plant.crop === "Tomato") continue;
    const holder = new THREE.Group();
    holder.position.set(plant.x, .31, plant.z);
    if (botanical && m) {
      if (plant.crop === "Tomato") tomatoPlant(holder, plant.seed, m, mobile);
      else if (plant.crop === "Pea") peaPlant(holder, plant.seed, m, mobile);
      else strawberryPlant(holder, plant.seed, m, mobile);
    } else {
      const model = createGardenPlant3D(
        plant.crop === "Pea" ? "Peas" : plant.crop === "Tomato" ? "Tomato" : "Strawberry",
        plant.crop === "Tomato" ? "Sungold" : "", mobile, plant.seed,
      );
      if (plant.crop === "Pea") model.scale.multiplyScalar(1.55);
      if (plant.crop === "Tomato") model.scale.multiplyScalar(1.34);
      holder.add(model);
    }
    root.add(holder);
  }
  root.userData.showcaseMode = mode;
  root.userData.plantCount = plants.length;
  return root;
}

/** Never dispose the globally cached low-poly materials used elsewhere in the planner. */
export function disposeShowcaseBed(group: THREE.Group, mode: ShowcaseMode) {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    if (mode === "classic") return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach((mat) => {
      materials.add(mat);
      if (mat instanceof THREE.MeshStandardMaterial) {
        if (mat.map) textures.add(mat.map);
        if (mat.bumpMap) textures.add(mat.bumpMap);
      }
    });
  });
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
