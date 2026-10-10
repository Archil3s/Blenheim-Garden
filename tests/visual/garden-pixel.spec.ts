import { expect, test, type Page } from "@playwright/test";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { plants } from "../../lib/garden/plant-catalog";
import { LIVE_PLAN_EVENT } from "../../lib/garden/active-garden";

const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
const cropNames = ["Tomato", "Bean", "Lettuce", "Pumpkin", "Carrot", "Broccoli", "Raspberry", "Strawberry", "Asparagus", "Artichoke", "Amaranth", "Herbs"];
const fixture: PlannerPlan = {
  beds: cropNames.map((name, i) => ({ id: i + 1, name, x: 10 + i % 3 * 28, y: 17 + Math.floor(i / 3) * 18, w: 23, h: 14 })),
  plantingAreas: cropNames.map((name, i) => {
    const plant = plants.find((p) => p.name === name)!;
    return { id: `area-${i}`, bedId: i + 1, crop: name, cropIcon: plant.icon, variety: plant.varieties[0], spacingCm: plant.spacingCm, x: 0, y: 0, w: 100, h: 100, count: 6, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: Array.from({ length: 6 }, (_, j) => ({ id: `plant-${i}-${j}`, x: 20 + j % 3 * 30, y: 40 + Math.floor(j / 3) * 40 })) };
  }),
  rows: [{ id: "berry-border", crop: "Blueberry", cropIcon: "", variety: "Southern Highbush", spacingCm: 120, x1: 200, y1: 990, x2: 700, y2: 990, count: 5 }],
  objects: [{ id: "north-path", type: "path", x1: 80, y1: 115, x2: 820, y2: 115, widthCm: 40, label: "North path" }, { id: "shed", type: "structure", kind: "shed", x: 760, y: 65, widthCm: 120, depthCm: 100, heightCm: 160, rotationDeg: 0, label: "Tool shed" }, { id: "tree", type: "tree", x: 120, y: 80, diameterCm: 120, label: "Apple tree" }],
};
const pixelCanvas = (page: Page) => page.locator('.garden-pixel-canvas canvas');
async function livePlan(page: Page): Promise<PlannerPlan> { return page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!)); }
async function screenPoint(page: Page, x: number, y: number) {
  const canvas = pixelCanvas(page), box = (await canvas.boundingBox())!;
  const v = JSON.parse((await canvas.getAttribute("data-pixel-view"))!);
  return { x: box.x + (v.x + (x - 450) * v.scale) * box.width / v.width, y: box.y + (v.y + (y - 540) * v.scale * v.tilt) * box.height / v.height };
}
async function clickWorld(page: Page, x: number, y: number, touch = false) { const p = await screenPoint(page, x, y); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }

