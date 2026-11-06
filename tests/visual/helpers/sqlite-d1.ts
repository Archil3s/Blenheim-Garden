import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../../lib/garden/cloudflare-db";

export function sqliteD1(sqlite: DatabaseSync): D1DatabaseLike {
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
