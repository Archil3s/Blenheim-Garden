import { createMainGardenTemplate } from "../../lib/garden/main-garden-template";
import { removeBedKeepingPlants } from "../../lib/garden/detach-bed-plants";
import { rowPlants } from "../../lib/garden/plan-editing";
import { expect, test } from "@playwright/test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import type { D1DatabaseLike, D1PreparedStatementLike } from "../../lib/garden/cloudflare-db";
import { createLargePlotTemplate } from "../../lib/garden/large-plot-template";
import { gardenDimensions, parseGardenDimensions } from "../../lib/garden/garden-dimensions";
import { areaPlants, movePlanSelection, validateEditorPlan } from "../../lib/garden/plan-editing";
import { planSvg } from "../../lib/garden/plan-reports";
import { plants } from "../../lib/garden/plant-catalog";
import { fixture } from "./helpers/fixture";
import type { PlannerPlan } from "../../lib/garden/planner-plan";

const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
const data = (plan: PlannerPlan) => ({ ok: true, plan, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] });
async function gardenMenu(page: import("@playwright/test").Page) { await page.locator(".planner-garden-menu > summary").click(); }

test("PDF geometry uses its metre grid and dimensions validate without scaling beds", () => {
  const template = createLargePlotTemplate(1000000);
  expect(gardenDimensions(template)).toEqual({ widthCm: 3500, heightCm: 3500 });
  expect(() => validateEditorPlan(template)).not.toThrow();
  expect(template.beds).toHaveLength(23);
  const plantings = [...template.rows, ...template.plantingAreas];
  expect(plantings.filter(row => row.crop === "Asparagus").reduce((sum, row) => sum + row.count, 0)).toBe(16);
  expect(plantings.reduce((sum, row) => sum + row.count, 0)).toBe(97);
  const area = template.plantingAreas[0];
  const firstPlant = areaPlants(template, area)[0];
  const moved = movePlanSelection(template, { kind: "bed", id: String(area.bedId) }, { x: 20, y: 30 });
  expect(areaPlants(moved, area)[0].x).toBeCloseTo(firstPlant.x + 20);
  expect(areaPlants(moved, area)[0].y).toBeCloseTo(firstPlant.y + 30);
  expect(plantings.some(row => row.crop === "Boysenberry")).toBe(true);
  expect(template.objects.some(object => object.type === "tree")).toBe(true);
  expect(planSvg(template, "PDF template")).toContain('width="3500" height="3500"');
  expect(() => parseGardenDimensions({ widthCm: 0, heightCm: 3500 })).toThrow();
  expect(() => parseGardenDimensions({ widthCm: 10001, heightCm: 3500 })).toThrow();
  expect(() => validateEditorPlan({ ...template, canvas: { widthCm: 100, heightCm: 100 } })).toThrow();
});

