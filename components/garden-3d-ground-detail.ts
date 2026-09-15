import * as THREE from "three";

export function addGroundVariation(scene: THREE.Scene, detailed: boolean) {
  if (!detailed) return;
  const material = new THREE.MeshStandardMaterial({ color: 0x668750, roughness: 1, metalness: 0, transparent: true, opacity: 0.42 });
  for (let i = 0; i < 34; i += 1) {
    const x = (((i * 67) % 101) / 100 - 0.5) * 8.7;
    const z = (((i * 43 + 19) % 103) / 102 - 0.5) * 10.4;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.08 + (i % 5) * 0.025, 7), material.clone());
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = i * 0.91;
    patch.scale.set(1.8, 0.7 + (i % 3) * 0.18, 1);
    patch.position.set(x, -0.008, z);
    scene.add(patch);
  }
}
