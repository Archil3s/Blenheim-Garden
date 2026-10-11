import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import type { PlannerBed, PlannerPlan, PlannerPlantingArea, PlannerRow, PlannerStructure } from "./planner-plan";
import { plantPositionsForArea } from "./plant-spacing-layout";
import { isPlantableStructure, plantingPointBlocked, structureSurface, surfaceAt, surfaceContains, surfaceLocal, surfaceWorld } from "./planting-surfaces";

export type PointCm = { x: number; y: number };
export type PlanSelection = { kind: "bed" | "area" | "row" | "object"; id: string; plantId?: string };
export const gardenWidthCm = 900;
export const gardenHeightCm = 1080;

export function bedRectangle(bed: PlannerBed, plan?: PlannerPlan) {
  const { width, height } = gardenDimensions(plan);
  return { x: bed.x * width / 100, y: bed.y * height / 100, w: bed.w * width / 100, h: bed.h * height / 100 };
}

export function areaRectangle(plan: PlannerPlan, area: PlannerPlantingArea) {
  const bed = plan.beds.find((item) => item.id === area.bedId);
  if (!bed) throw new Error("Planting bed is missing.");
  const rect = bedRectangle(bed, plan);
  return { x: rect.x + area.x * rect.w / 100, y: rect.y + area.y * rect.h / 100, w: area.w * rect.w / 100, h: area.h * rect.h / 100 };
}

export function areaPlants(plan: PlannerPlan, area: PlannerPlantingArea) {
  const rect = areaRectangle(plan, area);
  if (area.placements) return area.placements.map((p) => ({ id: p.id, x: rect.x + p.x * rect.w / 100, y: rect.y + p.y * rect.h / 100 }));
  return plantPositionsForArea(area, rect.w, rect.h, 10000).map((p, index) => ({ id: `${area.id}:generated-${index}`, x: rect.x + p.x, y: rect.y + p.y }));
}

export function rowPlants(row: PlannerRow) {
  const dx = row.x2 - row.x1, dy = row.y2 - row.y1;
  const length = Math.hypot(dx, dy) || 1;
  const placements = row.placements ?? Array.from({ length: row.count }, (_, index) => ({ id: `${row.id}:generated-${index}`, x: row.count === 1 ? 50 : index * 100 / (row.count - 1), y: 0 }));
  return placements.map((p) => dx === 0 && dy === 0 ? { id: p.id, x: row.x1 + p.x, y: row.y1 + p.y } : { id: p.id, x: row.x1 + dx * p.x / 100 - dy / length * p.y, y: row.y1 + dy * p.x / 100 + dx / length * p.y });
}

export function selectionItem(plan: PlannerPlan, selection: PlanSelection) {
  if (selection.kind === "bed") return plan.beds.find((item) => String(item.id) === selection.id);
  if (selection.kind === "area") return plan.plantingAreas.find((item) => item.id === selection.id);
  if (selection.kind === "row") return plan.rows.find((item) => item.id === selection.id);
  return plan.objects.find((item) => item.id === selection.id);
}

export function transformContainerPlants(before: PlannerPlan, next: PlannerPlan, previous: PlannerStructure, replacement: PlannerStructure): PlannerPlan {
  if (!isPlantableStructure(previous)) return next;
  const from = structureSurface(previous), to = structureSurface(replacement);
  const rows = next.rows.map((current) => {
    const row = before.rows.find((r) => r.id === current.id);
    if (!row) return current;
    let changed = false;
    const points = rowPlants(row).map((point) => {
      const owner = surfaceAt(before, point);
      if (row.surfaceId ? row.surfaceId !== `object:${previous.id}` : owner?.kind !== "object" || owner.id !== previous.id) return point;
      changed = true;
      const local = surfaceLocal(from, point);
      const moved = { id: point.id, ...surfaceWorld(to, { x: local.x * to.width / from.width, y: local.y * to.depth / from.depth }) };
      if (!surfaceContains(to, moved)) throw new Error("The resized container must hold all its plants.");
      return moved;
    });
    if (!changed) return next.rows.find((item) => item.id === row.id) ?? row;
    return { ...row, x1: replacement.x, y1: replacement.y, x2: replacement.x, y2: replacement.y,
      count: points.length, placements: points.map((point) => ({ id: point.id, x: point.x - replacement.x, y: point.y - replacement.y })) };
  });
  return { ...next, rows };
}

