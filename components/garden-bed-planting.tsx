"use client";

import { useEffect, useRef, useState } from "react";
import { plantingSurfaces, surfaceAt, surfaceLocal, type PlantingSurface } from "@/lib/garden/planting-surfaces";
import { areaPlants, rowPlants } from "@/lib/garden/plan-editing";
import { applySeasonalBedLayout, blenheimMonth, blenheimSeason, clearSurfacePlants, generateSeasonalBedLayout, seasonalBedCrops } from "@/lib/garden/seasonal-bed-layout";
import { BLENHEIM_CALENDAR_SOURCES, blenheimFrostForMonth } from "@/lib/garden/blenheim-calendar";
import type { Garden3DEditor } from "./use-garden-3d-editor";
import type { PlannerPlan } from "@/lib/garden/planner-plan";

const colors = ["#94c565", "#eaa954", "#71b4a5", "#d67b58"];
const key = (surface: PlantingSurface) => `${surface.kind}:${surface.id}`;

function layoutPreview(plan: PlannerPlan, surface: PlantingSurface | undefined, month: number, choice: string, replace: boolean) {
  try {
    return { layout: surface ? generateSeasonalBedLayout(replace ? clearSurfacePlants(plan, surface) : plan, surface, month, choice) : null, error: null };
  } catch (error) { return { layout: null, error: error instanceof Error ? error.message : "Unable to generate this layout." }; }
}

