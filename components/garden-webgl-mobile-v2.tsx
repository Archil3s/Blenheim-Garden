"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GardenPlanApiResponse, PlannerPlan } from "@/lib/garden/planner-plan";
import { DEFAULT_GARDEN_ID, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";
import styles from "./garden-webgl.module.css";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;
const EMPTY_PLAN: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

type InspectorItem = {
  title: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
};

const DEFAULT_INSPECTOR: InspectorItem = {
  title: "Tap something in the garden",
  subtitle: "Tap a bed, crop, row, path, trellis or tree to inspect it.",
  lines: [],
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function readLocalPlan(gardenId: string): PlannerPlan | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(gardenLocalPlanKey(gardenId)) ?? "null") as Partial<PlannerPlan> | null;
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

function clearGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
  group.clear();
}

function inspectable(root: THREE.Object3D, item: InspectorItem) {
  root.traverse((object) => {
    object.userData.inspect = item;
    object.userData.selectionRoot = root;
  });
}

function clearSelectionHelper(ref: React.MutableRefObject<THREE.BoxHelper | null>) {
  const helper = ref.current;
  if (!helper) return;
  helper.removeFromParent();
  helper.geometry.dispose();
  helper.material.dispose();
  ref.current = null;
}

function addLine(group: THREE.Group, x1cm: number, y1cm: number, x2cm: number, y2cm: number, width: number, color: number, height = 0.04) {
  const x1 = worldX(x1cm);
  const z1 = worldZ(y1cm);
  const x2 = worldX(x2cm);
  const z2 = worldZ(y2cm);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.02, Math.hypot(dx, dz));
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, width),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  group.add(mesh);
  return mesh;
}

