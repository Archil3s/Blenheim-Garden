"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PlannerBed, PlannerPlan, PlannerPlantingArea } from "@/lib/garden/planner-plan";

const GARDEN_W = 900;
const GARDEN_H = 1080;

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
  title: "Garden simulator",
  subtitle: "Tap a bed, crop, path, trellis or tree.",
  lines: [],
};

const COLORS = {
  soil: 0x493127,
  soilTop: 0x5e3e2f,
  timber: 0x9f714b,
  timberDark: 0x6f4b32,
  grass: 0x668b52,
  grassDark: 0x526f45,
  leaf: 0x3f7f43,
  leafLight: 0x65a653,
  leafDark: 0x2e6638,
  stem: 0x537b45,
  red: 0xd3483f,
  berry: 0x4f63a4,
  pumpkin: 0xd9822f,
  carrot: 0xe27e2d,
  broccoli: 0x356e3c,
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_W / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_H / 200;
}

function material(color: number, roughness = 0.84, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function bedRect(bed: PlannerBed) {
  return {
    x: bed.x / 100 * GARDEN_W,
    y: bed.y / 100 * GARDEN_H,
    w: bed.w / 100 * GARDEN_W,
    h: bed.h / 100 * GARDEN_H,
  };
}

function setShadows(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
}

function inspectable(root: THREE.Object3D, item: InspectItem) {
  root.userData.inspect = item;
  root.userData.selectionRoot = root;
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
    materials.forEach((item) => item.dispose());
  });
}

function clearGroup(group: THREE.Group) {
  disposeObject(group);
  group.clear();
}

function clearSelection(ref: React.MutableRefObject<THREE.BoxHelper | null>) {
  const helper = ref.current;
  if (!helper) return;
  helper.removeFromParent();
  helper.geometry.dispose();
  helper.material.dispose();
  ref.current = null;
}

function cropKind(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("strawber")) return "strawberry";
  if (name.includes("blueber") || name.includes("raspber")) return "berry";
  if (name.includes("pumpkin") || name.includes("squash")) return "pumpkin";
  if (name.includes("lettuce")) return "lettuce";
  if (name.includes("broccoli") || name.includes("cauliflower")) return "broccoli";
  if (name.includes("bean") || name.includes("pea")) return "bean";
  if (name.includes("carrot")) return "carrot";
  if (name.includes("corn") || name.includes("maize")) return "corn";
  if (name.includes("chilli") || name.includes("pepper")) return "pepper";
  if (name.includes("basil") || name.includes("herb") || name.includes("thyme") || name.includes("parsley")) return "herb";
  return "leafy";
}

function stem(height: number, radius = 0.018) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.18, height, 8), material(COLORS.stem, 0.9));
  mesh.position.y = height / 2;
  return mesh;
}

function leaf(color = COLORS.leaf, scale = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.105 * scale, 10, 7), material(color, 0.78));
  mesh.scale.set(1.62, 0.24, 0.84);
  return mesh;
}

function addLeafRing(group: THREE.Group, count: number, radius: number, y: number, scale = 1, color = COLORS.leaf) {
  for (let i = 0; i < count; i += 1) {
    const angle = i / count * Math.PI * 2;
    const item = leaf(color, scale);
    item.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    item.rotation.y = -angle;
    item.rotation.z = i % 2 ? -0.2 : 0.2;
    group.add(item);
  }
}

function fruit(color: number, radius: number, x: number, y: number, z: number, scale?: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), material(color, 0.58));
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  return mesh;
}

