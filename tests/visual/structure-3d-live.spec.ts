import { expect, test } from "@playwright/test";

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

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") return route.fulfill({ json: { ok: true, plan: emptyPlan } });
    if (url.pathname === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, scope: "garden", beds: [], items: [], notes: [], harvests: [] } });
  });
});

test("Live 3D receives a structure from another planner tab and renders an inspectable mesh", async ({ context, page }, testInfo) => {
  await page.addInitScript(({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)), { key: liveKey, plan: emptyPlan });
  await page.goto("/3d");

  const canvas = page.locator('[aria-label="Visual 3D garden canvas"] canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByText("WebGL could not start", { exact: false })).toHaveCount(0);

  const plannerTab = await context.newPage();
  await plannerTab.goto("/");
  await plannerTab.evaluate(({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)), { key: liveKey, plan: structurePlan });

  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Fit garden" }).click();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  await expect(page.getByText("Test 3D shed", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("live-3d-structure.png"), fullPage: true, animations: "disabled" });
  await plannerTab.close();
});
