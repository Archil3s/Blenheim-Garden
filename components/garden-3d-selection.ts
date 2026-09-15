import * as THREE from "three";

export function makeGardenSelectionHelper(root: THREE.Object3D) {
  const helper = new THREE.BoxHelper(root, 0xe9b949);
  helper.material.transparent = true;
  helper.material.opacity = 0.9;
  helper.material.depthTest = false;
  helper.renderOrder = 50;
  return helper;
}
