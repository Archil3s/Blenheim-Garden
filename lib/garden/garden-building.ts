import type { PlannerPlan, PlannerPlantingArea, PlannerRow } from "./planner-plan";
import { reconcileOwnedPlants, areaPlants, bedRectangle, movePlanSelection, rowPlants, selectionItem, transformContainerPlants, type PlanSelection, type PointCm } from "./plan-editing";
import { gardenDimensions } from "./garden-dimensions";
import { openGardenCovers, plantingPointBlocked, plantingSurfaces, surfaceAt, surfaceContains, surfaceLocal, surfaceWorld } from "./planting-surfaces";
import { plants } from "./plant-catalog";

export function snapPlantingPoint(plan: PlannerPlan, point: PointCm, snap: boolean, target?: string) {
  const surface = plantingSurfaces(plan).find((s) => `${s.kind}:${s.id}` === target) ?? surfaceAt(plan, point);
  const step = snap ? 10 : 1;
  const local = surface ? surfaceLocal(surface, point) : point;
  const snapped = { x: Math.round(local.x / step) * step, y: Math.round(local.y / step) * step };
  return surface ? surfaceWorld(surface, snapped) : snapped;
}

export function allPlantPoints(plan: PlannerPlan) {
  return [...plan.plantingAreas.flatMap((a) => areaPlants(plan, a).map((p) => ({ ...p, spacing: a.spacingCm }))),
    ...plan.rows.flatMap((r) => rowPlants(r).map((p) => ({ ...p, spacing: r.spacingCm })))];
}

export function cropPlacementPoints(plan: PlannerPlan, cropName: string, point: PointCm, start: PointCm | null, mode: "plant" | "row" | "fill" | "brush", target?: string, spacingCm?: number) {
  const source = plants.find((p) => p.name === cropName) ?? plants[0];
  const crop = { ...source, spacingCm: spacingCm || source.spacingCm };
  const surface = target ? plantingSurfaces(plan).find((s) => `${s.kind}:${s.id}` === target) : surfaceAt(plan, start ?? point);
  const occupied = allPlantPoints(plan), result: PointCm[] = [];
  const valid = (p: PointCm) => !plantingPointBlocked(plan, p) && (!surface || surfaceContains(surface, p, Math.min(6, crop.spacingCm * .15)))
    && occupied.every((other) => Math.hypot(p.x - other.x, p.y - other.y) >= (mode === "plant" ? Math.min(5, crop.spacingCm * .2) : (other.spacing + crop.spacingCm) / 2) - .01)
    && result.every((other) => Math.hypot(p.x - other.x, p.y - other.y) >= crop.spacingCm - .01);
  if (target && !surface) throw new Error("Select a planting bed first.");
  if ((mode === "row" || mode === "brush") && start) {
    const distance = Math.hypot(point.x - start.x, point.y - start.y), count = Math.floor(distance / crop.spacingCm) + 1;
    for (let i = 0; i < count; i++) { const t = distance ? i * crop.spacingCm / distance : 0; const p = { x: start.x + (point.x - start.x) * t, y: start.y + (point.y - start.y) * t }; if (valid(p)) result.push(p); }
  } else if (mode === "fill") {
    if (!surface) throw new Error("Select a bed to fill.");
    const a = start ? surfaceLocal(surface, start) : { x: -surface.width / 2, y: -surface.depth / 2 };
    const b = start ? surfaceLocal(surface, point) : { x: surface.width / 2, y: surface.depth / 2 };
    const cols = Math.floor(Math.abs(a.x - b.x) / crop.spacingCm), rows = Math.floor(Math.abs(a.y - b.y) / crop.spacingCm);
    if (cols * rows > 10000) throw new Error("Fill a smaller patch (up to 10,000 plants).");
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const p = surfaceWorld(surface, { x: (a.x + b.x) / 2 + (x - (cols - 1) / 2) * crop.spacingCm,
        y: (a.y + b.y) / 2 + (y - (rows - 1) / 2) * crop.spacingCm });
      if (valid(p)) result.push(p);
    }
  } else if (valid(point)) result.push(point);
  return result;
}

export function addCropPoints(plan: PlannerPlan, cropName: string, variety: string, points: PointCm[], target?: string, spacingCm?: number) {
  if (!points.length) throw new Error("No room here. Plant on soil or adjust the spacing and patch size.");
  const source = plants.find((p) => p.name === cropName) ?? plants[0];
  const crop = { ...source, spacingCm: spacingCm || source.spacingCm };
  const groups = new Map<string, PointCm[]>();
  for (const point of points) {
    const surface = surfaceAt(plan, point);
    const owner = target ?? (surface ? `${surface.kind}:${surface.id}` : "ground");
    groups.set(owner, [...(groups.get(owner) ?? []), point]);
  }
  const areas: PlannerPlantingArea[] = [], rows: PlannerRow[] = [];
  for (const [owner, group] of groups) {
    const fields = { id: crypto.randomUUID(), crop: crop.name, cropIcon: crop.icon, variety, spacingCm: crop.spacingCm, count: group.length };
    if (owner.startsWith("bed:")) {
      const bed = plan.beds.find((b) => String(b.id) === owner.slice(4));
      if (!bed) throw new Error("Planting bed is missing.");
      const r = bedRectangle(bed, plan);
      areas.push({ ...fields, bedId: bed.id, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal",
        placements: group.map((p) => ({ id: crypto.randomUUID(), x: (p.x - r.x) * 100 / r.w, y: (p.y - r.y) * 100 / r.h })) });
    } else {
      rows.push({ ...fields, surfaceId: owner === "ground" ? undefined : owner, x1: group[0].x, y1: group[0].y, x2: group[0].x, y2: group[0].y,
        placements: group.map((p) => ({ id: crypto.randomUUID(), x: p.x - group[0].x, y: p.y - group[0].y })) });
    }
  }
  return { ...plan, plantingAreas: [...plan.plantingAreas, ...areas], rows: [...plan.rows, ...rows] };
}

