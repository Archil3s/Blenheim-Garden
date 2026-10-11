import { expect, test, type Page } from "@playwright/test";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { areaPlants, deletePlanSelection, duplicatePlanSelection, movePlanSelection, rowPlants, validateEditorPlan } from "../../lib/garden/plan-editing";
import { parsePlantPlacements } from "../../lib/garden/plant-placement-schema";

const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
const liveKey = "blenheim-garden-live-plan";

async function plan(page: Page): Promise<PlannerPlan> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), liveKey);
}

test("individual plant mutations retain exact positions and counts", () => {
  const base: PlannerPlan = { ...empty, beds: [{ id: 1, name: "Bed", x: 10, y: 10, w: 20, h: 20 }], plantingAreas: [{ id: "area", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 12, pattern: "grid", iconSize: 16, visualSpacing: "normal" }] };
  const original = areaPlants(base, base.plantingAreas[0]);
  expect(original).toHaveLength(12);
  const selected = { kind: "area" as const, id: "area", plantId: original[0].id };
  const moved = movePlanSelection(base, selected, { x: 5, y: 5 });
  expect(areaPlants(moved, moved.plantingAreas[0])[0]).toBeDefined();
  const afterMove = areaPlants(moved, moved.plantingAreas[0]).find((p) => p.id === selected.plantId)!;
  expect(afterMove.x).toBeCloseTo(original[0].x + 5);
  expect(afterMove.y).toBeCloseTo(original[0].y + 5);
  const deleted = deletePlanSelection(moved, selected);
  expect(deleted.plantingAreas[0].count).toBe(original.length - 1);
  expect(areaPlants(deleted, deleted.plantingAreas[0]).some((p) => p.id === selected.plantId)).toBe(false);
  expect(JSON.parse(JSON.stringify(deleted))).toEqual(deleted);
  const duplicated = duplicatePlanSelection(moved, selected);
  expect(duplicated.plantingAreas[0].count).toBe(original.length + 1);
  expect(new Set(duplicated.plantingAreas[0].placements!.map((p) => p.id)).size).toBe(original.length + 1);
});

test("single soil plants move and remain attached to their row", () => {
  const base: PlannerPlan = { ...empty, rows: [{ id: "single", crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x1: 400, y1: 400, x2: 400, y2: 400, count: 1, placements: [{ id: "p", x: 0, y: 0 }] }] };
  const moved = movePlanSelection(base, { kind: "row", id: "single", plantId: "p" }, { x: 25, y: 30 });
  expect(rowPlants(moved.rows[0])).toEqual([{ id: "p", x: 425, y: 430 }]);
  const translated = movePlanSelection(moved, { kind: "row", id: "single" }, { x: 10, y: 10 });
  expect(rowPlants(translated.rows[0])).toEqual([{ id: "p", x: 435, y: 440 }]);
  expect(deletePlanSelection(moved, { kind: "row", id: "single", plantId: "p" }).rows).toEqual([]);
});

test("placement validation preserves old payloads and rejects corrupt overrides", () => {
  expect(() => validateEditorPlan({ ...empty, beds: [{ id: 12, name: "Legacy south bed", x: 2, y: 99, w: 91, h: 5 }] })).not.toThrow();
  expect(() => validateEditorPlan({ ...empty, rows: [{ id: "outside", crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x1: 400, y1: 1100, x2: 400, y2: 1100, count: 1 }] })).toThrow();
  expect(parsePlantPlacements(undefined, true)).toBeUndefined();
  expect(parsePlantPlacements([{ id: "one", x: 50, y: 50 }], true)).toEqual([{ id: "one", x: 50, y: 50 }]);
  expect(() => parsePlantPlacements([{ id: "one", x: 101, y: 50 }], true)).toThrow();
  expect(() => parsePlantPlacements([{ id: "one", x: 1, y: 1 }, { id: "one", x: 2, y: 2 }], true)).toThrow();
});

