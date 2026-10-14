"use client";

import { useEffect, useRef, useState } from "react";
import { addCatalogue, readAddLibrary, type AddEntry } from "@/lib/garden/editor-ui";
import { plants } from "@/lib/garden/plant-catalog";
import { STRUCTURE_PRESETS } from "@/lib/garden/structure-catalog";
import { detailedPixelCrop, loadPixelArtwork } from "./garden-pixel-assets";
import type { Garden3DEditor } from "./use-garden-3d-editor";

function AddThumbnail({ entry }: { entry: AddEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!entry.crop) return;
    let active = true;
    void loadPixelArtwork().then(() => { if (!active) return; const image = detailedPixelCrop(entry.crop, plants.find((p) => p.name === entry.crop)?.varieties[0] ?? ""); const c = ref.current?.getContext("2d"); if (image && c) { c.clearRect(0, 0, 64, 64); c.imageSmoothingEnabled = false; const w = 52 * image.width / image.height; c.drawImage(image, (64 - w) / 2, 6, w, 52); } }).catch(() => { ref.current?.setAttribute("aria-label", `${entry.name} artwork unavailable`); });
    return () => { active = false; };
  }, [entry]);
  return <span className="garden-add-thumbnail" aria-hidden="true">{entry.crop ? <canvas ref={ref} width={64} height={64} /> : entry.icon}</span>;
}

export function GardenAddPicker({ editor, onClose }: { editor: Garden3DEditor; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null), [query, setQuery] = useState(""), [group, setGroup] = useState("All");
  const [loaded] = useState(() => { try { return { library: readAddLibrary(localStorage.getItem("garden-add-library")), error: "" }; } catch (e) { return { library: { favourites: [], recent: [] }, error: e instanceof Error ? e.message : "Cannot read favourites." }; } });
  const [library, setLibrary] = useState(loaded.library), [error, setError] = useState(loaded.error);
  useEffect(() => { ref.current?.showModal(); }, []);
  const store = (next: typeof library) => { try { localStorage.setItem("garden-add-library", JSON.stringify(next)); setLibrary(next); setError(""); } catch { setError("Browser storage is unavailable. You can still choose an item."); } };
  const choose = (entry: AddEntry) => {
    const crop = plants.find((p) => p.name === entry.crop), preset = STRUCTURE_PRESETS.find((p) => entry.id === `structure:${p.kind}`);
    editor.setSettings({ ...editor.settings, targetSurfaceId: undefined, ...(crop ? { crop: crop.name, variety: crop.varieties[0], spacingCm: crop.spacingCm } : {}), ...(preset ? { structureKind: preset.kind, width: preset.widthCm, depth: preset.depthCm, height: preset.heightCm } : {}) });
    editor.setTool(entry.tool); editor.select(null); store({ ...library, recent: [entry.id, ...library.recent.filter((id) => id !== entry.id)].slice(0, 8) }); onClose();
  };
  const entries = addCatalogue.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) && (group === "All" || group === e.group || group === "Favourites" && library.favourites.includes(e.id) || group === "Recent" && library.recent.includes(e.id))).sort((a, b) => group === "Recent" ? library.recent.indexOf(a.id) - library.recent.indexOf(b.id) : a.name.localeCompare(b.name));
  return <dialog ref={ref} className="garden-bed-dialog garden-design-dialog garden-add-picker" aria-label="Add to garden" onCancel={onClose}>
    <header className="garden-bed-dialog-heading"><h2>Add to garden</h2><button type="button" onClick={onClose}>Close</button></header>
    <div className="garden-design-body"><label>Find crops, beds or structures<input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <nav className="garden-add-tabs" aria-label="Item categories">{["All", "Crops", "Beds", "Structures", "Favourites", "Recent"].map((g) => <button type="button" key={g} aria-pressed={g === group} onClick={() => setGroup(g)}>{g}</button>)}</nav>
      <p>Choose an item, then choose its position in the garden. Favourites and recent items stay in this browser.</p>
      {error && <p role="alert">{error}</p>}
      <div className="garden-add-results">{entries.map((entry) => <article key={entry.id}><button type="button" onClick={() => choose(entry)} aria-label={`Choose ${entry.name}`}><AddThumbnail entry={entry} /><span><strong>{entry.name}</strong><small>{entry.detail}</small></span></button><button type="button" aria-label={`${library.favourites.includes(entry.id) ? "Unfavourite" : "Favourite"} ${entry.name}`} aria-pressed={library.favourites.includes(entry.id)} onClick={() => store({ ...library, favourites: library.favourites.includes(entry.id) ? library.favourites.filter((id) => id !== entry.id) : [...library.favourites, entry.id] })}>{library.favourites.includes(entry.id) ? "★" : "☆"}</button></article>)}</div>
      {!entries.length && <p>No matching items. Try another search or category.</p>}
    </div>
  </dialog>;
}
