import { expect, test } from "@playwright/test";

test("photo progress displays starting photographs and compares viewpoints", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("**/api/garden/media?**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, items: [] }),
  }));
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: /Track progress in photographs/ })).toBeVisible();
  const originals = page.locator(".progress-grid .progress-start-photo img");
  await expect(originals).toHaveCount(8);
  for (let index = 0; index < 8; index++) {
    await expect.poll(() => originals.nth(index).evaluate(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await page.locator(".progress-view").nth(7).click();
  await expect(page.getByRole("heading", { name: /View 08 — compare over time/ })).toBeVisible();
  await expect(page.getByText("No later photographs for this view yet")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("photo-progress.png"), fullPage: true, animations: "disabled" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
});