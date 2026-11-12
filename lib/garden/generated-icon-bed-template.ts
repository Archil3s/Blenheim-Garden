import { approvedGeneratedPlantIcons } from "./supplier-plant-icons";
import type { PlannerPlan, PlannerPlantingArea } from "./planner-plan";

// One editable planting per approved supplier image, laid out as a visual sample bed.
// This is deliberately not a horticultural spacing recommendation.
export function createGeneratedIconBedTemplate(
  bedId = Date.now() * 1000 + Math.floor(Math.random() * 900),
): PlannerPlan {
  const icons = [...approvedGeneratedPlantIcons].sort((a, b) =>
    a.crop.localeCompare(b.crop) || a.variety.localeCompare(b.variety) || a.source.localeCompare(b.source));
  const columns = 20, cellWidth = 210, cellHeight = 220;
  const rows = Math.ceil(icons.length / columns);
  const bedWidth = columns * cellWidth, bedHeight = rows * cellHeight;
  const duplicateCounts = new Map<string, number>();
  for (const icon of icons) {
    const key = JSON.stringify([icon.crop.toLowerCase(), icon.variety.toLowerCase()]);
    duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
  }

  const plantingAreas: PlannerPlantingArea[] = icons.map((icon, index) => {
    const key = JSON.stringify([icon.crop.toLowerCase(), icon.variety.toLowerCase()]);
    return {
      id: `icon-sample-${index}-${crypto.randomUUID()}`,
      bedId,
      crop: icon.crop,
      variety: (duplicateCounts.get(key) ?? 0) > 1 ? `${icon.variety} · ${icon.source}` : icon.variety,
      cropIcon: "🌱",
      spacingCm: 100,
      x: ((index % columns) * cellWidth + 12) / bedWidth * 100,
      y: (Math.floor(index / columns) * cellHeight + 12) / bedHeight * 100,
      w: (cellWidth - 24) / bedWidth * 100,
      h: (cellHeight - 24) / bedHeight * 100,
      count: 1,
      pattern: "single",
      iconSize: 64,
      visualSpacing: "normal",
    };
  });

  // Bed percentages are always relative to the 900 × 1080 cm coordinate basis.
  return {
    canvas: { widthCm: bedWidth + 400, heightCm: bedHeight + 400 },
    beds: [{
      id: bedId,
      name: `Approved icons · ${icons.length} varieties (sample only)`,
      x: 180 / 9,
      y: 180 / 10.8,
      w: bedWidth / 9,
      h: bedHeight / 10.8,
    }],
    plantingAreas,
    rows: [],
    objects: [],
  };
}
