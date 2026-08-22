"use client";

import { useEffect, useMemo, useState } from "react";
import type { CropFamily, RotationAdvice } from "@/lib/garden/crop-rotation";

type HistoryItem = {
  id: string;
  bedId: string;
  cropName: string;
  cropIcon: string;
  variety: string | null;
  estimatedCount: number | null;
  status: "planned" | "active" | "finished";
  sowDate: string | null;
  germinatedDate: string | null;
  transplantDate: string | null;
  startDate: string | null;
  endDate: string | null;
  startSeason: string | null;
  endSeason: string | null;
  family: CropFamily;
};

type BedSummary = {
  id: string;
  label: string;
  historyCount: number;
  active: Array<{
    id: string;
    cropName: string;
    cropIcon: string;
    variety: string | null;
    family: CropFamily;
    startDate: string | null;
  }>;
  latest: HistoryItem | null;
  recentFamilies: CropFamily[];
  advice: RotationAdvice;
};

type GardenResponse = {
  ok: boolean;
  scope?: "garden";
  beds?: BedSummary[];
  error?: string;
};

type BedResponse = {
  ok: boolean;
  scope?: "bed";
  bed?: { id: string; label: string };
  history?: HistoryItem[];
  advice?: RotationAdvice;
  error?: string;
};

type RotationData = GardenResponse | BedResponse | null;

function prettyDate(value: string | null) {
  if (!value) return "Date not recorded";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function dateRange(item: HistoryItem) {
  const start = prettyDate(item.startDate);
  if (item.status === "active") return `${start} → now`;
  if (item.status === "planned") return `${start} · planned`;
  return `${start} → ${prettyDate(item.endDate)}`;
}

function recentMonths(count = 18) {
  const today = new Date();
  const result: Array<{ key: string; label: string; start: string; end: string }> = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      key,
      label: new Intl.DateTimeFormat("en-NZ", { month: "short" }).format(date),
      start: `${key}-01`,
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    });
  }
  return result;
}

function occupies(item: HistoryItem, month: { start: string; end: string }) {
  if (!item.startDate) return false;
  const end = item.endDate ?? new Date().toISOString().slice(0, 10);
  return item.startDate <= month.end && end >= month.start;
}

function FamilyBadge({ family }: { family: CropFamily }) {
  return <span className={`gv-family-badge family-${family.key}`} title={family.botanical}>{family.label}</span>;
}

