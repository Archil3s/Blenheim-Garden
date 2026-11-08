import varieties from "./rasmussen-varieties.json";
import kingsSeedsVarieties from "./kings-seeds-varieties.json";

const key = (crop: string, variety: string) => JSON.stringify([crop.toLowerCase(), variety.toLowerCase()]);
const icons = new Map([
  ...kingsSeedsVarieties.map(item => [key(item.crop, item.variety), `/plant-icons/kings-seeds/${item.id}.svg`] as const),
  ...varieties.map(item => [key(item.crop, item.variety), `/plant-icons/rasmussen/${item.id}.svg`] as const),
]);

export function supplierPlantIcon(crop: string, variety?: string | null): string | undefined {
  return variety ? icons.get(key(crop, variety)) : undefined;
}
