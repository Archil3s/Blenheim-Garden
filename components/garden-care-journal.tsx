"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { careDateLabel, newZealandCareDate, normalizeCareCrop, type CareEvent, type CareKind, type CareProduct } from "@/lib/garden/care";
import { gardenLocalPlanKey, readActiveGardenId } from "@/lib/garden/active-garden";
import type { PlannerPlan } from "@/lib/garden/planner-plan";

type Result = { ok: boolean; error?: string; events?: CareEvent[] };
const EDIT_KEY_SESSION = "blenheim-garden-edit-key";
const emptyProduct = (): CareProduct => ({ name: "", dilution: "" });
const defaultCropNames = ["Tomato", "Chilli", "Pumpkin"];

export function GardenCareJournal() {
  const [gardenId, setGardenId] = useState("");
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [records, setRecords] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [kind, setKind] = useState<CareKind>("fertiliser");
  const [date, setDate] = useState(newZealandCareDate);
  const [products, setProducts] = useState<CareProduct[]>([emptyProduct()]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [customCrop, setCustomCrop] = useState("");
  const [method, setMethod] = useState("");
  const [withholdingDays, setWithholdingDays] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<"all" | CareKind>("all");

  useEffect(() => {
    const id = readActiveGardenId();
    setGardenId(id);
    const params = new URLSearchParams(window.location.search);
    const draftDate = params.get("date");
    if (draftDate && /^\d{4}-\d{2}-\d{2}$/.test(draftDate)) setDate(draftDate);
    const draftKind = params.get("kind");
    if (draftKind === "fertiliser" || draftKind === "spray") setKind(draftKind);
    const draftCrops = params.getAll("crop").filter(Boolean).slice(0, 100);
    if (draftCrops.length) setSelectedCrops(draftCrops);
    const draftProducts = params.getAll("product");
    if (draftProducts.length) {
      const dilutions = params.getAll("dilution");
      setProducts(draftProducts.slice(0, 8).map((name, i) => ({ name: name.slice(0, 160), dilution: (dilutions[i] ?? "").slice(0, 80) })));
    }

    async function load() {
      try {
        const raw = localStorage.getItem(gardenLocalPlanKey(id));
        if (raw) {
          const stored = JSON.parse(raw) as PlannerPlan;
          if (Array.isArray(stored.plantingAreas) && Array.isArray(stored.rows)) setPlan(stored);
        }
      } catch { /* A corrupt local draft must not hide the cloud plan. */ }
      try {
        const [careResponse, planResponse] = await Promise.all([
          fetch("/api/garden/care?gardenId=" + encodeURIComponent(id), { cache: "no-store" }),
          fetch("/api/garden?gardenId=" + encodeURIComponent(id), { cache: "no-store" }),
        ]);
        const care = await careResponse.json() as Result;
        if (!careResponse.ok || !care.ok) throw new Error(care.error || "Unable to load treatment history.");
        setRecords(care.events ?? []);
        if (planResponse.ok) {
          const saved = await planResponse.json() as { ok: boolean; plan?: PlannerPlan };
          if (saved.ok && saved.plan) setPlan(saved.plan);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load treatment history.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const cropOptions = useMemo(() => {
    const names = [...defaultCropNames, ...selectedCrops, ...(plan?.plantingAreas ?? []).map((area) => area.crop), ...(plan?.rows ?? []).map((row) => row.crop)];
    const seen = new Set<string>();
    return names.filter((name) => {
      const normalized = normalizeCareCrop(name);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    }).sort((a, b) => a.localeCompare(b));
  }, [plan, selectedCrops]);

  function toggleCrop(name: string) {
    const exists = selectedCrops.some((crop) => normalizeCareCrop(crop) === normalizeCareCrop(name));
    setSelectedCrops(exists ? selectedCrops.filter((crop) => normalizeCareCrop(crop) !== normalizeCareCrop(name)) : [...selectedCrops, name]);
  }

  function addCustomCrop() {
    const name = customCrop.trim();
    if (name && !selectedCrops.some((crop) => normalizeCareCrop(crop) === normalizeCareCrop(name))) setSelectedCrops([...selectedCrops, name.slice(0, 120)]);
    setCustomCrop("");
  }

  function updateProduct(index: number, field: keyof CareProduct, value: string) {
    setProducts((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function reload() {
    if (!gardenId) return;
    const response = await fetch("/api/garden/care?gardenId=" + encodeURIComponent(gardenId), { cache: "no-store" });
    const data = await response.json() as Result;
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to reload treatment history.");
    setRecords(data.events ?? []);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gardenId || saving) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim();
    if (!editKey) {
      setError("Set your garden edit key in Planner → Settings before saving treatments.");
      return;
    }
    const crops = [...new Set(selectedCrops.map((name) => name.trim()).filter(Boolean))];
    if (!crops.length || products.some((item) => !item.name.trim())) {
      setError("Select at least one crop and give every product a name.");
      return;
    }
    const wanted = new Set(crops.map(normalizeCareCrop));
    const targets = [
      ...(plan?.plantingAreas ?? []).filter((area) => wanted.has(normalizeCareCrop(area.crop))).map((area) => "area:" + area.id),
      ...(plan?.rows ?? []).filter((row) => wanted.has(normalizeCareCrop(row.crop))).map((row) => "row:" + row.id),
    ];
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/garden/care?gardenId=" + encodeURIComponent(gardenId), {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + editKey },
        body: JSON.stringify({
          kind, occurredOn: date, products: products.map((item) => ({ name: item.name.trim(), dilution: item.dilution.trim() })),
          crops, targets, method, withholdingDays: kind === "spray" && withholdingDays !== "" ? Number(withholdingDays) : null, notes,
        }),
      });
      const data = await response.json() as Result;
      if (!response.ok || !data.ok) {
        if (response.status === 401) sessionStorage.removeItem(EDIT_KEY_SESSION);
        throw new Error(data.error || "Unable to save treatment.");
      }
      await reload();
      setSuccess("Treatment saved. The planner will show the last recorded application for matching crops.");
      setProducts([emptyProduct()]); setSelectedCrops([]); setMethod(""); setWithholdingDays(""); setNotes("");
      setDate(newZealandCareDate());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save treatment.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this recorded treatment?")) return;
    const editKey = sessionStorage.getItem(EDIT_KEY_SESSION)?.trim();
    if (!editKey) { setError("Set your garden edit key in Planner → Settings first."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/garden/care?gardenId=" + encodeURIComponent(gardenId) + "&id=" + encodeURIComponent(id), {
        method: "DELETE", headers: { authorization: "Bearer " + editKey },
      });
      const data = await response.json() as Result;
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to delete treatment.");
      await reload();
      setSuccess("Treatment deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete treatment.");
    } finally {
      setSaving(false);
    }
  }

  const shown = records.filter((record) => filter === "all" || record.kind === filter);
  return <main className="care-page">
    <header className="care-top"><Link href="/" className="care-brand"><span>bg.</span> BLENHEIM GARDEN</Link><nav aria-label="Garden navigation"><Link href="/planner">Garden plan</Link><Link href="/seedlings">Seedlings</Link><Link href="/care" aria-current="page">Fertilising & spraying</Link></nav></header>
    <div className="care-container">
      <div className="care-heading"><div><span className="care-eyebrow">GARDEN FIELD JOURNAL / CROP CARE</span><h1>Fertilising <em>& spraying.</em></h1><p>Record each application, track which crops received it, and see the last treatment on your garden plan.</p></div><Link href="/planner" className="care-plan-link">View treated crops on plan</Link></div>
      <div className="care-grid">
        <section className="care-panel" aria-labelledby="care-form-title"><div className="care-panel-heading"><span>01 / NEW RECORD</span><h2 id="care-form-title">Record an application</h2><p>One record can contain several products applied to the same crops.</p></div>
          <form onSubmit={(event) => void save(event)}>
            <div className="care-type" role="group" aria-label="Application type"><button type="button" aria-pressed={kind === "fertiliser"} className={kind === "fertiliser" ? "active" : ""} onClick={() => setKind("fertiliser")}>Fertilising</button><button type="button" aria-pressed={kind === "spray"} className={kind === "spray" ? "active" : ""} onClick={() => setKind("spray")}>Spraying</button></div>
            <label className="care-field">Date applied<input type="date" required max={newZealandCareDate()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <fieldset className="care-products"><legend>Products used</legend>{products.map((item, index) => <div className="care-product" key={index}><label>Product name<input required maxLength={160} placeholder={kind === "spray" ? "e.g. neem oil" : "e.g. comfrey liquid fertiliser"} value={item.name} onChange={(event) => updateProduct(index, "name", event.target.value)} /></label><label>Dilution or dose (optional)<input maxLength={80} placeholder="e.g. 1:100 or 10 mL/L" value={item.dilution} onChange={(event) => updateProduct(index, "dilution", event.target.value)} /></label>{products.length > 1 && <button type="button" className="care-remove-product" aria-label={"Remove product " + (index + 1)} onClick={() => setProducts(products.filter((_, i) => i !== index))}>Remove</button>}</div>)}<button type="button" className="care-text-action" disabled={products.length >= 8} onClick={() => setProducts([...products, emptyProduct()])}>+ Add another product</button></fieldset>
            <fieldset className="care-crops"><legend>Crops treated <small>(all matching current plantings)</small></legend><div className="care-crop-grid">{cropOptions.map((name) => <label key={name} className="care-crop"><input type="checkbox" checked={selectedCrops.some((crop) => normalizeCareCrop(crop) === normalizeCareCrop(name))} onChange={() => toggleCrop(name)} /><span>{name}</span></label>)}</div><div className="care-custom-crop"><input aria-label="Other crop name" maxLength={120} placeholder="Other crop" value={customCrop} onChange={(event) => setCustomCrop(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomCrop(); } }} /><button type="button" onClick={addCustomCrop} disabled={!customCrop.trim()}>Add crop</button></div></fieldset>
            <label className="care-field">How was it applied? (optional)<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Not recorded</option><option value="Soil drench / base of plants">Soil drench / base of plants</option><option value="Foliar spray">Foliar spray</option><option value="Granules / top dressing">Granules / top dressing</option><option value="Other">Other</option></select></label>
            {kind === "spray" && <div className="care-safety"><label className="care-field">Withholding period in days (from product label; optional)<input type="number" min={0} max={365} step={1} value={withholdingDays} onChange={(event) => setWithholdingDays(event.target.value)} placeholder="Unknown" /></label><p>Check the exact product label for crop approval, dilution, re-entry and harvest withholding. Unknown is not zero days.</p></div>}
            <label className="care-field">Notes (optional)<textarea maxLength={2000} rows={3} placeholder="Weather, observations, follow-up…" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            {error && <p className="care-message error" role="alert">{error}</p>}{success && <p className="care-message success" role="status">{success}</p>}
            <button className="care-submit" type="submit" disabled={saving || loading || !selectedCrops.length}>{saving ? "Saving…" : "Save treatment"}</button>
            <p className="care-access">Protected by your existing garden edit key. To set it, open <Link href="/planner">Planner → Settings</Link>.</p>
          </form>
        </section>
        <section className="care-panel care-history" aria-labelledby="care-history-title"><div className="care-panel-heading"><span>02 / FIELD HISTORY</span><h2 id="care-history-title">Application history</h2><p>{gardenId ? "Garden: " + gardenId : "Loading garden…"} · {records.length} recorded application{records.length === 1 ? "" : "s"}</p></div>
          <div className="care-history-filter" role="group" aria-label="Filter application history"><button type="button" className={filter === "all" ? "active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button><button type="button" className={filter === "fertiliser" ? "active" : ""} aria-pressed={filter === "fertiliser"} onClick={() => setFilter("fertiliser")}>Fertilisers</button><button type="button" className={filter === "spray" ? "active" : ""} aria-pressed={filter === "spray"} onClick={() => setFilter("spray")}>Sprays</button></div>
          {loading && <p className="care-empty">Loading treatment history…</p>}
          {!loading && !shown.length && <p className="care-empty">No {filter === "all" ? "treatments" : filter === "spray" ? "sprays" : "fertilisers"} recorded yet. Use the form to add the first one.</p>}
          <div className="care-timeline">{shown.map((record) => <article className="care-entry" key={record.id}><div className="care-entry-top"><div><span className={"care-kind " + record.kind}>{record.kind === "fertiliser" ? "FERTILISED" : "SPRAYED"}</span><time dateTime={record.occurredOn}>{careDateLabel(record.occurredOn)}</time></div><button type="button" disabled={saving} onClick={() => void remove(record.id)} aria-label={"Delete treatment from " + careDateLabel(record.occurredOn)}>Delete</button></div><h3>{record.products.map((product) => product.name).join(" + ")}</h3><p className="care-entry-crops">{record.crops.join(" · ")}</p><ul>{record.products.map((product, i) => <li key={i}>{product.name}{product.dilution ? " — " + product.dilution : ""}</li>)}</ul>{record.method && <p>Application: {record.method}</p>}{record.kind === "spray" && <p>Withholding: {record.withholdingDays == null ? "Not recorded — consult label" : record.withholdingDays + " days"}</p>}{record.notes && <p className="care-entry-notes">{record.notes}</p>}</article>)}</div>
          <p className="care-history-foot">The plan shows the last recorded treatment per planting, not a claim that a treatment is still active. Deleted records disappear from the plan markers.</p>
        </section>
      </div>
    </div>
  </main>;
}
