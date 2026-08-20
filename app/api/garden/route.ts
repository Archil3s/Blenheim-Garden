import { getGardenDb, getGardenWriteToken } from "@/lib/garden/cloudflare-db";
import { ensureGardenLayoutSchema } from "@/lib/garden/layout-schema";
import { ensureGardenPlantingAreaSchema } from "@/lib/garden/planting-area-schema";
import type {
  PlannerBed,
  PlannerLayoutObject,
  PlannerPlan,
  PlannerPlantingArea,
  PlannerPlantingPattern,
  PlannerRow,
  PlannerVisualSpacing,
} from "@/lib/garden/planner-plan";
import { GARDEN_ID } from "@/lib/garden/storage-contract";

export const dynamic = "force-dynamic";

const MAX_BED_EDGE_PERCENT = 105.01;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1080;
const PATTERNS = new Set<PlannerPlantingPattern>(["grid", "staggered", "rows", "natural", "single"]);
const VISUAL_SPACING = new Set<PlannerVisualSpacing>(["tight", "normal", "wide"]);

type BedRow = {
  id: string;
  label: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
};

type PlantingAreaDb = {
  id: string;
  bed_id: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  pattern: PlannerPlantingPattern;
  icon_size_px: number;
  visual_spacing: PlannerVisualSpacing;
  planting_id: string;
  crop_name: string;
  crop_icon: string | null;
  variety: string | null;
  spacing_cm: number | null;
  estimated_count: number | null;
};

type PlantingRowDb = {
  id: string;
  x1_cm: number;
  y1_cm: number;
  x2_cm: number;
  y2_cm: number;
  crop_name: string;
  crop_icon: string | null;
  variety: string | null;
  spacing_cm: number | null;
  estimated_count: number | null;
};

type LayoutRow = {
  id: string;
  object_type: "path" | "trellis" | "tree" | "text";
  x1_cm: number | null;
  y1_cm: number | null;
  x2_cm: number | null;
  y2_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  diameter_cm: number | null;
  post_spacing_cm: number | null;
  text_value: string | null;
  label: string | null;
  point_xy: string | null;
  font_size: number | null;
};

type ActivePlanting = {
  id: string;
  bed_id: string | null;
  row_id: string | null;
  area_id: string | null;
  crop_name: string;
  crop_icon: string | null;
  variety: string | null;
  spacing_cm: number | null;
  estimated_count: number | null;
};

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function canvasPoint(value: Record<string, unknown>, xField: string, yField: string, label: string) {
  if (!finite(value[xField]) || !finite(value[yField])) throw new Error(`${label} has invalid coordinates.`);
  const x = value[xField] as number;
  const y = value[yField] as number;
  if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) throw new Error(`${label} is outside the garden canvas.`);
  return { x, y };
}

