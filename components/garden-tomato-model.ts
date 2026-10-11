import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type ModelEntry = { root?: THREE.Group; pending?: Promise<void> };
// Two document-lifetime templates share their GPU resources across plant clones.
const models = new Map<boolean, ModelEntry>();

export function isTomatoCrop(crop: string) {
  return /^tomato(?:es)?$/i.test(crop.trim());
}

export function tomatoModelVersion(mobile: boolean) {
  return models.get(mobile)?.root ? 1 : 0;
}

export function loadGardenTomatoModel(mobile: boolean): Promise<void> {
  let entry = models.get(mobile);
  if (!entry) { entry = {}; models.set(mobile, entry); }
  if (entry.root) return Promise.resolve();
  if (entry.pending) return entry.pending;
  const target = entry;
  target.pending = new GLTFLoader().loadAsync(`/models/tomato/tomato-${mobile ? "mobile" : "garden"}.glb`).then(({ scene }) => {
    scene.name = "Refined tomato plant";
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = !mobile;
        object.receiveShadow = true;
        object.userData.sharedTomatoResources = true;
      }
    });
    target.root = scene;
  }).catch((error: unknown) => {
    target.pending = undefined;
    throw error;
  });
  return target.pending;
}

export function createLoadedTomatoModel(mobile: boolean, seed: number): THREE.Group | null {
  const template = models.get(mobile)?.root ?? models.get(false)?.root;
  if (!template) return null;
  const plant = template.clone(true);
  plant.userData.tomatoModel = "refined";
  const variation = ((Math.floor(seed) * 16807) >>> 0) % 100 / 100;
  plant.rotation.y = variation * Math.PI * 2;
  plant.scale.set(.65, .94 + variation * .08, .65);
  return plant;
}
