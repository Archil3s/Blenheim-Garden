import type { PlannerRow } from "@/lib/garden/planner-plan";
import { rowSymbolPositions } from "@/lib/garden/row-layout";
import { PlannerPlantArt as PlantArt } from "./planner-art";

export function PlannerRowSymbols({ row, compact = false, selectedPlantId }: { row: PlannerRow; compact?: boolean; selectedPlantId?: string }) {
  const single = Math.hypot(row.x2 - row.x1, row.y2 - row.y1) < 1 && !row.block;
  const positions = rowSymbolPositions(row);
  const step = compact ? Math.max(1, Math.ceil(positions.length / 6)) : 1;
  return <span className="row-dots">{positions.map((point, index) => (index % step !== 0 && point.id !== selectedPlantId) ? null :
    <i key={point.id} data-plant-id={point.id} data-selected-plant={point.id === selectedPlantId} data-plant-index={index + 1}
      aria-label={`${row.crop} ${index + 1}`}
      style={{ position: "absolute", left: single ? `calc(50% + ${point.x}px)` : point.x,
        top: 12 + point.y, transform: "translate(-50%, -50%)" }}>
      {compact ? <span className="planner-compact-row-mark" /> : <PlantArt crop={row.crop} variety={row.variety} fallback={row.cropIcon} />}
    </i>)}</span>;
}
