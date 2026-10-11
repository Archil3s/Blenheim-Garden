"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GardenPlanApiResponse, PlannerPlan } from "@/lib/garden/planner-plan";
import {
  DEFAULT_GARDEN_ID,
  LIVE_PLAN_EVENT,
  gardenLivePlanKey,
  gardenLocalPlanKey,
  readActiveGardenId,
} from "@/lib/garden/active-garden";
import { addStructure3D } from "@/components/garden-structure-3d";
import { addDemonstrationBed3D } from "@/components/garden-demo-bed-3d";
import { addRaisedBed, addPlantingArea, addRow, addPath, addTrellis, addTree, addBoundary, addGardenDecor } from "./garden-object-renderers";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { type PlanSelection } from "@/lib/garden/plan-editing";
import { isPlantableStructure } from "@/lib/garden/planting-surfaces";
import { useGarden3DEditor } from "./use-garden-3d-editor";
import { Garden3DEditorControls } from "./garden-3d-editor-controls";
import { installGardenEditInteractions } from "./garden-3d-edit-interactions";
import { isTomatoCrop, loadGardenTomatoModel, tomatoModelVersion } from "./garden-tomato-model";
import { loadGardenVegetableModel, vegetableModelVersion } from "./garden-vegetable-model";
import { vegetableModelFor, vegetableModels } from "@/lib/garden/vegetable-model-catalog";
import { GardenPixelCanvas } from "./garden-pixel-canvas";

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
  refreshEditing?: () => void;
};

const DEFAULT_INSPECTOR: InspectItem = {
  title: "Explore your garden",
  subtitle: "Tap a bed, crop, path, trellis, structure or tree.",
  lines: [],
};

function mat(color: number, roughness = 0.86, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (object.userData.sharedTomatoResources || object.userData.sharedPlantResources) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material); const standard = material as THREE.MeshStandardMaterial;
      if (standard.map) textures.add(standard.map); if (standard.bumpMap) textures.add(standard.bumpMap);
    }
  });
  geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); textures.forEach((t) => t.dispose());
}

