import { getGardenDb } from "@/lib/garden/cloudflare-db";
import { authoriseGardenWrite } from "@/lib/garden/write-auth";
import { GARDEN_ID } from "@/lib/garden/storage-contract";
import type { CareEvent, CareKind, CareProduct } from "@/lib/garden/care";

export const dynamic = "force-dynamic";

type CareRow = {
  id: string; garden_id: string; kind: CareKind; occurred_on: string;
  products_json: string; crops_json: string; targets_json: string;
  method: string; withholding_days: number | null; notes: string; created_at: string;
};

function gardenIdFrom(request: Request) {
  const value = new URL(request.url).searchParams.get("gardenId")?.trim() || GARDEN_ID;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) throw new Error("Invalid garden ID.");
  return value;
}

function dateFrom(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose a valid treatment date.");
  const date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Choose a valid treatment date.");
  return value;
}

function stringFrom(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value: unknown, limit: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > limit || value.some((item) => typeof item !== "string" || !item.trim() || item.length > maxLength)) throw new Error("Invalid crop or target selection.");
  return [...new Set(value.map((item: string) => item.trim()))];
}

function productsFrom(value: unknown): CareProduct[] {
  if (!Array.isArray(value) || !value.length || value.length > 8) throw new Error("Add between one and eight products.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid product.");
    const product = item as Record<string, unknown>;
    if (typeof product.name !== "string" || !product.name.trim() || product.name.length > 160) throw new Error("Every product needs a name.");
    if (product.dilution != null && (typeof product.dilution !== "string" || product.dilution.length > 80)) throw new Error("Invalid dilution.");
    return { name: product.name.trim(), dilution: stringFrom(product.dilution, 80) };
  });
}

function toEvent(row: CareRow): CareEvent {
  return {
    id: row.id, gardenId: row.garden_id, kind: row.kind, occurredOn: row.occurred_on,
    products: JSON.parse(row.products_json) as CareProduct[],
    crops: JSON.parse(row.crops_json) as string[],
    targets: JSON.parse(row.targets_json) as string[],
    method: row.method, withholdingDays: row.withholding_days,
    notes: row.notes, createdAt: row.created_at,
  };
}

async function ensureCareTable() {
  const db = getGardenDb();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS garden_care_events (" +
    "id TEXT PRIMARY KEY, garden_id TEXT NOT NULL, " +
    "kind TEXT NOT NULL CHECK (kind IN ('fertiliser','spray')), " +
    "occurred_on TEXT NOT NULL, products_json TEXT NOT NULL, crops_json TEXT NOT NULL, " +
    "targets_json TEXT NOT NULL DEFAULT '[]', method TEXT NOT NULL DEFAULT '', " +
    "withholding_days INTEGER, notes TEXT NOT NULL DEFAULT '', " +
    "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE)"
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_care_garden_date ON garden_care_events(garden_id, occurred_on DESC)").run();
  return db;
}

export async function GET(request: Request) {
  try {
    const gardenId = gardenIdFrom(request);
    const db = await ensureCareTable();
    const result = await db.prepare(
      "SELECT * FROM garden_care_events WHERE garden_id = ? ORDER BY occurred_on DESC, created_at DESC, id DESC LIMIT 500"
    ).bind(gardenId).all<CareRow>();
    return Response.json({ ok: true, events: (result.results ?? []).map(toEvent) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load garden care." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  try {
    const gardenId = gardenIdFrom(request);
    const body = await request.json() as Record<string, unknown>;
    if (body.kind !== "fertiliser" && body.kind !== "spray") throw new Error("Choose fertiliser or spray.");
    const kind = body.kind;
    const occurredOn = dateFrom(body.occurredOn);
    const products = productsFrom(body.products);
    const crops = stringList(body.crops, 100, 120);
    if (!crops.length) throw new Error("Choose at least one crop.");
    const targets = stringList(body.targets ?? [], 2000, 200);
    if (targets.some((target) => !/^(area|row):[^\s]+$/.test(target))) throw new Error("Invalid planting targets.");
    const method = stringFrom(body.method, 80);
    if (typeof body.method === "string" && body.method.length > 80) throw new Error("Application method is too long.");
    const notes = stringFrom(body.notes, 2000);
    if (typeof body.notes === "string" && body.notes.length > 2000) throw new Error("Notes are too long.");
    const withholding = body.withholdingDays;
    if (withholding != null && (typeof withholding !== "number" || !Number.isInteger(withholding) || withholding < 0 || withholding > 365)) throw new Error("Withholding period must be 0–365 days.");
    const withholdingDays = kind === "spray" ? (withholding as number | null | undefined) ?? null : null;
    const db = await ensureCareTable();
    const garden = await db.prepare("SELECT id FROM gardens WHERE id = ? LIMIT 1").bind(gardenId).first<{ id: string }>();
    if (!garden) return Response.json({ ok: false, error: "Garden not found. Save the garden before recording treatments." }, { status: 404 });
    const id = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO garden_care_events " +
      "(id,garden_id,kind,occurred_on,products_json,crops_json,targets_json,method,withholding_days,notes) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(id, gardenId, kind, occurredOn, JSON.stringify(products), JSON.stringify(crops), JSON.stringify(targets), method, withholdingDays, notes).run();
    return Response.json({ ok: true, id });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to record treatment." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = authoriseGardenWrite(request);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  try {
    const gardenId = gardenIdFrom(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id || id.length > 100) return Response.json({ ok: false, error: "Invalid treatment ID." }, { status: 400 });
    const db = await ensureCareTable();
    await db.prepare("DELETE FROM garden_care_events WHERE id = ? AND garden_id = ?").bind(id, gardenId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Unable to delete treatment." }, { status: 400 });
  }
}
