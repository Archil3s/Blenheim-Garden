import { createElement } from "react";
import type { PlannerShape } from "@/lib/garden/planner-plan";
import { shapeGeometry } from "@/lib/garden/designer-shapes";

export function DesignerShapeArt({ shape }: { shape: PlannerShape }) {
  const geometry = shapeGeometry(shape);
  return <svg viewBox={`0 0 ${shape.widthCm} ${shape.heightCm}`} preserveAspectRatio="none" aria-hidden="true" overflow="visible">
    {createElement(geometry.tag, { ...geometry.attributes, fill: shape.shape === "line" ? "none" : shape.fill,
      stroke: shape.stroke, strokeWidth: shape.lineWidth, strokeLinejoin: "round", strokeLinecap: "round" })}
  </svg>;
}