function readPlanFromStorage(key: string): PlannerPlan | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<PlannerPlan> | null;
    if (!parsed || !Array.isArray(parsed.beds) || !Array.isArray(parsed.rows)) return null;
    return {
      ...parsed,
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

function buildGarden(root: THREE.Group, plan: PlannerPlan, mobile: boolean, stage = 1) {
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
  reconcile("decor", [mobile, gardenDimensions(plan)], (holder) => { addBoundary(holder, mobile, plan); addGardenDecor(holder, mobile, plan); const d = gardenDimensions(plan); holder.position.set(d.width / 200 - 4.5, 0, d.height / 200 - 5.4); });
  for (const bed of plan.beds) reconcile("bed:" + bed.id, [bed, gardenDimensions(plan)], (holder) => addRaisedBed(holder, bed, plan.plantingAreas.find((a) => a.bedId === bed.id), mobile, plan));
  for (const area of plan.plantingAreas) reconcile("area:" + area.id, [area, stage, gardenDimensions(plan), plan.beds.find((b) => b.id === area.bedId), isTomatoCrop(area.crop) ? tomatoModelVersion(mobile) : vegetableModelVersion(area.crop, area.variety, mobile)], (holder) => addPlantingArea(holder, plan, area, mobile, stage));
  for (const row of plan.rows) reconcile("row:" + row.id, [row, stage, plan.beds, gardenDimensions(plan), plan.objects.filter(isPlantableStructure), isTomatoCrop(row.crop) ? tomatoModelVersion(mobile) : vegetableModelVersion(row.crop, row.variety, mobile)], (holder) => addRow(holder, row, mobile, plan, stage));
  for (const object of plan.objects) reconcile("object:" + object.id, object, (holder) => {
    if (object.type === "path") addPath(holder, object, mobile);
    if (object.type === "trellis") addTrellis(holder, object, mobile);
    if (object.type === "tree") addTree(holder, object, mobile);
    if (object.type === "structure") { addStructure3D(holder, object, !mobile); holder.children[0].userData.planSelection = { kind: "object", id: object.id }; }
  });
  for (const child of [...root.children]) if (!expected.has(child.userData.planKey)) { disposeObject(child); child.removeFromParent(); }
}

function updateBase(runtime: Runtime, plan: PlannerPlan) {
  const d = gardenDimensions(plan), center = new THREE.Vector3(d.width / 200 - 4.5, 0, d.height / 200 - 5.4);
  for (const [name, padding] of [["garden-ground", .35], ["garden-outer", 8]] as const) {
    const ground = runtime.scene.getObjectByName(name) as THREE.Mesh | undefined;
    if (ground) { ground.scale.set((d.width / 100 + padding) / (name === "garden-ground" ? 9.35 : 17), (d.height / 100 + padding) / (name === "garden-ground" ? 11.15 : 19), 1); ground.position.x = center.x; ground.position.z = center.z; }
  }
  runtime.needsRender = true;
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
  if (runtime.scene.fog instanceof THREE.Fog) {
    runtime.scene.fog.near = Math.max(23, distance + sphere.radius);
    runtime.scene.fog.far = Math.max(40, distance + sphere.radius * 5);
  }
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
  const [gardenStyle, setGardenStyle] = useState<"pixel" | "3d">(() => typeof window !== "undefined" && new URL(window.location.href).searchParams.get("view") === "3d" ? "3d" : "pixel");
  const [cameraView, setCameraView] = useState<"perspective" | "top">("perspective");
  const [quality] = useState(() => typeof window !== "undefined" && !window.matchMedia("(min-width: 841px)").matches ? "MOBILE" : "HIGH");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [tomatoError, setTomatoError] = useState<string | null>(null);
  const [tomatoReady, setTomatoReady] = useState(false);
  const [vegetableError, setVegetableError] = useState<string | null>(null);
  const [vegetableRevision, setVegetableRevision] = useState(0);
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
    else buildGarden(runtime.content, planRef.current, runtime.mobile, editorRef.current.growthStage === "seedling" ? .38 : 1);
    updateBase(runtime, planRef.current);
    runtime.renderer.render(runtime.scene, runtime.camera);
  }, []);

  const needsTomatoes = showDemo || effectivePlan.plantingAreas.some((area) => isTomatoCrop(area.crop)) || effectivePlan.rows.some((row) => isTomatoCrop(row.crop)) || (editor.tool === "plant" && isTomatoCrop(editor.settings.crop));
  useEffect(() => {
    if (gardenStyle !== "3d" || !needsTomatoes) return;
    let active = true;
    const mobile = quality === "MOBILE";
    void Promise.all([loadGardenTomatoModel(mobile), ...(!mobile ? [loadGardenTomatoModel(true)] : [])]).then(() => {
      if (!active) return;
      setTomatoError(null);
      rebuild();
      setTomatoReady(true);
      runtimeRef.current?.renderer.domElement.setAttribute("data-tomato-model", "refined");
    }).catch((error: unknown) => {
      if (active) setTomatoError(`Detailed tomato model could not load: ${error instanceof Error ? error.message : String(error)}. Basic tomatoes are still available.`);
    });
    return () => { active = false; };
  }, [needsTomatoes, quality, rebuild, gardenStyle]);

  const vegetableIds = [...new Set([
    ...effectivePlan.plantingAreas.map((area) => vegetableModelFor(area.crop, area.variety)),
    ...effectivePlan.rows.map((row) => vegetableModelFor(row.crop, row.variety)),
    editor.tool === "plant" || editor.tool === "row" ? vegetableModelFor(editor.settings.crop, editor.settings.variety) : undefined,
    showDemo ? vegetableModelFor("Lettuce", "Butterhead") : undefined,
  ].filter((model) => model && model.kind !== "tomato").map((model) => model!.id))].sort().join("|");
  useEffect(() => {
    if (gardenStyle !== "3d") return;
    let active = true;
    const requested = vegetableModels.filter((model) => vegetableIds.split("|").includes(model.id));
    const mobile = quality === "MOBILE";
    void (async () => {
      const failed: string[] = [], loaded: string[] = [];
      for (let i = 0; i < requested.length; i += 4) {
        const batch = requested.slice(i, i + 4);
        const previouslyLoaded = batch.map((model) => vegetableModelVersion(model.crop, model.variety, mobile) === 2);
        const results = await Promise.allSettled(batch.map((model) => Promise.all([loadGardenVegetableModel(model, mobile), ...(!mobile ? [loadGardenVegetableModel(model, true)] : [])])));
        results.forEach((result, index) => {
          if (result.status === "fulfilled") loaded.push(batch[index].id);
          else { failed.push(batch[index].crop); console.warn(`Vegetable model load failed: ${batch[index].id}`, result.reason); }
        });
        if (!active) return;
        if (results.some((result, index) => result.status === "fulfilled" && !previouslyLoaded[index])) rebuild();
      }
      if (!active) return;
      setVegetableError(failed.length ? `Detailed vegetable models could not load for ${[...new Set(failed)].join(", ")}. Basic plants are still available.` : null);
      setVegetableRevision((revision) => revision + 1);
      runtimeRef.current?.renderer.domElement.setAttribute("data-vegetable-models", loaded.sort().join("|"));
    })();
    return () => { active = false; };
  }, [vegetableIds, quality, rebuild, gardenStyle]);

  useEffect(() => {
    planRef.current = effectivePlan;
    rebuild();
  }, [effectivePlan, rebuild, editor.growthStage]);

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
    if (gardenStyle !== "3d") return;
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
    outer.name = "garden-outer"; scene.add(outer);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9.35, 11.15), mat(palette.grass, 1));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    ground.receiveShadow = true;
    ground.name = "garden-ground"; scene.add(ground);

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

    updateBase(runtime, planRef.current);
    if (demoRef.current) addDemonstrationBed3D(content, mobile);
    else buildGarden(content, planRef.current, mobile);

    fitGardenCamera(runtime);
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
        runtime.content.traverse((o) => { if (o instanceof THREE.LOD) o.update(camera); });
        selectionRef.current?.update();
        renderer.render(scene, camera);
        renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
        renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
        renderer.domElement.dataset.camera = JSON.stringify({ projection: camera.projectionMatrix.elements, world: camera.matrixWorld.elements });
        renderer.domElement.dataset.plantCount = String(planRef.current.plantingAreas.reduce((n, a) => n + a.count, 0) + planRef.current.rows.reduce((n, r) => n + r.count, 0));
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
  }, [gardenStyle]);

  useEffect(() => { runtimeRef.current?.cancelEditing?.(); runtimeRef.current?.refreshEditing?.(); }, [editor.tool, showDemo, editor.selection, effectivePlan]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    clearSelection(selectionRef);
    const group = runtime.scene.getObjectByName("garden-group-highlights"); if (group) { disposeObject(group); group.removeFromParent(); }
    const groupHighlights = new THREE.Group(); groupHighlights.name = "garden-group-highlights"; runtime.scene.add(groupHighlights);
    runtime.content.traverse((node) => { const target = node.userData.planSelection as PlanSelection | undefined; if (target && editor.groupSelections.some((s) => s.kind === target.kind && s.id === target.id && s.plantId === target.plantId) && (target.kind !== editor.selection?.kind || target.id !== editor.selection.id)) { const helper = new THREE.BoxHelper(node, 0x9de6c1); helper.material.depthTest = false; groupHighlights.add(helper); } });
    runtime.needsRender = true;
    const selected = editor.selection;
    if (!selected) return;
    runtime.content.traverse((node) => {
      const target = node.userData.planSelection as PlanSelection | undefined;
      if (!target || target.kind !== selected.kind || target.id !== selected.id || target.plantId !== selected.plantId) return;
      const helper = new THREE.BoxHelper(node, 0xffc44d); helper.material.depthTest = false; helper.renderOrder = 50;
      runtime.scene.add(helper); selectionRef.current = helper;
    });
  }, [editor.selection, editor.groupSelections, effectivePlan, tomatoReady, vegetableRevision, gardenStyle]);

  useEffect(() => {
    const runtime = runtimeRef.current; if (!runtime || !editor.selection || !editor.focusRequest || cameraView === "top") return;
    let target: THREE.Object3D | undefined;
    const selected = editor.selection;
    runtime.content.traverse((o) => { const s = o.userData.planSelection as PlanSelection | undefined; if (s?.kind === selected.kind && s?.id === selected.id && s?.plantId === selected.plantId) target = o; });
    if (!target) return;
    const bounds = new THREE.Box3().setFromObject(target), center = bounds.getCenter(new THREE.Vector3()), radius = Math.max(1, bounds.getSize(new THREE.Vector3()).length() / 2);
    const vertical = THREE.MathUtils.degToRad(runtime.camera.fov), horizontal = 2 * Math.atan(Math.tan(vertical / 2) * runtime.camera.aspect);
    const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.3;
    runtime.controls.target.copy(center); runtime.camera.position.copy(center).add(new THREE.Vector3(0, distance, distance * .25)); runtime.controls.update(); runtime.needsRender = true;
  }, [editor.focusRequest, editor.selection, cameraView]);
  useEffect(() => { const runtime = runtimeRef.current; if (runtime) fitGardenCamera(runtime); }, [effectivePlan.canvasWidthCm, effectivePlan.canvasHeightCm]);

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
    const d = gardenDimensions(effectivePlan);
    runtime.camera.position.set(d.width / 200 - 4.5, Math.max(d.width, d.height) / 100 * 1.5, d.height / 200 - 5.4 + .001);
    runtime.camera.up.set(0, 1, 0);
    runtime.controls.target.set(d.width / 200 - 4.5, 0, d.height / 200 - 5.4);
    runtime.controls.update();
    runtime.camera.updateMatrixWorld();
    runtime.needsRender = true;
  };

  return (
    <div className={`gv-3d-workspace gv-3d-editor ${gardenStyle === "pixel" ? "garden-pixel-workspace" : "gv-3d-realistic"}`} data-demo={showDemo} data-render-style={gardenStyle} data-editor-tool={editor.tool} aria-label={gardenStyle === "pixel" ? "Visual pixel garden canvas" : "Visual 3D garden canvas"} data-testid="inline-3d-workspace" style={{ position: "relative", width: "100%", height: "100%", minHeight: suppliedPlan ? 520 : "100dvh", overflow: "hidden" }}>
      {gardenStyle === "pixel" ? <GardenPixelCanvas plan={effectivePlan} editor={editor} disabled={!suppliedPlan && !loadedPlan} /> : <div className="gv-3d-workspace-canvas" ref={mountRef} aria-label="Interactive 3D garden workspace" style={{ position: "absolute", inset: 0 }} />}
      <Garden3DEditorControls editor={editor} disabled={gardenStyle === "3d" && (showDemo || !!renderError) || (!suppliedPlan && !loadedPlan)} />
      {gardenStyle === "3d" && renderError && <div className="gv-3d-workspace-error">{renderError}</div>}
      {gardenStyle === "3d" && tomatoError && <div role="status" style={{ position: "absolute", top: 118, left: 12, right: 12, padding: 8, background: "#fff5dd", color: "#674b20", fontSize: 12 }}>{tomatoError}</div>}
      {gardenStyle === "3d" && vegetableError && <div role="status" style={{ position: "absolute", top: tomatoError ? 168 : 118, left: 12, right: 12, padding: 8, background: "#fff5dd", color: "#674b20", fontSize: 12 }}>{vegetableError}</div>}
      <div className="garden-render-style" role="group" aria-label="Garden appearance">
        <button type="button" aria-pressed={gardenStyle === "pixel"} onClick={() => { setShowDemo(false); setGardenStyle("pixel"); }}>Pixel garden</button>
        <button type="button" aria-pressed={gardenStyle === "3d"} onClick={() => setGardenStyle("3d")}>Detailed 3D</button>
      </div>
      <div className="gv-3d-hud gv-3d-hud-left">
        <span className="gv-3d-live-dot" />
        <strong>{gardenStyle === "pixel" ? "PIXEL GARDEN" : "GARDEN SIM"}</strong>
        <small>{showDemo ? "2 × 4 m benchmark" : `${effectivePlan.beds.length} beds · ${structureCount} structures`}</small>
      </div>
      {gardenStyle === "3d" && <div className="gv-3d-hud gv-3d-camera-controls" aria-label="3D camera controls">
        <button type="button" className={cameraView === "perspective" ? "active" : ""} aria-pressed={cameraView === "perspective"} onClick={setPerspective}>Perspective</button>
        <button type="button" className={cameraView === "top" ? "active" : ""} aria-pressed={cameraView === "top"} onClick={setTop}>Top</button>
        <button type="button" onClick={() => { if (runtimeRef.current) fitGardenCamera(runtimeRef.current); }}>{suppliedPlan ? "Fit" : "Fit garden"}</button>
        <button type="button" className={showDemo ? "active" : ""} aria-pressed={showDemo} onClick={() => setShowDemo((value) => !value)}>Demo bed</button>
        <span>{quality}</span>
      </div>}
      <div className="gv-3d-selection-card" aria-live="polite">
        <span>{inspector === DEFAULT_INSPECTOR ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspector.title}</strong>
        {inspector.subtitle && <small>{inspector.subtitle}</small>}
        {inspector.lines.slice(0, 3).map((line) => <div key={`${line.label}-${line.value}`}><b>{line.label}</b><em>{line.value}</em></div>)}
      </div>
      {gardenStyle === "3d" && <div className="gv-3d-help">Drag empty ground to orbit · Move to drag objects · tap to place/select</div>}
    </div>
  );
}
