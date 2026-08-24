"use client";

import { useMemo, useState } from "react";
import type { PlannerBed, PlannerPlan, PlannerPlantingArea } from "@/lib/garden/planner-plan";

const GARDEN_W = 900;
const GARDEN_H = 1080;
const BED_HEIGHT = 34;

type Props = { plan: PlannerPlan };
type ViewMode = "iso" | "top";
type InspectItem = { title: string; subtitle?: string; detail?: string };
type Point = { x: number; y: number };

const DEFAULT_INSPECT: InspectItem = {
  title: "3D garden",
  subtitle: "Tap a bed, crop, path, trellis or tree.",
  detail: "Phone-safe isometric view",
};

function bedRect(bed: PlannerBed) {
  return {
    x: bed.x / 100 * GARDEN_W,
    y: bed.y / 100 * GARDEN_H,
    w: bed.w / 100 * GARDEN_W,
    h: bed.h / 100 * GARDEN_H,
  };
}

function project(x: number, z: number, heightCm: number, view: ViewMode): Point {
  if (view === "top") {
    return { x: 105 + x * 0.86, y: 60 + z * 0.58 };
  }
  const cx = x - GARDEN_W / 2;
  const cz = z - GARDEN_H / 2;
  return {
    x: 500 + (cx - cz) * 0.42,
    y: 270 + (cx + cz) * 0.2 - heightCm * 0.72,
  };
}

function points(value: Point[]) {
  return value.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function cropKind(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("strawber")) return "strawberry";
  if (name.includes("blueber") || name.includes("raspber")) return "berry";
  if (name.includes("pumpkin") || name.includes("squash")) return "pumpkin";
  if (name.includes("broccoli") || name.includes("cauliflower")) return "broccoli";
  if (name.includes("carrot")) return "carrot";
  if (name.includes("bean") || name.includes("pea")) return "bean";
  if (name.includes("corn") || name.includes("maize")) return "corn";
  if (name.includes("chilli") || name.includes("pepper")) return "pepper";
  return "leafy";
}

function cropColor(crop: string) {
  const kind = cropKind(crop);
  if (kind === "tomato" || kind === "strawberry" || kind === "pepper") return "#d84d3f";
  if (kind === "berry") return "#5368a9";
  if (kind === "pumpkin" || kind === "carrot") return "#df842d";
  if (kind === "broccoli") return "#376d3d";
  if (kind === "corn") return "#78a847";
  return "#5f9a53";
}

function representativePositions(area: PlannerPlantingArea) {
  const count = Math.min(7, Math.max(1, area.count || 1));
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * Math.max(0.5, area.w / Math.max(1, area.h)))));
  const rows = Math.max(1, Math.ceil(count / columns));
  return Array.from({ length: count }, (_, index) => ({
    x: ((index % columns) + 1) / (columns + 1),
    y: (Math.floor(index / columns) + 1) / (rows + 1),
  }));
}

function PlantGlyph({ x, y, crop, onSelect }: { x: number; y: number; crop: string; onSelect: () => void }) {
  const kind = cropKind(crop);
  const fruit = cropColor(crop);
  const tall = kind === "tomato" || kind === "bean" || kind === "corn";
  const scale = tall ? 1.12 : 0.9;

  return (
    <g className="gv-iso-plant" transform={`translate(${x} ${y}) scale(${scale})`} onClick={onSelect} role="button" tabIndex={0}>
      {tall && <path d="M0 12 L0 -19" stroke="#4f7e45" strokeWidth="3" strokeLinecap="round" />}
      <ellipse cx="-8" cy={tall ? -9 : 1} rx="10" ry="4.7" transform="rotate(-24 -8 0)" fill="#4f8b4b" />
      <ellipse cx="8" cy={tall ? -3 : -4} rx="10" ry="4.7" transform="rotate(24 8 0)" fill="#6ca557" />
      <ellipse cx="0" cy={tall ? -16 : 2} rx="8" ry="4.2" fill="#5c9850" />
      {(kind === "tomato" || kind === "strawberry" || kind === "berry" || kind === "pumpkin" || kind === "pepper") && (
        <circle cx="7" cy={tall ? 5 : 7} r={kind === "pumpkin" ? 7 : 4.5} fill={fruit} stroke="rgba(255,255,255,.55)" strokeWidth="1" />
      )}
      {kind === "broccoli" && <circle cx="0" cy="-6" r="7" fill="#376d3d" />}
      {kind === "carrot" && <path d="M0 3 L5 15 L-5 15 Z" fill="#df842d" />}
    </g>
  );
}

