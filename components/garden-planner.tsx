"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from "react";
import type {
  GardenPlanApiResponse,
  PlannerBed as Bed,
  PlannerLayoutObject,
  PlannerPlan as PlanState,
  PlannerPlantingArea,
  PlannerPlantingPattern,
  PlannerRow as PlantingRow,
} from "@/lib/garden/planner-plan";
import { plantCountForArea, plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";
import { DEFAULT_GARDEN_ID, LIVE_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";

type Tool = "select" | "plant" | "row" | "bed" | "path" | "trellis" | "tree" | "note";
type SaveState = "idle" | "saving" | "cloud" | "local" | "error";
type LoadSource = "starting" | "cloud" | "local" | "default";
type Point = { x: number; y: number };
type Selection = { kind: "bed" | "planting" | "row" | "object"; id: string } | null;
type Draft = { kind: "bed" | "row" | "path" | "trellis"; start: Point; end: Point } | null;
type Interaction =
  | { kind: "bed-drag" | "bed-resize"; id: number; start: Point; bed: Bed }
  | { kind: "planting-drag" | "planting-resize"; id: string; start: Point; area: PlannerPlantingArea }
  | { kind: "row-drag" | "row-start" | "row-end"; id: string; start: Point; row: PlantingRow }
  | { kind: "object-drag" | "object-start" | "object-end" | "tree-resize"; id: string; start: Point; object: PlannerLayoutObject };

type RowInteraction = Extract<Interaction, { row: PlantingRow }>;
type PlantingInteraction = Extract<Interaction, { area: PlannerPlantingArea }>;

type PlantOption = {
  name: string;
  icon: string;
  spacingCm: number;
  spacing: string;
  type: "Vegetable" | "Fruit" | "Herb";
  varieties: string[];
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1080;
const SNAP_CM = 10;
const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

const tools: Array<{ id: Tool; icon: string; label: string; hint: string }> = [
  { id: "select", icon: "↖", label: "Select", hint: "Move, resize and edit" },
  { id: "plant", icon: "🌱", label: "Plants", hint: "Drag crops into beds" },
  { id: "row", icon: "•••", label: "Rows", hint: "Drag a planting row" },
  { id: "bed", icon: "▭", label: "Bed", hint: "Drag a new garden bed" },
  { id: "path", icon: "═", label: "Path", hint: "Drag a path line" },
  { id: "trellis", icon: "⋮", label: "Trellis", hint: "Drag a trellis line" },
  { id: "tree", icon: "🌳", label: "Tree", hint: "Click to place a tree" },
  { id: "note", icon: "A", label: "Text", hint: "Click to place a label" },
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
  { id: 1, name: "Bed 1", x: 62, y: 14, w: 31, h: 10 },
  { id: 2, name: "Bed 2", x: 62, y: 26, w: 31, h: 10 },
  { id: 3, name: "Bed 3", x: 62, y: 38, w: 31, h: 9 },
  { id: 4, name: "Bed 4", x: 62, y: 49, w: 31, h: 9 },
  { id: 5, name: "Bed 5", x: 62, y: 60, w: 31, h: 9 },
  { id: 6, name: "Bed 6", x: 62, y: 71, w: 31, h: 9 },
  { id: 7, name: "Bed 7", x: 62, y: 82, w: 31, h: 9 },
  { id: 8, name: "Bed 8", x: 10, y: 52, w: 31, h: 9 },
  { id: 9, name: "Bed 9", x: 10, y: 64, w: 31, h: 9 },
  { id: 10, name: "Bed 10", x: 10, y: 76, w: 31, h: 9 },
  { id: 11, name: "Bed 11", x: 2, y: 88, w: 39, h: 9 },
  { id: 12, name: "Bed 12", x: 2, y: 99, w: 91, h: 5 },
];

const basePlantingAreas: PlannerPlantingArea[] = [
  { id: "base-area-1", bedId: 1, crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 10, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-2", bedId: 2, crop: "Strawberry", cropIcon: "🍓", variety: "Camarosa", spacingCm: 35, x: 0, y: 0, w: 100, h: 100, count: 21, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-5", bedId: 5, crop: "Strawberry", cropIcon: "🍓", variety: "Albion", spacingCm: 35, x: 0, y: 0, w: 100, h: 100, count: 18, pattern: "grid", iconSize: 16, visualSpacing: "normal" },
  { id: "base-area-9", bedId: 9, crop: "Bean", cropIcon: "🫘", variety: "King Purple", spacingCm: 18, x: 0, y: 0, w: 100, h: 100, count: 70, pattern: "grid", iconSize: 14, visualSpacing: "normal" },
];

const baseObjects: PlannerLayoutObject[] = [
  { id: "layout-path-main", type: "path", x1: 485, y1: 180, x2: 485, y2: 930, widthCm: 45, label: "Main path" },
  { id: "layout-path-cross", type: "path", x1: 120, y1: 560, x2: 820, y2: 560, widthCm: 45, label: "Cross path" },
  { id: "layout-trellis-north", type: "trellis", x1: 240, y1: 180, x2: 240, y2: 500, heightCm: 180, postSpacingCm: 150, label: "Post & trellis" },
  { id: "layout-tree-north", type: "tree", x: 360, y: 210, diameterCm: 100, label: "Fruit tree" },
  { id: "layout-text-entrance", type: "text", x: 450, y: 28, text: "ENTRANCE", fontSize: 13 },
  { id: "layout-text-exit", type: "text", x: 28, y: 565, text: "EXIT", fontSize: 13 },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const basePlan: PlanState = { beds: baseBeds, plantingAreas: basePlantingAreas, rows: [], objects: baseObjects };
const emptyPlan: PlanState = { beds: [], plantingAreas: [], rows: [], objects: [] };

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function lineLength(line: { x1: number; y1: number; x2: number; y2: number }) { return Math.hypot(line.x2 - line.x1, line.y2 - line.y1); }
function lineVisual(line: { x1: number; y1: number; x2: number; y2: number }) { return { length: lineLength(line), angle: Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI }; }
function bedCm(bed: Bed) { return { x: bed.x / 100 * CANVAS_WIDTH, y: bed.y / 100 * CANVAS_HEIGHT, w: bed.w / 100 * CANVAS_WIDTH, h: bed.h / 100 * CANVAS_HEIGHT }; }
function cmBed(id: number, name: string, rect: { x: number; y: number; w: number; h: number }): Bed { return { id, name, x: rect.x / CANVAS_WIDTH * 100, y: rect.y / CANVAS_HEIGHT * 100, w: rect.w / CANVAS_WIDTH * 100, h: rect.h / CANVAS_HEIGHT * 100 }; }
function bedSizeLabel(bed: Bed) { const size = bedCm(bed); return `${(size.w / 100).toFixed(1)} × ${(size.h / 100).toFixed(1)} m`; }
function rowCount(row: { x1: number; y1: number; x2: number; y2: number }, spacing: number) { return Math.max(1, Math.floor(lineLength(row) / spacing) + 1); }
function uuid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function uniqueBedId() { return Date.now() * 1000 + Math.floor(Math.random() * 1000); }
function nextBedLabel(beds: Bed[]) {
  const highest = beds.reduce((max, bed) => {
    const match = bed.name.match(/^Bed\s+(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `Bed ${highest + 1}`;
}
function isRowInteraction(interaction: Interaction): interaction is RowInteraction { return interaction.kind === "row-drag" || interaction.kind === "row-start" || interaction.kind === "row-end"; }
function isPlantingInteraction(interaction: Interaction): interaction is PlantingInteraction { return interaction.kind === "planting-drag" || interaction.kind === "planting-resize"; }
function clonePlan(plan: PlanState): PlanState { return structuredClone(plan); }

function legacyAreas(beds: Bed[]): PlannerPlantingArea[] {
  return beds.flatMap((bed) => bed.crop && bed.cropIcon && bed.spacingCm ? [{
    id: `legacy-bed-${bed.id}`,
    bedId: bed.id,
    crop: bed.crop,
    cropIcon: bed.cropIcon,
    variety: bed.variety ?? bed.crop,
    spacingCm: bed.spacingCm,
    x: 0, y: 0, w: 100, h: 100,
    count: Math.max(1, bed.cropCount ?? 1),
    pattern: "grid" as const,
    iconSize: 16,
    visualSpacing: "normal" as const,
  }] : []);
}

function normalisePlan(value: Partial<PlanState> | null | undefined): PlanState | null {
  if (!value || !Array.isArray(value.beds) || !Array.isArray(value.rows)) return null;
  return {
    beds: value.beds,
    plantingAreas: Array.isArray(value.plantingAreas) ? value.plantingAreas : legacyAreas(value.beds),
    rows: value.rows,
    objects: Array.isArray(value.objects) ? value.objects : baseObjects,
  };
}

function readLocalPlan(gardenId: string) {
  try { return normalisePlan(JSON.parse(localStorage.getItem(gardenLocalPlanKey(gardenId)) ?? "null") as Partial<PlanState>); } catch { return null; }
}

export function GardenPlanner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [panelOpen, setPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(90);
  const [month, setMonth] = useState("Sep");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [plan, setPlan] = useState<PlanState>(basePlan);
  const [past, setPast] = useState<PlanState[]>([]);
  const [future, setFuture] = useState<PlanState[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: "bed", id: "1" });
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [selectedPlant, setSelectedPlant] = useState(plants[0]);
  const [selectedVariety, setSelectedVariety] = useState(plants[0].varieties[0]);
  const [placementMode, setPlacementMode] = useState<PlannerPlantingPattern>("grid");
  const [dragPlant, setDragPlant] = useState<PlantOption | null>(null);
  const [dropBedId, setDropBedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [plantType, setPlantType] = useState("All Plants");
  const [pathWidth, setPathWidth] = useState(75);
  const [trellisHeight, setTrellisHeight] = useState(180);
  const [postSpacing, setPostSpacing] = useState(150);
  const [treeDiameter, setTreeDiameter] = useState(150);
  const [newText, setNewText] = useState("Label");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadSource, setLoadSource] = useState<LoadSource>("starting");

  useEffect(() => {
    let cancelled = false;
    const gardenId = readActiveGardenId();
    const local = readLocalPlan(gardenId);
    if (local) {
      setPlan(local);
      setLoadSource("local");
    } else {
      setPlan(gardenId === DEFAULT_GARDEN_ID ? clonePlan(basePlan) : clonePlan(emptyPlan));
      setSelection(gardenId === DEFAULT_GARDEN_ID ? { kind: "bed", id: "1" } : null);
      setLoadSource("default");
    }
    void (async () => {
      try {
        const response = await fetch("/api/garden?gardenId=" + encodeURIComponent(gardenId), { cache: "no-store" });
        const data = await response.json() as GardenPlanApiResponse;
        const cloud = normalisePlan(data.plan);
        if (cancelled || !response.ok || !data.ok || !cloud) return;
        setPlan(cloud);
        setSelection(cloud.beds.length ? { kind: "bed", id: String(cloud.beds[0].id) } : null);
        localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(cloud));
        setLoadSource("cloud");
      } catch { /* keep local or blank plan */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Publish every in-memory planner change for the WebGL companion.
  // This does not save to D1 and does not change the normal Save workflow.
  useEffect(() => {
    if (loadSource === "starting") return;
    try {
      const gardenId = readActiveGardenId();
      localStorage.setItem(gardenLivePlanKey(gardenId), JSON.stringify(plan));
      window.dispatchEvent(new CustomEvent(LIVE_PLAN_EVENT, { detail: { gardenId, plan } }));
    } catch {
      // Live preview is best-effort; planner editing must keep working if storage is unavailable.
    }
  }, [plan, loadSource]);

  const selectedBed = selection?.kind === "bed" ? plan.beds.find((item) => String(item.id) === selection.id) ?? null : null;
  const selectedPlanting = selection?.kind === "planting" ? plan.plantingAreas.find((item) => item.id === selection.id) ?? null : null;
  const selectedRow = selection?.kind === "row" ? plan.rows.find((item) => item.id === selection.id) ?? null : null;
  const selectedObject = selection?.kind === "object" ? plan.objects.find((item) => item.id === selection.id) ?? null : null;
  const selectedPlantingBed = selectedPlanting ? plan.beds.find((bed) => bed.id === selectedPlanting.bedId) ?? null : null;

  const filteredPlants = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return plants.filter((plant) => (plantType === "All Plants" || plant.type === plantType)
      && (!needle || plant.name.toLowerCase().includes(needle) || plant.varieties.some((variety) => variety.toLowerCase().includes(needle))));
  }, [search, plantType]);

  function snap(value: number) { return snapEnabled ? Math.round(value / SNAP_CM) * SNAP_CM : Math.round(value); }
  function snapPoint(point: Point) { return { x: clamp(snap(point.x), 0, CANVAS_WIDTH), y: clamp(snap(point.y), 0, CANVAS_HEIGHT) }; }
  function canvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    return snapPoint({ x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale });
  }
  function areaSizeCm(area: PlannerPlantingArea, bed: Bed) {
    const size = bedCm(bed);
    return { width: size.w * area.w / 100, height: size.h * area.h / 100 };
  }
  function areaCount(area: PlannerPlantingArea, bed: Bed) {
    const size = areaSizeCm(area, bed);
    return plantCountForArea(area, size.width, size.height);
  }
  function remember() { setPast((items) => [...items, clonePlan(plan)].slice(-40)); setFuture([]); }
  function commit(next: PlanState) { remember(); setPlan(next); setSaveState("idle"); }
  function edit(mutator: (current: PlanState) => PlanState) { remember(); setPlan((current) => mutator(current)); setSaveState("idle"); }

  function chooseTool(next: Tool) { setTool(next); setPanelOpen(true); setDraft(null); setInteraction(null); }
  function choosePlant(plant: PlantOption) { setSelectedPlant(plant); setSelectedVariety(plant.varieties[0]); }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture((items) => [clonePlan(plan), ...items].slice(0, 40));
    setPast((items) => items.slice(0, -1));
    setPlan(previous); setSaveState("idle"); setInteraction(null); setDraft(null);
  }
  function redo() {
    if (!future.length) return;
    const next = future[0];
    setPast((items) => [...items, clonePlan(plan)].slice(-40));
    setFuture((items) => items.slice(1));
    setPlan(next); setSaveState("idle"); setInteraction(null); setDraft(null);
  }

  function makePlantingArea(bed: Bed, plant: PlantOption, variety: string, center?: { x: number; y: number }, full = false) {
    const size = bedCm(bed);
    const existing = plan.plantingAreas.filter((area) => area.bedId === bed.id).length;
    let w = 100, h = 100, x = 0, y = 0;
    if (!full) {
      const desiredW = Math.min(size.w, Math.max(120, plant.spacingCm * 3));
      const desiredH = Math.min(size.h, Math.max(120, plant.spacingCm * 3));
      w = clamp(desiredW / size.w * 100, 12, 100);
      h = clamp(desiredH / size.h * 100, 12, 100);
      const target = center ?? { x: existing % 2 === 0 ? 30 : 70, y: existing % 4 < 2 ? 35 : 70 };
      x = clamp(target.x - w / 2, 0, 100 - w);
      y = clamp(target.y - h / 2, 0, 100 - h);
    }
    const area: PlannerPlantingArea = {
      id: uuid("area"),
      bedId: bed.id,
      crop: plant.name,
      cropIcon: plant.icon,
      variety,
      spacingCm: plant.spacingCm,
      x, y, w, h,
      count: 1,
      pattern: placementMode,
      iconSize: 18,
      visualSpacing: "normal",
    };
    area.count = areaCount(area, bed);
    return area;
  }

  function plantBed(bed: Bed) {
    const full = !plan.plantingAreas.some((area) => area.bedId === bed.id);
    const area = makePlantingArea(bed, selectedPlant, selectedVariety, undefined, full);
    commit({ ...plan, plantingAreas: [...plan.plantingAreas, area] });
    setSelection({ kind: "planting", id: area.id });
  }

  function dropPlantIntoBed(event: ReactDragEvent<HTMLElement>, bed: Bed) {
    if (!dragPlant) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const center = {
      x: clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 100, 0, 100),
      y: clamp((event.clientY - rect.top) / Math.max(1, rect.height) * 100, 0, 100),
    };
    const variety = selectedPlant.name === dragPlant.name ? selectedVariety : dragPlant.varieties[0];
    const area = makePlantingArea(bed, dragPlant, variety, center, false);
    commit({ ...plan, plantingAreas: [...plan.plantingAreas, area] });
    setSelection({ kind: "planting", id: area.id });
    setTool("select");
    setDragPlant(null);
    setDropBedId(null);
  }

  function startBedInteraction(event: ReactPointerEvent<HTMLElement>, bed: Bed, resize = false) {
    event.stopPropagation();
    setSelection({ kind: "bed", id: String(bed.id) });
    if (tool === "plant") { plantBed(bed); return; }
    if (tool !== "select" && tool !== "bed") return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    remember();
    setInteraction({ kind: resize ? "bed-resize" : "bed-drag", id: bed.id, start: point, bed: structuredClone(bed) });
  }

  function startPlantingInteraction(event: ReactPointerEvent<HTMLElement>, area: PlannerPlantingArea, resize = false) {
    event.stopPropagation();
    if (tool !== "select" && tool !== "plant") return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    setSelection({ kind: "planting", id: area.id });
    remember();
    setInteraction({ kind: resize ? "planting-resize" : "planting-drag", id: area.id, start: point, area: structuredClone(area) });
  }

  function startRowInteraction(event: ReactPointerEvent<HTMLElement>, row: PlantingRow, mode: "row-drag" | "row-start" | "row-end" = "row-drag") {
    event.stopPropagation();
    if (tool !== "select" && tool !== "row") return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    setSelection({ kind: "row", id: row.id }); remember();
    setInteraction({ kind: mode, id: row.id, start: point, row: { ...row } });
  }

  function startObjectInteraction(event: ReactPointerEvent<HTMLElement>, object: PlannerLayoutObject, mode: "object-drag" | "object-start" | "object-end" | "tree-resize" = "object-drag") {
    event.stopPropagation();
    if (tool !== "select" && tool !== object.type && !(tool === "note" && object.type === "text")) return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    setSelection({ kind: "object", id: object.id }); remember();
    setInteraction({ kind: mode, id: object.id, start: point, object: structuredClone(object) });
  }

  useEffect(() => {
    if (!interaction) return;
    const active = interaction;
    const move = (event: PointerEvent) => {
      const point = canvasPoint(event.clientX, event.clientY);
      if (!point) return;
      const dx = point.x - active.start.x;
      const dy = point.y - active.start.y;
      setPlan((current) => {
        if (active.kind === "bed-drag" || active.kind === "bed-resize") {
          const start = bedCm(active.bed);
          let changedBed: Bed | null = null;
          const beds = current.beds.map((bed) => {
            if (bed.id !== active.id) return bed;
            if (active.kind === "bed-drag") {
              const x = clamp(snap(start.x + dx), 0, CANVAS_WIDTH - start.w);
              const y = clamp(snap(start.y + dy), 0, CANVAS_HEIGHT - start.h);
              changedBed = { ...bed, x: x / CANVAS_WIDTH * 100, y: y / CANVAS_HEIGHT * 100 };
            } else {
              const w = clamp(snap(start.w + dx), 40, CANVAS_WIDTH - start.x);
              const h = clamp(snap(start.h + dy), 40, CANVAS_HEIGHT - start.y);
              changedBed = { ...bed, w: w / CANVAS_WIDTH * 100, h: h / CANVAS_HEIGHT * 100 };
            }
            return changedBed;
          });
          const plantingAreas = changedBed && active.kind === "bed-resize"
            ? current.plantingAreas.map((area) => area.bedId === active.id ? { ...area, count: areaCount(area, changedBed!) } : area)
            : current.plantingAreas;
          return { ...current, beds, plantingAreas };
        }
        if (isPlantingInteraction(active)) {
          const bed = current.beds.find((item) => item.id === active.area.bedId);
          if (!bed) return current;
          const size = bedCm(bed);
          const dxPct = dx / Math.max(1, size.w) * 100;
          const dyPct = dy / Math.max(1, size.h) * 100;
          return { ...current, plantingAreas: current.plantingAreas.map((area) => {
            if (area.id !== active.id) return area;
            let next = { ...area };
            if (active.kind === "planting-drag") {
              next.x = clamp(active.area.x + dxPct, 0, 100 - active.area.w);
              next.y = clamp(active.area.y + dyPct, 0, 100 - active.area.h);
            } else {
              const minW = clamp(30 / Math.max(1, size.w) * 100, 5, 40);
              const minH = clamp(30 / Math.max(1, size.h) * 100, 5, 40);
              next.w = clamp(active.area.w + dxPct, minW, 100 - active.area.x);
              next.h = clamp(active.area.h + dyPct, minH, 100 - active.area.y);
            }
            next.count = areaCount(next, bed);
            return next;
          }) };
        }
        if (isRowInteraction(active)) {
          return { ...current, rows: current.rows.map((row) => {
            if (row.id !== active.id) return row;
            let next = { ...row };
            if (active.kind === "row-drag") next = { ...next, x1: clamp(snap(active.row.x1 + dx), 0, CANVAS_WIDTH), y1: clamp(snap(active.row.y1 + dy), 0, CANVAS_HEIGHT), x2: clamp(snap(active.row.x2 + dx), 0, CANVAS_WIDTH), y2: clamp(snap(active.row.y2 + dy), 0, CANVAS_HEIGHT) };
            if (active.kind === "row-start") next = { ...next, x1: point.x, y1: point.y };
            if (active.kind === "row-end") next = { ...next, x2: point.x, y2: point.y };
            return { ...next, count: rowCount(next, next.spacingCm) };
          }) };
        }
        if (!("object" in active)) return current;
        const original = active.object;
        return { ...current, objects: current.objects.map((object) => {
          if (object.id !== active.id) return object;
          if (active.kind === "tree-resize" && original.type === "tree") return { ...object, ...(object.type === "tree" ? { diameterCm: clamp(snap(Math.hypot(point.x - original.x, point.y - original.y) * 2), 30, 1000) } : {}) } as PlannerLayoutObject;
          if (original.type === "path" || original.type === "trellis") {
            if (object.type !== original.type) return object;
            if (active.kind === "object-start") return { ...object, x1: point.x, y1: point.y };
            if (active.kind === "object-end") return { ...object, x2: point.x, y2: point.y };
            return { ...object, x1: clamp(snap(original.x1 + dx), 0, CANVAS_WIDTH), y1: clamp(snap(original.y1 + dy), 0, CANVAS_HEIGHT), x2: clamp(snap(original.x2 + dx), 0, CANVAS_WIDTH), y2: clamp(snap(original.y2 + dy), 0, CANVAS_HEIGHT) };
          }
          if (original.type === "tree" && object.type === "tree") return { ...object, x: clamp(snap(original.x + dx), 0, CANVAS_WIDTH), y: clamp(snap(original.y + dy), 0, CANVAS_HEIGHT) };
          if (original.type === "text" && object.type === "text") return { ...object, x: clamp(snap(original.x + dx), 0, CANVAS_WIDTH), y: clamp(snap(original.y + dy), 0, CANVAS_HEIGHT) };
          return object;
        }) };
      });
      setSaveState("idle");
    };
    const up = () => setInteraction(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [interaction, snapEnabled, zoom]);

  function canvasDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".plan-bed,.planting-area,.planting-row,.layout-object")) return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    setCursorPoint(point);
    if (["bed", "row", "path", "trellis"].includes(tool)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraft({ kind: tool as "bed" | "row" | "path" | "trellis", start: point, end: point });
      return;
    }
    if (tool === "tree") {
      const object: PlannerLayoutObject = { id: uuid("tree"), type: "tree", x: point.x, y: point.y, diameterCm: treeDiameter, label: "Tree" };
      commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id }); return;
    }
    if (tool === "note") {
      const object: PlannerLayoutObject = { id: uuid("text"), type: "text", x: point.x, y: point.y, text: newText.trim() || "Label", fontSize: 13 };
      commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id });
    }
  }

  function canvasMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = canvasPoint(event.clientX, event.clientY);
    if (point) setCursorPoint(point);
    if (point && draft) setDraft((current) => current ? { ...current, end: point } : null);
  }

  function canvasUp() {
    if (!draft) return;
    const current = draft; setDraft(null);
    if (current.kind === "bed") {
      const x = Math.min(current.start.x, current.end.x), y = Math.min(current.start.y, current.end.y);
      const w = Math.abs(current.end.x - current.start.x), h = Math.abs(current.end.y - current.start.y);
      if (w < 40 || h < 40) return;
      const id = uniqueBedId();
      const bed = cmBed(id, nextBedLabel(plan.beds), { x, y, w, h });
      commit({ ...plan, beds: [...plan.beds, bed] }); setSelection({ kind: "bed", id: String(id) }); return;
    }
    if (lineLength({ x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y }) < 20) return;
    if (current.kind === "row") {
      const row: PlantingRow = { id: uuid("row"), crop: selectedPlant.name, cropIcon: selectedPlant.icon, variety: selectedVariety, spacingCm: selectedPlant.spacingCm, x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y, count: rowCount({ x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y }, selectedPlant.spacingCm) };
      commit({ ...plan, rows: [...plan.rows, row] }); setSelection({ kind: "row", id: row.id }); return;
    }
    const object: PlannerLayoutObject = current.kind === "path"
      ? { id: uuid("path"), type: "path", x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y, widthCm: pathWidth, label: "Path" }
      : { id: uuid("trellis"), type: "trellis", x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y, heightCm: trellisHeight, postSpacingCm: postSpacing, label: "Trellis" };
    commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id });
  }

  function deleteSelection() {
    if (!selection) return;
    edit((current) => {
      if (selection.kind === "bed") {
        const bedId = Number(selection.id);
        return { ...current, beds: current.beds.filter((bed) => bed.id !== bedId), plantingAreas: current.plantingAreas.filter((area) => area.bedId !== bedId) };
      }
      if (selection.kind === "planting") return { ...current, plantingAreas: current.plantingAreas.filter((area) => area.id !== selection.id) };
      if (selection.kind === "row") return { ...current, rows: current.rows.filter((row) => row.id !== selection.id) };
      return { ...current, objects: current.objects.filter((object) => object.id !== selection.id) };
    });
    setSelection(null);
  }

  function duplicateSelection() {
    if (!selection) return;
    if (selectedBed) {
      const id = uniqueBedId();
      const size = bedCm(selectedBed);
      const bed = { ...selectedBed, id, name: nextBedLabel(plan.beds), x: clamp((size.x + 20) / CANVAS_WIDTH * 100, 0, 100 - selectedBed.w), y: clamp((size.y + 20) / CANVAS_HEIGHT * 100, 0, 100 - selectedBed.h) };
      const areas = plan.plantingAreas.filter((area) => area.bedId === selectedBed.id).map((area) => ({ ...area, id: uuid("area"), plantingId: undefined, bedId: id }));
      commit({ ...plan, beds: [...plan.beds, bed], plantingAreas: [...plan.plantingAreas, ...areas] }); setSelection({ kind: "bed", id: String(id) });
    } else if (selectedPlanting) {
      const copy = { ...selectedPlanting, id: uuid("area"), plantingId: undefined, x: clamp(selectedPlanting.x + 5, 0, 100 - selectedPlanting.w), y: clamp(selectedPlanting.y + 5, 0, 100 - selectedPlanting.h) };
      commit({ ...plan, plantingAreas: [...plan.plantingAreas, copy] }); setSelection({ kind: "planting", id: copy.id });
    } else if (selectedRow) {
      const row = { ...selectedRow, id: uuid("row"), x1: clamp(selectedRow.x1 + 20, 0, CANVAS_WIDTH), y1: clamp(selectedRow.y1 + 20, 0, CANVAS_HEIGHT), x2: clamp(selectedRow.x2 + 20, 0, CANVAS_WIDTH), y2: clamp(selectedRow.y2 + 20, 0, CANVAS_HEIGHT) };
      commit({ ...plan, rows: [...plan.rows, row] }); setSelection({ kind: "row", id: row.id });
    } else if (selectedObject) {
      let object = structuredClone(selectedObject);
      object.id = uuid(object.type);
      if (object.type === "path" || object.type === "trellis") object = { ...object, x1: clamp(object.x1 + 20, 0, CANVAS_WIDTH), y1: clamp(object.y1 + 20, 0, CANVAS_HEIGHT), x2: clamp(object.x2 + 20, 0, CANVAS_WIDTH), y2: clamp(object.y2 + 20, 0, CANVAS_HEIGHT) };
      else object = { ...object, x: clamp(object.x + 20, 0, CANVAS_WIDTH), y: clamp(object.y + 20, 0, CANVAS_HEIGHT) };
      commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id });
    }
  }

  function clearBed() {
    if (!selectedBed) return;
    edit((current) => ({ ...current, plantingAreas: current.plantingAreas.filter((area) => area.bedId !== selectedBed.id) }));
  }

  async function savePlan() {
    const gardenId = readActiveGardenId();
    localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(plan)); setSaveState("saving");
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) { setSaveState("local"); return; }
    try {
      const response = await fetch(`/api/garden?gardenId=${encodeURIComponent(gardenId)}`, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` }, body: JSON.stringify({ plan }) });
      const data = await response.json() as GardenPlanApiResponse;
      if (!response.ok || !data.ok) { if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION); setSaveState("local"); return; }
      setLoadSource("cloud"); setSaveState("cloud"); window.setTimeout(() => setSaveState("idle"), 1800);
    } catch { setSaveState("local"); }
  }

  function updatePlanting(id: string, mutate: (area: PlannerPlantingArea, bed: Bed) => PlannerPlantingArea) {
    setPlan((current) => ({ ...current, plantingAreas: current.plantingAreas.map((area) => {
      if (area.id !== id) return area;
      const bed = current.beds.find((item) => item.id === area.bedId);
      return bed ? mutate(area, bed) : area;
    }) }));
    setSaveState("idle");
  }

  function selectionInspector() {
    if (selectedPlanting && selectedPlantingBed) {
      const bedSize = bedCm(selectedPlantingBed);
      const widthM = bedSize.w * selectedPlanting.w / 100 / 100;
      const heightM = bedSize.h * selectedPlanting.h / 100 / 100;
      return <div className="gv-selection-panel gv-planting-inspector" data-bed-id={selectedPlanting.bedId} data-planting-id={selectedPlanting.plantingId ?? ""}>
        <div className="gv-selection-hero"><span>{selectedPlanting.cropIcon}</span><div><small>PLANTING AREA</small><h2>{selectedPlanting.variety}</h2><p>{selectedPlantingBed.name} · {widthM.toFixed(1)} × {heightM.toFixed(1)} m</p></div></div>
        <dl><div><dt>Crop</dt><dd>{selectedPlanting.crop}</dd></div><div><dt>Plants</dt><dd>≈ {selectedPlanting.count}</dd></div><div><dt>Spacing</dt><dd>{selectedPlanting.spacingCm} cm centres</dd></div></dl>
        <label>Variety<input value={selectedPlanting.variety} onChange={(event) => updatePlanting(selectedPlanting.id, (area) => ({ ...area, variety: event.target.value || area.crop }))} /></label>
        <label>Actual plant spacing (cm)<input type="number" min={2} value={selectedPlanting.spacingCm} onChange={(event) => updatePlanting(selectedPlanting.id, (area, bed) => { const next = { ...area, spacingCm: Math.max(2, Number(event.target.value) || 2) }; return { ...next, count: areaCount(next, bed) }; })} /></label>
        <p className="gv-scale-note">↔ The plant centres on the canvas are drawn {selectedPlanting.spacingCm} cm apart at the garden scale.</p>
        <label>Icon size <strong>{selectedPlanting.iconSize}px</strong><input type="range" min={8} max={64} step={1} value={selectedPlanting.iconSize} onChange={(event) => updatePlanting(selectedPlanting.id, (area) => ({ ...area, iconSize: Number(event.target.value) }))} /></label>
        <label>Layout<select value={selectedPlanting.pattern} onChange={(event) => updatePlanting(selectedPlanting.id, (area, bed) => { const next = { ...area, pattern: event.target.value as PlannerPlantingPattern }; return { ...next, count: areaCount(next, bed) }; })}><option value="grid">Block</option><option value="staggered">Staggered</option><option value="rows">Rows</option><option value="natural">Natural</option><option value="single">Single</option></select></label>
        <p className="gv-help">Drag this planting to move it within the bed. Drag the square handle to resize the planted area; plant count recalculates from the real centimetre spacing.</p>
        <button type="button" className="gv-secondary-action">📷 Photos & video</button>
        <button type="button" className="gv-secondary-action">📝 Notes & harvests</button>
        <div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Remove planting</button></div>
      </div>;
    }
    if (selectedBed) {
      const size = bedCm(selectedBed);
      const areas = plan.plantingAreas.filter((area) => area.bedId === selectedBed.id);
      const totalPlants = areas.reduce((sum, area) => sum + area.count, 0);
      return <div className="gv-selection-panel" data-bed-id={selectedBed.id}>
        <div className="gv-selection-hero"><span>▭</span><div><small>BED</small><h2>{selectedBed.name}</h2><p>{bedSizeLabel(selectedBed)}</p></div></div>
        <label>Name<input value={selectedBed.name} onChange={(event) => setPlan((current) => ({ ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? { ...bed, name: event.target.value } : bed) }))} /></label>
        <div className="gv-field-grid"><label>Width (cm)<input type="number" value={Math.round(size.w)} onChange={(event) => { const w = clamp(Number(event.target.value) || 40, 40, CANVAS_WIDTH - size.x); setPlan((current) => { const nextBed = { ...selectedBed, w: w / CANVAS_WIDTH * 100 }; return { ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? nextBed : bed), plantingAreas: current.plantingAreas.map((area) => area.bedId === selectedBed.id ? { ...area, count: areaCount(area, nextBed) } : area) }; }); }} /></label><label>Length (cm)<input type="number" value={Math.round(size.h)} onChange={(event) => { const h = clamp(Number(event.target.value) || 40, 40, CANVAS_HEIGHT - size.y); setPlan((current) => { const nextBed = { ...selectedBed, h: h / CANVAS_HEIGHT * 100 }; return { ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? nextBed : bed), plantingAreas: current.plantingAreas.map((area) => area.bedId === selectedBed.id ? { ...area, count: areaCount(area, nextBed) } : area) }; }); }} /></label></div>
        <dl><div><dt>Area</dt><dd>{(size.w * size.h / 10000).toFixed(1)} m²</dd></div><div><dt>Plantings</dt><dd>{areas.length}</dd></div><div><dt>Plants</dt><dd>≈ {totalPlants}</dd></div></dl>
        <button type="button" className="gv-primary-action" onClick={() => chooseTool("plant")}>🌱 Add planting area</button>
        <button type="button" className="gv-secondary-action">📷 Photos & video</button>
        <button type="button" className="gv-secondary-action">📝 Notes & harvests</button>
        {areas.length > 0 && <button type="button" className="gv-secondary-action" onClick={clearBed}>Clear all plantings</button>}
        <div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Remove bed</button></div>
      </div>;
    }
    if (selectedRow) return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>{selectedRow.cropIcon}</span><div><small>PLANTING ROW</small><h2>{selectedRow.variety}</h2><p>{(lineLength(selectedRow) / 100).toFixed(1)} m · ≈ {selectedRow.count} plants</p></div></div><label>Spacing (cm)<input type="number" value={selectedRow.spacingCm} min={2} onChange={(event) => { const spacing = Math.max(2, Number(event.target.value) || 2); setPlan((current) => ({ ...current, rows: current.rows.map((row) => row.id === selectedRow.id ? { ...row, spacingCm: spacing, count: rowCount(row, spacing) } : row) })); }} /></label><p className="gv-help">Drag the row to move it. Drag either round endpoint to change its length or angle.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (!selectedObject) return null;
    if (selectedObject.type === "path") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>═</span><div><small>PATH</small><h2>{selectedObject.label ?? "Path"}</h2><p>{(lineLength(selectedObject) / 100).toFixed(1)} m long</p></div></div><label>Label<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "path" ? { ...object, label: event.target.value } : object) }))} /></label><label>Width (cm)<input type="number" min={20} max={400} value={selectedObject.widthCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "path" ? { ...object, widthCm: clamp(Number(event.target.value) || 20, 20, 400) } : object) }))} /></label><p className="gv-help">Drag the path to move it. Drag either endpoint to reshape it.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (selectedObject.type === "trellis") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>⋮</span><div><small>TRELLIS</small><h2>{selectedObject.label ?? "Trellis"}</h2><p>{(lineLength(selectedObject) / 100).toFixed(1)} m long</p></div></div><label>Label<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, label: event.target.value } : object) }))} /></label><div className="gv-field-grid"><label>Height (cm)<input type="number" value={selectedObject.heightCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, heightCm: clamp(Number(event.target.value) || 50, 50, 500) } : object) }))} /></label><label>Posts (cm)<input type="number" value={selectedObject.postSpacingCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, postSpacingCm: clamp(Number(event.target.value) || 50, 30, 1000) } : object) }))} /></label></div><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (selectedObject.type === "tree") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>🌳</span><div><small>TREE / SHADE</small><h2>{selectedObject.label ?? "Tree"}</h2><p>{(selectedObject.diameterCm / 100).toFixed(1)} m canopy</p></div></div><label>Name<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "tree" ? { ...object, label: event.target.value } : object) }))} /></label><label>Canopy diameter (cm)<input type="range" min={30} max={600} step={10} value={selectedObject.diameterCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "tree" ? { ...object, diameterCm: Number(event.target.value) } : object) }))} /><strong>{selectedObject.diameterCm} cm</strong></label><p className="gv-help">Drag the tree to move it. Drag the square handle on the canopy edge to resize visually.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>A</span><div><small>TEXT LABEL</small><h2>{selectedObject.text}</h2><p>Canvas label</p></div></div><label>Text<input value={selectedObject.text} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "text" ? { ...object, text: event.target.value || "Label" } : object) }))} /></label><label>Size<input type="range" min={9} max={28} value={selectedObject.fontSize} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "text" ? { ...object, fontSize: Number(event.target.value) } : object) }))} /></label><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
  }

  function plantCatalog() {
    const modeLabel = (mode: PlannerPlantingPattern) => mode === "grid" ? "Block" : mode === "staggered" ? "Stagger" : mode === "rows" ? "Rows" : mode === "natural" ? "Natural" : "Single";
    return <><div className="gv-panel-section-title"><div><span className="gv-panel-leaf">🌱</span><strong>{tool === "row" ? "Planting rows" : "Plants"}</strong></div></div><div className="gv-filters"><label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Plant or variety" /></label><label>Type<select value={plantType} onChange={(event) => setPlantType(event.target.value)}><option>All Plants</option><option>Vegetable</option><option>Fruit</option><option>Herb</option></select></label><label>Variety<select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)}>{selectedPlant.varieties.map((variety) => <option key={variety}>{variety}</option>)}</select></label></div>{tool === "plant" && <div className="gv-v4-modebar"><span>Placement</span>{(["grid", "staggered", "rows", "natural", "single"] as PlannerPlantingPattern[]).map((mode) => <button key={mode} type="button" className={placementMode === mode ? "active" : ""} onClick={() => setPlacementMode(mode)}>{modeLabel(mode)}</button>)}</div>}<div className="gv-ready-strip"><span>{selectedPlant.icon}</span><div><small>{tool === "plant" ? "DRAG INTO A BED" : "READY TO DRAW"}</small><strong>{selectedVariety}</strong><em>{selectedPlant.spacingCm} cm canvas spacing · recommended {selectedPlant.spacing}</em></div></div><div className="gv-plant-list">{filteredPlants.map((plant) => <button draggable={tool === "plant"} type="button" key={plant.name} className={selectedPlant.name === plant.name ? "active" : ""} onClick={() => choosePlant(plant)} onDragStart={(event) => { choosePlant(plant); setDragPlant(plant); event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", plant.name); }} onDragEnd={() => { setDragPlant(null); setDropBedId(null); }}><span className="gv-plant-icon">{plant.icon}</span><span><strong>{plant.name}</strong><small>{plant.spacingCm} cm default · {plant.spacing}</small></span>{tool === "plant" && <b className="gv-v4-drag-grip">⋮⋮</b>}</button>)}</div></>;
  }

  function toolPanel() {
    const current = tools.find((item) => item.id === tool)!;
    return <div className="gv-tool-panel"><div className="gv-tool-hero"><span>{current.icon}</span><div><h2>{current.label}</h2><p>{current.hint}</p></div></div>{tool === "bed" && <><strong>Click-drag on the grid</strong><p>Dimensions appear while you draw. New beds can be moved, resized, duplicated and planted immediately.</p></>}{tool === "path" && <label>Path width (cm)<input type="number" min={20} max={400} value={pathWidth} onChange={(event) => setPathWidth(clamp(Number(event.target.value) || 20, 20, 400))} /></label>}{tool === "trellis" && <div className="gv-field-grid"><label>Height (cm)<input type="number" value={trellisHeight} onChange={(event) => setTrellisHeight(clamp(Number(event.target.value) || 50, 50, 500))} /></label><label>Post spacing<input type="number" value={postSpacing} onChange={(event) => setPostSpacing(clamp(Number(event.target.value) || 50, 30, 1000))} /></label></div>}{tool === "tree" && <label>Canopy diameter (cm)<input type="number" value={treeDiameter} onChange={(event) => setTreeDiameter(clamp(Number(event.target.value) || 30, 30, 600))} /></label>}{tool === "note" && <label>New label<input value={newText} onChange={(event) => setNewText(event.target.value)} /></label>}<div className="gv-tool-tip"><kbd>{snapEnabled ? "10 cm" : "Free"}</kbd><span>{snapEnabled ? "Objects snap to the planning grid." : "Snap is off for fine placement."}</span></div></div>;
  }

  function contextPanel() {
    const inspect = selectionInspector();
    if (inspect && (tool === "select" || (selectedBed && tool === "bed") || (selectedPlanting && tool === "plant") || (selectedRow && tool === "row") || (selectedObject && (tool === selectedObject.type || (tool === "note" && selectedObject.type === "text"))))) return inspect;
    if (tool === "plant" || tool === "row") return plantCatalog();
    if (tool === "select") return inspect ?? <div className="gv-empty-selection"><span>↖</span><h2>Select something</h2><p>Click a planting, bed, row, path, trellis, tree or label to edit it.</p></div>;
    return toolPanel();
  }

  function lineObject(object: Extract<PlannerLayoutObject, { type: "path" | "trellis" }>) {
    const visual = lineVisual(object), selected = selection?.kind === "object" && selection.id === object.id;
    const thickness = object.type === "path" ? object.widthCm : 22;
    return <div key={object.id} className={`layout-object layout-line ${object.type}-object ${selected ? "selected" : ""}`} style={{ left: object.x1, top: object.y1 - thickness / 2, width: visual.length, height: thickness, transform: `rotate(${visual.angle}deg)` }} onPointerDown={(event) => startObjectInteraction(event, object)}><span className="layout-line-core" />{object.label && <span className="layout-label">{object.label}</span>}{selected && <><span className="line-handle start" onPointerDown={(event) => startObjectInteraction(event, object, "object-start")} /><span className="line-handle end" onPointerDown={(event) => startObjectInteraction(event, object, "object-end")} /></>}</div>;
  }

  function renderPlantingArea(area: PlannerPlantingArea) {
    const selected = selection?.kind === "planting" && selection.id === area.id;
    const bed = plan.beds.find((item) => item.id === area.bedId);
    const areaSize = bed ? areaSizeCm(area, bed) : { width: 1, height: 1 };
    const positions = bed ? plantPositionsForArea(area, areaSize.width, areaSize.height) : [];
    return <div key={area.id} className={`planting-area ${selected ? "selected" : ""}`} data-pattern={area.pattern} style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%`, ["--area-icon-size" as string]: `${area.iconSize}px` }} onPointerDown={(event) => startPlantingInteraction(event, area)}>
      <span className="planting-area-icons">{positions.map((position, index) => <i key={index} style={{ left: position.x, top: position.y, transform: `translate(-50%, -50%) rotate(${position.rotation}deg)` }}>{area.cropIcon}</i>)}</span>
      <span className="planting-area-label">{area.cropIcon} {area.variety} · {area.count} · {area.spacingCm} cm</span>
      {selected && <span className="planting-spacing-badge">↔ {area.spacingCm} cm</span>}
      {selected && <span className="planting-area-resize" onPointerDown={(event) => startPlantingInteraction(event, area, true)} />}
    </div>;
  }

  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "cloud" ? "Saved ✓" : saveState === "local" ? "Local only" : "Save";
  const sourceLabel = loadSource === "cloud" ? "Cloud synced" : loadSource === "local" ? "Local copy" : loadSource === "starting" ? "Loading…" : "Unsynced";
  const scaledWidth = CANVAS_WIDTH * zoom / 100, scaledHeight = CANVAS_HEIGHT * zoom / 100;
  const draftRect = draft?.kind === "bed" ? { x: Math.min(draft.start.x, draft.end.x), y: Math.min(draft.start.y, draft.end.y), w: Math.abs(draft.end.x - draft.start.x), h: Math.abs(draft.end.y - draft.start.y) } : null;
  const draftLine = draft && draft.kind !== "bed" ? { x1: draft.start.x, y1: draft.start.y, x2: draft.end.x, y2: draft.end.y } : null;

  return <main className="gv-app">
    <header className="gv-titlebar"><div className="gv-title-left"><button type="button" className="gv-plan-name">BLENHEIM GARDEN <span>2026</span></button><button type="button" className="gv-settings">⚙ Settings</button><button type="button" className="gv-save" onClick={() => void savePlan()} disabled={saveState === "saving"}>💾 {saveLabel}</button></div><nav className="gv-tabs"><button type="button" className="active">Plan</button><button type="button">Photos</button><button type="button">Notes</button></nav></header>
    <div className="gv-quickbar"><div className="gv-quick-actions"><button type="button" onClick={undo} disabled={!past.length} title="Undo">↶ <span>Undo</span></button><button type="button" onClick={redo} disabled={!future.length} title="Redo">↷ <span>Redo</span></button><button type="button" className={snapEnabled ? "active" : ""} onClick={() => setSnapEnabled((value) => !value)}>⌗ <span>Snap {snapEnabled ? "10 cm" : "Off"}</span></button></div><div className="gv-quick-center"><button type="button" onClick={() => setZoom((value) => Math.max(50, value - 10))}>−</button><strong>{zoom}%</strong><button type="button" onClick={() => setZoom((value) => Math.min(150, value + 10))}>+</button><select value={month} onChange={(event) => setMonth(event.target.value)}>{months.map((item) => <option key={item}>{item}</option>)}</select></div><div className="gv-cloud-state"><span className={loadSource === "cloud" ? "online" : ""} />{sourceLabel}</div></div>
    <section className={`gv-body ${panelOpen ? "" : "panel-closed"}`}><aside className="gv-rail"><button type="button" className="gv-menu">☰</button>{tools.map((item) => <button type="button" key={item.id} className={tool === item.id ? "active" : ""} onClick={() => chooseTool(item.id)} title={item.hint}><span>{item.icon}</span><small>{item.label}</small></button>)}</aside>{panelOpen && <aside className="gv-context"><div className="gv-context-header"><strong>{tool === "select" ? "Inspector" : tools.find((item) => item.id === tool)?.label}</strong><button type="button" onClick={() => setPanelOpen(false)}>‹</button></div>{contextPanel()}</aside>}{!panelOpen && <button type="button" className="gv-panel-reopen" onClick={() => setPanelOpen(true)}>›</button>}
      <section className="gv-stage"><div className="gv-stage-status"><div><strong>{dragPlant ? `Drop ${dragPlant.name} into a bed` : tools.find((item) => item.id === tool)?.hint}</strong><span>{month} 2026</span></div>{cursorPoint && <code>X {Math.round(cursorPoint.x)} · Y {Math.round(cursorPoint.y)} cm</code>}</div><div className="gv-stage-scroll"><div className="gv-ruler-grid" style={{ width: scaledWidth + 30, gridTemplateColumns: `30px ${scaledWidth}px`, gridTemplateRows: `28px ${scaledHeight}px` }}><div className="gv-ruler-corner" /><div className="gv-ruler-top">{[0,2,4,6,8,9].map((mark) => <span key={mark} style={{ left: `${mark / 9 * 100}%` }}>{mark}m</span>)}</div><div className="gv-ruler-left">{[0,2,4,6,8,10].map((mark) => <span key={mark} style={{ top: `${mark / 10.8 * 100}%` }}>{mark}m</span>)}</div><div className="canvas-scale" style={{ width: scaledWidth, height: scaledHeight }}><div ref={canvasRef} className={`garden-canvas tool-${tool} ${snapEnabled ? "snap-on" : ""}`} style={{ transform: `scale(${zoom / 100})` }} onPointerDown={canvasDown} onPointerMove={canvasMove} onPointerUp={canvasUp} onPointerLeave={() => { if (!draft) setCursorPoint(null); }}>
        <div className="berry-strip"><strong>First-year fruiting canes · over winter</strong><div><span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🔴 Raspberry</span><span>🫐 Blackberry</span></div></div><div className="north-zone" />
        {cursorPoint && snapEnabled && tool !== "select" && <><span className="snap-guide vertical" style={{ left: cursorPoint.x }} /><span className="snap-guide horizontal" style={{ top: cursorPoint.y }} /></>}
        {plan.objects.map((object) => {
          if (object.type === "path" || object.type === "trellis") return lineObject(object);
          const selected = selection?.kind === "object" && selection.id === object.id;
          if (object.type === "tree") return <div key={object.id} className={`layout-object tree-object ${selected ? "selected" : ""}`} style={{ left: object.x - object.diameterCm / 2, top: object.y - object.diameterCm / 2, width: object.diameterCm, height: object.diameterCm }} onPointerDown={(event) => startObjectInteraction(event, object)}><span>🌳</span><small>{object.label}</small>{selected && <span className="tree-resize-handle" onPointerDown={(event) => startObjectInteraction(event, object, "tree-resize")} />}</div>;
          return <div key={object.id} className={`layout-object text-object ${selected ? "selected" : ""}`} style={{ left: object.x, top: object.y, fontSize: object.fontSize }} onPointerDown={(event) => startObjectInteraction(event, object)}>{object.text}</div>;
        })}
        {plan.rows.map((row) => { const visual = lineVisual(row), selected = selection?.kind === "row" && selection.id === row.id; return <div key={row.id} className={`planting-row ${selected ? "selected" : ""}`} style={{ left: row.x1, top: row.y1 - 12, width: visual.length, transform: `rotate(${visual.angle}deg)` }} onPointerDown={(event) => startRowInteraction(event, row)}><span className="row-dots">{Array.from({ length: Math.min(row.count, 24) }, (_, index) => <i key={index} />)}</span><span className="row-caption">{row.cropIcon} {row.variety} · {row.count}</span>{selected && <><span className="line-handle start" onPointerDown={(event) => startRowInteraction(event, row, "row-start")} /><span className="line-handle end" onPointerDown={(event) => startRowInteraction(event, row, "row-end")} /></>}</div>; })}
        {plan.beds.map((bed) => {
          const selected = selection?.kind === "bed" && selection.id === String(bed.id);
          const areas = plan.plantingAreas.filter((area) => area.bedId === bed.id);
          return <div key={bed.id} className={`plan-bed gv-v4-bed ${selected ? "selected" : ""} ${dropBedId === bed.id ? "gv-v4-drop-target" : ""}`} style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }} onPointerDown={(event) => startBedInteraction(event, bed)} onDragOver={(event) => { if (dragPlant) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDropBedId(bed.id); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropBedId(null); }} onDrop={(event) => dropPlantIntoBed(event, bed)}>
            <strong className="gv-v4-bed-title">{bed.name}</strong>
            {areas.length === 0 && <span className="empty-bed-label">Empty</span>}
            {areas.map(renderPlantingArea)}
            {selected && <span className="resize-handle" onPointerDown={(event) => startBedInteraction(event, bed, true)} />}
          </div>;
        })}
        {draftRect && <div className="draft-bed" style={{ left: draftRect.x, top: draftRect.y, width: draftRect.w, height: draftRect.h }}><span>{(draftRect.w / 100).toFixed(1)} × {(draftRect.h / 100).toFixed(1)} m</span></div>}
        {draftLine && draft && (() => { const visual = lineVisual(draftLine); return <div className={`draft-line ${draft.kind}`} style={{ left: draftLine.x1, top: draftLine.y1 - 10, width: visual.length, transform: `rotate(${visual.angle}deg)` }}><span>{(visual.length / 100).toFixed(1)} m</span></div>; })()}
      </div></div></div></div></section></section>
  </main>;
}
