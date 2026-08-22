"use client";

import { useMemo, useState } from "react";
import {
  BLENHEIM_MONTHS,
  getBlenheimCropGuidance,
  getBlenheimFrost,
  getBlenheimWeekTasks,
  type BlenheimSeasonStatus,
} from "@/lib/garden/blenheim-season";
import { requestPlannerCrop } from "@/lib/garden/planner-actions";

type View = "today" | "week";

const statusLabels: Record<BlenheimSeasonStatus, string> = {
  "plant-now": "Plant",
  "sow-now": "Sow",
  "start-under-cover": "Under cover",
  maintain: "Maintain",
  wait: "Later",
};

function currentMonthIndex() {
  return new Date().getMonth();
}

function canPlan(status: BlenheimSeasonStatus) {
  return status === "plant-now" || status === "sow-now" || status === "start-under-cover";
}

export function BlenheimSeasonGuide() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("today");
  const [monthIndex, setMonthIndex] = useState(currentMonthIndex);

  const guidance = useMemo(() => getBlenheimCropGuidance(monthIndex), [monthIndex]);
  const frost = useMemo(() => getBlenheimFrost(monthIndex), [monthIndex]);
  const weekTasks = useMemo(() => getBlenheimWeekTasks(monthIndex), [monthIndex]);
  const active = guidance.filter((item) => item.status !== "wait");
  const plannerReady = active.filter((item) => canPlan(item.status));

  function planCrop(crop: string) {
    requestPlannerCrop({ crop, month: BLENHEIM_MONTHS[monthIndex] });
    setOpen(false);
  }

  return (
    <aside className={`blenheim-now ${open ? "open" : ""}`} aria-label="Blenheim seasonal planting guide">
      <button type="button" className="blenheim-now-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>🌱</span>
        <span><strong>Blenheim Now</strong><small>{BLENHEIM_MONTHS[monthIndex]} planting guide</small></span>
        <b>{open ? "×" : "›"}</b>
      </button>

      {open && (
        <div className="blenheim-now-panel">
          <header>
            <div>
              <small>MARLBOROUGH HOME GARDEN</small>
              <h2>{BLENHEIM_MONTHS[monthIndex]} in Blenheim</h2>
            </div>
            <select value={monthIndex} onChange={(event) => setMonthIndex(Number(event.target.value))} aria-label="Guide month">
              {BLENHEIM_MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
          </header>

          <div className={`blenheim-frost frost-${frost.risk}`}>
            <strong>❄ Frost risk: {frost.risk}</strong>
            <span>{frost.message}</span>
            <small>Historical average: {frost.averageGroundFrostDays} ground-frost days · {frost.averageAirFrostDays} air-frost days this month.</small>
          </div>

          <div className="blenheim-now-tabs">
            <button type="button" className={view === "today" ? "active" : ""} onClick={() => setView("today")}>Today</button>
            <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>This Week</button>
          </div>

          {view === "today" ? (
            <div className="blenheim-crop-list">
              {active.map((item) => (
                <article key={item.crop}>
                  <span className="crop-icon">{item.icon}</span>
                  <div>
                    <div className="crop-title"><strong>{item.crop}</strong><em data-status={item.status}>{statusLabels[item.status]}</em></div>
                    <b>{item.action}</b>
                    <p>{item.note}</p>
                    {canPlan(item.status) && (
                      <button type="button" className="blenheim-plan-crop" onClick={() => planCrop(item.crop)}>
                        Use in planner <span>→</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="blenheim-week-list">
                {weekTasks.map((task) => <div key={task}><span>✓</span><p>{task}</p></div>)}
              </div>
              {plannerReady.length > 0 && (
                <div className="blenheim-week-crops">
                  <small>PLAN A RECOMMENDED CROP</small>
                  <div>
                    {plannerReady.map((item) => (
                      <button type="button" key={item.crop} onClick={() => planCrop(item.crop)}>
                        <span>{item.icon}</span>{item.crop}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <footer>
            <strong>Local guide, not a frost guarantee.</strong>
            <span>Use your own garden microclimate and short-range forecast before planting tender crops.</span>
          </footer>
        </div>
      )}
    </aside>
  );
}
