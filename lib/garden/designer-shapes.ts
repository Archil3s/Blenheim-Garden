import { defaultGardenDimensions, type GardenDimensions } from "./garden-dimensions";
import type { PlannerShape, PlannerShapeKind } from "./planner-plan";

export const shapeKinds: readonly PlannerShapeKind[] = ["rectangle", "triangle", "ellipse", "line"];

export function parseDesignerShape(value: unknown, dimensions: GardenDimensions = defaultGardenDimensions): PlannerShape {
  if (!value || typeof value !== "object") throw new Error("Invalid drawing shape.");
  const input = value as Record<string, unknown>;
  const finite = (key: string, min: number, max: number) => {
    const number = input[key];
    if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max) throw new Error(`Invalid shape ${key}.`);
    return number;
  };
  if (typeof input.id !== "string" || !input.id.trim() || input.id.length > 160 || input.type !== "shape") throw new Error("Invalid drawing shape.");
  if (!shapeKinds.includes(input.shape as PlannerShapeKind)) throw new Error("Unknown drawing shape.");
  if (typeof input.stroke !== "string" || !/^#[0-9a-f]{6}$/i.test(input.stroke)) throw new Error("Invalid outline colour.");
  if (typeof input.fill !== "string" || !/^(none|#[0-9a-f]{6})$/i.test(input.fill)) throw new Error("Invalid fill colour.");
  return { id: input.id, type: "shape", shape: input.shape as PlannerShapeKind,
    x: finite("x", 0, dimensions.widthCm), y: finite("y", 0, dimensions.heightCm),
    widthCm: finite("widthCm", 5, input.shape === "line" ? Math.max(1500, Math.hypot(dimensions.widthCm, dimensions.heightCm)) : dimensions.widthCm), heightCm: finite("heightCm", 1, dimensions.heightCm),
    rotationDeg: ((finite("rotationDeg", -3600, 3600) % 360) + 360) % 360,
    stroke: input.stroke, fill: input.fill, lineWidth: finite("lineWidth", 1, 20),
    locked: input.locked === true, behind: input.behind === true };
}

export function shapeFromDrag(start: { x: number; y: number }, end: { x: number; y: number }, style: Pick<PlannerShape, "shape" | "stroke" | "fill" | "lineWidth">): PlannerShape | null {
  const dx = end.x - start.x, dy = end.y - start.y;
  const line = style.shape === "line";
  const width = line ? Math.hypot(dx, dy) : Math.abs(dx);
  const height = line ? 1 : Math.abs(dy);
  if (width < 5 || (!line && height < 5)) return null;
  return { ...style, id: crypto.randomUUID(), type: "shape", x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2, widthCm: width, heightCm: height,
    rotationDeg: line ? Math.atan2(dy, dx) * 180 / Math.PI : 0, locked: false, behind: false };
}

export function shapeGeometry(shape: PlannerShape) {
  const w = shape.widthCm, h = shape.heightCm;
  if (shape.shape === "ellipse") return { tag: "ellipse", attributes: { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2 } };
  if (shape.shape === "triangle") return { tag: "polygon", attributes: { points: `${w / 2},0 ${w},${h} 0,${h}` } };
  if (shape.shape === "line") return { tag: "line", attributes: { x1: 0, y1: h / 2, x2: w, y2: h / 2 } };
  return { tag: "rect", attributes: { x: 0, y: 0, width: w, height: h } };
}