export function reconcileOwnedPlants(before: PlannerPlan, next: PlannerPlan): PlannerPlan {
  let result = next;
  for (const previous of before.objects.filter(isPlantableStructure)) {
    const replacement = next.objects.find((o) => o.id === previous.id);
    if (replacement && isPlantableStructure(replacement) && JSON.stringify(previous) !== JSON.stringify(replacement)) {
      result = transformContainerPlants(before, result, previous, replacement);
    }
  }
  for (const previous of before.beds) {
    const replacement = next.beds.find((b) => b.id === previous.id);
    if (!replacement) continue;
    const from = bedRectangle(previous, before), to = bedRectangle(replacement, next);
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    result = { ...result, rows: result.rows.map((row) => {
      if (row.surfaceId !== `bed:${previous.id}`) return row;
      const original = before.rows.find((r) => r.id === row.id); if (!original) return row;
      const points = rowPlants(original).map((p) => ({ id: p.id, x: to.x + (p.x - from.x) * to.w / from.w, y: to.y + (p.y - from.y) * to.h / from.h }));
      return { ...row, x1: to.x, y1: to.y, x2: to.x, y2: to.y, count: points.length,
        placements: points.map((p) => ({ id: p.id, x: p.x - to.x, y: p.y - to.y })) };
    }) };
  }
  return result;
}