test("3D design session saves, refreshes, and mirrors in 2D", async ({ context, page }, testInfo) => {
  test.setTimeout(120_000);
  let saved = structuredClone(empty);
  let writes = 0;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("**/api/**", (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/api/garden") {
      if (request.method() === "PUT") { saved = request.postDataJSON().plan; writes += 1; }
      return route.fulfill({ json: { ok: true, plan: saved } });
    }
    return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [] } });
  });
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Top", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  const click = async (x = .5, y = .5) => {
    const target = { x: box.x + box.width * x, y: box.y + box.height * y };
    if (testInfo.project.name === "phone") await page.touchscreen.tap(target.x, target.y);
    else await page.mouse.click(target.x, target.y);
  };
  await page.getByRole("button", { name: "Add bed", exact: true }).click();
  await click();
  await expect.poll(async () => (await plan(page)).beds.length).toBe(1);
  await page.getByRole("button", { name: "Add plant", exact: true }).click();
  await click();
  await expect.poll(async () => (await plan(page)).plantingAreas.length).toBe(1);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await click();
  await expect(page.locator(".garden-edit-inspector")).toBeVisible();
  // Select the plant from above; the live-plan assertion proves logical selection.
  const inspector = page.locator(".garden-edit-inspector");
  await expect(inspector).toContainText("Individual plant");
  {
    const x = inspector.getByLabel("X (cm)");
    const previous = Number(await x.inputValue());
    await x.fill(String(previous + 10)); await x.press("Enter");
    await page.getByRole("button", { name: "Duplicate", exact: true }).click();
    await expect.poll(async () => (await plan(page)).plantingAreas[0].count).toBe(2);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect.poll(async () => (await plan(page)).plantingAreas[0].count).toBe(1);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect.poll(async () => (await plan(page)).plantingAreas[0].count).toBe(2);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect.poll(async () => (await plan(page)).plantingAreas[0].count).toBe(1);
  }
  await page.getByRole("button", { name: "Add tree", exact: true }).click();
  await click(.65, .6);
  await expect.poll(async () => (await plan(page)).objects.filter((o) => o.type === "tree").length).toBe(1);
  await page.getByRole("button", { name: "Add path", exact: true }).click();
  await click(.35, .58); await click(.35, .66);
  await expect.poll(async () => (await plan(page)).objects.filter((o) => o.type === "path").length).toBe(1);
  await page.getByRole("button", { name: "Add trellis", exact: true }).click();
  await click(.55, .6); await click(.65, .6);
  await expect.poll(async () => (await plan(page)).objects.filter((o) => o.type === "trellis").length).toBe(1);
  await page.getByRole("button", { name: "Edit key", exact: true }).click();
  await page.getByLabel("Garden edit key", { exact: true }).fill("test-key");
  await page.getByRole("button", { name: "Set key", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved to cloud");
  expect(writes).toBe(1);
  const beforeRefresh = await plan(page);
  await page.reload(); await expect(canvas).toBeVisible();
  expect(await plan(page)).toEqual(beforeRefresh);
  const planner = await context.newPage(); await planner.goto("/");
  await expect(planner.locator(".gv-app")).toBeVisible();
  await expect(planner.locator(".plan-bed")).toHaveCount(1);
  await expect(planner.locator(".planting-area")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("3d-editor.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});


test("inline 3D keyboard history and save stay within the active editor", async ({ context, page }) => {
  const fixture: PlannerPlan = { ...empty, beds: [{ id: 1, name: "Keyboard bed", x: 35, y: 35, w: 30, h: 30 }] };
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Test garden", year: 2026 }], beds: [], items: [] } }));
  await page.addInitScript((plan) => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)), fixture);
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByRole("button", { name: "Detailed 3D", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Top", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const inspector = page.locator(".garden-edit-inspector");
  await expect(inspector).toContainText("Keyboard bed");
  await inspector.getByLabel("Name", { exact: true }).fill("Renamed in 3D");
  await inspector.getByLabel("Name", { exact: true }).press("Tab");
  await expect.poll(async () => (await plan(page)).beds[0].name).toBe("Renamed in 3D");
  await inspector.locator("summary").click();
  await page.keyboard.press("Control+z");
  await expect.poll(async () => (await plan(page)).beds[0].name).toBe("Keyboard bed");
  await page.keyboard.press("Control+y");
  await expect.poll(async () => (await plan(page)).beds[0].name).toBe("Renamed in 3D");
  await page.keyboard.press("Control+s");
  await expect(page.locator(".garden-edit-status")).toContainText("Local only");
});
