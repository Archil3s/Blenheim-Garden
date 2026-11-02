import * as THREE from "three";
import { createLowpolyPlant3D } from "@/components/garden-lowpoly-plants";
import { isDetailedPlantIcon, plantIconSprite } from "@/lib/garden/plant-icons";

export const PLANT_ART_READY_EVENT = "garden-plant-art-ready";

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
  const artwork = plantIconSprite(crop, variety);
  // These species have detailed artwork but no species-specific mesh model.
  if (artwork && isDetailedPlantIcon(artwork)) {
    const root = new THREE.Group();
    const texture = new THREE.TextureLoader().load(artwork.src, () => {
      window.dispatchEvent(new Event(PLANT_ART_READY_EVENT));
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      roughness: 1,
    });
    const height = /akeake/i.test(crop) ? 0.8 : 0.4;
    for (const angle of [0, Math.PI / 2]) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.36, height), material);
      plane.position.y = height / 2;
      plane.rotation.y = angle;
      root.add(plane);
    }
    const overhead = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), material);
    overhead.rotation.x = -Math.PI / 2;
    overhead.position.y = 0.025;
    root.add(overhead);
    root.userData.crop = crop;
    root.userData.variety = variety ?? "";
    return root;
  }
  return createLowpolyPlant3D(crop, variety, mobile, seedValue);
}
