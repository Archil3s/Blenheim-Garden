"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { cropPlacementPoints, movePlanGroup, resizePlanSelection, snapPlantingPoint } from "@/lib/garden/garden-building";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { areaPlants, areaRectangle, bedRectangle, rowPlants, selectionItem, validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { structurePreset } from "@/lib/garden/structure-catalog";
import { placementPlan, type Garden3DEditor } from "./use-garden-3d-editor";
import { drawPixelGarden, pickPixel, pixelCrop, projectPixel, unprojectPixel, type PixelHit, type PixelView } from "./garden-pixel-scene";
import { loadPixelArtwork, pixelArtworkReady } from "./garden-pixel-assets";
import { plantingPointBlocked } from "@/lib/garden/planting-surfaces";

type PixelRuntime = { fit: () => void; detail: () => void; zoom: (factor: number) => void; paint: () => void; cancel: () => void };

function plantLocationBlocked(plan: PlannerPlan, point: PointCm) {
  return plantingPointBlocked(plan, point);
}

export function GardenPixelCanvas({ plan, editor, disabled }: { plan: PlannerPlan; editor: Garden3DEditor; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null), runtimeRef = useRef<PixelRuntime | null>(null);
  const [presentation, setPresentation] = useState<"artwork" | "exact">("artwork");
  const stateRef = useRef({ plan, editor, disabled, presentation });
  const [zoom, setZoom] = useState(100);
  const [artworkError, setArtworkError] = useState(false);
  const [artworkAttempt, setArtworkAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadPixelArtwork().then(() => { if (active) { setArtworkError(false); runtimeRef.current?.paint(); } }).catch(() => { if (active) { setArtworkError(true); runtimeRef.current?.paint(); } });
    return () => { active = false; };
  }, [artworkAttempt]);
  useEffect(() => { stateRef.current = { plan, editor, disabled, presentation }; runtimeRef.current?.paint(); }, [plan, editor, disabled, presentation]);
  useEffect(() => { runtimeRef.current?.cancel(); }, [editor.tool]);
  useEffect(() => { runtimeRef.current?.fit(); }, [plan.canvasWidthCm, plan.canvasHeightCm]);
  useEffect(() => { if (editor.focusRequest) runtimeRef.current?.detail(); }, [editor.focusRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    let resolution = 1, baseScale = 1, frame = 0, fitted = false;
    let view: PixelView = { x: 0, y: 0, scale: 1, tilt: .82 }, hits: PixelHit[] = [];
    let start: PointCm | null = null, hover: PointCm | null = null, previewPlan: PlannerPlan | null = null;
    let down: { id: number; point: PointCm; world: PointCm; view: PixelView; plan: PlannerPlan; selection: PlanSelection | null; moved: boolean } | null = null;
    const pointers = new Map<number, PointCm>();
    let pinch: { distance: number; scale: number; anchor: PointCm } | null = null, pinching = false;
    const local = (e: PointerEvent | WheelEvent) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; };
    const snapped = (p: PointCm) => { const step = stateRef.current.editor.settings.snap ? 10 : 1; return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step }; };
    const paintNow = () => {
      frame = 0;
      const { plan: current, editor: e } = stateRef.current;
      hits = drawPixelGarden(c, previewPlan ?? current, view, e.selection, stateRef.current.presentation, e.growthStage === "seedling" ? .38 : 1);
      canvas.dataset.pixelArt = pixelArtworkReady() ? "detailed" : "fallback";
      canvas.dataset.pixelReady = "true"; canvas.dataset.pixelView = JSON.stringify({ ...view, width: canvas.width, height: canvas.height });
      canvas.dataset.pixelCrops = [...new Set([...current.plantingAreas.map((a) => a.crop), ...current.rows.map((r) => r.crop)])].sort().join("|");
      if (hover && !stateRef.current.disabled && e.tool !== "select" && e.tool !== "move") {
        const p = snapped(unprojectPixel(hover, view));
        let valid = p.x >= 0 && p.x <= gardenDimensions(current).width && p.y >= 0 && p.y <= gardenDimensions(current).height;
        if (e.tool === "plant" && plantLocationBlocked(current, p)) valid = false;
        try { validateEditorPlan(placementPlan(current, e.tool, p, start, e.settings)); } catch { valid = false; }
        if (["row", "fill", "brush"].includes(e.tool)) {
          const points = cropPlacementPoints(current, e.settings.crop, p, start, e.tool as "row" | "fill" | "brush", e.settings.targetSurfaceId, e.settings.spacingCm);
          e.setPreviewText(`${points.length} plants · release to place`);
          for (const plant of points) { const pos = projectPixel(plant, view); c.fillStyle = "#fff0a4"; c.beginPath(); c.arc(pos.x, pos.y, 4, 0, Math.PI * 2); c.fill(); }
        }
        const q = projectPixel(p, view); c.strokeStyle = valid ? "#fff2b7" : "#da745e"; c.fillStyle = valid ? "#fff2b733" : "#da745e44"; c.lineWidth = 2;
        if (start) { const a = projectPixel(start, view); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(q.x, q.y); c.stroke(); }
        else if (e.tool === "plant") { const img = pixelCrop(e.settings.crop, e.settings.variety), w = (stateRef.current.presentation === "artwork" ? 112 : 70) * view.scale, h = w * img.height / img.width; c.globalAlpha = .65; c.drawImage(img, q.x - w / 2, q.y - h, w, h); c.globalAlpha = 1; c.strokeRect(q.x - 8, q.y - 3, 16, 6); }
        else {
          const preset = structurePreset(e.settings.structureKind);
          const w = (e.tool === "bed" ? e.settings.width : e.tool === "tree" ? e.settings.diameter : e.tool === "structure" ? preset.widthCm : 20) * view.scale;
          const h = (e.tool === "bed" ? e.settings.depth : e.tool === "tree" ? e.settings.diameter : e.tool === "structure" ? preset.depthCm : 20) * view.scale * view.tilt;
          c.fillRect(q.x - w / 2, q.y - h / 2, w, h); c.strokeRect(q.x - w / 2, q.y - h / 2, w, h);
        }
      }
    };
    const paint = () => {
      // Expose the current camera immediately, even while a repaint is queued.
      canvas.dataset.pixelView = JSON.stringify({ ...view, width: canvas.width, height: canvas.height });
      if (!frame) frame = requestAnimationFrame(paintNow);
    };
    const zoomAt = (factor: number, anchor = { x: canvas.width / 2, y: canvas.height / 2 }) => {
      const world = unprojectPixel(anchor, view);
      view.scale = Math.max(baseScale * .6, Math.min(baseScale * 4, view.scale * factor));
      view.x = anchor.x - (world.x - 450) * view.scale; view.y = anchor.y - (world.y - 540) * view.scale * view.tilt;
      setZoom(Math.round(view.scale / baseScale * 100)); paint();
    };
    const fittedScale = () => { const d = gardenDimensions(stateRef.current.plan); return Math.min(canvas.width / (d.width + 140), Math.max(1, canvas.height - 180 / resolution) / (d.height * .82 + 120)); };
    const fit = () => { baseScale = fittedScale(); const d = gardenDimensions(stateRef.current.plan); view = { x: canvas.width / 2 - (d.width / 2 - 450) * baseScale, y: canvas.height / 2 + 12 / resolution - (d.height / 2 - 540) * baseScale * .82, scale: baseScale, tilt: .82 }; setZoom(100); paint(); };
    const detail = () => {
      const { plan: current, editor: e } = stateRef.current;
      const item = e.selection ? selectionItem(current, e.selection) : null;
      let center = { x: 450, y: 540 }, focusWidth = 300;
      if (item && "bedId" in item) { const r = areaRectangle(current, item), plant = areaPlants(current, item).find((p) => p.id === e.selection?.plantId); center = plant ?? { x: r.x + r.w / 2, y: r.y + r.h / 2 }; focusWidth = plant ? 150 : r.w + 100; }
      else if (item && "x1" in item) center = { x: (item.x1 + item.x2) / 2, y: (item.y1 + item.y2) / 2 };
      else if (item && "type" in item && "x" in item) center = { x: item.x, y: item.y };
      else if (item && "name" in item) { const r = bedRectangle(item, stateRef.current.plan); center = { x: r.x + r.w / 2, y: r.y + r.h / 2 }; focusWidth = r.w + 100; }
      else if (current.plantingAreas[0]) { const r = areaRectangle(current, current.plantingAreas[0]); center = { x: r.x + r.w / 2, y: r.y + r.h / 2 }; focusWidth = r.w + 100; }
      if (item && "crop" in item && "x1" in item && e.selection?.plantId) { center = rowPlants(item).find((p) => p.id === e.selection?.plantId) ?? center; focusWidth = 150; }
      view.scale = Math.max(baseScale, Math.min(baseScale * 4, Math.max(baseScale * 2, 1.5), (canvas.width - 32) / focusWidth));
      view.x = canvas.width / 2 - (center.x - 450) * view.scale;
      view.y = canvas.height / 2 + 65 - (center.y - 540) * view.scale * view.tilt;
      setZoom(Math.round(view.scale / baseScale * 100)); paint();
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect(), previousWidth = canvas.width, previousHeight = canvas.height, previousScale = baseScale;
      const nextResolution = 1, width = Math.max(1, Math.round(r.width / nextResolution)), height = Math.max(1, Math.round(r.height / nextResolution));
      if (fitted && width === previousWidth && height === previousHeight && resolution === nextResolution) return;
      resolution = nextResolution; canvas.width = width; canvas.height = height;
      if (!fitted) { fit(); fitted = true; }
      else { baseScale = fittedScale(); const ratio = baseScale / previousScale; view.x = width / 2 + (view.x - previousWidth / 2) * ratio; view.y = height / 2 + (view.y - previousHeight / 2) * ratio; view.scale *= ratio; paint(); }
    };
    const cancel = () => { start = null; down = null; hover = null; previewPlan = null; pointers.clear(); pinch = null; pinching = false; paint(); };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId);
      const p = local(e); pointers.set(e.pointerId, p);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale, anchor: unprojectPixel(mid, view) }; pinching = true; down = null; previewPlan = null; return; }
      const { editor: editorNow } = stateRef.current, hit = pickPixel(hits, p);
      const selection = editorNow.tool === "resize" ? editorNow.selection : editorNow.tool === "move" ? hit?.selection ?? null : null;
      if (["row", "path", "trellis", "fence", "fill", "brush"].includes(editorNow.tool) && !start) start = snapPlantingPoint(stateRef.current.plan, unprojectPixel(p, view), editorNow.settings.snap, editorNow.settings.targetSurfaceId);
      if (selection) editorNow.select(selection);
      down = { id: e.pointerId, point: p, world: unprojectPixel(p, view), view: { ...view }, plan: stateRef.current.plan, selection, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e); if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        view.scale = Math.max(baseScale * .6, Math.min(baseScale * 4, pinch.scale * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.distance || 1)));
        view.x = mid.x - (pinch.anchor.x - 450) * view.scale; view.y = mid.y - (pinch.anchor.y - 540) * view.scale * view.tilt; setZoom(Math.round(view.scale / baseScale * 100)); paint(); return;
      }
      hover = p;
      if (down?.id === e.pointerId) {
        if (Math.hypot(p.x - down.point.x, p.y - down.point.y) * resolution > 5) down.moved = true;
        if (down.moved && down.selection && !stateRef.current.disabled) {
          const now = unprojectPixel(p, down.view), delta = snapped({ x: now.x - down.world.x, y: now.y - down.world.y });
          try { const e = stateRef.current.editor; previewPlan = e.tool === "resize" ? resizePlanSelection(down.plan, down.selection, snapped(now)) : e.groupSelections.length > 1 ? movePlanGroup(down.plan, e.groupSelections, delta) : e.move(down.plan, down.selection, delta); if (previewPlan) validateEditorPlan(previewPlan); } catch { previewPlan = null; }
          canvas.style.cursor = previewPlan ? "grabbing" : "not-allowed";
        } else if (down.moved && (stateRef.current.editor.tool === "select" || stateRef.current.editor.tool === "move")) { view.x = down.view.x + p.x - down.point.x; view.y = down.view.y + p.y - down.point.y; canvas.style.cursor = "grabbing"; }
      } else { const hit = pickPixel(hits, p); canvas.title = hit?.title ?? "Measured garden · drag to pan, scroll to zoom"; canvas.style.cursor = stateRef.current.editor.tool === "select" ? hit ? "pointer" : "grab" : "crosshair"; }
      paint();
    };
    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId); if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (pinching) { if (!pointers.size) { pinch = null; pinching = false; } return; }
      const before = down; down = null;
      if (!before || before.id !== event.pointerId) return;
      const e = stateRef.current.editor;
      if (before.moved && ["select", "move", "resize"].includes(e.tool)) {
        if (before.selection) { const next = previewPlan; previewPlan = null; if (next && JSON.stringify(before.plan) === JSON.stringify(stateRef.current.plan)) e.commit(next); else e.setError("Move cancelled: choose a position inside the garden."); }
        paint(); return;
      }
      if (stateRef.current.disabled) return;
      const p = local(event);
      if (e.tool === "select" || e.tool === "move") { e.select(pickPixel(hits, p)?.selection ?? null, event.shiftKey); paint(); return; }
      const point = snapPlantingPoint(stateRef.current.plan, unprojectPixel(p, view), e.settings.snap, e.settings.targetSurfaceId);
      if (start && ["row", "path", "trellis", "fence", "fill"].includes(e.tool) && !before.moved && Math.hypot(point.x - start.x, point.y - start.y) < 5) return;
      if (point.x < 0 || point.x > gardenDimensions(e.plan).width || point.y < 0 || point.y > gardenDimensions(e.plan).height) { e.setError("Choose a location inside the garden fence."); return; }
      if (e.tool === "plant" && plantLocationBlocked(stateRef.current.plan, point)) { e.setError("Choose a planting location away from paths and structures."); return; }
      if (["row", "path", "trellis"].includes(e.tool) && !start) { start = point; paint(); return; }
      try { if (e.commit(placementPlan(stateRef.current.plan, e.tool, point, start, e.settings))) { start = null; hover = null; e.setPreviewText(""); } } catch (error) { e.setError(error instanceof Error ? error.message : "Unable to place object."); }
      paint();
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), local(e)); };
    const onKey = (event: KeyboardEvent) => {
      const e = stateRef.current.editor;
      if (!stateRef.current.disabled && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void e.save(); return; }
      if ((event.target as HTMLElement)?.closest("dialog, input, select, textarea")) return;
      if (event.key === "Escape") { cancel(); e.setTool("select"); }
      if (stateRef.current.disabled) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) e.redo(); else e.undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); e.redo(); }
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); e.remove(); }
      if (event.target === canvas && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); view.x += event.key === "ArrowLeft" ? 16 : event.key === "ArrowRight" ? -16 : 0; view.y += event.key === "ArrowUp" ? 16 : event.key === "ArrowDown" ? -16 : 0; paint(); }
      if (event.target === canvas && ["+", "=", "-"].includes(event.key)) { event.preventDefault(); zoomAt(event.key === "-" ? .8 : 1.25); }
    };
    runtimeRef.current = { fit, detail, zoom: zoomAt, paint, cancel };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", cancel); canvas.addEventListener("wheel", onWheel, { passive: false }); window.addEventListener("keydown", onKey); window.addEventListener("blur", cancel);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", cancel); canvas.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); window.removeEventListener("blur", cancel); runtimeRef.current = null; };
  }, []);

  return <>
    <div className="gv-3d-workspace-canvas garden-pixel-canvas" aria-label="Interactive pixel garden workspace">
      <canvas ref={canvasRef} tabIndex={0} aria-label="Pixel garden. Drag to pan, scroll or pinch to zoom. Use the toolbar to edit." />
    </div>
    <div className="garden-pixel-camera" aria-label="Pixel garden camera controls">
      <button type="button" aria-label="Zoom out" onClick={() => runtimeRef.current?.zoom(.8)}>−</button>
      <span>{zoom}%</span>
      <button type="button" aria-label="Zoom in" onClick={() => runtimeRef.current?.zoom(1.25)}>+</button>
      <button type="button" onClick={() => runtimeRef.current?.fit()}>Fit garden</button>
      <button type="button" onClick={() => runtimeRef.current?.detail()}>Crop detail</button>
    </div>
    <div className="garden-pixel-presentation" aria-label="Plant display">
      <button type="button" aria-pressed={presentation === "artwork"} onClick={() => setPresentation("artwork")}>Artwork spacing</button>
      <button type="button" aria-pressed={presentation === "exact"} onClick={() => setPresentation("exact")}>All plants</button>
      <small>{presentation === "artwork" ? "Dense crops grouped for clarity · saved counts retained" : "Every planting position · foliage may overlap"}</small>
    </div>
    <div className="garden-pixel-help">Drag to pan · scroll or pinch to zoom · tap to select</div>
    {artworkError && <div className="garden-pixel-art-error" role="status">Detailed artwork could not load. Simple artwork is available. <button type="button" onClick={() => { setArtworkError(false); setArtworkAttempt((value) => value + 1); }}>Retry artwork</button></div>}
  </>;
}
