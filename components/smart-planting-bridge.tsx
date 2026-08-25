"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Pattern = "grid" | "staggered" | "rows" | "natural";

type PlantChoice = {
  name: string;
  icon: string;
  spacingCm: number;
  spacingLabel: string;
  varieties: string[];
};

const PLANTS: PlantChoice[] = [
  { name: "Tomato", icon: "🍅", spacingCm: 50, spacingLabel: "45–60 cm", varieties: ["Roma", "Black Krim", "Moneymaker", "Beefsteak"] },
  { name: "Strawberry", icon: "🍓", spacingCm: 35, spacingLabel: "30–40 cm", varieties: ["Camarosa", "Albion", "Monterey", "Unknown crown"] },
  { name: "Bean", icon: "🫘", spacingCm: 18, spacingLabel: "15–20 cm", varieties: ["King Purple", "Superstar", "Scarlet Runner", "Climbing bean"] },
  { name: "Lettuce", icon: "🥬", spacingCm: 28, spacingLabel: "25–30 cm", varieties: ["Butterhead", "Cos", "Loose leaf", "Iceberg"] },
  { name: "Pumpkin", icon: "🎃", spacingCm: 105, spacingLabel: "90–120 cm", varieties: ["Crown", "Butternut", "Gem squash", "Kabocha"] },
  { name: "Carrot", icon: "🥕", spacingCm: 7, spacingLabel: "5–8 cm", varieties: ["Nantes", "Chantenay", "Amsterdam", "Rainbow"] },
  { name: "Broccoli", icon: "🥦", spacingCm: 50, spacingLabel: "45–60 cm", varieties: ["Winter Rudolph", "Green Dragon", "Calabrese"] },
  { name: "Raspberry", icon: "🔴", spacingCm: 50, spacingLabel: "45–60 cm", varieties: ["Heritage", "Aspiring", "Waiau", "Unknown cane"] },
  { name: "Blueberry", icon: "🫐", spacingCm: 120, spacingLabel: "1–1.5 m", varieties: ["Southern Highbush", "Rabbiteye", "Unknown"] },
  { name: "Herbs", icon: "🌿", spacingCm: 25, spacingLabel: "20–30 cm", varieties: ["Basil", "Chives", "Thyme", "Parsley"] },
];

const PATTERNS: Array<{ value: Pattern; label: string }> = [
  { value: "grid", label: "Block" },
  { value: "staggered", label: "Stagger" },
  { value: "rows", label: "Rows" },
  { value: "natural", label: "Natural" },
];

function selectedBedPanel() {
  if (typeof document === "undefined") return null;
  if (document.querySelector(".gv-app.gv-view-3d")) return null;
  return document.querySelector<HTMLElement>(".gv-selection-panel[data-bed-id]:not(.gv-planting-inspector)");
}

function panelSignature() {
  const panel = selectedBedPanel();
  if (!panel) return "";
  const values = Array.from(panel.querySelectorAll<HTMLInputElement>("input")).map((input) => input.value).join(":");
  return `${panel.dataset.bedId ?? ""}|${values}|${panel.querySelector("dl")?.textContent ?? ""}`;
}

function subscribePanel(callback: () => void) {
  if (typeof document === "undefined") return () => undefined;
  const observer = new MutationObserver(callback);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-bed-id"] });
  return () => observer.disconnect();
}