function editPlant(plan: PlannerPlan, selection: PlanSelection, point?: PointCm, duplicate = false): PlannerPlan {
  if (point && plantingPointBlocked(plan, point)) throw new Error("Move the plant onto soil, away from walls and paths.");
  if (selection.kind === "area") {
    const area = plan.plantingAreas.find((item) => item.id === selection.id);
    if (!area) return plan;
    if (!area.placements && area.count > 10000) throw new Error("Split this planting into areas of at most 10,000 plants before editing individual positions.");
    const rect = areaRectangle(plan, area);
    const plants = areaPlants(plan, area);
    const target = plants.find((p) => p.id === selection.plantId);
    if (!target) return plan;
    if (point && surfaceAt(plan, point)?.kind === "object") {
      const removed = editPlant(plan, selection);
      const row: PlannerRow = { id: crypto.randomUUID(), crop: area.crop, cropIcon: area.cropIcon, variety: area.variety, spacingCm: area.spacingCm,
        surfaceId: surfaceAt(plan, point) ? `${surfaceAt(plan, point)!.kind}:${surfaceAt(plan, point)!.id}` : undefined, x1: point.x, y1: point.y, x2: point.x, y2: point.y, count: 1, placements: [{ id: target.id, x: 0, y: 0 }] };
      return { ...removed, rows: [...removed.rows, row] };
    }
    const next = plants.filter((p) => duplicate || p.id !== target.id);
    if (point || duplicate) next.push({ id: duplicate ? crypto.randomUUID() : target.id, ...(point ?? { x: target.x + 10, y: target.y + 10 }) });
    if (next.some((p) => p.x < rect.x || p.y < rect.y || p.x > rect.x + rect.w || p.y > rect.y + rect.h)) {
      if (duplicate) throw new Error("Duplicate inside the planting area, then move the copy.");
      if (!point) return plan;
      const bed = plan.beds.find((b) => { const r = bedRectangle(b, plan); return point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h; });
      if (bed?.id === area.bedId) {
        const r = bedRectangle(bed, plan);
        const placements = next.map((p) => ({ id: p.id, x: (p.x - r.x) * 100 / r.w, y: (p.y - r.y) * 100 / r.h }));
        return { ...plan, plantingAreas: plan.plantingAreas.map((a) => a.id === area.id ? { ...area, x: 0, y: 0, w: 100, h: 100, placements, count: placements.length } : a) };
      }
      const removed = editPlant(plan, selection);
      if (bed) {
        const r = bedRectangle(bed, plan);
        const copy = { ...area, id: crypto.randomUUID(), plantingId: undefined, bedId: bed.id, x: 0, y: 0, w: 100, h: 100, count: 1, pattern: "single" as const, placements: [{ id: target.id, x: (point.x - r.x) * 100 / r.w, y: (point.y - r.y) * 100 / r.h }] };
        return { ...removed, plantingAreas: [...removed.plantingAreas, copy] };
      }
      const row: PlannerRow = { id: crypto.randomUUID(), crop: area.crop, cropIcon: area.cropIcon, variety: area.variety, spacingCm: area.spacingCm, surfaceId: surfaceAt(plan, point) ? `${surfaceAt(plan, point)!.kind}:${surfaceAt(plan, point)!.id}` : undefined, x1: point.x, y1: point.y, x2: point.x, y2: point.y, count: 1, placements: [{ id: target.id, x: 0, y: 0 }] };
      return { ...removed, rows: [...removed.rows, row] };
    }
    const placements = next.map((p) => ({ id: p.id, x: (p.x - rect.x) * 100 / rect.w, y: (p.y - rect.y) * 100 / rect.h }));
    return { ...plan, plantingAreas: next.length ? plan.plantingAreas.map((item) => item.id === area.id ? { ...area, placements, count: placements.length } : item) : plan.plantingAreas.filter((item) => item.id !== area.id) };
  }
  if (selection.kind === "row") {
    const row = plan.rows.find((item) => item.id === selection.id);
    if (!row) return plan;
    if (!row.placements && row.count > 10000) throw new Error("Split this row before editing individual plants.");
    const plants = rowPlants(row), target = plants.find((p) => p.id === selection.plantId);
    if (!target) return plan;
    if (point && !duplicate) {
      const owner = surfaceAt(plan, point), ownerId = owner ? `${owner.kind}:${owner.id}` : undefined;
      if (ownerId !== row.surfaceId && (row.surfaceId || ownerId)) {
        const removed = editPlant(plan, selection);
        return { ...removed, rows: [...removed.rows, { ...row, id: crypto.randomUUID(), surfaceId: ownerId, x1: point.x, y1: point.y, x2: point.x, y2: point.y,
          count: 1, placements: [{ id: target.id, x: 0, y: 0 }] }] };
      }
    }
    const next = plants.filter((p) => duplicate || p.id !== target.id);
    if (point || duplicate) next.push({ id: duplicate ? crypto.randomUUID() : target.id, ...(point ?? { x: target.x + 10, y: target.y + 10 }) });
    const dx = row.x2 - row.x1, dy = row.y2 - row.y1, length = Math.hypot(dx, dy) || 1;
    const placements = next.map((p) => dx === 0 && dy === 0 ? { id: p.id, x: p.x - row.x1, y: p.y - row.y1 } : { id: p.id, x: ((p.x - row.x1) * dx + (p.y - row.y1) * dy) * 100 / (length * length), y: ((p.y - row.y1) * dx - (p.x - row.x1) * dy) / length });
    return { ...plan, rows: next.length ? plan.rows.map((item) => item.id === row.id ? { ...row, placements, count: placements.length } : item) : plan.rows.filter((item) => item.id !== row.id) };
  }
  return plan;
}

