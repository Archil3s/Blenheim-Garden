import { useState } from "react";
import { harvestTargetPlan } from "@/lib/garden/harvest-targets";
import { plants } from "@/lib/garden/plant-catalog";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { addDays, cropArtName, SEED_CROPS, formatNzDate, type SeedBatch } from "@/lib/garden/seedling-local";
import { sowingOptions, type SowingMethod, type SuccessionHistory } from "@/lib/garden/succession-timeline";

const choices = SEED_CROPS.flatMap(guide => {
  const crop = plants.find(item => item.name === (guide.crop === "Peas" ? "Peas (Shelling)" : cropArtName(guide.crop)));
  return guide.harvestDays && crop ? [{ guide, crop }] : [];
});

export function HarvestTargets({ plan, history, trays, today }: { plan: PlannerPlan; history: SuccessionHistory[]; trays: SeedBatch[]; today: string }) {
  const [cropName, setCropName] = useState("Lettuce");
  const [target, setTarget] = useState({
    firstHarvest: addDays(today, 60), quantity: 4, batchCount: 3, interval: 14,
    method: "direct" as SowingMethod, trayCells: 24, trayDays: 28, harvestDays: 7,
  });
  const { guide, crop } = choices.find(item => item.crop.name === cropName) ?? choices[0];
  const methods = sowingOptions(guide).filter(item => item.months.length);
  const method = methods.some(item => item.method === target.method) ? target.method : methods[0].method;
  const [preview, setPreview] = useState<ReturnType<typeof harvestTargetPlan>>();
  const fields = [
    ["quantity", "Plants per batch", 1, 1000], ["batchCount", "Batches", 1, 12], ["interval", "Days between harvests", 1, 120],
    ["harvestDays", "Harvest period in days", 1, 120],
  ] as const;
  return <section className="succession-bed-conditions" aria-label="Staggered harvest planner">
    <h3>Staggered harvest planner</h3>
    <p>Preview sowing dates from an estimated first harvest. Each proposal uses a whole bed for the dates shown. Use the seed packet to confirm maturity.</p>
    <form onSubmit={event => { event.preventDefault(); setPreview(harvestTargetPlan(plan, history, trays, crop, guide, { ...target, method }, today)); }}
      onChange={() => setPreview(undefined)}>
      <div className="report-controls succession-condition-fields">
        <label>Crop<select value={cropName} onChange={event => setCropName(event.target.value)}>{choices.map(item => <option key={item.crop.name}>{item.crop.name}</option>)}</select></label>
        <label>First target harvest<input type="date" value={target.firstHarvest} required min={today} max="2199-12-31" onChange={event => setTarget({ ...target, firstHarvest: event.target.value })} /></label>
        {fields.map(([field, label, min, max]) => <label key={field}>{label}<input type="number" value={target[field]} required min={min} max={max}
          onChange={event => setTarget({ ...target, [field]: event.target.valueAsNumber || 0 })} /></label>)}
        <label>Sowing method<select value={method} onChange={event => setTarget({ ...target, method: event.target.value as SowingMethod })}>
          {methods.map(item => <option key={item.method} value={item.method}>{item.method === "direct" ? "Direct into soil" : "Start under cover"}</option>)}
        </select></label>
        {method === "covered" && <>
          <label>Tray cells for this garden<input type="number" value={target.trayCells} min="1" max="2000" required
            onChange={event => setTarget({ ...target, trayCells: event.target.valueAsNumber || 0 })} /></label>
          <label>Days in trays<input type="number" value={target.trayDays} min="1" max="120" required
            onChange={event => setTarget({ ...target, trayDays: event.target.valueAsNumber || 0 })} /></label>
        </>}
      </div>
      {method === "covered" && <p>Capacity includes active tray batches saved on this device. Batches without a ready or transplant date count as occupied.</p>}
      <button type="submit">Preview harvest plan</button>
    </form>
    {preview && <ol className="succession-bed-overview harvest-proposals">
      {preview.map(row => <li key={row.harvest}>
        <h4>First harvest around {formatNzDate(row.harvest)}</h4>
        <p>{row.quantity} plants · Sow {formatNzDate(row.sow)}{method === "covered" && ` · Transplant ${formatNzDate(row.from)}`}</p>
        {row.bed ? <p>{row.bed.name} · Hold until {formatNzDate(row.until)}</p> : <p className="succession-warning">{row.problem}</p>}
      </li>)}
    </ol>}
  </section>;
}
