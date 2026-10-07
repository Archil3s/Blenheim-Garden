import { expect, test, type Page } from "@playwright/test";
import { plants } from "../../lib/garden/plant-catalog";
import { plantArtworkCatalogue } from "../../lib/garden/plant-icons";
import { STRUCTURE_PRESETS } from "../../lib/garden/structure-catalog";
import type { AuditRecord } from "../../components/garden-audit-models";
import { readdirSync } from "node:fs";
import { join } from "node:path";

async function records(page: Page): Promise<AuditRecord[]> {
  return JSON.parse(await page.locator("#audit-records").textContent() ?? "[]");
}

test("audit covers registries, keeps garden storage isolated and supports inspection", async ({ page }) => {
  test.setTimeout(120_000);
  const requests: string[] = [], errors: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("audit-existing-garden", JSON.stringify({ id: "untouched", beds: [1, 2] }));
    const accesses: string[] = [];
    (window as unknown as { auditStorageAccesses: string[] }).auditStorageAccesses = accesses;
    for (const name of ["getItem", "setItem", "removeItem", "clear", "key"] as const) {
      const original = Storage.prototype[name];
      Object.defineProperty(Storage.prototype, name, { value: function (...args: unknown[]) { accesses.push(name + ":" + args[0]); return Reflect.apply(original, this, args); } });
    }
  });
  await page.goto("/3d-audit");
  await expect(page.locator("[data-audit-id]").first()).toBeVisible({ timeout: 60_000 });
  const high = await records(page), specimenPlants = high.filter((entry) => entry.kind === "plant");
  const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const crop of plants) for (const variety of crop.varieties) expect(specimenPlants.some((entry) => normal(entry.name) === normal(crop.name) && normal(entry.variety) === normal(variety))).toBeTruthy();
  for (const art of plantArtworkCatalogue()) expect(specimenPlants.some((entry) => normal(entry.name) === normal(art.crop) && normal(entry.variety === "Default" ? "" : entry.variety) === normal(art.variety))).toBeTruthy();
  expect(specimenPlants.some((entry) => entry.name === "Potato")).toBeTruthy();
  for (const preset of STRUCTURE_PRESETS) expect(high.filter((entry) => entry.object?.type === "structure" && entry.object.kind === preset.kind)).toHaveLength(3);
  expect(high.filter((entry) => entry.kind === "bed")).toHaveLength(5);
  expect(high.some((entry) => entry.kind === "text" && entry.badges.includes("MISSING"))).toBeTruthy();
  expect(new Set(high.map((entry) => entry.id)).size).toBe(high.length);
  const artworkFiles: string[] = [];
  const collectArtwork = (directory: string) => {
    for (const file of readdirSync(join(process.cwd(), "public", directory), { withFileTypes: true })) {
      const path = directory + "/" + file.name;
      if (file.isDirectory()) collectArtwork(path);
      else if (/\.(png|svg|webp|jpe?g)$/i.test(file.name)) artworkFiles.push("/" + path);
    }
  };
  collectArtwork("plant-icons");
  for (const path of artworkFiles) expect(high.some((entry) => entry.artwork?.src === path)).toBeTruthy();
  expect(high.every((entry) => entry.assetExists !== false)).toBeTruthy();
  expect(specimenPlants.every((entry) => entry.badges.includes("TRUE 3D") && entry.badges.includes("SIZE FALLBACK"))).toBeTruthy();
  const beefsteak = specimenPlants.find((entry) => entry.name === "Tomato" && /beefsteak/i.test(entry.variety))!;
  await page.getByLabel("Search", { exact: true }).fill(beefsteak.id);
  await expect(page.locator("[data-audit-id]")).toHaveCount(1);
  await page.locator(`[data-audit-id="${beefsteak.id}"]`).click();
  await expect(page.getByRole("heading", { level: 2 })).toContainText(beefsteak.id);
  await expect(page.locator(".audit-inspector")).toContainText("Canonical production low-poly geometry");
  for (const label of ["Show bounds", "Show origins", "Measurement grid"]) await page.getByLabel(label, { exact: true }).check();
  await page.getByRole("button", { name: "Screenshot mode", exact: true }).click();
  await expect(page.locator(".audit-toolbar")).toBeHidden();
  await expect(page.locator(".audit-inspector")).toBeHidden();
  await expect(page.locator(".audit-canvas canvas")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".audit-toolbar")).toBeVisible();
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await page.getByLabel("Filter", { exact: true }).selectOption("Missing");
  await expect(page.locator("[data-audit-id]")).toHaveCount(1);
  await page.getByLabel("Filter", { exact: true }).selectOption("Structures");
  await expect(page.locator("[data-audit-id]")).toHaveCount(STRUCTURE_PRESETS.length * 3);
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await page.getByLabel("Detail level").selectOption("Low");
  await expect.poll(async () => (await records(page))[0].lod, { timeout: 60_000 }).toContain("Low");
  const low = await records(page);
  expect(low.filter((entry) => entry.kind === "plant").reduce((total, entry) => total + entry.triangles, 0)).toBeLessThan(specimenPlants.reduce((total, entry) => total + entry.triangles, 0));
  await page.getByLabel("Detail level").selectOption("Medium");
  await expect.poll(async () => (await records(page))[0].lod, { timeout: 60_000 }).toContain("High alias");
  expect((await records(page)).map((entry) => entry.fingerprint)).toEqual(high.map((entry) => entry.fingerprint));
  expect((await records(page)).map((entry) => entry.bounds)).toEqual(high.map((entry) => entry.bounds));
  await page.getByLabel("Force mobile", { exact: true }).check();
  await expect.poll(async () => (await records(page))[0].lod, { timeout: 60_000 }).toContain("Low");
  await page.getByLabel("Force mobile", { exact: true }).uncheck();
  await expect.poll(async () => (await records(page))[0].lod, { timeout: 60_000 }).toContain("High alias");
  const accesses = await page.evaluate(() => (window as unknown as { auditStorageAccesses: string[] }).auditStorageAccesses);
  expect(accesses).toEqual([]); expect(requests).toEqual([]); expect(errors).toEqual([]);
  await page.getByLabel("Detail level").selectOption("High");
  await expect.poll(async () => (await records(page))[0].lod).toBe("High");
  await page.screenshot({ path: `visual-artifacts/current/audit-${test.info().project.name}.png` });
});

