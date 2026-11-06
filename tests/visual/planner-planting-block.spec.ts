import { expect, test, type Page } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import { ensurePlantPlacementSchema } from "../../lib/garden/plant-placement-schema";
import { blockCorners, blockSymbolPositions, parsePlantingBlock, resizePlantingBlock, squareFootCm } from "../../lib/garden/planting-block";
import { rowPlants } from "../../lib/garden/plan-editing";
import { moveSelection, selectInBox } from "../../lib/garden/multi-selection";
import { pastePlanSelection } from "../../lib/garden/selection-clipboard";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import type { PlannerPlan, PlannerRow } from "../../lib/garden/planner-plan";

const seed: PlannerRow = { id: "pumpkins", crop: "Pumpkin", cropIcon: "P", variety: "Crown", spacingCm: 90, x1: 100, y1: 400, x2: 100, y2: 400, count: 1 };
const empty: PlannerPlan = { beds: [], rows: [], plantingAreas: [], objects: [] };
const read = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!) as PlannerPlan);

test("block spacing, square-foot density, rotations and selection share exact positions", () => {
  const block = resizePlantingBlock(seed, 270, 180, { mode: "block", rowSpacingCm: 90, depthCm: 0 });
  expect(block.count).toBe(12);
  expect(rowPlants(block)).toHaveLength(12);
  expect(rowPlants(block).at(-1)).toMatchObject({ x: 370, y: 580 });
  expect(seed.block).toBeUndefined();
  const square = resizePlantingBlock(seed, squareFootCm * 2, squareFootCm * 3, { mode: "square-foot", depthCm: 0, rowSpacingCm: 90, plantsPerSquareFoot: 16 });
  expect(square.count).toBe(96);
  expect(blockSymbolPositions(square)).toHaveLength(96);
  for (const n of [1, 2, 4, 8, 9, 16]) {
    const cell = resizePlantingBlock(seed, squareFootCm, squareFootCm, { ...square.block!, plantsPerSquareFoot: n });
    expect(rowPlants(cell)).toHaveLength(n);
    expect(rowPlants(cell).every(p => p.x > 100 && p.x < 130.48 && p.y > 400 && p.y < 430.48)).toBe(true);
  }
  const plan = { ...empty, rows: [block] };
  expect(selectInBox(plan, { x: 95, y: 395, w: 280, h: 100 })).toEqual([]);
  expect(selectInBox(plan, { x: 95, y: 395, w: 280, h: 190 })).toHaveLength(1);
  const moved = moveSelection(plan, [{ kind: "row", id: seed.id }], 1000, 1000).rows[0];
  expect(Math.max(...blockCorners(moved).map(p => p.x))).toBe(900);
  expect(Math.max(...blockCorners(moved).map(p => p.y))).toBe(1080);
  expect(pastePlanSelection({ ...empty, rows: [moved] }, { plan: { ...empty, rows: [moved] }, selection: { kind: "row", id: seed.id } })!.plan.rows[1].block).toEqual(block.block);
  const rotated = resizePlantingBlock({ ...seed, x2: 100, y2: 490 }, 180, 90, block.block);
  expect(rowPlants(rotated).at(-1)!.x).toBeCloseTo(10, 8);
  expect(rowPlants(rotated).at(-1)!.y).toBeCloseTo(580, 8);
  expect(() => parsePlantingBlock({ ...square.block, plantsPerSquareFoot: 7 })).toThrow();
  expect(() => parsePlantingBlock({ ...block.block, depthCm: NaN })).toThrow();
});

function sqliteD1(sqlite: DatabaseSync): D1DatabaseLike {
  return {
    prepare(query) {
      let values: SQLInputValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...bindings) { values = bindings as SQLInputValue[]; return statement; },
        async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
        async first<T>(column) { const row = sqlite.prepare(query).get(...values); return (row ? column ? row[column] : row : null) as T | null; },
        async run() { sqlite.prepare(query).run(...values); return { success: true }; },
      }; return statement;
    },
    async batch<T>(statements: D1PreparedStatementLike[]) {
      sqlite.exec("BEGIN");
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec("COMMIT"); return result as T[]; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
}

