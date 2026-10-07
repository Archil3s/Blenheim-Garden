import { expect, test, type Page } from "@playwright/test";
import * as THREE from "three";
import type { PlannerPlan } from "../../lib/garden/planner-plan";

const key = "blenheim-garden-live-plan";
const fixture: PlannerPlan = {
  beds: [{ id: 1, name: "Editable bed", x: 350 / 9, y: 380 / 10.8, w: 200 / 9, h: 300 / 10.8 }],
  plantingAreas: [{ id: "area", bedId: 1, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "one", x: 25, y: 25 }, { id: "two", x: 75, y: 25 }] }],
  rows: [],
  objects: [{ id: "shed", type: "structure", kind: "shed", x: 650, y: 780, widthCm: 140, depthCm: 120, heightCm: 200, rotationDeg: 0, label: "Editable shed" }],
};

async function readPlan(page: Page): Promise<PlannerPlan> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
}

test("dragging, resizing, rotation and bidirectional live edits", async ({ context, page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Test garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [] } }));
  await page.addInitScript(({ key, fixture }) => localStorage.setItem(key, JSON.stringify(fixture)), { key, fixture });
  await page.goto("/3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await expect(page.locator(".gv-3d-hud-left")).toContainText("1 beds · 1 structures");
  await page.getByRole("button", { name: "Top", exact: true }).click();
  const bounds = (await canvas.boundingBox())!;
  const camera = new THREE.PerspectiveCamera(testInfo.project.name === "phone" ? 42 : 34, bounds.width / bounds.height, .1, 60);
  camera.position.set(0, 16.2, .001); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const screen = (x: number, y: number, height = .31) => {
    const p = new THREE.Vector3(x / 100 - 4.5, height, y / 100 - 5.4).project(camera);
    return { x: bounds.x + (p.x + 1) * bounds.width / 2, y: bounds.y + (1 - p.y) * bounds.height / 2 };
  };
  const tap = async (point: { x: number; y: number }) => {
    if (testInfo.project.name === "phone") await page.touchscreen.tap(point.x, point.y);
    else await page.mouse.click(point.x, point.y);
  };
  await tap(screen(490, 600));
  const inspector = page.locator(".garden-edit-inspector");
  await expect(inspector).toContainText("Editable bed");
  await inspector.getByLabel("Width (cm)", { exact: true }).fill("180");
  await inspector.getByLabel("Width (cm)", { exact: true }).press("Enter");
  await expect.poll(async () => (await readPlan(page)).beds[0].w * 9).toBeCloseTo(180);
  expect((await readPlan(page)).plantingAreas[0].count).toBe(2);
  await page.getByRole("button", { name: "Move", exact: true }).click();
  const beforeDrag = await readPlan(page);
  const start = screen(480, 600), end = screen(530, 650);
  if (testInfo.project.name === "phone") {
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...start, id: 1 }] });
    for (let step = 1; step <= 5; step += 1) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x + (end.x - start.x) * step / 5, y: start.y + (end.y - start.y) * step / 5, id: 1 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 }); await page.mouse.up();
  }
  await expect.poll(async () => (await readPlan(page)).beds[0].x).not.toBe(beforeDrag.beds[0].x);
  const afterDrag = await readPlan(page);
  expect(afterDrag.plantingAreas[0].placements).toEqual(beforeDrag.plantingAreas[0].placements);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).beds[0].x).toBe(beforeDrag.beds[0].x);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).beds[0].x).toBe(afterDrag.beds[0].x);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await tap(screen(650, 780, 2));
  await expect(inspector).toContainText("Editable shed");
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(inspector.getByLabel("Rotation (degrees)")).toHaveValue("15");
  await inspector.getByLabel("Depth (cm)").fill("160"); await inspector.getByLabel("Depth (cm)").press("Enter");
  await expect.poll(async () => (await readPlan(page)).objects[0]).toMatchObject({ rotationDeg: 15, depthCm: 160 });
 const planner = await context.newPage(); await planner.goto("/");
  await expect(planner.locator(".plan-bed")).toHaveCount(1);
  await expect(planner.locator(".has-explicit-placements .planting-area-icons i")).toHaveCount(2);
  await planner.locator(".plan-bed").press("Enter");
  await planner.getByText("Edit bed", { exact: true }).click();
  await planner.getByLabel("Width (cm)", { exact: true }).fill("160");
  await expect.poll(async () => (await readPlan(page)).beds[0].w * 9).toBeCloseTo(160);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const bed = (await readPlan(page)).beds[0];
  await tap(screen(bed.x * 9 + 100, bed.y * 10.8 + 180));
  await expect(inspector.getByLabel("Width (cm)", { exact: true })).toHaveValue("160");
  await planner.evaluate(() => localStorage.setItem("blenheim-garden-live-plan:another-garden", JSON.stringify({ beds: [], plantingAreas: [], rows: [], objects: [] })));
  await expect(page.locator(".gv-3d-hud-left")).toContainText("1 beds");
  await page.screenshot({ path: testInfo.outputPath("3d-transform-inspector.png"), fullPage: true });
  await planner.screenshot({ path: testInfo.outputPath("2d-placement-mirror.png"), fullPage: true });
  expect(errors).toEqual([]);
});
