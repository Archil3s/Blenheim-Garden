import { expect, test } from "@playwright/test";

const empty = { beds: [], plantingAreas: [], rows: [], objects: [] };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ json: { ok: true, plan: empty, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
});

test("wheel zoom anchors the cursor, pan leaves the plan unchanged and Fit restores the view", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const canvas = page.locator(".garden-canvas");
  const initial = (await canvas.boundingBox())!;
  const x = initial.x + initial.width * .45, y = initial.y + initial.height * .4;
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(initial.width);
  const zoomed = (await canvas.boundingBox())!;
  expect(Math.abs(zoomed.x + zoomed.width * .45 - x)).toBeLessThan(3);
  expect(Math.abs(zoomed.y + zoomed.height * .4 - y)).toBeLessThan(3);
  await page.keyboard.down("Space");
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 30, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.up("Space");
  const panned = (await canvas.boundingBox())!;
  expect(panned.x - zoomed.x).toBeCloseTo(40, 0);
  expect(panned.y - zoomed.y).toBeCloseTo(30, 0);
  await expect(page.locator(".plan-bed,.planting-area,.planting-row,.layout-object")).toHaveCount(0);
  await page.getByRole("button", { name: /^Fit garden/ }).click();
  await expect.poll(async () => Math.round((await canvas.boundingBox())!.width)).toBe(Math.round(initial.width));
  const fitted = (await canvas.boundingBox())!;
  expect(Math.abs(fitted.x - initial.x)).toBeLessThan(3);
  expect(Math.abs(fitted.y - initial.y)).toBeLessThan(3);
  await page.screenshot({ path: info.outputPath("friendly-navigation.png") });
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Select$/ }) }).click();
  await expect(page.getByRole("heading", { name: "What would you like to add?" })).toBeVisible();
  await expect(page.locator(".gv-advanced-layout-toggle")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("actionable-selection-tools.png") });
  expect(errors).toEqual([]);
});

test("named blank gardens offer a starter bed and catalogues without reference decorations", async ({ page }, info) => {
  await page.goto("/planner?gardenId=blank-navigation-test");
  await expect(page.getByRole("heading", { name: "Start your garden" })).toBeVisible();
  await expect(page.locator(".berry-strip,.north-zone")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("blank-garden-start.png") });
  await page.getByRole("button", { name: "Add a 1.2 × 2.4 m bed" }).click();
  await expect(page.locator(".plan-bed")).toHaveCount(1);
  await expect(page.locator(".gv-stage > .planner-start-panel")).toHaveCount(0);
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await page.getByPlaceholder("Plant or variety").fill("Zucchini");
  await expect(page.locator('.gv-plant-list > button[data-crop="Zucchini"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("full-plant-catalogue.png") });
});

test("two-finger pinch cancels drawing and keyboard shortcuts reset zoom", async ({ page, context }) => {
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const canvas = page.locator(".garden-canvas");
  const rect = (await canvas.boundingBox())!;
  const stage = (await page.locator(".gv-stage-scroll").boundingBox())!;
  const x = Math.max(stage.x + 50, rect.x + rect.width / 2), y = stage.y + stage.height / 2;
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Bed$/ }) }).click();
  await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 25, y, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 25, y, id: 1 }, { x: x + 25, y, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 55, y, id: 1 }, { x: x + 55, y, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(rect.width);
  await expect(page.locator(".plan-bed,.planting-area,.planting-row,.layout-object")).toHaveCount(0);
  await page.getByRole("button", { name: /^Fit garden/ }).click();
  await page.mouse.move(x, y);
  await page.keyboard.press("+");
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(rect.width);
  await page.keyboard.press("0");
  await expect.poll(async () => Math.round((await canvas.boundingBox())!.width)).toBe(Math.round(rect.width));
});

test("blank garden creation uses the inline edit key and retains its own identity", async ({ page }, info) => {
  let creates = 0;
  await page.route("**/api/gardens", async route => {
    if (route.request().method() === "POST") {
      creates++;
      expect(route.request().headers().authorization).toBe("Bearer browser-test-key");
      expect(route.request().postDataJSON()).toEqual({ name: "New vegetable garden" });
      return route.fulfill({ status: 201, json: { ok: true, garden: { id: "created-blank", name: "New vegetable garden", year: 2026 } } });
    }
    return route.fulfill({ json: { ok: true, gardens: [] } });
  });
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-plan-name").click();
  const dialog = page.getByRole("dialog", { name: "Choose a garden" });
  await dialog.getByLabel("New garden", { exact: true }).fill("New vegetable garden");
  await dialog.getByLabel("Edit key", { exact: true }).fill("browser-test-key");
  await page.screenshot({ path: info.outputPath("create-blank-garden.png") });
  await dialog.getByRole("button", { name: /Create blank garden/ }).click();
  await expect(page.getByRole("heading", { name: "Start your garden" })).toBeVisible();
  expect(creates).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("blenheim-garden-active-id"))).toBe("created-blank");
  await expect(page.locator(".berry-strip,.north-zone,.plan-bed")).toHaveCount(0);
  await page.getByRole("button", { name: "Browse objects & structures" }).click();
  await expect(page.getByLabel("Object category", { exact: true })).toBeVisible();
  const categories = page.getByLabel("Object category", { exact: true });
  const category = await categories.locator("option").nth(1).getAttribute("value");
  await categories.selectOption(category!);
  await expect(page.locator(".reference-object-group")).toHaveCount(1);
  await expect(page.locator(".reference-object-group")).toHaveAttribute("open", "");
  await page.screenshot({ path: info.outputPath("object-category.png") });
});
