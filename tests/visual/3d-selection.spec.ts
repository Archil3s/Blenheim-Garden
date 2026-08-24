import { expect, test } from "@playwright/test";

const fixturePlan = {
  ok: true,
  source: "d1",
  plan: {
    beds: [
      { id: 1, name: "Test Bed", x: 20, y: 20, w: 60, h: 60 },
    ],
    plantingAreas: [
      {
        id: "area-1",
        bedId: 1,
        crop: "Tomato",
        cropIcon: "🍅",
        variety: "Roma",
        spacingCm: 30,
        x: 10,
        y: 10,
        w: 80,
        h: 80,
        count: 6,
        pattern: "grid",
        iconSize: 1,
        visualSpacing: "normal",
      },
    ],
    rows: [],
    objects: [],
  },
};

async function openFixtureGarden(page: import("@playwright/test").Page) {
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

  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixturePlan) });
  });

  const response = await page.goto("/3d?gardenId=selection-test", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("header").getByText("Blenheim Garden", { exact: true })).toBeVisible();

  return { pageErrors, failedRequests, consoleErrors };
}

async function tapCanvasCentre(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test("phone 3D tap selects a garden item and shows a compact inspector", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-iphone", "Phone selection is covered by the iPhone WebKit profile.");
  const diagnostics = await openFixtureGarden(page);

  await tapCanvasCentre(page);

  await expect(page.getByText("SELECTED", { exact: true })).toBeVisible();
  await expect(page.getByText("Spacing", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Test Bed|Tomato/, { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/3d-selection-phone.png", fullPage: true });

  expect(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect(diagnostics.failedRequests, "failed requests").toEqual([]);
  expect(diagnostics.consoleErrors, "console errors").toEqual([]);
});

test("desktop 3D click updates the responsive inspector", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-desktop", "Desktop selection is covered by the desktop WebKit profile.");
  const diagnostics = await openFixtureGarden(page);
  const inspectorHeading = page.locator("aside h2").first();
  await expect(inspectorHeading).toHaveText("Tap something in the garden");

  await tapCanvasCentre(page);

  await expect(inspectorHeading).toHaveText(/Test Bed|Tomato/);
  await expect(page.getByText("Spacing", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/3d-selection-desktop.png", fullPage: true });

  expect(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect(diagnostics.failedRequests, "failed requests").toEqual([]);
  expect(diagnostics.consoleErrors, "console errors").toEqual([]);
});
