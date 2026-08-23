import { getGardenDb, getGardenWriteToken } from "@/lib/garden/cloudflare-db";

export const dynamic = "force-dynamic";

type GardenRow = {
  id: string;
  name: string;
  year: number;
  timezone: string;
  canvas_width_cm: number;
  canvas_height_cm: number;
  created_at: string;
  updated_at: string;
};

function authorised(request: Request) {
  const configured = getGardenWriteToken();
  if (!configured) return { ok: false as const, status: 503, error: "Garden cloud writes are not configured yet." };
  const header = request.headers.get("authorization");
  const supplied = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied !== configured) return { ok: false as const, status: 401, error: "Garden edit key is missing or incorrect." };
  return { ok: true as const };
}

function cleanName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 80 ? name : null;
}

function mapGarden(row: GardenRow) {
  return {
    id: row.id,
    name: row.name,
    year: Number(row.year),
    timezone: row.timezone,
    canvasWidthCm: Number(row.canvas_width_cm),
    canvasHeightCm: Number(row.canvas_height_cm),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const db = getGardenDb();
    const result = await db.prepare(`
      SELECT id, name, year, timezone, canvas_width_cm, canvas_height_cm, created_at, updated_at
      FROM gardens
      ORDER BY updated_at DESC, created_at DESC
    `).all<GardenRow>();
    return Response.json({ ok: true, gardens: (result.results ?? []).map(mapGarden) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to list gardens." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = authorised(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json() as { name?: unknown };
    const name = cleanName(body.name);
    if (!name) return Response.json({ ok: false, error: "Garden name is required and must be 80 characters or fewer." }, { status: 400 });

    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const db = getGardenDb();
    await db.prepare(`
      INSERT INTO gardens (id, name, year, timezone, canvas_width_cm, canvas_height_cm, created_at, updated_at)
      VALUES (?, ?, ?, 'Pacific/Auckland', 900, 1080, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(id, name, year).run();

    return Response.json({
      ok: true,
      garden: {
        id,
        name,
        year,
        timezone: "Pacific/Auckland",
        canvasWidthCm: 900,
        canvasHeightCm: 1080,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create garden." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = authorised(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json() as { id?: unknown; name?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const name = cleanName(body.name);
    if (!id || !name) return Response.json({ ok: false, error: "Garden id and name are required." }, { status: 400 });

    const db = getGardenDb();
    await db.prepare("UPDATE gardens SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(name, id).run();
    return Response.json({ ok: true, garden: { id, name } });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to rename garden." }, { status: 503 });
  }
}
