import type { PlannerStructureKind } from "@/lib/garden/planner-plan";
import referenceObjects from "./reference-object-data.json";

export type StructurePreset = {
  kind: PlannerStructureKind;
  label: string;
  icon: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
};

export const CORE_STRUCTURE_PRESETS: readonly StructurePreset[] = [
  { kind: "greenhouse", label: "Greenhouse", icon: "▱", widthCm: 240, depthCm: 360, heightCm: 220 },
  { kind: "polytunnel", label: "Polytunnel", icon: "⌒", widthCm: 300, depthCm: 500, heightCm: 220 },
  { kind: "shed", label: "Garden shed", icon: "⌂", widthCm: 240, depthCm: 240, heightCm: 230 },
  { kind: "cold-frame", label: "Cold frame", icon: "▤", widthCm: 120, depthCm: 90, heightCm: 50 },
  { kind: "compost-bin", label: "Compost bin", icon: "♻", widthCm: 100, depthCm: 100, heightCm: 110 },
  { kind: "water-tank", label: "Water tank", icon: "◉", widthCm: 120, depthCm: 120, heightCm: 180 },
  { kind: "rain-barrel", label: "Rain barrel", icon: "◍", widthCm: 70, depthCm: 70, heightCm: 100 },
  { kind: "potting-bench", label: "Potting bench", icon: "▥", widthCm: 160, depthCm: 70, heightCm: 95 },
  { kind: "pergola", label: "Pergola", icon: "⌗", widthCm: 240, depthCm: 240, heightCm: 230 },
  { kind: "garden-arch", label: "Garden arch", icon: "∩", widthCm: 120, depthCm: 50, heightCm: 220 },
  { kind: "chicken-coop", label: "Chicken coop", icon: "◇", widthCm: 200, depthCm: 140, heightCm: 170 },
  { kind: "beehive", label: "Beehive", icon: "⬡", widthCm: 60, depthCm: 50, heightCm: 100 },
  { kind: "cattle-panel-arch", label: "Bent cattle panel arch", icon: "⌒", widthCm: 120, depthCm: 250, heightCm: 200 },
  { kind: "bean-arch", label: "Bean arch", icon: "∩", widthCm: 120, depthCm: 180, heightCm: 200 },
  { kind: "cucumber-arch", label: "Cucumber arch", icon: "∩", widthCm: 100, depthCm: 160, heightCm: 180 },
  { kind: "hoop-arch", label: "Walk-through hoop arch", icon: "⌒", widthCm: 150, depthCm: 250, heightCm: 210 },
  { kind: "a-frame-trellis", label: "A-frame trellis", icon: "△", widthCm: 120, depthCm: 200, heightCm: 180 },
  { kind: "low-hoop-frame", label: "Low hoop frame", icon: "⌒", widthCm: 100, depthCm: 240, heightCm: 70 },
  { kind: "insect-net-tunnel", label: "Insect net tunnel", icon: "▦", widthCm: 120, depthCm: 300, heightCm: 120 },
  { kind: "bird-net-frame", label: "Bird net frame", icon: "▦", widthCm: 200, depthCm: 300, heightCm: 180 },
  { kind: "frost-cloth-tunnel", label: "Frost cloth tunnel", icon: "⌒", widthCm: 100, depthCm: 250, heightCm: 80 },
  { kind: "shade-cloth-frame", label: "Shade cloth frame", icon: "▧", widthCm: 250, depthCm: 300, heightCm: 200 },
  { kind: "cloche", label: "Cloche", icon: "⌒", widthCm: 60, depthCm: 100, heightCm: 45 },
  { kind: "row-cover-hoops", label: "Row cover hoops", icon: "⌒", widthCm: 100, depthCm: 300, heightCm: 75 },
  { kind: "pot", label: "Garden pot", icon: "●", widthCm: 45, depthCm: 45, heightCm: 40 },
  { kind: "grow-bag", label: "Grow bag", icon: "▢", widthCm: 40, depthCm: 40, heightCm: 35 },
  { kind: "planter-box", label: "Planter box", icon: "▭", widthCm: 120, depthCm: 50, heightCm: 45 },
  { kind: "trough-planter", label: "Trough planter", icon: "▭", widthCm: 150, depthCm: 45, heightCm: 50 },
  { kind: "half-barrel", label: "Half barrel planter", icon: "◉", widthCm: 65, depthCm: 65, heightCm: 50 },
  { kind: "wicking-bed", label: "Wicking bed", icon: "▣", widthCm: 180, depthCm: 90, heightCm: 65 },
  { kind: "seed-tray", label: "Seed tray", icon: "▦", widthCm: 55, depthCm: 35, heightCm: 8 },
  { kind: "raised-bed-timber", label: "Timber raised bed", icon: "▣", widthCm: 200, depthCm: 100, heightCm: 45 },
  { kind: "raised-bed-corrugated", label: "Corrugated raised bed", icon: "▣", widthCm: 200, depthCm: 100, heightCm: 60 },
  { kind: "raised-bed-round", label: "Round raised bed", icon: "◉", widthCm: 120, depthCm: 120, heightCm: 50 },
  { kind: "raised-bed-square", label: "Square raised bed", icon: "□", widthCm: 120, depthCm: 120, heightCm: 50 },
  { kind: "keyhole-bed", label: "Keyhole raised bed", icon: "◌", widthCm: 220, depthCm: 220, heightCm: 60 },
];

