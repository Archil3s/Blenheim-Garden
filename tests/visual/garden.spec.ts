import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { fixture } from "./helpers/fixture";

type Plan = typeof fixture;
const liveKey = "blenheim-garden-live-plan";
const readPlan = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), liveKey) as Promise<Plan>;

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true, animations: "disabled" });
  const layout = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().toJSON();
    return { viewport: { width: innerWidth, height: innerHeight }, document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }, canvas: rect(".garden-canvas"), inspector: rect(".gv-context"), toolbar: rect(".gv-quickbar"), horizontalOverflow: document.documentElement.scrollWidth - innerWidth };
  });
  await testInfo.attach(`${name}-layout`, { body: JSON.stringify(layout, null, 2), contentType: "application/json" });
  expect(layout.horizontalOverflow).toBeLessThanOrEqual(1);
}

async function openMore(page: Page, label: string) {
  await page.locator(".gv-more summary").click();
  await page.locator(".gv-more-panel").getByRole("button", { name: label, exact: true }).click();
}

async function selectTool(page: Page, label: string) {
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: new RegExp(`^${label}$`) }) }).click();
}

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const diagnostics: string[] = [];
  errors.set(page, diagnostics);
  page.on("pageerror", (error) => diagnostics.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") diagnostics.push(message.text()); });
  page.on("requestfailed", (request) => { if (!request.failure()?.errorText.includes("ERR_ABORTED")) diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`); });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") {
      const secondary = url.searchParams.get("gardenId") === "test-garden";
      return route.fulfill({ json: { ok: true, plan: secondary ? { beds: [], plantingAreas: [], rows: [], objects: [] } : fixture } });
    }
    if (url.pathname === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }, { id: "test-garden", name: "Test Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, scope: "garden", beds: [], items: [], notes: [], harvests: [], usage: { fileCount: 0, totalBytes: 0 } } });
  });
  await page.clock.setFixedTime(new Date("2026-09-14T00:00:00Z"));
  await page.goto("/");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("browser-errors", { body: JSON.stringify(errors.get(page)), contentType: "application/json" });
  expect(errors.get(page)).toEqual([]);
});

test("garden fits; counts remain intact through selection and zoom", async ({ page }, testInfo) => {
  await expect(page.locator(".gv-context")).toHaveCount(0);
  await expect(page.locator(".plan-bed")).toHaveCount(12);
  await expect(page.locator(".planting-area-label").filter({ hasText: "King Purple" })).toContainText("×70");
  const beds = await page.locator(".plan-bed").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
  for (const bed of beds) {
    expect(bed.x).toBeGreaterThanOrEqual(0);
    expect(bed.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(bed.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  await capture(page, testInfo, "overview");
  await page.getByRole("button", { name: /^Bed 9,/ }).click();
  await expect(page.locator(".gv-context")).toBeVisible();
  await expect(page.locator(".gv-selection-hero h2")).toHaveText("Bed 9");
  await expect(page.locator(".gv-planting-summary")).toContainText("×70");
  await expect(page.locator(".gv-danger-zone button").first()).not.toBeVisible();
  expect((await page.locator(".gv-selection-panel dl").boundingBox())!.height).toBeGreaterThan(70);
  await capture(page, testInfo, "selected-bed");
  await page.getByRole("button", { name: "Close inspector" }).click();
  for (let i = 0; i < 9; i++) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  expect(await page.locator(".planting-area-icons i").count()).toBeGreaterThan(50);
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(page.locator(".planting-area:not(.is-overview)")).toHaveCount(0);
  expect((await readPlan(page)).plantingAreas).toEqual(fixture.plantingAreas);
});

test("records, photos, rotation, Today and drawing tools remain reachable", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.locator(".gv-season-drawer")).toBeVisible();
  await expect(page.locator(".gv-season-drawer")).toContainText("forecast");
  await capture(page, testInfo, "today");
  await page.locator(".gv-season-drawer").getByRole("button", { name: "Close", exact: true }).click();
  for (const label of ["Notes", "Photos", "Rotation", "Settings"]) {
    await openMore(page, label);
    const dialog = page.getByRole("dialog").filter({ visible: true });
    await expect(dialog).toBeVisible();
    const rect = await dialog.boundingBox();
    expect(rect!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await capture(page, testInfo, label.toLowerCase());
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  for (const label of ["Plants", "Rows", "Bed", "Path", "Trellis", "Structures", "Tree", "Text", "Select"]) {
    await selectTool(page, label);
    await expect(page.locator(".gv-context")).toBeVisible();
    if (label === "Plants") {
      await page.locator(".gv-plant-list > button").filter({ hasText: "Bean" }).click();
      await expect(page.locator(".gv-ready-strip")).toContainText("King Purple");
      await capture(page, testInfo, "plants");
    }
    if (label === "Structures") {
      await expect(page.locator(".gv-structure-list > button")).toHaveCount(36);
      await expect(page.locator(".gv-structure-ready")).toContainText("Greenhouse");
      await expect(page.locator(".gv-structure-list")).toContainText("Bent cattle panel arch");
      await expect(page.locator(".gv-structure-list")).toContainText("Garden pot");
      await expect(page.locator(".gv-structure-list")).toContainText("Timber raised bed");
      await capture(page, testInfo, "structures-catalogue");
    }
    await page.getByRole("button", { name: "Close inspector" }).click();
  }
});

test("expanded structure presets place, edit and flow into the live plan", async ({ page }, testInfo) => {
  await selectTool(page, "Structures");
  await page.locator(".gv-structure-list > button").filter({ hasText: "Bent cattle panel arch" }).click();
  await expect(page.locator(".gv-structure-ready")).toContainText("Bent cattle panel arch");
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  await page.mouse.click(canvas.x + canvas.width * 0.3, canvas.y + canvas.height * 0.35);
  const arch = page.locator('.structure-object[data-kind="cattle-panel-arch"]');
  await expect(arch).toHaveCount(1);
  await expect(page.locator(".gv-selection-hero h2")).toHaveText("Bent cattle panel arch");
  await page.getByLabel("Rotation", { exact: true }).fill("90");
  await expect(arch).toHaveCSS("transform", /matrix/);
  const live = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), liveKey) as { objects: Array<Record<string, unknown>> };
  expect(live.objects.some((object) => object.type === "structure" && object.kind === "cattle-panel-arch" && object.rotationDeg === 90)).toBeTruthy();
  await capture(page, testInfo, "structure-cattle-panel-arch");
});

test("move, undo, redo, snap and named-garden isolation", async ({ page }) => {
  const original = await readPlan(page);
  const box = (await page.locator(".tree-object").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 15, { steps: 8 });
  await page.mouse.up();
  const moved = await readPlan(page);
  expect(moved.objects).not.toEqual(original.objects);
  await page.locator('button[title^="Undo"]').click();
  expect((await readPlan(page)).objects).toEqual(original.objects);
  await page.locator('button[title^="Redo"]').click();
  expect((await readPlan(page)).objects).toEqual(moved.objects);
  await page.locator('button[title^="Undo"]').click();
  const snap = page.locator(".gv-quick-actions > button").last();
  await snap.click();
  await expect(snap).not.toHaveClass("active");
  await snap.click();
  await expect(snap).toHaveClass("active");
  await page.locator(".gv-plan-name").click();
  await page.locator(".garden-manager-item").filter({ hasText: "Test Garden" }).click();
  await expect(page.locator(".gv-plan-name")).toContainText("TEST GARDEN");
  await expect(page.locator(".plan-bed")).toHaveCount(0);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), liveKey)).toEqual(original);
  await page.locator(".gv-plan-name").click();
  await page.locator(".garden-manager-item").filter({ hasText: "Blenheim Garden" }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(12);
});

test("save reports local-only, failure, in-flight and successful states", async ({ page }) => {
  await page.getByRole("button", { name: /^Bed 1,/ }).press("Enter");
  await page.locator(".gv-edit-section summary").click();
  await page.locator(".gv-edit-section").getByLabel("Name", { exact: true }).fill("Test bed");
  await expect(page.locator(".gv-cloud-state")).toContainText("Unsaved");
  await page.locator(".gv-save").click();
  await expect(page.locator(".gv-save")).toHaveText("Local only");
  await page.evaluate(() => sessionStorage.setItem("blenheim-garden-edit-key", "test-only-not-a-secret"));
  let succeed = false;
  await page.route("**/api/garden?*", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    if (!succeed) return route.fulfill({ json: { ok: false, error: "Test rejection" } });
    await new Promise((resolve) => setTimeout(resolve, 250));
    return route.fulfill({ json: { ok: true } });
  });
  await page.locator(".gv-save").click();
  await expect(page.locator(".gv-save")).toHaveText("Save failed");
  succeed = true;
  await page.locator(".gv-save").click();
  await expect(page.locator(".gv-save")).toHaveText("Saving…");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await expect(page.locator(".gv-cloud-state")).toHaveText("Saved");
});

test("live 3D renders and returns to the planner", async ({ page }, testInfo) => {
  await page.goto("/3d");
  await expect(page.locator('[aria-label="Visual 3D garden canvas"] canvas')).toBeVisible();
  await expect(page.getByText("WebGL could not start", { exact: false })).toHaveCount(0);
  await capture(page, testInfo, "3d");
  await page.getByRole("link", { name: "← 2D Plan" }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(12);
});
