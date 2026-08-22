"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BLENHEIM_CALENDAR_SOURCES,
  blenheimFrostForMonth,
  blenheimGardenActions,
  type BlenheimActionScope,
  type BlenheimActionStatus,
} from "@/lib/garden/blenheim-calendar";

type CalendarView = BlenheimActionScope | null;

const STATUS_LABELS: Record<BlenheimActionStatus, string> = {
  now: "Do now",
  protected: "Under cover",
  soon: "Coming up",
  wait: "Wait",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatWeek(date: Date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const first = new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short" }).format(date);
  const last = new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short" }).format(end);
  return `${first} – ${last}`;
}

export function BlenheimCalendarBridge() {
  const [view, setView] = useState<CalendarView>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    function makeButton(label: string, className: string, open: BlenheimActionScope) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.title = open === "today" ? "What should I do in the garden today?" : "Blenheim garden priorities for the next seven days";
      button.addEventListener("click", () => setView(open));
      return button;
    }

    function ensureActions() {
      const center = document.querySelector<HTMLElement>(".gv-quick-center");
      if (!center || center.querySelector(".gv-season-actions")) return;

      const host = document.createElement("div");
      host.className = "gv-season-actions";
      host.append(
        makeButton("☀ Today", "gv-season-today", "today"),
        makeButton("✓ This Week", "gv-season-week", "week"),
      );
      center.appendChild(host);
    }

    ensureActions();
    const observer = new MutationObserver(ensureActions);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelectorAll(".gv-season-actions").forEach((element) => element.remove());
    };
  }, []);

  useEffect(() => {
    if (!view) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setView(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [view]);

  const frost = useMemo(() => today ? blenheimFrostForMonth(today.getMonth()) : null, [today]);
  const actions = useMemo(() => today && view ? blenheimGardenActions(today, view) : [], [today, view]);

  function focusCrop(crop: string) {
    const plantsTool = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
      .find((button) => button.querySelector("small")?.textContent?.trim() === "Plants");
    plantsTool?.click();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const cropButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-plant-list > button"))
          .find((button) => button.querySelector("strong")?.textContent?.trim() === crop);
        cropButton?.click();
        setView(null);
      });
    });
  }

  if (!view || !today || !frost) return null;

  const heading = view === "today" ? "Today in your Blenheim garden" : "This week in your Blenheim garden";
  const dateLabel = view === "today" ? formatDate(today) : formatWeek(today);

  return (
    <div className="gv-season-backdrop" onMouseDown={() => setView(null)}>
      <aside
        className="gv-season-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="gv-season-header">
          <div>
            <small>BLENHEIM · MARLBOROUGH</small>
            <h2>{heading}</h2>
            <p>{dateLabel}</p>
          </div>
          <button type="button" aria-label="Close" onClick={() => setView(null)}>×</button>
        </header>

        <section className={`gv-frost-card risk-${frost.risk}`}>
          <div className="gv-frost-icon">❄️</div>
          <div>
            <div className="gv-frost-title">
              <strong>{frost.monthName} frost risk: {frost.risk}</strong>
              <span>≈ {frost.averageGroundFrostDays.toFixed(1)} ground-frost days</span>
            </div>
            <p>{frost.summary}</p>
          </div>
        </section>

        <div className="gv-season-list">
          {actions.map((action) => (
            <article key={action.id} className={`gv-season-action status-${action.status}`}>
              <span className="gv-season-action-icon">{action.icon}</span>
              <div>
                <div className="gv-season-action-title">
                  <strong>{action.title}</strong>
                  <em>{STATUS_LABELS[action.status]}</em>
                </div>
                <p>{action.detail}</p>
                {action.crop && (
                  <button type="button" onClick={() => focusCrop(action.crop!)}>
                    Choose {action.crop} in planner →
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="gv-season-note">
          <strong>How to use this</strong>
          <p>
            These are seasonal Blenheim guides, not a live frost forecast. Before moving tender crops outside,
            check the actual local forecast and your own garden&apos;s frost pockets.
          </p>
        </div>

        <details className="gv-season-sources">
          <summary>Guidance sources</summary>
          <div>
            {BLENHEIM_CALENDAR_SOURCES.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ))}
          </div>
        </details>
      </aside>
    </div>
  );
}
