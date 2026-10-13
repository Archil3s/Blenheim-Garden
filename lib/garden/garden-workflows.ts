import type { PlannerPlan } from "./planner-plan";
import { areaPlants, bedRectangle, rowPlants, selectionItem, validateEditorPlan, type PlanSelection, type PointCm } from "./plan-editing";
import { allPlantPoints, addCropPoints, cropPlacementPoints } from "./garden-building";
import { gardenDimensions } from "./garden-dimensions";
import { designFootprints, overlapArea, validateDesignChange } from "./garden-design";
import { isSelectionLocked, rowsForOwner } from "./object-locks";
import { plantingSurfaces, surfaceContains, surfaceWorld, surfaceLocal, plantingPointBlocked } from "./planting-surfaces";
import { prepareDuplicatePlacement, type DuplicatePlacement } from "./duplicate-placement";
import { clearSurfacePlants, seasonalBedCrops, blenheimMonth } from "./seasonal-bed-layout";
import { plants } from "./plant-catalog";

export const nzToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export type GrowthTimeline = { enabled: boolean; surfaceId: string; plantedOn: string; date: string; matureDays: number; harvestDays: number };
export function timelinePhase(timeline: GrowthTimeline) {
  const age = (Date.parse(timeline.date + "T12:00:00Z") - Date.parse(timeline.plantedOn + "T12:00:00Z")) / 86400000;
  if (!Number.isFinite(age) || timeline.matureDays < 1 || timeline.harvestDays < timeline.matureDays) throw new Error("Choose valid dates and harvest days after maturity.");
  return age < 0 ? "unplanted" : age >= timeline.harvestDays ? "harvested" : age >= timeline.matureDays ? "mature" : "growing";
}
export function timelinePlan(plan: PlannerPlan, timeline: GrowthTimeline) {
  if (!timeline.enabled) return plan;
  const phase = timelinePhase(timeline);
  if (phase === "growing" || phase === "mature") return plan;
  const targets = new Set((timeline.surfaceId ? [timeline.surfaceId] : plantingSurfaces(plan).map((s) => `${s.kind}:${s.id}`)));
  const removedRows = new Set([...targets].flatMap((key) => rowsForOwner(plan, key).map((r) => r.id)));
  return { ...plan, plantingAreas: plan.plantingAreas.filter((a) => !targets.has(`bed:${a.bedId}`)), rows: plan.rows.filter((r) => timeline.surfaceId ? !removedRows.has(r.id) : false) };
}
export function timelineScale(timeline: GrowthTimeline) {
  const phase = timelinePhase(timeline);
  if (phase !== "growing") return 1;
  const age = (Date.parse(timeline.date + "T12:00:00Z") - Date.parse(timeline.plantedOn + "T12:00:00Z")) / 86400000;
  return .25 + .75 * Math.max(0, Math.min(1, age / timeline.matureDays));
}

export function connectedPathPoint(plan: PlannerPlan, point: PointCm, enabled: boolean) {
  if (!enabled) return point;
  let result = point, best = 25;
  for (const path of plan.objects) if (path.type === "path") {
    const dx = path.x2 - path.x1, dy = path.y2 - path.y1, length2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((point.x - path.x1) * dx + (point.y - path.y1) * dy) / (length2 || 1)));
    for (const p of [{ x: path.x1, y: path.y1 }, { x: path.x2, y: path.y2 }, { x: path.x1 + dx * t, y: path.y1 + dy * t }]) {
      const distance = Math.hypot(point.x - p.x, point.y - p.y); if (distance < best) { result = p; best = distance; }
    }
  }
  return result;
}
export function addConnectedPath(plan: PlannerPlan, start: PointCm, end: PointCm, width: number, route: "direct" | "right-angle", snap: boolean) {
  const a = connectedPathPoint(plan, start, snap), b = connectedPathPoint(plan, end, snap);
  if (Math.hypot(a.x - b.x, a.y - b.y) < 5) throw new Error("Choose endpoints at least 5 cm apart.");
  const routes = route === "direct" ? [[a, b]] : [[a, { x: b.x, y: a.y }, b], [a, { x: a.x, y: b.y }, b]];
  let failure: unknown;
  for (const points of routes) {
    const objects = points.slice(1).flatMap((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y) < 5 ? [] : [{ id: crypto.randomUUID(), type: "path" as const, x1: points[i].x, y1: points[i].y, x2: p.x, y2: p.y, widthCm: width, label: "Connected path" }]);
    try { return validateDesignChange(plan, { ...plan, objects: [...plan.objects, ...objects] }); } catch (error) { failure = error; }
  }
  throw failure;
}

