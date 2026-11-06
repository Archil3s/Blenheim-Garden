import type { PlannerRow } from "@/lib/garden/planner-plan";
import { blockCorners, resizePlantingBlock } from "@/lib/garden/planting-block";
import { plantFacts } from "@/lib/garden/plant-catalogue-filters";

export function PlantingBlockControls({ row, onChange }: { row: PlannerRow; onChange: (row: PlannerRow) => void }) {
  const width = Math.hypot(row.x2 - row.x1, row.y2 - row.y1);
  const density = plantFacts(row.crop, row.variety)?.squareFootCount ?? 0;
  function update(w: number, h: number, mode = row.block?.mode ?? "block", rowSpacing = row.block?.rowSpacingCm ?? plantFacts(row.crop, row.variety)?.rowSpacingCm ?? row.spacingCm) {
    const next = resizePlantingBlock(row, Math.max(0, w), Math.max(0, h), {
      mode, depthCm: h, rowSpacingCm: Math.max(2, rowSpacing),
      ...(mode === "square-foot" ? { plantsPerSquareFoot: density } : {}),
    });
    if (blockCorners(next).some(p => p.x < 0 || p.x > 900 || p.y < 0 || p.y > 1080)) return;
    onChange(next);
  }
  return <>
    <label>Planting layout<select aria-label="Planting layout" value={row.block?.mode ?? "row"} onChange={event => {
      if (event.target.value === "row") { const { block: _block, placements: _placements, ...rest } = row; void _block; void _placements; onChange({ ...rest, count: Math.max(1, Math.floor(width / row.spacingCm) + 1) }); }
      else update(width, row.block?.depthCm ?? row.spacingCm, event.target.value as "block" | "square-foot");
    }}><option value="row">Row</option><option value="block">Block</option><option value="square-foot" disabled={!density}>Square foot</option></select></label>
    {row.block && <>
      <div className="gv-field-grid"><label>Block width (cm)<input type="number" min={0} max={900} step="any" value={Number(width.toFixed(2))} onChange={event => update(Number(event.target.value), row.block!.depthCm)} /></label>
        <label>Block depth (cm)<input type="number" min={0} max={1080} step="any" value={Number(row.block.depthCm.toFixed(2))} onChange={event => update(width, Number(event.target.value))} /></label></div>
      {row.block.mode === "block" ? <label>Between rows (cm)<input type="number" min={2} value={row.block.rowSpacingCm} onChange={event => update(width, row.block!.depthCm, "block", Number(event.target.value))} /></label>
        : <p className="gv-help">{row.block.plantsPerSquareFoot} plants per 30.48 cm square.</p>}
    </>}
  </>;
}
