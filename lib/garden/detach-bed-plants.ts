import { areaPlants } from "./plan-editing";
import { gardenDimensions } from "./garden-dimensions";
import type { PlannerPlan, PlannerRow } from "./planner-plan";

export function removeBedKeepingPlants(plan: PlannerPlan, bedId: number): PlannerPlan {
  const areas = plan.plantingAreas.filter(area => area.bedId === bedId);
  if (plan.rows.length + areas.length > 1000 || areas.some(area => area.count > 10000)) {
    throw new Error("This bed has too many plantings to detach at once.");
  }
  const { widthCm, heightCm } = gardenDimensions(plan);
  const rows = areas.flatMap((area): PlannerRow[] => {
    const points = areaPlants(plan, area);
    const origin = points[0];
    if (!origin) return [];
    if (points.some(point => point.x < 0 || point.x > widthCm || point.y < 0 || point.y > heightCm)) {
      throw new Error("Move the bed inside the garden boundary before detaching its plants.");
    }
    return [{
      id: crypto.randomUUID(),
      crop: area.crop, cropIcon: area.cropIcon || "🌱", variety: area.variety,
      spacingCm: area.spacingCm, schedule: area.schedule, count: points.length,
      x1: origin.x, y1: origin.y, x2: origin.x, y2: origin.y,
      placements: points.map(point => ({ id: crypto.randomUUID(), x: point.x - origin.x, y: point.y - origin.y })),
    }];
  });
  return {
    ...plan,
    beds: plan.beds.filter(bed => bed.id !== bedId),
    plantingAreas: plan.plantingAreas.filter(area => area.bedId !== bedId),
    rows: [...plan.rows, ...rows],
  };
}