test("failed original artwork remains visible as an error placeholder", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/plant-icons/individual/achillea.png", (route) => route.abort());
  await page.goto("/3d-audit");
  await expect(page.locator("[data-audit-id]").first()).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Renderer", { exact: true }).selectOption("Legacy artwork");
  await expect.poll(async () => (await records(page)).filter((entry) => entry.name === "Achillea").every((entry) => entry.badges.includes("ASSET ERROR")), { timeout: 60_000 }).toBeTruthy();
  await page.getByLabel("Filter", { exact: true }).selectOption("Missing");
  await expect(page.locator("[data-audit-id]").first()).toBeVisible();
  const failed = (await records(page)).find((entry) => entry.name === "Achillea")!;
  expect(failed.materials).toBeGreaterThan(0);
  expect(failed.geometries).toBeGreaterThan(0);
  await page.locator(`[data-audit-id="${failed.id}"]`).click();
  await expect(page.locator(".audit-inspector")).toContainText("FAILED ASSET");
  await page.screenshot({ path: `visual-artifacts/current/audit-error-${test.info().project.name}.png` });
  await page.getByLabel("Renderer", { exact: true }).selectOption("Legacy geometry");
  await expect.poll(async () => (await records(page)).find((entry) => entry.name === "Potato")?.inferredKind, { timeout: 60_000 }).toBe("potato");
  expect((await records(page)).filter((entry) => entry.kind === "plant").every((entry) => entry.renderer === "Legacy procedural geometry")).toBeTruthy();
});