export function GardenBedPlanting({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surfaces = plantingSurfaces(editor.plan);
  const selected = surfaces.find((surface) => surface.id === editor.selection?.id && surface.kind === editor.selection.kind);
  const [surfaceKey, setSurfaceKey] = useState(selected ? key(selected) : surfaces[0] ? key(surfaces[0]) : "");
  const [month, setMonth] = useState(blenheimMonth);
  const [choice, setChoice] = useState("mix");
  const [replace, setReplace] = useState(false);
  const surface = surfaces.find((item) => key(item) === surfaceKey) ?? surfaces[0];
  const { layout: preview, error: previewError } = layoutPreview(editor.plan, surface, month, choice, replace);
  const frost = blenheimFrostForMonth(month);
  const cropNames = [...new Set(preview?.positions.map((point) => point.crop) ?? [])];
  const existingPoints = surface ? [...editor.plan.plantingAreas.flatMap((area) => areaPlants(editor.plan, area)), ...editor.plan.rows.flatMap(rowPlants)]
    .filter((point) => { const owner = surfaceAt(editor.plan, point); return owner?.id === surface.id && owner.kind === surface.kind; }) : [];
  useEffect(() => { dialog.current?.showModal(); }, []);
  const selectSurface = (next: PlantingSurface) => {
    setSurfaceKey(key(next)); setReplace(false); editor.setSelection({ kind: next.kind, id: next.id });
  };
  const apply = () => {
    if (!preview?.positions.length) return;
    if (editor.action((plan) => applySeasonalBedLayout(replace ? clearSurfacePlants(plan, preview.surface) : plan, preview))) {
      editor.setSelection({ kind: preview.surface.kind, id: preview.surface.id });
      editor.setTool("select"); onClose();
    }
  };
  return <dialog ref={dialog} className="garden-bed-dialog" aria-labelledby="bed-planting-title" onCancel={onClose}>
    <div className="garden-bed-dialog-heading"><div><small>BLENHEIM · NEW ZEALAND</small><h2 id="bed-planting-title">Plant a bed</h2></div><button type="button" onClick={onClose} aria-label="Close bed planting">×</button></div>
    <div className="garden-bed-dialog-body">
      <label>Planting bed<select value={surface ? key(surface) : ""} onChange={(e) => { const next = surfaces.find((item) => key(item) === e.target.value); if (next) selectSurface(next); }}>
        {!surfaces.length && <option value="">Add a bed or planter first</option>}
        {surfaces.map((item) => <option key={key(item)} value={key(item)}>{item.label}</option>)}
      </select></label>
      {surface && <p className="garden-bed-dimensions">{Math.round(surface.width)} × {Math.round(surface.depth)} cm usable soil · {Math.round(surface.height * 100)} cm above ground</p>}
      <div className="garden-bed-options">
        <label>Planting month<select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setChoice("mix"); }}>{Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{blenheimFrostForMonth(m).monthName} · {blenheimSeason(m)}</option>)}</select></label>
        <label>Layout crops<select value={choice} onChange={(e) => setChoice(e.target.value)}><option value="mix">Seasonal mix</option>{seasonalBedCrops(month).map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>
      <p className="garden-bed-season-note">{blenheimSeason(month)} in Blenheim · {frost.risk} frost risk. {frost.averageGroundFrostDays > 0 ? `Historical average: ${frost.averageGroundFrostDays.toFixed(1)} ground-frost days in ${frost.monthName}. ` : ""}{month === 9 ? "Hardy crops now; keep tomatoes and basil protected until conditions warm. " : ""}Check the local forecast before planting tender crops.</p>
      {!!existingPoints.length && <label className="garden-bed-replace"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />Replace this bed’s plants</label>}
      {preview && <>
        <svg className="garden-bed-layout-preview" viewBox={`0 0 ${surface!.width + 20} ${surface!.depth + 20}`} role="img" aria-label="Seasonal planting layout preview">
          <rect width="100%" height="100%" fill="#f2e7d0" />
          {surface!.shape === "circle" || surface!.shape === "keyhole" ? <circle cx={surface!.width / 2 + 10} cy={surface!.depth / 2 + 10} r={surface!.width / 2} fill="#674732" /> : <rect x="10" y="10" width={surface!.width} height={surface!.depth} rx="3" fill="#674732" />}
          {surface!.shape === "keyhole" && <><circle cx={surface!.width / 2 + 10} cy={surface!.depth / 2 + 10} r={surface!.structure!.widthCm * .09} fill="#b49677" /><rect x={surface!.width / 2 + 10 - surface!.structure!.widthCm * .105} y={surface!.depth / 2 + 10 + surface!.structure!.widthCm * .115} width={surface!.structure!.widthCm * .21} height={surface!.depth / 2} fill="#b49677" /></>}
          {preview.positions.map((point, index) => { const local = surfaceLocal(surface!, point); return <circle key={index} cx={local.x + surface!.width / 2 + 10} cy={local.y + surface!.depth / 2 + 10} r={Math.max(2, point.spacing * .32)} fill={colors[cropNames.indexOf(point.crop) % colors.length]} stroke="#e0efc5" strokeWidth=".8"><title>{point.crop} · {point.spacing} cm spacing</title></circle>; })}
          {!replace && existingPoints.map((point) => { const local = surfaceLocal(surface!, point); return <circle key={point.id} cx={local.x + surface!.width / 2 + 10} cy={local.y + surface!.depth / 2 + 10} r="4" fill="#ccd3c3" stroke="#fff" strokeWidth="1"><title>Existing plant · kept</title></circle>; })}
        </svg>
        <ul className="garden-bed-layout-crops">{cropNames.map((name, index) => { const points = preview.positions.filter((point) => point.crop === name); return <li key={name}><i style={{ background: colors[index % colors.length] }} />{points.length} {name} · {points[0].variety} · {points[0].spacing} cm</li>; })}</ul>
        <p aria-live="polite">{preview.positions.length ? `${preview.positions.length} new plants · ${preview.existing} existing ${preview.existing === 1 ? "plant" : "plants"} kept` : surface!.shape === "cells" ? "Seed trays are for propagation. Plant seedlings manually, or select a larger bed for a mature crop layout." : "No room at the recommended spacing. Choose a smaller crop or enlarge this bed."}</p>
        {!!existingPoints.length && <p className="garden-bed-dimensions">{replace ? `${existingPoints.length} existing ${existingPoints.length === 1 ? "plant will" : "plants will"} be replaced in ${surface!.label}. Other beds stay unchanged.` : "Grey markers are existing plants. The layout fills free space around them."}</p>}
      </>}
      <p className="garden-bed-guidance-sources">Seasonal guidance, using monthly climate averages. <a href={BLENHEIM_CALENDAR_SOURCES[1].href} target="_blank" rel="noreferrer">NIWA frost data</a> · <a href="https://www.yates.co.nz/ideas-plans/garden-calendar/yearly/" target="_blank" rel="noreferrer">Yates NZ calendar</a></p>
      {editor.error && <p role="alert">{editor.error}</p>}
      {previewError && <p role="alert">{previewError}</p>}
    </div>
    <div className="garden-bed-dialog-actions"><button type="button" disabled={!surface} onClick={() => { if (surface) selectSurface(surface); editor.setTool("plant"); onClose(); }}>Plant manually</button><button className="garden-bed-apply" type="button" disabled={!preview?.positions.length} onClick={apply}>{replace ? "Replace with seasonal layout" : "Apply seasonal layout"}</button></div>
    <p className="garden-bed-save-note">Undo reverses the layout. Use Save to persist it.</p>
  </dialog>;
}
