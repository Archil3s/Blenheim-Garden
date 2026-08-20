"use client";

import { useEffect, useRef, useState } from "react";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";
const CANVAS_WIDTH = 900;

type LayoutMode = "grid" | "staggered" | "rows" | "natural";
type VisualSpacing = "tight" | "normal" | "wide";

type DragPlant = {
  name: string;
  icon: string;
  spacingCm: number;
  variety: string;
};

type HoverPreview = {
  x: number;
  y: number;
  ringPx: number;
  count: number;
  label: string;
};

type PlantingStyle = {
  bedId: string;
  label: string;
  sortOrder: number;
  iconSize: number;
  density: number;
  pattern: LayoutMode | "single";
  visualSpacing: VisualSpacing;
  autoFit: boolean;
};

type StyleResponse = {
  ok: boolean;
  styles?: PlantingStyle[];
  style?: Partial<PlantingStyle>;
  error?: string;
};

const PLANT_SPACING: Record<string, number> = {
  Tomato: 50,
  Strawberry: 35,
  Bean: 18,
  Lettuce: 28,
  Pumpkin: 105,
  Carrot: 7,
  Broccoli: 50,
  Raspberry: 50,
  Blueberry: 120,
  Herbs: 25,
};

const MODE_LABELS: Array<{ mode: LayoutMode; label: string; hint: string }> = [
  { mode: "grid", label: "Block", hint: "Even block planting" },
  { mode: "staggered", label: "Stagger", hint: "Offset alternate plants" },
  { mode: "rows", label: "Rows", hint: "Organise the bed into rows" },
  { mode: "natural", label: "Natural", hint: "Looser organic layout" },
];

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function selectedVariety() {
  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>(".gv-filters label"));
  const label = labels.find((item) => item.childNodes[0]?.textContent?.trim() === "Variety");
  return label?.querySelector("select")?.value?.trim() || "";
}

function plantFromButton(button: HTMLElement): DragPlant | null {
  const name = button.querySelector("strong")?.textContent?.trim() || "";
  const icon = button.querySelector(".gv-plant-icon")?.textContent?.trim() || "🌱";
  const spacingCm = PLANT_SPACING[name];
  if (!name || !spacingCm) return null;
  return { name, icon, spacingCm, variety: selectedVariety() };
}

function spacingGap(value: VisualSpacing) {
  if (value === "tight") return 1;
  if (value === "wide") return 8;
  return 4;
}

