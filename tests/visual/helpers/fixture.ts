import type { PlannerPlan } from "../../../lib/garden/planner-plan";

export const fixture: PlannerPlan = { beds: [
  { id: 1, name: "Bed 1", x: 62, y: 14, w: 31, h: 10 },
  { id: 2, name: "Bed 2", x: 62, y: 26, w: 31, h: 10 },
  { id: 3, name: "Bed 3", x: 62, y: 38, w: 31, h: 9 },
  { id: 4, name: "Bed 4", x: 62, y: 49, w: 31, h: 9 },
  { id: 5, name: "Bed 5", x: 62, y: 60, w: 31, h: 9 },
  { id: 6, name: "Bed 6", x: 62, y: 71, w: 31, h: 9 },
  { id: 7, name: "Bed 7", x: 62, y: 82, w: 31, h: 9 },
  { id: 8, name: "Bed 8", x: 10, y: 52, w: 31, h: 9 },
  { id: 9, name: "Bed 9", x: 10, y: 64, w: 31, h: 9 },
  { id: 10, name: "Bed 10", x: 10, y: 76, w: 31, h: 9 },
  { id: 11, name: "Bed 11", x: 2, y: 88, w: 39, h: 9 },
  { id: 12, name: "Bed 12", x: 2, y: 99, w: 91, h: 5 },
], plantingAreas: [
  { id: "base-area-1", plantingId: "fixture-base-area-1", bedId: 1, crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 10, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-2", plantingId: "fixture-base-area-2", bedId: 2, crop: "Strawberry", cropIcon: "🍓", variety: "Camarosa", spacingCm: 35, x: 0, y: 0, w: 100, h: 100, count: 21, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-5", plantingId: "fixture-base-area-5", bedId: 5, crop: "Strawberry", cropIcon: "🍓", variety: "Albion", spacingCm: 35, x: 0, y: 0, w: 100, h: 100, count: 18, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-9", plantingId: "fixture-base-area-9", bedId: 9, crop: "Bean", cropIcon: "🫘", variety: "King Purple", spacingCm: 18, x: 0, y: 0, w: 100, h: 100, count: 70, pattern: "grid", iconSize: 14, visualSpacing: "normal" },
], rows: [], objects: [
  { id: "layout-path-main", type: "path", x1: 485, y1: 180, x2: 485, y2: 930, widthCm: 45, label: "Main path" },
  { id: "layout-path-cross", type: "path", x1: 120, y1: 560, x2: 820, y2: 560, widthCm: 45, label: "Cross path" },
  { id: "layout-trellis-north", type: "trellis", x1: 240, y1: 180, x2: 240, y2: 500, heightCm: 180, postSpacingCm: 150, label: "Post & trellis" },
  { id: "layout-tree-north", type: "tree", x: 360, y: 210, diameterCm: 100, label: "Fruit tree" },
  { id: "layout-text-entrance", type: "text", x: 450, y: 28, text: "ENTRANCE", fontSize: 13 },
  { id: "layout-text-exit", type: "text", x: 28, y: 565, text: "EXIT", fontSize: 13 },
] };
