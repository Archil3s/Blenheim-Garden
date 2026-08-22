import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { cropFamilyFor, rotationAdvice, seasonForDate } from "@/lib/garden/crop-rotation";
import { ensureGardenLayoutSchema } from "@/lib/garden/layout-schema";
import { ensureGardenPlantingAreaSchema } from "@/lib/garden/planting-area-schema";
import { GARDEN_ID } from "@/lib/garden/storage-contract";

export const dynamic = "force-dynamic";

type BedDb = {
  id: string;
  label: string;
  sort_order: number;
};

type PlantingDb = {
  id: string;
  bed_id: string;
  crop_name: string;
  crop_icon: string | null;
  variety: string | null;
  estimated_count: number | null;
  status: "planned" | "active" | "finished";
  sow_date: string | null;
  germinated_date: string | null;
  transplant_date: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryItem = ReturnType<typeof historyDto>;

function day(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
}

function historyDto(row: PlantingDb) {
  const startDate = day(row.start_date) ?? day(row.transplant_date) ?? day(row.sow_date) ?? day(row.created_at);
  const endDate = row.status === "finished" ? (day(row.end_date) ?? day(row.updated_at)) : null;
  const family = cropFamilyFor(row.crop_name, row.variety);
  return {
    id: row.id,
    bedId: row.bed_id,
    cropName: row.crop_name,
    cropIcon: row.crop_icon ?? "🌱",
    variety: row.variety,
    estimatedCount: row.estimated_count == null ? null : Number(row.estimated_count),
    status: row.status,
    sowDate: day(row.sow_date),
    germinatedDate: day(row.germinated_date),
    transplantDate: day(row.transplant_date),
    startDate,
    endDate,
    startSeason: seasonForDate(startDate),
    endSeason: seasonForDate(endDate),
    family,
  };
}

function bedSummary(bed: BedDb, history: HistoryItem[]) {
  const active = history.filter((item) => item.status === "active");
  const recentFamilies = Array.from(new Map(
    history
      .filter((item) => item.status !== "planned")
      .map((item) => [item.family.key, item.family]),
  ).values()).slice(0, 3);
  return {
    id: bed.id,
    label: bed.label,
    historyCount: history.length,
    active: active.map((item) => ({
      id: item.id,
      cropName: item.cropName,
      cropIcon: item.cropIcon,
      variety: item.variety,
      family: item.family,
      startDate: item.startDate,
    })),
    latest: history[0] ?? null,
    recentFamilies,
    advice: rotationAdvice(history),
  };
}

export async function GET(request: Request) {
  try {
    const db = getGardenDb();
    await ensureGardenLayoutSchema(db);
    await ensureGardenPlantingAreaSchema(db);

    const url = new URL(request.url);
    const bedId = url.searchParams.get("bedId")?.trim() || null;

    const bedsStatement = bedId
      ? db.prepare(`
          SELECT id, label, sort_order
          FROM beds
          WHERE garden_id = ? AND id = ? AND archived_at IS NULL
          LIMIT 1
        `).bind(GARDEN_ID, bedId)
      : db.prepare(`
          SELECT id, label, sort_order
          FROM beds
          WHERE garden_id = ? AND archived_at IS NULL
          ORDER BY sort_order ASC, label ASC
        `).bind(GARDEN_ID);

    const bedsResult = await bedsStatement.all<BedDb>();
    const beds = bedsResult.results ?? [];
    if (bedId && beds.length === 0) {
      return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });
    }

    const plantingStatement = bedId
      ? db.prepare(`
          SELECT id, bed_id, crop_name, crop_icon, variety, estimated_count, status,
            sow_date, germinated_date, transplant_date, start_date, end_date, created_at, updated_at
          FROM plantings
          WHERE garden_id = ? AND bed_id = ?
          ORDER BY COALESCE(start_date, transplant_date, sow_date, substr(created_at, 1, 10)) DESC, created_at DESC
          LIMIT 500
        `).bind(GARDEN_ID, bedId)
      : db.prepare(`
          SELECT id, bed_id, crop_name, crop_icon, variety, estimated_count, status,
            sow_date, germinated_date, transplant_date, start_date, end_date, created_at, updated_at
          FROM plantings
          WHERE garden_id = ? AND bed_id IS NOT NULL
          ORDER BY COALESCE(start_date, transplant_date, sow_date, substr(created_at, 1, 10)) DESC, created_at DESC
          LIMIT 2000
        `).bind(GARDEN_ID);

    const plantingResult = await plantingStatement.all<PlantingDb>();
    const history = (plantingResult.results ?? []).map(historyDto);

    if (bedId) {
      const bed = beds[0];
      return Response.json({
        ok: true,
        scope: "bed",
        bed: { id: bed.id, label: bed.label },
        history,
        advice: rotationAdvice(history),
      });
    }

    const byBed = new Map<string, HistoryItem[]>();
    for (const item of history) {
      const items = byBed.get(item.bedId) ?? [];
      items.push(item);
      byBed.set(item.bedId, items);
    }

    return Response.json({
      ok: true,
      scope: "garden",
      beds: beds.map((bed) => bedSummary(bed, byBed.get(bed.id) ?? [])),
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load crop rotation history.",
    }, { status: 503 });
  }
}