export const STRUCTURE_PRESETS = CORE_STRUCTURE_PRESETS;

export const FULL_STRUCTURE_PRESETS: readonly StructurePreset[] = [...CORE_STRUCTURE_PRESETS,
  { kind: "arbour", label: "Arbour", icon: "▱", widthCm: 180, depthCm: 100, heightCm: 210 },
  { kind: "basket", label: "Basket", icon: "▱", widthCm: 40, depthCm: 40, heightCm: 35 },
  { kind: "hanging-basket", label: "Hanging basket", icon: "▱", widthCm: 35, depthCm: 35, heightCm: 30 },
  { kind: "bean-support", label: "Bean support", icon: "▱", widthCm: 120, depthCm: 200, heightCm: 180 },
  { kind: "chicken-feeder", label: "Chicken feeder", icon: "▱", widthCm: 40, depthCm: 40, heightCm: 45 },
  { kind: "chicken-run", label: "Chicken run", icon: "▱", widthCm: 200, depthCm: 300, heightCm: 180 },
  { kind: "chicken-waterer", label: "Chicken waterer", icon: "▱", widthCm: 35, depthCm: 35, heightCm: 40 },
  { kind: "compass", label: "Compass", icon: "▱", widthCm: 50, depthCm: 50, heightCm: 20 },
  { kind: "container-reservoir", label: "Container reservoir", icon: "▱", widthCm: 30, depthCm: 30, heightCm: 30 },
  { kind: "hex-planter", label: "Hexagonal container", icon: "▱", widthCm: 80, depthCm: 80, heightCm: 50 },
  { kind: "irrigated-container", label: "Irrigated container", icon: "▱", widthCm: 90, depthCm: 45, heightCm: 40 },
  { kind: "brick-edging", label: "Brick edging", icon: "▱", widthCm: 200, depthCm: 30, heightCm: 30 },
  { kind: "picket-fence", label: "Picket fence", icon: "▱", widthCm: 200, depthCm: 30, heightCm: 120 },
  { kind: "forcing-pot", label: "Forcing pot", icon: "▱", widthCm: 45, depthCm: 45, heightCm: 60 },
  { kind: "fruit-cage", label: "Fruit cage", icon: "▱", widthCm: 240, depthCm: 300, heightCm: 200 },
  { kind: "heated-greenhouse", label: "Heated greenhouse", icon: "▱", widthCm: 240, depthCm: 360, heightCm: 220 },
  { kind: "irrigation-parts", label: "Irrigation fitting", icon: "▱", widthCm: 30, depthCm: 30, heightCm: 20 },
  { kind: "irrigation-tubing", label: "Irrigation tubing", icon: "▱", widthCm: 200, depthCm: 30, heightCm: 20 },
  { kind: "leaf-mould-bin", label: "Leaf mould bin", icon: "▱", widthCm: 100, depthCm: 100, heightCm: 100 },
  { kind: "obelisk", label: "Obelisk", icon: "▱", widthCm: 60, depthCm: 60, heightCm: 180 },
  { kind: "plant-halo", label: "Plant halo", icon: "▱", widthCm: 40, depthCm: 40, heightCm: 30 },
  { kind: "plant-house", label: "Plant house", icon: "▱", widthCm: 120, depthCm: 80, heightCm: 180 },
  { kind: "planter-pocket", label: "Wall planter pocket", icon: "▱", widthCm: 60, depthCm: 30, heightCm: 50 },
  { kind: "heated-polytunnel", label: "Heated polytunnel", icon: "▱", widthCm: 300, depthCm: 500, heightCm: 220 },
  { kind: "pond", label: "Pond", icon: "▱", widthCm: 180, depthCm: 120, heightCm: 50 },
  { kind: "potato-planter", label: "Potato planter", icon: "▱", widthCm: 55, depthCm: 55, heightCm: 65 },
  { kind: "mini-bed-cover", label: "Mini raised-bed cover", icon: "▱", widthCm: 120, depthCm: 100, heightCm: 70 },
  { kind: "metal-shed", label: "Metal shed", icon: "▱", widthCm: 240, depthCm: 240, heightCm: 230 },
  { kind: "pent-shed", label: "Pent-roof shed", icon: "▱", widthCm: 240, depthCm: 180, heightCm: 220 },
  { kind: "stepped-planter", label: "Stepped planter", icon: "▱", widthCm: 120, depthCm: 90, heightCm: 90 },
  { kind: "stepped-shelving", label: "Stepped shelving", icon: "▱", widthCm: 120, depthCm: 60, heightCm: 120 },
  { kind: "teepee", label: "Teepee", icon: "▱", widthCm: 100, depthCm: 100, heightCm: 180 },
  { kind: "tower-planter", label: "Tower planter", icon: "▱", widthCm: 60, depthCm: 60, heightCm: 140 },
  { kind: "wall-tower-planter", label: "Wall tower planter", icon: "▱", widthCm: 80, depthCm: 30, heightCm: 140 },
  { kind: "trug", label: "Trug", icon: "▱", widthCm: 180, depthCm: 90, heightCm: 80 },
];

