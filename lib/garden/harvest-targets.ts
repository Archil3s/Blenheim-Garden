import { bedRectangle } from "./plan-editing";
import type { PlantOption } from "./plant-catalog";
import type { PlannerPlan } from "./planner-plan";
import { parsePlantingSchedule } from "./planting-schedule";
import { plantingDatesOverlap } from "./planting-overlap";
import { addDays, type SeedBatch, type SeedCropGuide } from "./seedling-local";
import { bedAvailability, bedOccupants, sowingOptions, type SowingMethod, type SuccessionHistory } from "./succession-timeline";

type HarvestTarget = {
  firstHarvest: string;
  batchCount: number;
  interval: number;
  quantity: number;
  method: SowingMethod;
  trayCells: number;
  trayDays: number;
  harvestDays: number;
};

export function harvestTargetPlan(plan: PlannerPlan, history: SuccessionHistory[], trays: SeedBatch[], crop: PlantOption, guide: SeedCropGuide, target: HarvestTarget, today: string) {
  if (!guide.harvestDays || !target.firstHarvest) return [];
  try { parsePlantingSchedule({ harvestFrom: target.firstHarvest }); }
  catch { return []; }
  if (target.batchCount < 1 || target.batchCount > 12 || target.interval < 1 || target.quantity < 1) return [];
  const windows = sowingOptions(guide).find(item => item.method === target.method)?.months ?? [];
  const maturity = Math.round((guide.harvestDays[0] + guide.harvestDays[1]) / 2);
  const beds = plan.beds.map(bed => {
    const rect = bedRectangle(bed);
    const capacity = Math.floor(rect.w / crop.spacingCm) * Math.floor(rect.h / crop.spacingCm);
    return { bed, capacity, occupants: bedOccupants(plan, bed, history) };
  });
  const reservedBeds: { id: number; from: string; until: string }[] = [];
  const trayRanges = trays.filter(batch => batch.method !== "direct" && batch.stage !== "planted").map(batch => {
    const booked = plan.plantingAreas.find(area => area.id === batch.plantingAreaId);
    const lastDate = [batch.readyFrom, booked?.schedule?.transplant ?? booked?.schedule?.from]
      .filter((date): date is string => Boolean(date)).sort().at(-1);
    return { from: batch.dateSown, until: lastDate && lastDate >= today ? lastDate : undefined, count: batch.count };
  });

  return Array.from({ length: target.batchCount }, (_, index) => {
    const harvest = addDays(target.firstHarvest, index * target.interval);
    const sow = addDays(harvest, -maturity);
    const from = target.method === "covered" ? addDays(sow, target.trayDays) : sow;
    const until = addDays(harvest, target.harvestDays - 1);
    let problem: string | undefined;
    if (sow < today) problem = "Move this harvest target later to allow time to sow.";
    else if (!windows.includes(Number(sow.slice(5, 7)))) problem = "This sow date falls outside the crop’s seasonal window.";
    else if (from > harvest) problem = "The tray period extends past the estimated first harvest.";
    if (!problem && target.method === "covered") {
      const occupied = Array.from({ length: target.trayDays }, (_, offset) => addDays(sow, offset)).some(date =>
        target.quantity + trayRanges.filter(range => plantingDatesOverlap(range, { from: date, until: date })).reduce((sum, range) => sum + range.count, 0) > target.trayCells);
      if (occupied) problem = "Insufficient tray cells while this batch is under cover.";
    }
    const fit = !problem && beds.find(({ bed, capacity, occupants }) => {
      if (capacity < target.quantity || plan.lockedItems?.includes(`bed:${bed.id}`)) return false;
      const available = bedAvailability(occupants, from, until);
      return !available.conflicts.length && !available.uncertain.length
        && !reservedBeds.some(booking => booking.id === bed.id && plantingDatesOverlap(booking, { from, until }));
    });
    if (fit) {
      reservedBeds.push({ id: fit.bed.id, from, until });
      if (target.method === "covered") trayRanges.push({ from: sow, until: addDays(from, -1), count: target.quantity });
    }
    return { harvest, sow, from, until, quantity: target.quantity, bed: fit ? fit.bed : undefined,
      problem: problem ?? (!fit ? "No available whole bed has enough planting space for these dates." : undefined) };
  });
}
