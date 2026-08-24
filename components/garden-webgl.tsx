"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  GardenPlanApiResponse,
  PlannerBed,
  PlannerPlan,
  PlannerPlantingArea,
} from "@/lib/garden/planner-plan";
import { plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";
import { DEFAULT_GARDEN_ID, LIVE_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";
import styles from "./garden-webgl.module.css";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

type ViewMode = "garden" | "rotation";
type InspectorItem = {
  title: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
};

type Runtime = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  sun: THREE.DirectionalLight;
  scene: THREE.Scene;
  content: THREE.Group;
};

const familyByCrop: Record<string, string> = {
  Tomato: "Nightshade",
  Strawberry: "Rosaceae",
  Bean: "Legume",
  Lettuce: "Asteraceae",
  Pumpkin: "Cucurbit",
  Carrot: "Apiaceae",
  Broccoli: "Brassica",
  Raspberry: "Rosaceae",
  Blueberry: "Ericaceae",
  Herbs: "Herb",
};

const familyColours: Record<string, number> = {
  Nightshade: 0xb78378,
  Rosaceae: 0xb98aa0,
  Legume: 0x83a980,
  Asteraceae: 0x9fbd7d,
  Cucurbit: 0xd5a565,
  Apiaceae: 0xc9a06f,
  Brassica: 0x7ea48a,
  Ericaceae: 0x8898bb,
  Herb: 0x7ca38b,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function bedRectCm(bed: PlannerBed) {
  return {
    x: (bed.x / 100) * GARDEN_WIDTH_CM,
    y: (bed.y / 100) * GARDEN_HEIGHT_CM,
    w: (bed.w / 100) * GARDEN_WIDTH_CM,
    h: (bed.h / 100) * GARDEN_HEIGHT_CM,
  };
}

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function inspectable(root: THREE.Object3D, item: InspectorItem) {
  root.traverse((object) => {
    object.userData.inspect = item;
  });
}

function leaf(material: THREE.Material, scale = 1) {
  const geometry = new THREE.SphereGeometry(0.18 * scale, 10, 8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(1.35, 0.34, 0.75);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addRadialLeaves(group: THREE.Group, material: THREE.Material, count: number, radius: number, height: number, scale = 1) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const item = leaf(material, scale);
    item.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    item.rotation.y = -angle;
    item.rotation.z = 0.18;
    group.add(item);
  }
}

function createPlant(crop: string, size: number) {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x4f9451, roughness: 0.88 });
  const lightGreen = new THREE.MeshStandardMaterial({ color: 0x79b85c, roughness: 0.9 });
  const darkGreen = new THREE.MeshStandardMaterial({ color: 0x397844, roughness: 0.9 });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x608b45, roughness: 0.95 });

  const stem = (height: number, radius = 0.025) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, height, 7), stemMaterial);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    return mesh;
  };

  if (crop === "Tomato") {
    group.add(stem(0.52, 0.028));
    addRadialLeaves(group, green, 6, 0.12, 0.33, 0.72);
    const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd84d3f, roughness: 0.72 });
    for (const [x, y, z] of [[-0.09, 0.24, 0.05], [0.08, 0.27, 0.06], [0.03, 0.19, -0.07]] as const) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), fruitMaterial);
      fruit.position.set(x, y, z);
      fruit.castShadow = true;
      group.add(fruit);
    }
  } else if (crop === "Strawberry") {
    addRadialLeaves(group, green, 7, 0.08, 0.08, 0.65);
    const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd94755, roughness: 0.8 });
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), fruitMaterial);
    berry.scale.set(0.9, 1.15, 0.9);
    berry.position.set(0.08, 0.07, 0.05);
    berry.castShadow = true;
    group.add(berry);
  } else if (crop === "Bean") {
    group.add(stem(0.42, 0.02));
    addRadialLeaves(group, lightGreen, 5, 0.11, 0.28, 0.7);
  } else if (crop === "Lettuce") {
    addRadialLeaves(group, lightGreen, 10, 0.09, 0.07, 0.88);
    addRadialLeaves(group, green, 7, 0.045, 0.1, 0.62);
  } else if (crop === "Pumpkin") {
    addRadialLeaves(group, green, 7, 0.2, 0.06, 1.05);
    const pumpkinMaterial = new THREE.MeshStandardMaterial({ color: 0xe4852d, roughness: 0.78 });
    const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), pumpkinMaterial);
    pumpkin.scale.set(1.15, 0.78, 1.05);
    pumpkin.position.set(0.12, 0.11, 0.05);
    pumpkin.castShadow = true;
    group.add(pumpkin);
  } else if (crop === "Carrot") {
    const carrotMaterial = new THREE.MeshStandardMaterial({ color: 0xe8872d, roughness: 0.8 });
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.26, 8), carrotMaterial);
    root.position.y = 0.08;
    root.rotation.z = Math.PI;
    root.castShadow = true;
    group.add(root);
    addRadialLeaves(group, darkGreen, 5, 0.035, 0.22, 0.48);
  } else if (crop === "Broccoli") {
    group.add(stem(0.22, 0.05));
    const floretMaterial = new THREE.MeshStandardMaterial({ color: 0x3d7f42, roughness: 0.96 });
    for (const [x, y, z] of [[0, 0.25, 0], [-0.07, 0.22, 0.02], [0.07, 0.22, 0.02], [0.02, 0.22, -0.07]] as const) {
      const floret = new THREE.Mesh(new THREE.SphereGeometry(0.09, 9, 7), floretMaterial);
      floret.position.set(x, y, z);
      floret.castShadow = true;
      group.add(floret);
    }
  } else if (crop === "Raspberry") {
    group.add(stem(0.48, 0.018));
    addRadialLeaves(group, green, 5, 0.1, 0.3, 0.64);
    const berryMaterial = new THREE.MeshStandardMaterial({ color: 0xc93f5d, roughness: 0.9 });
    for (const [x, y, z] of [[-0.05, 0.23, 0.04], [0.05, 0.21, 0.04], [0, 0.18, -0.03]] as const) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), berryMaterial);
      berry.position.set(x, y, z);
      berry.castShadow = true;
      group.add(berry);
    }
  } else if (crop === "Blueberry") {
    group.add(stem(0.38, 0.018));
    addRadialLeaves(group, green, 6, 0.1, 0.25, 0.66);
    const berryMaterial = new THREE.MeshStandardMaterial({ color: 0x4f62a2, roughness: 0.82 });
    for (const [x, y, z] of [[-0.06, 0.19, 0.04], [0.05, 0.21, 0.05], [0.01, 0.16, -0.05]] as const) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), berryMaterial);
      berry.position.set(x, y, z);
      berry.castShadow = true;
      group.add(berry);
    }
  } else {
    group.add(stem(0.28, 0.018));
    addRadialLeaves(group, lightGreen, 7, 0.08, 0.17, 0.58);
  }

  group.scale.setScalar(size);
  return group;
}

