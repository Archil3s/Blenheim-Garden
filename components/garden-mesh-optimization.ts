import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Merge compatible opaque meshes without changing positions, normals or materials.
export function consolidateGardenMeshes(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const groups = new Map<string, { material: THREE.Material; meshes: THREE.Mesh[] }>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material) || object.material.transparent) return;
    if (object.userData.sharedPlantResources || object.userData.sharedTomatoResources) return;
    const appearance = object.material.toJSON();
    delete appearance.uuid; delete appearance.metadata;
    const key = JSON.stringify(appearance) + Object.keys(object.geometry.attributes).sort().join("|") + [object.castShadow, object.receiveShadow, object.visible, object.renderOrder].join(":");
    const group = groups.get(key) ?? { material: object.material, meshes: [] as THREE.Mesh[] };
    group.meshes.push(object); groups.set(key, group);
  });
  for (const group of groups.values()) {
    if (group.meshes.length < 2) continue;
    const copies = group.meshes.map((mesh) => (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));
    const geometry = mergeGeometries(copies);
    copies.forEach((copy) => copy.dispose());
    if (!geometry) continue;
    group.meshes.forEach((mesh) => mesh.removeFromParent());
    const merged = new THREE.Mesh(geometry, group.material);
    merged.castShadow = group.meshes[0].castShadow;
    merged.receiveShadow = group.meshes[0].receiveShadow;
    merged.visible = group.meshes[0].visible;
    merged.renderOrder = group.meshes[0].renderOrder;
    root.add(merged);
  }
}
