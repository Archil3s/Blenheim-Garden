"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { defaultPlantFilters, plantFacts, rotationFamilies, type PlantFilters } from "@/lib/garden/plant-catalogue-filters";
import { PlantArt } from "./plant-art";

export function PlantCatalogueFilters({ value, onChange, onReset, selected, children }: {
  value: PlantFilters; onChange: (value: PlantFilters) => void;
  onReset: () => void; selected: string; children?: ReactNode;
}) {
  return <section className="plant-source-filters" aria-label="Plant filters">
    <header><strong>Filters</strong><button type="button" onClick={() => { onChange(defaultPlantFilters); onReset(); }}>Reset</button><details><summary>Show More »</summary><div className="plant-advanced-filters">
      {([["easy", "Easy to Grow"], ["frost", "Frost Tolerant"], ["shade", "Partial Shade Tolerant"], ["autumn", "Autumn Planting"], ["tropical", "Include Tropicals"]] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.checked })} />{label}</label>)}
      <label>Crop Rotation Family<select aria-label="Crop Rotation Family" value={value.family} onChange={(event) => onChange({ ...value, family: event.target.value })}><option value="all">All Families</option>{rotationFamilies.map((family, index) => <option key={family} value={index}>{family}</option>)}</select></label>
    </div></details></header>
    {children}
    <button type="button" className="plant-companion-filter" disabled={!selected} aria-pressed={value.companions} title={`Show companion plants for ${selected}`} onClick={() => onChange({ ...value, companions: !value.companions })}>Show Companions ♥</button>
    <div className="plant-source-checkboxes"><label><input type="checkbox" checked={value.favouritesOnly} onChange={(event) => onChange({ ...value, favouritesOnly: event.target.checked })} />Favorites</label><label><input type="checkbox" checked={value.perennials} onChange={(event) => onChange({ ...value, perennials: event.target.checked })} />Include Perennials</label></div>
  </section>;
}

export function PlantInformation({ name, onClose }: { name: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const facts = plantFacts(name);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return createPortal(<dialog ref={dialog} className="plant-information" onClose={onClose} aria-labelledby="plant-information-title">
    <header><h2 id="plant-information-title">{name}</h2><button type="button" aria-label="Close plant information" onClick={onClose}>×</button></header>
    <div className="plant-information-body"><span className="plant-information-art"><PlantArt crop={name} fallback="🌱" /></span>{facts ? <><p><i>{facts.latinName}</i></p><dl><dt>Plant spacing</dt><dd>{facts.spacingCm} cm</dd><dt>In-row spacing</dt><dd>{facts.inRowSpacingCm} cm</dd><dt>Between rows</dt><dd>{facts.rowSpacingCm} cm</dd><dt>Life cycle</dt><dd>{facts.perennial ? "Perennial" : "Annual"}</dd><dt>Crop rotation family</dt><dd>{rotationFamilies[facts.family] ?? "Miscellaneous"}</dd>{facts.squareFootCount > 0 && <><dt>Square-foot density</dt><dd>{facts.squareFootCount} plants</dd></>}</dl></> : <p>Use the spacing and growing information supplied with your seed packet.</p>}</div>
    <footer><button type="button" onClick={onClose}>Close</button></footer>
  </dialog>, document.body);
}
