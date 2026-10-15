import type { PlannerPlan } from "./planner-plan";
import { areaPlants, bedRectangle, duplicatePlanSelection, reconcileOwnedPlants, rowBelongsTo, rowPlants, selectionItem, validateEditorPlan, type PlanSelection, type PointCm } from "./plan-editing";
import { gardenDimensions } from "./garden-dimensions";
import { openGardenCovers, surfaceLocal, surfaceWorld } from "./planting-surfaces";
import { movePlanGroup, resizePlanSelection } from "./garden-building";
import { resizeBedRect, type ResizeEdge } from "./planner-selection";
import { selectCrops } from "./planner-selection";
import { assertLocksUnchanged } from "./object-locks";

export type DesignFootprint = { id: string; label: string; x: number; y: number; width: number; depth: number; rotation: number; height: number; kind: "bed" | "structure" | "path" | "tree" };
export type DesignSettings = { northDeg: number; walkwayCm: number };
export const defaultDesignSettings: DesignSettings = { northDeg: 0, walkwayCm: 60 };

export function designFootprints(plan: PlannerPlan, includeTrees = false): DesignFootprint[] {
  return [...plan.beds.map((b): DesignFootprint => { const r = bedRectangle(b, plan); return { id: `bed:${b.id}`, label: b.name, x: r.x + r.w / 2, y: r.y + r.h / 2, width: r.w, depth: r.h, rotation: 0, height: 34, kind: "bed" }; }),
    ...plan.objects.flatMap((o): DesignFootprint[] => {
      if (o.type === "structure") return [{ id: `object:${o.id}`, label: o.label || o.kind, x: o.x, y: o.y, width: o.widthCm, depth: o.depthCm, rotation: o.rotationDeg, height: o.heightCm, kind: "structure" }];
      if (o.type === "path") return [{ id: `object:${o.id}`, label: o.label || "Path", x: (o.x1 + o.x2) / 2, y: (o.y1 + o.y2) / 2, width: Math.hypot(o.x2 - o.x1, o.y2 - o.y1), depth: o.widthCm, rotation: Math.atan2(o.y2 - o.y1, o.x2 - o.x1) * 180 / Math.PI, height: 0, kind: "path" }];
      if (o.type === "tree" && includeTrees) return [{ id: `object:${o.id}`, label: o.label || "Tree", x: o.x, y: o.y, width: o.diameterCm, depth: o.diameterCm, rotation: 0, height: Math.max(150, o.diameterCm * 1.4), kind: "tree" }];
      return [];
    })];
}

export function footprintCorners(f: DesignFootprint): PointCm[] {
  return [{ x: -f.width / 2, y: -f.depth / 2 }, { x: f.width / 2, y: -f.depth / 2 }, { x: f.width / 2, y: f.depth / 2 }, { x: -f.width / 2, y: f.depth / 2 }].map((p) => surfaceWorld(f, p));
}
const cross = (a: PointCm, b: PointCm, p: PointCm) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
export function overlapArea(a: DesignFootprint, b: DesignFootprint) {
  let polygon = footprintCorners(a); const clip = footprintCorners(b);
  for (let i = 0; i < 4 && polygon.length; i++) {
    const x = clip[i], y = clip[(i + 1) % 4], result: PointCm[] = [];
    for (let j = 0; j < polygon.length; j++) {
      const p = polygon[j], q = polygon[(j + 1) % polygon.length], cp = cross(x, y, p), cq = cross(x, y, q);
      if (cp >= 0) result.push(p);
      if ((cp >= 0) !== (cq >= 0)) { const t = cp / (cp - cq); result.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }); }
    }
    polygon = result;
  }
  return Math.abs(polygon.reduce((area, p, i) => { const q = polygon[(i + 1) % polygon.length]; return area + p.x * q.y - p.y * q.x; }, 0)) / 2;
}

