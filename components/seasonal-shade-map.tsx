import { useMemo, useState } from "react";
import { bedConditionOptions } from "@/lib/garden/bed-growing-conditions";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { bedRectangle } from "@/lib/garden/plan-editing";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { estimatedBedShade, seasonalShadows } from "@/lib/garden/seasonal-shade";
import { formatNzDate } from "@/lib/garden/seedling-local";

const seasons = [
  { label: "Summer", suffix: "12-21" }, { label: "Autumn", suffix: "03-20" },
  { label: "Winter", suffix: "06-21" }, { label: "Spring", suffix: "09-22" },
];

export function SeasonalShadeMap({ plan, date, onOpenBed }: { plan: PlannerPlan; date: string; onOpenBed: (id: number) => void }) {
  const [season, setSeason] = useState("");
  const [hour, setHour] = useState(12);
  const year = date.slice(0, 4);
  const day = season ? `${year}-${season}` : date;
  const shadows = useMemo(() => seasonalShadows(plan, day, hour), [plan, day, hour]);
  const dimensions = gardenDimensions(plan);
  const beds = plan.beds.map(bed => ({ bed, rect: bedRectangle(bed), shade: estimatedBedShade(bed, shadows) }));
  return <section className="seasonal-shade-map" aria-label="Seasonal shade map">
    <h3>Seasonal shade map</h3>
    <div className="report-controls">
      <label>Season<select value={season} onChange={event => setSeason(event.target.value)}>
        <option value="">Planning date</option>
        {seasons.map(item => <option key={item.suffix} value={item.suffix}>{item.label}</option>)}
      </select></label>
      <label>Solar time<select value={hour} onChange={event => setHour(Number(event.target.value))}>
        <option value={9}>Morning · 9 am</option><option value={12}>Solar noon</option><option value={15}>Afternoon · 3 pm</option>
      </select></label>
    </div>
    <p>{formatNzDate(day)} · Estimated shadow from mapped trees and opaque structures. Tree height is approximated from canopy width. Solar time follows the sun’s position.</p>
    <svg role="img" aria-label="Estimated shadows on the measured garden map" viewBox={`0 0 ${dimensions.widthCm} ${dimensions.heightCm}`}>
      {beds.map(({ bed, rect }) => <rect key={bed.id} x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="#e9ead9" />)}
      {shadows.map(shape => <polygon key={shape.id} points={shape.points.map(point => `${point.x},${point.y}`).join(" ")} fill="#303f66" fillOpacity=".37" />)}
      {beds.map(({ bed, rect }) => <rect key={bed.id} x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="none" stroke="#44584a" vectorEffect="non-scaling-stroke">
        <title>{bed.name}</title>
      </rect>)}
    </svg>
    <ul className="seasonal-shade-results">
      {beds.map(({ bed, shade }) => <li key={bed.id}>
        <div><strong>{bed.name}</strong><small>About {Math.round(shade / 5) * 5}% of the bed shaded at this time</small>
          {bed.growingConditions?.light && <small>Saved observation · {bedConditionOptions.light[bed.growingConditions.light]}</small>}</div>
        <button type="button" onClick={() => onOpenBed(bed.id)} aria-label={`Review light for ${bed.name}`}>Review bed</button>
      </li>)}
    </ul>
  </section>;
}
