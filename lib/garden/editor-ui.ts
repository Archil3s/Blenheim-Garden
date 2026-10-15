import type { PlannerPlan } from "./planner-plan";
import type { EditorTool } from "@/components/use-garden-3d-editor";
import { plants } from "./plant-catalog";
import { STRUCTURE_PRESETS } from "./structure-catalog";

export type EditorMode = "Select" | "Build" | "Plant" | "View";
export const editorTools: { id: EditorTool; label: string; mode: EditorMode }[] = [
  { id: "move", label: "Move", mode: "Select" }, { id: "box-select", label: "Box select", mode: "Select" },
  { id: "plant", label: "Add plant", mode: "Plant" }, { id: "row", label: "Add row", mode: "Plant" },
  { id: "fill", label: "Fill patch", mode: "Plant" }, { id: "brush", label: "Plant brush", mode: "Plant" },
  { id: "bed", label: "Add bed", mode: "Build" }, { id: "path", label: "Add path", mode: "Build" },
  { id: "fence", label: "Add fence", mode: "Build" }, { id: "trellis", label: "Add trellis", mode: "Build" },
  { id: "tree", label: "Add tree", mode: "Build" }, { id: "structure", label: "Add structure", mode: "Build" },
];
export const modeForTool = (tool: EditorTool): EditorMode => editorTools.find((t) => t.id === tool)?.mode ?? "Select";
export const addCatalogue = [
  ...plants.map((p) => ({ id: `crop:${p.name}`, name: p.name, group: "Crops", icon: p.icon, detail: `${p.spacingCm} cm spacing`, crop: p.name, tool: "plant" as EditorTool })),
  ...STRUCTURE_PRESETS.map((p) => ({ id: `structure:${p.kind}`, name: p.label, group: /bed|planter|pot|bag|barrel|tray/.test(p.kind) ? "Beds" : "Structures", icon: p.icon, detail: `${p.widthCm} × ${p.depthCm} cm`, crop: "", tool: "structure" as EditorTool })),
  ...[{ id: "bed", name: "Soil bed", icon: "▤", tool: "bed" }, { id: "path", name: "Path", icon: "↝", tool: "path" }, { id: "fence", name: "Fence", icon: "╫", tool: "fence" }, { id: "trellis", name: "Trellis", icon: "▥", tool: "trellis" }, { id: "tree", name: "Tree", icon: "♧", tool: "tree" }].map((p) => ({ ...p, id: `tool:${p.id}`, group: p.tool === "bed" ? "Beds" : "Structures", crop: "", detail: "Choose size, then place in the garden", tool: p.tool as EditorTool })),
];
export type AddEntry = typeof addCatalogue[number];
export function readAddLibrary(raw: string | null): { favourites: string[]; recent: string[] } {
  if (!raw) return { favourites: [], recent: [] };
  const value = JSON.parse(raw), valid = new Set(addCatalogue.map((p) => p.id));
  if (!value || !Array.isArray(value.favourites) || !Array.isArray(value.recent)) throw new Error("Cannot read your saved favourites.");
  return { favourites: [...new Set<string>(value.favourites.filter((id: unknown) => typeof id === "string" && valid.has(id)))].slice(0, 100), recent: [...new Set<string>(value.recent.filter((id: unknown) => typeof id === "string" && valid.has(id)))].slice(0, 8) };
}
export function planChangeMessage(before: PlannerPlan, next: PlannerPlan) {
  const count = (p: PlannerPlan) => [...p.plantingAreas, ...p.rows].reduce((n, g) => n + g.count, 0);
  const delta = count(next) - count(before);
  if (delta) return `${Math.abs(delta)} ${Math.abs(delta) === 1 ? "plant" : "plants"} ${delta > 0 ? "added" : "removed"}`;
  const beds = next.beds.length - before.beds.length;
  if (beds) return `${Math.abs(beds)} ${Math.abs(beds) === 1 ? "bed" : "beds"} ${beds > 0 ? "added" : "removed"}`;
  if (JSON.stringify(before.objectLocks) !== JSON.stringify(next.objectLocks)) return "Object locks updated";
  return "Garden updated";
}
