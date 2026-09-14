import { plantIconAtlasData1 } from "./plant-icon-atlas-data-1";
import { plantIconAtlasData2 } from "./plant-icon-atlas-data-2";
import { plantIconAtlasData3 } from "./plant-icon-atlas-data-3";
import { plantIconAtlasData4 } from "./plant-icon-atlas-data-4";

export type PlantIconDefinition = {
  slug: string;
  src: string;
  label: string;
  aliases: string[];
  column: number;
  row: number;
};

export const PLANT_ICON_ATLAS_COLUMNS = 5;
export const PLANT_ICON_ATLAS_ROWS = 4;
export const PLANT_ICON_ATLAS_SRC = `data:image/webp;base64,${plantIconAtlasData1}${plantIconAtlasData2}${plantIconAtlasData3}${plantIconAtlasData4}`;

const defs: PlantIconDefinition[] = [
  { slug: "achillea", src: PLANT_ICON_ATLAS_SRC, label: "Achillea", aliases: ["achillea", "yarrow"], column: 0, row: 0 },
  { slug: "agastache", src: PLANT_ICON_ATLAS_SRC, label: "Agastache", aliases: ["agastache"], column: 1, row: 0 },
  { slug: "ageratum", src: PLANT_ICON_ATLAS_SRC, label: "Ageratum", aliases: ["ageratum"], column: 2, row: 0 },
  { slug: "agrostemma", src: PLANT_ICON_ATLAS_SRC, label: "Agrostemma", aliases: ["agrostemma", "corn cockle"], column: 3, row: 0 },
  { slug: "akeake", src: PLANT_ICON_ATLAS_SRC, label: "Akeake", aliases: ["akeake", "ake ake"], column: 4, row: 0 },
  { slug: "alyssum", src: PLANT_ICON_ATLAS_SRC, label: "Alyssum", aliases: ["alyssum", "sweet alyssum"], column: 0, row: 1 },
  { slug: "amaranth-garnet-red", src: PLANT_ICON_ATLAS_SRC, label: "Amaranth Garnet Red", aliases: ["amaranth garnet red", "garnet red"], column: 1, row: 1 },
  { slug: "amaranth-green-red", src: PLANT_ICON_ATLAS_SRC, label: "Amaranth Green Red", aliases: ["amaranth green red", "green red amaranth", "green red"], column: 2, row: 1 },
  { slug: "angelica-chinese", src: PLANT_ICON_ATLAS_SRC, label: "Angelica Chinese", aliases: ["angelica chinese", "chinese angelica", "dong quai"], column: 3, row: 1 },
  { slug: "angelica-holy-ghost", src: PLANT_ICON_ATLAS_SRC, label: "Angelica Holy Ghost", aliases: ["angelica holy ghost", "holy ghost angelica", "holy ghost"], column: 4, row: 1 },
  { slug: "anise", src: PLANT_ICON_ATLAS_SRC, label: "Anise", aliases: ["anise", "aniseed"], column: 0, row: 2 },
  { slug: "anise-hyssop", src: PLANT_ICON_ATLAS_SRC, label: "Anise Hyssop", aliases: ["anise hyssop", "agastache foeniculum"], column: 1, row: 2 },
  { slug: "artichoke-green-globe", src: PLANT_ICON_ATLAS_SRC, label: "Artichoke Green Globe", aliases: ["artichoke green globe", "green globe artichoke", "green globe"], column: 2, row: 2 },
  { slug: "asparagus-mary-washington", src: PLANT_ICON_ATLAS_SRC, label: "Asparagus Mary Washington", aliases: ["asparagus mary washington", "mary washington"], column: 3, row: 2 },
  { slug: "asparagus-pacific-challenger-f1", src: PLANT_ICON_ATLAS_SRC, label: "Asparagus Pacific Challenger F1", aliases: ["asparagus pacific challenger f1", "pacific challenger f1", "pacific challenger"], column: 4, row: 2 },
  { slug: "asparagus-pacific-purple", src: PLANT_ICON_ATLAS_SRC, label: "Asparagus Pacific Purple", aliases: ["asparagus pacific purple", "pacific purple"], column: 0, row: 3 },
  { slug: "asparagus-pea", src: PLANT_ICON_ATLAS_SRC, label: "Asparagus Pea", aliases: ["asparagus pea", "winged pea", "lotus tetragonolobus"], column: 1, row: 3 },
  { slug: "aster", src: PLANT_ICON_ATLAS_SRC, label: "Aster", aliases: ["aster"], column: 2, row: 3 },
  { slug: "astragalus", src: PLANT_ICON_ATLAS_SRC, label: "Astragalus", aliases: ["astragalus"], column: 3, row: 3 },
  { slug: "basil-compact", src: PLANT_ICON_ATLAS_SRC, label: "Basil Compact", aliases: ["basil compact", "compact basil"], column: 4, row: 3 },
];

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const indexed = defs
  .flatMap((definition) => definition.aliases.map((alias) => ({
    definition,
    alias: normalise(alias),
  })))
  .sort((a, b) => b.alias.length - a.alias.length);

function phraseMatch(candidate: string, alias: string) {
  return candidate === alias
    || candidate.includes(` ${alias} `)
    || candidate.startsWith(`${alias} `)
    || candidate.endsWith(` ${alias}`);
}

export const plantIconDefinitions = defs;

export function plantIconFor(crop?: string | null, variety?: string | null) {
  const cropText = normalise(crop ?? "");
  const varietyText = normalise(variety ?? "");
  const combined = normalise(`${cropText} ${varietyText}`);
  const candidates = [combined, varietyText, cropText].filter(Boolean);

  for (const entry of indexed) {
    if (candidates.some((candidate) => phraseMatch(candidate, entry.alias))) return entry.definition;
  }
  return null;
}

export function plantIconForText(text?: string | null) {
  const value = normalise(text ?? "");
  if (!value) return null;
  for (const entry of indexed) {
    if (phraseMatch(value, entry.alias)) return entry.definition;
  }
  return null;
}

export function plantIconBackground(icon: PlantIconDefinition) {
  const x = (icon.column / (PLANT_ICON_ATLAS_COLUMNS - 1)) * 100;
  const y = (icon.row / (PLANT_ICON_ATLAS_ROWS - 1)) * 100;
  return {
    backgroundImage: `url("${icon.src}")`,
    backgroundSize: `${PLANT_ICON_ATLAS_COLUMNS * 100}% ${PLANT_ICON_ATLAS_ROWS * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: "no-repeat",
  };
}

export function plantIconUv(icon: PlantIconDefinition) {
  return {
    repeatX: 1 / PLANT_ICON_ATLAS_COLUMNS,
    repeatY: 1 / PLANT_ICON_ATLAS_ROWS,
    offsetX: icon.column / PLANT_ICON_ATLAS_COLUMNS,
    offsetY: 1 - (icon.row + 1) / PLANT_ICON_ATLAS_ROWS,
  };
}