export function GardenWorkspaceIsometric({ plan }: Props) {
  const [view, setView] = useState<ViewMode>("iso");
  const [inspect, setInspect] = useState<InspectItem>(DEFAULT_INSPECT);

  const beds = useMemo(() => plan.beds.map((bed) => {
    const rect = bedRect(bed);
    const top = [
      project(rect.x, rect.y, BED_HEIGHT, view),
      project(rect.x + rect.w, rect.y, BED_HEIGHT, view),
      project(rect.x + rect.w, rect.y + rect.h, BED_HEIGHT, view),
      project(rect.x, rect.y + rect.h, BED_HEIGHT, view),
    ];
    const bottom = [
      project(rect.x, rect.y, 0, view),
      project(rect.x + rect.w, rect.y, 0, view),
      project(rect.x + rect.w, rect.y + rect.h, 0, view),
      project(rect.x, rect.y + rect.h, 0, view),
    ];
    return { bed, rect, top, bottom };
  }), [plan.beds, view]);

  return (
    <div className="gv-iso-workspace" data-testid="inline-3d-workspace" data-renderer="isometric-svg">
      <svg className="gv-iso-scene" viewBox="0 0 1000 820" preserveAspectRatio="xMidYMid meet" aria-label="Interactive 3D garden workspace">
        <defs>
          <linearGradient id="gvIsoGrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#789b62" />
            <stop offset="1" stopColor="#5f8152" />
          </linearGradient>
          <filter id="gvIsoShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#14251e" floodOpacity=".2" />
          </filter>
        </defs>

        <rect x="0" y="0" width="1000" height="820" fill="#bfd3ca" />
        <path d="M40 72 H960 V690 H40 Z" fill="url(#gvIsoGrass)" rx="22" />

        {plan.objects.map((object) => {
          if (object.type === "path") {
            const a = project(object.x1, object.y1, 2, view);
            const b = project(object.x2, object.y2, 2, view);
            return <line key={object.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b8ad95" strokeWidth={Math.max(8, object.widthCm * 0.15)} strokeLinecap="round" onClick={() => setInspect({ title: object.label || "Path", subtitle: `${object.widthCm} cm wide` })} />;
          }
          if (object.type === "trellis") {
            const a = project(object.x1, object.y1, 4, view);
            const b = project(object.x2, object.y2, 4, view);
            return (
              <g key={object.id} onClick={() => setInspect({ title: object.label || "Trellis", subtitle: `${(object.heightCm / 100).toFixed(1)} m high` })}>
                <line x1={a.x} y1={a.y - 38} x2={b.x} y2={b.y - 38} stroke="#6e776f" strokeWidth="3" />
                <line x1={a.x} y1={a.y} x2={a.x} y2={a.y - 55} stroke="#70543c" strokeWidth="5" />
                <line x1={b.x} y1={b.y} x2={b.x} y2={b.y - 55} stroke="#70543c" strokeWidth="5" />
              </g>
            );
          }
          if (object.type === "tree") {
            const p = project(object.x, object.y, 0, view);
            const radius = Math.max(16, Math.min(42, object.diameterCm * 0.12));
            return (
              <g key={object.id} className="gv-iso-tree" onClick={() => setInspect({ title: object.label || "Tree", subtitle: `${(object.diameterCm / 100).toFixed(1)} m canopy` })}>
                <path d={`M${p.x} ${p.y} L${p.x} ${p.y - 42}`} stroke="#6f4f35" strokeWidth="7" strokeLinecap="round" />
                <circle cx={p.x} cy={p.y - 58} r={radius} fill="#477a48" stroke="#315f38" strokeWidth="3" />
                <circle cx={p.x - radius * 0.45} cy={p.y - 52} r={radius * 0.64} fill="#558951" />
              </g>
            );
          }
          return null;
        })}

        {beds.map(({ bed, rect, top, bottom }) => {
          const active = plan.plantingAreas.find((area) => area.bedId === bed.id);
          return (
            <g key={bed.id} className="gv-iso-bed" filter="url(#gvIsoShadow)" onClick={() => setInspect({
              title: bed.name,
              subtitle: active ? `${active.crop}${active.variety ? ` · ${active.variety}` : ""}` : "Raised bed",
              detail: `${(rect.w / 100).toFixed(1)} × ${(rect.h / 100).toFixed(1)} m`,
            })}>
              {view === "iso" && <>
                <polygon points={points([top[1], top[2], bottom[2], bottom[1]])} fill="#765136" />
                <polygon points={points([top[2], top[3], bottom[3], bottom[2]])} fill="#8f6543" />
              </>}
              <polygon points={points(top)} fill="#704b34" stroke="#c39266" strokeWidth="7" strokeLinejoin="round" />
              <polygon points={points(top.map((point) => ({ x: point.x, y: point.y + (view === "iso" ? 2 : 0) })))} fill="none" stroke="#9b6d48" strokeWidth="2" />
            </g>
          );
        })}

        {plan.plantingAreas.flatMap((area) => {
          const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
          if (!bed) return [];
          const rect = bedRect(bed);
          const ax = rect.x + area.x / 100 * rect.w;
          const az = rect.y + area.y / 100 * rect.h;
          const aw = area.w / 100 * rect.w;
          const ah = area.h / 100 * rect.h;
          return representativePositions(area).map((position, index) => {
            const p = project(ax + aw * position.x, az + ah * position.y, BED_HEIGHT + 12, view);
            return (
              <PlantGlyph
                key={`${area.id}-${index}`}
                x={p.x}
                y={p.y}
                crop={area.crop}
                onSelect={() => setInspect({ title: area.crop, subtitle: area.variety || bed.name, detail: `${area.spacingCm} cm spacing · ${area.count} planned` })}
              />
            );
          });
        })}

        {plan.rows.flatMap((row) => {
          const count = Math.min(7, Math.max(1, row.count || 1));
          return Array.from({ length: count }, (_, index) => {
            const t = count === 1 ? 0.5 : index / (count - 1);
            const p = project(row.x1 + (row.x2 - row.x1) * t, row.y1 + (row.y2 - row.y1) * t, 18, view);
            return <PlantGlyph key={`${row.id}-${index}`} x={p.x} y={p.y} crop={row.crop} onSelect={() => setInspect({ title: row.crop, subtitle: row.variety, detail: `${row.spacingCm} cm spacing` })} />;
          });
        })}
      </svg>

      <div className="gv-iso-live"><span /> <strong>LIVE 3D</strong><small>Phone-safe</small></div>
      <div className="gv-iso-controls" role="group" aria-label="3D camera controls">
        <button type="button" className={view === "iso" ? "active" : ""} onClick={() => setView("iso")}>Iso</button>
        <button type="button" className={view === "top" ? "active" : ""} onClick={() => setView("top")}>Top</button>
      </div>
      <div className="gv-iso-inspector" aria-live="polite">
        <span>{inspect === DEFAULT_INSPECT ? "EXPLORE" : "SELECTED"}</span>
        <strong>{inspect.title}</strong>
        {inspect.subtitle && <small>{inspect.subtitle}</small>}
        {inspect.detail && <em>{inspect.detail}</em>}
      </div>
    </div>
  );
}
