import { plants } from "./plant-catalog";
import { areaRectangle, rowPlants } from "./plan-editing";
import { vegetableModelFor } from "./vegetable-model-catalog";
import type { PlannerPlan } from "./planner-plan";

export type CropSelection = { kind: "planting" | "row"; id: string };
export type ResizeEdge = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };

export function selectCrops(plan: PlannerPlan, vegetablesOnly = false): CropSelection[] {
  const eligible = (crop: string) => {
    if (!vegetablesOnly) return true;
    const indexed = plants.find((p) => p.name.toLowerCase() === crop.trim().toLowerCase());
    if (indexed) return indexed.type === "Vegetable";
    const model = vegetableModelFor(crop.trim());
    return !!model && model.crop !== "Raspberry";
  };
  return [...plan.plantingAreas.filter((a) => eligible(a.crop)).map((a): CropSelection => ({ kind: "planting", id: a.id })),
    ...plan.rows.filter((r) => eligible(r.crop)).map((r): CropSelection => ({ kind: "row", id: r.id }))];
}

export function cropsInBox(plan: PlannerPlan, start: Point, end: Point): CropSelection[] {
  const left = Math.min(start.x, end.x), right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y), bottom = Math.max(start.y, end.y);
  return selectCrops(plan).filter((selection) => {
    if (selection.kind === "row") {
      const row = plan.rows.find((r) => r.id === selection.id)!;
      return rowPlants(row).some((p) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom);
    }
    const area = plan.plantingAreas.find((a) => a.id === selection.id)!;
    if (!plan.beds.some((b) => b.id === area.bedId)) return false;
    const r = areaRectangle(plan, area);
    return r.x <= right && r.x + r.w >= left && r.y <= bottom && r.y + r.h >= top;
  });
}

export function cropSelectionSummary(plan: PlannerPlan, selections: CropSelection[]) {
  const areas = new Set(selections.filter((s) => s.kind === "planting").map((s) => s.id));
  const rows = new Set(selections.filter((s) => s.kind === "row").map((s) => s.id));
  const selected = [...plan.plantingAreas.filter((a) => areas.has(a.id)), ...plan.rows.filter((r) => rows.has(r.id))];
  return { plantings: selected.length, plants: selected.reduce((sum, item) => sum + item.count, 0) };
}

export function deleteSelectedCrops(plan: PlannerPlan, selections: CropSelection[]): PlannerPlan {
  const areas = new Set(selections.filter((s) => s.kind === "planting").map((s) => s.id));
  const rows = new Set(selections.filter((s) => s.kind === "row").map((s) => s.id));
  return { ...plan, plantingAreas: plan.plantingAreas.filter((a) => !areas.has(a.id)), rows: plan.rows.filter((r) => !rows.has(r.id)) };
}

export function resizeBedRect(rect: Rect, edge: ResizeEdge, delta: Point, bounds: { width: number; height: number }, snap = true): Rect {
  const step = snap ? 10 : 1;
  const round = (n: number) => Math.round(n / step) * step;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
  let left = rect.x, top = rect.y, right = rect.x + rect.w, bottom = rect.y + rect.h;
  if (edge.includes("w")) left = clamp(round(left + delta.x), 0, right - 40);
  if (edge.includes("e")) right = clamp(round(right + delta.x), left + 40, bounds.width);
  if (edge.includes("n")) top = clamp(round(top + delta.y), 0, bottom - 40);
  if (edge.includes("s")) bottom = clamp(round(bottom + delta.y), top + 40, bounds.height);
  return { x: left, y: top, w: right - left, h: bottom - top };
}
