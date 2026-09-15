import * as THREE from "three";
import { plantIconSprite } from "@/lib/garden/plant-icons";

// Each scene build owns its textures; late image loads cannot revive a cleared scene.
export class GardenPlantArtwork {
  private materials = new Map<string, THREE.SpriteMaterial>();
  private disposed = false;

  plant(crop: string, variety: string, fallback: THREE.Group, seed: number) {
    const icon = plantIconSprite(crop, variety);
    if (!icon) return fallback;
    const key = `${icon.src}:${icon.index}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.SpriteMaterial({
        transparent: true, alphaTest: 0.12, depthWrite: true,
        color: 0xffffff, toneMapped: false,
      });
      const target = material;
      const texture = new THREE.TextureLoader().load(icon.src, () => {
        if (this.disposed) { texture.dispose(); return; }
        target.userData.ready = true;
      }, undefined, () => { target.userData.failed = true; });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(1 / icon.columns, 1 / icon.rows);
      texture.offset.set(icon.column / icon.columns, 1 - (icon.row + 1) / icon.rows);
      target.map = texture;
      this.materials.set(key, target);
    }
    const root = new THREE.Group();
    const sprite = new THREE.Sprite(material);
    sprite.center.set(0.5, 0.1);
    const variation = 0.92 + (Math.sin(seed * 12.9898) + 1) * 0.08;
    const height = (/akeake|angelica/.test(crop.toLowerCase()) ? 1.05 : 0.78) * variation;
    sprite.scale.set(height, height, 1);
    // Keep the geometry fallback until artwork is decoded, including on failed requests.
    sprite.visible = false;
    const target = material;

    root.add(fallback, sprite);
    root.userData.updateArtwork = () => {
      sprite.visible = Boolean(target.userData.ready);
      fallback.visible = !sprite.visible;
    };
    return root;
  }

  dispose() {
    this.disposed = true;
    this.materials.forEach((material) => {
      material.map?.dispose();
      material.dispose();
    });
    this.materials.clear();
  }
}

export function surfaceMaterial(kind: "soil" | "wood" | "grass", color: number) {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = hash - Math.floor(hash);
      const grain = kind === "wood"
        ? Math.sin(y * 1.8 + Math.sin(x * 0.08) * 2) * 15
        : noise * (kind === "soil" ? 65 : 35);
      const value = Math.round(185 + grain + noise * 20);
      const offset = (y * size + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "grass" ? 12 : 3, kind === "wood" ? 1 : 3);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color, map: texture, bumpMap: texture,
    bumpScale: kind === "soil" ? 0.035 : 0.012,
    roughness: kind === "wood" ? 0.9 : 1,
  });
}

