import { expect, test, type Page, type TestInfo } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { addConnectedPath, capturePlantedTemplate, connectedPathPoint, parsePlantedTemplates, placePlantedTemplate, plantedTemplatesKey, proposeGardenLayout, reflowSurfacePlants, timelinePlan, timelineScale, type GrowthTimeline } from "../../lib/garden/garden-workflows";
import { areaPlants, rowPlants, transformContainerPlants, validateEditorPlan } from "../../lib/garden/plan-editing";
import { movePlanGroup } from "../../lib/garden/garden-building";
import { duplicatePlacementAt } from "../../lib/garden/duplicate-placement";
import { rotateDesignSelection } from "../../lib/garden/garden-design";
import { gardenDimensions } from "../../lib/garden/garden-dimensions";

const fixture: PlannerPlan = { beds: [{ id: 1, name: "Studio bed", x: 100 / 9, y: 300 / 10.8, w: 240 / 9, h: 180 / 10.8 }], plantingAreas: [{ id: "tomatoes", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, count: 2, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "a", x: 25, y: 25 }, { id: "b", x: 75, y: 75 }] }], rows: [{ id: "lettuce", surfaceId: "object:raised", crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 28, count: 1, x1: 650, y1: 700, x2: 650, y2: 700, placements: [{ id: "l1", x: 0, y: 0 }] }], objects: [{ id: "raised", type: "structure", kind: "raised-bed-timber", label: "Raised bed", x: 650, y: 700, widthCm: 150, depthCm: 100, heightCm: 45, rotationDeg: 20 }, { id: "walk", type: "path", label: "Walkway", x1: 400, y1: 600, x2: 400, y2: 900, widthCm: 60 }], bedProfiles: { "bed:1": { sun: "full", soilDepthCm: 40, previousCrop: "Carrot" } } };
const readPlan = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));

