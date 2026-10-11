import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { ensurePlantPlacementSchema } from "../../lib/garden/plant-placement-schema";

function sqliteD1(sqlite: DatabaseSync): D1DatabaseLike {
  return {
    prepare(query) {
      let values: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...bindings) { values = bindings as SQLInputValue[]; return statement; },
        async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
        async first<T>(column?: string) {
          const row = sqlite.prepare(query).get(...values);
          return (row ? column ? row[column] : row : null) as T | null;
        },
        async run() { sqlite.prepare(query).run(...values); return { success: true }; },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sqlite.exec("COMMIT"); return result as T[];
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
}

test("protected D1 save/load retains exact plants, counts and crop history", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  const db = sqliteD1(sqlite);
  const symbol = Symbol.for("__cloudflare-context__");
  const globals = globalThis as unknown as Record<symbol, unknown>;
  const previous = globals[symbol];
  globals[symbol] = { env: { DB: db, GARDEN_WRITE_TOKEN: "isolated-test-key" } };
  const url = "https://garden.test/api/garden?gardenId=placement-test";
  sqlite.exec("INSERT INTO gardens (id, name, year) VALUES ('placement-test', 'Test', 2026)");
  const payload: PlannerPlan = {
    beds: [{ id: 123, name: "Bed", x: 10, y: 10, w: 30, h: 30 }],
    plantingAreas: [{ id: "area", bedId: 123, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "p1", x: 25, y: 40 }, { id: "p2", x: 70, y: 65 }] }],
    rows: [{ id: "row", crop: "Bean", cropIcon: "B", variety: "Climbing bean", spacingCm: 18, x1: 400, y1: 400, x2: 600, y2: 400, count: 2, placements: [{ id: "r1", x: 25, y: 5 }, { id: "r2", x: 75, y: -5 }] }],
    objects: [{ id: "shed", type: "structure", kind: "shed", x: 600, y: 600, widthCm: 120, depthCm: 120, heightCm: 200, rotationDeg: 30 }],
  };
  const put = (plan: PlannerPlan, key = "isolated-test-key") => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ plan }) }));
  try {
    expect((await put(payload, "wrong-key")).status).toBe(401);
    const response = await put(payload);
    expect(await response.json()).toMatchObject({ ok: true });
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.plantingAreas[0].placements).toEqual(payload.plantingAreas[0].placements);
    expect(loaded.plantingAreas[0].count).toBe(2);
    expect(loaded.rows[0].placements).toEqual(payload.rows[0].placements);
    expect(loaded.objects[0]).toMatchObject(payload.objects[0]);
    const plantingId = loaded.plantingAreas[0].plantingId;
    loaded.plantingAreas[0].placements!.splice(0, 1);
    loaded.plantingAreas[0].count = 1;
    expect(await (await put(loaded)).json()).toMatchObject({ ok: true });
    const afterDelete = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(afterDelete.plantingAreas[0].placements).toEqual([{ id: "p2", x: 70, y: 65 }]);
    expect(afterDelete.plantingAreas[0].count).toBe(1);
    expect(afterDelete.plantingAreas[0].plantingId).toBe(plantingId);
    afterDelete.plantingAreas = [];
    expect(await (await put(afterDelete)).json()).toMatchObject({ ok: true });
    expect(sqlite.prepare("SELECT status FROM plantings WHERE id = ?").get(plantingId!)).toMatchObject({ status: "finished" });
    await ensurePlantPlacementSchema(db);
    await ensurePlantPlacementSchema(db);
    expect(sqlite.prepare("SELECT placements_json FROM planting_rows WHERE id = 'row'").get()).toMatchObject({ placements_json: JSON.stringify(payload.rows[0].placements) });
  } finally { globals[symbol] = previous; sqlite.close(); }
});
