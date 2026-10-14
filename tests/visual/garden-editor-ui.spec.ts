import { expect, test, type Page, type TestInfo } from "@playwright/test";

import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { editorAction, openInspectorMore } from "./helpers/editor-controls";

const fixture: PlannerPlan = { beds: [{ id: 1, name: "Salad bed", x: 22, y: 35, w: 27, h: 20 }], plantingAreas: [{ id: "lettuce", bedId: 1, crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 28, count: 2, x: 0, y: 0, w: 100, h: 100, pattern: "grid", iconSize: 16, visualSpacing: "normal", placements: [{ id: "a", x: 25, y: 25 }, { id: "b", x: 75, y: 75 }] }], rows: [], objects: [] };
const plan = (page: Page): Promise<PlannerPlan> => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!));
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, context }) => {
  const list: string[] = []; errors.set(page, list); page.on("pageerror", (e) => list.push(e.message)); page.on("console", (m) => { if (m.type() === "error") list.push(m.text()); });
  let saved = structuredClone(fixture);
  await context.route("**/api/**", (r) => { if (new URL(r.request().url()).pathname === "/api/garden") { if (r.request().method() === "PUT") { expect(r.request().headers().authorization).toBe("Bearer fixture-only"); saved = r.request().postDataJSON().plan; } return r.fulfill({ json: { ok: true, plan: saved } }); } return r.fulfill({ json: { ok: true, gardens: [], history: [] } }); });
  await page.addInitScript((p) => { sessionStorage.setItem("blenheim-garden-edit-key", "fixture-only"); if (!localStorage.getItem("blenheim-garden-live-plan")) localStorage.setItem("blenheim-garden-live-plan", JSON.stringify(p)); }, fixture);
  await page.goto("/3d?view=3d"); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-plant-count", "2");
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1); });
async function selectBed(page: Page) { await editorAction(page, "Objects"); const d = page.getByRole("dialog", { name: "Select garden objects" }); await d.getByLabel("Find an object").fill("Salad bed"); await d.locator(".garden-object-list button").first().click(); await d.getByRole("button", { name: "Done", exact: true }).click(); }
async function shot(page: Page, info: TestInfo, name: string) { await page.screenshot({ path: info.outputPath(name + ".png"), fullPage: true }); }

