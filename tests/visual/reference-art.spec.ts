import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import plants from "../../lib/garden/reference-plant-data.json";
import textures from "../../lib/garden/reference-textures.json";
import { referencePlantSprite } from "../../lib/garden/reference-sprites";
import { referenceObjects } from "../../lib/garden/reference-objects";
import { REFERENCE_STRUCTURE_PRESETS, isPlannerStructureKind } from "../../lib/garden/structure-catalog";
import { fixture } from "./helpers/fixture";

test("original artwork covers the source catalogue and resolves local atlases", () => {
  const frames: Record<string, { src: string; x: number; y: number; w: number; h: number; atlasWidth: number; atlasHeight: number }> = textures;
  expect(plants).toHaveLength(432);
  for (const plant of plants) {
    expect(frames[plant.code], plant.name).toBeDefined();
    expect(plants.filter((item) => item.name.trim().toLowerCase() === plant.name.trim().toLowerCase()).map((item) => item.code), plant.name).toContain(referencePlantSprite(plant.name)?.code);
  }
  expect(REFERENCE_STRUCTURE_PRESETS).toHaveLength(203);
  for (const object of referenceObjects) {
    expect(isPlannerStructureKind(`reference-${object.code}`)).toBe(true);
    const names = object.shape.sprite.names ? Object.values(object.shape.sprite.names) : [object.shape.sprite.name ?? object.code];
    for (const code of names.filter((code): code is string => Boolean(code))) expect(frames[code], `${object.code}: ${code}`).toBeDefined();
  }
  for (const frame of Object.values(frames)) {
    expect(frame.x + frame.w).toBeLessThanOrEqual(frame.atlasWidth);
    expect(frame.y + frame.h).toBeLessThanOrEqual(frame.atlasHeight);
    expect(existsSync(path.join(process.cwd(), "public", frame.src))).toBe(true);
  }
});

test("original plant images and scalable object artwork render without moving beds", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) => route.fulfill({ json: {
    ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }], beds: [], items: [], notes: [], harvests: [],
  } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await expect(page.locator('.planting-area-icons [data-reference-art="STR"]').first()).toBeVisible();
  await expect(page.locator(".plan-bed")).toHaveCount(12);
  const beds = await page.locator(".plan-bed").evaluateAll((els) => els.map((el) => el.getAttribute("style")));
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Structures$/ }) }).click();
  await page.getByLabel(/Full structure catalogue/).check();
  await page.getByPlaceholder("Object name").fill("GH03");
  await page.locator(".gv-structure-list button").filter({ hasText: "GH03" }).click();
  await expect(page.locator('.gv-structure-list [data-reference-object="GH03"]')).toBeVisible();
  await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  await page.mouse.click(canvas.x + canvas.width * .10, canvas.y + canvas.height * .47);
  await expect(page.locator('.structure-object[data-kind="reference-GH03"]')).toBeVisible();
  await expect(page.locator('.structure-object [data-reference-object="GH03"]')).toBeVisible();
  expect(await page.locator(".plan-bed").evaluateAll((els) => els.map((el) => el.getAttribute("style")))).toEqual(beds);
  await page.screenshot({ path: testInfo.outputPath("original-artwork.png"), fullPage: true });
  expect(errors).toEqual([]);
});