export function brushPlacementPoints(plan: PlannerPlan, crop: string, path: PointCm[], target?: string, spacingCm?: number) {
  const spacing = spacingCm || plants.find((p) => p.name === crop)?.spacingCm || 25;
  const result: PointCm[] = [];
  for (const p of path) for (const candidate of cropPlacementPoints(plan, crop, p, null, "brush", target, spacing)) {
    if (result.every((other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) >= spacing - .01)) result.push(candidate);
  }
  return result;
}

export function resizePlanSelection(plan: PlannerPlan, selection: PlanSelection, point: PointCm): PlannerPlan {
  const item = selectionItem(plan, selection);
  if (!item || selection.plantId) return plan;
  if (selection.kind === "bed" && "name" in item) {
    const rect = bedRectangle(item, plan), d = gardenDimensions(plan);
    const w = Math.max(40, point.x - rect.x), h = Math.max(40, point.y - rect.y);
    const areas = plan.plantingAreas.map((area) => {
      if (area.bedId !== item.id || area.placements) return area;
      const r = bedRectangle(item, plan);
      return { ...area, placements: areaPlants(plan, area).map((p) => ({ id: p.id, x: ((p.x - r.x) / r.w * 100 - area.x) * 100 / area.w, y: ((p.y - r.y) / r.h * 100 - area.y) * 100 / area.h })) };
    });
    return reconcileOwnedPlants(plan, { ...plan, plantingAreas: areas, beds: plan.beds.map((b) => b.id === item.id ? { ...b, w: w * 100 / d.width, h: h * 100 / d.height } : b) });
  }
  if ("type" in item && item.type === "structure") {
    const local = surfaceLocal({ ...item, rotation: item.rotationDeg }, point);
    const replacement = { ...item, widthCm: Math.max(30, Math.abs(local.x) * 2), depthCm: Math.max(30, Math.abs(local.y) * 2) };
    return transformContainerPlants(plan, { ...plan, objects: plan.objects.map((o) => o.id === item.id ? replacement : o) }, item, replacement);
  }
  if ("x1" in item) {
    const key = selection.kind === "row" ? "rows" : "objects";
    return { ...plan, [key]: plan[key].map((o) => o.id === item.id ? { ...o, x2: point.x, y2: point.y } : o) };
  }
  return plan;
}

export function movePlanGroup(plan: PlannerPlan, selections: PlanSelection[], delta: PointCm) {
  const owners = new Set(selections.filter((s) => !s.plantId && ["bed", "object"].includes(s.kind)).map((s) => `${s.kind}:${s.id}`));
  return selections.filter((s) => {
    const item = selectionItem(plan, s);
    if (item && "bedId" in item && owners.has(`bed:${item.bedId}`)) return false;
    return !(item && "surfaceId" in item && item.surfaceId && owners.has(item.surfaceId));
  }).reduce((next, s) => movePlanSelection(next, s, delta), plan);
}

type Footprint = { x: number; y: number; width: number; depth: number; rotation: number };
function footprintsOverlap(a: Footprint, b: Footprint) {
  const corners = (f: Footprint) => [-1, 1].flatMap((x) => [-1, 1].map((y) => surfaceWorld(f, { x: x * f.width / 2, y: y * f.depth / 2 })));
  const ac = corners(a), bc = corners(b);
  for (const angle of [a.rotation, a.rotation + 90, b.rotation, b.rotation + 90]) {
    const radians = angle * Math.PI / 180, project = (p: PointCm) => p.x * Math.cos(radians) + p.y * Math.sin(radians);
    const aa = ac.map(project), bb = bc.map(project);
    if (Math.max(...aa) <= Math.min(...bb) + .1 || Math.max(...bb) <= Math.min(...aa) + .1) return false;
  }
  return true;
}

export function validateNewBuilding(before: PlannerPlan, next: PlannerPlan) {
  const footprints = (p: PlannerPlan) => [...p.beds.map((b) => {
    const r = bedRectangle(b, p); return { id: `bed:${b.id}`, label: b.name, x: r.x + r.w / 2, y: r.y + r.h / 2, width: r.w, depth: r.h, rotation: 0 };
  }), ...p.objects.filter((o) => o.type === "structure" && !openGardenCovers.has(o.kind)).map((o) => {
    if (o.type !== "structure") throw new Error("Invalid footprint");
    return { id: `object:${o.id}`, label: o.label || o.kind, x: o.x, y: o.y, width: o.widthCm, depth: o.depthCm, rotation: o.rotationDeg };
  })];
  const old = footprints(before);
  for (const added of footprints(next).filter((f) => !old.some((o) => o.id === f.id))) {
    const collision = old.find((f) => footprintsOverlap(added, f));
    if (collision) throw new Error(`This footprint overlaps ${collision.label}. Choose a clear space.`);
  }
  return next;
}
