import type { GardenPlanApiResponse, PlannerPlan } from "./planner-plan";
import { LIVE_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey } from "./active-garden";

export const editKeySession = "blenheim-garden-edit-key";

export function publishGardenPlan(gardenId: string, plan: PlannerPlan, source: string) {
  localStorage.setItem(gardenLivePlanKey(gardenId), JSON.stringify(plan));
  window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: { gardenId, plan, source } }));
}

export async function persistGardenPlan(gardenId: string, plan: PlannerPlan) {
  localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(plan));
  const editKey = sessionStorage.getItem(editKeySession)?.trim();
  if (!editKey) return "local" as const;
  const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(gardenId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
    body: JSON.stringify({ plan }),
  });
  const result = await response.json() as GardenPlanApiResponse;
  if (!response.ok || !result.ok) {
    if (response.status === 401) sessionStorage.removeItem(editKeySession);
    throw new Error(result.error || "Unable to save the garden.");
  }
  return "cloud" as const;
}
