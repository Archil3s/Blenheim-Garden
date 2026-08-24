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

  const response = await page.goto("/3d?diagnostic=webkit", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "3D document should be served").toBeLessThan(400);

  await expect(page.getByRole("heading", { name: "Blenheim Garden", exact: true })).toBeVisible();
  await expect(page.getByText("Phone-optimised 3D", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /2D Plan/ })).toBeVisible();

  // Give the renderer, API fallback, ResizeObserver and root layout effects time to settle.
  await page.waitForTimeout(3000);

  const canvasCount = await page.locator("canvas").count();
  const webglFallbackCount = await page.getByText("WebGL could not start on this phone.", { exact: true }).count();
  expect(canvasCount + webglFallbackCount, "page should either render WebGL or show its local fallback").toBeGreaterThan(0);

  await page.screenshot({ path: "test-results/3d-webkit-iphone.png", fullPage: true });

  console.log("PAGE_ERRORS", JSON.stringify(pageErrors));
  console.log("FAILED_REQUESTS", JSON.stringify(failedRequests));
  console.log("CONSOLE_ERRORS", JSON.stringify(consoleErrors));

  expect(pageErrors, "uncaught page errors").toEqual([]);
});
