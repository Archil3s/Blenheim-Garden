"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GardenPlanApiResponse, PlannerBed, PlannerPlan, PlannerPlantingArea } from "@/lib/garden/planner-plan";
import {
  DEFAULT_GARDEN_ID,
  LIVE_PLAN_EVENT,
  gardenLivePlanKey,
  gardenLocalPlanKey,
  readActiveGardenId,
} from "@/lib/garden/active-garden";
import { addStructure3D } from "@/components/garden-structure-3d";
import { addDemonstrationBed3D } from "@/components/garden-demo-bed-3d";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;
const EMPTY_PLAN: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

const palette = {
  grass: 0x789b62,
  grassDark: 0x668951,
  timber: 0x9a6742,
  timberLight: 0xb18158,
  timberDark: 0x69452f,
  timberCap: 0xc08a5e,
  soil: 0x4b3024,
  mulch: 0xb58a54,
  leaf: 0x3e7d43,
  leafLight: 0x67a653,
  leafDark: 0x2f6638,
  stem: 0x557842,
  metal: 0x6f7976,
  path: 0xb4ad9b,
  pathDark: 0x858075,
};

type InspectItem = {
  title: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
};

type Runtime = {
  scene: THREE.Scene;
  content: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  mobile: boolean;
};

const DEFAULT_INSPECTOR: InspectItem = {
  title: "Explore your garden",
  subtitle: "Tap a bed, crop, path, trellis, structure or tree.",
  lines: [],
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function bedRectCm(bed: PlannerBed) {
  return {
    x: (bed.x / 100) * GARDEN_WIDTH_CM,
    y: (bed.y / 100) * GARDEN_HEIGHT_CM,
    w: (bed.w / 100) * GARDEN_WIDTH_CM,
    h: (bed.h / 100) * GARDEN_HEIGHT_CM,
  };
}

function mat(color: number, roughness = 0.86, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(
  root: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  color: number,
  x: number,
  y: number,
  z: number,
  roughness = 0.86,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.01, width), Math.max(0.01, height), Math.max(0.01, depth)),
    mat(color, roughness),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function inspectable(root: THREE.Object3D, item: InspectItem) {
  root.traverse((object) => {
    object.userData.inspect = item;
    object.userData.selectionRoot = root;
  });
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      const standard = material as THREE.MeshStandardMaterial;
      standard.map?.dispose();
      standard.bumpMap?.dispose();
      material.dispose();
    }
  });
}

function readPlanFromStorage(key: string): PlannerPlan | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<PlannerPlan> | null;
    if (!parsed || !Array.isArray(parsed.beds) || !Array.isArray(parsed.rows)) return null;
    return {
      beds: parsed.beds,
      plantingAreas: Array.isArray(parsed.plantingAreas) ? parsed.plantingAreas : [],
      rows: parsed.rows,
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    };
  } catch {
    return null;
  }
}

