"use client";

import { useState } from "react";
import { GardenEditorToolbar } from "./garden-editor-toolbar";
import { GardenAddPicker } from "./garden-add-picker";
import { plants } from "@/lib/garden/plant-catalog";
import { STRUCTURE_PRESETS } from "@/lib/garden/structure-catalog";
import { bedRectangle, movePlanSelection } from "@/lib/garden/plan-editing";
import { placementClearances, rotateDesignSelection } from "@/lib/garden/garden-design";
import type { PlannerStructureKind } from "@/lib/garden/planner-plan";
import type { EditorTool, Garden3DEditor } from "./use-garden-3d-editor";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { cropPlacementPoints, addCropPoints } from "@/lib/garden/garden-building";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import { GardenBaseEditor } from "./garden-base-editor";
import { GardenBedPlanting } from "./garden-bed-planting";
import { GardenDesignPanel } from "./garden-design-panel";
import { GardenObjectPicker } from "./garden-object-picker";
import { GardenWorkflowStudio } from "./garden-workflow-studio";
import { GardenPlantTools } from "./garden-plant-tools";
import { reflowSurfacePlants, timelinePhase } from "@/lib/garden/garden-workflows";

const tools: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" }, { id: "move", label: "Move" },
  { id: "box-select", label: "Box select" },
  { id: "plant", label: "Add plant" }, { id: "row", label: "Add row" },
  { id: "fill", label: "Fill patch" }, { id: "brush", label: "Plant brush" }, { id: "bed", label: "Add bed" }, { id: "path", label: "Add path" },
  { id: "fence", label: "Add fence" }, { id: "trellis", label: "Add trellis" }, { id: "tree", label: "Add tree" },
  { id: "structure", label: "Add structure" },
];

