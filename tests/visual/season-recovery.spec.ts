import { test, expect } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { GET as getPlan, PUT as putPlan } from "../../app/api/garden/route";
import { GET as getResults } from "../../app/api/garden/season-results/route";
import { GET as getHistory } from "../../app/api/garden/rotation/route";
import { POST as record } from "../../app/api/garden/records/route";
import { POST as upload } from "../../app/api/garden/media/route";
import { GET as getPhoto } from "../../app/api/garden/media/[id]/route";
import type { PlannerPlan, PlannerPlantingArea } from "../../lib/garden/planner-plan";
import { sqliteD1 } from "./helpers/sqlite-d1";

const key = "recovery-test-key", front = "recovery-front", back = "recovery-back";
const bedId = 701;
const roma: PlannerPlantingArea = {
  id: "recovery-roma", bedId, crop: "Tomato", cropIcon: "T", variety: "Roma", spacingCm: 50,
  x: 0, y: 0, w: 100, h: 100, count: 2, pattern: "grid", iconSize: 18, visualSpacing: "normal",
  schedule: { from: "2026-11-04", until: "2026-11-09", sow: "2026-10-01", transplant: "2026-11-04", harvestFrom: "2026-11-08" },
};
const garden: PlannerPlan = {
  beds: [{ id: bedId, name: "Kitchen bed", x: 10, y: 20, w: 30, h: 20 }],
  plantingAreas: [roma, { ...roma, id: "recovery-cos", crop: "Lettuce", variety: "Cos",
    schedule: { from: "2026-11-12", until: "2026-11-20" } }],
  rows: [], objects: [],
};
const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBH0AAAAASUVORK5CYII=", "base64");

