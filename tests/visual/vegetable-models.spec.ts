import { expect, test } from "@playwright/test";
import { plants } from "../../lib/garden/plant-catalog";
import { vegetableModelFor, vegetableModels } from "../../lib/garden/vegetable-model-catalog";
import { editorAction, openInspectorMore } from "./helpers/editor-controls";
import * as THREE from "three";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const vegetables = plants.filter((plant) => plant.type === "Vegetable");
const modelCrops = plants.filter((plant) => vegetableModelFor(plant.name, plant.varieties[0]));
const plan = {
  beds: modelCrops.map((plant, i) => ({ id: i + 1, name: plant.name, x: 5 + i % 5 * 18, y: 10 + Math.floor(i / 5) * 29, w: 16, h: 25 })),
  plantingAreas: modelCrops.map((plant, i) => ({ id: `vegetable-${i}`, bedId: i + 1, crop: plant.name, variety: plant.varieties[0], cropIcon: "", spacingCm: plant.spacingCm, x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 18, visualSpacing: "normal", placements: [{ id: `one-${i}`, x: 35, y: 50 }, { id: `two-${i}`, x: 65, y: 50 }] })),
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
  await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  const manifest = await (await page.request.get("/models/vegetables/manifest.json")).json();
  expect(manifest).toHaveLength(vegetableModels.length);
  for (const plant of modelCrops) for (const variety of plant.varieties) {
    expect(manifest.find((model: { crop: string; variety: string }) => model.crop === plant.name && model.variety === variety), `${plant.name}: ${variety}`).toBeTruthy();
  }
  for (const crop of modelCrops.map((plant) => plant.name)) {
    await frame.getByLabel("Vegetable", { exact: true }).selectOption(crop);
    await expect(canvas).toHaveAttribute("data-model-id", vegetableModelFor(crop)!.id);
    await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  }
  await frame.getByLabel("Vegetable", { exact: true }).selectOption("Artichoke");
  await expect(canvas).toHaveAttribute("data-model-id", "artichoke-green-globe");
  await frame.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Rotate", exact: true })).toHaveAttribute("aria-pressed", "true");
  await frame.getByRole("button", { name: "Reset view" }).click();
  await frame.getByRole("button", { name: "Mobile detail" }).click();
  await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
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

test("organic detail remains visible in desktop and mobile models", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/3d-models");
  const frame = page.frameLocator('iframe[title="Interactive vegetable models"]');
  await expect(frame.locator("canvas")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  for (const quality of ["desktop", "mobile"]) {
    if (quality === "mobile") await frame.getByRole("button", { name: "Mobile detail" }).click();
  for (const crop of ["Asparagus", "Raspberry", "Lettuce", "Broccoli", "Carrot", "Pumpkin", "Strawberry", "Blueberry", "Herbs", "Leek", "Corn", "Pepper", "Pea", "Kale"]) {
      await frame.getByLabel("Vegetable", { exact: true }).selectOption(crop);
      await expect(frame.locator("canvas")).toHaveAttribute("data-model-id", vegetableModelFor(crop)!.id);
      await expect(frame.locator("canvas")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      await expect(frame.getByRole("link", { name: "Download GLB" })).toHaveAttribute("href", quality === "mobile" ? vegetableModelFor(crop)!.mobile : vegetableModelFor(crop)!.desktop);
      await page.screenshot({ path: testInfo.outputPath(`${crop.toLowerCase()}-${quality}.png`) });
    }
    await frame.getByLabel("Vegetable", { exact: true }).selectOption("Herbs");
    for (const variety of ["Basil", "Chives", "Thyme", "Parsley"]) {
      await frame.getByLabel("Variety", { exact: true }).selectOption(vegetableModelFor("Herbs", variety)!.id);
      await expect(frame.locator("canvas")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      await expect(frame.locator("canvas")).toHaveAttribute("data-model-id", vegetableModelFor("Herbs", variety)!.id);
      await page.screenshot({ path: testInfo.outputPath(`${variety.toLowerCase()}-${quality}.png`) });
    }
  }
  expect(errors).toEqual([]);
});

test("every exported desktop and mobile model parses with finite textured geometry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Asset integrity is independent of viewport");
  test.setTimeout(180_000);
  await page.goto("/models/vegetables/index.html");
  await expect(page.locator("canvas")).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  const report = await page.evaluate(async () => {
    // Native module imports exercise exactly the locally hosted production loader.
    const dynamicImport = new Function("url", "return import(url)");
    const THREE = await dynamicImport("/models/tomato/vendor/three.module.js");
    const { GLTFLoader } = await dynamicImport("/models/tomato/vendor/GLTFLoader.js");
    const manifest = await (await fetch("/models/vegetables/manifest.json")).json();
    const assets = new Map<string, { triangles: number; textured: number; dimensions: number[] }>();
    const loader = new GLTFLoader(), results: { path: string; triangles: number; textured: number; normalMapped: number; roughnessMapped: number; validColors: boolean; finite: boolean; grounded: boolean }[] = [];
    for (const model of manifest) for (const quality of ["desktop", "mobile"]) assets.set(model[quality], model.stats[quality]);
    for (const [path, stats] of assets) {
      const { scene } = await loader.loadAsync(path);
      let triangles = 0, textured = 0, normalMapped = 0, roughnessMapped = 0, finite = true, validColors = true;
      scene.traverse((object: { isMesh?: boolean; geometry: { index?: { count: number }; getAttribute: (name: string) => { count: number; array: ArrayLike<number>; getX: (i: number) => number; getY: (i: number) => number; getZ: (i: number) => number }; dispose: () => void }; material: { map?: { dispose: () => void }; normalMap?: { dispose: () => void }; roughnessMap?: { dispose: () => void }; dispose: () => void } | { map?: { dispose: () => void }; normalMap?: { dispose: () => void }; roughnessMap?: { dispose: () => void }; dispose: () => void }[] }) => {
        if (!object.isMesh) return;
        const vertices = object.geometry.getAttribute("position");
        finite &&= Array.from(vertices.array).every(Number.isFinite);
        const colors = object.geometry.getAttribute("color");
        if (colors) for (let i = 0; i < colors.count; i++) validColors &&= [colors.getX(i), colors.getY(i), colors.getZ(i)].every(value => Number.isFinite(value) && value >= 0 && value <= 1);
        triangles += (object.geometry.index?.count ?? vertices.count) / 3;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        if (materials.some(material => material.map)) textured++;
        if (materials.some(material => material.normalMap)) normalMapped++;
        if (materials.some(material => material.roughnessMap)) roughnessMapped++;
      });
      const box = new THREE.Box3().setFromObject(scene);
      if (triangles !== stats.triangles || textured !== stats.textured) throw new Error("Model statistics mismatch: " + path);
      results.push({ path, triangles, textured, normalMapped, roughnessMapped, validColors, finite, grounded: Math.abs(box.min.y) < .0001 });
      scene.traverse((object: { isMesh?: boolean; geometry: { dispose: () => void }; material: { map?: { dispose: () => void }; normalMap?: { dispose: () => void }; roughnessMap?: { dispose: () => void }; dispose: () => void } | { map?: { dispose: () => void }; normalMap?: { dispose: () => void }; roughnessMap?: { dispose: () => void }; dispose: () => void }[] }) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) { material.map?.dispose(); material.normalMap?.dispose(); material.roughnessMap?.dispose(); material.dispose(); }
      });
    }
    return results;
  });
  expect(report.length).toBeGreaterThanOrEqual(vegetables.length * 2);
  expect(report.every((model) => model.finite && model.grounded && model.triangles > 0 && model.textured > 0)).toBeTruthy();
  expect(report.filter((model) => model.path.includes("/vegetables/")).every((model) => model.normalMapped > 0 && model.roughnessMapped > 0 && model.validColors)).toBeTruthy();
  await testInfo.attach("all-model-integrity", { body: JSON.stringify(report), contentType: "application/json" });
});

