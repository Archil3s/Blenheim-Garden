import { naturalPlantTransform } from "@/lib/garden/visual-3d-natural";

export function naturalPlantPosition(baseXCm: number, baseZCm: number, crop: string, seed: string, index: number) {
  const transform = naturalPlantTransform(crop, seed, index);
  return {
    xCm: baseXCm + transform.offsetXCm,
    zCm: baseZCm + transform.offsetZCm,
    transform,
  };
}
