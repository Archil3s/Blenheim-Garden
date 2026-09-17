import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: { ok: false, error: "offline test" } }),
  );
});

test("generates a seasonal plan for the selected month and shows it in 3D", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Planning month").selectOption("Nov");

  const generate = page.getByRole("button", {
    name: "Generate seasonal garden",
  });
  await expect(generate).toBeEnabled();
  await generate.click();

  await expect(generate).toHaveText("✓ Nov");
  await expect(page.locator(".plan-bed")).toHaveCount(12);
  await expect(page.locator(".empty-bed-label")).toHaveCount(0);
  await expect(page.locator('[title^="Tomato ·"]')).not.toHaveCount(0);
  await expect(page.locator('[title^="Pumpkin ·"]')).not.toHaveCount(0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator("[data-testid=inline-3d-root]")).toHaveAttribute(
    "data-planting-count",
    "12",
  );
  await expect(
    page.locator('[aria-label="Interactive 3D garden workspace"] canvas'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo bed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.screenshot({
    path: testInfo.outputPath("november-seasonal-garden-3d.png"),
    fullPage: true,
  });
});
