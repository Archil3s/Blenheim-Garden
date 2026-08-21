"use client";

import { useEffect } from "react";

const emojiToCrop: Record<string, string> = {
  "🍅": "tomato",
  "🍓": "strawberry",
  "🫘": "bean",
  "🥬": "lettuce",
  "🎃": "pumpkin",
  "🥕": "carrot",
  "🥦": "broccoli",
  "🔴": "raspberry",
  "🫐": "blueberry",
  "🌿": "herbs",
};

function cropFromText(text: string | null | undefined) {
  if (!text) return null;
  for (const [emoji, crop] of Object.entries(emojiToCrop)) {
    if (text.includes(emoji)) return crop;
  }
  return null;
}

function markElement(element: HTMLElement, crop: string | null) {
  if (!crop) return;
  if (element.dataset.plantMarker === crop) return;
  element.dataset.plantMarker = crop;
}

function enhancePlantingAreas(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".planting-area").forEach((area) => {
    const crop = cropFromText(area.querySelector(".planting-area-label")?.textContent)
      ?? cropFromText(area.querySelector(".planting-area-icons i")?.textContent);
    if (!crop) return;

    area.dataset.plantMarker = crop;
    area.querySelectorAll<HTMLElement>(".planting-area-icons i").forEach((icon) => markElement(icon, crop));
  });
}

function enhanceRows(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".planting-row").forEach((row) => {
    const crop = cropFromText(row.querySelector(".row-caption")?.textContent);
    if (!crop) return;

    row.dataset.plantMarker = crop;
    row.querySelectorAll<HTMLElement>(".row-dots i").forEach((dot) => markElement(dot, crop));
  });
}

function enhanceCatalogue(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".gv-plant-icon").forEach((icon) => {
    markElement(icon, cropFromText(icon.textContent));
  });

  const readyIcon = root.querySelector<HTMLElement>(".gv-ready-strip > span");
  if (readyIcon) markElement(readyIcon, cropFromText(readyIcon.textContent));
}

function enhancePlacementGhosts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".gv-click-place-ghost-icons i, .gv-row-draw-dots i").forEach((icon) => {
    markElement(icon, cropFromText(icon.textContent));
  });
}

function enhance(root: ParentNode = document) {
  enhancePlantingAreas(root);
  enhanceRows(root);
  enhanceCatalogue(root);
  enhancePlacementGhosts(root);
}

export function BotanicalPlantIconsBridge() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        enhance(document);
      });
    };

    enhance(document);

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
