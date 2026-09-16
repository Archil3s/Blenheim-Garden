import * as THREE from "three";
import { createGardenPlant3D } from "@/components/garden-plant-3d";

type CropPatchPattern = "grid" | "staggered" | "rows" | "natural" | "single";

type CropPatchOptions = {
  crop: string;
  variety?: string | null;
  count: number;
  spacingCm: number;
  iconSize?: number;
  pattern?: CropPatchPattern;
  widthM: number;
  depthM: number;
  centerX: number;
  centerZ: number;
  baseY: number;
  mobile: boolean;
  seed?: number;
};

type CropRowOptions = {
  crop: string;
  variety?: string | null;
  count: number;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  baseY: number;
  mobile: boolean;
  seed?: number;
};

type DenseKind = "rosette" | "allium" | "root-top" | "herb" | "detailed";

const COLORS = {
  leaf: new THREE.Color(0x3f7e43),
  leafLight: new THREE.Color(0x69a856),
  leafDark: new THREE.Color(0x2e6639),
  leafBlue: new THREE.Color(0x4f7659),
  carrot: new THREE.Color(0xdc7629),
  beet: new THREE.Color(0x8d3150),
  radish: new THREE.Color(0xd94e66),
  onion: new THREE.Color(0xddd0a7),
};

function normalise(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function seeded(seed: number) {
  let value = (Math.floor(seed * 2654435761) ^ 0x9e3779b9) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cropDenseKind(crop: string): DenseKind {
  const name = normalise(crop);
  if (/onion|garlic|leek|shallot|chive/.test(name)) return "allium";
  if (/carrot|beet|beetroot|radish|daikon|turnip|parsnip/.test(name)) return "root-top";
  if (/lettuce|spinach|rocket|arugula|mesclun|bok choy|pak choi|tatsoi|chard|silverbeet/.test(name)) return "rosette";
  if (/basil|parsley|coriander|cilantro|mint|oregano|marjoram|thyme|sage/.test(name)) return "herb";
  return "detailed";
}

function isSparseCrop(crop: string) {
  const name = normalise(crop);
  return /pumpkin|squash|zucchini|courgette|melon|watermelon|cucumber/.test(name);
}

function isTallCrop(crop: string) {
  const name = normalise(crop);
  return /tomato|corn|maize|climbing bean|runner bean|pole bean|pea|raspberry/.test(name);
}

function cropScale(crop: string, iconSize = 18) {
  const name = normalise(crop);
  const uiScale = Math.max(0.78, Math.min(1.16, iconSize / 18));
  if (/corn|maize/.test(name)) return uiScale * 0.9;
  if (/tomato|raspberry|climbing bean|runner bean|pole bean/.test(name)) return uiScale * 0.88;
  if (/pumpkin|squash|zucchini|courgette|melon|cucumber/.test(name)) return uiScale * 1.08;
  return uiScale;
}

function visualCount(options: CropPatchOptions, kind: DenseKind) {
  const planned = Math.max(1, options.count || 1);
  const area = Math.max(0.08, options.widthM * options.depthM);
  const spacing = Math.max(0.08, options.spacingCm / 100);
  const capacity = Math.max(1, Math.round(area / Math.max(0.01, spacing * spacing)));

  if (kind !== "detailed") {
    const cap = options.mobile ? 42 : 110;
    return Math.min(cap, Math.max(4, Math.min(planned, capacity)));
  }

  const name = normalise(options.crop);
  if (isSparseCrop(name)) return Math.min(options.mobile ? 5 : 10, planned);
  if (/tomato/.test(name)) return Math.min(options.mobile ? 8 : 18, planned);
  if (/corn|maize/.test(name)) return Math.min(options.mobile ? 12 : 28, planned);
  if (/broccoli|cauliflower|cabbage|kale/.test(name)) return Math.min(options.mobile ? 12 : 30, planned);
  if (/strawber/.test(name)) return Math.min(options.mobile ? 18 : 46, planned);
  if (/bean|pea/.test(name)) return Math.min(options.mobile ? 14 : 34, planned);
  return Math.min(options.mobile ? 12 : 26, planned);
}

function positionsForPatch(options: CropPatchOptions, count: number, rand: () => number) {
  const aspect = Math.max(0.25, options.widthM / Math.max(0.1, options.depthM));
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cellW = options.widthM / Math.max(1, columns);
  const cellD = options.depthM / Math.max(1, rows);
  const pattern = options.pattern ?? "grid";
  const padding = 0.08;
  const points: Array<{ x: number; z: number; rotation: number; scale: number }> = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    let u = (column + 0.5) / columns;
    let v = (row + 0.5) / rows;

    if (pattern === "staggered" && row % 2 === 1) u += 0.5 / columns;
    if (pattern === "natural") {
      u += (rand() - 0.5) * Math.min(0.55 / columns, 0.12);
      v += (rand() - 0.5) * Math.min(0.55 / rows, 0.12);
    } else if (pattern !== "rows") {
      u += (rand() - 0.5) * Math.min(0.2 / columns, 0.04);
      v += (rand() - 0.5) * Math.min(0.2 / rows, 0.04);
    }

    u = Math.max(padding / Math.max(0.1, options.widthM), Math.min(1 - padding / Math.max(0.1, options.widthM), u));
    v = Math.max(padding / Math.max(0.1, options.depthM), Math.min(1 - padding / Math.max(0.1, options.depthM), v));

    points.push({
      x: options.centerX + (u - 0.5) * options.widthM,
      z: options.centerZ + (v - 0.5) * options.depthM,
      rotation: rand() * Math.PI * 2,
      scale: 0.88 + rand() * 0.22,
    });

    if (points.length >= count) break;
  }

  // If a very narrow patch under-filled the grid, add a few deterministic interior points.
  while (points.length < count) {
    points.push({
      x: options.centerX + (rand() - 0.5) * Math.max(0.02, options.widthM - cellW * 0.3),
      z: options.centerZ + (rand() - 0.5) * Math.max(0.02, options.depthM - cellD * 0.3),
      rotation: rand() * Math.PI * 2,
      scale: 0.88 + rand() * 0.22,
    });
  }

  return points;
}

function leafShape(length = 0.16, width = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.5, length * 0.18, width * 0.55, length * 0.67, 0, length);
  shape.bezierCurveTo(-width * 0.55, length * 0.67, -width * 0.5, length * 0.18, 0, 0);
  return new THREE.ShapeGeometry(shape, 2);
}

