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
import { createGardenPlant3D } from "@/components/garden-plant-3d";
import { areaPlants, rowPlants, type PlanSelection } from "@/lib/garden/plan-editing";
import { useGarden3DEditor } from "./use-garden-3d-editor";
import { Garden3DEditorControls } from "./garden-3d-editor-controls";
import { installGardenEditInteractions } from "./garden-3d-edit-interactions";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;
const EMPTY_PLAN: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

const palette = {
  grass: 0x8fcb58,
  grassDark: 0x63a947,
  timber: 0xb9783f,
  timberLight: 0xda9a56,
  timberDark: 0x7a4728,
  timberCap: 0xe6ad66,
  soil: 0x67402a,
  mulch: 0xc99756,
  leaf: 0x4da24c,
  leafLight: 0x78c457,
  leafDark: 0x347a3e,
  stem: 0x4d803f,
  metal: 0xa8b6b2,
  path: 0xe8cf9f,
  pathDark: 0xc8a978,
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
  needsRender?: boolean;
  cancelEditing?: () => void;
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
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
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
  gradient.addColorStop(0, "#79c6ee");
  gradient.addColorStop(0.56, "#c9e9ef");
  gradient.addColorStop(1, "#ffe4b5");
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
  const wallHeight = 0.34;
  const rail = 0.13;
  const post = 0.15;

  box(group, Math.max(0.08, width - 0.22), 0.21, Math.max(0.08, depth - 0.22), palette.soil, x, 0.205, z, 1);

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

  box(group, width + 0.18, 0.055, 0.075, palette.timberCap, x, wallHeight + 0.028, z - depth / 2, 0.78);
  box(group, width + 0.18, 0.055, 0.075, palette.timberCap, x, wallHeight + 0.028, z + depth / 2, 0.78);
  box(group, 0.075, 0.055, depth, palette.timberCap, x - width / 2, wallHeight + 0.028, z, 0.78);
  box(group, 0.075, 0.055, depth, palette.timberCap, x + width / 2, wallHeight + 0.028, z, 0.78);

  // Thin highlight boards give the chunky timber a toy-like, hand-built edge.
  box(group, width - 0.08, 0.028, 0.018, palette.timberLight, x, wallHeight * 0.72, z - depth / 2 - rail * 0.46, 0.78);
  box(group, width - 0.08, 0.028, 0.018, palette.timberLight, x, wallHeight * 0.72, z + depth / 2 + rail * 0.46, 0.78);

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
  group.userData.planSelection = { kind: "bed", id: String(bed.id) };
  root.add(group);
}

function addEditablePlants(root: THREE.Group, points: Array<{ id: string; x: number; y: number }>, crop: string, variety: string, spacingCm: number, selection: PlanSelection, mobile: boolean, baseY: number, bedName?: string) {
  const every = Math.max(1, Math.ceil(points.length / (mobile ? 32 : 100)));
  const templates = new Map<number, THREE.Group>();
  points.forEach((point, index) => {
    if (index % every) return;
    const variant = index % 3;
    if (!templates.has(variant)) templates.set(variant, createGardenPlant3D(crop, variety, mobile, variant + crop.length * 17));
    const plant = templates.get(variant)!.clone(true);
    plant.position.set(worldX(point.x), baseY, worldZ(point.y));
    inspectable(plant, { title: crop, subtitle: variety, lines: [{ label: "Spacing", value: spacingCm + " cm" }, ...(bedName ? [{ label: "Bed", value: bedName }] : [])] });
    plant.userData.planSelection = { ...selection, plantId: point.id };
    root.add(plant);
  });
}

function addPlantingArea(root: THREE.Group, plan: PlannerPlan, area: PlannerPlantingArea, mobile: boolean) {
  const bed = plan.beds.find((b) => b.id === area.bedId);
  if (!bed) return;
  const group = new THREE.Group();
  group.userData.bedId = area.bedId;
  addEditablePlants(group, areaPlants(plan, area), area.crop, area.variety, area.spacingCm, { kind: "area", id: area.id }, mobile, .31, bed.name);
  root.add(group);
}

