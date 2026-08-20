import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { ensureGardenPlantingAreaSchema } from "@/lib/garden/planting-area-schema";
import { GARDEN_ID } from "@/lib/garden/storage-contract";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";

export const dynamic = "force-dynamic";

type BedDb = { id: string; label: string };
type PlantingDb = {
  id: string;
  bed_id: string | null;
  crop_name: string;
  crop_icon: string | null;
  variety: string | null;
  sow_date: string | null;
  germinated_date: string | null;
  transplant_date: string | null;
  start_date: string | null;
  status: string;
};
type NoteDb = {
  id: string;
  target_type: string;
  target_id: string;
  body: string;
  occurred_on: string | null;
  created_at: string;
  crop_name: string | null;
  variety: string | null;
  bed_label: string | null;
};
type HarvestDb = {
  id: string;
  planting_id: string | null;
  harvested_on: string;
  weight_g: number | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  created_at: string;
  crop_name: string | null;
  variety: string | null;
  crop_icon: string | null;
  bed_label: string | null;
};

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function optionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use dates in YYYY-MM-DD format.");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("One of the supplied dates is invalid.");
  return value;
}

function optionalNumber(value: unknown, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) throw new Error("One of the supplied numbers is invalid.");
  return parsed;
}

function noteDto(note: NoteDb) {
  return {
    id: note.id,
    targetType: note.target_type,
    targetId: note.target_id,
    body: note.body,
    occurredOn: note.occurred_on,
    createdAt: note.created_at,
    cropName: note.crop_name,
    variety: note.variety,
    bedLabel: note.bed_label,
  };
}

function harvestDto(harvest: HarvestDb) {
  return {
    id: harvest.id,
    plantingId: harvest.planting_id,
    harvestedOn: harvest.harvested_on,
    weightG: harvest.weight_g == null ? null : Number(harvest.weight_g),
    quantity: harvest.quantity == null ? null : Number(harvest.quantity),
    unit: harvest.unit,
    notes: harvest.notes,
    createdAt: harvest.created_at,
    cropName: harvest.crop_name,
    cropIcon: harvest.crop_icon,
    variety: harvest.variety,
    bedLabel: harvest.bed_label,
  };
}

function plantingDto(planting: PlantingDb | null) {
  if (!planting) return null;
  return {
    id: planting.id,
    cropName: planting.crop_name,
    cropIcon: planting.crop_icon,
    variety: planting.variety,
    sowDate: planting.sow_date,
    germinatedDate: planting.germinated_date,
    transplantDate: planting.transplant_date,
    startDate: planting.start_date,
    status: planting.status,
  };
}

async function getBed(bedId: string) {
  const db = getGardenDb();
  return db.prepare(`
    SELECT id, label FROM beds
    WHERE garden_id = ? AND id = ? AND archived_at IS NULL
    LIMIT 1
  `).bind(GARDEN_ID, bedId).first<BedDb>();
}

async function getPlanting(plantingId: string, bedId?: string | null, activeOnly = true) {
  const db = getGardenDb();
  const activeClause = activeOnly ? "AND status = 'active'" : "";
  const bedClause = bedId ? "AND bed_id = ?" : "";
  const statement = db.prepare(`
    SELECT id, bed_id, crop_name, crop_icon, variety, sow_date, germinated_date,
      transplant_date, start_date, status
    FROM plantings
    WHERE garden_id = ? AND id = ? ${activeClause} ${bedClause}
    LIMIT 1
  `);
  return bedId
    ? statement.bind(GARDEN_ID, plantingId, bedId).first<PlantingDb>()
    : statement.bind(GARDEN_ID, plantingId).first<PlantingDb>();
}

async function getActivePlantings(bedId: string) {
  const db = getGardenDb();
  const result = await db.prepare(`
    SELECT id, bed_id, crop_name, crop_icon, variety, sow_date, germinated_date,
      transplant_date, start_date, status
    FROM plantings
    WHERE garden_id = ? AND bed_id = ? AND status = 'active'
    ORDER BY created_at ASC
  `).bind(GARDEN_ID, bedId).all<PlantingDb>();
  return result.results ?? [];
}

async function resolveWritablePlanting(bedId: string, plantingId: string | null) {
  if (plantingId) {
    const planting = await getPlanting(plantingId, bedId, true);
    if (!planting) throw new Error("That planting is no longer active in this bed.");
    return planting;
  }
  const active = await getActivePlantings(bedId);
  if (active.length === 1) return active[0];
  if (active.length > 1) throw new Error("This bed has multiple crops. Select the planting area you want first.");
  throw new Error("There is no active crop in this bed.");
}