function plantModel(crop: string, mobile: boolean) {
  const root = new THREE.Group();
  const kind = cropKind(crop);
  const detail = mobile ? 0.82 : 1;

  if (kind === "tomato") {
    root.add(stem(0.7 * detail, 0.022));
    addLeafRing(root, 6, 0.13, 0.28 * detail, 0.9);
    addLeafRing(root, 5, 0.11, 0.48 * detail, 0.78, COLORS.leafDark);
    root.add(fruit(COLORS.red, 0.052, -0.08, 0.31 * detail, 0.06));
    root.add(fruit(COLORS.red, 0.048, 0.07, 0.36 * detail, 0.03));
    root.add(fruit(0xb93d34, 0.043, 0.02, 0.25 * detail, -0.07));
  } else if (kind === "strawberry") {
    addLeafRing(root, 7, 0.09, 0.075, 0.72);
    root.add(fruit(0xd6404d, 0.052, 0.07, 0.065, 0.04, [0.82, 1.2, 0.82]));
  } else if (kind === "berry") {
    root.add(stem(0.52 * detail, 0.019));
    addLeafRing(root, 7, 0.12, 0.31 * detail, 0.74);
    root.add(fruit(COLORS.berry, 0.034, -0.07, 0.25 * detail, 0.04));
    root.add(fruit(COLORS.berry, 0.034, 0.05, 0.29 * detail, 0.03));
    root.add(fruit(0x3f518c, 0.03, 0.01, 0.23 * detail, -0.05));
  } else if (kind === "pumpkin") {
    addLeafRing(root, 8, 0.18, 0.075, 1.08, COLORS.leafDark);
    root.add(fruit(COLORS.pumpkin, 0.125, 0.14, 0.105, 0.04, [1.28, 0.72, 1.12]));
  } else if (kind === "lettuce") {
    addLeafRing(root, 10, 0.105, 0.055, 1.08, COLORS.leafLight);
    addLeafRing(root, 7, 0.055, 0.11, 0.82);
  } else if (kind === "broccoli") {
    root.add(stem(0.28, 0.035));
    addLeafRing(root, 6, 0.11, 0.14, 0.82, COLORS.leafDark);
    root.add(fruit(COLORS.broccoli, 0.085, 0, 0.31, 0));
    root.add(fruit(COLORS.broccoli, 0.055, -0.065, 0.285, 0.02));
    root.add(fruit(COLORS.broccoli, 0.055, 0.065, 0.285, 0.02));
  } else if (kind === "bean") {
    root.add(stem(0.75 * detail, 0.015));
    addLeafRing(root, 7, 0.11, 0.38 * detail, 0.74, COLORS.leafLight);
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.13, 4, 7), material(0x5f984d, 0.72));
    pod.rotation.z = 0.28;
    pod.position.set(0.08, 0.38 * detail, 0.03);
    root.add(pod);
  } else if (kind === "carrot") {
    for (let i = 0; i < 7; i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.25, 6), material(COLORS.leafDark, 0.86));
      const angle = i / 7 * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.035, 0.13, Math.sin(angle) * 0.035);
      blade.rotation.z = (i % 2 ? -1 : 1) * 0.12;
      root.add(blade);
    }
    const shoulder = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.095, 9), material(COLORS.carrot, 0.65));
    shoulder.position.y = 0.02;
    shoulder.rotation.z = Math.PI;
    root.add(shoulder);
  } else if (kind === "corn") {
    root.add(stem(0.9 * detail, 0.025));
    for (let i = 0; i < 5; i += 1) {
      const item = leaf(0x679543, 1.22);
      item.position.y = 0.2 + i * 0.13 * detail;
      item.rotation.z = i % 2 ? -0.5 : 0.5;
      root.add(item);
    }
  } else if (kind === "pepper") {
    root.add(stem(0.5 * detail, 0.02));
    addLeafRing(root, 6, 0.105, 0.3 * detail, 0.78, COLORS.leafDark);
    const pepper = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.1, 4, 8), material(0xc73f35, 0.58));
    pepper.position.set(0.08, 0.25 * detail, 0.03);
    root.add(pepper);
  } else if (kind === "herb") {
    root.add(stem(0.32, 0.013));
    addLeafRing(root, 8, 0.085, 0.18, 0.6, COLORS.leafLight);
  } else {
    addLeafRing(root, 8, 0.1, 0.075, 0.96, COLORS.leafLight);
  }

  setShadows(root);
  return root;
}

