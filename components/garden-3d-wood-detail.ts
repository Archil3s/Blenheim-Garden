import * as THREE from "three";

export function addWoodGrain(root: THREE.Group, width: number, depth: number, x: number, z: number) {
  const material = new THREE.MeshBasicMaterial({ color: 0x5f412d, transparent: true, opacity: 0.14, depthWrite: false });
  const lines = 5;
  for (let i = 0; i < lines; i += 1) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.006, 0.006), material.clone());
    front.position.set(x, 0.12 + i * 0.018, z - depth / 2 - 0.043);
    root.add(front);
    const back = front.clone();
    back.position.z = z + depth / 2 + 0.043;
    root.add(back);
  }
}
