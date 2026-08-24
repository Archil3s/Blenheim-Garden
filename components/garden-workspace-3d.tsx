"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PlannerBed, PlannerPlan, PlannerPlantingArea } from "@/lib/garden/planner-plan";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

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
  render: () => void;
};

type GardenWorkspace3DProps = {
  plan: PlannerPlan;
};

const DEFAULT_INSPECTOR: InspectItem = {
  title: "3D garden",
  subtitle: "Tap a bed, crop, path, trellis or tree.",
  lines: [],
};

const C = {
  soil: 0x684632,
  timber: 0xa87950,
  timberDark: 0x765136,
  grass: 0x789b62,
  grassDark: 0x668951,
  leaf: 0x4d8b4d,
  leafLight: 0x72ac5d,
  leafDark: 0x356d3d,
  stem: 0x5f8f4e,
  tomato: 0xd84d3f,
  strawberry: 0xd9414f,
  pumpkin: 0xe58a2d,
  carrot: 0xe78029,
  blueberry: 0x5268a9,
  raspberry: 0xc83e5c,
  broccoli: 0x3e7841,
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

function mat(color: number, roughness = 0.88) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function markInspectable(root: THREE.Object3D, item: InspectItem) {
  root.traverse((object) => {
    object.userData.inspect = item;
    object.userData.selectionRoot = root;
  });
}

function dispose(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function clearGroup(group: THREE.Group) {
  dispose(group);
  group.clear();
}

function stem(height: number, radius = 0.018) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, height, 6), mat(C.stem));
  mesh.position.y = height / 2;
  return mesh;
}

function leaf(color = C.leaf, scale = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11 * scale, 6, 4), mat(color));
  mesh.scale.set(1.55, 0.27, 0.82);
  return mesh;
}

function radialLeaves(group: THREE.Group, count: number, radius: number, y: number, scale = 1, color = C.leaf) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const item = leaf(color, scale);
    item.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    item.rotation.y = -angle;
    item.rotation.z = 0.15;
    group.add(item);
  }
}

function fruit(color: number, radius: number, x: number, y: number, z: number, scale?: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 7, 5), mat(color, 0.72));
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  return mesh;
}

function cropKind(crop: string) {
  const value = crop.toLowerCase();
  if (value.includes("tomato")) return "tomato";
  if (value.includes("strawber")) return "strawberry";
  if (value.includes("blueber")) return "blueberry";
  if (value.includes("raspber")) return "raspberry";
  if (value.includes("pumpkin") || value.includes("squash")) return "pumpkin";
  if (value.includes("lettuce")) return "lettuce";
  if (value.includes("broccoli") || value.includes("cauliflower")) return "broccoli";
  if (value.includes("bean") || value.includes("pea")) return "bean";
  if (value.includes("carrot")) return "carrot";
  if (value.includes("chilli") || value.includes("pepper")) return "pepper";
  if (value.includes("corn") || value.includes("maize")) return "corn";
  if (value.includes("basil") || value.includes("herb") || value.includes("thyme") || value.includes("parsley")) return "herb";
  return "leafy";
}