export async function GET(request: Request) {
  try {
    const db = getGardenDb();
    await ensureGardenPlantingAreaSchema(db);
    const url = new URL(request.url);
    const bedId = url.searchParams.get("bedId")?.trim() || null;
    const plantingId = url.searchParams.get("plantingId")?.trim() || null;

    if (plantingId) {
      const planting = await getPlanting(plantingId, bedId, false);
      if (!planting || !planting.bed_id) return Response.json({ ok: false, error: "That planting could not be found." }, { status: 404 });
      const bed = await getBed(planting.bed_id);
      if (!bed) return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });

      const notesResult = await db.prepare(`
        SELECT n.id, n.target_type, n.target_id, n.body, n.occurred_on, n.created_at,
          p.crop_name, p.variety, b.label AS bed_label
        FROM notes n
        LEFT JOIN plantings p ON n.target_type = 'planting' AND p.id = n.target_id
        LEFT JOIN beds b ON b.id = p.bed_id
        WHERE n.garden_id = ? AND n.target_type = 'planting' AND n.target_id = ?
        ORDER BY COALESCE(n.occurred_on, substr(n.created_at, 1, 10)) DESC, n.created_at DESC
        LIMIT 250
      `).bind(GARDEN_ID, planting.id).all<NoteDb>();

      const harvestResult = await db.prepare(`
        SELECT h.id, h.planting_id, h.harvested_on, h.weight_g, h.quantity, h.unit,
          h.notes, h.created_at, p.crop_name, p.crop_icon, p.variety, b.label AS bed_label
        FROM harvests h
        LEFT JOIN plantings p ON p.id = h.planting_id
        LEFT JOIN beds b ON b.id = p.bed_id
        WHERE h.garden_id = ? AND h.planting_id = ?
        ORDER BY h.harvested_on DESC, h.created_at DESC
        LIMIT 250
      `).bind(GARDEN_ID, planting.id).all<HarvestDb>();

      return Response.json({
        ok: true,
        scope: { type: "planting", bedId: bed.id, plantingId: planting.id, label: planting.variety || planting.crop_name },
        activePlanting: planting.status === "active" ? plantingDto(planting) : null,
        multipleActive: false,
        notes: (notesResult.results ?? []).map(noteDto),
        harvests: (harvestResult.results ?? []).map(harvestDto),
      });
    }

    if (bedId) {
      const bed = await getBed(bedId);
      if (!bed) return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });
      const activePlantings = await getActivePlantings(bedId);
      const activePlanting = activePlantings.length === 1 ? activePlantings[0] : null;

      const notesResult = await db.prepare(`
        SELECT n.id, n.target_type, n.target_id, n.body, n.occurred_on, n.created_at,
          p.crop_name, p.variety, b.label AS bed_label
        FROM notes n
        LEFT JOIN plantings p ON n.target_type = 'planting' AND p.id = n.target_id
        LEFT JOIN beds b ON (
          (n.target_type = 'bed' AND b.id = n.target_id)
          OR (n.target_type = 'planting' AND b.id = p.bed_id)
        )
        WHERE n.garden_id = ? AND (
          (n.target_type = 'bed' AND n.target_id = ?)
          OR (n.target_type = 'planting' AND p.bed_id = ?)
        )
        ORDER BY COALESCE(n.occurred_on, substr(n.created_at, 1, 10)) DESC, n.created_at DESC
        LIMIT 250
      `).bind(GARDEN_ID, bedId, bedId).all<NoteDb>();

      const harvestResult = await db.prepare(`
        SELECT h.id, h.planting_id, h.harvested_on, h.weight_g, h.quantity, h.unit,
          h.notes, h.created_at, p.crop_name, p.crop_icon, p.variety, b.label AS bed_label
        FROM harvests h
        LEFT JOIN plantings p ON p.id = h.planting_id
        LEFT JOIN beds b ON b.id = p.bed_id
        WHERE h.garden_id = ? AND p.bed_id = ?
        ORDER BY h.harvested_on DESC, h.created_at DESC
        LIMIT 250
      `).bind(GARDEN_ID, bedId).all<HarvestDb>();

      return Response.json({
        ok: true,
        scope: { type: "bed", bedId: bed.id, plantingId: null, label: bed.label },
        activePlanting: plantingDto(activePlanting),
        multipleActive: activePlantings.length > 1,
        notes: (notesResult.results ?? []).map(noteDto),
        harvests: (harvestResult.results ?? []).map(harvestDto),
      });
    }

    const notesResult = await db.prepare(`
      SELECT n.id, n.target_type, n.target_id, n.body, n.occurred_on, n.created_at,
        p.crop_name, p.variety,
        CASE WHEN n.target_type = 'bed' THEN b_direct.label WHEN n.target_type = 'planting' THEN b_planting.label ELSE NULL END AS bed_label
      FROM notes n
      LEFT JOIN beds b_direct ON n.target_type = 'bed' AND b_direct.id = n.target_id
      LEFT JOIN plantings p ON n.target_type = 'planting' AND p.id = n.target_id
      LEFT JOIN beds b_planting ON b_planting.id = p.bed_id
      WHERE n.garden_id = ?
      ORDER BY COALESCE(n.occurred_on, substr(n.created_at, 1, 10)) DESC, n.created_at DESC
      LIMIT 300
    `).bind(GARDEN_ID).all<NoteDb>();

    const harvestResult = await db.prepare(`
      SELECT h.id, h.planting_id, h.harvested_on, h.weight_g, h.quantity, h.unit,
        h.notes, h.created_at, p.crop_name, p.crop_icon, p.variety, b.label AS bed_label
      FROM harvests h
      LEFT JOIN plantings p ON p.id = h.planting_id
      LEFT JOIN beds b ON b.id = p.bed_id
      WHERE h.garden_id = ?
      ORDER BY h.harvested_on DESC, h.created_at DESC
      LIMIT 300
    `).bind(GARDEN_ID).all<HarvestDb>();

    return Response.json({
      ok: true,
      scope: { type: "garden", bedId: null, plantingId: null, label: "Whole garden" },
      activePlanting: null,
      multipleActive: false,
      notes: (notesResult.results ?? []).map(noteDto),
      harvests: (harvestResult.results ?? []).map(harvestDto),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load garden records." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action, 40);
    const db = getGardenDb();
    await ensureGardenPlantingAreaSchema(db);

    if (action === "add-note") {
      const noteBody = text(body.body, 4000);
      if (!noteBody) return Response.json({ ok: false, error: "Write a note first." }, { status: 400 });
      const occurredOn = optionalDate(body.occurredOn);
      const bedId = text(body.bedId, 160) || null;
      const plantingId = text(body.plantingId, 160) || null;
      let targetType: "garden" | "bed" | "planting" = "garden";
      let targetId: string = GARDEN_ID;

      if (plantingId) {
        const planting = await getPlanting(plantingId, bedId, false);
        if (!planting) return Response.json({ ok: false, error: "That planting could not be found." }, { status: 404 });
        targetType = "planting";
        targetId = planting.id;
      } else if (bedId) {
        const bed = await getBed(bedId);
        if (!bed) return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });
        targetType = "bed";
        targetId = bedId;
      }

      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO notes (id, garden_id, target_type, target_id, body, occurred_on)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, GARDEN_ID, targetType, targetId, noteBody, occurredOn).run();
      return Response.json({ ok: true, id });
    }

    if (action === "add-harvest") {
      const bedId = text(body.bedId, 160);
      const plantingId = text(body.plantingId, 160) || null;
      if (!bedId) return Response.json({ ok: false, error: "Choose a bed before recording a harvest." }, { status: 400 });
      const bed = await getBed(bedId);
      if (!bed) return Response.json({ ok: false, error: "That garden bed could not be found." }, { status: 404 });
      const planting = await resolveWritablePlanting(bedId, plantingId);

      const harvestedOn = optionalDate(body.harvestedOn);
      if (!harvestedOn) return Response.json({ ok: false, error: "Choose the harvest date." }, { status: 400 });
      const weightG = optionalNumber(body.weightG, 10_000_000);
      const quantity = optionalNumber(body.quantity, 1_000_000);
      const unit = text(body.unit, 40) || null;
      const notes = text(body.notes, 2000) || null;
      if (weightG === null && quantity === null && !notes) return Response.json({ ok: false, error: "Add a weight, quantity, or short harvest note." }, { status: 400 });

      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO harvests (id, garden_id, planting_id, harvested_on, weight_g, quantity, unit, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, GARDEN_ID, planting.id, harvestedOn, weightG, quantity, unit, notes).run();
      return Response.json({ ok: true, id });
    }

    if (action === "save-milestones") {
      const bedId = text(body.bedId, 160);
      const plantingId = text(body.plantingId, 160) || null;
      if (!bedId) return Response.json({ ok: false, error: "Choose a bed first." }, { status: 400 });
      const planting = await resolveWritablePlanting(bedId, plantingId);
      const sowDate = optionalDate(body.sowDate);
      const germinatedDate = optionalDate(body.germinatedDate);
      const transplantDate = optionalDate(body.transplantDate);
      await db.prepare(`
        UPDATE plantings SET sow_date = ?, germinated_date = ?, transplant_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND garden_id = ?
      `).bind(sowDate, germinatedDate, transplantDate, planting.id, GARDEN_ID).run();
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "Unknown garden record action." }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save garden record." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const db = getGardenDb();
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");
    const id = url.searchParams.get("id")?.trim();
    if (!id || (kind !== "note" && kind !== "harvest")) return Response.json({ ok: false, error: "A valid record id and type are required." }, { status: 400 });
    if (kind === "note") await db.prepare("DELETE FROM notes WHERE id = ? AND garden_id = ?").bind(id, GARDEN_ID).run();
    else await db.prepare("DELETE FROM harvests WHERE id = ? AND garden_id = ?").bind(id, GARDEN_ID).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to delete garden record." }, { status: 400 });
  }
}