export function validateDesignChange(before: PlannerPlan, next: PlannerPlan) {
  assertLocksUnchanged(before, next);
  validateEditorPlan(next);
  const covers = new Set(next.objects.filter((o) => o.type === "structure" && openGardenCovers.has(o.kind)).map((o) => `object:${o.id}`));
  const old = new Map(designFootprints(before).map((f) => [f.id, f]));
  const footprints = designFootprints(next).filter((f) => !covers.has(f.id));
  const dimensions = gardenDimensions(next);
  for (const f of footprints) {
    const previousFootprint = old.get(f.id);
    if (previousFootprint && (["x", "y", "width", "depth", "rotation"] as const).every((key) => Math.abs(previousFootprint[key] - f[key]) < .001)) continue;
    const corners = footprintCorners(f);
    if (corners.some((p) => p.x < -.01 || p.y < -.01 || p.x > dimensions.width + .01 || p.y > dimensions.height + .01)) throw new Error(`${f.label} is outside the garden.`);
    for (const other of footprints) {
      if (other.id === f.id || (f.kind === "path" && other.kind === "path")) continue;
      const area = overlapArea(f, other);
      const previous = old.get(f.id), oldOther = old.get(other.id);
      // Existing legacy overlaps may be reduced without blocking unrelated edits.
      const previousArea = previous && oldOther ? overlapArea(previous, oldOther) : 0;
      if (area > Math.max(.5, previousArea + .5)) throw new Error(`${f.label} overlaps ${other.label}. Move into a clear space.`);
    }
  }
  return next;
}

function box(f: DesignFootprint) { const c = footprintCorners(f); return { l: Math.min(...c.map((p) => p.x)), r: Math.max(...c.map((p) => p.x)), t: Math.min(...c.map((p) => p.y)), b: Math.max(...c.map((p) => p.y)) }; }
export function placementClearances(plan: PlannerPlan, selected: PlanSelection) {
  const all = designFootprints(plan), current = all.find((f) => f.id === `${selected.kind}:${selected.id}`);
  if (!current || selected.plantId) return null;
  const a = box(current), dims = gardenDimensions(plan);
  const gaps = { left: a.l, right: dims.width - a.r, above: a.t, below: dims.height - a.b };
  for (const f of all.filter((f) => f.id !== current.id)) {
    if (plan.objects.some((o) => `object:${o.id}` === f.id && o.type === "structure" && openGardenCovers.has(o.kind))) continue;
    const b = box(f);
    if (Math.min(a.b, b.b) > Math.max(a.t, b.t)) { if (b.r <= a.l) gaps.left = Math.min(gaps.left, a.l - b.r); if (b.l >= a.r) gaps.right = Math.min(gaps.right, b.l - a.r); }
    if (Math.min(a.r, b.r) > Math.max(a.l, b.l)) { if (b.b <= a.t) gaps.above = Math.min(gaps.above, a.t - b.b); if (b.t >= a.b) gaps.below = Math.min(gaps.below, b.t - a.b); }
  }
  return gaps;
}

