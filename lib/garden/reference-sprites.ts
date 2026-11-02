import mappings from "./reference-plant-sprites.json";

export const referenceSpriteSource = "/planner-reference/catalogue-sprites.png";
export const referenceSpriteSize = { width: 988, height: 952, cell: 36 };
export const referencePlantSprites: Record<string, { code: string; x: number; y: number }> = mappings;

const aliases: Record<string, string> = {
  tomato: "tomato (regular)", bean: "beans (climbing)", lettuce: "lettuce (loose leaf)",
  broccoli: "broccoli (green)", herbs: "herb", onion: "onion (spring planted)",
  potato: "potatoes (maincrop)", cabbage: "cabbage (medium maturity)",
  artichoke: "artichoke (globe)", achillea: "yarrow", aster: "aster (china)",
  amaranth: "amaranth (grain)", peas: "peas (shelling)", chard: "silver beet",
};

export function referencePlantSprite(crop: string, variety?: string | null) {
  let key = crop.toLowerCase().trim();
  if (key === "tomato" && /cherry/i.test(variety ?? "")) key = "tomato (cherry)";
  if (key === "bean" && /dwarf|bush/i.test(variety ?? "")) key = "beans (dwarf)";
  if (key === "bean" && /broad|fava/i.test(variety ?? "")) key = "beans (broad)";
  return referencePlantSprites[key] ?? referencePlantSprites[aliases[key]];
}

export function referenceSpriteStyle(sprite: { x: number; y: number }) {
  const { width, height, cell } = referenceSpriteSize;
  return {
    backgroundImage: `url(${referenceSpriteSource})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${width / cell}em ${height / cell}em`,
    backgroundPosition: `${-sprite.x / cell}em ${-sprite.y / cell}em`,
  };
}