function parseLayoutObject(raw: unknown, index: number): PlannerLayoutObject {
  if (!raw || typeof raw !== "object") throw new Error(`Drawing object ${index + 1} is invalid.`);
  const object = raw as Record<string, unknown>;
  const id = optionalString(object.id);
  const type = object.type;
  if (!id || id.length > 160 || !["path", "trellis", "tree", "text"].includes(String(type))) throw new Error(`Drawing object ${index + 1} is invalid.`);

  if (type === "path" || type === "trellis") {
    const start = canvasPoint(object, "x1", "y1", `Drawing object ${index + 1}`);
    const end = canvasPoint(object, "x2", "y2", `Drawing object ${index + 1}`);
    if (Math.hypot(end.x - start.x, end.y - start.y) < 5) throw new Error(`Drawing object ${index + 1} is too short.`);
    if (type === "path") {
      if (!finite(object.widthCm) || object.widthCm <= 0 || object.widthCm > 400) throw new Error(`Path ${index + 1} has an invalid width.`);
      return { id, type, x1: start.x, y1: start.y, x2: end.x, y2: end.y, widthCm: object.widthCm, label: optionalString(object.label) };
    }
    if (!finite(object.heightCm) || object.heightCm <= 0 || object.heightCm > 500) throw new Error(`Trellis ${index + 1} has an invalid height.`);
    if (!finite(object.postSpacingCm) || object.postSpacingCm <= 0 || object.postSpacingCm > 1000) throw new Error(`Trellis ${index + 1} has invalid post spacing.`);
    return { id, type, x1: start.x, y1: start.y, x2: end.x, y2: end.y, heightCm: object.heightCm, postSpacingCm: object.postSpacingCm, label: optionalString(object.label) };
  }

  const point = canvasPoint(object, "x", "y", `Drawing object ${index + 1}`);
  if (type === "tree") {
    if (!finite(object.diameterCm) || object.diameterCm < 20 || object.diameterCm > 1000) throw new Error(`Tree ${index + 1} has an invalid canopy diameter.`);
    return { id, type, x: point.x, y: point.y, diameterCm: object.diameterCm, label: optionalString(object.label) };
  }

  const text = optionalString(object.text);
  if (!text || text.length > 200) throw new Error(`Text label ${index + 1} is invalid.`);
  return { id, type: "text", x: point.x, y: point.y, text, fontSize: finite(object.fontSize) ? clamp(object.fontSize, 8, 40) : 13 };
}

function areaCapacity(area: Pick<PlannerPlantingArea, "spacingCm" | "x" | "y" | "w" | "h" | "pattern">, bed: PlannerBed) {
  if (area.pattern === "single") return 1;
  const bedWidthCm = bed.w / 100 * CANVAS_WIDTH;
  const bedHeightCm = bed.h / 100 * CANVAS_HEIGHT;
  const widthCm = bedWidthCm * area.w / 100;
  const heightCm = bedHeightCm * area.h / 100;
  return Math.max(1, Math.floor(widthCm / area.spacingCm) * Math.floor(heightCm / area.spacingCm));
}