function addBed(scene: THREE.Object3D, bed: PlannerBed, mode: ViewMode, activeArea?: PlannerPlantingArea) {
  const rect = bedRectCm(bed);
  const width = rect.w / 100;
  const depth = rect.h / 100;
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);
  const family = activeArea ? familyByCrop[activeArea.crop] ?? "Herb" : undefined;
  const soilColour = mode === "rotation" && family ? familyColours[family] ?? 0x8e704f : 0x8d6948;

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.14, depth),
    new THREE.MeshStandardMaterial({ color: soilColour, roughness: 1 }),
  );
  soil.position.set(x, 0.08, z);
  soil.receiveShadow = true;
  soil.castShadow = true;
  inspectable(soil, {
    title: bed.name,
    subtitle: activeArea ? `${activeArea.crop} · ${activeArea.variety}` : "Empty bed",
    lines: [
      { label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` },
      { label: "Crop family", value: family ?? "—" },
    ],
  });
  scene.add(soil);

  const timber = new THREE.MeshStandardMaterial({ color: 0x9f724c, roughness: 0.88 });
  const railH = 0.18;
  const railT = 0.08;
  const addRail = (w: number, d: number, px: number, pz: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, railH, d), timber);
    mesh.position.set(px, 0.11, pz);
    mesh.castShadow = true;
    scene.add(mesh);
  };
  addRail(width + railT * 2, railT, x, z - depth / 2);
  addRail(width + railT * 2, railT, x, z + depth / 2);
  addRail(railT, depth, x - width / 2, z);
  addRail(railT, depth, x + width / 2, z);
}

function addPath(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "path" }>) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const path = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.035, object.widthCm / 100),
    new THREE.MeshStandardMaterial({ color: 0xb8b6aa, roughness: 1 }),
  );
  path.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
  path.rotation.y = -Math.atan2(dz, dx);
  path.receiveShadow = true;
  inspectable(path, {
    title: object.label || "Path",
    lines: [
      { label: "Length", value: `${length.toFixed(1)} m` },
      { label: "Width", value: `${object.widthCm} cm` },
    ],
  });
  scene.add(path);
}

function addTrellis(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const height = object.heightCm / 100;
  const material = new THREE.MeshStandardMaterial({ color: 0x78644e, roughness: 0.86 });
  const postCount = Math.max(2, Math.ceil((length * 100) / Math.max(50, object.postSpacingCm)) + 1);
  const root = new THREE.Group();

  for (let index = 0; index < postCount; index += 1) {
    const t = postCount === 1 ? 0 : index / (postCount - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, height, 7), material);
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    post.castShadow = true;
    root.add(post);
  }

  for (const y of [height * 0.35, height * 0.68, height]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.025, 0.025), material);
    rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    rail.rotation.y = -Math.atan2(dz, dx);
    rail.castShadow = true;
    root.add(rail);
  }

  inspectable(root, {
    title: object.label || "Trellis",
    lines: [
      { label: "Length", value: `${length.toFixed(1)} m` },
      { label: "Height", value: `${height.toFixed(1)} m` },
    ],
  });
  scene.add(root);
}

function addTree(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>) {
  const root = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.11, 1.05, 9),
    new THREE.MeshStandardMaterial({ color: 0x76563c, roughness: 0.95 }),
  );
  trunk.position.y = 0.52;
  trunk.castShadow = true;
  root.add(trunk);

  const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x4e8750, roughness: 0.95 });
  const radius = clamp(object.diameterCm / 200, 0.28, 0.8);
  for (const [x, y, z, scale] of [[0, 1.2, 0, 1], [-0.3, 1.1, 0.08, 0.7], [0.28, 1.08, -0.1, 0.72]] as const) {
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(radius * scale, 12, 9), canopyMaterial);
    canopy.position.set(x, y, z);
    canopy.scale.y = 0.72;
    canopy.castShadow = true;
    root.add(canopy);
  }
  root.position.set(worldX(object.x), 0, worldZ(object.y));
  inspectable(root, {
    title: object.label || "Tree",
    lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }],
  });
  scene.add(root);
}

function addPlantingArea(scene: THREE.Object3D, bed: PlannerBed, area: PlannerPlantingArea) {
  const bedRect = bedRectCm(bed);
  const areaX = bedRect.x + (area.x / 100) * bedRect.w;
  const areaY = bedRect.y + (area.y / 100) * bedRect.h;
  const areaW = (area.w / 100) * bedRect.w;
  const areaH = (area.h / 100) * bedRect.h;
  const positions = plantPositionsForArea(area, areaW, areaH, 72);
  const size = clamp(area.spacingCm / 45, 0.55, 1.35);

  for (const position of positions) {
    const plant = createPlant(area.crop, size);
    plant.position.set(worldX(areaX + position.x), 0.16, worldZ(areaY + position.y));
    plant.rotation.y = (position.rotation * Math.PI) / 180;
    inspectable(plant, {
      title: area.crop,
      subtitle: area.variety,
      lines: [
        { label: "Bed", value: bed.name },
        { label: "Spacing", value: `${area.spacingCm} cm` },
        { label: "Pattern", value: area.pattern },
        { label: "Planned count", value: String(area.count) },
      ],
    });
    scene.add(plant);
  }
}

function addRow(scene: THREE.Object3D, row: PlannerPlan["rows"][number]) {
  const total = Math.min(48, Math.max(1, row.count));
  const size = clamp(row.spacingCm / 45, 0.55, 1.25);
  for (let index = 0; index < total; index += 1) {
    const t = total === 1 ? 0.5 : index / (total - 1);
    const plant = createPlant(row.crop, size);
    plant.position.set(
      worldX(row.x1 + (row.x2 - row.x1) * t),
      0.16,
      worldZ(row.y1 + (row.y2 - row.y1) * t),
    );
    inspectable(plant, {
      title: row.crop,
      subtitle: row.variety,
      lines: [
        { label: "Spacing", value: `${row.spacingCm} cm` },
        { label: "Row plants", value: String(row.count) },
      ],
    });
    scene.add(plant);
  }
}

function addFixedGardenFeatures(scene: THREE.Object3D) {
  // These two measured overlays are still hard-coded in the 2D planner rather than PlannerPlan.
  // Mirror their exact 2D percentages here so the garden footprint stays visually consistent.
  const berry = {
    x: GARDEN_WIDTH_CM * 0.07,
    y: GARDEN_HEIGHT_CM * 0.028,
    w: GARDEN_WIDTH_CM * 0.86,
    h: GARDEN_HEIGHT_CM * 0.085,
  };
  const berryBed = new THREE.Mesh(
    new THREE.BoxGeometry(berry.w / 100, 0.055, berry.h / 100),
    new THREE.MeshStandardMaterial({ color: 0x718b5d, roughness: 1, transparent: true, opacity: 0.72 }),
  );
  berryBed.position.set(worldX(berry.x + berry.w / 2), 0.035, worldZ(berry.y + berry.h / 2));
  berryBed.receiveShadow = true;
  inspectable(berryBed, {
    title: "Berry / cane strip",
    subtitle: "Fixed garden feature",
    lines: [{ label: "Size", value: `${(berry.w / 100).toFixed(1)} × ${(berry.h / 100).toFixed(1)} m` }],
  });
  scene.add(berryBed);

  const caneCrops = ["Raspberry", "Raspberry", "Raspberry", "Raspberry"];
  caneCrops.forEach((crop, index) => {
    const plant = createPlant(crop, 0.76);
    const t = (index + 1) / (caneCrops.length + 1);
    plant.position.set(worldX(berry.x + berry.w * t), 0.12, worldZ(berry.y + berry.h / 2));
    inspectable(plant, {
      title: index === 3 ? "Blackberry" : "Raspberry",
      subtitle: "Berry / cane strip",
      lines: [],
    });
    scene.add(plant);
  });

  const north = {
    x: GARDEN_WIDTH_CM * 0.12,
    y: GARDEN_HEIGHT_CM * 0.12,
    w: GARDEN_WIDTH_CM * 0.34,
    h: GARDEN_HEIGHT_CM * 0.30,
  };
  const material = new THREE.MeshStandardMaterial({ color: 0x8e775e, roughness: 0.95, transparent: true, opacity: 0.7 });
  const x = worldX(north.x + north.w / 2);
  const z = worldZ(north.y + north.h / 2);
  const w = north.w / 100;
  const d = north.h / 100;
  const thickness = 0.025;
  const addRail = (rw: number, rd: number, rx: number, rz: number) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.025, rd), material);
    rail.position.set(rx, 0.035, rz);
    scene.add(rail);
  };
  addRail(w, thickness, x, z - d / 2);
  addRail(w, thickness, x, z + d / 2);
  addRail(thickness, d, x - w / 2, z);
  addRail(thickness, d, x + w / 2, z);
}

function addTextLabel(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "text" }>) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.roundRect(8, 22, 496, 84, 18);
  context.fill();
  context.fillStyle = "#344a41";
  context.font = "700 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(object.text, 256, 64, 470);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  const scale = Math.max(0.55, object.fontSize / 13);
  sprite.scale.set(2.4 * scale, 0.6 * scale, 1);
  sprite.position.set(worldX(object.x), 0.42, worldZ(object.y));
  inspectable(sprite, { title: object.text, subtitle: "Garden label", lines: [] });
  scene.add(sprite);
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
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

function readLocalPlan(gardenId: string) { return readPlanFromStorage(gardenLocalPlanKey(gardenId)); }
function readLivePlan(gardenId: string) { return readPlanFromStorage(gardenLivePlanKey(gardenId)); }

export function GardenWebGL() {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [source, setSource] = useState("Loading garden…");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("garden");
  const [sunHour, setSunHour] = useState(13);
  const [inspector, setInspector] = useState<InspectorItem>({
    title: "3D Garden",
    subtitle: "Click a bed, plant, path, trellis or tree",
    lines: [],
  });

  useEffect(() => {
    let cancelled = false;
    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    const selectedGardenId = fromQuery || readActiveGardenId();
    setGardenId(selectedGardenId);
    async function load() {
      const live = readLivePlan(selectedGardenId);
      if (live) {
        if (!cancelled) { setPlan(live); setSource("Live 2D planner"); }
        return;
      }
      try {
        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selectedGardenId)}`, { cache: "no-store" });
        const data = (await response.json()) as GardenPlanApiResponse;
        if (response.ok && data.ok && data.plan) {
          if (!cancelled) { setPlan(data.plan); setSource("Live D1 garden"); }
          return;
        }
      } catch {
        // Fall through to local plan.
      }
      const local = readLocalPlan(selectedGardenId);
      if (!cancelled && local) {
        setPlan(local);
        setSource("Local planner copy");
      } else if (!cancelled) {
        setPlan({ beds: [], plantingAreas: [], rows: [], objects: [] });
        setSource("Empty garden");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // Keep a separate 3D window synchronized with unsaved edits in the planner.
  useEffect(() => {
    let timer: number | null = null;
    let pending: PlannerPlan | null = null;
    const applyNow = () => {
      timer = null;
      if (!pending) return;
      setPlan(pending);
      setSource("Live 2D planner");
      pending = null;
    };
    const schedulePlan = (candidate: PlannerPlan | null) => {
      if (!candidate) return;
      pending = candidate;
      if (timer === null) timer = window.setTimeout(applyNow, 70);
    };
    const liveKey = gardenLivePlanKey(gardenId);
    const onStorage = (event: StorageEvent) => {
      if (event.key === liveKey) schedulePlan(readLivePlan(gardenId));
    };
    const onLivePlan = (event: Event) => {
      const detail = (event as CustomEvent<{ gardenId?: string; plan?: PlannerPlan }>).detail;
      if (detail?.gardenId === gardenId && detail.plan) schedulePlan(detail.plan);
      else schedulePlan(readLivePlan(gardenId));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
    };
  }, [gardenId]);

  const activeByBed = useMemo(() => {
    const map = new Map<number, PlannerPlantingArea>();
    for (const area of plan?.plantingAreas ?? []) {
      if (!map.has(area.bedId)) map.set(area.bedId, area);
    }
    return map;
  }, [plan]);

  // Create the WebGL renderer once. Live plan edits update only the scene content group,
  // preserving the camera, controls and GPU context while the user drags in the 2D planner.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      setRenderError(null);
    } catch {
      setRenderError("WebGL could not start in this browser. Try reloading the page or enabling hardware acceleration.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5df);
    scene.fog = new THREE.Fog(0xdce5df, 18, 30);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(8.2, 9.2, 11.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 3.5;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.48;

    scene.add(new THREE.HemisphereLight(0xf6fbf7, 0x786a56, 1.35));
    const sun = new THREE.DirectionalLight(0xfff4d8, 2.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x8da56f, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(10.8, 54, 0x93a29a, 0xb9c4bd);
    grid.position.y = 0.005;
    (grid.material as THREE.Material).opacity = 0.28;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const content = new THREE.Group();
    scene.add(content);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          if (object.userData.inspect) {
            setInspector(object.userData.inspect as InspectorItem);
            return;
          }
          object = object.parent;
        }
      }
    };
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    runtimeRef.current = { camera, controls, renderer, sun, scene, content };
    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      runtimeRef.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !plan) return;
    const content = runtime.content;
    disposeScene(content);
    content.clear();

    addFixedGardenFeatures(content);
    for (const bed of plan.beds) addBed(content, bed, viewMode, activeByBed.get(bed.id));
    for (const object of plan.objects) {
      if (object.type === "path") addPath(content, object);
      if (object.type === "trellis") addTrellis(content, object);
      if (object.type === "tree") addTree(content, object);
      if (object.type === "text") addTextLabel(content, object);
    }
    for (const area of plan.plantingAreas) {
      const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
      if (bed) addPlantingArea(content, bed, area);
    }
    for (const row of plan.rows) addRow(content, row);
  }, [plan, viewMode, activeByBed]);

  useEffect(() => {
    const sun = runtimeRef.current?.sun;
    if (!sun) return;
    const progress = (sunHour - 6) / 12;
    const angle = progress * Math.PI;
    sun.position.set(Math.cos(angle) * 8, Math.max(1.8, Math.sin(angle) * 9), -3.5 + Math.sin(angle) * 4);
    sun.target.position.set(0, 0, 0);
  }, [sunHour, plan, viewMode]);

  const resetCamera = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(8.2, 9.2, 11.5);
    runtime.controls.target.set(0, 0.2, 0);
    runtime.controls.update();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <a href={`/?gardenId=${encodeURIComponent(gardenId)}`} className={styles.back}>← 2D Plan</a>
          <div>
            <strong>Blenheim Garden</strong>
            <span>Live WebGL garden twin</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.source}>{source}</span>
          <button type="button" onClick={resetCamera}>Fit garden</button>
        </div>
      </header>

      <section className={styles.toolbar}>
        <div className={styles.segmented} aria-label="3D view mode">
          <button type="button" className={viewMode === "garden" ? styles.active : ""} onClick={() => setViewMode("garden")}>Garden</button>
          <button type="button" className={viewMode === "rotation" ? styles.active : ""} onClick={() => setViewMode("rotation")}>Rotation</button>
        </div>
        <label className={styles.sunControl}>
          <span>☀ Sun {String(sunHour).padStart(2, "0")}:00</span>
          <input type="range" min="6" max="18" step="1" value={sunHour} onChange={(event) => setSunHour(Number(event.target.value))} />
        </label>
        <span className={styles.hint}>Drag to orbit · right-drag to pan · wheel to zoom · click to inspect</span>
      </section>

      <section className={styles.workspace}>
        <div ref={mountRef} className={styles.viewport}>
          {renderError && <div className={styles.loading}>{renderError}</div>}
          {!renderError && !plan && <div className={styles.loading}>{source}</div>}
        </div>
        <aside className={styles.inspector}>
          <p className={styles.eyebrow}>INSPECTOR</p>
          <h2>{inspector.title}</h2>
          {inspector.subtitle && <p className={styles.subtitle}>{inspector.subtitle}</p>}
          <dl>
            {inspector.lines.map((line) => (
              <div key={`${line.label}-${line.value}`}>
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.legend}>
            <strong>Live garden mirror</strong>
            <p>Mirrors the live 2D geometry without resetting your 3D camera, including the fixed berry/cane and north-zone layout. Save still controls D1 persistence.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