function labelNumber(panel: HTMLElement, prefix: string) {
  const label = Array.from(panel.querySelectorAll<HTMLLabelElement>("label"))
    .find((candidate) => candidate.textContent?.trim().startsWith(prefix));
  const value = Number(label?.querySelector<HTMLInputElement>("input")?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function statNumber(panel: HTMLElement, label: string) {
  const row = Array.from(panel.querySelectorAll("dl > div"))
    .find((candidate) => candidate.querySelector("dt")?.textContent?.trim() === label);
  const raw = row?.querySelector("dd")?.textContent ?? "0";
  const value = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function estimateCount(widthCm: number, lengthCm: number, spacingCm: number, pattern: Pattern) {
  const width = Math.max(1, widthCm);
  const length = Math.max(1, lengthCm);
  const spacing = Math.max(2, spacingCm);
  const rowStep = pattern === "staggered" ? spacing * Math.sqrt(3) / 2 : spacing;
  const rows = Math.max(1, Math.floor(length / rowStep));
  const columns = Math.max(1, Math.floor(width / spacing));
  if (pattern !== "staggered") return rows * columns;
  let count = 0;
  for (let row = 0; row < rows; row += 1) count += row % 2 === 1 && columns > 1 ? columns - 1 : columns;
  return count;
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function twoFrames() {
  await nextFrame();
  await nextFrame();
}

function clickTool(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
    .find((candidate) => candidate.querySelector("small")?.textContent?.trim() === label);
  button?.click();
  return Boolean(button);
}

function selectPlantButton(name: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
    .find((candidate) => candidate.querySelector("strong")?.textContent?.trim() === name);
  button?.click();
  return Boolean(button);
}

function selectVariety(value: string) {
  const label = Array.from(document.querySelectorAll<HTMLLabelElement>(".gv-filters label"))
    .find((candidate) => candidate.textContent?.trim().startsWith("Variety"));
  const select = label?.querySelector<HTMLSelectElement>("select");
  if (!select) return false;
  const option = Array.from(select.options).find((candidate) => candidate.value === value);
  if (!option) return false;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function selectPattern(pattern: Pattern) {
  const labels: Record<Pattern, string> = { grid: "Block", staggered: "Stagger", rows: "Rows", natural: "Natural" };
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-v4-modebar button"))
    .find((candidate) => candidate.textContent?.trim() === labels[pattern]);
  button?.click();
}

function clearSelectedBed(panel: HTMLElement) {
  const button = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"))
    .find((candidate) => candidate.textContent?.includes("Clear all plantings"));
  button?.click();
  return Boolean(button);
}

function pressSelectedBed() {
  const bed = document.querySelector<HTMLElement>(".plan-bed.selected");
  if (!bed) return false;
  const rect = bed.getBoundingClientRect();
  bed.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    pointerId: 911,
    pointerType: "mouse",
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 0,
    buttons: 1,
  }));
  return true;
}

export function SmartPlantingBridge() {
  useSyncExternalStore(subscribePanel, panelSignature, () => "");
  const panel = selectedBedPanel();
  const [plantName, setPlantName] = useState(PLANTS[0].name);
  const [variety, setVariety] = useState(PLANTS[0].varieties[0]);
  const [pattern, setPattern] = useState<Pattern>("grid");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!panel) return error ? <div className="gv-smart-plant-toast" role="status">{error}</div> : null;

  const plant = PLANTS.find((candidate) => candidate.name === plantName) ?? PLANTS[0];
  const widthCm = labelNumber(panel, "Width (cm)");
  const lengthCm = labelNumber(panel, "Length (cm)");
  const existingPlantings = statNumber(panel, "Plantings");
  const existingPlants = statNumber(panel, "Plants");
  const capacity = estimateCount(widthCm, lengthCm, plant.spacingCm, pattern);

  const chooseCrop = (name: string) => {
    const next = PLANTS.find((candidate) => candidate.name === name) ?? PLANTS[0];
    setPlantName(next.name);
    setVariety(next.varieties[0]);
  };

  const place = async (replace: boolean) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (replace && existingPlantings > 0) {
        if (!clearSelectedBed(panel)) throw new Error("Could not clear the selected bed.");
        await twoFrames();
      }
      if (!clickTool("Plants")) throw new Error("Plants tool was not available.");
      await twoFrames();
      if (!selectPlantButton(plant.name)) throw new Error(`${plant.name} was not available in the plant list.`);
      await twoFrames();
      selectVariety(variety);
      selectPattern(pattern);
      await twoFrames();
      if (!pressSelectedBed()) throw new Error("The selected bed could not be found.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That planting could not be placed.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    {createPortal(
      <section className="gv-smart-plant-card" aria-label="Smart planting">
        <div className="gv-smart-plant-heading">
          <div><span>SMART PLANT</span><strong>Plant this bed</strong></div>
          <b>{plant.icon}</b>
        </div>

        <div className="gv-smart-plant-fields">
          <label>Crop
            <select value={plant.name} onChange={(event) => chooseCrop(event.target.value)}>
              {PLANTS.map((choice) => <option key={choice.name} value={choice.name}>{choice.icon} {choice.name}</option>)}
            </select>
          </label>
          <label>Variety
            <select value={variety} onChange={(event) => setVariety(event.target.value)}>
              {plant.varieties.map((choice) => <option key={choice}>{choice}</option>)}
            </select>
          </label>
        </div>

        <div className="gv-smart-capacity">
          <div><span>Whole-bed capacity</span><strong>≈ {capacity}</strong><small>plants at {plant.spacingCm} cm centres</small></div>
          <div><span>Bed now</span><strong>{existingPlantings ? `≈ ${existingPlants}` : "Empty"}</strong><small>{existingPlantings ? `${existingPlantings} planting area${existingPlantings === 1 ? "" : "s"}` : `${(widthCm / 100).toFixed(1)} × ${(lengthCm / 100).toFixed(1)} m`}</small></div>
        </div>

        <div className="gv-smart-patterns" role="group" aria-label="Planting layout">
          {PATTERNS.map((choice) => <button key={choice.value} type="button" className={pattern === choice.value ? "active" : ""} aria-pressed={pattern === choice.value} onClick={() => setPattern(choice.value)}>{choice.label}</button>)}
        </div>
        <p className="gv-smart-spacing">Recommended {plant.spacingLabel} · planner default <strong>{plant.spacingCm} cm</strong></p>

        <button type="button" className="gv-smart-primary" disabled={busy} onClick={() => void place(false)}>
          {busy ? "Planting…" : existingPlantings > 0 ? `＋ Add ${variety} patch` : `🌱 Fill bed with ${variety}`}
        </button>
        {existingPlantings > 0 && <button type="button" className="gv-smart-replace" disabled={busy} onClick={() => void place(true)}>Replace all plantings with {variety}</button>}
      </section>,
      panel,
    )}
    {error && <div className="gv-smart-plant-toast" role="status">{error}</div>}
  </>;
}
