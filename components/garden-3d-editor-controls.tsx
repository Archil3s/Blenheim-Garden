"use client";

import { useState } from "react";
import Link from "next/link";
import { plants } from "@/lib/garden/plant-catalog";
import { STRUCTURE_PRESETS } from "@/lib/garden/structure-catalog";
import { bedRectangle, movePlanSelection, duplicatePlanSelection } from "@/lib/garden/plan-editing";
import type { PlannerStructureKind } from "@/lib/garden/planner-plan";
import type { EditorTool, Garden3DEditor } from "./use-garden-3d-editor";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { cropPlacementPoints, addCropPoints } from "@/lib/garden/garden-building";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import { GardenBaseEditor } from "./garden-base-editor";
import { GardenBedPlanting } from "./garden-bed-planting";

const tools: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" }, { id: "move", label: "Move" },
  { id: "plant", label: "Add plant" }, { id: "row", label: "Add row" },
  { id: "fill", label: "Fill patch" }, { id: "brush", label: "Plant brush" }, { id: "bed", label: "Add bed" }, { id: "path", label: "Add path" },
  { id: "fence", label: "Add fence" }, { id: "trellis", label: "Add trellis" }, { id: "tree", label: "Add tree" },
  { id: "structure", label: "Add structure" },
];

function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min?: number; max?: number; onCommit: (value: number) => void }) {
  return <label>{label}<input aria-label={label} key={value} type="number" defaultValue={Math.round(value * 100) / 100} min={min} max={max} onBlur={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n !== value && (min === undefined || n >= min) && (max === undefined || n <= max)) onCommit(n); else e.target.value = String(value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>;
}

export function Garden3DEditorControls({ editor, disabled }: { editor: Garden3DEditor; disabled: boolean }) {
  const [baseOpen, setBaseOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<Array<{ name: string; kind?: PlannerStructureKind; width: number; depth: number; height: number }>>([]);
  const [keyOpen, setKeyOpen] = useState(false);
  const [editKey, setEditKey] = useState("");
  const [search, setSearch] = useState("");
  const [bedPlantingOpen, setBedPlantingOpen] = useState(false);
  const { settings, item, selection } = editor;
  const size = gardenDimensions(editor.plan);
  const surfaces = plantingSurfaces(editor.plan);
  const selectedSurface = surfaces.find((s) => s.id === selection?.id && s.kind === selection.kind);
  const crop = plants.find((p) => p.name === settings.crop) ?? plants[0];
  const field = (label: string, name: string, value: number, min?: number, max?: number) => <NumberField key={name} label={label} value={value} min={min} max={max} onCommit={(n) => editor.update(name, n)} />;
  const setting = (label: string, name: "width" | "depth" | "height" | "pathWidth" | "postSpacing" | "diameter", min: number, max: number) => <NumberField label={label} value={settings[name]} min={min} max={max} onCommit={(n) => editor.setSettings({ ...settings, [name]: n })} />;
  const rotate = () => { if (item && "rotationDeg" in item) editor.update("rotationDeg", (item.rotationDeg + 15) % 360); };
  const title = item ? "name" in item ? item.name : "crop" in item ? `${item.crop} · ${item.variety}` : "label" in item ? item.label || item.type : "text" in item ? item.text : "Selection" : "Select an object";
  return <>
    <div className="garden-edit-toolbar" role="toolbar" aria-label="3D garden editing">
      <button type="button" disabled={disabled} onClick={() => setBedPlantingOpen(true)}>Plant a bed</button>
      <button type="button" disabled={disabled} onClick={() => { editor.setError(null); setBaseOpen(true); }}>Garden size</button>
      <Link href="/3d-models">Vegetable models</Link>
      {tools.map((tool) => <button key={tool.id} type="button" disabled={disabled} aria-pressed={editor.tool === tool.id} onClick={() => { editor.setTool(tool.id); if (!["move", "select", "plant", "row", "fill", "brush"].includes(tool.id)) editor.setSelection(null); }}>{tool.label}</button>)}
      <button type="button" disabled={disabled || !selection} onClick={editor.duplicate}>Duplicate</button>
      <button type="button" disabled={disabled || !selection} onClick={editor.remove}>Delete</button>
      <button type="button" disabled={disabled || !item || !("rotationDeg" in item)} onClick={rotate}>Rotate</button>
      <button type="button" disabled={disabled || !item || !!selection?.plantId} onClick={() => { editor.setTool("resize"); editor.focus(); }}>Resize</button>
      <button type="button" disabled={disabled || !editor.canUndo} onClick={editor.undo}>Undo</button>
      <button type="button" disabled={disabled || !editor.canRedo} onClick={editor.redo}>Redo</button>
      <button type="button" disabled={disabled || editor.status === "Saving…"} onClick={() => void editor.save()}>Save</button>
      <Link href="/" aria-label="← 2D Plan" data-planner-view="2d">2D</Link>
    </div>
    {!disabled && editor.tool !== "select" && editor.tool !== "move" && editor.tool !== "resize" && <details className="garden-edit-palette" open>
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
        {editor.tool === "path" && setting("Width (cm)", "pathWidth", 20, 400)}
        {editor.tool === "fence" && setting("Fence height (cm)", "height", 20, 300)}
        {editor.tool === "trellis" && <>{setting("Height (cm)", "height", 20, 500)}{setting("Post spacing (cm)", "postSpacing", 30, 1000)}</>}
        {editor.tool === "tree" && setting("Canopy diameter (cm)", "diameter", 20, 1000)}
        <label className="garden-edit-snap"><input type="checkbox" checked={settings.snap} onChange={(e) => editor.setSettings({ ...settings, snap: e.target.checked })} />10 cm snap</label>
        <p>{["row", "path", "trellis", "fence", "fill", "brush"].includes(editor.tool) ? "Drag a start to an end, or tap each endpoint. Escape cancels." : "Tap the garden to place. Escape cancels."}</p>
      </div>
    </details>}
    {!disabled && selection && item && <details key={`${selection.kind}:${selection.id}:${selection.plantId ?? ""}`} className="garden-edit-inspector" open>
      <summary><h2>{title}</h2></summary>
      <div>
        {"crop" in item && typeof item.spacingCm === "number" && field("Spacing (cm)", "spacingCm", item.spacingCm, 2, 500)}
        {!selection.plantId && selectedSurface && <>
          <div className="garden-context-actions"><button type="button" onClick={editor.plantBed}>Plant here</button><button type="button" onClick={() => setBedPlantingOpen(true)}>Generate seasonal layout</button><button type="button" onClick={editor.focus}>Focus bed</button><button type="button" onClick={() => {
            const target = `${selectedSurface.kind}:${selectedSurface.id}`;
            editor.action((p) => addCropPoints(p, settings.crop, settings.variety, cropPlacementPoints(p, settings.crop, selectedSurface, null, "fill", target, settings.spacingCm), target, settings.spacingCm));
          }}>Fill with {settings.crop}</button></div>
          <p>{Math.round(selectedSurface.width)} × {Math.round(selectedSurface.depth)} cm usable soil</p>
        </>}
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
        {selectedSurface && <><label>Template name<input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My raised bed" /></label><button type="button" disabled={!templateName.trim()} onClick={() => {
          const rect = "name" in item ? bedRectangle(item, editor.plan) : "widthCm" in item && "depthCm" in item ? { w: item.widthCm, h: item.depthCm } : null;
          if (!rect) return;
          const entry = { name: templateName.trim(), kind: "kind" in item ? item.kind : undefined, width: rect.w, depth: rect.h, height: "heightCm" in item ? item.heightCm : 34 };
          try { const saved = JSON.parse(localStorage.getItem("garden-bed-templates") ?? "[]"); const next = [...saved.filter((t: { name: string }) => t.name !== entry.name), entry].slice(-30); localStorage.setItem("garden-bed-templates", JSON.stringify(next)); setTemplates(next); setTemplateName(""); } catch { editor.setError("Could not store this template in your browser."); }
        }}>Save bed template</button></>}
        <button type="button" aria-pressed={editor.tool === "move"} onClick={() => editor.setTool("move")}>Move selected</button>
        <button type="button" onClick={editor.duplicate}>Duplicate selected</button>
        <button type="button" onClick={editor.remove}>Delete selected</button>
      </div>
    </details>}
    {!disabled && <details className="garden-build-options"><summary>Build options</summary><div>
      <label>Crop appearance<select value={editor.growthStage} onChange={(e) => editor.setGrowthStage(e.target.value as "seedling" | "mature")}><option value="mature">Mature plants</option><option value="seedling">Small plants</option></select></label>
      <label>Bed templates<select aria-label="Bed templates" defaultValue="" onFocus={() => { try { setTemplates(JSON.parse(localStorage.getItem("garden-bed-templates") ?? "[]")); } catch { editor.setError("Could not read saved templates."); } }} onChange={(e) => { const t = templates[Number(e.target.value)]; if (!t) return; editor.setSettings({ ...settings, width: t.width, depth: t.depth, height: t.height, structureKind: t.kind ?? settings.structureKind }); editor.setTool(t.kind ? "structure" : "bed"); editor.select(null); }}><option value="">Choose a saved template</option>{templates.map((t, i) => <option key={i} value={i}>{t.name}</option>)}</select></label>
      <details><summary>Select several objects</summary>{[...editor.plan.beds.map((b) => ({ kind: "bed" as const, id: String(b.id), label: b.name })), ...editor.plan.objects.map((o) => ({ kind: "object" as const, id: o.id, label: "label" in o ? o.label || o.type : o.type }))].map((s) => <label className="garden-edit-snap" key={`${s.kind}:${s.id}`}><input type="checkbox" checked={editor.groupSelections.some((a) => a.kind === s.kind && a.id === s.id)} onChange={() => editor.select({ kind: s.kind, id: s.id }, true)} />{s.label}</label>)}</details>
      {!!editor.groupSelections.length && <><p>{editor.groupSelections.length} selected · move together</p><div className="garden-context-actions"><button type="button" onClick={() => editor.moveGroup({ x: -10, y: 0 })}>← 10 cm</button><button type="button" onClick={() => editor.moveGroup({ x: 10, y: 0 })}>10 cm →</button><button type="button" onClick={() => editor.moveGroup({ x: 0, y: -10 })}>↑ 10 cm</button><button type="button" onClick={() => editor.moveGroup({ x: 0, y: 10 })}>10 cm ↓</button></div><button type="button" onClick={() => editor.action((p) => editor.groupSelections.reduce((next, selected) => duplicatePlanSelection(next, selected), p))}>Duplicate group</button><button type="button" onClick={() => editor.select(null)}>Clear selection</button></>}
    </div></details>}
    <div className="garden-edit-status" role="status">
      <span>{editor.error || editor.previewText || editor.status}</span>
      <button type="button" onClick={() => setKeyOpen(!keyOpen)}>Edit key</button>
      {keyOpen && <form onSubmit={(e) => { e.preventDefault(); editor.setEditKey(editKey); setEditKey(""); setKeyOpen(false); }}><label>Garden edit key<input type="password" autoComplete="off" value={editKey} onChange={(e) => setEditKey(e.target.value)} /></label><button type="submit">Set key</button></form>}
    </div>
    {!disabled && baseOpen && <GardenBaseEditor editor={editor} onClose={() => setBaseOpen(false)} />}
    {!disabled && bedPlantingOpen && <GardenBedPlanting key={editor.gardenId} editor={editor} onClose={() => setBedPlantingOpen(false)} />}
  </>;
}
