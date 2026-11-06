import { expect, test } from "@playwright/test";
import { rowPlantCount, rowSymbolPositions } from "../../lib/garden/row-layout";
import { rowPlants } from "../../lib/garden/plan-editing";
import type { PlannerPlan, PlannerRow } from "../../lib/garden/planner-plan";

const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

test("row icons keep every plant and agree with 3D positions", () => {
  const row: PlannerRow = { id: "row", crop: "Carrot", cropIcon: "", variety: "Nantes", spacingCm: 25, x1: 100, y1: 300, x2: 850, y2: 300, count: 31 };
  expect(rowPlantCount(750, 25)).toBe(31);
  expect(rowSymbolPositions(row)).toHaveLength(31);
  expect(rowSymbolPositions(row).at(-1)!.x).toBe(750);
  expect(rowSymbolPositions({ ...row, count: 10001 })).toHaveLength(10001);
  expect(rowPlants({ ...row, count: 10001 })).toHaveLength(10001);
  expect(rowPlants(row).at(-1)).toMatchObject({ x: 850, y: 300 });
  const single = { ...row, x2: 100, count: 1 };
  expect(rowPlants(single)[0]).toMatchObject({ x: 100, y: 300 });
  expect(rowPlants({ ...single, placements: [{ id: "one", x: 10, y: -15 }] })[0]).toMatchObject({ x: 110, y: 285 });
});

test("pumpkin icons and count grow during drag and remain after release", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: empty, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Rows$/ }) }).click();
  await page.locator('.gv-plant-list > button[data-crop="Pumpkin"]').click();
  await page.getByLabel("Plant spacing (cm)").fill("90");
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  const zoom = canvas.width / 900;
  const x = canvas.x + 100 * zoom, y = canvas.y + 560 * zoom;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const preview = page.locator(".draft-planting-row");
  await expect(preview.locator(".row-dots i")).toHaveCount(1);
  await expect(page.locator(".gv-context")).toBeHidden();
  for (const [distance, count] of [[90, 2], [180, 3], [360, 5]]) {
    await page.mouse.move(x + distance * zoom, y, { steps: 6 });
    await expect(preview.locator(".row-dots i")).toHaveCount(count);
    await expect(preview).toHaveAttribute("data-count", String(count));
    await expect(preview.getByRole("status")).toContainText(`${count} plants`);
  }
  await page.screenshot({ path: info.outputPath("live-pumpkin-row.png") });
  await page.mouse.up();
  await expect(preview).toHaveCount(0);
  await expect(page.locator('.planting-row[data-crop="Pumpkin"] .row-dots i')).toHaveCount(5);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));
  expect(saved.rows[0]).toMatchObject({ crop: "Pumpkin", count: 5, spacingCm: 90 });
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".planting-row")).toHaveCount(0);
  await page.locator('.gv-quickbar button[title^="Redo"]').click();
  await expect(page.locator(".planting-row .row-dots i")).toHaveCount(5);
  await page.screenshot({ path: info.outputPath("completed-pumpkin-row.png") });
  expect(errors).toEqual([]);
});

test("touch drawing tools stay compact and expand on demand even on wide screens", async ({ page, context }, info) => {
  await context.addInitScript(() => localStorage.setItem("blenheim-garden-device-layout", "mobile"));
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: empty, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  const panel = page.locator(".gv-context");
  const compact = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;
  if (viewport.width > 760) expect(compact.width).toBeLessThanOrEqual(282);
  else expect(compact.height).toBeLessThanOrEqual(viewport.height * .35);
  await page.getByRole("button", { name: "Expand drawing tools", exact: true }).click();
  await expect.poll(async () => (await panel.boundingBox())!.height).toBeGreaterThan(compact.height + 30);
  await page.getByRole("button", { name: "Compact drawing tools", exact: true }).click();
  expect((await panel.boundingBox())!.height).toBeCloseTo(compact.height, 0);
  await page.screenshot({ path: info.outputPath("compact-drawing-tools.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Plants tool places a single plant or a row and existing rows show more than 24 icons", async ({ page }) => {
  const plan = structuredClone(empty);
  plan.rows.push({ id: "long-row", crop: "Carrot", cropIcon: "", variety: "Nantes", spacingCm: 25, x1: 50, y1: 800, x2: 800, y2: 800, count: 31 });
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await expect(page.locator('.planting-row[data-crop="Carrot"] .row-dots i')).toHaveCount(31);
  const chooseTomato = async () => {
    await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
    await page.locator('.gv-plant-list > button[data-crop="Tomato"]').click();
    await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  };
  await chooseTomato();
  let box = (await page.locator(".garden-canvas").boundingBox())!;
  let scale = box.width / 900;
  await page.mouse.click(box.x + 100 * scale, box.y + 560 * scale);
  await expect(page.locator('.planting-row[data-crop="Tomato"] .row-dots i')).toHaveCount(1);
  await chooseTomato();
  box = (await page.locator(".garden-canvas").boundingBox())!;
  scale = box.width / 900;
  await page.mouse.move(box.x + 100 * scale, box.y + 650 * scale);
  await page.mouse.down();
  await page.mouse.move(box.x + 280 * scale, box.y + 650 * scale, { steps: 6 });
  await expect(page.locator(".draft-planting-row")).toHaveAttribute("data-count", "5");
  await page.mouse.up();
  const live = await page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));
  expect(live.rows.at(-1)).toMatchObject({ crop: "Tomato", spacingCm: 45, count: 5 });
});
