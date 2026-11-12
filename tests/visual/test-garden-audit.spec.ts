import { expect, test } from "@playwright/test";
import generatedArtwork from "../../lib/garden/generated-artwork-manifest.json";
import kingsSeeds from "../../lib/garden/kings-seeds-varieties.json";

const mappedKingsIds = new Set(Object.keys(generatedArtwork));
const pendingKingsCount = kingsSeeds.filter(({ id }) => !mappedKingsIds.has("kings:" + id)).length;

test("pending artwork stays unmapped and verified originals retain their source", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET" && request.url().includes("/api/garden")) mutations.push(request.url());
  });
  await page.goto("/test-garden");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every plant.");
  const total = Number((await page.locator(".tg-stats strong").first().innerText()).replace(/,/g, ""));
  expect(total).toBeGreaterThan(1100);
  await expect(page.locator(".tg-plot")).toHaveCount(72);
  await page.locator(".tg-status-select select").selectOption("Artwork pending only");
  await expect(page.locator(".tg-plot").first()).toContainText("Artwork pending");
  await expect(page.locator(".tg-plot").first().locator("img")).toHaveCount(0);
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector")).toContainText("No verified image file mapped");
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open original image/ })).toHaveCount(0);

  await page.locator(".tg-status-select select").selectOption("All artwork");
  await page.locator(".tg-controls select").first().selectOption("Rasmussen");
  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY OR SUPPLIER" }).fill("7 Pot Jonah");
  await expect(page.locator(".tg-plot")).toHaveCount(1);
  await expect(page.locator(".tg-plot img")).toHaveAttribute("src", "/assets/icons/rasmussen/approved/001_7-pot-jonah-yellow.png");
  await page.locator(".tg-plot").first().click();
  await expect(page.locator("#tg-inspector")).toContainText("Verified original");
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open original image/ }))
    .toHaveAttribute("href", "/assets/icons/rasmussen/approved/001_7-pot-jonah-yellow.png");

  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY OR SUPPLIER" }).fill("Zebrange Stripey");
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
  await page.locator(".tg-status-select select").selectOption("Verified originals only");
  await expect(page.locator(".tg-plot")).toHaveCount(10);
  await expect(page.locator(".tg-plot img[data-art-source='verified-original']")).toHaveCount(10);
  const srcs = await page.locator(".tg-plot img").evaluateAll(imgs => imgs.map(img => img.getAttribute("src") ?? ""));
  expect(srcs.every(src => src.startsWith("/assets/icons/rasmussen/approved/"))).toBe(true);
  await page.locator(".tg-controls select").first().selectOption("Kings Seeds");
  await expect(page.locator(".tg-plot")).toHaveCount(0);
  await page.locator(".tg-status-select select").selectOption("Artwork pending only");
  await expect(page.locator(".tg-plot")).toHaveCount(Math.min(72, pendingKingsCount));
  await expect(page.locator(".tg-plot img")).toHaveCount(0);
});

