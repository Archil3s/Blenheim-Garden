import { expect, test, type Page } from "@playwright/test";
import { fixture } from "./helpers/fixture";
import { pastePlanSelection } from "../../lib/garden/selection-clipboard";
import { defaultPlantFilters, matchesPlantFilters } from "../../lib/garden/plant-catalogue-filters";

async function openTab(page: Page, label: string, mobile: boolean) {
  if (mobile) {
    await page.locator(".gv-more > summary").click();
    await page.locator(".gv-more-panel").getByRole("button", { name: label, exact: true }).click();
  } else {
    await page.locator(".gv-primary-nav").getByRole("button", { name: label === "Plant List" ? "Open plant list" : label === "Parts List" ? "Open parts list" : "Plan notes", exact: true }).click();
  }
}

test("clipboard preserves child plant positions and independent identities", () => {
  const plan = structuredClone(fixture);
  plan.plantingAreas[0].placements = [{ id: "original-plant", x: 25, y: 30 }];
  plan.plantingAreas[0].count = 1;
  const before = structuredClone(plan);
  const result = pastePlanSelection(plan, { plan, selection: { kind: "bed", id: "1" } })!;
  const copy = result.plan.plantingAreas.at(-1)!;
  expect(result.plan.beds).toHaveLength(plan.beds.length + 1);
  expect(copy.bedId).toBe(Number(result.selection.id));
  expect(copy.bedId).toBeGreaterThan(1_000_000_000_000);
  expect(copy.placements![0]).toMatchObject({ x: 25, y: 30 });
  expect(copy.placements![0].id).not.toBe("original-plant");
  expect(copy.plantingId).toBeUndefined();
  expect(plan).toEqual(before);
  expect(matchesPlantFilters("Carrot", { ...defaultPlantFilters, frost: true }, [], "Tomato")).toBe(true);
  expect(matchesPlantFilters("Tomato", { ...defaultPlantFilters, favouritesOnly: true }, [], "Carrot")).toBe(false);
});

test("workspace tabs remain switchable and plan-wide notes save through protected Save", async ({ page, context }, info) => {
  let note = "Existing plan note";
  let noteSaves = 0;
  await context.addInitScript(() => sessionStorage.setItem("blenheim-garden-edit-key", "fixture-edit-key"));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/garden/plan-notes") {
      if (request.method() === "PUT") {
        expect(request.headers().authorization).toBe("Bearer fixture-edit-key");
        expect(url.searchParams.get("gardenId")).toBe("blenheim-garden");
        note = request.postDataJSON().body;
        noteSaves++;
      }
      return route.fulfill({ json: { ok: true, body: note } });
    }
    return route.fulfill({ json: { ok: true, plan: fixture, gardens: [{ id: "blenheim-garden", name: "Blenheim Garden", year: 2026 }], notes: [], harvests: [], beds: [], items: [] } });
  });
  await page.goto("/planner");
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  const mobile = info.project.name === "phone";
  await openTab(page, "Plant List", mobile);
  await expect(page.getByRole("dialog", { name: "Plant List", exact: true })).toBeVisible();
  await openTab(page, "Parts List", mobile);
  await expect(page.getByRole("dialog", { name: "Parts List", exact: true })).toBeVisible();
  await openTab(page, "Plan notes", mobile);
  const notes = page.getByRole("textbox", { name: "Plan-wide notes" });
  await expect(notes).toHaveValue(note);
  await notes.fill("New plan-wide note\nKeep line breaks and 🌱");
  await expect(page.locator(".gv-save")).toHaveText("Save");
  await page.locator(".gv-save").click();
  await expect.poll(() => noteSaves).toBe(1);
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.reload();
  await openTab(page, "Plan notes", mobile);
  await expect(notes).toHaveValue("New plan-wide note\nKeep line breaks and 🌱");
  await page.screenshot({ path: info.outputPath("plan-notes-workspace.png") });
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.locator(".garden-canvas")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("plant favourites, source facts and advanced filters work without editing the plan", async ({ page }, info) => {
  await page.route("**/api/**", (route) => route.fulfill({ json: { ok: true, plan: fixture, gardens: [], body: "", notes: [], beds: [], items: [] } }));
  await page.goto("/planner");
  await page.locator(".gv-rail button").filter({ has: page.locator("small", { hasText: /^Plants$/ }) }).click();
  await page.getByRole("button", { name: "Favorite Carrot", exact: true }).click();
  await page.getByRole("checkbox", { name: "Favorites", exact: true }).check();
  await expect(page.locator(".gv-plant-list > button")).toHaveCount(1);
  await expect(page.locator(".gv-plant-list > button")).toContainText("Carrot");
  await page.getByRole("button", { name: "Information about Carrot", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Carrot", exact: true })).toContainText("Daucus carota");
  await page.getByRole("button", { name: "Close plant information" }).click();
  await page.locator(".plant-source-filters").getByRole("button", { name: "Reset", exact: true }).click();
  await page.locator(".plant-source-filters summary").click();
  await page.getByLabel("Crop Rotation Family", { exact: true }).selectOption("3");
  await expect(page.locator(".gv-plant-list > button")).toHaveCount(1);
  await expect(page.locator(".gv-plant-list > button")).toContainText("Tomato");
  await page.screenshot({ path: info.outputPath("plant-filters-workspace.png") });
});
