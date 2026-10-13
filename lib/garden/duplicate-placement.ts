import type { PlannerPlan, PlannerRow } from "./planner-plan";
import { areaPlants, areaRectangle, bedRectangle, duplicatePlanSelection, movePlanSelection, rowPlants, selectionItem, type PlanSelection, type PointCm } from "./plan-editing";
import { allPlantPoints, movePlanGroup } from "./garden-building";
import { validateDesignChange } from "./garden-design";
import { plantingPointBlocked, surfaceAt } from "./planting-surfaces";
import { rowsForOwner } from "./object-locks";

export type DuplicatePlacement = { base: PlannerPlan; plan: PlannerPlan; selections: PlanSelection[]; sources: PlanSelection[]; anchor: PointCm };
export function selectionCentre(plan: PlannerPlan, s: PlanSelection): PointCm {
  const item = selectionItem(plan, s);
  if (!item) throw new Error("This object is no longer in the garden.");
  if (s.plantId && "count" in item) {
    const p = ("bedId" in item ? areaPlants(plan, item) : rowPlants(item)).find((p) => p.id === s.plantId);
    if (!p) throw new Error("This plant is no longer in the garden.");
    return p;
  }
  if ("name" in item) { const r = bedRectangle(item, plan); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
  if ("bedId" in item) { const r = areaRectangle(plan, item); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
  if ("x1" in item) return { x: (item.x1 + item.x2) / 2, y: (item.y1 + item.y2) / 2 };
  return { x: item.x, y: item.y };
}
export function prepareDuplicatePlacement(base: PlannerPlan, selected: PlanSelection[]): DuplicatePlacement {
  const owners = new Set(selected.filter((s) => !s.plantId).map((s) => `${s.kind}:${s.id}`));
  const sources = selected.filter((s, i) => selected.findIndex((a) => JSON.stringify(a) === JSON.stringify(s)) === i).filter((s) => {
    const item = selectionItem(base, s);
    return item && !(s.plantId && owners.has(`${s.kind}:${s.id}`)) && !("bedId" in item && owners.has(`bed:${item.bedId}`)) && !("surfaceId" in item && item.surfaceId && owners.has(item.surfaceId)) && !(s.kind === "row" && [...owners].some((owner) => owner.startsWith("object:") && rowsForOwner(base, owner).some((r) => r.id === s.id)));
  });
  if (!sources.length) throw new Error("Select something to duplicate.");
  let plan = structuredClone(base);
  const copies: PlanSelection[] = [];
  for (const s of sources) {
    const item = selectionItem(base, s)!;
    if ("count" in item) {
      const p = selectionCentre(base, s), id = crypto.randomUUID();
      const points = s.plantId ? [p] : "bedId" in item ? areaPlants(base, item) : rowPlants(item);
      plan = { ...plan, rows: [...plan.rows, { id, crop: item.crop, cropIcon: item.cropIcon, variety: item.variety, spacingCm: item.spacingCm, x1: p.x, y1: p.y, x2: p.x, y2: p.y, count: points.length, placements: points.map((point) => ({ id: crypto.randomUUID(), x: point.x - p.x, y: point.y - p.y })) }] };
      copies.push({ kind: "row", id });
      continue;
    }
    const before = plan;
    plan = duplicatePlanSelection(plan, s);
    const key = s.kind === "bed" ? "beds" : s.kind === "area" ? "plantingAreas" : s.kind === "row" ? "rows" : "objects";
    const copy = plan[key].find((p) => !before[key].some((old) => old.id === p.id))!;
    const selection = { kind: s.kind, id: String(copy.id) };
    const at = selectionCentre(plan, selection), original = selectionCentre(base, s);
    plan = movePlanSelection(plan, selection, { x: original.x - at.x, y: original.y - at.y });
    copies.push(selection);
  }
  const centres = sources.map((s) => selectionCentre(base, s));
  return { base: structuredClone(base), plan, selections: copies, sources, anchor: { x: centres.reduce((n, p) => n + p.x, 0) / centres.length, y: centres.reduce((n, p) => n + p.y, 0) / centres.length } };
}
export function duplicatePlacementAt(pending: DuplicatePlacement, point: PointCm) {
  let next = movePlanGroup(pending.plan, pending.selections, { x: point.x - pending.anchor.x, y: point.y - pending.anchor.y });
  const detached = new Set(pending.selections.filter((s) => s.kind === "row").map((s) => s.id));
  next = { ...next, rows: next.rows.map((row) => {
    if (!detached.has(row.id)) return row;
    const points = rowPlants(row);
    if (points.some((p) => plantingPointBlocked(next, p))) throw new Error("Place copied plants on soil, away from paths and walls.");
    const occupied = allPlantPoints({ ...next, rows: next.rows.filter((r) => r.id !== row.id) });
    if (points.some((p) => occupied.some((other) => Math.hypot(p.x - other.x, p.y - other.y) < Math.min(5, row.spacingCm * .2) - .01))) throw new Error("Give the copied plants a little space from existing plants.");
    const owners = points.map((p) => { const s = surfaceAt(next, p); return s ? `${s.kind}:${s.id}` : undefined; });
    if (new Set(owners).size > 1) throw new Error("Place this copied planting on one soil surface.");
    return { ...row, surfaceId: owners[0] };
  }) };
  for (let i = 0; i < pending.sources.length; i++) {
    const source = pending.sources[i], copy = pending.selections[i];
    if (copy.kind !== "row") continue;
    const row = next.rows.find((r) => r.id === copy.id); if (!row) continue;
    const points = rowPlants(row), original = selectionItem(pending.base, source);
    if (source.plantId && original && "bedId" in original) {
      const rect = areaRectangle(next, original);
      if (points.every((p) => p.x >= rect.x && p.y >= rect.y && p.x <= rect.x + rect.w && p.y <= rect.y + rect.h)) {
        const all = [...areaPlants(next, original), ...points];
        next = { ...next, rows: next.rows.filter((r) => r.id !== row.id), plantingAreas: next.plantingAreas.map((a) => a.id === source.id ? { ...a, count: all.length, placements: all.map((p) => ({ id: p.id, x: (p.x - rect.x) * 100 / rect.w, y: (p.y - rect.y) * 100 / rect.h })) } : a) };
        continue;
      }
    }
    if (source.plantId && source.kind === "row" && original && "x1" in original && "count" in original && row.surfaceId === original.surfaceId) {
      const all = [...rowPlants(original), ...points], dx = original.x2 - original.x1, dy = original.y2 - original.y1, length = Math.hypot(dx, dy) || 1;
      const replacement: PlannerRow = { ...original, count: all.length, placements: all.map((p) => ({ id: p.id, x: dx === 0 && dy === 0 ? p.x - original.x1 : ((p.x - original.x1) * dx + (p.y - original.y1) * dy) * 100 / (length * length), y: dx === 0 && dy === 0 ? p.y - original.y1 : ((p.y - original.y1) * dx - (p.x - original.x1) * dy) / length })) };
      next = { ...next, rows: next.rows.filter((r) => r.id !== row.id).map((r) => r.id === original.id ? replacement : r) }; continue;
    }
    if (row.surfaceId?.startsWith("bed:")) {
      const bed = next.beds.find((b) => `bed:${b.id}` === row.surfaceId)!; const rect = bedRectangle(bed, next);
      next = { ...next, rows: next.rows.filter((r) => r.id !== row.id), plantingAreas: [...next.plantingAreas, { id: row.id, bedId: bed.id, crop: row.crop, cropIcon: row.cropIcon, variety: row.variety, spacingCm: row.spacingCm, count: row.count, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: points.map((p) => ({ id: p.id, x: (p.x - rect.x) * 100 / rect.w, y: (p.y - rect.y) * 100 / rect.h })) }] };
    }
  }
  validateDesignChange(pending.base, next);
  return next;
}
export function placedDuplicateSelections(pending: DuplicatePlacement, next: PlannerPlan): PlanSelection[] {
  return pending.selections.map((s, i) => {
    if (!pending.sources[i].plantId) return next.plantingAreas.some((a) => a.id === s.id) ? { kind: "area", id: s.id } : s;
    const id = pending.plan.rows.find((r) => r.id === s.id)?.placements?.[0].id;
    const area = next.plantingAreas.find((a) => a.placements?.some((p) => p.id === id));
    const row = next.rows.find((r) => r.placements?.some((p) => p.id === id));
    return area ? { kind: "area", id: area.id, plantId: id } : row ? { kind: "row", id: row.id, plantId: id } : s;
  });
}
