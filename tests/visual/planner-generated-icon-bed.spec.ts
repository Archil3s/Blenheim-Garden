import { expect, test } from "@playwright/test";
import { createGeneratedIconBedTemplate } from "../../lib/garden/generated-icon-bed-template";
import { approvedGeneratedPlantIcons, supplierPlantIcon } from "../../lib/garden/supplier-plant-icons";
import type { PlannerPlan } from "../../lib/garden/planner-plan";

const empty: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [] };

test("editable 2D icon bed contains every approved supplier artwork without overlaps", () => {
  const plan = createGeneratedIconBedTemplate(987654);
  expect(plan.beds).toHaveLength(1);
  expect(plan.plantingAreas.length).toBe(approvedGeneratedPlantIcons.length);
  expect(plan.plantingAreas.length).toBeGreaterThanOrEqual(449);
  const images = new Set(approvedGeneratedPlantIcons.map(item => item.gallery));
  expect(images.size).toBe(approvedGeneratedPlantIcons.length);

  const resolved = plan.plantingAreas.map(area => supplierPlantIcon(area.crop, area.variety));
  expect(new Set(resolved).size).toBe(images.size);
  expect(new Set(resolved)).toEqual(images);
  expect(plan.plantingAreas.every(area => area.bedId === plan.beds[0].id && area.count === 1 && area.pattern === "single")).toBe(true);
  expect(plan.plantingAreas.every(area => area.x >= 0 && area.y >= 0 && area.x + area.w <= 100.01 && area.y + area.h <= 100.01)).toBe(true);
  expect(plan.beds[0].w * 9 + plan.beds[0].x * 9).toBeLessThanOrEqual(plan.canvas!.widthCm);
  expect(plan.beds[0].h * 10.8 + plan.beds[0].y * 10.8).toBeLessThanOrEqual(plan.canvas!.heightCm);

  const anaheim = plan.plantingAreas.filter(area => area.crop === "Chilli" && area.variety.startsWith("Anaheim"));
  expect(anaheim.map(area => area.variety).sort()).toEqual(["Anaheim · Kings Seeds", "Anaheim · Rasmussen"]);
  expect(supplierPlantIcon("Chilli", anaheim[0].variety)).not.toBe(supplierPlantIcon("Chilli", anaheim[1].variety));
});

for (const width of [390, 1440]) {
  test(`real garden planner loads and restores the editable sample bed at ${width}px`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const writes: string[] = [];
    page.on("request", request => {
      if (request.url().includes("/api/garden") && request.method() !== "GET") writes.push(request.url());
    });
    await page.route("**/api/**", route => route.fulfill({
      json: { ok: true, plan: empty, gardens: [], beds: [], items: [], notes: [], harvests: [] },
    }));
    await page.goto("/planner?gardenId=icon-sample-browser-test");
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    await page.locator(".planner-garden-menu summary").click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Editable icon sample bed · all approved varieties" }).click();

    await expect(page.locator(".plan-bed")).toHaveCount(1);
    await expect(page.locator(".planting-area")).toHaveCount(approvedGeneratedPlantIcons.length);
    const garnet = page.locator('.planting-area[data-crop="Amaranth"]')
      .filter({ has: page.locator('.planting-area-label[title*="Garnet Red"]') });
    await expect(garnet).toHaveCount(1);
    await expect(garnet.locator(".planting-area-icons > i > span").first())
      .toHaveCSS("background-image", /generated\\/kings-seeds\\/gallery\\/amaranth-garnet-red\\.png/);
    await page.screenshot({ path: info.outputPath(`editable-icon-bed-${width}.png`) });

    await page.locator(".planner-garden-menu summary").click();
    await page.getByRole("button", { name: "Restore previous draft" }).click();
    await expect(page.locator(".planting-area")).toHaveCount(0);
    expect(writes).toEqual([]);
  });
}