test("connected paths snap to edges and right angles avoid beds", () => {
  expect(connectedPathPoint(fixture, { x: 412, y: 750 }, true)).toEqual({ x: 400, y: 750 });
  expect(connectedPathPoint(fixture, { x: 412, y: 750 }, false)).toEqual({ x: 412, y: 750 });
  const next = addConnectedPath(fixture, { x: 500, y: 200 }, { x: 720, y: 400 }, 60, "right-angle", true);
  expect(next.objects.filter((o) => o.type === "path")).toHaveLength(3);
  expect(() => addConnectedPath(fixture, { x: 220, y: 100 }, { x: 220, y: 550 }, 60, "direct", false)).toThrow(/overlaps/);
});
test("bed plants keep IDs through movement, rotation and counted rearrangement", () => {
  const legacy = { ...fixture, rows: [{ ...fixture.rows[0], id: "implicit", surfaceId: undefined, x1: 170, y1: 400, x2: 170, y2: 400 }] };
  const directTurn = rotateDesignSelection(legacy, { kind: "bed", id: "1" }, 90);
  expect(rowPlants(directTurn.rows[0])[0].x).toBeCloseTo(210); expect(rowPlants(directTurn.rows[0])[0].y).toBeCloseTo(340); expect(directTurn.rows[0].surfaceId).toBe("bed:1");
  const moved = movePlanGroup(legacy, [{ kind: "bed", id: "1" }, { kind: "row", id: "implicit" }], { x: 20, y: 0 });
  expect(rowPlants(moved.rows[0])[0].x).toBe(190); expect(moved.rows[0].surfaceId).toBe("bed:1");
  const turned = rotateDesignSelection(moved, { kind: "bed", id: "1" }, 90);
  expect(rowPlants(turned.rows[0])[0].id).toBe("l1"); expect(turned.plantingAreas[0].count).toBe(2);
  const container = fixture.objects[0]; if (container.type !== "structure") throw new Error("Fixture container missing");
  const mixed = { ...fixture, rows: [{ ...fixture.rows[0], surfaceId: undefined, count: 2, placements: [{ id: "inside", x: 0, y: 0 }, { id: "outside", x: 200, y: 0 }] }] };
  const movedContainer = { ...container, x: container.x + 10 }, mixedNext = transformContainerPlants(mixed, { ...mixed, objects: [movedContainer, fixture.objects[1]] }, container, movedContainer);
  expect(mixedNext.rows[0].surfaceId).toBeUndefined(); expect(rowPlants(mixedNext.rows[0])[1].x).toBe(850); expect(() => validateEditorPlan(mixedNext)).not.toThrow();
  const arranged = reflowSurfacePlants(fixture, { kind: "bed", id: "1" });
  expect(arranged.plantingAreas[0].count).toBe(2); expect(arranged.plantingAreas[0].placements!.map((p) => p.id)).toEqual(["a", "b"]); expect(arranged.rows).toEqual(fixture.rows);
  expect(() => reflowSurfacePlants({ ...fixture, beds: [{ ...fixture.beds[0], w: 40 / 9, h: 40 / 10.8 }] }, { kind: "bed", id: "1" })).toThrow(/cannot hold/);
});
test("planted templates clone crops, profiles and placements without changing the source", () => {
  const source = structuredClone(fixture), t = capturePlantedTemplate(source, { kind: "bed", id: "1" }, "Tomato layout");
  source.plantingAreas[0].count = 1; source.beds[0].w = 40;
  const parsed = parsePlantedTemplates(JSON.stringify([t]))[0]; expect(parsed.plan.plantingAreas[0].count).toBe(2);
  expect(() => parsePlantedTemplates(JSON.stringify([{ ...t, plan: { ...t.plan, plantingAreas: [{ ...t.plan.plantingAreas[0], spacingCm: 0 }] } }]))).toThrow(/invalid/);
  expect(plantedTemplatesKey("one")).not.toBe(plantedTemplatesKey("two"));
  const pending = placePlantedTemplate(fixture, parsed), next = duplicatePlacementAt(pending, { x: 650, y: 350 });
  expect(fixture.beds).toHaveLength(1); expect(next.beds).toHaveLength(2); expect(next.plantingAreas[1].count).toBe(2);
  expect(next.bedProfiles?.[`bed:${next.beds[1].id}`]).toEqual(fixture.bedProfiles?.["bed:1"]);
  expect(next.plantingAreas[1].placements!.map((p) => p.id)).not.toEqual(["a", "b"]);
});
test("timeline previews are reversible views and layout proposals preserve fixed geometry", () => {
  const timeline: GrowthTimeline = { enabled: true, surfaceId: "bed:1", plantedOn: "2026-10-13", date: "2026-10-13", matureDays: 60, harvestDays: 90 };
  expect(timelineScale(timeline)).toBe(.25);
  const future = timelinePlan(fixture, { ...timeline, date: "2027-02-13" }); expect(future.plantingAreas).toHaveLength(0); expect(future.rows).toHaveLength(1); expect(fixture.plantingAreas).toHaveLength(1);
  const request = { crops: ["Lettuce", "Carrot"], priority: "access" as const, newBeds: 0, width: 120, depth: 240, replace: false, month: 10 };
  const a = proposeGardenLayout(fixture, request), b = proposeGardenLayout(fixture, request, true);
  expect(a.beds).toEqual(fixture.beds); expect(a.objects).toEqual(fixture.objects); expect(a.plantingAreas[0]).toEqual(fixture.plantingAreas[0]);
  expect(a.plantingAreas.length + a.rows.length).toBeGreaterThan(2);
  expect([...a.plantingAreas, ...a.rows].reduce((n, p) => n + p.count, 0)).not.toEqual([...b.plantingAreas, ...b.rows].reduce((n, p) => n + p.count, 0));
  const locked = { ...fixture, objectLocks: ["bed:1", "object:raised"] }; expect(() => proposeGardenLayout(locked, request)).toThrow(/unlock/);
  const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
  const newGarden = proposeGardenLayout(empty, { ...request, newBeds: 2 }); expect(newGarden.beds).toHaveLength(2); expect(newGarden.objects.filter((o) => o.type === "path").length).toBeGreaterThan(1); expect(empty.beds).toHaveLength(0);
});

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const list: string[] = []; errors.set(page, list); page.on("pageerror", (e) => list.push(e.message)); page.on("console", (m) => { if (m.type() === "error") list.push(m.text()); });
  let saved = structuredClone(fixture);
  await context.route("**/api/**", (route) => { if (new URL(route.request().url()).pathname === "/api/garden") { if (route.request().method() === "PUT") saved = route.request().postDataJSON().plan; return route.fulfill({ json: { ok: true, plan: saved } }); } return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test", year: 2026 }], beds: [], items: [], history: [] } }); });
  await page.addInitScript((plan) => { sessionStorage.setItem("blenheim-garden-edit-key", "fixture-only"); if (!localStorage.getItem("blenheim-garden-live-plan")) localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)); }, fixture);
  await page.goto("/3d?view=3d"); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));
