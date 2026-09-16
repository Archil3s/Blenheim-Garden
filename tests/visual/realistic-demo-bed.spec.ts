import { expect, test } from "@playwright/test";

const emptyPlan = {
  beds: [],
  plantingAreas: [],
  rows: [],
  objects: [],
};

test.beforeEach(async ({ context }) => {
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") {
      return route.fulfill({ json: { ok: true, plan: emptyPlan } });
    }
    if (url.pathname === "/api/gardens") {
      return route.fulfill({
        json: {
          ok: true,
          gardens: [
            { id: "blenheim-garden", name: "Blenheim Garden", year: 2026 },
          ],
        },
      });
    }
    return route.fulfill({
      json: {
        ok: true,
        scope: "garden",
        beds: [],
        items: [],
        notes: [],
        harvests: [],
      },
    });
  });
});

async function inspectDemonstrationBed(page: import("@playwright/test").Page) {
  const canvas = page.locator(
    '[aria-label="Interactive 3D garden workspace"] canvas',
  );
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const points = [
    [0.5, 0.74],
    [0.36, 0.67],
    [0.64, 0.67],
    [0.5, 0.58],
  ];
  for (const [x, y] of points) {
    await page.mouse.click(box!.x + box!.width * x, box!.y + box!.height * y);
    const title = await page.locator(".gv-3d-selection-card strong").textContent();
    if (title === "2 × 4 m demonstration bed") return;
  }
}
test("real-scale demonstration bed renders in the planner 3D view", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByRole("button", { name: "Demo bed", exact: true }).click();

  await expect(page.locator(".gv-3d-hud-left small")).toHaveText(
    "2 × 4 m benchmark",
  );
  await expect(
    page.getByText("3D simulator needs WebGL2", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.locator('[aria-label="Interactive 3D garden workspace"] canvas'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo bed" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await inspectDemonstrationBed(page);
  await expect(page.locator(".gv-3d-selection-card strong")).toHaveText(
    "2 × 4 m demonstration bed",
  );

  await page.screenshot({
    path: testInfo.outputPath("real-scale-demonstration-bed.png"),
    fullPage: true,
    animations: "disabled",
  });

  expect(errors).toEqual([]);
});