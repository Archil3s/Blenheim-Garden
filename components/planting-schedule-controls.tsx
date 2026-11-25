import { useState } from "react";
import { nextPlantingDate, parsePlantingSchedule, type PlantingSchedule } from "@/lib/garden/planting-schedule";
import { plants, type PlantOption } from "@/lib/garden/plant-catalog";

export function PlantingScheduleControls({ schedule, onChange, onSuccession, onResetConflict, locked }: {
  schedule?: PlantingSchedule; onChange: (schedule?: PlantingSchedule) => void;
  onSuccession: (crop: PlantOption, dates: Pick<PlantingSchedule, "from" | "until">) => void;
  onResetConflict: () => void;
  locked?: boolean;
}) {
  const [error, setError] = useState("");
  const [cropName, setCropName] = useState("Lettuce");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const earliest = schedule?.until && schedule.until !== "2200-12-31" ? nextPlantingDate(schedule.until) : undefined;
  function resetConflict() { setError(""); onResetConflict(); }
  function change(field: "from" | "until", value: string) {
    try { const next = parsePlantingSchedule({ ...schedule, [field]: value }); resetConflict(); onChange(next); }
    catch (error) { setError(error instanceof Error ? error.message : "Check the planting dates."); }
  }
  return <fieldset className="planting-schedule-controls"><legend>Planting dates</legend>
    <div className="gv-field-grid"><label>In garden from<input type="date" min="1900-01-01" max="2200-12-31" value={schedule?.from ?? ""} onChange={event => change("from", event.target.value)} /></label>
      <label>In garden until<input type="date" min={schedule?.from ?? "1900-01-01"} max="2200-12-31" value={schedule?.until ?? ""} onChange={event => change("until", event.target.value)} /></label></div>
    <label>Next crop<select aria-label="Next crop" disabled={locked} value={cropName} onChange={event => { setCropName(event.target.value); resetConflict(); }}>{plants.map(plant => <option key={plant.name}>{plant.name}</option>)}</select></label>
    {earliest && <div className="gv-field-grid">
      <label>Next crop starts<input type="date" min={earliest} max="2200-12-31" disabled={locked} value={start || earliest} onChange={event => { setStart(event.target.value); resetConflict(); }} /></label>
      <label>Next crop clears<input type="date" min={start || earliest} max="2200-12-31" disabled={locked} value={end} onChange={event => { setEnd(event.target.value); resetConflict(); }} /></label>
    </div>}
    <button type="button" className="gv-secondary-action" disabled={!earliest || locked} onClick={() => {
      const crop = plants.find(plant => plant.name === cropName);
      if (!crop) return;
      try { resetConflict(); onSuccession(crop, { from: start || earliest, until: end || undefined }); }
      catch (error) { setError(error instanceof Error ? error.message : "Check the next crop and dates."); }
    }}>Add succession planting</button>
    {error && <p className="succession-warning" role="alert">{error}</p>}
    {!schedule?.until && <small>Set an end date to plan the next crop in this space.</small>}
    {earliest && !end && <small>Leave the clear date blank to reserve this space with no end date.</small>}
  </fieldset>;
}
