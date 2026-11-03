import Link from "next/link";
import { blenheimFrostForMonth, blenheimGardenActions } from "@/lib/garden/blenheim-calendar";
import { SeedlingDashboardTeaser } from "@/components/seedling-dashboard-teaser";
import "./home.css";

// Seasonal context must update each NZ day; do not prerender it at build time.
export const dynamic = "force-dynamic";

function newZealandDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland", day: "numeric", month: "numeric", year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), 12));
}

function MonthArtwork() {
  return (
    <svg className="home-botanical" viewBox="0 0 340 194" fill="none" aria-hidden="true">
      <path d="M16 172H324" stroke="currentColor" opacity=".22" />
      <path d="M168 170C166 138 168 103 172 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M170 114C139 109 119 92 108 66C142 64 165 85 170 114Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M170 97C199 93 222 73 232 48C196 52 175 72 170 97Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M168 147C138 144 120 131 108 112C136 110 161 125 168 147Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M169 133C195 129 212 117 221 99C194 100 177 114 169 133Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M172 64C166 46 166 33 172 19C184 34 182 49 172 64Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M171 111C149 90 134 78 109 67M171 97C191 73 206 61 230 50M168 147C148 129 134 119 109 113M170 134C192 115 207 106 220 99" stroke="currentColor" strokeWidth=".9" opacity=".6"/>
      <path d="M59 172c0-20-3-36-10-48m10 32c-11-6-16-17-15-29m16 15c8-6 11-16 10-25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M53 139c-8-14-17-17-23-15c5 12 13 17 23 15ZM60 138c6-17 15-23 25-21c-6 13-15 20-25 21Z" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M284 172c1-17 0-31-3-44m3 21c-8-6-12-14-13-21m13 14c7-5 13-13 16-23" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M282 144c-8-14-16-19-24-19c5 12 14 18 24 19ZM285 138c5-13 15-21 25-21c-7 13-16 19-25 21Z" stroke="currentColor" strokeWidth="1.3"/>
      <text x="16" y="187" fill="currentColor" opacity=".6" fontSize="8" letterSpacing="3">SEED · LEAF · GROWTH</text>
    </svg>
  );
}

export default function Home() {
  const now = new Date();
  const localDate = newZealandDate(now);
  const frost = blenheimFrostForMonth(localDate.getMonth());
  const actions = blenheimGardenActions(localDate, "today").slice(0, 4);
  const dateText = new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland",
    weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const monthYear = new Intl.DateTimeFormat("en-NZ", {
    month: "long", year: "numeric" }).format(localDate);
  return (
    <main className="garden-home">
      <a className="home-skip" href="#home-main">Skip to main content</a>
      <header className="home-top">
        <Link className="home-logo" href="/" aria-label="Blenheim Garden home">
          <span className="home-monogram" aria-hidden="true">bg.</span>
          <span className="home-wordmark">BLENHEIM <strong>GARDEN</strong><small>FIELD JOURNAL · MARLBOROUGH</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/" aria-current="page">Overview</Link>
          <Link href="/planner">Garden planner</Link>
          <Link href="/seedlings">Seedling journal</Link>
          <Link href="/3d">3D view</Link>
        </nav>
      </header>

      <div id="home-main" className="home-container">
        <section className="home-lede" aria-labelledby="home-title">
          <div className="home-lede-copy">
            <div className="home-overline"><span className="home-rule" /> EDITION 01 <span className="home-overline-separator">/</span> YOUR GARDEN THROUGH THE YEAR</div>
            <h1 id="home-title">Good things<br /><em>take growing.</em></h1>
            <p>Your measured garden plan, seedling batches and seasonal growing decisions—kept together in one quiet place.</p>
            <div className="home-actions">
              <Link className="home-primary" href="/planner">Open the garden planner <span aria-hidden="true">↗</span></Link>
              <Link className="home-text-link" href="/seedlings">Go to seedling journal <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <aside className="home-season-plate" aria-label="Blenheim seasonal context">
            <div className="home-plate-top"><span>THIS MONTH IN THE GARDEN</span><span>BLENHEIM · NZ</span></div>
            <div className="home-plate-month">{monthYear}</div>
            <MonthArtwork />
            <div className="home-season-bottom">
              <span className="home-numbered-label">01 / SEASONAL NOTE</span>
              <p>{frost.summary}</p>
              <span className="home-climate-label">Historic ground-frost context: {frost.risk} · ~{frost.averageGroundFrostDays.toFixed(1)} days this month</span>
            </div>
          </aside>
        </section>

        <section className="home-section home-library" aria-labelledby="home-spaces">
          <div className="home-section-heading">
            <div><span className="home-eyebrow">THE WORKSPACE</span><h2 id="home-spaces">Three ways to work in the garden.</h2></div>
            <span className="home-section-aside">From planning to planting</span>
          </div>
          <div className="home-workspace-list">
            <Link href="/planner" className="home-workspace-item">
              <span className="home-index">01</span>
              <span className="home-item-body"><strong>Plan the beds</strong><span>Measured beds, paths, structures and planting history.</span></span>
              <span className="home-item-meta">2D GARDEN PLANNER</span><span className="home-link-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href="/seedlings" className="home-workspace-item">
              <span className="home-index">02</span>
              <span className="home-item-body"><strong>Raise the seedlings</strong><span>Record trays, check growth stages and plan the next sowing.</span></span>
              <span className="home-item-meta">SEEDLING COMPANION</span><span className="home-link-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href="/3d" className="home-workspace-item">
              <span className="home-index">03</span>
              <span className="home-item-body"><strong>Explore in 3D</strong><span>See crop placement and garden structures from another angle.</span></span>
              <span className="home-item-meta">GARDEN VISUALISATION</span><span className="home-link-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="home-showcase-entry">Reviewing the new plant models? <Link href="/3d-showcase">Compare classic and botanical 3D ↗</Link></p>
        </section>

        <div className="home-lower">
          <section className="home-section home-seasonal" aria-labelledby="home-actions-title">
            <div className="home-section-heading">
              <div><span className="home-eyebrow">FIELD NOTES · {dateText}</span><h2 id="home-actions-title">Worth doing now</h2></div>
            </div>
            <div className="home-guidance">
              {actions.length ? actions.map((action, i) => (
                <div className="home-guidance-item" key={action.id}>
                  <span className="home-guidance-count">{String(i + 1).padStart(2, "0")}</span>
                  <div><strong>{action.title}</strong><p>{action.detail}</p></div>
                  <span className={"home-action-status status-" + action.status}>{action.status === "protected" ? "Under cover" : action.status === "now" ? "Window" : action.status === "soon" ? "Soon" : "Wait"}</span>
                </div>
              )) : <p>Nothing scheduled for today&apos;s seasonal guide. Check the planner for active planting history.</p>}
              <div className="home-guidance-foot">Planning guidance from historical Blenheim seasons, <strong>not</strong> a live frost forecast. Waihopai Valley can be colder than town.</div>
            </div>
          </section>
          <SeedlingDashboardTeaser />
        </div>
      </div>
      <footer className="home-footer"><span>Blenheim Garden</span><span>GROW WITH THE SEASONS · MARLBOROUGH, NEW ZEALAND</span></footer>
    </main>
  );
}
