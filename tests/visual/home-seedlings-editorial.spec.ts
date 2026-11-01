import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name + ".png"), fullPage: true, animations: "disabled" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "The page must not overflow horizontally").toBeLessThanOrEqual(1);
}

test("garden homepage is editorial, navigable and responsive", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good things");
  await expect(page.getByRole("link", { name: /Open the garden planner/ })).toHaveAttribute("href", "/planner");
  await expect(page.getByRole("link", { name: /Go to seedling journal/ })).toHaveAttribute("href", "/seedlings");
  await expect(page.getByText(/Historic ground-frost context/)).toBeVisible();
  await capture(page, testInfo, "home-editorial");
  expect(errors).toEqual([]);
});

test("seedling journal tracks a real batch and persists observed stages", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/seedlings");
  await page.evaluate(() => localStorage.removeItem("blenheim-garden-seedling-batches-v1"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Seedling");
  await page.getByRole("button", { name: /Add seed batch/ }).first().click();
  const form = page.locator("form.seed-form");
  await form.getByLabel("Crop").selectOption({ label: "Peas" });
  await form.getByLabel("Variety").fill("Trial autumn peas");
  await form.getByLabel("Seeds sown").fill("12");
  await form.getByRole("button", { name: "Save batch" }).click();

  const batch = page.locator(".seed-batch-card").first();
  await expect(batch).toContainText("Trial autumn peas");
  await expect(batch).toContainText("Expected emergence");
  await expect(batch).toContainText("Next succession sowing");
  await batch.getByLabel("Growth stage").selectOption("true-leaves");
  await batch.getByRole("button", { name: /Moisture checked/ }).click();
  await expect(batch).toContainText("True leaves");
  await expect(batch).toContainText("Last checked");
  await capture(page, testInfo, "seedlings-editorial");

  await page.reload();
  await expect(page.locator(".seed-batch-card").first()).toContainText("Trial autumn peas");
  await expect(page.locator(".seed-batch-card").first()).toContainText("True leaves");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Delete Peas batch/ }).click();
  await expect(page.locator(".seed-batch-card")).toHaveCount(0);
  expect(errors).toEqual([]);
});
