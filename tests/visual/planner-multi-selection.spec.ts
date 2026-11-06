import { expect, test } from "@playwright/test";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { canonicalSelection, moveSelection, pasteGroup, selectInBox, selectionBounds, type PlanSelection } from "../../lib/garden/multi-selection";

const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Selection bed", x: 10, y: 10, w: 20, h: 15 }],
  plantingAreas: [{ id: "area", plantingId: "saved-area", bedId: 1, crop: "Tomato", variety: "Roma", cropIcon: "", spacingCm: 40, x: 0, y: 0, w: 100, h: 100, count: 4, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "plant", x: 30, y: 40 }] }],
  rows: [{ id: "row", crop: "Carrot", variety: "Carrot", cropIcon: "", spacingCm: 20, x1: 350, y1: 130, x2: 450, y2: 130, count: 6 }],
  objects: [{ id: "tree", type: "tree", x: 350, y: 230, diameterCm: 50, label: "Selection tree" }],
};
const selected: PlanSelection[] = [{ kind: "bed", id: "1" }, { kind: "row", id: "row" }, { kind: "object", id: "tree" }];

test("group geometry keeps offsets, child identities and line lengths at boundaries", () => {
  const original = structuredClone(fixture);
  const canonical = canonicalSelection(fixture, [...selected, { kind: "planting", id: "area" }, selected[0]]);
  expect(canonical).toEqual(selected);
  const moved = moveSelection(fixture, canonical, -500, -500);
  expect(moved.beds[0].x).toBe(0);
  expect(moved.rows[0].x1).toBe(260);
  expect(moved.rows[0].x2 - moved.rows[0].x1).toBe(100);
  expect(moved.objects[0]).toMatchObject({ x: 260, y: 122 });
  expect(moved.plantingAreas).toEqual(fixture.plantingAreas);
  const copy = pasteGroup(fixture, { plan: fixture, selections: [...selected, { kind: "planting", id: "area" }] });
  expect(copy.selections).toHaveLength(3);
  expect(copy.plan.beds).toHaveLength(2);
  expect(copy.plan.plantingAreas).toHaveLength(2);
  expect(copy.plan.plantingAreas[1]).toMatchObject({ bedId: copy.plan.beds[1].id, x: 0, y: 0 });
  expect(copy.plan.plantingAreas[1].plantingId).toBeUndefined();
  expect(copy.plan.plantingAreas[1].placements![0].id).not.toBe("plant");
  expect(copy.plan.beds[1].id).toBeGreaterThan(1_000_000_000_000);
  expect(copy.plan.rows[1].x1 - fixture.rows[0].x1).toBeCloseTo(20);
  expect(copy.plan.beds[1].x * 9 - fixture.beds[0].x * 9).toBeCloseTo(20);
  expect(selectInBox(fixture, { x: 0, y: 0, w: 500, h: 300 }, "text")).toEqual([]);
  expect(fixture).toEqual(original);
});

test("box selection moves, copies, cuts and undoes mixed items together", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.getByRole("button", { name: "Box selection", exact: true }).click();
  const canvas = page.locator(".garden-canvas");
  const rect = (await canvas.boundingBox())!;
  const scale = rect.width / 900;
  await page.mouse.move(rect.x + 60 * scale, rect.y + 70 * scale);
  await page.mouse.down();
  await page.mouse.move(rect.x + 490 * scale, rect.y + 300 * scale, { steps: 12 });
  await expect(page.locator(".planner-selection-box")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: "3 items selected" })).toBeVisible();
  await expect(page.locator(".plan-bed.selected")).toHaveCount(1);
  await expect(page.locator(".planting-row.selected")).toHaveCount(1);
  await expect(page.locator(".tree-object.selected")).toHaveCount(1);
  const tree = page.locator(".tree-object");
  const before = (await tree.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 30, before.y + before.height / 2 + 20, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await tree.boundingBox())!.x).toBeGreaterThan(before.x + 10);
  // Rendered coordinates independently establish the same translation.
  const bedX = await page.locator(".plan-bed").evaluate((el) => Number.parseFloat((el as HTMLElement).style.left));
  const rowX = await page.locator(".planting-row").evaluate((el) => Number.parseFloat((el as HTMLElement).style.left));
  const treeX = await tree.evaluate((el) => Number.parseFloat((el as HTMLElement).style.left));
  expect(rowX - fixture.rows[0].x1).toBeCloseTo(bedX * 9 - fixture.beds[0].x * 9);
  expect(treeX - (350 - 25)).toBeCloseTo(rowX - fixture.rows[0].x1);
  await page.getByRole("button", { name: "Copy selection", exact: true }).first().click();
  await page.getByRole("button", { name: "Paste selection", exact: true }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(2);
  await expect(page.locator(".planting-area")).toHaveCount(2);
  await expect(page.locator(".planting-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Cut selection", exact: true }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(1);
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".plan-bed")).toHaveCount(2);
  await page.keyboard.press("Control+a");
  await expect(page.getByRole("heading", { name: "6 items selected" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("group-selection.png") });
  await page.keyboard.press("Escape");
  // Clicking blank space clears the selection without changing the plan.
  const latest = (await canvas.boundingBox())!;
  await page.mouse.click(latest.x + 800 * latest.width / 900, latest.y + 350 * latest.width / 900);
  await expect(page.locator(".plan-bed.selected")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(selectionBounds(fixture, selected[0])).toMatchObject({ x: 90, y: 108 });
});

test("modifier selection toggles items and follows the visible layer", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".tree-object").click();
  await page.locator(".planting-row").click({ modifiers: ["Shift"] });
  await expect(page.getByRole("heading", { name: "2 items selected" })).toBeVisible();
  await page.locator(".planting-row").click({ modifiers: ["Shift"] });
  await expect(page.locator(".planting-row.selected")).toHaveCount(0);
  await expect(page.locator(".tree-object.selected")).toHaveCount(1);
  await page.locator(".planting-row").click({ modifiers: ["Control"] });
  await expect(page.getByRole("heading", { name: "2 items selected" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".garden-canvas .selected")).toHaveCount(0);
  await page.getByLabel("Drawing layers", { exact: true }).selectOption("structures");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Control+a");
  await expect(page.locator(".tree-object.selected")).toHaveCount(1);
  await expect(page.locator(".planting-row.selected")).toHaveCount(0);
  await expect(page.locator(".plan-bed.selected")).toHaveCount(0);
});
