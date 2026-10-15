import { editorAction, openInspectorMore } from "./helpers/editor-controls";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { prepareDuplicatePlacement, duplicatePlacementAt } from "../../lib/garden/duplicate-placement";
import { assertLocksUnchanged, isSelectionLocked, parseObjectLocks } from "../../lib/garden/object-locks";
import { areaPlants, movePlanSelection, rowPlants } from "../../lib/garden/plan-editing";
import { captureLayout, parseSavedLayouts } from "../../lib/garden/garden-design-layouts";

const fixture: PlannerPlan = { beds: [{ id: 1, name: "Tomato bed", x: 100 / 9, y: 300 / 10.8, w: 150 / 9, h: 160 / 10.8 }], plantingAreas: [{ id: "tomatoes", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, count: 2, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "a", x: 25, y: 25 }, { id: "b", x: 75, y: 75 }] }], rows: [{ id: "lettuce", surfaceId: "object:raised", crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 28, count: 1, x1: 650, y1: 700, x2: 650, y2: 700, placements: [{ id: "l1", x: -25, y: 0 }] }], objects: [{ id: "raised", type: "structure", kind: "raised-bed-timber", label: "Raised bed", x: 650, y: 700, widthCm: 150, depthCm: 100, heightCm: 45, rotationDeg: 20 }, { id: "path", type: "path", label: "Walkway", x1: 300, y1: 170, x2: 300, y2: 750, widthCm: 60 }], bedProfiles: { "object:raised": { sun: "full", soilDepthCm: 40, previousCrop: "Carrot" } } };
const readPlan = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));

test("copies wait for placement, carry contents once, and protect originals", () => {
  const source = structuredClone(fixture), pending = prepareDuplicatePlacement(source, [{ kind: "bed", id: "1" }, { kind: "area", id: "tomatoes" }]);
  expect(source).toEqual(fixture); expect(pending.sources).toHaveLength(1);
  expect(() => duplicatePlacementAt(pending, pending.anchor)).toThrow(/overlaps/);
  const next = duplicatePlacementAt(pending, { x: 650, y: 350 });
  expect(next.beds).toHaveLength(2); expect(next.plantingAreas).toHaveLength(2);
  expect(next.beds[0]).toEqual(fixture.beds[0]); expect(next.plantingAreas[0]).toEqual(fixture.plantingAreas[0]);
  expect(next.plantingAreas[1].count).toBe(2); expect(next.plantingAreas[1].plantingId).toBeUndefined();
  expect(areaPlants(next, next.plantingAreas[1]).map((p) => p.id)).not.toEqual(["a", "b"]);
  const raised = prepareDuplicatePlacement(fixture, [{ kind: "object", id: "raised" }, { kind: "row", id: "lettuce" }]);
  const placed = duplicatePlacementAt(raised, { x: 650, y: 300 });
  const copied = placed.objects.find((o) => !fixture.objects.some((old) => old.id === o.id))!;
  expect(placed.rows).toHaveLength(2); expect(placed.rows[1].surfaceId).toBe(`object:${copied.id}`);
  expect(placed.bedProfiles?.[`object:${copied.id}`]).toEqual(fixture.bedProfiles?.["object:raised"]);
  expect(rowPlants(placed.rows[1])[0].y).toBeCloseTo(300);
  const plant = prepareDuplicatePlacement(fixture, [{ kind: "area", id: "tomatoes", plantId: "a" }]);
  const onRaised = duplicatePlacementAt(plant, { x: 650, y: 700 });
  expect(onRaised.rows.at(-1)?.surfaceId).toBe("object:raised");
  expect(onRaised.rows.at(-1)?.count).toBe(1);
  expect(() => duplicatePlacementAt(plant, { x: 300, y: 400 })).toThrow(/soil/);
  const inBed = duplicatePlacementAt(plant, { x: 160, y: 340 });
  expect(inBed.plantingAreas[0].count).toBe(3); expect(inBed.rows).toHaveLength(1);
  expect(() => duplicatePlacementAt(plant, plant.anchor)).toThrow(/space/);
  const individualCopies = prepareDuplicatePlacement(fixture, [{ kind: "area", id: "tomatoes", plantId: "a" }, { kind: "area", id: "tomatoes", plantId: "b" }]);
  const together = duplicatePlacementAt(individualCopies, { x: individualCopies.anchor.x + 10, y: individualCopies.anchor.y });
  expect(together.plantingAreas[0].count).toBe(4); expect(new Set(together.plantingAreas[0].placements!.map((p) => p.id)).size).toBe(4);
  const pair: PlannerPlan = { ...fixture, rows: [{ id: "pair", crop: "Carrot", cropIcon: "C", variety: "Nantes", spacingCm: 10, count: 2, x1: 600, y1: 500, x2: 650, y2: 500, placements: [{ id: "c1", x: 0, y: 0 }, { id: "c2", x: 100, y: 0 }] }] };
  const rowCopies = prepareDuplicatePlacement(pair, [{ kind: "row", id: "pair", plantId: "c1" }, { kind: "row", id: "pair", plantId: "c2" }]);
  const rowTogether = duplicatePlacementAt(rowCopies, { x: rowCopies.anchor.x, y: rowCopies.anchor.y + 10 });
  expect(rowTogether.rows).toHaveLength(1); expect(rowTogether.rows[0].count).toBe(4); expect(rowTogether.rows[0].placements).toHaveLength(4);
});

