export type CropFamilyKey =
  | "nightshade"
  | "legume"
  | "brassica"
  | "cucurbit"
  | "apiaceae"
  | "asteraceae"
  | "rosaceae"
  | "ericaceae"
  | "lamiaceae"
  | "allium"
  | "other";

export type CropFamily = {
  key: CropFamilyKey;
  label: string;
  botanical: string;
  perennial: boolean;
};

export type RotationHistoryLike = {
  cropName: string;
  variety: string | null;
  family: CropFamily;
  status: "planned" | "active" | "finished";
  startDate: string | null;
  endDate: string | null;
};

export type RotationAdvice = {
  tone: "neutral" | "good" | "caution";
  headline: string;
  detail: string;
  avoidFamily: CropFamily | null;
  suggestedCrops: string[];
};

const FAMILY_INFO: Record<CropFamilyKey, Omit<CropFamily, "key">> = {
  nightshade: { label: "Nightshade", botanical: "Solanaceae", perennial: false },
  legume: { label: "Legume", botanical: "Fabaceae", perennial: false },
  brassica: { label: "Brassica", botanical: "Brassicaceae", perennial: false },
  cucurbit: { label: "Cucurbit", botanical: "Cucurbitaceae", perennial: false },
  apiaceae: { label: "Carrot family", botanical: "Apiaceae", perennial: false },
  asteraceae: { label: "Daisy family", botanical: "Asteraceae", perennial: false },
  rosaceae: { label: "Rose family", botanical: "Rosaceae", perennial: true },
  ericaceae: { label: "Heath family", botanical: "Ericaceae", perennial: true },
  lamiaceae: { label: "Mint family", botanical: "Lamiaceae", perennial: false },
  allium: { label: "Allium family", botanical: "Amaryllidaceae", perennial: false },
  other: { label: "Other", botanical: "Mixed / unknown", perennial: false },
};

const HERB_FAMILY: Array<{ names: string[]; family: CropFamilyKey }> = [
  { names: ["basil", "thyme", "mint", "sage", "oregano", "rosemary", "marjoram"], family: "lamiaceae" },
  { names: ["parsley", "coriander", "cilantro", "dill", "fennel"], family: "apiaceae" },
  { names: ["chives", "onion", "garlic", "leek", "spring onion"], family: "allium" },
];

const SUGGESTIONS: Record<CropFamilyKey, string[]> = {
  nightshade: ["Bean", "Carrot", "Broccoli", "Lettuce", "Pumpkin"],
  legume: ["Broccoli", "Lettuce", "Tomato", "Pumpkin", "Carrot"],
  brassica: ["Bean", "Carrot", "Lettuce", "Tomato", "Pumpkin"],
  cucurbit: ["Bean", "Broccoli", "Carrot", "Lettuce", "Tomato"],
  apiaceae: ["Bean", "Broccoli", "Lettuce", "Tomato", "Pumpkin"],
  asteraceae: ["Bean", "Broccoli", "Carrot", "Tomato", "Pumpkin"],
  rosaceae: ["Bean", "Broccoli", "Carrot", "Lettuce", "Tomato"],
  ericaceae: ["Bean", "Broccoli", "Carrot", "Lettuce", "Tomato"],
  lamiaceae: ["Bean", "Broccoli", "Carrot", "Lettuce", "Tomato"],
  allium: ["Bean", "Broccoli", "Lettuce", "Tomato", "Pumpkin"],
  other: ["Bean", "Broccoli", "Carrot", "Lettuce", "Tomato"],
};

function normalise(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function cropFamilyFor(cropName: string, variety?: string | null): CropFamily {
  const crop = normalise(cropName);
  const varietyName = normalise(variety);
  let key: CropFamilyKey = "other";

  if (crop.includes("tomato") || crop.includes("potato") || crop.includes("pepper") || crop.includes("aubergine") || crop.includes("eggplant")) key = "nightshade";
  else if (crop.includes("bean") || crop.includes("pea")) key = "legume";
  else if (crop.includes("broccoli") || crop.includes("cabbage") || crop.includes("cauliflower") || crop.includes("kale") || crop.includes("radish") || crop.includes("turnip")) key = "brassica";
  else if (crop.includes("pumpkin") || crop.includes("squash") || crop.includes("courgette") || crop.includes("zucchini") || crop.includes("cucumber") || crop.includes("melon")) key = "cucurbit";
  else if (crop.includes("carrot") || crop.includes("parsnip") || crop.includes("celery")) key = "apiaceae";
  else if (crop.includes("lettuce")) key = "asteraceae";
  else if (crop.includes("strawberry") || crop.includes("raspberry") || crop.includes("blackberry")) key = "rosaceae";
  else if (crop.includes("blueberry")) key = "ericaceae";
  else if (crop.includes("herb")) {
    key = HERB_FAMILY.find((entry) => entry.names.some((name) => varietyName.includes(name)))?.family ?? "other";
  }

  const info = FAMILY_INFO[key];
  const perennial = crop.includes("raspberry") || crop.includes("blackberry") || crop.includes("blueberry")
    ? true
    : key === "rosaceae" && crop.includes("strawberry")
      ? true
      : info.perennial;
  return { key, label: info.label, botanical: info.botanical, perennial };
}

export function rotationAdvice(history: RotationHistoryLike[]): RotationAdvice {
  const ordered = history
    .filter((item) => item.status !== "planned")
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  const latest = ordered[0];

  if (!latest) {
    return {
      tone: "neutral",
      headline: "No rotation history yet",
      detail: "Once crops are saved and later replaced, this bed will build a permanent occupancy history automatically.",
      avoidFamily: null,
      suggestedCrops: [],
    };
  }

  if (latest.family.perennial) {
    return {
      tone: "neutral",
      headline: `${latest.cropName} is treated as a perennial planting`,
      detail: "Perennial fruit is normally managed in place rather than rotated each season. Use the history mainly to track how long the planting has occupied this bed.",
      avoidFamily: null,
      suggestedCrops: [],
    };
  }

  const recentAnnual = ordered.filter((item) => !item.family.perennial).slice(0, 4);
  const repeats = recentAnnual.filter((item) => item.family.key === latest.family.key).length;
  const caution = repeats >= 2;

  return {
    tone: caution ? "caution" : "good",
    headline: caution
      ? `${latest.family.label} crops have repeated in recent history`
      : `Rotate away from ${latest.family.label} next if practical`,
    detail: caution
      ? `This bed has had ${repeats} recent ${latest.family.label.toLowerCase()} plantings. A different family next can help reduce family-specific pest and disease carry-over.`
      : `A strict rotation is not always possible in a small garden, but avoiding the same family back-to-back is a useful default when you have another suitable bed.`,
    avoidFamily: latest.family,
    suggestedCrops: SUGGESTIONS[latest.family.key],
  };
}

export function seasonForDate(dateValue: string | null | undefined) {
  if (!dateValue) return null;
  const month = Number(dateValue.slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (month === 12 || month <= 2) return "Summer";
  if (month <= 5) return "Autumn";
  if (month <= 8) return "Winter";
  return "Spring";
}