test("four modes expose relevant tools and navigation protects the plan", async ({ page }, info) => {
  const modes = page.getByRole("navigation", { name: "Garden editing modes" }); await expect(modes.getByRole("button")).toHaveCount(4);
  await modes.getByRole("button", { name: "Build", exact: true }).click(); await expect(page.getByRole("toolbar", { name: "Build tools", exact: true })).toBeVisible(); await expect(page.getByRole("button", { name: "Add plant", exact: true })).toHaveCount(0);
  await modes.getByRole("button", { name: "Plant", exact: true }).click(); await expect(page.getByRole("button", { name: "Add row", exact: true })).toBeVisible(); await modes.getByRole("button", { name: "Select", exact: true }).click();
  await selectBed(page); await page.getByRole("button", { name: "Navigate", exact: true }).click(); const c = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'); await expect(c).toHaveAttribute("data-resize-handles", "0");
  const rect = (await c.boundingBox())!, before = await c.getAttribute("data-camera"); await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .5); await page.mouse.down(); await page.mouse.move(rect.x + rect.width * .65, rect.y + rect.height * .6, { steps: 10 }); await page.mouse.up(); await expect.poll(() => c.getAttribute("data-camera")).not.toBe(before); await page.keyboard.press("Delete"); expect(await plan(page)).toEqual(fixture);
  await shot(page, info, "navigate"); await page.getByRole("button", { name: "Edit", exact: true }).click(); await expect(page.locator(".garden-edit-inspector")).toBeVisible();
});
test("selection sheet keeps primary actions visible and details editable with undo and protected save", async ({ page }, info) => {
  await selectBed(page); const panel = page.locator(".garden-edit-inspector"); for (const name of ["Plant here", "Move selected", "Duplicate selected", "Lock selected"]) await expect(panel.getByRole("button", { name, exact: true })).toBeVisible();
  await expect(panel.getByLabel("Width (cm)", { exact: true })).toBeHidden(); await shot(page, info, "selection-sheet");
  if (info.project.name === "phone") { const b = (await panel.boundingBox())!, c = (await page.locator('[aria-label="Interactive 3D garden workspace"] canvas').boundingBox())!; expect(c.y + c.height).toBeLessThanOrEqual(b.y); expect(b.width).toBeGreaterThan(350); }
  await openInspectorMore(page); await panel.getByLabel("Width (cm)", { exact: true }).fill("260"); await panel.getByLabel("Width (cm)", { exact: true }).press("Enter"); await expect(page.locator(".garden-save-state")).toHaveText("Unsaved changes"); await expect(page.getByRole("region", { name: "Garden action" })).toContainText("Garden updated");
  expect((await plan(page)).plantingAreas).toEqual(fixture.plantingAreas); await page.getByRole("button", { name: "Undo last action", exact: true }).click(); expect(await plan(page)).toEqual(fixture);
  await openInspectorMore(page); await panel.getByLabel("Width (cm)", { exact: true }).fill("260"); await panel.getByLabel("Width (cm)", { exact: true }).press("Enter"); await page.getByRole("button", { name: "Save", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Saved to cloud"); const saved = await plan(page); await page.reload(); await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-plant-count", "2"); expect(await plan(page)).toEqual(saved);
});
test("add picker remembers favourites and recent choices without spawning anything", async ({ page }, info) => {
  await page.getByRole("button", { name: "Add to garden", exact: true }).click(); let d = page.getByRole("dialog", { name: "Add to garden", exact: true }); await d.getByRole("searchbox").fill("Lettuce"); await d.getByRole("button", { name: "Favourite Lettuce", exact: true }).click(); await d.getByRole("button", { name: "Choose Lettuce", exact: true }).click(); expect(await plan(page)).toEqual(fixture);
  await page.getByRole("button", { name: "Add to garden", exact: true }).click(); d = page.getByRole("dialog", { name: "Add to garden", exact: true }); await d.getByRole("button", { name: "Favourites", exact: true }).click(); await expect(d.getByRole("button", { name: "Choose Lettuce", exact: true })).toBeVisible(); await shot(page, info, "add-favourites"); await d.getByRole("button", { name: "Recent", exact: true }).click(); await expect(d.getByRole("button", { name: "Choose Lettuce", exact: true })).toBeVisible(); await d.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload(); await page.getByRole("button", { name: "Add to garden", exact: true }).click(); d = page.getByRole("dialog", { name: "Add to garden", exact: true }); await d.getByRole("button", { name: "Favourites", exact: true }).click(); await expect(d.getByRole("button", { name: "Choose Lettuce", exact: true })).toBeVisible(); await d.getByRole("button", { name: "Close", exact: true }).click(); expect(await plan(page)).toEqual(fixture);
});
test("bed labels show crops and north compass resets an orbited view", async ({ page }, info) => {
  await page.locator(".garden-editor-modes").getByRole("button", { name: "View", exact: true }).click(); await expect(page.getByRole("button", { name: "Navigate", exact: true })).toHaveAttribute("aria-pressed", "true"); await page.getByLabel("Show bed labels", { exact: true }).check(); await page.getByRole("button", { name: "Top", exact: true }).click(); await page.getByRole("button", { name: "Fit garden", exact: true }).click(); const label = page.locator(".garden-bed-caption").filter({ hasText: "Salad bed" }); await expect(label).toBeVisible(); await expect(label).toContainText("Lettuce"); await shot(page, info, "labels-and-compass");
  const c = page.locator('[aria-label="Interactive 3D garden workspace"] canvas'), before = JSON.parse((await c.getAttribute("data-camera"))!); await page.getByRole("button", { name: "Reset garden view", exact: true }).click(); await expect.poll(async () => JSON.parse((await c.getAttribute("data-camera"))!).world[13]).not.toBe(before.world[13]);
  await label.click(); await expect(page.locator(".garden-edit-inspector")).toContainText("Salad bed"); expect(await plan(page)).toEqual(fixture);
});
test("pixel navigation and editing use the same mode protections", async ({ page }, info) => {
  await page.getByRole("button", { name: "Pixel garden", exact: true }).click(); const c = page.locator(".garden-pixel-canvas canvas"); await expect(c).toHaveAttribute("data-pixel-ready", "true"); await selectBed(page); await page.getByRole("button", { name: "Navigate", exact: true }).click(); await page.keyboard.press("Delete"); expect(await plan(page)).toEqual(fixture); await page.getByRole("button", { name: "Edit", exact: true }).click(); await expect(page.locator(".garden-edit-inspector")).toBeVisible(); await shot(page, info, "pixel-sheet");
});
