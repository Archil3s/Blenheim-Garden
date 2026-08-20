"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GardenPlanApiResponse, PlannerBed as Bed, PlannerPlan as PlanState, PlannerRow as PlantingRow } from "@/lib/garden/planner-plan";

type Tool = "select" | "bed" | "path" | "trellis" | "plant" | "row" | "tree" | "note";
type SaveState = "idle" | "saving" | "cloud" | "local" | "error";
type LoadSource = "starting" | "cloud" | "local" | "default";

type PlantOption = {
  name: string;
  icon: string;
  spacingCm: number;
  spacing: string;
  type: string;
  varieties: string[];
};

type BedInteraction = {
  mode: "drag" | "resize";
  bedId: number;
  startClientX: number;
  startClientY: number;
  startBed: Bed;
};

type DraftRow = { x1: number; y1: number; x2: number; y2: number };

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1080;
const CM_PER_CANVAS_PIXEL = 1;
const LOCAL_PLAN_KEY = "blenheim-garden-plan";
const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

const tools: Array<{ id: Tool; icon: string; label: string }> = [
  { id: "select", icon: "↖", label: "Select" },
  { id: "plant", icon: "🌱", label: "Plants" },
  { id: "row", icon: "•••", label: "Rows" },
  { id: "bed", icon: "▭", label: "Beds" },
  { id: "path", icon: "═", label: "Paths" },
  { id: "trellis", icon: "⋮", label: "Trellis" },
  { id: "tree", icon: "🌳", label: "Trees" },
  { id: "note", icon: "A", label: "Text" },
];

