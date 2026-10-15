"use client";

import { useState } from "react";
import { plants } from "@/lib/garden/plant-catalog";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import { addCropPoints, cropPlacementPoints } from "@/lib/garden/garden-building";
import type { EditorTool, Garden3DEditor } from "./use-garden-3d-editor";

export function GardenPlantTools({ editor }: { editor: Garden3DEditor }) {
  const [collapsed, setCollapsed] = useState(false);
  const surface = plantingSurfaces(editor.plan).find((s) => `${s.kind}:${s.id}` === editor.settings.targetSurfaceId);
  if (!surface) return null;
  const crop = plants.find((p) => p.name === editor.settings.crop) ?? plants[0];
  let count = 0;
  try { count = cropPlacementPoints(editor.plan, crop.name, surface, null, "fill", editor.settings.targetSurfaceId, editor.settings.spacingCm).length; } catch { /* The selected surface may have become full. */ }
  const fill = () => {
    try { const points = cropPlacementPoints(editor.plan, crop.name, surface, null, "fill", editor.settings.targetSurfaceId, editor.settings.spacingCm); editor.preview(addCropPoints(editor.plan, crop.name, editor.settings.variety, points, editor.settings.targetSurfaceId, editor.settings.spacingCm), `${points.length} ${crop.name} in ${surface.label}`); }
    catch (error) { editor.setError(error instanceof Error ? error.message : "Unable to preview these plants."); }
  };
  return <section className="garden-plant-tools" aria-label="Plant selected bed">
    <header><strong>{surface.label}</strong><button type="button" aria-label={collapsed ? "Show planting controls" : "Hide planting controls"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "Show controls" : "Hide controls"}</button><button type="button" onClick={() => editor.setTool("select")}>Done planting</button></header>
    {!collapsed && <>
    <label>Planting bed<select aria-label="Planting bed" value={editor.settings.targetSurfaceId} onChange={e => { const next = plantingSurfaces(editor.plan).find(s => `${s.kind}:${s.id}` === e.target.value)!; editor.setSettings({ ...editor.settings, targetSurfaceId: e.target.value }); editor.select({ kind: next.kind, id: next.id }); editor.focus(); }}>{plantingSurfaces(editor.plan).map(s => <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>{s.label}</option>)}</select></label>
    <label>Bed crop<select aria-label="Bed crop" value={crop.name} onChange={(e) => { const next = plants.find((p) => p.name === e.target.value)!; editor.setSettings({ ...editor.settings, crop: next.name, variety: next.varieties[0], spacingCm: next.spacingCm }); }}>{plants.map((p) => <option key={p.name}>{p.name}</option>)}</select></label>
    <label>Bed variety<select aria-label="Bed variety" value={editor.settings.variety} onChange={(e) => editor.setSettings({ ...editor.settings, variety: e.target.value })}>{crop.varieties.map((v) => <option key={v}>{v}</option>)}</select></label>
    <div className="garden-plant-modes">{([["plant", "Single"], ["brush", "Paint"], ["row", "Row"], ["fill", "Patch"]] as [EditorTool, string][]).map(([tool, label]) => <button type="button" key={tool} aria-pressed={editor.tool === tool} onClick={() => editor.setTool(tool)}>{label}</button>)}</div>
    <label>Bed spacing (cm)<input type="number" min={2} max={500} value={editor.settings.spacingCm || crop.spacingCm} onChange={(e) => { const n = Number(e.target.value); if (n >= 2 && n <= 500) editor.setSettings({ ...editor.settings, spacingCm: n }); }} /></label>
    <button type="button" disabled={!count || editor.locked({ kind: surface.kind, id: surface.id })} onClick={fill}>Preview fill bed · {count} plants</button>
    <small>Only this bed receives plants. Existing crops are kept. Spacing avoids nearby plants; adjust it for a denser layout.</small></>}
  </section>;
}
