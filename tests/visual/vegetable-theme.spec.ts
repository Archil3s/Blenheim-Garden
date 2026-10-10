import { expect, test } from "@playwright/test";
import artwork from "../../lib/garden/botanical-artwork.json";
import { plants } from "../../lib/garden/plant-catalog";
import { plantIconSprite } from "../../lib/garden/plant-icons";

const crops = ["Bean", "Lettuce", "Pumpkin", "Carrot", "Broccoli", "Artichoke", "Asparagus", "Spinach", "Chard", "Cabbage", "Corn", "Pepper"];
const plan = {
  beds: crops.map((crop, i) => ({ id: i + 1, name: crop, x: 5 + i % 4 * 24, y: 5 + Math.floor(i / 4) * 30, w: 20, h: 24 })),
  plantingAreas: crops.map((crop, i) => ({ id: `theme-${i}`, bedId: i + 1, crop, variety: plants.find(p => p.name === crop)?.varieties[0] ?? "", cropIcon: "", spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 4, pattern: "grid", iconSize: 32, visualSpacing: "normal" })),
  rows: [], objects: [],
};

test("all vegetable options have detailed artwork and every generated image decodes", async ({ page }) => {
  for (const plant of plants.filter(p => p.type === "Vegetable")) for (const variety of plant.varieties) {
    const sprite = plantIconSprite(plant.name, variety);
    expect(sprite, `${plant.name}: ${variety}`).not.toBeNull();
    expect(sprite?.src).toMatch(/\/plant-icons\/(botanical\/|individual\/)/);
  }
  await page.goto("/3d-audit");
  const decoded = await page.evaluate(async paths => Promise.all(paths.map(async src => {
    const image = new Image(); image.src = src; await image.decode();
    return { src, width: image.naturalWidth, height: image.naturalHeight };
  })), Object.values(artwork));
  expect(decoded).toHaveLength(Object.keys(artwork).length);
  expect(decoded.every(image => image.width === 1024 && image.height === 1024)).toBeTruthy();
});

test("the same vegetable theme renders in the 2D planner and interactive 3D", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await context.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") return route.fulfill({ json: { ok: true, plan } });
    if (path === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, beds: [], items: [], notes: [], harvests: [] } });
  });
  await page.goto("/");
  if (testInfo.project.name === "phone") {
    for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  }
  await expect(page.locator('.planting-area-icons [data-plant-art]:visible').first()).toBeVisible();
  await page.evaluate(() => Promise.all([...document.querySelectorAll<HTMLElement>('[style*="plant-icons/botanical/"]')].map(async element => {
    const src = element.style.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    if (src) { const image = new Image(); image.src = src; await image.decode(); }
  })));
  const artworkBox = await page.locator('.planting-area-icons [data-plant-art]:visible').first().boundingBox();
  expect(artworkBox?.width).toBeGreaterThan(20);
  expect(artworkBox?.height).toBeGreaterThan(20);
  expect(await page.locator('.planting-area-icons i:has([data-plant-art])').first().evaluate(element => getComputedStyle(element, '::before').display)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath("vegetable-theme-2d.png") });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByRole("button", { name: "Detailed 3D", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: testInfo.outputPath("vegetable-theme-3d.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator('.planting-area-icons [data-plant-art]:visible').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});
