"use client";

import { growthStages, type GrowthArtworkByStage } from "@/lib/garden/growth-artwork";
import Link from "next/link";
import { useMemo, useState } from "react";

export type TestGardenEntry = {
  id: string;
  group: "Kings Seeds" | "Rasmussen" | "Reference catalogue" | "Planner extras";
  crop: string;
  variety: string;
  label: string;
  icon?: string;
  sourceFile?: string;
  master?: string;
  referenceUrl?: string;
  styleReference?: string;
  artworkStatus: "verified" | "generated_qa_passed" | "needs_review" | "pending" | "failed";
  pendingReason?: string;
  growthArtwork?: GrowthArtworkByStage;
};

const groups: Array<TestGardenEntry["group"]> = ["Kings Seeds", "Rasmussen", "Reference catalogue", "Planner extras"];
const groupShort: Record<TestGardenEntry["group"], string> = {
  "Kings Seeds": "KS", Rasmussen: "RG", "Reference catalogue": "REF", "Planner extras": "APP",
};
const artworkLabels: Record<TestGardenEntry["artworkStatus"], string> = {
  verified: "Verified original",
  generated_qa_passed: "Generated artwork",
  needs_review: "Needs review",
  pending: "Artwork pending",
  failed: "Artwork failed QA",
};

const artworkFilters = {
  "Verified originals only": "verified",
  "Generated artwork only": "generated_qa_passed",
  "Needs review only": "needs_review",
  "Artwork pending only": "pending",
  "Failed QA only": "failed",
} as const;

type ArtworkFilter = "All artwork" | keyof typeof artworkFilters;
const PAGE_SIZE = 72;
const BED_SIZE = 8;

function PlantImage({ entry, failed, onBroken, detail = false }: {
  entry: TestGardenEntry; failed: boolean; detail?: boolean; onBroken: (id: string) => void;
}) {
  const path = detail ? entry.master ?? entry.icon : entry.icon;
  const original = entry.artworkStatus === "verified";
  if ((!original && entry.artworkStatus !== "generated_qa_passed") || !path || failed) {
    return <span className="tg-artwork-pending" role="status">
      <span className="tg-pending-mark" aria-hidden="true">—</span>
      <span>{failed ? "Image unavailable" : artworkLabels[entry.artworkStatus]}</span>
    </span>;
  }
  return <img src={path} loading="lazy" decoding="async"
    alt={entry.crop + " " + entry.variety + (original ? " original illustration" : " generated illustration")}
    data-art-source={original ? "verified-original" : "generated"} className="tg-asset-icon"
    onError={() => onBroken(entry.id)} />;
}

function GrowthStageArtwork({ artwork }: { artwork: GrowthArtworkByStage }) {
  return <section aria-label="Seed to harvest">
    <h3>Seed to harvest</h3>
    <ol className="tg-growth-stages">
      {growthStages.map(([id, label]) => {
        const stage = artwork[id];
        const reviewed = stage?.status === "generated_qa_passed" || stage?.status === "verified";
        return <li key={id}>
          <strong>{label}</strong>
          {reviewed ? <a href={stage.master} target="_blank" rel="noreferrer">
            <img src={stage.gallery} alt={label + " illustration"} loading="lazy" decoding="async" />
          </a> : <span>{stage ? artworkLabels[stage.status] : "Pending"}</span>}
          {stage?.referenceUrl && <a href={stage.referenceUrl} target="_blank" rel="noreferrer">Reference</a>}
          {stage?.sourceFile && <small>{stage.sourceFile}</small>}
        </li>;
      })}
    </ol>
  </section>;
}

