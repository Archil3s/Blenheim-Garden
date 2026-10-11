import type { PlannerPlan } from "./planner-plan";

export function gardenDimensions(plan?: Pick<PlannerPlan, "canvasWidthCm" | "canvasHeightCm">) {
  return { width: plan?.canvasWidthCm ?? 900, height: plan?.canvasHeightCm ?? 1080 };
}

export function validateGardenDimensions(width: number, height: number) {
  if (![width, height].every((n) => Number.isFinite(n) && n >= 200 && n <= 5000)) {
    throw new Error("Garden dimensions must be between 200 and 5,000 cm.");
  }
}

export function resizeGarden(plan: PlannerPlan, width: number, height: number): PlannerPlan {
  validateGardenDimensions(width, height);
  const before = gardenDimensions(plan);
  for (const bed of plan.beds) {
    if ((bed.x + bed.w) * before.width / 100 > width + .01 || (bed.y + bed.h) * before.height / 100 > height + .01) {
      throw new Error(`${bed.name} would be outside the new boundary. Move it or choose a larger size.`);
    }
  }
  return { ...plan, canvasWidthCm: width, canvasHeightCm: height,
    beds: plan.beds.map((bed) => ({ ...bed, x: bed.x * before.width / width, w: bed.w * before.width / width,
      y: bed.y * before.height / height, h: bed.h * before.height / height })) };
}