async function chooseBed(page: Page) { await page.getByRole("button", { name: "Objects", exact: true }).click(); const d = page.getByRole("dialog", { name: "Select garden objects" }); await d.getByLabel("Find an object").fill("Studio bed"); await d.locator(".garden-object-list button").first().click(); await d.getByRole("button", { name: "Done", exact: true }).click(); }
async function studio(page: Page, tab: string) { await page.getByRole("button", { name: "Garden studio", exact: true }).click(); const d = page.getByRole("dialog", { name: "Garden studio" }); await d.getByRole("button", { name: tab, exact: true }).click(); return d; }
async function shot(page: Page, info: TestInfo, name: string) { await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1); }
async function topScreen(page: Page) {
  await page.getByRole("button", { name: "Top", exact: true }).click(); await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  const c = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'), rect = (await c.boundingBox())!; await expect(c).toHaveAttribute("data-camera", /projection/);
  const s = JSON.parse((await c.getAttribute("data-camera"))!), camera = new THREE.PerspectiveCamera(); camera.matrixWorld.fromArray(s.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(s.projection);
  return { c, at: (x: number, y: number, height = 0) => { const p = new THREE.Vector3(x / 100 - 4.5, height, y / 100 - 5.4).project(camera); return { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 }; } };
}
async function tap(page: Page, info: TestInfo, p: { x: number; y: number }) { if (info.project.name === "phone") await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }

test("targeted bed planting previews counts and fills only the selected soil", async ({ page }, info) => {
  await chooseBed(page); await page.getByRole("button", { name: "Plant here", exact: true }).click();
  const tools = page.getByRole("region", { name: "Plant selected bed" }); await expect(tools).toContainText("Studio bed");
  await tools.getByLabel("Bed crop", { exact: true }).selectOption("Lettuce"); await tools.getByRole("button", { name: "Paint", exact: true }).click();
  await tools.getByRole("button", { name: /Preview fill bed/ }).click();
  await expect(page.getByRole("region", { name: "Garden preview" })).toContainText("Lettuce"); expect(await readPlan(page)).toEqual(fixture);
  await shot(page, info, "bed-fill-preview"); await page.getByRole("button", { name: "Apply preview", exact: true }).click();
  await page.getByRole("button", { name: "Done planting", exact: true }).click();
  const next = await readPlan(page); expect(next.rows).toEqual(fixture.rows); expect(next.plantingAreas[0]).toEqual(fixture.plantingAreas[0]); expect(next.plantingAreas.at(-1)?.crop).toBe("Lettuce");
  expect(areaPlants(next, next.plantingAreas.at(-1)!).every((p) => p.x >= 111 && p.x <= 329 && p.y >= 311 && p.y <= 469)).toBe(true);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); expect((await readPlan(page)).plantingAreas).toEqual(fixture.plantingAreas);
});
test("timeline shows seedlings, maturity and harvest without modifying saved plants", async ({ page }, info) => {
  const d = await studio(page, "Timeline"); await d.getByLabel("Timeline bed", { exact: true }).selectOption("bed:1");
  await d.getByRole("button", { name: "Seedlings", exact: true }).click(); await d.getByRole("button", { name: "View timeline in garden", exact: true }).click();
  const c = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'); await expect(c).toHaveAttribute("data-plant-count", "3"); await shot(page, info, "seedling-preview");
  const mature = await studio(page, "Timeline"); await mature.getByRole("button", { name: "At maturity", exact: true }).click(); await mature.getByRole("button", { name: "View timeline in garden", exact: true }).click(); await shot(page, info, "mature-preview");
  const harvest = await studio(page, "Timeline"); await harvest.getByRole("button", { name: "After harvest", exact: true }).click(); await harvest.getByRole("button", { name: "View timeline in garden", exact: true }).click();
  await expect(c).toHaveAttribute("data-plant-count", "1"); expect(await readPlan(page)).toEqual(fixture); await shot(page, info, "harvest-view-only");
  await page.getByRole("button", { name: "Back to editing", exact: true }).click(); await expect(c).toHaveAttribute("data-plant-count", "3");
});
test("planted templates retain content after the source changes and place with one undo", async ({ page }, info) => {
  await chooseBed(page); const d = await studio(page, "Templates"); await d.getByLabel("Planted template name").fill("Tomato repeat"); await d.getByRole("button", { name: "Save planted template", exact: true }).click();
  await expect(d.locator(".garden-planted-template-list")).toContainText("2 plants"); await shot(page, info, "planted-templates"); await d.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Width (cm)", { exact: true }).fill("220"); await page.getByLabel("Width (cm)", { exact: true }).press("Enter");
  const { c, at } = await topScreen(page), template = await studio(page, "Templates"); await template.getByRole("button", { name: "Place template", exact: true }).click();
  const target = at(650, 350); await page.mouse.move(target.x, target.y); await expect(c).toHaveAttribute("data-copy-preview", "valid"); await shot(page, info, "stored-template-preview"); await tap(page, info, target);
  await expect.poll(async () => (await readPlan(page)).beds.length).toBe(2); const next = await readPlan(page); const dim = gardenDimensions(next);
  expect(next.beds[1].w * dim.width / 100).toBeCloseTo(240); expect(next.plantingAreas[1].count).toBe(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); await expect.poll(async () => (await readPlan(page)).beds.length).toBe(1);
});
test("layout assistant compares proposals, cancels safely and applies one reversible change", async ({ page }, info) => {
  const d = await studio(page, "Layout assistant"); await d.getByLabel("Planting month", { exact: true }).selectOption("10"); await d.getByRole("button", { name: "Generate layout proposals", exact: true }).click();
  await expect(d.locator(".garden-layout-proposal")).toHaveCount(2); expect((await d.locator(".garden-assistant-crops").boundingBox())!.height).toBeGreaterThanOrEqual(150); await shot(page, info, "layout-proposals");
  await d.getByRole("button", { name: "Preview Balanced beds", exact: true }).click(); expect(await readPlan(page)).toEqual(fixture); await shot(page, info, "layout-preview");
  await page.getByRole("button", { name: "Cancel preview", exact: true }).click(); expect(await readPlan(page)).toEqual(fixture);
  const again = await studio(page, "Layout assistant"); await again.getByLabel("Planting month", { exact: true }).selectOption("10"); await again.getByRole("button", { name: "Generate layout proposals", exact: true }).click(); await again.getByRole("button", { name: "Preview Balanced beds", exact: true }).click(); await page.getByRole("button", { name: "Apply preview", exact: true }).click();
  const next = await readPlan(page); expect(next.beds).toEqual(fixture.beds); expect(next.objects).toEqual(fixture.objects); expect(next.plantingAreas.length + next.rows.length).toBeGreaterThan(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); await expect.poll(async () => (await readPlan(page)).plantingAreas).toEqual(fixture.plantingAreas);
});
test("camera lock, focus and chained right-angle paths keep editing predictable", async ({ page }, info) => {
  let { c, at } = await topScreen(page); await page.getByText("Camera", { exact: true }).click(); await page.getByLabel("Lock camera", { exact: true }).check(); await page.getByText("Camera", { exact: true }).click();
  const before = JSON.parse((await c.getAttribute("data-camera"))!).world, a = at(700, 200), b = at(800, 240); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up();
  const after = JSON.parse((await c.getAttribute("data-camera"))!).world; for (const i of [12, 13, 14]) expect(after[i]).toBeCloseTo(before[i], 4);
  await page.getByRole("button", { name: "Add path", exact: true }).click(); await page.getByLabel("Path shape", { exact: true }).selectOption("right-angle"); await page.getByLabel("Continue connected path", { exact: true }).check(); await page.locator(".garden-edit-palette > summary").click();
  await tap(page, info, at(500, 200)); await tap(page, info, at(720, 400)); await expect.poll(async () => (await readPlan(page)).objects.filter((o) => o.type === "path").length).toBe(3);
  await tap(page, info, at(720, 600)); await expect.poll(async () => (await readPlan(page)).objects.filter((o) => o.type === "path").length).toBe(4); await page.keyboard.press("Escape");
  await page.getByLabel("Selection target", { exact: true }).selectOption("beds"); await page.mouse.dblclick(at(105, 470, .34).x, at(105, 470, .34).y); await expect(page.locator(".garden-edit-inspector")).toContainText("Studio bed");
  await expect.poll(async () => JSON.parse((await c.getAttribute("data-camera"))!).world[13]).toBeLessThan(before[13]); await page.getByText("Camera", { exact: true }).click(); await page.getByRole("button", { name: "Whole garden", exact: true }).click(); await page.getByText("Camera", { exact: true }).click();
  ({ c, at } = await topScreen(page)); await shot(page, info, "connected-paths-and-camera");
});

