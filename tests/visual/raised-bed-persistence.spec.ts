import { expect, test } from "@playwright/test";
import { GET, PUT } from "../../app/api/garden/route";
import type { PlannerPlan } from "../../lib/garden/planner-plan";
import { rowPlants, validateEditorPlan } from "../../lib/garden/plan-editing";
import { structureSurface, surfaceAt } from "../../lib/garden/planting-surfaces";
import { applySeasonalBedLayout, generateSeasonalBedLayout } from "../../lib/garden/seasonal-bed-layout";
import { isolatedGardenDatabase } from "./helpers/sqlite-d1";

test("raised-bed layouts and shallow seed trays round-trip through protected D1 storage", async () => {
  const gardenId = "raised-bed-storage-test", database = isolatedGardenDatabase(gardenId);
  const url = `https://garden.test/api/garden?gardenId=${gardenId}`;
  const container = { id: "raised", type: "structure" as const, kind: "raised-bed-corrugated" as const, x: 400, y: 500, widthCm: 240, depthCm: 160, heightCm: 60, rotationDeg: 35 };
  const base: PlannerPlan = { beds: [], plantingAreas: [], rows: [], objects: [container, { ...container, id: "tray", kind: "seed-tray", x: 750, y: 200, widthCm: 55, depthCm: 35, heightCm: 8, rotationDeg: 0 }] };
  const generated = applySeasonalBedLayout(base, generateSeasonalBedLayout(base, structureSurface(container), 9));
  generated.rows.push({ id: "seedling", crop: "Lettuce", cropIcon: "L", variety: "Butterhead", spacingCm: 28, x1: 750, y1: 200, x2: 750, y2: 200, count: 1, placements: [{ id: "seedling-one", x: 0, y: 0 }] });
  validateEditorPlan(generated);
  const save = (token: string) => PUT(new Request(url, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ plan: generated }) }));
  try {
    expect((await save("wrong-key")).status).toBe(401);
    const response = await save("isolated-test-key");
    expect(await response.json()).toMatchObject({ ok: true });
    const loaded = (await (await GET(new Request(url))).json()).plan as PlannerPlan;
    expect(loaded.objects.find((object) => object.id === "tray")).toMatchObject({ heightCm: 8 });
    expect(loaded.rows.flatMap(rowPlants).sort((a, b) => a.id.localeCompare(b.id))).toEqual(generated.rows.flatMap(rowPlants).sort((a, b) => a.id.localeCompare(b.id)));
    const again = generateSeasonalBedLayout(loaded, structureSurface(container), 9);
    expect(again.positions).toHaveLength(0);
    expect(surfaceAt(loaded, rowPlants(loaded.rows.find((row) => row.id === "seedling")!)[0])?.id).toBe("tray");
  } finally { database.close(); }
});
