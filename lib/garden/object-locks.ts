import type { PlannerPlan } from "./planner-plan";
import { areaPlants, bedRectangle, rowPlants, selectionItem, type PlanSelection } from "./plan-editing";
import { surfaceAt } from "./planting-surfaces";

export const selectionKey = (s: PlanSelection) => `${s.kind}:${s.id}${s.plantId ? `:plant:${s.plantId}` : ""}`;
export function rowsForOwner(plan: PlannerPlan, owner: string) {
  return plan.rows.filter((r) => r.surfaceId ? r.surfaceId === owner : rowPlants(r).every((p) => { const surface = surfaceAt(plan, p); return surface && `${surface.kind}:${surface.id}` === owner; }));
}
export function parseObjectLocks(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 10000 || value.some((key) => typeof key !== "string" || !/^(bed|object|area|row):.+/.test(key) || key.length > 500)) throw new Error("Object locks are invalid.");
  return [...new Set(value)] as string[];
}
export function isSelectionLocked(plan: PlannerPlan, s: PlanSelection) {
  const locks = new Set(plan.objectLocks);
  if (locks.has(selectionKey(s)) || locks.has(selectionKey({ kind: s.kind, id: s.id }))) return true;
  const item = selectionItem(plan, s);
  if (item && "bedId" in item) return locks.has(`bed:${item.bedId}`);
  if (item && "surfaceId" in item && item.surfaceId) return locks.has(item.surfaceId);
  if (s.kind === "row" && item && "x1" in item && "count" in item) return [...locks].some((owner) => /^(bed|object):/.test(owner) && rowsForOwner(plan, owner).some((r) => r.id === item.id));
  return false;
}
export function lockedSelectionValue(plan: PlannerPlan, s: PlanSelection): unknown {
  const item = selectionItem(plan, s);
  if (!item) return null;
  if (s.plantId && "count" in item) {
    const point = ("bedId" in item ? areaPlants(plan, item) : rowPlants(item)).find((p) => p.id === s.plantId);
    return point ? { point, crop: item.crop, variety: item.variety } : null;
  }
  if (s.kind === "bed" && "name" in item) return { item, rect: bedRectangle(item, plan), areas: plan.plantingAreas.filter((a) => String(a.bedId) === s.id), rows: rowsForOwner(plan, `bed:${s.id}`) };
  if (s.kind === "object") return { item, rows: rowsForOwner(plan, `object:${s.id}`) };
  if ("bedId" in item) return { item, points: areaPlants(plan, item) };
  return item;
}
export function assertLocksUnchanged(before: PlannerPlan, next: PlannerPlan) {
  const locks = before.objectLocks;
  if (!locks?.length) return;
  const selections: PlanSelection[] = [
    ...before.beds.map((b): PlanSelection => ({ kind: "bed", id: String(b.id) })),
    ...before.objects.map((o): PlanSelection => ({ kind: "object", id: o.id })),
    ...before.plantingAreas.flatMap((a): PlanSelection[] => [{ kind: "area", id: a.id }, ...(locks.some((key) => key.startsWith(`area:${a.id}:plant:`)) ? areaPlants(before, a).map((p): PlanSelection => ({ kind: "area", id: a.id, plantId: p.id })) : [])]),
    ...before.rows.flatMap((r): PlanSelection[] => [{ kind: "row", id: r.id }, ...(locks.some((key) => key.startsWith(`row:${r.id}:plant:`)) ? rowPlants(r).map((p): PlanSelection => ({ kind: "row", id: r.id, plantId: p.id })) : [])]),
  ];
  for (const s of selections) if (locks.includes(selectionKey(s)) && JSON.stringify(lockedSelectionValue(before, s)) !== JSON.stringify(lockedSelectionValue(next, s))) throw new Error("Unlock the selected object before changing it or its contents.");
}
