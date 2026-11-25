import { bedRectangle, type PointCm } from "./plan-editing";
import type { PlannerBed, PlannerPlan } from "./planner-plan";

const radians = Math.PI / 180;
const blenheimLatitude = -41.51 * radians;

export function blenheimSun(day: string, solarHour: number) {
  const date = new Date(`${day}T12:00:00Z`);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1, 12);
  const dayOfYear = (date.getTime() - yearStart) / 86400000 + 1;
  const declination = -23.44 * radians * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365.2422);
  const hourAngle = (solarHour - 12) * 15 * radians;
  const east = -Math.cos(declination) * Math.sin(hourAngle);
  const north = Math.cos(blenheimLatitude) * Math.sin(declination)
    - Math.sin(blenheimLatitude) * Math.cos(declination) * Math.cos(hourAngle);
  const up = Math.sin(blenheimLatitude) * Math.sin(declination)
    + Math.cos(blenheimLatitude) * Math.cos(declination) * Math.cos(hourAngle);
  return { east, north, up };
}

function cross(origin: PointCm, a: PointCm, b: PointCm) {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function convexHull(points: PointCm[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  function half(points: PointCm[]) {
    const edge: PointCm[] = [];
    for (const point of points) {
      while (edge.length > 1 && cross(edge[edge.length - 2], edge[edge.length - 1], point) <= 0) edge.pop();
      edge.push(point);
    }
    return edge.slice(0, -1);
  }
  return [...half(sorted), ...half(sorted.reverse())];
}

export type ShadeShape = { id: string; points: PointCm[] };

export function seasonalShadows(plan: PlannerPlan, date: string, solarHour: number): ShadeShape[] {
  const sun = blenheimSun(date, solarHour);
  if (!(sun.up > 0.025)) return [];
  const compass = plan.objects.find(object => object.type === "structure" && object.kind === "compass");
  const angle = (compass?.type === "structure" ? compass.rotationDeg : 0) * radians;
  const shadeX = (-sun.east * Math.cos(angle) - sun.north * Math.sin(angle)) / sun.up;
  const shadeY = (-sun.east * Math.sin(angle) + sun.north * Math.cos(angle)) / sun.up;
  function cast(points: PointCm[], bottom: number, top: number) {
    return convexHull([bottom, top].flatMap(height => points.map(point => ({
      x: point.x + height * shadeX, y: point.y + height * shadeY,
    }))));
  }
  return plan.objects.flatMap(object => {
    if (object.type === "tree") {
      const radius = object.diameterCm / 2;
      const crown = Array.from({ length: 12 }, (_, index) => {
        const angle = index * Math.PI / 6;
        return { x: object.x + radius * Math.cos(angle), y: object.y + radius * Math.sin(angle) };
      });
      return [{ id: object.id, points: cast(crown, object.diameterCm * .25, object.diameterCm) }];
    }
    if (object.type !== "structure" || !/shed|wall|solid-fence|shade-cloth/.test(object.kind)
      || /wall-tower|wall-mounted/.test(object.kind)) return [];
    const angle = object.rotationDeg * radians;
    const corners = [-1, 1].flatMap(x => [-1, 1].map(y => ({
      x: object.x + x * object.widthCm / 2 * Math.cos(angle) - y * object.depthCm / 2 * Math.sin(angle),
      y: object.y + x * object.widthCm / 2 * Math.sin(angle) + y * object.depthCm / 2 * Math.cos(angle),
    })));
    return [{ id: object.id, points: cast(corners, object.kind.includes("shade-cloth") ? object.heightCm : 0, object.heightCm) }];
  });
}

export function estimatedBedShade(bed: PlannerBed, shadows: ShadeShape[]) {
  const rect = bedRectangle(bed);
  let shaded = 0;
  for (let horizontal = 0; horizontal < 10; horizontal++) for (let vertical = 0; vertical < 10; vertical++) {
    const point = { x: rect.x + rect.w * (horizontal + .5) / 10, y: rect.y + rect.h * (vertical + .5) / 10 };
    if (shadows.some(shape => shape.points.length >= 3 && shape.points.every((start, index) =>
      cross(start, shape.points[(index + 1) % shape.points.length], point) >= 0))) shaded++;
  }
  return shaded;
}
