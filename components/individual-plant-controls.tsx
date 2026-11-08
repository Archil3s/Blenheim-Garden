"use client";

import { useState } from "react";
import { plants } from "@/lib/garden/plant-catalog";

type CropChoice = { crop: string; cropIcon: string; variety: string; spacingCm: number };

export function IndividualPlantControls({ crop, variety, onChange }: {
  crop: string;
  variety: string;
  onChange: (choice: CropChoice) => void;
}) {
  const [name, setName] = useState(crop);
  const [choice, setChoice] = useState(variety);
  const plant = plants.find(item => item.name === name);
  const varieties = name === crop && plant && !plant.varieties.includes(variety)
    ? [variety, ...plant.varieties] : plant?.varieties ?? [];

  return <section className="gv-inspector-section">
    <h3>Selected plant</h3>
    <label>Crop species<select value={name} onChange={event => {
      const next = plants.find(item => item.name === event.target.value);
      if (!next) return;
      setName(next.name);
      setChoice(next.name === crop ? variety : next.varieties[0] ?? next.name);
    }}>
      {!plants.some(item => item.name === crop) && <option>{crop}</option>}
      {plants.map(item => <option key={item.name}>{item.name}</option>)}
    </select></label>
    <label>Plant variety<select value={choice} onChange={event => setChoice(event.target.value)}>
      {varieties.map(item => <option key={item}>{item}</option>)}
    </select></label>
    <button type="button" className="gv-secondary-action" disabled={!plant || (name === crop && choice === variety)}
      onClick={() => { if (plant) onChange({ crop: plant.name, cropIcon: plant.icon, variety: choice, spacingCm: plant.spacingCm }); }}>
      Change this plant
    </button>
  </section>;
}
