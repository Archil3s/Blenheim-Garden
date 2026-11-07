import { useEffect, useRef, useState } from "react";
import { parsePlantingSchedule, type PlantingSchedule } from "@/lib/garden/planting-schedule";
import type { CalendarPlanting } from "@/lib/garden/planting-calendar";

const fields = [["from", "In garden from"], ["until", "In garden until"], ["sow", "Planned sowing"],
  ["transplant", "Planned transplanting"], ["harvestFrom", "Planned harvest from"], ["harvestUntil", "Planned harvest until"]] as const;

export function CalendarDatesDialog({ planting, onApply, onClose }: {
  planting: CalendarPlanting; onApply: (schedule?: PlantingSchedule) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<PlantingSchedule>({ ...planting.schedule });
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="calendar-dates-dialog" aria-labelledby="calendar-dates-title" onClose={onClose} onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <header><h2 id="calendar-dates-title">Dates for {planting.variety}</h2><button type="button" onClick={onClose} aria-label="Close calendar dates">×</button></header>
    <form onSubmit={event => {
      event.preventDefault();
      try { onApply(parsePlantingSchedule(draft)); onClose(); }
      catch (error) { setError(error instanceof Error ? error.message : "Check the dates."); }
    }}>
      <div className="calendar-date-fields">{fields.map(([field, label]) => <label key={field}>{label}
        <input type="date" min="1900-01-01" max="2200-12-31" value={draft[field] ?? ""} onChange={event => { setError(""); setDraft(current => ({ ...current, [field]: event.target.value })); }} />
      </label>)}</div>
      {error && <p role="alert">{error}</p>}
      <p>These are planned dates. Use Save in the planner to keep your changes.</p>
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit">Apply dates</button></footer>
    </form>
  </dialog>;
}
