import type { PlannerPlan, PlannerPlantingArea, PlannerRow } from "./planner-plan";
import { plants } from "./plant-catalog";
import { areaPlants, areaRectangle, bedRectangle, rowPlants } from "./plan-editing";
import { blenheimFrostForMonth } from "./blenheim-calendar";
import { plantingPointBlocked, plantingSurfaces, surfaceAt, surfaceContains, surfaceWorld, type PlantingSurface } from "./planting-surfaces";

export type SeasonalPosition = { x: number; y: number; crop: string; variety: string; spacing: number };
export type SeasonalBedLayout = { surface: PlantingSurface; month: number; positions: SeasonalPosition[]; existing: number; skipped: number };

export function blenheimMonth(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", month: "numeric" }).format(date)) - 1;
}

export function blenheimSeason(month: number) {
  return ["Summer", "Autumn", "Winter", "Spring"][Math.floor(((month + 1) % 12) / 3)];
}

export function seasonalBedCrops(month: number) {
  const frost = blenheimFrostForMonth(month);
  const names = month >= 10 || month <= 1 ? ["Tomato", "Lettuce", "Carrot", "Herbs"]
    : month === 2 || month >= 6 ? ["Broccoli", "Lettuce", "Carrot", "Herbs"] : ["Broccoli", "Lettuce", "Herbs"];
  return names.filter((name) => name !== "Tomato" || frost.risk === "low" || frost.risk === "minimal");
}

export function clearSurfacePlants(plan: PlannerPlan, surface: PlantingSurface): PlannerPlan {
  const belongs = (point: { x: number; y: number }) => {
    const owner = surfaceAt(plan, point); return owner?.id === surface.id && owner.kind === surface.kind;
  };
  return { ...plan,
    plantingAreas: plan.plantingAreas.flatMap((area) => {
      const points = areaPlants(plan, area), kept = points.filter((point) => !belongs(point));
      if (kept.length === points.length) return [area];
      if (!area.placements && area.count > 10000) throw new Error("Split this large planting before replacing its plants.");
      if (!kept.length) return [];
      const rect = areaRectangle(plan, area);
      return [{ ...area, count: kept.length, placements: kept.map((point) => ({ id: point.id, x: (point.x - rect.x) * 100 / rect.w, y: (point.y - rect.y) * 100 / rect.h })) }];
    }),
    rows: plan.rows.flatMap((row) => {
      const points = rowPlants(row), kept = points.filter((point) => !belongs(point));
      if (kept.length === points.length) return [row];
      if (!kept.length) return [];
      const dx = row.x2 - row.x1, dy = row.y2 - row.y1, length = Math.hypot(dx, dy) || 1;
      return [{ ...row, count: kept.length, placements: kept.map((point) => dx === 0 && dy === 0
        ? { id: point.id, x: point.x - row.x1, y: point.y - row.y1 }
        : { id: point.id, x: ((point.x - row.x1) * dx + (point.y - row.y1) * dy) * 100 / (length * length), y: ((point.y - row.y1) * dx - (point.x - row.x1) * dy) / length }) }];
    }),
  };
}