test("locks prevent edits and deletion through owners but copies start unlocked", () => {
  const locked = { ...fixture, objectLocks: ["bed:1", "object:raised"] };
  expect(isSelectionLocked(locked, { kind: "area", id: "tomatoes", plantId: "a" })).toBe(true);
  expect(isSelectionLocked(locked, { kind: "row", id: "lettuce" })).toBe(true);
  expect(() => assertLocksUnchanged(locked, movePlanSelection(locked, { kind: "bed", id: "1" }, { x: 20, y: 0 }))).toThrow(/Unlock/);
  expect(() => assertLocksUnchanged(locked, { ...locked, plantingAreas: [] })).toThrow(/Unlock/);
  expect(() => assertLocksUnchanged(locked, { ...locked, objectLocks: [] })).not.toThrow();
  const next = duplicatePlacementAt(prepareDuplicatePlacement(locked, [{ kind: "bed", id: "1" }]), { x: 650, y: 350 });
  expect(isSelectionLocked(next, { kind: "bed", id: String(next.beds[1].id) })).toBe(false);
  expect(parseSavedLayouts(JSON.stringify(captureLayout([], "Locked plan", locked)))[0].plan.objectLocks).toEqual(locked.objectLocks);
  expect(() => parseObjectLocks(["garbage"])).toThrow();
});

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const diagnostics: string[] = []; errors.set(page, diagnostics);
  page.on("pageerror", (e) => diagnostics.push(e.message)); page.on("console", (m) => { if (m.type() === "error") diagnostics.push(m.text()); });
  let saved = structuredClone(fixture);
  await context.route("**/api/**", (route) => { if (new URL(route.request().url()).pathname === "/api/garden") { if (route.request().method() === "PUT") saved = route.request().postDataJSON().plan; return route.fulfill({ json: { ok: true, plan: saved } }); } return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test", year: 2026 }], beds: [], items: [] } }); });
  await page.addInitScript((plan) => { sessionStorage.setItem("blenheim-garden-edit-key", "fixture-only"); if (!localStorage.getItem("blenheim-garden-live-plan")) localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)); }, fixture);
  await page.goto("/3d?view=3d"); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function choose(page: Page, name: string) {
  await editorAction(page, "Objects");
  const dialog = page.getByRole("dialog", { name: "Select garden objects" });
  await dialog.getByLabel("Find an object").fill(name);
  await dialog.locator(".garden-object-list button").first().click();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
}
async function topScreen(page: Page) {
  await page.getByRole("button", { name: "Top", exact: true }).click(); await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'), rect = (await canvas.boundingBox())!;
  await expect(canvas).toHaveAttribute("data-camera", /projection/);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-camera"))!).world[13]).not.toBe(16.2);
  const state = JSON.parse((await canvas.getAttribute("data-camera"))!), camera = new THREE.PerspectiveCamera();
  camera.matrixWorld.fromArray(state.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(state.projection);
  return { canvas, at: (x: number, y: number, height = 0) => { const p = new THREE.Vector3(x / 100 - 4.5, height, y / 100 - 5.4).project(camera); return { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 }; } };
}
async function shot(page: Page, info: TestInfo, name: string) { await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1); }
async function tap(page: Page, info: TestInfo, p: { x: number; y: number }) { if (info.project.name === "phone") await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }

