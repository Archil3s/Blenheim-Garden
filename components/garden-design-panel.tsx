"use client";

import { useEffect, useRef, useState } from "react";
import type { Garden3DEditor } from "./use-garden-3d-editor";
import { accessIssues, blenheimSun, defaultDesignSettings } from "@/lib/garden/garden-design";
import { captureLayout, layoutsKey, layoutSummary, parseSavedLayouts, type SavedGardenLayout } from "@/lib/garden/garden-design-layouts";

export function GardenDesignPanel({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("Editing");
  const [name, setName] = useState("");
  const [layouts, setLayouts] = useState<SavedGardenLayout[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const settings = editor.plan.designSettings ?? defaultDesignSettings;
  const issues = accessIssues(editor.plan), saved = layouts.find((l) => l.id === selectedId);
  const summary = layoutSummary(editor.plan), alternative = saved ? layoutSummary(saved.plan) : null;
  const sun = blenheimSun(editor.sunPreview.date, editor.sunPreview.hour, settings.northDeg);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const showLayouts = () => {
    try { const list = parseSavedLayouts(localStorage.getItem(layoutsKey(editor.gardenId))); setLayouts(list); setSelectedId(list[0]?.id ?? ""); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Could not read layouts."); }
  };
  const update = (field: "northDeg" | "walkwayCm", value: number) => value === settings[field] ? false : editor.action((p) => ({ ...p, designSettings: { ...(p.designSettings ?? defaultDesignSettings), [field]: value } }));
  return <dialog ref={dialogRef} className="garden-bed-dialog garden-design-dialog" aria-label="Garden design tools" onCancel={onClose}>
    <div className="garden-bed-dialog-heading"><div><small>EDIT AND PLAN</small><h2>Garden design</h2></div><button type="button" aria-label="Close design tools" onClick={onClose}>×</button></div>
    <nav className="garden-design-tabs" aria-label="Design sections">{["Editing", "Access", "Sun", "Layouts"].map((label) => <button key={label} type="button" aria-pressed={tab === label} onClick={() => { setTab(label); setNotice(""); if (label === "Layouts") showLayouts(); }}>{label}</button>)}</nav>
    <div className="garden-design-body">
      {tab === "Editing" && <>
        <p>Select a bed or structure to reveal its move arrows, eight resize handles and rotation ring. Drag an object directly; drag empty ground to orbit.</p>
        <p>Numbered beds turn in 90° steps and keep their plants. Raised-bed structures support other angles. Focus bed enlarges the handles while retaining Top view.</p>
        <label className="garden-design-check"><input type="checkbox" checked={editor.smartSnap} onChange={(e) => editor.setSmartSnap(e.target.checked)} />Align edges, centres and walkway gaps</label>
        <label className="garden-design-check"><input type="checkbox" checked={editor.spacingVisible} onChange={(e) => editor.setSpacingVisible(e.target.checked)} />Show mature spacing circles</label>
        <p>Green previews fit; red previews explain a blocked position. Paths remain clear when beds are moved or resized. Existing layout conflicts can be reduced.</p>
        <div className="garden-design-buttons"><button type="button" onClick={() => { editor.setTool("box-select"); onClose(); }}>Box select</button><button type="button" onClick={() => { editor.selectCrops(true); onClose(); }}>Select vegetables</button><button type="button" onClick={() => { editor.selectCrops(); onClose(); }}>Select all plants</button></div>
      </>}
      {tab === "Access" && <>
        <label>Preferred walkway width (cm)<input type="number" min={30} max={200} key={settings.walkwayCm} defaultValue={settings.walkwayCm} onBlur={(e) => { const n = Number(e.target.value); if (n >= 30 && n <= 200) update("walkwayCm", n); else e.target.value = String(settings.walkwayCm); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>
        <label className="garden-design-check"><input type="checkbox" checked={editor.accessVisible} onChange={(e) => editor.setAccessVisible(e.target.checked)} />Show access guides in garden</label>
        <p>Amber guides identify narrow gaps and reach concerns. Check routes from your entrance, and leave room for your own tools or mobility needs.</p>
        <ul className="garden-access-issues">{issues.map((issue) => <li key={issue.id}>{issue.message}</li>)}</ul>
        {!issues.length && <p>No narrow gaps or reach warnings were found.</p>}
        <p>Reach guidance uses 1.2 m across for access from both sides and 60 cm where boundary access is restricted. Rotated-object clearances are conservative bounds. <a href="https://www.rhs.org.uk/soil-composts-mulches/no-dig-gardening" target="_blank" rel="noreferrer">RHS bed guidance</a></p>
      </>}
      {tab === "Sun" && <>
        <label className="garden-design-check"><input type="checkbox" checked={editor.sunPreview.enabled} onChange={(e) => editor.setSunPreview({ ...editor.sunPreview, enabled: e.target.checked })} />Preview sunlight and shade</label>
        <label>True north direction (degrees clockwise from plan top)<input type="number" min={0} max={359} key={settings.northDeg} defaultValue={settings.northDeg} onBlur={(e) => { const n = Number(e.target.value); if (n >= 0 && n < 360) update("northDeg", n); else e.target.value = String(settings.northDeg); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>
        <label>Sun date<input type="date" value={editor.sunPreview.date} onChange={(e) => { if (e.target.value) editor.setSunPreview({ ...editor.sunPreview, date: e.target.value }); }} /></label>
        <label>NZ time: {String(Math.floor(editor.sunPreview.hour)).padStart(2, "0")}:{editor.sunPreview.hour % 1 ? "30" : "00"}<input aria-label="NZ sun hour" type="range" min={6} max={20} step={.5} value={editor.sunPreview.hour} onChange={(e) => editor.setSunPreview({ ...editor.sunPreview, hour: Number(e.target.value) })} /></label>
        <p data-testid="sun-position">Blenheim · UTC+{sun.zone} · Sun elevation {sun.altitude.toFixed(1)}° · bearing {sun.azimuth.toFixed(1)}°</p>
        <p>Approximate clear-sky shadows use your modelled bed, fence, structure and tree heights. Add neighbouring obstructions as structures. Sun direction needs your actual north setting; this is not a weather forecast. Below 5° elevation the shade overlay is hidden.</p>
        <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF" target="_blank" rel="noreferrer">Solar calculation source</a>
      </>}
      {tab === "Layouts" && <>
        <p>Keep up to ten alternatives for this named garden in this browser. Cloud Save still saves the active garden.</p>
        <label>Layout name<input maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Layout A" /></label>
        <button type="button" disabled={!name.trim()} onClick={() => {
          try { const list = captureLayout(parseSavedLayouts(localStorage.getItem(layoutsKey(editor.gardenId))), name, editor.plan); localStorage.setItem(layoutsKey(editor.gardenId), JSON.stringify(list)); setLayouts(list); setSelectedId(list.at(-1)!.id); setName(""); setNotice("Layout saved in this browser."); }
          catch (e) { setNotice(e instanceof Error ? e.message : "Could not store layout."); }
        }}>Save layout snapshot</button>
        <label>Saved layout<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Choose layout</option>{layouts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        {alternative && <table className="garden-layout-comparison"><thead><tr><th>Measure</th><th>Current</th><th>{saved!.name}</th></tr></thead><tbody>{(["beds", "structures", "plants", "width", "depth"] as const).map((key) => <tr key={key}><th>{key}{key === "width" || key === "depth" ? " (m)" : ""}</th><td>{summary[key]}</td><td>{alternative[key]}</td></tr>)}</tbody></table>}
        <div className="garden-design-buttons"><button type="button" disabled={!saved} onClick={() => { editor.setComparisonPlan(saved!.plan); onClose(); }}>Compare in garden</button><button type="button" disabled={!saved} onClick={() => { if (editor.restoreLayout(saved!.plan)) { editor.select(null); editor.setComparisonPlan(null); onClose(); } }}>Restore layout</button><button type="button" disabled={!editor.comparisonPlan} onClick={() => editor.setComparisonPlan(null)}>Stop comparison</button></div>
        <p>Comparison shows blue outlines from the alternative. Restore is one Undo step; use Save to persist it to the cloud.</p>
        <button type="button" disabled={!saved} onClick={() => { try { const list = parseSavedLayouts(localStorage.getItem(layoutsKey(editor.gardenId))).filter((l) => l.id !== selectedId); localStorage.setItem(layoutsKey(editor.gardenId), JSON.stringify(list)); setLayouts(list); setSelectedId(list[0]?.id ?? ""); editor.setComparisonPlan(null); setNotice("Snapshot removed."); } catch (e) { setNotice(e instanceof Error ? e.message : "Could not remove the snapshot."); } }}>Remove saved snapshot</button>
      </>}
      {notice && <p aria-live="polite">{notice}</p>}
      {editor.error && <p className="garden-design-error">{editor.error}</p>}
    </div>
    <div className="garden-bed-dialog-actions"><button type="button" onClick={onClose}>Return to garden</button></div>
  </dialog>;
}
