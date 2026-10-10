"use client";

import { useState } from "react";
import Link from "next/link";
import { plants } from "@/lib/garden/plant-catalog";
import { STRUCTURE_PRESETS } from "@/lib/garden/structure-catalog";
import { bedRectangle, movePlanSelection } from "@/lib/garden/plan-editing";
import type { PlannerStructureKind } from "@/lib/garden/planner-plan";
import type { EditorTool, Garden3DEditor } from "./use-garden-3d-editor";

const tools: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" }, { id: "move", label: "Move" },
  { id: "plant", label: "Add plant" }, { id: "row", label: "Add row" },
  { id: "bed", label: "Add bed" }, { id: "path", label: "Add path" },
  { id: "trellis", label: "Add trellis" }, { id: "tree", label: "Add tree" },
  { id: "structure", label: "Add structure" },
];

function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min?: number; max?: number; onCommit: (value: number) => void }) {
  return <label>{label}<input aria-label={label} key={value} type="number" defaultValue={Math.round(value * 100) / 100} min={min} max={max} onBlur={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n !== value && (min === undefined || n >= min) && (max === undefined || n <= max)) onCommit(n); else e.target.value = String(value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>;
}

export function Garden3DEditorControls({ editor, disabled }: { editor: Garden3DEditor; disabled: boolean }) {
  const [keyOpen, setKeyOpen] = useState(false);
  const [editKey, setEditKey] = useState("");
  const [search, setSearch] = useState("");
  const { settings, item, selection } = editor;
  const crop = plants.find((p) => p.name === settings.crop) ?? plants[0];
  const field = (label: string, name: string, value: number, min?: number, max?: number) => <NumberField key={name} label={label} value={value} min={min} max={max} onCommit={(n) => editor.update(name, n)} />;
  const setting = (label: string, name: "width" | "depth" | "height" | "pathWidth" | "postSpacing" | "diameter", min: number, max: number) => <NumberField label={label} value={settings[name]} min={min} max={max} onCommit={(n) => editor.setSettings({ ...settings, [name]: n })} />;
  const rotate = () => { if (item && "rotationDeg" in item) editor.update("rotationDeg", (item.rotationDeg + 15) % 360); };
  const title = item ? "name" in item ? item.name : "crop" in item ? `${item.crop} · ${item.variety}` : "label" in item ? item.label || item.type : "text" in item ? item.text : "Selection" : "Select an object";
  return <>
    <div className="garden-edit-toolbar" role="toolbar" aria-label="3D garden editing">
      <Link href="/3d-models/tomato">Tomato model</Link>
      <Link href="/3d-models">Vegetable models</Link>
      {tools.map((tool) => <button key={tool.id} type="button" disabled={disabled} aria-pressed={editor.tool === tool.id} onClick={() => { editor.setTool(tool.id); if (tool.id !== "move" && tool.id !== "select") editor.setSelection(null); }}>{tool.label}</button>)}
      <button type="button" disabled={disabled || !selection} onClick={editor.duplicate}>Duplicate</button>
      <button type="button" disabled={disabled || !selection} onClick={editor.remove}>Delete</button>
      <button type="button" disabled={disabled || !item || !("rotationDeg" in item)} onClick={rotate}>Rotate</button>
      <button type="button" disabled={disabled || !item || !!selection?.plantId} onClick={(e) => {
        const panel = e.currentTarget.closest(".gv-3d-workspace")?.querySelector<HTMLDetailsElement>(".garden-edit-inspector");
        if (panel) { panel.open = true; panel.querySelector<HTMLInputElement>('input[aria-label="Width (cm)"], input[aria-label="Canopy diameter (cm)"], input[aria-label="End X (cm)"]')?.focus(); }
      }}>Resize</button>
      <button type="button" disabled={disabled || !editor.canUndo} onClick={editor.undo}>Undo</button>
      <button type="button" disabled={disabled || !editor.canRedo} onClick={editor.redo}>Redo</button>
      <button type="button" disabled={disabled || editor.status === "Saving…"} onClick={() => void editor.save()}>Save</button>
      <Link href="/" aria-label="← 2D Plan" data-planner-view="2d">2D</Link>
    </div>
    {!disabled && editor.tool !== "select" && editor.tool !== "move" && <details className="garden-edit-palette" open>
      <summary>Build · {tools.find((t) => t.id === editor.tool)?.label}</summary>
      <div>
        {(editor.tool === "plant" || editor.tool === "row") && <>
          <label>Find crop<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <label>Crop<select value={settings.crop} onChange={(e) => { const plant = plants.find((p) => p.name === e.target.value)!; editor.setSettings({ ...settings, crop: plant.name, variety: plant.varieties[0] }); }}>
            {plants.filter((p) => p.name === settings.crop || p.name.toLowerCase().includes(search.toLowerCase())).map((p) => <option key={p.name}>{p.name}</option>)}
          </select></label>
          <label>Variety<select value={settings.variety} onChange={(e) => editor.setSettings({ ...settings, variety: e.target.value })}>{crop.varieties.map((v) => <option key={v}>{v}</option>)}</select></label>
          <p>Recommended spacing: {crop.spacingCm} cm. Close planting is allowed.</p>
        </>}
        {editor.tool === "structure" && <label>Structure<select value={settings.structureKind} onChange={(e) => editor.setSettings({ ...settings, structureKind: e.target.value as PlannerStructureKind })}>{STRUCTURE_PRESETS.map((p) => <option key={p.kind} value={p.kind}>{p.label}</option>)}</select></label>}
        {editor.tool === "bed" && <>{setting("Width (cm)", "width", 40, 900)}{setting("Depth (cm)", "depth", 40, 1080)}</>}
        {editor.tool === "path" && setting("Width (cm)", "pathWidth", 20, 400)}
        {editor.tool === "trellis" && <>{setting("Height (cm)", "height", 20, 500)}{setting("Post spacing (cm)", "postSpacing", 30, 1000)}</>}
        {editor.tool === "tree" && setting("Canopy diameter (cm)", "diameter", 20, 1000)}
        <label className="garden-edit-snap"><input type="checkbox" checked={settings.snap} onChange={(e) => editor.setSettings({ ...settings, snap: e.target.checked })} />10 cm snap</label>
        <p>{["row", "path", "trellis"].includes(editor.tool) ? "Tap a start, then an end. Escape cancels." : "Tap the garden to place. Escape cancels."}</p>
      </div>
    </details>}
    {!disabled && selection && item && <details key={`${selection.kind}:${selection.id}:${selection.plantId ?? ""}`} className="garden-edit-inspector" open>
      <summary><h2>{title}</h2></summary>
      <div>
        {"crop" in item && typeof item.spacingCm === "number" && field("Spacing (cm)", "spacingCm", item.spacingCm, 2, 500)}
        {editor.plantPoint ? <>
          <p>Individual plant · {"spacingCm" in item ? item.spacingCm : 0} cm recommended spacing</p>
          {"bedId" in item && <p>{editor.plan.beds.find((b) => b.id === item.bedId)?.name}</p>}
          <NumberField label="X (cm)" value={editor.plantPoint.x} min={0} max={900} onCommit={(x) => editor.action((p) => movePlanSelection(p, selection, { x: x - editor.plantPoint!.x, y: 0 }))} />
          <NumberField label="Y (cm)" value={editor.plantPoint.y} min={0} max={1080} onCommit={(y) => editor.action((p) => movePlanSelection(p, selection, { x: 0, y: y - editor.plantPoint!.y }))} />
        </> : <>
          {"name" in item && <>
            <label>Name<input key={item.name} defaultValue={item.name} onBlur={(e) => { if (e.target.value.trim()) editor.update("name", e.target.value.trim()); }} /></label>
            <NumberField label="X (cm)" value={bedRectangle(item).x} onCommit={(x) => editor.update("x", x / 9)} />
            <NumberField label="Y (cm)" value={bedRectangle(item).y} onCommit={(y) => editor.update("y", y / 10.8)} />
            <NumberField label="Width (cm)" value={bedRectangle(item).w} min={40} max={900} onCommit={(w) => editor.update("w", w / 9)} />
            <NumberField label="Depth (cm)" value={bedRectangle(item).h} min={40} max={1080} onCommit={(h) => editor.update("h", h / 10.8)} />
            <p>Resizing retains all plants and scales their positions within the bed.</p>
          </>}
          {"label" in item && <label>Label / type<input key={item.label} defaultValue={item.label} onBlur={(e) => editor.update("label", e.target.value)} /></label>}
          {"type" in item && "x" in item && <>{field("X (cm)", "x", item.x, 0, 900)}{field("Y (cm)", "y", item.y, 0, 1080)}</>}
          {"x1" in item && <>{field("Start X (cm)", "x1", item.x1, 0, 900)}{field("Start Y (cm)", "y1", item.y1, 0, 1080)}{field("End X (cm)", "x2", item.x2, 0, 900)}{field("End Y (cm)", "y2", item.y2, 0, 1080)}</>}
          {"widthCm" in item && field("Width (cm)", "widthCm", item.widthCm, 30, item.type === "path" ? 400 : 900)}
          {"depthCm" in item && field("Depth (cm)", "depthCm", item.depthCm, 30, 1080)}
          {"heightCm" in item && field("Height (cm)", "heightCm", item.heightCm, 20, item.type === "trellis" ? 500 : 600)}
          {"postSpacingCm" in item && field("Post spacing (cm)", "postSpacingCm", item.postSpacingCm, 30, 1000)}
          {"diameterCm" in item && field("Canopy diameter (cm)", "diameterCm", item.diameterCm, 20, 1000)}
          {"rotationDeg" in item && <>{field("Rotation (degrees)", "rotationDeg", item.rotationDeg)}<button type="button" onClick={rotate}>Rotate +15°</button></>}
          {"count" in item && <p>{item.count} plants · {item.spacingCm} cm spacing</p>}
        </>}
        <button type="button" aria-pressed={editor.tool === "move"} onClick={() => editor.setTool("move")}>Move selected</button>
        <button type="button" onClick={editor.duplicate}>Duplicate selected</button>
        <button type="button" onClick={editor.remove}>Delete selected</button>
      </div>
    </details>}
    <div className="garden-edit-status" role="status">
      <span>{editor.error || editor.status}</span>
      <button type="button" onClick={() => setKeyOpen(!keyOpen)}>Edit key</button>
      {keyOpen && <form onSubmit={(e) => { e.preventDefault(); editor.setEditKey(editKey); setEditKey(""); setKeyOpen(false); }}><label>Garden edit key<input type="password" autoComplete="off" value={editKey} onChange={(e) => setEditKey(e.target.value)} /></label><button type="submit">Set key</button></form>}
    </div>
  </>;
}
