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
];

export function isPlannerStructureKind(value: unknown): value is PlannerStructureKind {
  return typeof value === "string" && STRUCTURE_PRESETS.some((preset) => preset.kind === value);
}

export function structurePreset(kind: PlannerStructureKind) {
  return STRUCTURE_PRESETS.find((preset) => preset.kind === kind) ?? STRUCTURE_PRESETS[0];
}