function buildGarden(group: THREE.Group, plan: PlannerPlan) {
  const soil = new THREE.MeshLambertMaterial({ color: 0x8d6948 });
  const timber = new THREE.MeshLambertMaterial({ color: 0x9f724c });
  const green = new THREE.MeshLambertMaterial({ color: 0x559554 });

  for (const bed of plan.beds) {
    const xcm = (bed.x / 100) * GARDEN_WIDTH_CM;
    const ycm = (bed.y / 100) * GARDEN_HEIGHT_CM;
    const wcm = (bed.w / 100) * GARDEN_WIDTH_CM;
    const hcm = (bed.h / 100) * GARDEN_HEIGHT_CM;
    const w = wcm / 100;
    const d = hcm / 100;
    const x = worldX(xcm + wcm / 2);
    const z = worldZ(ycm + hcm / 2);
    const activeArea = plan.plantingAreas.find((area) => area.bedId === bed.id);
    const bedRoot = new THREE.Group();

    const bedMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), soil.clone());
    bedMesh.position.set(x, 0.06, z);
    bedRoot.add(bedMesh);

    const rail = 0.055;
    for (const [rw, rd, rx, rz] of [
      [w + rail * 2, rail, x, z - d / 2],
      [w + rail * 2, rail, x, z + d / 2],
      [rail, d, x - w / 2, z],
      [rail, d, x + w / 2, z],
    ] as const) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.14, rd), timber.clone());
      mesh.position.set(rx, 0.08, rz);
      bedRoot.add(mesh);
    }

    inspectable(bedRoot, {
      title: bed.name,
      subtitle: activeArea ? `${activeArea.crop}${activeArea.variety ? ` · ${activeArea.variety}` : ""}` : "Empty bed",
      lines: [
        { label: "Size", value: `${w.toFixed(1)} × ${d.toFixed(1)} m` },
        ...(activeArea ? [
          { label: "Spacing", value: `${activeArea.spacingCm} cm` },
          { label: "Planned count", value: String(activeArea.count) },
        ] : []),
      ],
    });
    group.add(bedRoot);
  }

  // Deliberately representative rather than one mesh per real plant on phones.
  for (const area of plan.plantingAreas) {
    const bed = plan.beds.find((item) => item.id === area.bedId);
    if (!bed) continue;
    const bx = (bed.x / 100) * GARDEN_WIDTH_CM;
    const by = (bed.y / 100) * GARDEN_HEIGHT_CM;
    const bw = (bed.w / 100) * GARDEN_WIDTH_CM;
    const bh = (bed.h / 100) * GARDEN_HEIGHT_CM;
    const ax = bx + (area.x / 100) * bw;
    const ay = by + (area.y / 100) * bh;
    const aw = (area.w / 100) * bw;
    const ah = (area.h / 100) * bh;
    const count = Math.min(6, Math.max(1, area.count || 1));
    const areaRoot = new THREE.Group();

    for (let index = 0; index < count; index += 1) {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const px = ax + aw * ((column + 1) / 4);
      const py = ay + ah * ((row + 1) / 3);
      const plant = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 4), green.clone());
      plant.scale.set(1.2, 0.7, 1.2);
      plant.position.set(worldX(px), 0.2, worldZ(py));
      areaRoot.add(plant);
    }

    inspectable(areaRoot, {
      title: area.crop,
      subtitle: area.variety || "Planting area",
      lines: [
        { label: "Bed", value: bed.name },
        { label: "Spacing", value: `${area.spacingCm} cm` },
        { label: "Pattern", value: area.pattern },
        { label: "Planned count", value: String(area.count) },
      ],
    });
    group.add(areaRoot);
  }

  for (const row of plan.rows) {
    const count = Math.min(8, Math.max(1, row.count || 1));
    const rowRoot = new THREE.Group();
    for (let index = 0; index < count; index += 1) {
      const t = count === 1 ? 0.5 : index / (count - 1);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 4), green.clone());
      marker.position.set(
        worldX(row.x1 + (row.x2 - row.x1) * t),
        0.14,
        worldZ(row.y1 + (row.y2 - row.y1) * t),
      );
      rowRoot.add(marker);
    }
    inspectable(rowRoot, {
      title: row.crop,
      subtitle: row.variety || "Planting row",
      lines: [
        { label: "Spacing", value: `${row.spacingCm} cm` },
        { label: "Row plants", value: String(row.count) },
      ],
    });
    group.add(rowRoot);
  }

  for (const object of plan.objects) {
    if (object.type === "path") {
      const path = addLine(group, object.x1, object.y1, object.x2, object.y2, Math.max(0.14, object.widthCm / 100), 0xb8b6aa);
      inspectable(path, {
        title: object.label || "Path",
        lines: [
          { label: "Width", value: `${object.widthCm} cm` },
          { label: "Length", value: `${(Math.hypot(object.x2 - object.x1, object.y2 - object.y1) / 100).toFixed(1)} m` },
        ],
      });
    } else if (object.type === "trellis") {
      const trellis = addLine(group, object.x1, object.y1, object.x2, object.y2, 0.045, 0x78644e, Math.max(0.1, object.heightCm / 250));
      inspectable(trellis, {
        title: object.label || "Trellis",
        lines: [
          { label: "Height", value: `${(object.heightCm / 100).toFixed(1)} m` },
          { label: "Post spacing", value: `${object.postSpacingCm} cm` },
        ],
      });
    } else if (object.type === "tree") {
      const treeRoot = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0x76563c }));
      trunk.position.set(worldX(object.x), 0.35, worldZ(object.y));
      treeRoot.add(trunk);
      const radius = Math.min(0.7, Math.max(0.22, object.diameterCm / 220));
      const crown = new THREE.Mesh(new THREE.SphereGeometry(radius, 7, 5), new THREE.MeshLambertMaterial({ color: 0x4e8750 }));
      crown.position.set(worldX(object.x), 0.9, worldZ(object.y));
      crown.scale.y = 0.72;
      treeRoot.add(crown);
      inspectable(treeRoot, {
        title: object.label || "Tree",
        lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }],
      });
      group.add(treeRoot);
    }
  }
}

