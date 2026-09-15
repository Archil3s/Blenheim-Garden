export type PlantIconSprite = {
  src: string;
  index: number;
  column: number;
  row: number;
  columns: number;
  rows: number;
};

const BATCH_A_SRC = "/plant-icons/batch-a.svg";
const BATCH_A_COLUMNS = 5;
const BATCH_A_ROWS = 4;

const detailedFiles = [
  "achillea",
  "agastache",
  "ageratum",
  "agrostemma",
  "akeake",
  "alyssum",
  "amaranth-garnet-red",
  "amaranth-green-red",
  "angelica-chinese",
  "angelica-holy-ghost",
  "anise",
  "anise-hyssop",
  "artichoke-green-globe",
  "asparagus-mary-washington",
  "asparagus-pacific-challenger-f1",
  "asparagus-pacific-purple",
];

const standaloneFiles = new Set([
  "bean_broad_fava",
  "bean_bush_green",
  "bean_climbing_green",
  "bean_runner_scarlet",
  "tomato_beefsteak_red",
  "tomato_black_purple",
  "tomato_cherry_red",
  "tomato_cherry_yellow",
  "tomato_dwarf_bush",
  "tomato_grape_red",
  "tomato_green_ripe",
  "tomato_pear_yellow",
  "tomato_pink",
  "tomato_roma_red",
  "tomato_standard_orange",
  "tomato_standard_red",
  "tomato_standard_yellow",
  "tomato_striped_bicolour",
  "tomato_trailing_hanging",
  "tomato_white_cream",
]);

