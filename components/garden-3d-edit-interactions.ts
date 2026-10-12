import * as THREE from "three";
import { vegetableModelVersion } from "./garden-vegetable-model";
import { tomatoModelVersion } from "./garden-tomato-model";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { areaPlants, rowPlants, validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { plantingSurfaces, surfaceContains, plantingPointBlocked, surfaceAt, surfaceLocal, surfaceWorld, type PlantingSurface } from "@/lib/garden/planting-surfaces";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { plants } from "@/lib/garden/plant-catalog";
import { createGardenPlant3D } from "./garden-plant-3d";
import { placementPlan, type Garden3DEditor } from "./use-garden-3d-editor";

import { alignMove, designFootprints, footprintCorners, resizeDesignSelection, rotateDesignSelection, selectionsInRectangle, validateDesignChange, type AlignmentGuide } from "@/lib/garden/garden-design";
import type { ResizeEdge } from "@/lib/garden/planner-selection";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { addCropPoints, brushPlacementPoints, cropPlacementPoints, movePlanGroup, snapPlantingPoint } from "@/lib/garden/garden-building";

type Runtime = { content: THREE.Group; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; renderer: THREE.WebGLRenderer; mobile: boolean; needsRender?: boolean; cancelEditing?: () => void; refreshEditing?: () => void; updateEditing?: () => void };

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
  const gizmos = new THREE.Group(); gizmos.name = "garden-edit-gizmos"; scene.add(gizmos);
  const alignment = new THREE.Group(); scene.add(alignment);
  let boxStart: PointCm | null = null;
  let pointerStart: { id: number; x: number; y: number } | null = null;
  let drag: { plan: PlannerPlan; mode: "move" | "resize" | "rotate"; edge?: ResizeEdge | "end"; axis?: "x" | "y"; candidate?: PlannerPlan; reason?: string; selection: PlanSelection; start: PointCm; height: number; delta: PointCm; valid: boolean; roots: { root: THREE.Object3D; position: THREE.Vector3 }[] } | null = null;
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
    if (drag && !drag.selection.plantId) {
      const p = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -drag.height), new THREE.Vector3());
      if (p) { const step = editor.settings.snap ? 10 : 1; return { x: Math.round((p.x * 100 + 450) / step) * step, y: Math.round((p.z * 100 + 540) / step) * step, height: drag.height }; }
    }
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
  const clearGuides = () => { guides.children.forEach((node) => { if (node instanceof THREE.Mesh && node.geometry === ring.geometry) (node.material as THREE.Material).dispose(); }); guides.clear(); };
  const resetPreview = () => { preview.visible = false; boxStart = null; clearOverlay(alignment); startPoint = null; strokePoints = []; clearGuides(); getEditor().setPreviewText(""); runtime.needsRender = true; };
  const clearOverlay = (root: THREE.Group) => { root.traverse((node) => { if (node instanceof THREE.Mesh || node instanceof THREE.Line) { node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.forEach((m) => m.dispose()); } }); root.clear(); };
  const drawLine = (root: THREE.Group, points: PointCm[], color: number, height = .4) => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x / 100 - 4.5, height, p.y / 100 - 5.4))), new THREE.LineBasicMaterial({ color, depthTest: false })); line.renderOrder = 80; root.add(line);
  };
  const drawCandidate = (plan: PlannerPlan, selected: PlanSelection, color: number, lines: AlignmentGuide[] = []) => {
    clearOverlay(alignment);
    const f = designFootprints(plan).find((f) => f.id === `${selected.kind}:${selected.id}`);
    if (f) { const corners = footprintCorners(f); drawLine(alignment, [...corners, corners[0]], color, f.height / 100 + .05); }
    const d = gardenDimensions(plan);
    for (const guide of lines) drawLine(alignment, guide.axis === "x" ? [{ x: guide.value, y: 0 }, { x: guide.value, y: d.height }] : [{ x: 0, y: guide.value }, { x: d.width, y: guide.value }], 0x98e8ff, .07);
    canvas.dataset.designPreview = color === 0xf27878 ? "blocked" : "valid";
  };
  const restoreDrag = () => { if (drag) for (const { root, position } of drag.roots) { if (root.userData.setPlantPosition) root.userData.setPlantPosition(position); else root.position.copy(position); } drag = null; controls.enabled = true; };
  const disposeGhost = () => {
    ghost?.traverse((node) => { if (node instanceof THREE.Mesh) { if (!node.userData.sharedTomatoResources && !node.userData.sharedPlantResources) node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const m of materials) m.dispose(); } });
    ghost?.removeFromParent(); ghost = null;
  };
  const showPreview = (event: PointerEvent) => {
    runtime.needsRender = true;
    const editor = getEditor();
    if (previousTool !== editor.tool) { resetPreview(); previousTool = editor.tool; }
    if (disabled() || editor.tool === "select" || editor.tool === "move" || editor.tool === "resize" || editor.tool === "box-select") { preview.visible = false; return; }
    const point = groundPoint(event); if (!point) return;
    let reason = "";
    let valid = point.x >= 0 && point.x <= gardenDimensions(editor.plan).width && point.y >= 0 && point.y <= gardenDimensions(editor.plan).height;
    try { validateEditorPlan(placementPlan(editor.plan, editor.tool, point, startPoint, editor.settings)); } catch (e) { valid = false; reason = e instanceof Error ? e.message : "Choose valid soil."; }
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
    if (editor.tool === "bed" && startPoint) {
      footprint.scale.set(Math.abs(point.x - startPoint.x) / 100, .34, Math.abs(point.y - startPoint.y) / 100);
      footprint.position.set((startPoint.x - point.x) / 200, .17, (startPoint.y - point.y) / 200);
    }
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
    clearGuides();
    if (["row", "fill", "brush"].includes(editor.tool)) {
      try {
      const positions = editor.tool === "brush" && strokePoints.length
        ? brushPlacementPoints(editor.plan, crop.name, strokePoints, editor.settings.targetSurfaceId, editor.settings.spacingCm)
        : cropPlacementPoints(editor.plan, crop.name, point, startPoint, editor.tool as "row" | "fill" | "brush", editor.settings.targetSurfaceId, editor.settings.spacingCm);
      for (const p of positions) {
        const circle = new THREE.Mesh(ring.geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .45, side: THREE.DoubleSide, depthTest: false })); circle.userData.sharedGeometry = true; circle.rotation.x = -Math.PI / 2; circle.scale.setScalar(crop.spacingCm / 200); circle.position.set(p.x / 100 - 4.5, (surfaceAt(editor.plan, p)?.height ?? .03) + .025, p.y / 100 - 5.4); guides.add(circle);
        const dot = new THREE.Mesh(dotGeometry, dotMaterial); dot.position.set(p.x / 100 - 4.5, (surfaceAt(editor.plan, p)?.height ?? .03) + .02, p.y / 100 - 5.4); guides.add(dot); }
      canvas.dataset.placementCount = String(positions.length); canvas.dataset.placementSpacing = String(crop.spacingCm);
      editor.setPreviewText(`${positions.length} plants · ${crop.spacingCm} cm spacing · ${valid ? "release to place" : reason || "choose valid soil"}`);
      } catch (e) { valid = false; preview.userData.valid = false; reason = e instanceof Error ? e.message : "Choose valid soil."; }
    }
    if (reason || !["row", "fill", "brush"].includes(editor.tool)) editor.setPreviewText(reason || (editor.tool === "bed" ? `${(footprint.scale.x).toFixed(1)} × ${(footprint.scale.z).toFixed(1)} m · release to place` : "Green: fits · tap to place"));
    if (ghost) ghost.visible = editor.tool === "plant";
    footprint.visible = editor.tool !== "plant";
    if (!valid) { previewMaterial.color.setHex(0xf27878); (ring.material as THREE.MeshBasicMaterial).color.setHex(0xf27878); }
    canvas.dataset.designPreview = valid ? "valid" : "blocked";
  };

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || disabled()) return;
    const editor = getEditor();
    if (previousTool !== editor.tool) { resetPreview(); previousTool = editor.tool; }
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (editor.tool === "box-select") { boxStart = groundPoint(event); controls.enabled = false; canvas.setPointerCapture(event.pointerId); return; }
    if (!["select", "move", "resize"].includes(editor.tool)) {
      controls.enabled = false; canvas.setPointerCapture(event.pointerId);
      if (["row", "path", "trellis", "fence", "fill", "brush", "bed"].includes(editor.tool) && !startPoint) startPoint = groundPoint(event);
      if (editor.tool === "brush" && startPoint) strokePoints = [startPoint];
      showPreview(event); return;
    }
    runtime.updateEditing?.(); setRay(event); gizmos.updateMatrixWorld(true);
    const handle = raycaster.intersectObjects(gizmos.children.filter((o) => !!o.userData.mode), true)[0]?.object;
    if (handle && editor.selection && ["select", "move", "resize"].includes(editor.tool)) {
      const point = groundPoint(event); if (!point) return;
      drag = { plan: editor.plan, mode: handle.userData.mode || "resize", edge: handle.userData.edge, axis: handle.userData.axis, selection: editor.selection, start: point, height: point.height, delta: { x: 0, y: 0 }, roots: [], valid: true };
      controls.enabled = false; canvas.setPointerCapture(event.pointerId); return;
    }
    if (editor.tool === "resize" && editor.selection) {
      const point = groundPoint(event); if (!point) return;
      drag = { plan: editor.plan, mode: "resize", edge: "se", selection: editor.selection, start: point, height: point.height, delta: { x: 0, y: 0 }, roots: [], valid: true };
      controls.enabled = false; canvas.setPointerCapture(event.pointerId); return;
    }
    if (editor.tool !== "move" && editor.tool !== "select") return;
    if (event.shiftKey) { const hit = pick(event); editor.select(hit?.selection ?? null, true); pointerStart = null; controls.enabled = false; return; }
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
    drag = { plan: editor.plan, mode: "move", selection: hit.selection, start: point, height: point.height, delta: { x: 0, y: 0 }, roots, valid: true };
    controls.enabled = false; canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    runtime.needsRender = true;
    if (drag) {
      const point = groundPoint(event); if (!point) return;
      drag.delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
      const editor = getEditor();
      let snapped = alignMove(drag.plan, drag.selection, drag.delta, editor.smartSnap && editor.settings.snap, editor.groupSelections);
      if (drag.axis) snapped = { ...snapped, delta: { x: drag.axis === "x" ? snapped.delta.x : 0, y: drag.axis === "y" ? snapped.delta.y : 0 } };
      drag.delta = snapped.delta;
      try {
        let candidate: PlannerPlan;
        if (drag.mode === "resize") candidate = resizeDesignSelection(drag.plan, drag.selection, drag.edge ?? "se", drag.start, point, editor.settings.snap);
        else if (drag.mode === "rotate") {
          const f = designFootprints(drag.plan).find((f) => f.id === `${drag!.selection.kind}:${drag!.selection.id}`)!;
          const angle = (Math.atan2(point.y - f.y, point.x - f.x) - Math.atan2(drag.start.y - f.y, drag.start.x - f.x)) * 180 / Math.PI + f.rotation;
          candidate = rotateDesignSelection(drag.plan, drag.selection, editor.settings.snap ? Math.round(angle / 15) * 15 : angle);
        } else candidate = editor.groupSelections.length > 1 ? movePlanGroup(drag.plan, editor.groupSelections, drag.delta) : editor.move(drag.plan, drag.selection, drag.delta)!;
        if (!candidate) throw new Error("Choose a position inside the garden or bed soil.");
        drag.candidate = candidate;
        validateDesignChange(drag.plan, candidate); drag.valid = true; drag.reason = "";
      } catch (e) { drag.valid = false; drag.reason = e instanceof Error ? e.message : "Choose a clear position."; }
      drawCandidate(drag.candidate ?? drag.plan, drag.selection, drag.valid ? 0x66e0ac : 0xf27878, snapped.guides);
      const f = drag.candidate && designFootprints(drag.candidate).find((f) => f.id === `${drag!.selection.kind}:${drag!.selection.id}`);
      editor.setPreviewText(drag.reason || (f ? `${(f.width / 100).toFixed(2)} × ${(f.depth / 100).toFixed(2)} m · ${Math.round(f.rotation)}°${snapped.guides.length ? " · aligned" : ""}` : "Release to move"));
      if (drag.valid && drag.mode === "move") for (const { root, position } of drag.roots) {
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
    if (boxStart && pointerStart) {
      const p = groundPoint(event); if (!p) return;
      clearOverlay(alignment); drawLine(alignment, [boxStart, { x: p.x, y: boxStart.y }, p, { x: boxStart.x, y: p.y }, boxStart], 0x98e8ff, .5); return;
    }
    if (getEditor().tool === "brush" && pointerStart) {
      const point = groundPoint(event), e = getEditor();
      if (point && (!strokePoints.length || Math.hypot(point.x - strokePoints.at(-1)!.x, point.y - strokePoints.at(-1)!.y) >= (e.settings.spacingCm || plants.find((p) => p.name === e.settings.crop)!.spacingCm))) strokePoints.push(point);
    }
    showPreview(event);
  };
  const onUp = (event: PointerEvent) => {
    const start = pointerStart; pointerStart = null;
    if (!start || start.id !== event.pointerId) { controls.enabled = true; return; }
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    controls.enabled = true;
    const editor = getEditor();
    if (boxStart) {
      const end = groundPoint(event); if (end) editor.selectGroup(selectionsInRectangle(editor.plan, boxStart, end), event.shiftKey);
      resetPreview(); editor.setTool("select"); return;
    }
    if (drag) {
      const finished = drag;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < (finished.mode === "move" ? 6 : 1)) { restoreDrag(); resetPreview(); editor.select(finished.selection, event.shiftKey); return; }
      const unchanged = JSON.stringify(editor.plan) === JSON.stringify(finished.plan);
      const next = finished.valid && unchanged ? finished.candidate : null;
      restoreDrag(); resetPreview();
      if (next) editor.commit(next); else editor.setError(finished.reason || "Edit cancelled: choose a clear position inside the garden.");
      runtime.refreshEditing?.();
      return;
    }
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10;
    if (disabled() || (moved && (editor.tool === "select" || editor.tool === "move"))) return;
    if (editor.tool === "select" || editor.tool === "move") { editor.select(pick(event)?.selection ?? null, event.shiftKey); return; }
    const point = groundPoint(event);
    if (["row", "path", "trellis", "fence", "fill"].includes(editor.tool) && startPoint && point && !moved && Math.hypot(point.x - startPoint.x, point.y - startPoint.y) < 5) return;
    if (editor.tool === "bed" && !moved) startPoint = null;
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
    if (drag) return;
    clearOverlay(gizmos);
    canvas.dataset.resizeHandles = "0"; canvas.dataset.gizmoPoints = "[]";
    const e = getEditor(), item = e.item; resizeHandle.visible = false;
    if (!item || e.selection?.plantId || !["select", "move", "resize"].includes(e.tool)) return;
    const f = designFootprints(e.plan).find((f) => f.id === `${e.selection!.kind}:${e.selection!.id}`);
    const add = (p: PointCm, mode: string, edge?: string, axis?: string) => {
      const radius = runtime.mobile ? .13 : .09;
      const mesh = new THREE.Mesh(mode === "move" ? new THREE.ConeGeometry(radius, radius * 2.5, 12) : new THREE.SphereGeometry(radius, 12, 8), new THREE.MeshBasicMaterial({ color: mode === "move" ? axis === "x" ? 0xf68b80 : 0x83bafa : 0xffc44d, depthTest: false }));
      if (mode === "move") { if (axis === "x") mesh.rotation.z = -Math.PI / 2; else mesh.rotation.x = Math.PI / 2; }
      mesh.position.set(p.x / 100 - 4.5, (f?.height ?? 34) / 100 + .1, p.y / 100 - 5.4); mesh.renderOrder = 100; mesh.userData = { mode, edge, axis, radius }; gizmos.add(mesh);
    };
    if (f && f.kind !== "path") {
      const edges: [ResizeEdge, number, number][] = [["nw", -1, -1], ["n", 0, -1], ["ne", 1, -1], ["e", 1, 0], ["se", 1, 1], ["s", 0, 1], ["sw", -1, 1], ["w", -1, 0]];
      for (const [edge, x, y] of edges) add(surfaceWorld(f, { x: x * f.width / 2, y: y * f.depth / 2 }), "resize", edge);
      add({ x: f.x + Math.max(70, f.width / 2 + 35), y: f.y }, "move", undefined, "x");
      add({ x: f.x, y: f.y + Math.max(70, f.depth / 2 + 35) }, "move", undefined, "y");
      drawLine(gizmos, [f, { x: f.x + Math.max(70, f.width / 2 + 35), y: f.y }], 0xf68b80, f.height / 100 + .1);
      drawLine(gizmos, [f, { x: f.x, y: f.y + Math.max(70, f.depth / 2 + 35) }], 0x83bafa, f.height / 100 + .1);
      if ("rotationDeg" in item || "name" in item) {
        const radius = Math.hypot(f.width, f.depth) / 200 + .3;
        const rotate = new THREE.Mesh(new THREE.RingGeometry(radius, radius + .07, 64), new THREE.MeshBasicMaterial({ color: 0xcca5ff, side: THREE.DoubleSide, depthTest: false, transparent: true, opacity: .85 }));
        rotate.rotation.x = -Math.PI / 2; rotate.position.set(f.x / 100 - 4.5, f.height / 100 + .11, f.y / 100 - 5.4); rotate.userData.mode = "rotate"; rotate.renderOrder = 99; gizmos.add(rotate);
      }
    } else if ("x2" in item) add({ x: item.x2, y: item.y2 }, "resize", "end");
    gizmos.updateMatrixWorld(true);
    canvas.dataset.resizeHandles = String(gizmos.children.filter((o) => o.userData.mode === "resize").length);
    runtime.updateEditing?.();
    runtime.needsRender = true;
  };
  runtime.updateEditing = () => {
    camera.updateMatrixWorld();
    for (const mesh of gizmos.children) if (mesh.userData.radius) {
      const pixelScale = mesh.position.distanceTo(camera.position) * Math.tan(camera.fov * Math.PI / 360) * 2 / Math.max(1, canvas.clientHeight);
      mesh.scale.setScalar(Math.max(.7, pixelScale * (runtime.mobile ? 11 : 8) / mesh.userData.radius));
    }
    canvas.dataset.gizmoPoints = JSON.stringify(gizmos.children.filter((o) => o.userData.mode).map((o) => { const p = o.position.clone().project(camera); return { mode: o.userData.mode, edge: o.userData.edge, axis: o.userData.axis, x: (p.x + 1) * canvas.clientWidth / 2, y: (1 - p.y) * canvas.clientHeight / 2 }; }));
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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); editor.selectCrops(); }
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
    runtime.cancelEditing = undefined; runtime.refreshEditing = undefined; runtime.updateEditing = undefined;
    clearOverlay(gizmos); gizmos.removeFromParent(); clearOverlay(alignment); alignment.removeFromParent(); clearGuides(); guides.removeFromParent(); dotGeometry.dispose(); dotMaterial.dispose(); resizeHandle.removeFromParent(); resizeHandle.geometry.dispose(); (resizeHandle.material as THREE.Material).dispose();
    cancel(); canvas.removeEventListener("pointerdown", onDown, true); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); window.removeEventListener("keydown", onKey);
    disposeGhost(); preview.removeFromParent(); footprint.geometry.dispose(); previewMaterial.dispose(); ring.geometry.dispose(); (ring.material as THREE.Material).dispose();
  };
}
