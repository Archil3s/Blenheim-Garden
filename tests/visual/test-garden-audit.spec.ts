import { expect, test } from "@playwright/test";

test("test garden covers real catalogues and inspects variety artwork without saving", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET" && request.url().includes("/api/garden")) mutations.push(request.url());
  });
  await page.goto("/test-garden");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every plant.");
  const total = Number((await page.locator(".tg-stats strong").first().innerText()).replace(/,/g, ""));
  expect(total).toBeGreaterThan(1100);
  await expect(page.locator(".tg-plot")).toHaveCount(72);

  await page.getByLabel("CATALOGUE").selectOption("Rasmussen");
  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY" }).fill("Zebrange Stripey");
  await expect(page.locator(".tg-plot")).toHaveCount(1);
  await page.locator(".tg-plot").click();
  await expect(page.locator("#tg-inspector").getByRole("heading", { name: "Zebrange Stripey" })).toBeVisible();
  await expect(page.locator("#tg-inspector").getByText("Alternative PNG concept")).toBeVisible();
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open source icon/ })).toHaveAttribute("href", /plant-icons\/rasmussen\//);

  await page.getByRole("button", { name: "Icon gallery" }).click();
  await expect(page.locator(".tg-gallery-mode")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".tg-plot")).toHaveCount(72);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "Test garden should fit the viewport without horizontal scrolling").toBeLessThanOrEqual(1);
  expect(mutations, "QA page must not write to the garden API").toEqual([]);
});
