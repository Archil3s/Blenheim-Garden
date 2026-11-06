import type { PlannerRow } from "./planner-plan";

export function rowPlantCount(length: number, spacingCm: number) {
  return Math.max(1, Math.floor(length / Math.max(2, spacingCm)) + 1);
}

export function rowSymbolPositions(row: PlannerRow) {
  const length = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  if (row.placements) return row.placements.map((point) => ({
    id: point.id, x: length < 0.001 ? point.x : length * point.x / 100,
    y: point.y,
  }));
  const count = Math.max(1, Math.round(row.count));
  return Array.from({ length: count }, (_, index) => ({
    id: `${row.id}:generated-${index}`,
    x: length < 0.001 ? 0 : count === 1 ? length / 2 : index * length / (count - 1),
    y: 0,
  }));
}
