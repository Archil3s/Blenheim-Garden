import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { areaPlants, areaRectangle, bedRectangle, rowPlants, type PlanSelection, type PointCm } from "@/lib/garden/plan-editing";
import { createCropSprite, createPixelStructure, createPixelTile, createPixelTree } from "./garden-pixel-art";
import { detailedPixelCrop, pixelScenery } from "./garden-pixel-assets";

export type PixelView = { x: number; y: number; scale: number; tilt: number };
export type PixelHit = { x: number; y: number; w: number; h: number; selection: PlanSelection; title: string; line?: [PointCm, PointCm, number] };
const crops = new Map<string, HTMLCanvasElement>(), structures = new Map<string, HTMLCanvasElement>();
let tiles: HTMLCanvasElement[] | null = null, trees: HTMLCanvasElement[] | null = null;

export function pixelCrop(crop: string, variety: string, variant = 0) {
  const detailed = detailedPixelCrop(crop, variety);
  if (detailed) return detailed;
  const key = `${crop}:${variety}:${variant}`;
  if (!crops.has(key)) crops.set(key, createCropSprite(crop, variety, variant));
  return crops.get(key)!;
}

export function projectPixel(point: PointCm, view: PixelView) {
  return { x: view.x + (point.x - 450) * view.scale, y: view.y + (point.y - 540) * view.scale * view.tilt };
}
export function unprojectPixel(point: PointCm, view: PixelView) {
  return { x: (point.x - view.x) / view.scale + 450, y: (point.y - view.y) / (view.scale * view.tilt) + 540 };
}

export function pickPixel(hits: PixelHit[], point: PointCm) {
  for (const hit of [...hits].reverse()) {
    if (hit.line) {
      const [a, b, radius] = hit.line, dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy) <= radius) return hit;
    } else if (point.x >= hit.x && point.x <= hit.x + hit.w && point.y >= hit.y && point.y <= hit.y + hit.h) return hit;
  }
  return null;
}

