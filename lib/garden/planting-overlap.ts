import { areaRectangle, type PointCm } from "./plan-editing";
import type { PlannerPlan, PlannerPlantingArea, PlannerRow } from "./planner-plan";
import type { PlantingSchedule } from "./planting-schedule";

export type MeasuredPlanting = PlannerPlantingArea | PlannerRow;

export function plantingDatesOverlap(a?: PlantingSchedule, b?: PlantingSchedule) {
  return (!a?.until || !b?.from || a.until >= b.from) && (!b?.until || !a?.from || b.until >= a.from);
}

function footprint(plan: PlannerPlan, planting: MeasuredPlanting) {
  if ("bedId" in planting) {
    const { x, y, w, h } = areaRectangle(plan, planting);
    return { points: [{ x, y }, { x: x + w, y }, { x, y: y + h }, { x: x + w, y: y + h }],
      axis: { x: 1, y: 0 } };
  }

  const dx = planting.x2 - planting.x1, dy = planting.y2 - planting.y1;
  const length = Math.hypot(dx, dy);
  const axis = length ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  const halfSpacing = planting.spacingCm / 2;
  let minX = planting.block ? 0 : -halfSpacing, maxX = length + (planting.block ? 0 : halfSpacing);
  let minY = planting.block?.depthCm ? 0 : -halfSpacing, maxY = planting.block?.depthCm || halfSpacing;
  for (const point of planting.placements ?? []) {
    const along = length < .001 ? point.x : point.x * length / 100;
    minX = Math.min(minX, along - halfSpacing);
    maxX = Math.max(maxX, along + halfSpacing);
    minY = Math.min(minY, point.y - halfSpacing);
    maxY = Math.max(maxY, point.y + halfSpacing);
  }
  const position = (x: number, y: number): PointCm => ({
    x: planting.x1 + x * axis.x - y * axis.y, y: planting.y1 + x * axis.y + y * axis.x,
  });
  return { points: [position(minX, minY), position(maxX, minY), position(minX, maxY), position(maxX, maxY)], axis };
}

function overlapsOnAxis(a: PointCm[], b: PointCm[], axis: PointCm) {
  const project = (point: PointCm) => point.x * axis.x + point.y * axis.y;
  const first = a.map(project), second = b.map(project);
  // Shared edges are valid adjacent planting spaces.
  return Math.min(Math.max(...first), Math.max(...second)) - Math.max(Math.min(...first), Math.min(...second)) > 1e-6;
}

export function overlappingPlantings(plan: PlannerPlan, candidate: MeasuredPlanting) {
  const a = footprint(plan, candidate);
  return [...plan.plantingAreas, ...plan.rows].filter(item => {
    if (!plantingDatesOverlap(item.schedule, candidate.schedule)) return false;
    const b = footprint(plan, item);
    return [a.axis, b.axis, { x: -a.axis.y, y: a.axis.x }, { x: -b.axis.y, y: b.axis.x }]
      .every(axis => overlapsOnAxis(a.points, b.points, axis));
  });
}

export class PlantingOverlapError extends Error {
  constructor(readonly plantings: MeasuredPlanting[], readonly from: string) {
    const names = plantings.map(planting => planting.variety || planting.crop);
    super(`This space overlaps ${[...new Set(names)].join(", ")} during the proposed dates. Check the marked plantings or choose different dates.`);
  }
}
