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
      ensureAdvancedLayoutToggle();
      decorateCrops();
      decorateZoom();
    };

    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
