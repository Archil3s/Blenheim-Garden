import { expect, test, type Page } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { sqliteD1 } from "./helpers/sqlite-d1";
import { GET, PUT } from "../../app/api/garden/route";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { nextPlantingDate, parsePlantingSchedule, planInPeriod, visibleInPeriod } from "../../lib/garden/planting-schedule";
import { addSuccession } from "../../lib/garden/succession-planting";
import { plants } from "../../lib/garden/plant-catalog";
import { groupedPlantList } from "../../lib/garden/plan-reports";
import { ensurePlantPlacementSchema } from "../../lib/garden/plant-placement-schema";

const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Succession bed", x: 10, y: 20, w: 35, h: 20 }],
  plantingAreas: [{ id: "area", bedId: 1, crop: "Carrot", cropIcon: "C", variety: "Nantes", spacingCm: 30, x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 16, visualSpacing: "normal", schedule: { from: "2026-11-01", until: "2027-02-28" } }],
  rows: [{ id: "first", crop: "Pumpkin", cropIcon: "P", variety: "Crown", spacingCm: 90, x1: 150, y1: 600, x2: 330, y2: 600, count: 3, schedule: { from: "2026-09-01", until: "2026-09-30" } },
    { id: "undated", crop: "Herbs", cropIcon: "H", variety: "Basil", spacingCm: 30, x1: 500, y1: 700, x2: 500, y2: 700, count: 1 }], objects: [],
};
const lettuce = plants.find(p => p.name === "Lettuce")!;
const read = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!) as PlannerPlan);

test("date ranges are inclusive, leap-safe and independent of the browser timezone", () => {
  expect(nextPlantingDate("2028-02-28")).toBe("2028-02-29");
  expect(nextPlantingDate("2026-12-31")).toBe("2027-01-01");
  for (const value of [{ from: "2026-02-29" }, { until: "2026-99-99" }, { from: "2026-11-02", until: "2026-11-01" }]) expect(() => parsePlantingSchedule(value)).toThrow(/Invalid/);
  expect(visibleInPeriod({ from: "2026-09-30", until: "2026-10-01" }, { year: 2026, month: 8 })).toBe(true);
  expect(visibleInPeriod({ from: "2026-09-30", until: "2026-10-01" }, { year: 2026, month: 9 })).toBe(true);
  expect(planInPeriod(fixture, { year: 2027, month: 1 }).plantingAreas).toHaveLength(1);
  expect(planInPeriod(fixture, { year: 2027, month: 2 }).plantingAreas).toHaveLength(0);
  expect(planInPeriod(fixture, { year: 2027, month: 2 }).rows.map(p => p.id)).toEqual(["undated"]);
  const copy = structuredClone(fixture);
  const next = addSuccession(fixture, { kind: "row", id: "first" }, lettuce, "second");
  expect(next.plan.rows[2]).toMatchObject({ id: "second", x1: 150, y1: 600, x2: 330, y2: 600, crop: "Lettuce", schedule: { from: "2026-10-01" } });
  expect(fixture).toEqual(copy);
  const sameCrop = addSuccession(fixture, { kind: "row", id: "first" }, plants.find(p => p.name === "Pumpkin")!, "third");
  expect(groupedPlantList(sameCrop.plan).filter(p => p.crop === "Pumpkin")).toHaveLength(2);
});

test("protected D1 schedules round-trip without finishing prior plantings or altering actual history", async () => {
  const db = new DatabaseSync(":memory:"); db.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  db.exec("INSERT INTO gardens (id, name, year) VALUES ('schedule-test', 'Test', 2026)");
  const symbol = Symbol.for("__cloudflare-context__"), globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[symbol];
  const adapter = sqliteD1(db); globals[symbol] = { env: { DB: adapter, GARDEN_WRITE_TOKEN: "fixture-key" } };
  const url = "https://garden.test/api/garden?gardenId=schedule-test";
  const put = (plan: PlannerPlan, key = "fixture-key") => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ plan }) }));
  try {
    expect((await put(fixture, "wrong")).status).toBe(401);
    expect(await (await put(fixture)).json()).toMatchObject({ ok: true });
    const before = db.prepare("SELECT id, start_date, end_date, status FROM plantings ORDER BY id").all();
    const next = addSuccession(fixture, { kind: "planting", id: "area" }, lettuce, "area-next");
    expect(await (await put(next.plan)).json()).toMatchObject({ ok: true });
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.rows[0].schedule).toEqual(fixture.rows[0].schedule);
    expect(loaded.rows[1].schedule).toBeUndefined();
    expect(loaded.plantingAreas[1]).toMatchObject({ schedule: { from: "2027-03-01" }, x: 0, y: 0, w: 100, h: 100 });
    for (const row of before) expect(db.prepare("SELECT id, start_date, end_date, status FROM plantings WHERE id = ?").get(row.id!)).toEqual(row);
    const bad = structuredClone(next.plan); bad.rows[0].schedule = { from: "2026-02-30" };
    expect((await put(bad)).status).toBe(400);
    await ensurePlantPlacementSchema(adapter); await ensurePlantPlacementSchema(adapter);
  } finally { globals[symbol] = previous; db.close(); }
});

