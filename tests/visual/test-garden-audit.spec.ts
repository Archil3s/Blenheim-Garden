import { expect, test } from "@playwright/test";

test("only exact supplier original icons appear; all other cards show artwork pending", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET" && request.url().includes("/api/garden")) mutations.push(request.url());
  });
  await page.goto("/test-garden");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every plant.");
  const total = Number((await page.locator(".tg-stats strong").first().innerText()).replace(/,/g, ""));
  expect(total).toBeGreaterThan(1100);
  await expect(page.locator(".tg-plot")).toHaveCount(72);
  await expect(page.locator(".tg-plot").first()).toContainText("Artwork pending");
  await expect(page.locator(".tg-plot").first().locator("img")).toHaveCount(0);
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector")).toContainText("No verified image file mapped");
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open original image/ })).toHaveCount(0);

  await page.getByLabel("CATALOGUE").selectOption("Rasmussen");
  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY" }).fill("7 Pot Jonah");
  await expect(page.locator(".tg-plot")).toHaveCount(1);
  await expect(page.locator(".tg-plot img")).toHaveAttribute("src", "/assets/icons/rasmussen/approved/001_7-pot-jonah-yellow.png");
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector")).toContainText("Verified original");
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open original image/ }))
    .toHaveAttribute("href", "/assets/icons/rasmussen/approved/001_7-pot-jonah-yellow.png");

  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY" }).fill("Zebrange Stripey");
  await expect(page.locator(".tg-plot")).toHaveCount(1);
  await expect(page.locator(".tg-plot").first().locator("img")).toHaveCount(0);
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector")).toContainText("Artwork pending");

  await page.getByRole("button", { name: "Icon gallery" }).click();
  await expect(page.locator(".tg-gallery-mode")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(mutations).toEqual([]);
});

test("verified filter shows only the 10 original Rasmussen HTML PNGs and no Kings substitutes", async ({ page }) => {
  await page.goto("/test-garden");
  await page.getByLabel("ARTWORK STATUS").selectOption("Verified originals only");
  await expect(page.locator(".tg-plot")).toHaveCount(10);
  await expect(page.locator(".tg-plot img[data-art-source='verified-original']")).toHaveCount(10);
  const srcs = await page.locator(".tg-plot img").evaluateAll(imgs => imgs.map(img => img.getAttribute("src") ?? ""));
  expect(srcs.every(src => src.startsWith("/assets/icons/rasmussen/approved/"))).toBe(true);
  await page.getByLabel("CATALOGUE").selectOption("Kings Seeds");
  await expect(page.locator(".tg-plot")).toHaveCount(0);
  await page.getByLabel("ARTWORK STATUS").selectOption("Artwork pending only");
  await expect(page.locator(".tg-plot")).toHaveCount(72);
  await expect(page.locator(".tg-plot img")).toHaveCount(0);
});

for (const width of [320, 390, 760, 1024]) {
  test("original PNGs stay fully contained at viewport " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/test-garden");
    await page.getByLabel("CATALOGUE").selectOption("Rasmussen");
    await page.getByLabel("ARTWORK STATUS").selectOption("Verified originals only");
    const image = page.locator(".tg-plot img").first();
    await expect(image).toBeVisible();
    await expect(image).toHaveJSProperty("naturalWidth", 512);
    const contained = await page.locator(".tg-plot-art").evaluateAll(elements => elements.every(el => {
      const r = el.getBoundingClientRect();
      const img = el.querySelector("img");
      if (!img) return true;
      const i = img.getBoundingClientRect();
      return i.left >= r.left - 1 && i.right <= r.right + 1 && i.top >= r.top - 1 && i.bottom <= r.bottom + 1;
    }));
    expect(contained).toBe(true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
