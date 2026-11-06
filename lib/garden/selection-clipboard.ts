import { blockCorners } from "./planting-block";
import type { PlannerPlan } from "./planner-plan";

export type ClipboardSelection = { kind: "bed" | "planting" | "row" | "object"; id: string };
export type PlanClipboard = { selection: ClipboardSelection; plan: PlannerPlan };
const bound = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function pastePlanSelection(current: PlannerPlan, stored: PlanClipboard) {
  const plan = structuredClone(current);
  const selection = stored.selection;
  const id = crypto.randomUUID();
  if (selection.kind === "bed") {
    const bed = stored.plan.beds.find((item) => String(item.id) === selection.id);
    if (!bed) return null;
    // Sequential IDs could reuse an archived bed's persistent history identity.
    let nextId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    while (plan.beds.some((item) => item.id === nextId)) nextId++;
    plan.beds.push({ ...bed, id: nextId, name: `${bed.name} copy`, x: bound(bed.x + 20 / 9, 100 - bed.w), y: bound(bed.y + 20 / 10.8, 100 - bed.h) });
    plan.plantingAreas.push(...stored.plan.plantingAreas.filter((area) => area.bedId === bed.id).map((area) => ({ ...structuredClone(area), id: crypto.randomUUID(), plantingId: undefined, bedId: nextId, placements: area.placements?.map((point) => ({ ...point, id: crypto.randomUUID() })) })));
    return { plan, selection: { kind: "bed" as const, id: String(nextId) } };
  }
  if (selection.kind === "planting") {
    const area = stored.plan.plantingAreas.find((item) => item.id === selection.id);
    if (!area || !plan.beds.some((bed) => bed.id === area.bedId)) return null;
    plan.plantingAreas.push({ ...structuredClone(area), id, plantingId: undefined, x: bound(area.x + 5, 100 - area.w), y: bound(area.y + 5, 100 - area.h), placements: area.placements?.map((point) => ({ ...point, id: crypto.randomUUID() })) });
    return { plan, selection: { kind: "planting" as const, id } };
  }
  const item = selection.kind === "row" ? stored.plan.rows.find((row) => row.id === selection.id) : stored.plan.objects.find((object) => object.id === selection.id);
  if (!item) return null;
  const copy = { ...structuredClone(item), id };
  if ("placements" in copy) copy.placements = copy.placements?.map((point) => ({ ...point, id: crypto.randomUUID() }));
  if ("x1" in copy) {
    const corners = !("type" in copy) ? blockCorners(copy) : [{ x: copy.x1, y: copy.y1 }, { x: copy.x2, y: copy.y2 }];
    const dx = Math.min(20, 900 - Math.max(...corners.map(p => p.x)));
    const dy = Math.min(20, 1080 - Math.max(...corners.map(p => p.y)));
    copy.x1 += dx; copy.x2 += dx; copy.y1 += dy; copy.y2 += dy;
  } else {
    copy.x = bound(copy.x + 20, 900); copy.y = bound(copy.y + 20, 1080);
  }
  if ("type" in copy) {
    if (copy.type === "shape") copy.locked = false;
    plan.objects.push(copy);
    return { plan, selection: { kind: "object" as const, id } };
  }
  plan.rows.push(copy);
  return { plan, selection: { kind: "row" as const, id } };
}
