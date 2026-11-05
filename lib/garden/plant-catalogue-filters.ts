import data from "./reference-plant-data.json";
import { referencePlantSprite } from "./reference-sprites";

export type PlantFilters = {
  favouritesOnly: boolean;
  perennials: boolean;
  easy: boolean;
  frost: boolean;
  shade: boolean;
  autumn: boolean;
  tropical: boolean;
  companions: boolean;
  family: string;
};

export const defaultPlantFilters: PlantFilters = {
  favouritesOnly: false, perennials: true, easy: false, frost: false,
  shade: false, autumn: false, tropical: true, companions: false, family: "all",
};

export const rotationFamilies = ["Miscellaneous", "Brassicas", "Legumes", "Solanaceae", "Allium", "Umbelliferae", "Cucurbits", "Chenopodiaceae"];

export function plantFacts(name: string, variety?: string) {
  const code = referencePlantSprite(name, variety)?.code;
  return data.find((plant) => plant.code === code);
}

export function matchesPlantFilters(name: string, filters: PlantFilters, favourites: readonly string[], selected: string) {
  const facts = plantFacts(name);
  if (filters.favouritesOnly && !favourites.includes(name)) return false;
  if (!filters.perennials && facts?.perennial) return false;
  if (!filters.tropical && facts?.tags.includes("tropical")) return false;
  if (filters.family !== "all" && facts?.family !== Number(filters.family)) return false;
  for (const [enabled, tag] of [[filters.easy, "easytogrow"], [filters.frost, "frosttolerant"], [filters.shade, "shadetolerant"], [filters.autumn, "autumnplanting"]] as const) {
    if (enabled && !facts?.tags.includes(tag)) return false;
  }
  if (filters.companions && (!facts || !plantFacts(selected)?.companions.includes(facts.code))) return false;
  return true;
}
