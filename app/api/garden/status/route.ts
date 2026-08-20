import { getGardenDb } from "@/lib/garden/cloudflare-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getGardenDb();
    const ping = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    const gardensTable = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gardens'")
      .first<{ name: string }>();

    return Response.json({
      ok: ping?.ok === 1,
      binding: "DB",
      database: "blenheim-garden",
      schemaReady: gardensTable?.name === "gardens",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        binding: "DB",
        database: "blenheim-garden",
        schemaReady: false,
        error: error instanceof Error ? error.message : "Unable to access D1",
      },
      { status: 503 },
    );
  }
}