function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#72a8bf");
  gradient.addColorStop(0.52, "#c8dcda");
  gradient.addColorStop(1, "#efe3cb");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addRaisedBed(root: THREE.Group, bed: PlannerBed, active?: PlannerPlantingArea, mobile = false) {
  const rect = bedRectCm(bed);
  const width = Math.max(0.3, rect.w / 100);
  const depth = Math.max(0.3, rect.h / 100);
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);
  const group = new THREE.Group();
  const wallHeight = 0.3;
  const rail = 0.1;
  const post = 0.115;

  box(group, Math.max(0.08, width - 0.18), 0.17, Math.max(0.08, depth - 0.18), palette.soil, x, 0.18, z, 1);

  box(group, width + rail, wallHeight, rail, palette.timber, x, wallHeight / 2, z - depth / 2, 0.86);
  box(group, width + rail, wallHeight, rail, palette.timberDark, x, wallHeight / 2, z + depth / 2, 0.92);
  box(group, rail, wallHeight, depth, palette.timber, x - width / 2, wallHeight / 2, z, 0.86);
  box(group, rail, wallHeight, depth, palette.timberDark, x + width / 2, wallHeight / 2, z, 0.92);

  for (const px of [x - width / 2, x + width / 2]) {
    for (const pz of [z - depth / 2, z + depth / 2]) {
      box(group, post, wallHeight + 0.055, post, palette.timberDark, px, (wallHeight + 0.055) / 2, pz, 0.94);
      box(group, post + 0.025, 0.028, post + 0.025, palette.timberCap, px, wallHeight + 0.067, pz, 0.82);
    }
  }

  box(group, width + 0.15, 0.035, 0.055, palette.timberCap, x, wallHeight + 0.018, z - depth / 2, 0.82);
  box(group, width + 0.15, 0.035, 0.055, palette.timberCap, x, wallHeight + 0.018, z + depth / 2, 0.82);
  box(group, 0.055, 0.035, depth, palette.timberCap, x - width / 2, wallHeight + 0.018, z, 0.82);
  box(group, 0.055, 0.035, depth, palette.timberCap, x + width / 2, wallHeight + 0.018, z, 0.82);

  if (!mobile && depth > 1.2) {
    const furrows = Math.min(6, Math.max(2, Math.floor(width / 0.38)));
    for (let index = 1; index < furrows; index += 1) {
      const fx = x - width / 2 + (width * index) / furrows;
      box(group, 0.025, 0.018, Math.max(0.1, depth - 0.28), 0x3a241c, fx, 0.276, z, 1);
    }
  }

  inspectable(group, {
    title: bed.name,
    subtitle: active ? `${active.crop}${active.variety ? ` · ${active.variety}` : ""}` : "Demo-style raised garden bed",
    lines: [
      { label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` },
      ...(active ? [{ label: "Crop", value: active.crop }, { label: "Spacing", value: `${active.spacingCm} cm` }] : []),
    ],
  });
  root.add(group);
}

function leaf(root: THREE.Group, x: number, y: number, z: number, scale: number, angle: number, color = palette.leaf) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11 * scale, 8, 6), mat(color, 0.86));
  mesh.scale.set(1.55, 0.26, 0.8);
  mesh.position.set(x, y, z);
  mesh.rotation.y = angle;
  mesh.rotation.z = Math.sin(angle) * 0.16;
  mesh.castShadow = true;
  root.add(mesh);
}

function leafRing(root: THREE.Group, count: number, radius: number, y: number, scale: number, color = palette.leaf) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    leaf(root, Math.cos(angle) * radius, y, Math.sin(angle) * radius, scale, -angle, index % 2 ? color : palette.leafLight);
  }
}

function stem(root: THREE.Group, height: number, radius = 0.02) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, height, 8), mat(palette.stem, 0.9));
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  root.add(mesh);
}

function fruit(root: THREE.Group, color: number, radius: number, x: number, y: number, z: number, scale?: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 7), mat(color, 0.65));
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  root.add(mesh);
}

function cropKind(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("strawber")) return "strawberry";
  if (name.includes("blueber")) return "blueberry";
  if (name.includes("raspber")) return "raspberry";
  if (name.includes("pumpkin") || name.includes("squash") || name.includes("zucchini") || name.includes("courgette")) return "squash";
  if (name.includes("lettuce")) return "lettuce";
  if (name.includes("broccoli") || name.includes("cauliflower") || name.includes("cabbage") || name.includes("kale")) return "brassica";
  if (name.includes("bean") || name.includes("pea")) return "bean";
  if (name.includes("carrot")) return "carrot";
  if (name.includes("onion") || name.includes("leek") || name.includes("garlic")) return "onion";
  if (name.includes("corn") || name.includes("maize")) return "corn";
  if (name.includes("chilli") || name.includes("pepper")) return "pepper";
  return "leafy";
}

function createPlant(crop: string, mobile: boolean, seedValue: number) {
  const root = new THREE.Group();
  const kind = cropKind(crop);
  const offset = ((seedValue * 37) % 17) / 100;

  if (kind === "tomato") {
    stem(root, 1.0 + offset, 0.026);
    leafRing(root, mobile ? 5 : 7, 0.18, 0.38, 0.9);
    leafRing(root, mobile ? 4 : 6, 0.15, 0.68, 0.78, palette.leafDark);
    for (let index = 0; index < (mobile ? 3 : 5); index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      fruit(root, 0xc83f35, 0.055, Math.cos(angle) * 0.12, 0.46 + (index % 2) * 0.13, Math.sin(angle) * 0.12);
    }
  } else if (kind === "strawberry") {
    leafRing(root, mobile ? 6 : 9, 0.1, 0.08, 0.85);
    fruit(root, 0xd8444b, 0.045, 0.08, 0.07, 0.04, [0.86, 1.18, 0.86]);
    if (!mobile) fruit(root, 0xd8444b, 0.038, -0.07, 0.065, 0.05, [0.86, 1.18, 0.86]);
  } else if (kind === "blueberry" || kind === "raspberry") {
    stem(root, 0.55, 0.018);
    leafRing(root, mobile ? 5 : 7, 0.11, 0.31, 0.7);
    const berry = kind === "blueberry" ? 0x5268a9 : 0xc83e5c;
    for (const [x, y, z] of [[-0.05, 0.25, 0.04], [0.055, 0.29, 0.04], [0, 0.21, -0.05]] as const) fruit(root, berry, 0.035, x, y, z);
  } else if (kind === "squash") {
    leafRing(root, mobile ? 6 : 9, 0.17, 0.09, 1.06, palette.leafDark);
    fruit(root, 0xe58a2d, 0.12, 0.13, 0.1, 0.04, [1.2, 0.78, 1.08]);
  } else if (kind === "lettuce") {
    leafRing(root, mobile ? 8 : 12, 0.105, 0.065, 1.1, palette.leafLight);
    leafRing(root, mobile ? 5 : 8, 0.052, 0.11, 0.82);
  } else if (kind === "brassica") {
    stem(root, 0.22, 0.03);
    leafRing(root, mobile ? 5 : 8, 0.12, 0.11, 0.82, palette.leafDark);
    fruit(root, 0x477f49, 0.09, 0, 0.26, 0, [1.02, 0.82, 1.02]);
  } else if (kind === "bean") {
    stem(root, 1.12, 0.014);
    leafRing(root, mobile ? 5 : 7, 0.1, 0.42, 0.7, palette.leafLight);
    leafRing(root, mobile ? 4 : 6, 0.085, 0.78, 0.62);
  } else if (kind === "carrot") {
    for (let index = 0; index < (mobile ? 5 : 8); index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.28 + (index % 3) * 0.03, 5), mat(index % 2 ? palette.leaf : palette.leafLight, 0.9));
      blade.position.set(Math.cos(angle) * 0.04, 0.15, Math.sin(angle) * 0.04);
      blade.rotation.z = Math.sin(angle) * 0.18;
      blade.castShadow = true;
      root.add(blade);
    }
  } else if (kind === "onion") {
    for (let index = 0; index < (mobile ? 4 : 7); index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.34, 5), mat(0x4d8d4f, 0.9));
      blade.position.set(Math.cos(angle) * 0.027, 0.17, Math.sin(angle) * 0.027);
      blade.rotation.z = Math.sin(angle) * 0.12;
      blade.castShadow = true;
      root.add(blade);
    }
  } else if (kind === "corn") {
    stem(root, 1.15, 0.025);
    for (const y of [0.34, 0.54, 0.74, 0.94]) {
      leaf(root, 0.08, y, 0, 0.95, y * 2.1, palette.leafDark);
      leaf(root, -0.08, y + 0.04, 0, 0.9, -y * 2.2, palette.leafLight);
    }
  } else if (kind === "pepper") {
    stem(root, 0.62, 0.022);
    leafRing(root, mobile ? 5 : 7, 0.11, 0.34, 0.72);
    fruit(root, 0xc94c38, 0.05, 0.07, 0.25, 0.04, [0.78, 1.35, 0.78]);
  } else {
    leafRing(root, mobile ? 7 : 10, 0.1, 0.08, 1, palette.leafLight);
    leafRing(root, mobile ? 4 : 6, 0.05, 0.14, 0.75);
  }

  root.rotation.y = ((seedValue * 29) % 360) * Math.PI / 180;
  return root;
}

function representativePositions(widthCm: number, heightCm: number, desired: number, maxCount: number) {
  const count = Math.min(maxCount, Math.max(1, desired || 1));
  const aspect = Math.max(0.25, widthCm / Math.max(1, heightCm));
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / columns));
  return Array.from({ length: count }, (_, index) => ({
    x: ((index % columns) + 1) / (columns + 1),
    y: (Math.floor(index / columns) + 1) / (rows + 1),
  }));
}

function addPlantingArea(root: THREE.Group, plan: PlannerPlan, area: PlannerPlantingArea, mobile: boolean) {
  const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
  if (!bed) return;
  const rect = bedRectCm(bed);
  const ax = rect.x + (area.x / 100) * rect.w;
  const ay = rect.y + (area.y / 100) * rect.h;
  const aw = (area.w / 100) * rect.w;
  const ah = (area.h / 100) * rect.h;
  const group = new THREE.Group();
  const positions = representativePositions(aw, ah, area.count, mobile ? 7 : 14);
  positions.forEach((position, index) => {
    const plant = createPlant(area.crop, mobile, index + area.crop.length * 11);
    plant.position.set(worldX(ax + aw * position.x), 0.31, worldZ(ay + ah * position.y));
    const iconScale = Math.max(0.72, Math.min(1.18, (area.iconSize || 18) / 18));
    plant.scale.setScalar(iconScale);
    group.add(plant);
  });
  inspectable(group, {
    title: area.crop,
    subtitle: area.variety || "3D planting area",
    lines: [
      { label: "Bed", value: bed.name },
      { label: "Spacing", value: `${area.spacingCm} cm` },
      { label: "Planned count", value: String(area.count) },
    ],
  });
  root.add(group);
}

function addRow(root: THREE.Group, row: PlannerPlan["rows"][number], mobile: boolean) {
  const group = new THREE.Group();
  const count = Math.min(mobile ? 8 : 15, Math.max(1, row.count || 1));
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const plant = createPlant(row.crop, mobile, index + row.crop.length * 7);
    plant.scale.setScalar(0.84);
    plant.position.set(worldX(row.x1 + (row.x2 - row.x1) * t), 0.03, worldZ(row.y1 + (row.y2 - row.y1) * t));
    group.add(plant);
  }
  inspectable(group, {
    title: row.crop,
    subtitle: row.variety || "Planting row",
    lines: [
      { label: "Spacing", value: `${row.spacingCm} cm` },
      { label: "Planned count", value: String(row.count) },
    ],
  });
  root.add(group);
}

function addPath(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "path" }>, mobile: boolean) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const width = Math.max(0.16, object.widthCm / 100);
  const group = new THREE.Group();
  const path = new THREE.Mesh(new THREE.BoxGeometry(length, 0.045, width), mat(palette.path, 1));
  path.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
  path.rotation.y = -Math.atan2(dz, dx);
  path.receiveShadow = true;
  group.add(path);
  const stones = mobile ? 6 : Math.min(22, Math.max(8, Math.floor(length * 2.8)));
  for (let index = 0; index < stones; index += 1) {
    const t = (index + 0.5) / stones;
    const side = (((index * 37) % 100) / 100 - 0.5) * width * 0.65;
    const angle = Math.atan2(dz, dx);
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035 + (index % 3) * 0.006, 0), mat(palette.pathDark, 1));
    pebble.scale.y = 0.35;
    pebble.position.set(x1 + dx * t - Math.sin(angle) * side, 0.055, z1 + dz * t + Math.cos(angle) * side);
    pebble.castShadow = true;
    group.add(pebble);
  }
  inspectable(group, { title: object.label || "Garden path", lines: [{ label: "Length", value: `${length.toFixed(1)} m` }, { label: "Width", value: `${object.widthCm} cm` }] });
  root.add(group);
}

function addTrellis(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>, mobile: boolean) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const height = Math.max(0.45, object.heightCm / 100);
  const group = new THREE.Group();
  const posts = Math.max(2, Math.ceil((length * 100) / Math.max(50, object.postSpacingCm)) + 1);
  for (let index = 0; index < posts; index += 1) {
    const t = index / Math.max(1, posts - 1);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, 0.055), mat(palette.timberDark, 0.92));
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    post.castShadow = true;
    group.add(post);
  }
  const angle = -Math.atan2(dz, dx);
  const rails = mobile ? [height * 0.45, height * 0.8] : [height * 0.22, height * 0.42, height * 0.62, height * 0.82, height];
  for (const y of rails) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.018, 0.018), mat(palette.metal, 0.48, 0.25));
    rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    rail.rotation.y = angle;
    group.add(rail);
  }
  inspectable(group, { title: object.label || "Trellis", lines: [{ label: "Height", value: `${height.toFixed(1)} m` }, { label: "Length", value: `${length.toFixed(1)} m` }] });
  root.add(group);
}

function addTree(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>, mobile: boolean) {
  const group = new THREE.Group();
  const x = worldX(object.x);
  const z = worldZ(object.y);
  const radius = Math.min(0.95, Math.max(0.3, object.diameterCm / 200));
  const trunkHeight = 0.78 + radius * 0.25;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, trunkHeight, 8), mat(0x755137, 1));
  trunk.position.set(x, trunkHeight / 2, z);
  trunk.castShadow = true;
  group.add(trunk);
  const lobes = mobile ? 3 : 6;
  for (let index = 0; index < lobes; index += 1) {
    const angle = (index / lobes) * Math.PI * 2;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(radius * (index === 0 ? 0.82 : 0.62), 9, 7), mat(index % 2 ? 0x477a48 : 0x568c4f, 0.96));
    crown.scale.y = 0.76;
    crown.position.set(x + Math.cos(angle) * radius * 0.3, trunkHeight + radius * (0.44 + (index % 2) * 0.08), z + Math.sin(angle) * radius * 0.3);
    crown.castShadow = true;
    group.add(crown);
  }
  inspectable(group, { title: object.label || "Garden tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  root.add(group);
}

function addBoundary(root: THREE.Group, mobile: boolean) {
  const width = GARDEN_WIDTH_CM / 100;
  const depth = GARDEN_HEIGHT_CM / 100;
  const posts = mobile ? 12 : 20;
  for (let index = 0; index < posts; index += 1) {
    const t = index / Math.max(1, posts - 1);
    for (const [x, z] of [[-width / 2, -depth / 2 + depth * t], [width / 2, -depth / 2 + depth * t]] as const) {
      box(root, 0.055, 0.5, 0.055, 0x8d7458, x, 0.25, z, 0.95);
    }
  }
  for (const z of [-depth / 2, depth / 2]) {
    box(root, width + 0.05, 0.045, 0.045, 0x9a8062, 0, 0.34, z, 0.92);
  }
}

function buildGarden(root: THREE.Group, plan: PlannerPlan, mobile: boolean) {
  addBoundary(root, mobile);
  for (const bed of plan.beds) addRaisedBed(root, bed, plan.plantingAreas.find((area) => area.bedId === bed.id), mobile);
  for (const area of plan.plantingAreas) addPlantingArea(root, plan, area, mobile);
  for (const row of plan.rows) addRow(root, row, mobile);
  for (const object of plan.objects) {
    if (object.type === "path") addPath(root, object, mobile);
    if (object.type === "trellis") addTrellis(root, object, mobile);
    if (object.type === "structure") addStructure3D(root, object, !mobile);
    if (object.type === "tree") addTree(root, object, mobile);
  }
}

function clearSelection(ref: React.MutableRefObject<THREE.BoxHelper | null>) {
  const helper = ref.current;
  if (!helper) return;
  helper.removeFromParent();
  helper.geometry.dispose();
  helper.material.dispose();
  ref.current = null;
}

export function Garden3DUnified({ plan: suppliedPlan }: { plan?: PlannerPlan }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const selectionRef = useRef<THREE.BoxHelper | null>(null);
  const [loadedPlan, setLoadedPlan] = useState<PlannerPlan | null>(suppliedPlan ?? null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [showDemo, setShowDemo] = useState(false);
  const [cameraView, setCameraView] = useState<"perspective" | "top">("perspective");
  const [quality, setQuality] = useState("HIGH");
  const [inspector, setInspector] = useState<InspectItem>(DEFAULT_INSPECTOR);
  const [renderError, setRenderError] = useState<string | null>(null);
  const effectivePlan = suppliedPlan ?? loadedPlan ?? EMPTY_PLAN;
  const planRef = useRef<PlannerPlan>(effectivePlan);
  const demoRef = useRef(showDemo);
  const structureCount = useMemo(() => effectivePlan.objects.filter((object) => object.type === "structure").length, [effectivePlan]);

  useEffect(() => {
    if (suppliedPlan) setLoadedPlan(suppliedPlan);
  }, [suppliedPlan]);

  const rebuild = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection(selectionRef);
    disposeObject(runtime.content);
    runtime.content.clear();
    if (demoRef.current) addDemonstrationBed3D(runtime.content, runtime.mobile);
    else buildGarden(runtime.content, planRef.current, runtime.mobile);
    runtime.renderer.render(runtime.scene, runtime.camera);
  }, []);

  useEffect(() => {
    planRef.current = effectivePlan;
    rebuild();
  }, [effectivePlan, rebuild]);

  useEffect(() => {
    demoRef.current = showDemo;
    rebuild();
    setInspector(showDemo ? {
      title: "2 × 4 m demonstration bed",
      subtitle: "Benchmark style now used by the live raised beds",
      lines: [{ label: "Mode", value: "Demo bed" }],
    } : DEFAULT_INSPECTOR);
  }, [showDemo, rebuild]);

  useEffect(() => {
    if (suppliedPlan) return;
    let cancelled = false;
    const selected = new URL(window.location.href).searchParams.get("gardenId")?.trim() || readActiveGardenId();
    setGardenId(selected);
    const live = readPlanFromStorage(gardenLivePlanKey(selected));
    if (live) setLoadedPlan(live);
    else void (async () => {
      try {
        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selected)}`, { cache: "no-store" });
        const data = (await response.json()) as GardenPlanApiResponse;
        if (response.ok && data.ok && data.plan && !cancelled) {
          setLoadedPlan(data.plan);
          return;
        }
      } catch {
        // Local fallback below.
      }
      if (cancelled) return;
      setLoadedPlan(readPlanFromStorage(gardenLocalPlanKey(selected)) ?? EMPTY_PLAN);
    })();
    return () => { cancelled = true; };
  }, [suppliedPlan]);

  useEffect(() => {
    if (suppliedPlan) return;
    const onLivePlan = (event: Event) => {
      const detail = (event as CustomEvent<{ gardenId?: string; plan?: PlannerPlan }>).detail;
      if (!detail?.plan || detail.gardenId !== gardenId) return;
      setLoadedPlan(detail.plan);
    };
    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
    return () => window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
  }, [gardenId, suppliedPlan]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mobile = !window.matchMedia("(min-width: 841px)").matches;
    setQuality(mobile ? "MOBILE" : "HIGH");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: mobile ? "low-power" : "high-performance" });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = mobile ? 1.02 : 1.08;
      renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = !mobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch {
      setRenderError("WebGL could not start on this device.");
      return;
    }

    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const sky = skyTexture();
    scene.background = sky ?? new THREE.Color(0xcbded7);
    scene.fog = new THREE.Fog(0xb9cecc, 18, 32);
    scene.add(new THREE.HemisphereLight(0xf8fff8, 0x6e5b47, 1.55));

    const sun = new THREE.DirectionalLight(0xffefd2, mobile ? 1.6 : 2.3);
    sun.position.set(-6, 10, 7);
    if (!mobile) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1536, 1536);
      sun.shadow.camera.left = -8;
      sun.shadow.camera.right = 8;
      sun.shadow.camera.top = 9;
      sun.shadow.camera.bottom = -9;
      sun.shadow.bias = -0.0008;
    }
    scene.add(sun);

    const outer = new THREE.Mesh(new THREE.PlaneGeometry(17, 19), mat(palette.grassDark, 1));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.04;
    outer.receiveShadow = true;
    scene.add(outer);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9.35, 11.15), mat(palette.grass, 1));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    ground.receiveShadow = true;
    scene.add(ground);

    if (!mobile) {
      for (let index = 0; index < 90; index += 1) {
        const gx = ((index * 67) % 900) / 100 - 4.5;
        const gz = ((index * 113) % 1080) / 100 - 5.4;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09 + (index % 4) * 0.012, 4), mat(index % 2 ? 0x638d52 : 0x719b5d, 1));
        blade.position.set(gx, 0.03, gz);
        scene.add(blade);
      }
    }

    const camera = new THREE.PerspectiveCamera(mobile ? 44 : 38, 1, 0.1, 60);
    camera.position.set(mobile ? 7.7 : 8.7, mobile ? 8.2 : 8.6, mobile ? 11.4 : 12.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.3, 0);
    controls.minDistance = 3.4;
    controls.maxDistance = 27;
    controls.maxPolarAngle = Math.PI * 0.49;

    const content = new THREE.Group();
    scene.add(content);
    const runtime: Runtime = { scene, content, camera, controls, renderer, mobile };
    runtimeRef.current = runtime;

    if (demoRef.current) addDemonstrationBed3D(content, mobile);
    else buildGarden(content, planRef.current, mobile);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { id: number; x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary) pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = pointerStart;
      pointerStart = null;
      if (!start || start.id !== event.pointerId || !event.isPrimary || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObjects(content.children, true)) {
        let current: THREE.Object3D | null = hit.object;
        while (current) {
          const item = current.userData.inspect as InspectItem | undefined;
          const selectionRoot = current.userData.selectionRoot as THREE.Object3D | undefined;
          if (item && selectionRoot) {
            clearSelection(selectionRef);
            const helper = new THREE.BoxHelper(selectionRoot, 0xffc44d);
            helper.material.depthTest = false;
            helper.renderOrder = 50;
            scene.add(helper);
            selectionRef.current = helper;
            setInspector(item);
            return;
          }
          current = current.parent;
        }
      }
      clearSelection(selectionRef);
      setInspector(DEFAULT_INSPECTOR);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      clearSelection(selectionRef);
      disposeObject(content);
      content.clear();
      sky?.dispose();
      outer.geometry.dispose();
      (outer.material as THREE.Material).dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      runtimeRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  const setPerspective = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setCameraView("perspective");
    runtime.camera.position.set(runtime.mobile ? 7.7 : 8.7, runtime.mobile ? 8.2 : 8.6, runtime.mobile ? 11.4 : 12.2);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(0, 0.3, 0);
    runtime.controls.update();
  };

  const setTop = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setCameraView("top");
    runtime.camera.position.set(0.01, 16.2, 0.01);
    runtime.camera.up.set(0, 0, -1);
    runtime.controls.target.set(0, 0, 0);
    runtime.controls.update();
  };

  return (
    <div className="gv-3d-workspace gv-3d-realistic" data-testid="inline-3d-workspace" style={{ position: "relative", width: "100%", height: "100%", minHeight: 520, overflow: "hidden" }}>
      <div className="gv-3d-workspace-canvas" ref={mountRef} aria-label="Interactive 3D garden workspace" style={{ position: "absolute", inset: 0 }} />
      {renderError && <div className="gv-3d-workspace-error">{renderError}</div>}
      <div className="gv-3d-hud gv-3d-hud-left">
        <span className="gv-3d-live-dot" />
        <strong>GARDEN SIM</strong>
        <small>{showDemo ? "2 × 4 m benchmark" : `${effectivePlan.beds.length} beds · ${structureCount} structures`}</small>
      </div>
      <div className="gv-3d-hud gv-3d-camera-controls" aria-label="3D camera controls">
        <button type="button" className={cameraView === "perspective" ? "active" : ""} aria-pressed={cameraView === "perspective"} onClick={setPerspective}>Perspective</button>
        <button type="button" className={cameraView === "top" ? "active" : ""} aria-pressed={cameraView === "top"} onClick={setTop}>Top</button>
        <button type="button" onClick={setPerspective}>Fit</button>
        <button type="button" className={showDemo ? "active" : ""} aria-pressed={showDemo} onClick={() => setShowDemo((value) => !value)}>Demo bed</button>
        <span>{quality}</span>
      </div>
      <div className="gv-3d-selection-card" aria-live="polite">
        <span>{inspector === DEFAULT_INSPECTOR ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspector.title}</strong>
        {inspector.subtitle && <small>{inspector.subtitle}</small>}
        {inspector.lines.slice(0, 3).map((line) => <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>)}
      </div>
      <div className="gv-3d-help">Drag to orbit · wheel/pinch to zoom · tap to inspect</div>
    </div>
  );
}
