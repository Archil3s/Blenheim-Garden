import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { fixture } from "./helpers/fixture";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { cropsInBox, deleteSelectedCrops, resizeBedRect, selectCrops } from "../../lib/garden/planner-selection";

const liveKey = "blenheim-garden-live-plan";
const plan: PlannerPlan = { ...fixture, rows: [
  { id: "raised-tomatoes", surfaceId: "object:raised", crop: "Tomato", cropIcon: "T", variety: "Roma", count: 2, spacingCm: 50, x1: 250, y1: 350, x2: 250, y2: 350, placements: [{ id: "r1", x: -30, y: 0 }, { id: "r2", x: 30, y: 0 }] },
  { id: "basil", crop: "Basil", cropIcon: "B", variety: "Compact", count: 3, spacingCm: 20, x1: 100, y1: 440, x2: 160, y2: 440 },
], objects: [...fixture.objects, { id: "raised", type: "structure", kind: "raised-bed-timber", x: 250, y: 350, widthCm: 180, depthCm: 100, heightCm: 45, rotationDeg: 30, label: "Raised test bed" }] };

const readPlan = (page: Page): Promise<PlannerPlan> => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), liveKey);
async function capture(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: "disabled" });
  const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, canvas: document.querySelector(".garden-canvas")?.getBoundingClientRect().toJSON(), controls: document.querySelector(".gv-buildbar")?.getBoundingClientRect().toJSON() }));
  await info.attach(`${name}-geometry`, { body: JSON.stringify(geometry), contentType: "application/json" });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
}
async function drag(page: Page, info: TestInfo, start: { x: number; y: number }, end: { x: number; y: number }) {
  if (info.project.name === "phone") {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...start, id: 1 }] });
    for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x + (end.x - start.x) * i / 8, y: start.y + (end.y - start.y) * i / 8, id: 1 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 }); await page.mouse.up();
  }
}

test("crop selection separates vegetables from fruit and herbs; reverse boxes and edge resize stay measured", () => {
  const selected = selectCrops(plan, true);
  expect(selected).toHaveLength(3);
  const aliases = { ...plan, plantingAreas: [], rows: ["Courgette", "Capsicum", "Raspberry", "Basil", "Unknown crop"].map((crop, i) => ({ ...plan.rows[0], id: String(i), crop })) };
  expect(selectCrops(aliases, true).map((s) => s.id)).toEqual(["0", "1"]);
  const cleared = deleteSelectedCrops(plan, selected);
  expect(cleared.plantingAreas.map((a) => a.crop)).toEqual(["Strawberry", "Strawberry"]);
  expect(cleared.rows.map((r) => r.crop)).toEqual(["Basil"]);
  expect(cleared.objects).toEqual(plan.objects); expect(cleared.beds).toEqual(plan.beds);
  expect(cropsInBox(plan, { x: 290, y: 370 }, { x: 210, y: 330 })).toEqual([{ kind: "row", id: "raised-tomatoes" }]);
  expect(resizeBedRect({ x: 100, y: 100, w: 200, h: 100 }, "nw", { x: -57, y: -43 }, { width: 900, height: 1080 })).toEqual({ x: 40, y: 60, w: 260, h: 140 });
  expect(resizeBedRect({ x: 100, y: 100, w: 200, h: 100 }, "se", { x: -800, y: 2000 }, { width: 900, height: 1080 })).toEqual({ x: 100, y: 100, w: 40, h: 980 });
});

const diagnostics = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; diagnostics.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  let persisted = structuredClone(plan);
  await page.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname === "/api/garden") {
      if (route.request().method() === "PUT") persisted = route.request().postDataJSON().plan;
      return route.fulfill({ json: { ok: true, plan: persisted } });
    }
    return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Test garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [], usage: { fileCount: 0, totalBytes: 0 } } });
  });
  await page.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "fixture-only"));
  await page.goto("/"); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
});
test.afterEach(async ({ page }) => expect(diagnostics.get(page)).toEqual([]));

test("select all vegetables, deselect a planting, delete and undo; save remains correct after refresh", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "Select vegetables", exact: true }).click();
  await expect(page.locator(".gv-bulk-actions")).toContainText("82 plants · 3 plantings selected");
  await expect(page.locator(".bulk-selected")).toHaveCount(3);
  await capture(page, testInfo, "vegetables-selected");
  await page.getByRole("checkbox", { name: "Tomato, 10 plants", exact: true }).click();
  await expect(page.locator(".gv-bulk-actions")).toContainText("72 plants · 2 plantings selected");
  await page.getByRole("button", { name: "Select vegetables", exact: true }).click();
  await page.getByRole("button", { name: "Delete selected", exact: true }).click();
  await expect(page.locator(".planting-area[data-crop=Tomato],.planting-area[data-crop=Bean],.planting-row[data-crop=Tomato]")).toHaveCount(0);
  let state = await readPlan(page);
  expect(state.beds).toEqual(plan.beds); expect(state.objects).toEqual(plan.objects);
  expect(state.rows.map((r) => r.crop)).toEqual(["Basil"]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).plantingAreas).toEqual(plan.plantingAreas);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.locator(".gv-save").click(); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.reload(); await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  state = await readPlan(page);
  expect(state.plantingAreas.map((a) => a.crop)).toEqual(["Strawberry", "Strawberry"]);
  expect(state.rows.map((r) => r.crop)).toEqual(["Basil"]);
  await capture(page, testInfo, "vegetables-cleared");
});

