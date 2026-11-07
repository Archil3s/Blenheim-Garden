"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gardenDimensions, parseGardenDimensions, type GardenDimensions } from "@/lib/garden/garden-dimensions";
import { validateEditorPlan } from "@/lib/garden/plan-editing";
import type { PlannerPlan } from "@/lib/garden/planner-plan";

export function GardenSizeDialog({ plan, onApply, onClose }: { plan: PlannerPlan; onApply: (size: GardenDimensions) => void; onClose: () => void }) {
  const current = gardenDimensions(plan);
  const [width, setWidth] = useState(String(current.widthCm / 100));
  const [length, setLength] = useState(String(current.heightCm / 100));
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return createPortal(<dialog ref={dialog} className="garden-size-dialog" onClose={onClose} aria-labelledby="garden-size-title">
    <form onSubmit={event => {
      event.preventDefault();
      try {
        const size = parseGardenDimensions({ widthCm: Math.round(Number(width) * 100), heightCm: Math.round(Number(length) * 100) });
        validateEditorPlan({ ...plan, canvas: size });
        onApply(size); onClose();
      } catch (failure) { setError(failure instanceof Error ? failure.message : "Check the garden size."); }
    }}>
      <header><h2 id="garden-size-title">Garden size</h2><button type="button" onClick={onClose} aria-label="Close garden size">×</button></header>
      <p>Set the outer boundary. Beds and plants keep their real sizes and positions.</p>
      <label>Width (metres)<input autoFocus required type="number" min="1" max="100" step="0.01" value={width} onChange={event => setWidth(event.target.value)} /></label>
      <label>Length (metres)<input required type="number" min="1" max="100" step="0.01" value={length} onChange={event => setLength(event.target.value)} /></label>
      {error && <p role="alert">{error} Enlarge the boundary or move the affected items first.</p>}
      <small>Apply is undoable. Save stores the dimensions with this garden.</small>
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit">Apply size</button></footer>
    </form>
  </dialog>, document.body);
}
