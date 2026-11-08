"use client";

import { useId, useState } from "react";
import { PlantArt } from "./plant-art";
import { seedContainers } from "./seed-container-art";
import { plants } from "@/lib/garden/plant-catalog";
import { SEED_CROPS, type SownCell } from "@/lib/garden/seedling-local";

const cropNames = [...new Set([...plants.map(plant => plant.name), ...SEED_CROPS.map(guide => guide.crop)])]
  .sort((a, b) => a.localeCompare(b));
const catalogue = new Map(plants.map(plant => [plant.name, plant]));

export function SeedCataloguePicker({ crop, variety, onChange, showVarietyOptions = false }: {
  crop: string;
  variety: string;
  onChange: (crop: string, variety: string) => void;
  showVarietyOptions?: boolean;
}) {
  const [search, setSearch] = useState("");
  const varietyListId = useId();
  const needle = search.trim().toLowerCase();
  const varietyCrop = crop === "Peas" ? "Pea" : crop === "Beans" ? "Bean" : crop === "Capsicum / chilli" ? "Capsicum" : crop;
  const varieties = catalogue.get(varietyCrop)?.varieties ?? [];
  const matches = cropNames.filter(name => name === crop || name.toLowerCase().includes(needle) ||
    catalogue.get(name)?.varieties.some(item => item.toLowerCase().includes(needle)));
  return <>
    <label>Search seed catalogue<input type="search" value={search} placeholder="Crop or variety" onChange={event => setSearch(event.target.value)} /></label>
    <label>Crop<select value={crop} onChange={event => {
      const name = event.target.value;
      const options = catalogue.get(name)?.varieties ?? [];
      onChange(name, (needle && options.find(item => item.toLowerCase().includes(needle))) || options[0] || "");
    }}>{matches.map(name => <option key={name}>{name}</option>)}</select></label>
    {showVarietyOptions && varieties.length > 0 && <label>Catalogue variety<select value={varieties.includes(variety) ? variety : ""} onChange={event => onChange(crop, event.target.value)}>
      <option value="">Choose a variety</option>
      {varieties.map(item => <option key={item}>{item}</option>)}
    </select></label>}
    <label>Variety<input list={varietyListId} value={variety} placeholder="Choose or type a variety"
      onChange={event => onChange(crop, event.target.value)} />
      <datalist id={varietyListId}>{varieties.map(item => <option key={item} value={item} />)}</datalist>
    </label>
  </>;
}

export function SeedTrayGrid({ container, cells, onCellClick, occupiedOnly = false }: {
  container: string;
  cells: readonly SownCell[];
  onCellClick?: (index: number) => void;
  occupiedOnly?: boolean;
}) {
  const tray = seedContainers.find(item => item.name === container);
  if (!tray || tray.rows === 0) return null;
  const occupied = new Map(cells.map(cell => [cell.index, cell]));
  return <div className="seed-tray-grid" style={{ gridTemplateColumns: `repeat(${tray.columns}, minmax(66px, 1fr))` }}
    role="group" aria-label={`${tray.name} cell layout`}>
    {Array.from({ length: tray.columns * tray.rows }, (_, index) => {
      const cell = occupied.get(index);
      const label = `Cell ${index + 1}: ${cell ? [cell.crop, cell.variety].filter(Boolean).join(" · ") : "empty"}`;
      const content = cell ? <>
        <PlantArt crop={cell.crop} variety={cell.variety} fallback="🌱" />
        <small className="seed-cell-label">{cell.variety || cell.crop}</small>
      </> : <span aria-hidden="true">{index + 1}</span>;
      return onCellClick && (!occupiedOnly || cell)
        ? <button type="button" className="seed-tray-cell" data-sown={Boolean(cell)} key={index} aria-label={label} title={label}
          onClick={() => onCellClick(index)}>{content}</button>
        : <span role="img" className="seed-tray-cell" data-sown={Boolean(cell)} key={index} aria-label={label} title={label}>{content}</span>;
    })}
  </div>;
}

export function SeedTrayEditor({ container, crop, variety, cells, onChange, editOnly = false }: {
  container: string; crop: string; variety: string; cells: SownCell[]; onChange: (cells: SownCell[]) => void; editOnly?: boolean;
}) {
  const [erase, setErase] = useState(false);
  const [editing, setEditing] = useState<SownCell | null>(null);
  if (!seedContainers.some(item => item.name === container && item.rows > 0)) return null;
  return <section className="seed-tray-editor">
    <h3>{editOnly ? "Tray layout" : "Sow into cells"}</h3>
    <p>{editOnly ? "Tap a planted cell to change its crop or variety." : "Choose a crop and variety above, then tap an empty cell to sow. Tap an occupied cell to change its variety."}</p>
    <div className="seed-tray-actions">
      <strong>{cells.length} cells sown</strong>
      {!editOnly && <button type="button" aria-pressed={erase} onClick={() => { setEditing(null); setErase(value => !value); }}>Erase cells</button>}
      {!editOnly && cells.length > 0 && <button type="button" onClick={() => { setEditing(null); onChange([]); }}>Clear tray</button>}
    </div>
    <SeedTrayGrid container={container} cells={cells} occupiedOnly={editOnly} onCellClick={index => {
      const occupied = cells.find(cell => cell.index === index);
      if (!erase && occupied) {
        setEditing(occupied);
        return;
      }
      setEditing(null);
      const rest = cells.filter(cell => cell.index !== index);
      onChange(erase ? rest : [...rest, { index, crop, variety: variety.trim() }].sort((a, b) => a.index - b.index));
    }} />
    {editing && <fieldset className="seed-container-picker" key={editing.index}>
      <legend>Edit cell {editing.index + 1}</legend>
      <div className="seed-form-grid">
        <SeedCataloguePicker showVarietyOptions crop={editing.crop} variety={editing.variety}
          onChange={(crop, variety) => setEditing({ ...editing, crop, variety })} />
      </div>
      <div className="seed-tray-actions">
        <button type="button" onClick={() => {
          onChange(cells.map(cell => cell.index === editing.index ? { ...editing, variety: editing.variety.trim() } : cell));
          setEditing(null);
        }}>Apply to cell {editing.index + 1}</button>
        <button type="button" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </fieldset>}
  </section>;
}