function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min?: number; max?: number; onCommit: (value: number) => void }) {
  return <label>{label}<input aria-label={label} key={value} type="number" defaultValue={Math.round(value * 100) / 100} min={min} max={max} onBlur={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n !== value && (min === undefined || n >= min) && (max === undefined || n <= max)) onCommit(n); else e.target.value = String(value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>;
}

export function Garden3DEditorControls({ editor, disabled }: { editor: Garden3DEditor; disabled: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  const [baseOpen, setBaseOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<Array<{ name: string; kind?: PlannerStructureKind; width: number; depth: number; height: number }>>([]);
  const [keyOpen, setKeyOpen] = useState(false);
  const [editKey, setEditKey] = useState("");
  const [search, setSearch] = useState("");
  const [bedPlantingOpen, setBedPlantingOpen] = useState(false);
  const { settings, item, selection } = editor;
  const selectionLocked = editor.groupSelections.some(editor.locked);
  const size = gardenDimensions(editor.plan);
  const clearances = selection ? placementClearances(editor.plan, selection) : null;
  const surfaces = plantingSurfaces(editor.plan);
  const selectedSurface = surfaces.find((s) => s.id === selection?.id && s.kind === selection.kind);
  const crop = plants.find((p) => p.name === settings.crop) ?? plants[0];
  const viewOnly = !!editor.previewDraft || editor.timeline.enabled;
  const plantingHere = ["plant", "row", "fill", "brush"].includes(editor.tool) && !!settings.targetSurfaceId;
  const field = (label: string, name: string, value: number, min?: number, max?: number) => <NumberField key={name} label={label} value={value} min={min} max={max} onCommit={(n) => editor.update(name, n)} />;
  const setting = (label: string, name: "width" | "depth" | "height" | "pathWidth" | "postSpacing" | "diameter", min: number, max: number) => <NumberField label={label} value={settings[name]} min={min} max={max} onCommit={(n) => editor.setSettings({ ...settings, [name]: n })} />;
  const rotate = () => { if (selection && item && "name" in item) editor.action((p) => rotateDesignSelection(p, selection, 90)); else if (item && "rotationDeg" in item) editor.update("rotationDeg", (item.rotationDeg + 15) % 360); };
  const title = item ? "name" in item ? item.name : "crop" in item ? `${item.crop} · ${item.variety}` : "label" in item ? item.label || item.type : "text" in item ? item.text : "Selection" : "Select an object";
  return <>
    <GardenEditorToolbar editor={editor} disabled={disabled} viewOnly={viewOnly} onAdd={() => setAddOpen(true)} menu={[
      { label: "Design tools", disabled: viewOnly, run: () => { editor.setError(null); setDesignOpen(true); } },
      { label: "Garden studio", run: () => { editor.cancelDuplicate(); editor.cancelPreview(); setStudioOpen(true); } },
      { label: "Objects", disabled: viewOnly, run: () => { editor.setTool("select"); setPickerOpen(true); } },
      { label: "Plant a bed", disabled: viewOnly, run: () => setBedPlantingOpen(true) },
      { label: "Garden size", disabled: viewOnly, run: () => { editor.setError(null); setBaseOpen(true); } },
      { label: "Duplicate", disabled: viewOnly || !selection, run: editor.duplicate },
      { label: "Delete", disabled: viewOnly || !selection || selectionLocked, run: editor.remove },
      { label: editor.groupSelections.length && editor.groupSelections.every(editor.locked) ? "Unlock" : "Lock", disabled: viewOnly || !selection, run: editor.toggleLock },
      { label: "Rotate", disabled: viewOnly || selectionLocked || !item || !("rotationDeg" in item || "name" in item), run: rotate },
      { label: "Resize", disabled: viewOnly || selectionLocked || !item || !!selection?.plantId, run: () => { editor.setTool("resize"); editor.focus(); } },
    ]} />
    {!disabled && !viewOnly && plantingHere && <GardenPlantTools editor={editor} />}
    {!disabled && !viewOnly && !plantingHere && editor.tool !== "select" && editor.tool !== "move" && editor.tool !== "resize" && editor.tool !== "box-select" && <details className="garden-edit-palette" open>
      <summary>Build · {tools.find((t) => t.id === editor.tool)?.label}</summary>
      <div>
        {(["plant", "row", "fill", "brush"].includes(editor.tool)) && <>
          <label>Find crop<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <label>Crop<select value={settings.crop} onChange={(e) => { const plant = plants.find((p) => p.name === e.target.value)!; editor.setSettings({ ...settings, crop: plant.name, variety: plant.varieties[0], spacingCm: plant.spacingCm }); }}>
            {plants.filter((p) => p.name === settings.crop || p.name.toLowerCase().includes(search.toLowerCase())).map((p) => <option key={p.name}>{p.name}</option>)}
          </select></label>
          <label>Variety<select value={settings.variety} onChange={(e) => editor.setSettings({ ...settings, variety: e.target.value })}>{crop.varieties.map((v) => <option key={v}>{v}</option>)}</select></label>
          <NumberField label="Plant spacing (cm)" value={settings.spacingCm || crop.spacingCm} min={2} max={500} onCommit={(n) => editor.setSettings({ ...settings, spacingCm: n })} />
          <label>Planting target<select aria-label="Planting target" value={settings.targetSurfaceId ?? ""} onChange={(e) => editor.setSettings({ ...settings, targetSurfaceId: e.target.value || undefined })}><option value="">Any soil</option>{surfaces.map((s) => <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>{s.label}</option>)}</select></label>
          <p>Green: fits. Amber: closer than recommended. Red: blocked. Shift-click adds to a selection.</p>
        </>}
        {editor.tool === "structure" && <label>Structure<select value={settings.structureKind} onChange={(e) => editor.setSettings({ ...settings, ...(() => { const preset = STRUCTURE_PRESETS.find((p) => p.kind === e.target.value)!; return { structureKind: preset.kind, width: preset.widthCm, depth: preset.depthCm, height: preset.heightCm }; })() })}>{STRUCTURE_PRESETS.map((p) => <option key={p.kind} value={p.kind}>{p.label}</option>)}</select></label>}
        {(editor.tool === "bed" || editor.tool === "structure") && <>{setting("Width (cm)", "width", 30, size.width)}{setting("Depth (cm)", "depth", 30, size.height)}</>}
        {editor.tool === "structure" && <>{setting("Height (cm)", "height", 8, 600)}<NumberField label="Placement rotation (degrees)" value={settings.rotationDeg ?? 0} onCommit={(n) => editor.setSettings({ ...settings, rotationDeg: n })} /></>}
        {editor.tool === "path" && <>{setting("Width (cm)", "pathWidth", 20, 400)}<label>Path shape<select aria-label="Path shape" value={settings.pathRoute ?? "direct"} onChange={(e) => editor.setSettings({ ...settings, pathRoute: e.target.value as "direct" | "right-angle" })}><option value="direct">Straight</option><option value="right-angle">Right angle · avoids beds</option></select></label><label className="garden-edit-snap"><input type="checkbox" checked={!!settings.continuePath} onChange={(e) => editor.setSettings({ ...settings, continuePath: e.target.checked })} />Continue connected path</label><p>Endpoints join nearby paths when snap is on. Escape finishes a chain.</p></>}
        {editor.tool === "fence" && setting("Fence height (cm)", "height", 20, 300)}
        {editor.tool === "trellis" && <>{setting("Height (cm)", "height", 20, 500)}{setting("Post spacing (cm)", "postSpacing", 30, 1000)}</>}
        {editor.tool === "tree" && setting("Canopy diameter (cm)", "diameter", 20, 1000)}
        <label className="garden-edit-snap"><input type="checkbox" checked={settings.snap} onChange={(e) => editor.setSettings({ ...settings, snap: e.target.checked })} />10 cm snap</label>
        <p>{["row", "path", "trellis", "fence", "fill", "brush"].includes(editor.tool) ? "Drag a start to an end, or tap each endpoint. Escape cancels." : "Tap the garden to place. Escape cancels."}</p>
      </div>
    </details>}
    {!disabled && !viewOnly && !plantingHere && selection && item && !editor.pendingDuplicate && <details key={`${selection.kind}:${selection.id}:${selection.plantId ?? ""}`} className="garden-edit-inspector" open>
      <summary><h2>{title}</h2><span className="garden-sheet-hint">Tap to expand / collapse</span></summary>
      <div>
        <div className="garden-context-actions garden-primary-selection">
          {selectedSurface && <button type="button" disabled={editor.locked(selection)} onClick={editor.plantBed} aria-label="Plant here">Plant</button>}
          <button type="button" disabled={editor.locked(selection)} onClick={() => editor.setTool("move")} aria-label="Move selected">Move</button>
          <button type="button" onClick={editor.duplicate} aria-label="Duplicate selected">Copy</button>
          <button type="button" onClick={editor.toggleLock} aria-label={editor.locked(selection) ? "Unlock selected" : "Lock selected"}>{editor.locked(selection) ? "Unlock" : "Lock"}</button>
        </div>
        <button type="button" className="garden-deselect" onClick={() => editor.select(null)}>Deselect</button>
        <details className="garden-inspector-more"><summary>More</summary><div>
        <button type="button" disabled={editor.locked(selection)} onClick={editor.remove} aria-label="Delete selected">Remove selected object</button>
        {editor.locked(selection) && <p>Locked · unlock to edit this object or its contents.</p>}
        <fieldset className="garden-object-fields" disabled={editor.locked(selection)}>
        {"crop" in item && typeof item.spacingCm === "number" && field("Spacing (cm)", "spacingCm", item.spacingCm, 2, 500)}
        {!selection.plantId && selectedSurface && <>
          <div className="garden-context-actions"><button type="button" onClick={() => setBedPlantingOpen(true)}>Generate seasonal layout</button><button type="button" onClick={editor.focus}>Focus bed</button><button type="button" onClick={() => {
            const target = `${selectedSurface.kind}:${selectedSurface.id}`;
            editor.action((p) => addCropPoints(p, settings.crop, settings.variety, cropPlacementPoints(p, settings.crop, selectedSurface, null, "fill", target, settings.spacingCm), target, settings.spacingCm));
          }}>Fill with {settings.crop}</button></div>
          <p>{Math.round(selectedSurface.width)} × {Math.round(selectedSurface.depth)} cm usable soil</p>
        </>}
        {selectedSurface && <><label className="garden-edit-snap"><input type="checkbox" checked={editor.reflowOnResize} onChange={(e) => editor.setReflowOnResize(e.target.checked)} />Rearrange plants when resizing</label><button type="button" onClick={() => { try { editor.preview(reflowSurfacePlants(editor.plan, selection), `Rearrange ${selectedSurface.label} · keep every plant`); } catch (error) { editor.setError(error instanceof Error ? error.message : "Unable to rearrange these plants."); } }}>Preview plant arrangement</button></>}
        {clearances && <details className="garden-more-settings"><summary>Clear space and access</summary><div className="garden-clearances"><strong>Clear space · plan directions</strong>{Object.entries(clearances).map(([direction, value]) => <span key={direction}>{direction}: <b>{Math.round(value)} cm</b></span>)}</div></details>}
        {editor.plantPoint ? <>
          <p>Individual plant · {"spacingCm" in item ? item.spacingCm : 0} cm recommended spacing</p>
          {"bedId" in item && <p>{editor.plan.beds.find((b) => b.id === item.bedId)?.name}</p>}
          <NumberField label="X (cm)" value={editor.plantPoint.x} min={0} max={size.width} onCommit={(x) => editor.action((p) => movePlanSelection(p, selection, { x: x - editor.plantPoint!.x, y: 0 }))} />
          <NumberField label="Y (cm)" value={editor.plantPoint.y} min={0} max={size.height} onCommit={(y) => editor.action((p) => movePlanSelection(p, selection, { x: 0, y: y - editor.plantPoint!.y }))} />
        </> : <>
          {"name" in item && <>
            <label>Name<input key={item.name} defaultValue={item.name} onBlur={(e) => { if (e.target.value.trim()) editor.update("name", e.target.value.trim()); }} /></label>
            <NumberField label="X (cm)" value={bedRectangle(item, editor.plan).x} onCommit={(x) => editor.update("x", x * 100 / size.width)} />
            <NumberField label="Y (cm)" value={bedRectangle(item, editor.plan).y} onCommit={(y) => editor.update("y", y * 100 / size.height)} />
            <NumberField label="Width (cm)" value={bedRectangle(item, editor.plan).w} min={40} max={size.width} onCommit={(w) => editor.update("w", w * 100 / size.width)} />
            <NumberField label="Depth (cm)" value={bedRectangle(item, editor.plan).h} min={40} max={size.height} onCommit={(h) => editor.update("h", h * 100 / size.height)} />
            <p>Resizing retains all plants and scales their positions within the bed.</p>
          </>}
          {"label" in item && <label>Label / type<input key={item.label} defaultValue={item.label} onBlur={(e) => editor.update("label", e.target.value)} /></label>}
          {"type" in item && "x" in item && <>{field("X (cm)", "x", item.x, 0, size.width)}{field("Y (cm)", "y", item.y, 0, size.height)}</>}
          {"x1" in item && <>{field("Start X (cm)", "x1", item.x1, 0, size.width)}{field("Start Y (cm)", "y1", item.y1, 0, size.height)}{field("End X (cm)", "x2", item.x2, 0, size.width)}{field("End Y (cm)", "y2", item.y2, 0, size.height)}</>}
          {"widthCm" in item && field("Width (cm)", "widthCm", item.widthCm, 30, item.type === "path" ? 400 : size.width)}
          {"depthCm" in item && field("Depth (cm)", "depthCm", item.depthCm, 30, size.height)}
          {"heightCm" in item && field("Height (cm)", "heightCm", item.heightCm, item.type === "structure" && item.kind === "seed-tray" ? 8 : 20, item.type === "trellis" ? 500 : 600)}
          {"postSpacingCm" in item && field("Post spacing (cm)", "postSpacingCm", item.postSpacingCm, 30, 1000)}
          {"diameterCm" in item && field("Canopy diameter (cm)", "diameterCm", item.diameterCm, 20, 1000)}
          {"rotationDeg" in item && <>{field("Rotation (degrees)", "rotationDeg", item.rotationDeg)}<button type="button" onClick={rotate}>Rotate +15°</button></>}
          {"count" in item && <p>{item.count} plants · {item.spacingCm} cm spacing</p>}
        </>}
        {selectedSurface && <details className="garden-more-settings"><summary>Size-only bed template</summary><label>Template name<input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My raised bed" /></label><button type="button" disabled={!templateName.trim()} onClick={() => {
          const rect = "name" in item ? bedRectangle(item, editor.plan) : "widthCm" in item && "depthCm" in item ? { w: item.widthCm, h: item.depthCm } : null;
          if (!rect) return;
          const entry = { name: templateName.trim(), kind: "kind" in item ? item.kind : undefined, width: rect.w, depth: rect.h, height: "heightCm" in item ? item.heightCm : 34 };
          try { const saved = JSON.parse(localStorage.getItem("garden-bed-templates") ?? "[]"); const next = [...saved.filter((t: { name: string }) => t.name !== entry.name), entry].slice(-30); localStorage.setItem("garden-bed-templates", JSON.stringify(next)); setTemplates(next); setTemplateName(""); } catch { editor.setError("Could not store this template in your browser."); }
        }}>Save bed template</button></details>}

        </fieldset></div></details>
      </div>
    </details>}
    {!disabled && !viewOnly && <details className="garden-build-options"><summary>Build options</summary><div>
      <label>Crop appearance<select value={editor.growthStage} onChange={(e) => editor.setGrowthStage(e.target.value as "seedling" | "mature")}><option value="mature">Mature plants</option><option value="seedling">Small plants</option></select></label>
      <label>Bed templates<select aria-label="Bed templates" defaultValue="" onFocus={() => { try { setTemplates(JSON.parse(localStorage.getItem("garden-bed-templates") ?? "[]")); } catch { editor.setError("Could not read saved templates."); } }} onChange={(e) => { const t = templates[Number(e.target.value)]; if (!t) return; editor.setSettings({ ...settings, width: t.width, depth: t.depth, height: t.height, structureKind: t.kind ?? settings.structureKind }); editor.setTool(t.kind ? "structure" : "bed"); editor.select(null); }}><option value="">Choose a saved template</option>{templates.map((t, i) => <option key={i} value={i}>{t.name}</option>)}</select></label>
      <details><summary>Select several objects</summary>{[...editor.plan.beds.map((b) => ({ kind: "bed" as const, id: String(b.id), label: b.name })), ...editor.plan.objects.map((o) => ({ kind: "object" as const, id: o.id, label: "label" in o ? o.label || o.type : o.type }))].map((s) => <label className="garden-edit-snap" key={`${s.kind}:${s.id}`}><input type="checkbox" checked={editor.groupSelections.some((a) => a.kind === s.kind && a.id === s.id)} onChange={() => editor.select({ kind: s.kind, id: s.id }, true)} />{s.label}</label>)}</details>
      {!!editor.groupSelections.length && <><p>{editor.groupSelections.length} selected · move together</p><fieldset className="garden-object-fields" disabled={selectionLocked}><div className="garden-context-actions"><button type="button" onClick={() => editor.moveGroup({ x: -10, y: 0 })}>← 10 cm</button><button type="button" onClick={() => editor.moveGroup({ x: 10, y: 0 })}>10 cm →</button><button type="button" onClick={() => editor.moveGroup({ x: 0, y: -10 })}>↑ 10 cm</button><button type="button" onClick={() => editor.moveGroup({ x: 0, y: 10 })}>10 cm ↓</button></div></fieldset><button type="button" onClick={editor.duplicate}>Duplicate group</button><button type="button" onClick={() => editor.select(null)}>Clear selection</button></>}
    </div></details>}
    <div className="garden-edit-status" role="status">
      <span>{editor.error || editor.previewText || editor.status}</span>
      <button type="button" onClick={() => setKeyOpen(!keyOpen)}>Edit key</button>
      {keyOpen && <form onSubmit={(e) => { e.preventDefault(); editor.setEditKey(editKey); setEditKey(""); setKeyOpen(false); }}><label>Garden edit key<input type="password" autoComplete="off" value={editKey} onChange={(e) => setEditKey(e.target.value)} /></label><button type="submit">Set key</button></form>}
    </div>
    {!disabled && addOpen && <GardenAddPicker editor={editor} onClose={() => setAddOpen(false)} />}
    {editor.notice && <div className="garden-action-notice" role="region" aria-label="Garden action" aria-live="polite"><span>{editor.notice.message}</span><button type="button" disabled={!editor.canUndo || viewOnly} onClick={editor.undo} aria-label="Undo last action">Undo</button><button type="button" onClick={() => editor.setNotice(null)} aria-label="Dismiss action message">×</button></div>}
    {!disabled && baseOpen && <GardenBaseEditor editor={editor} onClose={() => setBaseOpen(false)} />}
    {!disabled && designOpen && <GardenDesignPanel editor={editor} onClose={() => setDesignOpen(false)} />}
    {!disabled && pickerOpen && <GardenObjectPicker editor={editor} onClose={() => setPickerOpen(false)} />}
    {!disabled && studioOpen && <GardenWorkflowStudio key={editor.gardenId} editor={editor} onClose={() => setStudioOpen(false)} />}
    {!disabled && viewOnly && <div className="garden-preview-actions" role="region" aria-label="Garden preview"><strong>{editor.previewDraft?.label ?? `Timeline · ${timelinePhase(editor.timeline)} · ${editor.timeline.date}`}</strong><span>Preview only · saved garden unchanged</span>{editor.previewDraft && <button type="button" onClick={editor.applyPreview}>Apply preview</button>}<button type="button" onClick={editor.cancelPreview}>{editor.previewDraft ? "Cancel preview" : "Back to editing"}</button></div>}
    {!disabled && editor.pendingDuplicate && <div className="garden-selection-tools"><span>Place {editor.pendingDuplicate.sources.length === 1 ? "copy" : "copies"} · click a clear space</span><button type="button" onClick={editor.cancelDuplicate}>Cancel copy</button></div>}
    {!disabled && !viewOnly && ["select", "move", "box-select"].includes(editor.tool) && !editor.pendingDuplicate && <div className="garden-pick-options"><label>Select<select aria-label="Selection target" value={editor.selectionMode} onChange={(e) => editor.setSelectionMode(e.target.value as typeof editor.selectionMode)}><option value="all">Anything</option><option value="beds">Beds and containers</option><option value="objects">Structures and paths</option><option value="plants">Plants</option></select></label><label><input type="checkbox" checked={editor.multiSelect} onChange={(e) => editor.setMultiSelect(e.target.checked)} />Multi-select</label><details className="garden-camera-options"><summary>Camera</summary><div><label><input type="checkbox" checked={editor.cameraLocked} onChange={(e) => editor.setCameraLocked(e.target.checked)} />Lock camera</label><button type="button" disabled={!selection} onClick={editor.focus}>Focus selection</button><button type="button" onClick={editor.fit}>Whole garden</button></div></details></div>}
    {!disabled && !viewOnly && !editor.pendingDuplicate && (editor.groupSelections.length > 1 || editor.tool === "box-select" || editor.comparisonPlan) && <div className="garden-selection-tools">
      <span>{editor.tool === "box-select" ? "Drag a box around beds or crops" : `${editor.groupSelections.length} selected`}{editor.comparisonPlan ? " · Blue: saved alternative" : ""}</span>
      {!!editor.groupSelections.length && <><button type="button" onClick={editor.duplicate}>Duplicate selection</button><button type="button" onClick={editor.toggleLock}>{editor.groupSelections.every(editor.locked) ? "Unlock selection" : "Lock selection"}</button><button type="button" disabled={selectionLocked} onClick={editor.remove}>Delete selection</button></>}
      <button type="button" onClick={() => { editor.select(null); editor.setTool("select"); editor.setComparisonPlan(null); }}>Clear</button>
    </div>}
    {!disabled && bedPlantingOpen && <GardenBedPlanting key={editor.gardenId} editor={editor} onClose={() => setBedPlantingOpen(false)} />}
  </>;
}