export function PlantPlacementBridge() {
  const modeRef = useRef<LayoutMode>("grid");
  const dragRef = useRef<DragPlant | null>(null);
  const stylesRef = useRef<Map<string, PlantingStyle>>(new Map());
  const syncQueued = useRef(false);
  const [mode, setMode] = useState<LayoutMode>("grid");
  const [drag, setDrag] = useState<DragPlant | null>(null);
  const [hover, setHover] = useState<HoverPreview | null>(null);
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function applyStyle(element: HTMLElement, style: PlantingStyle) {
    element.dataset.plantPattern = style.pattern;
    element.style.setProperty("--plant-icon-size", `${style.iconSize}px`);
    element.style.setProperty("--plant-icon-gap", `${spacingGap(style.visualSpacing)}px`);
  }

  function syncBedIdsAndStyles() {
    const beds = Array.from(document.querySelectorAll<HTMLElement>(".plan-bed"));
    const styles = Array.from(stylesRef.current.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    styles.forEach((style, index) => {
      const bed = beds[index];
      if (!bed) return;
      bed.dataset.plantBedId = style.bedId;
      applyStyle(bed, style);
    });

    const selectedPanel = document.querySelector<HTMLElement>(".gv-selection-panel[data-bed-id]");
    const selectedBed = document.querySelector<HTMLElement>(".plan-bed.selected");
    const selectedId = selectedPanel?.dataset.bedId?.trim();
    if (selectedBed && selectedId) {
      selectedBed.dataset.plantBedId = selectedId;
      const style = stylesRef.current.get(selectedId);
      if (style) applyStyle(selectedBed, style);
    }
  }

  function makeCatalogueDraggable() {
    document.querySelectorAll<HTMLElement>(".gv-plant-list > button").forEach((button) => {
      button.draggable = true;
      button.classList.add("gv-draggable-plant");
      if (!button.querySelector(".gv-drag-grip")) {
        const grip = document.createElement("span");
        grip.className = "gv-drag-grip";
        grip.textContent = "⋮⋮";
        grip.setAttribute("aria-hidden", "true");
        button.appendChild(grip);
      }
    });
  }

  function injectModeBar() {
    const list = document.querySelector<HTMLElement>(".gv-plant-list");
    if (!list) return;
    const panel = list.parentElement;
    if (!panel) return;
    let bar = panel.querySelector<HTMLElement>(".gv-placement-modebar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "gv-placement-modebar";
      const label = document.createElement("span");
      label.textContent = "Layout";
      bar.appendChild(label);
      for (const item of MODE_LABELS) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.mode = item.mode;
        button.textContent = item.label;
        button.title = item.hint;
        button.addEventListener("click", () => {
          modeRef.current = item.mode;
          setMode(item.mode);
          bar?.querySelectorAll("button").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
        });
        bar.appendChild(button);
      }
      list.before(bar);
    }
    bar.querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.classList.toggle("active", button.dataset.mode === modeRef.current));
  }

  function queueSync() {
    if (syncQueued.current) return;
    syncQueued.current = true;
    window.requestAnimationFrame(() => {
      syncQueued.current = false;
      makeCatalogueDraggable();
      injectModeBar();
      syncBedIdsAndStyles();
    });
  }

  async function loadStyles() {
    try {
      const response = await fetch("/api/garden/planting-styles", { cache: "no-store" });
      const data = await response.json() as StyleResponse;
      if (!response.ok || !data.ok) return;
      stylesRef.current = new Map((data.styles ?? []).map((style) => [style.bedId, style]));
      queueSync();
    } catch {
      // Drag-to-plant still works without optional visual style metadata.
    }
  }

  function clearDropState() {
    document.querySelectorAll(".plan-bed.gv-plant-drop-target").forEach((item) => item.classList.remove("gv-plant-drop-target"));
    dragRef.current = null;
    setDrag(null);
    setHover(null);
  }

  async function chooseTool(label: string) {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
      .find((candidate) => candidate.querySelector("small")?.textContent?.trim() === label);
    button?.click();
    await nextFrame();
    await nextFrame();
  }

  async function choosePlant(plant: DragPlant) {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
      .find((candidate) => candidate.querySelector("strong")?.textContent?.trim() === plant.name);
    button?.click();
    await nextFrame();

    if (plant.variety) {
      const labels = Array.from(document.querySelectorAll<HTMLLabelElement>(".gv-filters label"));
      const varietyLabel = labels.find((item) => item.childNodes[0]?.textContent?.trim() === "Variety");
      const select = varietyLabel?.querySelector<HTMLSelectElement>("select");
      if (select && Array.from(select.options).some((option) => option.value === plant.variety)) {
        select.value = plant.variety;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await nextFrame();
      }
    }
  }

  async function plantIntoBed(element: HTMLElement, plant: DragPlant) {
    await chooseTool("Plants");
    await choosePlant(plant);
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      button: 0,
      buttons: 1,
    }));
    await nextFrame();
    await nextFrame();
  }

  async function saveLayoutForSelectedBed(layout: LayoutMode) {
    const panel = document.querySelector<HTMLElement>(".gv-selection-panel[data-bed-id]");
    const bedId = panel?.dataset.bedId?.trim();
    const bed = document.querySelector<HTMLElement>(".plan-bed.selected");
    if (!bedId || !bed) return;

    bed.dataset.plantBedId = bedId;
    const existing = stylesRef.current.get(bedId) ?? {
      bedId,
      label: panel?.querySelector(".gv-selection-hero h2")?.textContent?.trim() || "Bed",
      sortOrder: Number.MAX_SAFE_INTEGER,
      iconSize: 14,
      density: 70,
      pattern: "grid" as const,
      visualSpacing: "normal" as const,
      autoFit: true,
    };
    const next: PlantingStyle = { ...existing, pattern: layout };
    stylesRef.current.set(bedId, next);
    applyStyle(bed, next);

    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      showToast("Planted. Save the plan normally; set your edit key to persist this layout style.");
      return;
    }

    try {
      const response = await fetch("/api/garden/planting-styles", {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
        body: JSON.stringify({
          bedId,
          iconSize: next.iconSize,
          density: next.density,
          pattern: next.pattern,
          visualSpacing: next.visualSpacing,
          autoFit: next.autoFit,
        }),
      });
      const data = await response.json() as StyleResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to save layout style.");
      showToast(`${next.label}: ${layout === "grid" ? "Block" : layout} layout applied`);
    } catch {
      showToast("Plant added. Layout is visible now but could not be cloud-saved yet.");
    }
  }

  useEffect(() => {
    void loadStyles();

    function onDragStart(event: DragEvent) {
      const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(".gv-plant-list > button");
      if (!button) return;
      const plant = plantFromButton(button);
      if (!plant) return;
      dragRef.current = plant;
      setDrag(plant);
      button.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", `${plant.icon} ${plant.name}`);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
    }

    function onDragOver(event: DragEvent) {
      const plant = dragRef.current;
      if (!plant) return;
      const bed = (event.target as HTMLElement | null)?.closest<HTMLElement>(".plan-bed");
      if (!bed) {
        document.querySelectorAll(".plan-bed.gv-plant-drop-target").forEach((item) => item.classList.remove("gv-plant-drop-target"));
        setHover(null);
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      document.querySelectorAll(".plan-bed.gv-plant-drop-target").forEach((item) => item !== bed && item.classList.remove("gv-plant-drop-target"));
      bed.classList.add("gv-plant-drop-target");

      const canvasRect = document.querySelector<HTMLElement>(".garden-canvas")?.getBoundingClientRect();
      const bedRect = bed.getBoundingClientRect();
      const scale = canvasRect ? canvasRect.width / CANVAS_WIDTH : 1;
      const widthCm = bedRect.width / Math.max(scale, .01);
      const heightCm = bedRect.height / Math.max(scale, .01);
      const count = Math.max(1, Math.floor(widthCm / plant.spacingCm) * Math.floor(heightCm / plant.spacingCm));
      setHover({
        x: event.clientX,
        y: event.clientY,
        ringPx: Math.max(12, plant.spacingCm * scale),
        count,
        label: `${plant.icon} ${plant.variety || plant.name} · ${plant.spacingCm} cm · ≈ ${count} plants`,
      });
    }

    async function onDrop(event: DragEvent) {
      const plant = dragRef.current;
      const bed = (event.target as HTMLElement | null)?.closest<HTMLElement>(".plan-bed");
      if (!plant || !bed) return;
      event.preventDefault();
      const layout = modeRef.current;
      clearDropState();
      try {
        await plantIntoBed(bed, plant);
        await saveLayoutForSelectedBed(layout);
      } catch {
        showToast("That plant could not be placed. Try selecting Plants and dropping it again.");
      }
    }

    function onDragEnd(event: DragEvent) {
      (event.target as HTMLElement | null)?.closest(".gv-draggable-plant")?.classList.remove("dragging");
      clearDropState();
    }

    const observer = new MutationObserver(queueSync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("dragover", onDragOver, true);
    document.addEventListener("drop", onDrop, true);
    document.addEventListener("dragend", onDragEnd, true);
    queueSync();

    return () => {
      observer.disconnect();
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("dragover", onDragOver, true);
      document.removeEventListener("drop", onDrop, true);
      document.removeEventListener("dragend", onDragEnd, true);
    };
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    queueSync();
  }, [mode]);

  return <>
    {drag && <div className="gv-placement-drag-hud" aria-hidden="true"><strong>{drag.icon} {drag.variety || drag.name}</strong><span>Drop onto a bed · {MODE_LABELS.find((item) => item.mode === mode)?.label}</span></div>}
    {hover && <>
      <div className="gv-spacing-ring" style={{ left: hover.x, top: hover.y, width: hover.ringPx, height: hover.ringPx }} />
      <div className="gv-placement-preview" style={{ left: hover.x + 16, top: hover.y + 16 }}>{hover.label}</div>
    </>}
    {toast && <div className="gv-placement-toast" role="status">{toast}</div>}
  </>;
}