export function movePlanSelection(plan: PlannerPlan, selection: PlanSelection, delta: PointCm): PlannerPlan {
  if (selection.plantId) {
    const parent = selectionItem(plan, selection);
    if (!parent || !("crop" in parent)) return plan;
    const plants = selection.kind === "area" ? areaPlants(plan, parent as PlannerPlantingArea) : rowPlants(parent as PlannerRow);
    const target = plants.find((p) => p.id === selection.plantId);
    return target ? editPlant(plan, selection, { x: target.x + delta.x, y: target.y + delta.y }) : plan;
  }
  if (selection.kind === "bed") return { ...plan, rows: plan.rows.map((row) => row.surfaceId === `bed:${selection.id}` ? { ...row, x1: row.x1 + delta.x, y1: row.y1 + delta.y, x2: row.x2 + delta.x, y2: row.y2 + delta.y } : row), beds: plan.beds.map((bed) => String(bed.id) === selection.id ? { ...bed, x: bed.x + delta.x * 100 / gardenDimensions(plan).width, y: bed.y + delta.y * 100 / gardenDimensions(plan).height } : bed) };
  if (selection.kind === "area") {
    const area = plan.plantingAreas.find((item) => item.id === selection.id);
    const bed = plan.beds.find((item) => item.id === area?.bedId);
    if (!area || !bed) return plan;
    return { ...plan, plantingAreas: plan.plantingAreas.map((item) => item.id === area.id ? { ...item, x: item.x + delta.x / (bed.w * gardenDimensions(plan).width / 100) * 100, y: item.y + delta.y / (bed.h * gardenDimensions(plan).height / 100) * 100 } : item) };
  }
  if (selection.kind === "row") return { ...plan, rows: plan.rows.map((row) => row.id === selection.id ? { ...row, x1: row.x1 + delta.x, y1: row.y1 + delta.y, x2: row.x2 + delta.x, y2: row.y2 + delta.y } : row) };
  const next = { ...plan, objects: plan.objects.map((object) => object.id !== selection.id ? object : "x1" in object ? { ...object, x1: object.x1 + delta.x, y1: object.y1 + delta.y, x2: object.x2 + delta.x, y2: object.y2 + delta.y } : { ...object, x: object.x + delta.x, y: object.y + delta.y }) };
  const object = plan.objects.find((item) => item.id === selection.id);
  const replacement = next.objects.find((item) => item.id === selection.id);
  return object?.type === "structure" && replacement?.type === "structure" ? transformContainerPlants(plan, next, object, replacement) : next;
}

export function deletePlanSelection(plan: PlannerPlan, selection: PlanSelection): PlannerPlan {
  if (selection.plantId) return editPlant(plan, selection);
  if (selection.kind === "bed") {
    if (plan.plantingAreas.some((area) => String(area.bedId) === selection.id) || plan.rows.some((row) => row.surfaceId === `bed:${selection.id}`)) throw new Error("Remove the bed's plantings before deleting the bed.");
    return { ...plan, beds: plan.beds.filter((bed) => String(bed.id) !== selection.id) };
  }
  if (selection.kind === "area") return { ...plan, plantingAreas: plan.plantingAreas.filter((area) => area.id !== selection.id) };
  if (selection.kind === "row") return { ...plan, rows: plan.rows.filter((row) => row.id !== selection.id) };
  const object = plan.objects.find((item) => item.id === selection.id);
  if (object && isPlantableStructure(object) && plan.rows.some((row) => rowPlants(row).some((point) => {
    const owner = surfaceAt(plan, point); return owner?.kind === "object" && owner.id === object.id;
  }))) throw new Error("Remove the container's plants before deleting it.");
  return { ...plan, objects: plan.objects.filter((object) => object.id !== selection.id) };
}

export function duplicatePlanSelection(plan: PlannerPlan, selection: PlanSelection): PlannerPlan {
  if (selection.plantId) return editPlant(plan, selection, undefined, true);
  const item = selectionItem(plan, selection);
  if (!item) return plan;
  if (selection.kind === "object" && "type" in item && isPlantableStructure(item)) {
    const id = crypto.randomUUID(), copy = { ...item, id, label: `${item.label || item.kind} copy` };
    const rows = plan.rows.flatMap((row) => {
      const points = rowPlants(row).filter((p) => row.surfaceId ? row.surfaceId === `object:${item.id}` : surfaceAt(plan, p)?.id === item.id);
      return points.length ? [{ ...row, id: crypto.randomUUID(), surfaceId: `object:${id}`, x1: item.x, y1: item.y, x2: item.x, y2: item.y, count: points.length,
        placements: points.map((p) => ({ id: crypto.randomUUID(), x: p.x - item.x, y: p.y - item.y })) }] : [];
    });
    const next = { ...plan, objects: [...plan.objects, copy], rows: [...plan.rows, ...rows] };
    return movePlanSelection(next, { kind: "object", id }, { x: 20, y: 20 });
  }
  const id = crypto.randomUUID();
  if (selection.kind === "bed") {
    const bed = item as PlannerBed, bedId = Math.max(Date.now(), ...plan.beds.map((b) => b.id + 1));
    const copy = { ...bed, id: bedId, name: `${bed.name} copy` };
    return movePlanSelection({ ...plan, beds: [...plan.beds, copy], rows: [...plan.rows, ...plan.rows.filter((row) => row.surfaceId === `bed:${bed.id}`).map((row) => ({ ...row, id: crypto.randomUUID(), surfaceId: `bed:${bedId}`, placements: row.placements?.map((p) => ({ ...p, id: crypto.randomUUID() })) }))], bedProfiles: { ...plan.bedProfiles, ...(plan.bedProfiles?.[`bed:${bed.id}`] ? { [`bed:${bedId}`]: plan.bedProfiles[`bed:${bed.id}`] } : {}) }, plantingAreas: [...plan.plantingAreas, ...plan.plantingAreas.filter((a) => a.bedId === bed.id).map((a) => ({ ...a, id: crypto.randomUUID(), plantingId: undefined, bedId, placements: a.placements?.map((p) => ({ ...p, id: crypto.randomUUID() })) }))] }, { kind: "bed", id: String(bedId) }, { x: 20, y: 20 });
  }
  const key = selection.kind === "area" ? "plantingAreas" : selection.kind === "row" ? "rows" : "objects";
  const next = { ...plan, [key]: [...plan[key], { ...item, id, plantingId: undefined, ...("placements" in item ? { placements: item.placements?.map((p) => ({ ...p, id: crypto.randomUUID() })) } : {}) }] } as PlannerPlan;
  return movePlanSelection(next, { ...selection, id }, { x: 10, y: 10 });
}

