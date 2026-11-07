import type { PlannerPlan } from "./planner-plan";
import type { PlanSelection } from "./multi-selection";
import { selectionBounds } from "./multi-selection";

export const planLockKey = (item: PlanSelection) => item.kind + ":" + item.id;

export function parsePlanLocks(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 5000 || value.some(key => typeof key !== "string" || key.length > 200 || !/^(bed|planting|row|object):.+$/.test(key))) {
    throw new Error("Invalid plan item locks.");
  }
  return [...new Set<string>(value)];
}

function lockedItem(plan: PlannerPlan, item: PlanSelection) {
  switch (item.kind) {
    case "bed": return plan.beds.find(bed => String(bed.id) === item.id);
    case "planting": return plan.plantingAreas.find(area => area.id === item.id);
    case "row": return plan.rows.find(row => row.id === item.id);
    case "object": return plan.objects.find(object => object.id === item.id);
  }
}

export function preservesPlanLocks(before: PlannerPlan, after: PlannerPlan): boolean {
  return (before.lockedItems ?? []).every(key => {
    const separator = key.indexOf(":");
    const item = { kind: key.slice(0, separator) as PlanSelection["kind"], id: key.slice(separator + 1) };
    return JSON.stringify(lockedItem(before, item)) === JSON.stringify(lockedItem(after, item))
      && (item.kind !== "planting" || JSON.stringify(selectionBounds(before, item)) === JSON.stringify(selectionBounds(after, item)));
  });
}
