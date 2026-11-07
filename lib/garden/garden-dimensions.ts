import type { PlannerPlan } from "./planner-plan";

export type GardenDimensions = { widthCm: number; heightCm: number };
export const defaultGardenDimensions: GardenDimensions = { widthCm: 900, heightCm: 1080 };

export function parseGardenDimensions(value: unknown): GardenDimensions {
  if (value === undefined) return { ...defaultGardenDimensions };
  const dimensions = value as Partial<GardenDimensions> | null;
  if (!dimensions || ![dimensions.widthCm, dimensions.heightCm].every(number => typeof number === "number" && Number.isInteger(number) && number >= 100 && number <= 10000)) {
    throw new Error("Invalid garden size. Width and length must be between 1 and 100 metres, in whole centimetres.");
  }
  return { widthCm: dimensions.widthCm!, heightCm: dimensions.heightCm! };
}

export function gardenDimensions(plan: Pick<PlannerPlan, "canvas">): GardenDimensions {
  return parseGardenDimensions(plan.canvas);
}

// Bed percentages retain their original 9 × 10.8 m coordinate basis, so resizing
// a boundary never stretches or moves existing beds and their plantings.
export const bedCoordinateBasis = { widthCm: 900, heightCm: 1080 };