test("PDF template and custom dimensions round-trip through protected D1 storage", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  const db: D1DatabaseLike = { prepare(query) {
    let values: SQLInputValue[] = [];
    const statement: D1PreparedStatementLike = {
      bind(...bindings) { values = bindings as SQLInputValue[]; return statement; },
      async all<T>() { return { results: sqlite.prepare(query).all(...values) as T[], success: true }; },
      async first<T>(column) { const row = sqlite.prepare(query).get(...values); return (row ? column ? row[column] : row : null) as T | null; },
      async run() { sqlite.prepare(query).run(...values); return { success: true }; },
    }; return statement;
  }, async batch<T>(statements: D1PreparedStatementLike[]) {
    sqlite.exec("BEGIN"); try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec("COMMIT"); return results as T[]; }
    catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  } };
  const key = Symbol.for("__cloudflare-context__"), globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[key];
  globals[key] = { env: { DB: db, GARDEN_WRITE_TOKEN: "isolated-size-test" } };
  try {
    const template = createLargePlotTemplate(2000000);
    template.objects.push({ id: "far-text", type: "text", x: 3000, y: 3100, text: "Far corner", fontSize: 14 });
    const request = (plan: PlannerPlan, authenticated = true) => new Request("https://test.local/api/garden", { method: "PUT", headers: { "content-type": "application/json", ...(authenticated ? { authorization: "Bearer isolated-size-test" } : {}) }, body: JSON.stringify({ plan }) });
    expect((await PUT(request(template, false))).status).toBe(401);
    const saved = await PUT(request(template));
    expect(await saved.json()).toMatchObject({ ok: true });
    const loaded = await GET(new Request("https://test.local/api/garden"));
    const result = await loaded.json() as { plan: PlannerPlan };
    expect(result).toMatchObject({ ok: true });
    expect(result.plan.canvas).toEqual(template.canvas);
    expect(result.plan.bedMaterial).toBe("metal");
    const bed = template.beds[1];
    const detached = removeBedKeepingPlants(template, bed.id);
    detached.lockedItems = [`bed:${template.beds[0].id}`];
    const detachedSave = await PUT(request(detached));
    expect(await detachedSave.json()).toMatchObject({ ok: true });
    const detachedLoad = await GET(new Request("https://test.local/api/garden"));
    const savedPlan = (await detachedLoad.json()).plan as PlannerPlan;
    expect(savedPlan.lockedItems).toEqual(detached.lockedItems);
    const actual = savedPlan.rows.filter(row => row.crop === "Raspberry").flatMap(rowPlants);
    const expected = template.plantingAreas.filter(area => area.bedId === bed.id).flatMap(area => areaPlants(template, area));
    expect(actual.map(({ x, y }) => [x, y])).toEqual(expected.map(({ x, y }) => [x, y]));
    expect(savedPlan.beds.some(item => item.id === bed.id)).toBe(false);
    expect(result.plan.objects).toHaveLength(template.objects.length);
    expect(result.plan.beds).toEqual(template.beds);
    expect(result.plan.plantingAreas.map(area => [area.bedId, area.count, area.placements])).toEqual(template.plantingAreas.map(area => [area.bedId, area.count, area.placements]));
    expect(result.plan.rows.map(row => [row.x1, row.y1, row.x2, row.y2, row.count])).toEqual(template.rows.map(row => [row.x1, row.y1, row.x2, row.y2, row.count]));
    const before = sqlite.prepare("SELECT canvas_width_cm FROM gardens WHERE id='blenheim-garden'").get();
    const invalid = await PUT(request({ ...template, canvas: { widthCm: 50, heightCm: 100 } }));
    expect(invalid.status).toBe(400);
    expect(sqlite.prepare("SELECT canvas_width_cm FROM gardens WHERE id='blenheim-garden'").get()).toEqual(before);
  } finally { globals[key] = previous; sqlite.close(); }
});