async function boot(page: Page) {
  await page.route("**/api/**", route => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
}

test("month visibility, same-space succession, undo and reload preserve every planting", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await boot(page);
  await expect(page.locator(".planting-row")).toHaveCount(2);
  await expect(page.locator(".planting-area")).toHaveCount(0);
  await page.locator('.planting-row[data-crop="Pumpkin"] .row-dots i').first().click();
  await expect(page.getByLabel("In garden until")).toHaveValue("2026-09-30");
  await page.getByLabel("Next crop", { exact: true }).selectOption("Lettuce");
  await page.getByRole("button", { name: "Add succession planting", exact: true }).click();
  await expect(page.getByLabel("Planning month", { exact: true })).toHaveValue("Oct");
  await expect(page.locator('.planting-row[data-crop="Pumpkin"]')).toHaveCount(0);
  await expect(page.locator('.planting-row[data-crop="Lettuce"]')).toHaveCount(1);
  expect((await read(page)).rows).toHaveLength(3);
  await page.screenshot({ path: info.outputPath("succession-october.png") });
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect.poll(async () => (await read(page)).rows.length).toBe(2);
  await page.locator('.gv-quickbar button[title^="Redo"]').click();
  await expect(page.locator('.planting-row[data-crop="Lettuce"]')).toHaveCount(1);
  await page.getByLabel("Planning month", { exact: true }).selectOption("Sep");
  await expect(page.locator('.planting-row[data-crop="Pumpkin"]')).toHaveCount(1);
  await page.locator(".gv-save").click(); await page.reload();
  await expect(page.getByLabel("Planning month", { exact: true })).toHaveValue("Sep");
  expect((await read(page)).rows).toHaveLength(3);
  await page.getByLabel("Planning year", { exact: true }).fill("2027");
  await page.getByLabel("Planning year", { exact: true }).press("Enter");
  await page.getByLabel("Planning month", { exact: true }).selectOption("Jan");
  await expect(page.locator(".planting-area")).toHaveCount(1);
  await page.getByLabel("Planning month", { exact: true }).selectOption("Mar");
  await expect(page.locator(".planting-area")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("dated areas remain editable and plant lists distinguish schedules and selected month", async ({ page }, info) => {
  await boot(page);
  await page.getByLabel("Planning month", { exact: true }).selectOption("Nov");
  await page.locator(".planting-area").click();
  await page.locator(".gv-planting-summary").click();
  await page.getByLabel("In garden until").fill("2027-03-01");
  expect((await read(page)).plantingAreas[0].schedule?.until).toBe("2027-03-01");
  await page.screenshot({ path: info.outputPath("area-dates.png") });
  const tab = page.getByRole("button", { name: "Open plant list", exact: true });
  if (await tab.isVisible()) await tab.click();
  else { await page.locator(".gv-more summary").click(); await page.locator(".gv-more-panel").getByRole("button", { name: "Plant List", exact: true }).click(); }
  const report = page.getByRole("dialog", { name: "Plant List", exact: true });
  await expect(report).toContainText("2027-03-01");
  await page.getByLabel("Show plantings", { exact: true }).selectOption("month");
  await expect(report.locator("tbody")).not.toContainText("Crown");
  await expect(report.locator("tbody")).toContainText("Nantes");
  await page.screenshot({ path: info.outputPath("dated-plant-list.png") });
});

test("3D uses the selected month without dropping hidden plantings from the editable plan", async ({ page }, info) => {
  await boot(page);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const editor = page.getByTestId("inline-3d-workspace");
  await expect(editor).toHaveAttribute("data-visible-plantings", "2");
  await page.getByLabel("Planning month", { exact: true }).selectOption("Oct");
  await expect(editor).toHaveAttribute("data-visible-plantings", "1");
  expect((await read(page)).rows).toHaveLength(2);
  await page.getByLabel("Planning month", { exact: true }).selectOption("Nov");
  await expect(editor).toHaveAttribute("data-visible-plantings", "2");
  await expect(editor.locator("canvas")).toBeVisible();
  await editor.getByRole("button", { name: "Fit", exact: true }).click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath("november-3d.png") });
});
