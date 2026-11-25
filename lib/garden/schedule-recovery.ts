import { overlappingPlantings, type MeasuredPlanting } from "./planting-overlap";
import type { PlannerPlan } from "./planner-plan";
import { parsePlantingSchedule, type PlantingSchedule } from "./planting-schedule";
import { addDays } from "./seedling-local";
import { trellisBookings } from "./trellis-planning";

export type RecoveryRequest = { id: string; kind: "area" | "row"; mode: "delay" | "failure"; date: string };

export function recoveryPlanting(plan: PlannerPlan, request: Pick<RecoveryRequest, "id" | "kind">) {
  return (request.kind === "area" ? plan.plantingAreas : plan.rows).find(planting => planting.id === request.id);
}

export function proposeScheduleRecovery(plan: PlannerPlan, request: RecoveryRequest) {
  const source = recoveryPlanting(plan, request);
  const schedule = source?.schedule;
  if (!source || !schedule?.from) throw new Error("Choose a booking with a bed start date.");
  if (schedule.failedOn) throw new Error("This planting is already marked as failed.");
  const lock = plan.lockedItems ?? [];
  if (lock.includes(`${request.kind}:${request.id}`) || "bedId" in source && lock.includes(`bed:${source.bedId}`)) {
    throw new Error("Unlock the planting and bed to change this booking.");
  }
  if (!request.date || !parsePlantingSchedule({ from: request.date })) throw new Error("Choose a recovery date.");
  if (request.mode === "failure") {
    if (request.date < schedule.from || schedule.until && request.date > schedule.until) {
      throw new Error("Choose the date the failed crop cleared within its booking.");
    }
    return { source, schedule: { ...schedule, until: request.date, failedOn: request.date }, conflicts: [] as MeasuredPlanting[] };
  }
  if (request.date <= schedule.from) throw new Error("Choose a start date after the current bed booking.");
  const days = (Date.parse(request.date) - Date.parse(schedule.from)) / 86400000;
  const shift = (value?: string) => value ? addDays(value, days) : undefined;
  const next = parsePlantingSchedule({ ...schedule, from: request.date, until: shift(schedule.until),
    sow: !schedule.transplant && schedule.sow === schedule.from ? request.date : schedule.sow,
    transplant: shift(schedule.transplant), harvestFrom: shift(schedule.harvestFrom), harvestUntil: shift(schedule.harvestUntil) })!;
  const others = {
    ...plan,
    plantingAreas: plan.plantingAreas.filter(item => request.kind !== "area" || item.id !== request.id),
    rows: plan.rows.filter(item => request.kind !== "row" || item.id !== request.id),
  };
  const conflicts = overlappingPlantings(others, { ...source, schedule: next });
  if (next.supportId) {
    const support = trellisBookings(others, next).find(item => item.support.id === next.supportId);
    if (!support) throw new Error("The booked climbing support is missing. Review the trellis before changing dates.");
    for (const { planting } of support.bookings) if (!conflicts.includes(planting)) conflicts.push(planting);
  }
  return { source, schedule: next, conflicts };
}

export function applyScheduleRecovery(plan: PlannerPlan, request: RecoveryRequest, schedule: PlantingSchedule): PlannerPlan {
  return request.kind === "row"
    ? { ...plan, rows: plan.rows.map(item => item.id === request.id ? { ...item, schedule } : item) }
    : { ...plan, plantingAreas: plan.plantingAreas.map(item => item.id === request.id ? { ...item, schedule } : item) };
}

export function nextRecoverySlot(plan: PlannerPlan, request: RecoveryRequest) {
  const limit = addDays(request.date, 120);
  let date = request.date;
  while (date <= limit) {
    const proposal = { ...request, date };
    const result = proposeScheduleRecovery(plan, proposal);
    if (!result.conflicts.length) return { request: proposal, result };
    const ends = result.conflicts.map(item => item.schedule?.until);
    if (ends.some(end => !end)) return undefined;
    date = addDays(ends.sort().at(-1)!, 1);
  }
}
