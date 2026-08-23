import type { PlannerPlantingArea } from "@/lib/garden/planner-plan";

export type PlantCanvasPosition = {
  x: number;
  y: number;
  rotation: number;
};

type PlantLayout = {
  widthCm: number;
  heightCm: number;
  spacingCm: number;
  rowStepCm: number;
  rows: number;
  baseColumns: number;
  count: number;
};

const STAGGER_ROW_FACTOR = Math.sqrt(3) / 2;
const NATURAL_ROTATIONS = [-7, 5, -3, 7, 2, -5, 4, -2];
const DEFAULT_MAX_RENDERED_PLANTS = 240;

function layoutFor(area: PlannerPlantingArea, widthCm: number, heightCm: number): PlantLayout {
  const safeWidth = Math.max(1, widthCm);
  const safeHeight = Math.max(1, heightCm);
  const spacingCm = Math.max(2, area.spacingCm);

  if (area.pattern === "single") {
    return {
      widthCm: safeWidth,
      heightCm: safeHeight,
      spacingCm,
      rowStepCm: spacingCm,
      rows: 1,
      baseColumns: 1,
      count: 1,
    };
  }

  const rowStepCm = area.pattern === "staggered" ? spacingCm * STAGGER_ROW_FACTOR : spacingCm;
  const rows = Math.max(1, Math.floor(safeHeight / rowStepCm));
  const baseColumns = Math.max(1, Math.floor(safeWidth / spacingCm));

  let count = 0;
  for (let row = 0; row < rows; row += 1) {
    const staggeredRow = area.pattern === "staggered" && row % 2 === 1 && baseColumns > 1;
    count += staggeredRow ? baseColumns - 1 : baseColumns;
  }

  return { widthCm: safeWidth, heightCm: safeHeight, spacingCm, rowStepCm, rows, baseColumns, count };
}

export function plantCountForArea(area: PlannerPlantingArea, widthCm: number, heightCm: number) {
  return layoutFor(area, widthCm, heightCm).count;
}

export function plantPositionsForArea(
  area: PlannerPlantingArea,
  widthCm: number,
  heightCm: number,
  maxRendered = DEFAULT_MAX_RENDERED_PLANTS,
): PlantCanvasPosition[] {
  const layout = layoutFor(area, widthCm, heightCm);
  if (area.pattern === "single") {
    return [{ x: layout.widthCm / 2, y: layout.heightCm / 2, rotation: 0 }];
  }

  const sampleEvery = Math.max(1, Math.ceil(layout.count / Math.max(1, maxRendered)));
  const usedHeight = (layout.rows - 1) * layout.rowStepCm;
  const startY = (layout.heightCm - usedHeight) / 2;
  const positions: PlantCanvasPosition[] = [];
  let logicalIndex = 0;

  for (let row = 0; row < layout.rows; row += 1) {
    const staggeredRow = area.pattern === "staggered" && row % 2 === 1 && layout.baseColumns > 1;
    const columns = staggeredRow ? layout.baseColumns - 1 : layout.baseColumns;
    const usedWidth = (columns - 1) * layout.spacingCm;
    const startX = (layout.widthCm - usedWidth) / 2;

    for (let column = 0; column < columns; column += 1) {
      if (logicalIndex % sampleEvery === 0) {
        positions.push({
          x: startX + column * layout.spacingCm,
          y: startY + row * layout.rowStepCm,
          rotation: area.pattern === "natural" ? NATURAL_ROTATIONS[logicalIndex % NATURAL_ROTATIONS.length] : 0,
        });
      }
      logicalIndex += 1;
    }
  }

  return positions;
}