export function IconTestGarden({ entries }: { entries: TestGardenEntry[] }) {
  const [source, setSource] = useState("All sources");
  const [crop, setCrop] = useState("All crops");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [layout, setLayout] = useState<"beds" | "cards">("beds");
  const [artworkFilter, setArtworkFilter] = useState<ArtworkFilter>("All artwork");
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
      (artworkFilter === "All artwork" || (!broken[entry.id] && entry.artworkStatus === artworkFilters[artworkFilter])) &&
      (!search || (entry.crop + " " + entry.variety + " " + entry.group).toLocaleLowerCase().includes(search))
    );
  }, [entries, source, crop, artworkFilter, query, broken]);
  const shown = filtered.slice(0, limit);
  const statusCounts = (items: TestGardenEntry[]) => ({
    verified: items.filter(item => item.artworkStatus === "verified").length,
    generated: items.filter(item => item.artworkStatus === "generated_qa_passed").length,
    review: items.filter(item => item.artworkStatus === "needs_review").length,
    pending: items.filter(item => item.artworkStatus === "pending").length,
  });
  const totals = statusCounts(entries);
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
  function reset() { setSource("All sources"); setCrop("All crops"); setQuery(""); setLimit(PAGE_SIZE); setArtworkFilter("All artwork"); }

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
        <p>Explore verified originals and reviewed botanical illustrations. Tap a plant to see its artwork and provenance.</p>
      </div>
      <div className="tg-safety">
        <span className="tg-safety-dot" /> ISOLATED PREVIEW
        <strong>Your saved garden stays untouched.</strong>
        <small>No edits are written to D1, R2 or local garden drafts. The Kings Seeds PDF contains cropped contact-sheet picture pieces; they are not used as verified artwork.</small>
      </div>
    </div>

    <section className="tg-stats" aria-label="Catalogue coverage">
      <div><small>TOTAL TEST PLOTS</small><strong>{entries.length.toLocaleString()}</strong><span>all catalogue entries</span></div>
      {groups.map(group => {
        const counts = statusCounts(entries.filter(item => item.group === group));
        return <div key={group}><small>{group.toUpperCase()}</small>
          <strong>{groupCounts[group].toLocaleString()}</strong>
          <span>{counts.verified} originals · {counts.generated} generated · {counts.review} needs review · {counts.pending} pending</span>
        </div>;
      })}
    </section>

    <section className="tg-workspace" aria-label="Test garden controls">
      <div className="tg-controls">
        <label className="tg-search"><span>SEARCH BY CROP OR VARIETY OR SUPPLIER</span><input type="search" value={query} placeholder="e.g. Carolina Reaper, basil, Powder Blue…" onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }} /></label>
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
          <label className="tg-status-select"><span>ARTWORK STATUS</span>
            <select aria-label="ARTWORK STATUS" value={artworkFilter}
              onChange={event => { setArtworkFilter(event.target.value as ArtworkFilter); setLimit(PAGE_SIZE); }}>
              <option>All artwork</option>
              {Object.keys(artworkFilters).map(label => <option key={label}>{label}</option>)}
            </select>
          </label>
          <button type="button" className="tg-reset" onClick={reset}>Reset filters</button>
        </div>
      </div>
      <div className="tg-results" role="status" aria-live="polite">
        <span><strong>{shown.length.toLocaleString()}</strong> of {filtered.length.toLocaleString()} matching plots displayed</span>
        <span><strong>{totals.verified}</strong> verified original PNGs · <strong>{totals.generated}</strong> generated · <strong>{totals.review}</strong> needs review · <strong>{totals.pending}</strong> pending</span>
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
                  <span className="tg-plot-art"><PlantImage entry={entry} failed={Boolean(broken[entry.id])} onBroken={recordBroken} /></span>
                  <span className="tg-plot-label" title={entry.label}>{entry.variety}</span>
                  <span className="tg-plot-meta">{groupShort[entry.group]} · {entry.crop}</span>
                  <span className={"tg-plot-status" + (entry.artworkStatus === "verified" && !broken[entry.id] ? " is-verified" : "")}>{broken[entry.id] ? "Image unavailable" : artworkLabels[entry.artworkStatus]}</span>
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
          <div className="tg-large-art"><PlantImage detail entry={selected} failed={Boolean(broken[selected.id])} onBroken={recordBroken} /></div>
          <dl>
            <div><dt>Status</dt><dd>{broken[selected.id] ? "Image unavailable" : artworkLabels[selected.artworkStatus]}</dd></div>
            <div><dt>Artwork type</dt><dd>{selected.artworkStatus === "verified" ? "Individual original PNG" : selected.master ? "AI-generated botanical illustration" : "No approved standalone source"}</dd></div>
            <div><dt>{selected.referenceUrl ? "Botanical reference" : "Original source"}</dt><dd>{selected.referenceUrl ? <a href={selected.referenceUrl} target="_blank" rel="noreferrer">Cultivar photo</a> : selected.sourceFile ?? "None verified"}</dd></div>
          {selected.styleReference && <div><dt>Style reference</dt><dd><a href={selected.styleReference} target="_blank" rel="noreferrer">Verified illustration</a></dd></div>}
          </dl>
          {selected.artworkStatus === "pending" && <p className="tg-qa-warning">{selected.pendingReason ?? "An original individual image is required before this variety can be shown."}</p>}
          {selected.icon && !broken[selected.id] && (selected.artworkStatus === "verified" || selected.artworkStatus === "generated_qa_passed") &&
            <a className="tg-file-link" href={selected.master ?? selected.icon} target="_blank" rel="noreferrer">{selected.master ? "Open master image ↗" : "Open original image ↗"}</a>}
          {selected.growthArtwork && <GrowthStageArtwork artwork={selected.growthArtwork} />}
          <div className="tg-path">{selected.icon ?? "No verified image file mapped"}</div>
        </> : <div className="tg-inspector-idle"><div className="tg-inspector-plant">✳</div><h2>Select a plot</h2><p>Tap a variety to see its exact source image or why the artwork is still pending.</p></div>}
        <div className="tg-inspector-foot"><strong>Correct artwork takes priority over coverage.</strong><br />Unreviewed concepts, contact-sheet fragments and substitute SVGs are excluded from this source audit.</div>
      </aside>
    </div>
    <footer className="tg-footer"><span>BLENHEIM GARDEN / QUALITY ASSURANCE</span><Link href="/planner">Return to my measured garden →</Link></footer>
  </main>;
}
