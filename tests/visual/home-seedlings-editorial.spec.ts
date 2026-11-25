import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name + ".png"), fullPage: true, animations: "disabled" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "The page must not overflow horizontally").toBeLessThanOrEqual(1);
}

test("garden homepage is editorial, navigable and responsive", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good things");
  await expect(page.getByRole("link", { name: /Open the garden planner/ })).toHaveAttribute("href", "/planner");
  await expect(page.getByRole("link", { name: /Go to seedling journal/ })).toHaveAttribute("href", "/seedlings");
  await expect(page.getByText(/Historic ground-frost context/)).toBeVisible();
  await capture(page, testInfo, "home-editorial");
  expect(errors).toEqual([]);
});

test("seedling journal tracks a real batch and persists observed stages", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/seedlings");
  await page.evaluate(() => localStorage.removeItem("blenheim-garden-seedling-batches-v1"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Seedling");
  await page.getByRole("button", { name: /Add seed batch/ }).first().click();
  const form = page.locator("form.seed-form");
  await form.getByRole("combobox", { name: "Crop", exact: true }).selectOption({ label: "Peas" });
  await form.getByRole("combobox", { name: "Variety", exact: true }).fill("Trial autumn peas");
  await form.getByLabel("Seeds sown").fill("12");
  await form.getByRole("radio", { name: /12-cell tray/ }).check();
  await expect(form.getByLabel("Container name or custom setup")).toHaveValue("12-cell tray");
  await form.getByRole("button", { name: "Save batch" }).click();

  const batch = page.locator(".seed-batch-card").first();
  await expect(batch).toContainText("Trial autumn peas");
  await expect(batch).toContainText("12-cell tray");
  await expect(batch.locator(".seed-container-art")).toBeVisible();
  await expect(batch).toContainText("Expected emergence");
  await expect(batch).toContainText("Next succession sowing");
  await batch.getByLabel("Growth stage").selectOption("true-leaves");
  await batch.getByRole("button", { name: /Moisture checked/ }).click();
  await expect(batch).toContainText("True leaves");
  await expect(batch).toContainText("Last checked");
  await capture(page, testInfo, "seedlings-editorial");

  await page.reload();
  await expect(page.locator(".seed-batch-card").first()).toContainText("Trial autumn peas");
  await expect(page.locator(".seed-batch-card").first()).toContainText("True leaves");
  await expect(page.locator(".seed-batch-card").first()).toContainText("12-cell tray");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Delete Peas batch/ }).click();
  await expect(page.locator(".seed-batch-card")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("catalogue crops can be sown into individual cells and survive reload", async ({ page }) => {
  await page.goto("/seedlings");
  await page.getByRole("button", { name: /Add seed batch/ }).first().click();
  const tray = page.getByRole("group", { name: "Six-cell tray cell layout" });
  await expect(tray.getByRole("button")).toHaveCount(6);
  await page.getByRole("searchbox", { name: "Search seed catalogue", exact: true }).fill("Taro");
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Taro");
  await tray.getByRole("button", { name: "Cell 2: empty" }).click();
  await page.getByRole("searchbox", { name: "Search seed catalogue", exact: true }).fill("Black Krim");
  await page.getByRole("combobox", { name: "Crop", exact: true }).selectOption("Tomato");
  await expect(page.getByRole("combobox", { name: "Variety", exact: true })).toHaveValue("Black Krim");
  await tray.getByRole("button", { name: "Cell 5: empty" }).click();
  await tray.getByRole("button", { name: /Cell 5: Tomato.*Black Krim/ }).click();
  const cell = page.getByRole("group", { name: "Edit cell 5" });
  await cell.getByRole("combobox", { name: "Catalogue variety" }).selectOption("Roma");
  await cell.getByRole("button", { name: "Apply to cell 5" }).click();
  await expect(page.getByLabel("Seeds sown")).toHaveValue("2");
  await page.getByRole("button", { name: "Save batch" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Mixed tray" })).toBeVisible();
  await expect(tray.getByRole("button", { name: /Cell 2: Taro/ })).toContainText("Taro");
  const savedTomato = tray.getByRole("button", { name: /Cell 5: Tomato.*Roma/ });
  await expect(savedTomato).toContainText("Roma");
  await savedTomato.click();
  await cell.getByRole("combobox", { name: "Catalogue variety" }).selectOption("Moneymaker");
  await cell.getByRole("button", { name: "Apply to cell 5" }).click();
  await page.reload();
  await expect(tray.getByRole("button", { name: /Cell 5: Tomato.*Moneymaker/ })).toContainText("Moneymaker");
  await expect(tray.getByRole("button", { name: /Cell 2: Taro/ })).toContainText("Taro");
});

test("sowing guide shows seed methods and opens each month of the next NZ season", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400 && response.request().resourceType() === "image") errors.push(response.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Sowing guide", exact: true }).click();
  await expect(page).toHaveURL(/#sowing-guide$/);
  const guide = page.getByRole("region", { name: "What to sow in Blenheim" });
  const now = guide.locator(".home-sowing-now");
  const inSoil = now.getByRole("region", { name: "Direct into soil" });
  await expect(inSoil.getByText("Lettuce", { exact: true })).toBeVisible();
  await expect(inSoil.getByText("Tomato", { exact: true })).toHaveCount(0);
  await expect(inSoil.locator(".home-sowing-art").first()).toBeVisible();

  const yearMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const current = await now.getByRole("heading", { level: 3 }).innerText();
  const [, monthName, year] = current.match(/· (\w+) (\d{4})$/)!;
  const month = yearMonths.indexOf(monthName);
  const nextIndex = [2, 5, 8, 11, 14].find(start => start > month)!;
  const months = guide.locator("summary");
  await expect(months).toHaveText([0, 1, 2].map(offset => {
    const index = nextIndex + offset;
    return `${yearMonths[index % 12]} ${Number(year) + Math.floor(index / 12)}`;
  }));

  await months.nth(1).focus();
  await page.keyboard.press("Enter");
  const secondMonth = guide.locator("details").nth(1);
  await expect(secondMonth.getByRole("region", { name: "Trays or pots under cover" })).toBeVisible();
  await guide.screenshot({ path: testInfo.outputPath("seasonal-sowing-guide.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("a saved packet and tray delay follow the linked bed in the selected garden", async ({ page }, info) => {
  const first = "packet-front", second = "packet-back";
  const plan = {
    beds: [{ id: 201, name: "Kitchen bed", x: 10, y: 20, w: 22, h: 22 }],
    plantingAreas: [{ id: "roma-booking", bedId: 201, crop: "Tomato", cropIcon: "T", variety: "Roma",
      spacingCm: 50, x: 0, y: 0, w: 100, h: 100, count: 4, pattern: "grid", iconSize: 18, visualSpacing: "normal",
      schedule: { from: "2026-12-01", transplant: "2026-12-01", until: "2027-03-31" } }],
    rows: [], objects: [],
  };
  await page.clock.setFixedTime(new Date("2026-11-25T00:00:00Z"));
  await page.addInitScript(id => { if (!localStorage.getItem("blenheim-garden-active-id")) localStorage.setItem("blenheim-garden-active-id", id); }, first);
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/garden") return route.fulfill({ json: { ok: true, plan: url.searchParams.get("gardenId") === first
      ? plan : { ...plan, beds: [], plantingAreas: [] } } });
    return route.fulfill({ json: { ok: true, history: [], gardens: [], items: [], body: "" } });
  });
  await page.goto("/seedlings");
  await page.getByText("Seed packets for this garden", { exact: true }).click();
  const inventory = page.getByRole("form", { name: "Add seed packet" });
  await inventory.getByRole("combobox", { name: "Variety", exact: true }).fill("Roma");
  await inventory.getByLabel("Packet seed count").fill("30");
  await inventory.getByRole("button", { name: "Add seed packet" }).click();
  await expect(page.getByText("Tomato · Roma · 30 seeds recorded")).toBeVisible();
  await page.evaluate(gardenId => localStorage.setItem("blenheim-garden-seedling-batches-v1", JSON.stringify([{
    gardenId, id: "second-batch", crop: "Peas", variety: "Snow pea", dateSown: "2026-11-25",
    count: 4, site: "blenheim", method: "indoors", container: "Six-cell tray", stage: "sown",
  }])), second);
  await page.getByRole("button", { name: /Add seed batch/ }).first().click();
  const form = page.locator("form.seed-form");
  await form.getByRole("combobox", { name: "Seed packet", exact: true }).selectOption({ label: "Tomato Roma" });
  await form.getByRole("combobox", { name: "Future bed planting", exact: true }).selectOption("roma-booking");
  await form.getByRole("button", { name: "Save batch" }).click();
  const batch = page.locator(".seed-batch-card");
  await expect(batch).toContainText("Planned bed · Kitchen bed · 1 Dec 2026");
  await batch.getByLabel("Expected ready date").fill("2026-12-09");
  await expect(batch).toContainText("This batch may miss the planned bed date");
  await page.reload();
  await expect(batch.getByLabel("Expected ready date")).toHaveValue("2026-12-09");
  await batch.screenshot({ path: info.outputPath("seed-packet-tray-link.png") });
  await page.getByRole("link", { name: /Garden planner/ }).click();
  await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
  await page.locator(".gv-more-trigger").click();
  await page.locator("#gv-more-panel").getByRole("button", { name: "Succession planting" }).click();
  await expect(page.getByRole("region", { name: "Kitchen bed", exact: true })).toContainText("Tray delay · Roma");
  await page.evaluate(id => localStorage.setItem("blenheim-garden-active-id", id), second);
  await page.goto("/seedlings");
  await expect(page.locator(".seed-batch-card")).toHaveCount(1);
  await expect(page.locator(".seed-batch-card")).toContainText("Snow pea");
  await expect(page.getByText("Planned bed · Kitchen bed")).toHaveCount(0);
  await page.getByText("Seed packets for this garden", { exact: true }).click();
  await expect(page.getByText("Tomato · Roma · 30 seeds recorded")).toHaveCount(0);
});
