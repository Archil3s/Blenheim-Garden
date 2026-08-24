import { expect, test } from "@playwright/test";

const initialPlan = {
  beds: [{ id: 1, name: "Test Bed", x: 20, y: 18, w: 55, h: 30 }],
  plantingAreas: [{ id: "tomatoes", bedId: 1, crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 45, x: 5, y: 8, w: 90, h: 84, count: 8, pattern: "grid", iconSize: 16, visualSpacing: "normal" }],
  rows: [],
  objects: [{ id: "tree", type: "tree", x: 760, y: 720, diameterCm: 160, label: "Peach tree" }],
};

const updatedPlan = {
  ...initialPlan,
  beds: [...initialPlan.beds, { id: 2, name: "Second Bed", x: 8, y: 58, w: 35, h: 20 }],
  plantingAreas: [...initialPlan.plantingAreas, { id: "lettuce", bedId: 2, crop: "Lettuce", cropIcon: "🥬", variety: "Cos", spacingCm: 28, x: 0, y: 0, w: 100, h: 100, count: 12, pattern: "grid", iconSize: 16, visualSpacing: "normal" }],
};

test("switches the main planner between 2D and live inline 3D", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, source: "d1", plan: initialPlan }),
    });
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  const switcher = page.getByRole("group", { name: "Garden view" });
  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole("button", { name: "2D" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".garden-canvas")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);

  await switcher.getByRole("button", { name: "3D" }).click();
  const root = page.getByTestId("inline-3d-root");
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-bed-count", "1");
  await expect(root).toHaveAttribute("data-planting-count", "1");
  await expect(page.getByLabel("Interactive 3D garden workspace").locator("canvas")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator(".gv-stage-scroll")).toBeHidden();

  await page.evaluate((plan) => {
    window.dispatchEvent(new CustomEvent("blenheim-garden-live-plan-change", {
      detail: { gardenId: "blenheim-garden", plan },
    }));
  }, updatedPlan);

  await expect(root).toHaveAttribute("data-bed-count", "2");
  await expect(root).toHaveAttribute("data-planting-count", "2");
  await page.screenshot({ path: `test-results/workspace-${testInfo.project.name}.png`, fullPage: true });

  await switcher.getByRole("button", { name: "2D" }).click();
  await expect(root).toHaveCount(0);
  await expect(page.locator(".garden-canvas")).toBeVisible();
  await expect(page.locator(".gv-stage-scroll")).toBeVisible();
  await expect(switcher.getByRole("button", { name: "2D" })).toHaveAttribute("aria-pressed", "true");

  expect(pageErrors).toEqual([]);
});
