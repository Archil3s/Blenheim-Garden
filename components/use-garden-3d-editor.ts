"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlannerPlan, PlannerPlantingArea, PlannerRow, PlannerStructureKind } from "@/lib/garden/planner-plan";
import { areaPlants, areaRectangle, bedRectangle, deletePlanSelection, duplicatePlanSelection, movePlanSelection, rowPlants, selectionItem, validateEditorPlan, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { editKeySession, persistGardenPlan, publishGardenPlan } from "@/lib/garden/plan-persistence";
import { plantCountForArea } from "@/lib/garden/plant-spacing-layout";
import { plants } from "@/lib/garden/plant-catalog";
import { structurePreset } from "@/lib/garden/structure-catalog";
import { plantingPointBlocked, surfaceAt } from "@/lib/garden/planting-surfaces";
import { transformContainerPlants } from "@/lib/garden/plan-editing";

export type EditorTool = "select" | "move" | "plant" | "row" | "bed" | "path" | "trellis" | "tree" | "structure";
export type PlacementSettings = { crop: string; variety: string; structureKind: PlannerStructureKind; width: number; depth: number; height: number; pathWidth: number; postSpacing: number; diameter: number; snap: boolean };

export function placementPlan(plan: PlannerPlan, tool: EditorTool, point: PointCm, start: PointCm | null, settings: PlacementSettings): PlannerPlan {
  const id = crypto.randomUUID();
  const crop = plants.find((p) => p.name === settings.crop) ?? plants[0];
  const cropFields = { crop: crop.name, cropIcon: crop.icon, variety: settings.variety, spacingCm: crop.spacingCm };
  if (tool === "plant") {
    if (plantingPointBlocked(plan, point)) throw new Error("Plant on soil inside the bed or container, away from walls and paths.");
    const surface = surfaceAt(plan, point);
    const bed = surface?.kind === "bed" ? plan.beds.find((bed) => String(bed.id) === surface.id) : undefined;
    if (bed) {
      const rect = bedRectangle(bed);
      const area: PlannerPlantingArea = { id, bedId: bed.id, ...cropFields, x: 0, y: 0, w: 100, h: 100, count: 1, pattern: "single", iconSize: 16, visualSpacing: "normal", placements: [{ id: crypto.randomUUID(), x: (point.x - rect.x) * 100 / rect.w, y: (point.y - rect.y) * 100 / rect.h }] };
      return { ...plan, plantingAreas: [...plan.plantingAreas, area] };
    }
    return { ...plan, rows: [...plan.rows, { id, ...cropFields, x1: point.x, y1: point.y, x2: point.x, y2: point.y, count: 1, placements: [{ id: crypto.randomUUID(), x: 0, y: 0 }] }] };
  }
  if (tool === "bed") {
    const rect = start ? { x: Math.min(point.x, start.x), y: Math.min(point.y, start.y), w: Math.abs(point.x - start.x), h: Math.abs(point.y - start.y) } : { x: point.x - settings.width / 2, y: point.y - settings.depth / 2, w: settings.width, h: settings.depth };
    return { ...plan, beds: [...plan.beds, { id: Date.now(), name: `Bed ${plan.beds.length + 1}`, x: rect.x / 9, y: rect.y / 10.8, w: rect.w / 9, h: rect.h / 10.8 }] };
  }
  if (tool === "row" || tool === "path" || tool === "trellis") {
    if (!start) return plan;
    const line = { id, x1: start.x, y1: start.y, x2: point.x, y2: point.y };
    if (Math.hypot(point.x - start.x, point.y - start.y) < 5) throw new Error("Choose a second point at least 5 cm away.");
    if (tool === "row") return { ...plan, rows: [...plan.rows, { ...line, ...cropFields, count: Math.max(1, Math.floor(Math.hypot(point.x - start.x, point.y - start.y) / crop.spacingCm) + 1) }] };
    if (tool === "path") return { ...plan, objects: [...plan.objects, { ...line, type: "path", widthCm: settings.pathWidth, label: "Path" }] };
    return { ...plan, objects: [...plan.objects, { ...line, type: "trellis", heightCm: settings.height, postSpacingCm: settings.postSpacing, label: "Trellis" }] };
  }
  if (tool === "tree") return { ...plan, objects: [...plan.objects, { id, type: "tree", ...point, diameterCm: settings.diameter, label: "Tree" }] };
  if (tool === "structure") {
    const preset = structurePreset(settings.structureKind);
    return { ...plan, objects: [...plan.objects, { id, type: "structure", kind: preset.kind, ...point, widthCm: preset.widthCm, depthCm: preset.depthCm, heightCm: preset.heightCm, rotationDeg: 0, label: preset.label }] };
  }
  return plan;
}

export function useGarden3DEditor(plan: PlannerPlan, gardenId: string, onChange: (plan: PlannerPlan) => void) {
  const [tool, setTool] = useState<EditorTool>("select");
  const [selection, setSelection] = useState<PlanSelection | null>(null);
  const [settings, setSettings] = useState<PlacementSettings>({ crop: plants[0].name, variety: plants[0].varieties[0], structureKind: "shed", width: 120, depth: 240, height: 180, pathWidth: 60, postSpacing: 150, diameter: 150, snap: true });
  const [status, setStatus] = useState("Use Save to persist your garden");
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<PlannerPlan[]>([]);
  const [future, setFuture] = useState<PlannerPlan[]>([]);
  const current = useRef(plan);
  const saving = useRef(false);
  const historyGarden = useRef(gardenId);
  useEffect(() => {
    if (JSON.stringify(current.current) !== JSON.stringify(plan)) {
      setPast([]); setFuture([]);
    }
    current.current = plan;
  }, [plan]);
  useEffect(() => {
    if (historyGarden.current !== gardenId) {
      historyGarden.current = gardenId;
      setPast([]); setFuture([]); setSelection(null);
    }
  }, [gardenId]);

  const publish = useCallback((next: PlannerPlan) => {
    current.current = next;
    onChange(next);
    try { publishGardenPlan(gardenId, next, "3d"); setStatus("Unsaved changes"); }
    catch { setError("Browser storage is unavailable. Keep this page open and retry Save."); }
  }, [gardenId, onChange]);
  const commit = useCallback((next: PlannerPlan) => {
    try {
      validateEditorPlan(next);
      if (JSON.stringify(current.current) === JSON.stringify(next)) return false;
      const before = structuredClone(current.current);
      setPast((items) => [...items, before].slice(-50)); setFuture([]);
      if (selection?.plantId) {
        const area = next.plantingAreas.find((a) => a.placements?.some((p) => p.id === selection.plantId));
        const row = next.rows.find((r) => r.placements?.some((p) => p.id === selection.plantId));
        if (area) setSelection({ kind: "area", id: area.id, plantId: selection.plantId });
        else if (row) setSelection({ kind: "row", id: row.id, plantId: selection.plantId });
      }
      publish(next); setError(null); return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to edit the plan."); return false; }
  }, [publish, selection]);
  const action = (fn: (plan: PlannerPlan) => PlannerPlan) => { try { return commit(fn(current.current)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to edit the plan."); return false; } };
  const undo = () => { const previous = past.at(-1); if (!previous) return; setPast(past.slice(0, -1)); setFuture([...future, structuredClone(current.current)]); publish(previous); setError(null); };
  const redo = () => { const next = future.at(-1); if (!next) return; setFuture(future.slice(0, -1)); setPast([...past, structuredClone(current.current)]); publish(next); setError(null); };
  const remove = () => { if (selection && action((p) => deletePlanSelection(p, selection))) setSelection(null); };
  const duplicate = () => { if (selection) action((p) => duplicatePlanSelection(p, selection)); };
  const update = (field: string, value: string | number) => {
    if (!selection) return;
    action((p) => {
      const key = selection.kind === "bed" ? "beds" : selection.kind === "area" ? "plantingAreas" : selection.kind === "row" ? "rows" : "objects";
      let areas = p.plantingAreas;
      if (selection.kind === "bed" && (field === "w" || field === "h")) {
        areas = areas.map((area) => {
          if (String(area.bedId) !== selection.id || area.placements) return area;
          if (area.count > 10000) throw new Error("Split this large planting before resizing its bed.");
          const rect = areaRectangle(p, area);
          const placements = areaPlants(p, area).map((plant) => ({ id: plant.id, x: (plant.x - rect.x) * 100 / rect.w, y: (plant.y - rect.y) * 100 / rect.h }));
          return { ...area, placements, count: placements.length };
        });
      }
      const next = { ...p, plantingAreas: areas, [key]: p[key].map((item) => String(item.id) === selection.id ? { ...item, [field]: value } : item) } as PlannerPlan;
      if (key === "plantingAreas" && field === "spacingCm") next.plantingAreas = next.plantingAreas.map((area) => {
        if (area.id !== selection.id || area.placements) return area;
        const rect = areaRectangle(next, area);
        return { ...area, count: plantCountForArea(area, rect.w, rect.h) };
      });
      if (key === "rows") next.rows = next.rows.map((row) => row.id === selection.id && !row.placements ? { ...row, count: Math.max(1, Math.floor(Math.hypot(row.x2 - row.x1, row.y2 - row.y1) / row.spacingCm) + 1) } : row);
      const previous = p.objects.find((item) => item.id === selection.id);
      const replacement = next.objects.find((item) => item.id === selection.id);
      return selection.kind === "object" && previous?.type === "structure" && replacement?.type === "structure"
        ? transformContainerPlants(p, next, previous, replacement) : next;
    });
  };
  const move = (base: PlannerPlan, selected: PlanSelection, delta: PointCm) => { try { const next = movePlanSelection(base, selected, delta); validateEditorPlan(next); return next; } catch { return null; } };
  const save = async () => {
    if (saving.current) return;
    saving.current = true; setStatus("Saving…"); setError(null);
    const snapshot = current.current;
    try {
      const result = await persistGardenPlan(gardenId, snapshot);
      setStatus(current.current !== snapshot ? "Unsaved changes" : result === "cloud" ? "Saved to cloud" : "Local only · enter edit key for cloud Save");
    } catch (e) { setStatus("Save failed · retry"); setError(e instanceof Error ? e.message : "Unable to save."); }
    finally { saving.current = false; }
  };
  const setEditKey = (key: string) => { sessionStorage.setItem(editKeySession, key.trim()); setStatus("Edit key set · Save to cloud"); };
  const item = selection ? selectionItem(plan, selection) : undefined;
  const plantPoint = selection?.plantId && item && "crop" in item ? (selection.kind === "area" ? areaPlants(plan, item as PlannerPlantingArea) : rowPlants(item as PlannerRow)).find((p) => p.id === selection.plantId) : undefined;
  return { plan, gardenId, tool, setTool, selection, setSelection, settings, setSettings, status, error, setError, commit, action, undo, redo, remove, duplicate, update, move, save, setEditKey, item, plantPoint, canUndo: past.length > 0, canRedo: future.length > 0 };
}

export type Garden3DEditor = ReturnType<typeof useGarden3DEditor>;
