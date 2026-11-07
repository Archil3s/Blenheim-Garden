import type { PlannerBed, PlannerPlan, PlannerPlantingArea, PlannerRow } from "./planner-plan";

// Traced to the nearest 10 cm from the raster PDF's metre grid, not a survey.
// The PDF's full drawing canvas is 35 × 35 m; beds occupy its northwest corner.
export function createLargePlotTemplate(idBase = Date.now() * 1000 + Math.floor(Math.random() * 900)): PlannerPlan {
  const definitions: Array<[string, number, number, number, number]> = [
    ["Bed 1", 680, 50, 400, 200], ["Bed 2 · raspberries", 680, 270, 400, 200],
    ["Bed 3", 680, 490, 400, 200], ["Bed 4 · fruit tree", 680, 730, 400, 200],
    ["Bed 5", 700, 1190, 410, 200], ["Post summer raspberries", 690, 1010, 410, 140],
    ["Blueberries", 700, 1420, 400, 200], ["South east bed", 690, 1680, 400, 200],
    ["West bed", 140, 940, 400, 200], ["Asparagus", 140, 1180, 400, 200],
    ["West trellis bed", 140, 1410, 400, 200], ["South west bed", 10, 1680, 530, 210],
    ["South narrow bed", 0, 1970, 1080, 70], ["West strawberry plot", 150, 60, 410, 780],
    ["North raspberry strip", 1220, 50, 710, 60],
    ["North strawberries", 1220, 120, 120, 230], ["North raspberries 1", 1350, 120, 100, 230],
    ["North raspberries 2", 1460, 120, 100, 230], ["Boysenberry & passionfruit", 1570, 120, 120, 230],
    ["North blueberry 1", 1700, 120, 100, 230], ["North blueberry 2", 1810, 120, 120, 230], ["Entrance bed", 570, 50, 100, 110],
    ["West narrow bed", 560, 170, 110, 610],
  ];
  const beds: PlannerBed[] = definitions.map(([name, x, y, w, h], index) => ({ id: idBase + index + 1, name, x: x / 9, y: y / 10.8, w: w / 9, h: h / 10.8 }));
  const rows: PlannerRow[] = [];
  const row = (crop: string, x1: number, y1: number, x2: number, y2: number, count: number, variety = crop) => {
    const id = `pdf-${crypto.randomUUID()}`;
    rows.push({ id, crop, variety, cropIcon: "🌱", x1, y1, x2, y2, count,
      spacingCm: count > 1 ? Math.hypot(x2 - x1, y2 - y1) / (count - 1) : 30 });
  };
  for (const y of [310, 385, 450]) row("Raspberry", 710, y, 1040, y, 5);
  for (const x of [175, 230, 285]) row("Strawberry", x, 85, x, 445, 8);
  row("Strawberry", 350, 90, 350, 630, 5);
  row("Raspberry", 1320, 60, 1910, 60, 10);
  for (const x of [1250, 1310]) row("Strawberry", x, 150, x, 320, 4);
  for (const x of [1400, 1510]) row("Raspberry", x, 160, x, 310, 3);
  row("Boysenberry", 1630, 160, 1630, 160, 1);
  row("Passionfruit", 1630, 290, 1630, 290, 1);
  row("Blueberry", 1740, 310, 1740, 310, 1);
  row("Blueberry", 1840, 160, 1840, 310, 2);
  row("Blackberry", 1950, 160, 1950, 310, 2);
  for (const y of [1460, 1560]) row("Blueberry", 790, y, 1020, y, 3);
  for (const y of [1230, 1320]) row("Asparagus", 170, y, 510, y, 8);
  const plantingAreas: PlannerPlantingArea[] = [];
  const looseRows: PlannerRow[] = [];
  for (const cropRow of rows) {
    const points = Array.from({ length: cropRow.count }, (_, index) => {
      const t = cropRow.count > 1 ? index / (cropRow.count - 1) : 0;
      return { x: cropRow.x1 + (cropRow.x2 - cropRow.x1) * t, y: cropRow.y1 + (cropRow.y2 - cropRow.y1) * t };
    });
    const bed = beds.find(bed => points.every(p => p.x >= bed.x * 9 && p.y >= bed.y * 10.8 && p.x <= (bed.x + bed.w) * 9 && p.y <= (bed.y + bed.h) * 10.8));
    if (!bed) { looseRows.push(cropRow); continue; }
    const bx = bed.x * 9, by = bed.y * 10.8, bw = bed.w * 9, bh = bed.h * 10.8;
    const x = Math.max(bx, Math.min(...points.map(p => p.x)) - 30);
    const y = Math.max(by, Math.min(...points.map(p => p.y)) - 30);
    const w = Math.min(bx + bw, Math.max(...points.map(p => p.x)) + 30) - x;
    const h = Math.min(by + bh, Math.max(...points.map(p => p.y)) + 30) - y;
    plantingAreas.push({ id: cropRow.id, bedId: bed.id, crop: cropRow.crop, cropIcon: cropRow.cropIcon, variety: cropRow.variety, spacingCm: cropRow.spacingCm,
      x: (x - bx) / bw * 100, y: (y - by) / bh * 100, w: w / bw * 100, h: h / bh * 100, count: cropRow.count, pattern: "rows", iconSize: 16, visualSpacing: "normal",
      placements: points.map(p => ({ id: crypto.randomUUID(), x: (p.x - x) / w * 100, y: (p.y - y) / h * 100 })) });
  }
  return { canvas: { widthCm: 3500, heightCm: 3500 }, beds, plantingAreas, rows: looseRows,
    objects: [
      { id: `pdf-path-${crypto.randomUUID()}`, type: "path", x1: 640, y1: 170, x2: 640, y2: 1600, widthCm: 30, label: "Main path" },
      { id: `pdf-path-${crypto.randomUUID()}`, type: "path", x1: 330, y1: 80, x2: 330, y2: 830, widthCm: 30, label: "West path" },
      { id: `pdf-tree-${crypto.randomUUID()}`, type: "tree", x: 890, y: 870, diameterCm: 300, label: "Fruit tree" },
      { id: `pdf-label-${crypto.randomUUID()}`, type: "text", x: 640, y: 20, text: "Entrance", fontSize: 14 },
      { id: `pdf-label-${crypto.randomUUID()}`, type: "text", x: 60, y: 890, text: "Exit", fontSize: 14 },
      { id: `pdf-arch-${crypto.randomUUID()}`, type: "structure", kind: "garden-arch", x: 1740, y: 235, widthCm: 80, depthCm: 190, heightCm: 220, rotationDeg: 0, label: "Blueberry arch" },
      ...Array.from({ length: 12 }, (_, index) => {
        const a = -Math.PI / 2 + index * Math.PI / 12, b = a + Math.PI / 12;
        const x1 = 220 - 80 * Math.cos(a), y1 = 1500 + 90 * Math.sin(a);
        const x2 = 220 - 80 * Math.cos(b), y2 = 1500 + 90 * Math.sin(b);
        return { id: `pdf-curve-${crypto.randomUUID()}`, type: "shape" as const, shape: "line" as const,
          x: (x1 + x2) / 2, y: (y1 + y2) / 2, widthCm: Math.hypot(x2 - x1, y2 - y1), heightCm: 1,
          rotationDeg: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, stroke: "#855425", fill: "none", lineWidth: 2, behind: false, locked: false };
      }),
    ] };
}