function createPlant(crop: string) {
  const root = new THREE.Group();
  const kind = cropKind(crop);

  if (kind === "tomato") {
    root.add(stem(0.54, 0.022));
    radialLeaves(root, 5, 0.12, 0.27, 0.82);
    radialLeaves(root, 3, 0.08, 0.42, 0.68, C.leafDark);
    root.add(fruit(C.tomato, 0.05, -0.07, 0.28, 0.05));
    root.add(fruit(C.tomato, 0.046, 0.07, 0.32, 0.04));
  } else if (kind === "strawberry") {
    radialLeaves(root, 6, 0.08, 0.08, 0.68);
    root.add(fruit(C.strawberry, 0.055, 0.07, 0.065, 0.035, [0.82, 1.2, 0.82]));
  } else if (kind === "blueberry" || kind === "raspberry") {
    root.add(stem(0.42, 0.018));
    radialLeaves(root, 5, 0.1, 0.27, 0.7);
    const berry = kind === "blueberry" ? C.blueberry : C.raspberry;
    root.add(fruit(berry, 0.038, -0.05, 0.22, 0.04));
    root.add(fruit(berry, 0.038, 0.05, 0.25, 0.03));
  } else if (kind === "pumpkin") {
    radialLeaves(root, 6, 0.16, 0.08, 1.04, C.leafDark);
    root.add(fruit(C.pumpkin, 0.12, 0.13, 0.1, 0.04, [1.2, 0.78, 1.08]));
  } else if (kind === "lettuce") {
    radialLeaves(root, 8, 0.095, 0.06, 1.05, C.leafLight);
    radialLeaves(root, 5, 0.045, 0.095, 0.74);
  } else if (kind === "broccoli") {
    root.add(stem(0.23, 0.033));
    radialLeaves(root, 4, 0.1, 0.12, 0.78, C.leafDark);
    root.add(fruit(C.broccoli, 0.08, 0, 0.27, 0));
    root.add(fruit(C.broccoli, 0.055, -0.06, 0.245, 0.02));
    root.add(fruit(C.broccoli, 0.055, 0.06, 0.245, 0.02));
  } else if (kind === "bean") {
    root.add(stem(0.58, 0.016));
    radialLeaves(root, 5, 0.1, 0.31, 0.72, C.leafLight);
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.12, 3, 5), mat(0x68a54f));
    pod.rotation.z = 0.3;
    pod.position.set(0.08, 0.31, 0.03);
    root.add(pod);
  } else if (kind === "carrot") {
    for (let i = 0; i < 5; i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.22, 5), mat(C.leafDark));
      const angle = (i / 5) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.03, 0.12, Math.sin(angle) * 0.03);
      root.add(blade);
    }
    const shoulder = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 7), mat(C.carrot));
    shoulder.position.y = 0.02;
    shoulder.rotation.z = Math.PI;
    root.add(shoulder);
  } else if (kind === "corn") {
    root.add(stem(0.72, 0.025));
    for (let i = 0; i < 4; i += 1) {
      const item = leaf(0x6f9d43, 1.1);
      item.position.y = 0.18 + i * 0.12;
      item.rotation.z = i % 2 ? -0.48 : 0.48;
      root.add(item);
    }
  } else if (kind === "pepper") {
    root.add(stem(0.4, 0.02));
    radialLeaves(root, 5, 0.1, 0.25, 0.75, C.leafDark);
    const pepper = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.09, 3, 6), mat(0xc94134));
    pepper.position.set(0.08, 0.22, 0.03);
    root.add(pepper);
  } else if (kind === "herb") {
    root.add(stem(0.28, 0.014));
    radialLeaves(root, 6, 0.08, 0.16, 0.55, C.leafLight);
  } else {
    radialLeaves(root, 6, 0.09, 0.08, 0.92, C.leafLight);
  }

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

