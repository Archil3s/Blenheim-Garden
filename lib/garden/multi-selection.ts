import { blockCorners } from "./planting-block";
import type { PlannerPlan } from "./planner-plan";
import { pastePlanSelection, type ClipboardSelection } from "./selection-clipboard";

export type PlanSelection = ClipboardSelection;
export type SelectionBox = { x: number; y: number; w: number; h: number };
export type GroupClipboard = { plan: PlannerPlan; selections: PlanSelection[] };
export const sameSelection = (a: PlanSelection, b: PlanSelection) => a.kind === b.kind && a.id === b.id;

export function selectionBounds(plan: PlannerPlan, selected: PlanSelection): SelectionBox | null {
  if (selected.kind === "bed") {
    const bed = plan.beds.find((item) => String(item.id) === selected.id);
    return bed ? { x: bed.x * 9, y: bed.y * 10.8, w: bed.w * 9, h: bed.h * 10.8 } : null;
  }
  if (selected.kind === "planting") {
    const area = plan.plantingAreas.find((item) => item.id === selected.id);
    const bed = area && plan.beds.find((item) => item.id === area.bedId);
    return area && bed ? { x: (bed.x + bed.w * area.x / 100) * 9, y: (bed.y + bed.h * area.y / 100) * 10.8, w: bed.w * area.w / 100 * 9, h: bed.h * area.h / 100 * 10.8 } : null;
  }
  const item = selected.kind === "row" ? plan.rows.find((row) => row.id === selected.id) : plan.objects.find((object) => object.id === selected.id);
  if (!item) return null;
  if (selected.kind === "row" && "block" in item && item.block) {
    const corners = blockCorners(item);
    const x = Math.min(...corners.map(p => p.x)), y = Math.min(...corners.map(p => p.y));
    return { x, y, w: Math.max(...corners.map(p => p.x)) - x, h: Math.max(...corners.map(p => p.y)) - y };
  }
  if ("x1" in item) return { x: Math.min(item.x1, item.x2), y: Math.min(item.y1, item.y2), w: Math.abs(item.x2 - item.x1), h: Math.abs(item.y2 - item.y1) };
  if (item.type === "text") return { x: item.x, y: item.y, w: Math.max(item.fontSize, item.text.length * item.fontSize * 0.6), h: item.fontSize * 1.4 };
  if (item.type === "tree") return { x: item.x - item.diameterCm / 2, y: item.y - item.diameterCm / 2, w: item.diameterCm, h: item.diameterCm };
  const width = item.widthCm, height = item.type === "shape" ? item.heightCm : item.depthCm;
  const angle = item.rotationDeg * Math.PI / 180;
  const w = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
  const h = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
  return { x: item.x - w / 2, y: item.y - h / 2, w, h };
}

export function canonicalSelection(plan: PlannerPlan, selections: PlanSelection[]) {
  const beds = new Set(selections.filter((item) => item.kind === "bed").map((item) => Number(item.id)));
  return selections.filter((item, index) => selectionBounds(plan, item) && !selections.slice(0, index).some((other) => sameSelection(item, other)) && !(item.kind === "planting" && beds.has(plan.plantingAreas.find((area) => area.id === item.id)!.bedId)));
}

export function selectableItems(plan: PlannerPlan, layer = "all"): PlanSelection[] {
  if (layer === "view") return [];
  return [
    ...(["all", "plants"].includes(layer) ? plan.beds.map((bed) => ({ kind: "bed" as const, id: String(bed.id) })) : []),
    ...(["all", "plants"].includes(layer) ? plan.plantingAreas.map((area) => ({ kind: "planting" as const, id: area.id })) : []),
    ...(["all", "plants"].includes(layer) ? plan.rows.map((row) => ({ kind: "row" as const, id: row.id })) : []),
    ...plan.objects.filter((item) => !(item.type === "shape" && item.locked) && (layer === "all" || layer === "plants" && item.type === "tree" || layer === "structures" && ["structure", "tree"].includes(item.type) || layer === "layout" && ["shape", "path", "trellis"].includes(item.type) || layer === "text" && item.type === "text")).map((item) => ({ kind: "object" as const, id: item.id })),
  ];
}

export function selectInBox(plan: PlannerPlan, box: SelectionBox, layer = "all") {
  return canonicalSelection(plan, selectableItems(plan, layer).filter((item) => {
    const rect = selectionBounds(plan, item)!;
    return rect.x >= box.x && rect.y >= box.y && rect.x + rect.w <= box.x + box.w && rect.y + rect.h <= box.y + box.h;
  }));
}