test("recovery waits for approval and season results compare scoped saved dates, yield and photos", async ({ page, context }, info) => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("migrations/0001_garden_storage.sql", "utf8"));
  const files = new Map<string, ArrayBuffer>();
  const symbol = Symbol.for("__cloudflare-context__");
  const globals = globalThis as unknown as Record<symbol, unknown>, previous = globals[symbol];
  globals[symbol] = { env: { DB: sqliteD1(db), GARDEN_WRITE_TOKEN: key, GARDEN_MEDIA: {
    put: async (path: string, content: ArrayBuffer) => { files.set(path, content); },
    get: async (path: string) => files.has(path) ? { body: new Blob([files.get(path)!]).stream() } : null,
    delete: async (path: string) => { files.delete(path); },
  } } };
  const url = (fragment: string, gardenId = front) => `https://garden.test/api/garden${fragment}${fragment.includes("?") ? "&" : "?"}gardenId=${gardenId}`;
  const writeJson = (target: string, method: string, body: unknown, token = key) => new Request(target, { method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const errorEvents: string[] = [];
  page.on("pageerror", error => errorEvents.push(error.message));
  try {
    const gardens = [{ id: front, name: "Kitchen garden", year: 2026 }, { id: back, name: "Second garden", year: 2026 }];
    for (const item of gardens) db.prepare("INSERT INTO gardens (id, name, year) VALUES (?, ?, ?)").run(item.id, item.name, item.year);
    expect(await (await putPlan(writeJson(url(""), "PUT", { plan: garden }))).json()).toMatchObject({ ok: true });
    expect(await (await putPlan(writeJson(url("", back), "PUT", { plan: {
      ...garden, beds: [{ ...garden.beds[0], id: 702, name: "Second bed" }], plantingAreas: [],
    } }))).json()).toMatchObject({ ok: true });
    const { plan } = await (await getPlan(new Request(url("")))).json() as { plan: PlannerPlan };
    const plantingId = plan.plantingAreas[0].plantingId!;
    const milestone = { action: "save-milestones", bedId: String(bedId), plantingId, sowDate: "2026-10-02", transplantDate: "2026-11-22" };
    expect((await record(writeJson(url("/records"), "POST", milestone, "bad"))).status).toBe(401);
    expect(await (await record(writeJson(url("/records"), "POST", milestone))).json()).toMatchObject({ ok: true });
    expect((await record(writeJson(url("/records", back), "POST", milestone))).ok).toBe(false);
    expect(await (await record(writeJson(url("/records"), "POST", { action: "add-harvest", bedId: String(bedId), plantingId,
      harvestedOn: "2026-11-26", weightG: 640, quantity: 4, unit: "fruit" }))).json()).toMatchObject({ ok: true });
    const form = new FormData();
    form.set("file", new File([image], "kitchen.png", { type: "image/png" }));
    form.set("targetType", "bed"); form.set("targetId", String(bedId)); form.set("caption", "Kitchen bed before sowing");
    form.set("capturedAt", "2026-08-31T13:00:00.000Z");
    const mediaResult = await upload(new Request(url("/media"), { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form }));
    const media = await mediaResult.json();
    expect(mediaResult.status).toBe(201);
    expect((await getPhoto(new Request(url(`/media/${media.item.id}`, back)), { params: Promise.resolve({ id: media.item.id }) })).status).toBe(404);
    expect((await getResults(new Request(url(`/season-results?bedId=${bedId}&year=2026&month=9`, back)))).status).toBe(404);

    await page.clock.setFixedTime(new Date("2026-11-25T00:00:00Z"));
    await context.addInitScript(({ front, key }) => {
      if (!localStorage.getItem("blenheim-garden-active-id")) localStorage.setItem("blenheim-garden-active-id", front);
      sessionStorage.setItem("blenheim-garden-edit-key", key);
    }, { front, key });
    const writes: string[] = [];
    await page.route("**/api/**", async route => {
      const req = route.request(), address = new URL(req.url());
      const request = new Request(address, { method: req.method(), headers: req.headers(), body: req.postData() });
      if (address.pathname === "/api/gardens") return route.fulfill({ json: { ok: true, gardens } });
      let response: Response;
      switch (address.pathname) {
        case "/api/garden":
          if (req.method() === "PUT") writes.push(address.searchParams.get("gardenId") ?? "");
          response = await (req.method() === "PUT" ? putPlan : getPlan)(request);
          break;
        case "/api/garden/rotation": response = await getHistory(request); break;
        case "/api/garden/season-results": response = await getResults(request); break;
        default:
          if (address.pathname.startsWith("/api/garden/media/")) {
            response = await getPhoto(request, { params: Promise.resolve({ id: address.pathname.split("/").at(-1)! }) });
          } else return route.fulfill({ json: { ok: true, body: "", items: [] } });
      }
      return route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
    });

    async function openSuccession() {
      await page.locator(".gv-more-trigger").click();
      await page.locator("#gv-more-panel").getByRole("button", { name: "Succession planting", exact: true }).click();
      return page.getByRole("dialog", { name: "Succession planting", exact: true });
    }
    await page.goto("/planner");
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    let report = await openSuccession();
    await report.getByRole("button", { name: "Recover a planting", exact: true }).click();
    const recovery = report.getByRole("region", { name: "Recover a planting" });
    await recovery.getByLabel("New bed start").fill("2026-11-10");
    await recovery.getByRole("button", { name: "Preview recovery" }).click();
    await expect(recovery).toContainText("Affected bookings · Cos");
    await expect(recovery.getByRole("button", { name: "Apply recovery" })).toBeDisabled();
    expect(writes).toEqual([]);
    await recovery.getByRole("button", { name: "Find next clear slot" }).click();
    await expect(recovery).toContainText("Proposed booking · 21 Nov 2026 to 26 Nov 2026");
    await recovery.screenshot({ path: info.outputPath("review-recovery.png") });
    expect(writes).toEqual([]);
    await recovery.getByRole("button", { name: "Apply recovery" }).click();
    await expect(recovery).toContainText("Recovery saved to this garden.");
    await recovery.getByRole("combobox", { name: "Planting booking", exact: true }).selectOption("area:recovery-cos");
    await recovery.getByRole("combobox", { name: "What happened", exact: true }).selectOption("failure");
    await recovery.getByLabel("Date cleared").fill("2026-11-16");
    await recovery.getByRole("button", { name: "Preview recovery" }).click();
    await expect(recovery).toContainText("frees this space after the clear date");
    expect(writes).toEqual([front]);
    await recovery.getByRole("button", { name: "Apply recovery" }).click();
    await expect(recovery.getByRole("button", { name: "Review replacement crops for the cleared bed" })).toBeVisible();
    expect(writes).toEqual([front, front]);

    await page.evaluate(id => {
      localStorage.removeItem(`blenheim-garden-live-plan:${id}`);
      localStorage.removeItem(`blenheim-garden-plan:${id}`);
    }, front);
    await page.reload();
    await expect(page.locator(".gv-save")).toHaveText("Saved ✓");
    report = await openSuccession();
    await report.getByRole("button", { name: "Show season results" }).click();
    const results = report.getByRole("region", { name: "Bed season results" });
    await expect(results).toContainText("Planned 1 Oct 2026 · Actual 2 Oct 2026");
    await expect(results).toContainText("Planned 21 Nov 2026 · Actual 22 Nov 2026");
    await expect(results).toContainText("Crop failed · cleared 16 Nov 2026");
    await expect(results).toContainText("1 recorded harvest · 640 g total weighed");
    const photo = results.getByRole("img", { name: "Kitchen bed before sowing" });
    await expect(photo).toBeVisible();
    await expect(results).toContainText("1 Sept 2026 · Kitchen bed before sowing");
    await expect.poll(() => photo.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await results.screenshot({ path: info.outputPath("season-results.png") });
    await results.getByRole("combobox", { name: "Results season", exact: true }).selectOption("6");
    await expect(results).toContainText("0 recorded harvests");
    await expect(photo).toHaveCount(0);

    await report.getByRole("button", { name: "Close", exact: true }).click();
    await page.locator(".gv-plan-name").click();
    await page.getByRole("dialog", { name: "Choose a garden" }).getByRole("button", { name: /Second garden/ }).click();
    await expect(page.locator(".gv-plan-name")).toContainText(/Second garden/i);
    report = await openSuccession();
    await report.getByRole("button", { name: "Show season results" }).click();
    const other = report.getByRole("region", { name: "Bed season results" });
    await expect(other.getByRole("combobox", { name: "Results bed", exact: true })).toHaveValue("702");
    await expect(other).toContainText("0 recorded harvests");
    await expect(other.getByRole("img", { name: "Kitchen bed before sowing" })).toHaveCount(0);
    expect(errorEvents).toEqual([]);
  } finally { globals[symbol] = previous; db.close(); }
});
