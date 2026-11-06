import type { PlannerPlan, PlannerRow } from "./planner-plan";
import type { PlantOption } from "./plant-catalog";
import { nextPlantingDate } from "./planting-schedule";
import { plantCountForArea } from "./plant-spacing-layout";
import { resizePlantingBlock } from "./planting-block";
import { rowPlantCount } from "./row-layout";
import { plantFacts } from "./plant-catalogue-filters";

export function addSuccession(plan: PlannerPlan, selection: { kind: "planting" | "row"; id: string },
  crop: PlantOption, id = crypto.randomUUID()) {
  const original = selection.kind === "row" ? plan.rows.find(p => p.id === selection.id) : plan.plantingAreas.find(p => p.id === selection.id);
  if (!original?.schedule?.until) throw new Error("Set the current planting’s end date first.");
  const schedule = { from: nextPlantingDate(original.schedule.until) };
  const details = { id, crop: crop.name, cropIcon: crop.icon, variety: crop.varieties[0], spacingCm: crop.spacingCm, schedule, placements: undefined };
  if (selection.kind === "row" && "x1" in original) {
    let row: PlannerRow = { ...structuredClone(original), ...details };
    const length = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
    const facts = plantFacts(crop.name, details.variety);
    row.spacingCm = facts?.inRowSpacingCm ?? crop.spacingCm;
    if (row.block) row = resizePlantingBlock(row, length, row.block.depthCm, { ...row.block,
      rowSpacingCm: facts?.rowSpacingCm ?? crop.spacingCm,
      ...(row.block.mode === "square-foot" ? facts?.squareFootCount
        ? { plantsPerSquareFoot: facts.squareFootCount } : { mode: "block", plantsPerSquareFoot: undefined } : {}) });
    else row.count = rowPlantCount(length, facts?.inRowSpacingCm ?? crop.spacingCm);
    return { plan: { ...plan, rows: [...plan.rows, row] }, selection: { kind: "row" as const, id } };
  }
  if (!("bedId" in original)) throw new Error("Planting area is missing.");
  const bed = plan.beds.find(b => b.id === original.bedId);
  if (!bed) throw new Error("Planting bed is missing.");
  const area = { ...structuredClone(original), ...details, plantingId: undefined };
  area.count = plantCountForArea(area, bed.w * 9 * area.w / 100, bed.h * 10.8 * area.h / 100);
  return { plan: { ...plan, plantingAreas: [...plan.plantingAreas, area] }, selection: { kind: "planting" as const, id } };
}
