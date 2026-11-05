import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";

export const dynamic = "force-dynamic";

function gardenId(request: Request) {
  const id = new URL(request.url).searchParams.get("gardenId") ?? "blenheim-garden";
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) throw new Error("Invalid garden identifier.");
  return id;
}

async function database() {
  const db = getGardenDb();
  await db.prepare("CREATE TABLE IF NOT EXISTS planner_plan_notes (garden_id TEXT PRIMARY KEY, body TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  return db;
}

export async function GET(request: Request) {
  try {
    const id = gardenId(request);
    const db = await database();
    const note = await db.prepare("SELECT body FROM planner_plan_notes WHERE garden_id = ?").bind(id).first<{ body: string }>();
    return Response.json({ ok: true, body: note?.body ?? "" });
  } catch {
    return Response.json({ ok: false, error: "Plan notes could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const authorised = authoriseGardenWrite(request);
    if (!authorised.ok) return Response.json(authorised, { status: authorised.status });
    const id = gardenId(request);
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || !("body" in value) || typeof value.body !== "string" || value.body.length > 50000) {
      return Response.json({ ok: false, error: "Plan notes must contain at most 50,000 characters." }, { status: 400 });
    }
    const db = await database();
    await db.prepare("INSERT INTO planner_plan_notes (garden_id, body) VALUES (?, ?) ON CONFLICT(garden_id) DO UPDATE SET body = excluded.body, updated_at = CURRENT_TIMESTAMP").bind(id, value.body).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Plan notes could not be saved. Your draft remains in this browser." }, { status: 503 });
  }
}
