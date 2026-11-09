"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlantArt } from "@/components/plant-art";

export type TestGardenEntry = {
  id: string;
  group: "Kings Seeds" | "Rasmussen" | "Reference catalogue" | "Planner extras";
  crop: string;
  variety: string;
  label: string;
  icon: string;
  concept?: string;
  visual: "image" | "planner";
};

const groups: Array<TestGardenEntry["group"]> = ["Kings Seeds", "Rasmussen", "Reference catalogue", "Planner extras"];
const groupShort: Record<TestGardenEntry["group"], string> = {
  "Kings Seeds": "KS", Rasmussen: "RG", "Reference catalogue": "REF", "Planner extras": "APP",
};
const PAGE_SIZE = 72;
const BED_SIZE = 8;

function PlantImage({ entry, onBroken, large = false }: {
  entry: TestGardenEntry; onBroken: (id: string) => void; large?: boolean;
}) {
  if (entry.visual === "planner") {
    return <PlantArt crop={entry.crop} variety={entry.variety} fallback="🌱"
      className="tg-native-icon" style={{ fontSize: large ? 124 : 66 }} />;
  }
  return <img src={entry.icon} loading="lazy" decoding="async" alt=""
    className="tg-asset-icon" onError={() => onBroken(entry.id)} />;
}

