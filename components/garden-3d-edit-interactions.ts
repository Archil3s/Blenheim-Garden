import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { areaPlants, bedRectangle, rowPlants, validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { plants } from "@/lib/garden/plant-catalog";
import { structurePreset } from "@/lib/garden/structure-catalog";
import { createGardenPlant3D } from "./garden-plant-3d";
import { placementPlan, type Garden3DEditor } from "./use-garden-3d-editor";

type Runtime = { content: THREE.Group; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; renderer: THREE.WebGLRenderer; mobile: boolean; needsRender?: boolean; cancelEditing?: () => void };

export function installGardenEditInteractions(runtime: Runtime, getEditor: () => Garden3DEditor, disabled: () => boolean) {
  const { renderer, camera, controls, content, scene } = runtime;
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const preview = new THREE.Group(); scene.add(preview); preview.visible = false;
  const previewMaterial = new THREE.MeshBasicMaterial({ color: 0x76ddb0, transparent: true, opacity: .3, depthWrite: false });
  const footprint = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), previewMaterial);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 48), new THREE.MeshBasicMaterial({ color: 0x76ddb0, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; preview.add(footprint, ring);
  let ghost: THREE.Group | null = null, ghostCrop = "";
  let startPoint: PointCm | null = null;
  let pointerStart: { id: number; x: number; y: number } | null = null;
  let drag: { plan: PlannerPlan; selection: PlanSelection; start: PointCm; delta: PointCm; valid: boolean; roots: { root: THREE.Object3D; position: THREE.Vector3 }[] } | null = null;
  let previousTool = getEditor().tool;

  const setRay = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld();
    content.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
  };
  const groundPoint = (event: PointerEvent) => {
    setRay(event);
    const editor = getEditor();
    const hits: { point: THREE.Vector3; height: number }[] = [];
    const ground = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (ground) hits.push({ point: ground.clone(), height: 0 });
    for (const bed of editor.plan.beds) {
      const p = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.31), new THREE.Vector3());
      const rect = bedRectangle(bed);
      if (p && p.x * 100 + 450 >= rect.x && p.x * 100 + 450 <= rect.x + rect.w && p.z * 100 + 540 >= rect.y && p.z * 100 + 540 <= rect.y + rect.h) hits.push({ point: p.clone(), height: .31 });
    }
    hits.sort((a, b) => raycaster.ray.origin.distanceTo(a.point) - raycaster.ray.origin.distanceTo(b.point));
    const hit = hits[0]; if (!hit) return null;
    const step = editor.settings.snap ? 10 : 1;
    return { x: Math.round((hit.point.x * 100 + 450) / step) * step, y: Math.round((hit.point.z * 100 + 540) / step) * step, height: hit.height };
  };
  const pick = (event: PointerEvent) => {
    setRay(event);
    for (const hit of raycaster.intersectObjects(content.children, true)) {
      let node: THREE.Object3D | null = hit.object;
      while (node) {
        if (node.userData.planSelection) return { selection: node.userData.planSelection as PlanSelection, root: (node.userData.selectionRoot ?? node) as THREE.Object3D };
        node = node.parent;
      }
    }
    return null;
  };
  const resetPreview = () => { preview.visible = false; startPoint = null; runtime.needsRender = true; };
  const restoreDrag = () => { if (drag) for (const { root, position } of drag.roots) root.position.copy(position); drag = null; controls.enabled = true; };
  const disposeGhost = () => {
    ghost?.traverse((node) => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const m of materials) m.dispose(); } });
    ghost?.removeFromParent(); ghost = null;
  };
  const showPreview = (event: PointerEvent) => {
    runtime.needsRender = true;
    const editor = getEditor();
    if (previousTool !== editor.tool) { resetPreview(); previousTool = editor.tool; }
    if (disabled() || editor.tool === "select" || editor.tool === "move") { preview.visible = false; return; }
    const point = groundPoint(event); if (!point) return;
    let valid = point.x >= 0 && point.x <= 900 && point.y >= 0 && point.y <= 1080;
    try { validateEditorPlan(placementPlan(editor.plan, editor.tool, point, startPoint, editor.settings)); } catch { valid = false; }
    if (editor.tool === "plant") {
      for (const object of editor.plan.objects) {
        if (object.type === "structure" && !/bed|planter|pot|bag|barrel|tray/.test(object.kind)) {
          const angle = object.rotationDeg * Math.PI / 180;
          const dx = point.x - object.x, dy = point.y - object.y;
          const x = dx * Math.cos(angle) + dy * Math.sin(angle), y = -dx * Math.sin(angle) + dy * Math.cos(angle);
          if (Math.abs(x) < object.widthCm / 2 && Math.abs(y) < object.depthCm / 2) valid = false;
        }
        if (object.type === "path") {
          const dx = object.x2 - object.x1, dy = object.y2 - object.y1;
          const t = Math.max(0, Math.min(1, ((point.x - object.x1) * dx + (point.y - object.y1) * dy) / (dx * dx + dy * dy)));
          if (Math.hypot(point.x - object.x1 - t * dx, point.y - object.y1 - t * dy) < object.widthCm / 2) valid = false;
        }
      }
    }
    preview.userData.valid = valid;
    let color = valid ? 0x66e0ac : 0xf27878;
    const crop = plants.find((p) => p.name === editor.settings.crop) ?? plants[0];
    if (valid && editor.tool === "plant") {
      const nearby = [...editor.plan.plantingAreas.flatMap((a) => areaPlants(editor.plan, a)), ...editor.plan.rows.flatMap(rowPlants)];
      const distance = nearby.reduce((d, p) => Math.min(d, Math.hypot(p.x - point.x, p.y - point.y)), Infinity);
      if (distance < crop.spacingCm * .3) color = 0xf27878;
      else if (distance < crop.spacingCm) color = 0xffcd63;
    }
    previewMaterial.color.setHex(color); (ring.material as THREE.MeshBasicMaterial).color.setHex(color);
    preview.visible = true; preview.position.set(point.x / 100 - 4.5, point.height + .015, point.y / 100 - 5.4);
    const structure = structurePreset(editor.settings.structureKind);
    const width = editor.tool === "structure" ? structure.widthCm : editor.tool === "bed" ? editor.settings.width : 20;
    const depth = editor.tool === "structure" ? structure.depthCm : editor.tool === "bed" ? editor.settings.depth : 20;
    const height = editor.tool === "structure" ? structure.heightCm : editor.tool === "bed" ? 34 : 12;
    footprint.scale.set(width / 100, height / 100, depth / 100); footprint.position.set(0, height / 200, 0); footprint.rotation.y = 0;
    if (startPoint && ["path", "trellis", "row"].includes(editor.tool)) {
      const dx = point.x - startPoint.x, dy = point.y - startPoint.y;
      footprint.scale.set(Math.hypot(dx, dy) / 100, editor.tool === "trellis" ? editor.settings.height / 100 : .06, editor.tool === "path" ? editor.settings.pathWidth / 100 : .1);
      footprint.position.set(-dx / 200, footprint.scale.y / 2, -dy / 200);
      footprint.rotation.y = -Math.atan2(dy, dx);
    }
    ring.visible = editor.tool === "plant" || editor.tool === "tree";
    ring.scale.setScalar((editor.tool === "tree" ? editor.settings.diameter : crop.spacingCm) / 200);
    if (editor.tool === "plant") {
      const key = `${crop.name}:${editor.settings.variety}`;
      if (key !== ghostCrop) {
        disposeGhost(); ghostCrop = key;
        ghost = createGardenPlant3D(crop.name, editor.settings.variety, true, 1);
        ghost.traverse((node) => { if (node instanceof THREE.Mesh) { const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const m of materials) { m.transparent = true; m.opacity = .4; m.depthWrite = false; } } });
        preview.add(ghost);
      }
    }
    if (ghost) ghost.visible = editor.tool === "plant";
    footprint.visible = editor.tool !== "plant";
  };

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || disabled()) return;
    const editor = getEditor();
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (editor.tool !== "select" && editor.tool !== "move") { controls.enabled = false; canvas.setPointerCapture(event.pointerId); showPreview(event); return; }
    if (editor.tool !== "move") return;
    const hit = pick(event), point = groundPoint(event);
    if (!hit || !point) return;
    editor.setSelection(hit.selection);
    const roots: { root: THREE.Object3D; position: THREE.Vector3 }[] = [{ root: hit.root, position: hit.root.position.clone() }];
    if (hit.selection.kind === "bed") content.traverse((node) => {
      if (node.userData.bedId === Number(hit.selection.id)) roots.push({ root: node, position: node.position.clone() });
    });
    drag = { plan: editor.plan, selection: hit.selection, start: point, delta: { x: 0, y: 0 }, roots, valid: true };
    controls.enabled = false; canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    runtime.needsRender = true;
    if (drag) {
      const point = groundPoint(event); if (!point) return;
      drag.delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
      drag.valid = !!getEditor().move(drag.plan, drag.selection, drag.delta);
      if (drag.valid) for (const { root, position } of drag.roots) root.position.set(position.x + drag.delta.x / 100, position.y, position.z + drag.delta.y / 100);
      if (drag.selection.plantId) {
        const editor = getEditor();
        const parent = drag.selection.kind === "area" ? drag.plan.plantingAreas.find((a) => a.id === drag!.selection.id) : drag.plan.rows.find((r) => r.id === drag!.selection.id);
        const spacing = parent?.spacingCm ?? 25;
        const nearby = [...drag.plan.plantingAreas.flatMap((a) => areaPlants(drag!.plan, a)), ...drag.plan.rows.flatMap(rowPlants)].filter((p) => p.id !== drag!.selection.plantId);
        const distance = nearby.reduce((nearest, p) => Math.min(nearest, Math.hypot(p.x - point.x, p.y - point.y)), Infinity);
        const color = !drag.valid || distance < spacing * .3 ? 0xf27878 : distance < spacing ? 0xffcd63 : 0x66e0ac;
        preview.visible = true; footprint.visible = false; if (ghost) ghost.visible = false;
        ring.visible = true; ring.scale.setScalar(spacing / 200);
        (ring.material as THREE.MeshBasicMaterial).color.setHex(color);
        preview.position.set(point.x / 100 - 4.5, point.height + .015, point.y / 100 - 5.4);
        if (editor.error) editor.setError(null);
      }
      return;
    }
    showPreview(event);
  };
  const onUp = (event: PointerEvent) => {
    const start = pointerStart; pointerStart = null;
    if (!start || start.id !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    controls.enabled = true;
    const editor = getEditor();
    if (drag) {
      const finished = drag;
      const unchanged = JSON.stringify(editor.plan) === JSON.stringify(finished.plan);
      const next = finished.valid && unchanged ? editor.move(finished.plan, finished.selection, finished.delta) : null;
      restoreDrag();
      resetPreview();
      if (next) editor.commit(next); else editor.setError("Move cancelled: position is outside the garden or planting area.");
      return;
    }
    if (disabled() || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    if (editor.tool === "select" || editor.tool === "move") { editor.setSelection(pick(event)?.selection ?? null); return; }
    showPreview(event);
    const point = groundPoint(event); if (!point || !preview.userData.valid) { editor.setError("Choose a valid garden location."); return; }
    if (["row", "path", "trellis"].includes(editor.tool) && !startPoint) { startPoint = point; return; }
    try {
      const next = placementPlan(editor.plan, editor.tool, point, startPoint, editor.settings);
      if (editor.commit(next)) { startPoint = null; editor.setError(null); }
    } catch (e) { editor.setError(e instanceof Error ? e.message : "Unable to place object."); }
  };
  const cancel = () => { pointerStart = null; restoreDrag(); resetPreview(); };
  runtime.cancelEditing = cancel;
  const onKey = (event: KeyboardEvent) => {
    if (!disabled() && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void getEditor().save(); return; }
    if ((event.target as HTMLElement)?.closest("input, select, textarea")) return;
    const editor = getEditor();
    if (event.key === "Escape") { cancel(); editor.setTool("select"); }
    if (disabled()) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) editor.redo(); else editor.undo(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); editor.redo(); }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); editor.remove(); }
  };
  // Capture runs before OrbitControls so object drags never also orbit the camera.
  canvas.addEventListener("pointerdown", onDown, true);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", cancel);
  window.addEventListener("blur", cancel);
  window.addEventListener("keydown", onKey);
  return () => {
    runtime.cancelEditing = undefined;
    cancel(); canvas.removeEventListener("pointerdown", onDown, true); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); window.removeEventListener("keydown", onKey);
    disposeGhost(); preview.removeFromParent(); footprint.geometry.dispose(); previewMaterial.dispose(); ring.geometry.dispose(); (ring.material as THREE.Material).dispose();
  };
}
