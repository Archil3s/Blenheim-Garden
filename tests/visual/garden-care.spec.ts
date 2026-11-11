import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { GET, POST, DELETE } from "../../app/api/garden/care/route";
import { fixture } from "./helpers/fixture";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import type { CareEvent } from "../../lib/garden/care";

const combined: CareEvent = {
  id: "treatment-one", gardenId: "blenheim-garden", kind: "fertiliser", occurredOn: "2026-11-11",
  products: [
    { name: "Comfrey liquid fertiliser", dilution: "1:100" },
    { name: "Tui General NPK fertiliser", dilution: "" },
  ],
  crops: ["Tomato", "Chilli", "Pumpkin"], targets: ["area:base-area-1"],
  method: "", withholdingDays: null, notes: "", createdAt: "2026-11-11 10:00:00",
};

test("care API saves one combined application, protects writes and isolates gardens", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON; CREATE TABLE gardens (id TEXT PRIMARY KEY); INSERT INTO gardens VALUES ('blenheim-garden'),('another-garden');");
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
  globals[key] = { env: { DB: db, GARDEN_WRITE_TOKEN: "care-test-key" } };
  const url = (gardenId: string) => "https://garden.test/api/garden/care?gardenId=" + gardenId;
  const write = (gardenId: string, body: unknown, token = "care-test-key") => POST(new Request(url(gardenId), {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify(body),
  }));
  try {
    const payload = {
      kind: combined.kind, occurredOn: combined.occurredOn,
      products: combined.products, crops: combined.crops, targets: combined.targets,
      withholdingDays: null, notes: "",
    };
    expect((await write("blenheim-garden", payload, "wrong")).status).toBe(401);
    expect((await write("blenheim-garden", { ...payload, products: [] })).status).toBe(400);
    const response = await write("blenheim-garden", payload);
    expect(response.status).toBe(200);
    const original = await (await GET(new Request(url("blenheim-garden")))).json() as { events: CareEvent[] };
    expect(original.events).toHaveLength(1);
    expect(original.events[0].products).toEqual(combined.products);
    expect(original.events[0].crops).toEqual(combined.crops);
    const other = await (await GET(new Request(url("another-garden")))).json() as { events: CareEvent[] };
    expect(other.events).toEqual([]);
    const id = original.events[0].id;
    expect((await DELETE(new Request(url("blenheim-garden") + "&id=" + id, {
      method: "DELETE", headers: { authorization: "Bearer wrong" },
    }))).status).toBe(401);
    expect((await DELETE(new Request(url("blenheim-garden") + "&id=" + id, {
      method: "DELETE", headers: { authorization: "Bearer care-test-key" },
    }))).status).toBe(200);
    const after = await (await GET(new Request(url("blenheim-garden")))).json() as { events: CareEvent[] };
    expect(after.events).toEqual([]);
  } finally { globals[key] = previous; sqlite.close(); }
});

test("combined fertiliser is visible in the journal and on the matching planted area", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden/care") return route.fulfill({ json: { ok: true, events: [combined] } });
    return route.fulfill({ json: { ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden" }], notes: [], harvests: [] } });
  });
  const query = "?date=2026-11-11&crop=Tomato&crop=Chilli&crop=Pumpkin&product=Comfrey%20liquid%20fertiliser&dilution=1%3A100&product=Tui%20General%20NPK%20fertiliser";
  await page.goto("/care" + query);
  await expect(page.getByRole("heading", { name: "Fertilising & spraying." })).toBeVisible();
  await expect(page.locator(".care-entry")).toHaveCount(1);
  await expect(page.locator(".care-entry")).toContainText("1:100");
  await expect(page.getByRole("textbox", { name: "Product name" })).toHaveCount(2);
  await expect(page.locator(".care-crop input:checked")).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath("care-journal.png"), fullPage: true });
  await page.getByRole("button", { name: "Spraying" }).click();
  await expect(page.getByText("Withholding period in days")).toBeVisible();
  await page.goto("/planner");
  await expect(page.locator(".planting-area .garden-care-flags .fed")).toHaveCount(1);
  await expect(page.locator(".planting-area[data-crop='Strawberry'] .garden-care-flags")).toHaveCount(0);
  expect(errors).toEqual([]);
});
