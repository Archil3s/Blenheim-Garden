"use client";

import { useEffect, useMemo, useState } from "react";

type Tool = "select" | "bed" | "path" | "trellis" | "plant" | "tree" | "note";
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
};

const tools: Array<{ id: Tool; icon: string; label: string }> = [
  { id: "select", icon: "↖", label: "Select" },
  { id: "bed", icon: "▭", label: "Bed" },
  { id: "path", icon: "═", label: "Path" },
  { id: "trellis", icon: "⋮", label: "Trellis" },
  { id: "plant", icon: "🌱", label: "Plant" },
  { id: "tree", icon: "🌳", label: "Tree" },
  { id: "note", icon: "T", label: "Text" },
];

const plants = [
  { name: "Tomato", icon: "🍅", spacing: "45–60 cm" },
  { name: "Strawberry", icon: "🍓", spacing: "30–40 cm" },
  { name: "Bean", icon: "🫘", spacing: "15–20 cm" },
  { name: "Lettuce", icon: "🥬", spacing: "25–30 cm" },
  { name: "Pumpkin", icon: "🎃", spacing: "90–120 cm" },
  { name: "Carrot", icon: "🥕", spacing: "5–8 cm" },
  { name: "Broccoli", icon: "🥦", spacing: "45–60 cm" },
  { name: "Raspberry", icon: "🔴", spacing: "45–60 cm" },
  { name: "Blueberry", icon: "🫐", spacing: "1–1.5 m" },
  { name: "Herbs", icon: "🌿", spacing: "20–30 cm" },
];

const baseBeds: Bed[] = [
  { id: 1, name: "Bed 1", x: 62, y: 14, w: 31, h: 10, crop: "Tomato", cropIcon: "🍅", cropCount: 12 },
  { id: 2, name: "Bed 2", x: 62, y: 26, w: 31, h: 10, crop: "Strawberry", cropIcon: "🍓", cropCount: 18 },
  { id: 3, name: "Bed 3", x: 62, y: 38, w: 31, h: 9 },
  { id: 4, name: "Bed 4", x: 62, y: 49, w: 31, h: 9 },
  { id: 5, name: "Bed 5", x: 62, y: 60, w: 31, h: 9, crop: "Strawberry", cropIcon: "🍓", cropCount: 10 },
  { id: 6, name: "Bed 6", x: 62, y: 71, w: 31, h: 9 },
  { id: 7, name: "Bed 7", x: 62, y: 82, w: 31, h: 9 },
  { id: 8, name: "Bed 8", x: 10, y: 52, w: 31, h: 9 },
  { id: 9, name: "Bed 9", x: 10, y: 64, w: 31, h: 9, crop: "Bean", cropIcon: "🫘", cropCount: 8 },
  { id: 10, name: "Bed 10", x: 10, y: 76, w: 31, h: 9 },
  { id: 11, name: "Bed 11", x: 2, y: 88, w: 39, h: 9 },
  { id: 12, name: "Bed 12", x: 2, y: 99, w: 91, h: 5 },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cropIcons(icon: string, count: number) {
  const visible = Math.min(count, 18);
  return Array.from({ length: visible }, (_, index) => <span key={index}>{icon}</span>);
}

export function GardenPlanner() {
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(90);
  const [month, setMonth] = useState("Sep");
  const [selectedBedId, setSelectedBedId] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState(plants[0]);
  const [search, setSearch] = useState("");
  const [beds, setBeds] = useState<Bed[]>(baseBeds);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("blenheim-garden-plan");
      if (stored) setBeds(JSON.parse(stored));
    } catch {
      // Keep the built-in plan if local storage cannot be read.
    }
  }, []);

  const selectedBed = beds.find((bed) => bed.id === selectedBedId) ?? beds[0];
  const filteredPlants = useMemo(
    () => plants.filter((plant) => plant.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  function chooseBed(bed: Bed) {
    setSelectedBedId(bed.id);
    if (tool !== "plant") return;
    setBeds((current) => current.map((item) => item.id === bed.id
      ? { ...item, crop: selectedPlant.name, cropIcon: selectedPlant.icon, cropCount: Math.max(item.cropCount ?? 0, 6) }
      : item));
  }

  function savePlan() {
    localStorage.setItem("blenheim-garden-plan", JSON.stringify(beds));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

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
          <button type="button" className="icon-button" title="Undo" aria-label="Undo">↶</button>
          <button type="button" className="icon-button" title="Redo" aria-label="Redo">↷</button>
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
            <span className="canvas-hint">Select a bed, or choose Plant then click a bed to place a crop</span>
          </div>

          <div className="canvas-viewport">
            <div className="canvas-scale" style={{ width: 900 * zoom / 100, height: 1080 * zoom / 100 }}>
              <div className="garden-canvas" style={{ transform: `scale(${zoom / 100})` }}>
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

                {beds.map((bed) => (
                  <button
                    type="button"
                    key={bed.id}
                    className={`plan-bed ${selectedBedId === bed.id ? "selected" : ""}`}
                    style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }}
                    onClick={() => chooseBed(bed)}
                  >
                    <span className="bed-name">{bed.name}</span>
                    {bed.cropIcon && bed.cropCount ? (
                      <span className="crop-pattern">{cropIcons(bed.cropIcon, bed.cropCount)}</span>
                    ) : (
                      <span className="empty-bed-label">empty</span>
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
                <span>Choose a crop, then click a bed</span>
              </div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plants…" />
            </div>
            <div className="plant-list">
              {filteredPlants.map((plant) => (
                <button
                  type="button"
                  key={plant.name}
                  className={selectedPlant.name === plant.name ? "active" : ""}
                  onClick={() => { setSelectedPlant(plant); setTool("plant"); }}
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
          <div className="inspector-heading">
            <span>SELECTED</span>
            <h2>{selectedBed.name}</h2>
          </div>
          <div className="inspector-preview">
            <span>{selectedBed.cropIcon ?? "▭"}</span>
          </div>
          <dl>
            <div><dt>Crop</dt><dd>{selectedBed.crop ?? "Not planted"}</dd></div>
            <div><dt>Plants</dt><dd>{selectedBed.cropCount ?? 0}</dd></div>
            <div><dt>View</dt><dd>{month} 2026</dd></div>
            <div><dt>Selected plant</dt><dd>{selectedPlant.icon} {selectedPlant.name}</dd></div>
          </dl>
          <div className="inspector-actions">
            <button type="button" onClick={() => setTool("plant")}>🌱 Add plants</button>
            <button type="button" className="secondary-action">📷 Photos &amp; video</button>
            <button type="button" className="secondary-action">📝 Notes &amp; harvests</button>
            {selectedBed.crop && (
              <button type="button" className="danger-action" onClick={() => setBeds((current) => current.map((bed) => bed.id === selectedBed.id ? { ...bed, crop: undefined, cropIcon: undefined, cropCount: undefined } : bed))}>Clear bed</button>
            )}
          </div>
          <p className="inspector-note">Media storage, dated plant records and drag-to-resize beds are the next backend/editor layer.</p>
        </aside>
      </section>
    </main>
  );
}
