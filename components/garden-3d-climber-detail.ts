import * as THREE from "three";

export function addClimbingVine(root: THREE.Group, x: number, z: number, height = 0.85) {
  const material = new THREE.MeshStandardMaterial({ color: 0x477c42, roughness: 0.9, metalness: 0 });
  const segments = 5;
  for (let i = 0; i < segments; i += 1) {
    const y = (height * (i + 0.5)) / segments;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, height / segments * 1.08, 5), material.clone());
    vine.position.set(x + Math.sin(i * 1.7) * 0.018, y, z);
    vine.rotation.z = Math.sin(i * 1.3) * 0.08;
    root.add(vine);
  }
}
