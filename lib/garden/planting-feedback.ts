import type { PlannerPlan } from "./planner-plan";
import { areaPlants, rowPlants, type PointCm } from "./plan-editing";
import { plantingPointBlocked, plantingSurfaces, surfaceAt, surfaceContains } from "./planting-surfaces";
import { isSelectionLocked } from "./object-locks";
import { gardenDimensions } from "./garden-dimensions";

export function plantingLocationIssue(plan: PlannerPlan, point: PointCm, target?: string) {
  const size = gardenDimensions(plan);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > size.width || point.y > size.height) return "Plant inside the garden boundary.";
  const soil = surfaceAt(plan, point);
  const chosen = target ? plantingSurfaces(plan).find(s => `${s.kind}:${s.id}` === target) : undefined;
  if (target && !chosen) return "Choose an existing planting bed.";
  if (chosen && (!surfaceContains(chosen, point) || soil && (soil.id !== chosen.id || soil.kind !== chosen.kind))) return `Stay on ${chosen.label} soil, or change the planting bed.`;
  if (soil && isSelectionLocked(plan, { kind: soil.kind, id: soil.id })) return `Unlock ${soil.label} before planting.`;
  if (plantingPointBlocked(plan, point)) return "Plant on soil, away from bed walls, paths and solid structures.";
  return null;
}

export function plantingPointFeedback(plan: PlannerPlan, point: PointCm, spacing: number, target?: string) {
  const issue = plantingLocationIssue(plan, point, target);
  if (issue) return issue;
  const soil = surfaceAt(plan, point);
  if (soil && !surfaceContains(soil, point, Math.min(6, spacing * .15))) return "Move a little farther inside the bed soil.";
  const occupied = [...plan.plantingAreas.flatMap(a => areaPlants(plan, a).map(p => ({ ...p, spacing: a.spacingCm }))),
    ...plan.rows.flatMap(r => rowPlants(r).map(p => ({ ...p, spacing: r.spacingCm })))];
  if (occupied.some(p => Math.hypot(point.x - p.x, point.y - p.y) < (spacing + p.spacing) / 2 - .01)) return "Too close to another plant. Move to a clear spot or reduce Plant spacing.";
  return `${soil?.label ?? "Open ground"} · ${spacing} cm spacing · tap to plant`;
}
