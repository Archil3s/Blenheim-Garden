import { expect, test } from "@playwright/test";

const fixturePlan = {
  ok: true,
  source: "d1",
  plan: {
    beds: [
      { id: 1, name: "Tomato Bed", x: 8, y: 8, w: 38, h: 32 },
      { id: 2, name: "Leafy Bed", x: 54, y: 8, w: 38, h: 32 },
      { id: 3, name: "Pumpkin Bed", x: 8, y: 50, w: 38, h: 36 },
      { id: 4, name: "Berry Bed", x: 54, y: 50, w: 38, h: 36 },
    ],
    plantingAreas: [
      { id: "tomatoes", bedId: 1, crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 45, x: 6, y: 8, w: 88, h: 84, count: 8, pattern: "grid", iconSize: 1, visualSpacing: "normal" },
      { id: "lettuce", bedId: 2, crop: "Lettuce", cropIcon: "🥬", variety: "Cos", spacingCm: 25, x: 6, y: 8, w: 88, h: 84, count: 10, pattern: "staggered", iconSize: 1, visualSpacing: "normal" },
      { id: "pumpkin", bedId: 3, crop: "Pumpkin", cropIcon: "🎃", variety: "Crown", spacingCm: 90, x: 6, y: 8, w: 88, h: 84, count: 4, pattern: "natural", iconSize: 1.1, visualSpacing: "wide" },
      { id: "strawberries", bedId: 4, crop: "Strawberry", cropIcon: "🍓", variety: "Albion", spacingCm: 30, x: 6, y: 8, w: 88, h: 84, count: 8, pattern: "grid", iconSize: 1, visualSpacing: "normal" },
    ],
    rows: [
      { id: "beans", crop: "Bean", cropIcon: "🫘", variety: "Climbing", spacingCm: 20, x1: 80, y1: 930, x2: 780, y2: 930, count: 12 },
    ],
    objects: [
      { id: "path", type: "path", x1: 450, y1: 0, x2: 450, y2: 1080, widthCm: 55, label: "Main path" },
      { id: "trellis", type: "trellis", x1: 80, y1: 940, x2: 780, y2: 940, heightCm: 180, postSpacingCm: 120, label: "Bean trellis" },
      { id: "tree", type: "tree", x: 800, y: 760, diameterCm: 180, label: "Peach tree" },
    ],
  },
};

async function openGarden(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => failed.push(`${request.method()} ${request.url()}`));

  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixturePlan) });
  });

  const response = await page.goto("/3d?gardenId=visual-fixture", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("header").getByText("Blenheim Garden", { exact: true })).toBeVisible();
  await expect(page.locator('[aria-label="Visual 3D garden canvas"] canvas')).toBeVisible();
  await page.waitForTimeout(1800);
  return { errors, failed };
}

test("visual garden renders on iPhone WebKit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-iphone", "iPhone profile only");
  const diagnostics = await openGarden(page);
  await page.screenshot({ path: "test-results/visual-3d-iphone.png", fullPage: true });
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.failed).toEqual([]);
});

test("visual garden renders on desktop WebKit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-desktop", "desktop profile only");
  const diagnostics = await openGarden(page);
  await page.screenshot({ path: "test-results/visual-3d-desktop.png", fullPage: true });
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.failed).toEqual([]);
});
