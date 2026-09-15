import { expect, test, type Page } from "@playwright/test";

const savedPlan = {
  beds: [],
  plantingAreas: [],
  rows: [],
  objects: [
    {
      id: "saved-inline-3d-shed",
      type: "structure",
      kind: "shed",
      x: 450,
      y: 540,
      widthCm: 700,
      depthCm: 700,
      heightCm: 500,
      rotationDeg: 0,
      label: "Saved 3D shed",
    },
  ],
};

async function inspectCentreStructure(page: Page) {
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const points = [
    [0.5, 0.5], [0.5, 0.44], [0.5, 0.56],
    [0.44, 0.5], [0.56, 0.5], [0.44, 0.44], [0.56, 0.44],
    [0.44, 0.56], [0.56, 0.56],
  ];

  for (const [x, y] of points) {
    await page.mouse.click(box!.x + box!.width * x, box!.y + box!.height * y);
    if ((await page.locator(".gv-3d-selection-card strong").textContent()) === "Saved 3D shed") return;
  }
}

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") return route.fulfill({ json: { ok: true, plan: savedPlan } });
    if (url.pathname === "/api/gardens") {
      return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    }
    return route.fulfill({ json: { ok: true, scope: "garden", beds: [], items: [], notes: [], harvests: [] } });
  });
});

test("saved structures render and can be inspected in the planner 3D view", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("inline-3d-workspace")).toBeVisible();
  await expect(page.getByText("3D simulator needs WebGL2", { exact: false })).toHaveCount(0);

  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await inspectCentreStructure(page);
  await expect(page.locator(".gv-3d-selection-card strong")).toHaveText("Saved 3D shed");

  await page.screenshot({ path: testInfo.outputPath("saved-structure-inline-3d.png"), fullPage: true, animations: "disabled" });
});
