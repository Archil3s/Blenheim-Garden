import referencePlantData from "./reference-plant-data.json";
import rasmussenVarieties from "./rasmussen-varieties.json";
import { referencePlantNames } from "./plant-reference-names";

export type PlantType = "Vegetable" | "Fruit" | "Herb" | "Flower" | "Native";

export type PlantOption = {
  name: string;
  icon: string;
  spacingCm: number;
  spacing: string;
  type: PlantType;
  varieties: string[];
};

export const establishedPlants: PlantOption[] = [
  { name: "Tomato", icon: "🍅", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Roma", "Black Krim", "Moneymaker", "Beefsteak"] },
  { name: "Strawberry", icon: "🍓", spacingCm: 35, spacing: "30–40 cm", type: "Fruit", varieties: ["Camarosa", "Albion", "Monterey", "Unknown crown"] },
  { name: "Bean", icon: "🫘", spacingCm: 18, spacing: "15–20 cm", type: "Vegetable", varieties: ["King Purple", "Superstar", "Scarlet Runner", "Climbing bean"] },
  { name: "Lettuce", icon: "🥬", spacingCm: 28, spacing: "25–30 cm", type: "Vegetable", varieties: ["Butterhead", "Cos", "Loose leaf", "Iceberg"] },
  { name: "Pumpkin", icon: "🎃", spacingCm: 105, spacing: "90–120 cm", type: "Vegetable", varieties: ["Crown", "Butternut", "Gem squash", "Kabocha"] },
  { name: "Taro", icon: "🌿", spacingCm: 45, spacing: "45 cm", type: "Vegetable", varieties: ["Taro"] },
  { name: "Carrot", icon: "🥕", spacingCm: 7, spacing: "5–8 cm", type: "Vegetable", varieties: ["Nantes", "Chantenay", "Amsterdam", "Rainbow"] },
  { name: "Broccoli", icon: "🥦", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Winter Rudolph", "Green Dragon", "Calabrese"] },
  { name: "Raspberry", icon: "🔴", spacingCm: 50, spacing: "45–60 cm", type: "Fruit", varieties: ["Heritage", "Aspiring", "Waiau", "Unknown cane"] },
  { name: "Blueberry", icon: "🫐", spacingCm: 120, spacing: "1–1.5 m", type: "Fruit", varieties: ["Southern Highbush", "Rabbiteye", "Unknown"] },
  { name: "Herbs", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", type: "Herb", varieties: ["Basil", "Chives", "Thyme", "Parsley"] },
  { name: "Achillea", icon: "🌼", spacingCm: 40, spacing: "35–45 cm", type: "Flower", varieties: ["Achillea"] },
  { name: "Agastache", icon: "💜", spacingCm: 40, spacing: "35–45 cm", type: "Flower", varieties: ["Agastache"] },
  { name: "Ageratum", icon: "🌸", spacingCm: 25, spacing: "20–30 cm", type: "Flower", varieties: ["Ageratum"] },
  { name: "Agrostemma", icon: "🌸", spacingCm: 30, spacing: "25–35 cm", type: "Flower", varieties: ["Agrostemma"] },
  { name: "Akeake", icon: "🌿", spacingCm: 100, spacing: "80–120 cm", type: "Native", varieties: ["Akeake"] },
  { name: "Alyssum", icon: "🌼", spacingCm: 20, spacing: "15–25 cm", type: "Flower", varieties: ["Alyssum"] },
  { name: "Amaranth", icon: "🌿", spacingCm: 30, spacing: "25–35 cm", type: "Vegetable", varieties: ["Garnet Red", "Green Red"] },
  { name: "Angelica", icon: "🌿", spacingCm: 60, spacing: "50–70 cm", type: "Herb", varieties: ["Chinese", "Holy Ghost"] },
  { name: "Anise", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", type: "Herb", varieties: ["Anise"] },
  { name: "Anise Hyssop", icon: "💜", spacingCm: 35, spacing: "30–40 cm", type: "Herb", varieties: ["Anise Hyssop"] },
  { name: "Artichoke", icon: "🌱", spacingCm: 100, spacing: "90–120 cm", type: "Vegetable", varieties: ["Green Globe"] },
  { name: "Asparagus", icon: "🌱", spacingCm: 40, spacing: "35–45 cm", type: "Vegetable", varieties: ["Mary Washington", "Pacific Challenger F1", "Pacific Purple"] },
  { name: "Asparagus Pea", icon: "🌱", spacingCm: 20, spacing: "15–25 cm", type: "Vegetable", varieties: ["Asparagus Pea"] },
  { name: "Aster", icon: "🌸", spacingCm: 30, spacing: "25–35 cm", type: "Flower", varieties: ["Aster"] },
  { name: "Astragalus", icon: "🌼", spacingCm: 30, spacing: "25–35 cm", type: "Herb", varieties: ["Astragalus"] },
  { name: "Basil", icon: "🌿", spacingCm: 20, spacing: "15–25 cm", type: "Herb", varieties: ["Compact"] },
];


export const unverifiedPlantNames = new Set<string>();

function catalogueType(name: string): PlantType {
  if (/bean|beetroot|bok choi|broccoli|brussels|cabbage|capsicum|carrot|cauliflower|celeriac|celery|chilli|collards|corn salad|cowpea|cress|cucamelon|cucumber|eggplant|endive|fennel$|gourd|kale|kohlrabi|leek|lettuce|luffa|marrow|mizuna|mustard|okra|onion|pak choi|parsnip|pea[s ]|potato|pumpkin|radicchio|radish|rhubarb|rocket|salsify|scorzonera|shallot|silver beet|spinach|squash|swede|sweetcorn|tatsoi|tomatillo|tomato|turnip|zucchini|artichoke|asparagus/i.test(name)) return "Vegetable";
  if (/almond|apple|apricot|berry|currant|cherry|chestnut|fig|fruit|grape|hazelnut|honeydew|kiwi|kumquat|lemon|lime|mandarin|medlar|mulberry|nectarine|olive|orange|passionfruit|peach|pear|pecan|persimmon|plum|pomegranate|quince|rockmelon|satsuma|walnut|watermelon/i.test(name)) return "Fruit";
  if (/basil|bay$|borage|catnip|chamomile|chives|comfrey|coriander|dill|fennel|fenugreek|feverfew|garlic|ginger|herb|horseradish|lavender|lovage|marjoram|mint|nettle|oregano|parsley|rosemary|sage$|savory|stevia|tansy|tarragon|thyme|valerian|verbena/i.test(name)) return "Herb";
  if (/banksia|bottlebrush|kangaroo grass|new zealand flax|sugarbush protea/i.test(name)) return "Native";
  return "Flower";
}

const knownNames = new Set(establishedPlants.map((plant) => plant.name));
const observedNames = [...new Set([...referencePlantNames, ...referencePlantData.map((plant) => plant.name.trim())])];
const additions: PlantOption[] = observedNames.filter((name) => !knownNames.has(name)).map((name) => {
  const baseName = name.split(" (")[0];
  const existing = establishedPlants.find((plant) => plant.name === baseName);
  if (existing) return { ...existing, name, varieties: [...existing.varieties] };
  const reference = referencePlantData.find((plant) => plant.name.trim() === name);
  if (reference && reference.spacingCm > 0) return { name, type: catalogueType(name), icon: "🌱", spacingCm: reference.spacingCm, spacing: `${reference.spacingCm} cm`, varieties: [name] };
  unverifiedPlantNames.add(name);
  return { name, type: catalogueType(name), icon: "🌱", spacingCm: 30,
    spacing: "Set from seed packet", varieties: [name] };
});

// Keep established crops first so saved defaults and seasonal actions remain stable.
export const plants: PlantOption[] = [...establishedPlants, ...additions];
const plantsByName = new Map(plants.map(plant => [plant.name.toLowerCase(), plant]));
for (const { crop, variety } of rasmussenVarieties) {
  const key = crop.toLowerCase();
  let plant = plantsByName.get(key);
  if (!plant) {
    plant = { name: crop, icon: "🌱", spacingCm: 30, spacing: "Set from seed packet", type: "Vegetable", varieties: [] };
    unverifiedPlantNames.add(crop);
    plants.push(plant);
    plantsByName.set(key, plant);
  }
  if (!plant.varieties.includes(variety)) plant.varieties.push(variety);
}
