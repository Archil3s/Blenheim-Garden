import { expect, test } from "@playwright/test";
import { fixture } from "./helpers/fixture";

for (const [device, width, height] of [["iPhone", 390, 844], ["Android", 360, 800]] as const) {
  test.describe(device, () => {
    test.use({ viewport: { width, height }, isMobile: true, hasTouch: true });

    test("checks plantings, edits a bed, finds a crop and logs progress", async ({ page }, info) => {
      test.skip(info.project.name !== "phone", "Runs in the phone project.");
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      let saved = structuredClone(fixture);
      let upload = "";
      await page.route("**/api/**", async route => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        if (path === "/api/garden") {
          if (request.method() === "PUT") saved = request.postDataJSON().plan;
          return route.fulfill({ json: { ok: true, plan: saved } });
        }
        if (path === "/api/garden/media" && request.method() === "POST") {
          upload = request.postData() ?? "";
        }
        return route.fulfill({ json: { ok: true, items: [], notes: [], beds: [], gardens: [] } });
      });
      await page.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "isolated-test-key"));
      await page.clock.setFixedTime(new Date("2026-09-14T00:00:00Z"));
      await page.goto("/planner");
      await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
      const actions = page.getByRole("navigation", { name: "Quick garden actions" });
      await expect(actions).toBeInViewport();
      const hitTargets = await actions.locator("button, a").evaluateAll(nodes =>
        nodes.map(node => ({ width: node.clientWidth, height: node.clientHeight }))
      );
      expect(hitTargets.every(target => target.width >= 44 && target.height >= 44)).toBe(true);
      expect((await page.locator(".gv-stage").boundingBox())?.width).toBe(width);
      await page.screenshot({ path: info.outputPath("overview.png") });

      await actions.getByRole("button", { name: "Beds" }).tap();
      const beds = page.getByRole("dialog", { name: "Garden beds" });
      await expect(beds.getByRole("button", { name: /Bed 9.*King Purple ×70/ })).toBeVisible();
      await beds.getByRole("searchbox", { name: "Find a bed" }).fill("Bed 9");
      await expect(beds.getByRole("button", { name: /^Bed 8/ })).toHaveCount(0);
      await page.screenshot({ path: info.outputPath("beds.png") });
      await beds.getByRole("button", { name: /^Bed 9/ }).tap();
      const inspector = page.locator(".gv-context");
      await expect(inspector.getByRole("heading", { name: "Bed 9" })).toBeVisible();
      await inspector.getByText("Edit bed", { exact: true }).tap();
      await inspector.getByRole("textbox", { name: "Name", exact: true }).fill("Kitchen bed");
      await expect(inspector.getByRole("heading", { name: "Kitchen bed" })).toBeVisible();
      await inspector.getByRole("button", { name: "Close inspector" }).tap();
      await page.locator(".gv-save").tap();
      await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
      expect(saved.plantingAreas).toEqual(fixture.plantingAreas);
      await page.reload();
      await actions.getByRole("button", { name: "Beds" }).tap();
      await expect(beds.getByRole("button", { name: /Kitchen bed.*King Purple ×70/ })).toBeVisible();
      await beds.getByRole("button", { name: "Close plan items" }).tap();

      await actions.getByRole("button", { name: "Find plants" }).tap();
      await inspector.getByPlaceholder("Plant or variety").fill("Zucchini");
      const result = inspector.locator('.gv-plant-list button[data-crop="Zucchini"]');
      await result.tap();
      await expect(inspector.locator(".gv-ready-strip")).toHaveAttribute("data-crop", "Zucchini");
      await inspector.getByRole("button", { name: "Information about Zucchini" }).tap();
      await expect(page.getByRole("dialog", { name: "Zucchini" })).toBeVisible();
      await page.getByRole("button", { name: "Close plant information" }).tap();
      await page.screenshot({ path: info.outputPath("catalogue.png") });
      await inspector.getByRole("button", { name: "Close inspector" }).tap();
      await actions.getByRole("button", { name: "Tools" }).tap();
      await expect(page.getByRole("combobox", { name: "Planning month" })).toBeVisible();
      await actions.getByRole("button", { name: "Tools" }).tap();

      const more = page.getByRole("button", { name: /^More/ });
      await more.tap();
      await page.getByRole("button", { name: /Desktop/ }).tap();
      await expect(actions).toBeHidden();
      await more.tap();
      await page.getByRole("button", { name: /Mobile/ }).tap();
      await expect(actions).toBeInViewport();

      await actions.getByRole("link", { name: "Log progress" }).tap();
      await expect(page).toHaveURL(/\/progress#log-progress$/);
      await expect(page.getByRole("heading", { name: "Photograph what has changed" })).toBeInViewport();
      await page.screenshot({ path: info.outputPath("log-progress.png") });
      await page.getByLabel("Add photos").setInputFiles({
        name: "progress.png",
        mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVpcAAAAASUVORK5CYII=", "base64"),
      });
      await page.getByLabel("What changed?").fill("Added compost");
      await page.getByLabel("Garden edit key").fill("isolated-test-key");
      await page.getByRole("button", { name: "Save progress photos" }).tap();
      await expect(page.getByRole("status").filter({ hasText: "Uploaded 1 of 1 photos" })).toBeVisible();
      expect(upload).toContain("Added compost");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
    });
  });
}
