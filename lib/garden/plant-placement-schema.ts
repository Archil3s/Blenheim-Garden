import type { D1DatabaseLike } from "./cloudflare-db";

export async function ensurePlantPlacementSchema(db: D1DatabaseLike) {
  for (const table of ["planting_areas", "planting_rows"]) {
    const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
    if (columns.results?.some((column) => column.name === "placements_json")) continue;
    try {
      await db.prepare(`ALTER TABLE ${table} ADD COLUMN placements_json TEXT`).run();
    } catch (error) {
      if (!(error instanceof Error) || !/duplicate column|already exists/i.test(error.message)) throw error;
    }
  }
}

export function parsePlantPlacements(value: unknown, area: boolean) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length < 1 || value.length > 10000) throw new Error("Plant placements are invalid or larger than the supported limits.");
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Plant placement is invalid.");
    const p = item as Record<string, unknown>;
    if (typeof p.id !== "string" || !p.id || p.id.length > 180 || ids.has(p.id) || typeof p.x !== "number" || typeof p.y !== "number" || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error("Plant placement has invalid coordinates or id.");
    if (area && (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100)) throw new Error("Plant placement is outside its area.");
    if (!area && (Math.abs(p.x) > 10000 || Math.abs(p.y) > 10000)) throw new Error("Plant placement is outside the garden.");
    ids.add(p.id);
    return { id: p.id, x: p.x, y: p.y };
  });
}
