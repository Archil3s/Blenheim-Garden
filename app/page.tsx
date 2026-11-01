import Link from "next/link";
import { blenheimFrostForMonth, blenheimGardenActions } from "@/lib/garden/blenheim-calendar";
import { SeedlingDashboardTeaser } from "@/components/seedling-dashboard-teaser";
import "./home.css";

export default function Home() {
  const today = new Date();
  const frost = blenheimFrostForMonth(today.getMonth());
  const actions = blenheimGardenActions(today, "today").slice(0, 3);
  const date = new Intl.DateTimeFormat("en-NZ", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Pacific/Auckland",
  }).format(today);
  return (
    <main className="garden-home">
      <header className="home-top">
        <Link className="home-logo" href="/">✳ <span>BLENHEIM <strong>GARDEN</strong></span></Link>
        <nav aria-label="Main navigation">
          <Link href="/planner">Garden planner</Link>
          <Link href="/seedlings">Seedlings</Link>
          <Link href="/3d">3D garden</Link>
        </nav>
      </header>
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">MARLBOROUGH GROWING JOURNAL · {date}</span>
          <h1>Your garden,<br /><em>through every season.</em></h1>
          <p>Plan your beds, raise healthier seedlings and stay on top of the next sowing window. One place for your Blenheim garden.</p>
          <div className="home-actions">
            <Link className="home-primary" href="/planner">Open garden planner <span aria-hidden="true">↗</span></Link>
            <Link className="home-secondary" href="/seedlings">Plan your seedlings →</Link>
          </div>
        </div>
        <div className="home-hero-art" aria-hidden="true"><div className="home-sun" /><div className="home-hill one"/><div className="home-hill two"/><div className="home-sprout">✳</div><span>GROW WITH THE SEASONS</span></div>
      </section>
      <div className="home-content">
        <section className="home-section home-tools">
          <div className="home-section-heading"><div><span className="home-eyebrow">YOUR WORKSPACE</span><h2>Pick up where you left off</h2></div></div>
          <div className="home-card-grid">
            <Link href="/planner" className="home-feature-card"><span className="home-feature-icon">▦</span><span className="home-feature-kicker">VISUAL GARDEN</span><strong>Garden planner</strong><p>Design beds, planting rows and trellises in your measured garden.</p><span className="home-card-arrow">Open planner ↗</span></Link>
            <Link href="/seedlings" className="home-feature-card featured"><span className="home-feature-icon">✿</span><span className="home-feature-kicker">NEW · GROWING FROM SEED</span><strong>Seedling Companion</strong><p>Track batches, germination, transplant stages and the next succession sowing.</p><span className="home-card-arrow">Manage seedlings ↗</span></Link>
            <Link href="/3d" className="home-feature-card"><span className="home-feature-icon">◇</span><span className="home-feature-kicker">GARDEN VISUALISATION</span><strong>3D garden</strong><p>Explore the garden layout and structures in a spatial view.</p><span className="home-card-arrow">Explore 3D ↗</span></Link>
          </div>
        </section>
        <div className="home-lower">
          <section className="home-section">
            <div className="home-section-heading"><div><span className="home-eyebrow">SEASONAL CHECKLIST</span><h2>Today in Blenheim</h2></div><span className="home-season-label">{frost.monthName} · seasonal guidance</span></div>
            <div className="home-guidance">
              <p className="home-frost"><strong>Ground frost: {frost.risk} seasonal risk.</strong> {frost.summary}</p>
              {actions.map(action=><div className="home-guidance-item" key={action.id}><span aria-hidden="true">{action.icon}</span><div><strong>{action.title}</strong><p>{action.detail}</p></div></div>)}
              <small>Historical Blenheim averages, not a live weather forecast. Check conditions at your growing site before planting tender crops.</small>
            </div>
          </section>
          <SeedlingDashboardTeaser />
        </div>
      </div>
      <footer className="home-footer">Blenheim Garden · Growing with the seasons in Marlborough</footer>
    </main>
  );
}
