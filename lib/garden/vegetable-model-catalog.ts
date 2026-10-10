import { plants } from "./plant-catalog";

export type VegetableModel = {
  id: string;
  crop: string;
  variety: string;
  kind: string;
  features: string;
  desktop: string;
  mobile: string;
  plantingDepth: number;
};

const details: Record<string, [string, string]> = {
  Tomato: ["tomato", "Compound foliage, fruit trusses and textured ripe tomatoes"],
  Bean: ["bean", "Trifoliate leaves, curved pods and flowers; climbing and bush forms"],
  Lettuce: ["lettuce", "Layered folded leaves with distinct head and loose-leaf forms"],
  Pumpkin: ["pumpkin", "Lobed leaves, spreading vines, tendrils and ribbed squash"],
  Carrot: ["carrot", "Fine divided fernlike foliage and tapered root shoulders"],
  Broccoli: ["broccoli", "Dense branching florets surrounded by waxy leaves"],
  Amaranth: ["amaranth", "Dense seed plumes and alternating red or green leaves"],
  Artichoke: ["artichoke", "Layered pointed bracts, side buds and deeply lobed silver leaves"],
  Asparagus: ["asparagus", "Tapered spears with overlapping scales and pointed tips"],
  "Asparagus Pea": ["asparagus-pea", "Low trifoliate foliage, red flowers and four-winged pods"],
  Zucchini: ["zucchini", "Radiating lobed foliage, striped fruit and squash flowers"],
  Cucumber: ["cucumber", "Climbing stems, coiled tendrils and textured hanging cucumbers"],
  Melon: ["melon", "Trailing vines, broad leaves and netted fruit"],
  Spinach: ["spinach", "Glossy pointed leaves in a dense basal rosette"],
  Chard: ["chard", "Crinkled broad leaves with prominent coloured ribs"],
  Cauliflower: ["cauliflower", "Cream branching curds enclosed by blue-green leaves"],
  Cabbage: ["cabbage", "Tightly cupped inner leaves and spreading veined outer leaves"],
  Kale: ["kale", "Tall stalk with densely curled leaf margins"],
  "Broad Bean": ["broad-bean", "Upright stems, paired oval leaflets and swollen pods"],
  Pea: ["pea", "Paired leaflets, branched tendrils, pea-filled pods and white flowers"],
  Beet: ["beet", "Red-veined leaves and a rounded burgundy root crown"],
  Radish: ["radish", "Small lobed rosette and two-tone root with fine rootlets"],
  Onion: ["onion", "Hollow tapered leaves and papery bulb shoulders"],
  Garlic: ["garlic", "Flat arching blades and a segmented garlic bulb"],
  Leek: ["leek", "Long folded blue-green blades and overlapping white leaf sheaths"],
  Corn: ["corn", "Tall jointed stalk, arching leaves, silk, husks and tassels"],
  Pepper: ["pepper", "Branching glossy foliage, lobed bell peppers and white flowers"],
  Potato: ["potato", "Compound foliage, branching stems and five-petalled flowers"],
  "Brussels Sprout": ["brussels-sprout", "Spiral buds along a thick stalk below a leafy crown"],
};

export function vegetableKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const indexed = plants.filter((plant) => plant.type === "Vegetable");
const extras = Object.keys(details).filter((crop) => !indexed.some((plant) => plant.name === crop));

export const vegetableModels: VegetableModel[] = [
  ...indexed.flatMap((plant) => plant.varieties.map((variety) => ({ crop: plant.name, variety }))),
  ...extras.map((crop) => ({ crop, variety: "Default" })),
].map(({ crop, variety }) => {
  const id = vegetableKey(crop + " " + variety);
  const [kind, features] = details[crop];
  return {
    id, crop, variety, kind, features,
    desktop: crop === "Tomato" ? "/models/tomato/tomato-garden.glb" : `/models/vegetables/${id}.glb`,
    mobile: crop === "Tomato" ? "/models/tomato/tomato-mobile.glb" : `/models/vegetables/${id}-mobile.glb`,
    plantingDepth: crop === "Carrot" ? /chantenay/i.test(variety) ? .11 : .18 : ({ Beet: .09, Radish: .055, Onion: .065, Garlic: .045, Leek: .17 } as Record<string, number>)[crop] ?? 0,
  };
});

const aliases: Record<string, string> = {
  tomatoes: "tomato", courgette: "zucchini", silverbeet: "chard", capsicum: "pepper",
  "fava-bean": "broad-bean", "brussels-sprouts": "brussels-sprout", maize: "corn",
  "bush-bean": "bean", "climbing-bean": "bean", "runner-bean": "bean",
};

export function vegetableModelFor(crop: string, variety?: string | null) {
  const cropKey = aliases[vegetableKey(crop)] ?? vegetableKey(crop);
  const candidates = vegetableModels.filter((model) => vegetableKey(model.crop) === cropKey);
  const exact = candidates.find((model) => vegetableKey(model.variety) === vegetableKey(variety ?? ""));
  if (exact) return exact;
  if (cropKey === "bean" && /climb|runner|pole/i.test(`${crop} ${variety ?? ""}`)) return candidates.find((model) => model.variety === "Climbing bean");
  return candidates[0];
}
