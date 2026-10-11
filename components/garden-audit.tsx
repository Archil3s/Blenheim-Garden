"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AuditCatalogue } from "@/lib/garden/audit-catalog";
import type { AuditMode, AuditRecord } from "./garden-audit-models";
import { matchesAudit, type SceneOptions, type SceneStats } from "./garden-audit-scene";

const Scene = dynamic(() => import("./garden-audit-scene").then((module) => module.GardenAuditScene), { ssr: false });
const summaryLabels: Record<string, string> = { crops: "Crop names / aliases", variants: "Plant entries", structureTypes: "Structure types", true3D: "True 3D", sprites: "Sprites", generic: "Generic fallbacks", missing: "Missing", warnings: "Warnings" };
const initial: SceneOptions = { lod: "High", mobile: false, mode: "Production", bounds: false, origins: false, grid: false, camera: "Overview", cameraRequest: 0, filter: "All", search: "", selected: "", screenshot: false };

export function GardenAudit({ catalogue }: { catalogue: AuditCatalogue }) {
  const inspector = useRef<HTMLElement>(null);
  const [options, setOptions] = useState(initial), [records, setRecords] = useState<AuditRecord[]>([]), [stats, setStats] = useState<SceneStats | null>(null), [error, setError] = useState("");
  const patch = (value: Partial<SceneOptions>) => setOptions((current) => ({ ...current, ...value }));
  const categories = useMemo(() => [...new Set(catalogue.entries.map((entry) => entry.category))], [catalogue]);
  const selected = records.find((record) => record.id === options.selected);
  const visible = records.filter((record) => matchesAudit(record, options.filter, options.search));
  const counts = { crops: catalogue.registryCrops, variants: catalogue.entries.filter((entry) => entry.kind === "plant").length, structureTypes: new Set(catalogue.entries.filter((entry) => entry.object?.type === "structure").map((entry) => entry.object?.type === "structure" && entry.object.kind)).size, true3D: records.filter((record) => record.badges.includes("TRUE 3D")).length, sprites: records.filter((record) => record.badges.some((badge) => badge.includes("SPRITE"))).length, generic: records.filter((record) => record.badges.includes("GENERIC FALLBACK")).length, missing: records.filter((record) => record.badges.some((badge) => badge === "MISSING" || badge === "ASSET ERROR")).length, warnings: records.filter((record) => record.warnings.length).length };
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOptions((current) => ({ ...current, screenshot: false })); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, []);
  const choose = (id: string) => { setOptions((current) => ({ ...current, selected: id, camera: "Close-up", cameraRequest: current.cameraRequest + 1 })); if (inspector.current) inspector.current.scrollTop = 0; };
  return <main className={`audit-page${options.screenshot ? " audit-screenshot" : ""}`}>
    <div className="audit-toolbar">
      <header><h1>3D visual audit</h1><a href="/3d">Garden editor</a><span>Isolated showroom · no garden state</span></header>
      <div className="audit-summary" data-testid="audit-summary" data-counts={JSON.stringify(counts)}>{Object.entries(counts).map(([key, value]) => <span key={key}>{summaryLabels[key]}: <b>{value}</b></span>)}</div>
      <div className="audit-controls">
        <button onClick={() => patch({ filter: "All", search: "", camera: "Overview", cameraRequest: options.cameraRequest + 1 })}>Show all</button>
        <label>Detail level<select aria-label="Detail level" value={options.lod} onChange={(event) => patch({ lod: event.target.value })}>{["High", "Medium", "Low"].map((level) => <option key={level}>{level}</option>)}</select></label>
        <label>Renderer<select aria-label="Renderer" value={options.mode} onChange={(event) => patch({ mode: event.target.value as AuditMode })}>{["Production", "Legacy artwork", "Legacy geometry"].map((mode) => <option key={mode}>{mode}</option>)}</select></label>
        <label>Filter<select aria-label="Filter" value={options.filter} onChange={(event) => patch({ filter: event.target.value })}>{[...new Set(["All", "Plants", "Structures", "Errors", "Fallbacks", "Sprites", "True 3D", "Missing", ...categories])].map((filter) => <option key={filter}>{filter}</option>)}</select></label>
        <label>Search<input type="search" value={options.search} placeholder="Crop, variety, ID" onChange={(event) => patch({ search: event.target.value })} /></label>
        <button className="audit-shot-button" onClick={() => patch({ screenshot: true })}>Screenshot mode</button>
      </div>
      <div className="audit-controls">{([ ["mobile", "Force mobile"], ["bounds", "Show bounds"], ["origins", "Show origins"], ["grid", "Measurement grid"] ] as const).map(([key, label]) => <label className="audit-check" key={key}><input type="checkbox" checked={options[key]} onChange={(event) => patch({ [key]: event.target.checked })} />{label}</label>)}<span>Medium = High alias · Low = production mobile geometry</span></div>
      <div className="audit-cameras">{["Overview", "Plant rows", "Structures", "Top-down", "Eye level", "Close-up"].map((camera) => <button key={camera} onClick={() => patch({ camera, cameraRequest: options.cameraRequest + 1 })}>{camera}</button>)}<label>Jump to zone<select value={categories.includes(options.camera) ? options.camera : ""} onChange={(event) => patch({ camera: event.target.value, cameraRequest: options.cameraRequest + 1 })}><option value="">Choose zone</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label></div>
    </div>
    <Scene catalogue={catalogue} options={options} onRecords={setRecords} onStats={setStats} onSelect={choose} onError={setError} />
    {error && <div role="alert" className="audit-error">{error}</div>}
    <aside className="audit-inspector" ref={inspector}>
      <h2>{selected ? `${selected.id} · ${selected.name}` : "Specimen inspector"}</h2>
      {selected ? <><p>{selected.variety}</p><dl><dt>Renderer / kind</dt><dd>{selected.renderer} / {selected.inferredKind}</dd><dt>Measured width × height × depth</dt><dd>{selected.bounds.map((value) => value.toFixed(3)).join(" × ")} m</dd><dt>{selected.kind === "plant" ? "Mature height / spread" : "Requested dimensions"}</dt><dd>{selected.kind === "plant" ? "Unknown — SIZE FALLBACK; measured geometry above" : selected.dimensions ?? "Production default"}</dd><dt>Spacing / LOD</dt><dd>{selected.spacingCm ? `${selected.spacingCm} cm` : "Not specified"} / {selected.lod}</dd><dt>Geometries / triangles / materials</dt><dd>{selected.geometries} / {selected.triangles.toLocaleString()} / {selected.materials}</dd><dt>Asset</dt><dd>{selected.artwork?.src ?? "Procedural geometry"}</dd><dt>Sources</dt><dd>{selected.source.join("; ")}</dd><dt>Fallback / shared model</dt><dd>{selected.badges.join(" · ")} {selected.sharedWith.join(", ")}</dd></dl><ul>{selected.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></> : <p>Click a model or select an ID. Bounds are measured from production geometry; mature sizes are not invented.</p>}
      <details><summary>Catalogue notes</summary>{catalogue.sourceNotes.map((note) => <p key={note}>{note}</p>)}</details>
      <h3>{visible.length} visible / {catalogue.entries.length} discovered</h3>
      <div className="audit-index">{visible.map((record) => <button key={record.id} data-audit-id={record.id} onClick={() => choose(record.id)}>{record.id} · {record.name} · {record.variety}<small>{record.badges.join(" · ")}</small></button>)}</div>
    </aside>
    <div className="audit-performance" data-testid="audit-performance" data-stats={JSON.stringify(stats)}>{stats ? `${stats.specimens} specimens · ${stats.objects} objects · ${stats.calls} draw calls · ${stats.triangles.toLocaleString()} triangles · ${stats.geometries} geometries · ${stats.textures} textures` : "Building deterministic atlas…"}</div>
    {options.screenshot && <button className="audit-exit" onClick={() => patch({ screenshot: false })}>Exit screenshot · Esc</button>}
    <script type="application/json" id="audit-records" dangerouslySetInnerHTML={{ __html: JSON.stringify(records).replaceAll("<", "\\u003c") }} />
  </main>;
}
