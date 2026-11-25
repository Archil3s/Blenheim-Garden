import { cropFamilyFor } from "./crop-rotation";
import { blockCorners } from "./planting-block";
import { bedGrowingContext } from "./bed-growing-conditions";
import { successionBedFit } from "./succession-bed-fit";
import { bedRectangle, rowPlants } from "./plan-editing";
import { plants } from "./plant-catalog";
import type { PlannerBed, PlannerPlan } from "./planner-plan";
import { parsePlantingSchedule, type PlantingSchedule } from "./planting-schedule";
import { addDays, cropArtName, SEED_CROPS, type SeedCropGuide } from "./seedling-local";

export type SuccessionHistory = {
  id: string;
  bedId: string;
  areaId?: string | null;
  cropName: string;
  variety?: string | null;
  status: "active" | "planned" | "finished";
  sowDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type SowingMethod = "direct" | "covered";

export function sowingOptions(guide: SeedCropGuide) {
  return [
    { method: "direct" as const, months: guide.outdoorAction === "transplant" ? [] : guide.outdoorMonths },
    { method: "covered" as const, months: guide.indoorMonths ?? [] },
  ];
}

function monthOf(date: string) {
  return Number(date.slice(5, 7));
}

function firstSowing(from: string, months: number[]) {
  if (months.includes(monthOf(from))) return from;
  const month = monthOf(from);
  const offset = Array.from({ length: 12 }, (_, index) => index + 1)
    .find(distance => months.includes((month + distance - 1) % 12 + 1));
  if (offset === undefined) return undefined;
  return new Date(Date.UTC(Number(from.slice(0, 4)), month - 1 + offset, 1)).toISOString().slice(0, 10);
}

export function bedOccupants(plan: PlannerPlan, bed: PlannerBed, history: SuccessionHistory[]) {
  const areas = plan.plantingAreas.filter(area => area.bedId === bed.id);
  const { x: left, y: top, w, h } = bedRectangle(bed);
  const right = left + w, bottom = top + h;
  // A row's bounding box is conservative for diagonal rows and blocks.
  const rows = plan.rows.filter(row => {
    const corners = blockCorners(row);
    const margin = row.spacingCm / 2;
    const markedPlants = row.placements && rowPlants(row);
    const xs = corners.map(point => point.x), ys = corners.map(point => point.y);
    return (Math.min(...xs) - margin < right && Math.max(...xs) + margin > left
      && Math.min(...ys) - margin < bottom && Math.max(...ys) + margin > top)
      || markedPlants?.some(point => point.x - margin < right && point.x + margin > left
        && point.y - margin < bottom && point.y + margin > top);
  });
  const unmatched = history.filter(item => item.bedId === String(bed.id) && item.status !== "finished" && !areas.some(area =>
    area.plantingId === item.id || area.id === item.areaId && area.crop === item.cropName && area.variety === item.variety));
  return [...areas, ...rows, ...unmatched.map(item => ({
    crop: item.cropName, variety: item.variety, schedule: { from: item.startDate ?? undefined } as PlantingSchedule,
  }))];
}

export function bedAvailability(occupants: ReturnType<typeof bedOccupants>, from: string, until: string) {
  const overlapping = occupants.filter(({ schedule }) =>
    (!schedule?.from || schedule.from <= until) && (!schedule?.until || schedule.until >= from));
  return {
    conflicts: overlapping.filter(item => item.schedule?.from && item.schedule.until).map(item => item.crop),
    uncertain: overlapping.filter(item => !item.schedule?.from || !item.schedule.until).map(item => item.crop),
  };
}

export function successionCurrentCrops(occupants: ReturnType<typeof bedOccupants>, date: string) {
  return occupants.filter(({ schedule }) =>
    (!schedule?.from || schedule.from <= date) && (!schedule?.until || schedule.until >= date));
}

function firstBedDate(from: string, occupants: ReturnType<typeof bedOccupants>) {
  let available = from;
  for (const { schedule } of [...occupants].sort((a, b) => (a.schedule?.from ?? "").localeCompare(b.schedule?.from ?? ""))) {
    if (schedule?.until && (!schedule.from || schedule.from <= available) && schedule.until >= available) {
      available = addDays(schedule.until, 1);
    }
  }
  return available;
}

export function successionSuggestions(plan: PlannerPlan, bed: PlannerBed, history: SuccessionHistory[], from: string) {
  try { parsePlantingSchedule({ from }); }
  catch { return []; }
  const occupants = bedOccupants(plan, bed, history);
  const context = bedGrowingContext(plan, bed);
  const current = successionCurrentCrops(occupants, from);
  const previous = [
    ...occupants.flatMap(item => item.schedule?.until && item.schedule.until <= from
      ? [{ crop: item.crop, variety: item.variety, end: item.schedule.until }] : []),
    ...history.flatMap(item => item.bedId === String(bed.id) && item.status === "finished" && item.endDate && item.endDate <= from
      ? [{ crop: item.cropName, variety: item.variety, end: item.endDate }] : []),
  ].sort((a, b) => b.end.localeCompare(a.end))[0];
  const previousFamily = previous && cropFamilyFor(previous.crop, previous.variety);
  const suggestions = SEED_CROPS.flatMap(guide => {
    const crop = plants.find(plant => plant.name === (guide.crop === "Peas" ? "Peas (Shelling)" : cropArtName(guide.crop)));
    if (!crop) return [];
    const lastSow = [
      ...plan.plantingAreas.filter(area => area.crop === crop.name).map(area => area.schedule?.sow),
      ...plan.rows.filter(row => row.crop === crop.name).map(row => row.schedule?.sow),
      ...history.filter(item => item.cropName === crop.name).map(item => item.sowDate),
    ].filter((date): date is string => Boolean(date)).sort().at(-1);
    const repeat = lastSow && guide.intervalDays ? addDays(lastSow, guide.intervalDays) : undefined;
    const earliest = repeat && repeat > from ? repeat : from;
    return sowingOptions(guide).flatMap(({ method, months }) => {
      const initial = method === "direct" ? firstBedDate(earliest, occupants) : earliest;
      let sow = firstSowing(initial, months);
      while (method === "direct" && sow && sow <= addDays(from, 120)) {
        const clear = firstBedDate(sow, occupants);
        if (clear === sow) break;
        sow = firstSowing(clear, months);
      }
      if (!sow || sow > addDays(from, 120)) return [];
      const bedFrom = method === "direct" ? sow : undefined;
      const family = cropFamilyFor(crop.name);
      const replaced = current.find(item => family.key !== "other" && cropFamilyFor(item.crop, item.variety).key === family.key);
      const rotation = family.key !== "other" && family.key === previousFamily?.key ? previous?.crop : undefined;
      const fit = successionBedFit(guide.crop, crop.varieties[0], context, monthOf(bedFrom ?? firstBedDate(sow, occupants)));
      const nextOccupancy = bedFrom && occupants.map(item => item.schedule?.from).filter((date): date is string => Boolean(date && date > bedFrom)).sort()[0];
      const shortGap = Boolean(bedFrom && nextOccupancy && guide.harvestDays && addDays(sow, guide.harvestDays[0]) >= nextOccupancy);
      return [{ crop, guide, method, sow, bedFrom, rotation, replaced: replaced?.crop, fit, shortGap }];
    });
  });
  return suggestions.sort((a, b) => a.fit.issues - b.fit.issues
    || Number(a.shortGap) - Number(b.shortGap)
    || Number(Boolean(a.replaced)) - Number(Boolean(b.replaced))
    || Number(Boolean(a.rotation)) - Number(Boolean(b.rotation))
    || b.fit.strengths.length - a.fit.strengths.length
    || a.sow.localeCompare(b.sow));
}

export function successionBedSummary(plan: PlannerPlan, bed: PlannerBed, history: SuccessionHistory[], date: string) {
  const occupants = bedOccupants(plan, bed, history);
  const current = successionCurrentCrops(occupants, date);
  const clearDate = current.length && current.every(item => item.schedule?.until)
    ? current.map(item => item.schedule!.until!).sort().at(-1) : undefined;
  const bookedNext = occupants.filter(item => item.schedule?.from && item.schedule.from > date)
    .sort((a, b) => a.schedule!.from!.localeCompare(b.schedule!.from!))[0];
  const top = successionSuggestions(plan, bed, history, date)
    .find(item => !item.fit.issues && !item.shortGap && !item.replaced);
  return { current, clearDate, bookedNext, top };
}

export function successionSchedule(method: SowingMethod, guide: SeedCropGuide, sow: string, from: string, until: string) {
  if (!sow || !from || !until) throw new Error("Enter the sowing, bed start and bed clear dates.");
  const schedule = parsePlantingSchedule({ sow, from, until, transplant: method === "covered" ? from : undefined })!;
  if (!sowingOptions(guide).find(option => option.method === method)?.months.includes(monthOf(sow))) {
    throw new Error("Choose a sowing date within the crop’s seasonal window.");
  }
  if (method === "direct" && sow !== from) throw new Error("A direct sow begins bed occupancy on the sowing date.");
  return schedule;
}