export function reflowSurfacePlants(plan: PlannerPlan, selected: PlanSelection): PlannerPlan {
  const surface = plantingSurfaces(plan).find((s) => s.kind === selected.kind && s.id === selected.id);
  if (!surface) throw new Error("Select a bed or container to arrange its plants.");
  const areas = plan.plantingAreas.filter((a) => selected.kind === "bed" && String(a.bedId) === selected.id);
  const rows = rowsForOwner(plan, `${selected.kind}:${selected.id}`);
  const clean = { ...plan, plantingAreas: plan.plantingAreas.filter((a) => !areas.some((old) => old.id === a.id)), rows: plan.rows.filter((r) => !rows.some((old) => old.id === r.id)) };
  const occupied: (PointCm & { spacing: number })[] = allPlantPoints(clean);
  const groups = [...areas.map((a) => ({ item: a, points: areaPlants(plan, a), kind: "area" as const })), ...rows.map((r) => ({ item: r, points: rowPlants(r), kind: "row" as const }))].sort((a, b) => b.item.spacingCm - a.item.spacingCm);
  const updates = new Map<string, PointCm[]>();
  for (const group of groups) {
    const spacing = group.item.spacingCm, candidates: PointCm[] = [];
    for (let y = -surface.depth / 2 + spacing / 2; y <= surface.depth / 2 - spacing / 2 + .01 && candidates.length < group.points.length; y += spacing) for (let x = -surface.width / 2 + spacing / 2; x <= surface.width / 2 - spacing / 2 + .01 && candidates.length < group.points.length; x += spacing) {
      const p = surfaceWorld(surface, { x, y });
      if (surfaceContains(surface, p, Math.min(6, spacing / 4)) && !plantingPointBlocked(plan, p) && occupied.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= (q.spacing + spacing) / 2 - .01)) candidates.push(p);
    }
    if (candidates.length < group.points.length) throw new Error(`This bed cannot hold all ${group.points.length} ${group.item.crop} at ${spacing} cm spacing. Enlarge it or keep scaled positions.`);
    const points = candidates.slice(0, group.points.length); updates.set(group.item.id, points); occupied.push(...points.map((p) => ({ ...p, spacing })));
  }
  const next = { ...plan, plantingAreas: plan.plantingAreas.map((a) => {
    const points = updates.get(a.id); if (!points) return a;
    const bed = plan.beds.find((b) => b.id === a.bedId)!, r = bedRectangle(bed, plan), ids = areaPlants(plan, a);
    return { ...a, x: 0, y: 0, w: 100, h: 100, placements: points.map((p, i) => ({ id: ids[i].id, x: (p.x - r.x) * 100 / r.w, y: (p.y - r.y) * 100 / r.h })) };
  }), rows: plan.rows.map((r) => {
    const points = updates.get(r.id); if (!points) return r; const ids = rowPlants(r);
    return { ...r, surfaceId: `${selected.kind}:${selected.id}`, x1: surface.x, y1: surface.y, x2: surface.x, y2: surface.y, placements: points.map((p, i) => ({ id: ids[i].id, x: p.x - surface.x, y: p.y - surface.y })) };
  }) };
  validateEditorPlan(next); return next;
}