export function validateEditorPlan(plan: PlannerPlan) {
  const { width: gardenWidthCm, height: gardenHeightCm } = gardenDimensions(plan);
  const inGarden = (p: PointCm) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= gardenWidthCm && p.y <= gardenHeightCm;
  for (const bed of plan.beds) {
    const rect = bedRectangle(bed, plan);
    if (![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) || rect.w < 10 || rect.h < 10 || rect.x < 0 || rect.y < 0 || rect.x + rect.w > gardenWidthCm * 1.0501 || rect.y + rect.h > gardenHeightCm * 1.0501) throw new Error("The bed must fit inside the garden.");
  }
  for (const area of plan.plantingAreas) {
    if (area.x < 0 || area.y < 0 || area.w <= 0 || area.h <= 0 || area.x + area.w > 100.01 || area.y + area.h > 100.01) throw new Error("The planting must fit inside its bed.");
    if (area.placements && area.placements.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 || p.x > 100 || p.y > 100)) throw new Error("Plant placement is outside its bed.");
  }
  for (const row of plan.rows) if (!inGarden({ x: row.x1, y: row.y1 }) || !inGarden({ x: row.x2, y: row.y2 }) || rowPlants(row).some((p) => !inGarden(p))) throw new Error("The row must fit inside the garden.");
  for (const row of plan.rows) if (row.surfaceId) {
    const owner = row.surfaceId.split(":").slice(1).join(":");
    const surface = row.surfaceId.startsWith("object:") ? plan.objects.find((o) => o.id === owner && isPlantableStructure(o)) : undefined;
    if (surface && isPlantableStructure(surface) && rowPlants(row).some((p) => !surfaceContains(structureSurface(surface), p))) throw new Error("The plants must stay on their owning bed soil.");
  }
  for (const object of plan.objects) {
    if (object.type === "structure") {
      const angle = object.rotationDeg * Math.PI / 180;
      const halfW = (Math.abs(Math.cos(angle)) * object.widthCm + Math.abs(Math.sin(angle)) * object.depthCm) / 2;
      const halfH = (Math.abs(Math.sin(angle)) * object.widthCm + Math.abs(Math.cos(angle)) * object.depthCm) / 2;
      if (object.widthCm < 30 || object.depthCm < 30 || object.heightCm < (object.kind === "seed-tray" ? 8 : 20) || object.heightCm > 600 || !inGarden({ x: object.x - halfW, y: object.y - halfH }) || !inGarden({ x: object.x + halfW, y: object.y + halfH })) throw new Error("The structure footprint must fit inside the garden.");
    }
    if ("x1" in object) {
      if (!inGarden({ x: object.x1, y: object.y1 }) || !inGarden({ x: object.x2, y: object.y2 }) || Math.hypot(object.x2 - object.x1, object.y2 - object.y1) < 5) throw new Error("Draw a line at least 5 cm long inside the garden.");
    } else if (!inGarden(object)) throw new Error("Place the object inside the garden.");
  }
}
