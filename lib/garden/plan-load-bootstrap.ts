import { ACTIVE_GARDEN_KEY, DEFAULT_GARDEN_ID, LIVE_PLAN_PREFIX, LOCAL_PLAN_PREFIX } from "@/lib/garden/active-garden";

declare global {
  interface Window {
    gardenPlanRequest?: { id: string; response: Promise<Response | null> };
  }
}

// Start the saved-plan request while the browser loads the planner bundle.
export const gardenPlanBootstrap = `(() => {
  try {
    const id = new URLSearchParams(location.search).get("gardenId")?.trim() ||
      localStorage.getItem(${JSON.stringify(ACTIVE_GARDEN_KEY)})?.trim() || ${JSON.stringify(DEFAULT_GARDEN_ID)};
    const suffix = id === ${JSON.stringify(DEFAULT_GARDEN_ID)} ? "" : ":" + id;
    if (localStorage.getItem(${JSON.stringify(LIVE_PLAN_PREFIX)} + suffix) ||
        localStorage.getItem(${JSON.stringify(LOCAL_PLAN_PREFIX)} + suffix)) return;
    window.gardenPlanRequest = {
      id,
      response: fetch("/api/garden?gardenId=" + encodeURIComponent(id), { cache: "no-store" }).catch(() => null)
    };
  } catch {
    // The hydrated planner still loads when browser storage is unavailable.
  }
})();`;
