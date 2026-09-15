import * as THREE from "three";

const mat = (color: number, roughness = 0.88) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });

export function addTrellisNetting(root: THREE.Group, length: number, height: number, angle: number, x: number, z: number) {
  const wire = mat(0x707c76, 0.62);
  const horizontal = 5;
  for (let i = 1; i <= horizontal; i += 1) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, length, 5), wire.clone());
    rail.rotation.z = Math.PI / 2;
    rail.rotation.y = angle;
    rail.position.set(x, (height * i) / (horizontal + 1), z);
    root.add(rail);
  }
  const vertical = Math.max(3, Math.min(14, Math.ceil(length / 0.38)));
  for (let i = 1; i < vertical; i += 1) {
    const t = i / vertical - 0.5;
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, height * 0.86, 5), wire.clone());
    strand.position.set(x + Math.cos(-angle) * length * t, height * 0.46, z - Math.sin(-angle) * length * t);
    root.add(strand);
  }
}

export function addTreeBranches(root: THREE.Group, x: number, z: number, trunkTop: number, radius: number, detailed: boolean) {
  if (!detailed) return;
  const branchMaterial = mat(0x67472f, 0.94);
  const branches = 5;
  for (let i = 0; i < branches; i += 1) {
    const a = (i / branches) * Math.PI * 2 + 0.35;
    const length = radius * (0.52 + (i % 2) * 0.12);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, length, 6), branchMaterial.clone());
    branch.position.set(x + Math.cos(a) * length * 0.32, trunkTop + radius * 0.15, z + Math.sin(a) * length * 0.32);
    branch.rotation.z = Math.PI / 2.7;
    branch.rotation.y = -a;
    root.add(branch);
  }
}
