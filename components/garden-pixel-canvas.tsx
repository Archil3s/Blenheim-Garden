"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { structurePreset } from "@/lib/garden/structure-catalog";
import { placementPlan, type Garden3DEditor } from "./use-garden-3d-editor";
import { drawPixelGarden, pickPixel, pixelCrop, projectPixel, unprojectPixel, type PixelHit, type PixelView } from "./garden-pixel-scene";
import { loadPixelArtwork, pixelArtworkReady } from "./garden-pixel-assets";

type PixelRuntime = { fit: () => void; zoom: (factor: number) => void; paint: () => void; cancel: () => void };

function plantLocationBlocked(plan: PlannerPlan, point: PointCm) {
  return plan.objects.some((o) => {
    if (o.type === "structure" && !/bed|planter|pot|bag|barrel|tray/.test(o.kind)) {
      const angle = o.rotationDeg * Math.PI / 180, dx = point.x - o.x, dy = point.y - o.y;
      return Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle)) < o.widthCm / 2 && Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)) < o.depthCm / 2;
    }
    if (o.type === "path") {
      const dx = o.x2 - o.x1, dy = o.y2 - o.y1;
      const t = Math.max(0, Math.min(1, ((point.x - o.x1) * dx + (point.y - o.y1) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(point.x - o.x1 - t * dx, point.y - o.y1 - t * dy) < o.widthCm / 2;
    }
    return false;
  });
}

