import { useState } from "react";
import { parsePlantingSchedule, type PlantingSchedule } from "@/lib/garden/planting-schedule";
import { plants, type PlantOption } from "@/lib/garden/plant-catalog";

export function PlantingScheduleControls({ schedule, onChange, onSuccession }: {
  schedule?: PlantingSchedule; onChange: (schedule?: PlantingSchedule) => void;
  onSuccession: (crop: PlantOption) => void;
}) {
  const [error, setError] = useState("");
  const [cropName, setCropName] = useState("Lettuce");
  function change(field: "from" | "until", value: string) {
    try { const next = parsePlantingSchedule({ ...schedule, [field]: value }); setError(""); onChange(next); }
    catch (error) { setError(error instanceof Error ? error.message : "Check the planting dates."); }
  }
  return <fieldset className="planting-schedule-controls"><legend>Planting dates</legend>
    <div className="gv-field-grid"><label>In garden from<input type="date" min="1900-01-01" max="2200-12-31" value={schedule?.from ?? ""} onChange={event => change("from", event.target.value)} /></label>
      <label>In garden until<input type="date" min={schedule?.from ?? "1900-01-01"} max="2200-12-31" value={schedule?.until ?? ""} onChange={event => change("until", event.target.value)} /></label></div>
    {error && <p role="alert">{error}</p>}
    <label>Next crop<select aria-label="Next crop" value={cropName} onChange={event => setCropName(event.target.value)}>{plants.map(plant => <option key={plant.name}>{plant.name}</option>)}</select></label>
    <button type="button" className="gv-secondary-action" disabled={!schedule?.until || schedule.until === "2200-12-31"} onClick={() => {
      const crop = plants.find(plant => plant.name === cropName);
      if (crop) onSuccession(crop);
    }}>Add succession planting</button>
    {!schedule?.until && <small>Set an end date to plan the next crop in this space.</small>}
  </fieldset>;
}
