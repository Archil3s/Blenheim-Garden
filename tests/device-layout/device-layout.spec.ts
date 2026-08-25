import { expect, test } from "@playwright/test";

const plan = {
  beds: [{ id: 1, name: "Test Bed", x: 12, y: 12, w: 36, h: 18 }],
  plantingAreas: [],
  rows: [],
  objects: [],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, source: "d1", plan }),
    });
  });
});

test("planner can switch and persist mobile and desktop layouts", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const app = page.locator(".gv-app");
  const mobileButton = page.getByRole("button", { name: "📱 Mobile" });
  const desktopButton = page.getByRole("button", { name: "🖥 Desktop" });

  await expect(mobileButton).toBeVisible();
  await expect(desktopButton).toBeVisible();

  if (testInfo.project.name === "mobile") {
    await expect(app).toHaveClass(/gv-device-mobile/);
    const context = page.locator(".gv-context");
    const contextBox = await context.boundingBox();
    expect(contextBox).not.toBeNull();
    expect(contextBox!.x).toBeGreaterThanOrEqual(50);
    expect(contextBox!.y).toBeGreaterThan(300);
  }

  await desktopButton.click();
  await expect(app).toHaveClass(/gv-device-desktop/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeGreaterThanOrEqual(1180);
  await expect(desktopButton).toHaveAttribute("aria-pressed", "true");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".gv-app")).toHaveClass(/gv-device-desktop/);

  await page.getByRole("button", { name: "📱 Mobile" }).click();
  await expect(page.locator(".gv-app")).toHaveClass(/gv-device-mobile/);
  await expect(page.getByRole("button", { name: "📱 Mobile" })).toHaveAttribute("aria-pressed", "true");

  const contextBox = await page.locator(".gv-context").boundingBox();
  const stageBox = await page.locator(".gv-stage").boundingBox();
  expect(contextBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(contextBox!.x).toBeGreaterThanOrEqual(50);
  expect(stageBox!.x).toBeGreaterThanOrEqual(50);

  await page.screenshot({ path: `test-results/device-layout-${testInfo.project.name}.png`, fullPage: true });
});
