import { useState } from "react";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { nextRecoverySlot, proposeScheduleRecovery, type RecoveryRequest } from "@/lib/garden/schedule-recovery";
import { formatNzDate, type SeedBatch } from "@/lib/garden/seedling-local";
import { linkedBatchDelay } from "@/lib/garden/seed-inventory";
import type { SuccessionSave } from "./succession-timeline";

export function ScheduleRecovery({ plan, busy, trays, today, onApply, onReviewBed }: {
  plan: PlannerPlan; busy: boolean; trays: SeedBatch[]; today: string;
  onReviewBed: (id: number, clear: string) => void;
  onApply: (request: RecoveryRequest) => Promise<SuccessionSave>;
}) {
  const bookings = [
    ...plan.plantingAreas.map(planting => ({ planting, kind: "area" as const,
      label: plan.beds.find(bed => bed.id === planting.bedId)?.name ?? "Bed" })),
    ...plan.rows.map((planting, index) => ({ planting, kind: "row" as const, label: `Row ${index + 1}` })),
  ].filter(({ planting }) => planting.schedule?.from && !planting.schedule.failedOn);
  const [key, setKey] = useState("");
  const [mode, setMode] = useState<RecoveryRequest["mode"]>("delay");
  const [date, setDate] = useState("");
  const [preview, setPreview] = useState<{ request: RecoveryRequest; result: ReturnType<typeof proposeScheduleRecovery>; base: PlannerPlan }>();
  const [error, setError] = useState("");
  const [cleared, setCleared] = useState<{ id: number; date: string }>();
  const [notice, setNotice] = useState("");
  const selected = bookings.find(item => `${item.kind}:${item.planting.id}` === key) ?? bookings[0];

  function review(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const request = { id: selected.planting.id, kind: selected.kind, mode, date };
    try { setPreview({ request, result: proposeScheduleRecovery(plan, request), base: plan }); setError(""); setNotice(""); setCleared(undefined); }
    catch (error) { setPreview(undefined); setError(error instanceof Error ? error.message : "Could not review this booking."); }
  }

  async function apply() {
    if (!preview || preview.base !== plan || preview.result.conflicts.length || busy) return;
    try {
      const saved = await onApply(preview.request);
      if (preview.request.mode === "failure" && "bedId" in preview.result.source) {
        setCleared({ id: preview.result.source.bedId, date: preview.request.date });
      }
      setPreview(undefined);
      setNotice(saved === "cloud" ? "Recovery saved to this garden." : saved === "local" ? "Recovery saved on this device." : "Recovery added to the draft. Use Save to retry publishing.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not apply this recovery."); }
  }

  function findSlot() {
    if (!preview) return;
    try {
      const next = nextRecoverySlot(plan, preview.request);
      if (!next) { setError("No clear slot was found in the next 120 days. Review the affected bookings."); return; }
      setError("");
      setDate(next.request.date);
      setPreview({ ...next, base: plan });
    } catch (error) { setError(error instanceof Error ? error.message : "Could not find another booking."); }
  }

  return <section aria-label="Recover a planting" className="succession-bed-conditions">
    <h3>Recover a planting</h3>
    {selected ? <form onSubmit={review} onChange={() => { setPreview(undefined); setError(""); setNotice(""); setCleared(undefined); }}>
      <div className="report-controls succession-condition-fields">
        <label>Planting booking<select value={`${selected.kind}:${selected.planting.id}`} onChange={event => { setKey(event.target.value); setDate(""); }}>
          {bookings.map(({ planting, kind, label }) => <option key={`${kind}:${planting.id}`} value={`${kind}:${planting.id}`}>{label} · {planting.variety} · {formatNzDate(planting.schedule!.from!)}</option>)}
        </select></label>
        <label>What happened<select value={mode} onChange={event => { setMode(event.target.value as RecoveryRequest["mode"]); setDate(""); }}>
          <option value="delay">Planting delayed</option><option value="failure">Crop failed and was cleared</option>
        </select></label>
        <label>{mode === "delay" ? "New bed start" : "Date cleared"}<input type="date" required max={mode === "failure" ? today : undefined} value={date} onChange={event => setDate(event.target.value)} /></label>
      </div>
      {mode === "delay" && trays.filter(batch => linkedBatchDelay(batch, plan.plantingAreas, today)?.planting.id === selected.planting.id && batch.readyFrom)
        .map(batch => <button key={batch.id} type="button" onClick={() => { setDate(batch.readyFrom!); setPreview(undefined); }}>
          Use tray ready date · {formatNzDate(batch.readyFrom!)}</button>)}
      <button type="submit" disabled={busy}>Preview recovery</button>
    </form> : <p>No dated planting bookings are available to review.</p>}
    {error && <p className="succession-warning" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {notice && cleared && <button type="button" onClick={() => onReviewBed(cleared.id, cleared.date)}>Review replacement crops for the cleared bed</button>}

    {preview && <div className="succession-review">
      <h4>Review changes for {preview.result.source.variety}</h4>
      <p>Current booking · {formatNzDate(preview.result.source.schedule!.from!)} to {preview.result.source.schedule?.until
        ? formatNzDate(preview.result.source.schedule.until) : "open ended"}</p>
      <p>Proposed booking · {formatNzDate(preview.result.schedule.from!)} to {preview.result.schedule.until
        ? formatNzDate(preview.result.schedule.until) : "open ended"}</p>
      {preview.request.mode === "failure" && <p>Records the failure and frees this space after the clear date. Existing harvests and notes are preserved.</p>}
      {preview.result.conflicts.length > 0 && <p role="alert">Affected bookings · {preview.result.conflicts.map(planting => planting.variety || planting.crop).join(", ")}. Choose a different date before applying.</p>}
      {preview.result.conflicts.length > 0 && <button type="button" onClick={findSlot}>Find next clear slot</button>}
      <button type="button" onClick={() => void apply()} disabled={busy || preview.base !== plan || preview.result.conflicts.length > 0}>Apply recovery</button>
      <button type="button" onClick={() => setPreview(undefined)} disabled={busy}>Discard preview</button>
    </div>}
  </section>;
}
