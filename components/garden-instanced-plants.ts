import * as THREE from "three";
import type { PlanSelection } from "@/lib/garden/plan-editing";
import { createGardenPlant3D } from "./garden-plant-3d";
import { createPlantGrowthPreview, plantPhaseForScale } from "./garden-plant-growth";
import { plantShapeIndex } from "./garden-plant-shape";
import { isTomatoCrop, tomatoModelVersion } from "./garden-tomato-model";
import { vegetableModelVersion } from "./garden-vegetable-model";

type PlantPoint = { id: string; x: number; y: number; height?: number; containerId?: string };

export function addInstancedPlants(root: THREE.Group, points: PlantPoint[], crop: string, variety: string, selection: PlanSelection, mobile: boolean, baseY: number, stage = 1) {
  if (!points.length) return;
  const proxies: THREE.Mesh[] = [];
  const bindings: Array<{ mesh: THREE.InstancedMesh; local: THREE.Matrix4; indices: number[] }> = [];
  const seedFor = (id: string) => Array.from(id + crop).reduce((sum, char) => (Math.imul(sum, 31) + char.charCodeAt(0)) >>> 0, 17);
  const boundsGeometry = new THREE.BoxGeometry(.36 * stage, .7 * stage, .36 * stage);
  boundsGeometry.translate(0, .35 * stage, 0);
  const boundsMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const center = new THREE.Box3();
  points.forEach((p) => center.expandByPoint(new THREE.Vector3(p.x / 100 - 4.5, baseY, p.y / 100 - 5.4)));
  const origin = center.getCenter(new THREE.Vector3());
  const plantMatrix = (index: number) => {
    const p = points[index], seed = seedFor(p.id);
    const variation = seed % 1000 / 1000, other = (seed >>> 8) % 1000 / 1000;
    return new THREE.Matrix4().compose(new THREE.Vector3(p.x / 100 - 4.5 - origin.x, (p.height ?? baseY) - baseY, p.y / 100 - 5.4 - origin.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler((other - .5) * .045, variation * Math.PI * 2, (variation - .5) * .045)), new THREE.Vector3(stage * (.93 + other * .14), stage * (.93 + variation * .14), stage * (1.04 - other * .08)));
  };
  const lod = new THREE.LOD(); lod.position.copy(origin);
  const build = (detail: boolean) => {
    const group = new THREE.Group();
    const loaded = isTomatoCrop(crop) ? tomatoModelVersion(detail) || tomatoModelVersion(false) : vegetableModelVersion(crop, variety, detail);
    // Basic loading/error plants share one batch; loaded meshes have real shape variants.
    const shapes = loaded ? 3 : 1;
    for (let shape = 0; shape < shapes; shape++) {
      const indices = points.flatMap((point, index) => (loaded ? plantShapeIndex(seedFor(point.id)) : 0) === shape ? [index] : []);
      if (!indices.length) continue;
      const source = createGardenPlant3D(crop, variety, detail, shape);
      const template = stage === 1 ? source : createPlantGrowthPreview(source, crop, plantPhaseForScale(stage), detail);
      template.updateMatrixWorld(true);
      template.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const mesh = new THREE.InstancedMesh(node.geometry, node.material, indices.length);
        mesh.userData.sharedPlantResources = node.userData.sharedPlantResources;
        mesh.userData.sharedTomatoResources = node.userData.sharedTomatoResources;
        mesh.userData.sharedPlantMaterials = node.userData.sharedPlantMaterials;
        mesh.userData.plantPart = node.userData.plantPart;
        mesh.userData.instanceRoots = proxies;
        mesh.userData.instanceIndices = indices;
        mesh.userData.plantShape = shape;
        mesh.castShadow = !mobile; mesh.receiveShadow = true;
        const local = node.matrixWorld.clone();
        mesh.userData.breezeLocal = local.elements;
        indices.forEach((index, i) => {
          const p = points[index];
          mesh.setMatrixAt(i, plantMatrix(index).multiply(local));
          const shade = Array.from(p.id).reduce((sum, char) => (sum * 17 + char.charCodeAt(0)) >>> 0, 3) % 100 / 100;
          mesh.setColorAt(i, new THREE.Color().setRGB(.96 + shade * .04, .97 + shade * .03, .94 + shade * .05));
        });
        mesh.computeBoundingSphere(); group.add(mesh); bindings.push({ mesh, local, indices });
      });
    }
    return group;
  };
  // Every saved position appears at both levels; only geometry detail changes.
  lod.addLevel(build(mobile), 0);
  if (!mobile) lod.addLevel(build(true), 10);
  lod.userData.growthPhase = plantPhaseForScale(stage);
  lod.name = "crop-detail-lod";
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
        const instance = binding.indices.indexOf(index);
        if (instance < 0) continue;
        const matrix = plantMatrix(index); matrix.setPosition(position.x - origin.x, position.y - baseY, position.z - origin.z);
        binding.mesh.setMatrixAt(instance, matrix.multiply(binding.local));
        binding.mesh.instanceMatrix.needsUpdate = true;
        binding.mesh.computeBoundingSphere();
      }
    };
    proxies.push(proxy); root.add(proxy);
  });
  for (const binding of bindings) binding.mesh.userData.instanceRoots = binding.indices.map(index => proxies[index]);
}
