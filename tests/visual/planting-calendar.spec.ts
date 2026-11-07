import { expect, test, type Page } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { sqliteD1 } from "./helpers/sqlite-d1";
import { GET, PUT } from "../../app/api/garden/route";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { calendarMonthEvents, calendarPlantings, cropCalendarGuide, harvestGuide } from "../../lib/garden/planting-calendar";
import { parsePlantingSchedule } from "../../lib/garden/planting-schedule";

const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Calendar bed", x: 15, y: 20, w: 35, h: 22 }],
  plantingAreas: [{ id: "tomato", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 45, x: 0, y: 0, w: 100, h: 100, count: 6, pattern: "grid", iconSize: 16, visualSpacing: "normal", schedule: { from: "2026-11-01", until: "2027-03-31", sow: "2026-09-01", transplant: "2026-11-05" } }],
  rows: [{ id: "carrot", crop: "Carrot", cropIcon: "C", variety: "Nantes", spacingCm: 10, x1: 100, y1: 650, x2: 300, y2: 650, count: 21, schedule: { from: "2026-08-30", sow: "2026-08-30" } },
    { id: "other", crop: "Kohlrabi", cropIcon: "K", variety: "Purple", spacingCm: 30, x1: 450, y1: 650, x2: 600, y2: 650, count: 6, schedule: { harvestFrom: "2027-01-01", harvestUntil: "2027-02-01" } }], objects: [],
};

test("calendar keeps guidance distinct from planned events and uses explicit, sourced harvest bases", () => {
  const [tomato, carrot, other] = calendarPlantings(fixture);
  expect(cropCalendarGuide("Tomato")?.protectedSow).toContain(8);
  expect(cropCalendarGuide("Kohlrabi")).toBeUndefined();
  expect(harvestGuide(tomato)).toMatchObject({ from: "2027-01-04", until: "2027-01-29", estimated: true });
  expect(harvestGuide(carrot)).toMatchObject({ from: "2026-12-20", until: "2027-01-17", estimated: true });
  expect(harvestGuide({ ...carrot, variety: "Unverified variety" })).toBeUndefined();
  expect(harvestGuide({ ...tomato, schedule: { from: "2026-11-01" } })).toBeUndefined();
  expect(harvestGuide(other)).toMatchObject({ from: "2027-01-01", until: "2027-02-01", estimated: false });
  expect(calendarMonthEvents(tomato, 2027, 0).some(e => e.code === "~H")).toBe(true);
  expect(calendarMonthEvents(tomato, 2026, 0).some(e => e.code === "~H")).toBe(false);
  expect(calendarMonthEvents(other, 2027, 1).some(e => e.code === "●H")).toBe(true);
  expect(calendarMonthEvents({ ...other, schedule: { harvestFrom: "2027-01-01" } }, 2027, 5).some(e => e.code === "●H")).toBe(true);
  for (const dates of [{ sow: "2026-02-30" }, { sow: "2026-10-01", transplant: "2026-09-01" }, { harvestFrom: "2027-03-01", harvestUntil: "2027-02-01" }]) expect(() => parsePlantingSchedule(dates)).toThrow(/Invalid/);
});

test("calendar milestones survive protected D1 round trips and keep recorded history intact", async () => {
  const sqlite = new DatabaseSync(":memory:"); sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  sqlite.exec("INSERT INTO gardens (id, name, year) VALUES ('calendar-test', 'Calendar', 2026)");
  const symbol = Symbol.for("__cloudflare-context__"), globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[symbol];
  globals[symbol] = { env: { DB: sqliteD1(sqlite), GARDEN_WRITE_TOKEN: "fixture-key" } };
  const url = "https://garden.test/api/garden?gardenId=calendar-test";
  const put = (plan: PlannerPlan, key = "fixture-key") => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ plan }) }));
  try {
    expect((await put(fixture, "wrong")).status).toBe(401);
    expect(await (await put(fixture)).json()).toMatchObject({ ok: true });
    const before = sqlite.prepare("SELECT id, sow_date, transplant_date, start_date, status FROM plantings ORDER BY id").all();
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.plantingAreas[0].schedule).toEqual(fixture.plantingAreas[0].schedule);
    expect(loaded.rows.map(row => row.schedule)).toEqual(fixture.rows.map(row => row.schedule));
    loaded.plantingAreas[0].schedule!.sow = "2026-09-15";
    expect(await (await put(loaded)).json()).toMatchObject({ ok: true });
    expect(sqlite.prepare("SELECT id, sow_date, transplant_date, start_date, status FROM plantings ORDER BY id").all()).toEqual(before);
    loaded.rows[0].schedule!.transplant = "2026-01-01";
    expect((await put(loaded)).status).toBe(400);
  } finally { globals[symbol] = previous; sqlite.close(); }
});

