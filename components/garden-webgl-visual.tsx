"use client";

import { useEffect, useRef, useState } from "react";
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
import styles from "./garden-webgl.module.css";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;
const EMPTY_PLAN: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

type InspectorItem = {
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
  render: () => void;
  detailed: boolean;
};

const DEFAULT_INSPECTOR: InspectorItem = {
  title: "Explore your garden",
  subtitle: "Tap a bed, crop, path, trellis or tree.",
  lines: [],
};

const colours = {
  soilTop: 0x684632,
  timber: 0xa87950,
  timberDark: 0x765136,
  grass: 0x789b62,
  grassDark: 0x668951,
  leaf: 0x4d8b4d,
  leafLight: 0x6eaa55,
  leafDark: 0x356d3d,
  stem: 0x5f8f4e,
  tomato: 0xd84d3f,
  strawberry: 0xd9414f,
  pumpkin: 0xe58a2d,
  carrot: 0xe78029,
  blueberry: 0x5268a9,
  raspberry: 0xc83e5c,
  broccoli: 0x3e7841,
  onion: 0xe9e0c6,
};

function worldX(cm: number) { return cm / 100 - GARDEN_WIDTH_CM / 200; }
function worldZ(cm: number) { return cm / 100 - GARDEN_HEIGHT_CM / 200; }

function bedRectCm(bed: PlannerBed) {
  return {
    x: (bed.x / 100) * GARDEN_WIDTH_CM,
    y: (bed.y / 100) * GARDEN_HEIGHT_CM,
    w: (bed.w / 100) * GARDEN_WIDTH_CM,
    h: (bed.h / 100) * GARDEN_HEIGHT_CM,
  };
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

function inspectable(root: THREE.Object3D, item: InspectorItem) {
  root.traverse((object) => {
    object.userData.inspect = item;
    object.userData.selectionRoot = root;
  });
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const item of materials) item.dispose();
    }
    if (object instanceof THREE.Sprite) {
      const item = object.material as THREE.SpriteMaterial;
      item.map?.dispose();
      item.dispose();
    }
  });
}

function clearGroup(group: THREE.Group) {
  disposeObject(group);
  group.clear();
}

function clearSelectionHelper(ref: React.MutableRefObject<THREE.BoxHelper | null>) {
  const helper = ref.current;
  if (!helper) return;
  helper.removeFromParent();
  helper.geometry.dispose();
  helper.material.dispose();
  ref.current = null;
}

function material(color: number, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function applyShadow(root: THREE.Object3D, enabled: boolean) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = enabled;
    object.receiveShadow = enabled;
  });
}

function leafMesh(color: number, scale = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11 * scale, 7, 5), material(color));
  mesh.scale.set(1.55, 0.28, 0.82);
  return mesh;
}

function radialLeaves(group: THREE.Group, count: number, radius: number, y: number, scale = 1, color = colours.leaf) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const leaf = leafMesh(color, scale);
    leaf.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    leaf.rotation.y = -angle;
    leaf.rotation.z = 0.16;
    group.add(leaf);
  }
}

function stem(height: number, radius = 0.018, color = colours.stem) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, height, 7), material(color));
  mesh.position.y = height / 2;
  return mesh;
}

function fruitSphere(color: number, radius: number, x: number, y: number, z: number, scale?: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), material(color, 0.72));
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  return mesh;
}

function cropKind(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("strawber")) return "strawberry";
  if (name.includes("blueber")) return "blueberry";
  if (name.includes("raspber")) return "raspberry";
  if (name.includes("pumpkin") || name.includes("squash")) return "pumpkin";
  if (name.includes("zucchini") || name.includes("courgette")) return "zucchini";
  if (name.includes("lettuce")) return "lettuce";
  if (name.includes("broccoli") || name.includes("cauliflower")) return "broccoli";
  if (name.includes("cabbage") || name.includes("kale") || name.includes("brassica")) return "brassica";
  if (name.includes("bean") || name.includes("pea")) return "bean";
  if (name.includes("carrot")) return "carrot";
  if (name.includes("onion") || name.includes("leek") || name.includes("garlic")) return "onion";
  if (name.includes("potato")) return "potato";
  if (name.includes("basil") || name.includes("herb") || name.includes("thyme") || name.includes("parsley")) return "herb";
  if (name.includes("corn") || name.includes("maize")) return "corn";
  if (name.includes("chilli") || name.includes("pepper")) return "pepper";
  return "leafy";
}

