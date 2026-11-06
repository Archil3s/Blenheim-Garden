import type { PlannerPlantingBlock, PlannerRow } from "./planner-plan";

export const squareFootCm = 30.48;

export function isSquareFootSize(size: number) {
  return size >= squareFootCm - 1e-7 && Math.abs(size / squareFootCm - Math.round(size / squareFootCm)) < 1e-7;
}

export function parsePlantingBlock(value: unknown): PlannerPlantingBlock | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object") throw new Error("Invalid planting block.");
  const block = value as Record<string, unknown>;
  if (typeof block.depthCm !== "number" || !Number.isFinite(block.depthCm)
    || block.depthCm < 0 || block.depthCm > 1500
    || typeof block.rowSpacingCm !== "number" || !Number.isFinite(block.rowSpacingCm)
    || block.rowSpacingCm < 2 || block.rowSpacingCm > 1500
    || !["block", "square-foot"].includes(String(block.mode))) throw new Error("Invalid block dimensions or spacing.");
  if (block.mode === "square-foot" && ![1, 2, 4, 8, 9, 16].includes(Number(block.plantsPerSquareFoot))) throw new Error("Invalid square-foot density.");
  if (block.mode === "square-foot" && !isSquareFootSize(block.depthCm)) throw new Error("Invalid square-foot dimensions: use whole cells.");
  return { depthCm: block.depthCm, rowSpacingCm: block.rowSpacingCm,
    mode: block.mode as PlannerPlantingBlock["mode"],
    ...(block.mode === "square-foot" ? { plantsPerSquareFoot: Number(block.plantsPerSquareFoot) } : {}) };
}

export function blockGrid(row: PlannerRow) {
  const width = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  const block = row.block!;
  if (block.mode === "square-foot") {
    const columns = Math.max(1, Math.round(width / squareFootCm));
    const rows = Math.max(1, Math.round(block.depthCm / squareFootCm));
    return { columns, rows, count: columns * rows * (block.plantsPerSquareFoot ?? 1) };
  }
  const columns = Math.max(1, Math.floor((width + 1e-7) / Math.max(2, row.spacingCm)) + 1);
  const rows = Math.max(1, Math.floor((block.depthCm + 1e-7) / block.rowSpacingCm) + 1);
  return { columns, rows, count: columns * rows };
}

export function blockSymbolPositions(row: PlannerRow) {
  const block = row.block!, grid = blockGrid(row);
  const width = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  return Array.from({ length: grid.count }, (_, index) => {
    if (block.mode === "square-foot") {
      const density = block.plantsPerSquareFoot ?? 1;
      const cell = Math.floor(index / density), plant = index % density;
      const columns = Math.ceil(Math.sqrt(density)), rows = Math.ceil(density / columns);
      return { id: `${row.id}:cell-${cell}:plant-${plant}`,
        x: (cell % grid.columns + (plant % columns + .5) / columns) * squareFootCm,
        y: (Math.floor(cell / grid.columns) + (Math.floor(plant / columns) + .5) / rows) * squareFootCm };
    }
    const column = index % grid.columns, line = Math.floor(index / grid.columns);
    return { id: `${row.id}:block-${line}-${column}`,
      x: grid.columns === 1 ? width / 2 : column * row.spacingCm,
      y: grid.rows === 1 ? block.depthCm / 2 : line * block.rowSpacingCm };
  });
}

export function resizePlantingBlock(original: PlannerRow, width: number, depth: number,
  block = original.block!, newId: (index: number) => string = () => crypto.randomUUID()): PlannerRow {
  const length = Math.hypot(original.x2 - original.x1, original.y2 - original.y1);
  const angle = length ? Math.atan2(original.y2 - original.y1, original.x2 - original.x1) : 0;
  const size = (value: number) => block.mode === "square-foot"
    ? Math.max(1, Math.floor((value + 1e-7) / squareFootCm)) * squareFootCm : Math.max(0, value);
  const w = size(width), h = size(depth);
  const next = { ...original, x2: original.x1 + Math.cos(angle) * w,
    y2: original.y1 + Math.sin(angle) * w, block: { ...block, depthCm: h } };
  const count = blockGrid(next).count;
  return { ...next, count, placements: original.placements
    ? blockSymbolPositions(next).map((point, index) => ({ id: original.placements![index]?.id ?? newId(index),
      x: w < .001 ? point.x : point.x * 100 / w, y: point.y })) : undefined };
}

export function blockCorners(row: PlannerRow) {
  const dx = row.x2 - row.x1, dy = row.y2 - row.y1, length = Math.hypot(dx, dy);
  const nx = length ? -dy / length : 0, ny = length ? dx / length : 1;
  const depth = row.block?.depthCm ?? 0;
  return [{ x: row.x1, y: row.y1 }, { x: row.x2, y: row.y2 },
    { x: row.x1 + nx * depth, y: row.y1 + ny * depth },
    { x: row.x2 + nx * depth, y: row.y2 + ny * depth }];
}
