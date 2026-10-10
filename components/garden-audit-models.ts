import * as THREE from "three";
import { consolidateGardenMeshes } from "./garden-mesh-optimization";
import { auditSeed, type AuditEntry } from "@/lib/garden/audit-catalog";
import type { PlannerPlan } from "@/lib/garden/planner-plan";
import { createGardenPlant3D } from "./garden-plant-3d";
import { resolveLowpolyPlantKind } from "./garden-lowpoly-plants";
import { addStructure3D } from "@/components/garden-structure-3d";
import { addDemonstrationBed3D } from "./garden-demo-bed-3d";
import { addRaisedBed, addPlantingArea, addRow, addPath, addTrellis, addTree, addBoundary, addGardenDecor } from "./garden-object-renderers";
import { createLegacyProceduralPlant, makePlantIconMaterial, cropKind as resolveLegacyPlantKind } from "./garden-webgl-visual";

export type AuditMode = "Production" | "Legacy artwork" | "Legacy geometry";
export type AuditRecord = AuditEntry & { renderer: string; inferredKind: string; badges: string[]; warnings: string[]; bounds: number[]; triangles: number; geometries: number; materials: number; fingerprint: string; sharedWith: string[]; lod: string };
export type AuditModel = { root: THREE.Group; record: AuditRecord; bounds: THREE.Box3 };

export function missingMarker(root: THREE.Group) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(.35, .35, .35), new THREE.MeshStandardMaterial({ color: 0xff007d, wireframe: true }));
  marker.position.y = .175;
  root.add(marker);
}

function measure(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
  const geometries = new Set<string>(), materials = new Set<string>();
  let triangles = 0, hash = 2166136261;
  const hashNumber = (value: number) => { hash = Math.imul(hash ^ Math.round(value * 100000), 16777619); };
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Sprite)) return;
    geometries.add(object.geometry.uuid);
    triangles += (object.geometry.index?.count ?? object.geometry.getAttribute("position").count) / 3;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material.uuid);
      const color = (material as THREE.MeshStandardMaterial).color;
      if (color) hashNumber(color.getHex());
    }
    object.matrixWorld.elements.forEach(hashNumber);
    Array.from(object.geometry.getAttribute("position").array as ArrayLike<number>).forEach(hashNumber);
    if (object.geometry.index) Array.from(object.geometry.index.array as ArrayLike<number>).forEach(hashNumber);
  });
  return { bounds, size, triangles, geometries: geometries.size, materials: materials.size, fingerprint: (hash >>> 0).toString(16) };
}