function createPlant(crop: string, detailed: boolean) {
  const root = new THREE.Group();
  const kind = cropKind(crop);

  if (kind === "tomato") {
    root.add(stem(0.58, 0.022));
    radialLeaves(root, detailed ? 7 : 5, 0.12, 0.28, 0.8);
    radialLeaves(root, detailed ? 5 : 3, 0.09, 0.44, 0.68, colours.leafDark);
    root.add(fruitSphere(colours.tomato, 0.05, -0.07, 0.28, 0.06));
    root.add(fruitSphere(colours.tomato, 0.045, 0.07, 0.33, 0.05));
    root.add(fruitSphere(colours.tomato, 0.043, 0.02, 0.22, -0.06));
  } else if (kind === "strawberry") {
    radialLeaves(root, detailed ? 8 : 6, 0.08, 0.08, 0.68);
    root.add(fruitSphere(colours.strawberry, 0.055, 0.08, 0.065, 0.04, [0.82, 1.2, 0.82]));
    if (detailed) root.add(fruitSphere(colours.strawberry, 0.04, -0.06, 0.055, 0.055, [0.82, 1.2, 0.82]));
  } else if (kind === "blueberry" || kind === "raspberry") {
    root.add(stem(0.44, 0.018));
    radialLeaves(root, detailed ? 7 : 5, 0.11, 0.28, 0.7);
    const berry = kind === "blueberry" ? colours.blueberry : colours.raspberry;
    for (const [x, y, z] of [[-0.055, 0.22, 0.04], [0.055, 0.25, 0.04], [0, 0.19, -0.05]] as const) root.add(fruitSphere(berry, 0.038, x, y, z));
  } else if (kind === "pumpkin" || kind === "zucchini") {
    radialLeaves(root, detailed ? 8 : 6, 0.16, 0.08, 1.05, colours.leafDark);
    if (kind === "pumpkin") root.add(fruitSphere(colours.pumpkin, 0.12, 0.13, 0.1, 0.04, [1.2, 0.78, 1.08]));
    else {
      const fruit = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.28, 8), material(0x3f7d42));
      fruit.rotation.z = Math.PI / 2;
      fruit.rotation.y = 0.28;
      fruit.position.set(0.12, 0.08, 0.04);
      root.add(fruit);
    }
  } else if (kind === "lettuce") {
    radialLeaves(root, detailed ? 11 : 8, 0.095, 0.06, 1.05, colours.leafLight);
    radialLeaves(root, detailed ? 7 : 5, 0.045, 0.095, 0.75);
  } else if (kind === "broccoli") {
    root.add(stem(0.24, 0.035));
    radialLeaves(root, detailed ? 6 : 4, 0.1, 0.12, 0.78, colours.leafDark);
    for (const [x, y, z] of [[0, 0.27, 0], [-0.055, 0.245, 0.02], [0.055, 0.245, 0.02], [0.01, 0.245, -0.055]] as const) root.add(fruitSphere(colours.broccoli, 0.075, x, y, z));
  } else if (kind === "brassica") {
    radialLeaves(root, detailed ? 10 : 7, 0.1, 0.07, 1, colours.leafDark);
    root.add(fruitSphere(0x6e9a63, 0.09, 0, 0.13, 0, [1.05, 0.8, 1.05]));
  } else if (kind === "bean") {
    root.add(stem(0.62, 0.016));
    radialLeaves(root, detailed ? 7 : 5, 0.1, 0.32, 0.74, colours.leafLight);
    radialLeaves(root, detailed ? 5 : 3, 0.07, 0.5, 0.62);
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.13, 4, 6), material(0x68a54f));
    pod.rotation.z = 0.32;
    pod.position.set(0.09, 0.32, 0.03);
    root.add(pod);
  } else if (kind === "carrot") {
    for (let i = 0; i < (detailed ? 7 : 5); i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.24, 5), material(colours.leafDark));
      const angle = (i / 7) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.035, 0.13, Math.sin(angle) * 0.035);
      blade.rotation.z = Math.sin(angle) * 0.15;
      root.add(blade);
    }
    const shoulder = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 7), material(colours.carrot));
    shoulder.position.y = 0.02;
    shoulder.rotation.z = Math.PI;
    root.add(shoulder);
  } else if (kind === "onion") {
    root.add(fruitSphere(colours.onion, 0.065, 0, 0.055, 0, [1, 0.8, 1]));
    for (let i = 0; i < (detailed ? 6 : 4); i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.32, 5), material(0x5c984f));
      const angle = (i / 6) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.025, 0.2, Math.sin(angle) * 0.025);
      blade.rotation.z = Math.cos(angle) * 0.12;
      root.add(blade);
    }
  } else if (kind === "potato") {
    root.add(stem(0.34, 0.018));
    radialLeaves(root, detailed ? 9 : 6, 0.12, 0.22, 0.78, colours.leafDark);
    if (detailed) root.add(fruitSphere(0xf0e9d8, 0.025, 0.04, 0.34, 0.02));
  } else if (kind === "corn") {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.78, 6), material(0x719b42));
    stalk.position.y = 0.39;
    root.add(stalk);
    for (let i = 0; i < 5; i += 1) {
      const leaf = leafMesh(0x6f9d43, 1.2);
      leaf.position.set(0, 0.18 + i * 0.11, 0);
      leaf.rotation.y = (i % 2) * Math.PI;
      leaf.rotation.z = i % 2 ? -0.48 : 0.48;
      root.add(leaf);
    }
  } else if (kind === "pepper") {
    root.add(stem(0.42, 0.02));
    radialLeaves(root, detailed ? 7 : 5, 0.1, 0.26, 0.75, colours.leafDark);
    const pepper = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 7), material(0xc94134));
    pepper.position.set(0.08, 0.22, 0.04);
    pepper.rotation.z = 0.18;
    root.add(pepper);
  } else if (kind === "herb") {
    for (let i = 0; i < (detailed ? 5 : 3); i += 1) {
      const sprig = stem(0.26 + i * 0.02, 0.011, 0x5a8d45);
      sprig.position.x = (i - 2) * 0.03;
      root.add(sprig);
      radialLeaves(root, 4, 0.055, 0.14 + i * 0.012, 0.45, colours.leafLight);
    }
  } else radialLeaves(root, detailed ? 9 : 6, 0.09, 0.08, 0.92, colours.leafLight);

  return root;
}

