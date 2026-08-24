import { expect, test } from "@playwright/test";

const fixture = {
  ok: true,
  source: "d1",
  plan: {
    beds: [{ id: 1, name: "Preview Bed", x: 20, y: 18, w: 55, h: 30 }],
    plantingAreas: [{ id: "tomatoes", bedId: 1, crop: "Tomato", cropIcon: "🍅", variety: "Roma", spacingCm: 45, x: 5, y: 8, w: 90, h: 84, count: 8, pattern: "grid", iconSize: 16, visualSpacing: "normal" }],
    rows: [],
    objects: [{ id: "tree", type: "tree", x: 760, y: 720, diameterCm: 160, label: "Peach tree" }],
  },
};

async function openPlanner(page: import("@playwright/test").Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("503 (Service Unavailable)")) return;
    consoleErrors.push(text);
  });
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));

  await page.route("**/api/garden?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) });
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("button", { name: "Open 3D preview" })).toBeVisible();
  return { pageErrors, consoleErrors, failedRequests };
}

for (const project of ["desktop", "mobile"] as const) {
  test(`${project} opens lightweight 3D preview from 2D planner`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== project, `${project} project only`);
    const diagnostics = await openPlanner(page);

    await page.getByRole("button", { name: "Open 3D preview" }).click();
    const dialog = page.getByRole("dialog", { name: "3D Preview" });
    await expect(dialog).toBeVisible();

    const iframe = page.locator('iframe[title="Lightweight 3D garden preview"]');
    await expect(iframe).toBeVisible();
    const box = await iframe.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThan(841);

    const preview = page.frameLocator('iframe[title="Lightweight 3D garden preview"]');
    await expect(preview.locator('canvas').first()).toBeVisible();
    await expect(preview.getByText("Blenheim Garden", { exact: true })).toBeVisible();

    await page.screenshot({ path: `test-results/2d-3d-preview-${project}.png`, fullPage: true });
    await page.getByRole("button", { name: "Back to 2D" }).click();
    await expect(dialog).toBeHidden();
    await expect(iframe).toHaveCount(0);

    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.failedRequests).toEqual([]);
  });
}
