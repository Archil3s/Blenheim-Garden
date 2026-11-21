"use client";

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from "react";

export function useCanvasNavigation({ stageRef, canvasRef, zoom, canvasWidth, blocked, panBackground, panMode, touchBrowse, onTouchTap, onBackgroundClick, onZoom, onFit }: {
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  canvasWidth: number;
  blocked: boolean;
  panBackground: boolean;
  panMode: boolean;
  touchBrowse: boolean;
  onTouchTap: (target: HTMLElement) => void;
  onBackgroundClick: () => void;
  onZoom: (zoom: number) => void;
  onFit: () => void;
}) {
  const position = useRef({ x: 0, y: 0 });
  const pending = useRef<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
  const currentZoom = useRef(zoom);
  const applyPosition = useCallback(() => {
    const grid = stageRef.current?.querySelector<HTMLElement>(".gv-ruler-grid");
    if (grid) grid.style.translate = `${position.current.x}px ${position.current.y}px`;
  }, [stageRef]);
  const anchor = () => {
    const target = pending.current, canvas = canvasRef.current;
    if (!target || !canvas) return;
    const rect = canvas.getBoundingClientRect(), scale = rect.width / canvasWidth;
    position.current.x += target.x - (rect.left + target.worldX * scale);
    position.current.y += target.y - (rect.top + target.worldY * scale);
    applyPosition();
    pending.current = null;
  };
  useLayoutEffect(() => {
    currentZoom.current = zoom;
    anchor();
  });
  const change = (value: number, x?: number, y?: number) => {
    if (blocked) return;
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = canvas.getBoundingClientRect(), viewport = stage.getBoundingClientRect();
    const px = x ?? viewport.left + viewport.width / 2;
    const py = y ?? viewport.top + viewport.height / 2;
    pending.current = { x: px, y: py, worldX: (px - rect.left) / (rect.width / canvasWidth), worldY: (py - rect.top) / (rect.width / canvasWidth) };
    const next = Math.max(1, Math.min(200, Math.round(value)));
    currentZoom.current = next;
    if (next === zoom) anchor();
    else onZoom(next);
  };
  const changeEvent = useEffectEvent(change);
  const fit = () => {
    if (blocked) return;
    pending.current = null;
    position.current = { x: 0, y: 0 };
    applyPosition();
    stageRef.current?.scrollTo(0, 0);
    onFit();
  };
  const fitEvent = useEffectEvent(fit);
  const isBlocked = useEffectEvent(() => blocked);
  const backgroundClick = useEffectEvent(onBackgroundClick);
  const explicitPan = useEffectEvent(() => panMode);
  const browseByTouch = useEffectEvent((event: PointerEvent) => touchBrowse && event.pointerType === "touch");
  const selectTouch = useEffectEvent(onTouchTap);
  const canPan = useEffectEvent((event: PointerEvent) => panMode || (panBackground && !event.shiftKey && !event.ctrlKey && !event.metaKey && (event.target === canvasRef.current || event.target === stageRef.current || (event.target as HTMLElement).classList.contains("gv-ruler-grid"))));
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let space = false;
    let pan: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean; target?: HTMLElement } | null = null;
    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; zoom: number } | null = null;
    let suppressTouch = false;
    let internalCancel = false;
    let pinchFrame = 0;
    const finishPinchFrame = () => {
      pinchFrame = 0;
      if (!pinch || touches.size !== 2) return;
      const [a, b] = [...touches.values()];
      changeEvent(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.distance), (a.x + b.x) / 2, (a.y + b.y) / 2);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (isBlocked()) return;
      if (event.shiftKey || event.altKey) {
        if (event.altKey) position.current.y -= event.deltaY;
        else position.current.x -= event.deltaY || event.deltaX;
        applyPosition();
        return;
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
      changeEvent(currentZoom.current * Math.exp(-Math.max(-150, Math.min(150, delta)) * .002), event.clientX, event.clientY);
    };
    const down = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !stage.contains(event.target)) return;
      if (event.pointerType === "touch") {
        if (event.isPrimary) reset();
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2) {
          pan = null; delete stage.dataset.panning;
          internalCancel = true;
          canvasRef.current?.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: [...touches.keys()][0] }));
          internalCancel = false;
          const [a, b] = [...touches.values()];
          pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: currentZoom.current };
          suppressTouch = true;
        }
        if (suppressTouch) { event.preventDefault(); event.stopPropagation(); stage.setPointerCapture(event.pointerId); }
      }
      const browse = browseByTouch(event);
      if (!suppressTouch && (event.button === 1 || (event.button === 0 && (space || browse || canPan(event)))) && !isBlocked()) {
        event.preventDefault(); event.stopPropagation();
        pan = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: position.current.x, startY: position.current.y, moved: false, target: browse ? event.target as HTMLElement : undefined };
        stage.setPointerCapture(event.pointerId);
        stage.dataset.panning = "true";
      }
    };
    const move = (event: PointerEvent) => {
      if (!touches.has(event.pointerId) && pan?.id !== event.pointerId) return;
      if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (suppressTouch) {
        event.preventDefault(); event.stopPropagation();
        if (pinch && touches.size === 2 && !pinchFrame) pinchFrame = requestAnimationFrame(finishPinchFrame);
      }
      if (pan?.id === event.pointerId) {
        event.preventDefault(); event.stopPropagation();
        pan.moved ||= Math.hypot(event.clientX - pan.x, event.clientY - pan.y) >= 5;
        if (!pan.moved) return;
        position.current = { x: pan.startX + event.clientX - pan.x, y: pan.startY + event.clientY - pan.y };
        applyPosition();
      }
    };
    const up = (event: PointerEvent) => {
      if (internalCancel || !touches.has(event.pointerId) && pan?.id !== event.pointerId) return;
      if (pinchFrame && touches.size === 2) {
        cancelAnimationFrame(pinchFrame);
        if (event.type === "pointerup") finishPinchFrame();
        else pinchFrame = 0;
      }
      touches.delete(event.pointerId);
      if (suppressTouch) { event.preventDefault(); event.stopPropagation(); }
      if (!touches.size) { suppressTouch = false; pinch = null; }
      if (pan?.id === event.pointerId) {
        if (event.type === "pointerup" && !explicitPan() && !space && event.button === 0 && !pan.moved) {
          if (pan.target) selectTouch(pan.target);
          else backgroundClick();
        }
        event.preventDefault(); event.stopPropagation(); pan = null; delete stage.dataset.panning;
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input,textarea,select,[contenteditable=true],[role=dialog]")) return;
      if (!stage.matches(":hover") && !stage.contains(document.activeElement)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === "Space") { event.preventDefault(); space = true; stage.dataset.panReady = "true"; }
      if (["+", "=", "-", "0"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "0") fitEvent();
        else changeEvent(currentZoom.current + (event.key === "-" ? -10 : 10));
      }
    };
    const reset = () => { cancelAnimationFrame(pinchFrame); pinchFrame = 0; space = false; pan = null; touches.clear(); pinch = null; suppressTouch = false; delete stage.dataset.panReady; delete stage.dataset.panning; };
    const keyup = (event: KeyboardEvent) => { if (event.code === "Space") reset(); };
    stage.addEventListener("wheel", wheel, { passive: false });
    // Capture above React so drawing tools cannot consume the start of a pinch.
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", reset);
    return () => {
      cancelAnimationFrame(pinchFrame);
      stage.removeEventListener("wheel", wheel);
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", reset);
    };
  }, [stageRef, canvasRef, applyPosition]);
  const centerOn = (point: { x: number; y: number }) => {
    if (blocked) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = canvas.getBoundingClientRect();
    const viewport = stage.getBoundingClientRect();
    const scale = rect.width / canvasWidth;
    position.current.x += viewport.left + viewport.width / 2 - (rect.left + point.x * scale);
    position.current.y += viewport.top + viewport.height / 2 - (rect.top + point.y * scale);
    applyPosition();
  };
  return { fit, centerOn, zoomBy: (amount: number) => change(currentZoom.current + amount) };
}
