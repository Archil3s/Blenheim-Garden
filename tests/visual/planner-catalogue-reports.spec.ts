import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fixture } from "./helpers/fixture";
import { plants } from "../../lib/garden/plant-catalog";
import { referencePlantNames } from "../../lib/garden/plant-reference-names";
import { FULL_STRUCTURE_PRESETS, structureRenderKind } from "../../lib/garden/structure-catalog";
import { csvText, groupedPlantList, partsListRows, planSvg } from "../../lib/garden/plan-reports";

test("catalogue covers every observed plant and renders every structure", () => {
  const names = new Set(plants.map((plant) => plant.name));
  expect(referencePlantNames.every((name) => names.has(name))).toBe(true);
  expect(names.size).toBe(plants.length);
  expect(FULL_STRUCTURE_PRESETS).toHaveLength(71);
  expect(new Set(FULL_STRUCTURE_PRESETS.map((preset) => preset.kind)).size).toBe(71);
  for (const preset of FULL_STRUCTURE_PRESETS) {
    expect(FULL_STRUCTURE_PRESETS.some((item) => item.kind === structureRenderKind(preset.kind))).toBe(true);
  }
});

test("reports keep varieties and spacings distinct and use real measurements", () => {
  const plan = structuredClone(fixture);
  plan.plantingAreas.push({ ...plan.plantingAreas[0], id: "duplicate", count: 3 });
  const rows = groupedPlantList(plan);
  expect(rows.find((row) => row.variety === "Roma")?.quantity).toBe(13);
  expect(rows.filter((row) => row.crop === "Strawberry")).toHaveLength(2);
  const parts = partsListRows(plan);
  expect(parts.find((row) => row.part === "Path length")?.quantity).toBeCloseTo(14.5);
  expect(parts.find((row) => row.part === "Path surface")?.quantity).toBeCloseTo(6.525);
  expect(parts.find((row) => row.part === "Trellis posts")?.quantity).toBe(4);
  expect(csvText([["=HYPERLINK(1)", 'a,"b', "two\nlines"]])).toContain('"\'=HYPERLINK(1)"');
  expect(planSvg(plan, '<script>alert("x")</script>')).not.toContain("<script>");
  expect(planSvg(plan, "Garden")).toContain('height="1264"');
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") return route.fulfill({ json: { ok: true, plan: fixture } });
    if (path === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, beds: [], items: [], notes: [], harvests: [] } });
  });
});

test("full catalogue, custom spacing, reports and exports work", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator('.gv-rail button').filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await page.getByLabel(/Full plant catalogue/).check();
  await page.getByPlaceholder("Plant or variety").fill("Zucchini");
  await page.locator('.gv-plant-list > button[data-crop="Zucchini"]').click();
  await page.getByLabel("Plant spacing (cm)").fill("90");
  await page.getByLabel("Custom variety", { exact: true }).fill("My zucchini");
  await expect(page.locator(".gv-ready-strip")).toContainText("90 cm");
  await expect(page.locator(".gv-ready-strip")).toContainText("My zucchini");
  await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  await page.locator('.gv-rail button').filter({ has: page.locator("small", { hasText: /^Structures$/ }) }).click();
  await page.getByLabel(/Full structure catalogue/).check();
  await page.getByPlaceholder("Object name").fill("Pond");
  await page.locator(".gv-structure-list > button").filter({ hasText: "Pond" }).click();
  await expect(page.locator(".gv-structure-ready")).toContainText("Pond");
  await page.screenshot({ path: testInfo.outputPath("expanded-catalogue.png"), fullPage: true });
  await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  await page.locator(".gv-more summary").click();
  await page.locator(".gv-more-panel").getByRole("button", { name: "Plant List", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Plant List", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("119 plants");
  await dialog.getByLabel("Search plantings").fill("Strawberry");
  await expect(dialog).toContainText("39 plants");
  const csvDownload = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await csvDownload).suggestedFilename()).toBe("garden-plants.csv");
  await page.screenshot({ path: testInfo.outputPath("plant-list.png"), fullPage: true });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".gv-more summary").click();
  await page.locator(".gv-more-panel").getByRole("button", { name: "Parts List", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("14.50");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("main.gv-app")).toBeHidden();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".gv-more summary").click();
  await page.locator(".gv-more-panel").getByRole("button", { name: "Export plan", exact: true }).click();
  for (const [label, name] of [["Download JSON backup", "garden-plan.json"], ["Download SVG plan", "garden-plan.svg"], ["Download PNG plan", "garden-plan.png"]]) {
    const pending = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: label, exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(name);
    const path = testInfo.outputPath(name);
    await download.saveAs(path);
    const bytes = await readFile(path);
    if (name.endsWith("json")) expect(JSON.parse(bytes.toString()).plan).toEqual(fixture);
    if (name.endsWith("svg")) expect(bytes.toString()).toContain("Roma");
    if (name.endsWith("png")) {
      expect(bytes.readUInt32BE(16)).toBe(2000);
      expect(bytes.readUInt32BE(20)).toBe(2528);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("structures can be placed on a planted bed, rotated and resized", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Uses a mouse corner drag.");
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator('.gv-rail button').filter({ has: page.locator("small", { hasText: /^Structures$/ }) }).click();
  const bed = page.locator(".plan-bed").first();
  await bed.scrollIntoViewIfNeeded();
  const bounds = (await bed.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const structure = page.locator(".structure-object.selected");
  await expect(structure).toHaveCount(1);
  await page.getByRole("button", { name: "Rotate right 90°" }).click();
  await expect(structure).toHaveAttribute("style", /rotate\(90deg\)/);
  const width = page.getByLabel("Width (cm)", { exact: true });
  const originalWidth = Number(await width.inputValue());
  const handle = structure.locator(".structure-resize-handle");
  await handle.scrollIntoViewIfNeeded();
  const corner = (await handle.boundingBox())!;
  const x = corner.x + corner.width / 2, y = corner.y + corner.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => Number(await width.inputValue())).toBeGreaterThan(originalWidth);
});
