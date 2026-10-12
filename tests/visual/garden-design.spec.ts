import { expect, test, type Page, type TestInfo } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { accessIssues, alignMove, blenheimSun, designFootprints, duplicateDesignGroup, overlapArea, placementClearances, resizeDesignSelection, rotateDesignSelection, selectPlanCrops, shadowFootprints, validateDesignChange } from "../../lib/garden/garden-design";
import { captureLayout, layoutsKey, parseSavedLayouts } from "../../lib/garden/garden-design-layouts";
import { areaPlants, movePlanSelection, rowPlants } from "../../lib/garden/plan-editing";

const fixture: PlannerPlan = { beds: [
  { id: 1, name: "Veg bed", x: 100 / 9, y: 300 / 10.8, w: 150 / 9, h: 160 / 10.8 },
  { id: 2, name: "Fruit bed", x: 400 / 9, y: 300 / 10.8, w: 150 / 9, h: 160 / 10.8 },
], plantingAreas: [
  { id: "tomato", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, count: 2, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "t1", x: 25, y: 25 }, { id: "t2", x: 75, y: 25 }] },
  { id: "fruit", bedId: 2, crop: "Strawberry", cropIcon: "S", variety: "Albion", spacingCm: 35, count: 1, x: 0, y: 0, w: 100, h: 100, pattern: "single", iconSize: 16, visualSpacing: "normal" },
], rows: [{ id: "raised-crop", surfaceId: "object:raised", crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 28, count: 1, x1: 650, y1: 700, x2: 650, y2: 700, placements: [{ id: "r1", x: -25, y: 0 }] }], objects: [
  { id: "raised", type: "structure", kind: "raised-bed-timber", label: "Raised bed", x: 650, y: 700, widthCm: 150, depthCm: 100, heightCm: 45, rotationDeg: 0 },
  { id: "walk", type: "path", label: "Walkway", x1: 300, y1: 170, x2: 300, y2: 750, widthCm: 60 },
], designSettings: { northDeg: 0, walkwayCm: 60 } };
const readPlan = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));

test("smart alignment, collision checks, anchored resizing and ownership remain measured", () => {
  const selected = { kind: "bed" as const, id: "1" };
  expect(() => validateDesignChange(fixture, movePlanSelection(fixture, selected, { x: 100, y: 0 }))).toThrow(/Walkway/);
  expect(() => validateDesignChange(fixture, movePlanSelection(fixture, selected, { x: -120, y: 0 }))).toThrow(/inside|outside/);
  const aligned = alignMove(fixture, selected, { x: 17, y: 0 }, true);
  expect(aligned.delta.x).toBeCloseTo(20);
  expect(aligned.guides.length).toBeGreaterThan(0);
  expect(alignMove(fixture, selected, { x: 17, y: 0 }, false).delta.x).toBe(17);
  expect(placementClearances(fixture, selected)?.right).toBeCloseTo(20);
  const copies = duplicateDesignGroup(fixture, [selected, { kind: "area", id: "tomato" }]);
  expect(copies.beds).toHaveLength(3); expect(copies.plantingAreas).toHaveLength(3);
  expect(() => validateDesignChange(fixture, copies)).not.toThrow();
  const resized = resizeDesignSelection(fixture, selected, "nw", { x: 100, y: 300 }, { x: 80, y: 280 }, true);
  expect(resized.beds[0].x * 9).toBeCloseTo(80); expect(resized.beds[0].w * 9).toBeCloseTo(170);
  expect(resized.plantingAreas[0].placements).toEqual(fixture.plantingAreas[0].placements);
  const turnedBed = rotateDesignSelection(fixture, selected, 90);
  expect(turnedBed.beds[0].w * 9).toBeCloseTo(160);
  expect(turnedBed.beds[0].h * 10.8).toBeCloseTo(150);
  expect(turnedBed.plantingAreas[0].count).toBe(2);
  const turnedPoint = areaPlants(turnedBed, turnedBed.plantingAreas[0])[0];
  expect(turnedPoint.id).toBe("t1"); expect(turnedPoint.x).toBeCloseTo(215, 8); expect(turnedPoint.y).toBeCloseTo(342.5, 8);
  const rotated = rotateDesignSelection(fixture, { kind: "object", id: "raised" }, 90);
  expect(rowPlants(rotated.rows[0])[0]).toMatchObject({ id: "r1", x: 650, y: 675 });
  expect(selectPlanCrops(fixture, true)).toHaveLength(2);
  const f = designFootprints(fixture)[0]; expect(overlapArea(f, f)).toBeCloseTo(150 * 160);
  const blocked = { ...fixture, beds: [...fixture.beds, { id: 3, name: "Legacy overlap", x: 110 / 9, y: 310 / 10.8, w: 150 / 9, h: 160 / 10.8 }] };
  expect(() => validateDesignChange(blocked, movePlanSelection(blocked, selected, { x: -20, y: 0 }))).not.toThrow();
});

