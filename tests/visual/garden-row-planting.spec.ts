import { expect, test, type Page } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { plantingSurfaces, surfaceWorld, surfaceLocal, surfaceContains } from "../../lib/garden/planting-surfaces";
import { areaPlants, rowPlants } from "../../lib/garden/plan-editing";
import { addCropPoints, bedRowPlacementPoints, cropPlacementPoints } from "../../lib/garden/garden-building";
import { validateDesignChange } from "../../lib/garden/garden-design";
import { editorAction } from "./helpers/editor-controls";

const fixture: PlannerPlan = { beds: [{ id: 31, name: "Tomato strip", x: 5, y: 5, w: 90, h: 6.5 }], plantingAreas: [], rows: [], objects: [{ id: "support", type: "trellis", x1: 45, y1: 45, x2: 855, y2: 45, heightCm: 180, postSpacingCm: 150, label: "Tomato support" }] };
const read = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));

test("centred tomato rows fit narrow and rotated beds while preserving spacing, locks and ownership", () => {
  const rotated: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [{ id: "rotated", type: "structure", kind: "raised-bed-timber", x: 450, y: 400, widthCm: 720, depthCm: 60, heightCm: 50, rotationDeg: 22, label: "Rotated strip" }] };
  for (const plan of [fixture, rotated]) {
    const soil = plantingSurfaces(plan)[0], owner = `${soil.kind}:${soil.id}`;
    const points = bedRowPlacementPoints(plan, "Tomato", soil, 50);
    expect(points.length).toBeGreaterThan(10);
    expect(points.every(p => surfaceContains(soil, p, 6))).toBeTruthy();
    expect(points.every(p => Math.abs(surfaceLocal(soil, p).y) < .001)).toBeTruthy();
    expect((points[0].x + points[points.length - 1].x) / 2).toBeCloseTo(soil.x);
    expect((points[0].y + points[points.length - 1].y) / 2).toBeCloseTo(soil.y);
    for (let i = 1; i < points.length; i++) expect(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)).toBeCloseTo(50);
    expect(bedRowPlacementPoints(plan, "Tomato", soil, 50, true)).toHaveLength(1);
    const next = validateDesignChange(plan, addCropPoints(plan, "Tomato", "Roma", points, owner, 50));
    expect(next.rows.every(r => r.surfaceId === owner)).toBeTruthy();
    expect(next.plantingAreas.every(a => String(a.bedId) === soil.id)).toBeTruthy();
    expect(bedRowPlacementPoints(next, "Tomato", soil, 50)).toEqual([]);
    expect(bedRowPlacementPoints({ ...plan, objectLocks: [owner] }, "Tomato", soil, 50)).toEqual([]);
    const edge = soil.depth / 2 - 2;
    expect(cropPlacementPoints(plan, "Tomato", surfaceWorld(soil, { x: 250, y: edge }), surfaceWorld(soil, { x: -250, y: edge }), "row", owner, 50)).toEqual([]);
  }
});