function standardMaterial(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, side: THREE.DoubleSide });
}

function setInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  rotation: THREE.Euler,
  color?: THREE.Color,
) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  matrix.compose(position, quaternion, scale);
  mesh.setMatrixAt(index, matrix);
  if (color) mesh.setColorAt(index, color);
}

function finishInstances(mesh: THREE.InstancedMesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
}

function addRosettePatch(root: THREE.Group, options: CropPatchOptions, count: number, rand: () => number) {
  const points = positionsForPatch(options, count, rand);
  const leavesPerPlant = options.mobile ? 5 : 7;
  const geometry = leafShape(0.15, 0.085);
  const leaves = new THREE.InstancedMesh(geometry, standardMaterial(0x4f914d), count * leavesPerPlant);
  const name = normalise(options.crop);
  const blueGreen = /spinach|chard|silverbeet|bok choy|pak choi|tatsoi/.test(name);
  let instance = 0;

  for (const point of points) {
    for (let leafIndex = 0; leafIndex < leavesPerPlant; leafIndex += 1) {
      const yaw = point.rotation + (leafIndex / leavesPerPlant) * Math.PI * 2;
      const size = point.scale * (0.88 + rand() * 0.2);
      const radius = 0.025 + rand() * 0.035;
      const color = blueGreen
        ? (leafIndex % 2 ? COLORS.leafBlue : COLORS.leaf)
        : (leafIndex % 3 === 0 ? COLORS.leafLight : leafIndex % 2 ? COLORS.leaf : COLORS.leafDark);
      setInstance(
        leaves,
        instance++,
        new THREE.Vector3(point.x + Math.cos(yaw) * radius, options.baseY + 0.018 + rand() * 0.018, point.z + Math.sin(yaw) * radius),
        new THREE.Vector3(size, size, size),
        new THREE.Euler(-0.92 - rand() * 0.24, yaw, (rand() - 0.5) * 0.22, "YXZ"),
        color,
      );
    }
  }

  finishInstances(leaves);
  root.add(leaves);
}

