"use client";

import { useEffect, useRef, useState } from "react";
import { selectionKey } from "@/lib/garden/object-locks";
import type { PlanSelection } from "@/lib/garden/plan-editing";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function GardenObjectPicker({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  const entries: { selection: PlanSelection; label: string; detail: string }[] = [
    ...editor.plan.beds.map((b) => ({ selection: { kind: "bed" as const, id: String(b.id) }, label: b.name, detail: "Bed" })),
    ...editor.plan.objects.map((o) => ({ selection: { kind: "object" as const, id: o.id }, label: "text" in o ? o.text : o.label || ("kind" in o ? o.kind : o.type), detail: "kind" in o ? o.kind : o.type })),
    ...editor.plan.plantingAreas.map((a) => ({ selection: { kind: "area" as const, id: a.id }, label: `${a.crop} · ${a.variety}`, detail: `${editor.plan.beds.find((b) => b.id === a.bedId)?.name} · ${a.count} plants` })),
    ...editor.plan.rows.map((r) => ({ selection: { kind: "row" as const, id: r.id }, label: `${r.crop} · ${r.variety}`, detail: `${r.count} plants · row` })),
  ];
  return <dialog ref={ref} className="garden-bed-dialog garden-design-dialog garden-object-picker" aria-label="Select garden objects" onCancel={onClose}>
    <header><h2>Select garden objects</h2><button type="button" onClick={onClose}>Close</button></header>
    <label>Find an object<input autoFocus type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bed, crop, path or structure" /></label>
    <label className="garden-edit-snap"><input type="checkbox" checked={editor.multiSelect} onChange={(e) => editor.setMultiSelect(e.target.checked)} />Select multiple objects</label>
    <div className="garden-object-list">{entries.filter((e) => `${e.label} ${e.detail}`.toLowerCase().includes(search.toLowerCase())).map((entry) => {
      const selected = editor.groupSelections.some((s) => selectionKey(s) === selectionKey(entry.selection));
      return <button type="button" key={selectionKey(entry.selection)} aria-pressed={selected} onClick={() => editor.select(entry.selection, editor.multiSelect)}><span><strong>{entry.label}</strong><small>{entry.detail}</small></span><b>{editor.locked(entry.selection) ? "Locked" : selected ? "Selected" : ""}</b></button>;
    })}</div>
    <footer><span>{editor.groupSelections.length} selected</span><button type="button" disabled={!editor.selection} onClick={editor.toggleLock}>{editor.groupSelections.length && editor.groupSelections.every(editor.locked) ? "Unlock selection" : "Lock selection"}</button><button type="button" disabled={!editor.selection} onClick={() => { onClose(); editor.focus(); }}>Focus selection</button><button type="button" onClick={onClose}>Done</button></footer>
    {editor.error && <p role="alert">{editor.error}</p>}
  </dialog>;
}
