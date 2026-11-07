import type { PlannerPlan } from "./planner-plan";

export type PlantingSchedule = { from?: string; until?: string; sow?: string; transplant?: string; harvestFrom?: string; harvestUntil?: string };
export type PlanningPeriod = { year: number; month: number };
export const planningPeriodEvent = "garden-planning-period";
export const planningPeriodKey = (gardenId: string) => `garden-planning-period:${gardenId}`;

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number(value.slice(0, 4)) >= 1900 && Number(value.slice(0, 4)) <= 2200
    && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function parsePlantingSchedule(value: unknown): PlantingSchedule | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object") throw new Error("Invalid planting dates.");
  const schedule = value as Record<string, unknown>;
  const parsed: PlantingSchedule = {};
  for (const field of ["from", "until", "sow", "transplant", "harvestFrom", "harvestUntil"] as const) {
    const date = schedule[field];
    if (date === undefined || date === null || date === "") continue;
    if (!validDate(date)) throw new Error("Invalid planting date.");
    parsed[field] = date;
  }
  if (parsed.from && parsed.until && parsed.from > parsed.until) throw new Error("Invalid planting dates: the end precedes the start.");
  if (parsed.sow && parsed.transplant && parsed.sow > parsed.transplant) throw new Error("Invalid planting dates: sow before transplanting.");
  if (parsed.harvestFrom && parsed.harvestUntil && parsed.harvestFrom > parsed.harvestUntil) throw new Error("Invalid harvest dates: the end precedes the start.");
  return Object.keys(parsed).length ? parsed : undefined;
}

export function visibleInPeriod(schedule: PlantingSchedule | undefined, period: PlanningPeriod) {
  const first = `${period.year}-${String(period.month + 1).padStart(2, "0")}-01`;
  const last = `${period.year}-${String(period.month + 1).padStart(2, "0")}-${new Date(Date.UTC(period.year, period.month + 1, 0)).getUTCDate()}`;
  return (!schedule?.from || schedule.from <= last) && (!schedule?.until || schedule.until >= first);
}

export function planInPeriod(plan: PlannerPlan, period?: PlanningPeriod): PlannerPlan {
  if (!period) return plan;
  return { ...plan, plantingAreas: plan.plantingAreas.filter(p => visibleInPeriod(p.schedule, period)),
    rows: plan.rows.filter(p => visibleInPeriod(p.schedule, period)) };
}

export function nextPlantingDate(until: string) {
  if (!validDate(until)) throw new Error("Invalid succession date.");
  const date = new Date(`${until}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1);
  const next = date.toISOString().slice(0, 10);
  if (!validDate(next)) throw new Error("Invalid succession date.");
  return next;
}

export function readPlanningPeriod(gardenId: string): PlanningPeriod | undefined {
  try {
    const period = JSON.parse(localStorage.getItem(planningPeriodKey(gardenId)) ?? "null");
    return Number.isInteger(period?.year) && period.year >= 1900 && period.year <= 2200
      && Number.isInteger(period.month) && period.month >= 0 && period.month < 12 ? period : undefined;
  } catch { return undefined; }
}
