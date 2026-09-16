import { expect, test, type Page } from "@playwright/test";
import { STRUCTURE_PRESETS } from "../../lib/garden/structure-catalog";

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

const catalogPlan = {
  beds: [],
  plantingAreas: [],
  rows: [],
  objects: STRUCTURE_PRESETS.map((preset, index) => ({
    id: `catalog-${preset.kind}`,
    type: "structure",
    kind: preset.kind,
    x: 75 + index % 6 * 150,
    y: 90 + Math.floor(index / 6) * 180,
    widthCm: Math.min(preset.widthCm, 120),
    depthCm: Math.min(preset.depthCm, 140),
    heightCm: preset.heightCm,
    rotationDeg: index % 2 ? 10 : -10,
    label: preset.label,
  })),
};

async function clickStructure(page: Page) {
  const canvas = page.locator('[aria-label="Visual 3D garden canvas"] canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const selectedHeading = page.getByRole("heading", { name: "Test 3D shed", exact: true });
  const points = [
    [0.5, 0.5], [0.5, 0.44], [0.5, 0.56],
    [0.44, 0.5], [0.56, 0.5], [0.44, 0.44], [0.56, 0.44],
    [0.44, 0.56], [0.56, 0.56], [0.5, 0.62],
  ];
  for (const [x, y] of points) {
    await page.mouse.click(box!.x + box!.width * x, box!.y + box!.height * y);
    if (await selectedHeading.count()) return;
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
  await expect(page.getByRole("heading", { name: "Test 3D shed", exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Test 3D shed", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cross-tab-3d-structure.png"), fullPage: true, animations: "disabled" });
  await writerTab.close();
});

test("Live 3D renders every structure preset without browser errors", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(
    ({ key, plan }) => localStorage.setItem(key, JSON.stringify(plan)),
    { key: liveKey, plan: catalogPlan },
  );
  await page.goto("/3d");

  await expect(page.locator('[aria-label="Visual 3D garden canvas"] canvas')).toBeVisible();
  await expect(page.locator("body")).toContainText("36 structures");
  await expect(page.getByText("WebGL could not start", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Fit garden" }).click();
  await page.screenshot({
    path: testInfo.outputPath("complete-structure-catalog.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