export function IconTestGarden({ entries }: { entries: TestGardenEntry[] }) {
  const [source, setSource] = useState("All sources");
  const [crop, setCrop] = useState("All crops");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [layout, setLayout] = useState<"beds" | "cards">("beds");
  const [onlyBroken, setOnlyBroken] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [broken, setBroken] = useState<Record<string, true>>({});

  const groupCounts = useMemo(() => Object.fromEntries(groups.map(group =>
    [group, entries.filter(entry => entry.group === group).length])) as Record<TestGardenEntry["group"], number>, [entries]);
  const crops = useMemo(() => Array.from(new Set(entries.filter(entry =>
    source === "All sources" || entry.group === source).map(entry => entry.crop)))
    .sort((a, b) => a.localeCompare(b)), [entries, source]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return entries.filter(entry =>
      (source === "All sources" || entry.group === source) &&
      (crop === "All crops" || entry.crop === crop) &&
      (!onlyBroken || Boolean(broken[entry.id])) &&
      (!search || (entry.crop + " " + entry.variety + " " + entry.group).toLocaleLowerCase().includes(search))
    );
  }, [entries, source, crop, onlyBroken, query, broken]);
  const shown = filtered.slice(0, limit);
  const beds = Array.from({ length: Math.ceil(shown.length / BED_SIZE) },
    (_, i) => shown.slice(i * BED_SIZE, (i + 1) * BED_SIZE));
  const selected = entries.find(entry => entry.id === selectedId) ?? null;

  function select(entry: TestGardenEntry) {
    setSelectedId(entry.id);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => document.getElementById("tg-inspector")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }
  function recordBroken(id: string) {
    setBroken(previous => previous[id] ? previous : { ...previous, [id]: true });
  }
  function changeSource(value: string) { setSource(value); setCrop("All crops"); setLimit(PAGE_SIZE); }
  function changeCrop(value: string) { setCrop(value); setLimit(PAGE_SIZE); }
  function reset() { setSource("All sources"); setCrop("All crops"); setQuery(""); setLimit(PAGE_SIZE); setOnlyBroken(false); }

  return <main className="tg-shell">
    <a href="#tg-garden" className="tg-skip">Skip to test garden</a>
    <header className="tg-topbar">
      <Link className="tg-brand" href="/">bg<span>.</span> <strong>BLENHEIM GARDEN</strong></Link>
      <nav aria-label="Test garden navigation">
        <Link href="/">Overview</Link><Link href="/planner">My garden</Link>
        <Link href="/3d">3D</Link><span className="tg-current">Icon test garden</span>
      </nav>
    </header>

    <div className="tg-intro">
      <div>
        <div className="tg-kicker"><span className="tg-kicker-mark" /> QA FIELD / TEST TEMPLATE 01</div>
        <h1>Every plant.<br /><em>One test garden.</em></h1>
        <p>A safe, read-only garden assembled from the real supplier catalogues and the planner’s icon renderer. Each plot represents one named crop or variety—select a plant to inspect its artwork and source.</p>
      </div>
      <div className="tg-safety">
        <span className="tg-safety-dot" /> ISOLATED PREVIEW
        <strong>Your saved garden stays untouched.</strong>
        <small>No edits are written to D1, R2 or local garden drafts. This is an icon and variety audit, not a planting recommendation.</small>
      </div>
    </div>

    <section className="tg-stats" aria-label="Catalogue coverage">
      <div><small>TOTAL TEST PLOTS</small><strong>{entries.length.toLocaleString()}</strong><span>all catalogue entries</span></div>
      {groups.map(group => <div key={group}><small>{group.toUpperCase()}</small><strong>{groupCounts[group].toLocaleString()}</strong><span>{group === "Planner extras" ? "non-supplier combinations" : "catalogue records"}</span></div>)}
    </section>

    <section className="tg-workspace" aria-label="Test garden controls">
      <div className="tg-controls">
        <label className="tg-search"><span>SEARCH BY CROP OR VARIETY</span><input type="search" value={query} placeholder="e.g. Carolina Reaper, basil, Powder Blue…" onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }} /></label>
        <label><span>CATALOGUE</span><select value={source} onChange={event => changeSource(event.target.value)}>
          <option>All sources</option>{groups.map(group => <option key={group}>{group}</option>)}
        </select></label>
        <label><span>CROP</span><select value={crop} onChange={event => changeCrop(event.target.value)}>
          <option>All crops</option>{crops.map(name => <option key={name}>{name}</option>)}
        </select></label>
        <div className="tg-controls-bottom">
          <div role="group" aria-label="Garden display style" className="tg-segment">
            <button type="button" aria-pressed={layout === "beds"} onClick={() => setLayout("beds")}>Garden beds</button>
            <button type="button" aria-pressed={layout === "cards"} onClick={() => setLayout("cards")}>Icon gallery</button>
          </div>
          <label className="tg-toggle"><input type="checkbox" checked={onlyBroken} onChange={event => { setOnlyBroken(event.target.checked); setLimit(PAGE_SIZE); }} /> Broken icons only</label>
          <button type="button" className="tg-reset" onClick={reset}>Reset filters</button>
        </div>
      </div>
      <div className="tg-results" role="status" aria-live="polite">
        <span><strong>{shown.length.toLocaleString()}</strong> of {filtered.length.toLocaleString()} matching plots displayed</span>
        <span>{Object.keys(broken).length} failed images detected so far — only loaded images have been checked</span>
      </div>
    </section>

    <div className="tg-layout">
      <section id="tg-garden" aria-label="Visual plant test garden" className={layout === "beds" ? "tg-growing-ground" : "tg-growing-ground tg-gallery-mode"}>
        {layout === "beds" && <div className="tg-garden-header"><span>TEST ALLOTMENT</span><span>ONE ICON PER PLOT · NOT TO SCALE</span></div>}
        {filtered.length === 0 ? <div className="tg-empty">No matching varieties. Clear the filters or try another crop.</div> :
          <div className="tg-bed-grid">
            {beds.map((bed, i) => <div className="tg-bed" key={bed[0].id}>
              {layout === "beds" && <div className="tg-bed-title"><span>BED {String(i + 1).padStart(2, "0")}</span><span>{bed.length} plant variants</span></div>}
              <div className="tg-plots">
                {bed.map(entry => <button key={entry.id} type="button"
                  className={"tg-plot" + (selectedId === entry.id ? " selected" : "") + (broken[entry.id] ? " broken" : "")}
                  onClick={() => select(entry)} aria-pressed={selectedId === entry.id} title={entry.label}>
                  <span className="tg-plot-art"><PlantImage entry={entry} onBroken={recordBroken} /></span>
                  <span className="tg-plot-label" title={entry.label}>{entry.variety}</span>
                  <span className="tg-plot-meta">{groupShort[entry.group]} · {entry.crop}</span>
                </button>)}
              </div>
            </div>)}
          </div>}
        {filtered.length > shown.length && <div className="tg-pagination">
          <button type="button" onClick={() => setLimit(value => value + PAGE_SIZE)}>Show next {Math.min(PAGE_SIZE, filtered.length - shown.length)} plots</button>
          <button type="button" className="tg-show-all" onClick={() => setLimit(filtered.length)}>Show all {filtered.length.toLocaleString()} plots</button>
        </div>}
      </section>

      <aside id="tg-inspector" className="tg-inspector" aria-label="Selected plant artwork">
        <div className="tg-inspector-eyebrow">ARTWORK INSPECTOR</div>
        {selected ? <>
          <div className="tg-inspector-head"><span>{selected.group}</span><button type="button" onClick={() => setSelectedId(null)} aria-label="Close selected icon details">×</button></div>
          <h2>{selected.variety}</h2><p className="tg-inspector-crop">{selected.crop}</p>
          <div className="tg-large-art"><PlantImage entry={selected} onBroken={recordBroken} large /></div>
          <dl><div><dt>Source</dt><dd>{selected.group}</dd></div><div><dt>Renderer</dt><dd>{selected.visual === "planner" ? "In-app PlantArt fallback chain" : "Actual catalogue image path"}</dd></div><div><dt>Icon status</dt><dd>{broken[selected.id] ? "Image failed to load" : selected.visual === "planner" ? "Needs visual inspection" : "No loading failure reported yet"}</dd></div></dl>
          {selected.icon && <a className="tg-file-link" href={selected.icon} target="_blank" rel="noreferrer">Open source icon ↗</a>}
          {selected.concept && <div className="tg-concept">
            <h3>Alternative PNG concept</h3>
            <p>Comparison only — earlier Rasmussen artwork is not cultivar-verified.</p>
            <img src={selected.concept} loading="lazy" alt={"Unreviewed concept for " + selected.variety} onError={() => recordBroken(selected.id)} />
            <a href={selected.concept} target="_blank" rel="noreferrer">Open concept PNG ↗</a>
          </div>}
          <div className="tg-path">{selected.icon || "Resolved by the application’s plant icon renderer"}</div>
        </> : <div className="tg-inspector-idle"><div className="tg-inspector-plant">✳</div><h2>Select a plot</h2><p>Tap a variety in the test garden to inspect the exact icon used by Blenheim Garden. Where available, earlier alternative PNG concepts are shown for comparison.</p></div>}
        <div className="tg-inspector-foot"><strong>Artwork status ≠ botanical accuracy.</strong><br />These previews help find broken, generic or mismatched icons. Individual files still need cultivar review.</div>
      </aside>
    </div>
    <footer className="tg-footer"><span>BLENHEIM GARDEN / QUALITY ASSURANCE</span><Link href="/planner">Return to my measured garden →</Link></footer>
  </main>;
}