function makeLabel(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "rgba(28,48,38,0.84)";
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(6, 8, 372, 80, 18);
    context.fill();
  } else context.fillRect(6, 8, 372, 80);
  context.fillStyle = "#f7fff9";
  context.font = "700 34px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text.slice(0, 22), 192, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(1.45, 0.36, 1);
  return sprite;
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

function addBed(group: THREE.Group, bed: PlannerBed, active?: PlannerPlantingArea, detailed = false) {
  const rect = bedRectCm(bed);
  const width = rect.w / 100;
  const depth = rect.h / 100;
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);
  const root = new THREE.Group();
  const wallHeight = 0.22;
  const rail = 0.085;

  const soil = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.05, width - 0.1), 0.14, Math.max(0.05, depth - 0.1)), material(colours.soilTop, 1));
  soil.position.set(x, 0.16, z);
  root.add(soil);

  const rails: Array<[number, number, number, number]> = [
    [width + rail * 2, rail, x, z - depth / 2], [width + rail * 2, rail, x, z + depth / 2],
    [rail, depth, x - width / 2, z], [rail, depth, x + width / 2, z],
  ];
  rails.forEach(([w, d, px, pz], index) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), material(index % 2 ? colours.timber : colours.timberDark, 0.9));
    mesh.position.set(px, wallHeight / 2, pz);
    root.add(mesh);
  });

  if (detailed) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.035, depth + 0.14), new THREE.MeshStandardMaterial({ color: 0xb48660, roughness: 0.88, wireframe: true, transparent: true, opacity: 0.12 }));
    cap.position.set(x, 0.225, z);
    root.add(cap);
  }
  applyShadow(root, detailed);
  inspectable(root, {
    title: bed.name,
    subtitle: active ? `${active.crop}${active.variety ? ` · ${active.variety}` : ""}` : "Raised garden bed",
    lines: [{ label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` }, ...(active ? [{ label: "Crop", value: active.crop }, { label: "Spacing", value: `${active.spacingCm} cm` }] : [])],
  });
  group.add(root);
}

function addPlantingArea(group: THREE.Group, plan: PlannerPlan, area: PlannerPlantingArea, detailed: boolean) {
  const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
  if (!bed) return;
  const rect = bedRectCm(bed);
  const ax = rect.x + (area.x / 100) * rect.w;
  const ay = rect.y + (area.y / 100) * rect.h;
  const aw = (area.w / 100) * rect.w;
  const ah = (area.h / 100) * rect.h;
  const root = new THREE.Group();
  for (const position of representativePositions(aw, ah, area.count, detailed ? 10 : 6)) {
    const plant = createPlant(area.crop, detailed);
    plant.position.set(worldX(ax + aw * position.x), 0.23, worldZ(ay + ah * position.y));
    plant.scale.setScalar(Math.max(0.72, Math.min(1.25, area.iconSize || 1)));
    root.add(plant);
  }
  const label = makeLabel(area.crop);
  if (label) {
    label.position.set(worldX(ax + aw / 2), detailed ? 0.95 : 0.78, worldZ(ay + ah / 2));
    root.add(label);
  }
  applyShadow(root, detailed);
  inspectable(root, {
    title: area.crop,
    subtitle: area.variety || "Planting area",
    lines: [{ label: "Bed", value: bed.name }, { label: "Spacing", value: `${area.spacingCm} cm` }, { label: "Pattern", value: area.pattern }, { label: "Planned count", value: String(area.count) }],
  });
  group.add(root);
}

function addPath(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "path" }>, detailed: boolean) {
  const x1 = worldX(object.x1), z1 = worldZ(object.y1), x2 = worldX(object.x2), z2 = worldZ(object.y2);
  const dx = x2 - x1, dz = z2 - z1, length = Math.max(0.05, Math.hypot(dx, dz)), width = Math.max(0.16, object.widthCm / 100);
  const root = new THREE.Group();
  const path = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, width), material(0xb4ad9b, 1));
  path.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
  path.rotation.y = -Math.atan2(dz, dx);
  root.add(path);
  if (detailed) {
    const count = Math.min(18, Math.max(5, Math.floor(length * 2.2)));
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count, side = ((i * 37) % 100) / 100 - 0.5;
      const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (i % 3) * 0.006, 5, 4), material(0x8e897d, 1));
      pebble.scale.y = 0.35;
      pebble.position.set(x1 + dx * t + Math.cos(Math.atan2(dz, dx)) * side * width * 0.7, 0.052, z1 + dz * t - Math.sin(Math.atan2(dz, dx)) * side * width * 0.7);
      root.add(pebble);
    }
  }
  inspectable(root, { title: object.label || "Garden path", lines: [{ label: "Length", value: `${length.toFixed(1)} m` }, { label: "Width", value: `${object.widthCm} cm` }] });
  group.add(root);
}

function addTrellis(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>, detailed: boolean) {
  const x1 = worldX(object.x1), z1 = worldZ(object.y1), x2 = worldX(object.x2), z2 = worldZ(object.y2);
  const dx = x2 - x1, dz = z2 - z1, length = Math.max(0.05, Math.hypot(dx, dz)), height = Math.max(0.45, object.heightCm / 100);
  const root = new THREE.Group();
  const posts = Math.max(2, Math.ceil((length * 100) / Math.max(50, object.postSpacingCm)) + 1);
  for (let i = 0; i < posts; i += 1) {
    const t = posts === 1 ? 0.5 : i / (posts - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, height, 7), material(0x74583f, 0.92));
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    root.add(post);
  }
  const angle = -Math.atan2(dz, dx);
  for (const y of detailed ? [height * 0.25, height * 0.5, height * 0.75, height] : [height * 0.45, height * 0.8]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.018, 0.018), material(0x7b8580, 0.55));
    rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    rail.rotation.y = angle;
    root.add(rail);
  }
  applyShadow(root, detailed);
  inspectable(root, { title: object.label || "Trellis", lines: [{ label: "Height", value: `${height.toFixed(1)} m` }, { label: "Length", value: `${length.toFixed(1)} m` }] });
  group.add(root);
}

function addTree(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>, detailed: boolean) {
  const root = new THREE.Group();
  const x = worldX(object.x), z = worldZ(object.y), radius = Math.min(0.9, Math.max(0.3, object.diameterCm / 200)), trunkHeight = 0.75 + radius * 0.25;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, trunkHeight, 8), material(0x755137, 1));
  trunk.position.set(x, trunkHeight / 2, z);
  root.add(trunk);
  const lobes = detailed ? 5 : 3;
  for (let i = 0; i < lobes; i += 1) {
    const angle = (i / lobes) * Math.PI * 2;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(radius * (i === 0 ? 0.8 : 0.62), 8, 6), material(0x477a48, 0.96));
    crown.scale.y = 0.75;
    crown.position.set(x + Math.cos(angle) * radius * 0.28, trunkHeight + radius * (0.44 + (i % 2) * 0.08), z + Math.sin(angle) * radius * 0.28);
    root.add(crown);
  }
  if (detailed && (object.label || "").toLowerCase().includes("peach")) {
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      root.add(fruitSphere(0xe99963, 0.045, x + Math.cos(angle) * radius * 0.36, trunkHeight + radius * 0.55, z + Math.sin(angle) * radius * 0.36));
    }
  }
  applyShadow(root, detailed);
  inspectable(root, { title: object.label || "Garden tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  group.add(root);
}

function addBoundary(group: THREE.Group, detailed: boolean) {
  const width = GARDEN_WIDTH_CM / 100, depth = GARDEN_HEIGHT_CM / 100, postCount = detailed ? 22 : 14;
  for (let i = 0; i < postCount; i += 1) {
    const t = i / Math.max(1, postCount - 1);
    for (const [x, z] of [[-width / 2, -depth / 2 + depth * t], [width / 2, -depth / 2 + depth * t]] as const) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.42, 0.055), material(0x8d7458, 0.95));
      post.position.set(x, 0.21, z);
      group.add(post);
    }
  }
}

function buildGarden(group: THREE.Group, plan: PlannerPlan, detailed: boolean) {
  addBoundary(group, detailed);
  for (const bed of plan.beds) addBed(group, bed, plan.plantingAreas.find((area) => area.bedId === bed.id), detailed);
  for (const area of plan.plantingAreas) addPlantingArea(group, plan, area, detailed);
  for (const row of plan.rows) {
    const root = new THREE.Group();
    const count = Math.min(detailed ? 12 : 7, Math.max(1, row.count || 1));
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const plant = createPlant(row.crop, detailed);
      plant.scale.setScalar(0.82);
      plant.position.set(worldX(row.x1 + (row.x2 - row.x1) * t), 0.03, worldZ(row.y1 + (row.y2 - row.y1) * t));
      root.add(plant);
    }
    applyShadow(root, detailed);
    inspectable(root, { title: row.crop, subtitle: row.variety || "Planting row", lines: [{ label: "Spacing", value: `${row.spacingCm} cm` }, { label: "Planned count", value: String(row.count) }] });
    group.add(root);
  }
  for (const object of plan.objects) {
    if (object.type === "path") addPath(group, object, detailed);
    if (object.type === "trellis") addTrellis(group, object, detailed);
    if (object.type === "tree") addTree(group, object, detailed);
  }
}

export function GardenWebGLVisual() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const planRef = useRef<PlannerPlan | null>(null);
  const selectionHelperRef = useRef<THREE.BoxHelper | null>(null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [source, setSource] = useState("Loading garden…");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [inspector, setInspector] = useState<InspectorItem>(DEFAULT_INSPECTOR);
  const [hasSelection, setHasSelection] = useState(false);

  const applyPlan = (nextPlan: PlannerPlan, nextSource: string) => {
    planRef.current = nextPlan;
    setPlan(nextPlan);
    setSource(nextSource);
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelectionHelper(selectionHelperRef);
    clearGroup(runtime.content);
    buildGarden(runtime.content, nextPlan, runtime.detailed);
    runtime.render();
    setInspector(DEFAULT_INSPECTOR);
    setHasSelection(false);
  };

  useEffect(() => {
    let cancelled = false;
    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    const selected = fromQuery || readActiveGardenId();
    setGardenId(selected);
    const live = readPlanFromStorage(gardenLivePlanKey(selected));
    if (live) applyPlan(live, "Live 2D planner");
    else {
      void (async () => {
        try {
          const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selected)}`, { cache: "no-store" });
          const data = (await response.json()) as GardenPlanApiResponse;
          if (response.ok && data.ok && data.plan && !cancelled) {
            applyPlan(data.plan, "Live D1 garden");
            return;
          }
        } catch {
          // Local fallback below.
        }
        if (cancelled) return;
        const local = readPlanFromStorage(gardenLocalPlanKey(selected));
        applyPlan(local ?? EMPTY_PLAN, local ? "Local planner copy" : "Empty garden");
      })();
    }
    return () => { cancelled = true; };
    // applyPlan intentionally uses refs so this loader runs only once for the selected URL garden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onLivePlan = (event: Event) => {
      const detail = (event as CustomEvent<{ gardenId?: string; plan?: PlannerPlan }>).detail;
      if (detail?.gardenId === gardenId && detail.plan) applyPlan(detail.plan, "Live 2D planner");
    };
    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
    return () => window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
  }, [gardenId]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;
    const detailed = window.matchMedia("(min-width: 841px)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: detailed, alpha: false, powerPreference: detailed ? "high-performance" : "low-power" });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(detailed ? Math.min(window.devicePixelRatio || 1, 1.35) : 1);
      renderer.shadowMap.enabled = detailed;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch {
      setRenderError("WebGL could not start on this device.");
      return;
    }
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcbded7);
    scene.fog = new THREE.Fog(0xcbded7, 18, 31);
    scene.add(new THREE.HemisphereLight(0xf8fff8, 0x76624c, 1.45));
    const sun = new THREE.DirectionalLight(0xffefd2, detailed ? 2.25 : 1.55);
    sun.position.set(-6, 10, 7);
    if (detailed) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -8;
      sun.shadow.camera.right = 8;
      sun.shadow.camera.top = 9;
      sun.shadow.camera.bottom = -9;
      sun.shadow.bias = -0.0008;
    }
    scene.add(sun);
    const outerGround = new THREE.Mesh(new THREE.PlaneGeometry(17, 19), material(colours.grassDark, 1));
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.035;
    outerGround.receiveShadow = detailed;
    scene.add(outerGround);
    const gardenGround = new THREE.Mesh(new THREE.PlaneGeometry(9.3, 11.1), material(colours.grass, 1));
    gardenGround.rotation.x = -Math.PI / 2;
    gardenGround.position.y = -0.015;
    gardenGround.receiveShadow = detailed;
    scene.add(gardenGround);
    const camera = new THREE.PerspectiveCamera(detailed ? 38 : 44, 1, 0.1, 60);
    camera.position.set(detailed ? 8.9 : 7.6, detailed ? 8.6 : 8.8, detailed ? 12.2 : 11.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = detailed;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.28, 0);
    controls.minDistance = 3.8;
    controls.maxDistance = 27;
    controls.maxPolarAngle = Math.PI * 0.48;
    const content = new THREE.Group();
    scene.add(content);
    const render = () => renderer.render(scene, camera);
    runtimeRef.current = { scene, content, camera, controls, renderer, render, detailed };
    controls.addEventListener("change", render);

    // If data won the startup race, consume it synchronously now.
    if (planRef.current) {
      buildGarden(content, planRef.current, detailed);
      setInspector(DEFAULT_INSPECTOR);
      setHasSelection(false);
    }

    let animationFrame = 0;
    const animate = () => {
      if (detailed) controls.update();
      render();
      if (detailed) animationFrame = requestAnimationFrame(animate);
    };
    animate();

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
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      for (const hit of hits) {
        let current: THREE.Object3D | null = hit.object;
        while (current) {
          const item = current.userData.inspect as InspectorItem | undefined;
          const root = current.userData.selectionRoot as THREE.Object3D | undefined;
          if (item && root) {
            clearSelectionHelper(selectionHelperRef);
            const helper = new THREE.BoxHelper(root, 0xffc44d);
            helper.material.depthTest = false;
            helper.renderOrder = 50;
            scene.add(helper);
            selectionHelperRef.current = helper;
            setInspector(item);
            setHasSelection(true);
            render();
            return;
          }
          current = current.parent;
        }
      }
      clearSelectionHelper(selectionHelperRef);
      setInspector(DEFAULT_INSPECTOR);
      setHasSelection(false);
      render();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    const resize = () => {
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.removeEventListener("change", render);
      controls.dispose();
      clearSelectionHelper(selectionHelperRef);
      clearGroup(content);
      renderer.dispose();
      runtimeRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  const resetCamera = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(runtime.detailed ? 8.9 : 7.6, runtime.detailed ? 8.6 : 8.8, runtime.detailed ? 12.2 : 11.2);
    runtime.controls.target.set(0, 0.28, 0);
    runtime.controls.update();
    runtime.render();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <a href={`/?gardenId=${encodeURIComponent(gardenId)}`} className={styles.back}>← 2D Plan</a>
          <div><strong>Blenheim Garden</strong><span>Visual 3D garden</span></div>
        </div>
        <div className={styles.headerActions}><span className={styles.source}>{source}</span><button type="button" onClick={resetCamera}>Fit garden</button></div>
      </header>
      <section className={styles.toolbar}>
        <span className={styles.hint}>Recognisable crops · tap to inspect · drag to orbit · pinch/wheel to zoom</span>
        <span className={styles.mobileHint}>Tap crops and beds · drag to rotate</span>
      </section>
      <section className={styles.workspace}>
        <div className={styles.viewport}>
          <div ref={canvasMountRef} aria-label="Visual 3D garden canvas" style={{ position: "absolute", inset: 0 }} />
          {renderError && <div className={styles.loading}>{renderError}</div>}
          {!renderError && !plan && <div className={styles.loading}>{source}</div>}
          {hasSelection && (
            <div className={styles.selectionCard} aria-live="polite">
              <span>SELECTED</span><strong>{inspector.title}</strong>{inspector.subtitle && <small>{inspector.subtitle}</small>}
              {inspector.lines.slice(0, 2).map((line) => <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>)}
            </div>
          )}
        </div>
        <aside className={styles.inspector} aria-live="polite">
          <p className={styles.eyebrow}>{hasSelection ? "SELECTED ITEM" : "VISUAL 3D"}</p>
          <h2>{inspector.title}</h2>
          {inspector.subtitle && <p className={styles.subtitle}>{inspector.subtitle}</p>}
          {inspector.lines.length > 0 && <dl>{inspector.lines.map((line) => <div key={`${line.label}-${line.value}`}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}</dl>}
          <div className={styles.legend}>
            <strong>{hasSelection ? "Highlighted in the garden" : "Designed to read visually"}</strong>
            <p>{hasSelection ? "The yellow outline marks the crop group, bed or garden feature you selected." : "Crop-specific shapes, fruit colours, raised beds and real trellis/tree forms make the 3D view easier to understand without opening the inspector."}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