export function moveSelection(plan: PlannerPlan, selections: PlanSelection[], dx: number, dy: number): PlannerPlan {
  const items = canonicalSelection(plan, selections);
  const has = (kind: PlanSelection["kind"], id: string | number) => items.some((item) => item.kind === kind && item.id === String(id));
  let minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity;
  for (const item of items) {
    const rect = selectionBounds(plan, item)!;
    let frame = { x: 0, y: 0, w: 900, h: 1080 };
    if (item.kind === "planting") {
      const area = plan.plantingAreas.find((area) => area.id === item.id)!;
      frame = selectionBounds(plan, { kind: "bed", id: String(area.bedId) })!;
    }
    // Existing plans may extend beyond the measured border; never jump them.
    minX = Math.max(minX, Math.min(0, frame.x - rect.x)); maxX = Math.min(maxX, Math.max(0, frame.x + frame.w - rect.x - rect.w));
    minY = Math.max(minY, Math.min(0, frame.y - rect.y)); maxY = Math.min(maxY, Math.max(0, frame.y + frame.h - rect.y - rect.h));
  }
  dx = Math.max(minX, Math.min(maxX, dx)); dy = Math.max(minY, Math.min(maxY, dy));
  return {
    ...plan,
    beds: plan.beds.map((bed) => has("bed", bed.id) ? { ...bed, x: bed.x + dx / 9, y: bed.y + dy / 10.8 } : bed),
    plantingAreas: plan.plantingAreas.map((area) => {
      if (!has("planting", area.id)) return area;
      const bed = plan.beds.find((bed) => bed.id === area.bedId)!;
      return { ...area, x: area.x + dx / (bed.w * 9) * 100, y: area.y + dy / (bed.h * 10.8) * 100 };
    }),
    rows: plan.rows.map((row) => has("row", row.id) ? { ...row, x1: row.x1 + dx, x2: row.x2 + dx, y1: row.y1 + dy, y2: row.y2 + dy } : row),
    objects: plan.objects.map((object) => !has("object", object.id) || object.type === "shape" && object.locked ? object : "x1" in object ? { ...object, x1: object.x1 + dx, x2: object.x2 + dx, y1: object.y1 + dy, y2: object.y2 + dy } : { ...object, x: object.x + dx, y: object.y + dy }),
  };
}

export function deleteSelections(plan: PlannerPlan, selections: PlanSelection[]): PlannerPlan {
  const has = (kind: PlanSelection["kind"], id: string | number) => selections.some((item) => item.kind === kind && item.id === String(id));
  return { ...plan, beds: plan.beds.filter((bed) => !has("bed", bed.id)), plantingAreas: plan.plantingAreas.filter((area) => !has("bed", area.bedId) && !has("planting", area.id)), rows: plan.rows.filter((row) => !has("row", row.id)), objects: plan.objects.filter((object) => !has("object", object.id) || object.type === "shape" && object.locked) };
}

export function pasteGroup(current: PlannerPlan, stored: GroupClipboard) {
  let plan = structuredClone(current);
  const selections: PlanSelection[] = [];
  const source = canonicalSelection(stored.plan, stored.selections);
  const moved = moveSelection(stored.plan, source, 20, 20);
  for (const selected of source) {
    const result = pastePlanSelection(plan, { plan: stored.plan, selection: selected });
    if (!result) continue;
    plan = result.plan;
    const id = result.selection.id;
    // Use one constrained translation for the whole group, not per-item clamping.
    if (selected.kind === "bed") {
      const original = moved.beds.find((bed) => String(bed.id) === selected.id)!;
      plan.beds = plan.beds.map((bed) => String(bed.id) === id ? { ...bed, x: original.x, y: original.y } : bed);
    } else if (selected.kind === "planting") {
      const original = moved.plantingAreas.find((area) => area.id === selected.id)!;
      plan.plantingAreas = plan.plantingAreas.map((area) => area.id === id ? { ...area, x: original.x, y: original.y } : area);
    } else if (selected.kind === "row") {
      const original = moved.rows.find((row) => row.id === selected.id)!;
      plan.rows = plan.rows.map((row) => row.id === id ? { ...row, x1: original.x1, y1: original.y1, x2: original.x2, y2: original.y2 } : row);
    } else {
      const original = moved.objects.find((object) => object.id === selected.id)!;
      plan.objects = plan.objects.map((object) => object.id === id ? { ...original, id, ...(original.type === "shape" ? { locked: false } : {}) } : object);
    }
    selections.push(result.selection);
  }
  return { plan, selections };
}
