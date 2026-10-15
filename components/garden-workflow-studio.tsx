"use client";

import { useEffect, useRef, useState } from "react";
import { capturePlantedTemplate, defaultLayoutRequest, parsePlantedTemplates, plantedTemplatesKey, proposeGardenLayout, timelinePhase, type LayoutRequest, type PlantedBedTemplate } from "@/lib/garden/garden-workflows";
import { plantingSurfaces } from "@/lib/garden/planting-surfaces";
import { layoutSummary } from "@/lib/garden/garden-design-layouts";
import { plants } from "@/lib/garden/plant-catalog";
import { seasonalBedCrops, blenheimSeason } from "@/lib/garden/seasonal-bed-layout";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import type { Garden3DEditor } from "./use-garden-3d-editor";

function Timeline({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const t = editor.timeline;
  const days = Math.round((Date.parse(t.date) - Date.parse(t.plantedOn)) / 86400000);
  const updateDays = (n: number) => editor.setTimeline({ ...t, enabled: true, date: new Date(Date.parse(t.plantedOn + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10) });
  return <>
    <p>Preview sowing, growth and harvest without changing plant counts or saved history. Enter timing from your seed packet; defaults are visual estimates.</p>
    <label>Timeline bed<select aria-label="Timeline bed" value={t.surfaceId} onChange={(e) => editor.setTimeline({ ...t, surfaceId: e.target.value })}><option value="">Whole garden</option>{plantingSurfaces(editor.plan).map((s) => <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>{s.label}</option>)}</select></label>
    <label>Assumed planting date<input type="date" value={t.plantedOn} onChange={(e) => { if (e.target.value) editor.setTimeline({ ...t, plantedOn: e.target.value }); }} /></label>
    <div className="garden-workflow-grid"><label>Days to maturity<input type="number" min={1} max={730} value={t.matureDays} onChange={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= 730) editor.setTimeline({ ...t, matureDays: n, harvestDays: Math.max(n, t.harvestDays) }); }} /></label><label>Days to harvest / clear<input type="number" min={t.matureDays} max={730} value={t.harvestDays} onChange={(e) => { const n = Number(e.target.value); if (n >= t.matureDays && n <= 730) editor.setTimeline({ ...t, harvestDays: n }); }} /></label></div>
    <label>Preview date<input type="date" value={t.date} onChange={(e) => { if (e.target.value) editor.setTimeline({ ...t, enabled: true, date: e.target.value }); }} /></label>
    <label>Days after planting: {days}<input aria-label="Timeline days ahead" type="range" min={-7} max={Math.min(737, t.harvestDays + 7)} value={days} onChange={(e) => updateDays(Number(e.target.value))} /></label>
    <div className="garden-design-buttons"><button type="button" onClick={() => updateDays(0)}>Seedlings</button><button type="button" onClick={() => updateDays(t.matureDays)}>At maturity</button><button type="button" onClick={() => updateDays(t.harvestDays)}>After harvest</button></div>
    <p role="status">Preview: {timelinePhase(t)} · actual saved plants retained</p>
    <div className="garden-design-buttons"><button type="button" onClick={() => { editor.setTimeline({ ...t, enabled: true }); onClose(); }}>View timeline in garden</button><button type="button" onClick={editor.cancelPreview}>Back to editing</button></div>
  </>;
}
function Templates({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const [loaded] = useState(() => { try { return { entries: parsePlantedTemplates(localStorage.getItem(plantedTemplatesKey(editor.gardenId))), error: "" }; } catch (error) { return { entries: [], error: error instanceof Error ? error.message : "Cannot read templates." }; } });
  const [entries, setEntries] = useState<PlantedBedTemplate[]>(loaded.entries), [name, setName] = useState("");
  const store = (next: PlantedBedTemplate[]) => { if (JSON.stringify(next).length > 4000000) throw new Error("Templates exceed browser storage limits."); localStorage.setItem(plantedTemplatesKey(editor.gardenId), JSON.stringify(next)); setEntries(next); };
  return <>
    <p>Save the selected bed with its crops, spacing, plant counts and growing conditions. Templates stay in this browser, separately for each garden.</p>
    {loaded.error && <p role="alert">{loaded.error}</p>}
    <label>Planted template name<input maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></label>
    <button type="button" disabled={!editor.selection || !name.trim()} onClick={() => { try { const entry = capturePlantedTemplate(editor.plan, editor.selection!, name); const current = parsePlantedTemplates(localStorage.getItem(plantedTemplatesKey(editor.gardenId))); store([...current.filter((t) => t.name !== entry.name), entry].slice(-30)); setName(""); } catch (error) { editor.setError(error instanceof Error ? error.message : "Cannot save this template."); } }}>Save planted template</button>
    <div className="garden-planted-template-list">{entries.map((t) => <article key={t.id}><div><strong>{t.name}</strong><small>{layoutSummary(t.plan).plants} plants · {t.plan.plantingAreas.map((a) => a.crop).concat(t.plan.rows.map((r) => r.crop)).filter((crop, i, names) => names.indexOf(crop) === i).join(", ") || "Empty bed"}</small></div><button type="button" onClick={() => { if (editor.useTemplate(t)) onClose(); }}>Place template</button><button type="button" aria-label={`Remove template ${t.name}`} onClick={() => { try { store(parsePlantedTemplates(localStorage.getItem(plantedTemplatesKey(editor.gardenId))).filter((e) => e.id !== t.id)); } catch (error) { editor.setError(error instanceof Error ? error.message : "Cannot remove template."); } }}>Remove</button></article>)}</div>
    {!entries.length && <p>No planted templates yet. Select a bed or container first.</p>}
  </>;
}
function LayoutAssistant({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const [request, setRequest] = useState<LayoutRequest>(() => defaultLayoutRequest(editor.plan));
  const [proposals, setProposals] = useState<{ name: string; plan: PlannerPlan }[]>([]), [basis, setBasis] = useState("");
  const update = (value: Partial<LayoutRequest>) => { setRequest({ ...request, ...value }); setProposals([]); };
  const suitable = seasonalBedCrops(request.month);
  return <>
    <p>Keep existing structures and measured beds. Add new beds only when requested; locked beds and their plantings stay fixed. Compare a planting proposal before applying it.</p>
    <div className="garden-workflow-grid"><label>Priority<select aria-label="Priority" value={request.priority} onChange={(e) => update({ priority: e.target.value as LayoutRequest["priority"] })}><option value="access">Easy access · balanced crops</option><option value="yield">Maximum plant count · best fit</option></select></label><label>Planting month<select aria-label="Planting month" value={request.month} onChange={(e) => update({ month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{new Intl.DateTimeFormat("en-NZ", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m, 15)))} · {blenheimSeason(m)}</option>)}</select></label></div>
    <fieldset className="garden-assistant-crops"><legend>Requested crops</legend>{plants.filter((p) => p.type === "Vegetable" || p.type === "Herb").map((p) => <label key={p.name}><input type="checkbox" checked={request.crops.includes(p.name)} onChange={() => update({ crops: request.crops.includes(p.name) ? request.crops.filter((c) => c !== p.name) : [...request.crops, p.name] })} />{p.name}</label>)}</fieldset>
    <p>Seasonal starter crops: {suitable.join(", ")}. Out-of-season requests are planning previews; check local frost and crop guidance before planting.</p>
    <div className="garden-workflow-grid"><label>New beds<input type="number" min={0} max={8} value={request.newBeds} onChange={(e) => update({ newBeds: Number(e.target.value) })} /></label><label>New bed width (cm)<input type="number" min={40} max={1000} value={request.width} onChange={(e) => update({ width: Number(e.target.value) })} /></label><label>New bed depth (cm)<input type="number" min={40} max={1000} value={request.depth} onChange={(e) => update({ depth: Number(e.target.value) })} /></label></div>
    <label className="garden-design-check"><input type="checkbox" checked={request.replace} onChange={(e) => update({ replace: e.target.checked })} />Preview replacing plants in unlocked beds</label>
    <button type="button" disabled={!request.crops.length} onClick={() => { try { const first = proposeGardenLayout(editor.plan, request), second = proposeGardenLayout(editor.plan, { ...request, priority: "access" }, true); setProposals([{ name: request.priority === "yield" ? "Best fit" : "Balanced beds", plan: first }, { name: "Reach from edges", plan: second }]); setBasis(JSON.stringify(editor.plan)); editor.setError(null); } catch (error) { editor.setError(error instanceof Error ? error.message : "Cannot propose this layout."); } }}>Generate layout proposals</button>
    {proposals.map((p) => { const metrics = layoutSummary(p.plan), used = new Set([...p.plan.plantingAreas, ...p.plan.rows].map((g) => g.crop)); return <article className="garden-layout-proposal" key={p.name}><strong>{p.name}</strong><p>{metrics.beds} beds · {metrics.plants} plants · {metrics.width} × {metrics.depth} m</p><p>Crops used: {[...used].join(", ")}</p><button type="button" onClick={() => { if (basis !== JSON.stringify(editor.plan)) { editor.setError("The garden changed. Generate new proposals."); return; } if (editor.preview(p.plan, p.name)) { editor.fit(); onClose(); } }}>Preview {p.name}</button></article>; })}
    <p>Proposals use catalogue mature spacing and recorded soil/sun inputs. The edge-access alternative leaves a central planting gap. Compare counts, access and the actual garden before applying. Apply is one Undo operation; Save persists it.</p>
  </>;
}
export function GardenWorkflowStudio({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null), [tab, setTab] = useState("Timeline");
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="garden-bed-dialog garden-design-dialog garden-workflow-studio" aria-label="Garden studio" onCancel={onClose}>
    <header className="garden-bed-dialog-heading"><h2>Garden studio</h2><button type="button" onClick={onClose}>Close</button></header>
    <nav className="garden-design-tabs" aria-label="Garden studio sections">{["Timeline", "Templates", "Layout assistant"].map((label) => <button key={label} type="button" aria-pressed={tab === label} onClick={() => setTab(label)}>{label}</button>)}</nav>
    <div className="garden-design-body">{tab === "Timeline" ? <Timeline editor={editor} onClose={onClose} /> : tab === "Templates" ? <Templates editor={editor} onClose={onClose} /> : <LayoutAssistant editor={editor} onClose={onClose} />}{editor.error && <p role="alert">{editor.error}</p>}</div>
  </dialog>;
}
