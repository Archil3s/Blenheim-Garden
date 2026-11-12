import varieties from "./rasmussen-varieties.json";
import kingsSeedsVarieties from "./kings-seeds-varieties.json";
import suppliedKingsSeedsArt from "./kings-seeds-supplied-art.json";
import generatedArtwork from "./generated-artwork-manifest.json";

const key = (crop: string, variety: string) => JSON.stringify([crop.toLowerCase(), variety.toLowerCase()]);
const suppliedIds = new Set(suppliedKingsSeedsArt);
const icons = new Map<string, string>([
  ...kingsSeedsVarieties.map(item => [key(item.crop, item.variety), `/plant-icons/kings-seeds/${item.id}.svg`] as const),
  ...varieties.map(item => [key(item.crop, item.variety), `/plant-icons/rasmussen/${item.id}.svg`] as const),
  ...kingsSeedsVarieties.filter(item => suppliedIds.has(item.id))
    .map(item => [key(item.crop, item.variety), `/plant-icons/kings-seeds-art/${item.id}.svg`] as const),
]);

// The 2D PlantArt renderer uses reviewed 128px artwork; the 3D meshes are separate.
const generatedIcons: Record<string, { status: string; gallery: string }> = generatedArtwork;
export type ApprovedGeneratedPlantIcon = {
  source: "Kings Seeds" | "Rasmussen";
  crop: string;
  variety: string;
  gallery: string;
};
export const approvedGeneratedPlantIcons: ApprovedGeneratedPlantIcon[] = [];
for (const [sourceId, source, sourceVarieties] of [
  ["kings", "Kings Seeds", kingsSeedsVarieties],
  ["rasmussen", "Rasmussen", varieties],
] as const) {
  for (const { crop, variety, id } of sourceVarieties) {
    const artwork = generatedIcons[`${sourceId}:${id}`];
    if (artwork?.status !== "generated_qa_passed") continue;
    approvedGeneratedPlantIcons.push({ source, crop, variety, gallery: artwork.gallery });
    icons.set(key(crop, variety), artwork.gallery);
    // Source-qualified names are used only when an icon sample has duplicate cultivar names.
    icons.set(key(crop, `${variety} · ${source}`), artwork.gallery);
  }
}

export function supplierPlantIcon(crop: string, variety?: string | null): string | undefined {
  return variety ? icons.get(key(crop, variety)) : undefined;
}
