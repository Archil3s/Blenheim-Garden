import { expect, test } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET, PUT } from "../../app/api/garden/route";
import { GET as rotation } from "../../app/api/garden/rotation/route";
import { gardenLivePlanKey, gardenLocalPlanKey } from "../../lib/garden/active-garden";
import type { PlannerPlan, PlannerPlantingArea } from "../../lib/garden/planner-plan";
import { sqliteD1 } from "./helpers/sqlite-d1";

const first = "succession-front", second = "succession-back";
const gardens = [{ id: first, name: "Front garden", year: 2026 }, { id: second, name: "Back garden", year: 2026 }];
const editKey = "succession-test-key";
const area: PlannerPlantingArea = {
  id: "front-lettuce", bedId: 101, crop: "Lettuce", cropIcon: "L", variety: "Cos", spacingCm: 28,
  x: 0, y: 0, w: 100, h: 100, count: 1, pattern: "grid", iconSize: 18, visualSpacing: "normal",
  schedule: { from: "2026-10-01", sow: "2026-10-01", until: "2026-10-21" },
};
const front: PlannerPlan = {
  beds: [{ id: 101, name: "Front raised bed", x: 10, y: 10, w: 30, h: 20 }, { id: 102, name: "Herb bed", x: 55, y: 15, w: 15, h: 20 }],
  plantingAreas: [area, { ...area, id: "front-beans", crop: "Bean", variety: "Superstar",
    schedule: { from: "2026-11-05", until: "2026-11-10", supportId: "front-trellis" } }], rows: [], objects: [
    { id: "front-trellis", type: "trellis", label: "North trellis", x1: 90, y1: 108, x2: 360, y2: 108, heightCm: 180, postSpacingCm: 90 },
    { id: "front-canopy", type: "tree", label: "Apple tree", x: 80, y: 160, diameterCm: 120 },
  ],
};
const back: PlannerPlan = {
  beds: [{ ...front.beds[0], id: 201, name: "Back raised bed" }],
  plantingAreas: [{ ...area, id: "back-pumpkin", bedId: 201, crop: "Pumpkin", variety: "Crown", schedule: undefined }],
  rows: [], objects: [],
};

