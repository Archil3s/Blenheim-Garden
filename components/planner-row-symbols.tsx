import type { PlannerRow } from "@/lib/garden/planner-plan";
import { rowSymbolPositions } from "@/lib/garden/row-layout";
import { PlantArt } from "./plant-art";

export function PlannerRowSymbols({ row, selectedPlantId }: { row: PlannerRow; selectedPlantId?: string }) {
  const single = Math.hypot(row.x2 - row.x1, row.y2 - row.y1) < 1 && !row.block;
  return <span className="row-dots">{rowSymbolPositions(row).map((point, index) =>
    <i key={point.id} data-plant-id={point.id} data-selected-plant={point.id === selectedPlantId} data-plant-index={index + 1}
      aria-label={`${row.crop} ${index + 1}`}
      style={{ position: "absolute", left: single ? `calc(50% + ${point.x}px)` : point.x,
        top: 12 + point.y, transform: "translate(-50%, -50%)" }}>
      <PlantArt crop={row.crop} variety={row.variety} fallback={row.cropIcon} />
    </i>)}</span>;
}
