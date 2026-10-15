import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import type { PlannerPlan, PlannerStructure, PlannerStructureKind } from "./planner-plan";

type Point = { x: number; y: number };
export type PlantingSurface = {
  id: string; kind: "bed" | "object"; label: string;
  x: number; y: number; width: number; depth: number; rotation: number;
  height: number; shape: "rectangle" | "circle" | "keyhole" | "cells";
  structure?: PlannerStructure;
};

const containers = new Set<PlannerStructureKind>([
  "raised-bed-timber", "raised-bed-corrugated", "raised-bed-round", "raised-bed-square",
  "keyhole-bed", "wicking-bed", "planter-box", "trough-planter", "pot", "grow-bag", "half-barrel", "seed-tray",
]);

export const openGardenCovers = new Set<PlannerStructureKind>([
  "greenhouse", "polytunnel", "cold-frame", "pergola", "garden-arch", "cattle-panel-arch", "bean-arch", "cucumber-arch", "hoop-arch",
  "a-frame-trellis", "hoop-tunnel", "low-hoop-frame", "insect-net-tunnel", "bird-net-frame", "frost-cloth-tunnel", "shade-cloth-frame", "cloche", "row-cover-hoops",
]);

export function isPlantableStructure(object: PlannerPlan["objects"][number]): object is PlannerStructure {
  return object.type === "structure" && containers.has(object.kind);
}

export function structureSurface(object: PlannerStructure): PlantingSurface {
  const kind = object.kind;
  const circular = ["pot", "grow-bag", "half-barrel", "raised-bed-round", "keyhole-bed"].includes(kind);
  const factor = kind === "pot" ? .72 : kind === "raised-bed-round" ? .82 : kind === "keyhole-bed" ? .78 : .84;
  const wall = Math.max(5.5, Math.min(11, Math.min(object.widthCm, object.depthCm) * .09));
  const width = circular ? Math.min(object.widthCm, object.depthCm) * factor : object.widthCm - wall * 2;
  const depth = circular ? width : object.depthCm - wall * 2;
  // Structure roots are 2 cm above ground; match each visible soil mesh's top.
  const soil = kind === "half-barrel" ? object.heightCm + 3.1
    : kind === "raised-bed-round" || kind === "keyhole-bed" ? object.heightCm + 3.55
    : kind === "pot" || kind === "grow-bag" ? object.heightCm + 2.45
    : kind === "seed-tray" ? Math.max(4, object.heightCm) + 2.1
    : object.heightCm * .78 + 2.5;
  return { id: object.id, kind: "object", label: object.label || kind.replaceAll("-", " "),
    x: object.x, y: object.y, width, depth, rotation: object.rotationDeg,
    height: (soil + 2) / 100, shape: kind === "seed-tray" ? "cells" : kind === "keyhole-bed" ? "keyhole" : circular ? "circle" : "rectangle", structure: object };
}

export function plantingSurfaces(plan: PlannerPlan): PlantingSurface[] {
  const { width, height } = gardenDimensions(plan);
  return [...plan.objects.filter(isPlantableStructure).map(structureSurface), ...plan.beds.map((bed): PlantingSurface => ({
    id: String(bed.id), kind: "bed", label: bed.name, x: (bed.x + bed.w / 2) * width / 100, y: (bed.y + bed.h / 2) * height / 100,
    width: Math.max(1, bed.w * width / 100 - 22), depth: Math.max(1, bed.h * height / 100 - 22), rotation: 0, height: .31, shape: "rectangle",
  }))].sort((a, b) => b.height - a.height);
}

export function surfaceLocal(surface: Pick<PlantingSurface, "x" | "y" | "rotation">, point: Point): Point {
  const angle = surface.rotation * Math.PI / 180, dx = point.x - surface.x, dy = point.y - surface.y;
  return { x: dx * Math.cos(angle) + dy * Math.sin(angle), y: -dx * Math.sin(angle) + dy * Math.cos(angle) };
}

export function surfaceWorld(surface: Pick<PlantingSurface, "x" | "y" | "rotation">, point: Point): Point {
  const angle = surface.rotation * Math.PI / 180;
  return { x: surface.x + point.x * Math.cos(angle) - point.y * Math.sin(angle), y: surface.y + point.x * Math.sin(angle) + point.y * Math.cos(angle) };
}

export function surfaceContains(surface: PlantingSurface, point: Point, margin = 0): boolean {
  const local = surfaceLocal(surface, point), halfW = surface.width / 2 - margin, halfD = surface.depth / 2 - margin;
  if (halfW <= 0 || halfD <= 0) return false;
  if (surface.shape === "circle" || surface.shape === "keyhole") {
    if ((local.x / halfW) ** 2 + (local.y / halfD) ** 2 > 1 + 1e-8) return false;
    if (surface.shape === "keyhole") {
      const radius = Math.min(surface.structure!.widthCm, surface.structure!.depthCm) / 2;
      if (Math.hypot(local.x, local.y) < radius * .18 + margin || (Math.abs(local.x) < radius * .21 + margin && local.y > radius * .23 - margin)) return false;
    }
    return true;
  }
  if (surface.shape === "cells") {
    const { widthCm: w, depthCm: d } = surface.structure!;
    const radius = Math.min(w / 5, d / 3) * .22 - margin;
    for (let col = 0; col < 5; col++) for (let row = 0; row < 3; row++) {
      if (radius > 0 && Math.hypot(local.x - (-w * .4 + w * .8 * col / 4), local.y - (-d * .34 + d * .68 * row / 2)) <= radius) return true;
    }
    return false;
  }
  return Math.abs(local.x) <= halfW + 1e-8 && Math.abs(local.y) <= halfD + 1e-8;
}

export function surfaceAt(plan: PlannerPlan, point: Point): PlantingSurface | undefined {
  return plantingSurfaces(plan).find((surface) => surfaceContains(surface, point));
}

export function plantingPointBlocked(plan: PlannerPlan, point: Point): boolean {
  const { width, height } = gardenDimensions(plan);
  if (point.x < 0 || point.x > width || point.y < 0 || point.y > height) return true;
  const surface = surfaceAt(plan, point);
  for (const object of plan.objects) {
    if (object.type === "structure" && !openGardenCovers.has(object.kind)) {
      const local = surfaceLocal({ ...object, rotation: object.rotationDeg }, point);
      if (Math.abs(local.x) <= object.widthCm / 2 && Math.abs(local.y) <= object.depthCm / 2
        && !(surface?.kind === "object" && surface.id === object.id)) return true;
    }
    if (object.type === "path") {
      const dx = object.x2 - object.x1, dy = object.y2 - object.y1;
      const t = Math.max(0, Math.min(1, ((point.x - object.x1) * dx + (point.y - object.y1) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(point.x - object.x1 - t * dx, point.y - object.y1 - t * dy) < object.widthCm / 2 && !surface) return true;
    }
  }
  // Bed walls are selectable, but are not planting soil.
  return !surface && plan.beds.some((bed) => point.x >= bed.x * width / 100 && point.x <= (bed.x + bed.w) * width / 100 && point.y >= bed.y * height / 100 && point.y <= (bed.y + bed.h) * height / 100);
}