for (const width of [320, 390, 760, 1024]) {
  test("original PNGs stay fully contained at viewport " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/test-garden");
    await page.locator(".tg-status-select select").selectOption("All artwork");
  await page.locator(".tg-controls select").first().selectOption("Rasmussen");
    await page.locator(".tg-status-select select").selectOption("Verified originals only");
    const image = page.locator(".tg-plot img").first();
    await image.scrollIntoViewIfNeeded();
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

test("generated catalogue cards load their gallery PNGs and open the correct masters", async ({ page }) => {
  await page.goto("/test-garden");
  await page.locator(".tg-status-select select").selectOption("Generated artwork only");
  await page.getByRole("button", { name: "Icon gallery" }).click();
  const cards = page.locator(".tg-plot");
  const images = cards.locator("img[data-art-source='generated']");
  await expect(images).toHaveCount(await cards.count());
  expect(await images.count()).toBeGreaterThanOrEqual(10);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("naturalWidth", 128);
    await expect(image).toHaveJSProperty("naturalHeight", 128);
    const fits = await image.evaluate(el => {
      const imageRect = el.getBoundingClientRect();
      const frameRect = el.parentElement!.getBoundingClientRect();
      return getComputedStyle(el).objectFit === "contain" &&
        imageRect.left >= frameRect.left - 1 && imageRect.right <= frameRect.right + 1 &&
        imageRect.top >= frameRect.top - 1 && imageRect.bottom <= frameRect.bottom + 1;
    });
    expect(fits).toBe(true);
  }
  await page.screenshot({ path: test.info().outputPath("generated-gallery.png"), fullPage: true });
  const garnet = cards.filter({ hasText: "Garnet Red" });
  await expect(garnet.locator("img")).toHaveAttribute("src",
    "/plant-icons/generated/kings-seeds/gallery/amaranth-garnet-red.png");
  await garnet.click();
  const inspector = page.locator("#tg-inspector");
  await expect(inspector.locator(".tg-large-art img")).toHaveJSProperty("naturalWidth", 512);
  await expect(inspector.getByRole("link", { name: /Open master image/ })).toHaveAttribute("href",
    "/plant-icons/generated/kings-seeds/master/amaranth-garnet-red.png");
  await expect(inspector.getByRole("link", { name: "Cultivar photo" })).toHaveAttribute("href",
    "https://www.winnowseedco.ca/product-page/amaranth-garnet-red");
  if (page.viewportSize()!.width <= 760) {
    const [first, second, third] = await cards.evaluateAll(nodes =>
      nodes.slice(0, 3).map(node => {
        const { x, y } = node.getBoundingClientRect();
        return { x, y };
      }));
    expect(first.y).toBe(second.y);
    expect(second.x).toBeGreaterThan(first.x);
    expect(third.y).toBeGreaterThan(first.y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("supplier inspector shows all growth stages in order and links reviewed harvest", async ({ page }) => {
  await page.goto("/test-garden");
  await page.getByRole("searchbox").fill("Passionfruit Large Black");
  await page.locator(".tg-plot").first().click();
  const stages = page.getByRole("region", { name: "Seed to harvest" });
  await expect(stages.locator("li strong")).toHaveText([
    "Seed", "First sprout", "Baby plant", "Semi-mature", "Pre-harvest", "Harvest",
  ]);
  await expect(stages.getByText("Pending", { exact: true })).toHaveCount(5);
  await expect(stages.getByRole("link", { name: "Harvest illustration" }))
    .toHaveAttribute("href", "/plant-icons/generated/rasmussen/master/aji-cristal-chilli-seeds-10-seeds.png");
});

test("Little Gem opens reviewed artwork for all six growth stages", async ({ page }) => {
  await page.goto("/test-garden");
  await page.getByRole("searchbox").fill("lettuce little gem");
  await page.locator(".tg-plot").first().click();
  const stages = page.getByRole("region", { name: "Seed to harvest" });
  const stageIds = ["seed", "first-sprout", "baby-plant", "semi-mature", "pre-harvest", "harvest"];
  for (const [index, stage] of stageIds.entries()) {
    const row = stages.locator("li").nth(index);
    await expect(row.getByRole("link").first())
      .toHaveAttribute("href", "/plant-icons/generated/kings-seeds/master/lettuce-little-gem-" + stage + ".png");
    const image = row.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(128);
  }
});

test("Rasmussen generated cultivar opens its exact Harvest artwork", async ({ page }) => {
  await page.goto("/test-garden");
  await page.getByRole("searchbox").fill("Aji Lemon Stumpy");
  await page.getByRole("button", { name: /Aji Lemon Stumpy/ }).click();
  const harvest = page.getByRole("region", { name: "Seed to harvest" })
    .getByRole("link", { name: "Harvest illustration" });
  await expect(harvest).toHaveAttribute("href",
    "/plant-icons/generated/rasmussen/master/aji-lemon-starburst-chilli-seeds-10-seeds.png");
  await harvest.scrollIntoViewIfNeeded();
  await expect(harvest.getByRole("img")).toHaveJSProperty("naturalWidth", 128);
});


test("all approved generated varieties occupy one isolated showcase bed", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/garden") && request.method() !== "GET") writes.push(request.url());
  });
  await page.goto("/test-garden#generated-bed");
  const tab = page.getByRole("button", { name: "All new icons bed" });
  await expect(tab).toHaveAttribute("aria-pressed", "true");
  const expected = Object.values(generatedArtwork)
    .filter(artwork => artwork.status === "generated_qa_passed").length;
  expect(expected).toBeGreaterThanOrEqual(449);
  await expect(page.locator(".tg-showcase-bed .tg-bed")).toHaveCount(1);
  await expect(page.locator(".tg-showcase-bed .tg-plot")).toHaveCount(expected);
  await expect(page.locator(".tg-showcase-bed .tg-plot img[data-art-source='generated']")).toHaveCount(expected);

  const kings = page.locator('[data-artwork-id="kings:chilli-mild-anaheim"] img');
  const rasmussen = page.locator('[data-artwork-id="rasmussen:anaheim-chilli-seeds-10-seeds"] img');
  await expect(kings).toHaveAttribute("src", generatedArtwork["kings:chilli-mild-anaheim"].gallery);
  await expect(rasmussen).toHaveAttribute("src", generatedArtwork["rasmussen:anaheim-chilli-seeds-10-seeds"].gallery);
  expect(await kings.getAttribute("src")).not.toBe(await rasmussen.getAttribute("src"));

  await page.getByRole("searchbox", { name: "SEARCH BY CROP OR VARIETY OR SUPPLIER" }).fill("Aji Cristal");
  await expect(page.locator(".tg-showcase-bed .tg-plot")).toHaveCount(1);
  await page.locator(".tg-showcase-bed .tg-plot").click();
  await expect(page.locator("#tg-inspector h2")).toHaveText("Aji Cristal");
  await expect(page.locator("#tg-inspector").getByRole("link", { name: /Open master image/ }))
    .toHaveAttribute("href", /master\\/aji-cristal-chilli-seeds-10-seeds\\.png$/);
  expect(writes).toEqual([]);
});
