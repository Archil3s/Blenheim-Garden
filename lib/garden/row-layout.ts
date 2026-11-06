import { blockSymbolPositions, resizePlantingBlock } from "./planting-block";
import type { PlannerRow } from "./planner-plan";

export function rowPlantCount(length: number, spacingCm: number) {
  return Math.max(1, Math.floor((length + 1e-7) / Math.max(2, spacingCm)) + 1);
}

export function resizePlantingRow(
  original: PlannerRow,
  geometry: Partial<Pick<PlannerRow, "x1" | "y1" | "x2" | "y2" | "spacingCm">>,
  newId: (index: number) => string = () => crypto.randomUUID(),
): PlannerRow {
  const next = { ...original, ...geometry };
  if (next.x1 === original.x1 && next.y1 === original.y1
    && next.x2 === original.x2 && next.y2 === original.y2
    && next.spacingCm === original.spacingCm) return original;
  if (next.block) return resizePlantingBlock(next, Math.hypot(next.x2 - next.x1, next.y2 - next.y1), next.block.depthCm, next.block, newId);
  const count = rowPlantCount(Math.hypot(next.x2 - next.x1, next.y2 - next.y1), next.spacingCm);
  return { ...next, count, placements: original.placements ? Array.from({ length: count }, (_, index) => ({
    id: original.placements![index]?.id ?? newId(index),
    x: count === 1 ? 0 : index * 100 / (count - 1), y: 0,
  })) : undefined };
}

export function rowSymbolPositions(row: PlannerRow) {
  const length = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  if (row.placements) return row.placements.map((point) => ({
    id: point.id, x: length < 0.001 ? point.x : length * point.x / 100,
    y: point.y,
  }));
  if (row.block) return blockSymbolPositions(row);
  const count = Math.max(1, Math.round(row.count));
  return Array.from({ length: count }, (_, index) => ({
    id: `${row.id}:generated-${index}`,
    x: length < 0.001 ? 0 : count === 1 ? length / 2 : index * length / (count - 1),
    y: 0,
  }));
}
