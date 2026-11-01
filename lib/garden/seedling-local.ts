export type SeedBatch = {
  id: string;
  crop: string;
  variety: string;
  dateSown: string;
  count: number;
  site: "blenheim" | "waihopai";
  method: "indoors" | "protected" | "direct";
  container: string;
  covered: boolean;
  bottomWatered: boolean;
  stage: "sown" | "sprouted" | "true-leaves" | "potted" | "hardening" | "planted";
  lastMoistureCheck?: string;
  notes?: string;
};
export const SEEDLING_KEY = "blenheim-garden-seedling-batches-v1";
export function getSavedBatches(): SeedBatch[] {
  if (typeof window === "undefined") return [];
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(SEEDLING_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is SeedBatch => !!item && typeof item === "object" && typeof item.id === "string" && typeof item.crop === "string" && typeof item.dateSown === "string");
  } catch { return []; }
}
export function saveBatches(batches: SeedBatch[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(SEEDLING_KEY, JSON.stringify(batches));
}
export type SeedCropGuide = {
  crop: string;
  indoorMonths?: number[];
  outdoorMonths: number[];
  intervalDays?: number;
  emergenceDays: [number, number];
  harvestDays?: [number, number];
  notes: string;
  overwinter?: string;
  seedlingAdvice?: string;
};
/** NZ calendar months: January=1. Editorial planning defaults, NOT variety-specific supplier data. */
export const SEED_CROPS: SeedCropGuide[] = [
  {crop:"Peas",outdoorMonths:[3,4,5,6,7,8,9],intervalDays:18,emergenceDays:[7,14],harvestDays:[65,95],notes:"Direct sow into well-drained soil; succession sow about every 2–3 weeks in suitable cool conditions. Protect flowers during hard frosts.",overwinter:"Trial autumn sowing in a sheltered, well-drained site for an early spring crop. Results vary by variety and local winter exposure."},
  {crop:"Tomato",indoorMonths:[7,8,9],outdoorMonths:[10,11,12],emergenceDays:[5,12],harvestDays:[95,150],notes:"Start indoors in warmth and light; harden off before planting into reliably frost-free conditions.",seedlingAdvice:"Pot on once true leaves and roots have developed. Seedlings benefit from strong light."},
  {crop:"Capsicum / chilli",indoorMonths:[8,9],outdoorMonths:[11,12],emergenceDays:[10,28],harvestDays:[110,180],notes:"Warm germination is essential. Without bottom heat, germination may be slow or unreliable."},
  {crop:"Pumpkin",indoorMonths:[9,10],outdoorMonths:[10,11,12],emergenceDays:[5,12],harvestDays:[90,140],notes:"Start only a few weeks ahead in individual pots or direct sow into warm soil; avoid disturbing roots."},
  {crop:"Beans",outdoorMonths:[10,11,12,1,2],intervalDays:21,emergenceDays:[5,12],harvestDays:[50,85],notes:"Direct sow into warm soil after frost risk. Repeat bush bean sowings about every 3 weeks."},
  {crop:"Lettuce",indoorMonths:[3,4,5,6,7,8],outdoorMonths:[1,2,3,4,5,6,7,8,9,10,11,12],intervalDays:18,emergenceDays:[4,10],harvestDays:[45,75],notes:"Sow small batches every 2–3 weeks; provide shade in hot weather."},
  {crop:"Carrot",outdoorMonths:[1,2,3,7,8,9,10,11,12],intervalDays:21,emergenceDays:[10,21],harvestDays:[70,120],notes:"Direct sow only; successive small rows about every 3 weeks when soil suits."},
  {crop:"Broccoli",indoorMonths:[1,2,3,7,8,9],outdoorMonths:[2,3,4,7,8,9],intervalDays:28,emergenceDays:[5,12],harvestDays:[80,130],notes:"Start in cells or direct sow during cool windows. Protect against whitefly and caterpillars."}
];
export function parseLocalDay(value: string): Date {
  return new Date(value + "T12:00:00");
}
export function addDays(value: string, days: number): string {
  const date = parseLocalDay(value);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function findGuide(crop: string) { return SEED_CROPS.find(x=>x.crop===crop); }
export function formatNzDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ",{day:"numeric",month:"short",year:"numeric"}).format(parseLocalDay(value));
}