test("NZ sunlight, access warnings and layout alternatives handle seasons and isolation", () => {
  const summer = blenheimSun("2026-12-21", 13), winter = blenheimSun("2026-06-21", 12);
  expect(summer.zone).toBe(13); expect(winter.zone).toBe(12);
  expect(summer.altitude).toBeGreaterThan(65); expect(winter.altitude).toBeLessThan(30);
  const turned = blenheimSun("2026-12-21", 13, 90);
  expect(turned.x).toBeCloseTo(-summer.y); expect(turned.y).toBeCloseTo(summer.x);
  expect(shadowFootprints(fixture, "2026-12-21", 1)).toHaveLength(0);
  expect(shadowFootprints(fixture, "2026-12-21", 13).length).toBeGreaterThan(0);
  expect(accessIssues(fixture).some((i) => /reach/i.test(i.message))).toBe(true);
  const blockedEntrance = { ...fixture, objects: [...fixture.objects, { id: "door", type: "text" as const, x: 650, y: 700, text: "Entrance", fontSize: 12 }] };
  expect(accessIssues(blockedEntrance).some((i) => /restricts access to Entrance/.test(i.message))).toBe(true);
  const source = structuredClone(fixture), layouts = captureLayout([], "Layout A", source); source.beds[0].name = "Changed after saving";
  expect(parseSavedLayouts(JSON.stringify(layouts))[0].plan).toEqual(fixture);
  expect(layoutsKey("one")).not.toBe(layoutsKey("two"));
  expect(() => parseSavedLayouts("[]".repeat(20))).toThrow();
  expect(areaPlants(fixture, fixture.plantingAreas[0])).toHaveLength(2);
});

