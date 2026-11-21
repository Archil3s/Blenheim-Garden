import { GardenPlanner } from "@/components/garden-planner";
import { gardenPlanBootstrap } from "@/lib/garden/plan-load-bootstrap";

export default function PlannerPage() {
  return <>
    <script dangerouslySetInnerHTML={{ __html: gardenPlanBootstrap }} />
    <GardenPlanner />
  </>;
}
