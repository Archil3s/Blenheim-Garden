import { expect, test } from "@playwright/test";
import { fixture } from "./helpers/fixture";

test("reference layout keeps catalogues and report tabs usable", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => route.fulfill({ json: {
    ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }],
    beds: [], items: [], notes: [], harvests: [],
  } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Structures$/ }) }).click();
  await expect(page.locator(".gv-context")).toContainText("Garden Objects");
  await expect(page.locator(".gv-structure-list > button").first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("objects-reference-layout.png"), fullPage: true });
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await expect(page.locator(".gv-plant-list > button").first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("plants-reference-layout.png"), fullPage: true });
  if (testInfo.project.name !== "phone") {
    await expect(page.getByRole("navigation", { name: "Applications" })).toBeVisible();
    await page.getByRole("button", { name: "Open plant list", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Plant List", exact: true })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Open parts list", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Parts List", exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
