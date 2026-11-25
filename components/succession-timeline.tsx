import { useEffect, useMemo, useState } from "react";
import { harvestGuide } from "@/lib/garden/planting-calendar";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { bedConditionOptions, bedGrowingContext, mappedClimbingSupports, parseBedGrowingConditions, type BedGrowingConditions } from "@/lib/garden/bed-growing-conditions";
import { successionBedFit } from "@/lib/garden/succession-bed-fit";
import { bedAvailability, bedOccupants, successionBedSummary, successionCurrentCrops, successionSchedule, successionSuggestions, type SuccessionHistory } from "@/lib/garden/succession-timeline";
import type { PlantOption } from "@/lib/garden/plant-catalog";
import type { PlantingSchedule } from "@/lib/garden/planting-schedule";
import { plantingWeather, type RegionalForecastDay } from "@/lib/garden/planting-weather";
import { linkedBatchDelay } from "@/lib/garden/seed-inventory";
import { addDays, formatNzDate, getSavedBatches } from "@/lib/garden/seedling-local";
import { climbingVariety, trellisBookings } from "@/lib/garden/trellis-planning";
import type { RecoveryRequest } from "@/lib/garden/schedule-recovery";
import { SeasonResults } from "./season-results";
import { ScheduleRecovery } from "./schedule-recovery";
import { HarvestTargets } from "./harvest-targets";
import { TrellisAvailability } from "./trellis-availability";
import { SeasonalShadeMap } from "./seasonal-shade-map";
import { PlannerPlantArt as PlantArt } from "./planner-art";

type Suggestion = ReturnType<typeof successionSuggestions>[number];
type Review = { bedId: number; suggestion: Suggestion; variety: string; sow: string; from: string; until: string; supportId?: string };
export type SuccessionSave = "cloud" | "local" | "error";

