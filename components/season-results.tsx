import Image from "next/image";
import { useEffect, useState } from "react";
import { gardenResourceUrl } from "@/lib/garden/active-garden";
import { plantingDatesOverlap } from "@/lib/garden/planting-overlap";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { nzSeasonRange, nzSeasons, seasonOfPlanningDate, type SeasonResultsData } from "@/lib/garden/season-results";
import { formatNzDate } from "@/lib/garden/seedling-local";
import { PlannerPlantArt as PlantArt } from "./planner-art";

function dateLabel(date?: string | null) {
  return date ? formatNzDate(date.slice(0, 10)) : "—";
}

export function SeasonResults({ plan, gardenId, planningDate }: { plan: PlannerPlan; gardenId: string; planningDate: string }) {
  const [{ year, month }, setPeriod] = useState(() => seasonOfPlanningDate(planningDate));
  const [bedId, setBedId] = useState(plan.beds[0]?.id);
  const [loaded, setLoaded] = useState<{ key: string; data?: SeasonResultsData; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const bed = plan.beds.find(item => item.id === bedId) ?? plan.beds[0];
  const key = `${gardenId}:${bed?.id}:${year}:${month}:${attempt}`;
  const validYear = Number.isInteger(year) && year >= 1900 && year <= 2200;
  useEffect(() => {
    if (!bed || !validYear) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ bedId: String(bed.id), year: String(year), month: String(month) });
    fetch(gardenResourceUrl(`/api/garden/season-results?${query}`, gardenId), { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Could not load this bed's season results.");
        if (!controller.signal.aborted) setLoaded({ key, data });
      })
      .catch(error => { if (!controller.signal.aborted) setLoaded({ key, error: error.message }); });
    return () => controller.abort();
  }, [bed, gardenId, key, year, month, validYear]);

  if (!bed) return null;
  const data = loaded?.key === key ? loaded.data : undefined;
  const error = loaded?.key === key ? loaded.error : undefined;
  const range = validYear ? nzSeasonRange(year, month) : undefined;
  const planned = range ? plan.plantingAreas.filter(area => area.bedId === bed.id
    && Boolean(area.schedule?.from || area.schedule?.until || area.schedule?.sow || area.schedule?.transplant || area.schedule?.harvestFrom)
    && plantingDatesOverlap({
      from: [area.schedule?.sow, area.schedule?.transplant, area.schedule?.from, area.schedule?.harvestFrom].filter(Boolean).sort()[0],
      until: [area.schedule?.until, area.schedule?.harvestUntil].filter(Boolean).sort().at(-1),
    }, range)) : [];
  const linked = new Set<string>();
  const comparisons = planned.map(area => {
    const actual = data?.plantings.find(item => item.id === area.plantingId ||
      (item.status !== "finished" && item.area_id === area.id && item.crop_name === area.crop && item.variety === area.variety));
    if (actual) linked.add(actual.id);
    return { id: area.id, crop: area.crop, variety: area.variety, schedule: area.schedule, actual };
  });
  const actualOnly = data?.plantings.filter(item => !linked.has(item.id) && item.recorded_in_season
    && (item.sow_date || item.transplant_date || data.harvests.some(harvest => harvest.planting_id === item.id)));
  const rows = [
    ...comparisons,
    ...(actualOnly ?? []).map(item => ({ id: item.id, crop: item.crop_name, variety: item.variety ?? item.crop_name, schedule: undefined, actual: item })),
  ];
  const totalWeight = data?.harvests.reduce((sum, item) => sum + (item.weight_g ?? 0), 0);
  return <section className="succession-bed-conditions" aria-label="Bed season results">
    <h3>Bed season results</h3>
    <div className="report-controls succession-condition-fields">
      <label>Results bed<select value={bed.id} onChange={event => setBedId(Number(event.target.value))}>{plan.beds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Results season<select value={month} onChange={event => setPeriod({ year, month: Number(event.target.value) })}>{nzSeasons.map(item => <option key={item.month} value={item.month}>{item.name}</option>)}</select></label>
      <label>Season start year<input type="number" value={year || ""} min="1900" max="2200" onChange={event => setPeriod({ month, year: Number(event.target.value) })} /></label>
    </div>
    {range && <p>{dateLabel(range.from)} to {dateLabel(range.until)}. Actual dates come from recorded milestones and harvests.</p>}
    {!validYear && <p>Enter a year from 1900 to 2200.</p>}
    {validYear && !data && (error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry season results</button></div> : <p role="status">Loading season results…</p>)}
    {data && <>
      <ul className="season-results-list">
        {rows.map(({ id, crop, variety, schedule, actual }) => {
          const harvested = data.harvests.filter(item => item.planting_id === actual?.id);
          return <li key={id}>
            <span className="succession-art"><PlantArt crop={crop} variety={variety} fallback="🌱" /></span>
            <div><strong>{variety} · {crop}</strong>
              {schedule?.failedOn && <p>Crop failed · cleared {dateLabel(schedule.failedOn)}</p>}
              <dl><div><dt>Sow</dt><dd>Planned {dateLabel(schedule?.sow)} · Actual {dateLabel(actual?.sow_date)}</dd></div>
                <div><dt>Transplant</dt><dd>Planned {dateLabel(schedule?.transplant)} · Actual {dateLabel(actual?.transplant_date)}</dd></div>
                <div><dt>First harvest</dt><dd>Planned {dateLabel(schedule?.harvestFrom)} · Actual {dateLabel(actual?.first_harvest)}</dd></div></dl>
              {!!harvested.length && <ul>{harvested.map(item => <li key={item.id}>{dateLabel(item.harvested_on)}
                {item.weight_g !== null && ` · ${item.weight_g} g`}{item.quantity !== null && ` · ${item.quantity}${item.unit ? " " + item.unit : ""}`}</li>)}</ul>}
            </div>
          </li>;
        })}
      </ul>
      {!rows.length && <p>No planned or recorded crops for this bed and season.</p>}
      <p><strong>{data.harvests.length} recorded {data.harvests.length === 1 ? "harvest" : "harvests"}</strong>{data.harvests.some(item => item.weight_g !== null) && ` · ${totalWeight} g total weighed`}</p>
      <h4>Bed photos</h4>
      {data.photos.length ? <div className="season-results-photos">{data.photos.map(photo => <figure key={photo.id}>
        <a href={photo.url} target="_blank" rel="noreferrer"><Image unoptimized src={photo.url} width={260} height={176} alt={photo.caption || `${bed.name} on ${dateLabel(photo.date)}`} /></a>
        <figcaption>{dateLabel(photo.date)}{photo.caption && ` · ${photo.caption}`}</figcaption>
      </figure>)}</div> : <p>No bed photos recorded this season.</p>}
    </>}
  </section>;
}
