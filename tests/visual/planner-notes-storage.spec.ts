import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { GET, PUT } from "../../app/api/garden/plan-notes/route";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";

test("plan notes enforce write protection, retain exact text and isolate named gardens", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db: D1DatabaseLike = {
    prepare(query) {
      let values: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...bindings) { values = bindings as SQLInputValue[]; return statement; },
        async first<T>() { return (sqlite.prepare(query).get(...values) ?? null) as T | null; },
        async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
        async run() { sqlite.prepare(query).run(...values); return { success: true }; },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) { return await Promise.all(statements.map((statement) => statement.run())) as T[]; },
  };
  const globals = globalThis as unknown as Record<symbol, unknown>;
  const key = Symbol.for("__cloudflare-context__"), previous = globals[key];
  globals[key] = { env: { DB: db, GARDEN_WRITE_TOKEN: "isolated-notes-key" } };
  const endpoint = (id: string) => `https://garden.test/api/garden/plan-notes?gardenId=${id}`;
  const put = (id: string, body: unknown, token = "isolated-notes-key") => PUT(new Request(endpoint(id), { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ body }) }));
  const get = async (id: string) => (await (await GET(new Request(endpoint(id)))).json()).body;
  try {
    expect((await put("one", "bad write", "wrong")).status).toBe(401);
    expect(await get("one")).toBe("");
    const body = "  Keep indentation\nGrow 🌱 & <tomatoes>\n";
    expect((await put("one", body)).status).toBe(200);
    expect((await put("two", "Separate garden")).status).toBe(200);
    expect(await get("one")).toBe(body);
    expect(await get("one")).toBe(body);
    expect(await get("two")).toBe("Separate garden");
    expect((await put("one", "x".repeat(50001))).status).toBe(400);
    expect((await put("one", 42)).status).toBe(400);
    expect(await get("one")).toBe(body);
    expect((await put("one", "")).status).toBe(200);
    expect(await get("one")).toBe("");
    expect(await get("two")).toBe("Separate garden");
  } finally { globals[key] = previous; sqlite.close(); }
});
