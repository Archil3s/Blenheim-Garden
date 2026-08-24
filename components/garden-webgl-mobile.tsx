"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GardenPlanApiResponse, PlannerPlan } from "@/lib/garden/planner-plan";
import { plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";
import { DEFAULT_GARDEN_ID, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";
import styles from "./garden-webgl.module.css";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

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
  sun: THREE.DirectionalLight;
  render: () => void;
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function bedRect(bed: PlannerPlan["beds"][number]) {
  return {
    x: (bed.x / 100) * GARDEN_WIDTH_CM,
    y: (bed.y / 100) * GARDEN_HEIGHT_CM,
    w: (bed.w / 100) * GARDEN_WIDTH_CM,
    h: (bed.h / 100) * GARDEN_HEIGHT_CM,
  };
}

function inspectable(object: THREE.Object3D, item: InspectorItem) {
  object.traverse((child) => {
    child.userData.inspect = item;
  });
}

function readPlan(key: string): PlannerPlan | null {
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

function dispose(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}

function lineMesh(x1cm: number, y1cm: number, x2cm: number, y2cm: number, width: number, colour: number, height = 0.04) {
  const x1 = worldX(x1cm);
  const z1 = worldZ(y1cm);
  const x2 = worldX(x2cm);
  const z2 = worldZ(y2cm);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.02, Math.hypot(dx, dz));
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, width),
    new THREE.MeshLambertMaterial({ color: colour }),
  );
  mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  return mesh;
}

function addPlan(content: THREE.Group, plan: PlannerPlan) {
  const soilMaterial = new THREE.MeshLambertMaterial({ color: 0x8d6948 });
  const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x9f724c });
  const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x559554 });
  const fruitMaterial = new THREE.MeshLambertMaterial({ color: 0xc85b47 });

  for (const bed of plan.beds) {
    const rect = bedRect(bed);
    const width = rect.w / 100;
    const depth = rect.h / 100;
    const x = worldX(rect.x + rect.w / 2);
    const z = worldZ(rect.y + rect.h / 2);

    const soil = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), soilMaterial.clone());
    soil.position.set(x, 0.06, z);
    inspectable(soil, {
      title: bed.name,
      subtitle: "Garden bed",
      lines: [{ label: "Size", value: `${width.toFixed(1)} × ${depth.toFixed(1)} m` }],
    });
    content.add(soil);

    const t = 0.055;
    const rails = [
      [width + t * 2, t, x, z - depth / 2],
      [width + t * 2, t, x, z + depth / 2],
      [t, depth, x - width / 2, z],
      [t, depth, x + width / 2, z],
    ] as const;
    for (const [w, d, rx, rz] of rails) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), frameMaterial.clone());
      rail.position.set(rx, 0.08, rz);
      content.add(rail);
    }
  }

  for (const area of plan.plantingAreas) {
    const bed = plan.beds.find((item) => item.id === area.bedId);
    if (!bed) continue;
    const rect = bedRect(bed);
    const areaX = rect.x + (area.x / 100) * rect.w;
    const areaY = rect.y + (area.y / 100) * rect.h;
    const areaW = (area.w / 100) * rect.w;
    const areaH = (area.h / 100) * rect.h;
    const positions = plantPositionsForArea(area, areaW, areaH, 8);

    for (const position of positions) {
      const root = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.24, 5), greenMaterial.clone());
      stem.position.y = 0.12;
      root.add(stem);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 4), greenMaterial.clone());
      crown.scale.set(1.25, 0.7, 1.25);
      crown.position.y = 0.25;
      root.add(crown);
      if (/tomato|strawberry|raspberry|pumpkin/i.test(area.crop)) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), fruitMaterial.clone());
        fruit.position.set(0.07, 0.2, 0.03);
        root.add(fruit);
      }
      root.position.set(worldX(areaX + position.x), 0.12, worldZ(areaY + position.y));
      inspectable(root, {
        title: area.crop,
        subtitle: area.variety,
        lines: [
          { label: "Bed", value: bed.name },
          { label: "Planned", value: String(area.count) },
          { label: "Spacing", value: `${area.spacingCm} cm` },
        ],
      });
      content.add(root);
    }
  }

  for (const row of plan.rows) {
    const total = Math.min(10, Math.max(1, row.count));
    for (let index = 0; index < total; index += 1) {
      const t = total === 1 ? 0.5 : index / (total - 1);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), greenMaterial.clone());
      marker.position.set(
        worldX(row.x1 + (row.x2 - row.x1) * t),
        0.14,
        worldZ(row.y1 + (row.y2 - row.y1) * t),
      );
      inspectable(marker, {
        title: row.crop,
        subtitle: row.variety,
        lines: [{ label: "Row plants", value: String(row.count) }],
      });
      content.add(marker);
    }
  }

  for (const object of plan.objects) {
    if (object.type === "path") {
      const mesh = lineMesh(object.x1, object.y1, object.x2, object.y2, Math.max(0.16, object.widthCm / 100), 0xb8b6aa);
      inspectable(mesh, { title: object.label || "Path", lines: [] });
      content.add(mesh);
    } else if (object.type === "trellis") {
      const mesh = lineMesh(object.x1, object.y1, object.x2, object.y2, 0.045, 0x78644e, Math.max(0.08, object.heightCm / 250));
      mesh.position.y = Math.max(0.1, object.heightCm / 200);
      inspectable(mesh, { title: object.label || "Trellis", lines: [{ label: "Height", value: `${(object.heightCm / 100).toFixed(1)} m` }] });
      content.add(mesh);
    } else if (object.type === "tree") {
      const root = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0x76563c }));
      trunk.position.y = 0.35;
      root.add(trunk);
      const radius = Math.min(0.75, Math.max(0.22, object.diameterCm / 220));
      const crown = new THREE.Mesh(new THREE.SphereGeometry(radius, 7, 5), new THREE.MeshLambertMaterial({ color: 0x4e8750 }));
      crown.position.y = 0.9;
      crown.scale.y = 0.72;
      root.add(crown);
      root.position.set(worldX(object.x), 0, worldZ(object.y));
      inspectable(root, { title: object.label || "Tree", lines: [] });
      content.add(root);
    }
  }
}

