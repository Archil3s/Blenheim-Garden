import * as THREE from "three";
import type { PlanSelection } from "@/lib/garden/plan-editing";
import { createGardenPlant3D } from "./garden-plant-3d";

type PlantPoint = { id: string; x: number; y: number; height?: number; containerId?: string };

export function addInstancedPlants(root: THREE.Group, points: PlantPoint[], crop: string, variety: string, selection: PlanSelection, mobile: boolean, baseY: number, stage = 1) {
  if (!points.length) return;
  const proxies: THREE.Mesh[] = [];
  const bindings: Array<{ mesh: THREE.InstancedMesh; local: THREE.Matrix4 }> = [];
  const boundsGeometry = new THREE.BoxGeometry(.36 * stage, .7 * stage, .36 * stage);
  boundsGeometry.translate(0, .35 * stage, 0);
  const boundsMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const center = new THREE.Box3();
  points.forEach((p) => center.expandByPoint(new THREE.Vector3(p.x / 100 - 4.5, baseY, p.y / 100 - 5.4)));
  const origin = center.getCenter(new THREE.Vector3());
  const plantMatrix = (index: number) => {
    const p = points[index], variation = ((index * 16807 + crop.length * 17) % 100) / 100;
    return new THREE.Matrix4().compose(new THREE.Vector3(p.x / 100 - 4.5 - origin.x, (p.height ?? baseY) - baseY, p.y / 100 - 5.4 - origin.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), variation * Math.PI * 2), new THREE.Vector3().setScalar(stage * (.96 + variation * .08)));
  };
  const lod = new THREE.LOD(); lod.position.copy(origin);
  const build = (detail: boolean) => {
    const template = createGardenPlant3D(crop, variety, detail, crop.length * 17);
    template.updateMatrixWorld(true);
    const group = new THREE.Group();
    template.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const mesh = new THREE.InstancedMesh(node.geometry, node.material, points.length);
      mesh.userData.sharedPlantResources = node.userData.sharedPlantResources;
      mesh.userData.sharedTomatoResources = node.userData.sharedTomatoResources;
      mesh.userData.instanceRoots = proxies;
      mesh.castShadow = !mobile; mesh.receiveShadow = true;
      const local = node.matrixWorld.clone();
      points.forEach((_, i) => mesh.setMatrixAt(i, plantMatrix(i).multiply(local)));
      mesh.computeBoundingSphere(); group.add(mesh); bindings.push({ mesh, local });
    });
    return group;
  };
  // Every saved position appears at both levels; only geometry detail changes.
  lod.addLevel(build(mobile), 0);
  if (!mobile) lod.addLevel(build(true), 10);
  root.add(lod);
  points.forEach((p, index) => {
    const proxy = new THREE.Mesh(boundsGeometry, boundsMaterial);
    proxy.raycast = () => {};
    proxy.position.set(p.x / 100 - 4.5, p.height ?? baseY, p.y / 100 - 5.4);
    proxy.userData.planSelection = { ...selection, plantId: p.id };
    proxy.userData.containerId = p.containerId;
    proxy.userData.plantProxy = true;
    proxy.userData.setPlantPosition = (position: THREE.Vector3) => {
      proxy.position.copy(position);
      for (const binding of bindings) {
        const matrix = plantMatrix(index); matrix.setPosition(position.x - origin.x, position.y - baseY, position.z - origin.z);
        binding.mesh.setMatrixAt(index, matrix.multiply(binding.local));
        binding.mesh.instanceMatrix.needsUpdate = true;
        binding.mesh.computeBoundingSphere();
      }
    };
    proxies.push(proxy); root.add(proxy);
  });
}
