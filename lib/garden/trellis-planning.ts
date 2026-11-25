import { climbingSupportNear, mappedClimbingSupports } from "./bed-growing-conditions";
import { areaRectangle, bedRectangle } from "./plan-editing";
import { plantingDatesOverlap } from "./planting-overlap";
import { blockCorners } from "./planting-block";
import type { PlannerPlan, PlannerRow } from "./planner-plan";
import type { PlantingSchedule } from "./planting-schedule";

export function climbingVariety(crop: string, variety: string) {
  if (/^peas?\b/i.test(crop)) return { height: 90, label: "Climbing peas" };
  if (/beans?/i.test(crop) && /climb|runner|pole|superstar|king purple/i.test(variety)) return { height: 150, label: "Climbing beans" };
  if (/cucumber/i.test(crop) && !/bush|patio/i.test(variety)) return { height: 150, label: "Climbing cucumbers" };
  if (crop === "Tomato" && /indeterminate|cordon|moneymaker|black krim/i.test(variety)) return { height: 150, label: "Cordon tomatoes" };
}

function rowBounds(row: PlannerRow) {
  const points = blockCorners(row);
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

export function trellisBookings(plan: PlannerPlan, window: PlantingSchedule) {
  const plantings = [...plan.plantingAreas.filter(area => plan.beds.some(bed => bed.id === area.bedId)), ...plan.rows]
    .filter(planting => plantingDatesOverlap(planting.schedule, window));
  return mappedClimbingSupports(plan).map(support => {
    const bookings = plantings.flatMap(planting => {
      const linked = planting.schedule?.supportId === support.id;
      const inferred = !planting.schedule?.supportId && climbingVariety(planting.crop, planting.variety)
        && climbingSupportNear(support, "bedId" in planting ? areaRectangle(plan, planting) : rowBounds(planting));
      return linked || inferred ? [{ planting, linked }] : [];
    });
    return { support, bookings, beds: plan.beds.filter(bed => climbingSupportNear(support, bedRectangle(bed))) };
  });
}