test("object list selects, toggles multi-selection, locks and saves without losing crops", async ({ page }, info) => {
  await choose(page, "Tomato bed");
  await expect(page.locator(".garden-edit-inspector")).toContainText("Tomato bed");
  await page.getByRole("button", { name: "Lock selected", exact: true }).click();
  await expect(page.locator(".garden-edit-inspector")).toContainText("Locked");
  await openInspectorMore(page);
  await expect(page.getByLabel("Width (cm)", { exact: true })).toBeDisabled();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'); await expect(canvas).toHaveAttribute("data-resize-handles", "0");
  await page.keyboard.press("Delete"); expect((await readPlan(page)).beds).toHaveLength(1); expect((await readPlan(page)).plantingAreas).toHaveLength(1);
  await page.getByRole("button", { name: "Save", exact: true }).click(); await expect(page.locator(".garden-edit-status")).toContainText("Saved to cloud");
  await page.reload(); await choose(page, "Tomato bed"); await expect(page.getByRole("button", { name: "Unlock selected", exact: true })).toBeVisible();
  await shot(page, info, "locked-selection");
  await editorAction(page, "Objects");
  const lockedDialog = page.getByRole("dialog", { name: "Select garden objects" });
  await lockedDialog.getByLabel("Select multiple objects").check();
  await lockedDialog.getByLabel("Find an object").fill("Roma"); await lockedDialog.locator(".garden-object-list button").click();
  await lockedDialog.getByRole("button", { name: "Unlock selection", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).objectLocks).toEqual([]);
  await lockedDialog.getByLabel("Select multiple objects").uncheck(); await lockedDialog.getByRole("button", { name: "Done", exact: true }).click();
  await choose(page, "Tomato bed");
  await editorAction(page, "Objects"); const dialog = page.getByRole("dialog", { name: "Select garden objects" });
  await dialog.getByLabel("Select multiple objects").check();
  await dialog.getByLabel("Find an object").fill("Raised bed"); await dialog.locator(".garden-object-list button").click();
  await expect(dialog.locator("footer")).toContainText("2 selected");
  await shot(page, info, "object-picker-multiple");
  await dialog.locator(".garden-object-list button").click(); await expect(dialog.locator("footer")).toContainText("1 selected");
  await dialog.getByLabel("Select multiple objects").uncheck(); await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".garden-edit-inspector")).toContainText("Tomato bed");
});

