import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { createHash } from "node:crypto";
import { createLowpolyPlant3D, resolveLowpolyPlantKind } from "../../components/garden-lowpoly-plants";
import { addStructure3D as currentStructure } from "../../components/garden-structure-3d-v2";
import { addStructure3D as legacyStructure } from "../../components/garden-structure-3d";
import { STRUCTURE_PRESETS } from "../../lib/garden/structure-catalog";
import type { AuditRecord } from "../../components/garden-audit-models";
import { getPlantIconV2 } from "../../lib/garden/plant-icon-v2";

const archKinds = ["polytunnel", "hoop-arch", "low-hoop-frame", "row-cover-hoops", "insect-net-tunnel", "frost-cloth-tunnel", "cloche", "garden-arch", "cattle-panel-arch", "bean-arch", "cucumber-arch"];

test("tunnel and garden arches stand above ground at all sizes and both detail levels", () => {
  for (const renderer of [currentStructure, legacyStructure]) for (const detailed of [false, true]) {
    for (const preset of STRUCTURE_PRESETS.filter((item) => archKinds.includes(item.kind))) for (const factor of [.5, 1, 1.5]) {
      const root = new THREE.Group();
      const heightCm = Math.max(8, preset.heightCm * factor);
      renderer(root, { id: "quality", type: "structure", kind: preset.kind, x: 450, y: 540, widthCm: Math.max(30, preset.widthCm * factor), depthCm: Math.max(30, preset.depthCm * factor), heightCm, rotationDeg: 0 }, detailed);
      const bounds = new THREE.Box3().setFromObject(root);
      expect(bounds.min.y, `${preset.kind}: underground geometry`).toBeGreaterThanOrEqual(-.06);
      expect(bounds.max.y, `${preset.kind}: crown height`).toBeGreaterThan(heightCm / 100 * .9);
      expect(bounds.max.y, `${preset.kind}: excessive height`).toBeLessThan(heightCm / 100 + .15);
    }
  }
});

function fingerprint(crop: string, variety: string) {
  const root = createLowpolyPlant3D(crop, variety, false, 173 - crop.length * 31 - variety.length * 17);
  root.updateMatrixWorld(true);
  const hash = createHash("sha256");
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    expect(object.castShadow).toBeTruthy();
    hash.update(JSON.stringify(object.matrixWorld.elements));
    for (const attribute of Object.values(object.geometry.attributes) as THREE.BufferAttribute[]) hash.update(Buffer.from(attribute.array.buffer));
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) hash.update(String((material as THREE.MeshStandardMaterial).color.getHex()));
    object.geometry.dispose();
  });
  return hash.digest("hex");
}

test("important varieties differ in shape and colour without relying on random seeds", () => {
  for (const [crop, varieties] of [
    ["Tomato", ["Roma", "Beefsteak", "Cherry", "Grape", "Pear Yellow", "Green Ripe", "Orange", "Striped", "Dwarf", "Trailing"]],
    ["Lettuce", ["Butterhead", "Cos", "Loose leaf", "Iceberg"]],
    ["Pumpkin", ["Crown", "Butternut", "Gem squash", "Kabocha"]],
    ["Carrot", ["Nantes", "Chantenay", "Amsterdam", "Rainbow"]],
  ] as const) expect(new Set(varieties.map((variety) => fingerprint(crop, variety))).size, crop).toBe(varieties.length);
  for (const [crop, varieties] of [["Lettuce", ["Butterhead", "Cos", "Loose leaf", "Iceberg"]], ["Pumpkin", ["Crown", "Butternut", "Gem squash", "Kabocha"]], ["Carrot", ["Nantes", "Chantenay", "Amsterdam", "Rainbow"]]] as const) expect(new Set(varieties.map((variety) => getPlantIconV2(crop, variety)?.src)).size).toBe(4);
  for (const crop of ["Achillea", "Agastache", "Ageratum", "Agrostemma", "Akeake", "Alyssum", "Amaranth", "Angelica", "Anise", "Artichoke", "Asparagus", "Aster", "Astragalus", "Potato", "Mint", "Sage", "Thyme", "Chives", "Brussels sprout", "Roma", "Scarlet Runner"]) expect(resolveLowpolyPlantKind(crop)).not.toBe("leafy");
  expect(resolveLowpolyPlantKind("Unregistered species")).toBe("leafy");
});

test("showroom exposes upright arches and all artwork decodes", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/3d-audit");
  await expect(page.locator("[data-audit-id]").first()).toBeVisible({ timeout: 60_000 });
  const records: AuditRecord[] = JSON.parse(await page.locator("#audit-records").textContent() ?? "[]");
  const arches = records.filter((record) => record.object?.type === "structure" && archKinds.includes(record.object.kind));
  expect(arches).toHaveLength(archKinds.length * 3);
  expect(arches.every((record) => !record.badges.includes("BURIED") && !record.badges.includes("DIMENSION MISMATCH"))).toBeTruthy();
  expect(records.filter((record) => record.badges.includes("ASSET ERROR"))).toHaveLength(0);
  const sources = [...new Set(records.flatMap((record) => record.artwork ? [record.artwork.src] : []))];
  const decoded = await page.evaluate(async (paths) => Promise.all(paths.map(async (src) => {
    const image = new Image(); image.src = src; await image.decode();
    return { src, width: image.naturalWidth, height: image.naturalHeight };
  })), sources);
  for (const filename of ["tomato_green_ripe.png", "tomato_standard_orange.png"]) expect(decoded.find((item) => item.src.endsWith(filename))?.width).toBeGreaterThanOrEqual(1024);
  await page.getByLabel("Filter", { exact: true }).selectOption("Structures");
  await page.getByLabel("Search", { exact: true }).fill("hoop");
  await page.getByRole("button", { name: "Structures", exact: true }).click();
  await page.getByRole("button", { name: "Screenshot mode", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("upright-hoops.png"), animations: "disabled" });
  expect(errors).toEqual([]);
});
