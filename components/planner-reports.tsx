"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { groupedPlantList, plantListRows, partsListRows, csvText, planSvg } from "@/lib/garden/plan-reports";
import { PlantArt } from "./plant-art";

type Report = "plants" | "parts" | "export";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PlannerReports({ plan }: { plan: PlannerPlan }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [report, setReport] = useState<Report>("plants");
  const [query, setQuery] = useState("");
  const [grouping, setGrouping] = useState("variety");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (active) dialog.current?.showModal();
  }, [active]);
  const plants = useMemo(() => {
    const rows = grouping === "variety" ? groupedPlantList(plan) : plantListRows(plan);
    const needle = query.toLowerCase();
    return rows.filter((row) => `${row.crop} ${row.variety} ${row.location}`.toLowerCase().includes(needle))
      .sort((a, b) => grouping === "bed" ? a.location.localeCompare(b.location) : a.crop.localeCompare(b.crop));
  }, [plan, grouping, query]);
  const parts = useMemo(() => partsListRows(plan), [plan]);

  function open(next: Report) {
    setReport(next);
    setError("");
    setActive(true);
  }

  useEffect(() => {
    const receive = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (next === "plants" || next === "parts" || next === "export") {
        setReport(next);
        setError("");
        setActive(true);
      }
    };
    window.addEventListener("garden-report-open", receive);
    return () => window.removeEventListener("garden-report-open", receive);
  }, []);

  function exportCsv() {
    const rows = report === "parts"
      ? [["Part", "Quantity", "Unit"], ...parts.map((row) => [row.part, row.quantity.toFixed(2), row.unit])]
      : [["Plant", "Variety", "Location", "Quantity", "Spacing (cm)"], ...plants.map((row) => [row.crop, row.variety, row.location, row.quantity, row.spacingCm])];
    download(new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" }), `garden-${report}.csv`);
  }

  async function exportPng() {
    setBusy(true);
    setError("");
    const url = URL.createObjectURL(new Blob([planSvg(plan, "Blenheim Garden")], { type: "image/svg+xml" }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = Math.round(image.naturalHeight * 2);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image export is unavailable in this browser.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not generate the image.")), "image/png"));
      download(blob, "garden-plan.png");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image export failed.");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  return <>
    <button type="button" onClick={() => open("plants")}>Plant List</button>
    <button type="button" onClick={() => open("parts")}>Parts List</button>
    <button type="button" onClick={() => open("export")}>Export plan</button>
    {active && createPortal(<dialog ref={dialog} className="planner-report" aria-labelledby="planner-report-title" onClose={() => setActive(false)}>
      <header><div><small>Blenheim Garden</small><h2 id="planner-report-title">{report === "plants" ? "Plant List" : report === "parts" ? "Parts List" : "Export plan"}</h2></div><button type="button" onClick={() => dialog.current?.close()}>Close</button></header>
      {report === "plants" && <>
        <div className="report-controls"><label>Search plantings<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Plant, variety or bed" /></label><label>Group by<select value={grouping} onChange={(event) => setGrouping(event.target.value)}><option value="variety">Variety</option><option value="individual">Individual plantings</option><option value="bed">Beds and rows</option></select></label></div>
        <p>{plants.reduce((sum, row) => sum + row.quantity, 0)} plants · {plants.length} {grouping === "variety" ? "varieties" : "plantings"}</p>
        <div className="report-scroll"><table><thead><tr><th>Plant / variety</th><th>Location</th><th>Quantity</th><th>Spacing</th></tr></thead><tbody>{plants.map((row) => <tr key={row.id}><td><span className="report-plant-art"><PlantArt crop={row.crop} variety={row.variety} fallback="🌱" /></span><strong>{row.crop}</strong><small>{row.variety}</small></td><td>{row.location}</td><td>{row.quantity}</td><td>{row.spacingCm} cm</td></tr>)}</tbody></table>{!plants.length && <p>No plantings match. Add plants to the plan or change your search.</p>}</div>
      </>}
      {report === "parts" && <>
        <p>Measurements come from the current plan. Allow for cuts, joins and waste when ordering materials.</p>
        <div className="report-scroll"><table><thead><tr><th>Part</th><th>Quantity</th><th>Unit</th></tr></thead><tbody>{parts.map((row) => <tr key={row.part}><td>{row.part}</td><td>{row.unit === "each" ? row.quantity : row.quantity.toFixed(2)}</td><td>{row.unit}</td></tr>)}</tbody></table>{!parts.length && <p>Add beds, paths, trellises or structures to generate a parts list.</p>}</div>
      </>}
      {report !== "export" ? <footer><button type="button" onClick={exportCsv}>Export CSV</button><button type="button" onClick={() => window.print()}>Print list</button></footer> : <div className="report-export-actions">
        <p>Export the current design, including unsaved edits. The image is a measured schematic with planting labels and counts.</p>
        <button type="button" onClick={() => download(new Blob([JSON.stringify({ format: "blenheim-garden", version: 1, plan }, null, 2)], { type: "application/json" }), "garden-plan.json")}>Download JSON backup</button>
        <button type="button" onClick={() => download(new Blob([planSvg(plan, "Blenheim Garden")], { type: "image/svg+xml" }), "garden-plan.svg")}>Download SVG plan</button>
        <button type="button" disabled={busy} onClick={() => void exportPng()}>{busy ? "Generating image…" : "Download PNG plan"}</button>
        {error && <p role="alert">{error}</p>}
      </div>}
    </dialog>, document.body)}
  </>;
}
