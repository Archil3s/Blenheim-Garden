import { expect, test } from "@playwright/test";
import { fixture } from "./helpers/fixture";

for (const layout of ["desktop", "mobile"] as const) {
  test(`${layout} layout keeps the canvas full width and selection zoom stable`, async ({ page, context }, info) => {
    await context.addInitScript((value) => localStorage.setItem("blenheim-garden-device-layout", value), layout);
    const plan = structuredClone(fixture);
    plan.rows.push({ id: "pumpkin", crop: "Pumpkin", cropIcon: "", variety: "Crown", spacingCm: 90, x1: 300, y1: 430, x2: 300, y2: 430, count: 1, placements: layout === "mobile" ? [{ id: "single-pumpkin", x: 0, y: 0 }] : undefined });
    await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
    await page.goto("/planner");
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    await expect(page.locator(".gv-app")).toHaveClass(new RegExp(`gv-device-${layout}`));
    const settledScale = async () => page.locator(".garden-canvas").evaluate(async (el) => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return new DOMMatrix(getComputedStyle(el).transform).a;
    });
    const original = await settledScale();
    const geometry = await page.locator(".planting-row").getAttribute("style");
    const canvas = await page.locator(".garden-canvas").evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const scale = new DOMMatrix(getComputedStyle(el).transform).a;
      return { x: rect.x + el.clientLeft * scale, y: rect.y + el.clientTop * scale };
    });
    const symbol = (await page.locator('.planting-row .row-dots i').boundingBox())!;
    expect(symbol.x + symbol.width / 2).toBeCloseTo(canvas.x + 300 * original, 0);
    expect(symbol.y + symbol.height / 2).toBeCloseTo(canvas.y + 430 * original, 0);
    await page.screenshot({ path: info.outputPath(`scale-${layout}-before.png`) });
    await page.mouse.click(symbol.x + symbol.width / 4, symbol.y + symbol.height / 4);
    await expect(page.locator(".gv-context")).toBeVisible();
    expect(await settledScale()).toBe(original);
    const stage = (await page.locator(".gv-stage").boundingBox())!;
    const body = (await page.locator(".gv-body").boundingBox())!;
    if (layout === "mobile") expect(stage.width).toBeGreaterThan(body.width - 70);
    expect(stage.width).toBeGreaterThan(Math.min(250, page.viewportSize()!.width / 2));
    await page.screenshot({ path: info.outputPath(`scale-${layout}-selected.png`) });
    await page.getByRole("button", { name: "Close inspector", exact: true }).click();
    expect(await settledScale()).toBe(original);
    await page.locator('.gv-rail button').filter({ has: page.locator('small', { hasText: /^Plants$/ }) }).click();
    expect(await settledScale()).toBe(original);
    await page.locator('.gv-plant-list > button[data-crop="Pumpkin"]').click();
    expect(await settledScale()).toBe(original);
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    const manual = await settledScale();
    expect(manual).toBeGreaterThan(original);
    await page.getByRole("button", { name: "Close inspector", exact: true }).click();
    expect(await settledScale()).toBe(manual);
    await page.getByRole("button", { name: "Fit", exact: true }).click();
    expect(await settledScale()).toBeLessThanOrEqual(1);
    expect(await page.locator(".planting-row").getAttribute("style")).toBe(geometry);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