function addRow(root: THREE.Group, row: PlannerPlan["rows"][number], mobile: boolean, plan: PlannerPlan) {
  const group = new THREE.Group();
  addEditablePlants(group, rowPlants(row), row.crop, row.variety, row.spacingCm, { kind: "row", id: row.id }, mobile, .03);
  for (const plant of group.children) {
    const x = (plant.position.x + 4.5) * 100, y = (plant.position.z + 5.4) * 100;
    if (plan.beds.some((bed) => { const r = bedRectCm(bed); return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; })) plant.position.y = .31;
  }
  // A faint centreline also lets the entire row be selected between its plants.
  if (Math.hypot(row.x2 - row.x1, row.y2 - row.y1) > 1) {
    const length = Math.hypot(row.x2 - row.x1, row.y2 - row.y1) / 100;
    const line = new THREE.Mesh(new THREE.BoxGeometry(length, .015, .025), mat(0x78a55d));
    line.position.set(worldX((row.x1 + row.x2) / 2), .02, worldZ((row.y1 + row.y2) / 2));
    line.rotation.y = -Math.atan2(row.y2 - row.y1, row.x2 - row.x1);
    line.userData.planSelection = { kind: "row", id: row.id };
    line.userData.selectionRoot = group;
    group.add(line);
  }
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
  const width = Math.max(0.2, object.widthCm / 100);
  const group = new THREE.Group();
  const angle = Math.atan2(dz, dx);

  const path = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, width), mat(palette.path, 1));
  path.position.set((x1 + x2) / 2, 0.018, (z1 + z2) / 2);
  path.rotation.y = -angle;
  path.receiveShadow = true;
  group.add(path);

  const stones = mobile ? Math.max(4, Math.floor(length * 0.9)) : Math.max(6, Math.floor(length * 1.35));
  for (let index = 0; index < stones; index += 1) {
    const t = (index + 0.5) / stones;
    const side = ((((index * 47) % 100) / 100) - 0.5) * width * 0.34;
    const radius = 0.085 + (index % 3) * 0.018;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), mat(index % 2 ? 0xd7bd8c : 0xf0d9aa, 1));
    stone.scale.set(1.18, 0.22, 0.9 + (index % 2) * 0.12);
    stone.position.set(x1 + dx * t - Math.sin(angle) * side, 0.052, z1 + dz * t + Math.cos(angle) * side);
    stone.rotation.y = (index * 0.71) % Math.PI;
    stone.castShadow = true;
    group.add(stone);
  }

  inspectable(group, { title: object.label || "Garden path", lines: [{ label: "Length", value: `${length.toFixed(1)} m` }, { label: "Width", value: `${object.widthCm} cm` }] });
  group.userData.planSelection = { kind: "object", id: object.id };
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
  group.userData.planSelection = { kind: "object", id: object.id };
  root.add(group);
}

