import { expect, test } from "@playwright/test";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { areaPlants, movePlanSelection, rowPlants } from "../../lib/garden/plan-editing";
import { clearSurfacePlants, generateSeasonalBedLayout, applySeasonalBedLayout } from "../../lib/garden/seasonal-bed-layout";
import { plantingSurfaces, surfaceAt } from "../../lib/garden/planting-surfaces";

const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Spring bed", x: 340 / 9, y: 410 / 10.8, w: 200 / 9, h: 260 / 10.8 }, { id: 2, name: "Keep bed", x: 100 / 9, y: 200 / 10.8, w: 120 / 9, h: 160 / 10.8 }],
  plantingAreas: [1, 2].map((id) => ({ id: `existing-${id}`, bedId: id, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 1, pattern: "single", iconSize: 16, visualSpacing: "normal", placements: [{ id: `tomato-${id}`, x: 50, y: 50 }] })),
  rows: [], objects: [],
};

test("replace clears only the selected soil and moving a bed plant into a container keeps its identity", () => {
  const surface = plantingSurfaces(fixture).find((item) => item.id === "1")!;
  const cleared = clearSurfacePlants(fixture, surface);
  expect(cleared.plantingAreas).toEqual([fixture.plantingAreas[1]]);
  const filled = applySeasonalBedLayout(cleared, generateSeasonalBedLayout(cleared, surface, 9));
  expect(filled.plantingAreas[0]).toEqual(fixture.plantingAreas[1]);
  expect(filled.plantingAreas.some((area) => area.bedId === 1 && area.crop === "Tomato")).toBe(false);
  const containerPlan: PlannerPlan = { ...fixture, objects: [{ id: "container", type: "structure", kind: "planter-box", x: 650, y: 650, widthCm: 150, depthCm: 100, heightCm: 50, rotationDeg: 0 }] };
  const point = areaPlants(containerPlan, containerPlan.plantingAreas[0])[0];
  const moved = movePlanSelection(containerPlan, { kind: "area", id: "existing-1", plantId: point.id }, { x: 650 - point.x, y: 650 - point.y });
  expect(moved.plantingAreas).toEqual([fixture.plantingAreas[1]]);
  expect(rowPlants(moved.rows[0])).toEqual([{ id: point.id, x: 650, y: 650 }]);
  expect(surfaceAt(moved, rowPlants(moved.rows[0])[0])?.id).toBe("container");
  expect(() => movePlanSelection(moved, { kind: "row", id: moved.rows[0].id, plantId: point.id }, { x: 75, y: 0 })).toThrow(/onto soil/);
});

test("occupied bed can preview a seasonal replacement and undo without changing another bed", async ({ context, page }, info) => {
  test.setTimeout(90_000);
  let writes = 0;
  await context.route("**/api/**", (route) => {
    if (route.request().method() !== "GET") writes++;
    return route.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [], beds: [], notes: [], harvests: [] } });
  });
  await page.goto("/3d?view=3d");
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
  await page.getByRole("button", { name: "Plant a bed", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Plant a bed", exact: true });
  await dialog.getByRole("combobox", { name: "Planting bed", exact: true }).selectOption("bed:1");
  await dialog.getByRole("combobox", { name: "Planting month", exact: true }).selectOption("9");
  await dialog.getByRole("checkbox", { name: "Replace this bed’s plants" }).check();
  await expect(dialog).toContainText("1 existing plant will be replaced in Spring bed");
  await page.screenshot({ path: info.outputPath("replace-selected-bed-preview.png"), fullPage: true });
  await dialog.getByRole("button", { name: "Replace with seasonal layout" }).click();
  const read = (): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));
  const changed = await read();
  expect(changed.plantingAreas.find((area) => area.bedId === 2)).toEqual(fixture.plantingAreas[1]);
  expect(changed.plantingAreas.some((area) => area.bedId === 1 && area.crop === "Tomato")).toBe(false);
  expect(changed.plantingAreas.filter((area) => area.bedId === 1).reduce((n, area) => n + area.count, 0)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await read()).toEqual(fixture);
  expect(writes).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