export function SuccessionTimeline({ plan, gardenId, busy, initialBedId, onSave, onSaveConditions, onApplyRecovery }: {
  plan: PlannerPlan;
  gardenId: string;
  busy: boolean;
  initialBedId?: number;
  onSave: (bedId: number, crop: PlantOption, variety: string, schedule: PlantingSchedule, conditions?: BedGrowingConditions) => Promise<SuccessionSave>;
  onApplyRecovery: (request: RecoveryRequest) => Promise<SuccessionSave>;
  onSaveConditions: (bedId: number, conditions?: BedGrowingConditions) => Promise<SuccessionSave>;
}) {
  const [showResults, setShowResults] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [showTrellises, setShowTrellises] = useState(false);
  const [showShade, setShowShade] = useState(false);
  const [allBeds, setAllBeds] = useState(initialBedId === undefined);
  const [bedId, setBedId] = useState(initialBedId ?? plan.beds[0]?.id);
  const [start, setStart] = useState(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()));
  const [trayBatches] = useState(() => getSavedBatches().filter(batch => batch.gardenId === gardenId));
  const [history, setHistory] = useState<SuccessionHistory[]>();
  const [historyError, setHistoryError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [draft, setReview] = useState<Review>();
  const [editedConditions, setEditedConditions] = useState<{ bedId: number; values?: BedGrowingConditions }>();
  const [forecast, setForecast] = useState<RegionalForecastDay[] | null>();
  const [forecastLoading, setForecastLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const bed = plan.beds.find(item => item.id === bedId) ?? plan.beds[0];
  const conditions = editedConditions?.bedId === bed?.id && editedConditions ? editedConditions.values : bed?.growingConditions;
  const context = bed && bedGrowingContext(plan, bed, conditions ?? {});
  const conditionLabels = context ? [
    context.conditions.light && bedConditionOptions.light[context.conditions.light],
    context.conditions.temperature && bedConditionOptions.temperature[context.conditions.temperature],
    context.conditions.support && bedConditionOptions.support[context.conditions.support],
    context.conditions.moisture && bedConditionOptions.moisture[context.conditions.moisture],
  ].filter(Boolean) : [];
  const review = draft?.bedId === bed?.id ? draft : undefined;
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ gardenId, includeHistory: "1" });
    fetch(`/api/garden/rotation?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok || !Array.isArray(data.history)) throw new Error("Could not load this garden’s crop history.");
        if (data.historyMayBeIncomplete) throw new Error("This garden’s crop history exceeds the current review limit.");
        if (!controller.signal.aborted) setHistory(data.history);
      })
      .catch(error => { if (!controller.signal.aborted) setHistoryError(error.message); });
    return () => controller.abort();
  }, [gardenId, attempt]);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const delayedBatches = trayBatches.flatMap(batch => {
    const link = linkedBatchDelay(batch, plan.plantingAreas, today);
    return link?.delayed ? [{ batch, planting: link.planting }] : [];
  });
  const summaries = useMemo(() => allBeds && history && start
    ? plan.beds.map(bed => ({ bed, ...successionBedSummary(plan, bed, history, start) }))
    : [], [allBeds, history, plan, start]);

  function openBed(id: number) {
    setBedId(id);
    setAllBeds(false);
    setReview(undefined);
    setEditedConditions(undefined);
    setNotice("");
  }

  const occupants = bed && history ? bedOccupants(plan, bed, history) : [];
  const current = start ? successionCurrentCrops(occupants, start) : [];
  const clearDate = current.length && current.every(item => item.schedule?.until)
    ? current.map(item => item.schedule!.until!).sort().at(-1) : undefined;
  const suggestions = bed && history && start ? successionSuggestions(plan, { ...bed, growingConditions: conditions }, history, start) : [];
  const top = suggestions.find(item => !item.fit.issues && !item.shortGap && !item.replaced);
  const reviewFit = review && context && successionBedFit(review.suggestion.guide.crop, review.variety, context,
    Number((review.from || review.sow).slice(5, 7)));
  const availability = review?.from && review.until ? bedAvailability(occupants, review.from, review.until) : undefined;
  const weatherAdvice = review && plantingWeather(review.suggestion.guide.crop, review.from,
    context?.conditions.temperature, forecast ?? []);
  async function loadForecast() {
    setForecastLoading(true);
    try {
      const response = await fetch("/api/garden/forecast");
      const data = await response.json();
      setForecast(response.ok && Array.isArray(data.days) && data.days.length ? data.days : null);
    } catch { setForecast(null); }
    finally { setForecastLoading(false); }
  }
  const climber = review && climbingVariety(review.suggestion.crop.name, review.variety);
  const usableSupports = review && bed && climber ? trellisBookings(plan, { from: review.from, until: review.until })
    .filter(item => item.beds.some(candidate => candidate.id === bed.id) && item.support.heightCm >= climber.height) : [];
  const linkedSupport = usableSupports.find(item => item.support.id === review?.supportId);
  const supportBlocked = !!review?.supportId && (!linkedSupport || linkedSupport.bookings.length > 0);
  let firstHarvest: string | undefined;
  if (review?.sow && review.from && review.until) {
    try {
      const schedule = successionSchedule(review.suggestion.method, review.suggestion.guide, review.sow, review.from, review.until);
      firstHarvest = harvestGuide({ id: "preview", kind: "guide", crop: review.suggestion.crop.name,
        variety: review.variety, location: bed?.name ?? "", count: 0, schedule })?.from;
    } catch { /* Date validation is shown when the user submits. */ }
  }
  const lock = bed && plan.lockedItems?.includes(`bed:${bed.id}`);
  const scheduled = occupants.filter(item => item.schedule?.from && (!start || !item.schedule.until || item.schedule.until >= start))
    .sort((a, b) => a.schedule!.from!.localeCompare(b.schedule!.from!));
  const bookedNext = start ? scheduled.find(item => item.schedule!.from! > start) : undefined;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!review || !bed || busy || lock || !history || supportBlocked || availability?.conflicts.length || availability?.uncertain.length) return;
    try {
      const schedule = successionSchedule(review.suggestion.method, review.suggestion.guide, review.sow, review.from, review.until);
      const result = await onSave(bed.id, review.suggestion.crop, review.variety, { ...schedule, supportId: review.supportId }, conditions);
      setReview(undefined);
      setEditedConditions(undefined);
      setNotice(result === "cloud" ? "Succession saved to this garden."
        : result === "local" ? "Succession saved on this device. Use your garden edit key to publish it."
          : "Succession added to the draft. Publishing failed. Use Save to retry.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not add this succession.");
    }
  }

  async function saveConditions() {
    if (!bed || !editedConditions || busy || lock) return;
    try {
      const result = await onSaveConditions(bed.id, conditions);
      setEditedConditions(undefined);
      setNotice(result === "cloud" ? "Bed conditions saved to this garden."
        : result === "local" ? "Bed conditions saved on this device."
          : "Bed conditions updated in the draft. Publishing failed. Use Save to retry.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save bed conditions.");
    }
  }

  function startReview(suggestion: Suggestion) {
    if (!bed) return;
    setNotice("");
    setReview({ bedId: bed.id, suggestion, variety: suggestion.crop.varieties[0], sow: suggestion.sow, from: suggestion.bedFrom ?? "", until: "" });
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".succession-review input")?.focus());
  }

  if (!bed) return <p>Add a bed to this saved garden to plan a succession.</p>;
  if (allBeds) return <div className="succession-timeline">
    <h3>Replacement plan for all beds</h3>
    <div className="report-controls">
      <label>Plan from<input type="date" min="1900-01-01" max="2199-12-31" value={start} onChange={event => setStart(event.target.value)} /></label>
    </div>
    <button type="button" aria-expanded={showShade} onClick={() => setShowShade(value => !value)}>{showShade ? "Hide seasonal shade" : "Show seasonal shade"}</button>
    <button type="button" aria-expanded={showTrellises} onClick={() => setShowTrellises(value => !value)}>{showTrellises ? "Hide trellis availability" : "Show trellis availability"}</button>
    {showTrellises && start.length === 10 && <TrellisAvailability plan={plan} date={start} />}
    {history && <button type="button" aria-expanded={showTargets} onClick={() => setShowTargets(value => !value)}>{showTargets ? "Hide harvest planner" : "Plan staggered harvests"}</button>}
    {showTargets && history && <HarvestTargets plan={plan} history={history} trays={trayBatches} today={today} />}
    <button type="button" aria-expanded={showRecovery} onClick={() => setShowRecovery(value => !value)}>{showRecovery ? "Hide recovery" : "Recover a planting"}</button>
    {showRecovery && <ScheduleRecovery plan={plan} busy={busy} trays={trayBatches} today={today} onApply={onApplyRecovery} onReviewBed={(id, clear) => { setStart(addDays(clear, 1)); openBed(id); }} />}
    <button type="button" aria-expanded={showResults} onClick={() => setShowResults(value => !value)}>{showResults ? "Hide season results" : "Show season results"}</button>
    {showResults && start.length === 10 && <SeasonResults plan={plan} gardenId={gardenId} planningDate={start} />}
    {showShade && start.length === 10 && <SeasonalShadeMap plan={plan} date={start} onOpenBed={openBed} />}
    {!history && (historyError ? <div role="alert"><p>{historyError}</p><button type="button" onClick={() => { setHistoryError(""); setAttempt(value => value + 1); }}>Retry history</button></div>
      : <p role="status">Loading this garden’s crop history…</p>)}
    {history && !start && <p>Choose a planning date to compare beds.</p>}
    <div className="succession-bed-overview">
      {summaries.map(({ bed, current, clearDate, bookedNext, top }) => (
        <section aria-label={bed.name} key={bed.id}>
          <h4>{bed.name}</h4>
          <p><strong>Growing</strong> · {current.map(item => item.variety ? `${item.crop} (${item.variety})` : item.crop).join(", ") || "No crop recorded on this date"}</p>
          {current.length > 0 && <p><strong>Clears</strong> · {clearDate ? formatNzDate(clearDate) : "Date needs confirmation"}</p>}
          {delayedBatches.filter(link => link.planting.bedId === bed.id).map(({ batch }) => <p key={batch.id} className="succession-warning">Tray delay · {batch.variety || batch.crop}</p>)}
          <p><strong>Next booking</strong> · {bookedNext ? `${bookedNext.crop} from ${formatNzDate(bookedNext.schedule!.from!)}` : "None recorded"}</p>
          {top ? <div className="succession-overview-replacement">
            <span className="succession-art"><PlantArt crop={top.crop.name} fallback={top.crop.icon} /></span>
            <div><strong>{top.crop.name}</strong>
              <p>{top.method === "covered" ? `Start under cover ${formatNzDate(top.sow)}. Confirm transplant timing.`
                : current.length && !clearDate ? "Sow directly once the bed clears." : `Sow directly from ${formatNzDate(top.sow)}.`}</p>
              <p>{[...top.fit.strengths, ...top.fit.cautions].join(" ") || "This crop is in its seasonal sowing window."}
                {top.rotation && ` Consider a different crop family after ${top.rotation}.`}</p></div>
            </div> : <p>Review this bed for alternatives and timing constraints.</p>}
          <button type="button" onClick={() => openBed(bed.id)} aria-label={`Review ${bed.name}`}>Review bed</button>
        </section>
      ))}
    </div>
  </div>;

  return <div className="succession-timeline">
    <button type="button" onClick={() => setAllBeds(true)} disabled={busy}>All beds</button>
    <p>Plan a follow-on crop for a whole bed. Use the seed packet and your local conditions to choose bed dates.</p>
    <div className="report-controls">
      <label>Bed<select value={bed.id} disabled={busy} onChange={event => openBed(Number(event.target.value))}>
        {plan.beds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <label>Plan from<input type="date" min="1900-01-01" max="2199-12-31" value={start} disabled={busy} onChange={event => { setStart(event.target.value); setReview(undefined); }} /></label>
    </div>
    <details className="succession-bed-conditions">
      <summary>Bed conditions and structures</summary>
      <p>Record what you observe. Mapped shade cloth, heat and climbing support are used when the corresponding condition is unspecified.</p>
      <div className="report-controls succession-condition-fields">
        {([
          ["light", "Sun and shade"], ["temperature", "Heat and frost"], ["support", "Climbing support"], ["moisture", "Soil moisture"],
        ] as const).map(([field, label]) => <label key={field}>{label}
          <select value={conditions?.[field] ?? ""} disabled={busy || !!lock} onChange={event => {
            setEditedConditions({ bedId: bed.id, values: parseBedGrowingConditions({ ...conditions, [field]: event.target.value }) });
          }}>
            <option value="">Unspecified</option>
            {Object.entries(bedConditionOptions[field]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>)}
      </div>
      <button type="button" disabled={busy || !!lock || !editedConditions} onClick={() => void saveConditions()}>Save bed conditions</button>
    </details>
    {conditionLabels.length > 0 && <p>Conditions used · {conditionLabels.join(" · ")}</p>}
    {!!context?.structureNotes.length && <p>From the plan · {context.structureNotes.join(" · ")}. Confirm conditions in the bed.</p>}
    {notice && <p role="status">{notice}</p>}
    {!history && (historyError ? <div role="alert"><p>{historyError}</p><button type="button" onClick={() => { setHistoryError(""); setAttempt(value => value + 1); }}>Retry history</button></div>
      : <p role="status">Loading this garden’s crop history…</p>)}
    {history && <>
      <section className="succession-next" aria-label="What to plant next">
        <h3>What to plant next in {bed.name}</h3>
        {current.length ? <p><strong>In this bed on the planning date</strong> · {current.map(item => item.variety ? `${item.crop} (${item.variety})` : item.crop).join(", ")}</p>
          : <p>No crop recorded in this bed on the planning date.</p>}
        {clearDate && <p>Current crops scheduled to clear by {formatNzDate(clearDate)}.</p>}
        {current.length > 0 && !clearDate && <p className="succession-warning">Confirm when the current crop will come out before reserving this bed.</p>}
        {bookedNext && <p><strong>Already booked next</strong> · {bookedNext.crop}{bookedNext.variety ? ` (${bookedNext.variety})` : ""} from {formatNzDate(bookedNext.schedule!.from!)}.</p>}
        {top ? <div className="succession-next-crop">
          <span className="succession-art"><PlantArt crop={top.crop.name} fallback={top.crop.icon} /></span>
          <div><strong>{top.crop.name}</strong><p>{top.method === "covered" ? `Start under cover ${formatNzDate(top.sow)} · confirm a transplant date`
              : current.length && !clearDate ? "Sow directly once the bed clears and the sowing window is open"
                : `Sow directly ${formatNzDate(top.sow)}`}</p>
            {top.rotation && <p>Consider rotating to a different crop family after {top.rotation}.</p>}
            {(top.fit.strengths.length > 0 || top.fit.cautions.length > 0) && <p>{[...top.fit.strengths, ...top.fit.cautions].join(" ")}</p>}</div>
          <button type="button" disabled={busy || !!lock} onClick={() => startReview(top)}>Review this replacement</button>
        </div> : <p>Check the alternatives below for crops that need different conditions or more time in the bed.</p>}
      </section>
      {delayedBatches.filter(item => item.planting.bedId === bed.id).map(({ batch }) => <p key={batch.id} className="succession-warning">
        Tray delay · {batch.variety || batch.crop}{batch.readyFrom ? ` expected ready ${formatNzDate(batch.readyFrom)}` : " is past the planned date"}.
      </p>)}
      <h3>Bed occupancy</h3>
      {scheduled.length ? <ol className="succession-events">{scheduled.map((item, index) => <li key={index}>
        <span className="succession-art"><PlantArt crop={item.crop} variety={item.variety} fallback="🌱" /></span>
        <div><strong>{item.crop}{item.variety ? ` · ${item.variety}` : ""}</strong>
          <small>{formatNzDate(item.schedule!.from!)} – {item.schedule?.until ? formatNzDate(item.schedule.until) : "Clear date unknown"}</small>
          {item.schedule?.supportId && <small>Reserved support · {mappedClimbingSupports(plan).find(object => object.id === item.schedule?.supportId)?.label || "Mapped support"}</small>}
          {item.schedule?.sow && <small>Sow {formatNzDate(item.schedule.sow)}{item.schedule.transplant ? ` under cover · transplant ${formatNzDate(item.schedule.transplant)}` : " directly"}</small>}</div>
      </li>)}</ol> : <p>No dated bed occupancy from this date.</p>}
      {occupants.some(item => !item.schedule?.from || !item.schedule.until) && <p className="succession-warning">Availability may be uncertain. Some plantings are missing a bed start or clear date.</p>}
      {lock && <p>This bed is locked. Unlock it in the plan before adding a succession.</p>}
      {review && <form className="succession-review" onSubmit={save} aria-label="Review succession">
        <h3>Review {review.suggestion.crop.name} in {bed.name}</h3>
        <p>{review.suggestion.method === "direct" ? "Direct sowing" : "Start under cover, then transplant"}</p>
        <div className="report-controls">
          <label>Variety<select value={review.variety} onChange={event => setReview({ ...review, variety: event.target.value, supportId: undefined })}>{review.suggestion.crop.varieties.map(variety => <option key={variety}>{variety}</option>)}</select></label>
          <label>Sowing date<input type="date" required value={review.sow} onChange={event => setReview({ ...review, sow: event.target.value, from: review.suggestion.method === "direct" ? event.target.value : review.from })} /></label>
          {review.suggestion.method === "covered" && <label>Transplant date<input type="date" required min={review.sow} value={review.from} onChange={event => setReview({ ...review, from: event.target.value })} /></label>}
          <label>Bed clear date<input type="date" required min={review.from} value={review.until} onChange={event => setReview({ ...review, until: event.target.value })} /></label>
        </div>
        <p>{review.suggestion.guide.notes} Catalogue spacing · {review.suggestion.crop.spacingCm} cm.</p>
        {review.suggestion.guide.varietyAdvice?.[review.variety] && <p>{review.suggestion.guide.varietyAdvice[review.variety]}</p>}
        {review.suggestion.guide.source && review.suggestion.guide.harvestDays && !/daikon/i.test(review.variety) &&
          <p>Allow roughly {review.suggestion.guide.harvestDays.join("–")} days from sowing to first harvest.</p>}
        {review.suggestion.guide.source && <p>Timing uses broad Blenheim planning windows. Check the packet for this variety. <a href={review.suggestion.guide.source.href} target="_blank" rel="noreferrer">{review.suggestion.guide.source.label}</a></p>}
        {climber && <div className="report-controls"><label>Reserve climbing support<select value={review.supportId ?? ""} onChange={event => setReview({ ...review, supportId: event.target.value || undefined })}>
          <option value="">No mapped reservation</option>
          {usableSupports.map(({ support, bookings }) => <option key={support.id} value={support.id} disabled={bookings.length > 0}>
            {support.label || "Climbing support"}{bookings.length ? " · occupied or unconfirmed" : ""}
          </option>)}
        </select></label></div>}
        {supportBlocked && <p role="alert" className="succession-warning">This support is unavailable for the crop and dates selected.</p>}
        <section aria-label="Planting weather" className="succession-weather">
          <h4>Heat and frost</h4>
          {review.suggestion.method === "covered" && <p>Start under cover in suitable warmth. Weather advice uses your planned transplant date.</p>}
          {weatherAdvice && <p>{weatherAdvice.forecast
            ? `Blenheim forecast on your bed start date · ${weatherAdvice.forecast.min}–${weatherAdvice.forecast.max}°C. `
            : "Seasonal guidance · "} {weatherAdvice.advice}</p>}
          {weatherAdvice?.next && <p>Check {formatNzDate(weatherAdvice.next)} as a possible alternative, subject to your sowing window and bookings.</p>}
          {forecast === null && <p role="status">Regional forecast unavailable. Seasonal guidance is shown where dates are set.</p>}
          <button type="button" onClick={() => void loadForecast()} disabled={forecastLoading}>
            {forecastLoading ? "Checking forecast…" : "Check Blenheim forecast"}
          </button>
          {forecast && <p>Regional air temperatures from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Check this bed for ground frost and sheltered heat.</p>}
        </section>
        {reviewFit && reviewFit.cautions.length > 0 && <p className="succession-warning">{reviewFit.cautions.join(" ")}</p>}
        {firstHarvest && <p className={review.until < firstHarvest ? "succession-warning" : undefined}>Estimated first harvest from {formatNzDate(firstHarvest)}.{review.until < firstHarvest ? " The bed clear date is earlier than this estimate." : ""}</p>}
        {!!availability?.conflicts.length && <p className="succession-warning" role="alert">Bed conflict with {availability.conflicts.join(", ")}. Choose different dates.</p>}
        {!!availability?.uncertain.length && <p className="succession-warning" role="alert">Availability uncertain because of {availability.uncertain.join(", ")}. Check those plantings’ dates before saving.</p>}
        <div className="calendar-row-actions">
          <button type="submit" disabled={busy || !!lock || supportBlocked || !!availability?.conflicts.length || !!availability?.uncertain.length}>{busy ? "Saving…" : "Save succession"}</button>
          <button type="button" disabled={busy} onClick={() => { setReview(undefined); setNotice(""); }}>Cancel review</button>
        </div>
      </form>}
      <h3>Replacement options in the next 120 days</h3>
      {suggestions.length ? <ol className="succession-events">{suggestions.map(suggestion => <li key={`${suggestion.crop.name}:${suggestion.method}`}>
        <span className="succession-art"><PlantArt crop={suggestion.crop.name} fallback={suggestion.crop.icon} /></span>
        <div><strong>{suggestion.crop.name}</strong>
          <small>{formatNzDate(suggestion.sow)} · {suggestion.method === "direct" ? "Direct into soil" : "Trays or pots under cover"}</small>
          {suggestion.guide.intervalDays && <small>Repeat sowing about every {suggestion.guide.intervalDays} days in season.</small>}
          {suggestion.replaced && <small>Same crop family as the current {suggestion.replaced}.</small>}
          {suggestion.rotation && <small>Same crop family as previous {suggestion.rotation}.</small>}
          {suggestion.shortGap && <small className="succession-warning">The next booked crop may go in before this one is ready to harvest.</small>}
          {suggestion.fit.strengths.length > 0 && <small>{suggestion.fit.strengths.join(" ")}</small>}
          {suggestion.fit.cautions.length > 0 && <small className="succession-warning">{suggestion.fit.cautions.join(" ")}</small>}
        </div>
        <button type="button" disabled={busy || !!lock} aria-label={`Review ${suggestion.crop.name} ${suggestion.method === "direct" ? "direct sowing" : "under cover"}`} onClick={() => startReview(suggestion)}>Review</button>
      </li>)}</ol> : <p>No sowing windows found. Choose a different planning date.</p>}
    </>}
  </div>;
}