test("PDF and blank templates are undoable, backed up and persist only through explicit Save", async ({ page }, info) => {
  let writes = 0;
  await page.route("**/api/**", route => { if (route.request().method() === "PUT") writes++; return route.fulfill({ json: data(fixture) }); });
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await gardenMenu(page); await page.getByRole("button", { name: "2023 PDF base template" }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  await expect(page.locator(".berry-strip,.north-zone")).toHaveCount(0);
  expect(await page.locator(".garden-canvas").evaluate(el => el.offsetWidth)).toBe(3500);
  await page.screenshot({ path: info.outputPath("pdf-template.png") });
  await gardenMenu(page); await page.getByRole("button", { name: "Blank template", exact: true }).click();
  await expect(page.locator(".plan-bed,.planting-row,.planting-area,.layout-object")).toHaveCount(0);
  expect(await page.locator(".garden-canvas").evaluate(el => el.offsetWidth)).toBe(3500);
  expect(writes).toBe(0);
  const backup = await page.evaluate(() => JSON.parse(localStorage.getItem("garden-before-blank-template:blenheim-garden")!));
  expect(backup.beds).toHaveLength(23);
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  await page.reload();
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  await page.screenshot({ path: info.outputPath("reopened-template.png") });
  await gardenMenu(page); await page.getByRole("button", { name: "Blank template", exact: true }).click();
  await page.reload(); await expect(page.locator(".plan-bed")).toHaveCount(0);
  await gardenMenu(page); await page.getByRole("button", { name: "Restore previous draft", exact: true }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  expect(writes).toBe(0);
});

test("garden size edits retain physical geometry, reject clipping and undo", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ json: data(fixture) }));
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const geometry = await page.locator(".plan-bed").first().getAttribute("style");
  await gardenMenu(page); await page.getByRole("button", { name: "Garden size…" }).click();
  const dialog = page.getByRole("dialog", { name: "Garden size", exact: true });
  await dialog.getByLabel("Width (metres)").fill("40"); await dialog.getByLabel("Length (metres)").fill("25");
  await dialog.getByRole("button", { name: "Apply size" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.locator(".garden-canvas").evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([4000, 2500]);
  expect(await page.locator(".plan-bed").first().getAttribute("style")).toBe(geometry);
  await gardenMenu(page); await page.getByRole("button", { name: "Garden size…" }).click();
  await dialog.getByLabel("Width (metres)").fill("1"); await dialog.getByLabel("Length (metres)").fill("1");
  await dialog.getByRole("button", { name: "Apply size" }).click(); await expect(dialog.getByRole("alert")).toBeVisible();
  await page.screenshot({ path: info.outputPath("garden-size-validation.png") });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  expect(await page.locator(".garden-canvas").evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([900, 1080]);
});

test("catalogue has one scroll surface and pinned search while map dragging stays separate", async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem("blenheim-garden-device-layout", "mobile"));
  await page.route("**/api/**", route => route.fulfill({ json: data(empty) }));
  await page.goto("/planner"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const canvas = page.locator(".garden-canvas"); const before = (await canvas.boundingBox())!;
  await page.getByRole("button", { name: "Move map", exact: true }).click();
  const x = before.x + before.width * .8, y = before.y + before.height * .8;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 40, y - 35, { steps: 5 }); await page.mouse.up();
  expect((await canvas.boundingBox())!.x - before.x).toBeCloseTo(-40, 0);
  expect((await canvas.boundingBox())!.y - before.y).toBeCloseTo(-35, 0);
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await page.getByRole("button", { name: "Expand drawing tools", exact: true }).click();
  await page.getByLabel(/Full plant catalogue/).check();
  await expect(page.locator(".gv-plant-list > button")).toHaveCount(plants.length);
  const content = page.locator(".gv-context-content");
  await content.evaluate(el => { el.scrollTop = 600; });
  await expect.poll(() => content.evaluate(el => el.scrollTop)).toBeGreaterThan(400);
  await expect(page.getByPlaceholder("Plant or variety")).toBeInViewport();
  await page.screenshot({ path: info.outputPath("catalogue-browse.png") });
  await page.getByPlaceholder("Plant or variety").fill("Zucchini");
  const plantButton = page.locator('.gv-plant-list > button[data-crop="Zucchini"]');
  await expect(plantButton).toBeVisible();
  const rowBox = (await plantButton.boundingBox())!, iconBox = (await plantButton.locator(".reference-plant-art").boundingBox())!;
  expect(iconBox.y).toBeGreaterThanOrEqual(rowBox.y);
  expect(iconBox.y + iconBox.height).toBeLessThanOrEqual(rowBox.y + rowBox.height);
  expect(iconBox.width).toBe(36);
  await page.screenshot({ path: info.outputPath("catalogue-search.png") });
  expect(await page.locator(".gv-plant-list").evaluate(el => getComputedStyle(el).overflowY)).toBe("visible");
  await page.getByRole("button", { name: "Objects & structures", exact: true }).click();
  await page.getByPlaceholder("Object name").fill("Greenhouse");
  await content.evaluate(el => { el.scrollTop = 600; });
  await expect(page.getByPlaceholder("Object name")).toBeInViewport();
  await page.screenshot({ path: info.outputPath("catalogue-objects.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("large PDF template renders in 3D and camera views fit its boundary", async ({ page }, info) => {
  const template = createLargePlotTemplate(3000000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(plan => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)), template);
  await page.route("**/api/**", route => route.fulfill({ json: data(template) }));
  await page.goto("/3d");
  await expect(page.locator('[aria-label="Visual 3D garden canvas"] canvas')).toBeVisible();
  const workspace = page.getByTestId("inline-3d-workspace");
  await expect(workspace).toHaveAttribute("data-canvas-width", "3500");
  await expect(workspace).toHaveAttribute("data-canvas-length", "3500");
  await page.evaluate(() => {
    const key = "blenheim-garden-live-plan";
    const plan = JSON.parse(localStorage.getItem(key)!);
    plan.canvas = { widthCm: 4000, heightCm: 3000 };
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: JSON.stringify(plan) }));
  });
  await expect(workspace).toHaveAttribute("data-canvas-width", "4000");
  await expect(workspace).toHaveAttribute("data-canvas-length", "3000");
  await expect(page.getByText("23 beds · 1 structures", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  await page.screenshot({ path: info.outputPath("large-template-3d.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.screenshot({ path: info.outputPath("large-template-top.png") });
  await page.goto("/planner");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("inline-3d-workspace")).toHaveAttribute("data-canvas-width", "3500");
  expect(errors).toEqual([]);
});

test("PDF template items can be selected through the item list and edited", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ json: data(fixture) }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await gardenMenu(page);
  await page.getByRole("button", { name: "2023 PDF base template" }).click();

  const line = page.locator('.shape-object[data-shape="line"]').first();
  const hit = await line.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const rotation = new DOMMatrix(getComputedStyle(el).transform);
    return { x: rect.x + rect.width / 2 + rotation.c * 4, y: rect.y + rect.height / 2 + rotation.d * 4 };
  });
  await page.mouse.click(hit.x, hit.y);
  await expect(page.locator(".shape-object.selected")).toHaveCount(1);
  const berry = page.locator('.planting-area[data-crop="Raspberry"] .planting-area-icons i').first();
  await berry.click();
  await expect(page.locator(".planting-area.selected")).toHaveCount(1);

  const pick = async (name: string, item: RegExp) => {
    await gardenMenu(page);
    await page.getByRole("button", { name: "Edit plan items…" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit plan items" });
    await dialog.getByRole("searchbox").fill(name);
    await dialog.getByRole("button", { name: item }).first().click();
    await expect(dialog).toHaveCount(0);
  };
  for (const [query, name, selector] of [
    ["West strawberry plot", /^West strawberry plot Bed$/, ".plan-bed.selected"],
    ["Planting area Raspberry", /Raspberry.*Planting area/i, ".planting-area.selected"],
    ["Blackberry", /Blackberry.*Planting row/i, ".planting-row.selected"],
    ["Main path", /Main path.*path/i, ".layout-object.selected"],
    ["Fruit tree", /^Fruit tree tree$/i, ".layout-object.selected"],
    ["Blueberry arch", /Blueberry arch.*structure/i, ".layout-object.selected"],
    ["shape line", /line.*shape/i, ".layout-object.selected"],
    ["Entrance", /^Entrance text$/i, ".layout-object.selected"],
  ] as const) {
    await pick(query, name);
    await expect(page.locator(selector)).toHaveCount(1);
  }
  const inspector = page.locator(".gv-context");
  await inspector.getByLabel("Text", { exact: true }).fill("Main entrance");
  await expect(page.locator(".layout-object.selected")).toHaveText("Main entrance");
  await page.reload();
  await expect(page.locator(".layout-object").filter({ hasText: /^Main entrance$/ })).toHaveCount(1);
});

