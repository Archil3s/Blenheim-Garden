"use client";

/* eslint-disable react-hooks/immutability -- Three.js objects are an imperative
   scene graph owned by this effect, never React state. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { AuditCatalogue } from "@/lib/garden/audit-catalog";
import { createAuditModel, identifySharedModels, missingMarker, type AuditMode, type AuditModel, type AuditRecord } from "./garden-audit-models";

export type SceneStats = { specimens: number; objects: number; calls: number; triangles: number; geometries: number; textures: number };
export type SceneOptions = { lod: string; mobile: boolean; mode: AuditMode; bounds: boolean; origins: boolean; grid: boolean; camera: string; cameraRequest: number; filter: string; search: string; selected: string; screenshot: boolean };

export function matchesAudit(record: AuditRecord, filter: string, search: string) {
  const text = `${record.id} ${record.name} ${record.variety}`.toLowerCase();
  if (!text.includes(search.toLowerCase())) return false;
  if (filter === "All") return true;
  if (filter === "Plants") return record.kind === "plant";
  if (filter === "Structures") return record.kind === "structure";
  if (filter === "Errors") return record.warnings.length > 0;
  if (filter === "Fallbacks") return record.badges.some((badge) => badge.includes("FALLBACK"));
  if (filter === "Sprites") return record.badges.some((badge) => badge.includes("SPRITE"));
  if (filter === "True 3D") return record.badges.includes("TRUE 3D");
  if (filter === "Missing") return record.badges.some((badge) => badge.includes("MISSING") || badge.includes("ERROR"));
  return record.category === filter;
}

function recordSnapshots(models: AuditModel[]) {
  return models.map(({ record }) => ({ ...record, badges: [...record.badges], warnings: [...record.warnings], sharedWith: [...record.sharedWith], bounds: [...record.bounds] }));
}

function labelTexture(lines: string[], warning: boolean, auditId = "", low = false) {
  const height = auditId ? 430 : 220, resolution = low || window.innerWidth <= 600 ? .5 : 1;
  const canvas = document.createElement("canvas"); canvas.width = 768 * resolution; canvas.height = height * resolution;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(resolution, resolution);
  ctx.fillStyle = warning ? "#fff3df" : "#ffffff"; ctx.fillRect(0, 0, 768, height);
  ctx.strokeStyle = warning ? "#a46b21" : "#74867b"; ctx.lineWidth = 5; ctx.strokeRect(2, 2, 764, height - 4);
  ctx.textAlign = "center"; ctx.fillStyle = "#142b23";
  if (auditId) { ctx.font = "bold 160px sans-serif"; ctx.fillText(auditId, 384, 158, 742); }
  lines.slice(0, 5).forEach((line, index) => { ctx.font = `${index === 0 ? "bold " : ""}${auditId ? index < 2 ? 46 : 30 : index < 2 ? 33 : 26}px sans-serif`; ctx.fillText(line, 384, (auditId ? 222 : 40) + index * (auditId ? 43 : 38), 742); });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, toneMapped: false }));
  sprite.scale.set(2.8, auditId ? 1.57 : .8, 1); sprite.renderOrder = 10;
  return sprite;
}

type SceneRuntime = { models: AuditModel[]; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; renderer: THREE.WebGLRenderer; invalidate: () => void; labels: Map<string, THREE.Sprite>; zones: Map<string, THREE.Sprite>; helpers: THREE.Group; grid: THREE.Group; options: SceneOptions; frame: (preset: string) => void };

export function GardenAuditScene({ catalogue, options, onRecords, onStats, onSelect, onError }: { catalogue: AuditCatalogue; options: SceneOptions; onRecords: (records: AuditRecord[]) => void; onStats: (stats: SceneStats) => void; onSelect: (id: string) => void; onError: (error: string) => void }) {
  const host = useRef<HTMLDivElement>(null), runtime = useRef<SceneRuntime | null>(null);
  const callbacks = useRef({ onRecords, onStats, onSelect, onError });
  const assetChecks = useRef(new Map<string, Promise<boolean>>());
  useEffect(() => { callbacks.current = { onRecords, onStats, onSelect, onError }; }, [onRecords, onStats, onSelect, onError]);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); }
    catch (error) { callbacks.current.onError(`WebGL unavailable: ${String(error)}`); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0xe8ece9); renderer.domElement.setAttribute("aria-label", "3D audit showroom"); element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, .01, 1500);
    scene.background = new THREE.Color(0xe8ece9);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x85968a, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(30, 65, 20); scene.add(sun);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.maxDistance = 1000;
    let dirty = true, raf = 0, disposed = false, ready = false;
    const invalidate = () => { dirty = true; };
    const labels = new Map<string, THREE.Sprite>(), zones = new Map<string, THREE.Sprite>();
    const textureSources = new Map<string, THREE.Source>();
    const mobile = options.mobile || options.lod === "Low";
    const models = catalogue.entries.map((entry) => createAuditModel(entry, mobile, options.mode, mobile ? "Low (forced mobile)" : options.lod === "Medium" ? "Medium (High alias)" : "High", invalidate, assetFailed, textureSources));
    function assetFailed(id: string) {
      if (disposed) return;
      const model = models.find((item) => item.record.id === id);
      if (!model || model.record.badges.includes("ASSET ERROR")) return;
      missingMarker(model.root); model.record.badges.push("ASSET ERROR"); model.record.warnings.push("FAILED ASSET: " + model.record.artwork?.src);
      const old = labels.get(id); if (old) { scene.remove(old); old.material.map?.dispose(); old.material.dispose(); }
      const label = makeLabel(model); labels.set(id, label); scene.add(label);
      if (ready) callbacks.current.onRecords(recordSnapshots(models));
      invalidate();
    }
    identifySharedModels(models);
    const categories = [...new Set(models.map((model) => model.record.category))];
    let nextZ = 0, nextX = 0, shelfDepth = 0;
    for (const category of categories) {
      const zone = models.filter((model) => model.record.category === category);
      const cellWidth = Math.max(3.4, ...zone.map((model) => model.record.bounds[0] + 1.2));
      const cellDepth = Math.max(3, ...zone.map((model) => model.record.bounds[2] + 2));
      const columns = Math.min(12, zone.length), zoneWidth = columns * cellWidth, zoneDepth = Math.ceil(zone.length / columns) * cellDepth + 4;
      if (nextX > 0 && nextX + zoneWidth > 130) { nextZ += shelfDepth; nextX = 0; shelfDepth = 0; }
      const startZ = nextZ + 2, startX = nextX;
      const title = labelTexture([category, `${zone.length} specimens · metres, production scale`], false, "", mobile);
      zones.set(category, title);
      title.scale.set(Math.min(columns * cellWidth, 14), 1.1, 1); title.position.set(startX + (columns - 1) * cellWidth / 2, .6, nextZ); scene.add(title);
      zone.forEach((model, index) => {
        model.root.position.set(startX + (index % columns) * cellWidth, 0, startZ + Math.floor(index / columns) * cellDepth);
        model.root.userData.auditId = model.record.id; scene.add(model.root);
        const label = makeLabel(model); labels.set(model.record.id, label); scene.add(label);
      });
      nextX += zoneWidth + 3; shelfDepth = Math.max(shelfDepth, zoneDepth);
    }
    function makeLabel(model: AuditModel) {
      const label = labelTexture([model.record.name, model.record.variety, model.record.badges.slice(0, 2).join(" · "), model.record.badges.slice(2).join(" · "), model.record.dimensions ?? `H ${model.record.bounds[1].toFixed(2)} m · spread ${Math.max(model.record.bounds[0], model.record.bounds[2]).toFixed(2)} m`], model.record.warnings.length > 0, model.record.id, mobile);
      label.position.copy(model.root.position); label.position.z += model.record.bounds[2] / 2 + .85; label.position.y = -.9;
      label.userData.auditId = model.record.id; return label;
    }
    nextZ += shelfDepth;
    const helpers = new THREE.Group(), grid = new THREE.Group(); scene.add(helpers, grid);
    const width = Math.max(20, ...models.map((model) => model.root.position.x + model.record.bounds[0] / 2 + 3));
    const extent = Math.ceil(Math.max(width, nextZ));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(width + 10, nextZ + 10), new THREE.MeshBasicMaterial({ color: 0xdde3dd }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(width / 2 - 2, -.012, nextZ / 2); scene.add(ground);
    // Finite 10 cm lines; a separate 1 m grid gives clear measurement hierarchy.
    for (const [step, color, opacity] of [[.1, 0x9ca99e, .16], [1, 0x66796b, .35]] as const) {
      const geometry = new THREE.BufferGeometry(), points: number[] = [];
      for (let value = -5; value <= extent + 5; value += step) points.push(value, 0, -5, value, 0, nextZ + 5, -5, 0, value, width + 5, 0, value);
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      grid.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
    }
    function frame(preset: string) {
      const current = runtime.current;
      if (!current) return;
      let items = models.filter((model) => model.root.visible);
      if (preset === "Plant rows") items = items.filter((model) => model.record.kind === "plant");
      else if (preset === "Structures") items = items.filter((model) => model.record.kind === "structure");
      else if (preset === "Close-up") items = models.filter((model) => model.record.id === current.options.selected);
      else if (categories.includes(preset)) items = items.filter((model) => model.record.category === preset);
      if (!items.length) return;
      const box = new THREE.Box3();
      for (const model of items) { const moved = model.bounds.clone().translate(model.root.position); box.union(moved); const label = labels.get(model.record.id); if (label) { box.expandByPoint(label.position.clone().add(new THREE.Vector3(1.5, .8, .5))); box.expandByPoint(label.position.clone().add(new THREE.Vector3(-1.5, -.8, -.5))); } }
      const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const distance = Math.max(3, Math.max(size.y, size.z, size.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.2);
      const direction = preset === "Top-down" ? new THREE.Vector3(0, 1, .001) : preset === "Eye level" ? new THREE.Vector3(.1, .07, 1) : new THREE.Vector3(.25, .85, .75);
      direction.normalize(); controls.target.copy(center);
      let fitDistance = distance;
      for (let attempt = 0; attempt < 18; attempt++) {
        camera.position.copy(center).add(direction.clone().multiplyScalar(fitDistance)); camera.lookAt(center); camera.updateMatrixWorld();
        if (preset === "Eye level") { camera.position.y = 1.65; camera.lookAt(center); camera.updateMatrixWorld(); }
        let fits = true;
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
          const point = new THREE.Vector3(x, y, z).project(camera);
          if (Math.abs(point.x) > .9 || Math.abs(point.y) > .9 || point.z > 1) fits = false;
        }
        if (fits) break;
        fitDistance *= 1.12;
      }
      controls.update(); invalidate();
    }
    runtime.current = { models, scene, camera, controls, renderer, invalidate, labels, zones, helpers, grid, options, frame };
    const resize = () => { renderer.setSize(element.clientWidth, element.clientHeight); camera.aspect = element.clientWidth / element.clientHeight; camera.updateProjectionMatrix(); frame(runtime.current?.options.camera ?? "Overview"); invalidate(); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize(); frame("Overview");
    controls.addEventListener("change", invalidate);
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down: [number, number] = [0, 0];
    const pointerDown = (event: PointerEvent) => { down = [event.clientX, event.clientY]; };
    const pointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...models.filter((model) => model.root.visible).map((model) => model.root), ...[...labels.values()].filter((label) => label.visible)], true);
      let object: THREE.Object3D | null = hits[0]?.object ?? null;
      while (object && !object.userData.auditId) object = object.parent;
      if (object?.userData.auditId) callbacks.current.onSelect(object.userData.auditId);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown); renderer.domElement.addEventListener("pointerup", pointerUp);
    function animate() {
      if (dirty) {
        dirty = false; renderer.render(scene, camera);
        let objects = 0; scene.traverse((object) => { if (object.visible) objects++; });
        callbacks.current.onStats({ specimens: models.filter((model) => model.root.visible).length, objects, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures });
      }
      raf = requestAnimationFrame(animate);
    }
    const artworkSources = [...new Set(models.flatMap((model) => model.record.artwork ? [model.record.artwork.src] : []))];
    const checks = artworkSources.map((src) => {
      let check = assetChecks.current.get(src);
      if (!check) {
        check = new Promise<boolean>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
          image.src = src;
        });
        assetChecks.current.set(src, check);
      }
      return check.then((valid) => {
        if (!valid && !disposed) for (const model of models) if (model.record.artwork?.src === src) assetFailed(model.record.id);
      });
    });
    void Promise.all(checks).then(() => {
      if (disposed) return;
      ready = true;
      callbacks.current.onRecords(recordSnapshots(models));
      invalidate();
    });
    animate();
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); controls.dispose(); runtime.current = null;
      scene.traverse((object) => { if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) object.geometry.dispose(); if (object instanceof THREE.Mesh || object instanceof THREE.Sprite || object instanceof THREE.LineSegments) for (const material of Array.isArray(object.material) ? object.material : [object.material]) { (material as THREE.MeshStandardMaterial).map?.dispose(); material.dispose(); } });
      renderer.dispose(); renderer.domElement.remove();
    };
    // Model recreation is deliberately restricted to forced rendering options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue, options.lod, options.mobile, options.mode]);

  useEffect(() => {
    const current = runtime.current; if (!current) return; current.options = options;
    current.helpers.traverse((object) => { if (object instanceof THREE.LineSegments) { object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); } });
    current.helpers.clear();
    for (const model of current.models) {
      model.root.visible = matchesAudit(model.record, options.filter, options.search);
      const label = current.labels.get(model.record.id); if (label) label.visible = model.root.visible;
      if (!model.root.visible) continue;
      if (options.bounds) { const box = new THREE.Box3Helper(model.bounds.clone().translate(model.root.position), 0x49745c); const material = box.material as THREE.LineBasicMaterial; material.depthTest = false; material.transparent = true; material.opacity = .65; current.helpers.add(box); }
      if (options.origins) { const axes = new THREE.AxesHelper(.3); axes.position.copy(model.root.position); current.helpers.add(axes); }
    }
    for (const [category, title] of current.zones) title.visible = current.models.some((model) => model.root.visible && model.record.category === category);
    current.grid.visible = options.grid; current.invalidate(); current.frame(options.camera);
  }, [options]);
  return <div className="audit-canvas" ref={host} />;
}
