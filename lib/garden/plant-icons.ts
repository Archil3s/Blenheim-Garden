import manifest from "@/public/plant-icons/manifest.json";

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

function normalise(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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

export function plantIconSprite(crop: string, variety?: string | null): PlantIconSprite | null {
  const cropKey = normalise(crop);
  const varietyKey = normalise(variety);
  const individual = manifest.find((icon) => icon.status === "complete"
    && normalise(icon.crop) === cropKey
    && (normalise(icon.variety) === varietyKey
      || (normalise(icon.variety) === cropKey && !varietyKey)));
  if (individual) return {
    src: `/plant-icons/individual/${individual.filename}`,
    index: 0, column: 0, row: 0, columns: 1, rows: 1,
  };
  const index = exact[`${cropKey}|${varietyKey}`] ?? cropOnly[cropKey];
  if (index === undefined) return null;
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
