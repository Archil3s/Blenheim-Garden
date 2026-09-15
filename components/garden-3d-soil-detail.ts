import * as THREE from "three";

export function addSoilDetail(root: THREE.Group, width: number, depth: number, x: number, z: number, seed = 1) {
  const material = new THREE.MeshStandardMaterial({ color: 0x33271f, roughness: 1, metalness: 0 });
  const count = Math.min(22, Math.max(8, Math.floor(width * depth * 1.4)));
  for (let i = 0; i < count; i += 1) {
    const fx = (((i * 37 + seed * 11) % 101) / 100 - 0.5) * Math.max(0.05, width - 0.18);
    const fz = (((i * 61 + seed * 7) % 103) / 102 - 0.5) * Math.max(0.05, depth - 0.18);
    const crumb = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.006, 4, 3), material.clone());
    crumb.scale.y = 0.45;
    crumb.position.set(x + fx, 0.238, z + fz);
    root.add(crumb);
  }
}