export function duplicateDesignGroup(plan: PlannerPlan, selections: PlanSelection[]) {
  const owners = new Set(selections.filter((s) => !s.plantId && ["bed", "object"].includes(s.kind)).map((s) => `${s.kind}:${s.id}`));
  const roots = selections.filter((s) => { const item = selectionItem(plan, s); return !(item && "bedId" in item && owners.has(`bed:${item.bedId}`)) && !(item && "surfaceId" in item && item.surfaceId && owners.has(item.surfaceId)); });
  const duplicated = roots.reduce((next, s) => duplicatePlanSelection(next, s), plan);
  const copies: PlanSelection[] = [
    ...duplicated.beds.filter((b) => !plan.beds.some((old) => old.id === b.id)).map((b): PlanSelection => ({ kind: "bed", id: String(b.id) })),
    ...duplicated.objects.filter((o) => !plan.objects.some((old) => old.id === o.id)).map((o): PlanSelection => ({ kind: "object", id: o.id })),
    ...duplicated.plantingAreas.filter((a) => !plan.plantingAreas.some((old) => old.id === a.id)).map((a): PlanSelection => ({ kind: "area", id: a.id })),
    ...duplicated.rows.filter((r) => !plan.rows.some((old) => old.id === r.id)).map((r): PlanSelection => ({ kind: "row", id: r.id })),
  ];
  for (let radius = 0; radius <= Math.max(...Object.values(gardenDimensions(plan))); radius += 50) for (const delta of radius === 0 ? [{ x: 0, y: 0 }] : [{ x: radius, y: 0 }, { x: 0, y: radius }, { x: -radius, y: 0 }, { x: 0, y: -radius }, { x: radius, y: radius }, { x: -radius, y: -radius }]) {
    try { return validateDesignChange(plan, movePlanGroup(duplicated, copies, delta)); } catch { /* Keep the group together while finding clear space. */ }
  }
  throw new Error("No clear space for this group. Enlarge the garden or choose fewer objects.");
}
export type AlignmentGuide = { axis: "x" | "y"; value: number; label: string };
export function alignMove(plan: PlannerPlan, selection: PlanSelection, delta: PointCm, enabled: boolean, excluded: PlanSelection[] = []) {
  const f = designFootprints(plan).find((f) => f.id === `${selection.kind}:${selection.id}`);
  if (!enabled || !f || selection.plantId) return { delta, guides: [] as AlignmentGuide[] };
  const moving = box(f), dims = gardenDimensions(plan), step = plan.designSettings?.walkwayCm ?? 60;
  const excludedIds = new Set([...excluded, selection].map((s) => `${s.kind}:${s.id}`));
  const candidates = designFootprints(plan).filter((o) => !excludedIds.has(o.id)).map(box);
  const result = { ...delta }, guides: AlignmentGuide[] = [];
  for (const axis of ["x", "y"] as const) {
    const from = axis === "x" ? [moving.l, (moving.l + moving.r) / 2, moving.r] : [moving.t, (moving.t + moving.b) / 2, moving.b];
    const targets = axis === "x" ? [0, dims.width, ...candidates.flatMap((b) => [b.l, (b.l + b.r) / 2, b.r, b.l - step, b.r + step])] : [0, dims.height, ...candidates.flatMap((b) => [b.t, (b.t + b.b) / 2, b.b, b.t - step, b.b + step])];
    let best = 8, correction = 0, target = 0;
    for (const a of from) for (const b of targets) { const distance = Math.abs(b - a - delta[axis]); if (distance < best) { best = distance; correction = b - a - delta[axis]; target = b; } }
    if (best < 8) { result[axis] += correction; guides.push({ axis, value: target, label: "Aligned edge / centre or walkway gap" }); }
  }
  if (guides.length) {
    try { validateDesignChange(plan, movePlanGroup(plan, excluded.length > 1 ? excluded : [selection], result)); }
    catch { return { delta, guides: [] as AlignmentGuide[] }; }
  }
  return { delta: result, guides };
}

export function resizeDesignSelection(plan: PlannerPlan, selection: PlanSelection, edge: ResizeEdge | "end", start: PointCm, point: PointCm, snap: boolean) {
  const item = selectionItem(plan, selection); if (!item || selection.plantId) return plan;
  if (selection.kind === "bed" && "name" in item) {
    const from = bedRectangle(item, plan), dimensions = gardenDimensions(plan);
    const r = resizeBedRect(from, edge === "end" ? "se" : edge, { x: point.x - start.x, y: point.y - start.y }, dimensions, snap);
    const frozen = resizePlanSelection(plan, selection, { x: from.x + from.w, y: from.y + from.h });
    return reconcileOwnedPlants(plan, { ...frozen, beds: frozen.beds.map((b) => b.id === item.id ? { ...b, x: r.x * 100 / dimensions.width, y: r.y * 100 / dimensions.height, w: r.w * 100 / dimensions.width, h: r.h * 100 / dimensions.height } : b) });
  }
  if ("type" in item && item.type === "structure") {
    const a = surfaceLocal({ ...item, rotation: item.rotationDeg }, start), b = surfaceLocal({ ...item, rotation: item.rotationDeg }, point);
    const step = snap ? 10 : 1, round = (n: number) => Math.round(n / step) * step;
    const dx = b.x - a.x, dy = b.y - a.y, e = edge === "end" ? "se" : edge;
    const widthCm = Math.max(30, round(item.widthCm + (e.includes("w") ? -dx : e.includes("e") ? dx : 0) * 2));
    const depthCm = Math.max(30, round(item.depthCm + (e.includes("n") ? -dy : e.includes("s") ? dy : 0) * 2));
    return reconcileOwnedPlants(plan, { ...plan, objects: plan.objects.map((o) => o.id === item.id ? { ...item, widthCm, depthCm } : o) });
  }
  return resizePlanSelection(plan, selection, point);
}

