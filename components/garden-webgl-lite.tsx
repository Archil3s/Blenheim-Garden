"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GardenPlanApiResponse, PlannerBed, PlannerPlan, PlannerPlantingArea } from "@/lib/garden/planner-plan";
import { plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";
import {
  DEFAULT_GARDEN_ID,
  gardenLivePlanKey,
  gardenLocalPlanKey,
  readActiveGardenId,
} from "@/lib/garden/active-garden";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;
const MAX_AREA_PLANTS = 30;
const MAX_ROW_PLANTS = 24;

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  content: THREE.Group;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

function cropColour(crop: string) {
  const colours: Record<string, number> = {
    Tomato: 0x4d8c4a,
    Strawberry: 0x5f9e55,
    Bean: 0x4b9356,
    Lettuce: 0x78a957,
    Pumpkin: 0x5f9952,
    Carrot: 0x5d9a50,
    Broccoli: 0x3f7f47,
    Raspberry: 0x4c8c4d,
    Blueberry: 0x527e55,
    Herbs: 0x6f9f59,
  };
  return colours[crop] ?? 0x5b9653;
}

function readStoredPlan(key: string): PlannerPlan | null {
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

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    }
  });
}

function addBed(scene: THREE.Object3D, bed: PlannerBed) {
  const rect = bedRectCm(bed);
  const width = Math.max(0.05, rect.w / 100);
  const depth = Math.max(0.05, rect.h / 100);
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.12, depth),
    new THREE.MeshStandardMaterial({ color: 0x8c6949, roughness: 1 }),
  );
  soil.position.set(x, 0.06, z);
  scene.add(soil);

  const timber = new THREE.MeshStandardMaterial({ color: 0x9b724e, roughness: 1 });
  const railHeight = 0.13;
  const railThickness = 0.055;
  const rails = [
    new THREE.Mesh(new THREE.BoxGeometry(width + railThickness, railHeight, railThickness), timber.clone()),
    new THREE.Mesh(new THREE.BoxGeometry(width + railThickness, railHeight, railThickness), timber.clone()),
    new THREE.Mesh(new THREE.BoxGeometry(railThickness, railHeight, depth), timber.clone()),
    new THREE.Mesh(new THREE.BoxGeometry(railThickness, railHeight, depth), timber.clone()),
  ];
  rails[0].position.set(x, 0.08, z - depth / 2);
  rails[1].position.set(x, 0.08, z + depth / 2);
  rails[2].position.set(x - width / 2, 0.08, z);
  rails[3].position.set(x + width / 2, 0.08, z);
  for (const rail of rails) scene.add(rail);
  timber.dispose();
}

function addPlantArea(scene: THREE.Object3D, bed: PlannerBed, area: PlannerPlantingArea) {
  const rect = bedRectCm(bed);
  const areaX = rect.x + (area.x / 100) * rect.w;
  const areaY = rect.y + (area.y / 100) * rect.h;
  const areaW = (area.w / 100) * rect.w;
  const areaH = (area.h / 100) * rect.h;
  const positions = plantPositionsForArea(area, areaW, areaH, MAX_AREA_PLANTS);
  if (!positions.length) return;

  const geometry = new THREE.ConeGeometry(0.085, 0.28, 5);
  geometry.translate(0, 0.14, 0);
  const material = new THREE.MeshStandardMaterial({ color: cropColour(area.crop), roughness: 0.95 });
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const size = clamp(area.spacingCm / 42, 0.55, 1.3);

  positions.forEach((plant, index) => {
    position.set(worldX(areaX + plant.x), 0.13, worldZ(areaY + plant.y));
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (plant.rotation * Math.PI) / 180);
    scale.set(size, size, size);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

function addRow(scene: THREE.Object3D, row: PlannerPlan["rows"][number]) {
  const total = Math.min(MAX_ROW_PLANTS, Math.max(1, row.count));
  const geometry = new THREE.ConeGeometry(0.08, 0.26, 5);
  geometry.translate(0, 0.13, 0);
  const material = new THREE.MeshStandardMaterial({ color: cropColour(row.crop), roughness: 0.95 });
  const mesh = new THREE.InstancedMesh(geometry, material, total);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const size = clamp(row.spacingCm / 42, 0.55, 1.25);
  const scale = new THREE.Vector3(size, size, size);

  for (let index = 0; index < total; index += 1) {
    const t = total === 1 ? 0.5 : index / (total - 1);
    position.set(
      worldX(row.x1 + (row.x2 - row.x1) * t),
      0.13,
      worldZ(row.y1 + (row.y2 - row.y1) * t),
    );
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

function addPath(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "path" }>) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.02, Math.hypot(dx, dz));
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.025, Math.max(0.04, object.widthCm / 100)),
    new THREE.MeshStandardMaterial({ color: 0xb8b5a8, roughness: 1 }),
  );
  mesh.position.set((x1 + x2) / 2, 0.015, (z1 + z2) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  scene.add(mesh);
}

function addTrellis(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.02, Math.hypot(dx, dz));
  const height = clamp(object.heightCm / 100, 0.3, 3.2);
  const postCount = Math.min(10, Math.max(2, Math.ceil((length * 100) / Math.max(60, object.postSpacingCm)) + 1));
  const material = new THREE.MeshStandardMaterial({ color: 0x735f4a, roughness: 1 });

  for (let index = 0; index < postCount; index += 1) {
    const t = index / (postCount - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, height, 6), material.clone());
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    scene.add(post);
  }
  for (const y of [height * 0.5, height]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.022, 0.022), material.clone());
    rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    rail.rotation.y = -Math.atan2(dz, dx);
    scene.add(rail);
  }
  material.dispose();
}

