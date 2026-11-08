"use client";

import { useState } from "react";
import { PlantArt } from "./plant-art";
import { seedContainers } from "./seed-container-art";
import { plants } from "@/lib/garden/plant-catalog";
import { SEED_CROPS, type SownCell } from "@/lib/garden/seedling-local";

const cropNames = [...new Set([...plants.map(plant => plant.name), ...SEED_CROPS.map(guide => guide.crop)])]
  .sort((a, b) => a.localeCompare(b));
const catalogue = new Map(plants.map(plant => [plant.name, plant]));

export function SeedCataloguePicker({ crop, variety, onChange }: {
  crop: string;
  variety: string;
  onChange: (crop: string, variety: string) => void;
}) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const varieties = catalogue.get(crop)?.varieties ?? [];
  const matches = cropNames.filter(name => name === crop || name.toLowerCase().includes(needle) ||
    catalogue.get(name)?.varieties.some(item => item.toLowerCase().includes(needle)));
  return <>
    <label>Search seed catalogue<input type="search" value={search} placeholder="Crop or variety" onChange={event => setSearch(event.target.value)} /></label>
    <label>Crop<select value={crop} onChange={event => {
      const name = event.target.value;
      const options = catalogue.get(name)?.varieties ?? [];
      onChange(name, (needle && options.find(item => item.toLowerCase().includes(needle))) || options[0] || "");
    }}>{matches.map(name => <option key={name}>{name}</option>)}</select></label>
    <label>Variety<input list="seed-catalogue-varieties" value={variety} placeholder="Choose or type a variety"
      onChange={event => onChange(crop, event.target.value)} />
      <datalist id="seed-catalogue-varieties">{varieties.map(item => <option key={item} value={item} />)}</datalist>
    </label>
  </>;
}

export function SeedTrayGrid({ container, cells, onCellClick }: {
  container: string;
  cells: readonly SownCell[];
  onCellClick?: (index: number) => void;
}) {
  const tray = seedContainers.find(item => item.name === container);
  if (!tray || tray.rows === 0) return null;
  const occupied = new Map(cells.map(cell => [cell.index, cell]));
  return <div className="seed-tray-grid" style={{ gridTemplateColumns: `repeat(${tray.columns}, minmax(32px, 1fr))` }}
    role="group" aria-label={`${tray.name} cell layout`}>
    {Array.from({ length: tray.columns * tray.rows }, (_, index) => {
      const cell = occupied.get(index);
      const label = `Cell ${index + 1}: ${cell ? [cell.crop, cell.variety].filter(Boolean).join(" · ") : "empty"}`;
      const content = cell ? <PlantArt crop={cell.crop} variety={cell.variety} fallback="🌱" /> : <span aria-hidden="true">{index + 1}</span>;
      return onCellClick
        ? <button type="button" className="seed-tray-cell" data-sown={Boolean(cell)} key={index} aria-label={label} title={label}
          onClick={() => onCellClick(index)}>{content}</button>
        : <span role="img" className="seed-tray-cell" data-sown={Boolean(cell)} key={index} aria-label={label} title={label}>{content}</span>;
    })}
  </div>;
}

export function SeedTrayEditor({ container, crop, variety, cells, onChange }: {
  container: string; crop: string; variety: string; cells: SownCell[]; onChange: (cells: SownCell[]) => void;
}) {
  const [erase, setErase] = useState(false);
  if (!seedContainers.some(item => item.name === container && item.rows > 0)) return null;
  return <section className="seed-tray-editor">
    <h3>Sow into cells</h3>
    <p>Choose a crop and variety above, then tap a cell to sow or replace one seed.</p>
    <div className="seed-tray-actions">
      <strong>{cells.length} cells sown</strong>
      <button type="button" aria-pressed={erase} onClick={() => setErase(value => !value)}>Erase cells</button>
      {cells.length > 0 && <button type="button" onClick={() => onChange([])}>Clear tray</button>}
    </div>
    <SeedTrayGrid container={container} cells={cells} onCellClick={index => {
      const rest = cells.filter(cell => cell.index !== index);
      onChange(erase ? rest : [...rest, { index, crop, variety: variety.trim() }].sort((a, b) => a.index - b.index));
    }} />
  </section>;
}
