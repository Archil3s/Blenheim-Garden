import { expect, test } from "@playwright/test";

test("showcase renders its botanical and original plant models without touching saved plans", async ({page}, testInfo) => {
  test.setTimeout(70_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/3d-showcase");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One bed");
  await expect(page.getByText("Not connected to saved plans")).toBeVisible();

  const stage = page.locator(".gs-stage");
  const botanical = page.getByRole("button", { name: "Botanical prototype" });
  const classic = page.getByRole("button", { name: "Current low-poly" });
  await expect(botanical).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-scene-ready", "botanical", { timeout: 20000 });
  await expect(stage.locator("canvas")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("botanical-prototype.png"),
    fullPage: true, animations: "disabled",
  });

  await classic.click();
  await expect(classic).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-scene-ready", "classic", { timeout: 20000 });
  await page.screenshot({
    path: testInfo.outputPath("original-low-poly.png"),
    fullPage: true, animations: "disabled",
  });

  await botanical.click();
  await expect(stage).toHaveAttribute("data-scene-ready", "botanical", { timeout: 20000 });
  await page.getByRole("button", { name: /Reset camera/ }).click();
  await expect(page.locator(".gs-error")).toHaveCount(0);
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
