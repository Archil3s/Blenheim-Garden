"use client";

import Link from "next/link";
import { parsePlanLocks, planLockKey, preservesPlanLocks } from "@/lib/garden/plan-item-locks";
import { changeIndividualPlant } from "@/lib/garden/plan-editing";
import { IndividualPlantControls } from "./individual-plant-controls";
import { removeBedKeepingPlants } from "@/lib/garden/detach-bed-plants";
import { PlanItemsDialog } from "./plan-items-dialog";
import { GardenSizeDialog } from "./garden-size-dialog";
import { createMainGardenTemplate } from "@/lib/garden/main-garden-template";
import { createLargePlotTemplate } from "@/lib/garden/large-plot-template";
import { createGeneratedIconBedTemplate } from "@/lib/garden/generated-icon-bed-template";
import { gardenDimensions, parseGardenDimensions } from "@/lib/garden/garden-dimensions";
import { Fragment, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from "react";
import type {
  GardenPlanApiResponse,
  PlannerBed as Bed,
  PlannerLayoutObject,
  PlannerPlan as PlanState,
  PlannerPlantingArea,
  PlannerPlantingPattern,
  PlannerRow as PlantingRow,
  PlannerShape,
} from "@/lib/garden/planner-plan";
import { plantCountForArea, plantPositionsForArea } from "@/lib/garden/plant-spacing-layout";
import { DEFAULT_GARDEN_ID, LIVE_PLAN_EVENT, SEASONAL_PLAN_EVENT, gardenLivePlanKey, gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";
import { STRUCTURE_PRESETS, FULL_STRUCTURE_PRESETS, ALL_STRUCTURE_PRESETS, structurePreset } from "@/lib/garden/structure-catalog";
import { plants, establishedPlants, unverifiedPlantNames, type PlantOption } from "@/lib/garden/plant-catalog";
import { persistGardenPlan, publishGardenPlan } from "@/lib/garden/plan-persistence";
import { referencePlantDimensions } from "@/lib/garden/reference-sprites";
import { useCanvasNavigation } from "./use-canvas-navigation";
import { PlannerStartPanel } from "./planner-start-panel";
import { referenceObject, referenceObjectGroups } from "@/lib/garden/reference-objects";
import { ReferenceObjectCatalogue } from "@/components/reference-object-catalogue";
import { ReferenceObjectArt } from "@/components/reference-object-art";
import { PlannerIcon } from "@/components/planner-icon";
import { PlantArt } from "@/components/plant-art";
import { PlannerReports } from "@/components/planner-reports";
import { DesignerShapeArt } from "@/components/designer-shape";
import { DesignerShapeControls, DesignerShapeInspector, type ShapeStyle } from "@/components/designer-shape-controls";
import { shapeFromDrag } from "@/lib/garden/designer-shapes";
import { defaultPlantFilters, matchesPlantFilters, plantFacts, type PlantFilters } from "@/lib/garden/plant-catalogue-filters";
import { PlantCatalogueFilters, PlantInformation } from "./plant-catalogue-filters";
import { PlannerPlanNotes, type PlanNotesHandle } from "./planner-plan-notes";
import { pastePlanSelection, type PlanClipboard } from "@/lib/garden/selection-clipboard";

import { canonicalSelection, deleteSelections, moveSelection, pasteGroup, sameSelection, selectInBox, selectableItems, type GroupClipboard, type PlanSelection } from "@/lib/garden/multi-selection";

import type { CalendarPlanting } from "@/lib/garden/planting-calendar";
import { PlantingScheduleControls } from "./planting-schedule-controls";
import { addSuccession } from "@/lib/garden/succession-planting";
import { planInPeriod, planningPeriodEvent, planningPeriodKey, readPlanningPeriod, type PlantingSchedule } from "@/lib/garden/planting-schedule";
import { PlantingBlockControls } from "./planting-block-controls";
import { PlannerPlantingRow, type RowDragMode } from "./planner-planting-row";
import { blockCorners, resizePlantingBlock, squareFootCm } from "@/lib/garden/planting-block";
import { resizePlantingRow, rowPlantCount } from "@/lib/garden/row-layout";

type Tool = "shape" | "select" | "plant" | "row" | "bed" | "path" | "trellis" | "structure" | "tree" | "note";
type SaveState = "idle" | "saving" | "cloud" | "local" | "error";
type LoadSource = "starting" | "cloud" | "local" | "default";
type Point = { x: number; y: number };
type Selection = { kind: "bed" | "planting" | "row" | "object"; id: string; plantId?: string } | null;
type Draft = { kind: "plant" | "select" | "bed" | "row" | "path" | "trellis" | "shape"; start: Point; end: Point } | null;
type Interaction =
  | { kind: "group-drag"; start: Point; plan: PlanState; selections: PlanSelection[] }
  | { kind: "bed-drag" | "bed-resize"; id: number; start: Point; bed: Bed }
  | { kind: "planting-drag" | "planting-resize"; id: string; start: Point; area: PlannerPlantingArea }
  | { kind: "row-drag" | "row-start" | "row-end" | "row-block"; id: string; start: Point; row: PlantingRow }
  | { kind: "object-drag" | "object-start" | "object-end" | "tree-resize" | "shape-resize" | "structure-resize"; id: string; start: Point; object: PlannerLayoutObject };

type RowInteraction = Extract<Interaction, { row: PlantingRow }>;
type PlantingInteraction = Extract<Interaction, { area: PlannerPlantingArea }>;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1080;
const SNAP_CM = 10;

const tools: Array<{ id: Tool; icon: string; label: string; hint: string }> = [
  { id: "select", icon: "↖", label: "Select", hint: "Move, resize and edit" },
  { id: "plant", icon: "🌱", label: "Plants", hint: "Drag crops into beds" },
  { id: "row", icon: "•••", label: "Rows", hint: "Drag a planting row" },
  { id: "bed", icon: "▭", label: "Bed", hint: "Drag a new garden bed" },
  { id: "path", icon: "═", label: "Path", hint: "Drag a path line" },
  { id: "trellis", icon: "⋮", label: "Trellis", hint: "Drag a trellis line" },
  { id: "structure", icon: "⌂", label: "Structures", hint: "Choose an object, then click the plan" },
  { id: "tree", icon: "🌳", label: "Tree", hint: "Click to place a tree" },
  { id: "shape", icon: "◇", label: "Shapes", hint: "Drag outline or filled shapes" },
  { id: "note", icon: "A", label: "Text", hint: "Click to place a label" },
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
const seasonalCrops: Record<string, readonly string[]> = {
  Jan: ["Tomato", "Bean", "Lettuce", "Carrot", "Pumpkin", "Herbs", "Strawberry"],
  Feb: ["Bean", "Lettuce", "Carrot", "Broccoli", "Herbs", "Strawberry", "Tomato"],
  Mar: ["Lettuce", "Carrot", "Broccoli", "Herbs", "Strawberry"],
  Apr: ["Lettuce", "Broccoli", "Herbs", "Carrot", "Strawberry"],
  May: ["Broccoli", "Lettuce", "Herbs", "Strawberry", "Carrot"],
  Jun: ["Broccoli", "Lettuce", "Herbs", "Strawberry", "Raspberry", "Blueberry"],
  Jul: ["Broccoli", "Lettuce", "Carrot", "Strawberry", "Raspberry", "Blueberry", "Herbs"],
  Aug: ["Lettuce", "Carrot", "Broccoli", "Strawberry", "Raspberry", "Blueberry", "Herbs"],
  Sep: ["Lettuce", "Carrot", "Broccoli", "Strawberry", "Herbs"],
  Oct: ["Bean", "Lettuce", "Carrot", "Broccoli", "Herbs", "Strawberry"],
  Nov: ["Tomato", "Bean", "Lettuce", "Pumpkin", "Carrot", "Herbs", "Strawberry"],
  Dec: ["Tomato", "Bean", "Lettuce", "Pumpkin", "Carrot", "Herbs", "Strawberry"],
};
const basePlan: PlanState = { beds: baseBeds, plantingAreas: basePlantingAreas, rows: [], objects: baseObjects };
const emptyPlan: PlanState = { beds: [], plantingAreas: [], rows: [], objects: [] };

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function lineLength(line: { x1: number; y1: number; x2: number; y2: number }) { return Math.hypot(line.x2 - line.x1, line.y2 - line.y1); }
function lineVisual(line: { x1: number; y1: number; x2: number; y2: number }) { return { length: lineLength(line), angle: Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI }; }
function bedCm(bed: Bed) { return { x: bed.x / 100 * CANVAS_WIDTH, y: bed.y / 100 * CANVAS_HEIGHT, w: bed.w / 100 * CANVAS_WIDTH, h: bed.h / 100 * CANVAS_HEIGHT }; }
function cmBed(id: number, name: string, rect: { x: number; y: number; w: number; h: number }): Bed { return { id, name, x: rect.x / CANVAS_WIDTH * 100, y: rect.y / CANVAS_HEIGHT * 100, w: rect.w / CANVAS_WIDTH * 100, h: rect.h / CANVAS_HEIGHT * 100 }; }
function bedSizeLabel(bed: Bed) { const size = bedCm(bed); return `${(size.w / 100).toFixed(1)} × ${(size.h / 100).toFixed(1)} m`; }
function uuid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function uniqueBedId() { return Date.now() * 1000 + Math.floor(Math.random() * 1000); }
function nextBedLabel(beds: Bed[]) {
  const highest = beds.reduce((max, bed) => {
    const match = bed.name.match(/^Bed\s+(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `Bed ${highest + 1}`;
}
function isRowInteraction(interaction: Interaction): interaction is RowInteraction { return interaction.kind === "row-drag" || interaction.kind === "row-start" || interaction.kind === "row-end" || interaction.kind === "row-block"; }
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
  let canvas;
  try { canvas = value.canvas ? parseGardenDimensions(value.canvas) : undefined; } catch { return null; }
  return {
    ...(canvas ? { canvas } : {}),
    ...(value.bedMaterial === "metal" ? { bedMaterial: value.bedMaterial } : {}),
    ...(value.lockedItems ? { lockedItems: parsePlanLocks(value.lockedItems) } : {}),
    beds: value.beds,
    plantingAreas: Array.isArray(value.plantingAreas) ? value.plantingAreas : legacyAreas(value.beds),
    rows: value.rows,
    objects: Array.isArray(value.objects) ? value.objects : [],
  };
}

function readStoredPlan(key: string) {
  try { return normalisePlan(JSON.parse(localStorage.getItem(key) ?? "null") as Partial<PlanState>); } catch { return null; }
}
function readLocalPlan(gardenId: string) { return readStoredPlan(gardenLocalPlanKey(gardenId)); }

function areaSizeCm(area: PlannerPlantingArea, bed: Bed) {
  const size = bedCm(bed);
  return { width: size.w * area.w / 100, height: size.h * area.h / 100 };
}
function areaCount(area: PlannerPlantingArea, bed: Bed) {
  const size = areaSizeCm(area, bed);
  return plantCountForArea(area, size.width, size.height);
}

export function GardenPlanner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragFrameRef = useRef<{ left: number; top: number; scale: number; scrollLeft: number; scrollTop: number; pointerId: number; trusted: boolean; moved: boolean; snapshot: PlanState; future: PlanState[]; ids: Map<number, string> } | null>(null);
  const draftFrameRef = useRef<{ left: number; top: number; scale: number; scrollLeft: number; scrollTop: number; pointerId: number } | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [autoFit, setAutoFit] = useState(true);
  const [fitRequest, setFitRequest] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [panelOpen, setPanelOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [zoom, setZoom] = useState(90);
  const [month, setMonth] = useState("Sep");
  const [planningYear, setPlanningYear] = useState(2026);
  const [generatedMonth, setGeneratedMonth] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeGardenId, setActiveGardenId] = useState(DEFAULT_GARDEN_ID);
  const [gettingStarted, setGettingStarted] = useState(true);
  const [plan, replacePlan] = useState<PlanState>(emptyPlan);
  const setPlan = useCallback((change: PlanState | ((current: PlanState) => PlanState)) => {
    replacePlan(current => {
      const next = typeof change === "function" ? change(current) : change;
      return preservesPlanLocks(current, next) ? next : current;
    });
  }, []);
  const [itemEditError, setItemEditError] = useState("");
  const blankTemplateStarted = useRef(false);
  const [templateStarted, setTemplateStarted] = useState(false);
  const [planItemsOpen, setPlanItemsOpen] = useState(false);
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [hasTemplateBackup, setHasTemplateBackup] = useState(false);
  const dimensions = gardenDimensions(plan);
  const CANVAS_WIDTH = dimensions.widthCm, CANVAS_HEIGHT = dimensions.heightCm;
  const visiblePlan = useMemo(() => planInPeriod(plan, { year: planningYear, month: months.indexOf(month) }), [plan, planningYear, month]);

  const [past, setPast] = useState<PlanState[]>([]);
  const [future, setFuture] = useState<PlanState[]>([]);
  const [selection, setPrimarySelection] = useState<Selection>(null);
  const [groupSelection, setGroupSelection] = useState<PlanSelection[]>([]);
  const [boxSelect, setBoxSelect] = useState(false);
  const boxAdditive = useRef(false);
  const groupClipboard = useRef<GroupClipboard | null>(null);
  function setSelection(next: Selection) { setPrimarySelection(next); setGroupSelection([]); }
  function setSelections(next: PlanSelection[]) { setGroupSelection(next.length > 1 ? next : []); setPrimarySelection(next[0] ?? null); }
  const activeSelections = groupSelection.length ? groupSelection : selection ? [selection] : [];
  const [editLockedItems, setEditLockedItems] = useState(false);
  const lockedKeys = new Set(plan.lockedItems);
  const selectionLocked = activeSelections.some(item => lockedKeys.has(planLockKey(item)));
  const skipLockedItem = (item: PlanSelection) => !editLockedItems && lockedKeys.has(planLockKey(item));
  const skipLockedObject = (object: PlannerLayoutObject) => !editLockedItems &&
    (skipLockedItem({ kind: "object", id: object.id }) || object.type === "shape" && object.locked);

  function toggleItemLocks(items: PlanSelection[]) {
    const selectedKeys = items.map(planLockKey);
    const locks = plan.lockedItems ?? [];
    const lockedItems = selectedKeys.some(key => locks.includes(key)) ? locks.filter(key => !selectedKeys.includes(key)) : [...locks, ...selectedKeys];
    commit({ ...plan, lockedItems });
  }
  const isSelected = (kind: PlanSelection["kind"], id: string | number) => activeSelections.some((item) => item.kind === kind && item.id === String(id));
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [hideLabels, setHideLabels] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const navigation = useCanvasNavigation({ stageRef: stageScrollRef, canvasRef, zoom, blocked: Boolean(interaction || draft), canvasWidth: CANVAS_WIDTH, panMode, onBackgroundClick: () => { setSelections([]); setPanelOpen(false); }, panBackground: tool === "select" && !boxSelect, onZoom: value => { setAutoFit(false); setZoom(value); }, onFit: () => { setAutoFit(true); setFitRequest(value => value + 1); } });
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [selectedPlant, setSelectedPlant] = useState(plants[0]);
  const [plantingMode, setPlantingMode] = useState<"row" | "block" | "square-foot">("row");
  const [plantPicked, setPlantPicked] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState(plants[0].varieties[0]);
  const [placementMode, setPlacementMode] = useState<PlannerPlantingPattern>("grid");
  const [dragPlant, setDragPlant] = useState<PlantOption | null>(null);
  const [dropBedId, setDropBedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [fullCatalogue, setFullCatalogue] = useState(false);
  const [fullStructures, setFullStructures] = useState(false);
  const [objectCategory, setObjectCategory] = useState("all");
  const [structureSearch, setStructureSearch] = useState("");
  const [plantSpacing, setPlantSpacing] = useState<Record<string, number>>({});
  const [plantType, setPlantType] = useState("All Plants");
  const [plantFilters, setPlantFilters] = useState<PlantFilters>(defaultPlantFilters);
  const [favouritePlants, setFavouritePlants] = useState<string[]>([]);
  const [informationPlant, setInformationPlant] = useState<string | null>(null);
  const [catalogueMessage, setCatalogueMessage] = useState("");
  const [reportView, setReportView] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);
  const planNotesRef = useRef<PlanNotesHandle>(null);
  const [pathWidth, setPathWidth] = useState(75);
  const [trellisHeight, setTrellisHeight] = useState(180);
  const [postSpacing, setPostSpacing] = useState(150);
  const [selectedStructureKind, setSelectedStructureKind] = useState(STRUCTURE_PRESETS[0].kind);
  const [originalSymbolSizes, setOriginalSymbolSizes] = useState(true);
  const [treeDiameter, setTreeDiameter] = useState(150);
  const [newText, setNewText] = useState("Label");
  const [shapeStyle, setShapeStyle] = useState<ShapeStyle>({ shape: "rectangle", stroke: "#663300", fill: "none", lineWidth: 3 });
  const [designerLayer, setDesignerLayer] = useState("all");
  const drawingClipboard = useRef<PlanClipboard | null>(null);
  const [clipboardReady, setClipboardReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadSource, setLoadSource] = useState<LoadSource>("starting");

  useEffect(() => {
    const receive = (event: Event) => {
      const next = (event as CustomEvent<string | null>).detail;
      setReportView(next);
      if (next) setNotesOpen(false);
    };
    window.addEventListener("garden-report-view", receive);
    queueMicrotask(() => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem("garden-favourite-plants") ?? "[]");
        if (Array.isArray(stored)) setFavouritePlants(stored.filter((item): item is string => typeof item === "string"));
      } catch { setCatalogueMessage("Favorites could not be restored from this browser."); }
    });
    return () => window.removeEventListener("garden-report-view", receive);
  }, []);

  useEffect(() => {
    const cancelDraft = () => { draftFrameRef.current = null; setDraft(null); };
    window.addEventListener("blur", cancelDraft);
    return () => window.removeEventListener("blur", cancelDraft);
  }, []);

  function toggleFavourite(name: string) {
    const next = favouritePlants.includes(name) ? favouritePlants.filter((item) => item !== name) : [...favouritePlants, name];
    setFavouritePlants(next);
    try { localStorage.setItem("garden-favourite-plants", JSON.stringify(next)); }
    catch { setCatalogueMessage("Favorites are available for this visit, but this browser could not save them."); }
  }

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

    const gardenId = readActiveGardenId();
    setActiveGardenId(gardenId);
    setHasTemplateBackup(Boolean(readStoredPlan(`garden-before-blank-template:${gardenId}`)));
    const live = readStoredPlan(gardenLivePlanKey(gardenId));
    const local = live ?? readLocalPlan(gardenId);
    if (local) {
      replacePlan(local);
      setLoadSource("local");
    } else {
      replacePlan(gardenId === DEFAULT_GARDEN_ID ? clonePlan(basePlan) : clonePlan(emptyPlan));
      setSelection(null);
      setLoadSource("default");
    }
    void (async () => {
      try {
        const response = await fetch("/api/garden?gardenId=" + encodeURIComponent(gardenId), { cache: "no-store" });
        const data = await response.json() as GardenPlanApiResponse;
        const cloud = normalisePlan(data.plan);
        if (cancelled || !response.ok || !data.ok || !cloud) return;
        if (live || blankTemplateStarted.current) return;
        replacePlan(cloud);
        setSelection(null);
        localStorage.setItem(gardenLocalPlanKey(gardenId), JSON.stringify(cloud));
        setLoadSource("cloud");
        setSavedSnapshot(JSON.stringify(cloud));
      } catch { /* keep local or blank plan */ }
    })();
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loadSource === "starting") return;
    try {
      const gardenId = readActiveGardenId();
      publishGardenPlan(gardenId, plan, "2d");
    } catch {
      // Live preview is best-effort; planner editing must keep working if storage is unavailable.
    }
  }, [plan, loadSource]);

  const applyExternalPlan = useEffectEvent((next: PlanState) => {
    if (dragFrameRef.current || draftFrameRef.current) return;
    if (JSON.stringify(plan) === JSON.stringify(next)) return;
    setPast((items) => [...items, clonePlan(plan)].slice(-40));
    setFuture([]);
    replacePlan(next);
    setSaveState("idle");
  });

  useEffect(() => {
    const onLive = (event: Event) => {
      const detail = (event as CustomEvent<{ gardenId: string; plan: PlanState; source?: string }>).detail;
      if (detail?.source === "3d" && detail.gardenId === readActiveGardenId()) applyExternalPlan(detail.plan);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== gardenLivePlanKey(readActiveGardenId()) || !event.newValue) return;
      try { const next = normalisePlan(JSON.parse(event.newValue)); if (next) applyExternalPlan(next); } catch { setSaveState("error"); }
    };
    window.addEventListener(LIVE_PLAN_EVENT, onLive);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(LIVE_PLAN_EVENT, onLive); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    const stage = stageScrollRef.current;
    if (!stage || !autoFit) return;
    const fit = () => {
      const width = stage.clientWidth - 54;
      const height = stage.clientHeight - 52;
      setZoom(Math.max(1, Math.min(100, Math.floor(Math.min(width / CANVAS_WIDTH, height / (CANVAS_HEIGHT * 1.04)) * 100))));
    };
    const frame = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", fit); };
  }, [autoFit, fitRequest, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Do not close the menu in a capture-phase click handler: on mobile Safari
  // that removes the tapped item before its own click handler can run.
  useEffect(() => {
    if (!moreOpen) return;
    const outsideTap = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const escapeMenu = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMoreOpen(false);
      moreRef.current?.querySelector<HTMLButtonElement>(".gv-more-trigger")?.focus();
    };
    document.addEventListener("pointerdown", outsideTap);
    document.addEventListener("keydown", escapeMenu);
    return () => {
      document.removeEventListener("pointerdown", outsideTap);
      document.removeEventListener("keydown", escapeMenu);
    };
  }, [moreOpen]);

  const selectedBed = selection?.kind === "bed" ? plan.beds.find((item) => String(item.id) === selection.id) ?? null : null;
  const selectedPlanting = selection?.kind === "planting" ? plan.plantingAreas.find((item) => item.id === selection.id) ?? null : null;
  const selectedRow = selection?.kind === "row" ? plan.rows.find((item) => item.id === selection.id) ?? null : null;
  const selectedObject = selection?.kind === "object" ? plan.objects.find((item) => item.id === selection.id) ?? null : null;
  const selectedPlantingBed = selectedPlanting ? plan.beds.find((bed) => bed.id === selectedPlanting.bedId) ?? null : null;

  const filteredPlants = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (fullCatalogue || search.trim() ? plants : establishedPlants).filter((plant) => (plantType === "All Plants" || plant.type === plantType)
      && (!needle || plant.name.toLowerCase().includes(needle) || plant.varieties.some((variety) => variety.toLowerCase().includes(needle)))
      && matchesPlantFilters(plant.name, plantFilters, favouritePlants, selectedPlant.name));
  }, [search, plantType, fullCatalogue, plantFilters, favouritePlants, selectedPlant.name]);

  function snap(value: number) { return snapEnabled ? Math.round(value / SNAP_CM) * SNAP_CM : Math.round(value); }
  useEffect(() => {
    const period = readPlanningPeriod(readActiveGardenId());
    queueMicrotask(() => { if (period) { setMonth(months[period.month]); setPlanningYear(period.year); } });
  }, []);
  useEffect(() => {
    const gardenId = readActiveGardenId(), period = { year: planningYear, month: months.indexOf(month) };
    try { localStorage.setItem(planningPeriodKey(gardenId), JSON.stringify(period)); } catch { /* View state is optional. */ }
    window.dispatchEvent(new CustomEvent(planningPeriodEvent, { detail: { gardenId, period } }));
  }, [month, planningYear]);

  function showCalendarPlanting(planting: CalendarPlanting) {
    if (planting.kind === "guide") return;
    const date = planting.schedule?.from;
    if (date) { setPlanningYear(Number(date.slice(0, 4))); setMonth(months[Number(date.slice(5, 7)) - 1]); }
    window.dispatchEvent(new Event("garden-report-close"));
    setSelection({ kind: planting.kind, id: planting.id }); setTool("select"); setPanelOpen(true);
  }

  function changeSchedule(kind: "row" | "planting", id: string, schedule?: PlantingSchedule) {
    edit(current => kind === "row" ? { ...current, rows: current.rows.map(row => row.id === id ? { ...row, schedule } : row) }
      : { ...current, plantingAreas: current.plantingAreas.map(area => area.id === id ? { ...area, schedule } : area) });
  }
  function succession(kind: "row" | "planting", id: string, crop: PlantOption) {
    const result = addSuccession(plan, { kind, id }, crop);
    commit(result.plan); setSelection(result.selection); setTool("select"); setPanelOpen(true);
    const next = kind === "row" ? result.plan.rows.at(-1)! : result.plan.plantingAreas.at(-1)!;
    setPlanningYear(Number(next.schedule!.from!.slice(0, 4))); setMonth(months[Number(next.schedule!.from!.slice(5, 7)) - 1]);
  }

  function snapPoint(point: Point) { return { x: clamp(snap(point.x), 0, CANVAS_WIDTH), y: clamp(snap(point.y), 0, CANVAS_HEIGHT) }; }
  function canvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    return snapPoint({ x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale });
  }
  function remember() { setPast((items) => [...items, clonePlan(plan)].slice(-40)); setFuture([]); }
  function commit(next: PlanState, replace = false) { remember(); if (replace) replacePlan(next); else setPlan(next); setSaveState("idle"); }
  function edit(mutator: (current: PlanState) => PlanState) { remember(); setPlan((current) => mutator(current)); setSaveState("idle"); }

  function chooseTool(next: Tool) { setPanMode(false); draftFrameRef.current = null; setBoxSelect(false); setGroupSelection([]); if (next === "select") setSelection(null); setDesignerLayer("all"); if (next !== "select" && selection?.kind !== "bed") setSelection(selectedPlanting ? { kind: "bed", id: String(selectedPlanting.bedId) } : null); setTool(next); setPanelOpen(true); setDraft(null); setInteraction(null); }
  function startBlankTemplate() {
    blankTemplateStarted.current = true;
    setTemplateStarted(true);
    setPanMode(false);
    localStorage.setItem(`garden-before-blank-template:${activeGardenId}`, JSON.stringify(plan));
    setHasTemplateBackup(true);
    commit({ ...clonePlan(emptyPlan), ...(plan.canvas ? { canvas: plan.canvas } : {}) }, true);
    setSelection(null); setSelections([]); setInteraction(null); setDraft(null);
    setTool("select"); setPanelOpen(false); setGettingStarted(true);
    navigation.fit();
  }

  function startGardenTemplate(template: () => PlanState) {
    blankTemplateStarted.current = true; setTemplateStarted(true); setPanMode(false);
    localStorage.setItem(`garden-before-blank-template:${activeGardenId}`, JSON.stringify(plan));
    setHasTemplateBackup(true);
    commit(template(), true);
    setSelection(null); setSelections([]); setInteraction(null); setDraft(null);
    setTool("select"); setPanelOpen(false); navigation.fit();
  }

  function addStarterBed() {
    const w = Math.min(120, CANVAS_WIDTH - 20), h = Math.min(240, CANVAS_HEIGHT - 20);
    const bed = cmBed(uniqueBedId(), nextBedLabel(plan.beds), { x: (CANVAS_WIDTH - w) / 2, y: (CANVAS_HEIGHT - h) / 2, w, h });
    commit({ ...plan, beds: [...plan.beds, bed] }); setSelection({ kind: "bed", id: String(bed.id) }); setTool("select"); setPanelOpen(true);
  }
  function choosePlant(plant: PlantOption) { if (plantingMode === "square-foot" && !plantFacts(plant.name)?.squareFootCount) setPlantingMode("row"); setPlantPicked(true); setSelectedPlant({ ...plant, spacingCm: plantSpacing[plant.name] ?? plant.spacingCm }); setSelectedVariety(plant.varieties[0]); }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture((items) => [clonePlan(plan), ...items].slice(0, 40));
    setPast((items) => items.slice(0, -1));
    replacePlan(previous); setSelection(null); setSaveState("idle"); setInteraction(null); setDraft(null);
  }
  function redo() {
    if (!future.length) return;
    const next = future[0];
    setPast((items) => [...items, clonePlan(plan)].slice(-40));
    setFuture((items) => items.slice(1));
    replacePlan(next); setSelection(null); setSaveState("idle"); setInteraction(null); setDraft(null);
  }

  function generateSeasonalGarden(generatedAt: string) {
    if (!plan.beds.length) return;
    const monthIndex = Math.max(0, months.indexOf(month));
    const palette = seasonalCrops[month] ?? seasonalCrops.Sep;
    const plantingAreas = plan.beds.flatMap((bed, index) => {
      const cropName = palette[(index + monthIndex) % palette.length];
      const plant = plants.find((candidate) => candidate.name === cropName);
      if (!plant) return [];
      const pattern: PlannerPlantingPattern = cropName === "Pumpkin" || cropName === "Blueberry" ? "single" : cropName === "Carrot" || cropName === "Bean" ? "rows" : cropName === "Herbs" ? "natural" : index % 2 ? "staggered" : "grid";
      const area: PlannerPlantingArea = {
        id: `seasonal-${month.toLowerCase()}-${bed.id}-${generatedAt}`,
        bedId: bed.id, crop: plant.name, cropIcon: plant.icon,
        variety: plant.varieties[(monthIndex + index) % plant.varieties.length],
        spacingCm: plant.spacingCm, x: 0, y: 0, w: 100, h: 100, count: 1,
        pattern, iconSize: pattern === "single" ? 24 : 17,
        visualSpacing: pattern === "single" ? "wide" : cropName === "Carrot" ? "tight" : "normal",
      };
      area.count = areaCount(area, bed);
      return [area];
    });
    commit({ ...plan, plantingAreas });
    setSelection(null); setTool("select"); setGeneratedMonth(month);
    window.dispatchEvent(new Event(SEASONAL_PLAN_EVENT));
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
    const area = makePlantingArea(bed, { ...dragPlant, spacingCm: plantSpacing[dragPlant.name] ?? dragPlant.spacingCm }, variety, center, false);
    commit({ ...plan, plantingAreas: [...plan.plantingAreas, area] });
    setSelection({ kind: "planting", id: area.id });
    setTool("select");
    setDragPlant(null);
    setDropBedId(null);
  }

  function beginGroupInteraction(event: ReactPointerEvent<HTMLElement>, selected: PlanSelection, resize = false) {
    if (lockedKeys.has(planLockKey(selected))) {
      if (!editLockedItems || tool !== "select") return true;
      setSelections([selected]);
      setPanelOpen(true);
      return true;
    }
    if (tool !== "select") return false;
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      const next = activeSelections.some((item) => sameSelection(item, selected)) ? activeSelections.filter((item) => !sameSelection(item, selected)) : [...activeSelections, selected];
      setSelections(canonicalSelection(plan, next)); setPanelOpen(true); return true;
    }
    if (!resize && groupSelection.length > 1 && isSelected(selected.kind, selected.id)) {
      const point = interactionPoint(event);
      if (point) { remember(); setInteraction({ kind: "group-drag", start: point, plan: clonePlan(plan), selections: groupSelection }); }
      return true;
    }
    return false;
  }

  function interactionPoint(event: ReactPointerEvent<HTMLElement>) {
    const canvas = canvasRef.current, stage = stageScrollRef.current;
    if (!canvas || !stage || event.button !== 0 || !event.isTrusted) return null;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect(), scale = zoom / 100;
    dragFrameRef.current = { left: rect.left, top: rect.top, scale,
      scrollLeft: stage.scrollLeft, scrollTop: stage.scrollTop,
      pointerId: event.pointerId, trusted: event.isTrusted, moved: false,
      snapshot: clonePlan(plan), future: [...future], ids: new Map() };
    canvas.focus({ preventScroll: true });
    if (event.isTrusted) canvas.setPointerCapture(event.pointerId);
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  }

  function startBedInteraction(event: ReactPointerEvent<HTMLElement>, bed: Bed, resize = false) {
    event.stopPropagation();
    if (beginGroupInteraction(event, { kind: "bed", id: String(bed.id) }, resize)) return;
    setSelection({ kind: "bed", id: String(bed.id) });
    if (tool === "plant") { plantBed(bed); return; }
    if (!event.isTrusted) { setPanelOpen(true); return; }
    if (tool !== "select" && tool !== "bed") return;
    const point = interactionPoint(event);
    if (!point) return;
    remember();
    setInteraction({ kind: resize ? "bed-resize" : "bed-drag", id: bed.id, start: point, bed: structuredClone(bed) });
  }

  function clickedPlantId(event: ReactPointerEvent<HTMLElement>) {
    return (event.target as HTMLElement).closest<HTMLElement>("[data-plant-id]")?.dataset.plantId;
  }

  function startPlantingInteraction(event: ReactPointerEvent<HTMLElement>, area: PlannerPlantingArea, resize = false) {
    event.stopPropagation();
    if (beginGroupInteraction(event, { kind: "planting", id: area.id }, resize)) return;
    if (tool !== "select" && tool !== "plant") return;
    const point = interactionPoint(event);
    if (!point) return;
    const plantId = !resize && tool === "select" ? clickedPlantId(event) : undefined;
    setSelection({ kind: "planting", id: area.id, plantId });
    remember();
    setInteraction({ kind: resize ? "planting-resize" : "planting-drag", id: area.id, start: point, area: structuredClone(area) });
  }

  function startRowInteraction(event: ReactPointerEvent<HTMLElement>, row: PlantingRow, mode: RowDragMode = "row-drag") {
    event.stopPropagation();
    if (beginGroupInteraction(event, { kind: "row", id: row.id }, mode !== "row-drag")) return;
    if (tool !== "select" && tool !== "row") return;
    const point = interactionPoint(event);
    if (!point) return;
    const plantId = mode === "row-drag" && tool === "select" ? clickedPlantId(event) : undefined;
    setSelection({ kind: "row", id: row.id, plantId }); remember();
    setInteraction({ kind: mode, id: row.id, start: point, row: { ...row } });
  }

  function startObjectInteraction(event: ReactPointerEvent<HTMLElement>, object: PlannerLayoutObject, mode: "object-drag" | "object-start" | "object-end" | "tree-resize" | "shape-resize" | "structure-resize" = "object-drag") {
    event.stopPropagation();
    if (!(object.type === "shape" && object.locked) && beginGroupInteraction(event, { kind: "object", id: object.id }, mode !== "object-drag")) return;
    if (tool !== "select" && tool !== object.type && !(tool === "note" && object.type === "text")) return;
    setSelection({ kind: "object", id: object.id });
    if (object.type === "shape" && object.locked) { setPanelOpen(true); return; }
    const point = interactionPoint(event);
    if (!point) return;
    remember();
    setInteraction({ kind: mode, id: object.id, start: point, object: structuredClone(object) });
  }

  useEffect(() => {
    if (!interaction) return;
    const active = interaction;
    const move = (event: PointerEvent) => {
      const snapForDrag = (value: number) => snapEnabled ? Math.round(value / SNAP_CM) * SNAP_CM : Math.round(value);
      const frame = dragFrameRef.current, stage = stageScrollRef.current;
      if (!frame || !stage || (frame.trusted && event.pointerId !== frame.pointerId)) return;
      const point = { x: (event.clientX - frame.left + stage.scrollLeft - frame.scrollLeft) / frame.scale,
        y: (event.clientY - frame.top + stage.scrollTop - frame.scrollTop) / frame.scale };
      const endpoint = { x: clamp(snapForDrag(point.x), 0, CANVAS_WIDTH), y: clamp(snapForDrag(point.y), 0, CANVAS_HEIGHT) };
      const dx = point.x - active.start.x;
      const dy = point.y - active.start.y;
      frame.moved ||= Math.hypot(dx, dy) * frame.scale >= 2;
      if (!frame.moved) return;
      setPlan((current) => {
        if (active.kind === "group-drag") return moveSelection(active.plan, active.selections, snapForDrag(dx), snapForDrag(dy));
        if (active.kind === "bed-drag" || active.kind === "bed-resize") {
          const start = bedCm(active.bed);
          let changedBed: Bed | null = null;
          const beds = current.beds.map((bed) => {
            if (bed.id !== active.id) return bed;
            if (active.kind === "bed-drag") {
              const x = clamp(snapForDrag(start.x + dx), 0, CANVAS_WIDTH - start.w);
              const y = clamp(snapForDrag(start.y + dy), 0, CANVAS_HEIGHT - start.h);
              changedBed = { ...bed, x: x / 900 * 100, y: y / 1080 * 100 };
            } else {
              const w = clamp(snapForDrag(start.w + dx), 40, CANVAS_WIDTH - start.x);
              const h = clamp(snapForDrag(start.h + dy), 40, CANVAS_HEIGHT - start.y);
              changedBed = { ...bed, w: w / 900 * 100, h: h / 1080 * 100 };
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
            const next = { ...area };
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
            if (active.kind === "row-drag") {
              return moveSelection({ ...current, rows: current.rows.map((item) => item.id === active.id ? active.row : item) }, [{ kind: "row", id: active.id }], snapForDrag(dx), snapForDrag(dy)).rows.find((item) => item.id === active.id)!;
            }
            if (active.kind === "row-block") {
              const length = lineLength(active.row), angle = Math.atan2(active.row.y2 - active.row.y1, active.row.x2 - active.row.x1);
              const width = Math.max(0, length + snapForDrag(dx * Math.cos(angle) + dy * Math.sin(angle)));
              const depth = Math.max(0, (active.row.block?.depthCm ?? 0) + snapForDrag(-dx * Math.sin(angle) + dy * Math.cos(angle)));
              const block = active.row.block ?? { mode: "block" as const, depthCm: 0,
                rowSpacingCm: plantFacts(active.row.crop, active.row.variety)?.rowSpacingCm ?? active.row.spacingCm };
              const next = resizePlantingBlock(active.row, width, depth, block, index => {
                if (!frame.ids.has(index)) frame.ids.set(index, crypto.randomUUID());
                return frame.ids.get(index)!;
              });
              if (blockCorners(next).some(p => p.x < -1e-7 || p.y < -1e-7 || p.x > CANVAS_WIDTH + 1e-7 || p.y > CANVAS_HEIGHT + 1e-7)) return row;
              return next;
            }
            return resizePlantingRow(active.row, active.kind === "row-start"
              ? { x1: clamp(active.row.x1 + snapForDrag(dx), 0, CANVAS_WIDTH), y1: clamp(active.row.y1 + snapForDrag(dy), 0, CANVAS_HEIGHT) }
              : { x2: clamp(active.row.x2 + snapForDrag(dx), 0, CANVAS_WIDTH), y2: clamp(active.row.y2 + snapForDrag(dy), 0, CANVAS_HEIGHT) }, (index) => {
                if (!frame.ids.has(index)) frame.ids.set(index, crypto.randomUUID());
                return frame.ids.get(index)!;
              });
          }) };
        }
        if (!("object" in active)) return current;
        const original = active.object;
        return { ...current, objects: current.objects.map((object) => {
          if (object.id !== active.id) return object;
          if (active.kind === "tree-resize" && original.type === "tree") return { ...object, ...(object.type === "tree" ? { diameterCm: clamp(snapForDrag(Math.hypot(point.x - original.x, point.y - original.y) * 2), 30, 1000) } : {}) } as PlannerLayoutObject;
          if (original.type === "path" || original.type === "trellis") {
            if (object.type !== original.type) return object;
            if (active.kind === "object-start") return { ...object, x1: endpoint.x, y1: endpoint.y };
            if (active.kind === "object-end") return { ...object, x2: endpoint.x, y2: endpoint.y };
            return { ...object, x1: clamp(snapForDrag(original.x1 + dx), 0, CANVAS_WIDTH), y1: clamp(snapForDrag(original.y1 + dy), 0, CANVAS_HEIGHT), x2: clamp(snapForDrag(original.x2 + dx), 0, CANVAS_WIDTH), y2: clamp(snapForDrag(original.y2 + dy), 0, CANVAS_HEIGHT) };
          }
          if (original.type === "shape" && object.type === "shape") {
            if (active.kind === "shape-resize") {
              const angle = -original.rotationDeg * Math.PI / 180;
              const px = point.x - original.x, py = point.y - original.y;
              return { ...object, widthCm: clamp(snapForDrag(2 * (px * Math.cos(angle) - py * Math.sin(angle))), 5, original.shape === "line" ? Math.max(1500, Math.hypot(CANVAS_WIDTH, CANVAS_HEIGHT)) : CANVAS_WIDTH),
                heightCm: original.shape === "line" ? 1 : clamp(snapForDrag(2 * (px * Math.sin(angle) + py * Math.cos(angle))), 5, CANVAS_HEIGHT) };
            }
            return { ...object, x: clamp(snapForDrag(original.x + dx), 0, CANVAS_WIDTH), y: clamp(snapForDrag(original.y + dy), 0, CANVAS_HEIGHT) };
          }
          if (original.type === "tree" && object.type === "tree") return { ...object, x: clamp(snapForDrag(original.x + dx), 0, CANVAS_WIDTH), y: clamp(snapForDrag(original.y + dy), 0, CANVAS_HEIGHT) };
          if (original.type === "structure" && object.type === "structure") {
            if (active.kind === "structure-resize") {
              const angle = original.rotationDeg * Math.PI / 180;
              const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
              const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
              const minimum = original.kind.startsWith("reference-") ? 1 : 30;
              return { ...object,
                widthCm: clamp(snapForDrag(original.widthCm + 2 * localX), minimum, CANVAS_WIDTH),
                depthCm: clamp(snapForDrag(original.depthCm + 2 * localY), minimum, CANVAS_HEIGHT),
              };
            }
            const halfW = object.widthCm / 2;
            const halfD = object.depthCm / 2;
            return { ...object, x: clamp(snapForDrag(original.x + dx), halfW, CANVAS_WIDTH - halfW), y: clamp(snapForDrag(original.y + dy), halfD, CANVAS_HEIGHT - halfD) };
          }
          if (original.type === "text" && object.type === "text") return { ...object, x: clamp(snapForDrag(original.x + dx), 0, CANVAS_WIDTH), y: clamp(snapForDrag(original.y + dy), 0, CANVAS_HEIGHT) };
          return object;
        }) };
      });
      setSaveState("idle");
    };
    const up = () => { dragFrameRef.current = null; setInteraction(null); setPanelOpen(true); };
    const cancel = () => { const frame = dragFrameRef.current; if (frame) { replacePlan(frame.snapshot); setFuture(frame.future); setPast((items) => items.slice(0, -1)); } dragFrameRef.current = null; setInteraction(null); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    window.addEventListener("blur", cancel);
    const canvas = canvasRef.current;
    canvas?.addEventListener("lostpointercapture", cancel);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); canvas?.removeEventListener("lostpointercapture", cancel); };
  }, [interaction, snapEnabled, zoom, CANVAS_WIDTH, CANVAS_HEIGHT, setPlan]);

  function drawingPlantRow(current: NonNullable<Draft>, id = "plant-row-preview"): PlantingRow {
    const length = lineLength({ x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y });
    const spacingCm = plantSpacing[selectedPlant.name] ?? plantFacts(selectedPlant.name, selectedVariety)?.inRowSpacingCm ?? selectedPlant.spacingCm;
    const single = length < 20;
    if (plantingMode !== "row") {
      const density = plantFacts(selectedPlant.name, selectedVariety)?.squareFootCount ?? 0;
      const square = plantingMode === "square-foot" && density > 0;
      const base: PlantingRow = { id, crop: selectedPlant.name, cropIcon: selectedPlant.icon, variety: selectedVariety, spacingCm,
        x1: Math.min(current.start.x, current.end.x), y1: Math.min(current.start.y, current.end.y),
        x2: Math.min(current.start.x, current.end.x), y2: Math.min(current.start.y, current.end.y), count: 1 };
      const w = Math.min(CANVAS_WIDTH - base.x1, Math.abs(current.end.x - current.start.x));
      const h = Math.min(CANVAS_HEIGHT - base.y1, Math.abs(current.end.y - current.start.y));
      if (square && (CANVAS_WIDTH - base.x1 < squareFootCm || CANVAS_HEIGHT - base.y1 < squareFootCm)) return base;
      return resizePlantingBlock(base, w, h, { mode: square ? "square-foot" : "block", depthCm: 0,
        rowSpacingCm: plantFacts(selectedPlant.name, selectedVariety)?.rowSpacingCm ?? spacingCm,
        ...(square ? { plantsPerSquareFoot: density } : {}) });
    }
    return { id, crop: selectedPlant.name, cropIcon: selectedPlant.icon, variety: selectedVariety, spacingCm,
      x1: current.start.x, y1: current.start.y, x2: single ? current.start.x : current.end.x, y2: single ? current.start.y : current.end.y,
      count: single ? 1 : rowPlantCount(length, spacingCm) };
  }

  function beginDraft(event: ReactPointerEvent<HTMLDivElement>, kind: NonNullable<Draft>["kind"]) {
    if (event.button !== 0 || !event.isTrusted) return;
    const point = canvasPoint(event.clientX, event.clientY), canvas = canvasRef.current, stage = stageScrollRef.current;
    if (!point || !canvas || !stage) return;
    const rect = canvas.getBoundingClientRect();
    draftFrameRef.current = { left: rect.left, top: rect.top, scale: zoom / 100,
      scrollLeft: stage.scrollLeft, scrollTop: stage.scrollTop, pointerId: event.pointerId };
    event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    setDraft({ kind, start: point, end: point });
  }

  function cancelDraft() { draftFrameRef.current = null; setDraft(null); }

  function captureCanvasDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!target.closest(".plan-bed,.planting-area,.planting-row,.layout-object")) return;
    if (event.isTrusted && !target.closest(".line-handle,.resize-handle")) {
      if (tool === "bed" || tool === "plant" || tool === "row") {
        event.stopPropagation();
        beginDraft(event, tool);
        return;
      }
      if (tool !== "select" && event.button === 0) {
        event.stopPropagation();
        canvasDown(event, true);
        return;
      }
    }
    if (boxSelect) {
      event.stopPropagation();
      boxAdditive.current = event.shiftKey || event.ctrlKey || event.metaKey;
      beginDraft(event, "select");
    }
  }

  function canvasDown(event: ReactPointerEvent<HTMLDivElement>, placingOverItem = false) {
    if (event.button !== 0) return;
    if (!placingOverItem && (event.target as HTMLElement).closest(".plan-bed,.planting-area,.planting-row,.layout-object")) return;
    const point = canvasPoint(event.clientX, event.clientY);
    if (!point) return;
    setCursorPoint(point);
    if (tool === "select") {
      boxAdditive.current = event.shiftKey || event.ctrlKey || event.metaKey;
      beginDraft(event, "select"); return;
    }
    if (["plant", "bed", "row", "path", "trellis", "shape"].includes(tool)) {
      beginDraft(event, tool as NonNullable<Draft>["kind"]);
      return;
    }
    if (tool === "structure") {
      const preset = structurePreset(selectedStructureKind);
      const object: PlannerLayoutObject = {
        id: uuid("structure"),
        type: "structure",
        kind: preset.kind,
        x: clamp(point.x, preset.widthCm / 2, CANVAS_WIDTH - preset.widthCm / 2),
        y: clamp(point.y, preset.depthCm / 2, CANVAS_HEIGHT - preset.depthCm / 2),
        widthCm: preset.widthCm,
        depthCm: preset.depthCm,
        heightCm: preset.heightCm,
        rotationDeg: 0,
        label: preset.label,
      };
      commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id }); return;
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
    const frame = draftFrameRef.current, stage = stageScrollRef.current;
    if (frame && event.pointerId !== frame.pointerId) return;
    const point = frame && stage ? snapPoint({ x: (event.clientX - frame.left + stage.scrollLeft - frame.scrollLeft) / frame.scale,
      y: (event.clientY - frame.top + stage.scrollTop - frame.scrollTop) / frame.scale }) : canvasPoint(event.clientX, event.clientY);
    if (point) setCursorPoint(point);
    if (point && draft) setDraft((current) => current ? { ...current, end: point } : null);
  }

  function canvasUp() {
    if (!draft) return;
    const current = draft; draftFrameRef.current = null; setDraft(null);
    if (current.kind === "select") {
      const box = { x: Math.min(current.start.x, current.end.x), y: Math.min(current.start.y, current.end.y), w: Math.abs(current.end.x - current.start.x), h: Math.abs(current.end.y - current.start.y) };
      const next = box.w >= 5 && box.h >= 5 ? selectInBox(visiblePlan, box, designerLayer, item => !skipLockedItem(item)) : [];
      setSelections(canonicalSelection(plan, [...(boxAdditive.current ? activeSelections : []), ...next]));
      if (next.length) setPanelOpen(true);
      setBoxSelect(false); return;
    }
    if (current.kind === "shape") {
      const shape = shapeFromDrag(current.start, current.end, shapeStyle);
      if (shape) { commit({ ...plan, objects: [...plan.objects, shape] }); setSelection({ kind: "object", id: shape.id }); setTool("select"); setPanelOpen(true); }
      return;
    }
    if (current.kind === "bed") {
      const x = Math.min(current.start.x, current.end.x), y = Math.min(current.start.y, current.end.y);
      const w = Math.abs(current.end.x - current.start.x), h = Math.abs(current.end.y - current.start.y);
      if (w < 40 || h < 40) return;
      const id = uniqueBedId();
      const bed = cmBed(id, nextBedLabel(plan.beds), { x, y, w, h });
      commit({ ...plan, beds: [...plan.beds, bed] }); setSelection({ kind: "bed", id: String(id) }); return;
    }
    if (current.kind === "row" || current.kind === "plant") {
      const row = drawingPlantRow(current, uuid("row"));
      commit({ ...plan, rows: [...plan.rows, row] }); setSelection({ kind: "row", id: row.id });
      setTool("select"); return;
    }
    if (lineLength({ x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y }) < 20) return;
    const object: PlannerLayoutObject = current.kind === "path"
      ? { id: uuid("path"), type: "path", x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y, widthCm: pathWidth, label: "Path" }
      : { id: uuid("trellis"), type: "trellis", x1: current.start.x, y1: current.start.y, x2: current.end.x, y2: current.end.y, heightCm: trellisHeight, postSpacingCm: postSpacing, label: "Trellis" };
    commit({ ...plan, objects: [...plan.objects, object] }); setSelection({ kind: "object", id: object.id });
  }

  function deleteSelection() {
    removeSelection(true);
  }

  function removeSelection(keepBedPlants: boolean) {
    if (!selection || selectionLocked || (selectedObject?.type === "shape" && selectedObject.locked)) return;
    setItemEditError("");
    try {
      const beds = keepBedPlants ? activeSelections.filter((item) => item.kind === "bed") : [];
      let next = deleteSelections(plan, beds.length ? activeSelections.filter((item) => item.kind !== "bed") : activeSelections);
      for (const bed of beds) next = removeBedKeepingPlants(next, Number(bed.id));
      if (!preservesPlanLocks(plan, next)) throw new Error("Unlock the selected items and their plantings first.");
      commit(next);
      setSelection(null);
    } catch (error) {
      setItemEditError(error instanceof Error ? error.message : "Unable to delete the selection.");
    }
  }

  function rotateStructure(degrees: number) {
    if (!selectedObject || selectedObject.type !== "structure" || selectionLocked) return;
    const rotationDeg = ((degrees % 360) + 360) % 360;
    if (selectedObject.rotationDeg === rotationDeg) return;
    edit((current) => ({
      ...current,
      objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "structure"
        ? { ...object, rotationDeg }
        : object),
    }));
  }

  function duplicateSelection() {
    if (!selection) return;
    if (groupSelection.length > 1) { copyDrawingSelection(); pasteDrawingObject(); return; }
    if (selectedBed) {
      const id = uniqueBedId();
      const size = bedCm(selectedBed);
      const bed = { ...selectedBed, id, name: nextBedLabel(plan.beds), x: clamp(size.x + 20, 0, CANVAS_WIDTH - size.w) / 9, y: clamp(size.y + 20, 0, CANVAS_HEIGHT - size.h) / 10.8 };
      const areas = plan.plantingAreas.filter((area) => area.bedId === selectedBed.id).map((area) => ({ ...area, id: uuid("area"), plantingId: undefined, bedId: id }));
      commit({ ...plan, beds: [...plan.beds, bed], plantingAreas: [...plan.plantingAreas, ...areas] }); setSelection({ kind: "bed", id: String(id) });
    } else if (selectedPlanting) {
      const copy = { ...selectedPlanting, id: uuid("area"), plantingId: undefined, x: clamp(selectedPlanting.x + 5, 0, 100 - selectedPlanting.w), y: clamp(selectedPlanting.y + 5, 0, 100 - selectedPlanting.h) };
      commit({ ...plan, plantingAreas: [...plan.plantingAreas, copy] }); setSelection({ kind: "planting", id: copy.id });
    } else if (selectedRow) {
      const result = pastePlanSelection(plan, { plan, selection: { kind: "row", id: selectedRow.id } });
      if (result) { commit(result.plan); setSelection(result.selection); }
    } else if (selectedObject) {
      let object = structuredClone(selectedObject);
      object.id = uuid(object.type);
      if (object.type === "path" || object.type === "trellis") object = { ...object, x1: clamp(object.x1 + 20, 0, CANVAS_WIDTH), y1: clamp(object.y1 + 20, 0, CANVAS_HEIGHT), x2: clamp(object.x2 + 20, 0, CANVAS_WIDTH), y2: clamp(object.y2 + 20, 0, CANVAS_HEIGHT) };
      else if (object.type === "structure") object = { ...object, x: clamp(object.x + 20, object.widthCm / 2, CANVAS_WIDTH - object.widthCm / 2), y: clamp(object.y + 20, object.depthCm / 2, CANVAS_HEIGHT - object.depthCm / 2) };
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
    const snapshot = JSON.stringify(plan);
    setSaveState("saving");
    try {
      const notesResult = await planNotesRef.current?.save();
      const result = await persistGardenPlan(gardenId, plan);
      if (result === "local" || notesResult === "local") { setSaveState("local"); return; }
      setSavedSnapshot(snapshot);
      setLoadSource("cloud");
      setSaveState("cloud");
    } catch { setSaveState("error"); }
  }

  function updatePlanting(id: string, mutate: (area: PlannerPlantingArea, bed: Bed) => PlannerPlantingArea) {
    setPlan((current) => ({ ...current, plantingAreas: current.plantingAreas.map((area) => {
      if (area.id !== id) return area;
      const bed = current.beds.find((item) => item.id === area.bedId);
      return bed ? mutate(area, bed) : area;
    }) }));
    setSaveState("idle");
  }

  function updateShape(shape: PlannerShape) {
    edit((current) => ({ ...current, objects: current.objects.map((item) => item.id === shape.id ? shape : item) }));
  }

  function pasteDrawingObject() {
    if (groupClipboard.current) {
      const result = pasteGroup(plan, groupClipboard.current);
      if (!result.selections.length) return;
      commit(result.plan); setSelections(result.selections); setDesignerLayer("all"); setTool("select"); setPanelOpen(true); return;
    }
    const stored = drawingClipboard.current;
    if (!stored) return;
    const result = pastePlanSelection(plan, stored);
    if (!result) return;
    commit(result.plan); setSelection(result.selection); setDesignerLayer("all"); setTool("select"); setPanelOpen(true);
  }

  function copyDrawingSelection() {
    if (!selection) return;
    groupClipboard.current = groupSelection.length > 1 ? { selections: [...groupSelection], plan: clonePlan(plan) } : null;
    drawingClipboard.current = { selection: { ...selection }, plan: clonePlan(plan) };
    setClipboardReady(true);
  }

  function individualPlantEditor(source: PlantingRow | PlannerPlantingArea) {
    if (!selection?.plantId || selectionLocked) return null;
    const { id, plantId } = selection;
    const kind = "bedId" in source ? "area" : "row";
    return <IndividualPlantControls key={id + ":" + plantId} crop={source.crop} variety={source.variety} onChange={crop => {
      setItemEditError("");
      try {
        const next = changeIndividualPlant(plan, { kind, id, plantId }, crop);
        if (!next) return;
        if (!preservesPlanLocks(plan, next.plan)) throw new Error("Unlock this planting before changing it.");
        commit(next.plan);
        setSelection({ kind: kind === "area" ? "planting" : "row", id: next.selection.id, plantId });
      } catch (error) {
        setItemEditError(error instanceof Error ? error.message : "Could not change this plant.");
      }
    }} />;
  }

  function selectionInspector() {
    if (groupSelection.length > 1) return <div className="gv-selection-panel gv-group-selection"><h2>{groupSelection.length} items selected</h2>{itemEditError && <p role="alert">{itemEditError}</p>}<p>Drag a selected item to move the selection.</p><div className="gv-edit-actions"><button type="button" onClick={copyDrawingSelection}>Copy selection</button><button type="button" onClick={duplicateSelection}>Duplicate selection</button><button type="button" onClick={deleteSelection}>Delete selection</button></div><button type="button" className="gv-secondary-action" onClick={() => setSelection(null)}>Deselect all</button></div>;
    if (selectedObject?.type === "shape") return <DesignerShapeInspector shape={selectedObject} onChange={updateShape} onDuplicate={duplicateSelection} onDelete={deleteSelection} />;
    if (selectedPlanting && selectedPlantingBed) {
      const bedSize = bedCm(selectedPlantingBed);
      const widthM = bedSize.w * selectedPlanting.w / 100 / 100;
      const heightM = bedSize.h * selectedPlanting.h / 100 / 100;
      return <div className="gv-selection-panel gv-planting-inspector" data-bed-id={selectedPlanting.bedId} data-planting-id={selectedPlanting.plantingId ?? ""}>
        {individualPlantEditor(selectedPlanting)}
        {selection?.plantId && itemEditError && <p role="alert">{itemEditError}</p>}
        <div className="gv-selection-hero"><span><PlantArt crop={selectedPlanting.crop} variety={selectedPlanting.variety} fallback={selectedPlanting.cropIcon} /></span><div><small>PLANTING AREA</small><h2>{selectedPlanting.variety}</h2><p>{selectedPlantingBed.name} · {widthM.toFixed(1)} × {heightM.toFixed(1)} m</p></div></div>
        <dl><div><dt>Crop</dt><dd>{selectedPlanting.crop}</dd></div><div><dt>Plants</dt><dd>≈ {selectedPlanting.count}</dd></div><div><dt>Spacing</dt><dd>{selectedPlanting.spacingCm} cm centres</dd></div></dl>
        <PlantingScheduleControls key={selectedPlanting.id} schedule={selectedPlanting.schedule} onChange={schedule => changeSchedule("planting", selectedPlanting.id, schedule)} onSuccession={crop => succession("planting", selectedPlanting.id, crop)} />
        <section className="gv-inspector-section gv-records-group"><h3>Records</h3><button type="button" className="gv-secondary-action">📝 Notes & harvests</button><button type="button" className="gv-secondary-action">📷 Photos & video</button></section>
        <details className="gv-inspector-section gv-edit-section"><summary>Edit planting</summary>
        <label>Variety<input value={selectedPlanting.variety} onChange={(event) => updatePlanting(selectedPlanting.id, (area) => ({ ...area, variety: event.target.value || area.crop }))} /></label>
        <label>Actual plant spacing (cm)<input type="number" min={2} value={selectedPlanting.spacingCm} onChange={(event) => updatePlanting(selectedPlanting.id, (area, bed) => { const next = { ...area, spacingCm: Math.max(2, Number(event.target.value) || 2) }; return { ...next, count: areaCount(next, bed) }; })} /></label>
        <p className="gv-scale-note">↔ Zoom above 100% to see plant centres drawn {selectedPlanting.spacingCm} cm apart at the garden scale.</p>
        <label className="reference-sizing-choice"><input type="checkbox" checked={originalSymbolSizes} onChange={(event) => setOriginalSymbolSizes(event.target.checked)} />Original symbol sizes</label><label>Custom icon size <strong>{selectedPlanting.iconSize}px</strong><input type="range" disabled={originalSymbolSizes} min={8} max={64} step={1} value={selectedPlanting.iconSize} onChange={(event) => updatePlanting(selectedPlanting.id, (area) => ({ ...area, iconSize: Number(event.target.value) }))} /></label>
        <label>Layout<select value={selectedPlanting.pattern} onChange={(event) => updatePlanting(selectedPlanting.id, (area, bed) => { const next = { ...area, pattern: event.target.value as PlannerPlantingPattern }; return { ...next, count: areaCount(next, bed) }; })}><option value="grid">Block</option><option value="staggered">Staggered</option><option value="rows">Rows</option><option value="natural">Natural</option><option value="single">Single</option></select></label>
        <p className="gv-help">Drag this planting to move it within the bed. Drag the square handle to resize the planted area; plant count recalculates from the real centimetre spacing.</p>
          <button type="button" className="gv-secondary-action" onClick={duplicateSelection}>Duplicate planting</button>
        </details>
        <details className="gv-inspector-section gv-danger-zone"><summary>Danger zone</summary><button type="button" className="gv-secondary-action danger" onClick={deleteSelection}>Remove planting</button></details>
      </div>;
    }
    if (selectedBed) {
      const size = bedCm(selectedBed);
      const areas = plan.plantingAreas.filter((area) => area.bedId === selectedBed.id);
      const totalPlants = visiblePlan.plantingAreas.filter(area => area.bedId === selectedBed.id).reduce((sum, area) => sum + area.count, 0);
      return <div className="gv-selection-panel" data-bed-id={selectedBed.id}>
        <div className="gv-selection-hero"><span>▭</span><div><small>BED</small><h2>{selectedBed.name}</h2><p>{bedSizeLabel(selectedBed)}</p></div></div>
        <dl><div><dt>Area</dt><dd>{(size.w * size.h / 10000).toFixed(1)} m²</dd></div><div><dt>Plantings</dt><dd>{areas.length}</dd></div><div><dt>Plants this month</dt><dd>≈ {totalPlants}</dd></div></dl>
        <section className="gv-inspector-section"><h3>Plantings</h3>
          {areas.length ? areas.map((area) => <button type="button" className="gv-planting-summary" key={area.id} onClick={() => setSelection({ kind: "planting", id: area.id })}><span><PlantArt crop={area.crop} variety={area.variety} fallback={area.cropIcon} /></span><span><strong>{area.variety}</strong><small>{area.crop} · {area.spacingCm} cm spacing{area.schedule && <><br />{area.schedule.from ?? "Any time"} → {area.schedule.until ?? "Ongoing"}</>}</small></span><b>×{area.count}</b></button>) : <p className="gv-inspector-empty">Empty · ready for your next planting</p>}
        </section>
        <section className="gv-inspector-section gv-records-group"><h3>Records</h3><button type="button" className="gv-secondary-action">📝 Notes & harvests</button><button type="button" className="gv-secondary-action">📷 Photos & video</button></section>
        <details className="gv-inspector-section gv-edit-section"><summary>Edit bed</summary>
        <label>Name<input value={selectedBed.name} onChange={(event) => setPlan((current) => ({ ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? { ...bed, name: event.target.value } : bed) }))} /></label>
        <div className="gv-field-grid"><label>Width (cm)<input type="number" value={Math.round(size.w)} onChange={(event) => { const w = clamp(Number(event.target.value) || 40, 40, CANVAS_WIDTH - size.x); setPlan((current) => { const nextBed = { ...selectedBed, w: w / 900 * 100 }; return { ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? nextBed : bed), plantingAreas: current.plantingAreas.map((area) => area.bedId === selectedBed.id ? { ...area, count: area.placements?.length ?? areaCount(area, nextBed) } : area) }; }); }} /></label><label>Length (cm)<input type="number" value={Math.round(size.h)} onChange={(event) => { const h = clamp(Number(event.target.value) || 40, 40, CANVAS_HEIGHT - size.y); setPlan((current) => { const nextBed = { ...selectedBed, h: h / 1080 * 100 }; return { ...current, beds: current.beds.map((bed) => bed.id === selectedBed.id ? nextBed : bed), plantingAreas: current.plantingAreas.map((area) => area.bedId === selectedBed.id ? { ...area, count: area.placements?.length ?? areaCount(area, nextBed) } : area) }; }); }} /></label></div>
          <button type="button" className="gv-primary-action" onClick={() => chooseTool("plant")}>🌱 Add planting area</button>
          <button type="button" className="gv-secondary-action" onClick={duplicateSelection}>Duplicate bed</button>
        </details>
        {areas.length > 0 && <button type="button" className="gv-secondary-action" onClick={deleteSelection}>Remove bed, keep plants</button>}
        {itemEditError && <p role="alert">{itemEditError}</p>}
        <details className="gv-inspector-section gv-danger-zone"><summary>Danger zone</summary><p>Removing a bed keeps its plants in place and preserves its saved history.</p>{areas.length > 0 && <button type="button" className="gv-secondary-action danger" onClick={clearBed}>Clear all plantings</button>}<button type="button" className="gv-secondary-action danger" onClick={deleteSelection}>Remove bed</button></details>
      </div>;
    }
    if (selectedRow) return <div className="gv-selection-panel">{individualPlantEditor(selectedRow)}{selection?.plantId && itemEditError && <p role="alert">{itemEditError}</p>}<div className="gv-selection-hero"><span><PlantArt crop={selectedRow.crop} variety={selectedRow.variety} fallback={selectedRow.cropIcon} /></span><div><small>{selectedRow.block?.mode === "square-foot" ? "SQUARE FOOT" : selectedRow.block ? "PLANTING BLOCK" : "PLANTING ROW"}</small><h2>{selectedRow.variety}</h2><p>{(lineLength(selectedRow) / 100).toFixed(1)} m · ≈ {selectedRow.count} plants</p></div></div><label>Spacing (cm)<input type="number" value={selectedRow.spacingCm} min={2} onChange={(event) => { const spacing = Math.max(2, Number(event.target.value) || 2); setPlan((current) => ({ ...current, rows: current.rows.map((row) => row.id === selectedRow.id ? resizePlantingRow(row, { spacingCm: spacing }) : row) })); }} /></label><PlantingScheduleControls key={selectedRow.id} schedule={selectedRow.schedule} onChange={schedule => changeSchedule("row", selectedRow.id, schedule)} onSuccession={crop => succession("row", selectedRow.id, crop)} /><PlantingBlockControls row={selectedRow} onChange={next => edit(current => ({ ...current, rows: current.rows.map(row => row.id === next.id ? next : row) }))} /><p className="gv-help">Drag to move. Use the square corner to grow a block; round endpoints change a row.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (!selectedObject) return null;
    if (selectedObject.type === "path") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>═</span><div><small>PATH</small><h2>{selectedObject.label ?? "Path"}</h2><p>{(lineLength(selectedObject) / 100).toFixed(1)} m long</p></div></div><label>Label<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "path" ? { ...object, label: event.target.value } : object) }))} /></label><label>Width (cm)<input type="number" min={20} max={400} value={selectedObject.widthCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "path" ? { ...object, widthCm: clamp(Number(event.target.value) || 20, 20, 400) } : object) }))} /></label><p className="gv-help">Drag the path to move it. Drag either endpoint to reshape it.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (selectedObject.type === "trellis") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>⋮</span><div><small>TRELLIS</small><h2>{selectedObject.label ?? "Trellis"}</h2><p>{(lineLength(selectedObject) / 100).toFixed(1)} m long</p></div></div><label>Label<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, label: event.target.value } : object) }))} /></label><div className="gv-field-grid"><label>Height (cm)<input type="number" value={selectedObject.heightCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, heightCm: clamp(Number(event.target.value) || 50, 50, 500) } : object) }))} /></label><label>Posts (cm)<input type="number" value={selectedObject.postSpacingCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "trellis" ? { ...object, postSpacingCm: clamp(Number(event.target.value) || 50, 30, 1000) } : object) }))} /></label></div><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (selectedObject.type === "tree") return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>🌳</span><div><small>TREE / SHADE</small><h2>{selectedObject.label ?? "Tree"}</h2><p>{(selectedObject.diameterCm / 100).toFixed(1)} m canopy</p></div></div><label>Name<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "tree" ? { ...object, label: event.target.value } : object) }))} /></label><label>Canopy diameter (cm)<input type="range" min={30} max={600} step={10} value={selectedObject.diameterCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "tree" ? { ...object, diameterCm: Number(event.target.value) } : object) }))} /><strong>{selectedObject.diameterCm} cm</strong></label><p className="gv-help">Drag the tree to move it. Drag the square handle on the canopy edge to resize visually.</p><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    if (selectedObject.type === "structure") {
      const preset = structurePreset(selectedObject.kind);
      return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>{preset.icon}</span><div><small>STRUCTURE</small><h2>{selectedObject.label ?? preset.label}</h2><p>{(selectedObject.widthCm / 100).toFixed(1)} × {(selectedObject.depthCm / 100).toFixed(1)} m footprint</p></div></div><label>Name<input value={selectedObject.label ?? ""} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "structure" ? { ...object, label: event.target.value } : object) }))} /></label><div className="gv-field-grid"><label>Width (cm)<input type="number" min={30} max={CANVAS_WIDTH} value={selectedObject.widthCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "structure" ? { ...object, widthCm: clamp(Number(event.target.value) || 30, 30, CANVAS_WIDTH) } : object) }))} /></label><label>Depth (cm)<input type="number" min={30} max={CANVAS_HEIGHT} value={selectedObject.depthCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "structure" ? { ...object, depthCm: clamp(Number(event.target.value) || 30, 30, CANVAS_HEIGHT) } : object) }))} /></label><label>Height (cm)<input type="number" min={20} max={600} value={selectedObject.heightCm} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "structure" ? { ...object, heightCm: clamp(Number(event.target.value) || 20, 20, 600) } : object) }))} /></label><label>Rotation (degrees)<input type="number" step={1} key={selectedObject.rotationDeg} defaultValue={selectedObject.rotationDeg} onBlur={(event) => { if (event.target.value && Number.isFinite(event.target.valueAsNumber)) rotateStructure(event.target.valueAsNumber); else event.target.value = String(selectedObject.rotationDeg); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label></div><p className="gv-help">Use Select to move the structure. Drag its corner to resize or set its dimensions here.</p><div className="gv-edit-actions"><button type="button" onClick={() => rotateStructure(selectedObject.rotationDeg - 90)}>Rotate left 90°</button><button type="button" onClick={() => rotateStructure(selectedObject.rotationDeg + 90)}>Rotate right 90°</button><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
    }
    return <div className="gv-selection-panel"><div className="gv-selection-hero"><span>A</span><div><small>TEXT LABEL</small><h2>{selectedObject.text}</h2><p>Canvas label</p></div></div><label>Text<input value={selectedObject.text} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "text" ? { ...object, text: event.target.value || "Label" } : object) }))} /></label><label>Size<input type="range" min={9} max={28} value={selectedObject.fontSize} onChange={(event) => setPlan((current) => ({ ...current, objects: current.objects.map((object) => object.id === selectedObject.id && object.type === "text" ? { ...object, fontSize: Number(event.target.value) } : object) }))} /></label><div className="gv-edit-actions"><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" onClick={deleteSelection}>Delete</button></div></div>;
  }

  function plantCatalog() {
    const modeLabel = (mode: PlannerPlantingPattern) => mode === "grid" ? "Block" : mode === "staggered" ? "Stagger" : mode === "rows" ? "Rows" : mode === "natural" ? "Natural" : "Single";
    return <><div className="gv-panel-section-title"><div><span className="gv-panel-leaf">🌱</span><strong>{tool === "row" ? "Planting rows" : "Plants"}</strong></div></div><div className="gv-catalogue-options"><label><input type="checkbox" checked={fullCatalogue} onChange={(event) => setFullCatalogue(event.target.checked)} />Full plant catalogue ({plants.length})</label></div><PlantCatalogueFilters extra={<label>Type<select value={plantType} onChange={(event) => setPlantType(event.target.value)}><option>All Plants</option><option>Vegetable</option><option>Fruit</option><option>Herb</option><option>Flower</option><option>Native</option></select></label>} value={plantFilters} onChange={setPlantFilters} selected={plantPicked ? selectedPlant.name : ""} onReset={() => { setSearch(""); setPlantType("All Plants"); }}>{catalogueMessage && <p role="status">{catalogueMessage}</p>}<div className="gv-filters"><label>Name<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Plant or variety" /></label><label className="catalogue-variety">Variety<select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)}>{selectedPlant.varieties.map((variety) => <option key={variety}>{variety}</option>)}</select></label><label className="catalogue-custom-variety">Custom variety<input aria-label="Custom variety" value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)} /></label></div></PlantCatalogueFilters><label className="gv-planting-mode">Planting mode<select aria-label="Planting mode" value={plantingMode} onChange={event => setPlantingMode(event.target.value as typeof plantingMode)}><option value="row">Single plant / row</option><option value="block">Block</option><option value="square-foot" disabled={!plantFacts(selectedPlant.name, selectedVariety)?.squareFootCount}>Square foot</option></select></label><label className="gv-catalogue-spacing">Plant spacing (cm)<input type="number" min={2} max={1000} value={selectedPlant.spacingCm} onChange={(event) => { const spacing = Math.max(2, Math.min(1000, Number(event.target.value) || 2)); setPlantSpacing((current) => ({ ...current, [selectedPlant.name]: spacing })); setSelectedPlant((current) => ({ ...current, spacingCm: spacing })); }} />{unverifiedPlantNames.has(selectedPlant.name) && <small>30 cm is a layout starting point. Enter the spacing on your seed packet before planting.</small>}</label>{tool === "plant" && <div className="gv-v4-modebar"><span>Placement</span>{(["grid", "staggered", "rows", "natural", "single"] as PlannerPlantingPattern[]).map((mode) => <button key={mode} type="button" className={placementMode === mode ? "active" : ""} onClick={() => setPlacementMode(mode)}>{modeLabel(mode)}</button>)}</div>}<div className="gv-ready-strip" data-crop={selectedPlant.name}><span><PlantArt crop={selectedPlant.name} variety={selectedVariety} fallback={selectedPlant.icon} /></span><div><small>{tool === "plant" ? "DRAG INTO A BED" : "READY TO DRAW"}</small><strong>{selectedVariety}</strong><em>{selectedPlant.spacingCm} cm canvas spacing · {selectedPlant.spacing}</em></div></div><div className="gv-plant-list">{filteredPlants.map((plant, index) => <Fragment key={plant.name}><button draggable={tool === "plant"} type="button" key={plant.name} data-crop={plant.name} className={selectedPlant.name === plant.name ? "active" : ""} onClick={() => choosePlant(plant)} onDragStart={(event) => { choosePlant(plant); setDragPlant(plant); event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", plant.name); }} onDragEnd={() => { setDragPlant(null); setDropBedId(null); }}><span className="gv-plant-icon"><PlantArt crop={plant.name} variety={selectedPlant.name === plant.name ? selectedVariety : plant.varieties[0]} fallback={plant.icon} /></span><span><strong>{plant.name}</strong><small>{plantFacts(plant.name)?.perennial ? "Perennial" : ""}</small></span>{tool === "plant" && <b className="gv-v4-drag-grip">⋮⋮</b>}</button><div className="plant-entry-actions" style={{ top: index * 60 + 6 }}><button type="button" aria-label={`Favorite ${plant.name}`} aria-pressed={favouritePlants.includes(plant.name)} onClick={() => toggleFavourite(plant.name)}>{favouritePlants.includes(plant.name) ? "★" : "☆"}</button><button type="button" aria-label={`Information about ${plant.name}`} onClick={() => setInformationPlant(plant.name)}>ⓘ</button></div></Fragment>)}</div>{!filteredPlants.length && <p className="plant-filter-empty">No plants match these filters.</p>}</>;
  }

  function structureCatalog() {
    const selected = structurePreset(selectedStructureKind);
    return <><div className="gv-panel-section-title"><div><span className="gv-panel-leaf">⌂</span><strong>Garden Objects</strong></div></div><div className="gv-catalogue-options"><label>Object category<select aria-label="Object category" value={objectCategory} onChange={event => setObjectCategory(event.target.value)}><option value="all">All objects & structures</option>{referenceObjectGroups.map(group => <option key={group.id} value={group.id}>{group.displayName}</option>)}<option value="ungrouped">Other objects</option></select></label><label><input type="checkbox" checked={fullStructures} onChange={(event) => setFullStructures(event.target.checked)} />Full structure catalogue ({ALL_STRUCTURE_PRESETS.length})</label><label>Find structure<input value={structureSearch} onChange={(event) => setStructureSearch(event.target.value)} placeholder="Object name" /></label></div><div className="gv-ready-strip gv-structure-ready"><span>{selected.icon}</span><div><small>CLICK THE PLAN TO PLACE</small><strong>{selected.label}</strong><em>{(selected.widthCm / 100).toFixed(1)} × {(selected.depthCm / 100).toFixed(1)} m · {selected.heightCm} cm high</em></div></div><div className="gv-plant-list gv-structure-list">{(fullStructures || structureSearch.trim() || objectCategory !== "all" ? FULL_STRUCTURE_PRESETS : STRUCTURE_PRESETS).filter((preset) => (objectCategory === "all" || (referenceObject(preset.kind)?.group ?? "ungrouped") === objectCategory) && preset.label.toLowerCase().includes(structureSearch.toLowerCase())).map((preset) => <button type="button" key={preset.kind} className={selectedStructureKind === preset.kind ? "active" : ""} onClick={() => setSelectedStructureKind(preset.kind)}><span className="gv-structure-preset-icon" aria-hidden="true"><ReferenceObjectArt kind={preset.kind} /></span><span><strong>{preset.label}</strong><small>{(preset.widthCm / 100).toFixed(1)} × {(preset.depthCm / 100).toFixed(1)} m footprint</small></span></button>)}{<ReferenceObjectCatalogue category={objectCategory} search={structureSearch} selected={selectedStructureKind} onSelect={setSelectedStructureKind} />}</div><div className="gv-tool-tip"><kbd>{snapEnabled ? "10 cm" : "Free"}</kbd><span>Select an object above, then click the garden where its centre should sit.</span></div></>;
  }

  function toolPanel() {
    const current = tools.find((item) => item.id === tool)!;
    return <div className="gv-tool-panel"><div className="gv-tool-hero"><span>{current.icon}</span><div><h2>{current.label}</h2><p>{current.hint}</p></div></div>{tool === "bed" && <><strong>Click-drag on the grid</strong><p>Dimensions appear while you draw. New beds can be moved, resized, duplicated and planted immediately.</p></>}{tool === "path" && <label>Path width (cm)<input type="number" min={20} max={400} value={pathWidth} onChange={(event) => setPathWidth(clamp(Number(event.target.value) || 20, 20, 400))} /></label>}{tool === "trellis" && <div className="gv-field-grid"><label>Height (cm)<input type="number" value={trellisHeight} onChange={(event) => setTrellisHeight(clamp(Number(event.target.value) || 50, 50, 500))} /></label><label>Post spacing<input type="number" value={postSpacing} onChange={(event) => setPostSpacing(clamp(Number(event.target.value) || 50, 30, 1000))} /></label></div>}{tool === "tree" && <label>Canopy diameter (cm)<input type="number" value={treeDiameter} onChange={(event) => setTreeDiameter(clamp(Number(event.target.value) || 30, 30, 600))} /></label>}{tool === "note" && <label>New label<input value={newText} onChange={(event) => setNewText(event.target.value)} /></label>}<div className="gv-tool-tip"><kbd>{snapEnabled ? "10 cm" : "Free"}</kbd><span>{snapEnabled ? "Objects snap to the planning grid." : "Snap is off for fine placement."}</span></div></div>;
  }

  function contextPanel() {
    const inspect = selectionInspector();
    if (inspect && (tool === "select" || (selectedBed && tool === "bed") || (selectedPlanting && tool === "plant") || (selectedRow && tool === "row") || (selectedObject && (tool === selectedObject.type || (tool === "note" && selectedObject.type === "text"))))) return inspect;
    if (tool === "shape") return <DesignerShapeControls value={shapeStyle} onChange={setShapeStyle} />;
    if (tool === "plant" || tool === "row") return plantCatalog();
    if (tool === "structure") return structureCatalog();
    if (tool === "select") return inspect ?? <PlannerStartPanel onBed={() => chooseTool("bed")} onPlants={() => chooseTool("plant")} onObjects={() => chooseTool("structure")} />;
    return toolPanel();
  }

  function lineObject(object: Extract<PlannerLayoutObject, { type: "path" | "trellis" }>) {
    const visual = lineVisual(object), selected = isSelected("object", object.id);
    const thickness = object.type === "path" ? object.widthCm : 22;
    return <div key={object.id} data-skip-locked={skipLockedObject(object)} className={`layout-object layout-line ${object.type}-object ${selected ? "selected" : ""}`} style={{ left: object.x1, top: object.y1 - thickness / 2, width: visual.length, height: thickness, transform: `rotate(${visual.angle}deg)` }} onPointerDown={(event) => startObjectInteraction(event, object)}><span className="layout-line-core" />{object.label && <span className="layout-label">{object.label}</span>}{selected && !groupSelection.length && !selectionLocked && <><span className="line-handle start" onPointerDown={(event) => startObjectInteraction(event, object, "object-start")} /><span className="line-handle end" onPointerDown={(event) => startObjectInteraction(event, object, "object-end")} /></>}</div>;
  }

  function renderPlantingArea(area: PlannerPlantingArea) {
    const selected = isSelected("planting", area.id);
    const bed = plan.beds.find((item) => item.id === area.bedId);
    const areaSize = bed ? areaSizeCm(area, bed) : { width: 1, height: 1 };
    const overview = zoom < 110;
    const symbol = originalSymbolSizes ? referencePlantDimensions(area.crop, area.variety) : null;
    const renderLimit = overview ? 400 : 1600;
    const positions = bed ? plantPositionsForArea(area, areaSize.width, areaSize.height, renderLimit) : [];
    const sampleStep = Math.max(1, Math.ceil(Math.round(area.count) / renderLimit));
    return <div key={area.id} data-skip-locked={skipLockedItem({ kind: "planting", id: area.id })} className={`planting-area ${area.placements ? "has-explicit-placements" : ""} ${overview ? "is-overview" : ""} ${selected ? "selected" : ""}`} data-crop={area.crop} data-pattern={area.pattern} style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%`, ["--area-icon-size" as string]: `${symbol?.width ?? area.iconSize}px`, ["--area-icon-height" as string]: `${symbol?.height ?? area.iconSize}px` }} onPointerDown={(event) => overview && bed && tool === "select" && !area.placements && !clickedPlantId(event) && !lockedKeys.has("bed:" + bed.id) ? startBedInteraction(event, bed) : startPlantingInteraction(event, area)}>
      <span className="planting-area-icons">{overview && !positions.length && zoom >= 45 && <i className="gv-overview-art" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", ["--area-icon-size" as string]: `${30 / (zoom / 100)}px` }}><PlantArt crop={area.crop} variety={area.variety} fallback={area.cropIcon} /></i>}{positions.map((position, index) => { const plantId = area.placements?.[index]?.id ?? `${area.id}:generated-${index * sampleStep}`; return <i key={plantId} data-plant-id={plantId} data-selected-plant={selected && selection?.plantId === plantId} style={{ left: position.x, top: position.y, transform: `translate(-50%, -50%) rotate(${position.rotation}deg)` }}><PlantArt crop={area.crop} variety={area.variety} fallback={area.cropIcon} /></i>; })}</span>
      <span className="planting-area-label" title={`${area.crop} · ${area.variety} · ${area.count} plants · ${area.spacingCm} cm spacing`}><span className="gv-crop-symbol" aria-hidden="true"><PlantArt crop={area.crop} variety={area.variety} fallback={area.cropIcon} /></span><span className="gv-crop-name">{area.variety}</span><b>×{area.count}</b></span>
      {selected && !groupSelection.length && !overview && <span className="planting-spacing-badge">↔ {area.spacingCm} cm</span>}
      {selected && !groupSelection.length && !selectionLocked && <span className="planting-area-resize" onPointerDown={(event) => startPlantingInteraction(event, area, true)} />}
    </div>;
  }

  const isSaved = savedSnapshot === JSON.stringify(plan) && !notesDirty;
  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : saveState === "local" ? "Local only" : isSaved ? "Saved ✓" : "Save";
  const sourceLabel = saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed · retry" : saveState === "local" ? "Local only · set edit key in Settings" : loadSource === "starting" ? "Loading…" : isSaved ? "Saved" : "Unsaved changes";
  const scaledWidth = CANVAS_WIDTH * zoom / 100, scaledHeight = CANVAS_HEIGHT * zoom / 100;
  const draftRect = draft?.kind === "bed" ? { x: Math.min(draft.start.x, draft.end.x), y: Math.min(draft.start.y, draft.end.y), w: Math.abs(draft.end.x - draft.start.x), h: Math.abs(draft.end.y - draft.start.y) } : null;
  const draftLine = draft && draft.kind !== "bed" && draft.kind !== "shape" && draft.kind !== "select" && draft.kind !== "plant" && draft.kind !== "row" ? { x1: draft.start.x, y1: draft.start.y, x2: draft.end.x, y2: draft.end.y } : null;

  const previewRow = draft && (draft.kind === "plant" || draft.kind === "row") ? drawingPlantRow(draft) : null;

  return <main data-notes-dirty={notesDirty} data-pan-mode={panMode} data-tools-expanded={toolsExpanded} data-drawing={Boolean(draft)} data-interacting={Boolean(interaction)} className="gv-app reference-planner" data-designer-layer={designerLayer} data-plant-picked={plantPicked} data-report-view={notesOpen ? "notes" : reportView ?? "plan"}><PlannerPlanNotes ref={planNotesRef} open={notesOpen} onDirty={setNotesDirty} />{informationPlant && <PlantInformation name={informationPlant} onClose={() => setInformationPlant(null)} />}
    <nav className="planner-app-nav" aria-label="Applications">
      <button type="button" aria-label="Toggle drawing panel" onClick={() => setPanelOpen((value) => !value)}><PlannerIcon name="menu" /></button>
      <Link href="/" title="Overview" aria-label="Overview"><PlannerIcon name="home" /></Link>
      <Link href="/planner" title="Garden Planner" aria-label="Garden Planner" aria-current="page"><PlannerIcon name="plan" /></Link>
      <Link href="/seedlings" title="Seedling journal" aria-label="Seedling journal"><PlannerIcon name="journal" /></Link>
      <button type="button" title="Seasonal guidance" aria-label="Seasonal guidance" data-season-view="today"><PlannerIcon name="plant" /></button>
      <a className="planner-app-3d" href="/3d" title="3D garden" aria-label="3D garden"><PlannerIcon name="structure" /></a>
    </nav>
    <header className="gv-titlebar">
      <div className="gv-title-left"><button type="button" className="gv-plan-name">BLENHEIM GARDEN <span>Garden ▾</span></button></div>
      <nav className="gv-primary-nav" aria-label="Garden navigation"><button type="button" className="gv-settings planner-visible-settings" aria-label="Plan settings"><PlannerIcon name="settings" /> Settings</button>
        <button type="button" className={`gv-plan-tab ${!reportView && !notesOpen ? "active" : ""}`} data-planner-view="2d" onClick={() => { window.dispatchEvent(new Event("garden-report-close")); setNotesOpen(false); setTool("select"); }}>Plan</button>
        <button type="button" className={`planner-report-tab ${reportView === "plants" ? "active" : ""}`} aria-label="Open plant list" onClick={() => window.dispatchEvent(new CustomEvent("garden-report-open", { detail: "plants" }))}>Plant List</button>
        <button type="button" className={`planner-report-tab ${reportView === "parts" ? "active" : ""}`} aria-label="Open parts list" onClick={() => window.dispatchEvent(new CustomEvent("garden-report-open", { detail: "parts" }))}>Parts List</button>
        <button type="button" className={`planner-report-tab ${reportView === "calendar" ? "active" : ""}`} aria-label="Open planting calendar" onClick={() => window.dispatchEvent(new CustomEvent("garden-report-open", { detail: "calendar" }))}>Calendar</button>
        <button type="button" className={`planner-report-tab ${notesOpen ? "active" : ""}`} aria-label="Plan notes" onClick={() => { window.dispatchEvent(new Event("garden-report-close")); setNotesOpen(true); }}>Notes</button><button type="button" data-season-view="today">Today</button>
        <div ref={moreRef} className="gv-more" data-open={moreOpen}>
          <button type="button" className="gv-more-trigger" aria-expanded={moreOpen} aria-controls="gv-more-panel" onClick={() => setMoreOpen(value => !value)}>
            More <span aria-hidden="true">{moreOpen ? "⌃" : "⌄"}</span>
          </button>
          {moreOpen && <div id="gv-more-panel" className="gv-more-panel" onClick={(event) => {
            if ((event.target as HTMLElement).closest("a, button")) setMoreOpen(false);
          }}>
          <nav className="gv-tabs" aria-label="Garden records"><button type="button">Photos</button><button type="button">Notes</button></nav>
          <button type="button" onClick={() => { window.dispatchEvent(new Event("garden-report-close")); setNotesOpen(true); }}>Plan notes</button><PlannerReports plan={plan} period={{ year: planningYear, month: months.indexOf(month) }} onPeriodChange={period => { setPlanningYear(period.year); setMonth(months[period.month]); setSelection(null); }} onDatesChange={changeSchedule} onShowPlanting={showCalendarPlanting} /><button type="button" data-season-view="week">This Week</button>
          <a href="/3d" target="_blank" rel="noopener">Live 3D ↗</a> <Link href="/test-garden">All plant icons · Test garden ↗</Link>
          <button type="button" className="gv-settings">Settings</button>
          <div className="gv-layout-options" />
          </div>}
        </div>
        <button type="button" className="gv-save" onClick={() => void savePlan()} disabled={saveState === "saving"}> {saveLabel}</button>
      </nav>
    </header>
    <div className="gv-quickbar"><div className="planner-plan-actions"><span className="planner-ribbon-caption">Plan</span><button type="button" aria-label="New plan" title="New plan" onClick={() => window.dispatchEvent(new CustomEvent("garden-manager-open", { detail: "new" }))}><PlannerIcon name="new" /></button><button type="button" aria-label="Open plan" title="Open plan" onClick={() => window.dispatchEvent(new CustomEvent("garden-manager-open"))}><PlannerIcon name="open" /></button><button type="button" aria-label="Save plan" title="Save plan" onClick={() => void savePlan()} disabled={saveState === "saving"}><PlannerIcon name="save" /></button><button type="button" aria-label="Export design" title="Export design" onClick={() => window.dispatchEvent(new CustomEvent("garden-report-open", { detail: "export" }))}>↥</button></div><div className="gv-quick-actions"><span className="planner-ribbon-caption">Edit</span><button type="button" aria-label="Box selection" title="Box selection" aria-pressed={boxSelect} onClick={() => { setTool("select"); setBoxSelect(true); setPanMode(false); setPanelOpen(false); setDraft(null); setInteraction(null); }}><PlannerIcon name="select" /></button><button type="button" data-planner-action="select-all" className="planner-select-all" onClick={() => { setSelections(canonicalSelection(plan, selectableItems(visiblePlan, designerLayer).filter(item => !skipLockedItem(item)))); setTool("select"); setPanelOpen(true); }}>Select all</button><button type="button" aria-label="Select and edit" title="Select and edit" onClick={() => chooseTool("select")}><PlannerIcon name="edit" /></button><button type="button" aria-label="Cut selection" title="Cut" data-planner-action="cut" disabled={!selection || (selectedObject?.type === "shape" && selectedObject.locked)} onClick={() => { copyDrawingSelection(); removeSelection(false); }}><PlannerIcon name="cut" /></button><button type="button" aria-label="Copy selection" title="Copy" data-planner-action="copy" disabled={!selection} onClick={copyDrawingSelection}><PlannerIcon name="copy" /></button><button type="button" aria-label="Paste selection" title="Paste" data-planner-action="paste" disabled={!clipboardReady} onClick={pasteDrawingObject}><PlannerIcon name="paste" /></button><button type="button" aria-label="Delete selection" title="Delete" data-planner-action="delete" disabled={!selection || (selectedObject?.type === "shape" && selectedObject.locked)} onClick={deleteSelection}><PlannerIcon name="delete" /></button><button type="button" onClick={undo} disabled={!past.length} title="Undo"><PlannerIcon name="undo" /> <span>Undo</span></button><button type="button" onClick={redo} disabled={!future.length} title="Redo"><PlannerIcon name="redo" /> <span>Redo</span></button><button type="button" className={snapEnabled ? "active" : ""} onClick={() => setSnapEnabled((value) => !value)}>⌗ <span>Snap {snapEnabled ? "10 cm" : "Off"}</span></button></div><div className="gv-quick-center"><span className="planner-ribbon-caption">Timeline & view</span><button type="button" aria-label="Zoom out" onClick={() => navigation.zoomBy(-10)}>−</button><strong>{zoom}%</strong><button type="button" className="gv-fit-width" onClick={navigation.fit}>Fit</button><button type="button" aria-label="Zoom in" onClick={() => navigation.zoomBy(10)}>+</button><select aria-label="Planning month" value={month} onChange={(event) => { setMonth(event.target.value); setGeneratedMonth(null); setSelection(null); }}>{months.map((item) => <option key={item}>{item}</option>)}</select><input className="planning-year" aria-label="Planning year" type="number" min={1900} max={2200} key={planningYear} defaultValue={planningYear} onBlur={event => { const year = Number(event.target.value); if (Number.isInteger(year) && year >= 1900 && year <= 2200) { setPlanningYear(year); setSelection(null); } else event.target.value = String(planningYear); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /><div className="gv-seasonal-generator"><button type="button" aria-label="Generate seasonal garden" data-generated={generatedMonth === month} title={`Generate a Blenheim seasonal garden for ${month}`} disabled={!plan.beds.length} onClick={() => generateSeasonalGarden(uuid("season"))}>{generatedMonth === month ? `✓ ${month}` : "✦ Generate"}</button></div></div><div className="gv-cloud-state" role="status" aria-live="polite" data-save-state={saveState}><span className={isSaved ? "online" : ""} />{sourceLabel}</div>
    <div className="designer-toolbar" aria-label="Garden drawing controls"><span className="planner-ribbon-caption">Layout & layers</span><button type="button" aria-pressed={hideLabels} onClick={() => setHideLabels(value => !value)}>Hide labels</button><button type="button" aria-pressed={editLockedItems} onClick={() => { if (editLockedItems) setSelections(activeSelections.filter(item => !lockedKeys.has(planLockKey(item)))); setEditLockedItems(!editLockedItems); }}>Edit locked items</button>
      <label>Layers<select aria-label="Drawing layers" value={designerLayer} onChange={(event) => { setDesignerLayer(event.target.value); setSelection(null); }}><option value="all">Edit All</option><option value="view">View All</option><option value="plants">Plants</option><option value="structures">Structures</option><option value="layout">Layout</option><option value="text">Text</option></select></label>
      <button type="button" disabled={!selection} onClick={copyDrawingSelection}>Copy drawing</button>
      <button type="button" disabled={!clipboardReady} onClick={pasteDrawingObject}>Paste drawing</button>
      <button type="button" disabled={selectedObject?.type !== "shape" || selectedObject.locked} onClick={() => { if (selectedObject?.type === "shape") updateShape({ ...selectedObject, behind: true }); }}>Send to back</button>
      <button type="button" disabled={selectedObject?.type !== "shape" || selectedObject.locked} onClick={() => { if (selectedObject?.type === "shape") updateShape({ ...selectedObject, behind: false }); }}>Bring to front</button>
    </div></div>
    <section className={`gv-body ${panelOpen ? "" : "panel-closed"}`}><aside className="gv-rail"><button type="button" className="gv-menu" aria-label="Toggle inspector" onClick={() => setPanelOpen((value) => !value)}>☰</button>{tools.map((item) => <button type="button" key={item.id} className={tool === item.id ? "active" : ""} onClick={() => chooseTool(item.id)} aria-pressed={tool === item.id} title={item.hint}><span><PlannerIcon name={item.id} /></span><small>{item.label}</small></button>)}</aside>{panelOpen && <aside className="gv-context" data-catalogue={tool === "plant" || tool === "row" || tool === "structure"}><div className="gv-context-header"><strong>Drawing Tools</strong><button type="button" className="gv-tools-expand" aria-label={toolsExpanded ? "Compact drawing tools" : "Expand drawing tools"} aria-expanded={toolsExpanded} onClick={() => setToolsExpanded((value) => !value)}>{toolsExpanded ? "↙ Compact" : "↗ Expand"}</button><button type="button" aria-label="Close inspector" onClick={() => setPanelOpen(false)}>×</button></div><div className="gv-context-content">{(tool === "plant" || tool === "row" || tool === "structure") && <nav className="catalogue-switcher" aria-label="Browse catalogue"><button type="button" aria-pressed={tool !== "structure"} onClick={() => chooseTool("plant")}>Plants</button><button type="button" aria-pressed={tool === "structure"} onClick={() => chooseTool("structure")}>Objects & structures</button></nav>}{tool === "select" && selection && <button type="button" className="gv-secondary-action" onClick={() => toggleItemLocks(activeSelections)}>{selectionLocked ? "Unlock item" : "Lock item"}</button>}{tool === "select" && selectionLocked ? <p className="gv-help">Locked items stay in place until unlocked.</p> : contextPanel()}</div></aside>}{!panelOpen && <button type="button" className="gv-panel-reopen" aria-label="Open inspector" onClick={() => setPanelOpen(true)}>Details</button>}
      <section className="gv-stage"><div className="gv-stage-status"><button type="button" className="planner-fit-garden" aria-pressed={panMode} onClick={() => setPanMode(value => !value)} title="Drag anywhere to move the map. Shift-wheel moves sideways; Alt-wheel moves vertically.">{panMode ? "✓ Moving map" : "Move map"}</button><details className="planner-garden-menu"><summary>Garden ▾</summary><div><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setPlanItemsOpen(true); }}>Edit plan items…</button><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setSizeDialogOpen(true); }}>Garden size…</button><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); commit({ ...plan, bedMaterial: plan.bedMaterial === "metal" ? undefined : "metal" }); }}>{plan.bedMaterial === "metal" ? "Make all beds timber" : "Make all beds corrugated metal"}</button><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); startGardenTemplate(createMainGardenTemplate); }} disabled={Boolean(interaction || draft) || loadSource === "starting"}>Main template · Total New Garden</button><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); startGardenTemplate(createLargePlotTemplate); }} disabled={Boolean(interaction || draft) || loadSource === "starting"}>2023 PDF base template</button><button type="button" disabled={Boolean(interaction || draft) || loadSource === "starting"} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); if (window.confirm("Load the complete icon sample into this 2D planner? This replaces your current draft, which can be restored with Undo or Restore previous draft. For a separate saved sample, create a new named garden first.")) { startGardenTemplate(createGeneratedIconBedTemplate); setOriginalSymbolSizes(false); } }}>Editable icon sample bed · all approved varieties</button><button type="button" title="Read-only icon gallery outside the planner" onClick={() => window.location.assign("/test-garden#generated-bed")}>Icon artwork gallery (read-only)</button><button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); startBlankTemplate(); }} disabled={Boolean(interaction || draft) || loadSource === "starting"}>Blank template</button><button type="button" disabled={!hasTemplateBackup} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); const backup = readStoredPlan(`garden-before-blank-template:${activeGardenId}`); if (backup) { blankTemplateStarted.current = true; commit(backup, true); setSelection(null); setSelections([]); navigation.fit(); } }}>Restore previous draft</button><small>Templates replace this draft. Undo or Restore recovers it; Save publishes it.</small></div></details><button type="button" className="planner-fit-garden" onClick={navigation.fit} title="Fit garden (0). Wheel to zoom; Space-drag to pan.">Fit garden · {zoom}%</button><div><strong>{dragPlant ? `Drop ${dragPlant.name} into a bed` : tool === "select" ? "Drag empty ground to move · Wheel to zoom" : tools.find((item) => item.id === tool)?.hint}</strong><span>{month} {planningYear}</span></div>{cursorPoint && <code>X {Math.round(cursorPoint.x)} · Y {Math.round(cursorPoint.y)} cm</code>}</div>{(activeGardenId !== DEFAULT_GARDEN_ID || templateStarted) && loadSource !== "starting" && gettingStarted && tool === "select" && !plan.beds.length && !plan.rows.length && !plan.plantingAreas.length && !plan.objects.length && <PlannerStartPanel blank widthMetres={CANVAS_WIDTH / 100} lengthMetres={CANVAS_HEIGHT / 100} onBed={addStarterBed} onPlants={() => chooseTool("plant")} onObjects={() => chooseTool("structure")} onDismiss={() => setGettingStarted(false)} />}<div ref={stageScrollRef} className="gv-stage-scroll"><div className="gv-ruler-grid" style={{ width: scaledWidth + 30, gridTemplateColumns: `30px ${scaledWidth}px`, gridTemplateRows: `28px ${scaledHeight}px` }}><div className="gv-ruler-corner" /><div className="gv-ruler-top">{Array.from({ length: 6 }, (_, i) => Math.round(CANVAS_WIDTH / 100 * i / 5 * 10) / 10).map((mark) => <span key={mark} style={{ left: `${mark / (CANVAS_WIDTH / 100) * 100}%` }}>{mark}m</span>)}</div><div className="gv-ruler-left">{Array.from({ length: 6 }, (_, i) => Math.round(CANVAS_HEIGHT / 100 * i / 5 * 10) / 10).map((mark) => <span key={mark} style={{ top: `${mark / (CANVAS_HEIGHT / 100) * 100}%` }}>{mark}m</span>)}</div><div className="canvas-scale" style={{ width: scaledWidth, height: scaledHeight }}><div ref={canvasRef} tabIndex={-1} inert={designerLayer === "view"} data-hide-labels={hideLabels} className={`garden-canvas ${boxSelect ? "box-select" : ""} tool-${tool} ${snapEnabled ? "snap-on" : ""}`} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${zoom / 100})`, ["--minimum-line-hit" as string]: `${14 / (zoom / 100)}px`, ["--canvas-label-size" as string]: `${Math.min(44, 11 / (zoom / 100))}px` }} onPointerDownCapture={captureCanvasDown} onPointerDown={(event) => canvasDown(event)} onPointerMove={canvasMove} onPointerUp={canvasUp} onLostPointerCapture={cancelDraft} onPointerCancel={cancelDraft} onPointerLeave={() => { if (!draft) setCursorPoint(null); }}>
        {activeGardenId === DEFAULT_GARDEN_ID && !plan.canvas && plan.beds.some(bed => bed.id >= 1 && bed.id <= 12) && loadSource !== "starting" && <><div className="berry-strip"><strong>First-year fruiting canes · over winter</strong><div>{["Raspberry", "Raspberry", "Raspberry", "Blackberry"].map((crop, index) => <div className="reference-berry" key={index} style={{ ["--berry-symbol-width" as string]: `${referencePlantDimensions(crop)?.width ?? 24}px`, ["--berry-symbol-height" as string]: `${referencePlantDimensions(crop)?.height ?? 24}px` }}><PlantArt crop={crop} fallback="" /><small>{crop}</small></div>)}</div></div><div className="north-zone" /></>}
        {cursorPoint && snapEnabled && tool !== "select" && <><span className="snap-guide vertical" style={{ left: cursorPoint.x }} /><span className="snap-guide horizontal" style={{ top: cursorPoint.y }} /></>}
        {plan.objects.map((object, objectIndex) => {
          if (object.type === "path" || object.type === "trellis") return lineObject(object);
          const selected = isSelected("object", object.id);
          if (object.type === "shape") return <div key={object.id} role="button" tabIndex={skipLockedObject(object) ? -1 : 0} aria-label={`${object.shape} shape`} onKeyDown={(event) => { if (event.key === "Enter" && !skipLockedObject(object)) { setSelection({ kind: "object", id: object.id }); setTool("select"); setPanelOpen(true); } }} data-shape={object.shape} data-skip-locked={skipLockedObject(object)} className={`layout-object shape-object ${selected ? "selected" : ""} ${object.locked ? "locked" : ""}`} style={{ left: object.x - object.widthCm / 2, top: object.y - object.heightCm / 2, width: object.widthCm, height: Math.max(1, object.heightCm), transform: `rotate(${object.rotationDeg}deg)`, zIndex: object.behind ? objectIndex / 10000 : 30 + objectIndex }} onPointerDown={(event) => startObjectInteraction(event, object)}><DesignerShapeArt shape={object} />{selected && !groupSelection.length && !object.locked && <span className="shape-resize-handle" onPointerDown={(event) => startObjectInteraction(event, object, "shape-resize")} />}</div>;
          if (object.type === "tree") return <div key={object.id} data-skip-locked={skipLockedObject(object)} className={`layout-object tree-object ${selected ? "selected" : ""}`} style={{ left: object.x - object.diameterCm / 2, top: object.y - object.diameterCm / 2, width: object.diameterCm, height: object.diameterCm, ["--tree-symbol-width" as string]: `${referencePlantDimensions("Fruit Tree")?.width ?? 75}px`, ["--tree-symbol-height" as string]: `${referencePlantDimensions("Fruit Tree")?.height ?? 75}px` }} onPointerDown={(event) => startObjectInteraction(event, object)}><span><PlantArt crop="Fruit Tree" fallback="🌳" /></span><small>{object.label}</small>{selected && !groupSelection.length && !selectionLocked && <span className="tree-resize-handle" onPointerDown={(event) => startObjectInteraction(event, object, "tree-resize")} />}</div>;
          if (object.type === "structure") { const preset = structurePreset(object.kind); return <div key={object.id} data-kind={object.kind} data-skip-locked={skipLockedObject(object)} className={`layout-object structure-object ${selected ? "selected" : ""}`} style={{ left: object.x - object.widthCm / 2, top: object.y - object.depthCm / 2, width: object.widthCm, height: object.depthCm, transform: `rotate(${object.rotationDeg}deg)` }} onPointerDown={(event) => startObjectInteraction(event, object)}><span className="structure-symbol reference-structure-symbol" aria-hidden="true"><ReferenceObjectArt kind={object.kind} widthCm={object.widthCm} depthCm={object.depthCm} /></span><small>{object.label ?? preset.label}</small>{selected && !groupSelection.length && !selectionLocked && <span className="resize-handle structure-resize-handle" title="Resize structure" onPointerDown={(event) => startObjectInteraction(event, object, "structure-resize")} />}</div>; }
          return <div key={object.id} data-skip-locked={skipLockedObject(object)} className={`layout-object text-object ${selected ? "selected" : ""}`} style={{ left: object.x, top: object.y, fontSize: object.fontSize }} onPointerDown={(event) => startObjectInteraction(event, object)}>{object.text}</div>;
        })}
        {visiblePlan.rows.map(row => <PlannerPlantingRow key={row.id} row={row} selectedPlantId={selection?.kind === "row" && selection.id === row.id ? selection.plantId : undefined} skipLocked={skipLockedItem({ kind: "row", id: row.id })} selected={isSelected("row", row.id)} handles={isSelected("row", row.id) && !groupSelection.length && !selectionLocked} onDrag={startRowInteraction} />)}
        {plan.beds.length > 0 && <div className="garden-bed-coordinate-layer">{plan.beds.map((bed) => {
          const selected = isSelected("bed", bed.id);
          const areas = visiblePlan.plantingAreas.filter((area) => area.bedId === bed.id);
          const skipLockedBed = skipLockedItem({ kind: "bed", id: String(bed.id) });
          return <div key={bed.id} data-skip-locked={skipLockedBed} role="button" tabIndex={skipLockedBed ? -1 : 0} aria-label={`${bed.name}, ${areas.length > 20 ? `${areas.length} plant varieties` : areas.length ? areas.map((area) => `${area.variety}, ${area.count} plants`).join("; ") : "Empty"}`} onKeyDown={(event) => { if (!skipLockedBed && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelection({ kind: "bed", id: String(bed.id) }); setTool("select"); setPanelOpen(true); } }} data-bed-material={plan.bedMaterial ?? "timber"} className={`plan-bed gv-v4-bed ${selected ? "selected" : ""} ${dropBedId === bed.id ? "gv-v4-drop-target" : ""}`} style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }} onPointerDown={(event) => startBedInteraction(event, bed)} onDragOver={(event) => { if (dragPlant) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDropBedId(bed.id); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropBedId(null); }} onDrop={(event) => dropPlantIntoBed(event, bed)}>
            <strong className="gv-v4-bed-title">{bed.name}</strong>
            {areas.length === 0 && <span className="empty-bed-label">Empty</span>}
            {areas.map(renderPlantingArea)}
            {selected && !groupSelection.length && !selectionLocked && <span className="resize-handle" onPointerDown={(event) => startBedInteraction(event, bed, true)} />}
          </div>;
        })}</div>}
        {draft?.kind === "select" && <div className="planner-selection-box" style={{ left: Math.min(draft.start.x, draft.end.x), top: Math.min(draft.start.y, draft.end.y), width: Math.abs(draft.end.x - draft.start.x), height: Math.abs(draft.end.y - draft.start.y) }} />}
        {draft?.kind === "shape" && (() => { const shape = shapeFromDrag(draft.start, draft.end, shapeStyle); return shape && <div className="shape-object draft-shape" style={{ left: shape.x - shape.widthCm / 2, top: shape.y - shape.heightCm / 2, width: shape.widthCm, height: shape.heightCm, transform: `rotate(${shape.rotationDeg}deg)` }}><DesignerShapeArt shape={shape} /></div>; })()}
        {previewRow && <PlannerPlantingRow row={previewRow} preview />}
        {draftRect && <div className="draft-bed" style={{ left: draftRect.x, top: draftRect.y, width: draftRect.w, height: draftRect.h }}><span>{(draftRect.w / 100).toFixed(1)} × {(draftRect.h / 100).toFixed(1)} m</span></div>}
        {draftLine && draft && (() => { const visual = lineVisual(draftLine); return <div className={`draft-line ${draft.kind}`} style={{ left: draftLine.x1, top: draftLine.y1 - 10, width: visual.length, transform: `rotate(${visual.angle}deg)` }}><span>{(visual.length / 100).toFixed(1)} m</span></div>; })()}
      </div></div></div></div></section></section>
  {planItemsOpen && <PlanItemsDialog plan={plan} onToggleLock={item => toggleItemLocks([item])} onClose={() => setPlanItemsOpen(false)} onSelect={item => {
    chooseTool("select");
    setSelections([item]);
    setPlanItemsOpen(false);
  }} />}
  {sizeDialogOpen && <GardenSizeDialog plan={plan} onClose={() => setSizeDialogOpen(false)} onApply={canvas => { blankTemplateStarted.current = true; commit({ ...plan, canvas }); navigation.fit(); }} />}</main>;
}
