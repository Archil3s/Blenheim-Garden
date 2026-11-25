import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { trellisBookings } from "@/lib/garden/trellis-planning";
import { formatNzDate } from "@/lib/garden/seedling-local";

export function TrellisAvailability({ plan, date }: { plan: PlannerPlan; date: string }) {
  const supports = trellisBookings(plan, { from: date, until: date });
  return <section aria-label="Trellis availability" className="succession-bed-overview">
    {supports.length ? supports.map(({ support, bookings, beds }) => <section key={support.id}>
      <h4>{support.label || "Climbing support"}</h4>
      <p>{support.heightCm} cm tall{beds.length > 0 && ` · ${beds.map(bed => bed.name).join(", ")}`}</p>
      <p>{bookings.some(item => item.linked) ? "Booked" : bookings.length ? "Possibly occupied" : "Available on this date"}</p>
      {bookings.length > 0 && <ul>{bookings.map(({ planting, linked }) => <li key={planting.id}>
        {planting.variety || planting.crop} · {linked ? "Linked" : "Nearby climbing crop"} · {planting.schedule?.until ? `clears ${formatNzDate(planting.schedule.until)}` : "clear date unknown"}
      </li>)}</ul>}
      <p>{support.heightCm >= 150 ? "Fits climbing beans, climbing cucumbers, cordon tomatoes and climbing peas. Confirm the variety’s mature height."
        : support.heightCm >= 90 ? "Suited to shorter climbing peas. Check the seed packet for mature height." : "Choose a compact variety that suits this low support."}</p>
    </section>) : <p>Add a trellis or climbing support to this garden to check availability.</p>}
  </section>;
}
