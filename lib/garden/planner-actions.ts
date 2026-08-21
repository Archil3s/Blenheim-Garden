export const PLANNER_CROP_REQUEST_EVENT = "blenheim-garden:plan-crop";

export type PlannerCropRequest = {
  crop: string;
  month: string;
};

export function requestPlannerCrop(detail: PlannerCropRequest) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PlannerCropRequest>(PLANNER_CROP_REQUEST_EVENT, { detail }));
}