test("protected D1 save/load retains block settings and legacy rows without rewriting history", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  sqlite.exec("INSERT INTO gardens (id, name, year) VALUES ('block-test', 'Test', 2026)");
  const db = sqliteD1(sqlite), symbol = Symbol.for("__cloudflare-context__");
  const globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[symbol];
  globals[symbol] = { env: { DB: db, GARDEN_WRITE_TOKEN: "fixture-key" } };
  const url = "https://garden.test/api/garden?gardenId=block-test";
  const block = resizePlantingBlock(seed, 270, 180, { mode: "block", depthCm: 0, rowSpacingCm: 90 });
  const square = resizePlantingBlock({ ...seed, id: "sfg", x1: 500, x2: 500 }, 60.96, 60.96, { mode: "square-foot", depthCm: 0, rowSpacingCm: 90, plantsPerSquareFoot: 4 });
  const plan: PlannerPlan = { ...empty, rows: [block, square, { ...seed, id: "legacy" }] };
  const put = (payload: PlannerPlan, key = "fixture-key") => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ plan: payload }) }));
  try {
    expect((await put(plan, "wrong")).status).toBe(401);
    expect(await (await put(plan)).json()).toMatchObject({ ok: true });
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.rows.map(row => row.block)).toEqual(plan.rows.map(row => row.block));
    expect(loaded.rows.map(row => row.count)).toEqual([12, 16, 1]);
    const before = sqlite.prepare("SELECT id, status FROM plantings ORDER BY id").all();
    expect(await (await put(loaded)).json()).toMatchObject({ ok: true });
    expect(sqlite.prepare("SELECT id, status FROM plantings ORDER BY id").all()).toEqual(before);
    await ensurePlantPlacementSchema(db); await ensurePlantPlacementSchema(db);
    expect(sqlite.prepare("PRAGMA table_info(planting_rows)").all().filter(c => c.name === "block_json")).toHaveLength(1);
    const invalid = structuredClone(plan); invalid.rows[0].block!.depthCm = 1000;
    expect((await put(invalid)).status).toBe(400);
    const partialCell = structuredClone(plan); partialCell.rows[1].x2 += 5;
    expect((await put(partialCell)).status).toBe(400);
    const zeroCell = structuredClone(plan); zeroCell.rows[1].block!.depthCm = 0;
    expect((await put(zeroCell)).status).toBe(400);
  } finally { globals[symbol] = previous; sqlite.close(); }
});

async function boot(page: Page, plan = empty) {
  await page.route("**/api/**", route => route.fulfill({ json: { ok: true, plan, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
}

test("single pumpkin expands into a block with live counts, stable dragging, undo and reload", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await boot(page, { ...empty, rows: [seed] });
  await page.locator(".row-dots i").click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!, scale = canvas.width / 900;
  const handle = (await page.getByRole("button", { name: "Resize planting block", exact: true }).boundingBox())!;
  const x = handle.x + handle.width / 2, y = handle.y + handle.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 180 * scale, y + 90 * scale, { steps: 6 });
  await expect(page.locator(".row-dots i")).toHaveCount(6);
  await page.evaluate(plan => window.dispatchEvent(new StorageEvent("storage", { key: "blenheim-garden-live-plan", newValue: JSON.stringify(plan) })), { ...empty, rows: [seed] });
  await expect(page.locator(".row-dots i")).toHaveCount(6);
  await page.mouse.move(x + 270 * scale, y + 180 * scale, { steps: 6 });
  await expect(page.locator(".row-dots i")).toHaveCount(12);
  await page.mouse.up();
  expect((await read(page)).rows[0].block).toMatchObject({ depthCm: 180, rowSpacingCm: 90 });
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".row-dots i")).toHaveCount(1);
  await page.locator('.gv-quickbar button[title^="Redo"]').click();
  await expect(page.locator(".row-dots i")).toHaveCount(12);
  await page.locator(".gv-save").click();
  await page.reload(); await expect(page.locator(".row-dots i")).toHaveCount(12);
  await page.screenshot({ path: info.outputPath("pumpkin-block.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("square-foot cells repeat crop density and new-row previews stay stable when panels shift", async ({ page }, info) => {
  await boot(page);
  const rail = (label: string) => page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: new RegExp(`^${label}$`) }) });
  await rail("Plants").click();
  await page.locator('.gv-plant-list > button[data-crop="Carrot"]').click();
  await page.getByLabel("Planting mode", { exact: true }).selectOption("square-foot");
  let canvas = (await page.locator(".garden-canvas").boundingBox())!, scale = canvas.width / 900;
  let x = canvas.x + 100 * scale, y = canvas.y + 500 * scale;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 70 * scale, y + 70 * scale, { steps: 5 });
  await expect(page.locator(".draft-planting-row .row-dots i")).toHaveCount(64);
  await page.mouse.up();
  await expect(page.locator('.planting-block[data-planting-mode="square-foot"] .row-dots i')).toHaveCount(64);
  expect((await read(page)).rows[0].block).toMatchObject({ depthCm: 60.96, plantsPerSquareFoot: 16 });
  await page.screenshot({ path: info.outputPath("square-foot-carrots.png") });
  await rail("Rows").click();
  await page.locator('.gv-plant-list > button[data-crop="Pumpkin"]').click();
  await page.getByLabel("Planting mode", { exact: true }).selectOption("row");
  await page.getByLabel("Plant spacing (cm)").fill("90");
  canvas = (await page.locator(".garden-canvas").boundingBox())!; scale = canvas.width / 900;
  x = canvas.x + 100 * scale; y = canvas.y + 750 * scale;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 270 * scale, y, { steps: 5 });
  await expect(page.locator(".draft-planting-row .row-dots i")).toHaveCount(4);
  for (const offset of [-15, 15, -15, 15]) {
    await page.locator(".garden-canvas").evaluate((el, offset) => { (el as HTMLElement).style.left = `${offset}px`; }, offset);
    await page.mouse.move(x + 270 * scale, y + .01);
    await expect(page.locator(".draft-planting-row .row-dots i")).toHaveCount(4);
  }
  await page.locator(".garden-canvas").evaluate(el => { (el as HTMLElement).style.left = ""; });
  await page.mouse.up();
  expect((await read(page)).rows[1].count).toBe(4);
});

