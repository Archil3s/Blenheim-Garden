import { expect, test } from "@playwright/test";

test("showcase loads genuine tomato GLB assets and retains both baseline comparisons", async ({page}, testInfo) => {
  test.setTimeout(95_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("/3d-showcase");
  await expect(page.getByRole("heading", {level: 1})).toContainText("Three ways");
  await expect(page.getByText("Not connected to saved plans")).toBeVisible();

  const stage = page.locator(".gs-stage");
  const glb = page.getByRole("button", {name: "Real GLB tomato"});
  const botanical = page.getByRole("button", {name: "Procedural study"});
  const classic = page.getByRole("button", {name: "Current low-poly"});
  await expect(glb).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-scene-ready", "asset", {timeout: 25000});
  await expect(stage).toHaveAttribute("data-model-ready", "fruiting", {timeout: 25000});
  await expect(stage.locator("canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("3D asset loaded");

  // A real glTF 2.0 binary is served—not an inline Three.js mesh posing as an asset.
  const response = await page.request.get("/assets/plants/tomato/fruiting/lod0.glb");
  expect(response.ok()).toBeTruthy();
  const bytes = await response.body();
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("glTF");
  expect(bytes.readUInt32LE(4)).toBe(2);
  const manifestResponse = await page.request.get("/assets/plants/tomato/manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.files).toHaveLength(9);

  await page.screenshot({path: testInfo.outputPath("glb-tomato-fruiting.png"), fullPage: true, animations: "disabled"});
  await page.getByLabel("Tomato growth stage").selectOption("vegetative");
  await expect(stage).toHaveAttribute("data-model-ready", "vegetative", {timeout: 25000});
  await page.screenshot({path: testInfo.outputPath("glb-tomato-vegetative.png"), fullPage: true, animations: "disabled"});
  await page.getByLabel("Tomato growth stage").selectOption("seedling");
  await expect(stage).toHaveAttribute("data-model-ready", "seedling", {timeout: 25000});
  await page.screenshot({path: testInfo.outputPath("glb-tomato-seedling.png"), fullPage: true, animations: "disabled"});

  await botanical.click();
  await expect(botanical).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-scene-ready", "botanical", {timeout: 20000});
  await page.screenshot({path: testInfo.outputPath("procedural-study.png"), fullPage: true, animations: "disabled"});
  await classic.click();
  await expect(classic).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-scene-ready", "classic", {timeout: 20000});
  await page.screenshot({path: testInfo.outputPath("original-low-poly.png"), fullPage: true, animations: "disabled"});

  await glb.click();
  await expect(stage).toHaveAttribute("data-model-ready", "seedling", {timeout: 25000});
  await page.getByRole("button", {name: /Reset camera/}).click();
  await expect(page.locator(".gs-error")).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