const plants: PlantOption[] = [
  { name: "Tomato", icon: "🍅", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Roma", "Black Krim", "Moneymaker", "Beefsteak"] },
  { name: "Strawberry", icon: "🍓", spacingCm: 35, spacing: "30–40 cm", type: "Fruit", varieties: ["Camarosa", "Albion", "Monterey", "Unknown crown"] },
  { name: "Bean", icon: "🫘", spacingCm: 18, spacing: "15–20 cm", type: "Vegetable", varieties: ["King Purple", "Superstar", "Scarlet Runner", "Climbing bean"] },
  { name: "Lettuce", icon: "🥬", spacingCm: 28, spacing: "25–30 cm", type: "Vegetable", varieties: ["Butterhead", "Cos", "Loose leaf", "Iceberg"] },
  { name: "Pumpkin", icon: "🎃", spacingCm: 105, spacing: "90–120 cm", type: "Vegetable", varieties: ["Crown", "Butternut", "Gem squash", "Kabocha"] },
  { name: "Carrot", icon: "🥕", spacingCm: 7, spacing: "5–8 cm", type: "Vegetable", varieties: ["Nantes", "Chantenay", "Amsterdam", "Rainbow"] },
  { name: "Broccoli", icon: "🥦", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Winter Rudolph", "Green Dragon", "Calabrese"] },
  { name: "Raspberry", icon: "🔴", spacingCm: 50, spacing: "45–60 cm", type: "Fruit", varieties: ["Heritage", "Aspiring", "Waiau", "Unknown cane"] },
  { name: "Blueberry", icon: "🫐", spacingCm: 120, spacing: "1–1.5 m", type: "Fruit", varieties: ["Southern Highbush", "Rabbiteye", "Unknown"] },
  { name: "Herbs", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", type: "Herb", varieties: ["Basil", "Chives", "Thyme", "Parsley"] },
];

const baseBeds: Bed[] = [
  { id: 1, name: "Bed 1", x: 62, y: 14, w: 31, h: 10, crop: "Tomato", cropIcon: "🍅", cropCount: 10, variety: "Roma", spacingCm: 50 },
  { id: 2, name: "Bed 2", x: 62, y: 26, w: 31, h: 10, crop: "Strawberry", cropIcon: "🍓", cropCount: 21, variety: "Camarosa", spacingCm: 35 },
  { id: 3, name: "Bed 3", x: 62, y: 38, w: 31, h: 9 },
  { id: 4, name: "Bed 4", x: 62, y: 49, w: 31, h: 9 },
  { id: 5, name: "Bed 5", x: 62, y: 60, w: 31, h: 9, crop: "Strawberry", cropIcon: "🍓", cropCount: 18, variety: "Albion", spacingCm: 35 },
  { id: 6, name: "Bed 6", x: 62, y: 71, w: 31, h: 9 },
  { id: 7, name: "Bed 7", x: 62, y: 82, w: 31, h: 9 },
  { id: 8, name: "Bed 8", x: 10, y: 52, w: 31, h: 9 },
  { id: 9, name: "Bed 9", x: 10, y: 64, w: 31, h: 9, crop: "Bean", cropIcon: "🫘", cropCount: 70, variety: "King Purple", spacingCm: 18 },
  { id: 10, name: "Bed 10", x: 10, y: 76, w: 31, h: 9 },
  { id: 11, name: "Bed 11", x: 2, y: 88, w: 39, h: 9 },
  { id: 12, name: "Bed 12", x: 2, y: 99, w: 91, h: 5 },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const topRuler = [0, 2, 4, 6, 8, 9];
const leftRuler = [0, 2, 4, 6, 8, 10];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cropIcons(icon: string, count: number) {
  return Array.from({ length: Math.min(count, 30) }, (_, index) => <span key={index}>{icon}</span>);
}

function bedDimensions(bed: Bed) {
  const widthCm = bed.w / 100 * CANVAS_WIDTH * CM_PER_CANVAS_PIXEL;
  const heightCm = bed.h / 100 * CANVAS_HEIGHT * CM_PER_CANVAS_PIXEL;
  return { widthCm, heightCm, label: `${(widthCm / 100).toFixed(1)} × ${(heightCm / 100).toFixed(1)} m` };
}

function capacityForBed(bed: Bed, spacingCm: number) {
  const { widthCm, heightCm } = bedDimensions(bed);
  return Math.max(1, Math.floor(widthCm / spacingCm) * Math.floor(heightCm / spacingCm));
}

function rowLengthCm(row: Pick<PlantingRow, "x1" | "y1" | "x2" | "y2">) {
  return Math.hypot(row.x2 - row.x1, row.y2 - row.y1) * CM_PER_CANVAS_PIXEL;
}

function rowPlantCount(row: Pick<PlantingRow, "x1" | "y1" | "x2" | "y2">, spacingCm: number) {
  return Math.max(1, Math.floor(rowLengthCm(row) / spacingCm) + 1);
}

function rowVisual(row: Pick<PlantingRow, "x1" | "y1" | "x2" | "y2">) {
  const dx = row.x2 - row.x1;
  const dy = row.y2 - row.y1;
  return { length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) * 180 / Math.PI };
}

function readLocalPlan(): PlanState | null {
  try {
    const stored = localStorage.getItem(LOCAL_PLAN_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PlanState | Bed[];
    if (Array.isArray(parsed)) return { beds: parsed, rows: [] };
    if (Array.isArray(parsed.beds) && Array.isArray(parsed.rows)) return parsed;
  } catch {
    // Ignore invalid browser cache and fall back to the built-in plan.
  }
  return null;
}

export function GardenPlanner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("plant");
  const [panelOpen, setPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(90);
  const [month, setMonth] = useState("Sep");
  const [selectedBedId, setSelectedBedId] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantOption>(plants[0]);
  const [selectedVariety, setSelectedVariety] = useState(plants[0].varieties[0]);
  const [search, setSearch] = useState("");
  const [plantType, setPlantType] = useState("All Plants");
  const [plan, setPlan] = useState<PlanState>({ beds: baseBeds, rows: [] });
  const [past, setPast] = useState<PlanState[]>([]);
  const [future, setFuture] = useState<PlanState[]>([]);
  const [interaction, setInteraction] = useState<BedInteraction | null>(null);
  const [draftRow, setDraftRow] = useState<DraftRow | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadSource, setLoadSource] = useState<LoadSource>("starting");

  useEffect(() => {
    let cancelled = false;
    const local = readLocalPlan();
    if (local) {
      setPlan(local);
      setLoadSource("local");
    } else {
      setLoadSource("default");
    }

    async function loadCloudPlan() {
      try {
        const response = await fetch("/api/garden", { cache: "no-store" });
        const data = await response.json() as GardenPlanApiResponse;
        if (cancelled || !response.ok || !data.ok || !data.plan || data.plan.beds.length === 0) return;
        setPlan(data.plan);
        localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(data.plan));
        setLoadSource("cloud");
      } catch {
        // Browser/local plan remains available when cloud loading is unavailable.
      }
    }

    void loadCloudPlan();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!interaction) return;
    const onMove = (event: PointerEvent) => {
      const scale = zoom / 100;
      const dxPercent = (event.clientX - interaction.startClientX) / scale / CANVAS_WIDTH * 100;
      const dyPercent = (event.clientY - interaction.startClientY) / scale / CANVAS_HEIGHT * 100;
      setPlan((current) => ({
        ...current,
        beds: current.beds.map((bed) => {
          if (bed.id !== interaction.bedId) return bed;
          if (interaction.mode === "drag") {
            return { ...bed, x: clamp(interaction.startBed.x + dxPercent, 0, 100 - bed.w), y: clamp(interaction.startBed.y + dyPercent, 0, 100 - bed.h) };
          }
          const w = clamp(interaction.startBed.w + dxPercent, 5, 100 - interaction.startBed.x);
          const h = clamp(interaction.startBed.h + dyPercent, 4, 100 - interaction.startBed.y);
          const next = { ...bed, w, h };
          if (bed.crop && bed.spacingCm) next.cropCount = capacityForBed(next, bed.spacingCm);
          return next;
        }),
      }));
    };
    const onUp = () => setInteraction(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [interaction, zoom]);

  const selectedBed = plan.beds.find((bed) => bed.id === selectedBedId) ?? plan.beds[0];
  const selectedRow = plan.rows.find((row) => row.id === selectedRowId) ?? null;
  const selectedDimensions = selectedBed ? bedDimensions(selectedBed) : null;
  const draftVisual = draftRow ? rowVisual(draftRow) : null;

  const filteredPlants = useMemo(() => {
    const needle = search.toLowerCase();
    return plants.filter((plant) => {
      const matchesSearch = plant.name.toLowerCase().includes(needle) || plant.varieties.some((variety) => variety.toLowerCase().includes(needle));
      const matchesType = plantType === "All Plants" || plant.type === plantType;
      return matchesSearch && matchesType;
    });
  }, [search, plantType]);

  function rememberCurrent() {
    setPast((current) => [...current, plan].slice(-30));
    setFuture([]);
  }

  function updatePlan(next: PlanState) {
    rememberCurrent();
    setPlan(next);
    setSaveState("idle");
  }

  function chooseTool(nextTool: Tool) {
    setTool(nextTool);
    setPanelOpen(true);
  }

  function choosePlant(plant: PlantOption) {
    setSelectedPlant(plant);
    setSelectedVariety(plant.varieties[0]);
    setTool((current) => current === "row" ? "row" : "plant");
  }

  function plantBed(bed: Bed) {
    updatePlan({
      ...plan,
      beds: plan.beds.map((item) => item.id === bed.id ? {
        ...item,
        crop: selectedPlant.name,
        cropIcon: selectedPlant.icon,
        cropCount: capacityForBed(bed, selectedPlant.spacingCm),
        variety: selectedVariety,
        spacingCm: selectedPlant.spacingCm,
      } : item),
    });
  }

  function beginBedPointer(event: ReactPointerEvent<HTMLButtonElement>, bed: Bed) {
    if (tool === "row") return;
    event.stopPropagation();
    setSelectedBedId(bed.id);
    setSelectedRowId(null);
    if (tool === "plant") {
      plantBed(bed);
      return;
    }
    if (tool !== "select") return;
    rememberCurrent();
    setInteraction({ mode: "drag", bedId: bed.id, startClientX: event.clientX, startClientY: event.clientY, startBed: { ...bed } });
  }

  function beginResize(event: ReactPointerEvent<HTMLSpanElement>, bed: Bed) {
    event.stopPropagation();
    event.preventDefault();
    setSelectedBedId(bed.id);
    setSelectedRowId(null);
    rememberCurrent();
    setInteraction({ mode: "resize", bedId: bed.id, startClientX: event.clientX, startClientY: event.clientY, startBed: { ...bed } });
  }

  function canvasPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    return { x: clamp((event.clientX - rect.left) / scale, 0, CANVAS_WIDTH), y: clamp((event.clientY - rect.top) / scale, 0, CANVAS_HEIGHT) };
  }

  function beginCanvasPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (tool !== "row") return;
    const point = canvasPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftRow({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
  }

  function moveCanvasPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draftRow || tool !== "row") return;
    const point = canvasPoint(event);
    if (point) setDraftRow((current) => current ? { ...current, x2: point.x, y2: point.y } : null);
  }

  function finishCanvasPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draftRow || tool !== "row") return;
    const point = canvasPoint(event) ?? { x: draftRow.x2, y: draftRow.y2 };
    const completed = { ...draftRow, x2: point.x, y2: point.y };
    setDraftRow(null);
    if (rowLengthCm(completed) < 20) return;
    const row: PlantingRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      crop: selectedPlant.name,
      cropIcon: selectedPlant.icon,
      variety: selectedVariety,
      spacingCm: selectedPlant.spacingCm,
      ...completed,
      count: rowPlantCount(completed, selectedPlant.spacingCm),
    };
    updatePlan({ ...plan, rows: [...plan.rows, row] });
    setSelectedRowId(row.id);
  }

  function clearSelectedBed() {
    if (!selectedBed) return;
    updatePlan({ ...plan, beds: plan.beds.map((bed) => bed.id === selectedBed.id ? { ...bed, crop: undefined, cropIcon: undefined, cropCount: undefined, variety: undefined, spacingCm: undefined } : bed) });
  }

  function deleteSelectedRow() {
    if (!selectedRow) return;
    updatePlan({ ...plan, rows: plan.rows.filter((row) => row.id !== selectedRow.id) });
    setSelectedRowId(null);
  }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture((current) => [plan, ...current].slice(0, 30));
    setPast((current) => current.slice(0, -1));
    setPlan(previous);
    setInteraction(null);
    setDraftRow(null);
    setSaveState("idle");
  }

  function redo() {
    if (!future.length) return;
    const next = future[0];
    setPast((current) => [...current, plan].slice(-30));
    setFuture((current) => current.slice(1));
    setPlan(next);
    setSaveState("idle");
  }

  function configureEditKey() {
    const value = window.prompt("Enter your garden edit key. It is stored only for this browser session.");
    if (value === null) return;
    const key = value.trim();
    if (key) sessionStorage.setItem(EDIT_KEY_SESSION, key);
    else sessionStorage.removeItem(EDIT_KEY_SESSION);
  }

  async function savePlan() {
    localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(plan));
    setSaveState("saving");

    let editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      const supplied = window.prompt("Enter your garden edit key to save to Cloudflare D1. Cancel to save only on this device.");
      editKey = supplied?.trim() ?? "";
      if (editKey) sessionStorage.setItem(EDIT_KEY_SESSION, editKey);
    }

    if (!editKey) {
      setSaveState("local");
      return;
    }

    try {
      const response = await fetch("/api/garden", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${editKey}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json() as GardenPlanApiResponse;
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
        setSaveState("local");
        return;
      }
      setLoadSource("cloud");
      setSaveState("cloud");
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("local");
    }
  }

  function renderCatalog() {
    return (
      <>
        <div className="gv-panel-section-title">
          <div><span className="gv-panel-leaf">🌱</span><strong>Plants</strong></div>
          <label className="gv-sfg">SFG Mode <input type="checkbox" /></label>
        </div>
        <div className="gv-filters">
          <div className="gv-filter-heading"><strong>Filters</strong><div><button type="button" onClick={() => { setSearch(""); setPlantType("All Plants"); }}>Reset</button><button type="button">Show More ›</button></div></div>
          <label>Name<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plants or varieties" /></label>
          <label>Type<select value={plantType} onChange={(event) => setPlantType(event.target.value)}><option>All Plants</option><option>Vegetable</option><option>Fruit</option><option>Herb</option></select></label>
          <label>Variety<select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)}>{selectedPlant.varieties.map((variety) => <option key={variety}>{variety}</option>)}</select></label>
          <div className="gv-filter-checks"><label><input type="checkbox" /> Favorites</label><label><input type="checkbox" defaultChecked /> Include Perennials</label></div>
        </div>
        <div className="gv-plant-list">
          {filteredPlants.map((plant) => (
            <button type="button" key={plant.name} className={selectedPlant.name === plant.name ? "active" : ""} onClick={() => choosePlant(plant)}>
              <span className="gv-favourite">☆</span>
              <span className="gv-plant-icon">{plant.icon}</span>
              <span className="gv-plant-copy"><strong>{plant.name}</strong><small>{plant.spacing}</small></span>
              {plant.type === "Fruit" && <span className="gv-perennial">Perennial</span>}
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderSelectionPanel() {
    if (selectedRow) {
      return (
        <div className="gv-selection-panel">
          <div className="gv-selection-hero"><span>{selectedRow.cropIcon}</span><div><small>SELECTED ROW</small><h2>{selectedRow.variety}</h2><p>{selectedRow.crop}</p></div></div>
          <dl>
            <div><dt>Length</dt><dd>{(rowLengthCm(selectedRow) / 100).toFixed(1)} m</dd></div>
            <div><dt>Spacing</dt><dd>{selectedRow.spacingCm} cm</dd></div>
            <div><dt>Plants</dt><dd>≈ {selectedRow.count}</dd></div>
            <div><dt>Month</dt><dd>{month} 2026</dd></div>
          </dl>
          <button type="button" className="gv-primary-action" onClick={() => chooseTool("row")}>Draw another row</button>
          <button type="button" className="gv-danger-action" onClick={deleteSelectedRow}>Delete row</button>
        </div>
      );
    }

    return (
      <div className="gv-selection-panel">
        <div className="gv-selection-hero"><span>{selectedBed.cropIcon ?? "▭"}</span><div><small>SELECTED BED</small><h2>{selectedBed.name}</h2><p>{selectedBed.variety ?? selectedBed.crop ?? "Empty bed"}</p></div></div>
        <dl>
          <div><dt>Size</dt><dd>{selectedDimensions?.label}</dd></div>
          <div><dt>Crop</dt><dd>{selectedBed.crop ?? "Not planted"}</dd></div>
          <div><dt>Spacing</dt><dd>{selectedBed.spacingCm ? `${selectedBed.spacingCm} cm` : "—"}</dd></div>
          <div><dt>Plants</dt><dd>{selectedBed.cropCount ? `≈ ${selectedBed.cropCount}` : "0"}</dd></div>
        </dl>
        <div className="gv-ready"><small>READY TO PLACE</small><strong>{selectedPlant.icon} {selectedVariety}</strong><span>{selectedPlant.spacing}</span></div>
        <button type="button" className="gv-primary-action" onClick={() => chooseTool("plant")}>Fill with plants</button>
        <button type="button" className="gv-secondary-action">📷 Photos & video</button>
        <button type="button" className="gv-secondary-action">📝 Notes & harvests</button>
        {selectedBed.crop && <button type="button" className="gv-danger-action" onClick={clearSelectedBed}>Clear bed</button>}
      </div>
    );
  }

  function renderContextPanel() {
    if (tool === "plant" || tool === "row") return renderCatalog();
    if (tool === "select") return renderSelectionPanel();
    const current = tools.find((item) => item.id === tool);
    return (
      <div className="gv-drawing-placeholder">
        <span>{current?.icon}</span>
        <h2>{current?.label}</h2>
        <p>This drawing tool will use the same compact panel pattern for dimensions and placement controls.</p>
        <button type="button" onClick={() => chooseTool("select")}>Back to Select</button>
      </div>
    );
  }

  const scaledWidth = CANVAS_WIDTH * zoom / 100;
  const scaledHeight = CANVAS_HEIGHT * zoom / 100;
  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "cloud" ? "Saved ✓" : saveState === "local" ? "Local only" : saveState === "error" ? "Retry" : "Save";
  const sourceLabel = loadSource === "cloud" ? "Cloud synced" : loadSource === "local" ? "Local copy" : loadSource === "starting" ? "Loading…" : "Unsynced plan";

  return (
    <main className="gv-app">
      <header className="gv-titlebar">
        <div className="gv-title-left">
          <button type="button" className="gv-plan-name">BLENHEIM GARDEN <span>2026 ▾</span></button>
          <button type="button" className="gv-settings" onClick={configureEditKey} title="Set the private edit key used for cloud saves">⚙ Settings</button>
          <button type="button" className="gv-save" onClick={() => void savePlan()} disabled={saveState === "saving"} title={saveState === "local" ? "Saved in this browser, but not yet written to D1" : "Save garden plan"}>💾 {saveLabel}</button>
        </div>
        <nav className="gv-tabs" aria-label="Garden sections"><button type="button" className="active">Plan</button><button type="button">Plant List</button><button type="button">Photos</button><button type="button">Notes</button></nav>
      </header>

      <div className="gv-commandbar">
        <div className="gv-command-group"><span>Plan</span><div><button title="New plan">□</button><button title="Open">▣</button><button title="Print">▤</button></div></div>
        <div className="gv-command-group"><span>Edit</span><div><button onClick={undo} disabled={!past.length}>↶</button><button onClick={redo} disabled={!future.length}>↷</button><button>✂</button><button>⧉</button></div></div>
        <div className="gv-command-group"><span>Layout</span><div className="gv-zoom-inline"><button onClick={() => setZoom((value) => Math.max(60, value - 10))}>−</button><strong>{zoom}%</strong><button onClick={() => setZoom((value) => Math.min(140, value + 10))}>+</button></div></div>
        <div className="gv-command-group"><span>Layers</span><div><button>▣ Edit All ▾</button></div></div>
        <div className="gv-command-group gv-timeline"><span>Timeline</span><div><button onClick={() => setMonth(months[(months.indexOf(month) + 11) % 12])}>‹</button><select value={month} onChange={(event) => setMonth(event.target.value)}>{months.map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => setMonth(months[(months.indexOf(month) + 1) % 12])}>›</button></div></div>
        <div className="gv-command-group"><span>Seed Inventory</span><div><button className="gv-green-command">🌱 Seed Planner</button></div></div>
        <div className="gv-command-group"><span>Crop Rotation</span><div><button>Automatic</button></div></div>
      </div>

      <section className={`gv-body ${panelOpen ? "" : "panel-closed"}`}>
        <aside className="gv-rail" aria-label="Drawing tools">
          <button type="button" className="gv-menu">☰</button>
          {tools.map((item) => <button type="button" key={item.id} className={tool === item.id ? "active" : ""} onClick={() => chooseTool(item.id)} title={item.label}><span>{item.icon}</span><small>{item.label}</small></button>)}
        </aside>

        {panelOpen && <aside className="gv-context"><div className="gv-context-header"><strong>Drawing Tools</strong><button type="button" onClick={() => setPanelOpen(false)}>‹</button></div>{renderContextPanel()}</aside>}
        {!panelOpen && <button type="button" className="gv-panel-reopen" onClick={() => setPanelOpen(true)}>›</button>}

        <section className="gv-stage">
          <div className="gv-stage-status"><strong>{tool === "row" ? `Draw ${selectedVariety} ${selectedPlant.name} rows` : tool === "plant" ? `Place ${selectedVariety} ${selectedPlant.name}` : tool === "select" ? "Select, move and resize" : `${tools.find((item) => item.id === tool)?.label} tool`}</strong><span>{month} 2026 · {sourceLabel} · 1 px ≈ 1 cm</span></div>
          <div className="gv-stage-scroll">
            <div className="gv-ruler-grid" style={{ width: scaledWidth + 28, gridTemplateColumns: `28px ${scaledWidth}px`, gridTemplateRows: `26px ${scaledHeight}px` }}>
              <div className="gv-ruler-corner" />
              <div className="gv-ruler-top">{topRuler.map((mark) => <span key={mark} style={{ left: `${mark / 9 * 100}%` }}>{mark}m</span>)}</div>
              <div className="gv-ruler-left">{leftRuler.map((mark) => <span key={mark} style={{ top: `${mark / 10.8 * 100}%` }}>{mark}m</span>)}</div>
              <div className="canvas-scale" style={{ width: scaledWidth, height: scaledHeight }}>
                <div ref={canvasRef} className={`garden-canvas tool-${tool}`} style={{ transform: `scale(${zoom / 100})` }} onPointerDown={beginCanvasPointer} onPointerMove={moveCanvasPointer} onPointerUp={finishCanvasPointer}>
                  <span className="entrance-label">ENTRANCE</span><span className="exit-label">EXIT</span>
                  <div className="berry-strip"><strong>First-year fruiting canes · over winter</strong><div className="berry-row"><span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🫐 Blackberry</span></div></div>
                  <div className="north-zone"><div className="shade-tree">🌳<small>Fruit tree</small></div><div className="trellis-line"><span>POST &amp; TRELLIS</span></div><div className="north-bed" /></div>
                  <div className="path path-main" /><div className="path path-cross" /><div className="shade-circle shade-one" /><div className="shade-circle shade-two" />

                  {plan.rows.map((row) => {
                    const visual = rowVisual(row);
                    return <button type="button" key={row.id} className={`planting-row ${selectedRowId === row.id ? "selected" : ""}`} style={{ left: row.x1, top: row.y1 - 12, width: visual.length, transform: `rotate(${visual.angle}deg)` }} onPointerDown={(event) => { if (tool !== "select") return; event.stopPropagation(); setSelectedRowId(row.id); }} title={`${row.variety} ${row.crop} · ${row.count} plants`}><span className="row-dots">{Array.from({ length: Math.min(row.count, 34) }, (_, index) => <i key={index} />)}</span><span className="row-caption">{row.cropIcon} {row.variety}</span></button>;
                  })}

                  {draftRow && draftVisual && <div className="planting-row draft" style={{ left: draftRow.x1, top: draftRow.y1 - 12, width: draftVisual.length, transform: `rotate(${draftVisual.angle}deg)` }}><span className="row-dots">{Array.from({ length: Math.min(rowPlantCount(draftRow, selectedPlant.spacingCm), 34) }, (_, index) => <i key={index} />)}</span><span className="row-caption">{selectedPlant.icon} {selectedVariety}</span></div>}

                  {plan.beds.map((bed) => <button type="button" key={bed.id} className={`plan-bed ${selectedBedId === bed.id && !selectedRowId ? "selected" : ""} ${interaction?.bedId === bed.id ? "moving" : ""}`} style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }} onPointerDown={(event) => beginBedPointer(event, bed)}><span className="bed-name">{bed.name}</span>{bed.cropIcon && bed.cropCount ? <><span className="crop-pattern">{cropIcons(bed.cropIcon, bed.cropCount)}</span><span className="bed-variety">{bed.variety ?? bed.crop}</span></> : <span className="empty-bed-label">empty</span>}{selectedBedId === bed.id && !selectedRowId && tool === "select" && <span className="resize-handle" aria-label={`Resize ${bed.name}`} onPointerDown={(event) => beginResize(event, bed)} />}</button>)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
