export type PlannerBed = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Legacy one-crop-per-bed fields are kept only so old local plans can migrate.
  crop?: string;
  cropIcon?: string;
  cropCount?: number;
  variety?: string;
  spacingCm?: number;
};

export type PlannerPlantingPattern = "grid" | "staggered" | "rows" | "natural" | "single";
export type PlannerVisualSpacing = "tight" | "normal" | "wide";

export type PlannerPlantingArea = {
  id: string;
  plantingId?: string;
  bedId: number;
  crop: string;
  cropIcon: string;
  variety: string;
  spacingCm: number;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  pattern: PlannerPlantingPattern;
  iconSize: number;
  visualSpacing: PlannerVisualSpacing;
};

export type PlannerRow = {
  id: string;
  crop: string;
  cropIcon: string;
  variety: string;
  spacingCm: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  count: number;
};

export type PlannerPath = {
  id: string;
  type: "path";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  widthCm: number;
  label?: string;
};

export type PlannerTrellis = {
  id: string;
  type: "trellis";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  heightCm: number;
  postSpacingCm: number;
  label?: string;
};

export type PlannerTree = {
  id: string;
  type: "tree";
  x: number;
  y: number;
  diameterCm: number;
  label?: string;
};

export type PlannerStructureKind =
  | "greenhouse"
  | "polytunnel"
  | "shed"
  | "cold-frame"
  | "compost-bin"
  | "water-tank"
  | "rain-barrel"
  | "potting-bench"
  | "pergola"
  | "garden-arch"
  | "chicken-coop"
  | "beehive"
  | "cattle-panel-arch"
  | "bean-arch"
  | "cucumber-arch"
  | "hoop-arch"
  | "a-frame-trellis"
  | "low-hoop-frame"
  | "insect-net-tunnel"
  | "bird-net-frame"
  | "frost-cloth-tunnel"
  | "shade-cloth-frame"
  | "cloche"
  | "row-cover-hoops"
  | "pot"
  | "grow-bag"
  | "planter-box"
  | "trough-planter"
  | "half-barrel"
  | "wicking-bed"
  | "seed-tray"
  | "raised-bed-timber"
  | "raised-bed-corrugated"
  | "raised-bed-round"
  | "raised-bed-square"
  | "keyhole-bed";

export type PlannerStructure = {
  id: string;
  type: "structure";
  kind: PlannerStructureKind;
  x: number;
  y: number;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  rotationDeg: number;
  label?: string;
};

export type PlannerText = {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

export type PlannerLayoutObject = PlannerPath | PlannerTrellis | PlannerTree | PlannerStructure | PlannerText;

export type PlannerPlan = {
  beds: PlannerBed[];
  plantingAreas: PlannerPlantingArea[];
  rows: PlannerRow[];
  objects: PlannerLayoutObject[];
};

export type GardenPlanApiResponse = {
  ok: boolean;
  plan?: PlannerPlan;
  source?: "d1";
  savedAt?: string;
  error?: string;
};
