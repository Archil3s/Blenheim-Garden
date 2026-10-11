import type { D1DatabaseLike } from "./cloudflare-db";
import type { BedProfile, PlannerPlan } from "./planner-plan";

export async function ensureGardenBuilderSchema(db: D1DatabaseLike) {
  const info = await db.prepare("PRAGMA table_info(gardens)").all<{ name: string }>();
  if (info.results?.some((column) => column.name === "editor_settings_json")) return;
  try { await db.prepare("ALTER TABLE gardens ADD COLUMN editor_settings_json TEXT").run(); }
  catch (error) {
    if (!(error instanceof Error) || !/duplicate column|already exists/i.test(error.message)) throw error;
  }
}

export function parseBedProfiles(value: unknown): Record<string, BedProfile> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 1250) throw new Error("Bed growing conditions are invalid.");
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => {
    if (!/^(bed|object):.{1,160}$/.test(key) || !raw || typeof raw !== "object") throw new Error("Bed growing conditions are invalid.");
    const profile = raw as BedProfile;
    if (!["full", "partial"].includes(profile.sun) || !Number.isFinite(profile.soilDepthCm) || profile.soilDepthCm < 5 || profile.soilDepthCm > 150
      || typeof profile.previousCrop !== "string" || profile.previousCrop.length > 120) throw new Error("Bed growing conditions are invalid.");
    return [key, { sun: profile.sun, soilDepthCm: profile.soilDepthCm, previousCrop: profile.previousCrop }];
  }));
}

export function builderSettings(plan: PlannerPlan) {
  return JSON.stringify({ bedProfiles: plan.bedProfiles ?? {},
    rowOwners: Object.fromEntries(plan.rows.filter((row) => row.surfaceId).map((row) => [row.id, row.surfaceId])) });
}
