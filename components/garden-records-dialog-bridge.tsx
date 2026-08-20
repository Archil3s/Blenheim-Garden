"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

type ActivePlanting = {
  id: string;
  cropName: string;
  cropIcon: string | null;
  variety: string | null;
  sowDate: string | null;
  germinatedDate: string | null;
  transplantDate: string | null;
  startDate: string | null;
  status: string;
};

type NoteItem = {
  id: string;
  targetType: string;
  targetId: string;
  body: string;
  occurredOn: string | null;
  createdAt: string;
  cropName: string | null;
  variety: string | null;
  bedLabel: string | null;
};

type HarvestItem = {
  id: string;
  plantingId: string | null;
  harvestedOn: string;
  weightG: number | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  cropName: string | null;
  cropIcon: string | null;
  variety: string | null;
  bedLabel: string | null;
};

type RecordsResponse = {
  ok: boolean;
  error?: string;
  scope?: { type: "bed" | "planting" | "garden"; bedId: string | null; plantingId?: string | null; label: string };
  activePlanting?: ActivePlanting | null;
  multipleActive?: boolean;
  notes?: NoteItem[];
  harvests?: HarvestItem[];
};

type Target = { bedId: string | null; plantingId: string | null; label: string };

function todayInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function prettyDate(value: string | null | undefined) {
  if (!value) return "Undated";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function formatWeight(grams: number | null) {
  if (grams == null) return null;
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  return `${Math.round(grams)} g`;
}

export function GardenRecordsDialogBridge() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Target>({ bedId: null, plantingId: null, label: "Whole garden" });
  const [activePlanting, setActivePlanting] = useState<ActivePlanting | null>(null);
  const [multipleActive, setMultipleActive] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [harvests, setHarvests] = useState<HarvestItem[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteDate, setNoteDate] = useState(todayInput());
  const [harvestDate, setHarvestDate] = useState(todayInput());
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"g" | "kg">("kg");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("items");
  const [harvestNotes, setHarvestNotes] = useState("");
  const [sowDate, setSowDate] = useState("");
  const [germinatedDate, setGerminatedDate] = useState("");
  const [transplantDate, setTransplantDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function applyResponse(data: RecordsResponse) {
    const planting = data.activePlanting ?? null;
    setActivePlanting(planting);
    setMultipleActive(Boolean(data.multipleActive));
    setNotes(data.notes ?? []);
    setHarvests(data.harvests ?? []);
    setSowDate(planting?.sowDate ?? "");
    setGerminatedDate(planting?.germinatedDate ?? "");
    setTransplantDate(planting?.transplantDate ?? "");
  }

  async function loadRecords(nextTarget: Target) {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextTarget.bedId) params.set("bedId", nextTarget.bedId);
      if (nextTarget.plantingId) params.set("plantingId", nextTarget.plantingId);
      const query = params.size ? `?${params.toString()}` : "";
      const response = await fetch(`/api/garden/records${query}`, { cache: "no-store" });
      const data = await response.json() as RecordsResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load notes and harvests.");
      applyResponse(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load notes and harvests.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function openRecords(event: MouseEvent) {
      const clicked = event.target as HTMLElement | null;
      if (!clicked) return;
      const recordButton = clicked.closest("button.gv-secondary-action");
      const notesTab = clicked.closest(".gv-tabs button");
      let nextTarget: Target | null = null;
      let needsSave = false;

      if (recordButton?.textContent?.includes("Notes & harvests")) {
        const panel = recordButton.closest(".gv-selection-panel") as HTMLElement | null;
        const bedId = panel?.dataset.bedId?.trim() || null;
        const plantingId = panel?.dataset.plantingId?.trim() || null;
        const label = panel?.querySelector(".gv-selection-hero h2")?.textContent?.trim() || "Selected bed";
        if (panel?.classList.contains("gv-planting-inspector") && !plantingId) needsSave = true;
        if (bedId) nextTarget = { bedId, plantingId, label };
      } else if (notesTab?.textContent?.trim() === "Notes") {
        nextTarget = { bedId: null, plantingId: null, label: "Whole garden" };
      }

      if (!nextTarget) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setTarget(nextTarget);
      setNoteBody("");
      setNoteDate(todayInput());
      setHarvestDate(todayInput());
      setWeight("");
      setQuantity("");
      setHarvestNotes("");
      setError(needsSave ? "Save the garden once, then reopen this planting to add crop-specific notes or harvests." : "");
      setSuccess("");
      setBlocked(needsSave);
      setActivePlanting(null);
      setMultipleActive(false);
      setNotes([]);
      setHarvests([]);
      dialogRef.current?.showModal();
      if (!needsSave) void loadRecords(nextTarget);
    }

    document.addEventListener("click", openRecords, true);
    return () => document.removeEventListener("click", openRecords, true);
  }, []);

  async function postAction(action: string, payload: Record<string, unknown>, successMessage: string) {
    if (blocked) return false;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before changing records.");
      return false;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/garden/records", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json() as RecordsResponse;
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
        throw new Error(data.error || "Unable to save the record.");
      }
      setSuccess(successMessage);
      await loadRecords(target);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the record.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!noteBody.trim()) {
      setError("Write a note first.");
      return;
    }
    const saved = await postAction("add-note", { bedId: target.bedId, plantingId: target.plantingId, body: noteBody.trim(), occurredOn: noteDate }, "Note added");
    if (saved) setNoteBody("");
  }

  async function addHarvest() {
    if (!target.bedId || !activePlanting) return;
    const numericWeight = weight.trim() ? Number(weight) : null;
    const weightG = numericWeight == null || Number.isNaN(numericWeight) ? null : numericWeight * (weightUnit === "kg" ? 1000 : 1);
    const numericQuantity = quantity.trim() ? Number(quantity) : null;
    const saved = await postAction("add-harvest", {
      bedId: target.bedId,
      plantingId: target.plantingId,
      harvestedOn: harvestDate,
      weightG,
      quantity: numericQuantity == null || Number.isNaN(numericQuantity) ? null : numericQuantity,
      unit: quantityUnit.trim() || "items",
      notes: harvestNotes.trim(),
    }, "Harvest recorded");
    if (saved) {
      setWeight("");
      setQuantity("");
      setHarvestNotes("");
    }
  }

  async function saveMilestones() {
    if (!target.bedId || !activePlanting) return;
    await postAction("save-milestones", {
      bedId: target.bedId,
      plantingId: target.plantingId,
      sowDate: sowDate || null,
      germinatedDate: germinatedDate || null,
      transplantDate: transplantDate || null,
    }, "Crop dates saved");
  }

  async function remove(kind: "note" | "harvest", id: string) {
    if (!window.confirm(`Delete this ${kind}?`)) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim() ?? "";
    if (!editKey) {
      setError("Open Settings and save your garden edit key before deleting records.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const query = new URLSearchParams({ kind, id });
      const response = await fetch(`/api/garden/records?${query.toString()}`, { method: "DELETE", headers: { authorization: `Bearer ${editKey}` } });
      const data = await response.json() as RecordsResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Delete failed.");
      await loadRecords(target);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  const activity = useMemo(() => {
    const entries = [
      ...notes.map((item) => ({ kind: "note" as const, date: item.occurredOn || item.createdAt.slice(0, 10), createdAt: item.createdAt, item })),
      ...harvests.map((item) => ({ kind: "harvest" as const, date: item.harvestedOn, createdAt: item.createdAt, item })),
    ];
    return entries.sort((a, b) => `${b.date}|${b.createdAt}`.localeCompare(`${a.date}|${a.createdAt}`));
  }, [notes, harvests]);

  const cropUnavailableMessage = blocked
    ? "Save this new planting first."
    : multipleActive
      ? "This bed contains multiple crops. Select a planting area on the canvas to edit crop dates or record a harvest."
      : "You can still add bed notes. Plant a crop here before recording harvests.";

  return (
    <dialog ref={dialogRef} className="garden-records-dialog" onCancel={() => dialogRef.current?.close()}>
      <div className="records-card">
        <header><div><strong>Notes & harvests</strong><span>{target.label}</span></div><button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button></header>

        {target.bedId && (
          <section className="crop-card">
            {activePlanting ? <>
              <div className="crop-title"><span>{activePlanting.cropIcon || "🌱"}</span><div><small>{target.plantingId ? "SELECTED PLANTING" : "CURRENT CROP"}</small><strong>{activePlanting.variety || activePlanting.cropName}</strong><em>{activePlanting.cropName}</em></div></div>
              <div className="milestones"><label>Sown<input type="date" value={sowDate} onChange={(event) => setSowDate(event.target.value)} disabled={busy} /></label><label>Germinated<input type="date" value={germinatedDate} onChange={(event) => setGerminatedDate(event.target.value)} disabled={busy} /></label><label>Transplanted<input type="date" value={transplantDate} onChange={(event) => setTransplantDate(event.target.value)} disabled={busy} /></label><button type="button" onClick={() => void saveMilestones()} disabled={busy}>Save dates</button></div>
            </> : <div className="empty-crop"><span>🌱</span><div><strong>{multipleActive ? "Select a crop area" : "No active crop selected"}</strong><small>{cropUnavailableMessage}</small></div></div>}
          </section>
        )}

        <div className="record-columns">
          <section className={`record-form ${blocked ? "disabled" : ""}`}>
            <div className="section-title"><strong>Quick note</strong><span>{target.plantingId ? "Attached to selected crop" : target.bedId ? "Attached to this bed" : "Whole garden"}</span></div>
            <label>Date<input type="date" value={noteDate} onChange={(event) => setNoteDate(event.target.value)} disabled={busy || blocked} /></label>
            <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} maxLength={4000} placeholder="What happened? Soil, growth, pests, weather, feeding…" disabled={busy || blocked} />
            <button type="button" className="primary" onClick={() => void addNote()} disabled={busy || blocked || !noteBody.trim()}>{busy ? "Working…" : "Add note"}</button>
          </section>

          {target.bedId && (
            <section className={`record-form harvest-form ${!activePlanting ? "disabled" : ""}`}>
              <div className="section-title"><strong>Record harvest</strong><span>{activePlanting ? activePlanting.variety || activePlanting.cropName : multipleActive ? "Select a planting area" : "Plant a crop first"}</span></div>
              <label>Date<input type="date" value={harvestDate} onChange={(event) => setHarvestDate(event.target.value)} disabled={busy || !activePlanting} /></label>
              <div className="split-input"><label>Weight<div><input type="number" min="0" step="0.01" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" disabled={busy || !activePlanting} /><select value={weightUnit} onChange={(event) => setWeightUnit(event.target.value as "g" | "kg")} disabled={busy || !activePlanting}><option value="kg">kg</option><option value="g">g</option></select></div></label><label>Quantity<div><input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" disabled={busy || !activePlanting} /><input value={quantityUnit} onChange={(event) => setQuantityUnit(event.target.value)} maxLength={40} placeholder="items" disabled={busy || !activePlanting} /></div></label></div>
              <textarea value={harvestNotes} onChange={(event) => setHarvestNotes(event.target.value)} maxLength={2000} placeholder="Optional harvest note" disabled={busy || !activePlanting} />
              <button type="button" className="primary harvest" onClick={() => void addHarvest()} disabled={busy || !activePlanting}>{busy ? "Working…" : "Record harvest"}</button>
            </section>
          )}
        </div>

        {(error || success) && <div className={error ? "record-message error" : "record-message success"}>{error || success}</div>}

        <section className="activity">
          <div className="activity-head"><strong>History</strong><span>{activity.length} record{activity.length === 1 ? "" : "s"}</span></div>
          {busy && activity.length === 0 ? <p className="empty">Loading…</p> : null}
          {!busy && activity.length === 0 ? <p className="empty">Nothing recorded here yet.</p> : null}
          {activity.map((entry) => entry.kind === "note" ? <article key={`note-${entry.item.id}`}><span className="activity-icon note">✎</span><div className="activity-copy"><div><strong>Note</strong><small>{prettyDate(entry.date)}{entry.item.bedLabel ? ` · ${entry.item.bedLabel}` : ""}{entry.item.variety ? ` · ${entry.item.variety}` : ""}</small></div><p>{entry.item.body}</p></div><button type="button" className="delete" onClick={() => void remove("note", entry.item.id)} disabled={busy}>Delete</button></article> : <article key={`harvest-${entry.item.id}`}><span className="activity-icon harvest">⚖</span><div className="activity-copy"><div><strong>Harvest{entry.item.cropIcon ? ` ${entry.item.cropIcon}` : ""}</strong><small>{prettyDate(entry.date)}{entry.item.bedLabel ? ` · ${entry.item.bedLabel}` : ""}{entry.item.variety ? ` · ${entry.item.variety}` : ""}</small></div><p>{[formatWeight(entry.item.weightG), entry.item.quantity != null ? `${entry.item.quantity} ${entry.item.unit || "items"}` : null, entry.item.notes].filter(Boolean).join(" · ")}</p></div><button type="button" className="delete" onClick={() => void remove("harvest", entry.item.id)} disabled={busy}>Delete</button></article>)}
        </section>
      </div>

      <style jsx>{`
        .garden-records-dialog { border:0; padding:0; width:min(880px,calc(100vw - 28px)); max-height:min(850px,calc(100vh - 28px)); border-radius:10px; box-shadow:0 20px 65px rgba(0,0,0,.32); color:#263630; }
        .garden-records-dialog::backdrop { background:rgba(24,38,33,.48); }
        .records-card { background:#fff; min-height:360px; }
        header { display:flex; align-items:center; justify-content:space-between; padding:14px 17px; border-bottom:1px solid #dce4e0; position:sticky; top:0; z-index:5; background:#fff; }
        header div { display:grid; gap:2px; } header strong { font-size:15px; } header span { font-size:11px; color:#6e7c75; } header button { border:0; background:transparent; font-size:23px; color:#64716b; cursor:pointer; }
        .crop-card { padding:13px 16px; background:#f6faf8; border-bottom:1px solid #e2eae6; }
        .crop-title { display:flex; align-items:center; gap:10px; margin-bottom:11px; } .crop-title>span { font-size:26px; } .crop-title div { display:grid; gap:1px; } .crop-title small { font-size:9px; letter-spacing:.07em; color:#708078; } .crop-title strong { font-size:13px; } .crop-title em { font-size:10px; color:#728079; font-style:normal; }
        .milestones { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)) auto; gap:8px; align-items:end; } label { display:grid; gap:4px; font-size:10px; font-weight:700; color:#5c6c64; } input,select,textarea { border:1px solid #c8d2cd; border-radius:4px; background:#fff; color:#263630; font:inherit; } label>input { height:34px; padding:0 8px; } .milestones button { height:34px; padding:0 13px; border:1px solid #789287; border-radius:4px; background:#fff; color:#3d5b4e; font-weight:700; cursor:pointer; }
        .empty-crop { display:flex; align-items:center; gap:10px; } .empty-crop>span { font-size:24px; opacity:.55; } .empty-crop div { display:grid; gap:2px; } .empty-crop strong { font-size:12px; } .empty-crop small { font-size:10px; color:#74817b; }
        .record-columns { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #e2e8e5; } .record-form { display:grid; gap:8px; padding:14px 16px 16px; align-content:start; } .record-form+ .record-form { border-left:1px solid #e2e8e5; } .record-form.disabled { background:#fafbfa; opacity:.67; }
        .section-title { display:flex; justify-content:space-between; gap:12px; align-items:baseline; } .section-title strong { font-size:12px; } .section-title span { font-size:9px; color:#75837c; }
        textarea { min-height:68px; resize:vertical; padding:8px 9px; font-size:11px; line-height:1.4; } .primary { height:35px; border:1px solid #138a65; border-radius:4px; background:#19a97b; color:#fff; font-weight:800; cursor:pointer; } .primary.harvest { background:#55824f; border-color:#456e40; } button:disabled,input:disabled,select:disabled,textarea:disabled { opacity:.52; cursor:not-allowed; }
        .split-input { display:grid; grid-template-columns:1fr 1fr; gap:8px; } .split-input label>div { display:grid; grid-template-columns:1fr 58px; gap:4px; } .split-input input,.split-input select { min-width:0; height:34px; padding:0 7px; }
        .record-message { margin:10px 16px 0; padding:8px 10px; border-radius:4px; font-size:10px; } .record-message.error { background:#fff1f0; color:#9c3d36; } .record-message.success { background:#edf8f3; color:#287257; }
        .activity { padding-top:10px; max-height:360px; overflow:auto; } .activity-head { display:flex; justify-content:space-between; padding:0 16px 9px; font-size:11px; } .activity-head span { color:#7a8680; font-size:10px; }
        .activity article { display:grid; grid-template-columns:34px 1fr auto; gap:10px; align-items:start; padding:11px 16px; border-top:1px solid #edf1ef; } .activity-icon { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; font-size:13px; background:#eef5f2; color:#39705d; } .activity-icon.harvest { background:#f0f4e9; color:#5b744b; }
        .activity-copy { min-width:0; display:grid; gap:5px; } .activity-copy>div { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; } .activity-copy strong { font-size:11px; } .activity-copy small { font-size:9px; color:#7b8781; } .activity-copy p { margin:0; font-size:11px; line-height:1.45; white-space:pre-wrap; overflow-wrap:anywhere; }
        .delete { border:0; background:transparent; color:#9a554d; font-size:9px; cursor:pointer; padding:5px; } .empty { margin:0; padding:28px 16px; text-align:center; color:#74817b; font-size:11px; border-top:1px solid #edf1ef; }
        @media (max-width:700px) { .milestones { grid-template-columns:1fr 1fr; } .milestones button { grid-column:1/-1; } .record-columns { grid-template-columns:1fr; } .record-form+ .record-form { border-left:0; border-top:1px solid #e2e8e5; } .activity article { grid-template-columns:30px 1fr; } .delete { grid-column:2; justify-self:start; padding-left:0; } }
      `}</style>
    </dialog>
  );
}
