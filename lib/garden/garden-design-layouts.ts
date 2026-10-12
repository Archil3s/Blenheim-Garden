import type { PlannerPlan } from "./planner-plan";
import { validateEditorPlan } from "./plan-editing";
import { gardenDimensions } from "./garden-dimensions";

export type SavedGardenLayout = { id: string; name: string; savedAt: string; plan: PlannerPlan };
export const layoutsKey = (gardenId: string) => `garden-design-layouts:${gardenId}`;
export function parseSavedLayouts(raw: string | null): SavedGardenLayout[] {
  if (!raw) return [];
  if (raw.length > 4_000_000) throw new Error("Saved layouts are too large to open.");
  const data = JSON.parse(raw) as SavedGardenLayout[];
  if (!Array.isArray(data) || data.length > 10) throw new Error("Saved layouts are invalid.");
  for (const entry of data) {
    if (!entry || typeof entry.id !== "string" || typeof entry.name !== "string" || entry.name.length > 60 || typeof entry.savedAt !== "string" || !entry.plan || ![entry.plan.beds, entry.plan.plantingAreas, entry.plan.rows, entry.plan.objects].every(Array.isArray)) throw new Error("Saved layouts are invalid.");
    if (entry.plan.plantingAreas.some((a) => !entry.plan.beds.some((b) => b.id === a.bedId))) throw new Error("Saved layout planting beds are missing.");
    for (const p of [...entry.plan.plantingAreas, ...entry.plan.rows]) if (typeof p.crop !== "string" || typeof p.variety !== "string" || typeof p.cropIcon !== "string" || !Number.isInteger(p.count) || p.count < 1 || p.count > 10000 || !Number.isFinite(p.spacingCm) || p.spacingCm < 2) throw new Error("Saved layout crops are invalid.");
    validateEditorPlan(entry.plan);
  }
  return data;
}
export function captureLayout(layouts: SavedGardenLayout[], name: string, plan: PlannerPlan): SavedGardenLayout[] {
  if (!name.trim() || name.trim().length > 60) throw new Error("Name the layout using up to 60 characters.");
  validateEditorPlan(plan);
  // Explicit fields keep snapshots free of unrelated browser state or edit keys.
  const snapshot: PlannerPlan = structuredClone({ beds: plan.beds, plantingAreas: plan.plantingAreas, rows: plan.rows, objects: plan.objects, canvasWidthCm: plan.canvasWidthCm, canvasHeightCm: plan.canvasHeightCm, bedProfiles: plan.bedProfiles, designSettings: plan.designSettings });
  const result = [...layouts.filter((l) => l.name !== name.trim()), { id: crypto.randomUUID(), name: name.trim(), savedAt: new Date().toISOString(), plan: snapshot }].slice(-10);
  if (JSON.stringify(result).length > 4_000_000) throw new Error("These layouts exceed browser storage limits. Remove an older layout.");
  return result;
}
export function layoutSummary(plan: PlannerPlan) {
  const size = gardenDimensions(plan);
  return { beds: plan.beds.length, structures: plan.objects.filter((o) => o.type === "structure").length, plants: [...plan.plantingAreas, ...plan.rows].reduce((n, p) => n + p.count, 0), width: size.width / 100, depth: size.height / 100 };
}
