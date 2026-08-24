"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { LIVE_PLAN_EVENT, gardenLivePlanKey, readActiveGardenId } from "@/lib/garden/active-garden";

const EMPTY_PLAN: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

const GardenWorkspace3D = dynamic(
  () => import("@/components/garden-workspace-3d").then((module) => module.GardenWorkspace3D),
  {
    ssr: false,
    loading: () => <div className="gv-inline-3d-loading">Starting 3D garden…</div>,
  },
);

function readLivePlan() {
  if (typeof window === "undefined") return EMPTY_PLAN;
  try {
    const gardenId = readActiveGardenId();
    const parsed = JSON.parse(localStorage.getItem(gardenLivePlanKey(gardenId)) ?? "null") as Partial<PlannerPlan> | null;
    if (!parsed || !Array.isArray(parsed.beds) || !Array.isArray(parsed.rows)) return EMPTY_PLAN;
    return {
      beds: parsed.beds,
      plantingAreas: Array.isArray(parsed.plantingAreas) ? parsed.plantingAreas : [],
      rows: parsed.rows,
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    } satisfies PlannerPlan;
  } catch {
    return EMPTY_PLAN;
  }
}

export function GardenViewModeBridge() {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [plan, setPlan] = useState<PlannerPlan>(() => readLivePlan());
  const [quickHost, setQuickHost] = useState<HTMLElement | null>(null);
  const [stageHost, setStageHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const locate = () => {
      const nextQuick = document.querySelector<HTMLElement>(".gv-quick-center");
      const nextStage = document.querySelector<HTMLElement>(".gv-stage");
      if (nextQuick) setQuickHost((current) => current === nextQuick ? current : nextQuick);
      if (nextStage) setStageHost((current) => current === nextStage ? current : nextStage);
    };

    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onLivePlan = (event: Event) => {
      const detail = (event as CustomEvent<{ gardenId?: string; plan?: PlannerPlan }>).detail;
      if (!detail?.plan || detail.gardenId !== readActiveGardenId()) return;
      setPlan(detail.plan);
    };
    window.addEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
    return () => window.removeEventListener(LIVE_PLAN_EVENT, onLivePlan as EventListener);
  }, []);

  useEffect(() => {
    const app = document.querySelector<HTMLElement>(".gv-app");
    if (!app) return;
    app.classList.toggle("gv-view-3d", mode === "3d");
    return () => app.classList.remove("gv-view-3d");
  }, [mode]);

  const switchMode = (next: "2d" | "3d") => {
    if (next === "3d") setPlan(readLivePlan());
    setMode(next);
  };

  return (
    <>
      {quickHost && createPortal(
        <div className="gv-view-toggle" role="group" aria-label="Garden view">
          <button type="button" className={mode === "2d" ? "active" : ""} aria-pressed={mode === "2d"} onClick={() => switchMode("2d")}>2D</button>
          <button type="button" className={mode === "3d" ? "active" : ""} aria-pressed={mode === "3d"} onClick={() => switchMode("3d")}>3D</button>
        </div>,
        quickHost,
      )}
      {stageHost && mode === "3d" && createPortal(
        <div
          className="gv-inline-3d-root"
          data-testid="inline-3d-root"
          data-bed-count={plan.beds.length}
          data-planting-count={plan.plantingAreas.length}
        >
          <GardenWorkspace3D plan={plan} />
        </div>,
        stageHost,
      )}
    </>
  );
}
