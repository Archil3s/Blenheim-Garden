import { expect, test, type Page } from "@playwright/test";

const liveKey = "blenheim-garden-live-plan";
const emptyPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };
const structurePlan = {
  beds: [],
  plantingAreas: [],
  rows: [],
  objects: [
    {
      id: "test-live-3d-shed",
      type: "structure",
      kind: "shed",
      x: 450,
      y: 540,
      widthCm: 700,
      depthCm: 700,
      heightCm: 500,
      rotationDeg: 0,
      label: "Test 3D shed",
    },
  ],
};

async function clickStructure(page: Page) {
  const canvas = page.locator('[aria-label="Visual 3D garden canvas"] canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const points = [
    [0.5, 0.5], [0.5, 0.44], [0.5, 0.56],
    [0.44, 0.5], [0.56, 0.5], [0.44, 0.44], [0.56, 0.44],
    [0.44, 0.56], [0.56, 0.56], [0.5, 0.62],
  ];
  for (const [x, y] of points) {
    await page.mouse.click(box!.x + box!.width * x, box!.y + box!.height * y);
    if (await page.getByText("Test 3D shed", { exact: true }).count()) return;
  }
}

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") return route.fulfill({ json: { ok: true, plan: emptyPlan } });
    if (url.pathname === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, scope: "garden", beds: [], items: [], notes: [], harvests: [] } });
  });
});

test("Live 3D renders a structure already present in the live plan", async ({ page }, testInfo) => {
  await page.addInitScript(({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)), { key: liveKey, plan: structurePlan });
  await page.goto("/3d");

  const canvas = page.locator('[aria-label="Visual 3D garden canvas"] canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByText("WebGL could not start", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Fit garden" }).click();
  await clickStructure(page);
  await expect(page.getByText("Test 3D shed", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("initial-3d-structure.png"), fullPage: true, animations: "disabled" });
});

test("Live 3D receives a structure written from another tab", async ({ context, page }, testInfo) => {
  await page.addInitScript(({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)), { key: liveKey, plan: emptyPlan });
  await page.goto("/3d");

  const canvas = page.locator('[aria-label="Visual 3D garden canvas"] canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByText("WebGL could not start", { exact: false })).toHaveCount(0);

  // Use a second 3D page as a passive same-origin writer. Unlike the planner,
  // it does not immediately overwrite the live-plan key with its own fixture.
  const writerTab = await context.newPage();
  await writerTab.goto("/3d");
  await expect(writerTab.locator('[aria-label="Visual 3D garden canvas"] canvas')).toBeVisible();
  await writerTab.evaluate(({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)), { key: liveKey, plan: structurePlan });

  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Fit garden" }).click();
  await clickStructure(page);
  await expect(page.getByText("Test 3D shed", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cross-tab-3d-structure.png"), fullPage: true, animations: "disabled" });
  await writerTab.close();
});