function addBed(group: THREE.Group, bed: PlannerBed, active?: PlannerPlantingArea) {
  const rect = bedRectCm(bed);
  const width = rect.w / 100;
  const depth = rect.h / 100;
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);
  const root = new THREE.Group();
  const wallHeight = 0.2;
  const rail = 0.08;

  const soil = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.05, width - 0.1), 0.13, Math.max(0.05, depth - 0.1)), mat(C.soil));
  soil.position.set(x, 0.15, z);
  root.add(soil);

  const rails: Array<[number, number, number, number]> = [
    [width + rail * 2, rail, x, z - depth / 2],
    [width + rail * 2, rail, x, z + depth / 2],
    [rail, depth, x - width / 2, z],
    [rail, depth, x + width / 2, z],
  ];
  rails.forEach(([w, d, px, pz], index) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), mat(index % 2 ? C.timber : C.timberDark));
    mesh.position.set(px, wallHeight / 2, pz);
    root.add(mesh);
  });

  markInspectable(root, {
    title: bed.name,
    subtitle: active ? `${active.crop}${active.variety ? ` · ${active.variety}` : ""}` : "Raised garden bed",
    lines: [
      { label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` },
      ...(active ? [{ label: "Spacing", value: `${active.spacingCm} cm` }] : []),
    ],
  });
  group.add(root);
}

function addPlantingArea(group: THREE.Group, plan: PlannerPlan, area: PlannerPlantingArea) {
  const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
  if (!bed) return;
  const rect = bedRectCm(bed);
  const ax = rect.x + (area.x / 100) * rect.w;
  const ay = rect.y + (area.y / 100) * rect.h;
  const aw = (area.w / 100) * rect.w;
  const ah = (area.h / 100) * rect.h;
  const root = new THREE.Group();

  for (const position of representativePositions(aw, ah, area.count, 6)) {
    const plant = createPlant(area.crop);
    plant.position.set(worldX(ax + aw * position.x), 0.22, worldZ(ay + ah * position.y));
    const scale = Math.max(0.72, Math.min(1.1, (area.iconSize || 16) / 16));
    plant.scale.setScalar(scale);
    root.add(plant);
  }

  markInspectable(root, {
    title: area.crop,
    subtitle: area.variety || "Planting area",
    lines: [
      { label: "Bed", value: bed.name },
      { label: "Spacing", value: `${area.spacingCm} cm` },
      { label: "Planned", value: String(area.count) },
    ],
  });
  group.add(root);
}

function addPath(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "path" }>) {
  const x1 = worldX(object.x1), z1 = worldZ(object.y1), x2 = worldX(object.x2), z2 = worldZ(object.y2);
  const dx = x2 - x1, dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const width = Math.max(0.16, object.widthCm / 100);
  const root = new THREE.Group();
  const path = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, width), mat(0xb4ad9b));
  path.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
  path.rotation.y = -Math.atan2(dz, dx);
  root.add(path);
  markInspectable(root, { title: object.label || "Path", lines: [{ label: "Width", value: `${object.widthCm} cm` }] });
  group.add(root);
}

function addTrellis(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>) {
  const x1 = worldX(object.x1), z1 = worldZ(object.y1), x2 = worldX(object.x2), z2 = worldZ(object.y2);
  const dx = x2 - x1, dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const height = Math.max(0.45, object.heightCm / 100);
  const root = new THREE.Group();
  const posts = Math.max(2, Math.min(8, Math.ceil((length * 100) / Math.max(50, object.postSpacingCm)) + 1));
  for (let i = 0; i < posts; i += 1) {
    const t = i / Math.max(1, posts - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, height, 6), mat(0x74583f));
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    root.add(post);
  }
  for (const y of [height * 0.45, height * 0.82]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.018, 0.018), mat(0x7b8580));
    rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    rail.rotation.y = -Math.atan2(dz, dx);
    root.add(rail);
  }
  markInspectable(root, { title: object.label || "Trellis", lines: [{ label: "Height", value: `${height.toFixed(1)} m` }] });
  group.add(root);
}

function addTree(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>) {
  const root = new THREE.Group();
  const x = worldX(object.x), z = worldZ(object.y);
  const radius = Math.min(0.9, Math.max(0.3, object.diameterCm / 200));
  const trunkHeight = 0.72;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, trunkHeight, 7), mat(0x755137));
  trunk.position.set(x, trunkHeight / 2, z);
  root.add(trunk);
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.68, 7, 5), mat(0x477a48));
    crown.scale.y = 0.78;
    crown.position.set(x + Math.cos(angle) * radius * 0.25, trunkHeight + radius * 0.48, z + Math.sin(angle) * radius * 0.25);
    root.add(crown);
  }
  markInspectable(root, { title: object.label || "Tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  group.add(root);
}

function buildGarden(group: THREE.Group, plan: PlannerPlan) {
  clearGroup(group);
  plan.beds.forEach((bed) => addBed(group, bed, plan.plantingAreas.find((area) => area.bedId === bed.id)));
  plan.plantingAreas.forEach((area) => addPlantingArea(group, plan, area));

  for (const row of plan.rows) {
    const root = new THREE.Group();
    const count = Math.min(7, Math.max(1, row.count || 1));
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const plant = createPlant(row.crop);
      plant.scale.setScalar(0.8);
      plant.position.set(worldX(row.x1 + (row.x2 - row.x1) * t), 0.03, worldZ(row.y1 + (row.y2 - row.y1) * t));
      root.add(plant);
    }
    markInspectable(root, { title: row.crop, subtitle: row.variety, lines: [{ label: "Spacing", value: `${row.spacingCm} cm` }] });
    group.add(root);
  }

  for (const object of plan.objects) {
    if (object.type === "path") addPath(group, object);
    if (object.type === "trellis") addTrellis(group, object);
    if (object.type === "tree") addTree(group, object);
  }
}

export function GardenWorkspace3D({ plan }: GardenWorkspace3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const selectionRef = useRef<THREE.BoxHelper | null>(null);
  const [inspector, setInspector] = useState<InspectItem>(DEFAULT_INSPECTOR);
  const [renderError, setRenderError] = useState<string | null>(null);

  const clearSelection = () => {
    const helper = selectionRef.current;
    if (helper) {
      helper.removeFromParent();
      helper.geometry.dispose();
      helper.material.dispose();
      selectionRef.current = null;
    }
  };

  const present = (runtime: Runtime) => {
    runtime.render();
    requestAnimationFrame(runtime.render);
  };

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection();
    buildGarden(runtime.content, plan);
    setInspector(DEFAULT_INSPECTOR);
    present(runtime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(1);
    } catch {
      setRenderError("3D could not start on this device.");
      return;
    }

    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd3ca);
    scene.fog = new THREE.Fog(0xbfd3ca, 18, 30);
    scene.add(new THREE.HemisphereLight(0xf8fff8, 0x665646, 1.55));
    const sun = new THREE.DirectionalLight(0xfff1d5, 1.55);
    sun.position.set(-5, 9, 6);
    scene.add(sun);

    const outer = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), mat(C.grassDark));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.035;
    scene.add(outer);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9.3, 11.1), mat(C.grass));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    scene.add(ground);

    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 60);
    camera.position.set(8.4, 8.7, 11.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.target.set(0, 0.25, 0);
    controls.minDistance = 4;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI * 0.49;

    const content = new THREE.Group();
    scene.add(content);
    const render = () => renderer.render(scene, camera);
    const runtime: Runtime = { scene, content, camera, controls, renderer, render };
    runtimeRef.current = runtime;
    buildGarden(content, plan);
    controls.addEventListener("change", render);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let start: { id: number; x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (event.isPrimary) start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const pointerUp = (event: PointerEvent) => {
      const initial = start;
      start = null;
      if (!initial || initial.id !== event.pointerId || Math.hypot(event.clientX - initial.x, event.clientY - initial.y) > 9) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      for (const hit of hits) {
        let current: THREE.Object3D | null = hit.object;
        while (current) {
          const item = current.userData.inspect as InspectItem | undefined;
          const root = current.userData.selectionRoot as THREE.Object3D | undefined;
          if (item && root) {
            clearSelection();
            const helper = new THREE.BoxHelper(root, 0xffc44d);
            helper.material.depthTest = false;
            helper.renderOrder = 50;
            scene.add(helper);
            selectionRef.current = helper;
            setInspector(item);
            present(runtime);
            return;
          }
          current = current.parent;
        }
      }
      clearSelection();
      setInspector(DEFAULT_INSPECTOR);
      present(runtime);
    };

    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      present(runtime);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      controls.removeEventListener("change", render);
      controls.dispose();
      clearSelection();
      clearGroup(content);
      renderer.dispose();
      runtimeRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPerspective = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(8.4, 8.7, 11.8);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(0, 0.25, 0);
    runtime.controls.update();
    present(runtime);
  };

  const setTop = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(0.01, 15.8, 0.01);
    runtime.camera.up.set(0, 0, -1);
    runtime.controls.target.set(0, 0, 0);
    runtime.controls.update();
    present(runtime);
  };

  return (
    <div className="gv-3d-workspace" data-testid="inline-3d-workspace">
      <div className="gv-3d-workspace-canvas" ref={mountRef} aria-label="Interactive 3D garden workspace" />
      {renderError && <div className="gv-3d-workspace-error">{renderError}</div>}
      <div className="gv-3d-hud gv-3d-hud-left">
        <span className="gv-3d-live-dot" />
        <strong>LIVE 3D</strong>
        <small>Same unsaved plan</small>
      </div>
      <div className="gv-3d-hud gv-3d-camera-controls" aria-label="3D camera controls">
        <button type="button" onClick={setPerspective}>Perspective</button>
        <button type="button" onClick={setTop}>Top</button>
        <button type="button" onClick={setPerspective}>Fit</button>
        <span>FAST</span>
      </div>
      <div className="gv-3d-selection-card" aria-live="polite">
        <span>{inspector === DEFAULT_INSPECTOR ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspector.title}</strong>
        {inspector.subtitle && <small>{inspector.subtitle}</small>}
        {inspector.lines.slice(0, 3).map((line) => (
          <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>
        ))}
      </div>
      <div className="gv-3d-help">Drag to rotate · wheel/pinch to zoom · tap to inspect</div>
    </div>
  );
}