function addAlliumPatch(root: THREE.Group, options: CropPatchOptions, count: number, rand: () => number) {
  const points = positionsForPatch(options, count, rand);
  const bladesPerPlant = options.mobile ? 3 : 5;
  const geometry = new THREE.PlaneGeometry(0.018, 0.28, 1, 3);
  const blades = new THREE.InstancedMesh(geometry, standardMaterial(0x4f8b55), count * bladesPerPlant);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.032, 7, 5), standardMaterial(0xd7c9a7), count);
  let bladeIndex = 0;

  points.forEach((point, plantIndex) => {
    const name = normalise(options.crop);
    const bladeHeight = /leek/.test(name) ? 1.45 : /garlic/.test(name) ? 1.12 : 1;
    for (let index = 0; index < bladesPerPlant; index += 1) {
      const yaw = point.rotation + (index / bladesPerPlant) * Math.PI * 2;
      const lean = (rand() - 0.5) * 0.2;
      setInstance(
        blades,
        bladeIndex++,
        new THREE.Vector3(point.x + Math.cos(yaw) * 0.012, options.baseY + 0.14 * bladeHeight, point.z + Math.sin(yaw) * 0.012),
        new THREE.Vector3(point.scale, point.scale * bladeHeight, point.scale),
        new THREE.Euler(lean, yaw, lean * 0.8, "YXZ"),
        index % 2 ? COLORS.leaf : COLORS.leafLight,
      );
    }
    setInstance(
      bulbs,
      plantIndex,
      new THREE.Vector3(point.x, options.baseY + 0.012, point.z),
      new THREE.Vector3(point.scale, 0.58 * point.scale, point.scale),
      new THREE.Euler(0, point.rotation, 0),
      /garlic/.test(name) ? new THREE.Color(0xe7dfc5) : /leek/.test(name) ? new THREE.Color(0xc9d1a4) : COLORS.onion,
    );
  });

  finishInstances(blades);
  finishInstances(bulbs);
  root.add(blades, bulbs);
}

function addRootTopPatch(root: THREE.Group, options: CropPatchOptions, count: number, rand: () => number) {
  const points = positionsForPatch(options, count, rand);
  const leavesPerPlant = options.mobile ? 4 : 6;
  const name = normalise(options.crop);
  const geometry = leafShape(0.18, /carrot|parsnip/.test(name) ? 0.035 : 0.055);
  const leaves = new THREE.InstancedMesh(geometry, standardMaterial(0x4c8b4d), count * leavesPerPlant);
  const shoulders = new THREE.InstancedMesh(new THREE.SphereGeometry(0.036, 7, 5), standardMaterial(0xdd7628), count);
  let leafIndex = 0;

  const rootColor = /beet/.test(name) ? COLORS.beet : /radish|daikon/.test(name) ? COLORS.radish : /turnip/.test(name) ? new THREE.Color(0xb06a93) : COLORS.carrot;

  points.forEach((point, plantIndex) => {
    for (let index = 0; index < leavesPerPlant; index += 1) {
      const yaw = point.rotation + (index / leavesPerPlant) * Math.PI * 2;
      const lean = -0.28 + (rand() - 0.5) * 0.34;
      setInstance(
        leaves,
        leafIndex++,
        new THREE.Vector3(point.x, options.baseY + 0.012, point.z),
        new THREE.Vector3(point.scale * (0.8 + rand() * 0.35), point.scale * (0.8 + rand() * 0.35), point.scale),
        new THREE.Euler(lean, yaw, (rand() - 0.5) * 0.25, "YXZ"),
        index % 3 === 0 ? COLORS.leafLight : index % 2 ? COLORS.leaf : COLORS.leafDark,
      );
    }
    setInstance(
      shoulders,
      plantIndex,
      new THREE.Vector3(point.x, options.baseY + 0.004, point.z),
      new THREE.Vector3(point.scale, 0.55 * point.scale, point.scale),
      new THREE.Euler(0, point.rotation, 0),
      rootColor,
    );
  });

  finishInstances(leaves);
  finishInstances(shoulders);
  root.add(leaves, shoulders);
}