function representativePositions(widthCm: number, heightCm: number, desired: number, mobile: boolean) {
  const max = mobile ? 7 : 12;
  const count = Math.min(max, Math.max(1, desired || 1));
  const aspect = Math.max(0.25, widthCm / Math.max(1, heightCm));
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / columns));
  return Array.from({ length: count }, (_, index) => ({
    x: ((index % columns) + 1) / (columns + 1),
    y: (Math.floor(index / columns) + 1) / (rows + 1),
  }));
}

function addBed(group: THREE.Group, bed: PlannerBed, active: PlannerPlantingArea | undefined) {
  const rect = bedRect(bed);
  const width = rect.w / 100;
  const depth = rect.h / 100;
  const x = worldX(rect.x + rect.w / 2);
  const z = worldZ(rect.y + rect.h / 2);
  const root = new THREE.Group();
  const wallHeight = 0.24;
  const rail = 0.085;

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.05, width - 0.12), 0.15, Math.max(0.05, depth - 0.12)),
    material(COLORS.soilTop, 1),
  );
  soil.position.set(x, 0.16, z);
  root.add(soil);

  const rails: Array<[number, number, number, number]> = [
    [width + rail * 2, rail, x, z - depth / 2],
    [width + rail * 2, rail, x, z + depth / 2],
    [rail, depth, x - width / 2, z],
    [rail, depth, x + width / 2, z],
  ];

  rails.forEach(([w, d, px, pz], index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, wallHeight, d),
      material(index % 2 ? COLORS.timber : COLORS.timberDark, 0.74),
    );
    mesh.position.set(px, wallHeight / 2, pz);
    root.add(mesh);
  });

  setShadows(root);
  inspectable(root, {
    title: bed.name,
    subtitle: active ? `${active.crop}${active.variety ? ` · ${active.variety}` : ""}` : "Raised garden bed",
    lines: [
      { label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` },
      ...(active ? [{ label: "Spacing", value: `${active.spacingCm} cm` }] : []),
    ],
  });
  group.add(root);
}

function addPlanting(group: THREE.Group, plan: PlannerPlan, area: PlannerPlantingArea, mobile: boolean) {
  const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
  if (!bed) return;
  const rect = bedRect(bed);
  const ax = rect.x + area.x / 100 * rect.w;
  const az = rect.y + area.y / 100 * rect.h;
  const aw = area.w / 100 * rect.w;
  const ah = area.h / 100 * rect.h;
  const root = new THREE.Group();

  for (const point of representativePositions(aw, ah, area.count, mobile)) {
    const plant = plantModel(area.crop, mobile);
    plant.position.set(worldX(ax + aw * point.x), 0.23, worldZ(az + ah * point.y));
    plant.scale.setScalar(Math.max(0.72, Math.min(1.12, (area.iconSize || 16) / 16)));
    root.add(plant);
  }

  inspectable(root, {
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
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const root = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.045, Math.max(0.16, object.widthCm / 100)),
    material(0xaaa28f, 0.96),
  );
  mesh.position.set((x1 + x2) / 2, 0.028, (z1 + z2) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  root.add(mesh);
  setShadows(root);
  inspectable(root, { title: object.label || "Path", lines: [{ label: "Width", value: `${object.widthCm} cm` }] });
  group.add(root);
}

function addTrellis(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "trellis" }>) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const height = Math.max(0.45, object.heightCm / 100);
  const root = new THREE.Group();
  const posts = Math.max(2, Math.min(10, Math.ceil(length * 100 / Math.max(50, object.postSpacingCm)) + 1));

  for (let i = 0; i < posts; i += 1) {
    const t = i / Math.max(1, posts - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, height, 8), material(0x6c5038, 0.78));
    post.position.set(x1 + dx * t, height / 2, z1 + dz * t);
    root.add(post);
  }

  for (const y of [height * 0.28, height * 0.5, height * 0.72, height * 0.92]) {
    const wire = new THREE.Mesh(new THREE.BoxGeometry(length, 0.012, 0.012), material(0x727a76, 0.42, 0.18));
    wire.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    wire.rotation.y = -Math.atan2(dz, dx);
    root.add(wire);
  }

  setShadows(root);
  inspectable(root, { title: object.label || "Trellis", lines: [{ label: "Height", value: `${height.toFixed(1)} m` }] });
  group.add(root);
}

function addTree(group: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>, mobile: boolean) {
  const root = new THREE.Group();
  const x = worldX(object.x);
  const z = worldZ(object.y);
  const radius = Math.min(1.05, Math.max(0.34, object.diameterCm / 190));
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.86, 10), material(0x705038, 0.92));
  trunk.position.set(x, 0.43, z);
  root.add(trunk);

  const crowns = mobile ? 4 : 6;
  for (let i = 0; i < crowns; i += 1) {
    const angle = i / crowns * Math.PI * 2;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.6, mobile ? 1 : 2), material(i % 2 ? 0x477c49 : 0x3c7042, 0.92));
    crown.scale.y = 0.82;
    crown.position.set(
      x + Math.cos(angle) * radius * 0.28,
      0.82 + radius * (0.42 + (i % 2) * 0.06),
      z + Math.sin(angle) * radius * 0.28,
    );
    root.add(crown);
  }

  setShadows(root);
  inspectable(root, { title: object.label || "Tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  group.add(root);
}

function buildGarden(group: THREE.Group, plan: PlannerPlan, mobile: boolean) {
  clearGroup(group);
  plan.beds.forEach((bed) => addBed(group, bed, plan.plantingAreas.find((area) => area.bedId === bed.id)));
  plan.plantingAreas.forEach((area) => addPlanting(group, plan, area, mobile));

  for (const row of plan.rows) {
    const root = new THREE.Group();
    const count = Math.min(mobile ? 8 : 14, Math.max(1, row.count || 1));
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const plant = plantModel(row.crop, mobile);
      plant.scale.setScalar(0.82);
      plant.position.set(worldX(row.x1 + (row.x2 - row.x1) * t), 0.03, worldZ(row.y1 + (row.y2 - row.y1) * t));
      root.add(plant);
    }
    inspectable(root, { title: row.crop, subtitle: row.variety, lines: [{ label: "Spacing", value: `${row.spacingCm} cm` }] });
    group.add(root);
  }

  for (const object of plan.objects) {
    if (object.type === "path") addPath(group, object);
    if (object.type === "trellis") addTrellis(group, object);
    if (object.type === "tree") addTree(group, object, mobile);
  }
}

function addGrassTufts(scene: THREE.Scene, mobile: boolean) {
  const count = mobile ? 45 : 120;
  const geometry = new THREE.ConeGeometry(0.018, 0.13, 4);
  const grassMaterial = material(0x517944, 0.94);
  const mesh = new THREE.InstancedMesh(geometry, grassMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const x = (Math.random() - 0.5) * 14.5;
    const z = (Math.random() - 0.5) * 16.5;
    dummy.position.set(x, 0.055, z);
    dummy.rotation.y = Math.random() * Math.PI;
    const scale = 0.65 + Math.random() * 0.7;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

export function GardenWorkspaceRealistic({ plan }: { plan: PlannerPlan }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const selectionRef = useRef<THREE.BoxHelper | null>(null);
  const [inspector, setInspector] = useState<InspectItem>(DEFAULT_INSPECTOR);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [quality, setQuality] = useState("AUTO");

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection(selectionRef);
    buildGarden(runtime.content, plan, runtime.mobile);
  }, [plan]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const mobile = window.matchMedia("(max-width: 760px)").matches;
    setQuality(mobile ? "MOBILE" : "HIGH");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !mobile,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setRenderError("3D simulator needs WebGL2 on this device."));
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = mobile ? 1.02 : 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa7c1c9);
    scene.fog = new THREE.FogExp2(0xa7c1c9, mobile ? 0.026 : 0.021);

    const hemi = new THREE.HemisphereLight(0xeef8ff, 0x4a3a2f, 1.2);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffe8bd, mobile ? 2.15 : 2.35);
    sun.position.set(-5.5, 10.5, 6.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 35;
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.00018;
    scene.add(sun);

    const outer = new THREE.Mesh(new THREE.PlaneGeometry(22, 24), material(COLORS.grassDark, 1));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.04;
    outer.receiveShadow = true;
    scene.add(outer);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 11.3), material(COLORS.grass, 0.98));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    ground.receiveShadow = true;
    scene.add(ground);

    const grassTufts = addGrassTufts(scene, mobile);

    const camera = new THREE.PerspectiveCamera(mobile ? 46 : 41, 1, 0.1, 70);
    camera.position.set(mobile ? 7.7 : 8.7, mobile ? 8.2 : 8.6, mobile ? 11.4 : 12.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.rotateSpeed = mobile ? 0.52 : 0.62;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.68;
    controls.target.set(0, 0.3, 0);
    controls.minDistance = 3.8;
    controls.maxDistance = 27;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

    const content = new THREE.Group();
    scene.add(content);
    buildGarden(content, plan, mobile);

    const runtime: Runtime = { scene, content, camera, controls, renderer, mobile };
    runtimeRef.current = runtime;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { id: number; x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary) pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = pointerStart;
      pointerStart = null;
      if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);

      for (const hit of hits) {
        let current: THREE.Object3D | null = hit.object;
        while (current) {
          const item = current.userData.inspect as InspectItem | undefined;
          const root = current.userData.selectionRoot as THREE.Object3D | undefined;
          if (item && root) {
            clearSelection(selectionRef);
            const helper = new THREE.BoxHelper(root, 0xffcf58);
            helper.material.depthTest = false;
            helper.material.transparent = true;
            helper.material.opacity = 0.92;
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
      clearGroup(content);
      grassTufts.geometry.dispose();
      if (Array.isArray(grassTufts.material)) grassTufts.material.forEach((item) => item.dispose());
      else grassTufts.material.dispose();
      outer.geometry.dispose();
      outer.material.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();
      runtimeRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // Later plan updates are applied by the effect above without recreating the renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPerspective = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(runtime.mobile ? 7.7 : 8.7, runtime.mobile ? 8.2 : 8.6, runtime.mobile ? 11.4 : 12.2);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(0, 0.3, 0);
    runtime.controls.update();
  };

  const setTop = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(0.01, 16.2, 0.01);
    runtime.camera.up.set(0, 0, -1);
    runtime.controls.target.set(0, 0, 0);
    runtime.controls.update();
  };

  return (
    <div className="gv-3d-workspace gv-3d-realistic" data-testid="inline-3d-workspace">
      <div className="gv-3d-workspace-canvas" ref={mountRef} aria-label="Interactive 3D garden workspace" />
      {renderError && <div className="gv-3d-workspace-error">{renderError}</div>}
      <div className="gv-3d-hud gv-3d-hud-left">
        <span className="gv-3d-live-dot" />
        <strong>GARDEN SIM</strong>
        <small>Live plan</small>
      </div>
      <div className="gv-3d-hud gv-3d-camera-controls" aria-label="3D camera controls">
        <button type="button" onClick={setPerspective}>Perspective</button>
        <button type="button" onClick={setTop}>Top</button>
        <button type="button" onClick={setPerspective}>Fit</button>
        <span>{quality}</span>
      </div>
      <div className="gv-3d-selection-card" aria-live="polite">
        <span>{inspector === DEFAULT_INSPECTOR ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspector.title}</strong>
        {inspector.subtitle && <small>{inspector.subtitle}</small>}
        {inspector.lines.slice(0, 3).map((line) => (
          <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>
        ))}
      </div>
      <div className="gv-3d-help">Drag to orbit · wheel/pinch to zoom · tap to inspect</div>
    </div>
  );
}
