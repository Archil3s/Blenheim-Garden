"use client";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenBedAccess({ editor }: { editor: Garden3DEditor }) {
  const surfaces = plantingSurfaces(editor.plan);
  const key = editor.selection ? `${editor.selection.kind}:${editor.selection.id}` : "";
  const index = surfaces.findIndex(s => `${s.kind}:${s.id}` === key);
  const go = (value: string) => {
    const surface = surfaces.find(s => `${s.kind}:${s.id}` === value);
    if (!surface) return;
    editor.setTool("select"); editor.select({ kind: surface.kind, id: surface.id }); editor.focus();
  };
  const step = (direction: number) => {
    const next = surfaces[index < 0 ? direction < 0 ? surfaces.length - 1 : 0 : (index + direction + surfaces.length) % surfaces.length];
    if (next) go(`${next.kind}:${next.id}`);
  };
  return <details className="garden-bed-access"><summary>Beds</summary><div role="group" aria-label="Bed shortcuts">
    <label>Go to bed<select aria-label="Go to bed" value={index < 0 ? "" : key} onChange={e => go(e.target.value)}><option value="">Choose a bed…</option>{surfaces.map(s => <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>{s.label}{editor.locked({ kind: s.kind, id: s.id }) ? " · locked" : ""}</option>)}</select></label>
    <div><button type="button" disabled={!surfaces.length} onClick={() => step(-1)}>Previous bed</button><button type="button" disabled={!surfaces.length} onClick={() => step(1)}>Next bed</button></div>
    <button type="button" disabled={index < 0} onClick={editor.focus}>Focus bed</button>
    <button type="button" disabled={index < 0 || editor.locked(editor.selection!)} onClick={editor.plantBed}>Plant this bed</button>
    <button type="button" aria-pressed={editor.selectionMode === "beds"} onClick={() => { editor.setTool("select"); editor.setSelectionMode(editor.selectionMode === "beds" ? "all" : "beds"); }}>Pick beds through crops</button>
  </div></details>;
}
