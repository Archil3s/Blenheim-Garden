"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlanSelection } from "@/lib/garden/multi-selection";
import type { PlannerPlan } from "@/lib/garden/planner-plan";

export function PlanItemsDialog({ plan, onSelect, onClose }: {
  plan: PlannerPlan;
  onSelect: (item: PlanSelection) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);

  const items: (PlanSelection & { label: string; category: string })[] = [
    ...plan.beds.map(bed => ({ kind: "bed" as const, id: String(bed.id), label: bed.name, category: "Bed" })),
    ...plan.plantingAreas.map(area => ({
      kind: "planting" as const, id: area.id,
      label: [area.variety, plan.beds.find(bed => bed.id === area.bedId)?.name].filter(Boolean).join(" · "),
      category: "Planting area",
    })),
    ...plan.rows.map(row => ({ kind: "row" as const, id: row.id, label: row.variety, category: "Planting row" })),
    ...plan.objects.map(object => ({
      kind: "object" as const, id: object.id,
      label: object.type === "text" ? object.text : object.type === "shape" ? object.shape : object.label || object.type,
      category: object.type,
    })),
  ];
  const matches = items.filter(item => (item.category + " " + item.label).toLowerCase().includes(search.trim().toLowerCase()));

  return createPortal(<dialog ref={dialog} className="garden-size-dialog plan-items-dialog" aria-labelledby="plan-items-title" onClose={onClose}>
    <header><h2 id="plan-items-title">Edit plan items</h2><button type="button" aria-label="Close plan items" onClick={onClose}>×</button></header>
    <label>Find an item<input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ul>{matches.map(item => <li key={item.kind + ":" + item.id}>
      <button type="button" onClick={() => onSelect(item)}><strong>{item.label}</strong><small>{item.category}</small></button>
    </li>)}</ul>
    {!matches.length && <p>No matching plan items.</p>}
  </dialog>, document.body);
}
