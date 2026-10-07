import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { plants } from "./plant-catalog";
import { plantArtworkCatalogue, plantIconSprite } from "./plant-icons";
import { PLANT_ICON_V2 } from "./plant-icon-v2";
import { STRUCTURE_PRESETS } from "./structure-catalog";
import { LOWPOLY_PLANT_KINDS } from "@/components/garden-lowpoly-plants";
import type { AuditCatalogue, AuditEntry } from "./audit-catalog";

const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const title = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

export function buildAuditCatalogue(): AuditCatalogue {
  const entries: AuditEntry[] = [];
  const pairs = new Map<string, AuditEntry>();
  const addPlant = (crop: string, variety: string, source: string) => {
    const key = normal(crop) + "|" + normal(variety);
    const existing = pairs.get(key);
    if (existing) { existing.source.push(source); return; }
    const option = plants.find((p) => normal(p.name) === normal(crop));
    const artwork = plantIconSprite(crop, variety);
    pairs.set(key, { id: "", kind: "plant", name: option?.name ?? title(crop), variety: variety ? title(variety) : "Default", category: option?.type ?? "Other plants", spacingCm: option?.spacingCm, source: [source], artwork: artwork ?? undefined, assetExists: artwork ? existsSync(join(process.cwd(), "public", artwork.src)) : undefined });
  };
  for (const plant of plants) for (const variety of plant.varieties) addPlant(plant.name, variety, "Planner crop catalogue");
  for (const entry of plantArtworkCatalogue()) addPlant(entry.crop, entry.variety, "Artwork registry");
  for (const icon of PLANT_ICON_V2) for (const keyword of icon.keywords) addPlant(keyword, "", "V2 icon registry");
  for (const kind of LOWPOLY_PLANT_KINDS) addPlant(kind.replaceAll("-", " "), "", "Production geometry registry");
  // Read the current resolver definitions at build time, including legacy-only
  // names such as potato. Runtime never reads a garden or a database.
  for (const [file, source] of [
    ["components/garden-lowpoly-plants.ts", readFileSync(join(process.cwd(), "components", "garden-lowpoly-plants.ts"), "utf8")],
    ["components/garden-webgl-visual.tsx", readFileSync(join(process.cwd(), "components", "garden-webgl-visual.tsx"), "utf8")],
    ["components/garden-workspace-realistic.tsx", readFileSync(join(process.cwd(), "components", "garden-workspace-realistic.tsx"), "utf8")],
  ]) {
    const normalizedSource = source.replaceAll("\r\n", "\n");
    const resolver = normalizedSource.slice(normalizedSource.indexOf(file.includes("lowpoly") ? "export function resolveLowpolyPlantKind" : "function cropKind"));
    const body = resolver.slice(0, resolver.indexOf("\n}\n") + 3);
    for (const match of body.matchAll(/name\.includes\("([^"]+)"\)/g)) {
      const crop = plants.find((p) => normal(p.name).startsWith(match[1]))?.name ?? match[1];
      addPlant(crop, "", "Renderer resolver: " + file);
    }
  }
  const ordered = [...pairs.values()].sort((a, b) => a.name.localeCompare(b.name, "en") || a.variety.localeCompare(b.variety, "en"));
  ordered.forEach((entry, index) => entries.push({ ...entry, id: `P${String(index + 1).padStart(3, "0")}` }));
  let structureIndex = 0;
  for (const preset of STRUCTURE_PRESETS) for (const [variant, factor] of [["Default", 1], ["Small", .5], ["Large", 1.5]] as const) {
    const widthCm = Math.max(30, preset.widthCm * factor), depthCm = Math.max(30, preset.depthCm * factor), heightCm = Math.max(8, preset.heightCm * factor);
    const id = `S${String(++structureIndex).padStart(3, "0")}`;
    entries.push({ id, kind: "structure", name: preset.label, variety: variant, category: "Structures", source: ["Structure presets"], object: { id, type: "structure", kind: preset.kind, x: 450, y: 540, widthCm, depthCm, heightCm, rotationDeg: 0, label: preset.label }, dimensions: `${widthCm / 100} × ${depthCm / 100} × ${heightCm / 100} m` });
  }
  const addObject = (entry: Omit<AuditEntry, "id" | "source">) => entries.push({ ...entry, id: `O${String(entries.filter((e) => e.id.startsWith("O")).length + 1).padStart(3, "0")}`, source: ["Production garden renderer / PlannerPlan"] });
  for (const [name, width, depth] of [["Square bed", 120, 120], ["Long narrow bed", 120, 400], ["Wide bed", 300, 200], ["Empty bed", 200, 240], ["Planted bed", 200, 240]] as const) addObject({ name, kind: "bed", category: "Raised beds", variety: "Default", dimensions: `${width / 100} × ${depth / 100} × 0.34 m`, bed: { id: 1, name, x: (450 - width / 2) / 9, y: (540 - depth / 2) / 10.8, w: width / 9, h: depth / 10.8 } });
  for (const [name, length, height, spacing] of [["Short trellis", 100, 180, 100], ["Long trellis", 400, 180, 150], ["Low trellis", 250, 80, 75], ["Tall trellis", 250, 250, 200], ["Climber and trellis", 250, 180, 150]] as const) addObject({ name, kind: "trellis", category: "Trellises", variety: "Default", dimensions: `${length / 100} m long × ${height / 100} m high · posts ${spacing} cm`, object: { id: name, type: "trellis", x1: 450 - length / 2, y1: 540, x2: 450 + length / 2, y2: 540, heightCm: height, postSpacingCm: spacing, label: name } });
  for (const [name, diameter] of [["Garden tree", 150], ["Small canopy", 100], ["Large canopy", 300]] as const) addObject({ name, kind: "tree", category: "Trees", variety: "Shared tree model", dimensions: `Canopy diameter ${diameter / 100} m`, object: { id: name, type: "tree", x: 450, y: 540, diameterCm: diameter, label: name } });
  for (const width of [20, 60, 120]) addObject({ name: "Garden path", kind: "path", category: "Paths", variety: `${width} cm wide`, dimensions: `3 × ${width / 100} m`, object: { id: `path-${width}`, type: "path", x1: 300, y1: 540, x2: 600, y2: 540, widthCm: width } });
  for (const [kind, name, category] of [["row", "Planting row", "Planting rows"], ["text", "Planner text", "Other objects"], ["boundary", "Garden boundary fence", "Other objects"], ["decor", "Garden ground decoration", "Other objects"], ["demo", "2 × 4 m demonstration bed", "Raised beds"]] as const) addObject({ kind, name, category, variety: "Production default" });
  const assets: string[] = [];
  const collect = (directory: string) => {
    for (const file of readdirSync(join(process.cwd(), "public", directory), { withFileTypes: true })) {
      const relative = directory + "/" + file.name;
      if (file.isDirectory()) collect(relative);
      else if (/\.(png|svg|webp|jpe?g)$/i.test(file.name)) assets.push("/" + relative);
    }
  };
  collect("plant-icons");
  const used = new Set(entries.flatMap((entry) => entry.artwork ? [entry.artwork.src] : []));
  // Include V2 artwork explicitly, even when a newer PNG mapping takes priority.
  for (const icon of PLANT_ICON_V2) {
    used.add(icon.src);
    addObject({ kind: "asset", name: icon.label, category: "Artwork reference", variety: "V2 SVG", artwork: { src: icon.src, index: 0, column: 0, row: 0, columns: 1, rows: 1 }, assetExists: existsSync(join(process.cwd(), "public", icon.src)) });
  }
  for (const asset of assets.filter((asset) => !used.has(asset)).sort()) addObject({ kind: "asset", name: asset.split("/").at(-1)!, category: "Artwork reference", variety: "Unmapped file", artwork: { src: asset, index: 0, column: 0, row: 0, columns: 1, rows: 1 }, assetExists: true });
  return { entries, assets: assets.sort(), plannerCrops: plants.length, registryCrops: new Set(ordered.map((entry) => entry.name)).size, sourceNotes: ["No authoritative mature-size registry exists: plant specimens retain production scale and show SIZE FALLBACK.", "Production has desktop and mobile detail only. Medium aliases High; Low forces mobile geometry.", "Trees have a single production visual type; fruit-tree labels do not define distinct models.", "Planner text has no renderer in the current unified 3D view and is represented by a MISSING 3D placeholder.", "Artwork aliases and legacy renderer names are included even when absent from the planner palette."] };
}
