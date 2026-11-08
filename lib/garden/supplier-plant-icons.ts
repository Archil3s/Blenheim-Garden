import varieties from "./rasmussen-varieties.json";
import kingsSeedsVarieties from "./kings-seeds-varieties.json";
import suppliedKingsSeedsArt from "./kings-seeds-supplied-art.json";

const key = (crop: string, variety: string) => JSON.stringify([crop.toLowerCase(), variety.toLowerCase()]);
const suppliedIds = new Set(suppliedKingsSeedsArt);
const icons = new Map([
  ...kingsSeedsVarieties.map(item => [key(item.crop, item.variety), `/plant-icons/kings-seeds/${item.id}.svg`] as const),
  ...varieties.map(item => [key(item.crop, item.variety), `/plant-icons/rasmussen/${item.id}.svg`] as const),
  ...kingsSeedsVarieties.filter(item => suppliedIds.has(item.id))
    .map(item => [key(item.crop, item.variety), `/plant-icons/kings-seeds-art/${item.id}.svg`] as const),
]);

export function supplierPlantIcon(crop: string, variety?: string | null): string | undefined {
  return variety ? icons.get(key(crop, variety)) : undefined;
}
