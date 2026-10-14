"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import { rowsForOwner } from "@/lib/garden/object-locks";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import type { PlanSelection } from "@/lib/garden/plan-editing";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenSceneGuide({ workspace, editor, onReset }: { workspace: RefObject<HTMLDivElement | null>; editor: Garden3DEditor; onReset: () => void }) {
  const labelsRef = useRef<HTMLDivElement>(null), compassRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = workspace.current; if (!root) return;
    let releaseFrame = 0;
    const start = (event: PointerEvent) => {
      if (!(event.target instanceof HTMLCanvasElement) || !matchMedia("(max-width: 840px)").matches) return;
      const viewport = root.querySelector(":scope > .gv-3d-workspace-canvas"); if (!viewport) return;
      cancelAnimationFrame(releaseFrame);
      root.style.setProperty("--garden-gesture-bottom", getComputedStyle(viewport).bottom);
      root.dataset.canvasGesture = "true";
    };
    // Selecting an object can open the sheet during a drag. Keep projection stable
    // until the canvas has processed pointer-up, then reserve the sheet's space.
    const end = () => { releaseFrame = requestAnimationFrame(() => { delete root.dataset.canvasGesture; root.style.removeProperty("--garden-gesture-bottom"); }); };
    root.addEventListener("pointerdown", start, true); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
    return () => { cancelAnimationFrame(releaseFrame); root.removeEventListener("pointerdown", start, true); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); delete root.dataset.canvasGesture; root.style.removeProperty("--garden-gesture-bottom"); };
  }, [workspace]);
  useEffect(() => {
    const root = workspace.current; if (!root) return;
    const observed = new Set<Element>(); let previousHeight = -1;
    const measure = () => { const height = Math.max(0, ...[...root.querySelectorAll(".garden-edit-inspector, .garden-edit-palette, .garden-plant-tools")].map((p) => p.getBoundingClientRect().height)); if (height !== previousHeight) { root.style.setProperty("--garden-sheet-height", `${Math.ceil(height)}px`); previousHeight = height; } };
    const resize = new ResizeObserver(measure);
    const connect = () => { for (const node of observed) if (!root.contains(node)) { resize.unobserve(node); observed.delete(node); } for (const node of root.querySelectorAll(".garden-edit-inspector, .garden-edit-palette, .garden-plant-tools")) if (!observed.has(node)) { observed.add(node); resize.observe(node); } measure(); };
    const mutation = new MutationObserver(connect); mutation.observe(root, { childList: true, subtree: true }); connect();
    return () => { resize.disconnect(); mutation.disconnect(); root.style.removeProperty("--garden-sheet-height"); };
  }, [workspace]);
  const surfaces = useMemo(() => plantingSurfaces(editor.displayPlan).filter((s) => s.shape !== "cells").map((s) => ({ ...s, key: `${s.kind}:${s.id}`, crops: [...new Set([...editor.displayPlan.plantingAreas.filter((a) => s.kind === "bed" && String(a.bedId) === s.id).map((a) => a.crop), ...rowsForOwner(editor.displayPlan, `${s.kind}:${s.id}`).map((r) => r.crop)])].join(", ") || "Empty soil" })), [editor.displayPlan]);
  useEffect(() => {
    let frame = 0, previous = "";
    const byKey = new Map(surfaces.map((s) => [s.key, s]));
    const camera = new THREE.PerspectiveCamera(), point = new THREE.Vector3();
    const owner = (selection: PlanSelection | null) => { if (!selection) return ""; if (selection.kind === "bed" || selection.kind === "object") return `${selection.kind}:${selection.id}`; if (selection.kind === "area") return `bed:${editor.plan.plantingAreas.find((a) => a.id === selection.id)?.bedId}`; return surfaces.find((s) => rowsForOwner(editor.plan, s.key).some((r) => r.id === selection.id))?.key ?? ""; };
    const update = () => {
      const root = workspace.current, canvas = root?.querySelector("canvas"), labelNodes = labelsRef.current?.querySelectorAll<HTMLElement>(".garden-bed-caption");
      if (root && canvas && labelNodes) {
        const box = canvas.getBoundingClientRect(), bounds = root.getBoundingClientRect(), gl = canvas.dataset.camera, pixel = canvas.dataset.pixelView;
        const selected = owner(editor.selection), hovered = owner(canvas.dataset.hoverSelection ? JSON.parse(canvas.dataset.hoverSelection) as PlanSelection : null);
        const stamp = `${gl || pixel}:${selected}:${hovered}:${box.width}:${box.height}`;
        if ((gl || pixel) && previous !== stamp) {
          previous = stamp;
          const data = JSON.parse(gl || pixel!);
          if (gl) { camera.matrixWorld.fromArray(data.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(data.projection); }
          const project = (x: number, y: number) => { if (gl) { point.set(x / 100 - 4.5, .62, y / 100 - 5.4).project(camera); return { x: (point.x + 1) * box.width / 2, y: (1 - point.y) * box.height / 2, visible: point.z > -1 && point.z < 1 }; } return { x: (data.x + (x - 450) * data.scale) * box.width / data.width, y: (data.y + (y - 540) * data.scale * data.tilt) * box.height / data.height, visible: true }; };
          const occupied: { x: number; y: number }[] = [];
          labelNodes.forEach((node) => { const s = byKey.get(node.dataset.surfaceKey ?? ""); if (!s) { node.style.visibility = "hidden"; return; } const p = project(s.x, s.y), x = p.x + box.left - bounds.left, y = p.y + box.top - bounds.top; const important = selected === s.key || hovered === s.key; const visible = p.visible && (editor.showLabels || important) && x > 65 && x < bounds.width - 65 && y > 170 && y < bounds.height - 90 && (important || occupied.every((q) => Math.abs(q.x - x) > 130 || Math.abs(q.y - y) > 55)); node.style.visibility = visible ? "visible" : "hidden"; node.style.left = `${x}px`; node.style.top = `${y}px`; if (visible) occupied.push({ x, y }); });
          const dims = gardenDimensions(editor.plan), north = (editor.plan.designSettings?.northDeg ?? 0) * Math.PI / 180, a = project(dims.width / 2, dims.height / 2), b = project(dims.width / 2 + Math.sin(north) * 100, dims.height / 2 - Math.cos(north) * 100);
          if (compassRef.current) compassRef.current.style.transform = `rotate(${Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI}deg)`;
        }
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame);
  }, [workspace, editor.plan, editor.selection, editor.showLabels, surfaces]);
  return <>
    <div ref={labelsRef} className="garden-scene-labels" aria-label="Garden bed labels">{surfaces.map((s) => <button className="garden-bed-caption" data-surface-key={s.key} style={{ visibility: "hidden", pointerEvents: editor.showLabels && editor.tool === "select" ? "auto" : "none" }} type="button" key={s.key} aria-label={`Select ${s.label}`} onClick={() => { editor.setTool("select"); editor.select({ kind: s.kind, id: s.id }); }}><strong>{s.label}</strong><small>{s.crops}</small></button>)}</div>
    <button className="garden-compass" type="button" aria-label="Reset garden view" title="North · reset garden view" onClick={onReset}><span ref={compassRef} aria-hidden="true">↑</span><b>N</b></button>
  </>;
}