test("nested beds can be drawn, locked and removed without deleting their plants", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ json: data(fixture) }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await gardenMenu(page);
  await page.getByRole("button", { name: "2023 PDF base template" }).click();
  const outer = page.locator(".plan-bed").filter({ has: page.locator(".gv-v4-bed-title", { hasText: /^Bed 1$/ }) });
  const box = (await outer.boundingBox())!;
  await page.locator(".gv-rail").getByRole("button", { name: "Bed", exact: true }).click();
  const current = (await outer.boundingBox())!;
  await page.mouse.move(current.x + box.width * .2, current.y + box.height * .25);
  await page.mouse.down();
  await page.mouse.move(current.x + box.width * .7, current.y + box.height * .75, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator(".plan-bed")).toHaveCount(24);

  const pickBed = async (name: string) => {
    await gardenMenu(page);
    await page.getByRole("button", { name: "Edit plan items…" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit plan items" });
    await dialog.getByRole("searchbox").fill(name);
    await dialog.getByRole("button", { name: name + " Bed", exact: true }).click();
  };
  await gardenMenu(page);
  await page.getByRole("button", { name: "Edit plan items…" }).click();
  const itemList = page.getByRole("dialog", { name: "Edit plan items" });
  await itemList.getByRole("button", { name: "Lock Bed 1", exact: true }).click();
  await expect(itemList.getByRole("button", { name: "Unlock Bed 1", exact: true })).toBeVisible();
  await itemList.getByRole("button", { name: "Bed 1 Bed", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unlock item" })).toBeVisible();
  await page.keyboard.press("Delete");
  await expect(page.locator(".plan-bed")).toHaveCount(24);
  await page.reload();
  await pickBed("Bed 1");
  await page.getByRole("button", { name: "Unlock item" }).click();

  await pickBed("Bed 2 · raspberries");
  await page.getByRole("button", { name: "Remove bed, keep plants" }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  await expect(page.locator(".planting-row[data-crop=Raspberry]")).toHaveCount(3);

  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await pickBed("Bed 2 · raspberries");
  await page.keyboard.press("Delete");
  await expect(page.locator(".plan-bed")).toHaveCount(23);
  await expect(page.locator(".planting-row[data-crop=Raspberry]")).toHaveCount(3);
});


test("main template clones the saved garden with metal beds and remapped locks", () => {
  const template = createMainGardenTemplate();
  const another = createMainGardenTemplate();
  expect(template.bedMaterial).toBe("metal");
  expect(template.beds).toHaveLength(24);
  expect(template.plantingAreas).toHaveLength(16);
  expect(template.lockedItems).toHaveLength(31);
  const beds = new Set(template.beds.map(bed => bed.id));
  expect(template.plantingAreas.every(area => beds.has(area.bedId) && !area.plantingId)).toBe(true);
  const keys = new Set([
    ...template.beds.map(item => "bed:" + item.id),
    ...template.plantingAreas.map(item => "planting:" + item.id),
    ...template.rows.map(item => "row:" + item.id),
    ...template.objects.map(item => "object:" + item.id),
  ]);
  expect(template.lockedItems?.every(key => keys.has(key))).toBe(true);
  expect(another.plantingAreas[0].id).not.toBe(template.plantingAreas[0].id);
});

test("locked beds pass canvas clicks through to their unlocked plantings", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Checks desktop canvas hit targets.");
  await page.route("**/api/**", route => route.fulfill({ json: data({
    ...fixture, lockedItems: ["bed:1", "object:layout-path-main"],
  }) }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const bed = page.locator(".plan-bed").first();
  const area = bed.locator(".planting-area");
  const toggle = page.getByRole("button", { name: "Edit locked items", exact: true });
  await expect(bed).toHaveCSS("pointer-events", "none");
  await expect(page.locator(".path-object[data-skip-locked=true]")).toHaveCSS("pointer-events", "none");
  await area.locator(".planting-area-label").click();
  await expect(area).toHaveClass(/selected/);
  await expect(bed).not.toHaveClass(/selected/);
  await toggle.click();
  await expect(bed).toHaveCSS("pointer-events", "auto");
  await bed.focus();
  await page.keyboard.press("Enter");
  await expect(bed).toHaveClass(/selected/);
  await expect(page.getByRole("button", { name: "Unlock item", exact: true })).toBeVisible();
  await toggle.click();
  await expect(bed).not.toHaveClass(/selected/);
});

test("a single row icon can change crop without moving its neighbours", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Checks a mouse click on an individual icon.");
  const row = {
    id: "tomato-row", crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 50,
    count: 3, x1: 400, y1: 160, x2: 600, y2: 160,
  };
  await page.route("**/api/**", route => route.fulfill({ json: data({ ...empty, rows: [row] }) }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".planting-row[data-crop=Tomato] [data-plant-index='2']").click();
  await page.getByLabel("Crop species").selectOption("Taro");
  await page.getByRole("button", { name: "Change this plant" }).click();
  await expect(page.locator(".planting-row[data-crop=Tomato]")).toHaveAttribute("data-count", "2");
  await expect(page.locator(".planting-row[data-crop=Taro]")).toHaveAttribute("data-count", "1");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!)) as PlannerPlan;
  expect(rowPlants(saved.rows.find(item => item.crop === "Tomato")!).map(item => item.x)).toEqual([400, 600]);
  expect(rowPlants(saved.rows.find(item => item.crop === "Taro")!)[0]).toMatchObject({ x: 500, y: 160 });
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".planting-row[data-crop=Tomato]")).toHaveAttribute("data-count", "3");
  await expect(page.locator(".planting-row[data-crop=Taro]")).toHaveCount(0);
});
