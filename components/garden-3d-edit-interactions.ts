import * as THREE from "three";
import { vegetableModelVersion } from "./garden-vegetable-model";
import { tomatoModelVersion } from "./garden-tomato-model";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bedRectangle, areaPlants, rowPlants, validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { plantingSurfaces, surfaceContains, plantingPointBlocked, surfaceAt, surfaceLocal, surfaceWorld, type PlantingSurface } from "@/lib/garden/planting-surfaces";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { plants } from "@/lib/garden/plant-catalog";
import { createGardenPlant3D } from "./garden-plant-3d";
import { placementPlan, type Garden3DEditor } from "./use-garden-3d-editor";

import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { addCropPoints, brushPlacementPoints, cropPlacementPoints, movePlanGroup, resizePlanSelection, snapPlantingPoint } from "@/lib/garden/garden-building";

type Runtime = { content: THREE.Group; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; renderer: THREE.WebGLRenderer; mobile: boolean; needsRender?: boolean; cancelEditing?: () => void; refreshEditing?: () => void };

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
  let strokePoints: PointCm[] = [];
  const guides = new THREE.Group(); scene.add(guides);
  const dotGeometry = new THREE.SphereGeometry(.035, 8, 6), dotMaterial = new THREE.MeshBasicMaterial({ color: 0xe8ffd4, depthTest: false });
  const resizeHandle = new THREE.Mesh(new THREE.SphereGeometry(.095, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc44d, depthTest: false })); scene.add(resizeHandle); resizeHandle.visible = false; resizeHandle.renderOrder = 90;
  let pointerStart: { id: number; x: number; y: number } | null = null;
  let drag: { plan: PlannerPlan; mode: "move" | "resize"; selection: PlanSelection; start: PointCm; delta: PointCm; valid: boolean; roots: { root: THREE.Object3D; position: THREE.Vector3 }[] } | null = null;
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
    const hits: { point: THREE.Vector3; height: number; surface?: PlantingSurface }[] = [];
    const ground = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (ground) hits.push({ point: ground.clone(), height: 0 });
    for (const surface of plantingSurfaces(editor.plan)) {
      const p = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -surface.height), new THREE.Vector3());
      if (p && surfaceContains(surface, { x: p.x * 100 + 450, y: p.z * 100 + 540 })) hits.push({ point: p.clone(), height: surface.height, surface });
    }
    hits.sort((a, b) => raycaster.ray.origin.distanceTo(a.point) - raycaster.ray.origin.distanceTo(b.point));
    const hit = hits[0]; if (!hit) return null;
    const actual = { x: hit.point.x * 100 + 450, y: hit.point.z * 100 + 540 };
    const snapped = snapPlantingPoint(editor.plan, actual, editor.settings.snap, ["plant", "row", "fill", "brush"].includes(editor.tool) ? editor.settings.targetSurfaceId : undefined);
    const point = hit.surface && !surfaceContains(hit.surface, snapped) ? actual : snapped;
    return { ...point, height: hit.height };
  };
  const pick = (event: PointerEvent) => {
    setRay(event);
    const candidates = content.children.filter((o) => {
      const bounds = (o.userData.pickBounds ??= new THREE.Box3().setFromObject(o)) as THREE.Box3;
      return raycaster.ray.intersectsBox(bounds);
    });
    for (const hit of raycaster.intersectObjects(candidates, true)) {
      if (hit.object instanceof THREE.InstancedMesh && hit.instanceId !== undefined) {
        const root = hit.object.userData.instanceRoots?.[hit.instanceId] as THREE.Object3D | undefined;
        if (root) return { selection: root.userData.planSelection as PlanSelection, root };
      }
      let node: THREE.Object3D | null = hit.object;
      while (node) {
        if (node.userData.planSelection) return { selection: node.userData.planSelection as PlanSelection, root: (node.userData.selectionRoot ?? node) as THREE.Object3D };
        node = node.parent;
      }
    }
    return null;
  };
  const resetPreview = () => { preview.visible = false; startPoint = null; strokePoints = []; guides.clear(); getEditor().setPreviewText(""); runtime.needsRender = true; };
  const restoreDrag = () => { if (drag) for (const { root, position } of drag.roots) { if (root.userData.setPlantPosition) root.userData.setPlantPosition(position); else root.position.copy(position); } drag = null; controls.enabled = true; };
  const disposeGhost = () => {
    ghost?.traverse((node) => { if (node instanceof THREE.Mesh) { if (!node.userData.sharedTomatoResources && !node.userData.sharedPlantResources) node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const m of materials) m.dispose(); } });
    ghost?.removeFromParent(); ghost = null;
  };
  const showPreview = (event: PointerEvent) => {
    runtime.needsRender = true;
    const editor = getEditor();
    if (previousTool !== editor.tool) { resetPreview(); previousTool = editor.tool; }
    if (disabled() || editor.tool === "select" || editor.tool === "move" || editor.tool === "resize") { preview.visible = false; return; }
    const point = groundPoint(event); if (!point) return;
    let valid = point.x >= 0 && point.x <= gardenDimensions(editor.plan).width && point.y >= 0 && point.y <= gardenDimensions(editor.plan).height;
    try { validateEditorPlan(placementPlan(editor.plan, editor.tool, point, startPoint, editor.settings)); } catch { valid = false; }
    if (editor.tool === "plant") {
      if (plantingPointBlocked(editor.plan, point)) valid = false;
    }
    preview.userData.valid = valid;
    let color = valid ? 0x66e0ac : 0xf27878;
    const source = plants.find((p) => p.name === editor.settings.crop) ?? plants[0];
    const crop = { ...source, spacingCm: editor.settings.spacingCm || source.spacingCm };
    if (valid && editor.tool === "plant") {
      const nearby = [...editor.plan.plantingAreas.flatMap((a) => areaPlants(editor.plan, a)), ...editor.plan.rows.flatMap(rowPlants)];
      const distance = nearby.reduce((d, p) => Math.min(d, Math.hypot(p.x - point.x, p.y - point.y)), Infinity);
      if (distance < crop.spacingCm * .3) color = 0xf27878;
      else if (distance < crop.spacingCm) color = 0xffcd63;
    }
    previewMaterial.color.setHex(color); (ring.material as THREE.MeshBasicMaterial).color.setHex(color);
    preview.visible = true; preview.position.set(point.x / 100 - 4.5, point.height + .015, point.y / 100 - 5.4);

    const width = editor.tool === "structure" ? editor.settings.width : editor.tool === "bed" ? editor.settings.width : 20;
    const depth = editor.tool === "structure" ? editor.settings.depth : editor.tool === "bed" ? editor.settings.depth : 20;
    const height = editor.tool === "structure" ? editor.settings.height : editor.tool === "bed" ? 34 : 12;
    footprint.scale.set(width / 100, height / 100, depth / 100); footprint.position.set(0, height / 200, 0); footprint.rotation.y = editor.tool === "structure" ? -(editor.settings.rotationDeg ?? 0) * Math.PI / 180 : 0;
    if (startPoint && ["path", "trellis", "row", "fence"].includes(editor.tool)) {
      const dx = point.x - startPoint.x, dy = point.y - startPoint.y;
      footprint.scale.set(Math.hypot(dx, dy) / 100, (editor.tool === "trellis" || editor.tool === "fence") ? editor.settings.height / 100 : .06, editor.tool === "path" ? editor.settings.pathWidth / 100 : .1);
      footprint.position.set(-dx / 200, footprint.scale.y / 2, -dy / 200);
      footprint.rotation.y = -Math.atan2(dy, dx);
    }
    if (editor.tool === "fill" && startPoint) {
      const target = plantingSurfaces(editor.plan).find((s) => `${s.kind}:${s.id}` === editor.settings.targetSurfaceId) ?? surfaceAt(editor.plan, startPoint);
      if (target) { const a = surfaceLocal(target, startPoint), b = surfaceLocal(target, point), center = surfaceWorld(target, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); footprint.scale.set(Math.max(.02, Math.abs(a.x - b.x) / 100), .04, Math.max(.02, Math.abs(a.y - b.y) / 100)); footprint.position.set((center.x - point.x) / 100, .02, (center.y - point.y) / 100); footprint.rotation.y = -target.rotation * Math.PI / 180; }
    }
    ring.visible = editor.tool === "plant" || editor.tool === "tree";
    ring.scale.setScalar((editor.tool === "tree" ? editor.settings.diameter : crop.spacingCm) / 200);
    if (editor.tool === "plant") {
      const key = `${crop.name}:${editor.settings.variety}:${vegetableModelVersion(crop.name, editor.settings.variety, true)}:${tomatoModelVersion(false)}:${tomatoModelVersion(true)}`;
      if (key !== ghostCrop) {
        disposeGhost(); ghostCrop = key;
        ghost = createGardenPlant3D(crop.name, editor.settings.variety, true, 1);
        ghost.traverse((node) => { if (node instanceof THREE.Mesh && (node.userData.sharedTomatoResources || node.userData.sharedPlantResources)) node.material = Array.isArray(node.material) ? node.material.map((material) => material.clone()) : node.material.clone(); });
        ghost.traverse((node) => { if (node instanceof THREE.Mesh) { const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const m of materials) { m.transparent = true; m.opacity = .4; m.depthWrite = false; } } });
        preview.add(ghost);
      }
    }
    guides.clear();
    if (["row", "fill", "brush"].includes(editor.tool)) {
      const positions = editor.tool === "brush" && strokePoints.length
        ? brushPlacementPoints(editor.plan, crop.name, strokePoints, editor.settings.targetSurfaceId, editor.settings.spacingCm)
        : cropPlacementPoints(editor.plan, crop.name, point, startPoint, editor.tool as "row" | "fill" | "brush", editor.settings.targetSurfaceId, editor.settings.spacingCm);
      for (const p of positions) { const dot = new THREE.Mesh(dotGeometry, dotMaterial); dot.position.set(p.x / 100 - 4.5, (surfaceAt(editor.plan, p)?.height ?? .03) + .02, p.y / 100 - 5.4); guides.add(dot); }
      canvas.dataset.placementCount = String(positions.length); canvas.dataset.placementSpacing = String(crop.spacingCm);
      editor.setPreviewText(`${positions.length} plants · ${crop.spacingCm} cm spacing · ${valid ? "release to place" : "choose valid soil"}`);
    }
    if (ghost) ghost.visible = editor.tool === "plant";
    footprint.visible = editor.tool !== "plant";
  };

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || disabled()) return;
    const editor = getEditor();
    if (previousTool !== editor.tool) { resetPreview(); previousTool = editor.tool; }
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (!["select", "move", "resize"].includes(editor.tool)) {
      controls.enabled = false; canvas.setPointerCapture(event.pointerId);
      if (["row", "path", "trellis", "fence", "fill", "brush"].includes(editor.tool) && !startPoint) startPoint = groundPoint(event);
      if (editor.tool === "brush" && startPoint) strokePoints = [startPoint];
      showPreview(event); return;
    }
    if (editor.tool === "resize" && editor.selection) {
      const point = groundPoint(event); if (!point) return;
      drag = { plan: editor.plan, mode: "resize", selection: editor.selection, start: point, delta: { x: 0, y: 0 }, roots: [], valid: true };
      controls.enabled = false; canvas.setPointerCapture(event.pointerId); return;
    }
    if (editor.tool !== "move") return;
    const hit = pick(event), point = groundPoint(event);
    if (!hit || !point) return;
    if (!editor.groupSelections.some((s) => s.kind === hit.selection.kind && s.id === hit.selection.id && s.plantId === hit.selection.plantId)) editor.select(hit.selection, event.shiftKey);
    const roots: { root: THREE.Object3D; position: THREE.Vector3 }[] = [{ root: hit.root, position: hit.root.position.clone() }];
    if (hit.selection.kind === "bed") content.traverse((node) => {
      if (node.userData.bedId === Number(hit.selection.id)) roots.push({ root: node, position: node.position.clone() });
    });
    if (hit.selection.kind === "object") content.traverse((node) => {
      if (node.userData.containerId === hit.selection.id) roots.push({ root: node, position: node.position.clone() });
    });
    for (const selected of editor.groupSelections.filter((s) => s.kind !== hit.selection.kind || s.id !== hit.selection.id)) {
      content.traverse((node) => {
        const selection = node.userData.planSelection as PlanSelection | undefined;
        if ((selection?.kind === selected.kind && selection.id === selected.id && selection.plantId === selected.plantId)
          || (selected.kind === "bed" && node.userData.bedId === Number(selected.id)) || (selected.kind === "object" && node.userData.containerId === selected.id)) {
          if (!roots.some((r) => r.root === node)) roots.push({ root: node, position: node.position.clone() });
        }
      });
    }
    drag = { plan: editor.plan, mode: "move", selection: hit.selection, start: point, delta: { x: 0, y: 0 }, roots, valid: true };
    controls.enabled = false; canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    runtime.needsRender = true;
    if (drag) {
      const point = groundPoint(event); if (!point) return;
      drag.delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
      if (drag.mode === "resize") {
        try { validateEditorPlan(resizePlanSelection(drag.plan, drag.selection, point)); drag.valid = true; } catch { drag.valid = false; }
        resizeHandle.position.set(point.x / 100 - 4.5, point.height + .12, point.y / 100 - 5.4);
        (resizeHandle.material as THREE.MeshBasicMaterial).color.setHex(drag.valid ? 0xffc44d : 0xf27878);
        return;
      }
      try { const e = getEditor(); const candidate = e.groupSelections.length > 1 ? movePlanGroup(drag.plan, e.groupSelections, drag.delta) : e.move(drag.plan, drag.selection, drag.delta); if (!candidate) throw new Error("Invalid move"); validateEditorPlan(candidate); drag.valid = true; } catch { drag.valid = false; }
      if (drag.valid) for (const { root, position } of drag.roots) {
        const moved = new THREE.Vector3(position.x + drag.delta.x / 100, drag.selection.plantId ? point.height || .03 : position.y, position.z + drag.delta.y / 100);
        if (root.userData.setPlantPosition) root.userData.setPlantPosition(moved); else root.position.copy(moved);
      }
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
    if (getEditor().tool === "brush" && pointerStart) {
      const point = groundPoint(event), e = getEditor();
      if (point && (!strokePoints.length || Math.hypot(point.x - strokePoints.at(-1)!.x, point.y - strokePoints.at(-1)!.y) >= (e.settings.spacingCm || plants.find((p) => p.name === e.settings.crop)!.spacingCm))) strokePoints.push(point);
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
      const end = groundPoint(event);
      let next: PlannerPlan | null = null;
      if (finished.valid && unchanged) {
        try { next = finished.mode === "resize" && end ? resizePlanSelection(finished.plan, finished.selection, end) : editor.groupSelections.length > 1 ? movePlanGroup(finished.plan, editor.groupSelections, finished.delta) : editor.move(finished.plan, finished.selection, finished.delta); } catch { next = null; }
      }
      restoreDrag();
      resetPreview();
      if (next) editor.commit(next); else editor.setError("Move cancelled: position is outside the garden or planting area.");
      return;
    }
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10;
    if (disabled() || (moved && (editor.tool === "select" || editor.tool === "move"))) return;
    if (editor.tool === "select" || editor.tool === "move") { editor.select(pick(event)?.selection ?? null, event.shiftKey); return; }
    const point = groundPoint(event);
    if (["row", "path", "trellis", "fence", "fill"].includes(editor.tool) && startPoint && point && !moved && Math.hypot(point.x - startPoint.x, point.y - startPoint.y) < 5) return;
    showPreview(event);
    if (!point || (!preview.userData.valid && !(editor.tool === "brush" && strokePoints.length))) { editor.setError("Choose a valid garden location."); return; }
    try {
      const next = editor.tool === "brush" && strokePoints.length
        ? addCropPoints(editor.plan, editor.settings.crop, editor.settings.variety, brushPlacementPoints(editor.plan, editor.settings.crop, strokePoints, editor.settings.targetSurfaceId, editor.settings.spacingCm), editor.settings.targetSurfaceId, editor.settings.spacingCm)
        : placementPlan(editor.plan, editor.tool, point, startPoint, editor.settings);
      if (editor.commit(next)) { resetPreview(); editor.setError(null); }
    } catch (e) { editor.setError(e instanceof Error ? e.message : "Unable to place object."); }
  };
  runtime.refreshEditing = () => {
    const e = getEditor(), item = e.item; resizeHandle.visible = e.tool === "resize" && !!item && !e.selection?.plantId;
    if (!resizeHandle.visible || !item) return;
    let p: PointCm | undefined;
    if ("name" in item) { const r = bedRectangle(item, e.plan); p = { x: r.x + r.w, y: r.y + r.h }; }
    else if ("type" in item && item.type === "structure") p = surfaceWorld({ ...item, rotation: item.rotationDeg }, { x: item.widthCm / 2, y: item.depthCm / 2 });
    else if ("x2" in item) p = { x: item.x2, y: item.y2 };
    if (p) resizeHandle.position.set(p.x / 100 - 4.5, .5, p.y / 100 - 5.4);
    runtime.needsRender = true;
  };
  const cancel = () => { pointerStart = null; restoreDrag(); resetPreview(); };
  runtime.cancelEditing = cancel;
  const onKey = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement)?.closest("dialog")) return;
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
    runtime.cancelEditing = undefined; runtime.refreshEditing = undefined;
    guides.removeFromParent(); dotGeometry.dispose(); dotMaterial.dispose(); resizeHandle.removeFromParent(); resizeHandle.geometry.dispose(); (resizeHandle.material as THREE.Material).dispose();
    cancel(); canvas.removeEventListener("pointerdown", onDown, true); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); window.removeEventListener("keydown", onKey);
    disposeGhost(); preview.removeFromParent(); footprint.geometry.dispose(); previewMaterial.dispose(); ring.geometry.dispose(); (ring.material as THREE.Material).dispose();
  };
}
