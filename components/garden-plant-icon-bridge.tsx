"use client";

import { useEffect } from "react";
import {
  plantIconBackground,
  plantIconFor,
  plantIconForText,
  type PlantIconDefinition,
} from "@/lib/garden/plant-icon-registry";

const ART_ATTR = "data-garden-plant-art";

function setArt(host: HTMLElement | null, icon: PlantIconDefinition | null, compact = false) {
  if (!host || !icon) return;
  let art = host.querySelector<HTMLElement>(`:scope > span[${ART_ATTR}]`);
  if (art?.dataset.slug === icon.slug) return;

  if (!art) {
    art = document.createElement("span");
    art.setAttribute(ART_ATTR, "true");
    art.setAttribute("aria-hidden", "true");
    host.appendChild(art);
  }

  art.dataset.slug = icon.slug;
  host.style.position = host.style.position || "relative";
  host.style.overflow = "hidden";
  host.style.textIndent = "-9999px";
  Object.assign(art.style, plantIconBackground(icon), compact ? {
    position: "absolute",
    width: "1.35em",
    height: "1.35em",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    filter: "drop-shadow(0 1px 1px rgba(22, 48, 36, .18))",
    zIndex: "2",
  } : {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    filter: "drop-shadow(0 1px 1px rgba(22, 48, 36, .18))",
    zIndex: "2",
  });
}

function setInlineArt(host: HTMLElement, icon: PlantIconDefinition) {
  let art = host.querySelector<HTMLElement>(`:scope > span[${ART_ATTR}]`);
  if (!art) {
    art = document.createElement("span");
    art.setAttribute(ART_ATTR, "true");
    art.setAttribute("aria-hidden", "true");
    host.prepend(art);
  }
  if (art.dataset.slug === icon.slug) return;

  art.dataset.slug = icon.slug;
  Object.assign(art.style, plantIconBackground(icon), {
    display: "inline-block",
    width: "1.35em",
    height: "1.35em",
    marginRight: "2px",
    verticalAlign: "middle",
    pointerEvents: "none",
    filter: "drop-shadow(0 1px 1px rgba(22, 48, 36, .18))",
  });
}

function detailValue(panel: HTMLElement, label: string) {
  return Array.from(panel.querySelectorAll("dl > div")).find((row) =>
    row.querySelector("dt")?.textContent?.trim() === label,
  )?.querySelector("dd")?.textContent?.trim() ?? "";
}

function decoratePlantingAreas() {
  document.querySelectorAll<HTMLElement>(".planting-area").forEach((area) => {
    const crop = area.dataset.crop || "";
    const variety = area.querySelector<HTMLElement>(".gv-crop-name")?.textContent?.trim() || "";
    const icon = plantIconFor(crop, variety);
    if (!icon) return;

    area.dataset.plantIcon = icon.slug;
    area.querySelectorAll<HTMLElement>(".planting-area-icons i").forEach((host) => setArt(host, icon));
    setArt(area.querySelector<HTMLElement>(".gv-crop-symbol"), icon, true);
  });
}

function decorateCatalog() {
  document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button").forEach((button) => {
    const crop = button.querySelector("strong")?.textContent?.trim() || "";
    const icon = plantIconFor(crop);
    if (!icon) return;
    button.dataset.plantIcon = icon.slug;
    setArt(button.querySelector<HTMLElement>(".gv-plant-icon"), icon, true);
  });

  const ready = document.querySelector<HTMLElement>(".gv-ready-strip");
  if (ready) {
    const crop = document.querySelector<HTMLButtonElement>(".gv-plant-list > button.active strong")?.textContent?.trim() || "";
    const variety = ready.querySelector("strong")?.textContent?.trim() || "";
    const icon = plantIconFor(crop, variety) ?? plantIconForText(`${crop} ${variety}`);
    if (icon) {
      ready.dataset.plantIcon = icon.slug;
      setArt(ready.querySelector<HTMLElement>(":scope > span"), icon, true);
    }
  }
}

function decorateInspector() {
  document.querySelectorAll<HTMLElement>(".gv-planting-summary").forEach((summary) => {
    const variety = summary.querySelector("strong")?.textContent?.trim() || "";
    const crop = summary.querySelector("small")?.textContent?.split("·")[0]?.trim() || "";
    const icon = plantIconFor(crop, variety) ?? plantIconForText(`${crop} ${variety}`);
    if (icon) setArt(summary.querySelector<HTMLElement>(":scope > span"), icon, true);
  });

  document.querySelectorAll<HTMLElement>(".gv-selection-panel").forEach((panel) => {
    const variety = panel.querySelector(".gv-selection-hero h2")?.textContent?.trim() || "";
    const crop = detailValue(panel, "Crop");
    const icon = plantIconFor(crop, variety) ?? plantIconForText(variety);
    if (icon) setArt(panel.querySelector<HTMLElement>(".gv-selection-hero > span"), icon, true);
  });
}

function decorateRows() {
  document.querySelectorAll<HTMLElement>(".planting-row").forEach((row) => {
    const caption = row.querySelector<HTMLElement>(".row-caption");
    const icon = plantIconForText(caption?.textContent ?? row.textContent);
    if (!caption || !icon) return;
    row.dataset.plantIcon = icon.slug;
    setInlineArt(caption, icon);
  });
}

function decoratePlantIcons() {
  decoratePlantingAreas();
  decorateCatalog();
  decorateInspector();
  decorateRows();
}

export function GardenPlantIconBridge() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(decoratePlantIcons);
    };

    decoratePlantIcons();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "data-crop"],
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return null;
}
