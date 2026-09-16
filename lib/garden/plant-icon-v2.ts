export type PlantIconArchetype =
  | "fruiting"
  | "leafy"
  | "root"
  | "berry"
  | "legume-bush"
  | "legume-climbing"
  | "brassica"
  | "allium"
  | "cucurbit"
  | "herb";

export type PlantIconDefinition = {
  key: string;
  label: string;
  archetype: PlantIconArchetype;
  src: string;
  keywords: string[];
};

const ROOT = "/plant-icons/v2";

export const PLANT_ICON_V2: PlantIconDefinition[] = [
  { key: "tomato", label: "Tomato", archetype: "fruiting", src: `${ROOT}/tomato.svg`, keywords: ["tomato", "beefsteak", "roma", "plum", "paste", "grape", "dwarf tomato"] },
  { key: "cherry-tomato", label: "Cherry tomato", archetype: "fruiting", src: `${ROOT}/cherry-tomato.svg`, keywords: ["cherry tomato", "cherry"] },
  { key: "lettuce", label: "Lettuce", archetype: "leafy", src: `${ROOT}/lettuce.svg`, keywords: ["lettuce"] },
  { key: "carrot", label: "Carrot", archetype: "root", src: `${ROOT}/carrot.svg`, keywords: ["carrot"] },
  { key: "strawberry", label: "Strawberry", archetype: "berry", src: `${ROOT}/strawberry.svg`, keywords: ["strawberry"] },
  { key: "bean-bush", label: "Bush bean", archetype: "legume-bush", src: `${ROOT}/bean-bush.svg`, keywords: ["bush bean", "dwarf bean", "green bean"] },
  { key: "bean-climbing", label: "Climbing bean", archetype: "legume-climbing", src: `${ROOT}/bean-climbing.svg`, keywords: ["climbing bean", "pole bean", "runner bean", "scarlet runner"] },
  { key: "broccoli", label: "Broccoli", archetype: "brassica", src: `${ROOT}/broccoli.svg`, keywords: ["broccoli", "broccaflower"] },
  { key: "onion", label: "Onion", archetype: "allium", src: `${ROOT}/onion.svg`, keywords: ["onion", "shallot"] },
  { key: "garlic", label: "Garlic", archetype: "allium", src: `${ROOT}/garlic.svg`, keywords: ["garlic"] },
  { key: "pumpkin", label: "Pumpkin / squash", archetype: "cucurbit", src: `${ROOT}/pumpkin.svg`, keywords: ["pumpkin", "squash", "butternut", "kabocha", "buttercup", "kamo kamo"] },
  { key: "cucumber", label: "Cucumber", archetype: "cucurbit", src: `${ROOT}/cucumber.svg`, keywords: ["cucumber", "gherkin"] },
  { key: "blueberry", label: "Blueberry", archetype: "berry", src: `${ROOT}/blueberry.svg`, keywords: ["blueberry"] },
  { key: "raspberry", label: "Raspberry", archetype: "berry", src: `${ROOT}/raspberry.svg`, keywords: ["raspberry"] },
  { key: "herb", label: "Herb", archetype: "herb", src: `${ROOT}/herb.svg`, keywords: ["herb", "basil", "parsley", "coriander", "cilantro", "thyme", "oregano", "mint", "rosemary", "sage", "dill"] },
  { key: "brassica", label: "Brassica", archetype: "brassica", src: `${ROOT}/brassica.svg`, keywords: ["brassica", "cabbage", "kale", "cauliflower", "brussels sprout", "brussel sprout"] },
];

function normalise(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function matches(haystack: string, keyword: string) {
  return haystack === keyword || haystack.includes(` ${keyword} `) || haystack.startsWith(`${keyword} `) || haystack.endsWith(` ${keyword}`);
}

export function getPlantIconV2(crop: string, variety?: string | null): PlantIconDefinition | null {
  const cropKey = normalise(crop);
  const varietyKey = normalise(variety);
  const combined = `${cropKey} ${varietyKey}`.trim();

  if ((cropKey.includes("tomato") || cropKey === "tomato") && /\bcherry\b/.test(combined)) {
    return PLANT_ICON_V2.find((item) => item.key === "cherry-tomato") ?? null;
  }
  if (/\bbean\b/.test(combined)) {
    if (/\b(climbing|climb|pole|runner)\b/.test(combined)) return PLANT_ICON_V2.find((item) => item.key === "bean-climbing") ?? null;
    if (/\b(bush|dwarf|green)\b/.test(combined) || cropKey === "bean") return PLANT_ICON_V2.find((item) => item.key === "bean-bush") ?? null;
  }

  for (const icon of PLANT_ICON_V2) {
    if (icon.key === "cherry-tomato" || icon.key === "bean-bush" || icon.key === "bean-climbing") continue;
    if (icon.keywords.some((keyword) => matches(` ${combined} `, keyword))) return icon;
  }
  return null;
}
