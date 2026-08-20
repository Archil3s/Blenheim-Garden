"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Tool = "select" | "bed" | "path" | "trellis" | "plant" | "row" | "tree" | "note";

type Bed = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  crop?: string;
  cropIcon?: string;
  cropCount?: number;
  variety?: string;
  spacingCm?: number;
};

type PlantingRow = {
  id: string;
  crop: string;
  cropIcon: string;
  variety: string;
  spacingCm: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  count: number;
};

type PlanState = {
  beds: Bed[];
  rows: PlantingRow[];
};

type PlantOption = {
  name: string;
  icon: string;
  spacingCm: number;
  spacing: string;
  varieties: string[];
};

type BedInteraction = {
  mode: "drag" | "resize";
  bedId: number;
  startClientX: number;
  startClientY: number;
  startBed: Bed;
};

type DraftRow = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1080;
// The visual plan uses 1 canvas pixel ≈ 1 cm, giving a practical 9 m × 10.8 m working scale.
const CM_PER_CANVAS_PIXEL = 1;

const tools: Array<{ id: Tool; icon: string; label: string }> = [
  { id: "select", icon: "↖", label: "Select" },
  { id: "bed", icon: "▭", label: "Bed" },
  { id: "path", icon: "═", label: "Path" },
  { id: "trellis", icon: "⋮", label: "Trellis" },
  { id: "plant", icon: "🌱", label: "Plant" },
  { id: "row", icon: "•••", label: "Row" },
  { id: "tree", icon: "🌳", label: "Tree" },
  { id: "note", icon: "T", label: "Text" },
];