function addHerbPatch(root: THREE.Group, options: CropPatchOptions, count: number, rand: () => number) {
  const points = positionsForPatch(options, count, rand);
  const leavesPerPlant = options.mobile ? 5 : 8;
  const geometry = leafShape(0.11, 0.055);
  const leaves = new THREE.InstancedMesh(geometry, standardMaterial(0x4b8a48), count * leavesPerPlant);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.004, 0.006, 0.18, 5), standardMaterial(0x4f7440), count);
  let leafIndex = 0;

  points.forEach((point, plantIndex) => {
    setInstance(
      stems,
      plantIndex,
      new THREE.Vector3(point.x, options.baseY + 0.09, point.z),
      new THREE.Vector3(point.scale, point.scale, point.scale),
      new THREE.Euler((rand() - 0.5) * 0.08, point.rotation, (rand() - 0.5) * 0.08),
    );
    for (let index = 0; index < leavesPerPlant; index += 1) {
      const yaw = point.rotation + index * 2.399;
      const y = options.baseY + 0.045 + (index % 4) * 0.035;
      setInstance(
        leaves,
        leafIndex++,
        new THREE.Vector3(point.x + Math.cos(yaw) * 0.045, y, point.z + Math.sin(yaw) * 0.045),
        new THREE.Vector3(point.scale * (0.72 + rand() * 0.35), point.scale * (0.72 + rand() * 0.35), point.scale),
        new THREE.Euler(-0.32 + rand() * 0.18, yaw, (rand() - 0.5) * 0.25, "YXZ"),
        index % 3 === 0 ? COLORS.leafLight : index % 2 ? COLORS.leaf : COLORS.leafDark,
      );
    }
  });

  finishInstances(leaves);
  finishInstances(stems);
  root.add(stems, leaves);
}

function addDetailedPatch(root: THREE.Group, options: CropPatchOptions, count: number, rand: () => number) {
  const points = positionsForPatch(options, count, rand);
  const baseScale = cropScale(options.crop, options.iconSize);

  points.forEach((point, index) => {
    const plant = createGardenPlant3D(options.crop, options.variety, options.mobile, (options.seed ?? 1) + index * 19 + options.crop.length * 31);
    const variation = point.scale * (0.94 + rand() * 0.12);
    plant.position.set(point.x, options.baseY, point.z);
    plant.rotation.y += point.rotation;
    plant.scale.setScalar(baseScale * variation);
    root.add(plant);
  });
}

export function addGardenCropPatch3D(root: THREE.Group, options: CropPatchOptions) {
  const kind = cropDenseKind(options.crop);
  const seed = options.seed ?? options.crop.length * 97 + normalise(options.variety).length * 43 + Math.round(options.centerX * 31 + options.centerZ * 47);
  const rand = seeded(seed);
  const count = visualCount(options, kind);

  if (kind === "rosette") addRosettePatch(root, options, count, rand);
  else if (kind === "allium") addAlliumPatch(root, options, count, rand);
  else if (kind === "root-top") addRootTopPatch(root, options, count, rand);
  else if (kind === "herb") addHerbPatch(root, options, count, rand);
  else addDetailedPatch(root, options, count, rand);
}

export function addGardenCropRow3D(root: THREE.Group, options: CropRowOptions) {
  const dx = options.endX - options.startX;
  const dz = options.endZ - options.startZ;
  const length = Math.max(0.01, Math.hypot(dx, dz));
  const name = normalise(options.crop);
  const dense = cropDenseKind(options.crop) !== "detailed";
  const cap = dense ? (options.mobile ? 24 : 54) : isTallCrop(name) ? (options.mobile ? 12 : 24) : (options.mobile ? 16 : 32);
  const count = Math.min(cap, Math.max(1, options.count || 1));
  const rand = seeded(options.seed ?? options.crop.length * 73 + Math.round(length * 100));
  const tangentYaw = Math.atan2(dz, dx);

  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const x = options.startX + dx * t;
    const z = options.startZ + dz * t;
    const plant = createGardenPlant3D(options.crop, options.variety, options.mobile, index * 17 + options.crop.length * 29);
    const scale = (dense ? 0.7 : 0.84) * (0.9 + rand() * 0.18);
    plant.position.set(x, options.baseY, z);
    plant.rotation.y += tangentYaw + (rand() - 0.5) * 0.22;
    plant.scale.setScalar(scale);
    root.add(plant);
  }
}