export type PlantedBedTemplate = { id: string; name: string; plan: PlannerPlan; selection: PlanSelection };
export const plantedTemplatesKey = (gardenId: string) => `garden-planted-templates:${gardenId}`;
export function capturePlantedTemplate(plan: PlannerPlan, selected: PlanSelection, name: string): PlantedBedTemplate {
  if (!name.trim() || name.trim().length > 60) throw new Error("Name the template using up to 60 characters.");
  const surface = plantingSurfaces(plan).find((s) => s.kind === selected.kind && s.id === selected.id);
  if (!surface || selected.plantId) throw new Error("Select a whole bed or planted container.");
  const key = `${selected.kind}:${selected.id}`, rows = rowsForOwner(plan, key).map((r) => ({ ...r, surfaceId: key }));
  const snapshot: PlannerPlan = { canvasWidthCm: plan.canvasWidthCm, canvasHeightCm: plan.canvasHeightCm, beds: selected.kind === "bed" ? plan.beds.filter((b) => String(b.id) === selected.id) : [], objects: selected.kind === "object" ? plan.objects.filter((o) => o.id === selected.id) : [], plantingAreas: plan.plantingAreas.filter((a) => selected.kind === "bed" && String(a.bedId) === selected.id), rows, bedProfiles: plan.bedProfiles?.[key] ? { [key]: plan.bedProfiles[key] } : undefined };
  validateEditorPlan(snapshot);
  return structuredClone({ id: crypto.randomUUID(), name: name.trim(), plan: snapshot, selection: { kind: selected.kind, id: selected.id } });
}
export function parsePlantedTemplates(raw: string | null): PlantedBedTemplate[] {
  if (!raw) return [];
  if (raw.length > 4000000) throw new Error("Saved templates are too large.");
  const entries = JSON.parse(raw) as PlantedBedTemplate[];
  if (!Array.isArray(entries) || entries.length > 30) throw new Error("Saved templates are invalid.");
  for (const t of entries) {
    if (!t || typeof t.id !== "string" || typeof t.name !== "string" || !t.name.trim() || t.name.length > 60 || !t.plan || !t.selection || typeof t.selection.id !== "string" || t.selection.plantId || !["bed", "object"].includes(t.selection.kind) || ![t.plan.beds, t.plan.objects, t.plan.plantingAreas, t.plan.rows].every(Array.isArray)) throw new Error("Saved templates are invalid.");
    for (const group of [...t.plan.plantingAreas, ...t.plan.rows]) {
      if (!group || typeof group.id !== "string" || typeof group.crop !== "string" || typeof group.variety !== "string" || !Number.isFinite(group.spacingCm) || group.spacingCm < 1 || !Number.isInteger(group.count) || group.count < 0 || group.count > 10000 || group.placements && (!Array.isArray(group.placements) || group.placements.length !== group.count || new Set(group.placements.map((p) => p?.id)).size !== group.count || group.placements.some((p) => !p || typeof p.id !== "string" || !Number.isFinite(p.x) || !Number.isFinite(p.y)))) throw new Error("Saved template plants are invalid.");
    }
    validateEditorPlan(t.plan);
    if (!selectionItem(t.plan, t.selection) || !plantingSurfaces(t.plan).some((s) => s.kind === t.selection.kind && s.id === t.selection.id)) throw new Error("Template bed is missing.");
    if (t.plan.plantingAreas.some((a) => !t.plan.beds.some((b) => b.id === a.bedId))) throw new Error("Template plantings have no bed.");
  }
  return entries;
}
export function placePlantedTemplate(plan: PlannerPlan, template: PlantedBedTemplate): DuplicatePlacement {
  const draft = prepareDuplicatePlacement(template.plan, [template.selection]);
  const newBeds = draft.plan.beds.filter((b) => !template.plan.beds.some((old) => old.id === b.id));
  const newObjects = draft.plan.objects.filter((o) => !template.plan.objects.some((old) => old.id === o.id));
  const newAreas = draft.plan.plantingAreas.filter((a) => !template.plan.plantingAreas.some((old) => old.id === a.id));
  const newRows = draft.plan.rows.filter((r) => !template.plan.rows.some((old) => old.id === r.id));
  for (const bed of newBeds) if (plan.beds.some((b) => b.id === bed.id)) {
    const old = bed.id; bed.id = Math.max(Date.now(), ...plan.beds.map((b) => b.id + 1));
    for (const a of newAreas) if (a.bedId === old) a.bedId = bed.id;
    for (const r of newRows) if (r.surfaceId === `bed:${old}`) r.surfaceId = `bed:${bed.id}`;
    draft.selections = draft.selections.map((s) => s.kind === "bed" && s.id === String(old) ? { ...s, id: String(bed.id) } : s);
  }
  const profile = template.plan.bedProfiles?.[`${template.selection.kind}:${template.selection.id}`];
  const profiles = profile ? { [`${draft.selections[0].kind}:${draft.selections[0].id}`]: structuredClone(profile) } : {};
  return { ...draft, fromTemplate: true, base: structuredClone(plan), plan: { ...plan, beds: [...plan.beds, ...newBeds], objects: [...plan.objects, ...newObjects], plantingAreas: [...plan.plantingAreas, ...newAreas], rows: [...plan.rows, ...newRows], bedProfiles: { ...plan.bedProfiles, ...profiles } } };
}

