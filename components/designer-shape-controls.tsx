import type { PlannerShape, PlannerShapeKind } from "@/lib/garden/planner-plan";

export type ShapeStyle = Pick<PlannerShape, "shape" | "stroke" | "fill" | "lineWidth">;

export function DesignerShapeControls({ value, onChange }: { value: ShapeStyle; onChange: (value: ShapeStyle) => void }) {
  const names: Record<PlannerShapeKind, string> = { rectangle: "Rectangle", triangle: "Triangle", ellipse: "Ellipse", line: "Line" };
  const outlineSymbols = { rectangle: "▭", triangle: "△", ellipse: "◯", line: "╱" };
  const filledSymbols = { rectangle: "■", triangle: "▲", ellipse: "●" };
  return <div className="designer-shape-controls">
    <h3>Outline shapes</h3>
    <div className="designer-colour-row"><label>Line colour<input type="color" value={value.stroke} onChange={(event) => onChange({ ...value, stroke: event.target.value })} /></label><label>Line width<input type="number" min={1} max={20} value={value.lineWidth} onChange={(event) => onChange({ ...value, lineWidth: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} /></label></div>
    <div className="designer-shape-buttons">{(["rectangle", "triangle", "ellipse", "line"] as const).map((shape) => <button type="button" key={shape} aria-label={shape === "line" ? "Line" : `Outline ${names[shape]}`} aria-pressed={value.shape === shape && value.fill === "none"} onClick={() => onChange({ ...value, shape, fill: "none" })}><span aria-hidden="true">{outlineSymbols[shape]}</span><small>{names[shape]}</small></button>)}</div>
    <h3>Filled shapes</h3>
    <label>Fill colour<input type="color" value={value.fill === "none" ? "#b7c59f" : value.fill} onChange={(event) => onChange({ ...value, fill: event.target.value })} /></label>
    <div className="designer-shape-buttons filled">{(["rectangle", "triangle", "ellipse"] as const).map((shape) => <button type="button" key={shape} aria-label={`Filled ${names[shape]}`} aria-pressed={value.shape === shape && value.fill !== "none"} onClick={() => onChange({ ...value, shape, fill: value.fill === "none" ? "#b7c59f" : value.fill })}><span aria-hidden="true">{filledSymbols[shape]}</span><small>{names[shape]}</small></button>)}</div>
    <p>Drag across the garden to draw. Select a shape to adjust its dimensions.</p>
  </div>;
}

export function DesignerShapeInspector({ shape, onChange, onDuplicate, onDelete }: { shape: PlannerShape; onChange: (shape: PlannerShape) => void; onDuplicate: () => void; onDelete: () => void }) {
  return <div className="gv-selection-panel designer-shape-inspector">
    <div className="gv-selection-hero"><span>◇</span><div><small>DRAWING SHAPE</small><h2>{shape.shape[0].toUpperCase() + shape.shape.slice(1)}</h2><p>{Math.round(shape.widthCm)} × {Math.round(shape.heightCm)} cm</p></div></div>
    <label><input type="checkbox" checked={shape.locked} onChange={(event) => onChange({ ...shape, locked: event.target.checked })} />Lock shape</label>
    <fieldset disabled={shape.locked}>
      <div className="gv-field-grid">{(["widthCm", "heightCm", "rotationDeg"] as const).map((key) => <label key={key}>{key === "widthCm" ? "Width (cm)" : key === "heightCm" ? "Height (cm)" : "Rotation (degrees)"}<input type="number" aria-label={key === "widthCm" ? "Shape width (cm)" : key === "heightCm" ? "Shape height (cm)" : "Shape rotation (degrees)"} min={key === "rotationDeg" ? -360 : key === "widthCm" ? 5 : 1} max={key === "rotationDeg" ? 360 : key === "widthCm" ? (shape.shape === "line" ? 1500 : 900) : 1080} value={Math.round(shape[key])} onChange={(event) => onChange({ ...shape, [key]: key === "rotationDeg" ? Number(event.target.value) || 0 : Math.max(key === "widthCm" ? 5 : 1, Math.min(key === "widthCm" ? (shape.shape === "line" ? 1500 : 900) : 1080, Number(event.target.value) || 1)) })} /></label>)}</div>
      <label>Shape outline<input type="color" value={shape.stroke} onChange={(event) => onChange({ ...shape, stroke: event.target.value })} /></label>
      <label>Shape line width<input type="number" min={1} max={20} value={shape.lineWidth} onChange={(event) => onChange({ ...shape, lineWidth: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} /></label>
      {shape.shape !== "line" && <><label><input type="checkbox" checked={shape.fill !== "none"} onChange={(event) => onChange({ ...shape, fill: event.target.checked ? "#b7c59f" : "none" })} />Fill shape</label>{shape.fill !== "none" && <label>Shape fill<input type="color" value={shape.fill} onChange={(event) => onChange({ ...shape, fill: event.target.value })} /></label>}</>}
      <div className="gv-edit-actions"><button type="button" onClick={onDuplicate}>Duplicate</button><button type="button" className="danger" onClick={onDelete}>Delete</button></div>
    </fieldset>
  </div>;
}