test("a tomato row plants by two taps on narrow bed soil with Any soil selected", async ({ page, context }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await context.route("**/api/**", r => r.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [] } }));
  await context.addInitScript(p => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(p)), fixture);
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-plant-count", "0");
  await page.locator(".garden-bed-access > summary").click();
  await page.getByLabel("Go to bed", { exact: true }).selectOption("bed:31");
  await page.locator(".garden-bed-access > summary").click();
  await page.getByRole("button", { name: "Deselect", exact: true }).click();
  await editorAction(page, "Add row");
  const palette = page.locator(".garden-edit-palette");
  await palette.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Tomato");
  await palette.getByLabel("Plant spacing (cm)").fill("50"); await palette.getByLabel("Plant spacing (cm)").press("Enter");
  await expect(palette.getByLabel("Planting target")).toHaveValue("");
  await palette.locator(":scope > summary").click();
  await expect.poll(async () => { const s = JSON.parse((await canvas.getAttribute("data-camera"))!), b = (await canvas.boundingBox())!; return Math.abs(s.projection[5] / s.projection[0] - b.width / b.height); }).toBeLessThan(.005);
  const soil = plantingSurfaces(fixture)[0];
  const tap = async (x: number, y: number) => {
    const s = JSON.parse((await canvas.getAttribute("data-camera"))!), c = new THREE.PerspectiveCamera(); c.matrixWorld.fromArray(s.world); c.matrixWorldInverse.copy(c.matrixWorld).invert(); c.projectionMatrix.fromArray(s.projection);
    const p = surfaceWorld(soil, { x, y }), q = new THREE.Vector3(p.x / 100 - 4.5, soil.height, p.y / 100 - 5.4).project(c), b = (await canvas.boundingBox())!, screen = { x: b.x + (q.x + 1) * b.width / 2, y: b.y + (1 - q.y) * b.height / 2 };
    expect(await page.evaluate(p => document.elementFromPoint(p.x, p.y)?.tagName, screen)).toBe("CANVAS");
    if (info.project.name === "phone") await page.touchscreen.tap(screen.x, screen.y); else await page.mouse.click(screen.x, screen.y);
  };
  await page.screenshot({ path: info.outputPath("before-row.png") });
  await tap(-250, 0); expect(await read(page)).toEqual(fixture);
  await expect(page.locator(".garden-edit-status")).toContainText("Row start set");
  await tap(250, 0);
  await expect.poll(async () => (await read(page)).plantingAreas.reduce((n, a) => n + a.count, 0)).toBe(11);
  const planted = await read(page); expect(planted.plantingAreas.every(a => a.bedId === 31)).toBeTruthy();
  expect(planted.objects).toEqual(fixture.objects);
  expect(planted.plantingAreas.flatMap(a => areaPlants(planted, a)).every(p => Math.abs(p.y - soil.y) < 1)).toBeTruthy();
  await page.screenshot({ path: info.outputPath("tomato-row.png") });
  await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await read(page)).toEqual(fixture);
  const edge = soil.depth / 2 - 2;
  await tap(-250, edge); await tap(250, edge);
  await expect(page.locator(".garden-edit-status")).toContainText("No room along this row");
  expect(await read(page)).toEqual(fixture);
  await palette.locator(":scope > summary").click();
  await palette.getByLabel("Planting target").selectOption("bed:31");
  await expect(page.getByRole("button", { name: "Preview row · 16 plants", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("selected narrow bed previews a tomato row, applies once and undoes without changing the bed", async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await context.route("**/api/**", r => r.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [] } }));
  await context.addInitScript(p => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(p)), fixture);
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'); await expect(canvas).toHaveAttribute("data-plant-count", "0");
  await page.locator(".garden-bed-access > summary").click(); await page.getByLabel("Go to bed", { exact: true }).selectOption("bed:31"); await page.locator(".garden-bed-access > summary").click();
  await editorAction(page, "Add row");
  await expect(page.getByLabel("Planting bed", { exact: true })).toHaveValue("bed:31");
  await page.getByLabel("Bed spacing (cm)").fill("50");
  await page.getByLabel("Row direction", { exact: true }).selectOption("across"); await expect(page.getByRole("button", { name: "Preview row · 1 plants", exact: true })).toBeEnabled();
  await page.getByLabel("Row direction", { exact: true }).selectOption("along");
  await page.getByRole("button", { name: "Preview row · 16 plants", exact: true }).click();
  await expect(page.getByRole("region", { name: "Garden preview" })).toContainText("16 Tomato in one row"); expect(await read(page)).toEqual(fixture);
  await expect(canvas).toHaveAttribute("data-tomato-model", "refined", { timeout: 60_000 });
  await expect.poll(async () => {
    const state = JSON.parse((await canvas.getAttribute("data-camera"))!), camera = new THREE.PerspectiveCamera(); camera.matrixWorld.fromArray(state.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(state.projection);
    const soil = plantingSurfaces(fixture)[0]; return Math.max(...[-1, 1].map(side => { const p = surfaceWorld(soil, { x: side * soil.width / 2, y: 0 }); return Math.abs(new THREE.Vector3(p.x / 100 - 4.5, soil.height, p.y / 100 - 5.4).project(camera).x); }));
  }).toBeLessThan(.95);
  await page.screenshot({ path: info.outputPath("centred-row-preview.png") });
  await page.getByRole("button", { name: "Cancel preview", exact: true }).click(); expect(await read(page)).toEqual(fixture);
  await page.getByRole("button", { name: "Preview row · 16 plants", exact: true }).click(); await page.getByRole("button", { name: "Apply preview", exact: true }).click();
  const planted = await read(page), soil = plantingSurfaces(planted)[0], positions = planted.plantingAreas.flatMap(a => areaPlants(planted, a));
  expect(positions).toHaveLength(16); expect(positions.every(p => surfaceContains(soil, p, 6))).toBeTruthy(); expect(planted.beds).toEqual(fixture.beds); expect(planted.objects).toEqual(fixture.objects); expect(planted.rows.flatMap(rowPlants)).toEqual([]);
  await page.getByRole("button", { name: "Done planting", exact: true }).click(); await page.screenshot({ path: info.outputPath("centred-row-applied.png") });
  await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await read(page)).toEqual(fixture);
  await page.getByRole("button", { name: "Redo", exact: true }).click(); expect(await read(page)).toEqual(planted);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0); expect(errors).toEqual([]);
});
