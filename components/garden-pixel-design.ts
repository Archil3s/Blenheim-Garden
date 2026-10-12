import type { Garden3DEditor } from "./use-garden-3d-editor";
import { accessIssues, designFootprints, footprintCorners, shadowFootprints } from "@/lib/garden/garden-design";
import { areaPlants, areaRectangle, rowPlants } from "@/lib/garden/plan-editing";
import { projectPixel, type PixelView } from "./garden-pixel-scene";

export function drawPixelDesign(c: CanvasRenderingContext2D, view: PixelView, editor: Garden3DEditor) {
  const path = (points: { x: number; y: number }[], color: string, fill = false) => {
    c.beginPath(); points.forEach((p, i) => { const s = projectPixel(p, view); if (i) c.lineTo(s.x, s.y); else c.moveTo(s.x, s.y); });
    c.strokeStyle = color; c.lineWidth = 2; if (fill) { c.closePath(); c.fillStyle = color; c.fill(); } else c.stroke();
  };
  c.save();
  for (const selected of editor.groupSelections) {
    const color = "#b5fff0";
    const f = designFootprints(editor.plan, true).find((f) => f.id === `${selected.kind}:${selected.id}`);
    if (f && !selected.plantId) { const corners = footprintCorners(f); path([...corners, corners[0]], color); }
    if (selected.kind === "area" && !selected.plantId) { const a = editor.plan.plantingAreas.find((a) => a.id === selected.id); if (a) { const r = areaRectangle(editor.plan, a); path([{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }, { x: r.x, y: r.y }], color); } }
    if (selected.kind === "row" && !selected.plantId) { const row = editor.plan.rows.find((r) => r.id === selected.id); if (row) { const p = rowPlants(row), l = Math.min(...p.map((p) => p.x)) - 12, r = Math.max(...p.map((p) => p.x)) + 12, t = Math.min(...p.map((p) => p.y)) - 12, b = Math.max(...p.map((p) => p.y)) + 12; path([{ x: l, y: t }, { x: r, y: t }, { x: r, y: b }, { x: l, y: b }, { x: l, y: t }], color); } }
  }
  if (editor.comparisonPlan) for (const f of designFootprints(editor.comparisonPlan, true)) { const corners = footprintCorners(f); path([...corners, corners[0]], "#67bcff"); }
  if (editor.accessVisible) for (const issue of accessIssues(editor.plan)) {
    if (issue.from && issue.to) { path([issue.from, issue.to], "#d39529"); const p = projectPixel(issue.point, view); c.font = "12px Arial"; c.fillStyle = "#614519"; c.fillText(`${Math.round(issue.width!)} cm`, p.x, p.y - 5); }
    else { const f = designFootprints(editor.plan).find((f) => f.id === issue.id); if (f) { const corners = footprintCorners(f); path([...corners, corners[0]], "#d39529"); } }
  }
  if (editor.sunPreview.enabled) for (const { footprint: f, delta } of shadowFootprints(editor.plan, editor.sunPreview.date, editor.sunPreview.hour)) {
    const corners = footprintCorners(f);
    path(corners.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })), "#354b7944", true);
    for (let i = 0; i < corners.length; i++) { const a = corners[i], b = corners[(i + 1) % corners.length]; path([a, b, { x: b.x + delta.x, y: b.y + delta.y }, { x: a.x + delta.x, y: a.y + delta.y }], "#354b7922", true); }
  }
  if (editor.spacingVisible) for (const group of [...editor.plan.plantingAreas.map((a) => ({ spacing: a.spacingCm, points: areaPlants(editor.plan, a) })), ...editor.plan.rows.map((r) => ({ spacing: r.spacingCm, points: rowPlants(r) }))]) {
    c.strokeStyle = "#71b46b99"; c.lineWidth = 1; c.beginPath();
    for (const p of group.points) { const s = projectPixel(p, view), radius = group.spacing * view.scale / 2; c.moveTo(s.x + radius, s.y); c.ellipse(s.x, s.y, radius, radius * view.tilt, 0, 0, Math.PI * 2); }
    c.stroke();
  }
  c.restore();
}