test("pixel garden mirrors measured crops, zooms, pans and keeps the detailed view", async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [], modelRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message)); page.on("request", (r) => { if (/\.glb(?:\?|$)/.test(r.url())) modelRequests.push(r.url()); });
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Garden", year: 2026 }], items: [], beds: [] } }));
  await page.goto("/3d");
  const canvas = pixelCanvas(page);
  await expect(canvas).toHaveAttribute("data-pixel-ready", "true");
  await expect(canvas).toHaveAttribute("data-pixel-art", "detailed");
  await expect(canvas).toHaveAttribute("data-pixel-crops", [...cropNames, "Blueberry"].sort().join("|"));
  await expect(page.getByRole("button", { name: "Pixel garden", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(modelRequests).toEqual([]);
  await page.screenshot({ path: info.outputPath("pixel-garden.png") });
  const initial = JSON.parse((await canvas.getAttribute("data-pixel-view"))!);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-pixel-view"))!).scale).toBeGreaterThan(initial.scale);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click({ clickCount: 3 });
  await page.screenshot({ path: info.outputPath("pixel-garden-detail.png") });
  if (info.project.name === "phone") {
    const session = await context.newCDPSession(page), box = (await canvas.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const before = JSON.parse((await canvas.getAttribute("data-pixel-view"))!).scale;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 25, y, id: 1 }, { x: x + 25, y, id: 2 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 55, y, id: 1 }, { x: x + 55, y, id: 2 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-pixel-view"))!).scale).toBeGreaterThan(before);
    await session.detach();
  }
  const beforePan = JSON.parse((await canvas.getAttribute("data-pixel-view"))!);
  const p = await screenPoint(page, 450, 540); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 35, p.y + 25, { steps: 4 }); await page.mouse.up();
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-pixel-view"))!).x).not.toBe(beforePan.x);
  await page.getByRole("button", { name: "Fit garden", exact: true }).click();
  await expect.poll(async () => JSON.parse((await canvas.getAttribute("data-pixel-view"))!).scale).toBeCloseTo(initial.scale);
  const beforeLive = await canvas.getAttribute("data-pixel-view");
  const updated = { ...fixture, rows: [...fixture.rows, { ...fixture.rows[0], id: "herb-border", crop: "Basil", variety: "Compact", y1: 140, y2: 140 }] };
  await page.evaluate(({ event, plan }) => window.dispatchEvent(new CustomEvent(event, { detail: { gardenId: "blenheim-garden", plan } })), { event: LIVE_PLAN_EVENT, plan: updated });
  await expect(canvas).toHaveAttribute("data-pixel-crops", [...cropNames, "Blueberry", "Basil"].sort().join("|"));
  expect(await canvas.getAttribute("data-pixel-view")).toBe(beforeLive);
  await page.getByRole("button", { name: "Detailed 3D", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
  await page.getByRole("button", { name: "Pixel garden", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-pixel-crops", [...cropNames, "Blueberry", "Basil"].sort().join("|"));
  await expect(page.getByRole("button", { name: "Select", exact: true })).toBeEnabled();
  await page.goto("/"); await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(pixelCanvas(page)).toHaveAttribute("data-pixel-crops", [...cropNames, "Blueberry"].sort().join("|"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("pixel artwork failure keeps the garden usable and retry preserves its viewpoint", async ({ page, context }, info) => {
  let fail = true;
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [], beds: [] } }));
  await context.route("**/artwork/pixel-garden/crops-v1.webp", (route) => fail ? route.abort() : route.continue());
  await page.goto("/3d");
  const canvas = pixelCanvas(page);
  await expect(canvas).toHaveAttribute("data-pixel-ready", "true");
  await expect(canvas).toHaveAttribute("data-pixel-art", "fallback");
  await expect(page.getByRole("button", { name: "Retry artwork", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const view = await canvas.getAttribute("data-pixel-view");
  fail = false;
  await page.getByRole("button", { name: "Retry artwork", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-pixel-art", "detailed");
  await expect(page.getByRole("button", { name: "Retry artwork", exact: true })).toHaveCount(0);
  expect(await canvas.getAttribute("data-pixel-view")).toBe(view);
  await page.screenshot({ path: info.outputPath("pixel-art-recovered.png") });
});

test("pixel editing preserves centimetres, drag history, cloud save and refresh", async ({ page, context }, info) => {
  let saved = structuredClone(empty), writes = 0;
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await context.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname === "/api/garden" && route.request().method() === "PUT") { saved = route.request().postDataJSON().plan; writes++; }
    return route.fulfill({ json: { ok: true, plan: saved, gardens: [{ id: "blenheim-garden", name: "Garden", year: 2026 }], items: [], beds: [] } });
  });
  await page.goto("/3d"); await expect(pixelCanvas(page)).toHaveAttribute("data-pixel-ready", "true");
  const touch = info.project.name === "phone";
  await page.getByRole("button", { name: "Add bed", exact: true }).click(); await clickWorld(page, 450, 540, touch);
  await expect.poll(async () => (await livePlan(page)).beds.length).toBe(1);
  const bed = (await livePlan(page)).beds[0]; expect(bed.x * 9).toBeCloseTo(390); expect(bed.y * 10.8).toBeCloseTo(420); expect(bed.w * 9).toBeCloseTo(120); expect(bed.h * 10.8).toBeCloseTo(240);
  await page.getByRole("button", { name: "Add plant", exact: true }).click(); await clickWorld(page, 450, 540, touch);
  await expect.poll(async () => (await livePlan(page)).plantingAreas.length).toBe(1);
  await page.getByRole("button", { name: "Select", exact: true }).click(); await clickWorld(page, 450, 540, touch);
  const inspector = page.locator(".garden-edit-inspector"); await expect(inspector).toContainText("Individual plant");
  await inspector.getByLabel("X (cm)", { exact: true }).fill("460"); await inspector.getByLabel("X (cm)", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Duplicate", exact: true }).click(); await expect.poll(async () => (await livePlan(page)).plantingAreas[0].count).toBe(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); await expect.poll(async () => (await livePlan(page)).plantingAreas[0].count).toBe(1);
  await page.getByRole("button", { name: "Redo", exact: true }).click(); await expect.poll(async () => (await livePlan(page)).plantingAreas[0].count).toBe(2);
  await page.getByRole("button", { name: "Move", exact: true }).click(); await inspector.locator("summary").click();
  const a = await screenPoint(page, 460, 540), b = await screenPoint(page, 480, 540); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 5 }); await page.mouse.up();
  await expect.poll(async () => (await livePlan(page)).plantingAreas[0].placements!.some((p) => p.x > 70)).toBe(true);
  await page.getByRole("button", { name: "Select", exact: true }).click(); await page.getByRole("button", { name: "Add path", exact: true }).click(); await clickWorld(page, 250, 700, touch); await page.keyboard.press("Escape");
  expect((await livePlan(page)).objects).toHaveLength(0);
  await page.getByRole("button", { name: "Add path", exact: true }).click(); await clickWorld(page, 250, 700, touch); await clickWorld(page, 250, 800, touch);
  await expect.poll(async () => (await livePlan(page)).objects.length).toBe(1);
  await page.getByRole("button", { name: "Add plant", exact: true }).click(); await clickWorld(page, 250, 750, touch);
  await expect(page.locator(".garden-edit-status")).toContainText("away from paths and structures");
  expect((await livePlan(page)).plantingAreas).toHaveLength(1); expect((await livePlan(page)).rows).toHaveLength(0);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: "Edit key", exact: true }).click(); await page.getByLabel("Garden edit key", { exact: true }).fill("test-key"); await page.getByRole("button", { name: "Set key", exact: true }).click(); await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".garden-edit-status")).toContainText("Saved to cloud"); expect(writes).toBe(1);
  const before = await livePlan(page); await page.reload(); await expect(pixelCanvas(page)).toHaveAttribute("data-pixel-crops", "Tomato"); expect(await livePlan(page)).toEqual(before);
  await page.screenshot({ path: info.outputPath("pixel-editor.png") });
  expect(errors).toEqual([]);
});
