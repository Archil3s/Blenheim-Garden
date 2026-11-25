import type { PlannerPlan } from "./planner-plan";
import { cropArtName, type SeedBatch } from "./seedling-local";

export type SeedPacket = { id: string; crop: string; variety: string; count: number };
export const seedPacketKey = (gardenId: string) => `blenheim-seed-packets:${gardenId}`;

export function readSeedPackets(gardenId: string): SeedPacket[] {
  try {
    const packets: unknown = JSON.parse(localStorage.getItem(seedPacketKey(gardenId)) ?? "[]");
    return Array.isArray(packets) ? packets : [];
  } catch { return []; }
}

export function linkedBatchDelay(batch: SeedBatch, plantings: PlannerPlan["plantingAreas"], today: string) {
  const planting = plantings.find(item => item.id === batch.plantingAreaId);
  if (!planting || planting.crop.toLowerCase() !== cropArtName(batch.crop).toLowerCase()
    || batch.variety && planting.variety.toLowerCase() !== batch.variety.toLowerCase()) return undefined;
  const date = planting.schedule?.transplant ?? planting.schedule?.from;
  const delayed = batch.stage !== "planted" && date && (batch.readyFrom && batch.readyFrom > date || today > date);
  return { planting, date, delayed: Boolean(delayed) };
}
