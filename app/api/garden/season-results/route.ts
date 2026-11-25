import { gardenResourceUrl } from "@/lib/garden/active-garden";
import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { requestGardenId } from "@/lib/garden/request-garden";
import { ensureGardenPlantingAreaSchema } from "@/lib/garden/planting-area-schema";
import { nzSeasonRange, nzSeasons, type SeasonResultsData } from "@/lib/garden/season-results";

export const dynamic = "force-dynamic";

const nzPhotoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit",
});

function photoDay(stamp: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp;
  const iso = stamp.replace(" ", "T");
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : iso + "Z");
  return Number.isNaN(date.getTime()) ? undefined : nzPhotoDate.format(date);
}

export async function GET(request: Request) {
  try {
    const gardenId = requestGardenId(request);
    const params = new URL(request.url).searchParams;
    const bedId = params.get("bedId") ?? "";
    const year = Number(params.get("year")), month = Number(params.get("month"));
    if (!/^\d{1,16}$/.test(bedId) || !Number.isInteger(year) || year < 1900 || year > 2200 || !nzSeasons.some(item => item.month === month)) {
      return Response.json({ ok: false, error: "Choose a bed and season." }, { status: 400 });
    }

    const db = getGardenDb();
    if (!await db.prepare("SELECT id FROM beds WHERE garden_id = ? AND id = ?").bind(gardenId, bedId).first()) {
      return Response.json({ ok: false, error: "That bed could not be found in this garden." }, { status: 404 });
    }
    await ensureGardenPlantingAreaSchema(db);
    const { from, until } = nzSeasonRange(year, month);
    const [plantings, harvests, photos] = await Promise.all([
      db.prepare(`
        SELECT p.id, p.area_id, p.crop_name, p.crop_icon, p.variety, p.status, p.sow_date, p.transplant_date,
          (SELECT MIN(h.harvested_on) FROM harvests h WHERE h.garden_id = p.garden_id AND h.planting_id = p.id) AS first_harvest,
          (
            (COALESCE(p.sow_date, p.transplant_date, p.start_date, substr(p.created_at, 1, 10)) <= ?
             AND (p.status != 'finished' OR COALESCE(p.end_date, substr(p.updated_at, 1, 10)) >= ?))
            OR EXISTS (SELECT 1 FROM harvests h WHERE h.garden_id = p.garden_id AND h.planting_id = p.id
              AND h.harvested_on BETWEEN ? AND ?)
          ) AS recorded_in_season
        FROM plantings p
        WHERE p.garden_id = ? AND p.bed_id = ?
          AND (recorded_in_season OR (p.status != 'finished' AND p.area_id IS NOT NULL))
        ORDER BY COALESCE(p.sow_date, p.transplant_date, p.start_date, substr(p.created_at, 1, 10)), p.id
      `).bind(until, from, from, until, gardenId, bedId).all<SeasonResultsData["plantings"][number]>(),
      db.prepare(`
        SELECT h.id, h.planting_id, h.harvested_on, h.weight_g, h.quantity, h.unit
        FROM harvests h JOIN plantings p ON p.id = h.planting_id AND p.garden_id = h.garden_id
        WHERE h.garden_id = ? AND p.bed_id = ? AND h.harvested_on BETWEEN ? AND ?
        ORDER BY h.harvested_on, h.id
      `).bind(gardenId, bedId, from, until).all<SeasonResultsData["harvests"][number]>(),
      db.prepare(`
        SELECT m.id, COALESCE(m.captured_at, m.created_at) AS stamp, m.caption
        FROM media m
        LEFT JOIN harvests h ON m.target_type = 'harvest' AND h.id = m.target_id AND h.garden_id = m.garden_id
        LEFT JOIN plantings p ON p.garden_id = m.garden_id AND p.id = COALESCE(
          CASE WHEN m.target_type = 'planting' THEN m.target_id END, h.planting_id, m.planting_id)
        WHERE m.garden_id = ? AND m.media_type = 'photo'
          AND ((m.target_type = 'bed' AND m.target_id = ?) OR (m.target_type != 'bed' AND p.bed_id = ?))
          AND substr(COALESCE(m.captured_at, m.created_at), 1, 10) BETWEEN date(?, '-1 day') AND date(?, '+1 day')
        ORDER BY stamp DESC, m.id
      `).bind(gardenId, bedId, bedId, from, until).all<{ id: string; stamp: string; caption: string | null }>(),
    ]);
    const datedPhotos = (photos.results ?? []).flatMap(({ id, stamp, caption }) => {
      const date = photoDay(stamp);
      return date && date >= from && date <= until ? [{
        id, date, caption, url: gardenResourceUrl(`/api/garden/media/${encodeURIComponent(id)}`, gardenId),
      }] : [];
    }).sort((a, b) => b.date.localeCompare(a.date));
    return Response.json({ ok: true, plantings: plantings.results ?? [], harvests: harvests.results ?? [],
      photos: datedPhotos });
  } catch {
    return Response.json({ ok: false, error: "Could not load season results for this garden." }, { status: 503 });
  }
}
