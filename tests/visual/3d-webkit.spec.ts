import { expect, test } from "@playwright/test";

test("3D garden reaches a stable phone UI in WebKit", async ({ page }) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "failed"}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  // Keep this browser test independent of Cloudflare bindings while still exercising
  // actual plan -> Three.js scene construction in WebKit.
  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "d1",
        plan: {
          beds: [
            { id: 1, name: "Bed 1", x: 18, y: 22, w: 28, h: 24 },
            { id: 2, name: "Bed 2", x: 54, y: 22, w: 28, h: 24 },
          ],
          plantingAreas: [
            { id: "area-1", bedId: 1, crop: "Lettuce", cropIcon: "🥬", variety: "Test", spacingCm: 30, x: 8, y: 8, w: 84, h: 84, count: 6, pattern: "grid", iconSize: 32, visualSpacing: "normal" },
          ],
          rows: [],
          objects: [],
        },
      }),
    });
  });

  const response = await page.goto("/3d?diagnostic=webkit", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "3D document should be served").toBeLessThan(400);

  await expect(page.getByRole("heading", { name: "Blenheim Garden", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /2D Plan/ })).toBeVisible();
  await expect(page.getByText("Phone-safe renderer", { exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();

  // Give scene creation, ResizeObserver and route effects time to settle.
  await page.waitForTimeout(3000);

  await expect(page.getByText("3D garden could not start", { exact: true })).toHaveCount(0);
  await expect(page.getByText("WebGL could not start on this phone.", { exact: true })).toHaveCount(0);
  await expect(page.locator("canvas")).toBeVisible();

  await page.screenshot({ path: "test-results/3d-webkit-iphone.png", fullPage: true });

  console.log("PAGE_ERRORS", JSON.stringify(pageErrors));
  console.log("FAILED_REQUESTS", JSON.stringify(failedRequests));
  console.log("CONSOLE_ERRORS", JSON.stringify(consoleErrors));

  expect(pageErrors, "uncaught page errors").toEqual([]);
  expect(failedRequests, "failed browser requests").toEqual([]);
  expect(consoleErrors, "browser console errors").toEqual([]);
});
