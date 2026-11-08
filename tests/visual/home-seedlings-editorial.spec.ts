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
  await form.getByRole("radio", { name: /12-cell tray/ }).check();
  await expect(form.getByLabel("Container name or custom setup")).toHaveValue("12-cell tray");
  await form.getByRole("button", { name: "Save batch" }).click();

  const batch = page.locator(".seed-batch-card").first();
  await expect(batch).toContainText("Trial autumn peas");
  await expect(batch).toContainText("12-cell tray");
  await expect(batch.locator(".seed-container-art")).toBeVisible();
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
  await expect(page.locator(".seed-batch-card").first()).toContainText("12-cell tray");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Delete Peas batch/ }).click();
  await expect(page.locator(".seed-batch-card")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("catalogue crops can be sown into individual cells and survive reload", async ({ page }) => {
  await page.goto("/seedlings");
  await page.getByRole("button", { name: /Add seed batch/ }).first().click();
  const tray = page.getByRole("group", { name: "Six-cell tray cell layout" });
  await expect(tray.getByRole("button")).toHaveCount(6);
  await page.getByLabel("Search seed catalogue").fill("Taro");
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Taro");
  await tray.getByRole("button", { name: "Cell 2: empty" }).click();
  await page.getByLabel("Search seed catalogue").fill("Black Krim");
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Tomato");
  await expect(page.getByRole("combobox", { name: "Variety", exact: true })).toHaveValue("Black Krim");
  await tray.getByRole("button", { name: "Cell 5: empty" }).click();
  await tray.getByRole("button", { name: /Cell 5: Tomato.*Black Krim/ }).click();
  const cell = page.getByRole("group", { name: "Edit cell 5" });
  await cell.getByRole("combobox", { name: "Catalogue variety" }).selectOption("Roma");
  await cell.getByRole("button", { name: "Apply to cell 5" }).click();
  await expect(page.getByLabel("Seeds sown")).toHaveValue("2");
  await page.getByRole("button", { name: "Save batch" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Mixed tray" })).toBeVisible();
  await expect(tray.getByRole("img", { name: /Cell 2: Taro/ })).toBeVisible();
  await expect(tray.getByRole("img", { name: /Cell 5: Tomato.*Roma/ })).toBeVisible();
});