test("succession reviews occupancy, saves through protected D1 and switches gardens independently", async ({ page, context }, info) => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  const globals = globalThis as unknown as Record<symbol, unknown>;
  const key = Symbol.for("__cloudflare-context__"), previous = globals[key];
  globals[key] = { env: { DB: sqliteD1(sqlite), GARDEN_WRITE_TOKEN: editKey } };
  const gardenUrl = (id: string) => `https://garden.test/api/garden?gardenId=${id}`;
  const requestToSave = (url: string, plan: PlannerPlan) => new Request(url, {
    method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${editKey}` },
    body: JSON.stringify({ plan }),
  });
  try {
    for (const garden of gardens) sqlite.prepare("INSERT INTO gardens (id, name, year) VALUES (?, ?, ?)").run(garden.id, garden.name, garden.year);
    expect(await (await PUT(requestToSave(gardenUrl(first), front))).json()).toMatchObject({ ok: true });
    expect(await (await PUT(requestToSave(gardenUrl(second), back))).json()).toMatchObject({ ok: true });
    sqlite.prepare(`INSERT INTO plantings (id, garden_id, bed_id, crop_name, variety, status, sow_date, start_date, end_date)
      VALUES ('old-carrot', ?, '101', 'Carrot', 'Nantes', 'finished', '2026-10-04', '2026-07-01', '2026-10-10')`).run(first);

    const errors: string[] = [], writes: string[] = [];
    let forecastRequests = 0;
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (response.status() >= 400 && response.request().resourceType() === "image") errors.push(response.url());
    });
    await context.addInitScript(({ first, editKey }) => {
      if (!localStorage.getItem("blenheim-garden-active-id")) localStorage.setItem("blenheim-garden-active-id", first);
      sessionStorage.setItem("blenheim-garden-edit-key", editKey);
    }, { first, editKey });
    await page.route("**/api/**", async route => {
      const incoming = route.request();
      const url = new URL(incoming.url());
      const write = incoming.method() === "PUT";
      if (url.pathname === "/api/garden/forecast") {
        if (++forecastRequests > 1) return route.fulfill({ status: 503, json: { days: [] } });
        const days = [25, 26, 27, 28, 29, 30, 31].map(day => ({ date: `2026-10-${day}`, min: day === 25 ? -1 : 8, max: 19 }));
        return route.fulfill({ json: { days } });
      }
      if (url.pathname === "/api/gardens") return route.fulfill({ json: { ok: true, gardens } });
      if (url.pathname !== "/api/garden" && url.pathname !== "/api/garden/rotation") return route.fulfill({ json: { ok: true, body: "", items: [] } });
      const request = new Request(url, { method: incoming.method(), headers: incoming.headers(), body: incoming.postData() });
      if (write) {
        expect(request.headers.get("authorization")).toBe(`Bearer ${editKey}`);
        writes.push(url.searchParams.get("gardenId")!);
      }
      const response = url.pathname.endsWith("/rotation") ? await rotation(request) : await (write ? PUT(request) : GET(request));
      return route.fulfill({ status: response.status, json: await response.json() });
    });

    async function openTimeline() {
      await page.locator(".gv-more-trigger").click();
      await page.locator("#gv-more-panel").getByRole("button", { name: "Succession planting", exact: true }).click();
      const timeline = page.getByRole("dialog", { name: "Succession planting", exact: true });
      await timeline.getByLabel("Plan from").fill("2026-10-15");
      const selectedBed = await page.locator(".gv-plan-name").textContent();
      const bedName = /back garden/i.test(selectedBed ?? "") ? "Back raised bed" : "Front raised bed";
      const overview = timeline.getByRole("region", { name: bedName, exact: true });
      await expect(overview).toBeVisible();
      if (bedName === "Front raised bed") {
        await expect(timeline.getByRole("region", { name: "Herb bed" })).toContainText("No crop recorded");
        await expect(overview).toContainText("21 Oct 2026");
        await expect(overview).toContainText(writes.length === 0 ? "Bean from 5 Nov 2026" : "Carrot from 25 Oct 2026");
        if (writes.length === 0) {
          await timeline.getByRole("button", { name: "Plan staggered harvests" }).click();
          const targets = timeline.getByRole("region", { name: "Staggered harvest planner" });
          await targets.getByLabel("First target harvest").fill("2027-02-01");
          await targets.getByRole("button", { name: "Preview harvest plan" }).click();
          await expect(targets.getByText("First harvest around 1 Feb 2027")).toBeVisible();
          await expect(targets.getByText(/Front raised bed · Hold until/).first()).toBeVisible();
          await targets.getByLabel("Plants per batch").fill("1000");
          await targets.getByRole("button", { name: "Preview harvest plan" }).click();
          await expect(targets.getByText("No available whole bed has enough planting space for these dates.").first()).toBeVisible();
          await targets.getByLabel("Plants per batch").fill("4");
          await targets.getByLabel("First target harvest").fill("2027-05-01");
          await targets.getByRole("combobox", { name: "Sowing method", exact: true }).selectOption("covered");
          await targets.getByLabel("Tray cells for this garden").fill("1");
          await targets.getByRole("button", { name: "Preview harvest plan" }).click();
          await expect(targets.getByText("Insufficient tray cells while this batch is under cover.").first()).toBeVisible();
          await targets.screenshot({ path: info.outputPath("staggered-harvest-plan.png") });
          await timeline.getByRole("button", { name: "Hide harvest planner" }).click();
        }
        await timeline.getByRole("button", { name: "Show trellis availability" }).click();
        const trellises = timeline.getByRole("region", { name: "Trellis availability" });
        await expect(trellises).toContainText("Available on this date");
        await timeline.getByLabel("Plan from").fill("2026-11-07");
        await expect(trellises).toContainText("Booked");
        await expect(trellises).toContainText("Superstar · Linked · clears 10 Nov 2026");
        await timeline.getByLabel("Plan from").fill("2026-10-15");
        await trellises.screenshot({ path: info.outputPath("trellis-availability.png") });
        await timeline.getByRole("button", { name: "Hide trellis availability" }).click();
        await timeline.screenshot({ path: info.outputPath("garden-replacement-overview.png") });
        if (writes.length > 0) {
          await timeline.getByRole("button", { name: "Show seasonal shade" }).click();
          const shade = timeline.getByRole("region", { name: "Seasonal shade map" });
          const map = shade.getByRole("img", { name: "Estimated shadows on the measured garden map" });
          await expect(shade.getByText("Saved observation · Part shade")).toBeVisible();
          await shade.getByRole("combobox", { name: "Season", exact: true }).selectOption("06-21");
          const winter = await map.locator("polygon").first().getAttribute("points");
          expect(winter).toBeTruthy();
          await shade.getByRole("combobox", { name: "Season", exact: true }).selectOption("12-21");
          await expect(map.locator("polygon").first()).not.toHaveAttribute("points", winter!);
          await shade.getByRole("combobox", { name: "Solar time", exact: true }).selectOption("15");
          await shade.screenshot({ path: info.outputPath("seasonal-shade-map.png") });
          await timeline.getByRole("button", { name: "Hide seasonal shade" }).click();
        }
      } else {
        await expect(timeline.getByRole("region", { name: "Herb bed" })).toHaveCount(0);
        await expect(overview).toContainText("Date needs confirmation");
      }
      await overview.getByRole("button", { name: `Review ${bedName}` }).click();
      await expect(timeline.getByRole("heading", { name: "Bed occupancy" })).toBeVisible();
      return timeline;
    }
    await page.clock.setFixedTime(new Date("2026-11-25T00:00:00Z"));
    await page.goto("/planner");
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    let timeline = await openTimeline();
    await expect(timeline.getByRole("combobox", { name: "Bed", exact: true }).locator("option:checked")).toHaveText("Front raised bed");
    const nextCrop = timeline.getByRole("region", { name: "What to plant next" });
    await expect(nextCrop).toContainText("Lettuce (Cos)");
    await expect(nextCrop).toContainText("21 Oct 2026");
    await expect(nextCrop).toContainText("Already booked next · Bean (Superstar) from 5 Nov 2026.");
    await expect(timeline.getByText(/North trellis.*Apple tree may shade/)).toBeVisible();
    await timeline.getByText("Bed conditions and structures", { exact: true }).click();
    await timeline.getByLabel("Sun and shade").selectOption("partial");
    await timeline.getByLabel("Heat and frost").selectOption("cool");
    await timeline.getByLabel("Soil moisture").selectOption("even");
    await expect(timeline.getByText("Wait for warm soil and frost-free conditions.", { exact: false }).first()).toBeVisible();
    await timeline.getByRole("button", { name: "Save bed conditions" }).click();
    await expect(timeline.getByText("Bed conditions saved to this garden.")).toBeVisible();
    await timeline.getByLabel("Plan from").fill("2026-11-11");
    await expect(nextCrop.getByRole("button", { name: "Review this replacement" })).toBeVisible();
    await timeline.getByLabel("Plan from").fill("2026-10-15");
    await timeline.getByText("Bed conditions and structures", { exact: true }).click();
    await expect(timeline.getByText("Same crop family as previous Carrot.")).toBeVisible();
    await timeline.getByRole("button", { name: "Review Broccoli under cover" }).click();
    const covered = timeline.getByRole("form", { name: "Review succession" });
    await expect(covered.getByText("Start under cover, then transplant")).toBeVisible();
    await covered.getByLabel("Transplant date").fill("2027-01-28");
    await covered.getByLabel("Bed clear date").fill("2027-03-29");
    await expect(covered.getByRole("button", { name: "Save succession" })).toBeEnabled();
    await covered.getByRole("button", { name: "Cancel review" }).click();
    await timeline.getByRole("button", { name: "Review Beetroot direct sowing" }).click();
    const beetReview = timeline.getByRole("form", { name: "Review succession" });
    await beetReview.getByLabel("Variety").selectOption("Cylindra");
    await expect(beetReview).toContainText("Choose a deeper bed for the long roots.");
    await expect(beetReview.getByRole("link", { name: "Tui NZ planting calendar" })).toBeVisible();
    await beetReview.getByRole("button", { name: "Cancel review" }).click();
    await timeline.getByRole("button", { name: "Review Carrot direct sowing" }).click();
    const review = timeline.getByRole("form", { name: "Review succession" });
    await expect(review.getByLabel("Sowing date")).toHaveValue("2026-10-25");
    const weather = review.getByRole("region", { name: "Planting weather" });
    await expect(weather).toContainText("Seasonal guidance");
    await weather.getByRole("button", { name: "Check Blenheim forecast" }).click();
    await expect(weather).toContainText("Cold nights in the regional forecast");
    await expect(weather).toContainText("26 Oct 2026 as a possible alternative");
    await weather.screenshot({ path: info.outputPath("planting-weather.png") });
    await weather.getByRole("button", { name: "Check Blenheim forecast" }).click();
    await expect(weather).toContainText("Regional forecast unavailable");
    await expect(weather).toContainText("Seasonal guidance");
    await review.getByLabel("Bed clear date").fill("2026-11-06");
    await expect(review.getByRole("alert")).toContainText("Bed conflict with Bean");
    await expect(review.getByRole("button", { name: "Save succession" })).toBeDisabled();
    await review.screenshot({ path: info.outputPath("succession-conflict.png") });
    await review.getByLabel("Bed clear date").fill("2026-11-04");
    await review.getByRole("button", { name: "Save succession" }).click();
    await expect(timeline.getByText("Succession saved to this garden.")).toBeVisible();
    expect(writes).toEqual([first, first]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await timeline.evaluate(element => { element.scrollTop = 0; });
    await timeline.screenshot({ path: info.outputPath("succession-timeline.png") });

    await timeline.getByLabel("Plan from").fill("2026-11-11");
    await timeline.getByRole("button", { name: "Review Bean direct sowing" }).click();
    const climbingReview = timeline.getByRole("form", { name: "Review succession" });
    await climbingReview.getByLabel("Variety").selectOption("Superstar");
    await climbingReview.getByLabel("Bed clear date").fill("2027-02-20");
    await climbingReview.getByLabel("Reserve climbing support").selectOption("front-trellis");
    await climbingReview.getByRole("button", { name: "Save succession" }).click();
    await expect(timeline.getByText("Succession saved to this garden.")).toBeVisible();
    const persisted = (await (await GET(new Request(gardenUrl(first)))).json()).plan as PlannerPlan;
    expect(persisted.plantingAreas.find(item => item.schedule?.from === "2026-11-11")?.schedule?.supportId).toBe("front-trellis");

    await page.evaluate(keys => keys.forEach(key => localStorage.removeItem(key)), [gardenLivePlanKey(first), gardenLocalPlanKey(first)]);
    await page.reload();
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    timeline = await openTimeline();
    await expect(timeline.getByText("Carrot · Nantes")).toBeVisible();
    await expect(timeline.getByText("Sow 25 Oct 2026 directly")).toBeVisible();
    await timeline.getByText("Bed conditions and structures", { exact: true }).click();
    await expect(timeline.getByLabel("Sun and shade")).toHaveValue("partial");
    await expect(timeline.getByLabel("Heat and frost")).toHaveValue("cool");
    await timeline.getByRole("button", { name: "Close", exact: true }).click();
    await page.locator(".gv-plan-name").click();
    await page.getByRole("dialog", { name: "Choose a garden" }).getByRole("button", { name: /Back garden/ }).click();
    await expect(page.locator(".gv-plan-name")).toContainText(/Back garden/i);
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    timeline = await openTimeline();
    await expect(timeline.getByRole("combobox", { name: "Bed", exact: true }).locator("option")).toHaveText("Back raised bed");
    await timeline.getByText("Bed conditions and structures", { exact: true }).click();
    await expect(timeline.getByLabel("Sun and shade")).toHaveValue("");
    await expect(timeline.getByText(/North trellis/)).toHaveCount(0);
    await expect(timeline.getByText("Carrot · Nantes")).toHaveCount(0);
    await expect(timeline.getByText("Same crop family as previous Carrot.")).toHaveCount(0);
    await timeline.getByRole("button", { name: "Review Carrot direct sowing" }).click();
    await expect(timeline.getByLabel("Sowing date")).toHaveValue("2026-10-15");
    await timeline.getByLabel("Bed clear date").fill("2026-11-04");
    await expect(timeline.getByRole("alert")).toContainText("Availability uncertain because of Pumpkin");
    await expect(timeline.getByRole("button", { name: "Save succession" })).toBeDisabled();
    expect(writes).toEqual([first, first, first]);
    expect(errors).toEqual([]);
  } finally { globals[key] = previous; sqlite.close(); }
});

test("bed recommendations distinguish mapped structures, observed overrides and heat", async () => {
  const { bedGrowingContext, parseBedGrowingConditions } = await import("../../lib/garden/bed-growing-conditions");
  const { successionBedFit } = await import("../../lib/garden/succession-bed-fit");
  const plan: PlannerPlan = {
    ...front, canvas: { widthCm: 1500, heightCm: 1500 },
    objects: [...front.objects, { id: "shade", type: "structure", kind: "shade-cloth-frame",
      x: 225, y: 216, widthCm: 300, depthCm: 240, heightCm: 200, rotationDeg: 15 }],
  };
  const bed = plan.beds[0];
  const mapped = bedGrowingContext(plan, bed);
  expect(mapped.conditions).toMatchObject({ support: "yes", light: "partial" });
  expect(mapped.structureNotes).toContain("Apple tree may shade this bed");
  expect(successionBedFit("Peas", "Shelling", mapped, 4).strengths).toContain("Climbing support is available.");
  const observed = bedGrowingContext(plan, bed, { light: "sun", support: "no", temperature: "hot" });
  expect(successionBedFit("Beans", "Scarlet Runner", observed, 1).cautions).toContain("Add climbing support or choose a bush variety.");
  expect(successionBedFit("Lettuce", "Cos", observed, 1).issues).toBeGreaterThan(0);
  expect(successionBedFit("Tomato", "Roma", observed, 1).issues).toBe(0);
  expect(() => parseBedGrowingConditions({ light: "measured" })).toThrow("Invalid bed growing conditions.");
});

test("Blenheim winter shadows extend farther south than summer shadows at solar noon", async () => {
  const { blenheimSun, seasonalShadows, estimatedBedShade } = await import("../../lib/garden/seasonal-shade");
  expect(blenheimSun("2026-06-21", 12).up).toBeLessThan(blenheimSun("2026-12-21", 12).up);
  const winter = seasonalShadows(front, "2026-06-21", 12);
  const summer = seasonalShadows(front, "2026-12-21", 12);
  expect(Math.max(...winter[0].points.map(point => point.y))).toBeGreaterThan(Math.max(...summer[0].points.map(point => point.y)));
  expect(estimatedBedShade(front.beds[0], [])).toBe(0);
  expect(estimatedBedShade(front.beds[0], [{ id: "full", points: [
    { x: 0, y: 0 }, { x: 900, y: 0 }, { x: 900, y: 1080 }, { x: 0, y: 1080 },
  ] }])).toBe(100);
});

test("planting weather combines cold-prone and hot beds with nearby forecast dates", async () => {
  const { plantingWeather } = await import("../../lib/garden/planting-weather");
  const forecast = [{ date: "2026-11-25", min: 4, max: 27 }];
  expect(plantingWeather("Tomato", "2026-11-25", "cool", forecast)?.advice).toMatch(/Cold nights/);
  expect(plantingWeather("Lettuce", "2026-11-25", "hot", forecast)?.advice).toMatch(/Heat in/);
  expect(plantingWeather("Beans", "2027-06-21", "normal", forecast)?.advice).toMatch(/Seasonal frost/);
});
