import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../../lib/garden/cloudflare-db";

export function isolatedGardenDatabase(gardenId: string) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  sqlite.prepare("INSERT INTO gardens (id, name, year) VALUES (?, 'Test garden', 2026)").run(gardenId);
  const db: D1DatabaseLike = {
    prepare(query) {
      let values: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...bindings) { values = bindings as SQLInputValue[]; return statement; },
        async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
        async first<T>(column?: string) { const row = sqlite.prepare(query).get(...values); return (row ? column ? row[column] : row : null) as T | null; },
        async run() { sqlite.prepare(query).run(...values); return { success: true }; },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) {
      sqlite.exec("BEGIN");
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec("COMMIT"); return result as T[]; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  const symbol = Symbol.for("__cloudflare-context__");
  const globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[symbol];
  globals[symbol] = { env: { DB: db, GARDEN_WRITE_TOKEN: "isolated-test-key" } };
  return { close: () => { globals[symbol] = previous; sqlite.close(); } };
}