export function drawPixelGarden(c: CanvasRenderingContext2D, plan: PlannerPlan, view: PixelView, selection: PlanSelection | null, presentation: "artwork" | "exact" = "artwork", growthScale = 1) {
  const { width, height } = gardenDimensions(plan);
  tiles ??= [createPixelTile("grass"), createPixelTile("soil"), createPixelTile("path")];
  trees ??= [createPixelTree(), createPixelTree(1)];
  const hits: PixelHit[] = [], sprites: { y: number; draw: () => void }[] = [];
  c.imageSmoothingEnabled = false;
  const fill = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const box = (color: string, x: number, y: number, w: number, h: number) => { const p = projectPixel({ x, y }, view); fill(color, p.x, p.y, w * view.scale, h * view.scale * view.tilt); };
  const image = (img: HTMLCanvasElement, x: number, y: number, w: number, h: number) => { const p = projectPixel({ x, y }, view); c.drawImage(img, Math.round(p.x - w * view.scale / 2), Math.round(p.y - h * view.scale), Math.round(w * view.scale), Math.round(h * view.scale)); };
  const tileRect = (img: HTMLCanvasElement, x: number, y: number, w: number, h: number, size: number) => {
    const p = projectPixel({ x, y }, view); c.save(); c.beginPath(); c.rect(Math.round(p.x), Math.round(p.y), Math.round(w * view.scale), Math.round(h * view.scale * view.tilt)); c.clip();
    for (let yy = y; yy < y + h; yy += size) for (let xx = x; xx < x + w; xx += size) { const q = projectPixel({ x: xx, y: yy }, view); c.drawImage(img, Math.round(q.x), Math.round(q.y), Math.ceil(size * view.scale), Math.ceil(size * view.scale * view.tilt)); }
    c.restore();
  };
  const border = (x: number, y: number, w: number, h: number, color = "#f5d796") => { const p = projectPixel({ x, y }, view); c.strokeStyle = color; c.lineWidth = 2; c.strokeRect(Math.round(p.x), Math.round(p.y), Math.round(w * view.scale), Math.round(h * view.scale * view.tilt)); };
  const selected = (s: PlanSelection) => selection?.kind === s.kind && selection.id === s.id && selection.plantId === s.plantId;
  const groundHit = (x: number, y: number, w: number, h: number, s: PlanSelection, title: string) => { const p = projectPixel({ x, y }, view); hits.push({ x: p.x, y: p.y, w: w * view.scale, h: h * view.scale * view.tilt, selection: s, title }); };
  // The scenery sits outside the measured 900 × 1080 cm plot.
  fill("#829c57", 0, 0, c.canvas.width, c.canvas.height);
  const corner = unprojectPixel({ x: 0, y: 0 }, view), end = unprojectPixel({ x: c.canvas.width, y: c.canvas.height }, view);
  tileRect(tiles[0], Math.floor(corner.x / 100) * 100, Math.floor(corner.y / 100) * 100, end.x - corner.x + 200, end.y - corner.y + 200, 100);
  tileRect(tiles[2], -160, height + 15, width + 320, 80, 60);
  tileRect(tiles[2], -100, -80, width + 200, 70, 60);
  for (let i = 0; i < 21; i++) {
    const x = -165 + i * 62;
    image(pixelScenery(i % 2 ? "tree-conifer" : "tree-broadleaf") ?? trees[i % 2], x, -95 - i % 3 * 36, 145 + i % 3 * 16, 185 + i % 3 * 14);
  }
  for (let i = 0; i < 8; i++) { image(pixelScenery(i % 2 ? "tree-conifer" : "tree-broadleaf") ?? trees[i % 2], i % 2 ? width + 150 : -145, 50 + i * 132, 150, 195); }
  box("#5c7746", -15, 0, width + 35, height + 15); tileRect(tiles[0], 0, 0, width, height, 100);
  const fence = (x: number, y: number, vertical = false) => {
    const p = projectPixel({ x, y }, view), s = view.scale;
    fill("#523e2d", p.x - 4 * s, p.y - 33 * s, 9 * s, 36 * s);
    fill("#b38652", p.x - 3 * s, p.y - 32 * s, 6 * s, 33 * s);
    fill("#dfb776", p.x - 3 * s, p.y - 33 * s, 7 * s, 5 * s);
    if (vertical) { fill("#815b39", p.x - 2 * s, p.y - 18 * s, 4 * s, 58 * s * view.tilt); fill("#c4985e", p.x - 1 * s, p.y - 18 * s, 2 * s, 58 * s * view.tilt); }
    else { fill("#664830", p.x, p.y - 24 * s, 52 * s, 5 * s); fill("#d0a16a", p.x, p.y - 24 * s, 52 * s, 2 * s); fill("#9c7245", p.x, p.y - 12 * s, 52 * s, 4 * s); }
  };
  for (let x = 0; x < width; x += 50) fence(x, 0);
  for (let y = 0; y < height; y += 50) { fence(0, y, true); fence(width, y, true); }
  const drawLine = (a: PointCm, b: PointCm, color: string, width: number) => { const p = projectPixel(a, view), q = projectPixel(b, view); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.lineWidth = Math.max(1, width * view.scale); c.strokeStyle = color; c.stroke(); return [p, q] as const; };
  for (const o of plan.objects) if (o.type === "path") {
    const [p, q] = drawLine({ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }, "#ae8a60", o.widthCm);
    drawLine({ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }, "#dbc191", Math.max(4, o.widthCm - 8));
    hits.push({ x: 0, y: 0, w: 0, h: 0, selection: { kind: "object", id: o.id }, title: o.label || "Path", line: [p, q, o.widthCm * view.scale / 2] });
    if (selected({ kind: "object", id: o.id })) drawLine({ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }, "#f9db82", 4);
  }
  for (const bed of plan.beds) {
    const r = bedRectangle(bed, plan), s: PlanSelection = { kind: "bed", id: String(bed.id) };
    box("#4e392b", r.x - 5, r.y, r.w + 10, r.h + 16);
    box("#b58250", r.x - 4, r.y - 5, r.w + 8, r.h + 9);
    tileRect(tiles[1], r.x + 3, r.y + 3, Math.max(1, r.w - 6), Math.max(1, r.h - 6), 50);
    box("#dfb27a", r.x - 4, r.y - 5, r.w + 8, 6);
    box("#734c31", r.x - 4, r.y + r.h, r.w + 8, 10);
    box("#c9985d", r.x - 4, r.y + r.h - 3, r.w + 8, 4);
    groundHit(r.x, r.y, r.w, r.h + 12, s, bed.name);
    if (selected(s)) border(r.x - 7, r.y - 8, r.w + 14, r.h + 22);
    sprites.push({ y: r.y + r.h + 18, draw: () => {
      const p = projectPixel({ x: r.x + r.w / 2, y: r.y + r.h + 14 }, view);
      c.font = "bold 7px monospace"; const label = bed.name.length > 19 ? bed.name.slice(0, 18) + "…" : bed.name, w = c.measureText(label).width + 8;
      fill("#5c442e", p.x - w / 2, p.y - 4, w, 11); fill("#dfbe84", p.x - w / 2 + 1, p.y - 4, w - 2, 9); c.fillStyle = "#61482f"; c.textAlign = "center"; c.fillText(label, Math.round(p.x), Math.round(p.y + 3));
    } });
  }
  let drawnPlants = 0, totalPlants = 0;
  const addPlants = (points: (PointCm & { id: string })[], crop: string, variety: string, s: PlanSelection, spacing: number, rect?: { x: number; y: number; w: number; h: number }) => {
    const plantBounds: { x: number; y: number; w: number; h: number }[] = [];
    const stride = Math.max(1, Math.ceil(points.length / 1500));
    totalPlants += points.length;
    // Ground targets preserve access to every saved plant in the illustrated view.
    points.forEach((p) => { const q = projectPixel(p, view), radius = Math.max(3, Math.min(10, spacing * view.scale / 3)); hits.push({ x: q.x - radius, y: q.y - radius, w: radius * 2, h: radius * 2, selection: { ...s, plantId: p.id }, title: `${crop} · ${variety}` }); });
    let illustrations = points;
    if (presentation === "artwork" && rect && points.length > 12) {
      const columns = Math.max(1, Math.floor(rect.w / 124)), rows = Math.max(1, Math.floor(rect.h * view.tilt / 156));
      const used = new Set<string>();
      illustrations = Array.from({ length: columns * rows }, (_, i) => {
        const target = { x: rect.x + (i % columns + .5) * rect.w / columns, y: rect.y + (Math.floor(i / columns) + 1) * rect.h / rows - 8 };
        const representative = points.filter((p) => !used.has(p.id)).reduce<(PointCm & { id: string }) | null>((best, p) => !best || Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(best.x - target.x, best.y - target.y) ? p : best, null);
        if (!representative) return null;
        used.add(representative.id);
        return { ...target, id: representative.id };
      }).filter((p): p is PointCm & { id: string } => p !== null);
      const chosen = points.find((p) => selected({ ...s, plantId: p.id }));
      if (chosen) illustrations = [...illustrations.filter((p) => p.id !== chosen.id), chosen];
    }
    illustrations.forEach((p, i) => {
      const ps = { ...s, plantId: p.id }, chosen = selected(ps);
      if (presentation === "exact" && i % stride && !chosen) return;
      const img = pixelCrop(crop, variety, i % 3);
      const artworkWidth = Math.min(/carrot|radish|onion|garlic/i.test(crop) ? 90 : 112, rect ? Math.max(60, (rect.h * view.tilt + 15) * img.width / img.height) : 112);
      const w = (presentation === "artwork" ? artworkWidth : Math.min(76, Math.max(/carrot|radish|onion|garlic/i.test(crop) ? 28 : 48, spacing * 1.28))) * growthScale;
      const h = w * img.height / img.width, q = projectPixel({ x: p.x, y: p.y + 5 }, view);
      const bounds = { x: q.x - w * view.scale / 2, y: q.y - h * view.scale, w: w * view.scale, h: h * view.scale };
      const gap = 10 * view.scale;
      if (presentation === "artwork" && !chosen && plantBounds.some((b) => bounds.x < b.x + b.w + gap && bounds.x + bounds.w + gap > b.x && bounds.y < b.y + b.h + gap && bounds.y + bounds.h + gap > b.y)) return;
      plantBounds.push(bounds); drawnPlants++;
      sprites.push({ y: chosen ? Infinity : p.y, draw: () => { image(img, p.x, p.y + 5, w, h); hits.push({ ...bounds, h: bounds.h + 6, selection: ps, title: `${crop} · ${variety}` }); if (chosen) { c.strokeStyle = "#ffe4a1"; c.lineWidth = 2; c.strokeRect(Math.round(bounds.x - 2), Math.round(bounds.y - 2), Math.round(bounds.w + 4), Math.round(bounds.h + 7)); } } });
    });
  };
  for (const area of plan.plantingAreas) {
    if (!plan.beds.some((bed) => bed.id === area.bedId)) continue;
    const r = areaRectangle(plan, area), s: PlanSelection = { kind: "area", id: area.id };
    groundHit(r.x, r.y, r.w, r.h, s, `${area.crop} · ${area.variety}`);
    if (selected(s)) border(r.x, r.y, r.w, r.h);
    addPlants(areaPlants(plan, area), area.crop, area.variety, s, area.spacingCm, r);
  }
  for (const row of plan.rows) {
    const s: PlanSelection = { kind: "row", id: row.id };
    const [p, q] = drawLine({ x: row.x1, y: row.y1 }, { x: row.x2, y: row.y2 }, selected(s) ? "#ffe4a1" : "#648849", 3);
    hits.push({ x: 0, y: 0, w: 0, h: 0, selection: s, title: row.crop, line: [p, q, 5] });
    addPlants(rowPlants(row), row.crop, row.variety, s, row.spacingCm);
  }
  for (const o of plan.objects) {
    const s: PlanSelection = { kind: "object", id: o.id };
    if (o.type === "tree" || o.type === "structure") {
      const angle = o.type === "structure" ? o.rotationDeg * Math.PI / 180 : 0;
      const w = o.type === "tree" ? o.diameterCm : Math.abs(Math.cos(angle)) * o.widthCm + Math.abs(Math.sin(angle)) * o.depthCm;
      const h = o.type === "tree" ? w * 1.34 : Math.max((Math.abs(Math.sin(angle)) * o.widthCm + Math.abs(Math.cos(angle)) * o.depthCm) * .65 + o.heightCm * .45, 60);
      sprites.push({ y: o.y, draw: () => {
        const p = projectPixel(o, view);
        if (o.type === "structure") { if (!structures.has(o.kind)) structures.set(o.kind, createPixelStructure(o.kind)); image(pixelScenery(o.kind) ?? structures.get(o.kind)!, o.x, o.y, w, h); }
        else image(pixelScenery(/apple|fruit/i.test(o.label ?? "") ? "tree-apple" : "tree-broadleaf") ?? trees![0], o.x, o.y, w, h);
        const sw = w * view.scale, sh = h * view.scale;
        hits.push({ x: p.x - sw / 2, y: p.y - sh, w: sw, h: sh + 6, selection: s, title: o.label || o.type });
        if (selected(s)) {
          if (o.type === "tree") border(o.x - w / 2, o.y - w / 2, w, w);
          else {
            const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => projectPixel({ x: o.x + x * o.widthCm / 2 * Math.cos(angle) - y * o.depthCm / 2 * Math.sin(angle), y: o.y + x * o.widthCm / 2 * Math.sin(angle) + y * o.depthCm / 2 * Math.cos(angle) }, view));
            c.beginPath(); corners.forEach((p, i) => { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath(); c.strokeStyle = "#ffe4a1"; c.lineWidth = 2; c.stroke();
          }
        }
      } });
    } else if (o.type === "trellis") {
      sprites.push({ y: Math.max(o.y1, o.y2), draw: () => {
        for (const dy of [0, -22, -44]) drawLine({ x: o.x1, y: o.y1 + dy }, { x: o.x2, y: o.y2 + dy }, "#a17c50", 4);
        const [p, q] = drawLine({ x: o.x1, y: o.y1 - 20 }, { x: o.x2, y: o.y2 - 20 }, selected(s) ? "#ffe4a1" : "#d0b17a", 2);
        const count = Math.max(1, Math.ceil(Math.hypot(o.x2 - o.x1, o.y2 - o.y1) / o.postSpacingCm));
        for (let i = 0; i <= count; i++) { const x = o.x1 + (o.x2 - o.x1) * i / count, y = o.y1 + (o.y2 - o.y1) * i / count; box("#62492f", x - 3, y - 55, 6, 60); box("#ddbb7f", x - 2, y - 55, 2, 56); }
        hits.push({ x: 0, y: 0, w: 0, h: 0, selection: s, title: o.label || "Trellis", line: [p, q, 10] });
      } });
    } else if (o.type === "text") {
      sprites.push({ y: o.y, draw: () => { const p = projectPixel(o, view); c.font = `bold ${Math.max(7, o.fontSize * view.scale)}px monospace`; c.fillStyle = "#493d29"; c.textAlign = "left"; c.fillText(o.text, p.x, p.y); hits.push({ x: p.x, y: p.y - 14, w: c.measureText(o.text).width, h: 17, selection: s, title: o.text }); } });
    }
  }
  for (let i = 0; i < 36; i++) {
    const x = i % 2 ? -40 : 940, y = 80 + i * 29;
    sprites.push({ y, draw: () => { const p = projectPixel({ x, y }, view); fill("#4c723e", p.x, p.y - 4, 2, 5); fill(i % 3 ? "#e4ce88" : "#e0a18b", p.x - 1, p.y - 5, 4, 3); fill("#f5e4aa", p.x, p.y - 5, 1, 1); } });
  }
  sprites.sort((a, b) => a.y - b.y).forEach((sprite) => sprite.draw());
  for (let x = 0; x < width; x += 50) if (x < 375 || x >= 525) fence(x, height);
  c.canvas.dataset.pixelPresentation = presentation;
  c.canvas.dataset.pixelPlantCount = String(totalPlants);
  c.canvas.dataset.pixelDrawnPlants = String(drawnPlants);
  return hits;
}
