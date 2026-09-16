import * as THREE from "three";

// The live 3D garden deliberately keeps the procedural geometry supplied by
// GardenWorkspaceRealistic. This matches the demonstration bed's true 3D
// modelling style instead of swapping mature plants for flat billboard art.
// The 2D planner still uses the full plant icon catalogue independently.
export class GardenPlantArtwork {
  plant(crop: string, variety: string, fallback: THREE.Group, seed: number) {
    void crop;
    void variety;
    void seed;
    return fallback;
  }

  dispose() {
    // Procedural plant geometry is disposed by the owning scene group.
  }
}

export function surfaceMaterial(kind: "soil" | "wood" | "grass", color: number) {
  // Match the benchmark Demo bed palette/material response for every live 3D
  // raised bed. Keep the grass texture because it belongs to the wider scene,
  // not to the bed style itself.
  if (kind === "soil") {
    return new THREE.MeshStandardMaterial({
      color: 0x4b3024,
      roughness: 1,
      metalness: 0,
    });
  }

  if (kind === "wood") {
    const source = new THREE.Color(color);
    const isDarkEdge = source.r + source.g + source.b < 1.1;
    return new THREE.MeshStandardMaterial({
      color: isDarkEdge ? 0x69452f : 0x9a6742,
      roughness: isDarkEdge ? 0.92 : 0.86,
      metalness: 0,
    });
  }

  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = hash - Math.floor(hash);
      const grain = noise * 35;
      const value = Math.round(185 + grain + noise * 20);
      const offset = (y * size + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 3);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.012,
    roughness: 1,
  });
}
