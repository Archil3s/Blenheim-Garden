import { expect, test } from "@playwright/test";

test("garden Environment V2 changes surroundings without disturbing crop models", async ({ page }, testInfo) => {
  test.setTimeout(105_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("/3d-showcase");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Three ways");
  const frame = page.locator(".gs-stage");
  const v2 = page.getByRole("button", {name: "Environment V2"});
  const original = page.getByRole("button", {name: "Existing environment"});
  const glb = page.getByRole("button", {name: "Real GLB tomato"});

  await expect(v2).toHaveAttribute("aria-pressed", "true");
  await expect(frame).toHaveAttribute("data-environment-ready", "v2", {timeout:30000});
  await expect(frame).toHaveAttribute("data-model-ready", "fruiting", {timeout:30000});
  await expect(glb).toHaveAttribute("aria-pressed", "true");
  await expect(frame.locator("canvas")).toBeVisible();
  const foliage = Number(await frame.getAttribute("data-foliage-instances"));
  const grasses = Number(await frame.getAttribute("data-grass-instances"));
  const gravel = Number(await frame.getAttribute("data-gravel-instances"));
  expect(foliage).toBeGreaterThan(500);
  expect(grasses).toBeGreaterThan(300);
  expect(gravel).toBeGreaterThan(250);
  await expect(page.getByRole("status")).toHaveText("3D asset loaded");
  await page.screenshot({
    path: testInfo.outputPath("environment-v2-full-page.png"),
    fullPage: true,
    animations: "disabled",
  });
  await frame.screenshot({
    path: testInfo.outputPath("environment-v2-garden-scene.png"),
    animations: "disabled",
  });

  // Switching environment preserves the current crop renderer and stage.
  await original.click();
  await expect(frame).toHaveAttribute("data-environment-ready", "current", {timeout:30000});
  await expect(frame).toHaveAttribute("data-model-ready", "fruiting", {timeout:30000});
  await expect(frame).toHaveAttribute("data-grass-instances", "", {timeout:30000}).catch(async () => {
    expect(await frame.getAttribute("data-grass-instances")).toBeNull();
  });
  await frame.screenshot({
    path: testInfo.outputPath("existing-environment-garden-scene.png"),
    animations: "disabled",
  });

  await v2.click();
  await expect(frame).toHaveAttribute("data-environment-ready", "v2", {timeout:30000});
  await expect(frame).toHaveAttribute("data-model-ready", "fruiting", {timeout:30000});
  await page.getByRole("button", {name:/Reset camera/}).click();

  // The comparison doesn't require D1 garden writes or saved planner state.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator(".gs-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
