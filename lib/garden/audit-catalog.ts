import type { PlannerBed, PlannerLayoutObject } from "./planner-plan";
import type { PlantIconSprite } from "./plant-icons";

export type AuditEntry = {
  id: string;
  name: string;
  variety: string;
  category: string;
  source: string[];
  kind: "plant" | "structure" | "bed" | "trellis" | "path" | "tree" | "row" | "text" | "boundary" | "decor" | "demo" | "asset";
  spacingCm?: number;
  artwork?: PlantIconSprite;
  assetExists?: boolean;
  bed?: PlannerBed;
  object?: PlannerLayoutObject;
  dimensions?: string;
};

export type AuditCatalogue = {
  entries: AuditEntry[];
  assets: string[];
  plannerCrops: number;
  registryCrops: number;
  sourceNotes: string[];
};

export function auditSeed(value: string) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
