import snapshot from "./total-new-garden-template.json";
import type { PlannerPlan } from "./planner-plan";

export function createMainGardenTemplate(): PlannerPlan {
  const plan = structuredClone(snapshot as PlannerPlan);
  const bedIds = new Map<number, number>();
  const keys = new Map<string, string>();
  const base = Date.now() * 1000 + Math.floor(Math.random() * 900);
  plan.beds.forEach((bed, index) => {
    const id = base + index;
    bedIds.set(bed.id, id);
    keys.set(`bed:${bed.id}`, `bed:${id}`);
    bed.id = id;
  });
  for (const [kind, items] of [
    ["planting", plan.plantingAreas],
    ["row", plan.rows],
    ["object", plan.objects],
  ] as const) {
    for (const item of items) {
      const id = crypto.randomUUID();
      keys.set(`${kind}:${item.id}`, `${kind}:${id}`);
      item.id = id;
      if ("placements" in item) item.placements?.forEach(point => { point.id = crypto.randomUUID(); });
    }
  }
  for (const area of plan.plantingAreas) {
    const id = bedIds.get(area.bedId);
    if (id === undefined) throw new Error("Template planting has no bed.");
    area.bedId = id;
  }
  plan.lockedItems = plan.lockedItems?.flatMap(key => keys.get(key) ?? []);
  return plan;
}