export function createAuditModel(entry: AuditEntry, mobile: boolean, mode: AuditMode, lod: string, invalidate: () => void, assetError: (id: string) => void, textureSources: Map<string, THREE.Source>): AuditModel {
  const root = new THREE.Group(), warnings: string[] = [], badges: string[] = [];
  let renderer = "Production shared object renderer", inferredKind: string = entry.kind, fingerprint = "";
  const variety = entry.variety === "Default" ? "" : entry.variety;
  const plan: PlannerPlan = { beds: entry.bed ? [entry.bed] : [], plantingAreas: [], rows: [], objects: [] };
  if (entry.kind === "plant") {
    inferredKind = resolveLowpolyPlantKind(entry.name, variety);
    warnings.push("SIZE FALLBACK: no authoritative mature height/spread metadata; production geometry scale retained.");
    badges.push("SIZE FALLBACK");
    if (mode === "Legacy artwork" && entry.artwork) {
      renderer = "Legacy production artwork sprite";
      inferredKind = "artwork sprite";
      const material = makePlantIconMaterial(entry.name, variety, invalidate, () => assetError(entry.id));
      if (material) {
        const sprite = new THREE.Sprite(material); sprite.center.set(.5, 0);
        const scale = mobile ? .58 : .72;
        sprite.scale.set(scale, scale, 1); root.add(sprite);
        fingerprint = `sprite:${entry.artwork.src}:${entry.artwork.column}:${entry.artwork.row}:${entry.artwork.columns}:${entry.artwork.rows}:${scale}`;
        badges.push(entry.artwork.src.endsWith(".svg") ? "SVG SPRITE" : "PNG SPRITE");
      } else { missingMarker(root); badges.push("MISSING"); }
    } else {
      const legacy = mode !== "Production";
      if (legacy) inferredKind = resolveLegacyPlantKind(entry.name);
      const plant = legacy ? createLegacyProceduralPlant(entry.name, !mobile) : createGardenPlant3D(entry.name, variety, mobile, auditSeed(entry.name + variety + entry.id));
      root.add(plant); renderer = legacy ? "Legacy procedural geometry" : "Canonical production low-poly geometry";
      badges.push("TRUE 3D");
      if (!legacy) {
        const probe = createGardenPlant3D(entry.name, variety, mobile, 173 - entry.name.length * 31 - variety.length * 17);
        fingerprint = measure(probe).fingerprint;
        probe.traverse((object) => { if (object instanceof THREE.Mesh && !object.userData.sharedPlantResources && !object.userData.sharedTomatoResources) object.geometry.dispose(); });
      } else fingerprint = measure(plant).fingerprint;
      if (inferredKind === "leafy" || (legacy && ["herb", "brassica"].includes(inferredKind))) {
        badges.push("GENERIC FALLBACK"); warnings.push("GENERIC FALLBACK: no dedicated crop renderer in this path.");
      }
      if (mode === "Legacy artwork") { badges.push("ARTWORK FALLBACK"); warnings.push("ARTWORK FALLBACK: no mapped sprite; existing legacy geometry is used."); }
      if (legacy && variety) { badges.push("VARIETY FALLBACK"); warnings.push("VARIETY FALLBACK: legacy geometry accepts crop only; variety is ignored."); }
    }
  } else if (entry.kind === "asset" && entry.artwork) {
    renderer = "Original artwork reference (not a production 3D model)";
    const texture = new THREE.TextureLoader().load(entry.artwork.src, invalidate, undefined, () => assetError(entry.id));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(1 / entry.artwork.columns, 1 / entry.artwork.rows);
    texture.offset.set(entry.artwork.column / entry.artwork.columns, 1 - (entry.artwork.row + 1) / entry.artwork.rows);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.center.set(.5, 0); sprite.scale.set(.72, .72, 1); root.add(sprite);
    badges.push(entry.artwork.src.endsWith(".svg") ? "SVG SPRITE" : "PNG SPRITE");
    if (entry.variety === "Unmapped file") warnings.push("UNMAPPED ASSET: artwork file has no crop/variety mapping.");
  } else if (entry.object?.type === "structure") { addStructure3D(root, entry.object, !mobile); renderer = "Production structure V2 / legacy dispatch"; inferredKind = entry.object.kind; }
  else if (entry.object?.type === "trellis") {
    addTrellis(root, entry.object, mobile);
    if (entry.name.includes("Climber")) { const plant = createGardenPlant3D("Bean", "Climbing bean", mobile, auditSeed(entry.id)); plant.position.z = .12; root.add(plant); }
  } else if (entry.object?.type === "path") addPath(root, entry.object, mobile);
  else if (entry.object?.type === "tree") addTree(root, entry.object, mobile);
  else if (entry.bed) {
    addRaisedBed(root, entry.bed, undefined, mobile);
    if (entry.name === "Planted bed") {
      const area = { id: "audit-only", bedId: entry.bed.id, crop: "Lettuce", cropIcon: "", variety: "Butterhead", spacingCm: 30, x: 0, y: 0, w: 100, h: 100, count: 12, pattern: "grid" as const, iconSize: 1, visualSpacing: "normal" as const };
      plan.plantingAreas.push(area); addPlantingArea(root, plan, area, mobile);
    }
  } else if (entry.kind === "row") addRow(root, { id: "audit-row", crop: "Carrot", cropIcon: "", variety: "Nantes", spacingCm: 30, x1: 350, y1: 540, x2: 550, y2: 540, count: 5 }, mobile, plan);
  else if (entry.kind === "boundary") addBoundary(root, mobile);
  else if (entry.kind === "decor") addGardenDecor(root, mobile);
  else if (entry.kind === "demo") addDemonstrationBed3D(root, mobile);
  else { missingMarker(root); renderer = "Missing production renderer (audit placeholder)"; badges.push("MISSING"); warnings.push("MISSING RENDERER: planner text is not rendered by the current production 3D scene."); }
  if (!badges.length) badges.push("TRUE 3D");
  if (entry.assetExists === false) { missingMarker(root); badges.push("ASSET ERROR"); warnings.push("MISSING ASSET: " + entry.artwork?.src); }
  const measured = measure(root);
  if (!measured.bounds.isEmpty()) {
    if (entry.object?.type === "structure") {
      const expected = [entry.object.widthCm / 100, entry.object.heightCm / 100, entry.object.depthCm / 100];
      const actual = [measured.size.x, measured.size.y, measured.size.z];
      if (actual.some((value, index) => value > expected[index] * 1.45 + .15 || value < expected[index] * .55 - .05)) warnings.push("DIMENSION MISMATCH: measured bounds differ substantially from requested dimensions; inspect overhangs and renderer clamps.");
    }
    if (entry.kind === "plant" && measured.size.y < .03) warnings.push("EXTREME SCALE: height below 3 cm.");
    if (entry.kind === "plant" && measured.size.y > 6) warnings.push("EXTREME SCALE: height above 6 m.");
    if (measured.bounds.min.y > .15) warnings.push("FLOATING: lowest geometry is over 15 cm above ground.");
    if (measured.bounds.max.y < 0 || measured.bounds.max.y < -measured.bounds.min.y) warnings.push("BURIED: most geometry is below ground.");
  }
  // Identical original artwork can share GPU pixels while retaining each
  // production material's independent atlas transform and error callback.
  root.traverse((object) => {
    if (!(object instanceof THREE.Sprite) || !entry.artwork || !object.material.map) return;
    const source = textureSources.get(entry.artwork.src);
    if (source) object.material.map.source = source;
    else textureSources.set(entry.artwork.src, object.material.map.source);
  });
  for (const warning of warnings) {
    const badge = warning.split(":")[0];
    if (["DIMENSION MISMATCH", "FLOATING", "BURIED", "EXTREME SCALE"].includes(badge) && !badges.includes(badge)) badges.push(badge);
  }
  consolidateGardenMeshes(root);
  return { root, bounds: measured.bounds, record: { ...entry, renderer, inferredKind, badges, warnings, bounds: [measured.size.x, measured.size.y, measured.size.z], triangles: measured.triangles, geometries: measured.geometries, materials: measured.materials, fingerprint, sharedWith: [], lod } };
}

export function identifySharedModels(models: AuditModel[]) {
  const groups = new Map<string, AuditModel[]>();
  for (const model of models) {
    if (!model.record.fingerprint || model.record.kind !== "plant") continue;
    const key = model.record.fingerprint;
    groups.set(key, [...(groups.get(key) ?? []), model]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const model of group) {
      model.record.sharedWith = group.filter((other) => other !== model).map((other) => other.record.id);
      model.record.badges.push("SHARED MODEL");
      const distinct = new Set(group.map((other) => other.record.artwork?.src + ":" + other.record.artwork?.index));
      model.record.warnings.push(distinct.size > 1 ? "SHARED MODEL: distinct artwork maps to identical production geometry; review intended variety differences." : "SHARED MODEL: identical rendering may be intentional.");
    }
  }
}
