"use client";

import { useEffect } from "react";

const cropIcons: Record<string, string> = {
  "🍅": "Tomato",
  "🍓": "Strawberry",
  "🫘": "Bean",
  "🥬": "Lettuce",
  "🎃": "Pumpkin",
  "🥕": "Carrot",
  "🥦": "Broccoli",
  "🔴": "Raspberry",
  "🫐": "Blueberry",
  "🌿": "Herbs",
};

function cropFromText(text: string) {
  for (const [icon, crop] of Object.entries(cropIcons)) {
    if (text.includes(icon)) return crop;
  }
  return null;
}

function decorateCrops() {
  document.querySelectorAll<HTMLElement>(".gv-plant-list > button").forEach((button) => {
    const crop = button.querySelector("strong")?.textContent?.trim();
    if (crop) button.dataset.crop = crop;
  });

  document.querySelectorAll<HTMLElement>(".planting-area").forEach((area) => {
    const text = area.querySelector(".planting-area-icons i")?.textContent ?? area.textContent ?? "";
    const crop = cropFromText(text);
    if (crop) area.dataset.crop = crop;
  });

  document.querySelectorAll<HTMLElement>(".planting-row").forEach((row) => {
    const crop = cropFromText(row.textContent ?? "");
    if (crop) row.dataset.crop = crop;
  });

  const ready = document.querySelector<HTMLElement>(".gv-ready-strip");
  if (ready) {
    const crop = cropFromText(ready.textContent ?? "");
    if (crop) ready.dataset.crop = crop;
  }
}

function zoomValue() {
  const label = document.querySelector<HTMLElement>(".gv-quick-center strong");
  return Number.parseInt(label?.textContent ?? "90", 10) || 90;
}

function decorateZoom() {
  const app = document.querySelector<HTMLElement>(".gv-app");
  if (!app) return;
  const zoom = zoomValue();
  app.dataset.zoom = String(zoom);
  app.dataset.zoomTier = zoom < 80 ? "low" : zoom < 110 ? "medium" : "high";
}

function fitToWidth() {
  const stage = document.querySelector<HTMLElement>(".gv-stage-scroll");
  const quick = document.querySelector<HTMLElement>(".gv-quick-center");
  if (!stage || !quick) return;

  const minus = Array.from(quick.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim() === "−");
  const plus = Array.from(quick.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim() === "+");
  if (!minus || !plus) return;

  const current = zoomValue();
  const usableWidth = Math.max(450, stage.clientWidth - 88);
  const target = Math.min(150, Math.max(50, Math.round((usableWidth / 900) * 10) * 10));
  const button = target > current ? plus : minus;
  const clicks = Math.min(10, Math.round(Math.abs(target - current) / 10));
  for (let index = 0; index < clicks; index += 1) button.click();
}

function ensureFitButton() {
  const quick = document.querySelector<HTMLElement>(".gv-quick-center");
  if (!quick || quick.querySelector(".gv-fit-width")) return;

  const plus = Array.from(quick.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.trim() === "+");
  if (!plus) return;

  const fit = document.createElement("button");
  fit.type = "button";
  fit.className = "gv-fit-width";
  fit.textContent = "Fit";
  fit.title = "Fit garden to the available workspace width";
  fit.addEventListener("click", fitToWidth);
  plus.before(fit);
}

function ensureAdvancedLayoutToggle() {
  const context = document.querySelector<HTMLElement>(".gv-context");
  const modebar = context?.querySelector<HTMLElement>(".gv-v4-modebar");
  if (!context || !modebar || context.querySelector(".gv-advanced-layout-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "gv-advanced-layout-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "Advanced layout <span>⌄</span>";
  toggle.addEventListener("click", () => {
    const expanded = context.classList.toggle("gv-layout-expanded");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.innerHTML = expanded ? "Hide layout <span>⌃</span>" : "Advanced layout <span>⌄</span>";
  });
  modebar.before(toggle);
}

export function GrowVegVisualPolishBridge() {
  useEffect(() => {
    const decorate = () => {
      ensureFitButton();
      ensureAdvancedLayoutToggle();
      decorateCrops();
      decorateZoom();
    };

    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onResize = () => decorateZoom();
    window.addEventListener("resize", onResize);

    const initialFit = window.setTimeout(() => {
      const app = document.querySelector<HTMLElement>(".gv-app");
      if (window.innerWidth >= 1100 && app && !app.dataset.autoFitApplied) {
        app.dataset.autoFitApplied = "true";
        fitToWidth();
      }
    }, 350);

    return () => {
      window.clearTimeout(initialFit);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
