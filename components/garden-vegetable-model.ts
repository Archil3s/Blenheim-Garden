import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { vegetableModelFor, type VegetableModel } from "@/lib/garden/vegetable-model-catalog";

type Entry = { root?: THREE.Group; pending?: Promise<void> };
const templates = new Map<string, Entry>();
const asset = (model: VegetableModel, mobile: boolean) => mobile ? model.mobile : model.desktop;

function templateFor(model: VegetableModel, mobile: boolean) {
  return templates.get(asset(model, mobile))?.root ?? templates.get(model.desktop)?.root;
}

export function vegetableModelVersion(crop: string, variety: string | null | undefined, mobile: boolean) {
  const model = vegetableModelFor(crop, variety);
  if (!model || model.kind === "tomato") return 0;
  if (templates.get(asset(model, mobile))?.root) return 2;
  return mobile && templates.get(model.desktop)?.root ? 1 : 0;
}

export function loadGardenVegetableModel(model: VegetableModel, mobile: boolean): Promise<void> {
  const url = asset(model, mobile);
  let entry = templates.get(url);
  if (!entry) { entry = {}; templates.set(url, entry); }
  if (entry.root) return Promise.resolve();
  if (entry.pending) return entry.pending;
  const target = entry;
  target.pending = new GLTFLoader().loadAsync(url).then(({ scene }) => {
    scene.name = `${model.crop} · ${model.variety}`;
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = !mobile;
      object.receiveShadow = true;
      object.userData.sharedPlantResources = true;
    });
    target.root = scene;
  }).catch((error: unknown) => {
    target.pending = undefined;
    throw error;
  });
  return target.pending;
}

export function createLoadedVegetableModel(crop: string, variety: string | null | undefined, mobile: boolean, seed: number) {
  const model = vegetableModelFor(crop, variety);
  if (!model || model.kind === "tomato") return null;
  const template = templateFor(model, mobile);
  if (!template) return null;
  const plant = new THREE.Group();
  const visual = template.clone(true);
  visual.position.y -= model.plantingDepth;
  plant.add(visual);
  plant.userData.vegetableModel = model.id;
  plant.userData.rendererKind = model.kind;
  const variation = ((Math.floor(seed) * 16807) >>> 0) % 100 / 100;
  plant.rotation.y = variation * Math.PI * 2;
  plant.scale.setScalar(.96 + variation * .08);
  return plant;
}