export function rotateDesignSelection(plan: PlannerPlan, selection: PlanSelection, degrees: number) {
  const item = selectionItem(plan, selection);
  if (item && "name" in item && selection.kind === "bed") {
    const turns = (Math.round(degrees / 90) % 4 + 4) % 4;
    if (!turns) return plan;
    const old = bedRectangle(item, plan), center = { x: old.x + old.w / 2, y: old.y + old.h / 2 }, dims = gardenDimensions(plan);
    const width = turns % 2 ? old.h : old.w, depth = turns % 2 ? old.w : old.h;
    const x = center.x - width / 2, y = center.y - depth / 2;
    const rotate = (point: PointCm) => { const angle = turns * Math.PI / 2, dx = point.x - center.x, dy = point.y - center.y; return { x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle), y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle) }; };
    const areas = plan.plantingAreas.map((area) => {
      if (area.bedId !== item.id) return area;
      if (area.count > 10000) throw new Error("Split this planting before rotating its bed.");
      const points = areaPlants(plan, area).map((p) => ({ id: p.id, ...rotate(p) }));
      return { ...area, x: 0, y: 0, w: 100, h: 100, placements: points.map((p) => ({ id: p.id, x: (p.x - x) / width * 100, y: (p.y - y) / depth * 100 })), count: points.length };
    });
    const rows = plan.rows.map((row) => {
      if (!rowBelongsTo(plan, row, `bed:${item.id}`)) return row;
      const points = rowPlants(row).map((p) => ({ id: p.id, ...rotate(p) }));
      return { ...row, surfaceId: `bed:${item.id}`, x1: x, y1: y, x2: x, y2: y, placements: points.map((p) => ({ id: p.id, x: p.x - x, y: p.y - y })), count: points.length };
    });
    return { ...plan, plantingAreas: areas, rows, beds: plan.beds.map((bed) => bed.id === item.id ? { ...bed, x: x * 100 / dims.width, y: y * 100 / dims.height, w: width * 100 / dims.width, h: depth * 100 / dims.height } : bed) };
  }
  if (!item || !("rotationDeg" in item)) return plan;
  return reconcileOwnedPlants(plan, { ...plan, objects: plan.objects.map((o) => o.id === item.id ? { ...item, rotationDeg: (degrees % 360 + 360) % 360 } : o) });
}

export function selectPlanCrops(plan: PlannerPlan, vegetablesOnly = false): PlanSelection[] {
  return selectCrops(plan, vegetablesOnly).map((s) => ({ ...s, kind: s.kind === "planting" ? "area" : "row" }));
}
export function selectionsInRectangle(plan: PlannerPlan, a: PointCm, b: PointCm): PlanSelection[] {
  const l = Math.min(a.x, b.x), r = Math.max(a.x, b.x), t = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  const inside = (p: PointCm) => p.x >= l && p.x <= r && p.y >= t && p.y <= bottom;
  return [...designFootprints(plan).filter((f) => inside(f)).map((f): PlanSelection => ({ kind: f.id.startsWith("bed:") ? "bed" : "object", id: f.id.slice(f.id.indexOf(":") + 1) })),
    ...plan.plantingAreas.filter((a) => areaPlants(plan, a).some(inside)).map((a): PlanSelection => ({ kind: "area", id: a.id })),
    ...plan.rows.filter((r) => rowPlants(r).some(inside)).map((r): PlanSelection => ({ kind: "row", id: r.id }))];
}

