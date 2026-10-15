export const pixelCropNames = [
  "tomato", "bean", "lettuce", "pumpkin", "carrot", "broccoli",
  "raspberry", "strawberry", "blueberry", "basil", "amaranth", "artichoke",
  "asparagus", "asparagus pea", "zucchini", "cucumber", "melon", "spinach",
  "chard", "cauliflower", "cabbage", "kale", "broad bean", "pea",
  "beet", "radish", "onion", "garlic", "leek", "corn",
  "pepper", "potato", "brussels sprout", "parsley", "lavender", "akeake",
];
export const pixelHerbNames = ["achillea", "agastache", "ageratum", "agrostemma", "alyssum", "angelica", "anise", "anise hyssop", "aster", "astragalus", "chives", "thyme"];

const sprites = new Map<string, HTMLCanvasElement>();
let pending: Promise<void> | null = null;
let loaded = false;

async function loadSheet(url: string, names: string[], columns: number, rows: number) {
  if (names.every((name) => sprites.has(name))) return;
  const image = new Image();
  image.src = url;
  await image.decode();
  const width = image.naturalWidth / columns, height = image.naturalHeight / rows;
  if (!Number.isInteger(width) || !Number.isInteger(height)) throw new Error("Invalid garden artwork grid");
  const decoded = new Map<string, HTMLCanvasElement>();
  names.forEach((name, index) => {
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Garden artwork canvas unavailable");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, index % columns * width, Math.floor(index / columns) * height, width, height, 0, 0, width, height);
    decoded.set(name, canvas);
  });
  decoded.forEach((canvas, name) => sprites.set(name, canvas));
}

export function loadPixelArtwork() {
  if (!pending) pending = Promise.all([
    loadSheet("/artwork/pixel-garden/crops-v2.webp", pixelCropNames, 6, 6),
    loadSheet("/artwork/pixel-garden/scenery-v1.webp", ["tree-broadleaf", "tree-conifer", "tree-apple", "shed", "greenhouse", "flower-shrub"], 3, 2),
    loadSheet("/artwork/pixel-garden/herbs-v2.webp", pixelHerbNames, 4, 3),
  ]).then(() => { loaded = true; }).catch((error: unknown) => { pending = null; throw error; });
  return pending;
}

export function pixelArtworkReady() { return loaded; }
export function pixelScenery(name: string) { return sprites.get(name); }

export function detailedPixelCrop(crop: string, variety: string) {
  let name = crop.toLowerCase().trim();
  if (name === "herbs") name = /parsley/i.test(variety) ? "parsley" : /chives/i.test(variety) ? "chives" : /thyme/i.test(variety) ? "thyme" : "basil";
  const aliases: Record<string, string> = { courgette: "zucchini", squash: "pumpkin", beetroot: "beet", capsicum: "pepper", "sweet corn": "corn", "sweetcorn": "corn", "silverbeet": "chard", "swiss chard": "chard", "brussels sprouts": "brussels sprout", "fava bean": "broad bean" };
  return sprites.get(aliases[name] ?? name);
}
