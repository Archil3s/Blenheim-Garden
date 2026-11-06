"use client";

import { useEffect, useState } from "react";
import { planningPeriodEvent, planningPeriodKey, readPlanningPeriod, type PlanningPeriod } from "@/lib/garden/planting-schedule";

export function usePlanningPeriod(gardenId: string) {
  const [period, setPeriod] = useState<PlanningPeriod>();
  useEffect(() => {
    const sync = () => setPeriod(readPlanningPeriod(gardenId));
    queueMicrotask(sync);
    const onStorage = (event: StorageEvent) => { if (event.key === planningPeriodKey(gardenId)) sync(); };
    window.addEventListener(planningPeriodEvent, sync);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(planningPeriodEvent, sync); window.removeEventListener("storage", onStorage); };
  }, [gardenId]);
  return period;
}
