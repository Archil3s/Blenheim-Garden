import type { PlannerPlan } from "./planner-plan";
import { structurePreset } from "./structure-catalog";

export type PlantListRow = {
  id: string;
  crop: string;
  variety: string;
  location: string;
  quantity: number;
  spacingCm: number;
};

export function plantListRows(plan: PlannerPlan): PlantListRow[] {
  return [
    ...plan.plantingAreas.map((area) => ({ id: area.id, crop: area.crop,
      variety: area.variety, location: plan.beds.find((bed) => bed.id === area.bedId)?.name ?? "Unassigned",
      quantity: area.placements?.length ?? area.count, spacingCm: area.spacingCm })),
    ...plan.rows.map((row, index) => ({ id: row.id, crop: row.crop,
      variety: row.variety, location: `Row ${index + 1}`,
      quantity: row.placements?.length ?? row.count, spacingCm: row.spacingCm })),
  ];
}

export function groupedPlantList(plan: PlannerPlan): PlantListRow[] {
  const groups = new Map<string, PlantListRow>();
  for (const row of plantListRows(plan)) {
    const key = JSON.stringify([row.crop, row.variety, row.spacingCm]);
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += row.quantity;
      const locations = new Set(existing.location.split(" · "));
      locations.add(row.location);
      existing.location = [...locations].join(" · ");
    } else groups.set(key, { ...row });
  }
  return [...groups.values()].sort((a, b) => a.crop.localeCompare(b.crop));
}

export function partsListRows(plan: PlannerPlan) {
  const rows: Array<{ part: string; quantity: number; unit: string }> = [];
  for (const bed of plan.beds) {
    rows.push({ part: "Bed edging", quantity: 2 * (bed.w * 9 + bed.h * 10.8) / 100, unit: "m" });
    rows.push({ part: "Bed growing area", quantity: bed.w * 9 * bed.h * 10.8 / 10000, unit: "m²" });
  }
  for (const object of plan.objects) {
    if (object.type === "path" || object.type === "trellis") {
      const length = Math.hypot(object.x2 - object.x1, object.y2 - object.y1) / 100;
      rows.push({ part: object.type === "path" ? "Path length" : "Trellis length", quantity: length, unit: "m" });
      if (object.type === "path") rows.push({ part: "Path surface", quantity: length * object.widthCm / 100, unit: "m²" });
      else rows.push({ part: "Trellis posts", quantity: Math.ceil(length * 100 / Math.max(1, object.postSpacingCm)) + 1, unit: "each" });
    } else if (object.type === "structure") {
      rows.push({ part: `${object.label || structurePreset(object.kind).label} (${object.widthCm} × ${object.depthCm} cm)`, quantity: 1, unit: "each" });
    }
  }
  const groups = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const key = JSON.stringify([row.part, row.unit]);
    const existing = groups.get(key);
    if (existing) existing.quantity += row.quantity;
    else groups.set(key, { ...row });
  }
  return [...groups.values()];
}

export function csvText(rows: Array<Array<string | number>>) {
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    const text = String(value);
    // Prevent spreadsheet formula execution when labels come from an imported plan.
    const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n");
}

export function xmlText(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}

export function planSvg(plan: PlannerPlan, title: string) {
  const drawingHeight = Math.max(1080, ...plan.beds.map((bed) => (bed.y + bed.h) * 10.8));
  const pageHeight = Math.ceil(drawingHeight + 140);
  const shapes: string[] = [];
  for (const object of plan.objects) {
    if (object.type === "path" || object.type === "trellis") {
      shapes.push(`<line x1="${object.x1}" y1="${object.y1}" x2="${object.x2}" y2="${object.y2}" stroke="${object.type === "path" ? "#c1b8a4" : "#94704d"}" stroke-width="${object.type === "path" ? object.widthCm : 10}"/>`);
    } else if (object.type === "tree") {
      shapes.push(`<circle cx="${object.x}" cy="${object.y}" r="${object.diameterCm / 2}" fill="#b4c59c" fill-opacity=".6" stroke="#648453"/><text x="${object.x}" y="${object.y}" text-anchor="middle">${xmlText(object.label ?? "Tree")}</text>`);
    } else if (object.type === "structure") {
      shapes.push(`<g transform="translate(${object.x} ${object.y}) rotate(${object.rotationDeg})"><rect x="${-object.widthCm / 2}" y="${-object.depthCm / 2}" width="${object.widthCm}" height="${object.depthCm}" fill="#d5dfd2" stroke="#5f7864" stroke-width="3"/><text text-anchor="middle">${xmlText(object.label ?? structurePreset(object.kind).label)}</text></g>`);
    } else shapes.push(`<text x="${object.x}" y="${object.y}" font-size="${object.fontSize}">${xmlText(object.text)}</text>`);
  }
  for (const bed of plan.beds) {
    const x = bed.x * 9, y = bed.y * 10.8, w = bed.w * 9, h = bed.h * 10.8;
    shapes.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eee9dc" fill-opacity=".85" stroke="#94704d" stroke-width="4"/><text x="${x + 8}" y="${y + 18}" font-weight="bold">${xmlText(bed.name)}</text>`);
    for (const area of plan.plantingAreas.filter((item) => item.bedId === bed.id)) {
      const ax = x + w * area.x / 100, ay = y + h * area.y / 100;
      shapes.push(`<rect x="${ax}" y="${ay}" width="${w * area.w / 100}" height="${h * area.h / 100}" fill="#b9cca0" fill-opacity=".45" stroke="#789762" stroke-width="1"/><text x="${ax + 7}" y="${ay + 36}">${xmlText(area.variety || area.crop)} ×${area.placements?.length ?? area.count}</text>`);
    }
  }
  for (const row of plan.rows) shapes.push(`<line x1="${row.x1}" y1="${row.y1}" x2="${row.x2}" y2="${row.y2}" stroke="#759363" stroke-width="8" stroke-linecap="round" stroke-dasharray="1 ${Math.max(2, row.spacingCm)}"/><text x="${row.x1}" y="${row.y1 - 8}">${xmlText(row.variety || row.crop)} ×${row.placements?.length ?? row.count}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${pageHeight}" viewBox="-50 -70 1000 ${pageHeight}"><title>${xmlText(title)}</title><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="#fff"/><path d="M100 0H0V100" fill="none" stroke="#e3e7db"/></pattern></defs><rect x="-50" y="-70" width="1000" height="${pageHeight}" fill="#fff"/><text x="0" y="-33" font-family="Georgia,serif" font-size="24">${xmlText(title)}</text><rect width="900" height="1080" fill="url(#grid)" stroke="#a6af9a"/><g font-family="sans-serif" font-size="12" fill="#294535">${shapes.join("")}</g><text x="0" y="${drawingHeight + 40}" font-family="sans-serif" font-size="13">Blenheim Garden · 9 × 10.8 m · schematic plan</text></svg>`;
}