export function GardenWebGLMobileV2() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneContentRef = useRef<THREE.Group | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectionHelperRef = useRef<THREE.BoxHelper | null>(null);
  const [gardenId, setGardenId] = useState(DEFAULT_GARDEN_ID);
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [source, setSource] = useState("Loading garden…");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [inspector, setInspector] = useState<InspectorItem>(DEFAULT_INSPECTOR);
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
    const selected = fromQuery || readActiveGardenId();
    setGardenId(selected);

    void (async () => {
      try {
        const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(selected)}`, { cache: "no-store" });
        const data = (await response.json()) as GardenPlanApiResponse;
        if (response.ok && data.ok && data.plan) {
          if (!cancelled) {
            setPlan(data.plan);
            setSource("Live D1 garden");
          }
          return;
        }
      } catch {
        // Local fallback below.
      }

      const local = readLocalPlan(selected);
      if (!cancelled) {
        setPlan(local ?? EMPTY_PLAN);
        setSource(local ? "Local planner copy" : "Empty garden");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch {
      setRenderError("WebGL could not start on this phone.");
      return;
    }

    // This element is intentionally owned only by Three.js. React never renders
    // children inside it, so renderer DOM changes cannot fight React reconciliation.
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5df);
    scene.add(new THREE.HemisphereLight(0xf6fbf7, 0x786a56, 1.6));
    const sun = new THREE.DirectionalLight(0xfff4d8, 1.4);
    sun.position.set(6, 8, 4);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 13.2), new THREE.MeshLambertMaterial({ color: 0x8da56f }));
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
    sceneContentRef.current = content;
    cameraRef.current = camera;
    controlsRef.current = controls;

    const render = () => renderer.render(scene, camera);
    renderRef.current = render;
    controls.addEventListener("change", render);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { id: number; x: number; y: number } | null = null;

    const clearSelection = () => {
      clearSelectionHelper(selectionHelperRef);
      setHasSelection(false);
      setInspector(DEFAULT_INSPECTOR);
      render();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = pointerStart;
      pointerStart = null;
      if (!start || start.id !== event.pointerId || !event.isPrimary) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);

      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const item = object.userData.inspect as InspectorItem | undefined;
          const selectionRoot = object.userData.selectionRoot as THREE.Object3D | undefined;
          if (item && selectionRoot) {
            clearSelectionHelper(selectionHelperRef);
            const helper = new THREE.BoxHelper(selectionRoot, 0xf0b429);
            helper.material.depthTest = false;
            helper.renderOrder = 20;
            scene.add(helper);
            selectionHelperRef.current = helper;
            setInspector(item);
            setHasSelection(true);
            render();
            return;
          }
          object = object.parent;
        }
      }

      clearSelection();
    };

    const onPointerCancel = () => { pointerStart = null; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);

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
    resize();

    return () => {
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      controls.removeEventListener("change", render);
      controls.dispose();
      clearSelectionHelper(selectionHelperRef);
      clearGroup(content);
      renderer.dispose();
      renderRef.current = null;
      sceneContentRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const content = sceneContentRef.current;
    if (!content || !plan) return;
    clearSelectionHelper(selectionHelperRef);
    setHasSelection(false);
    setInspector(DEFAULT_INSPECTOR);
    clearGroup(content);
    buildGarden(content, plan);
    renderRef.current?.();
  }, [plan]);

  const resetCamera = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(7.8, 9.4, 11.8);
    controls.target.set(0, 0.2, 0);
    controls.update();
    renderRef.current?.();
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
        <span className={styles.hint}>Tap to inspect · drag to orbit · pinch to zoom</span>
        <span className={styles.mobileHint}>Tap a bed or crop to inspect it</span>
      </section>

      <section className={styles.workspace}>
        <div className={styles.viewport}>
          <div ref={canvasMountRef} aria-label="3D garden canvas" style={{ position: "absolute", inset: 0 }} />
          {renderError && <div className={styles.loading}>{renderError}</div>}
          {!renderError && !plan && <div className={styles.loading}>{source}</div>}
          {hasSelection && (
            <div className={styles.selectionCard} aria-live="polite">
              <span>SELECTED</span>
              <strong>{inspector.title}</strong>
              {inspector.subtitle && <small>{inspector.subtitle}</small>}
              {inspector.lines.slice(0, 2).map((line) => (
                <div key={`${line.label}-${line.value}`}>
                  <b>{line.label}</b>
                  <em>{line.value}</em>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className={styles.inspector} aria-live="polite">
          <p className={styles.eyebrow}>{hasSelection ? "SELECTED ITEM" : "3D INSPECTOR"}</p>
          <h2>{inspector.title}</h2>
          {inspector.subtitle && <p className={styles.subtitle}>{inspector.subtitle}</p>}
          {inspector.lines.length > 0 && (
            <dl>
              {inspector.lines.map((line) => (
                <div key={`${line.label}-${line.value}`}>
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className={styles.legend}>
            <strong>{hasSelection ? "Highlighted in 3D" : "Tap, then inspect"}</strong>
            <p>{hasSelection ? "The yellow outline marks the exact bed, crop group or garden feature you selected." : "A short tap selects. Dragging still rotates the garden, so orbit gestures do not accidentally change the inspector."}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
