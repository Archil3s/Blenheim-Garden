import { expect, test } from "@playwright/test";

const plan = {
  beds: [{ id: 1, name: "Test Bed", x: 10, y: 10, w: 40, h: 20 }],
  plantingAreas: [],
  rows: [],
  objects: [],
};

test("bed-first smart planting calculates capacity and fills the bed", async ({ page }, testInfo) => {
  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, source: "d1", plan }),
    });
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  const card = page.getByRole("region", { name: "Smart planting" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Plant this bed");
  await expect(card).toContainText("≈ 28");

  await card.getByLabel("Crop").selectOption("Lettuce");
  await card.getByLabel("Variety").selectOption("Cos");
  await expect(card).toContainText("≈ 84");
  await expect(card).toContainText("planner default 28 cm");
  await page.screenshot({ path: `test-results/smart-planting-card-${testInfo.project.name}.png`, fullPage: true });

  await card.getByRole("button", { name: "Fill bed with Cos" }).click();

  const inspector = page.locator(".gv-planting-inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Cos");
  await expect(inspector).toContainText("Lettuce");
  await expect(inspector).toContainText("≈ 84");
  await expect(page.locator(".plan-bed .planting-area")).toHaveCount(1);

  await page.screenshot({ path: `test-results/smart-planting-${testInfo.project.name}.png`, fullPage: true });
});