test("all indexed vegetables render in garden beds and rows with mobile assets", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [], models: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.ok() && /\/models\/vegetables\/.*\.glb/.test(response.url())) models.push(response.url()); });
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  const expected = [...new Set([...plan.plantingAreas, ...plan.rows].filter((area) => area.crop !== "Tomato").map((area) => vegetableModelFor(area.crop, area.variety)!.id))].sort().join("|");
  await expect(canvas).toHaveAttribute("data-vegetable-models", expected, { timeout: 60_000 });
  await expect(canvas).toHaveAttribute("data-tomato-model", "refined");
  expect(models.length).toBeGreaterThanOrEqual(9);
  expect(models.some((url) => url.endsWith("-mobile.glb"))).toBeTruthy();
  expect(models.some((url) => !url.endsWith("-mobile.glb"))).toBe(testInfo.project.name !== "phone");
  await page.screenshot({ path: testInfo.outputPath("vegetable-models-garden.png") });
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("vegetable-models-garden-top.png") });
  await editorAction(page, "Add plant");
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Lettuce");
  await page.getByRole("combobox", { name: "Variety", exact: true }).selectOption("Loose leaf");
  await expect(canvas).toHaveAttribute("data-vegetable-models", /lettuce-loose-leaf/);
  const before = await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"));
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Herbs");
  for (const variety of ["Basil", "Chives", "Thyme", "Parsley"]) {
    await page.getByRole("combobox", { name: "Variety", exact: true }).selectOption(variety);
    await expect(canvas).toHaveAttribute("data-vegetable-models", new RegExp(vegetableModelFor("Herbs", variety)!.id));
  }
  expect(await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"))).toBe(before);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.goto("/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByRole("button", { name: "Detailed 3D", exact: true }).click();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-vegetable-models", expected, { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test("failed vegetable assets preserve editing and can recover", async ({ page, context }) => {
  await context.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await context.route("**/models/vegetables/*.glb", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/3d?view=3d");
  await expect(page.getByRole("status").filter({ hasText: "Detailed vegetable models" })).toContainText("Basic plants are still available", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Select", exact: true })).toBeEnabled();
  await context.unroute("**/models/vegetables/*.glb");
  await page.reload();
  await expect(page.locator('[aria-label="Interactive 3D garden workspace"] canvas')).toHaveAttribute("data-vegetable-models", /broccoli-winter-rudolph/, { timeout: 60_000 });
  await expect(page.getByRole("status").filter({ hasText: "Detailed vegetable models" })).toHaveCount(0);
});

test("growth previews change foliage, flowers and fruit and export the displayed stage", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/3d-models");
  const frame = page.frameLocator('iframe[title="Interactive vegetable models"]'), canvas = frame.locator("canvas");
  await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  for (const quality of ["desktop", "mobile"]) {
    if (quality === "mobile") await frame.getByRole("button", { name: "Mobile detail" }).click();
    for (const crop of ["Lettuce", "Pepper", "Blueberry"]) {
      await frame.getByLabel("Vegetable", { exact: true }).selectOption(crop);
      await expect(canvas).toHaveAttribute("data-model-id", vegetableModelFor(crop)!.id);
      await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
      for (const phase of ["seedling", "leafy", "flowering", "mature"]) {
        await frame.getByLabel("Growth stage", { exact: true }).selectOption(phase);
        await expect(canvas).toHaveAttribute("data-growth-phase", phase);
        if (phase !== "mature") await expect(canvas).toHaveAttribute("data-fruit-meshes", "0");
        if (phase === "seedling" || phase === "leafy") await expect(canvas).toHaveAttribute("data-flower-meshes", "0");
        if (crop !== "Lettuce" && (phase === "flowering" || phase === "mature")) expect(Number(await canvas.getAttribute("data-flower-meshes"))).toBeGreaterThan(0);
        if (crop !== "Lettuce" && phase === "mature") expect(Number(await canvas.getAttribute("data-fruit-meshes"))).toBeGreaterThan(0);
        await page.screenshot({ path: testInfo.outputPath(`${crop.toLowerCase()}-${phase}-${quality}.png`) });
        if (testInfo.project.name === "desktop" && crop === "Pepper" && quality === "desktop" && ["seedling", "flowering"].includes(phase)) {
          const downloadEvent = page.waitForEvent("download"); await frame.getByRole("link", { name: "Download GLB" }).click();
          const download = await downloadEvent; expect(download.suggestedFilename()).toBe(`pepper-default-${phase}.glb`);
          const target = testInfo.outputPath(download.suggestedFilename()); await download.saveAs(target);
          const bytes = await readFile(target), length = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
          expect(json.asset.version).toBe("2.0"); expect(json.nodes.some((node: { extras?: { growthPhase?: string } }) => node.extras?.growthPhase === phase)).toBeTruthy();
          expect(json.nodes.some((node: { extras?: { plantPart?: string } }) => node.extras?.plantPart === "fruit")).toBeFalsy();
          if (phase === "seedling") for (const node of json.nodes.filter((node: { mesh?: number; extras?: { plantPart?: string } }) => node.extras?.plantPart === "leaf")) {
            expect(json.meshes[node.mesh].primitives.every((primitive: { attributes: { COLOR_0?: number } }) => primitive.attributes.COLOR_0 !== undefined)).toBeTruthy();
          }
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

test("garden growth appearances preserve the plan and camera focus reveals desktop detail", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await context.route("**/api/**", route => route.fulfill({ json: { ok: true, plan, gardens: [], items: [] } }));
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-vegetable-models", /blueberry-southern-highbush/, { timeout: 60_000 });
  const before = await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"));
  const options = page.locator(".garden-build-options"); await options.locator(":scope > summary").press("Enter");
  for (const phase of ["seedling", "leafy", "flowering", "mature", "seedling", "mature"]) {
    await page.getByLabel("Crop appearance", { exact: true }).selectOption(phase);
    await expect(canvas).toHaveAttribute("data-growth-phases", phase);
    await page.screenshot({ path: testInfo.outputPath(`garden-${phase}.png`) });
  }
  await options.locator(":scope > summary").press("Enter");
  await page.getByRole("button", { name: "Objects", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Select garden objects" });
  await dialog.getByLabel("Find an object").fill("Tomato"); await dialog.locator(".garden-object-list button").first().click(); await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await editorAction(page, "Focus bed");
  await expect(canvas).toHaveAttribute("data-detail-levels", testInfo.project.name === "phone" ? "mobile" : /desktop/);
  expect(await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"))).toBe(before);
  expect(errors).toEqual([]);
});

test("plant shapes export distinct geometry and the optional breeze respects reduced motion", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/models/vegetables/index.html?crop=Pepper");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  const binaries: string[] = [];
  for (const shape of ["0", "1", "2"]) {
    await page.getByLabel("Plant shape", { exact: true }).selectOption(shape);
    await expect(canvas).toHaveAttribute("data-plant-shape", shape);
    await page.screenshot({ path: testInfo.outputPath(`pepper-shape-${shape}.png`) });
    const downloading = page.waitForEvent("download"); await page.getByRole("link", { name: "Download GLB" }).click();
    const download = await downloading, filename = testInfo.outputPath(`shape-${shape}.glb`); await download.saveAs(filename);
    const bytes = await readFile(filename);
    const length = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
    const positionBuffers = json.meshes.flatMap((mesh: { primitives: { attributes: { POSITION: number } }[] }) => mesh.primitives.map(primitive => {
      const accessor = json.accessors[primitive.attributes.POSITION], view = json.bufferViews[accessor.bufferView];
      const offset = 28 + length + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
      return bytes.subarray(offset, offset + accessor.count * 3 * 4);
    }));
    binaries.push(createHash("sha256").update(Buffer.concat(positionBuffers)).digest("hex"));
    expect(json.asset.version).toBe("2.0");
    expect(json.nodes.some((node: { extras?: { plantPart?: string } }) => node.extras?.plantPart === "fruit")).toBeTruthy();
  }
  expect(new Set(binaries).size).toBe(3);
  await page.getByRole("button", { name: "Breeze", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-breeze", "off");
  await expect(page.getByRole("status")).toContainText("reduced motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-breeze", "on");
  const before = await canvas.screenshot(), frame = Number(await canvas.getAttribute("data-render-frames"));
  await expect.poll(async () => Number(await canvas.getAttribute("data-render-frames"))).toBeGreaterThan(frame + 5);
  expect((await canvas.screenshot()).equals(before)).toBeFalsy();
  await page.getByRole("button", { name: "Breeze", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-breeze", "off");
  await page.getByRole("button", { name: "Mobile detail" }).click();
  await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  for (const crop of ["Strawberry", "Blueberry", "Lettuce", "Tomato"]) {
    await page.getByLabel("Vegetable", { exact: true }).selectOption(crop);
    await expect(canvas).toHaveAttribute("data-model-id", vegetableModelFor(crop)!.id);
    await expect(canvas).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
    await page.screenshot({ path: testInfo.outputPath(`${crop.toLowerCase()}-upright-mobile.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test("different plant shapes select and move their own saved positions", async ({ page, context }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const fixture = { ...plan, beds: [{ id: 88, name: "Shape test", x: 10, y: 20, w: 80, h: 60 }],
    plantingAreas: [{ ...plan.plantingAreas[0], id: "shape-area", bedId: 88, crop: "Lettuce", variety: "Cos", count: 3,
      placements: [20, 50, 80].map((x, i) => ({ id: `shape-${i}`, x, y: 50 })) }], rows: [] };
  await context.route("**/api/**", route => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], items: [] } }));
  await page.goto("/3d?view=3d");
  const canvas = page.locator('[aria-label="Interactive 3D garden workspace"] canvas');
  await expect(canvas).toHaveAttribute("data-vegetable-models", /lettuce-cos/, { timeout: 60_000 });
  const before = await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"));
  await page.locator(".garden-build-options > summary").press("Enter");
  await page.getByLabel("Gentle plant breeze").check();
  await expect(canvas).toHaveAttribute("data-breeze", "off");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-breeze", "on");
  await page.screenshot({ path: testInfo.outputPath("garden-breeze.png") });
  await page.getByLabel("Gentle plant breeze").uncheck();
  await expect(canvas).toHaveAttribute("data-breeze", "off");
  expect(await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"))).toBe(before);
  await page.locator(".garden-build-options > summary").press("Enter");
  const previousCamera = await canvas.getAttribute("data-camera");
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await expect.poll(() => canvas.getAttribute("data-camera")).not.toBe(previousCamera);
  for (let i = 0; i < 3; i++) {
    await expect.poll(async () => {
      const state = JSON.parse((await canvas.getAttribute("data-camera"))!), box = (await canvas.boundingBox())!;
      return Math.abs(state.projection[5] / state.projection[0] - box.width / box.height);
    }).toBeLessThan(.005);
    const x = 90 + [20, 50, 80][i] * 7.2;
    const state = JSON.parse((await canvas.getAttribute("data-camera"))!), camera = new THREE.PerspectiveCamera();
    camera.matrixWorld.fromArray(state.world); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); camera.projectionMatrix.fromArray(state.projection);
    const point = new THREE.Vector3(x / 100 - 4.5 + .07, .42, .04).project(camera), box = (await canvas.boundingBox())!;
    const target = { x: box.x + (point.x + 1) * box.width / 2, y: box.y + (1 - point.y) * box.height / 2 };
    if (testInfo.project.name === "phone") await page.touchscreen.tap(target.x, target.y); else await page.mouse.click(target.x, target.y);
    await expect(page.locator(".garden-edit-inspector")).toContainText("Individual plant");
    await openInspectorMore(page);
    const input = page.locator(".garden-edit-inspector").getByLabel("X (cm)");
    await expect(input).toHaveValue(String(x)); await input.fill(String(x + 10)); await input.press("Enter");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!).plantingAreas[0].placements.sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)))).toEqual(
      fixture.plantingAreas[0].placements.map((p, index) => ({ ...p, x: expect.closeTo(p.x + (index <= i ? 10 / 7.2 : 0), 6) })));
    await page.getByRole("button", { name: "Deselect", exact: true }).click();
    await expect(page.locator(".garden-edit-inspector")).toHaveCount(0);
  }
  await expect(canvas).toHaveAttribute("data-plant-count", "3");
  expect(errors).toEqual([]);
});
