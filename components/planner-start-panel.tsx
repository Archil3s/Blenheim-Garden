export function PlannerStartPanel({ blank = false, onBed, onPlants, onObjects, onDismiss }: {
  blank?: boolean; onBed: () => void; onPlants: () => void; onObjects: () => void; onDismiss?: () => void;
}) {
  return <section className={`planner-start-panel ${blank ? "is-blank" : ""}`} aria-label={blank ? "Start your garden" : "Add to your garden"}>
    {onDismiss && <button type="button" className="planner-start-dismiss" aria-label="Hide getting started" onClick={onDismiss}>×</button>}
    <h2>{blank ? "Start your garden" : "What would you like to add?"}</h2>
    <p>{blank ? "Your empty 9 × 10.8 m plan is ready." : "Choose a tool, or select something on the plan to edit it."}</p>
    <div><button type="button" onClick={onBed}>{blank ? "Add a 1.2 × 2.4 m bed" : "Draw a bed"}</button>
      <button type="button" onClick={onPlants}>Browse plants</button><button type="button" onClick={onObjects}>Browse objects & structures</button></div>
    <small>Wheel or pinch to zoom. Space-drag to pan. Fit brings the garden back.</small>
  </section>;
}
