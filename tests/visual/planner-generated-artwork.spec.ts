import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { supplierPlantIcon } from "../../lib/garden/supplier-plant-icons";
import { fixture } from "./helpers/fixture";

const kingsGallery = "/plant-icons/generated/kings-seeds/gallery/amaranth-garnet-red.png";
const rasmussenGallery = "/plant-icons/generated/rasmussen/gallery/aji-colorado-orange-chilli-seeds-10-seeds.png";

test("planner chooses completed PNGs by exact crop and variety", () => {
  expect(supplierPlantIcon("Amaranth", "Garnet Red")).toBe(kingsGallery);
  expect(supplierPlantIcon("Chilli", "Aji Colorado Orange")).toBe(rasmussenGallery);
  expect(supplierPlantIcon("Amaranth", "Green & Red")).not.toBe(kingsGallery);
  expect(supplierPlantIcon("Chilli", "7 Pot Jonah - Yellow"))
    .toBe("/plant-icons/rasmussen/7-pot-jonah-yellow-chilli-seeds-10-seeds.svg");
  expect(supplierPlantIcon("Chilli", "Variety that does not exist")).toBeUndefined();
  expect(existsSync(join(process.cwd(), "public", kingsGallery))).toBe(true);
  expect(existsSync(join(process.cwd(), "public", rasmussenGallery))).toBe(true);
});

test("generated artwork appears on placed plants and in the plant picker", async ({ page }, testInfo) => {
  const plan = structuredClone(fixture);
  plan.plantingAreas[0] = {
    ...plan.plantingAreas[0],
    crop: "Amaranth",
    variety: "Garnet Red",
    cropIcon: "🌿",
  };

  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") return route.fulfill({ json: { ok: true, plan } });
    if (path === "/api/gardens") return route.fulfill({ json: {
      ok: true, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }],
    } });
    return route.fulfill({ json: { ok: true, beds: [], items: [], notes: [], harvests: [] } });
  });

  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await expect(page.locator(".planting-area[data-crop='Amaranth'] .planting-area-icons i span").first())
    .toHaveCSS("background-image", /amaranth-garnet-red[.]png/);

  await page.locator(".gv-rail button")
    .filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await page.getByLabel(/Full plant catalogue/).check();
  await page.getByPlaceholder("Plant or variety").fill("Amaranth");
  await page.locator(".gv-plant-list > button[data-crop='Amaranth']").click();
  await expect(page.locator(".gv-ready-strip span span").first())
    .toHaveCSS("background-image", /amaranth-garnet-red[.]png/);
  expect((await page.request.get(kingsGallery)).ok()).toBe(true);

  await page.screenshot({ path: testInfo.outputPath("planner-generated-artwork.png"), fullPage: true });
});