export function generateSeasonalBedLayout(plan: PlannerPlan, surface: PlantingSurface, month: number, choice = "mix"): SeasonalBedLayout {
  const positions: SeasonalPosition[] = [];
  const occupied = [...plan.plantingAreas.flatMap((area) => areaPlants(plan, area).map((p) => ({ ...p, spacing: area.spacingCm }))),
    ...plan.rows.flatMap((row) => rowPlants(row).map((p) => ({ ...p, spacing: row.spacingCm })))];
  const existing = occupied.filter((point) => { const owner = surfaceAt(plan, point); return owner?.id === surface.id && owner.kind === surface.kind; }).length;
  if (surface.shape === "cells") return { surface, month, positions, existing, skipped: 0 };
  const available = seasonalBedCrops(month);
  if (choice !== "mix" && !available.includes(choice)) throw new Error("Choose a crop suitable for this month.");
  const cropNames = choice === "mix" ? available.filter((name) => name !== "Carrot") : [choice];
  // Narrow beds get fewer crop strips; retain room for mature plants at every edge.
  const bands = Math.min(cropNames.length, Math.max(1, Math.floor(surface.depth / 55)));
  const selected = choice === "mix" && bands === 1 ? ["Lettuce"] : cropNames.slice(0, bands);
  let skipped = 0;
  selected.forEach((name, band) => {
    const crop = plants.find((item) => item.name === name)!;
    const spacing = crop.spacingCm, rowSpacing = name === "Carrot" ? 25 : spacing;
    const variety = name === "Herbs" ? "Parsley" : name === "Broccoli" ? "Calabrese" : crop.varieties[0];
    const bandDepth = surface.depth / selected.length;
    const cols = Math.floor(surface.width / spacing), rows = Math.floor(bandDepth / rowSpacing);
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const point = surfaceWorld(surface, { x: (col - (cols - 1) / 2) * spacing,
        y: -surface.depth / 2 + bandDepth * (band + .5) + (row - (rows - 1) / 2) * rowSpacing });
      const owner = surfaceAt(plan, point);
      if (!surfaceContains(surface, point, spacing / 2) || plantingPointBlocked(plan, point) || owner?.id !== surface.id || owner.kind !== surface.kind
        || occupied.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < (p.spacing + spacing) / 2 - .01)
        || positions.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < (p.spacing + spacing) / 2 - .01)) { skipped++; continue; }
      positions.push({ ...point, crop: name, variety, spacing });
    }
  });
  return { surface, month, positions, existing, skipped };
}

export function applySeasonalBedLayout(plan: PlannerPlan, preview: SeasonalBedLayout): PlannerPlan {
  // Validate against the current plan so a stale preview cannot overwrite new plants.
  const target = preview.surface;
  const current = plantingSurfaces(plan).find((surface) => surface.id === target.id && surface.kind === target.kind);
  if (!current) throw new Error("This bed is no longer in the garden.");
  if (JSON.stringify(current) !== JSON.stringify(target)) throw new Error("The bed changed. Generate a fresh layout preview.");
  const occupied = [...plan.plantingAreas.flatMap((a) => areaPlants(plan, a).map((p) => ({ ...p, spacing: a.spacingCm }))),
    ...plan.rows.flatMap((r) => rowPlants(r).map((p) => ({ ...p, spacing: r.spacingCm })))];
  for (const point of preview.positions) if (!surfaceContains(target, point, point.spacing / 2) || plantingPointBlocked(plan, point)
    || occupied.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < (p.spacing + point.spacing) / 2 - .01)) throw new Error("The bed changed. Generate a fresh layout preview.");
  const groups = new Map<string, SeasonalPosition[]>();
  for (const point of preview.positions) groups.set(point.crop, [...(groups.get(point.crop) ?? []), point]);
  const areas: PlannerPlantingArea[] = [], rows: PlannerRow[] = [];
  for (const [name, points] of groups) {
    const crop = plants.find((plant) => plant.name === name)!;
    const fields = { id: crypto.randomUUID(), crop: name, cropIcon: crop.icon, variety: points[0].variety, spacingCm: crop.spacingCm, count: points.length };
    if (target.kind === "bed") {
      const bed = plan.beds.find((bed) => String(bed.id) === target.id)!;
      const rect = bedRectangle(bed);
      areas.push({ ...fields, bedId: bed.id, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal",
        placements: points.map((point) => ({ id: crypto.randomUUID(), x: (point.x - rect.x) * 100 / rect.w, y: (point.y - rect.y) * 100 / rect.h })) });
    } else {
      rows.push({ ...fields, x1: target.x, y1: target.y, x2: target.x, y2: target.y,
        placements: points.map((point) => ({ id: crypto.randomUUID(), x: point.x - target.x, y: point.y - target.y })) });
    }
  }
  return { ...plan, plantingAreas: [...plan.plantingAreas, ...areas], rows: [...plan.rows, ...rows] };
}
