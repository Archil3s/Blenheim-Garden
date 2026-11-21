import { expect, test } from "@playwright/test";
import { fixture } from "./helpers/fixture";

for (const [device, width, height] of [["iPhone", 390, 844], ["Android", 360, 800]] as const) {
  test.describe(device, () => {
    test.use({ viewport: { width, height } });
    test("phone opens the saved grid once and navigates dense plantings without edits", async ({ page }, info) => {
      test.skip(info.project.name !== "phone", "Touch-only flow.");
      const dense = structuredClone(fixture);
      const example = dense.plantingAreas[0];
      dense.plantingAreas = dense.beds.map(bed => ({
        ...example, bedId: bed.id, id: `dense-${bed.id}`, count: 100,
        placements: Array.from({ length: 100 }, (_, index) => ({
          id: `plant-${bed.id}-${index}`, x: 5 + index % 10 * 10, y: 5 + Math.floor(index / 10) * 10,
        })),
      }));
      let releaseLoad: () => void = () => {};
      const responseGate = new Promise<void>(resolve => { releaseLoad = resolve; });
      await page.route("**/api/**", async route => {
        if (new URL(route.request().url()).pathname === "/api/garden") {
          await responseGate;
          return route.fulfill({ json: { ok: true, plan: dense } });
        }
        return route.fulfill({ json: { ok: true, items: [], notes: [], beds: [], gardens: [] } });
      });
      await page.goto("/planner");
      await expect(page.getByText("Loading garden…", { exact: true })).toBeVisible();
      await expect(page.locator(".plan-bed")).toHaveCount(0);
      releaseLoad();
      await expect(page.locator(".plan-bed")).toHaveCount(dense.beds.length);
      await expect(page.locator(".garden-canvas [data-plant-id]")).toHaveCount(dense.beds.length * 6);

      const stage = page.locator(".gv-stage-scroll");
      const garden = page.locator(".garden-canvas");
      const bed = garden.getByRole("button", { name: /^Bed 1,/ });
      await expect.poll(async () => (await garden.boundingBox())!.width).toBeLessThan(width);
      const initial = (await garden.boundingBox())!;
      const rect = (await bed.boundingBox())!;
      const center = { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", points: { x: number; y: number }[]) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
      const live = () => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan") ?? "null"));
      const saved = await live();
      await touch("touchStart", [center]);
      await touch("touchMove", [{ x: center.x - 40, y: center.y + 28 }]);
      await touch("touchEnd", []);
      await expect.poll(async () => (await garden.boundingBox())!.x).toBeLessThan(initial.x - 20);
      expect(await live()).toEqual(saved);
      await expect(stage).not.toHaveAttribute("data-panning", "true");

      await page.getByRole("button", { name: /^Fit garden/ }).tap();
      await expect.poll(async () => Math.round((await garden.boundingBox())!.x)).toBe(Math.round(initial.x));
      await bed.tap();
      const inspector = page.locator(".gv-context");
      await expect(inspector.getByRole("heading", { name: "Bed 1" })).toBeVisible();
      await inspector.getByRole("button", { name: "Close inspector" }).tap();
      expect(Math.round((await garden.boundingBox())!.x)).toBe(Math.round(initial.x));
      await page.getByRole("button", { name: "Beds", exact: true }).tap();
      await page.getByRole("dialog", { name: "Garden beds" }).getByRole("button", { name: /^Bed 1(?: |$)/ }).first().tap();
      await inspector.getByRole("button", { name: "Show bed on map" }).tap();
      await expect(inspector).toHaveCount(0);
      const centered = (await bed.boundingBox())!;
      const camera = (await stage.boundingBox())!;
      expect(Math.abs(centered.x + centered.width / 2 - (camera.x + camera.width / 2))).toBeLessThan(2);
      await page.getByRole("button", { name: /^Fit garden/ }).tap();

      await page.getByRole("button", { name: "Find plants" }).tap();
      await inspector.getByPlaceholder("Plant or variety").fill("Zucchini");
      await inspector.locator('.gv-plant-list button[data-crop="Zucchini"]').tap();
      await inspector.getByRole("button", { name: "Close inspector" }).tap();
      const frame = (await stage.boundingBox())!;
      const y = Math.round(frame.y + frame.height * .42);
      await touch("touchStart", [{ x: 125, y }]);
      await touch("touchStart", [{ x: 125, y }, { x: 215, y }]);
      await touch("touchMove", [{ x: 70, y }, { x: 275, y }]);
      await touch("touchEnd", []);
      await expect.poll(async () => (await garden.boundingBox())!.width).toBeGreaterThan(initial.width);
      expect(await live()).toEqual(saved);

      await page.getByRole("button", { name: "Tools", exact: true }).tap();
      const tools = page.locator(".gv-quickbar");
      expect(await tools.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.screenshot({ path: info.outputPath("dense-mobile-tools.png") });
    });
  });
}

test("an unavailable saved garden cannot overwrite its plan with the sample", async ({ page }) => {
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/garden") return route.fulfill({ status: 503, json: { ok: false } });
    return route.fulfill({ json: { ok: true, items: [], notes: [], beds: [], gardens: [] } });
  });
  await page.goto("/planner");
  await expect(page.getByText("Could not load the saved garden. Sample shown.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("blenheim-garden-live-plan"))).toBeNull();
});
