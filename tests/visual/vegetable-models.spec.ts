import { expect, test } from "@playwright/test";
import { plants } from "../../lib/garden/plant-catalog";
import { vegetableModelFor, vegetableModels } from "../../lib/garden/vegetable-model-catalog";

const vegetables = plants.filter((plant) => plant.type === "Vegetable");
const plan = {
  beds: vegetables.map((plant, i) => ({ id: i + 1, name: plant.name, x: 5 + i % 5 * 18, y: 18 + Math.floor(i / 5) * 40, w: 16, h: 30 })),
  plantingAreas: vegetables.map((plant, i) => ({ id: `vegetable-${i}`, bedId: i + 1, crop: plant.name, variety: plant.varieties[0], cropIcon: "", spacingCm: plant.spacingCm, x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 18, visualSpacing: "normal", placements: [{ id: `one-${i}`, x: 35, y: 50 }, { id: `two-${i}`, x: 65, y: 50 }] })),
  rows: [{ id: "lettuce-row", crop: "Lettuce", variety: "Cos", cropIcon: "", spacingCm: 35, x1: 200, y1: 950, x2: 650, y2: 950, count: 5 }],
  objects: [],
};

test("model library has every indexed vegetable and usable download controls", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [], apiCalls: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/api/**", (route) => { apiCalls.push(route.request().url()); return route.fulfill({ json: { ok: true } }); });
  await page.goto("/3d-models");
  const frame = page.frameLocator('iframe[title="Interactive vegetable models"]');
  const canvas = frame.locator("canvas");
  await expect(canvas).toHaveAttribute("data-model-ready", "true");
  const manifest = await (await page.request.get("/models/vegetables/manifest.json")).json();
  expect(manifest).toHaveLength(vegetableModels.length);
  for (const plant of vegetables) for (const variety of plant.varieties) {
    expect(manifest.find((model: { crop: string; variety: string }) => model.crop === plant.name && model.variety === variety), `${plant.name}: ${variety}`).toBeTruthy();
  }
  for (const crop of vegetables.map((plant) => plant.name)) {
    await frame.getByLabel("Vegetable", { exact: true }).selectOption(crop);
    await expect(canvas).toHaveAttribute("data-model-id", vegetableModelFor(crop)!.id);
    await expect(canvas).toHaveAttribute("data-model-ready", "true");
  }
  await frame.getByLabel("Vegetable", { exact: true }).selectOption("Artichoke");
  await expect(canvas).toHaveAttribute("data-model-id", "artichoke-green-globe");
  await frame.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Rotate", exact: true })).toHaveAttribute("aria-pressed", "true");
  await frame.getByRole("button", { name: "Reset view" }).click();
  await frame.getByRole("button", { name: "Mobile detail" }).click();
  await expect(canvas).toHaveAttribute("data-model-ready", "true");
  await expect(frame.getByRole("link", { name: "Download GLB" })).toHaveAttribute("href", "/models/vegetables/artichoke-green-globe-mobile.glb");
  const downloadEvent = page.waitForEvent("download");
  await frame.getByRole("link", { name: "Download GLB" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe("artichoke-green-globe-mobile.glb");
  await page.screenshot({ path: testInfo.outputPath("vegetable-model-library.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(await frame.locator("body").evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  if (testInfo.project.name === "phone") {
    expect((await frame.getByLabel("Vegetable", { exact: true }).boundingBox())!.width).toBeGreaterThan(130);
    expect((await frame.getByLabel("Variety", { exact: true }).boundingBox())!.width).toBeGreaterThan(130);
  }
  expect(apiCalls).toEqual([]);
  expect(errors).toEqual([]);
});

test("every exported desktop and mobile model parses with finite textured geometry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Asset integrity is independent of viewport");
  test.setTimeout(180_000);
  await page.goto("/models/vegetables/index.html");
  await expect(page.locator("canvas")).toHaveAttribute("data-model-ready", "true");
  const report = await page.evaluate(async () => {
    // Native module imports exercise exactly the locally hosted production loader.
    const dynamicImport = new Function("url", "return import(url)");
    const THREE = await dynamicImport("/models/tomato/vendor/three.module.js");
    const { GLTFLoader } = await dynamicImport("/models/tomato/vendor/GLTFLoader.js");
    const manifest = await (await fetch("/models/vegetables/manifest.json")).json();
    const assets = new Map<string, { triangles: number; textured: number; dimensions: number[] }>();
    const loader = new GLTFLoader(), results: { path: string; triangles: number; textured: number; finite: boolean; grounded: boolean }[] = [];
    for (const model of manifest) for (const quality of ["desktop", "mobile"]) assets.set(model[quality], model.stats[quality]);
    for (const [path, stats] of assets) {
      const { scene } = await loader.loadAsync(path);
      let triangles = 0, textured = 0, finite = true;
      scene.traverse((object: { isMesh?: boolean; geometry: { index?: { count: number }; getAttribute: (name: string) => { count: number; array: ArrayLike<number> }; dispose: () => void }; material: { map?: { dispose: () => void }; dispose: () => void } | { map?: { dispose: () => void }; dispose: () => void }[] }) => {
        if (!object.isMesh) return;
        const vertices = object.geometry.getAttribute("position");
        finite &&= Array.from(vertices.array).every(Number.isFinite);
        triangles += (object.geometry.index?.count ?? vertices.count) / 3;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        if (materials.some(material => material.map)) textured++;
      });
      const box = new THREE.Box3().setFromObject(scene);
      if (triangles !== stats.triangles || textured !== stats.textured) throw new Error("Model statistics mismatch: " + path);
      results.push({ path, triangles, textured, finite, grounded: Math.abs(box.min.y) < .0001 });
      scene.traverse((object: { isMesh?: boolean; geometry: { dispose: () => void }; material: { map?: { dispose: () => void }; dispose: () => void } | { map?: { dispose: () => void }; dispose: () => void }[] }) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) { material.map?.dispose(); material.dispose(); }
      });
    }
    return results;
  });
  expect(report.length).toBeGreaterThanOrEqual(vegetables.length * 2);
  expect(report.every((model) => model.finite && model.grounded && model.triangles > 0 && model.textured > 0)).toBeTruthy();
  await testInfo.attach("all-model-integrity", { body: JSON.stringify(report), contentType: "application/json" });
});

test("all indexed vegetables render in garden beds and rows with mobile assets", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [], models: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.ok() && /\/models\/vegetables\/.*\.glb/.test(response.url())) models.push(response.url()); });
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await page.goto("/3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  const expected = [...new Set([...plan.plantingAreas, ...plan.rows].filter((area) => area.crop !== "Tomato").map((area) => vegetableModelFor(area.crop, area.variety)!.id))].sort().join("|");
  await expect(canvas).toHaveAttribute("data-vegetable-models", expected, { timeout: 60_000 });
  await expect(canvas).toHaveAttribute("data-tomato-model", "refined");
  expect(models.length).toBeGreaterThanOrEqual(9);
  expect(models.every((url) => url.endsWith("-mobile.glb") === (testInfo.project.name === "phone"))).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("vegetable-models-garden.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("vegetable-models-garden-top.png") });
  await page.getByRole("button", { name: "Add plant", exact: true }).click();
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Lettuce");
  await page.getByRole("combobox", { name: "Variety", exact: true }).selectOption("Loose leaf");
  await expect(canvas).toHaveAttribute("data-vegetable-models", /lettuce-loose-leaf/);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-vegetable-models", expected, { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test("failed vegetable assets preserve editing and can recover", async ({ page, context }) => {
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await context.route("**/models/vegetables/*.glb", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/3d");
  await expect(page.getByRole("status").filter({ hasText: "Detailed vegetable models" })).toContainText("Basic plants are still available", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Select", exact: true })).toBeEnabled();
  await context.unroute("**/models/vegetables/*.glb");
  await page.reload();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-vegetable-models", /broccoli-winter-rudolph/, { timeout: 60_000 });
  await expect(page.getByRole("status").filter({ hasText: "Detailed vegetable models" })).toHaveCount(0);
});
