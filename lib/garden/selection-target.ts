import type { PlannerPlan } from "./planner-plan";
import { selectionItem, type PlanSelection } from "./plan-editing";
import { isPlantableStructure } from "./planting-surfaces";

export function matchesSelectionTarget(plan: PlannerPlan, s: PlanSelection, mode: "all" | "beds" | "objects" | "plants") {
  if (mode === "all") return true;
  if (mode === "plants") return s.kind === "area" || s.kind === "row";
  if (mode === "objects") return s.kind === "object";
  const item = selectionItem(plan, s);
  return s.kind === "bed" || (s.kind === "object" && item && "type" in item && isPlantableStructure(item));
}