async function openCalendar(page: Page) {
  const button = page.getByRole("button", { name: "Open planting calendar", exact: true });
  if (await button.isVisible()) await button.click();
  else { await page.locator(".gv-more summary").click(); await page.locator(".gv-more-panel").getByRole("button", { name: "Calendar", exact: true }).click(); }
  return page.getByRole("dialog", { name: "Planting Calendar", exact: true });
}

test("year grid edits planned dates, validates, undoes, saves and reloads without moving beds", async ({ page, context }, info) => {
  let stored = structuredClone(fixture), writes = 0;
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await context.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "fixture-key"));
  await page.route("**/api/**", route => {
    if (new URL(route.request().url()).pathname === "/api/garden" && route.request().method() === "PUT") {
      expect(route.request().headers().authorization).toBe("Bearer fixture-key"); stored = route.request().postDataJSON().plan; writes++;
    }
    return route.fulfill({ json: { ok: true, plan: stored, gardens: [], body: "", beds: [], items: [] } });
  });
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const calendar = await openCalendar(page);
  await calendar.getByLabel("Calendar view", { exact: true }).selectOption("year");
  await expect(calendar.locator(".calendar-grid tbody tr")).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("planting-year-grid.png") });
  const row = calendar.locator(".calendar-grid tbody tr").filter({ hasText: "Roma" });
  await row.getByRole("button", { name: "Edit dates", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Dates for Roma", exact: true });
  await editor.getByLabel("Planned transplanting", { exact: true }).fill("2026-08-01");
  await editor.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(editor.getByRole("alert")).toContainText("sow before transplanting");
  expect(writes).toBe(0);
  await editor.getByLabel("Planned transplanting", { exact: true }).fill("2026-11-10");
  await editor.getByLabel("Planned harvest from", { exact: true }).fill("2027-01-15");
  await editor.getByLabel("Planned harvest until", { exact: true }).fill("2027-03-01");
  await page.screenshot({ path: info.outputPath("calendar-date-editor.png") });
  await editor.getByRole("button", { name: "Apply dates", exact: true }).click();
  await expect(editor).toHaveCount(0);
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!) as PlannerPlan);
  expect((await read()).plantingAreas[0].schedule?.harvestFrom).toBe("2027-01-15");
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  expect((await read()).plantingAreas[0].schedule?.harvestFrom).toBeUndefined();
  await page.locator('.gv-quickbar button[title^="Redo"]').click();
  await page.locator(".gv-save").click(); await expect.poll(() => writes).toBe(1);
  expect(stored.beds).toEqual(fixture.beds);
  expect(stored.rows).toEqual(fixture.rows);
  await page.reload(); await openCalendar(page);
  await page.getByLabel("Calendar year", { exact: true }).selectOption("2027");
  await page.getByLabel("Calendar view", { exact: true }).selectOption("month");
  await page.getByRole("navigation", { name: "Calendar months" }).getByRole("button", { name: "Jan", exact: true }).click();
  await expect(page.locator(".calendar-agenda-row").filter({ hasText: "Roma" })).toContainText("Planned harvest: 2027-01-15");
  await page.screenshot({ path: info.outputPath("january-harvest-calendar.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("calendar guide, empty filters, CSV and plan links work across responsive layouts", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], body: "", beds: [], items: [] } }));
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const calendar = await openCalendar(page);
  await calendar.getByLabel("Calendar view", { exact: true }).selectOption("month");
  await expect(calendar.locator(".calendar-agenda-row").filter({ hasText: "Purple" })).toContainText("Seasonal guidance is unavailable");
  await calendar.getByLabel("Show Blenheim crop guide").check();
  await calendar.getByLabel("Find calendar crop").fill("Tomato");
  await expect(calendar).toContainText("Sow under cover (guide)");
  const downloadPromise = page.waitForEvent("download");
  await calendar.getByRole("button", { name: "Export calendar CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("planting-calendar-2026.csv");
  expect(readFileSync((await download.path())!, "utf8")).toContain("Sow under cover (guide)");
  await calendar.getByLabel("Find calendar crop").fill("Nothing matches");
  await expect(calendar).toContainText("No plantings match");
  await calendar.getByLabel("Find calendar crop").fill("");
  await calendar.getByLabel("Show Blenheim crop guide").uncheck();
  const roma = calendar.locator(".calendar-agenda-row").filter({ hasText: "Roma" });
  await roma.getByRole("button", { name: "Edit dates", exact: true }).click();
  await page.keyboard.press("Escape"); await expect(calendar).toBeVisible();
  await page.screenshot({ path: info.outputPath("calendar-month-agenda.png") });
  await roma.getByRole("button", { name: "Show on plan", exact: true }).click();
  await expect(calendar).toHaveCount(0);
  await expect(page.getByLabel("Planning month", { exact: true })).toHaveValue("Nov");
  await expect(page.locator(".gv-planting-inspector h2")).toHaveText("Roma");
});
