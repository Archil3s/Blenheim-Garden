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
import { type PlanSelection } from "@/lib/garden/plan-editing";
import { useGarden3DEditor } from "./use-garden-3d-editor";
import { Garden3DEditorControls } from "./garden-3d-editor-controls";
import { installGardenEditInteractions } from "./garden-3d-edit-interactions";

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

function mat(color: number, roughness = 0.86, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
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
