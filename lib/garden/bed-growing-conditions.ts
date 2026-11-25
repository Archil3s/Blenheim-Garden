import { bedRectangle } from "./plan-editing";
import type { PlannerBed, PlannerPlan } from "./planner-plan";

export const bedConditionOptions = {
  light: { sun: "Full sun", partial: "Part shade", shade: "Mostly shaded" },
  temperature: { cool: "Cool / frost-prone", normal: "Typical outdoor bed", hot: "Hot / sheltered", heated: "Heated cover" },
  support: { yes: "Trellis available", no: "No trellis" },
  moisture: { dry: "Dries quickly", even: "Evenly moist", wet: "Stays wet" },
} as const;

export type BedGrowingConditions = { [Field in keyof typeof bedConditionOptions]?: keyof typeof bedConditionOptions[Field] };

export function parseBedGrowingConditions(input: unknown): BedGrowingConditions | undefined {
  if (input == null) return undefined;
  if (typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid bed growing conditions.");
  const entries = Object.entries(input).filter(([, value]) => value !== undefined && value !== "");
  for (const [field, value] of entries) {
    const options = bedConditionOptions[field as keyof BedGrowingConditions];
    if (!Object.hasOwn(bedConditionOptions, field) || typeof value !== "string" || !Object.hasOwn(options, value)) {
      throw new Error("Invalid bed growing conditions.");
    }
  }
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function segmentNearBed(trellis: { x1: number; y1: number; x2: number; y2: number }, bed: ReturnType<typeof bedRectangle>) {
  let enter = 0, leave = 1;
  for (const [start, end, low, high] of [
    [trellis.x1, trellis.x2, bed.x - 20, bed.x + bed.w + 20],
    [trellis.y1, trellis.y2, bed.y - 20, bed.y + bed.h + 20],
  ]) {
    const distance = end - start;
    if (!distance) {
      if (start < low || start > high) return false;
      continue;
    }
    const first = (low - start) / distance, last = (high - start) / distance;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
  }
  return enter <= leave;
}

type Support = Extract<PlannerPlan["objects"][number], { type: "trellis" | "structure" }>;

export function mappedClimbingSupports(plan: PlannerPlan): Support[] {
  return plan.objects.filter((object): object is Support => object.type === "trellis"
    || object.type === "structure" && /trellis|cucumber-arch|teepee|bean-support|obelisk/.test(object.kind));
}

export function climbingSupportNear(object: Support, rect: ReturnType<typeof bedRectangle>) {
  if (object.type === "trellis") return segmentNearBed(object, rect);
  const theta = object.rotationDeg * Math.PI / 180;
  const rx = (object.widthCm * Math.abs(Math.cos(theta)) + object.depthCm * Math.abs(Math.sin(theta))) / 2;
  const ry = (object.widthCm * Math.abs(Math.sin(theta)) + object.depthCm * Math.abs(Math.cos(theta))) / 2;
  return Math.abs(rect.x + rect.w / 2 - object.x) <= rect.w / 2 + rx + 20
    && Math.abs(rect.y + rect.h / 2 - object.y) <= rect.h / 2 + ry + 20;
}

export function bedGrowingContext(plan: PlannerPlan, bed: PlannerBed, observed = bed.growingConditions) {
  const rect = bedRectangle(bed);
  const centerX = rect.x + rect.w / 2, centerY = rect.y + rect.h / 2;
  const supports = mappedClimbingSupports(plan).filter(item => climbingSupportNear(item, rect));
  const structureNotes = supports.map(item => item.label || (item.type === "trellis" ? "Mapped trellis" : "Mapped climbing support"));
  let shadeCover = false, heated = false, ordinaryCover = false;
  for (const object of plan.objects) {
    if (object.type === "tree") {
      const closestX = Math.max(rect.x, Math.min(object.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(object.y, rect.y + rect.h));
      if (Math.hypot(object.x - closestX, object.y - closestY) <= object.diameterCm / 2) {
        structureNotes.push(`${object.label || "Tree canopy"} may shade this bed`);
      }
    }
    if (object.type !== "structure") continue;
    const kind = object.kind.replace(/^reference-/, "");
    const angle = object.rotationDeg * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const halfW = object.widthCm / 2, halfH = object.depthCm / 2;
    const dx = centerX - object.x, dy = centerY - object.y;
    const coversBedCenter = Math.abs(dx * cos + dy * sin) <= halfW && Math.abs(-dx * sin + dy * cos) <= halfH;
    if (!coversBedCenter) continue;
    if (kind === "shade-cloth-frame") shadeCover = true;
    else if (/^heated-(greenhouse|polytunnel)$/.test(kind)) heated = true;
    else if (/greenhouse|polytunnel|cold-frame|row-cover|frost-cloth|cloche|mini-bed-cover/.test(kind)) ordinaryCover = true;
  }
  if (shadeCover) structureNotes.push("Mapped shade cloth");
  if (heated) structureNotes.push("Mapped heated cover");
  else if (ordinaryCover) structureNotes.push("Mapped cover · check frost protection");
  return {
    conditions: {
      light: observed?.light ?? (shadeCover ? "partial" as const : undefined),
      temperature: observed?.temperature ?? (heated ? "heated" as const : undefined),
      support: observed?.support ?? (supports.length ? "yes" as const : undefined),
      moisture: observed?.moisture,
    },
    structureNotes: [...new Set(structureNotes)],
    width: Math.min(rect.w, rect.h),
  };
}
