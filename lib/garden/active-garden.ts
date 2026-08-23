export const DEFAULT_GARDEN_ID = "blenheim-garden";
export const ACTIVE_GARDEN_KEY = "blenheim-garden-active-id";
export const LOCAL_PLAN_PREFIX = "blenheim-garden-plan";
export const LIVE_PLAN_PREFIX = "blenheim-garden-live-plan";
export const LIVE_PLAN_EVENT = "blenheim-garden-live-plan-change";

export function gardenLocalPlanKey(gardenId: string) {
  return gardenId === DEFAULT_GARDEN_ID ? LOCAL_PLAN_PREFIX : `${LOCAL_PLAN_PREFIX}:${gardenId}`;
}

export function gardenLivePlanKey(gardenId: string) {
  return gardenId === DEFAULT_GARDEN_ID ? LIVE_PLAN_PREFIX : `${LIVE_PLAN_PREFIX}:${gardenId}`;
}

export function readActiveGardenId() {
  if (typeof window === "undefined") return DEFAULT_GARDEN_ID;
  const value = window.localStorage.getItem(ACTIVE_GARDEN_KEY)?.trim();
  return value || DEFAULT_GARDEN_ID;
}

export function writeActiveGardenId(gardenId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_GARDEN_KEY, gardenId);
}