export type AccessIssue = { id: string; message: string; point: PointCm; width?: number; from?: PointCm; to?: PointCm };
export function accessIssues(plan: PlannerPlan): AccessIssue[] {
  const gap = plan.designSettings?.walkwayCm ?? 60, dims = gardenDimensions(plan);
  const covers = new Set(plan.objects.filter((o) => o.type === "structure" && openGardenCovers.has(o.kind)).map((o) => `object:${o.id}`));
  const footprints = designFootprints(plan).filter((f) => f.kind !== "path" && !covers.has(f.id)), result: AccessIssue[] = [];
  for (let i = 0; i < footprints.length; i++) {
    const f = footprints[i], a = box(f);
    if (f.kind === "bed" || plan.objects.some((o) => `object:${o.id}` === f.id && o.type === "structure" && /bed|planter|wicking/.test(o.kind))) {
      const narrow = Math.min(f.width, f.depth);
      const margin = f.width <= f.depth ? Math.min(a.l, dims.width - a.r) : Math.min(a.t, dims.height - a.b);
      const limit = margin < gap ? 60 : 120;
      if (narrow > limit + .1) result.push({ id: f.id, point: f, message: `${f.label}: ${Math.round(narrow)} cm across; check reach ${limit === 60 ? "with boundary access restricted" : "from both sides"}.` });
    }
    for (const g of footprints.slice(i + 1)) {
      const b = box(g), vertical = Math.min(a.b, b.b) > Math.max(a.t, b.t), horizontal = Math.min(a.r, b.r) > Math.max(a.l, b.l);
      let width = Infinity, from: PointCm | undefined, to: PointCm | undefined;
      if (vertical && (a.r <= b.l || b.r <= a.l)) { const y = (Math.max(a.t, b.t) + Math.min(a.b, b.b)) / 2; const left = a.r <= b.l ? a : b, right = a.r <= b.l ? b : a; width = right.l - left.r; from = { x: left.r, y }; to = { x: right.l, y }; }
      if (horizontal && (a.b <= b.t || b.b <= a.t)) { const x = (Math.max(a.l, b.l) + Math.min(a.r, b.r)) / 2; const top = a.b <= b.t ? a : b, bottom = a.b <= b.t ? b : a; width = bottom.t - top.b; from = { x, y: top.b }; to = { x, y: bottom.t }; }
      if (width < gap && from && to) result.push({ id: `${f.id}/${g.id}`, width, from, to, point: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, message: `${f.label} ↔ ${g.label}: ${Math.round(width)} cm gap; target ${gap} cm.` });
    }
  }
  for (const p of plan.objects) if (p.type === "path" && p.widthCm < gap) result.push({ id: p.id, point: { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 }, message: `${p.label || "Path"}: ${p.widthCm} cm wide; target ${gap} cm.` });
  for (const p of designFootprints(plan).filter((f) => f.kind === "path")) for (const f of footprints) if (overlapArea(p, f) > .5) result.push({ id: `${p.id}:blocked:${f.id}`, point: p, message: `${f.label} blocks ${p.label}.` });
  for (const o of plan.objects) if (o.type === "text" && /entrance|exit|gate|door/i.test(o.text)) {
    const entrance: DesignFootprint = { id: o.id, label: o.text, x: o.x, y: o.y, width: gap, depth: gap, rotation: 0, height: 0, kind: "path" };
    for (const f of footprints) if (overlapArea(entrance, f) > .5) result.push({ id: `${o.id}:blocked:${f.id}`, point: o, message: `${f.label} restricts access to ${o.text}.` });
  }
  return result;
}

// Approximate NOAA fractional-year solar position for Blenheim in NZ civil time.
export function blenheimSun(date: string, hour: number, northDeg = 0) {
  const day = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date || hour < 0 || hour > 24 || !Number.isFinite(hour) || !Number.isFinite(northDeg)) throw new Error("Choose a valid sun date and NZ time.");
  const year = day.getUTCFullYear(), days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const dayNumber = (day.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1;
  const zone = Number(new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", hour: "numeric", hourCycle: "h23" }).format(day));
  const gamma = 2 * Math.PI / days * (dayNumber - 1 + (hour - 12) / 24);
  const eot = 229.18 * (.000075 + .001868 * Math.cos(gamma) - .032077 * Math.sin(gamma) - .014615 * Math.cos(2 * gamma) - .040849 * Math.sin(2 * gamma));
  const dec = .006918 - .399912 * Math.cos(gamma) + .070257 * Math.sin(gamma) - .006758 * Math.cos(2 * gamma) + .000907 * Math.sin(2 * gamma) - .002697 * Math.cos(3 * gamma) + .00148 * Math.sin(3 * gamma);
  const lat = -41.51 * Math.PI / 180, angle = ((hour * 60 + eot + 4 * 173.96 - zone * 60) / 4 - 180) * Math.PI / 180;
  const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(angle));
  const azimuth = Math.atan2(Math.sin(angle), Math.cos(angle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;
  const bearing = northDeg * Math.PI / 180;
  const east = Math.sin(azimuth) * Math.cos(altitude), north = Math.cos(azimuth) * Math.cos(altitude);
  return { altitude: altitude * 180 / Math.PI, azimuth: azimuth * 180 / Math.PI, zone, x: east * Math.cos(bearing) + north * Math.sin(bearing), y: east * Math.sin(bearing) - north * Math.cos(bearing), height: Math.sin(altitude) };
}

export function shadowFootprints(plan: PlannerPlan, date: string, hour: number) {
  const sun = blenheimSun(date, hour, plan.designSettings?.northDeg ?? 0);
  if (sun.altitude < 5) return [];
  return designFootprints(plan, true).filter((f) => f.height > 0).map((f) => ({ footprint: f, delta: { x: -sun.x / sun.height * f.height, y: -sun.y / sun.height * f.height } }));
}
