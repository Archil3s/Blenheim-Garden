import type { PointerEvent } from "react";
import type { PlannerRow } from "@/lib/garden/planner-plan";
import { referencePlantDimensions } from "@/lib/garden/reference-sprites";
import { squareFootCm } from "@/lib/garden/planting-block";
import { PlannerRowSymbols } from "./planner-row-symbols";
import { PlantArt } from "./plant-art";

export type RowDragMode = "row-drag" | "row-start" | "row-end" | "row-block";

export function PlannerPlantingRow({ row, selected = false, handles = false, preview = false, skipLocked = false, selectedPlantId, onDrag }: {
  row: PlannerRow; selected?: boolean; handles?: boolean; preview?: boolean; skipLocked?: boolean; selectedPlantId?: string;
  onDrag?: (event: PointerEvent<HTMLElement>, row: PlannerRow, mode?: RowDragMode) => void;
}) {
  const length = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  const angle = Math.atan2(row.y2 - row.y1, row.x2 - row.x1) * 180 / Math.PI;
  const dimensions = referencePlantDimensions(row.crop, row.variety);
  const width = dimensions?.width ?? 24, height = dimensions?.height ?? 24;
  const density = row.block?.mode === "square-foot" ? row.block.plantsPerSquareFoot ?? 1 : 0;
  const columns = Math.ceil(Math.sqrt(density)), lines = Math.ceil(density / columns);
  const symbolScale = density ? Math.min(1, squareFootCm / columns / width * .9, squareFootCm / lines / height * .9) : 1;
  const single = length < 1 && !row.block;
  return <div className={`planting-row ${row.block ? "planting-block" : ""} ${selected ? "selected" : ""} ${preview ? "draft-planting-row" : ""}`}
    data-skip-locked={skipLocked} data-crop={row.crop} data-count={row.count} data-planting-mode={row.block?.mode ?? "row"}
    style={{ left: single ? row.x1 - width / 2 : row.x1, top: row.y1 - 12,
      width: single ? width : Math.max(1, length), height: row.block ? row.block.depthCm + 24 : 24,
      transformOrigin: "0 12px", transform: `rotate(${angle}deg)`,
      ["--row-symbol-width" as string]: `${width * symbolScale}px`, ["--row-symbol-height" as string]: `${height * symbolScale}px`,
      ["--block-depth" as string]: `${row.block?.depthCm ?? 0}px`, ["--square-foot" as string]: `${squareFootCm}px` }}
    onPointerDown={event => onDrag?.(event, row)}>
    {row.block && <span className="planting-block-outline" />}
    <PlannerRowSymbols row={row} selectedPlantId={selectedPlantId} />
    <span className="row-caption" role={preview ? "status" : undefined}>
      {!preview && <PlantArt crop={row.crop} variety={row.variety} fallback={row.cropIcon} />}
      {preview ? row.crop : row.variety} · {row.count}{preview ? ` ${row.count === 1 ? "plant" : "plants"} · ${(length / 100).toFixed(2)} m` : ""}
      {row.block && ` · ${(length / 100).toFixed(2)} × ${(row.block.depthCm / 100).toFixed(2)} m`}
    </span>
    {handles && <>
      {!row.block && <><span className="line-handle start" onPointerDown={event => onDrag?.(event, row, "row-start")} />
        <span className="line-handle end" onPointerDown={event => onDrag?.(event, row, "row-end")} /></>}
      <span className="block-resize-handle" role="button" aria-label="Resize planting block"
        style={{ left: row.block ? length : Math.max(length, width / 2), top: 12 + (row.block ? row.block.depthCm : height / 2) }}
        onPointerDown={event => onDrag?.(event, row, "row-block")} />
    </>}
  </div>;
}
