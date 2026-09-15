"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import {
  DEFAULT_GARDEN_ID,
  LIVE_PLAN_EVENT,
  LIVE_PLAN_PREFIX,
  gardenLivePlanKey,
  readActiveGardenId,
} from "@/lib/garden/active-garden";

const loading = () => (
  <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#dce5df", color: "#2d473e", fontFamily: "Arial, Helvetica, sans-serif" }}>
    <div style={{ textAlign: "center" }}>
      <strong style={{ display: "block", marginBottom: 8 }}>Loading visual 3D garden…</strong>
      <span style={{ fontSize: 12, color: "#6e7b75" }}>Building the garden, crops and structures.</span>
    </div>
  </main>
);

const GardenWebGLVisual = dynamic(
  () => import("@/components/garden-webgl-visual").then((module) => module.GardenWebGLVisual),
  { ssr: false, loading },
);

function gardenIdFromLiveKey(key: string | null) {
  if (!key) return null;
  if (key === LIVE_PLAN_PREFIX) return DEFAULT_GARDEN_ID;
  const prefix = `${LIVE_PLAN_PREFIX}:`;
  return key.startsWith(prefix) ? key.slice(prefix.length) || null : null;
}

function parsePlan(value: string | null): PlannerPlan | null {
  if (!value) return null;
  try {
    const plan = JSON.parse(value) as Partial<PlannerPlan>;
    if (!Array.isArray(plan.beds) || !Array.isArray(plan.rows)) return null;
    return {
      beds: plan.beds,
      plantingAreas: Array.isArray(plan.plantingAreas) ? plan.plantingAreas : [],
      rows: plan.rows,
      objects: Array.isArray(plan.objects) ? plan.objects : [],
    };
  } catch {
    return null;
  }
}

function selectedGardenId() {
  const fromQuery = new URL(window.location.href).searchParams.get("gardenId")?.trim();
  return fromQuery || readActiveGardenId();
}

function dispatchLivePlan(gardenId: string, plan: PlannerPlan) {
  window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: { gardenId, plan } }));
}

function LivePlanCrossTabBridge() {
  useEffect(() => {
    const syncCurrent = () => {
      const gardenId = selectedGardenId();
      const plan = parsePlan(window.localStorage.getItem(gardenLivePlanKey(gardenId)));
      if (plan) dispatchLivePlan(gardenId, plan);
    };

    const onStorage = (event: StorageEvent) => {
      const gardenId = gardenIdFromLiveKey(event.key);
      if (!gardenId) return;
      const plan = parsePlan(event.newValue);
      if (plan) dispatchLivePlan(gardenId, plan);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncCurrent);
    window.addEventListener("pageshow", syncCurrent);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncCurrent);
      window.removeEventListener("pageshow", syncCurrent);
    };
  }, []);

  return null;
}

export default function Garden3DClient() {
  return <><LivePlanCrossTabBridge /><GardenWebGLVisual /></>;
}
