import { expect, test, type Page } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { plantingSurfaces, surfaceAt } from "../../lib/garden/planting-surfaces";
import { cropPlacementPoints, addCropPoints } from "../../lib/garden/garden-building";
import { plantingLocationIssue } from "../../lib/garden/planting-feedback";
import { assertLocksUnchanged } from "../../lib/garden/object-locks";
import { editorAction } from "./helpers/editor-controls";

const fixture: PlannerPlan = { canvasWidthCm: 3000, canvasHeightCm: 3000, beds: [{ id: 31, name: "Berry bed", x: 50 / 3, y: 227 / 3, w: 10, h: 20 / 3 }, { id: 32, name: "Other bed", x: 4 / 3, y: 256 / 3, w: 10, h: 20 / 3 }], plantingAreas: [], rows: [], objects: [{ id: "net", type: "structure", kind: "bird-net-frame", x: 640, y: 2370, widthCm: 200, depthCm: 300, heightCm: 180, rotationDeg: 90, label: "Bird net frame" }], objectLocks: ["bed:31", "bed:32", "object:net"] };
const read = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));

test("bed locks block planting while a locked bird-net frame alone leaves its soil usable", () => {
  const soil = plantingSurfaces(fixture)[0], point = { x: soil.x, y: soil.y };
  expect(surfaceAt(fixture, point)?.id).toBe("31");
  expect(cropPlacementPoints(fixture, "Blueberry", point, point, "brush", undefined, 120)).toEqual([]);
  expect(plantingLocationIssue(fixture, point)).toContain("Unlock Berry bed");
  const unlocked = { ...fixture, objectLocks: fixture.objectLocks!.filter(k => k !== "bed:31") };
  expect(() => assertLocksUnchanged(fixture, unlocked)).not.toThrow();
  expect(cropPlacementPoints(unlocked, "Blueberry", point, point, "brush", undefined, 120)).toHaveLength(1);
  const planted = addCropPoints(unlocked, "Blueberry", "Southern Highbush", [point], undefined, 120);
  expect(planted.plantingAreas[0].bedId).toBe(31); expect(planted.objectLocks).toEqual(["bed:32", "object:net"]);
  expect(() => assertLocksUnchanged(unlocked, planted)).not.toThrow();
  expect(() => assertLocksUnchanged(fixture, { ...planted, objectLocks: fixture.objectLocks })).toThrow(/Unlock/);
});

test("brush reports the actual locked bed and unlocks only it before planting through a locked net", async ({ page, context }, info) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await context.route("**/api/**", r => r.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [] } }));
  await context.addInitScript(p => localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(p)), fixture);
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'); await expect(canvas).toHaveAttribute("data-plant-count", "0");
  await page.locator(".garden-bed-access > summary").click(); await page.getByLabel("Go to bed", { exact: true }).selectOption("bed:31"); await page.locator(".garden-bed-access > summary").click();
  await page.getByRole("button", { name: "Objects", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Select garden objects" }); await dialog.getByLabel("Find an object").fill("Bird net frame"); await dialog.locator(".garden-object-list button").click(); await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await editorAction(page, "Plant brush"); const palette = page.locator(".garden-edit-palette"); await palette.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Blueberry"); await expect(palette.getByLabel("Plant spacing (cm)")).toHaveValue("120");
  for (const cls of [".garden-edit-palette", ".garden-edit-inspector"]) { const panel = page.locator(`${cls}[open]`); if (await panel.count()) await panel.locator(":scope > summary").click(); }
  const tapSoil = async () => {
    await expect.poll(async () => { const s = JSON.parse((await canvas.getAttribute("data-camera"))!), b = (await canvas.boundingBox())!; return Math.abs(s.projection[5] / s.projection[0] - b.width / b.height); }).toBeLessThan(.005);
    const soil = plantingSurfaces(fixture)[0], s = JSON.parse((await canvas.getAttribute("data-camera"))!), c = new THREE.PerspectiveCamera(); c.matrixWorld.fromArray(s.world); c.matrixWorldInverse.copy(c.matrixWorld).invert(); c.projectionMatrix.fromArray(s.projection);
    const p = new THREE.Vector3(soil.x / 100 - 4.5, soil.height, soil.y / 100 - 5.4).project(c), b = (await canvas.boundingBox())!, hit = { x: b.x + (p.x + 1) * b.width / 2, y: b.y + (1 - p.y) * b.height / 2 };
    expect(await page.evaluate(p => document.elementFromPoint(p.x, p.y)?.tagName, hit)).toBe("CANVAS"); if (info.project.name === "phone") await page.touchscreen.tap(hit.x, hit.y); else await page.mouse.click(hit.x, hit.y);
  };
  await tapSoil(); expect(await read(page)).toEqual(fixture); await page.screenshot({ path: info.outputPath("locked-planting-error.png") });
  await expect(page.locator(".garden-edit-status")).toContainText("Unlock Berry bed");
  await page.getByRole("button", { name: "Unlock bed for planting", exact: true }).click();
  const unlocked = await read(page); expect(unlocked.objectLocks).toEqual(["bed:32", "object:net"]); expect(unlocked.beds).toEqual(fixture.beds); expect(unlocked.objects).toEqual(fixture.objects); expect(unlocked.plantingAreas).toEqual([]);
  await expect(page.getByLabel("Planting bed", { exact: true })).toHaveValue("bed:31"); await expect(page.getByLabel("Bed crop", { exact: true })).toHaveValue("Blueberry");
  await tapSoil(); await expect.poll(async () => (await read(page)).plantingAreas.reduce((n, a) => n + a.count, 0)).toBe(1);
  const planted = await read(page); expect(planted.plantingAreas[0].bedId).toBe(31); expect(planted.objectLocks).toEqual(unlocked.objectLocks); expect(planted.objects).toEqual(fixture.objects); expect(planted.beds).toEqual(fixture.beds);
  await expect(canvas).toHaveAttribute("data-vegetable-models", /blueberry/, { timeout: 60000 }); await page.screenshot({ path: info.outputPath("blueberry-under-locked-net.png") });
  await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await read(page)).toEqual(unlocked); await page.getByRole("button", { name: "Undo", exact: true }).click(); expect(await read(page)).toEqual(fixture);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0); expect(errors).toEqual([]);
});