export function CropRotationBridge() {
  const [open, setOpen] = useState(false);
  const [bedId, setBedId] = useState<string | null>(null);
  const [data, setData] = useState<RotationData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function openGarden() {
      setBedId(null);
      setOpen(true);
    }

    function ensureControls() {
      const tabs = document.querySelector<HTMLElement>(".gv-tabs");
      if (tabs && !tabs.querySelector(".gv-rotation-tab")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gv-rotation-tab";
        button.textContent = "Rotation";
        button.title = "Seasonal bed occupancy and crop-rotation history";
        button.addEventListener("click", openGarden);
        tabs.appendChild(button);
      }

      document.querySelectorAll<HTMLElement>(".gv-selection-panel[data-bed-id]").forEach((panel) => {
        if (panel.querySelector(".gv-rotation-open")) return;
        const id = panel.dataset.bedId?.trim();
        if (!id) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gv-secondary-action gv-rotation-open";
        button.textContent = "↻ Rotation history";
        button.addEventListener("click", () => {
          setBedId(id);
          setOpen(true);
        });
        const editActions = panel.querySelector(".gv-edit-actions");
        if (editActions) panel.insertBefore(button, editActions);
        else panel.appendChild(button);
      });
    }

    ensureControls();
    const observer = new MutationObserver(ensureControls);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelectorAll(".gv-rotation-tab,.gv-rotation-open").forEach((element) => element.remove());
    };
  }, []);

  useEffect(() => {
    const tab = document.querySelector(".gv-rotation-tab");
    tab?.classList.toggle("active", open);
    return () => tab?.classList.remove("active");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    const query = bedId ? `?bedId=${encodeURIComponent(bedId)}` : "";
    fetch(`/api/garden/rotation${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as GardenResponse | BedResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load rotation history.");
        setData(result);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Unable to load rotation history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, bedId]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const months = useMemo(() => recentMonths(18), []);

  function focusCrop(crop: string) {
    const plantsTool = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
      .find((button) => button.querySelector("small")?.textContent?.trim() === "Plants");
    plantsTool?.click();
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const cropButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
        .find((button) => button.querySelector("strong")?.textContent?.trim() === crop);
      cropButton?.click();
      setOpen(false);
    }));
  }

  if (!open) return null;

  const garden = data?.scope === "garden" ? data as GardenResponse : null;
  const bed = data?.scope === "bed" ? data as BedResponse : null;
  const beds = garden?.beds ?? [];
  const history = bed?.history ?? [];
  const advice = bed?.advice;
  const totalPlantings = beds.reduce((sum, item) => sum + item.historyCount, 0);
  const cautionBeds = beds.filter((item) => item.advice.tone === "caution").length;

  return (
    <div className="gv-rotation-backdrop" onMouseDown={() => setOpen(false)}>
      <aside className="gv-rotation-drawer" role="dialog" aria-modal="true" aria-label="Crop rotation history" onMouseDown={(event) => event.stopPropagation()}>
        <header className="gv-rotation-header">
          <div>
            <small>BED HISTORY · ROTATION</small>
            <h2>{bed?.bed?.label ?? "Garden rotation overview"}</h2>
            <p>{bed ? "Seasonal occupancy and crop-family history" : "See what has occupied each bed and what to plant next"}</p>
          </div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        </header>

        {bed && <button type="button" className="gv-rotation-back" onClick={() => setBedId(null)}>← All beds</button>}

        {loading && <div className="gv-rotation-state"><span className="gv-rotation-spinner" /><strong>Loading bed history…</strong></div>}
        {!loading && error && <div className="gv-rotation-state error"><strong>Couldn&apos;t load rotation history</strong><p>{error}</p></div>}

        {!loading && !error && garden && <>
          <section className="gv-rotation-summary">
            <div><strong>{beds.length}</strong><span>current beds</span></div>
            <div><strong>{totalPlantings}</strong><span>saved plantings</span></div>
            <div><strong>{cautionBeds}</strong><span>rotation cautions</span></div>
          </section>

          <div className="gv-rotation-bed-grid">
            {beds.map((item) => (
              <button type="button" key={item.id} className={`gv-rotation-bed-card tone-${item.advice.tone}`} onClick={() => setBedId(item.id)}>
                <div className="gv-rotation-bed-title"><strong>{item.label}</strong><span>{item.historyCount} records</span></div>
                {item.active.length > 0 ? (
                  <div className="gv-rotation-active-list">
                    {item.active.map((active) => <span key={active.id}>{active.cropIcon} {active.variety || active.cropName}</span>)}
                  </div>
                ) : item.latest ? (
                  <p className="gv-rotation-last">Last: {item.latest.cropIcon} {item.latest.variety || item.latest.cropName}</p>
                ) : (
                  <p className="gv-rotation-last empty">No planting history yet</p>
                )}
                <div className="gv-family-row">{item.recentFamilies.map((family) => <FamilyBadge key={family.key} family={family} />)}</div>
                <p className="gv-rotation-card-advice">{item.advice.headline}</p>
                <span className="gv-rotation-card-link">Open history →</span>
              </button>
            ))}
          </div>
        </>}

        {!loading && !error && bed && <>
          {advice && <section className={`gv-rotation-advice tone-${advice.tone}`}>
            <div className="gv-rotation-advice-icon">{advice.tone === "caution" ? "⚠" : advice.tone === "good" ? "↻" : "ℹ"}</div>
            <div>
              <strong>{advice.headline}</strong>
              <p>{advice.detail}</p>
              {advice.avoidFamily && <div className="gv-rotation-avoid"><span>Avoid back-to-back if practical</span><FamilyBadge family={advice.avoidFamily} /></div>}
              {advice.suggestedCrops.length > 0 && <div className="gv-rotation-suggestions"><span>Good next-family options</span><div>{advice.suggestedCrops.map((crop) => <button key={crop} type="button" onClick={() => focusCrop(crop)}>{crop}</button>)}</div></div>}
            </div>
          </section>}

          <section className="gv-occupancy-section">
            <div className="gv-rotation-section-title"><div><small>LAST 18 MONTHS</small><strong>Seasonal occupancy</strong></div><span>{history.length} planting records</span></div>
            {history.length === 0 ? <div className="gv-rotation-empty">This bed has no saved crop history yet.</div> : (
              <div className="gv-occupancy-scroll">
                <div className="gv-occupancy-grid" style={{ ["--month-count" as string]: months.length }}>
                  <div className="gv-occupancy-corner">Planting</div>
                  <div className="gv-occupancy-months">{months.map((month, index) => <span key={month.key} className={index % 3 === 0 ? "quarter" : ""}>{month.label}<small>{month.key.slice(2, 4)}</small></span>)}</div>
                  {history.slice(0, 12).map((item) => <div className="gv-occupancy-row" key={item.id}>
                    <div className="gv-occupancy-label"><span>{item.cropIcon}</span><div><strong>{item.variety || item.cropName}</strong><small>{item.family.label}</small></div></div>
                    <div className="gv-occupancy-cells">{months.map((month) => <span key={month.key} className={`${occupies(item, month) ? `occupied family-${item.family.key}` : ""} ${item.status === "planned" ? "planned" : ""}`} title={occupies(item, month) ? `${item.variety || item.cropName} · ${month.label}` : undefined} />)}</div>
                  </div>)}
                </div>
              </div>
            )}
          </section>

          <section className="gv-rotation-history-section">
            <div className="gv-rotation-section-title"><div><small>FULL RECORD</small><strong>Crop history</strong></div></div>
            <div className="gv-rotation-history-list">
              {history.map((item) => <article key={item.id} className={`status-${item.status}`}>
                <span className="gv-rotation-history-icon">{item.cropIcon}</span>
                <div className="gv-rotation-history-main">
                  <div><strong>{item.variety || item.cropName}</strong><em>{item.status}</em></div>
                  <p>{item.cropName} · {dateRange(item)}</p>
                  <div className="gv-family-row"><FamilyBadge family={item.family} />{item.startSeason && <span className="gv-season-chip">Started {item.startSeason}</span>}{item.endSeason && <span className="gv-season-chip">Finished {item.endSeason}</span>}</div>
                </div>
              </article>)}
              {history.length === 0 && <div className="gv-rotation-empty">History appears after a saved planting is replaced or finished.</div>}
            </div>
          </section>

          <div className="gv-rotation-note"><strong>Rotation is a planning aid, not a hard rule.</strong><p>In a small home garden, soil health, disease history, sunlight and available space still matter. The strongest warning here is simply repeated planting of the same crop family in the same bed.</p></div>
        </>}
      </aside>
    </div>
  );
}