function normalise(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function standalone(src: string): PlantIconSprite {
  return { src: `/plant-icons/individual/${src}.png`, index: 0, column: 0, row: 0, columns: 1, rows: 1 };
}

const exact: Record<string, number> = {
  "amaranth|garnet red": 6,
  "amaranth|green red": 7,
  "angelica|chinese": 8,
  "angelica|holy ghost": 9,
  "artichoke|green globe": 12,
  "asparagus|mary washington": 13,
  "asparagus|pacific challenger f1": 14,
  "asparagus|pacific purple": 15,
  "basil|compact": 19,
};

const cropOnly: Record<string, number> = {
  achillea: 0,
  agastache: 1,
  ageratum: 2,
  agrostemma: 3,
  akeake: 4,
  alyssum: 5,
  anise: 10,
  "anise hyssop": 11,
  "asparagus pea": 16,
  aster: 17,
  astragalus: 18,
};

const standaloneExact: Record<string, string> = {
  "bean|broad": "bean_broad_fava",
  "bean|broad bean": "bean_broad_fava",
  "bean|fava": "bean_broad_fava",
  "bean|fava bean": "bean_broad_fava",
  "bean|bush": "bean_bush_green",
  "bean|dwarf": "bean_bush_green",
  "bean|green": "bean_bush_green",
  "bean|climbing": "bean_climbing_green",
  "bean|pole": "bean_climbing_green",
  "bean|runner": "bean_runner_scarlet",
  "bean|scarlet runner": "bean_runner_scarlet",
  "tomato|beefsteak": "tomato_beefsteak_red",
  "tomato|black": "tomato_black_purple",
  "tomato|purple": "tomato_black_purple",
  "tomato|black purple": "tomato_black_purple",
  "tomato|cherry": "tomato_cherry_red",
  "tomato|red cherry": "tomato_cherry_red",
  "tomato|yellow cherry": "tomato_cherry_yellow",
  "tomato|dwarf": "tomato_dwarf_bush",
  "tomato|bush": "tomato_dwarf_bush",
  "tomato|grape": "tomato_grape_red",
  "tomato|green": "tomato_green_ripe",
  "tomato|green ripe": "tomato_green_ripe",
  "tomato|yellow pear": "tomato_pear_yellow",
  "tomato|pear": "tomato_pear_yellow",
  "tomato|pink": "tomato_pink",
  "tomato|roma": "tomato_roma_red",
  "tomato|plum": "tomato_roma_red",
  "tomato|orange": "tomato_standard_orange",
  "tomato|yellow": "tomato_standard_yellow",
  "tomato|striped": "tomato_striped_bicolour",
  "tomato|bicolour": "tomato_striped_bicolour",
  "tomato|trailing": "tomato_trailing_hanging",
  "tomato|hanging": "tomato_trailing_hanging",
  "tomato|white": "tomato_white_cream",
  "tomato|cream": "tomato_white_cream",
};

const standaloneCropOnly: Record<string, string> = {
  "broad bean": "bean_broad_fava",
  "fava bean": "bean_broad_fava",
  "bush bean": "bean_bush_green",
  "dwarf bean": "bean_bush_green",
  "green bean": "bean_bush_green",
  "climbing bean": "bean_climbing_green",
  "pole bean": "bean_climbing_green",
  "runner bean": "bean_runner_scarlet",
  tomato: "tomato_standard_red",
  "beefsteak tomato": "tomato_beefsteak_red",
  "black tomato": "tomato_black_purple",
  "purple tomato": "tomato_black_purple",
  "cherry tomato": "tomato_cherry_red",
  "yellow cherry tomato": "tomato_cherry_yellow",
  "dwarf tomato": "tomato_dwarf_bush",
  "bush tomato": "tomato_dwarf_bush",
  "grape tomato": "tomato_grape_red",
  "green tomato": "tomato_green_ripe",
  "pear tomato": "tomato_pear_yellow",
  "yellow pear tomato": "tomato_pear_yellow",
  "pink tomato": "tomato_pink",
  "roma tomato": "tomato_roma_red",
  "plum tomato": "tomato_roma_red",
  "orange tomato": "tomato_standard_orange",
  "yellow tomato": "tomato_standard_yellow",
  "striped tomato": "tomato_striped_bicolour",
  "bicolour tomato": "tomato_striped_bicolour",
  "trailing tomato": "tomato_trailing_hanging",
  "hanging tomato": "tomato_trailing_hanging",
  "white tomato": "tomato_white_cream",
  "cream tomato": "tomato_white_cream",
};

function inferStandalone(cropKey: string, varietyKey: string) {
  const exactFile = standaloneExact[`${cropKey}|${varietyKey}`];
  if (exactFile) return exactFile;

  const cropFile = standaloneCropOnly[cropKey];
  if (cropFile) return cropFile;

  const combined = `${cropKey} ${varietyKey}`.trim();

  if (cropKey.includes("tomato") || cropKey === "tomato") {
    if (/cherry/.test(combined) && /yellow|gold|orange/.test(combined)) return "tomato_cherry_yellow";
    if (/cherry/.test(combined)) return "tomato_cherry_red";
    if (/beefsteak/.test(combined)) return "tomato_beefsteak_red";
    if (/black|purple/.test(combined)) return "tomato_black_purple";
    if (/dwarf|bush/.test(combined)) return "tomato_dwarf_bush";
    if (/grape/.test(combined)) return "tomato_grape_red";
    if (/green/.test(combined)) return "tomato_green_ripe";
    if (/pear/.test(combined)) return "tomato_pear_yellow";
    if (/pink/.test(combined)) return "tomato_pink";
    if (/roma|plum|paste/.test(combined)) return "tomato_roma_red";
    if (/striped|stripe|bicolour|bi colour/.test(combined)) return "tomato_striped_bicolour";
    if (/trailing|hanging|basket/.test(combined)) return "tomato_trailing_hanging";
    if (/white|cream/.test(combined)) return "tomato_white_cream";
    if (/yellow|gold/.test(combined)) return "tomato_standard_yellow";
    if (/orange/.test(combined)) return "tomato_standard_orange";
    return "tomato_standard_red";
  }

  if (/bean/.test(cropKey)) {
    if (/broad|fava/.test(combined)) return "bean_broad_fava";
    if (/runner|scarlet/.test(combined)) return "bean_runner_scarlet";
    if (/climb|pole/.test(combined)) return "bean_climbing_green";
    if (/bush|dwarf/.test(combined)) return "bean_bush_green";
  }

  return null;
}

export function plantIconSprite(crop: string, variety?: string | null): PlantIconSprite | null {
  const cropKey = normalise(crop);
  const varietyKey = normalise(variety);

  const standaloneFile = inferStandalone(cropKey, varietyKey);
  if (standaloneFile && standaloneFiles.has(standaloneFile)) return standalone(standaloneFile);

  const index = exact[`${cropKey}|${varietyKey}`] ?? cropOnly[cropKey];
  if (index === undefined) return null;
  if (detailedFiles[index]) {
    return { src: `/plant-icons/individual/${detailedFiles[index]}.png`, index, column: 0, row: 0, columns: 1, rows: 1 };
  }
  return {
    src: BATCH_A_SRC,
    index,
    column: index % BATCH_A_COLUMNS,
    row: Math.floor(index / BATCH_A_COLUMNS),
    columns: BATCH_A_COLUMNS,
    rows: BATCH_A_ROWS,
  };
}

export function plantIconBackground(sprite: PlantIconSprite) {
  const x = sprite.columns <= 1 ? 0 : (sprite.column / (sprite.columns - 1)) * 100;
  const y = sprite.rows <= 1 ? 0 : (sprite.row / (sprite.rows - 1)) * 100;
  return {
    backgroundImage: `url(${sprite.src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${sprite.columns * 100}% ${sprite.rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  } as const;
}
