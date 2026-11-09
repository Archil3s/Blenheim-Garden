import type { Metadata } from "next";
import kingsSeeds from "@/lib/garden/kings-seeds-varieties.json";
import rasmussen from "@/lib/garden/rasmussen-varieties.json";
import { catalogueArt } from "@/lib/garden/catalogue-art";
import { plants } from "@/lib/garden/plant-catalog";
import { supplierPlantIcon } from "@/lib/garden/supplier-plant-icons";
import batch11 from "../../public/plant-icons/rasmussen/batches/11/manifest.json";
import batch12 from "../../public/plant-icons/rasmussen/batches/12/manifest.json";
import batch13 from "../../public/plant-icons/rasmussen/batches/13/manifest.json";
import batch14 from "../../public/plant-icons/rasmussen/batches/14/manifest.json";
import { IconTestGarden, type TestGardenEntry } from "@/components/icon-test-garden";
import "./test-garden.css";

export const metadata: Metadata = {
  title: "All Plant Icons — Test Garden | Blenheim Garden",
  description: "Read-only test garden for every supplier variety and catalogue icon. Your saved garden is not changed.",
};

const key = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pairKey = (crop: string, variety: string) => `${crop.toLowerCase()}|${variety.toLowerCase()}`;
const conceptPaths = new Map(
  [...batch11.items, ...batch12.items, ...batch13.items, ...batch14.items]
    .map((item) => [key(item.name), "/" + item.path.replace(/^public\//, "")] as const),
);

const suppliers = [...kingsSeeds, ...rasmussen];
const supplierPairs = new Set(suppliers.map((item) => pairKey(item.crop, item.variety)));

const entries: TestGardenEntry[] = [
  ...kingsSeeds.map((item): TestGardenEntry => ({
    id: `kings:${item.id}`, group: "Kings Seeds", crop: item.crop, variety: item.variety,
    icon: supplierPlantIcon(item.crop, item.variety) ?? `/plant-icons/kings-seeds/${item.id}.svg`,
    visual: "image", label: item.crop + " · " + item.variety,
  })),
  ...rasmussen.map((item): TestGardenEntry => ({
    id: `rasmussen:${item.id}`, group: "Rasmussen", crop: item.crop, variety: item.variety,
    icon: supplierPlantIcon(item.crop, item.variety) ?? `/plant-icons/rasmussen/${item.id}.svg`,
    concept: conceptPaths.get(key(item.variety)),
    visual: "image", label: item.crop + " · " + item.variety,
  })),
  ...Object.entries(catalogueArt).map(([name, icon]): TestGardenEntry => ({
    id: `reference:${name}`, group: "Reference catalogue", crop: name,
    variety: name, icon, visual: "image", label: name,
  })),
];

const plannerPairs = new Set<string>();
for (const plant of plants) {
  for (const variety of plant.varieties.length ? plant.varieties : [plant.name]) {
    const pair = pairKey(plant.name, variety);
    if (supplierPairs.has(pair) || plannerPairs.has(pair)) continue;
    plannerPairs.add(pair);
    entries.push({
      id: `planner:${pair}`, group: "Planner extras", crop: plant.name, variety,
      icon: "", visual: "planner", label: plant.name + " · " + variety,
    });
  }
}

export default function TestGardenPage() {
  return <IconTestGarden entries={entries} />;
}
