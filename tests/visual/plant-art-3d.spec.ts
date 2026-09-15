import { expect, test } from "@playwright/test";

const crops = [
  ["Achillea", "", "achillea"], ["Agastache", "", "agastache"],
  ["Ageratum", "", "ageratum"], ["Agrostemma", "", "agrostemma"],
  ["Akeake", "", "akeake"], ["Alyssum", "", "alyssum"],
  ["Amaranth", "Garnet Red", "amaranth-garnet-red"],
  ["Amaranth", "Green Red", "amaranth-green-red"],
  ["Angelica", "Chinese", "angelica-chinese"],
  ["Angelica", "Holy Ghost", "angelica-holy-ghost"],
  ["Anise", "", "anise"], ["Anise Hyssop", "", "anise-hyssop"],
  ["Artichoke", "Green Globe", "artichoke-green-globe"],
  ["Asparagus", "Mary Washington", "asparagus-mary-washington"],
  ["Asparagus", "Pacific Challenger F1", "asparagus-pacific-challenger-f1"],
  ["Asparagus", "Pacific Purple", "asparagus-pacific-purple"],
];
const plan = {
  beds: crops.map((_, i) => ({ id: i + 1, name: `Bed ${i + 1}`, x: 8 + i % 4 * 23, y: 8 + Math.floor(i / 4) * 22, w: 17, h: 15 })),
  plantingAreas: crops.map(([crop, variety], i) => ({ id: `art-${i}`, bedId: i + 1, crop, variety, cropIcon: "", spacingCm: 30, x: 0, y: 0, w: 100, h: 100, count: 4, pattern: "grid", iconSize: 20, visualSpacing: "normal" })),
  rows: [], objects: [],
};

test("detailed plant art loads in inline and companion 3D", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const loaded = new Set<string>();
  page.on("response", response => {
    if (response.ok() && response.url().includes("/plant-icons/individual/")) loaded.add(response.url().split("/").pop()!);
  });
  await context.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") return route.fulfill({ json: { ok: true, plan } });
    if (path === "/api/gardens") return route.fulfill({ json: { ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }] } });
    return route.fulfill({ json: { ok: true, beds: [], items: [], notes: [], harvests: [] } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => crops.every(([, , file]) => loaded.has(`${file}.png`))).toBe(true);
  // Wait for decoded textures to reach a rendered frame.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: testInfo.outputPath("plant-art-perspective.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("plant-art-top.png") });
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 25, { steps: 8 });
  await page.mouse.up();
  await expect(canvas).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(canvas).toBeVisible();
  await page.goto("/3d");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: testInfo.outputPath("plant-art-companion.png") });
  expect(errors).toEqual([]);
});

