import * as THREE from "three";
import { plantBillboardScale } from "@/components/garden-3d-icon-scale";
import { cropSoilY } from "@/components/garden-3d-crop-height";
import { naturalPlantTransform } from "@/lib/garden/visual-3d-natural";

export function configurePlantArtwork(
  sprite: THREE.Sprite,
  crop: string,
  seed: string,
  index: number,
  detailed: boolean,
  iconSize = 18,
) {
  const visual = naturalPlantTransform(crop, seed, index);
  const size = plantBillboardScale(crop, detailed, iconSize);
  sprite.center.set(0.5, 0);
  sprite.scale.set(size.width * (visual.scaleX / Math.max(0.01, visual.scaleY)), size.height, 1);
  sprite.position.y = cropSoilY(crop, true);
  sprite.material.rotation = visual.rotationY * 0.18;
  return visual;
}
