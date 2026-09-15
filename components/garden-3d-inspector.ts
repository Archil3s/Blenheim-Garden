import type { PlannerBed, PlannerPlantingArea } from "@/lib/garden/planner-plan";

export type Garden3DInspectorLine = { label: string; value: string };

export function cropInspectorLines(area: PlannerPlantingArea, bed: PlannerBed): Garden3DInspectorLine[] {
  const lines: Garden3DInspectorLine[] = [
    { label: "Bed", value: bed.name },
    { label: "Crop", value: area.crop },
  ];
  if (area.variety) lines.push({ label: "Variety", value: area.variety });
  lines.push(
    { label: "Planned count", value: String(area.count) },
    { label: "Spacing", value: `${area.spacingCm} cm` },
    { label: "Pattern", value: area.pattern },
  );
  return lines;
}
