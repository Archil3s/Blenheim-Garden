import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import type { PlannerPlan, PlannerShape } from "../../lib/garden/planner-plan";
import { parseDesignerShape, shapeFromDrag } from "../../lib/garden/designer-shapes";
import { ensureDesignerSchema } from "../../lib/garden/designer-schema";
import { fixture } from "./helpers/fixture";

const shape: PlannerShape = { id: "test-shape", type: "shape", shape: "ellipse", x: 300, y: 300,
  widthCm: 160, heightCm: 100, rotationDeg: 30, stroke: "#74522d", fill: "#b7c59f", lineWidth: 3, locked: false, behind: false };

function database(sqlite: DatabaseSync): D1DatabaseLike {
  return {
    prepare(query) {
      let bindings: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...values) { bindings = values as SQLInputValue[]; return statement; },
        async all<T>() { return { results: sqlite.prepare(query).all(...bindings) as T[], success: true }; },
        async first<T>(column?: string) { const row = sqlite.prepare(query).get(...bindings); return (row ? column ? row[column] : row : null) as T | null; },
        async run() { sqlite.prepare(query).run(...bindings); return { success: true }; },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) {
      sqlite.exec("BEGIN");
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec("COMMIT"); return results as T[]; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
}

test("designer draws reverse drags and rejects unsafe shape data", () => {
  const style = { shape: "rectangle" as const, stroke: "#112233", fill: "none", lineWidth: 3 };
  expect(shapeFromDrag({ x: 250, y: 200 }, { x: 50, y: 100 }, style)).toMatchObject({ x: 150, y: 150, widthCm: 200, heightCm: 100 });
  expect(shapeFromDrag({ x: 0, y: 0 }, { x: 0, y: 100 }, { ...style, shape: "line" })).toMatchObject({ rotationDeg: 90, widthCm: 100, heightCm: 1 });
  expect(shapeFromDrag({ x: 0, y: 0 }, { x: 1, y: 1 }, style)).toBeNull();
  expect(() => parseDesignerShape({ ...shape, fill: 'url(https://invalid.test)' })).toThrow();
  expect(() => parseDesignerShape({ ...shape, x: NaN })).toThrow();
  expect(parseDesignerShape({ ...shape, rotationDeg: -30 }).rotationDeg).toBe(330);
});

test("designer shapes save in order, preserve existing objects and isolate gardens", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  sqlite.exec("INSERT INTO gardens (id, name, year) VALUES ('designer-one', 'One', 2026), ('designer-two', 'Two', 2026)");
  const globals = globalThis as unknown as Record<symbol, unknown>;
  const key = Symbol.for("__cloudflare-context__"), previous = globals[key];
  const db = database(sqlite);
  globals[key] = { env: { DB: db, GARDEN_WRITE_TOKEN: "designer-test-key" } };
  const put = (garden: string, plan: PlannerPlan) => PUT(new Request(`https://garden.test/api/garden?gardenId=${garden}`, { method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer designer-test-key" }, body: JSON.stringify({ plan }) }));
  const get = async (garden: string) => (await (await GET(new Request(`https://garden.test/api/garden?gardenId=${garden}`))).json()).plan as PlannerPlan;
  try {
    const plan = structuredClone(fixture);
    plan.objects.splice(1, 0, { ...shape, locked: true, behind: true });
    expect(await (await put("designer-one", plan)).json()).toMatchObject({ ok: true });
    const loaded = await get("designer-one");
    expect(loaded.objects.map((object) => object.id)).toEqual(plan.objects.map((object) => object.id));
    expect(loaded.objects[1]).toEqual(plan.objects[1]);
    expect(loaded.objects[0]).toMatchObject(plan.objects[0]);
    expect(await (await put("designer-two", { beds: [], plantingAreas: [], rows: [], objects: [{ ...shape, stroke: "#ff0000" }] })).json()).toMatchObject({ ok: true });
    expect((await get("designer-one")).objects[1]).toMatchObject({ stroke: "#74522d" });
    loaded.objects = loaded.objects.filter((object) => object.type !== "shape");
    expect(await (await put("designer-one", loaded)).json()).toMatchObject({ ok: true });
    expect((await get("designer-one")).objects).toHaveLength(fixture.objects.length);
    expect((await get("designer-two")).objects[0]).toMatchObject({ stroke: "#ff0000" });
    await ensureDesignerSchema(db);
    await ensureDesignerSchema(db);
  } finally { globals[key] = previous; sqlite.close(); }
});

test("garden designer draws, edits, locks, copies, layers and saves shapes", async ({ page }, testInfo) => {
  let plan: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "designer-test-key"));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") {
      if (route.request().method() === "PUT") plan = route.request().postDataJSON().plan;
      return route.fulfill({ json: { ok: true, plan } });
    }
    if (path === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, beds: [], notes: [], items: [], harvests: [] } });
  });
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Shapes$/ }) }).click();
  await page.getByRole("button", { name: "Filled Rectangle", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("shape-tools.png"), fullPage: true });
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  await page.mouse.move(canvas.x + canvas.width * .2, canvas.y + canvas.height * .3);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * .5, canvas.y + canvas.height * .5, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".shape-object:not(.draft-shape)")).toHaveCount(1);
  const originalWidth = await page.getByLabel("Shape width (cm)", { exact: true }).inputValue();
  const resize = (await page.locator(".shape-resize-handle").boundingBox())!;
  await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2);
  await page.mouse.down();
  await page.mouse.move(resize.x + resize.width / 2 + 16, resize.y + resize.height / 2 + 12, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByLabel("Shape width (cm)", { exact: true })).not.toHaveValue(originalWidth);
  await page.getByLabel("Shape width (cm)", { exact: true }).fill("200");
  await page.getByLabel("Shape rotation (degrees)", { exact: true }).fill("30");
  await page.getByLabel("Lock shape", { exact: true }).check();
  await expect(page.getByLabel("Shape width (cm)", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send to back", exact: true })).toBeDisabled();
  await page.getByLabel("Lock shape", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Send to back", exact: true }).click();
  await page.getByRole("button", { name: "Copy drawing", exact: true }).click();
  await page.getByRole("button", { name: "Paste drawing", exact: true }).click();
  await expect(page.locator(".shape-object:not(.draft-shape)")).toHaveCount(2);
  await page.locator('button[title^="Undo"]').click();
  await expect(page.locator(".shape-object:not(.draft-shape)")).toHaveCount(1);
  await page.locator('button[title^="Redo"]').click();
  await expect(page.locator(".shape-object:not(.draft-shape)")).toHaveCount(2);
  await page.getByLabel("Drawing layers").selectOption("plants");
  await expect(page.locator(".shape-object:visible")).toHaveCount(0);
  await page.getByLabel("Drawing layers").selectOption("all");
  await expect(page.locator(".shape-object:visible")).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("designer-shapes.png"), fullPage: true });
  await page.locator(".gv-save").click();
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.reload();
  await expect(page.locator(".shape-object:visible")).toHaveCount(2);
  expect(plan.objects).toHaveLength(2);
  expect(plan.objects[0]).toMatchObject({ type: "shape", widthCm: 200, rotationDeg: 30, behind: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("designer-shapes-3d.png"), fullPage: true });
  expect(errors).toEqual([]);
});
