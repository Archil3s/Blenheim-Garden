import * as THREE from "three";

export function addPathDetail(root: THREE.Group, length: number, width: number, x1: number, z1: number, x2: number, z2: number) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const angle = Math.atan2(dz, dx);
  const count = Math.min(28, Math.max(8, Math.floor(length * 3.2)));
  const material = new THREE.MeshStandardMaterial({ color: 0x817b6d, roughness: 0.98, metalness: 0 });
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const pseudo = ((i * 47) % 101) / 100 - 0.5;
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (i % 4) * 0.007, 5, 4), material.clone());
    pebble.scale.set(1.15, 0.28, 0.82);
    pebble.position.set(
      x1 + dx * t - Math.sin(angle) * pseudo * width * 0.72,
      0.05,
      z1 + dz * t + Math.cos(angle) * pseudo * width * 0.72,
    );
    pebble.rotation.y = i * 0.73;
    root.add(pebble);
  }
}
