import type { PlannerStructureKind } from "@/lib/garden/planner-plan";

export type StructurePreset = {
  kind: PlannerStructureKind;
  label: string;
  icon: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
};

export const STRUCTURE_PRESETS: readonly StructurePreset[] = [
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

export function isPlannerStructureKind(value: unknown): value is PlannerStructureKind {
  return typeof value === "string" && STRUCTURE_PRESETS.some((preset) => preset.kind === value);
}

export function structurePreset(kind: PlannerStructureKind) {
  return STRUCTURE_PRESETS.find((preset) => preset.kind === kind) ?? STRUCTURE_PRESETS[0];
}
