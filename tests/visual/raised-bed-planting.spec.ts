import { expect, test, type Page } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan, PlannerStructure } from "../../lib/garden/planner-plan";
import { areaPlants, movePlanSelection, rowPlants, transformContainerPlants, deletePlanSelection, validateEditorPlan } from "../../lib/garden/plan-editing";
import { plantingSurfaces, surfaceAt, surfaceContains, surfaceLocal, surfaceWorld, structureSurface, plantingPointBlocked } from "../../lib/garden/planting-surfaces";
import { applySeasonalBedLayout, blenheimMonth, blenheimSeason, generateSeasonalBedLayout } from "../../lib/garden/seasonal-bed-layout";
import { addStructure3D } from "../../components/garden-structure-3d";
import { addRow } from "../../components/garden-object-renderers";

const liveKey = "blenheim-garden-live-plan";
const container: PlannerStructure = { id: "raised", type: "structure", kind: "raised-bed-timber", label: "Rotated raised bed", x: 480, y: 540, widthCm: 240, depthCm: 160, heightCm: 60, rotationDeg: 30 };
const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Other bed", x: 120 / 9, y: 160 / 10.8, w: 160 / 9, h: 220 / 10.8 }],
  plantingAreas: [{ id: "keep", bedId: 1, crop: "Carrot", cropIcon: "C", variety: "Nantes", spacingCm: 7, x: 0, y: 0, w: 100, h: 100, pattern: "single", count: 1, iconSize: 16, visualSpacing: "normal", placements: [{ id: "existing-carrot", x: 50, y: 50 }] }],
  rows: [], objects: [container],
};
const readPlan = (page: Page): Promise<PlannerPlan> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), liveKey);

test("seasonal layouts respect NZ date, soil shape, occupied positions and stale previews", () => {
  expect(blenheimMonth(new Date("2026-09-30T11:30:00Z"))).toBe(9);
  expect(blenheimSeason(9)).toBe("Spring");
  expect(blenheimSeason(0)).toBe("Summer");
  for (const kind of ["raised-bed-timber", "raised-bed-round", "keyhole-bed", "half-barrel"] as const) {
    const plan = { ...fixture, objects: [{ ...container, kind }] };
    const surface = plantingSurfaces(plan).find((item) => item.kind === "object")!;
    const preview = generateSeasonalBedLayout(plan, surface, 9);
    expect(preview.positions.length).toBeGreaterThan(0);
    expect(preview.positions.every((point) => surfaceContains(surface, point, point.spacing / 2))).toBe(true);
    expect(preview.positions.some((point) => ["Tomato", "Basil"].includes(point.crop))).toBe(false);
    for (const point of preview.positions) for (const other of preview.positions) {
      if (point !== other) expect(Math.hypot(point.x - other.x, point.y - other.y) + .01).toBeGreaterThanOrEqual((point.spacing + other.spacing) / 2);
    }
    const applied = applySeasonalBedLayout(plan, preview);
    validateEditorPlan(applied);
    expect(applied.plantingAreas).toEqual(fixture.plantingAreas);
    expect(applied.objects).toEqual(plan.objects);
    expect(() => applySeasonalBedLayout(applied, preview)).toThrow(/fresh layout/);
    const again = generateSeasonalBedLayout(applied, surface, 9);
    expect(again.positions).toHaveLength(0);
    expect(applied.rows.flatMap(rowPlants)).toHaveLength(preview.positions.length);
  }
  const bedSurface = plantingSurfaces(fixture).find((item) => item.kind === "bed")!;
  const preview = generateSeasonalBedLayout(fixture, bedSurface, 9, "Carrot");
  const applied = applySeasonalBedLayout(fixture, preview);
  expect(applied.plantingAreas[0]).toEqual(fixture.plantingAreas[0]);
  const points = applied.plantingAreas.flatMap((area) => areaPlants(applied, area));
  expect(points.some((point) => point.id === "existing-carrot")).toBe(true);
  expect(points).toHaveLength(preview.positions.length + 1);
});

test("plant roots match rendered soil and survive container transforms and JSON persistence", () => {
  const plan = applySeasonalBedLayout(fixture, generateSeasonalBedLayout(fixture, structureSurface(container), 9));
  const scene = new THREE.Group();
  addStructure3D(scene, container, true);
  scene.updateMatrixWorld(true);
  // Match the top of the box soil independently of the surface helper.
  const soil = scene.children[0].children.find((node) => node instanceof THREE.Mesh && node.geometry instanceof THREE.BoxGeometry && node.geometry.parameters.height === .05)!;
  expect(new THREE.Box3().setFromObject(soil).max.y).toBeCloseTo(structureSurface(container).height, 8);
  const plants = new THREE.Group(); addRow(plants, plan.rows[0], false, plan);
  expect(plants.children[0].children.every((plant) => Math.abs(plant.position.y - structureSurface(container).height) < 1e-8)).toBe(true);
  const moved = movePlanSelection(plan, { kind: "object", id: container.id }, { x: 40, y: 30 });
  const replacement = { ...container, x: 520, y: 570, widthCm: 260, depthCm: 180, rotationDeg: 75, heightCm: 70 };
  const resized = transformContainerPlants(moved, { ...moved, objects: [replacement] }, moved.objects[0] as PlannerStructure, replacement);
  validateEditorPlan(resized);
  const saved = JSON.parse(JSON.stringify(resized)) as PlannerPlan;
  expect(saved.rows.flatMap(rowPlants).every((point) => surfaceAt(saved, point)?.id === container.id)).toBe(true);
  const originalPoint = plan.rows.flatMap(rowPlants)[0], after = saved.rows.flatMap(rowPlants)[0];
  const localBefore = surfaceLocal(structureSurface(container), originalPoint), localAfter = surfaceLocal(structureSurface(replacement), after);
  expect(localAfter.x / structureSurface(replacement).width).toBeCloseTo(localBefore.x / structureSurface(container).width, 8);
  expect(localAfter.y / structureSurface(replacement).depth).toBeCloseTo(localBefore.y / structureSurface(container).depth, 8);
  expect(() => deletePlanSelection(saved, { kind: "object", id: container.id })).toThrow(/Remove the container/);
  const round = { ...fixture, objects: [{ ...container, kind: "raised-bed-round" as const, rotationDeg: 0 }] };
  expect(plantingPointBlocked(round, { x: container.x + 70, y: container.y + 70 })).toBe(true);
  expect(plantingPointBlocked(round, { x: container.x, y: container.y })).toBe(false);
  const bench = { ...fixture, objects: [{ ...container, kind: "potting-bench" as const }] };
  expect(plantingPointBlocked(bench, container)).toBe(true);
});

