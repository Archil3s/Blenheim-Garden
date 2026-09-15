import * as THREE from "three";
import { naturalPlantTransform } from "@/lib/garden/visual-3d-natural";

export function configureFallbackPlant(plant: THREE.Group, crop: string, seed: string, index: number) {
  const visual = naturalPlantTransform(crop, seed, index);
  plant.rotation.y = visual.rotationY;
  plant.scale.set(visual.scaleX, visual.scaleY, visual.scaleZ);
  return visual;
}