export const REFERENCE_STRUCTURE_PRESETS: readonly StructurePreset[] = referenceObjects.objects.map((object) => ({
  kind: `reference-${object.code}` as PlannerStructureKind,
  label: `${object.name} · ${object.code}`, icon: "",
  widthCm: Math.max(1, object.shape.initialWidth),
  depthCm: Math.max(1, object.shape.initialHeight), heightCm: 100,
}));
export const ALL_STRUCTURE_PRESETS = [...FULL_STRUCTURE_PRESETS, ...REFERENCE_STRUCTURE_PRESETS];

const renderKinds: Partial<Record<PlannerStructureKind, PlannerStructureKind>> = {
  "arbour": "pergola",
  "basket": "pot",
  "hanging-basket": "pot",
  "bean-support": "a-frame-trellis",
  "chicken-feeder": "pot",
  "chicken-run": "bird-net-frame",
  "chicken-waterer": "rain-barrel",
  "compass": "pot",
  "container-reservoir": "pot",
  "hex-planter": "half-barrel",
  "irrigated-container": "wicking-bed",
  "brick-edging": "raised-bed-timber",
  "picket-fence": "bird-net-frame",
  "forcing-pot": "pot",
  "fruit-cage": "bird-net-frame",
  "heated-greenhouse": "greenhouse",
  "irrigation-parts": "pot",
  "irrigation-tubing": "planter-box",
  "leaf-mould-bin": "compost-bin",
  "obelisk": "a-frame-trellis",
  "plant-halo": "half-barrel",
  "plant-house": "greenhouse",
  "planter-pocket": "planter-box",
  "heated-polytunnel": "polytunnel",
  "pond": "water-tank",
  "potato-planter": "grow-bag",
  "mini-bed-cover": "cold-frame",
  "metal-shed": "shed",
  "pent-shed": "shed",
  "stepped-planter": "planter-box",
  "stepped-shelving": "potting-bench",
  "teepee": "a-frame-trellis",
  "tower-planter": "pot",
  "wall-tower-planter": "planter-box",
  "trug": "raised-bed-timber"
};

export function structureRenderKind(kind: PlannerStructureKind): PlannerStructureKind {
  if (kind.startsWith("reference-")) {
    const object = referenceObjects.objects.find((item) => `reference-${item.code}` === kind);
    const name = object?.name.toLowerCase() ?? "";
    if (/greenhouse|plant house/.test(name)) return "greenhouse";
    if (/tunnel|cover|cloche/.test(name)) return "polytunnel";
    if (/shed|coop/.test(name)) return "shed";
    if (/fence|arch|arbour|pergola|teepee|obelisk/.test(name)) return "pergola";
    if (/bed|shelv|bench/.test(name)) return "raised-bed-timber";
    if (/water|pond/.test(name)) return "rain-barrel";
    return "pot";
  }
  return renderKinds[kind] ?? kind;
}

export function isPlannerStructureKind(value: unknown): value is PlannerStructureKind {
  return typeof value === "string" && ALL_STRUCTURE_PRESETS.some((preset) => preset.kind === value);
}

export function structurePreset(kind: PlannerStructureKind) {
  return ALL_STRUCTURE_PRESETS.find((preset) => preset.kind === kind) ?? STRUCTURE_PRESETS[0];
}
