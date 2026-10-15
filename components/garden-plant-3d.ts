import * as THREE from "three";
import { createLowpolyPlant3D } from "@/components/garden-lowpoly-plants";
import { createLoadedTomatoModel, isTomatoCrop } from "./garden-tomato-model";
import { createLoadedVegetableModel } from "./garden-vegetable-model";

/**
 * Public plant-rendering entry point used by the unified 3D garden and crop-patch
 * renderer. Keeping this wrapper stable lets the planner data model, selection,
 * saved plans, and crop placement logic stay unchanged while the visual language
 * can evolve independently.
 */
export function createGardenPlant3D(
  crop: string,
  variety: string | null | undefined,
  mobile: boolean,
  seedValue: number,
): THREE.Group {
  if (isTomatoCrop(crop)) {
    const tomato = createLoadedTomatoModel(mobile, seedValue);
    if (tomato) return tomato;
  }
  const vegetable = createLoadedVegetableModel(crop, variety, mobile, seedValue);
  if (vegetable) return vegetable;
  return createLowpolyPlant3D(crop, variety, mobile, seedValue);
}