export function GardenWebGLMobile() {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [source, setSource] = useState("Loading garden…");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [sunHour, setSunHour] = useState(13);
  const [inspector, setInspector] = useState<InspectorItem>({
    title: "3D Garden",
    subtitle: "Phone-optimised live garden view",
    lines: [],
  });

  useEffect(() => {
    let cancelled = false;
    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    const selected = fromQuery || readActiveGardenId();
    setGardenId(selected);

    async function load() {
      const live = readPlan(gardenLivePlanKey(selected));
      if (live) {
        if (!cancelled) { setPlan(live); setSource("Live 2D planner"); }
        return;
      }
      try {
        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selected)}`, { cache: "no-store" });
        const data = (await response.json()) as GardenPlanApiResponse;
        if (response.ok && data.ok && data.plan) {
          if (!cancelled) { setPlan(data.plan); setSource("Live D1 garden"); }
          return;
        }
      } catch {
        // Local fallback below.
      }
      const local = readPlan(gardenLocalPlanKey(selected));
      if (!cancelled) {
        setPlan(local ?? { beds: [], plantingAreas: [], rows: [], objects: [] });
        setSource(local ? "Local planner copy" : "Empty garden");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      setRenderError(null);
    } catch {
      setRenderError("WebGL could not start on this phone.");
      return;
    }

    mount.replaceChildren(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5df);
    scene.add(new THREE.HemisphereLight(0xf6fbf7, 0x786a56, 1.6));
    const sun = new THREE.DirectionalLight(0xfff4d8, 1.6);
    sun.position.set(6, 8, 4);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 13.2),
      new THREE.MeshLambertMaterial({ color: 0x8da56f }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(7.8, 9.4, 11.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 3.5;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI * 0.48;

    const content = new THREE.Group();
    scene.add(content);

    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const inspect = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      for (const hit of hits) {
        let current: THREE.Object3D | null = hit.object;
        while (current) {
          if (current.userData.inspect) {
            setInspector(current.userData.inspect as InspectorItem);
            return;
          }
          current = current.parent;
        }
      }
    };
    renderer.domElement.addEventListener("pointerup", inspect);

    runtimeRef.current = { scene, content, camera, controls, renderer, sun, render };
    resize();

    return () => {
      runtimeRef.current = null;
      observer.disconnect();
      controls.removeEventListener("change", render);
      renderer.domElement.removeEventListener("pointerup", inspect);
      controls.dispose();
      dispose(scene);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !plan) return;
    dispose(runtime.content);
    runtime.content.clear();
    addPlan(runtime.content, plan);
    runtime.render();
  }, [plan]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const progress = (sunHour - 6) / 12;
    const angle = progress * Math.PI;
    runtime.sun.position.set(Math.cos(angle) * 7, Math.max(1.8, Math.sin(angle) * 8), -3 + Math.sin(angle) * 3);
    runtime.render();
  }, [sunHour]);

  const resetCamera = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(7.8, 9.4, 11.8);
    runtime.controls.target.set(0, 0.2, 0);
    runtime.controls.update();
    runtime.render();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <a href={`/?gardenId=${encodeURIComponent(gardenId)}`} className={styles.back}>← 2D Plan</a>
          <div>
            <strong>Blenheim Garden</strong>
            <span>Phone-optimised 3D</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.source}>{source}</span>
          <button type="button" onClick={resetCamera}>Fit garden</button>
        </div>
      </header>

      <section className={styles.toolbar}>
        <label className={styles.sunControl}>
          <span>☀ Sun {String(sunHour).padStart(2, "0")}:00</span>
          <input type="range" min="6" max="18" step="1" value={sunHour} onChange={(event) => setSunHour(Number(event.target.value))} />
        </label>
        <span className={styles.hint}>Drag to orbit · pinch to zoom · tap to inspect</span>
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
              <div key={`${line.label}-${line.value}`}><dt>{line.label}</dt><dd>{line.value}</dd></div>
            ))}
          </dl>
          <div className={styles.legend}>
            <strong>Low-resource phone mode</strong>
            <p>The measured garden geometry is preserved, while plant detail, GPU resolution and effects are reduced so iPhones can keep the WebGL view stable.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
