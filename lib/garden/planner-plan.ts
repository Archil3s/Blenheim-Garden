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

export type PlannerPlan = {
  beds: PlannerBed[];
  rows: PlannerRow[];
};

export type GardenPlanApiResponse = {
  ok: boolean;
  plan?: PlannerPlan;
  source?: "d1";
  savedAt?: string;
  error?: string;
};
