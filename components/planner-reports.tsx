"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { planInPeriod, type PlanningPeriod } from "@/lib/garden/planting-schedule";
import { groupedPlantList, plantListRows, partsListRows, csvText, planSvg } from "@/lib/garden/plan-reports";
import type { RecoveryRequest } from "@/lib/garden/schedule-recovery";
import { SuccessionTimeline, type SuccessionSave } from "./succession-timeline";
import type { BedGrowingConditions } from "@/lib/garden/bed-growing-conditions";
import type { PlantOption } from "@/lib/garden/plant-catalog";
import { PlantingCalendar } from "./planting-calendar";
import type { CalendarPlanting } from "@/lib/garden/planting-calendar";
import type { PlantingSchedule } from "@/lib/garden/planting-schedule";
import { PlannerPlantArt as PlantArt } from "./planner-art";

type Report = "plants" | "parts" | "calendar" | "succession" | "export";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openPlannerReport(report: Report, bedId?: number) {
  window.dispatchEvent(new CustomEvent("garden-report-open", { detail: bedId === undefined ? report : { report, bedId } }));
}

export function PlannerReports({ plan, period, gardenId, planUnavailable, saveBusy, onSaveSuccession, onSaveBedConditions, onApplyRecovery, onPeriodChange, onDatesChange, onShowPlanting }: {
  plan: PlannerPlan;
  period?: PlanningPeriod;
  gardenId: string;
  planUnavailable: boolean;
  saveBusy: boolean;
  onSaveSuccession: (bedId: number, crop: PlantOption, variety: string, schedule: PlantingSchedule, conditions?: BedGrowingConditions) => Promise<SuccessionSave>;
  onApplyRecovery: (request: RecoveryRequest) => Promise<SuccessionSave>;
  onSaveBedConditions: (bedId: number, conditions?: BedGrowingConditions) => Promise<SuccessionSave>;
  onPeriodChange?: (period: PlanningPeriod) => void;
  onDatesChange?: (kind: "row" | "planting", id: string, dates?: PlantingSchedule) => void;
  onShowPlanting?: (planting: CalendarPlanting) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [report, setReport] = useState<Report>("plants");
  const [scope, setScope] = useState("all");
  const [query, setQuery] = useState("");
  const [grouping, setGrouping] = useState("variety");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [reportBed, setReportBed] = useState<number>();
  useEffect(() => {
    if (active && report === "export") dialog.current?.showModal();
    window.dispatchEvent(new CustomEvent("garden-report-view", { detail: active ? report : null }));
  }, [active, report]);
  const plants = useMemo(() => {
    if (!active || report !== "plants") return [];
    const source = scope === "month" ? planInPeriod(plan, period) : plan;
    const rows = grouping === "variety" ? groupedPlantList(source) : plantListRows(source);
    const needle = query.toLowerCase();
    return rows.filter((row) => `${row.crop} ${row.variety} ${row.location}`.toLowerCase().includes(needle))
      .sort((a, b) => grouping === "bed" ? a.location.localeCompare(b.location) : a.crop.localeCompare(b.crop));
  }, [active, report, plan, period, scope, grouping, query]);
  const parts = useMemo(() => active && report === "parts" ? partsListRows(plan) : [], [active, report, plan]);

  function open(next: Report) {
    setReportBed(undefined);
    setReport(next);
    setError("");
    setActive(true);
  }

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<string | { report: string; bedId: number } | null>).detail;
      const request = typeof detail === "object" && detail !== null ? detail : undefined;
      const next = request?.report ?? detail;
      if (next === "plants" || next === "parts" || next === "calendar" || next === "succession" || next === "export") {
        setReportBed(request?.bedId);
        setReport(next);
        setError("");
        setActive(true);
      }
    };
    window.addEventListener("garden-report-open", receive);
    const close = () => setActive(false);
    window.addEventListener("garden-report-close", close);
    return () => {
      window.removeEventListener("garden-report-open", receive);
      window.removeEventListener("garden-report-close", close);
    };
  }, []);

  function exportCsv() {
    const rows = report === "parts"
      ? [["Part", "Quantity", "Unit"], ...parts.map((row) => [row.part, row.quantity.toFixed(2), row.unit])]
      : [["Plant", "Variety", "Location", "Quantity", "Spacing (cm)", "From", "Until"], ...plants.map((row) => [row.crop, row.variety, row.location, row.quantity, row.spacingCm, row.from ?? "", row.until ?? ""])];
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

  const content = <>
      <header><div><h2 id="planner-report-title">{report === "plants" ? "Plant List" : report === "parts" ? "Parts List" : report === "calendar" ? "Planting Calendar" : report === "succession" ? "Succession planting" : "Export plan"}</h2></div><button type="button" onClick={() => setActive(false)}>Close</button></header>
      {report === "plants" && <>
        <div className="report-controls"><label>Search plantings<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Plant, variety or bed" /></label><label>Show plantings<select aria-label="Show plantings" value={scope} onChange={event => setScope(event.target.value)}><option value="all">All dates</option><option value="month">Selected month</option></select></label><label>Group by<select value={grouping} onChange={(event) => setGrouping(event.target.value)}><option value="variety">Variety</option><option value="individual">Individual plantings</option><option value="bed">Beds and rows</option></select></label></div>
        <p>{plants.reduce((sum, row) => sum + row.quantity, 0)} plants · {plants.length} {grouping === "variety" ? "varieties" : "plantings"}</p>
        <div className="report-scroll"><table><thead><tr><th>Plant / variety</th><th>Location</th><th>Quantity</th><th>Spacing</th><th>From</th><th>Until</th></tr></thead><tbody>{plants.map((row) => <tr key={row.id}><td><span className="report-plant-art"><PlantArt crop={row.crop} variety={row.variety} fallback="🌱" /></span><strong>{row.crop}</strong><small>{row.variety}</small></td><td>{row.location}</td><td>{row.quantity}</td><td>{row.spacingCm} cm</td><td>{row.from ?? "Any time"}</td><td>{row.until ?? "Ongoing"}</td></tr>)}</tbody></table>{!plants.length && <p>No plantings match. Add plants to the plan or change your search.</p>}</div>
      </>}
      {report === "parts" && <>
        <p>Measurements come from the current plan. Allow for cuts, joins and waste when ordering materials.</p>
        <div className="report-scroll"><table><thead><tr><th>Part</th><th>Quantity</th><th>Unit</th></tr></thead><tbody>{parts.map((row) => <tr key={row.part}><td>{row.part}</td><td>{row.unit === "each" ? row.quantity : row.quantity.toFixed(2)}</td><td>{row.unit}</td></tr>)}</tbody></table>{!parts.length && <p>Add beds, paths, trellises or structures to generate a parts list.</p>}</div>
      </>}
      {report === "calendar" && <><button className="calendar-succession-link" type="button" onClick={() => open("succession")}>Succession planting</button><PlantingCalendar plan={plan} period={period} onPeriodChange={onPeriodChange} onDatesChange={onDatesChange} onShowPlanting={onShowPlanting} /></>}
      {report === "succession" && (planUnavailable
        ? <p role="status">Open a saved garden to plan its succession.</p>
        : <SuccessionTimeline key={`${gardenId}:${reportBed ?? ""}`} initialBedId={reportBed} plan={plan} gardenId={gardenId} busy={saveBusy} onSave={onSaveSuccession} onSaveConditions={onSaveBedConditions} onApplyRecovery={onApplyRecovery} />)}
      {report === "plants" || report === "parts" ? <footer><button type="button" onClick={exportCsv}>Export CSV</button><button type="button" onClick={() => window.print()}>Print list</button></footer> : report === "export" ? <div className="report-export-actions">
        <p>Export the current design, including unsaved edits. The image is a measured schematic with planting labels and counts.</p>
        <button type="button" onClick={() => download(new Blob([JSON.stringify({ format: "blenheim-garden", version: 1, plan }, null, 2)], { type: "application/json" }), "garden-plan.json")}>Download JSON backup</button>
        <button type="button" onClick={() => download(new Blob([planSvg(plan, "Blenheim Garden")], { type: "image/svg+xml" }), "garden-plan.svg")}>Download SVG plan</button>
        <button type="button" disabled={busy} onClick={() => void exportPng()}>{busy ? "Generating image…" : "Download PNG plan"}</button>
        {error && <p role="alert">{error}</p>}
      </div> : null}
    </>;
  return <>
    {active && createPortal(report === "export"
      ? <dialog ref={dialog} className="planner-report" aria-labelledby="planner-report-title" onClose={() => setActive(false)}>{content}</dialog>
      : <section className="planner-report planner-report-workspace" role="dialog" aria-modal="false" aria-labelledby="planner-report-title" onKeyDown={(event) => { if (event.key === "Escape") setActive(false); }}>{content}</section>, document.body)}
  </>;
}