async function drag(page: Page, info: TestInfo, a: { x: number; y: number }, b: { x: number; y: number }) {
  if (info.project.name === "phone") {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] });
    for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: a.x + (b.x - a.x) * i / 8, y: a.y + (b.y - a.y) * i / 8, id: 1 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await session.detach();
  } else { await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up(); }
}
async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const diagnostics: string[] = []; errors.set(page, diagnostics); page.on("pageerror", (e) => diagnostics.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") diagnostics.push(m.text()); });
  let saved = structuredClone(fixture);
  await context.route("**/api/**", (route) => { if (new URL(route.request().url()).pathname === "/api/garden") { if (route.request().method() === "PUT") saved = route.request().postDataJSON().plan; return route.fulfill({ json: { ok: true, plan: saved } }); } return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test", year: 2026 }], beds: [], items: [], notes: [], harvests: [] } }); });
  await page.addInitScript((plan) => { sessionStorage.setItem("blenheim-garden-edit-key", "fixture-only"); if (!localStorage.getItem("blenheim-garden-live-plan")) localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)); }, fixture);
  await page.goto("/3d?view=3d"); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("direct handles resize, block collisions, and keep owned plants through rotation", async ({ page }, info) => {
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'), rect = (await canvas.boundingBox())!;
  await expect(canvas).toHaveAttribute("data-camera", /projection/);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-camera"))!).world[13]).not.toBe(16.2);
  const state = JSON.parse((await canvas.getAttribute("data-camera"))!);
  const camera = new THREE.PerspectiveCamera(); camera.matrixWorld.fromArray(state.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(state.projection);
  const screen = (x: number, y: number, height = .34) => { const p = new THREE.Vector3(x / 100 - 4.5, height, y / 100 - 5.4).project(camera); return { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 }; };
  await page.mouse.click(screen(102, 435).x, screen(102, 435).y);
  await expect(page.locator(".garden-edit-inspector")).toContainText("Veg bed");
  await expect(canvas).toHaveAttribute("data-resize-handles", "8");
  const handle = async (edge: string) => { const list = JSON.parse(await canvas.getAttribute("data-gizmo-points") || "[]") as { mode: string; edge?: string; x: number; y: number }[]; const p = list.find((p) => p.edge === edge)!; return { x: rect.x + p.x, y: rect.y + p.y }; };
  let a = await handle("se"), b = screen(300, 500, .44);
  await drag(page, info, a, b);
  await expect(page.locator(".garden-edit-status")).toContainText("Walkway");
  expect((await readPlan(page)).beds[0]).toEqual(fixture.beds[0]);
  a = await handle("w"); b = screen(80, 380, .44); await drag(page, info, a, b);
  await expect.poll(async () => (await readPlan(page)).beds[0].w * 9).toBeGreaterThan(150);
  expect((await readPlan(page)).plantingAreas[0].count).toBe(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByText("Build options", { exact: true }).click();
  await page.getByText("Select several objects", { exact: true }).click();
  await page.getByLabel("Raised bed", { exact: true }).check();
  await page.getByText("Build options", { exact: true }).click();
  const radius = Math.hypot(150, 100) / 2 + 30;
  await drag(page, info, screen(650, 700 - radius - 3, .56), screen(650 + radius + 3, 700, .56));
  await expect.poll(async () => { const o = (await readPlan(page)).objects.find((o) => o.id === "raised"); return o && "rotationDeg" in o ? o.rotationDeg : 0; }).toBeGreaterThan(45);
  expect((await readPlan(page)).rows[0].placements).toHaveLength(1);
  await screenshot(page, info, "handles-and-rotation");
});

test("design tools select crops, show access and spacing, preview NZ sun and persist orientation", async ({ page }, info) => {
  await page.getByRole("button", { name: "Design tools", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Garden design tools" });
  await dialog.getByLabel("Show mature spacing circles").check();
  await dialog.getByRole("button", { name: "Access", exact: true }).click();
  await dialog.getByLabel("Show access guides in garden").check();
  await expect(dialog.locator(".garden-access-issues")).toContainText("reach");
  await dialog.getByRole("button", { name: "Sun", exact: true }).click();
  await dialog.getByLabel("Preview sunlight and shade").check();
  await dialog.getByLabel("True north direction", { exact: false }).fill("90"); await dialog.getByLabel("True north direction", { exact: false }).press("Tab");
  await dialog.getByLabel("Sun date").fill("2026-12-21");
  await expect(dialog.getByTestId("sun-position")).toContainText("UTC+13");
  await screenshot(page, info, "sun-design-controls");
  await dialog.getByRole("button", { name: "Editing", exact: true }).click();
  await dialog.getByRole("button", { name: "Select vegetables", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-spacing-rings", "4");
  await expect(canvas).toHaveAttribute("data-sun-elevation", /\d/);
  await expect(page.locator(".garden-selection-tools")).toContainText("2 selected");
  await expect(canvas).toHaveAttribute("data-highlighted-selections", "2");
  await page.getByRole("button", { name: "Delete selection", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).plantingAreas.map((a) => a.crop)).toEqual(["Strawberry"]);
  expect((await readPlan(page)).rows).toHaveLength(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".garden-edit-status")).toContainText("Saved to cloud");
  await page.reload(); await expect(canvas).toBeVisible();
  expect((await readPlan(page)).designSettings).toEqual({ northDeg: 90, walkwayCm: 60 });
});

test("named layout snapshots compare without mutation and restore with one undo", async ({ page }, info) => {
  await page.getByRole("button", { name: "Design tools", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Garden design tools" });
  await dialog.getByRole("button", { name: "Layouts", exact: true }).click();
  await dialog.getByLabel("Layout name").fill("Layout A"); await dialog.getByRole("button", { name: "Save layout snapshot" }).click();
  await dialog.getByRole("button", { name: "Return to garden" }).click();
  await page.getByText("Build options", { exact: true }).click(); await page.getByText("Select several objects", { exact: true }).click(); await page.getByLabel("Veg bed", { exact: true }).check(); await page.getByText("Build options", { exact: true }).click();
  await page.locator(".garden-edit-inspector").getByLabel("Width (cm)", { exact: true }).fill("100"); await page.locator(".garden-edit-inspector").getByLabel("Width (cm)", { exact: true }).press("Enter");
  const edited = await readPlan(page);
  await page.getByRole("button", { name: "Design tools", exact: true }).click(); await dialog.getByRole("button", { name: "Layouts", exact: true }).click();
  await expect(dialog.locator(".garden-layout-comparison")).toContainText("Layout A");
  await dialog.getByRole("button", { name: "Compare in garden", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-comparison", "true");
  expect(await readPlan(page)).toEqual(edited);
  await screenshot(page, info, "layout-comparison");
  await page.getByRole("button", { name: "Design tools", exact: true }).click(); await dialog.getByRole("button", { name: "Layouts", exact: true }).click(); await dialog.getByRole("button", { name: "Restore layout", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).beds[0].w * 9).toBeCloseTo(150);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); expect((await readPlan(page)).beds[0].w * 9).toBeCloseTo(100);
  const snapshots = await page.evaluate(() => JSON.parse(localStorage.getItem("garden-design-layouts:blenheim-garden")!));
  expect(snapshots).toHaveLength(1); expect(snapshots[0].plan.rows[0].surfaceId).toBe("object:raised");
});

test("box selection includes bed crops and direct dragging works without Move mode", async ({ page }, info) => {
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-camera", /world/);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-camera"))!).world[13]).not.toBe(16.2);
  const value = JSON.parse((await canvas.getAttribute("data-camera"))!), camera = new THREE.PerspectiveCamera(); camera.projectionMatrix.fromArray(value.projection); camera.matrixWorld.fromArray(value.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const rect = (await canvas.boundingBox())!, screen = (x: number, y: number, height = 0) => { const p = new THREE.Vector3(x / 100 - 4.5, height, y / 100 - 5.4).project(camera); return { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 }; };
  await page.getByRole("button", { name: "Box select", exact: true }).click();
  await drag(page, info, screen(80, 280), screen(260, 480));
  await expect(page.locator(".garden-selection-tools")).toContainText("2 selected");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await drag(page, info, screen(102, 435, .34), screen(122, 480, .34));
  await expect.poll(async () => (await readPlan(page)).beds[0].y * 10.8).toBeGreaterThan(300);
  expect((await readPlan(page)).plantingAreas[0].placements).toEqual(fixture.plantingAreas[0].placements);
  await screenshot(page, info, "direct-drag-and-box-selection");
  await page.keyboard.press("Control+a"); await page.keyboard.press("Delete");
  await expect.poll(async () => (await readPlan(page)).plantingAreas.length + (await readPlan(page)).rows.length).toBe(0);
  expect((await readPlan(page)).beds).toHaveLength(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await readPlan(page)).plantingAreas).toHaveLength(2);
});
