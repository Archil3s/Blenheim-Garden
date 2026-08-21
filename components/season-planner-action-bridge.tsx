"use client";

import { useEffect } from "react";
import {
  PLANNER_CROP_REQUEST_EVENT,
  type PlannerCropRequest,
} from "@/lib/garden/planner-actions";

function afterFrames(frames: number, callback: () => void) {
  if (frames <= 0) {
    callback();
    return;
  }
  window.requestAnimationFrame(() => afterFrames(frames - 1, callback));
}

function toolButton(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
    .find((button) => button.querySelector("small")?.textContent?.trim() === label) ?? null;
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setNativeSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function syncPlannerMonth(month: string) {
  const select = document.querySelector<HTMLSelectElement>(".gv-quick-center select");
  if (!select || !Array.from(select.options).some((option) => option.value === month || option.text === month)) return;
  setNativeSelectValue(select, month);
}

function clearPlantFilters() {
  const filters = document.querySelector<HTMLElement>(".gv-filters");
  if (!filters) return;

  const search = filters.querySelector<HTMLInputElement>("input");
  if (search && search.value) setNativeInputValue(search, "");

  const type = filters.querySelector<HTMLSelectElement>("select");
  if (type && type.value !== "All Plants") setNativeSelectValue(type, "All Plants");
}

function chooseCropButton(crop: string, requestId: number, getRequestId: () => number, attempt = 0) {
  if (requestId !== getRequestId()) return;

  const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
    .find((candidate) => candidate.querySelector("strong")?.textContent?.trim().toLowerCase() === crop.toLowerCase());

  if (button) {
    button.click();
    button.scrollIntoView({ block: "nearest" });
    button.focus({ preventScroll: true });
    return;
  }

  if (attempt < 8) {
    window.requestAnimationFrame(() => chooseCropButton(crop, requestId, getRequestId, attempt + 1));
  }
}

function selectParentBedOfCurrentPlanting(done: () => void) {
  const selectedPlanting = document.querySelector<HTMLElement>(".planting-area.selected");
  const bed = selectedPlanting?.closest<HTMLElement>(".plan-bed");
  if (!bed) {
    done();
    return;
  }

  toolButton("Select")?.click();
  afterFrames(2, () => {
    const rect = bed.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    const pointerId = 913;

    bed.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      clientX,
      clientY,
      pointerId,
      pointerType: "mouse",
      isPrimary: true,
      buttons: 1,
    }));

    afterFrames(2, () => {
      window.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true,
        clientX,
        clientY,
        pointerId,
        pointerType: "mouse",
        isPrimary: true,
        buttons: 0,
      }));
      afterFrames(1, done);
    });
  });
}

export function SeasonPlannerActionBridge() {
  useEffect(() => {
    let latestRequestId = 0;

    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<PlannerCropRequest>).detail;
      if (!detail?.crop) return;

      latestRequestId += 1;
      const requestId = latestRequestId;
      const getRequestId = () => latestRequestId;

      const openCrop = () => {
        if (requestId !== latestRequestId) return;
        syncPlannerMonth(detail.month);
        toolButton("Plants")?.click();

        afterFrames(2, () => {
          if (requestId !== latestRequestId) return;
          clearPlantFilters();
          afterFrames(2, () => chooseCropButton(detail.crop, requestId, getRequestId));
        });
      };

      // A selected planting keeps the planting inspector visible while the Plants
      // tool is active. Select its parent bed first so the normal crop catalogue opens.
      if (document.querySelector(".planting-area.selected")) selectParentBedOfCurrentPlanting(openCrop);
      else openCrop();
    };

    window.addEventListener(PLANNER_CROP_REQUEST_EVENT, handleRequest);
    return () => window.removeEventListener(PLANNER_CROP_REQUEST_EVENT, handleRequest);
  }, []);

  return null;
}
