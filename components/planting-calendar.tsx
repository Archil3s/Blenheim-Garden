import { useEffect, useMemo, useState } from "react";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import type { PlantingSchedule, PlanningPeriod } from "@/lib/garden/planting-schedule";
import { CROP_WINDOWS, blenheimFrostForMonth } from "@/lib/garden/blenheim-calendar";
import { calendarMonthEvents, calendarMonths, calendarPlantings, calendarSources, cropCalendarGuide, harvestGuide, type CalendarPlanting } from "@/lib/garden/planting-calendar";
import { csvText } from "@/lib/garden/plan-reports";
import { CalendarDatesDialog } from "./calendar-dates-dialog";
import { PlantArt } from "./plant-art";

export function PlantingCalendar({ plan, period = { year: 2026, month: 8 }, onPeriodChange, onDatesChange, onShowPlanting }: {
  plan: PlannerPlan; period?: PlanningPeriod; onPeriodChange?: (period: PlanningPeriod) => void;
  onDatesChange?: (kind: "row" | "planting", id: string, dates?: PlantingSchedule) => void;
  onShowPlanting?: (planting: CalendarPlanting) => void;
}) {
  const [query, setQuery] = useState("");
  const [guideOnly, setGuideOnly] = useState(false);
  const [view, setView] = useState("year");
  const [editing, setEditing] = useState<CalendarPlanting | null>(null);
  useEffect(() => { if (window.matchMedia("(max-width:600px)").matches) queueMicrotask(() => setView("month")); }, []);
  const rows = useMemo(() => {
    const source: CalendarPlanting[] = guideOnly ? CROP_WINDOWS.map(window => ({ id: `guide-${window.crop}`, kind: "guide", crop: window.crop, variety: window.crop, location: "Blenheim guide", count: 0 })) : calendarPlantings(plan);
    return source.filter(row => `${row.crop} ${row.variety} ${row.location}`.toLowerCase().includes(query.toLowerCase()));
  }, [plan, query, guideOnly]);
  const frost = blenheimFrostForMonth(period.month);
  function exportCalendar() {
    const data = [["Crop", "Variety", "Location", ...calendarMonths], ...rows.map(row => [row.crop, row.variety, row.location,
      ...calendarMonths.map((_, month) => calendarMonthEvents(row, period.year, month).map(event => event.label).join("; "))])];
    const url = URL.createObjectURL(new Blob([csvText(data)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `planting-calendar-${period.year}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function identity(row: CalendarPlanting) {
    return <><span className="calendar-plant-art"><PlantArt crop={row.crop} variety={row.variety} fallback="🌱" /></span><strong>{row.variety}</strong><small>{row.crop} · {row.location}{row.kind !== "guide" && ` · ${row.count} plants`}{!cropCalendarGuide(row.crop) && " · dates only"}</small></>;
  }
  return <div className="planting-calendar">
    <div className="report-controls"><label>Find calendar crop<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Crop, variety or bed" /></label>
      <label>Calendar year<select aria-label="Calendar year" value={period.year} onChange={event => onPeriodChange?.({ ...period, year: Number(event.target.value) })}>{Array.from({ length: 301 }, (_, index) => 1900 + index).map(year => <option key={year}>{year}</option>)}</select></label>
      <label>Calendar view<select aria-label="Calendar view" value={view} onChange={event => setView(event.target.value)}><option value="year">Year grid</option><option value="month">Selected month</option></select></label>
    </div>
    <label className="calendar-guide-toggle"><input type="checkbox" checked={guideOnly} onChange={event => setGuideOnly(event.target.checked)} />Show Blenheim crop guide</label>
    <nav className="calendar-months" aria-label="Calendar months">{calendarMonths.map((name, month) => <button key={name} type="button" aria-pressed={period.month === month} onClick={() => onPeriodChange?.({ ...period, month })}>{name}</button>)}</nav>
    <p className="calendar-frost">{frost.monthName}: {frost.risk} historical frost risk. {frost.summary} This is seasonal guidance, not a live forecast.</p>
    <p className="calendar-legend">C = sow under cover · S = sow direct · P = plant out · G = in your garden · ● = your date · ~H = estimated first harvest</p>
    {view === "year" ? <div className="calendar-grid-scroll" tabIndex={0} aria-label="Year calendar; scroll horizontally for all months"><table className="calendar-grid"><thead><tr><th>Planting</th>{calendarMonths.map(name => <th key={name}>{name}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={`${row.kind}:${row.id}`}><th scope="row">{identity(row)}{row.kind !== "guide" && <button type="button" onClick={() => setEditing(row)}>Edit dates</button>}</th>{calendarMonths.map((name, month) => <td key={name} data-month={name}>{calendarMonthEvents(row, period.year, month).map(event => <span key={event.label} className={`calendar-event ${event.kind}`} aria-label={event.label} title={event.label}>{event.code}</span>)}</td>)}</tr>)}</tbody></table></div>
      : <div className="calendar-agenda">{rows.map(row => {
        const events = calendarMonthEvents(row, period.year, period.month), harvest = harvestGuide(row);
        return <section key={`${row.kind}:${row.id}`} className="calendar-agenda-row">{identity(row)}<ul>{events.map(event => <li key={event.label}>{event.label}</li>)}</ul>
          {!events.length && <p>No calendar events this month.</p>}
          {!cropCalendarGuide(row.crop) && <p>Seasonal guidance is unavailable for this crop; your planned dates still appear.</p>}
          {harvest?.estimated && <p>{harvest.basis}. <a href={harvest.source} target="_blank" rel="noreferrer">Harvest guide</a></p>}
          {row.kind !== "guide" && <div className="calendar-row-actions"><button type="button" onClick={() => setEditing(row)}>Edit dates</button><button type="button" onClick={() => onShowPlanting?.(row)}>Show on plan</button></div>}
        </section>;
      })}</div>}
    {!rows.length && <p>No plantings match. Add crops to your plan or show the Blenheim crop guide.</p>}
    <p>First-harvest estimates vary with variety and conditions; they do not describe the full picking season. Add sowing or transplanting dates to enable supported estimates; enter your own harvest dates for other crops. Undated plantings remain visible year-round.</p>
    <details className="calendar-sources"><summary>Sources and assumptions</summary><p>Regional sowing and planting windows use the planner’s Blenheim seasonal guidance. Seedling harvest estimates use Tui; Nantes and bean estimates use Yates NZ. No harvest dates are inferred from garden occupancy alone.</p><ul>{Object.entries(calendarSources).map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noreferrer">{label === "tui" ? "Tui seedling planting calendar" : label === "climate" ? "NIWA Marlborough climate" : `Yates ${label} guide`}</a></li>)}</ul></details>
    <footer><button type="button" onClick={exportCalendar}>Export calendar CSV</button></footer>
    {editing && <CalendarDatesDialog key={`${editing.kind}:${editing.id}`} planting={editing} onClose={() => setEditing(null)} onApply={dates => { if (editing.kind !== "guide") onDatesChange?.(editing.kind, editing.id, dates); }} />}
  </div>;
}
