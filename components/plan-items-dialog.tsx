"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlanSelection } from "@/lib/garden/multi-selection";
import { planLockKey } from "@/lib/garden/plan-item-locks";
import type { PlannerPlan } from "@/lib/garden/planner-plan";

export function PlanItemsDialog({ plan, bedPeriod, onSelect, onToggleLock, onClose }: {
  plan: PlannerPlan;
  bedPeriod?: string;
  onSelect: (item: PlanSelection) => void;
  onToggleLock: (item: PlanSelection) => void;
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
  const matches = items.filter(item =>
    (!bedPeriod || item.kind === "bed") &&
    (item.category + " " + item.label).toLowerCase().includes(search.trim().toLowerCase())
  );
  const plantingsByBed = new Map<string, string[]>();
  if (bedPeriod) {
    for (const area of plan.plantingAreas) {
      const id = String(area.bedId);
      const plantings = plantingsByBed.get(id) ?? [];
      plantings.push(`${area.variety} ×${area.count}`);
      plantingsByBed.set(id, plantings);
    }
  }

  return createPortal(<dialog ref={dialog} className={`garden-size-dialog plan-items-dialog${bedPeriod ? " plan-beds-dialog" : ""}`} aria-labelledby="plan-items-title" onClose={onClose}>
    <header><h2 id="plan-items-title">{bedPeriod ? "Garden beds" : "Edit plan items"}</h2><button type="button" aria-label="Close plan items" onClick={onClose}>×</button></header>
    {bedPeriod && <p>Planted in {bedPeriod}</p>}
    <label>{bedPeriod ? "Find a bed" : "Find an item"}<input autoFocus={!bedPeriod} type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ul>{matches.map(item => {
      const key = planLockKey(item);
      const locked = plan.lockedItems?.includes(key) ?? false;
      const action = (locked ? "Unlock " : "Lock ") + item.label;
      const plantings = plantingsByBed.get(item.id);
      return <li key={key}>
        <button type="button" className="plan-item-select" onClick={() => onSelect(item)}><strong>{item.label}</strong><small>{bedPeriod ? plantings?.join(", ") || "Empty this month" : item.category}</small></button>
        {!bedPeriod && <button type="button" className="plan-item-lock" aria-label={action} title={action} data-locked={locked} onClick={() => onToggleLock(item)}>
          <span aria-hidden="true">{locked ? "🔒" : "🔓"}</span>
        </button>}
      </li>;
    })}</ul>
    {!matches.length && <p>{bedPeriod ? "No matching beds." : "No matching plan items."}</p>}
  </dialog>, document.body);
}
