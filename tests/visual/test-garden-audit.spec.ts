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
  await expect(page.locator("#tg-inspector").getByText("Current planner artwork")).toBeVisible();
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open displayed icon/ })).toHaveAttribute("href", /plant-icons\/rasmussen\/batches\/14\/individual_png\/137_zebrange-stripey.png/);

  await page.getByRole("button", { name: "Icon gallery" }).click();
  await expect(page.locator(".tg-gallery-mode")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".tg-plot")).toHaveCount(72);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "Test garden should fit the viewport without horizontal scrolling").toBeLessThanOrEqual(1);
  expect(mutations, "QA page must not write to the garden API").toEqual([]);
});

test("uploaded Kings Seeds PNGs are visible and mobile plot images stay contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/test-garden");
  await page.getByLabel("CATALOGUE").selectOption("Kings Seeds");
  await page.getByLabel("Uploaded PNGs only").check();
  await expect(page.locator(".tg-plot")).toHaveCount(3);
  await expect(page.locator(".tg-plot img[data-art-source='uploaded-png']")).toHaveCount(3);
  await expect(page.locator(".tg-plot").first().locator("img")).toHaveAttribute("src", /kings-seeds-concepts\/amaranth-garnet-red.png/);
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector").getByText("Current planner artwork")).toBeVisible();
  const contained = await page.locator(".tg-plot-art").evaluateAll(elements => elements.every(element => {
    const parent = element.getBoundingClientRect();
    const img = element.querySelector("img");
    if (!img) return true;
    const image = img.getBoundingClientRect();
    return image.left >= parent.left - 1 && image.right <= parent.right + 1 &&
      image.top >= parent.top - 1 && image.bottom <= parent.bottom + 1;
  }));
  expect(contained).toBe(true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
