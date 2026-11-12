import { expect, test } from "@playwright/test";
import generatedArtwork from "../../lib/garden/generated-artwork-manifest.json";
import kingsSeeds from "../../lib/garden/kings-seeds-varieties.json";
import rasmussen from "../../lib/garden/rasmussen-varieties.json";
import { supplierPlantIcon } from "../../lib/garden/supplier-plant-icons";
import type { PlannerPlan } from "../../lib/garden/planner-plan";

test("2D icon resolver uses only reviewed generated artwork and retains the SVG fallback", () => {
  const approvedPaths = new Set(Object.values(generatedArtwork)
    .filter(artwork => artwork.status === "generated_qa_passed")
    .map(artwork => artwork.gallery));

  for (const { crop, variety } of kingsSeeds) {
    expect(approvedPaths.has(supplierPlantIcon(crop, variety)!)).toBe(true);
  }
  expect(supplierPlantIcon("Amaranth", "Garnet Red"))
    .toBe("/plant-icons/generated/kings-seeds/gallery/amaranth-garnet-red.png");
  expect(supplierPlantIcon("Chilli", "Aji Cristal"))
    .toBe("/plant-icons/generated/rasmussen/gallery/aji-cristal-chilli-seeds-10-seeds.png");

  const pending = rasmussen.find(item => item.variety === "7 Pot Jonah - Yellow")!;
  expect(supplierPlantIcon(pending.crop, pending.variety))
    .toBe(`/plant-icons/rasmussen/${pending.id}.svg`);
  expect(supplierPlantIcon("Amaranth", "Unknown variety")).toBeUndefined();
});

for (const width of [390, 1440]) {
  test(`reviewed PNGs render contained in 2D planting rows at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const plan: PlannerPlan = {
      beds: [], plantingAreas: [], objects: [],
      rows: [
        { id: "kings-row", crop: "Amaranth", variety: "Garnet Red", cropIcon: "🌱",
          spacingCm: 30, x1: 120, y1: 350, x2: 120, y2: 350, count: 1 },
        { id: "rasmussen-row", crop: "Chilli", variety: "Aji Cristal", cropIcon: "🌶️",
          spacingCm: 40, x1: 240, y1: 450, x2: 240, y2: 450, count: 1 },
      ],
    };
    await page.route("**/api/**", route => route.fulfill({
      json: { ok: true, plan, gardens: [], beds: [], items: [], notes: [], harvests: [] },
    }));
    await page.goto("/planner");
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");

    for (const [crop, filename] of [
      ["Amaranth", "amaranth-garnet-red.png"],
      ["Chilli", "aji-cristal-chilli-seeds-10-seeds.png"],
    ]) {
      const icon = page.locator(`.planting-row[data-crop="${crop}"] .row-dots i > span`).first();
      await expect(icon).toHaveCSS("background-image", new RegExp(filename.replace(".", "\\.")));
      await expect(icon).toHaveCSS("background-size", "contain");
      const loaded = await icon.evaluate(async element => {
        const css = getComputedStyle(element).backgroundImage;
        const match = css.match(/url\\(["']?(.*?)["']?\\)/);
        if (!match) return false;
        const image = new Image();
        image.src = match[1];
        try { await image.decode(); } catch { return false; }
        return image.naturalWidth === 128 && image.naturalHeight === 128;
      });
      expect(loaded).toBe(true);
    }

    await page.screenshot({ path: info.outputPath(`generated-2d-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
  });
}
