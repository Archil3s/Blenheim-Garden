"use client";

import { useEffect } from "react";

const LOCAL_PLAN_KEY = "blenheim-garden-plan";

function hasPlantingsWaitingForCloudIds() {
  try {
    const plan = JSON.parse(localStorage.getItem(LOCAL_PLAN_KEY) ?? "null") as {
      plantingAreas?: Array<{ plantingId?: string | null }>;
    } | null;
    return Boolean(plan?.plantingAreas?.some((area) => !area.plantingId));
  } catch {
    return false;
  }
}

export function NewPlantingSaveRefreshBridge() {
  useEffect(() => {
    let poll: number | null = null;

    function stopPolling() {
      if (poll !== null) window.clearInterval(poll);
      poll = null;
    }

    function onClick(event: MouseEvent) {
      const save = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".gv-save");
      if (!save) return;

      window.setTimeout(() => {
        if (!hasPlantingsWaitingForCloudIds()) return;
        stopPolling();
        let checks = 0;
        poll = window.setInterval(() => {
          checks += 1;
          const currentSave = document.querySelector<HTMLButtonElement>(".gv-save");
          if (currentSave?.textContent?.includes("Saved ✓")) {
            stopPolling();
            window.location.reload();
            return;
          }
          if (checks >= 80 || currentSave?.textContent?.includes("Local only")) stopPolling();
        }, 125);
      }, 0);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      stopPolling();
    };
  }, []);

  return null;
}
