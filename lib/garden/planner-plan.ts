export type PlannerBed = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  crop?: string;
  cropIcon?: string;
  cropCount?: number;
  variety?: string;
  spacingCm?: number;
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

export type PlannerText = {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

export type PlannerLayoutObject = PlannerPath | PlannerTrellis | PlannerTree | PlannerText;

export type PlannerPlan = {
  beds: PlannerBed[];
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
