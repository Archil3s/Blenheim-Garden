import * as THREE from "three";
import { createLowpolyPlant3D } from "@/components/garden-lowpoly-plants";

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
  return createLowpolyPlant3D(crop, variety, mobile, seedValue);
}
