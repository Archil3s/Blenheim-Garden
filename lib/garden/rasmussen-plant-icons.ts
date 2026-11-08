import varieties from "./rasmussen-varieties.json";

const key = (crop: string, variety: string) => JSON.stringify([crop.toLowerCase(), variety.toLowerCase()]);
const icons = new Map(varieties.map(item => [key(item.crop, item.variety), item.id]));

export function rasmussenPlantIcon(crop: string, variety?: string | null): string | undefined {
  const id = variety ? icons.get(key(crop, variety)) : undefined;
  return id ? `/plant-icons/rasmussen/${id}.svg` : undefined;
}
