import { expect, test } from "@playwright/test";
import type { PlannerPlan, PlannerRow } from "../../lib/garden/planner-plan";
import { resizePlantingRow } from "../../lib/garden/row-layout";

const row: PlannerRow = { id: "existing", crop: "Pumpkin", variety: "Crown", cropIcon: "", spacingCm: 90, x1: 100, y1: 560, x2: 190, y2: 560, count: 1, placements: [{ id: "old-pumpkin", x: 0, y: 0 }] };
const fixture: PlannerPlan = { beds: [], plantingAreas: [], rows: [row], objects: [] };

test("resizing existing explicit rows repopulates by spacing without mutating the source", () => {
  const before = structuredClone(row);
  const grown = resizePlantingRow(row, { x2: 460 }, (index) => `new-${index}`);
  expect(grown.count).toBe(5);
  expect(grown.placements!.map((point) => point.x)).toEqual([0, 25, 50, 75, 100]);
  expect(grown.placements![0].id).toBe("old-pumpkin");
  expect(resizePlantingRow(row, {})).toBe(row);
  expect(resizePlantingRow(grown, { x2: 100 }).count).toBe(1);
  expect(resizePlantingRow(grown, { spacingCm: 180 }).count).toBe(3);
  expect(row).toEqual(before);
});

test("existing one-plant row multiplies during endpoint drag, undo and protected save", async ({ page, context }, info) => {
  let stored = structuredClone(fixture);
  let saved = 0;
  await context.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "fixture-key"));
  await page.route("**/api/**", (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/api/garden" && request.method() === "PUT") {
      expect(request.headers().authorization).toBe("Bearer fixture-key");
      stored = request.postDataJSON().plan; saved++;
    }
    return route.fulfill({ json: { ok: true, plan: stored, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } });
  });
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".planting-row .row-dots i").click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  const scale = canvas.width / 900;
  const handle = (await page.locator(".planting-row .line-handle.end").boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  for (const [end, count] of [[280, 3], [460, 5]]) {
    await page.mouse.move(canvas.x + end * scale, canvas.y + 560 * scale, { steps: 8 });
    await expect(page.locator(".planting-row .row-dots i")).toHaveCount(count);
    await expect(page.locator(".row-caption")).toContainText(`Crown · ${count}`);
  }
  await page.mouse.up();
  await page.locator('.gv-quickbar button[title^="Undo"]').click();
  await expect(page.locator(".planting-row .row-dots i")).toHaveCount(1);
  await page.locator('.gv-quickbar button[title^="Redo"]').click();
  await expect(page.locator(".planting-row .row-dots i")).toHaveCount(5);
  await page.locator(".gv-save").click();
  await expect.poll(() => saved).toBe(1);
  expect(stored.rows[0].count).toBe(5);
  expect(new Set(stored.rows[0].placements!.map((point) => point.id)).size).toBe(5);
  await page.evaluate(() => { localStorage.removeItem("blenheim-garden-live-plan"); localStorage.removeItem("blenheim-garden-plan"); });
  await page.reload();
  await expect(page.locator(".planting-row .row-dots i")).toHaveCount(5);
  await page.screenshot({ path: info.outputPath("existing-pumpkins-multiplied.png") });
  const detail = (await page.locator(".planting-row").boundingBox())!;
  await page.screenshot({ path: info.outputPath("existing-pumpkins-detail.png"), clip: {
    x: Math.max(0, detail.x - 24), y: Math.max(0, detail.y - 40),
    width: Math.min(page.viewportSize()!.width - Math.max(0, detail.x - 24), detail.width + 48),
    height: detail.height + 80,
  } });
});

test("dragging is stable across origin shifts and cancellation restores exact plants", async ({ page }, info) => {
  const plan = structuredClone(fixture);
  plan.beds.push({ id: 1, name: "Integration bed", x: 65, y: 65, w: 20, h: 15 });
  plan.rows[0] = { ...row, x2: 370, count: 2, placements: [{ id: "one", x: 0, y: 12 }, { id: "two", x: 100, y: -8 }] };
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan, gardens: [], body: "", beds: [], items: [], notes: [], harvests: [] } }));
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const element = (await page.locator(".planting-row").boundingBox())!;
  const x = element.x + element.width / 2, y = element.y + element.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 50, y + 15, { steps: 8 });
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("blenheim-garden-live-plan")!).rows[0]);
  const moved = await read();
  expect(moved.placements).toEqual(plan.rows[0].placements);
  expect(moved.count).toBe(2);
  // Simulate the origin changes that scrollbar/layout feedback caused mid-drag.
  for (let index = 0; index < 8; index++) {
    await page.locator(".garden-canvas").evaluate((el, offset) => { (el as HTMLElement).style.left = `${offset}px`; }, index % 2 ? 10 : -10);
    await page.mouse.move(x + 50, y + 15 + (index % 2 ? .01 : 0));
    expect(await read()).toEqual(moved);
  }
  await page.locator(".garden-canvas").evaluate((el) => { (el as HTMLElement).style.left = ""; });
  await page.screenshot({ path: info.outputPath("stable-existing-row-drag.png") });
  await page.locator(".garden-canvas").dispatchEvent("pointercancel", { pointerId: 1, bubbles: true });
  await page.mouse.up();
  await expect.poll(read).toEqual(plan.rows[0]);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".gv-stage-scroll")!).scrollBehavior)).toBe("auto");
  await page.locator(".plan-bed").dispatchEvent("pointerdown", { pointerId: 911, pointerType: "mouse", button: 0, buttons: 1, bubbles: true });
  await expect(page.locator(".gv-app")).toHaveAttribute("data-interacting", "false");
  await expect(page.locator(".draft-planting-row")).toHaveCount(0);
  await page.locator(".planting-row").click();
  await page.getByLabel("Spacing (cm)", { exact: true }).click();
  let bounds = (await page.locator(".planting-row").boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(page.locator(".garden-canvas")).toBeFocused();
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2 + 10, { steps: 5 });
  await page.mouse.up();
  expect(await read()).not.toEqual(plan.rows[0]);
  await page.keyboard.press("Control+z");
  await expect.poll(read).toEqual(plan.rows[0]);
  bounds = (await page.locator(".planting-row").boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2, { steps: 5 });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await expect.poll(read).toEqual(plan.rows[0]);
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Rows$/ }) }).click();
  await page.locator('.gv-plant-list > button[data-crop="Pumpkin"]').click();
  await page.getByRole("button", { name: "Close inspector", exact: true }).click();
  const canvas = (await page.locator(".garden-canvas").boundingBox())!;
  const scale = canvas.width / 900;
  await page.mouse.move(canvas.x + 100 * scale, canvas.y + 700 * scale);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 400 * scale, canvas.y + 700 * scale, { steps: 5 });
  await expect(page.locator(".draft-planting-row")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator(".draft-planting-row")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator(".planting-row")).toHaveCount(1);
});