function addTree(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>) {
  const radius = clamp(object.diameterCm / 220, 0.25, 0.8);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.1, 0.9, 7),
    new THREE.MeshStandardMaterial({ color: 0x71523a, roughness: 1 }),
  );
  trunk.position.set(worldX(object.x), 0.45, worldZ(object.y));
  scene.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    new THREE.MeshStandardMaterial({ color: 0x4f8750, roughness: 1 }),
  );
  canopy.position.set(worldX(object.x), 1.15, worldZ(object.y));
  canopy.scale.y = 0.75;
  scene.add(canopy);
}

function populateScene(content: THREE.Group, plan: PlannerPlan) {
  disposeObject(content);
  content.clear();

  for (const bed of plan.beds) addBed(content, bed);
  for (const object of plan.objects) {
    if (object.type === "path") addPath(content, object);
    if (object.type === "trellis") addTrellis(content, object);
    if (object.type === "tree") addTree(content, object);
  }
  for (const area of plan.plantingAreas) {
    const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
    if (bed) addPlantArea(content, bed, area);
  }
  for (const row of plan.rows) addRow(content, row);
}

export function GardenWebGLLite() {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [source, setSource] = useState("Loading garden…");
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    const selectedGardenId = fromQuery || readActiveGardenId();
    setGardenId(selectedGardenId);

    const useStored = () => {
      const live = readStoredPlan(gardenLivePlanKey(selectedGardenId));
      if (live) {
        setPlan(live);
        setSource("Live planner copy");
        return true;
      }
      const local = readStoredPlan(gardenLocalPlanKey(selectedGardenId));
      if (local) {
        setPlan(local);
        setSource("Local planner copy");
        return true;
      }
      return false;
    };

    async function load() {
      if (useStored()) return;
      try {
        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selectedGardenId)}`, { cache: "no-store" });
        const data = (await response.json()) as GardenPlanApiResponse;
        if (response.ok && data.ok && data.plan) {
          if (!cancelled) {
            setPlan(data.plan);
            setSource("Saved garden");
          }
          return;
        }
      } catch {
        // Fall through to an empty scene.
      }
      if (!cancelled) {
        setPlan({ beds: [], plantingAreas: [], rows: [], objects: [] });
        setSource("Empty garden");
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === gardenLivePlanKey(selectedGardenId) || event.key === gardenLocalPlanKey(selectedGardenId)) {
        useStored();
      }
    };
    window.addEventListener("storage", onStorage);
    void load();
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
      setRenderError(null);
    } catch {
      setRenderError("WebGL could not start. Try reloading or enabling browser hardware acceleration.");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    mount.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfe8e1);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x71634f, 1.8));
    const sun = new THREE.DirectionalLight(0xfff4d4, 2.0);
    sun.position.set(6, 9, 5);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 50);
    camera.position.set(8.4, 9.4, 11.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.25, 0);
    controls.minDistance = 3.5;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.49;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x8fa872, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(10.8, 36, 0x8e9d94, 0xb9c5bd);
    grid.position.y = 0.004;
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.opacity = 0.23;
    gridMaterial.transparent = true;
    scene.add(grid);

    const content = new THREE.Group();
    scene.add(content);
    runtimeRef.current = { renderer, scene, camera, controls, content };

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

    let frame = 0;
    const draw = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      runtimeRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !plan) return;
    populateScene(runtime.content, plan);
  }, [plan]);

  const fitGarden = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(8.4, 9.4, 11.8);
    runtime.controls.target.set(0, 0.25, 0);
    runtime.controls.update();
  };

  return (
    <main style={{ height: "100dvh", minHeight: 560, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden", background: "#dfe8e1", color: "#26362f", fontFamily: "Arial, sans-serif" }}>
      <header style={{ minHeight: 58, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,.95)", borderBottom: "1px solid #ccd7d0", zIndex: 2 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <a href={`/?gardenId=${encodeURIComponent(gardenId)}`} style={{ color: "#176f56", textDecoration: "none", fontWeight: 800, whiteSpace: "nowrap" }}>← 2D Plan</a>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 16 }}>Blenheim Garden 3D</strong>
            <span style={{ display: "block", fontSize: 12, color: "#66766e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source} · performance-safe renderer</span>
          </div>
        </div>
        <button type="button" onClick={fitGarden} style={{ border: "1px solid #b8c8bf", background: "white", color: "#27453a", borderRadius: 8, padding: "8px 11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Fit garden</button>
      </header>

      <section style={{ position: "relative", minHeight: 0 }}>
        <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
        {renderError && (
          <div style={{ position: "absolute", inset: 20, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <div style={{ maxWidth: 520, padding: 20, borderRadius: 12, background: "rgba(255,255,255,.95)", border: "1px solid #ccd7d0", textAlign: "center", lineHeight: 1.5 }}>{renderError}</div>
          </div>
        )}
        {!renderError && !plan && (
          <div style={{ position: "absolute", left: 16, bottom: 16, padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,.9)", border: "1px solid #ccd7d0", fontSize: 13 }}>{source}</div>
        )}
        <div style={{ position: "absolute", right: 14, bottom: 14, padding: "8px 10px", borderRadius: 9, background: "rgba(255,255,255,.84)", border: "1px solid rgba(180,196,186,.9)", fontSize: 12, color: "#54655d", pointerEvents: "none" }}>Drag: orbit · right-drag: pan · wheel: zoom</div>
      </section>
    </main>
  );
}
