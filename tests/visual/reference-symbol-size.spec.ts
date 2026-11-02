import { expect, test, type Page } from "@playwright/test";
import { fixture } from "./helpers/fixture";

async function expectSymbolSize(page: Page, selector: string, widthCm: number, heightCm = widthCm) {
  const scale = await page.locator(".garden-canvas").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
  const box = (await page.locator(selector).first().boundingBox())!;
  expect(box.width).toBeCloseTo(widthCm * scale, 0);
  expect(box.height).toBeCloseTo(heightCm * scale, 0);
}

test("original plant dimensions remain proportional to centimetre rulers through zoom", async ({ page }, testInfo) => {
  const plan = structuredClone(fixture);
  plan.rows.push({ id: "size-row", crop: "Raspberry", cropIcon: "", variety: "Heritage", spacingCm: 70, x1: 50, y1: 950, x2: 350, y2: 950, count: 4 });
  await page.route("**/api/**", (route) => route.fulfill({ json: {
    ok: true, plan, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [],
  } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const beds = await page.locator(".plan-bed").evaluateAll((els) => els.map((el) => el.getAttribute("style")));
  const check = async () => {
    await expectSymbolSize(page, '.planting-area[data-crop="Tomato"] .planting-area-icons .reference-plant-art', 40);
    await expectSymbolSize(page, '.planting-area[data-crop="Strawberry"] .planting-area-icons .reference-plant-art', 40);
    await expectSymbolSize(page, '.planting-area[data-crop="Bean"] .planting-area-icons .reference-plant-art', 30);
    await expectSymbolSize(page, '.reference-berry [data-reference-sprite="RAS"]', 40);
    await expectSymbolSize(page, '.reference-berry [data-reference-sprite="BLA"]', 50);
    await expectSymbolSize(page, '.tree-object [data-reference-sprite="FRU2"]', 75);
    await expectSymbolSize(page, '.row-dots [data-reference-sprite="RAS"]', 40);
  };
  await check();
  await page.screenshot({ path: testInfo.outputPath("source-sized-symbols.png"), fullPage: true });
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await check();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await check();
  expect(await page.locator(".plan-bed").evaluateAll((els) => els.map((el) => el.getAttribute("style")))).toEqual(beds);
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  const icon = page.locator('.gv-plant-list [data-crop="Tomato"] .reference-plant-art').first();
  await expect(icon).toBeVisible();
  const box = (await icon.boundingBox())!;
  expect(box.width).toBe(36);
  expect(box.height).toBe(36);
});