test("blocks draw in reverse, edit row gaps and preserve settings when duplicated", async ({ page }, info) => {
  await boot(page);
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Rows$/ }) }).click();
  await page.locator('.gv-plant-list > button[data-crop="Pumpkin"]').click();
  await page.getByLabel("Planting mode", { exact: true }).selectOption("block");
  await page.getByLabel("Plant spacing (cm)").fill("90");
  const canvas = (await page.locator(".garden-canvas").boundingBox())!, scale = canvas.width / 900;
  await page.mouse.move(canvas.x + 450 * scale, canvas.y + 600 * scale);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 180 * scale, canvas.y + 420 * scale, { steps: 6 });
  await expect(page.locator(".draft-planting-row .row-dots i")).toHaveCount(12);
  await page.mouse.up();
  await expect(page.locator(".planting-block .row-dots i")).toHaveCount(12);
  expect((await read(page)).rows[0]).toMatchObject({ x1: 180, y1: 420, x2: 450, y2: 420 });
  await page.getByLabel("Between rows (cm)").fill("180");
  await expect(page.locator(".row-dots i")).toHaveCount(8);
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".row-dots i")).toHaveCount(12);
  await page.locator(".row-dots i").first().click();
  await page.locator(".gv-selection-panel").getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator(".planting-block")).toHaveCount(2);
  expect((await read(page)).rows[1].block).toEqual((await read(page)).rows[0].block);
  await page.screenshot({ path: info.outputPath("block-inspector.png") });
  const detail = (await page.locator(".planting-block").last().boundingBox())!;
  await page.screenshot({ path: info.outputPath("block-detail.png"), clip: { x: Math.max(0, detail.x - 25), y: Math.max(0, detail.y - 35), width: detail.width + 50, height: detail.height + 70 } });
});

test("duplicating blocks at the garden border keeps the whole footprint and plant count", async ({ page }) => {
  const block = resizePlantingBlock({ ...seed, x1: 700, x2: 700, y1: 800, y2: 800 }, 180, 180, { mode: "block", depthCm: 0, rowSpacingCm: 90 });
  await boot(page, { ...empty, rows: [block] });
  await page.locator(".row-dots i").first().click();
  for (let i = 0; i < 3; i++) await page.locator(".gv-selection-panel").getByRole("button", { name: "Duplicate", exact: true }).click();
  const plan = await read(page);
  expect(plan.rows).toHaveLength(4);
  for (const row of plan.rows) {
    expect(row.count).toBe(9);
    expect(row.x2 - row.x1).toBe(180);
    expect(blockCorners(row).every(p => p.x >= 0 && p.x <= 900 && p.y >= 0 && p.y <= 1080)).toBe(true);
  }
});