test("draw a bed, drag opposite corners to size, and resize with a keyboard", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "＋ Draw bed", exact: true }).click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  const scale = canvas.width / 900;
  await drag(page, testInfo, { x: canvas.x + 50 * scale, y: canvas.y + 240 * scale }, { x: canvas.x + 160 * scale, y: canvas.y + 350 * scale });
  await expect(page.locator(".plan-bed")).toHaveCount(13);
  await expect(page.locator(".plan-bed.selected .gv-bed-handle")).toHaveCount(8);
  let added = (await readPlan(page)).beds.at(-1)!;
  expect(added.w * 9).toBeCloseTo(110); expect(added.h * 10.8).toBeCloseTo(110);
  const resize = page.getByRole("slider", { name: "Resize Bed 13 se", exact: true });
  let handle = (await resize.boundingBox())!;
  await drag(page, testInfo, { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }, { x: handle.x + handle.width / 2 + 60 * scale, y: handle.y + handle.height / 2 + 50 * scale });
  added = (await readPlan(page)).beds.at(-1)!;
  expect(added.w * 9).toBeCloseTo(170); expect(added.h * 10.8).toBeCloseTo(160);
  handle = (await page.getByRole("slider", { name: "Resize Bed 13 nw", exact: true }).boundingBox())!;
  await drag(page, testInfo, { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }, { x: handle.x + handle.width / 2 - 20 * scale, y: handle.y + handle.height / 2 - 20 * scale });
  await resize.press("ArrowRight");
  added = (await readPlan(page)).beds.at(-1)!;
  expect(added.x * 9).toBeCloseTo(30); expect(added.y * 10.8).toBeCloseTo(220);
  expect(added.w * 9).toBeCloseTo(200); expect(added.h * 10.8).toBeCloseTo(180);
  await capture(page, testInfo, "bed-drag-sized");
});

test("box selection and select all plants include raised-bed rows; deletion mirrors into 3D", async ({ page, context }, testInfo) => {
  await page.locator(".gv-buildbar").getByRole("button", { name: "⬚ Box select", exact: true }).click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  const scale = canvas.width / 900;
  await drag(page, testInfo, { x: canvas.x + 310 * scale, y: canvas.y + 380 * scale }, { x: canvas.x + 190 * scale, y: canvas.y + 320 * scale });
  await expect(page.locator(".gv-bulk-actions")).toContainText("2 plants · 1 plantings selected");
  await page.getByRole("button", { name: "Select all plants", exact: true }).click();
  await expect(page.locator(".bulk-selected")).toHaveCount(6);
  await capture(page, testInfo, "all-plants-selected");
  await page.keyboard.press("Delete");
  await expect(page.locator(".planting-area,.planting-row")).toHaveCount(0);
  await expect(page.locator(".plan-bed")).toHaveCount(12);
  const mirror = await context.newPage(); await mirror.goto("/3d?view=3d");
  await expect(mirror.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
  expect((await readPlan(mirror)).plantingAreas).toHaveLength(0); expect((await readPlan(mirror)).rows).toHaveLength(0);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".planting-area,.planting-row")).toHaveCount(6);
  await expect.poll(async () => (await readPlan(mirror)).rows).toEqual(plan.rows);
  await mirror.close();
});

test("rotated raised-bed resize carries its plants and has a reversible history", async ({ page }, testInfo) => {
  await page.locator('[data-kind="raised-bed-timber"]').click();
  await page.getByRole("button", { name: "Close inspector" }).click();
  const original = (await readPlan(page)).objects.find((o) => o.id === "raised")!;
  const canvas = (await page.locator(".garden-canvas").boundingBox())!, scale = canvas.width / 900;
  const handle = (await page.locator('[aria-label="Resize Raised test bed se"]').boundingBox())!;
  await drag(page, testInfo, { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }, { x: handle.x + handle.width / 2 + 20 * scale, y: handle.y + handle.height / 2 + 30 * scale });
  const state = await readPlan(page), changed = state.objects.find((o) => o.id === "raised")!;
  expect(changed).not.toEqual(original);
  expect(state.rows[0].placements).toHaveLength(2);
  expect(state.rows[0].placements).not.toEqual(plan.rows[0].placements);
  expect(state.rows[0].surfaceId).toBe("object:raised");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => (await readPlan(page)).objects).toEqual(plan.objects);
  expect((await readPlan(page)).rows).toEqual(plan.rows);
});

test("keyboard selection and undo restore exactly one bulk operation at a time", async ({ page }) => {
  await page.getByRole("button", { name: "Select vegetables", exact: true }).click();
  await page.keyboard.press("Delete");
  await page.keyboard.press("Control+a");
  await expect(page.locator(".gv-bulk-actions")).toContainText("42 plants · 3 plantings selected");
  await page.keyboard.press("Backspace");
  await expect(page.locator(".planting-area,.planting-row")).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(page.locator(".planting-area,.planting-row")).toHaveCount(3);
  expect((await readPlan(page)).plantingAreas.map((a) => a.crop)).toEqual(["Strawberry", "Strawberry"]);
  await page.keyboard.press("Control+Shift+z");
  await expect(page.locator(".planting-area,.planting-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Escape");
  await expect(page.locator(".bulk-selected")).toHaveCount(0);
  expect((await readPlan(page)).plantingAreas).toHaveLength(2);
});