const plants: PlantOption[] = [
  { name: "Tomato", icon: "🍅", spacingCm: 50, spacing: "45–60 cm", varieties: ["Roma", "Black Krim", "Moneymaker", "Beefsteak"] },
  { name: "Strawberry", icon: "🍓", spacingCm: 35, spacing: "30–40 cm", varieties: ["Camarosa", "Albion", "Monterey", "Unknown crown"] },
  { name: "Bean", icon: "🫘", spacingCm: 18, spacing: "15–20 cm", varieties: ["King Purple", "Superstar", "Scarlet Runner", "Climbing bean"] },
  { name: "Lettuce", icon: "🥬", spacingCm: 28, spacing: "25–30 cm", varieties: ["Butterhead", "Cos", "Loose leaf", "Iceberg"] },
  { name: "Pumpkin", icon: "🎃", spacingCm: 105, spacing: "90–120 cm", varieties: ["Crown", "Butternut", "Gem squash", "Kabocha"] },
  { name: "Carrot", icon: "🥕", spacingCm: 7, spacing: "5–8 cm", varieties: ["Nantes", "Chantenay", "Amsterdam", "Rainbow"] },
  { name: "Broccoli", icon: "🥦", spacingCm: 50, spacing: "45–60 cm", varieties: ["Winter Rudolph", "Green Dragon", "Calabrese"] },
  { name: "Raspberry", icon: "🔴", spacingCm: 50, spacing: "45–60 cm", varieties: ["Heritage", "Aspiring", "Waiau", "Unknown cane"] },
  { name: "Blueberry", icon: "🫐", spacingCm: 120, spacing: "1–1.5 m", varieties: ["Southern Highbush", "Rabbiteye", "Unknown"] },
  { name: "Herbs", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", varieties: ["Basil", "Chives", "Thyme", "Parsley"] },
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cropIcons(icon: string, count: number) {
  const visible = Math.min(count, 30);
  return Array.from({ length: visible }, (_, index) => <span key={index}>{icon}</span>);
}

function bedDimensions(bed: Bed) {
  const widthCm = bed.w / 100 * CANVAS_WIDTH * CM_PER_CANVAS_PIXEL;
  const heightCm = bed.h / 100 * CANVAS_HEIGHT * CM_PER_CANVAS_PIXEL;
  return {
    widthCm,
    heightCm,
    label: `${(widthCm / 100).toFixed(1)} × ${(heightCm / 100).toFixed(1)} m`,
  };
}

function capacityForBed(bed: Bed, spacingCm: number) {
  const { widthCm, heightCm } = bedDimensions(bed);
  const across = Math.max(1, Math.floor(widthCm / spacingCm));
  const down = Math.max(1, Math.floor(heightCm / spacingCm));
  return Math.max(1, across * down);
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
  return {
    length: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx) * 180 / Math.PI,
  };
}

export function GardenPlanner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(90);
  const [month, setMonth] = useState("Sep");
  const [selectedBedId, setSelectedBedId] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantOption>(plants[0]);
  const [selectedVariety, setSelectedVariety] = useState(plants[0].varieties[0]);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<PlanState>({ beds: baseBeds, rows: [] });
  const [past, setPast] = useState<PlanState[]>([]);
  const [future, setFuture] = useState<PlanState[]>([]);
  const [interaction, setInteraction] = useState<BedInteraction | null>(null);
  const [draftRow, setDraftRow] = useState<DraftRow | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("blenheim-garden-plan");
      if (!stored) return;
      const parsed = JSON.parse(stored) as PlanState | Bed[];
      if (Array.isArray(parsed)) {
        setPlan({ beds: parsed, rows: [] });
      } else if (Array.isArray(parsed.beds) && Array.isArray(parsed.rows)) {
        setPlan(parsed);
      }
    } catch {
      // Keep the built-in plan if local storage cannot be read.
    }
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
            return {
              ...bed,
              x: clamp(interaction.startBed.x + dxPercent, 0, 100 - bed.w),
              y: clamp(interaction.startBed.y + dyPercent, 0, 100 - bed.h),
            };
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
  const filteredPlants = useMemo(
    () => plants.filter((plant) => plant.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  function rememberCurrent() {
    setPast((current) => [...current, plan].slice(-30));
    setFuture([]);
  }

  function updatePlan(next: PlanState) {
    rememberCurrent();
    setPlan(next);
  }

  function choosePlant(plant: PlantOption) {
    setSelectedPlant(plant);
    setSelectedVariety(plant.varieties[0]);
    setTool("plant");
  }

  function plantBed(bed: Bed) {
    const count = capacityForBed(bed, selectedPlant.spacingCm);
    updatePlan({
      ...plan,
      beds: plan.beds.map((item) => item.id === bed.id
        ? {
            ...item,
            crop: selectedPlant.name,
            cropIcon: selectedPlant.icon,
            cropCount: count,
            variety: selectedVariety,
            spacingCm: selectedPlant.spacingCm,
          }
        : item),
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
    setInteraction({
      mode: "drag",
      bedId: bed.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBed: { ...bed },
    });
  }

  function beginResize(event: ReactPointerEvent<HTMLSpanElement>, bed: Bed) {
    event.stopPropagation();
    event.preventDefault();
    setSelectedBedId(bed.id);
    setSelectedRowId(null);
    rememberCurrent();
    setInteraction({
      mode: "resize",
      bedId: bed.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBed: { ...bed },
    });
  }

  function canvasPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    return {
      x: clamp((event.clientX - rect.left) / scale, 0, CANVAS_WIDTH),
      y: clamp((event.clientY - rect.top) / scale, 0, CANVAS_HEIGHT),
    };
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
    if (!point) return;
    setDraftRow((current) => current ? { ...current, x2: point.x, y2: point.y } : null);
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
    updatePlan({
      ...plan,
      beds: plan.beds.map((bed) => bed.id === selectedBed.id
        ? { ...bed, crop: undefined, cropIcon: undefined, cropCount: undefined, variety: undefined, spacingCm: undefined }
        : bed),
    });
  }

  function deleteSelectedRow() {
    if (!selectedRow) return;
    updatePlan({ ...plan, rows: plan.rows.filter((row) => row.id !== selectedRow.id) });
    setSelectedRowId(null);
  }

  function undo() {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((current) => [plan, ...current].slice(0, 30));
    setPast((current) => current.slice(0, -1));
    setPlan(previous);
    setInteraction(null);
    setDraftRow(null);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setPast((current) => [...current, plan].slice(-30));
    setFuture((current) => current.slice(1));
    setPlan(next);
  }

  function savePlan() {
    localStorage.setItem("blenheim-garden-plan", JSON.stringify(plan));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const selectedDimensions = selectedBed ? bedDimensions(selectedBed) : null;
  const draftVisual = draftRow ? rowVisual(draftRow) : null;

  return (
    <main className="planner-app">
      <header className="planner-topbar">
        <div className="brand-block">
          <span className="brand-mark">🌿</span>
          <div>
            <strong>Blenheim Garden</strong>
            <small>Te Waiharakeke · 2026 plan</small>
          </div>
        </div>

        <div className="plan-controls">
          <label>
            <span>Month</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="icon-button" title="Undo" aria-label="Undo" onClick={undo} disabled={past.length === 0}>↶</button>
          <button type="button" className="icon-button" title="Redo" aria-label="Redo" onClick={redo} disabled={future.length === 0}>↷</button>
          <div className="zoom-control">
            <button type="button" onClick={() => setZoom((value) => Math.max(60, value - 10))}>−</button>
            <span>{zoom}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(140, value + 10))}>+</button>
          </div>
          <button type="button" className="save-button" onClick={savePlan}>{saved ? "Saved ✓" : "Save plan"}</button>
        </div>
      </header>

      <section className="planner-workspace">
        <aside className="tool-rail" aria-label="Garden tools">
          {tools.map((item) => (
            <button
              type="button"
              key={item.id}
              className={tool === item.id ? "active" : ""}
              onClick={() => setTool(item.id)}
              title={item.label}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </aside>

        <section className="canvas-column">
          <div className="canvas-toolbar">
            <div>
              <strong>Garden plan</strong>
              <span>{month} occupancy view</span>
            </div>
            <span className="canvas-hint">
              {tool === "select" && "Drag a selected bed to move it. Use the corner handle to resize."}
              {tool === "plant" && `Click a bed to fill it with ${selectedPlant.name} at ${selectedPlant.spacing}.`}
              {tool === "row" && `Drag across the plan to draw a ${selectedPlant.name} row.`}
              {!['select', 'plant', 'row'].includes(tool) && `${tools.find((item) => item.id === tool)?.label} editing is queued for the next drawing-tools pass.`}
            </span>
          </div>

          <div className="canvas-viewport">
            <div className="canvas-scale" style={{ width: CANVAS_WIDTH * zoom / 100, height: CANVAS_HEIGHT * zoom / 100 }}>
              <div
                ref={canvasRef}
                className={`garden-canvas tool-${tool}`}
                style={{ transform: `scale(${zoom / 100})` }}
                onPointerDown={beginCanvasPointer}
                onPointerMove={moveCanvasPointer}
                onPointerUp={finishCanvasPointer}
              >
                <span className="entrance-label">ENTRANCE</span>
                <span className="exit-label">EXIT</span>

                <div className="berry-strip">
                  <strong>First-year fruiting canes · over winter</strong>
                  <div className="berry-row">
                    <span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🫐 Blackberry</span>
                  </div>
                </div>

                <div className="north-zone">
                  <div className="shade-tree">🌳<small>Fruit tree</small></div>
                  <div className="trellis-line"><span>POST &amp; TRELLIS</span></div>
                  <div className="north-bed" />
                </div>

                <div className="path path-main" />
                <div className="path path-cross" />
                <div className="shade-circle shade-one" />
                <div className="shade-circle shade-two" />

                {plan.rows.map((row) => {
                  const visual = rowVisual(row);
                  const marks = Math.min(row.count, 34);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`planting-row ${selectedRowId === row.id ? "selected" : ""}`}
                      style={{
                        left: row.x1,
                        top: row.y1 - 12,
                        width: visual.length,
                        transform: `rotate(${visual.angle}deg)`,
                      }}
                      onPointerDown={(event) => {
                        if (tool !== "select") return;
                        event.stopPropagation();
                        setSelectedRowId(row.id);
                      }}
                      title={`${row.variety} ${row.crop} · ${row.count} plants`}
                    >
                      <span className="row-dots">
                        {Array.from({ length: marks }, (_, index) => <i key={index} />)}
                      </span>
                      <span className="row-caption">{row.cropIcon} {row.variety}</span>
                    </button>
                  );
                })}

                {draftRow && draftVisual && (
                  <div
                    className="planting-row draft"
                    style={{
                      left: draftRow.x1,
                      top: draftRow.y1 - 12,
                      width: draftVisual.length,
                      transform: `rotate(${draftVisual.angle}deg)`,
                    }}
                  >
                    <span className="row-dots">
                      {Array.from({ length: Math.min(rowPlantCount(draftRow, selectedPlant.spacingCm), 34) }, (_, index) => <i key={index} />)}
                    </span>
                    <span className="row-caption">{selectedPlant.icon} {selectedVariety}</span>
                  </div>
                )}

                {plan.beds.map((bed) => (
                  <button
                    type="button"
                    key={bed.id}
                    className={`plan-bed ${selectedBedId === bed.id && !selectedRowId ? "selected" : ""} ${interaction?.bedId === bed.id ? "moving" : ""}`}
                    style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }}
                    onPointerDown={(event) => beginBedPointer(event, bed)}
                  >
                    <span className="bed-name">{bed.name}</span>
                    {bed.cropIcon && bed.cropCount ? (
                      <>
                        <span className="crop-pattern">{cropIcons(bed.cropIcon, bed.cropCount)}</span>
                        <span className="bed-variety">{bed.variety ?? bed.crop}</span>
                      </>
                    ) : (
                      <span className="empty-bed-label">empty</span>
                    )}
                    {selectedBedId === bed.id && !selectedRowId && tool === "select" && (
                      <span className="resize-handle" aria-label={`Resize ${bed.name}`} onPointerDown={(event) => beginResize(event, bed)} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="plant-tray">
            <div className="plant-tray-head">
              <div>
                <strong>Plants</strong>
                <span>Pick a crop and variety, then place a bed or draw a row</span>
              </div>
              <div className="plant-tray-controls">
                <label>
                  <span>Variety</span>
                  <select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)}>
                    {selectedPlant.varieties.map((variety) => <option key={variety}>{variety}</option>)}
                  </select>
                </label>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plants…" />
              </div>
            </div>
            <div className="plant-list">
              {filteredPlants.map((plant) => (
                <button
                  type="button"
                  key={plant.name}
                  className={selectedPlant.name === plant.name ? "active" : ""}
                  onClick={() => choosePlant(plant)}
                >
                  <span>{plant.icon}</span>
                  <strong>{plant.name}</strong>
                  <small>{plant.spacing}</small>
                </button>
              ))}
            </div>
          </section>
        </section>

        <aside className="inspector">
          {selectedRow ? (
            <>
              <div className="inspector-heading">
                <span>SELECTED ROW</span>
                <h2>{selectedRow.cropIcon} {selectedRow.variety}</h2>
              </div>
              <div className="inspector-preview row-preview">
                <span>{selectedRow.cropIcon}</span>
              </div>
              <dl>
                <div><dt>Crop</dt><dd>{selectedRow.crop}</dd></div>
                <div><dt>Variety</dt><dd>{selectedRow.variety}</dd></div>
                <div><dt>Row length</dt><dd>{(rowLengthCm(selectedRow) / 100).toFixed(1)} m</dd></div>
                <div><dt>Spacing</dt><dd>{selectedRow.spacingCm} cm</dd></div>
                <div><dt>Plants</dt><dd>≈ {selectedRow.count}</dd></div>
                <div><dt>View</dt><dd>{month} 2026</dd></div>
              </dl>
              <div className="inspector-actions">
                <button type="button" onClick={() => setTool("row")}>••• Draw another row</button>
                <button type="button" className="danger-action" onClick={deleteSelectedRow}>Delete row</button>
              </div>
              <p className="inspector-note">Plant count is estimated from the row length and the crop spacing you selected.</p>
            </>
          ) : (
            <>
              <div className="inspector-heading">
                <span>SELECTED BED</span>
                <h2>{selectedBed.name}</h2>
              </div>
              <div className="inspector-preview">
                <span>{selectedBed.cropIcon ?? "▭"}</span>
              </div>
              <dl>
                <div><dt>Size</dt><dd>{selectedDimensions?.label}</dd></div>
                <div><dt>Crop</dt><dd>{selectedBed.crop ?? "Not planted"}</dd></div>
                <div><dt>Variety</dt><dd>{selectedBed.variety ?? "—"}</dd></div>
                <div><dt>Spacing</dt><dd>{selectedBed.spacingCm ? `${selectedBed.spacingCm} cm` : "—"}</dd></div>
                <div><dt>Plants</dt><dd>{selectedBed.cropCount ? `≈ ${selectedBed.cropCount}` : 0}</dd></div>
                <div><dt>View</dt><dd>{month} 2026</dd></div>
              </dl>
              <div className="inspector-selection">
                <span>READY TO PLACE</span>
                <strong>{selectedPlant.icon} {selectedVariety}</strong>
                <small>{selectedPlant.name} · {selectedPlant.spacing}</small>
              </div>
              <div className="inspector-actions">
                <button type="button" onClick={() => setTool("plant")}>🌱 Fill bed</button>
                <button type="button" className="secondary-action" onClick={() => setTool("row")}>••• Draw planting row</button>
                <button type="button" className="secondary-action">📷 Photos &amp; video</button>
                <button type="button" className="secondary-action">📝 Notes &amp; harvests</button>
                {selectedBed.crop && <button type="button" className="danger-action" onClick={clearSelectedBed}>Clear bed</button>}
              </div>
              <p className="inspector-note">In Select mode, drag the bed to move it or drag its bottom-right handle to resize. Capacity updates automatically when a planted bed changes size.</p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