export function GardenPixelCanvas({ plan, editor, disabled }: { plan: PlannerPlan; editor: Garden3DEditor; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null), runtimeRef = useRef<PixelRuntime | null>(null);
  const stateRef = useRef({ plan, editor, disabled });
  const [zoom, setZoom] = useState(100);
  const [artworkError, setArtworkError] = useState(false);
  const [artworkAttempt, setArtworkAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadPixelArtwork().then(() => { if (active) { setArtworkError(false); runtimeRef.current?.paint(); } }).catch(() => { if (active) { setArtworkError(true); runtimeRef.current?.paint(); } });
    return () => { active = false; };
  }, [artworkAttempt]);
  useEffect(() => { stateRef.current = { plan, editor, disabled }; runtimeRef.current?.paint(); }, [plan, editor, disabled]);
  useEffect(() => { runtimeRef.current?.cancel(); }, [editor.tool]);

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
      hits = drawPixelGarden(c, previewPlan ?? current, view, e.selection);
      canvas.dataset.pixelArt = pixelArtworkReady() ? "detailed" : "fallback";
      canvas.dataset.pixelReady = "true"; canvas.dataset.pixelView = JSON.stringify({ ...view, width: canvas.width, height: canvas.height });
      canvas.dataset.pixelCrops = [...new Set([...current.plantingAreas.map((a) => a.crop), ...current.rows.map((r) => r.crop)])].sort().join("|");
      if (hover && !stateRef.current.disabled && e.tool !== "select" && e.tool !== "move") {
        const p = snapped(unprojectPixel(hover, view));
        let valid = p.x >= 0 && p.x <= 900 && p.y >= 0 && p.y <= 1080;
        if (e.tool === "plant" && plantLocationBlocked(current, p)) valid = false;
        try { validateEditorPlan(placementPlan(current, e.tool, p, start, e.settings)); } catch { valid = false; }
        const q = projectPixel(p, view); c.strokeStyle = valid ? "#fff2b7" : "#da745e"; c.fillStyle = valid ? "#fff2b733" : "#da745e44"; c.lineWidth = 2;
        if (start) { const a = projectPixel(start, view); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(q.x, q.y); c.stroke(); }
        else if (e.tool === "plant") { const w = 70 * view.scale, h = w * 1.4; c.globalAlpha = .65; c.drawImage(pixelCrop(e.settings.crop, e.settings.variety), q.x - w / 2, q.y - h, w, h); c.globalAlpha = 1; c.strokeRect(q.x - 8, q.y - 3, 16, 6); }
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
    const fit = () => { baseScale = Math.min(canvas.width / 1140, Math.max(1, canvas.height - 170 / resolution) / 1120); view = { x: canvas.width / 2, y: canvas.height / 2 + 12 / resolution, scale: baseScale, tilt: .82 }; setZoom(100); paint(); };
    const resize = () => {
      const r = canvas.getBoundingClientRect(), previousWidth = canvas.width, previousHeight = canvas.height, previousScale = baseScale;
      const nextResolution = 1, width = Math.max(1, Math.round(r.width / nextResolution)), height = Math.max(1, Math.round(r.height / nextResolution));
      if (fitted && width === previousWidth && height === previousHeight && resolution === nextResolution) return;
      resolution = nextResolution; canvas.width = width; canvas.height = height;
      if (!fitted) { fit(); fitted = true; }
      else { baseScale = Math.min(width / 1140, Math.max(1, height - 170 / resolution) / 1120); const ratio = baseScale / previousScale; view.x = width / 2 + (view.x - previousWidth / 2) * ratio; view.y = height / 2 + (view.y - previousHeight / 2) * ratio; view.scale *= ratio; paint(); }
    };
    const cancel = () => { start = null; down = null; hover = null; previewPlan = null; pointers.clear(); pinch = null; pinching = false; paint(); };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId);
      const p = local(e); pointers.set(e.pointerId, p);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale, anchor: unprojectPixel(mid, view) }; pinching = true; down = null; previewPlan = null; return; }
      const { editor: editorNow } = stateRef.current, hit = pickPixel(hits, p);
      const selection = editorNow.tool === "move" ? hit?.selection ?? null : null;
      if (selection) editorNow.setSelection(selection);
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
          previewPlan = stateRef.current.editor.move(down.plan, down.selection, delta);
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
      if (before.moved) {
        if (before.selection) { const next = previewPlan; previewPlan = null; if (next && JSON.stringify(before.plan) === JSON.stringify(stateRef.current.plan)) e.commit(next); else e.setError("Move cancelled: choose a position inside the garden."); }
        paint(); return;
      }
      if (stateRef.current.disabled) return;
      const p = local(event);
      if (e.tool === "select" || e.tool === "move") { e.setSelection(pickPixel(hits, p)?.selection ?? null); paint(); return; }
      const point = snapped(unprojectPixel(p, view));
      if (point.x < 0 || point.x > 900 || point.y < 0 || point.y > 1080) { e.setError("Choose a location inside the garden fence."); return; }
      if (e.tool === "plant" && plantLocationBlocked(stateRef.current.plan, point)) { e.setError("Choose a planting location away from paths and structures."); return; }
      if (["row", "path", "trellis"].includes(e.tool) && !start) { start = point; paint(); return; }
      try { if (e.commit(placementPlan(stateRef.current.plan, e.tool, point, start, e.settings))) start = null; } catch (error) { e.setError(error instanceof Error ? error.message : "Unable to place object."); }
      paint();
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), local(e)); };
    const onKey = (event: KeyboardEvent) => {
      const e = stateRef.current.editor;
      if (!stateRef.current.disabled && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void e.save(); return; }
      if ((event.target as HTMLElement)?.closest("input, select, textarea")) return;
      if (event.key === "Escape") { cancel(); e.setTool("select"); }
      if (stateRef.current.disabled) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) e.redo(); else e.undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); e.redo(); }
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); e.remove(); }
      if (event.target === canvas && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); view.x += event.key === "ArrowLeft" ? 16 : event.key === "ArrowRight" ? -16 : 0; view.y += event.key === "ArrowUp" ? 16 : event.key === "ArrowDown" ? -16 : 0; paint(); }
      if (event.target === canvas && ["+", "=", "-"].includes(event.key)) { event.preventDefault(); zoomAt(event.key === "-" ? .8 : 1.25); }
    };
    runtimeRef.current = { fit, zoom: zoomAt, paint, cancel };
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
    </div>
    <div className="garden-pixel-help">Drag to pan · scroll or pinch to zoom · tap to select</div>
    {artworkError && <div className="garden-pixel-art-error" role="status">Detailed artwork could not load. Simple artwork is available. <button type="button" onClick={() => { setArtworkError(false); setArtworkAttempt((value) => value + 1); }}>Retry artwork</button></div>}
  </>;
}
