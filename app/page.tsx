const beds = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  status: index < 3 ? "Active" : "Plan",
}));

const quickActions = [
  { icon: "🌱", title: "Seedlings", copy: "Track what is germinating and ready to transplant." },
  { icon: "🗓️", title: "Planting calendar", copy: "See what to sow, transplant and harvest by season." },
  { icon: "🥕", title: "Crops", copy: "Keep varieties, spacing and growing notes in one place." },
  { icon: "🧺", title: "Harvests", copy: "Record harvest dates and rough yields." },
];

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div className="shell hero-inner">
          <div>
            <p className="eyebrow">TE WAIHARAKEKE · BLENHEIM</p>
            <h1>Blenheim Garden</h1>
            <p className="hero-copy">
              A simple home base for beds, seedlings, seasonal planting and harvests.
            </p>
          </div>
          <div className="season-card" aria-label="Current garden focus">
            <span>Current focus</span>
            <strong>Spring setup</strong>
            <small>Plan beds · raise seedlings · prepare soil</small>
          </div>
        </div>
      </header>

      <section className="shell dashboard">
        <section className="today-card">
          <div>
            <p className="section-kicker">TODAY</p>
            <h2>What needs doing?</h2>
          </div>
          <div className="today-actions">
            <button type="button">+ Add garden task</button>
            <button type="button" className="secondary">View this week</button>
          </div>
        </section>

        <section className="quick-grid" aria-label="Garden tools">
          {quickActions.map((item) => (
            <article className="quick-card" key={item.title}>
              <span className="quick-icon" aria-hidden="true">{item.icon}</span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </div>
              <span className="arrow" aria-hidden="true">→</span>
            </article>
          ))}
        </section>

        <section className="beds-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">GARDEN MAP</p>
              <h2>12 garden beds</h2>
            </div>
            <button type="button" className="text-button">Edit layout</button>
          </div>

          <div className="bed-grid">
            {beds.map((bed) => (
              <article className="bed-card" key={bed.id}>
                <div className="bed-top">
                  <span>Bed {bed.id}</span>
                  <small className={bed.status === "Active" ? "active" : "plan"}>{bed.status}</small>
                </div>
                <div className="bed-soil" aria-hidden="true">
                  <span>＋</span>
                </div>
                <p>{bed.status === "Active" ? "Add crop details" : "Tap to plan this bed"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="next-section">
          <div>
            <p className="section-kicker">NEXT</p>
            <h2>Build this into your actual garden planner</h2>
          </div>
          <p>
            The foundation is ready. Next we can make the beds editable, add a Blenheim planting calendar,
            seedling tracking and a simple harvest log without turning the app into a complicated farm system.
          </p>
        </section>
      </section>
    </main>
  );
}