test("raised-bed planting, seasonal preview, transforms, undo and protected Save", async ({ context, page }, testInfo) => {
  test.setTimeout(120_000);
  let saved = structuredClone(fixture), writes = 0;
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname === "/api/garden") {
      if (route.request().method() === "PUT") {
        expect(route.request().headers().authorization).toBe("Bearer test-key");
        saved = route.request().postDataJSON().plan; writes++;
      }
      return route.fulfill({ json: { ok: true, plan: saved } });
    }
    return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [] } });
  });
  await page.clock.setFixedTime(new Date("2026-10-11T00:00:00Z"));
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.getByRole("button", { name: "Plant a bed", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Plant a bed", exact: true });
  await dialog.getByRole("combobox", { name: "Planting bed", exact: true }).selectOption("object:raised");
  await expect(dialog.getByRole("combobox", { name: "Planting month", exact: true })).toHaveValue("9");
  await expect(dialog).toContainText("Spring in Blenheim");
  await dialog.getByRole("button", { name: "Plant manually" }).click();
  const palette = page.locator(".garden-edit-palette");
  await palette.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Lettuce");
  // Collapse panels to expose the complete planting surface on a small screen.
  await palette.locator("summary").click();
  await page.locator(".garden-edit-inspector summary").click();
  const bounds = (await canvas.boundingBox())!;
  const camera = new THREE.PerspectiveCamera(testInfo.project.name === "phone" ? 42 : 34, bounds.width / bounds.height, .1, 60);
  camera.position.set(0, 16.2, .001); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const point = surfaceWorld(structureSurface(container), { x: 0, y: 0 });
  const projected = new THREE.Vector3(point.x / 100 - 4.5, structureSurface(container).height, point.y / 100 - 5.4).project(camera);
  const screen = { x: bounds.x + (projected.x + 1) * bounds.width / 2, y: bounds.y + (1 - projected.y) * bounds.height / 2 };
  if (testInfo.project.name === "phone") await page.touchscreen.tap(screen.x, screen.y); else await page.mouse.click(screen.x, screen.y);
  await expect.poll(async () => (await readPlan(page)).rows.length).toBe(1);
  const manual = await readPlan(page);
  expect(surfaceAt(manual, rowPlants(manual.rows[0])[0])?.id).toBe(container.id);
  expect(manual.plantingAreas).toEqual(fixture.plantingAreas);
  await page.getByRole("button", { name: "Plant a bed", exact: true }).click();
  await expect(dialog.getByRole("combobox", { name: "Planting bed", exact: true })).toHaveValue("object:raised");
  await expect(dialog).toContainText("1 existing plant kept");
  const applyBounds = (await dialog.getByRole("button", { name: "Apply seasonal layout" }).boundingBox())!;
  expect(applyBounds.y + applyBounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: testInfo.outputPath("seasonal-bed-preview.png"), fullPage: true });
  await expect(dialog.getByRole("button", { name: "Apply seasonal layout" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Apply seasonal layout" }).click();
  const filled = await readPlan(page);
  expect(filled.rows.flatMap(rowPlants).length).toBeGreaterThan(1);
  expect(filled.rows[0]).toEqual(manual.rows[0]);
  expect(filled.plantingAreas).toEqual(fixture.plantingAreas);
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await readPlan(page)).toEqual(manual);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  expect(await readPlan(page)).toEqual(filled);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const inspector = page.locator(".garden-edit-inspector");
  await inspector.locator("summary").click();
  await inspector.getByLabel("Rotation (degrees)").fill("60"); await inspector.getByLabel("Rotation (degrees)").press("Enter");
  await inspector.getByLabel("Height (cm)").fill("70"); await inspector.getByLabel("Height (cm)").press("Enter");
  const transformed = await readPlan(page);
  expect(transformed.objects[0]).toMatchObject({ rotationDeg: 60, heightCm: 70 });
  expect(transformed.rows.flatMap(rowPlants).every((point) => surfaceAt(transformed, point)?.id === container.id)).toBe(true);
  await inspector.getByRole("button", { name: "Delete selected" }).click();
  await expect(page.getByRole("status")).toContainText("Remove the container's plants");
  await page.getByRole("button", { name: "Edit key", exact: true }).click();
  await page.getByLabel("Garden edit key", { exact: true }).fill("test-key");
  await page.getByRole("button", { name: "Set key", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved to cloud"); expect(writes).toBe(1);
  await page.reload(); await expect(canvas).toBeVisible();
  expect(await readPlan(page)).toEqual(transformed);
  await page.screenshot({ path: testInfo.outputPath("raised-bed-plants-3d.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