test("duplicate waits, shows blocked preview, cancels, places and undoes once", async ({ page }, info) => {
  const { canvas, at } = await topScreen(page);
  await choose(page, "Tomato bed"); await page.getByRole("button", { name: "Duplicate selected", exact: true }).click();
  expect((await readPlan(page)).beds).toHaveLength(1); await expect(page.getByRole("button", { name: "Cancel copy", exact: true })).toBeVisible();
  const blocked = at(175, 380, .34); await page.mouse.move(blocked.x, blocked.y); await expect(canvas).toHaveAttribute("data-copy-preview", "blocked");
  await page.mouse.click(blocked.x, blocked.y); expect((await readPlan(page)).beds).toHaveLength(1);
  await page.getByRole("button", { name: "Cancel copy", exact: true }).click(); expect((await readPlan(page)).beds).toHaveLength(1);
  await choose(page, "Tomato bed"); await page.keyboard.press("Control+d"); await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Cancel copy", exact: true })).toHaveCount(0); expect((await readPlan(page)).beds).toHaveLength(1);
  await choose(page, "Raised bed"); await page.keyboard.press("Control+d"); await page.keyboard.press("Delete"); await expect(page.getByRole("button", { name: "Cancel copy", exact: true })).toHaveCount(0); expect((await readPlan(page)).objects).toHaveLength(2);
  await page.keyboard.press("Control+d"); await page.getByRole("button", { name: "Select", exact: true }).click(); await expect(page.getByRole("button", { name: "Cancel copy", exact: true })).toHaveCount(0);
  await page.keyboard.press("Control+d"); await page.keyboard.press("Control+z"); await expect(page.getByRole("button", { name: "Cancel copy", exact: true })).toHaveCount(0); expect((await readPlan(page)).objects).toHaveLength(2);
  await choose(page, "Tomato bed"); await page.keyboard.press("Control+d");
  const target = at(650, 350); await page.mouse.move(target.x, target.y); await expect(canvas).toHaveAttribute("data-copy-preview", "valid");
  await shot(page, info, "copy-placement-preview"); await tap(page, info, target);
  await expect.poll(async () => (await readPlan(page)).beds.length).toBe(2);
  const next = await readPlan(page); expect(next.plantingAreas).toHaveLength(2); expect(next.plantingAreas[1].count).toBe(2);
  await expect(page.locator(".garden-edit-inspector")).toContainText("Tomato bed copy");
  await page.getByRole("button", { name: "Undo", exact: true }).click(); await expect.poll(async () => (await readPlan(page)).beds.length).toBe(1);
  await page.getByRole("button", { name: "Redo", exact: true }).click(); await expect.poll(async () => (await readPlan(page)).beds.length).toBe(2);
  await shot(page, info, "placed-copy");
});

test("bed selection ignores foliage and pixel copies use the same placement workflow", async ({ page }, info) => {
  const { at } = await topScreen(page);
  await page.getByLabel("Selection target", { exact: true }).selectOption("beds");
  const tomato = at(137.5, 340, .34); await page.mouse.click(tomato.x, tomato.y);
  await expect(page.locator(".garden-edit-inspector")).toContainText("Tomato bed");
  await page.getByRole("button", { name: "Pixel garden", exact: true }).click();
  await choose(page, "Raised bed"); await page.getByRole("button", { name: "Duplicate selected", exact: true }).click();
  const canvas = page.locator('[aria-label^="Pixel garden."]');
  await expect(canvas).toHaveAttribute("data-pixel-ready", "true");
  const rect = (await canvas.boundingBox())!, v = JSON.parse((await canvas.getAttribute("data-pixel-view"))!);
  const target = { x: rect.x + (v.x + (650 - 450) * v.scale) * rect.width / v.width, y: rect.y + (v.y + (300 - 540) * v.scale * v.tilt) * rect.height / v.height };
  await page.mouse.move(target.x, target.y); await expect(canvas).toHaveAttribute("data-copy-preview", "valid");
  await shot(page, info, "pixel-copy-preview"); await tap(page, info, target);
  await expect.poll(async () => (await readPlan(page)).objects.length).toBe(3); expect((await readPlan(page)).rows).toHaveLength(2);
});

test("saved locks also protect the mirrored 2D planner", async ({ page }) => {
  await choose(page, "Tomato bed"); await page.getByRole("button", { name: "Lock selected", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await expect(page.locator(".garden-edit-status")).toContainText("Saved to cloud");
  await page.goto("/?view=2d"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.getByRole("button", { name: "Select vegetables", exact: true }).click(); await page.keyboard.press("Delete");
  await expect.poll(async () => (await readPlan(page)).plantingAreas).toEqual(fixture.plantingAreas);
  expect((await readPlan(page)).rows).toEqual(fixture.rows);
  await expect(page.locator(".gv-buildbar")).toContainText("Unlock");
});
