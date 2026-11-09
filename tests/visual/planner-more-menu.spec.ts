import { expect, test } from "@playwright/test";

test("More opens on tap, stays in the viewport, and navigates to the icon test garden", async ({ page }) => {
  await page.goto("/planner");
  const trigger = page.getByRole("button", { name: /^More/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const panel = page.locator("#gv-more-panel");
  await expect(panel).toBeVisible();
  const rect = await panel.boundingBox();
  expect(rect).not.toBeNull();
  const width = page.viewportSize()!.width;
  expect(rect!.x).toBeGreaterThanOrEqual(-1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
  const link = panel.getByRole("link", { name: /All plant icons/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/test-garden\/?$/);
  await expect(page.getByRole("heading", { name: /Every plant/ })).toBeVisible();
});

test("More supports closing with Escape and outside taps", async ({ page }) => {
  await page.goto("/planner");
  const trigger = page.getByRole("button", { name: /^More/ });
  await trigger.click();
  await expect(page.locator("#gv-more-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(page.locator("#gv-more-panel")).toBeVisible();
  await page.locator(".gv-app .gv-title-left").click();
  await expect(page.locator("#gv-more-panel")).toHaveCount(0);
});
