import { expect, test } from "@playwright/test";

const plan = {
  beds: [{ id: 99, name: "Tomato test bed", x: 35, y: 35, w: 30, h: 30 }],
  plantingAreas: [{ id: "tomatoes", bedId: 99, crop: "Tomato", variety: "Roma", cropIcon: "", spacingCm: 75, x: 0, y: 0, w: 100, h: 100, count: 9, pattern: "grid", iconSize: 18, visualSpacing: "normal", placements: [20, 50, 80].flatMap((y) => [20, 50, 80].map((x) => ({ id: `plant-${x}-${y}`, x, y }))) }],
  rows: [{ id: "tomato-row", crop: "Tomato", variety: "Beefsteak", cropIcon: "", spacingCm: 60, x1: 350, y1: 800, x2: 550, y2: 800, count: 4 }],
  objects: [],
};

test("refined tomatoes render in beds and rows and remain editable", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  const models: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.ok() && /tomato-(garden|mobile)\.glb/.test(response.url())) models.push(response.url());
  });
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await page.goto("/3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-tomato-model", "refined", { timeout: 60_000 });
  const expectedAsset = testInfo.project.name === "phone" ? "tomato-mobile.glb" : "tomato-garden.glb";
  expect(models.some((url) => url.endsWith(expectedAsset))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("tomato-garden-perspective.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("tomato-garden-top.png") });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Garden canvas missing");
  if (testInfo.project.name === "phone") await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * .488);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height * .488);
  const inspector = page.locator(".garden-edit-inspector");
  await expect(inspector).toContainText("Individual plant");
  await expect(inspector).toContainText("Tomato");
  const x = inspector.getByLabel("X (cm)");
  const previous = Number(await x.inputValue());
  await x.fill(String(previous + 10));
  await x.press("Enter");
  await expect(x).toHaveValue(String(previous + 10));
  const duplicate = page.getByRole("button", { name: "Duplicate", exact: true });
  await duplicate.scrollIntoViewIfNeeded();
  await duplicate.click();
  await expect.poll(() => page.evaluate(() => {
    const entry = Object.entries(localStorage).find(([key]) => key.startsWith("blenheim-garden-live-plan"));
    return entry ? JSON.parse(entry[1]).plantingAreas[0].count : 0;
  })).toBe(10);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const entry = Object.entries(localStorage).find(([key]) => key.startsWith("blenheim-garden-live-plan"));
    return entry ? JSON.parse(entry[1]).plantingAreas[0].count : 0;
  })).toBe(9);
  await expect(canvas).toHaveAttribute("data-tomato-model", "refined");
  expect(errors).toEqual([]);
  await testInfo.attach("diagnostics", { body: JSON.stringify({ errors, models }), contentType: "application/json" });
});

test("tomato asset failure keeps the garden usable and inline 3D loads the model", async ({ page, context }) => {
  test.setTimeout(60_000);
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await context.route("**/models/tomato/*.glb", (route) => route.fulfill({ status: 503, body: "Temporarily unavailable" }));
  await page.goto("/3d");
  await expect(page.getByRole("status").filter({ hasText: "Detailed tomato model" })).toContainText("Basic tomatoes are still available");
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toBeVisible();
  await expect(page.getByRole("button", { name: "Select", exact: true })).toBeEnabled();
  await context.unroute("**/models/tomato/*.glb");
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-tomato-model", "refined", { timeout: 30_000 });
});
