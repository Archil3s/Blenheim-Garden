import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import type { PlannerPlan } from "../../lib/garden/planner-plan";

test("garden dimensions and bed ownership persist independently with protected writes", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  sqlite.exec("INSERT INTO gardens (id, name, year) VALUES ('builder-test', 'Builder', 2026), ('other-test', 'Other', 2026)");
  const db: D1DatabaseLike = {
    prepare(query) {
      let values: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...v) { values = v as SQLInputValue[]; return statement; },
        async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
        async first<T>(column?: string) { const r = sqlite.prepare(query).get(...values); return (r ? column ? r[column] : r : null) as T | null; },
        async run() { sqlite.prepare(query).run(...values); return { success: true }; },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) {
      sqlite.exec("BEGIN");
      try { const result = []; for (const s of statements) result.push(await s.run()); sqlite.exec("COMMIT"); return result as T[]; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  const symbol = Symbol.for("__cloudflare-context__"), global = globalThis as unknown as Record<symbol, unknown>, previous = global[symbol];
  global[symbol] = { env: { DB: db, GARDEN_WRITE_TOKEN: "isolated-builder-key" } };
  const url = "https://garden.test/api/garden?gardenId=builder-test";
  const payload: PlannerPlan = { canvasWidthCm: 2000, canvasHeightCm: 1800,
    bedProfiles: { "object:raised": { sun: "partial", soilDepthCm: 25, previousCrop: "Lettuce" } },
    beds: [{ id: 501, name: "Far bed", x: 60, y: 40, w: 10, h: 10 }], plantingAreas: [],
    objects: [{ id: "raised", type: "structure", kind: "raised-bed-timber", x: 1500, y: 1400, widthCm: 240, depthCm: 160, heightCm: 60, rotationDeg: 30 },
      { id: "fence", type: "structure", kind: "fence", x: 1800, y: 300, widthCm: 200, depthCm: 30, heightCm: 100, rotationDeg: 10 }],
    rows: [{ id: "owned", surfaceId: "object:raised", crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 25, count: 1, x1: 1500, y1: 1400, x2: 1500, y2: 1400, placements: [{ id: "far-plant", x: 0, y: 0 }] }] };
  const put = (plan: PlannerPlan, key = "isolated-builder-key") => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ plan }) }));
  try {
    expect((await put(payload, "wrong")).status).toBe(401);
    expect(await (await put(payload)).json()).toMatchObject({ ok: true });
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.canvasWidthCm).toBe(2000); expect(loaded.canvasHeightCm).toBe(1800);
    expect(loaded.bedProfiles).toEqual(payload.bedProfiles);
    expect(loaded.objects.find((o) => o.id === "fence")).toEqual(payload.objects[1]);
    expect(loaded.rows[0].surfaceId).toBe("object:raised");
    expect(loaded.rows[0].placements).toEqual(payload.rows[0].placements);
    expect(sqlite.prepare("SELECT canvas_width_cm, canvas_height_cm FROM gardens WHERE id='other-test'").get()).toMatchObject({ canvas_width_cm: 900, canvas_height_cm: 1080 });
    expect((await put({ ...payload, canvasWidthCm: 100000 })).status).toBe(400);
    expect((await put({ ...payload, canvasWidthCm: 1400 })).status).toBe(400);
    expect((await put({ ...payload, rows: [{ ...payload.rows[0], surfaceId: "object:missing" }] })).status).toBe(400);
    expect((await put({ ...payload, bedProfiles: { "object:raised": { sun: "full", soilDepthCm: -1, previousCrop: "" } } })).status).toBe(400);
    expect((await (await GET(new Request(url))).json()).plan.canvasWidthCm).toBe(2000);
  } finally { global[symbol] = previous; sqlite.close(); }
});
