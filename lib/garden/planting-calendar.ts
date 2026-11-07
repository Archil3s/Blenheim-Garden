import type { PlannerPlan } from "./planner-plan";
import { CROP_WINDOWS } from "./blenheim-calendar";
import { visibleInPeriod, type PlantingSchedule } from "./planting-schedule";

export const calendarMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const calendarSources = {
  tui: "https://www.tuigarden.co.nz/media/zjmpldcd/tui-planting-calendar-poster-2025-web.pdf",
  carrot: "https://www.yates.co.nz/products/seeds/vegetables/carrot-nantes/",
  bean: "https://www.yates.co.nz/plants/vegetable/beans/how-to-grow-beans/",
  climate: "https://niwa.co.nz/climate-and-weather/regional-climatologies/marlborough",
};

export type CalendarPlanting = {
  id: string; kind: "row" | "planting" | "guide"; crop: string; variety: string;
  location: string; count: number; schedule?: PlantingSchedule;
};

export function calendarPlantings(plan: PlannerPlan): CalendarPlanting[] {
  return [...plan.plantingAreas.map(area => ({ ...area, kind: "planting" as const,
    location: plan.beds.find(bed => bed.id === area.bedId)?.name ?? "Bed" })),
  ...plan.rows.map((row, index) => ({ ...row, kind: "row" as const, location: `Row ${index + 1}` }))];
}

export function cropCalendarGuide(crop: string) {
  return CROP_WINDOWS.find(window => window.crop === crop);
}

function plusDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function harvestGuide(planting: CalendarPlanting): { from: string; until?: string; estimated: boolean; basis?: string; source?: string } | undefined {
  const dates = planting.schedule;
  if (dates?.harvestFrom || dates?.harvestUntil) return { from: dates.harvestFrom ?? dates.harvestUntil!, until: dates.harvestUntil, estimated: false };
  if (!dates) return undefined;
  if (planting.crop === "Carrot" && planting.variety.toLowerCase() === "nantes" && dates.sow)
    return { from: plusDays(dates.sow, 112), until: plusDays(dates.sow, 140), estimated: true, basis: "16–20 weeks after sowing (Nantes)", source: calendarSources.carrot };
  if (planting.crop === "Bean" && dates.sow)
    return { from: plusDays(dates.sow, 56), estimated: true, basis: "First harvest from 8 weeks after sowing", source: calendarSources.bean };
  const duration: Record<string, [number, number]> = { Tomato: [60, 85], Pumpkin: [110, 170], Lettuce: [40, 70], Broccoli: [60, 120], Basil: [40, 60] };
  const crop = planting.crop === "Herbs" && planting.variety.toLowerCase() === "basil" ? "Basil" : planting.crop;
  const range = duration[crop];
  if (!range || !dates.transplant) return undefined;
  return { from: plusDays(dates.transplant, range[0]), until: plusDays(dates.transplant, range[1]),
    estimated: true, basis: `${range[0]}–${range[1]} days after planting seedlings`, source: calendarSources.tui };
}

export function calendarMonthEvents(planting: CalendarPlanting, year: number, month: number) {
  const events: { code: string; label: string; kind: string }[] = [];
  const guide = cropCalendarGuide(planting.crop), schedule = planting.schedule;
  const inMonth = (date?: string) => date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`);
  if (guide?.protectedSow?.includes(month)) events.push({ code: "C", label: "Sow under cover (guide)", kind: "cover" });
  if (guide?.directSow?.includes(month)) events.push({ code: "S", label: "Sow direct (guide)", kind: "sow" });
  if (guide?.plantOut?.includes(month) || guide?.establish?.includes(month)) events.push({ code: "P", label: "Plant out / establish (guide)", kind: "plant" });
  if (planting.kind !== "guide" && visibleInPeriod(schedule, { year, month })) events.push({ code: "G", label: "In garden (your plan)", kind: "garden" });
  if (inMonth(schedule?.sow)) events.push({ code: "●S", label: `Planned sowing: ${schedule!.sow}`, kind: "planned" });
  if (inMonth(schedule?.transplant)) events.push({ code: "●P", label: `Planned transplant: ${schedule!.transplant}`, kind: "planned" });
  const harvest = harvestGuide(planting);
  if (harvest && (harvest.until ? visibleInPeriod({ from: harvest.from, until: harvest.until }, { year, month }) : harvest.estimated ? inMonth(harvest.from) : visibleInPeriod({ from: harvest.from }, { year, month })))
    events.push({ code: harvest.estimated ? "~H" : "●H", label: `${harvest.estimated ? "Estimated first harvest" : "Planned harvest"}: ${harvest.from}${harvest.until ? ` – ${harvest.until}` : " onward"}`, kind: "harvest" });
  return events;
}
