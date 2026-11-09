import type { Metadata } from "next";
import kingsSeeds from "@/lib/garden/kings-seeds-varieties.json";
import rasmussen from "@/lib/garden/rasmussen-varieties.json";
import { catalogueArt } from "@/lib/garden/catalogue-art";
import { plants } from "@/lib/garden/plant-catalog";
import rasmussenManifest from "../../public/assets/icons/rasmussen/asset-manifest.json";
import { IconTestGarden, type TestGardenEntry } from "@/components/icon-test-garden";
import "./test-garden.css";

export const metadata: Metadata = {
  title: "Original Plant Artwork Audit | Blenheim Garden",
  description: "View exact source artwork, without clipped or unrelated substitute illustrations.",
};

const pairKey = (crop: string, variety: string) => JSON.stringify([crop.toLowerCase(), variety.toLowerCase()]);
const normalizeName = (name: string) => name.normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// These ten PNGs are byte-for-byte identical to the ready entries in the user's
// Rasmussen_Chilli_137_Icon_Gallery(2).html. Other concepts are not source originals.
const verifiedRasmussen = new Map(rasmussenManifest.items
  .filter(item => item.artwork_status === "approved_existing" && Boolean(item.png_path))
  .map(item => [normalizeName(item.name), "/" + item.png_path!.replace(/^public\//, "")] as const));

const suppliers = [...kingsSeeds, ...rasmussen];
const supplierPairs = new Set(suppliers.map(item => pairKey(item.crop, item.variety)));
const entries: TestGardenEntry[] = [
  ...kingsSeeds.map((item): TestGardenEntry => ({
    id: "kings:" + item.id, group: "Kings Seeds", crop: item.crop, variety: item.variety,
    label: item.crop + " · " + item.variety, artworkStatus: "pending",
    pendingReason: "The supplied Kings Seeds PDF contains picture pieces cropped from a comparison sheet, including incomplete or neighbouring artwork. No full original individual PNG is verified for this variety.",
  })),
  ...rasmussen.map((item): TestGardenEntry => {
    const icon = verifiedRasmussen.get(normalizeName(item.variety));
    return {
      id: "rasmussen:" + item.id, group: "Rasmussen", crop: item.crop,
      variety: item.variety, label: item.crop + " · " + item.variety,
      icon, artworkStatus: icon ? "verified" : "pending",
      sourceFile: icon ? "Rasmussen_Chilli_137_Icon_Gallery(2).html" : undefined,
      pendingReason: icon ? undefined : "No original individual PNG for this exact variety is verified in the supplied Rasmussen HTML gallery. Unreviewed concept batches are excluded.",
    };
  }),
  ...Object.keys(catalogueArt).map((name): TestGardenEntry => ({
    id: "reference:" + name, group: "Reference catalogue", crop: name, variety: name,
    label: name, artworkStatus: "pending",
    pendingReason: "This reference icon is not a verified original from either uploaded supplier source file.",
  })),
];
const plannerPairs = new Set<string>();
for (const plant of plants) {
  for (const variety of plant.varieties.length ? plant.varieties : [plant.name]) {
    const pair = pairKey(plant.name, variety);
    if (supplierPairs.has(pair) || plannerPairs.has(pair)) continue;
    plannerPairs.add(pair);
    entries.push({
      id: "planner:" + pair, group: "Planner extras", crop: plant.name, variety,
      label: plant.name + " · " + variety, artworkStatus: "pending",
      pendingReason: "No individually verified supplier-source illustration is mapped to this planner-only entry.",
    });
  }
}

export default function TestGardenPage() {
  return <IconTestGarden entries={entries} />;
}