export type LayoutRequest = { crops: string[]; priority: "access" | "yield"; newBeds: number; width: number; depth: number; replace: boolean; month: number };
export function proposeGardenLayout(plan: PlannerPlan, request: LayoutRequest, alternative = false): PlannerPlan {
  if (!request.crops.length || request.crops.some((name) => !plants.some((p) => p.name === name))) throw new Error("Choose at least one indexed crop.");
  if (!Number.isInteger(request.newBeds) || request.newBeds < 0 || request.newBeds > 8 || !Number.isFinite(request.width) || request.width < 40 || !Number.isFinite(request.depth) || request.depth < 40) throw new Error("Choose 0–8 beds with dimensions of at least 40 cm.");
  let next = structuredClone(plan); const dims = gardenDimensions(plan), gap = plan.designSettings?.walkwayCm ?? 60;
  const connectNewBeds = !!request.newBeds && !next.beds.length && !next.objects.length;
  if (connectNewBeds) next = addConnectedPath(next, { x: dims.width / 2, y: 10 }, { x: dims.width / 2, y: dims.height - 10 }, gap, "direct", false);
  let added = 0;
  for (let y = 10; y + request.depth <= dims.height - 10 && added < request.newBeds; y += request.depth + gap) for (let x = 10; x + request.width <= dims.width - 10 && added < request.newBeds; x += 20) {
    const footprint = { id: "proposal", label: "Proposed bed", x: x + request.width / 2, y: y + request.depth / 2, width: request.width + gap, depth: request.depth + gap, rotation: 0, height: 34, kind: "bed" as const };
    if (designFootprints(next).some((f) => overlapArea(footprint, f) > .5)) continue;
    const bed = { id: Math.max(Date.now() + added, ...next.beds.map((b) => b.id + 1)), name: `Proposed bed ${added + 1}`, x: x * 100 / dims.width, y: y * 100 / dims.height, w: request.width * 100 / dims.width, h: request.depth * 100 / dims.height };
    try { validateDesignChange(next, { ...next, beds: [...next.beds, bed] }); next.beds.push(bed); added++; x += request.width + gap - 20; } catch { /* Try the next measured position. */ }
  }
  if (added < request.newBeds) throw new Error(`Only ${added} of ${request.newBeds} new beds fit with ${gap} cm access gaps. Choose fewer or smaller beds.`);
  if (connectNewBeds) for (const bed of next.beds) {
    const rect = bedRectangle(bed, next), side = rect.x + rect.w <= dims.width / 2 ? rect.x + rect.w + gap / 2 : rect.x - gap / 2;
    const y = Math.min(dims.height - gap / 2, rect.y + rect.h + gap / 2);
    next = addConnectedPath(next, { x: dims.width / 2, y }, { x: side, y: rect.y + rect.h / 2 }, gap, "right-angle", false);
  }
  const suitable = request.crops.filter((name) => seasonalBedCrops(request.month).includes(name));
  const choices = suitable.length ? suitable : request.crops;
  const surfaces = plantingSurfaces(next).filter((s) => !isSelectionLocked(next, { kind: s.kind, id: s.id }) && s.shape !== "cells");
  if (!surfaces.length) throw new Error("Add a bed or unlock a planting surface first.");
  if (request.replace) for (const surface of surfaces) next = clearSurfacePlants(next, surface);
  let total = 0;
  for (let i = 0; i < surfaces.length; i++) {
    const surface = surfaces[i], offset = (i + (alternative ? 1 : 0)) % choices.length, order = [...choices.slice(offset), ...choices.slice(0, offset)];
    const options = order.map((name) => {
      const p = plants.find((p) => p.name === name)!;
      let points = cropPlacementPoints(next, name, surface, null, "fill", `${surface.kind}:${surface.id}`);
      if (request.priority === "access" || alternative) points = points.filter((point) => { const local = surfaceLocal(surface, point); return Math.min(surface.width / 2 - Math.abs(local.x), surface.depth / 2 - Math.abs(local.y)) <= 60; });
      if (alternative) points = points.filter((point) => Math.abs(surfaceLocal(surface, point).y) >= Math.min(15, surface.depth * .1));
      return { crop: p, points };
    });
    if (request.priority === "yield" && !alternative) options.sort((a, b) => b.points.length - a.points.length);
    const chosen = options.find((o) => o.points.length); if (!chosen) continue;
    const profile = next.bedProfiles?.[`${surface.kind}:${surface.id}`];
    if (profile?.sun === "partial" && ["Tomato", "Pumpkin"].includes(chosen.crop.name)) continue;
    if (profile && profile.soilDepthCm < 30 && ["Carrot", "Tomato", "Broccoli"].includes(chosen.crop.name)) continue;
    next = addCropPoints(next, chosen.crop.name, chosen.crop.varieties[0], chosen.points, `${surface.kind}:${surface.id}`); total += chosen.points.length;
  }
  if (!total) throw new Error("No planting space fits these crops and growing conditions. Choose smaller crops, add beds or preview replacing existing plants.");
  return validateDesignChange(plan, next);
}
export const defaultLayoutRequest = (plan: PlannerPlan): LayoutRequest => ({ crops: ["Lettuce", "Carrot"], priority: "access", newBeds: plan.beds.length ? 0 : 2, width: 120, depth: 240, replace: false, month: blenheimMonth() });
export function timelineGroups(plan: PlannerPlan, timeline: GrowthTimeline) {
  const rows = timeline.surfaceId ? rowsForOwner(plan, timeline.surfaceId) : plan.rows;
  return new Set([...plan.plantingAreas.filter((a) => !timeline.surfaceId || timeline.surfaceId === `bed:${a.bedId}`).map((a) => `area:${a.id}`), ...rows.map((r) => `row:${r.id}`)]);
}