function addTree(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>, mobile: boolean) {
  const group = new THREE.Group();
  const x = worldX(object.x);
  const z = worldZ(object.y);
  const radius = Math.max(0.12, object.diameterCm / 175);
  const trunkHeight = 0.8 + radius * 0.24;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.145, trunkHeight, 7), mat(0x7a4d2f, 1));
  trunk.position.set(x, trunkHeight / 2, z);
  trunk.castShadow = true;
  group.add(trunk);

  const crowns = mobile ? 4 : 7;
  for (let index = 0; index < crowns; index += 1) {
    const angle = (index / Math.max(1, crowns - 1)) * Math.PI * 2 + 0.35;
    const center = index === 0;
    const size = radius * (center ? 0.82 : 0.53 + (index % 2) * 0.06);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), mat(index % 3 === 0 ? 0x86c756 : index % 2 ? 0x5eaa49 : 0x73bb50, 0.98));
    crown.scale.set(1.02, center ? 0.92 : 0.82, 1.02);
    crown.position.set(
      x + (center ? 0 : Math.cos(angle) * radius * 0.34),
      trunkHeight + radius * (center ? 0.63 : 0.48 + (index % 3) * 0.08),
      z + (center ? 0 : Math.sin(angle) * radius * 0.34),
    );
    crown.castShadow = true;
    group.add(crown);
  }
  inspectable(group, { title: object.label || "Garden tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  group.userData.planSelection = { kind: "object", id: object.id };
  root.add(group);
}

function addBoundary(root: THREE.Group, mobile: boolean) {
  const width = GARDEN_WIDTH_CM / 100;
  const depth = GARDEN_HEIGHT_CM / 100;
  const sidePosts = mobile ? 10 : 16;
  const endPosts = mobile ? 8 : 13;
  const fence = 0x9b653a;
  const fenceLight = 0xc08449;

  const addPost = (x: number, z: number) => {
    box(root, 0.085, 0.58, 0.085, fence, x, 0.29, z, 0.95);
    box(root, 0.105, 0.035, 0.105, fenceLight, x, 0.595, z, 0.85);
  };

  for (let index = 0; index < sidePosts; index += 1) {
    const t = index / Math.max(1, sidePosts - 1);
    const z = -depth / 2 + depth * t;
    addPost(-width / 2, z);
    addPost(width / 2, z);
  }
  for (let index = 1; index < endPosts - 1; index += 1) {
    const t = index / Math.max(1, endPosts - 1);
    const x = -width / 2 + width * t;
    addPost(x, -depth / 2);
    addPost(x, depth / 2);
  }

  for (const y of [0.23, 0.43]) {
    box(root, width + 0.04, 0.055, 0.055, fenceLight, 0, y, -depth / 2, 0.9);
    box(root, width + 0.04, 0.055, 0.055, fenceLight, 0, y, depth / 2, 0.9);
    box(root, 0.055, 0.055, depth + 0.04, fenceLight, -width / 2, y, 0, 0.9);
    box(root, 0.055, 0.055, depth + 0.04, fenceLight, width / 2, y, 0, 0.9);
  }
}

function addGardenDecor(root: THREE.Group, mobile: boolean) {
  const width = GARDEN_WIDTH_CM / 100;
  const depth = GARDEN_HEIGHT_CM / 100;
  const tufts = mobile ? 18 : 48;
  for (let index = 0; index < tufts; index += 1) {
    const alongSide = index % 2 === 0;
    const t = ((index * 37) % 100) / 100;
    const side = index % 4 < 2 ? -1 : 1;
    const x = alongSide ? side * (width / 2 - 0.18) : -width / 2 + 0.2 + t * (width - 0.4);
    const z = alongSide ? -depth / 2 + 0.2 + t * (depth - 0.4) : side * (depth / 2 - 0.18);
    const tuft = new THREE.Group();
    for (let blade = 0; blade < 3; blade += 1) {
      const grass = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11 + blade * 0.016, 5), mat(blade % 2 ? 0x6dac49 : 0x80bf50, 1));
      grass.position.set(x + (blade - 1) * 0.025, 0.05, z + ((blade * 17) % 3 - 1) * 0.018);
      grass.rotation.z = (blade - 1) * 0.12;
      grass.castShadow = true;
      tuft.add(grass);
    }
    root.add(tuft);

    if (!mobile && index % 5 === 0) {
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.12, 5), mat(0x4d8b42, 1));
      stem.position.set(x + 0.04, 0.06, z - 0.02);
      flower.add(stem);
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = petal * Math.PI * 0.4;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), mat(0xf8f0cf, 1));
        p.scale.set(1.3, 0.45, 0.8);
        p.position.set(x + 0.04 + Math.cos(angle) * 0.018, 0.125, z - 0.02 + Math.sin(angle) * 0.018);
        flower.add(p);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.01, 5, 4), mat(0xf0c34e, 1));
      center.position.set(x + 0.04, 0.126, z - 0.02);
      flower.add(center);
      root.add(flower);
    }
  }
}

function buildGarden(root: THREE.Group, plan: PlannerPlan, mobile: boolean) {
  const expected = new Set<string>();
  const reconcile = (key: string, signature: unknown, build: (holder: THREE.Group) => void) => {
    expected.add(key);
    const stamp = JSON.stringify(signature);
    const existing = root.children.find((child) => child.userData.planKey === key);
    if (existing?.userData.planStamp === stamp) return;
    if (existing) { disposeObject(existing); existing.removeFromParent(); }
    const holder = new THREE.Group(); holder.userData.planKey = key; holder.userData.planStamp = stamp;
    build(holder); root.add(holder);
  };
  reconcile("decor", mobile, (holder) => { addBoundary(holder, mobile); addGardenDecor(holder, mobile); });
  for (const bed of plan.beds) reconcile("bed:" + bed.id, bed, (holder) => addRaisedBed(holder, bed, plan.plantingAreas.find((a) => a.bedId === bed.id), mobile));
  for (const area of plan.plantingAreas) reconcile("area:" + area.id, [area, plan.beds.find((b) => b.id === area.bedId)], (holder) => addPlantingArea(holder, plan, area, mobile));
  for (const row of plan.rows) reconcile("row:" + row.id, [row, plan.beds], (holder) => addRow(holder, row, mobile, plan));
  for (const object of plan.objects) reconcile("object:" + object.id, object, (holder) => {
    if (object.type === "path") addPath(holder, object, mobile);
    if (object.type === "trellis") addTrellis(holder, object, mobile);
    if (object.type === "tree") addTree(holder, object, mobile);
    if (object.type === "structure") { addStructure3D(holder, object, !mobile); holder.children[0].userData.planSelection = { kind: "object", id: object.id }; }
  });
  for (const child of [...root.children]) if (!expected.has(child.userData.planKey)) { disposeObject(child); child.removeFromParent(); }
}