test("rearrangement preview and resizing retain every plant and undo cleanly", async ({ page }, info) => {
  await chooseBed(page);
  await page.getByRole("button", { name: "Preview plant arrangement", exact: true }).click();
  expect(await readPlan(page)).toEqual(fixture); await shot(page, info, "rearrangement-preview");
  await page.getByRole("button", { name: "Apply preview", exact: true }).click();
  expect((await readPlan(page)).plantingAreas[0].placements!.map((p) => p.id)).toEqual(["a", "b"]);
  await page.getByLabel("Rearrange plants when resizing", { exact: true }).check();
  await page.getByLabel("Width (cm)", { exact: true }).fill("200"); await page.getByLabel("Width (cm)", { exact: true }).press("Enter");
  const resized = await readPlan(page); expect(resized.plantingAreas[0].count).toBe(2); expect(resized.plantingAreas[0].placements!.map((p) => p.id)).toEqual(["a", "b"]); expect(resized.rows).toEqual(fixture.rows);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await readPlan(page)).toEqual(fixture);
});

test("pixel mode shares timeline views and preview-only bed planting", async ({ page }, info) => {
  await page.getByRole("button", { name: "Pixel garden", exact: true }).click(); const c = page.locator(".garden-pixel-canvas canvas"); await expect(c).toHaveAttribute("data-pixel-ready", "true");
  const d = await studio(page, "Timeline"); await d.getByLabel("Timeline bed", { exact: true }).selectOption("bed:1"); await d.getByRole("button", { name: "After harvest", exact: true }).click(); await d.getByRole("button", { name: "View timeline in garden", exact: true }).click();
  await expect(c).toHaveAttribute("data-pixel-crops", "Lettuce"); expect(await readPlan(page)).toEqual(fixture); await shot(page, info, "pixel-harvest-view"); await page.getByRole("button", { name: "Back to editing", exact: true }).click(); await expect(c).toHaveAttribute("data-pixel-crops", "Lettuce|Tomato");
  await chooseBed(page); await page.getByRole("button", { name: "Plant here", exact: true }).click(); await page.getByLabel("Bed crop", { exact: true }).selectOption("Carrot"); await page.getByRole("button", { name: /Preview fill bed/ }).click(); await expect(c).toHaveAttribute("data-pixel-crops", "Carrot|Lettuce|Tomato"); expect(await readPlan(page)).toEqual(fixture); await shot(page, info, "pixel-bed-fill-preview"); await page.getByRole("button", { name: "Cancel preview", exact: true }).click(); await expect(c).toHaveAttribute("data-pixel-crops", "Lettuce|Tomato"); expect(await readPlan(page)).toEqual(fixture);
});

test("legacy rows rotate with their soil before any move and undo restores ownership", async ({ page, context }, info) => {
  const legacy: PlannerPlan = { ...fixture, rows: [{ ...fixture.rows[0], id: "implicit", surfaceId: undefined, x1: 170, y1: 400, x2: 170, y2: 400 }] };
  await context.route("**/api/garden?*", (route) => route.fulfill({ json: { ok: true, plan: legacy } }));
  await page.evaluate((plan) => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(plan)), legacy);
  await page.reload(); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-plant-count", "3");
  await chooseBed(page); await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect.poll(async () => rowPlants((await readPlan(page)).rows[0])[0].x).toBeCloseTo(210);
  const next = await readPlan(page); expect(rowPlants(next.rows[0])[0].y).toBeCloseTo(340); expect(next.rows[0].surfaceId).toBe("bed:1"); expect(next.rows[0].count).toBe(1); expect(rowPlants(next.rows[0])[0].id).toBe("l1"); expect(next.plantingAreas[0].placements!.map((p) => p.id)).toEqual(["a", "b"]);
  await shot(page, info, "legacy-row-rotation"); await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await readPlan(page)).toEqual(legacy);
});
