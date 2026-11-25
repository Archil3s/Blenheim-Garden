import Link from "next/link";
import { cropArtName, seedSowingForMonth, type SeedCropGuide } from "@/lib/garden/seedling-local";
import { PlantArt } from "./plant-art";

const monthLabel = new Intl.DateTimeFormat("en-NZ", { month: "long", year: "numeric", timeZone: "UTC" });
const seasons = ["Autumn", "Winter", "Spring", "Summer"];

function SowingGroups({ month, showNotes = false }: { month: number; showNotes?: boolean }) {
  const { direct, covered } = seedSowingForMonth(month);
  const groups: { label: string; crops: SeedCropGuide[] }[] = [
    { label: "Direct into soil", crops: direct },
    { label: "Trays or pots under cover", crops: covered },
  ];
  return <div className="home-sowing-groups">
    {groups.map(({ label, crops }) => <section key={label} aria-label={label}>
      <h4>{label}</h4>
      {crops.length ? <ul>
        {crops.map(crop => <li key={crop.crop}>
          <PlantArt className="home-sowing-art" crop={cropArtName(crop.crop)} fallback="🌱" />
          <div><strong>{crop.crop}</strong>{showNotes && <p>{crop.notes}</p>}</div>
        </li>)}
      </ul> : <p>No covered starts in the seed guide this month.</p>}
    </section>)}
  </div>;
}

export function SeasonalSowingGuide({ date }: { date: Date }) {
  const month = date.getUTCMonth();
  // NZ seasons begin in March, June, September and December.
  const seasonIndex = Math.floor((month + 1) / 3);
  const nextStart = seasonIndex * 3 + 2;
  const nextMonths = [0, 1, 2].map(offset => new Date(Date.UTC(date.getUTCFullYear(), nextStart + offset, 1)));
  return <section id="sowing-guide" className="home-section home-sowing" aria-labelledby="sowing-title">
    <div className="home-section-heading">
      <h2 id="sowing-title">What to sow in Blenheim</h2>
      <Link className="home-text-link" href="/seedlings">Open seedling journal <span aria-hidden="true">→</span></Link>
    </div>
    <p>Use these seasonal windows alongside your seed packet, soil conditions and local frost forecast.</p>
    <div className="home-sowing-now">
      <h3>Sow now · {monthLabel.format(date)}</h3>
      <SowingGroups month={month + 1} showNotes />
    </div>
    <h3>Next season · {seasons[seasonIndex % 4]}</h3>
    <div className="home-sowing-months">
      {nextMonths.map((nextMonth, index) => <details key={nextMonth.toISOString()} open={index === 0}>
        <summary>{monthLabel.format(nextMonth)}</summary>
        <SowingGroups month={nextMonth.getUTCMonth() + 1} />
      </details>)}
    </div>
  </section>;
}