function clearSelection(ref: React.MutableRefObject<THREE.BoxHelper | null>) {
  const helper = ref.current;
  if (!helper) return;
  helper.removeFromParent();
  helper.geometry.dispose();
  helper.material.dispose();
  ref.current = null;
}

function fitGardenCamera(runtime: Runtime) {
  const bounds = new THREE.Box3().setFromObject(runtime.content);
  if (bounds.isEmpty()) return;
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const vertical = THREE.MathUtils.degToRad(runtime.camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * runtime.camera.aspect);
  const distance = sphere.radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.08;
  const direction = runtime.camera.position.clone().sub(runtime.controls.target).normalize();
  runtime.controls.maxDistance = Math.max(27, distance * 1.5);
  runtime.camera.far = Math.max(60, distance * 3);
  runtime.camera.position.copy(sphere.center).addScaledVector(direction, distance);
  runtime.controls.target.copy(sphere.center);
  runtime.camera.updateProjectionMatrix();
  runtime.controls.update();
  runtime.needsRender = true;
}

export function Garden3DUnified({ plan: suppliedPlan }: { plan?: PlannerPlan }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const selectionRef = useRef<THREE.BoxHelper | null>(null);
  const [loadedPlan, setLoadedPlan] = useState<PlannerPlan | null>(suppliedPlan ?? null);
  const [gardenId] = useState(() => typeof window === "undefined" ? DEFAULT_GARDEN_ID : new URL(window.location.href).searchParams.get("gardenId")?.trim() || readActiveGardenId());
  const [showDemo, setShowDemo] = useState(false);
  const [cameraView, setCameraView] = useState<"perspective" | "top">("perspective");
  const [quality] = useState(() => typeof window !== "undefined" && !window.matchMedia("(min-width: 841px)").matches ? "MOBILE" : "HIGH");
  const [renderError, setRenderError] = useState<string | null>(null);
  const effectivePlan = suppliedPlan ?? loadedPlan ?? EMPTY_PLAN;
  const planRef = useRef<PlannerPlan>(effectivePlan);
  const demoRef = useRef(showDemo);
  const editor = useGarden3DEditor(effectivePlan, gardenId, setLoadedPlan);
  const item = editor.item;
  const inspector: InspectItem = showDemo ? { title: "2 × 4 m demonstration bed", subtitle: "Benchmark style used by the live raised beds", lines: [{ label: "Mode", value: "Demo bed" }] } : !item ? DEFAULT_INSPECTOR : { title: "name" in item ? item.name : "crop" in item ? item.crop : "label" in item ? item.label || item.type : "text" in item ? item.text : "Selection", lines: [] };
  const editorRef = useRef(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);
  const structureCount = useMemo(() => effectivePlan.objects.filter((object) => object.type === "structure").length, [effectivePlan]);

  const rebuild = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection(selectionRef);
    if (demoRef.current) { disposeObject(runtime.content); runtime.content.clear(); addDemonstrationBed3D(runtime.content, runtime.mobile); }
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

  }, [showDemo, rebuild]);

  useEffect(() => {
    if (suppliedPlan) return;
    let cancelled = false;
    const selected = new URL(window.location.href).searchParams.get("gardenId")?.trim() || readActiveGardenId();
    void (async () => {
      await Promise.resolve();
      const live = readPlanFromStorage(gardenLivePlanKey(selected));
      if (cancelled) return;
      if (live) { setLoadedPlan(live); return; }
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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: mobile ? "low-power" : "high-performance" });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = mobile ? 1.06 : 1.14;
      renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = !mobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch {
      queueMicrotask(() => setRenderError("WebGL could not start on this device."));
      return;
    }

    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const sky = skyTexture();
    scene.background = sky ?? new THREE.Color(0xcbeaf0);
    scene.fog = new THREE.Fog(0xd6e7d5, 23, 40);
    scene.add(new THREE.HemisphereLight(0xfffdf1, 0x6d7347, 1.72));

    const sun = new THREE.DirectionalLight(0xffdda2, mobile ? 1.75 : 2.55);
    sun.position.set(-7.5, 11.5, 6.5);
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
      for (let index = 0; index < 150; index += 1) {
        const gx = ((index * 67) % 900) / 100 - 4.5;
        const gz = ((index * 113) % 1080) / 100 - 5.4;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.085 + (index % 4) * 0.014, 5), mat(index % 3 === 0 ? 0x70b84c : index % 2 ? 0x7dc654 : 0x65aa47, 1));
        blade.position.set(gx, 0.035, gz);
        blade.rotation.z = (((index * 19) % 11) - 5) * 0.025;
        scene.add(blade);
      }
    }

    const camera = new THREE.PerspectiveCamera(mobile ? 42 : 34, 1, 0.1, 60);
    camera.position.set(mobile ? 7.5 : 8.4, mobile ? 9.2 : 10.4, mobile ? 12.2 : 13.6);
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

    const removeEditInteractions = installGardenEditInteractions(runtime, () => editorRef.current, () => demoRef.current);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      runtime.needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    if (mobile) fitGardenCamera(runtime);

    renderer.setAnimationLoop(() => {
      if (controls.update() || runtime.needsRender) {
        selectionRef.current?.update();
        renderer.render(scene, camera);
        runtime.needsRender = false;
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      removeEditInteractions();
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

  useEffect(() => { runtimeRef.current?.cancelEditing?.(); }, [editor.tool, showDemo]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection(selectionRef);
    runtime.needsRender = true;
    const selected = editor.selection;
    if (!selected) return;
    runtime.content.traverse((node) => {
      const target = node.userData.planSelection as PlanSelection | undefined;
      if (!target || target.kind !== selected.kind || target.id !== selected.id || target.plantId !== selected.plantId) return;
      const helper = new THREE.BoxHelper(node, 0xffc44d); helper.material.depthTest = false; helper.renderOrder = 50;
      runtime.scene.add(helper); selectionRef.current = helper;
    });
  }, [editor.selection, effectivePlan]);

  const setPerspective = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setCameraView("perspective");
    runtime.camera.position.set(runtime.mobile ? 7.5 : 8.4, runtime.mobile ? 9.2 : 10.4, runtime.mobile ? 12.2 : 13.6);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(0, 0.3, 0);
    runtime.controls.update();
    runtime.camera.updateMatrixWorld();
    runtime.needsRender = true;
  };

  const setTop = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setCameraView("top");
    runtime.camera.position.set(0, 16.2, 0.001);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(0, 0, 0);
    runtime.controls.update();
    runtime.camera.updateMatrixWorld();
    runtime.needsRender = true;
  };

  return (
    <div className="gv-3d-workspace gv-3d-realistic gv-3d-editor" data-demo={showDemo} aria-label="Visual 3D garden canvas" data-testid="inline-3d-workspace" style={{ position: "relative", width: "100%", height: "100%", minHeight: suppliedPlan ? 520 : "100dvh", overflow: "hidden" }}>
      <div className="gv-3d-workspace-canvas" ref={mountRef} aria-label="Interactive 3D garden workspace" style={{ position: "absolute", inset: 0 }} />
      <Garden3DEditorControls editor={editor} disabled={showDemo || !!renderError || (!suppliedPlan && !loadedPlan)} />
      {renderError && <div className="gv-3d-workspace-error">{renderError}</div>}
      <div className="gv-3d-hud gv-3d-hud-left">
        <span className="gv-3d-live-dot" />
        <strong>GARDEN SIM</strong>
        <small>{showDemo ? "2 × 4 m benchmark" : `${effectivePlan.beds.length} beds · ${structureCount} structures`}</small>
      </div>
      <div className="gv-3d-hud gv-3d-camera-controls" aria-label="3D camera controls">
        <button type="button" className={cameraView === "perspective" ? "active" : ""} aria-pressed={cameraView === "perspective"} onClick={setPerspective}>Perspective</button>
        <button type="button" className={cameraView === "top" ? "active" : ""} aria-pressed={cameraView === "top"} onClick={setTop}>Top</button>
        <button type="button" onClick={() => { if (runtimeRef.current) fitGardenCamera(runtimeRef.current); }}>{suppliedPlan ? "Fit" : "Fit garden"}</button>
        <button type="button" className={showDemo ? "active" : ""} aria-pressed={showDemo} onClick={() => setShowDemo((value) => !value)}>Demo bed</button>
        <span>{quality}</span>
      </div>
      <div className="gv-3d-selection-card" aria-live="polite">
        <span>{inspector === DEFAULT_INSPECTOR ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspector.title}</strong>
        {inspector.subtitle && <small>{inspector.subtitle}</small>}
        {inspector.lines.slice(0, 3).map((line) => <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>)}
      </div>
      <div className="gv-3d-help">Drag empty ground to orbit · Move to drag objects · tap to place/select</div>
    </div>
  );
}