function parsePlan(value: unknown): PlannerPlan {
  if (!value || typeof value !== "object") throw new Error("Plan payload is required.");
  const candidate = value as { beds?: unknown; plantingAreas?: unknown; rows?: unknown; objects?: unknown };
  if (!Array.isArray(candidate.beds) || !Array.isArray(candidate.rows)) throw new Error("Plan must contain beds and rows arrays.");
  const objectInput = candidate.objects === undefined ? [] : candidate.objects;
  if (!Array.isArray(objectInput)) throw new Error("Plan drawing objects must be an array.");
  if (candidate.beds.length > 250 || candidate.rows.length > 1000 || objectInput.length > 1000) throw new Error("Plan is larger than the supported limits.");

  const beds: PlannerBed[] = candidate.beds.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Bed ${index + 1} is invalid.`);
    const bed = raw as Record<string, unknown>;
    if (!Number.isInteger(bed.id) || (bed.id as number) < 1) throw new Error(`Bed ${index + 1} has an invalid id.`);
    if (typeof bed.name !== "string" || bed.name.trim().length === 0 || bed.name.length > 120) throw new Error(`Bed ${index + 1} has an invalid name.`);
    for (const field of ["x", "y", "w", "h"] as const) if (!finite(bed[field])) throw new Error(`Bed ${index + 1} has invalid geometry.`);
    const x = bed.x as number;
    const y = bed.y as number;
    const w = bed.w as number;
    const h = bed.h as number;
    if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > MAX_BED_EDGE_PERCENT || y + h > MAX_BED_EDGE_PERCENT) throw new Error(`Bed ${index + 1} is outside the garden canvas.`);
    return {
      id: bed.id as number,
      name: bed.name.trim(),
      x,
      y,
      w,
      h,
      crop: optionalString(bed.crop),
      cropIcon: optionalString(bed.cropIcon),
      cropCount: finite(bed.cropCount) ? Math.max(0, Math.round(bed.cropCount)) : undefined,
      variety: optionalString(bed.variety),
      spacingCm: finite(bed.spacingCm) ? bed.spacingCm : undefined,
    };
  });

  const bedById = new Map(beds.map((bed) => [bed.id, bed]));
  const rawAreas = candidate.plantingAreas === undefined
    ? beds.filter((bed) => bed.crop && bed.cropIcon && bed.spacingCm).map((bed) => ({
        id: `legacy-bed-${bed.id}`,
        bedId: bed.id,
        crop: bed.crop,
        cropIcon: bed.cropIcon,
        variety: bed.variety ?? bed.crop,
        spacingCm: bed.spacingCm,
        x: 0, y: 0, w: 100, h: 100,
        pattern: "grid",
        iconSize: 16,
        visualSpacing: "normal",
      }))
    : candidate.plantingAreas;
  if (!Array.isArray(rawAreas) || rawAreas.length > 2000) throw new Error("Plan planting areas are invalid or too large.");

  const plantingAreas: PlannerPlantingArea[] = rawAreas.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Planting area ${index + 1} is invalid.`);
    const area = raw as Record<string, unknown>;
    const id = optionalString(area.id);
    const crop = optionalString(area.crop);
    const cropIcon = optionalString(area.cropIcon);
    const variety = optionalString(area.variety);
    const bedId = Number(area.bedId);
    if (!id || id.length > 180 || !Number.isInteger(bedId) || !bedById.has(bedId) || !crop || !cropIcon || !variety) throw new Error(`Planting area ${index + 1} is missing planting details.`);
    for (const field of ["spacingCm", "x", "y", "w", "h"] as const) if (!finite(area[field])) throw new Error(`Planting area ${index + 1} has invalid geometry or spacing.`);
    const x = area.x as number;
    const y = area.y as number;
    const w = area.w as number;
    const h = area.h as number;
    const spacingCm = area.spacingCm as number;
    if (spacingCm <= 0 || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 100.01 || y + h > 100.01) throw new Error(`Planting area ${index + 1} is outside its bed.`);
    const pattern = PATTERNS.has(area.pattern as PlannerPlantingPattern) ? area.pattern as PlannerPlantingPattern : "grid";
    const visualSpacing = VISUAL_SPACING.has(area.visualSpacing as PlannerVisualSpacing) ? area.visualSpacing as PlannerVisualSpacing : "normal";
    const parsed: PlannerPlantingArea = {
      id,
      plantingId: optionalString(area.plantingId),
      bedId,
      crop,
      cropIcon,
      variety,
      spacingCm,
      x,
      y,
      w,
      h,
      count: 1,
      pattern,
      iconSize: finite(area.iconSize) ? clamp(area.iconSize, 8, 64) : 16,
      visualSpacing,
    };
    parsed.count = areaCapacity(parsed, bedById.get(bedId)!);
    return parsed;
  });

  const rows: PlannerRow[] = candidate.rows.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Row ${index + 1} is invalid.`);
    const row = raw as Record<string, unknown>;
    const id = optionalString(row.id);
    const crop = optionalString(row.crop);
    const cropIcon = optionalString(row.cropIcon);
    const variety = optionalString(row.variety);
    if (!id || id.length > 160 || !crop || !cropIcon || !variety) throw new Error(`Row ${index + 1} is missing planting details.`);
    for (const field of ["spacingCm", "x1", "y1", "x2", "y2", "count"] as const) if (!finite(row[field])) throw new Error(`Row ${index + 1} has invalid geometry or spacing.`);
    const start = canvasPoint(row, "x1", "y1", `Row ${index + 1}`);
    const end = canvasPoint(row, "x2", "y2", `Row ${index + 1}`);
    if ((row.spacingCm as number) <= 0 || (row.count as number) < 1) throw new Error(`Row ${index + 1} has invalid spacing or plant count.`);
    return { id, crop, cropIcon, variety, spacingCm: row.spacingCm as number, x1: start.x, y1: start.y, x2: end.x, y2: end.y, count: Math.round(row.count as number) };
  });

  return { beds, plantingAreas, rows, objects: objectInput.map(parseLayoutObject) };
}

function plantingTarget(planting: Pick<ActivePlanting, "bed_id" | "row_id" | "area_id">) {
  if (planting.area_id) return `area:${planting.area_id}`;
  if (planting.row_id) return `row:${planting.row_id}`;
  if (planting.bed_id) return `legacy-bed:${planting.bed_id}`;
  return "unknown";
}

function samePlanting(existing: ActivePlanting, crop: string, variety: string | undefined, spacingCm: number | undefined) {
  return existing.crop_name === crop && (existing.variety ?? "") === (variety ?? "") && Number(existing.spacing_cm ?? 0) === Number(spacingCm ?? 0);
}

function authorised(request: Request) {
  const configured = getGardenWriteToken();
  if (!configured) return { ok: false as const, status: 503, error: "Garden cloud writes are not configured yet." };
  const header = request.headers.get("authorization");
  const supplied = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied !== configured) return { ok: false as const, status: 401, error: "Garden edit key is missing or incorrect." };
  return { ok: true as const };
}

function pointFromDb(value: string | null) {
  const [x, y] = (value ?? "0,0").split(",").map(Number);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}

export async function GET() {
  try {
    const db = getGardenDb();
    await ensureGardenLayoutSchema(db);
    await ensureGardenPlantingAreaSchema(db);

    const bedsResult = await db.prepare(`
      SELECT id, label, x_percent, y_percent, width_percent, height_percent
      FROM beds WHERE garden_id = ? AND archived_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `).bind(GARDEN_ID).all<BedRow>();

    const areasResult = await db.prepare(`
      SELECT a.id, a.bed_id, a.x_percent, a.y_percent, a.width_percent, a.height_percent,
        a.pattern, a.icon_size_px, a.visual_spacing,
        p.id AS planting_id, p.crop_name, p.crop_icon, p.variety, p.spacing_cm, p.estimated_count
      FROM planting_areas a
      INNER JOIN plantings p ON p.area_id = a.id AND p.status = 'active'
      WHERE a.garden_id = ? AND a.archived_at IS NULL
      ORDER BY a.sort_order ASC, a.created_at ASC
    `).bind(GARDEN_ID).all<PlantingAreaDb>();

    const rowsResult = await db.prepare(`
      SELECT r.id, r.x1_cm, r.y1_cm, r.x2_cm, r.y2_cm,
        p.crop_name, p.crop_icon, p.variety, p.spacing_cm, p.estimated_count
      FROM planting_rows r
      INNER JOIN plantings p ON p.row_id = r.id AND p.status = 'active'
      WHERE r.garden_id = ?
      ORDER BY r.created_at ASC
    `).bind(GARDEN_ID).all<PlantingRowDb>();

    const layoutResult = await db.prepare(`
      SELECT id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, width_cm, height_cm,
        diameter_cm, post_spacing_cm, text_value, label, point_xy, font_size
      FROM layout_objects WHERE garden_id = ? ORDER BY sort_order ASC, created_at ASC
    `).bind(GARDEN_ID).all<LayoutRow>();

    const beds: PlannerBed[] = (bedsResult.results ?? []).map((bed) => ({
      id: Number.parseInt(bed.id, 10), name: bed.label, x: Number(bed.x_percent), y: Number(bed.y_percent),
      w: Number(bed.width_percent), h: Number(bed.height_percent),
    })).filter((bed) => Number.isInteger(bed.id) && bed.id > 0);

    const bedIds = new Set(beds.map((bed) => bed.id));
    const plantingAreas: PlannerPlantingArea[] = (areasResult.results ?? []).map((area) => ({
      id: area.id,
      plantingId: area.planting_id,
      bedId: Number.parseInt(area.bed_id, 10),
      crop: area.crop_name,
      cropIcon: area.crop_icon ?? "🌱",
      variety: area.variety ?? area.crop_name,
      spacingCm: Number(area.spacing_cm ?? 30),
      x: Number(area.x_percent), y: Number(area.y_percent), w: Number(area.width_percent), h: Number(area.height_percent),
      count: Number(area.estimated_count ?? 1),
      pattern: PATTERNS.has(area.pattern) ? area.pattern : "grid",
      iconSize: clamp(Number(area.icon_size_px ?? 16), 8, 64),
      visualSpacing: VISUAL_SPACING.has(area.visual_spacing) ? area.visual_spacing : "normal",
    })).filter((area) => Number.isInteger(area.bedId) && bedIds.has(area.bedId));

    const rows: PlannerRow[] = (rowsResult.results ?? []).map((row) => ({
      id: row.id, crop: row.crop_name, cropIcon: row.crop_icon ?? "🌱", variety: row.variety ?? row.crop_name,
      spacingCm: Number(row.spacing_cm ?? 30), x1: Number(row.x1_cm), y1: Number(row.y1_cm), x2: Number(row.x2_cm),
      y2: Number(row.y2_cm), count: Number(row.estimated_count ?? 1),
    }));

    const objects: PlannerLayoutObject[] = (layoutResult.results ?? []).map((item) => {
      if (item.object_type === "path") return { id: item.id, type: "path", x1: Number(item.x1_cm), y1: Number(item.y1_cm), x2: Number(item.x2_cm), y2: Number(item.y2_cm), widthCm: Number(item.width_cm ?? 60), label: item.label ?? undefined };
      if (item.object_type === "trellis") return { id: item.id, type: "trellis", x1: Number(item.x1_cm), y1: Number(item.y1_cm), x2: Number(item.x2_cm), y2: Number(item.y2_cm), heightCm: Number(item.height_cm ?? 180), postSpacingCm: Number(item.post_spacing_cm ?? 150), label: item.label ?? undefined };
      const point = pointFromDb(item.point_xy);
      if (item.object_type === "tree") return { id: item.id, type: "tree", ...point, diameterCm: Number(item.diameter_cm ?? 120), label: item.label ?? undefined };
      return { id: item.id, type: "text", ...point, text: item.text_value ?? "Label", fontSize: Number(item.font_size ?? 13) };
    });

    return Response.json({ ok: true, source: "d1", plan: { beds, plantingAreas, rows, objects } });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load garden plan." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = authorised(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const plan = parsePlan((body as { plan?: unknown })?.plan);
    const db = getGardenDb();
    await ensureGardenLayoutSchema(db);
    await ensureGardenPlantingAreaSchema(db);

    const currentResult = await db.prepare(`
      SELECT id, bed_id, row_id, area_id, crop_name, crop_icon, variety, spacing_cm, estimated_count
      FROM plantings WHERE garden_id = ? AND status = 'active' ORDER BY created_at DESC
    `).bind(GARDEN_ID).all<ActivePlanting>();

    const existingByTarget = new Map<string, ActivePlanting>();
    const duplicateActive: string[] = [];
    for (const planting of currentResult.results ?? []) {
      const target = plantingTarget(planting);
      if (existingByTarget.has(target)) duplicateActive.push(planting.id);
      else existingByTarget.set(target, planting);
    }

    const touchedPlantings = new Set<string>();
    const statements = duplicateActive.map((id) => db.prepare(
      "UPDATE plantings SET status = 'finished', end_date = COALESCE(end_date, date('now')), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).bind(id));

    for (const [index, bed] of plan.beds.entries()) {
      const bedId = String(bed.id);
      statements.push(db.prepare(`
        INSERT INTO beds (id, garden_id, label, x_percent, y_percent, width_percent, height_percent, sort_order, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET label = excluded.label, x_percent = excluded.x_percent,
          y_percent = excluded.y_percent, width_percent = excluded.width_percent, height_percent = excluded.height_percent,
          sort_order = excluded.sort_order, archived_at = NULL, updated_at = CURRENT_TIMESTAMP
      `).bind(bedId, GARDEN_ID, bed.name, bed.x, bed.y, bed.w, bed.h, index));
    }

    const bedIds = plan.beds.map((bed) => String(bed.id));
    if (bedIds.length) statements.push(db.prepare(`UPDATE beds SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE garden_id = ? AND archived_at IS NULL AND id NOT IN (${bedIds.map(() => "?").join(",")})`).bind(GARDEN_ID, ...bedIds));
    else statements.push(db.prepare("UPDATE beds SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE garden_id = ? AND archived_at IS NULL").bind(GARDEN_ID));

    for (const [index, area] of plan.plantingAreas.entries()) {
      const bedId = String(area.bedId);
      statements.push(db.prepare(`
        INSERT INTO planting_areas (
          id, garden_id, bed_id, x_percent, y_percent, width_percent, height_percent,
          pattern, icon_size_px, visual_spacing, sort_order, archived_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET bed_id = excluded.bed_id, x_percent = excluded.x_percent,
          y_percent = excluded.y_percent, width_percent = excluded.width_percent, height_percent = excluded.height_percent,
          pattern = excluded.pattern, icon_size_px = excluded.icon_size_px, visual_spacing = excluded.visual_spacing,
          sort_order = excluded.sort_order, archived_at = NULL, updated_at = CURRENT_TIMESTAMP
      `).bind(area.id, GARDEN_ID, bedId, area.x, area.y, area.w, area.h, area.pattern, area.iconSize, area.visualSpacing, index));

      const target = `area:${area.id}`;
      const existing = existingByTarget.get(target);
      if (existing && samePlanting(existing, area.crop, area.variety, area.spacingCm)) {
        touchedPlantings.add(existing.id);
        statements.push(db.prepare(`
          UPDATE plantings SET bed_id = ?, row_id = NULL, area_id = ?, crop_icon = ?, estimated_count = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(bedId, area.id, area.cropIcon, area.count, existing.id));
      } else {
        if (existing) {
          touchedPlantings.add(existing.id);
          statements.push(db.prepare("UPDATE plantings SET status = 'finished', end_date = COALESCE(end_date, date('now')), updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(existing.id));
        }
        const plantingId = crypto.randomUUID();
        touchedPlantings.add(plantingId);
        statements.push(db.prepare(`
          INSERT INTO plantings (id, garden_id, bed_id, row_id, area_id, crop_name, crop_icon, variety, spacing_cm, estimated_count, status, start_date)
          VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'active', date('now'))
        `).bind(plantingId, GARDEN_ID, bedId, area.id, area.crop, area.cropIcon, area.variety, area.spacingCm, area.count));
      }
    }

    const areaIds = plan.plantingAreas.map((area) => area.id);
    if (areaIds.length) statements.push(db.prepare(`UPDATE planting_areas SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE garden_id = ? AND archived_at IS NULL AND id NOT IN (${areaIds.map(() => "?").join(",")})`).bind(GARDEN_ID, ...areaIds));
    else statements.push(db.prepare("UPDATE planting_areas SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE garden_id = ? AND archived_at IS NULL").bind(GARDEN_ID));

    for (const row of plan.rows) {
      statements.push(db.prepare(`
        INSERT INTO planting_rows (id, garden_id, x1_cm, y1_cm, x2_cm, y2_cm) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET x1_cm = excluded.x1_cm, y1_cm = excluded.y1_cm, x2_cm = excluded.x2_cm,
          y2_cm = excluded.y2_cm, updated_at = CURRENT_TIMESTAMP
      `).bind(row.id, GARDEN_ID, row.x1, row.y1, row.x2, row.y2));
      const target = `row:${row.id}`;
      const existing = existingByTarget.get(target);
      if (existing && samePlanting(existing, row.crop, row.variety, row.spacingCm)) {
        touchedPlantings.add(existing.id);
        statements.push(db.prepare("UPDATE plantings SET crop_icon = ?, estimated_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.cropIcon, row.count, existing.id));
      } else {
        if (existing) {
          touchedPlantings.add(existing.id);
          statements.push(db.prepare("UPDATE plantings SET status = 'finished', end_date = COALESCE(end_date, date('now')), updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(existing.id));
        }
        const plantingId = crypto.randomUUID();
        touchedPlantings.add(plantingId);
        statements.push(db.prepare(`
          INSERT INTO plantings (id, garden_id, bed_id, row_id, area_id, crop_name, crop_icon, variety, spacing_cm, estimated_count, status, start_date)
          VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, 'active', date('now'))
        `).bind(plantingId, GARDEN_ID, row.id, row.crop, row.cropIcon, row.variety, row.spacingCm, row.count));
      }
    }

    for (const [index, object] of plan.objects.entries()) {
      const point = object.type === "tree" || object.type === "text" ? `${object.x},${object.y}` : null;
      statements.push(db.prepare(`
        INSERT INTO layout_objects (
          id, garden_id, object_type, x1_cm, y1_cm, x2_cm, y2_cm, width_cm, height_cm,
          diameter_cm, post_spacing_cm, text_value, label, point_xy, font_size, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET object_type = excluded.object_type, x1_cm = excluded.x1_cm,
          y1_cm = excluded.y1_cm, x2_cm = excluded.x2_cm, y2_cm = excluded.y2_cm, width_cm = excluded.width_cm,
          height_cm = excluded.height_cm, diameter_cm = excluded.diameter_cm, post_spacing_cm = excluded.post_spacing_cm,
          text_value = excluded.text_value, label = excluded.label, point_xy = excluded.point_xy, font_size = excluded.font_size,
          sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP
      `).bind(
        object.id, GARDEN_ID, object.type,
        object.type === "path" || object.type === "trellis" ? object.x1 : null,
        object.type === "path" || object.type === "trellis" ? object.y1 : null,
        object.type === "path" || object.type === "trellis" ? object.x2 : null,
        object.type === "path" || object.type === "trellis" ? object.y2 : null,
        object.type === "path" ? object.widthCm : null,
        object.type === "trellis" ? object.heightCm : null,
        object.type === "tree" ? object.diameterCm : null,
        object.type === "trellis" ? object.postSpacingCm : null,
        object.type === "text" ? object.text : null,
        object.type === "path" || object.type === "trellis" || object.type === "tree" ? object.label ?? null : null,
        point,
        object.type === "text" ? object.fontSize : null,
        index,
      ));
    }

    const objectIds = plan.objects.map((object) => object.id);
    if (objectIds.length) statements.push(db.prepare(`DELETE FROM layout_objects WHERE garden_id = ? AND id NOT IN (${objectIds.map(() => "?").join(",")})`).bind(GARDEN_ID, ...objectIds));
    else statements.push(db.prepare("DELETE FROM layout_objects WHERE garden_id = ?").bind(GARDEN_ID));

    const currentTargets = new Set([
      ...plan.plantingAreas.map((area) => `area:${area.id}`),
      ...plan.rows.map((row) => `row:${row.id}`),
    ]);
    for (const existing of currentResult.results ?? []) {
      const target = plantingTarget(existing);
      if (!currentTargets.has(target) && !touchedPlantings.has(existing.id)) {
        statements.push(db.prepare("UPDATE plantings SET status = 'finished', end_date = COALESCE(end_date, date('now')), updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(existing.id));
      }
    }

    if (statements.length) await db.batch(statements);
    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save garden plan.";
    const status = /invalid|required|outside|larger|missing|too short/i.test(message) ? 400 : 503;
    return Response.json({ ok: false, error: message }, { status });
  }
}
