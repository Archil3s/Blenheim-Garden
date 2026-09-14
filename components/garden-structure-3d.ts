import * as THREE from "three";
import type { PlannerStructure } from "@/lib/garden/planner-plan";
import { structurePreset } from "@/lib/garden/structure-catalog";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

function worldX(cm: number) { return cm / 100 - GARDEN_WIDTH_CM / 200; }
function worldZ(cm: number) { return cm / 100 - GARDEN_HEIGHT_CM / 200; }
function standard(color: number, roughness = 0.8) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }); }

function addBox(root: THREE.Group, width: number, height: number, depth: number, color: number, x = 0, y = height / 2, z = 0, roughness = 0.82) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.02, width), Math.max(0.02, height), Math.max(0.02, depth)), standard(color, roughness));
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function addPost(root: THREE.Group, x: number, z: number, height: number, color = 0x8a6747) {
  return addBox(root, 0.07, height, 0.07, color, x, height / 2, z, 0.9);
}

function setInspectable(root: THREE.Group, object: PlannerStructure) {
  const preset = structurePreset(object.kind);
  const inspect = {
    title: object.label || preset.label,
    subtitle: preset.label,
    lines: [
      { label: "Footprint", value: `${(object.widthCm / 100).toFixed(1)} × ${(object.depthCm / 100).toFixed(1)} m` },
      { label: "Height", value: `${(object.heightCm / 100).toFixed(1)} m` },
      { label: "Rotation", value: `${Math.round(object.rotationDeg)}°` },
    ],
  };
  root.traverse((item) => {
    item.userData.inspect = inspect;
    item.userData.selectionRoot = root;
  });
}

function shadows(root: THREE.Group, detailed: boolean) {
  root.traverse((item) => {
    if (!(item instanceof THREE.Mesh)) return;
    item.castShadow = detailed;
    item.receiveShadow = detailed;
  });
}

export function addStructure3D(group: THREE.Group, object: PlannerStructure, detailed: boolean) {
  const root = new THREE.Group();
  const width = Math.max(0.3, object.widthCm / 100);
  const depth = Math.max(0.3, object.depthCm / 100);
  const height = Math.max(0.2, object.heightCm / 100);
  const x = worldX(object.x);
  const z = worldZ(object.y);
  const timber = 0x946f4b;
  const timberDark = 0x715239;
  const metal = 0x74858a;

  if (object.kind === "greenhouse") {
    const cover = new THREE.MeshPhysicalMaterial({ color: 0xbfded4, transparent: true, opacity: 0.28, roughness: 0.22, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.72, depth), cover);
    shell.position.y = height * 0.36;
    root.add(shell);
    for (const px of [-width / 2, width / 2]) for (const pz of [-depth / 2, depth / 2]) addPost(root, px, pz, height * 0.78, 0x6f827b);
    const ridge = addBox(root, 0.055, 0.055, depth, 0x71847d, 0, height, 0, 0.7);
    ridge.rotation.x = 0;
    for (const side of [-1, 1]) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.56, 0.035, depth), cover.clone());
      roof.position.set(side * width * 0.24, height * 0.86, 0);
      roof.rotation.z = side * -0.48;
      root.add(roof);
    }
  } else if (object.kind === "polytunnel") {
    const cover = new THREE.MeshPhysicalMaterial({ color: 0xd2e7df, transparent: true, opacity: 0.34, roughness: 0.28, depthWrite: false, side: THREE.DoubleSide });
    const radius = width / 2;
    const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, detailed ? 18 : 12, 1, true, 0, Math.PI), cover);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.y = Math.min(height * 0.52, radius * 0.9);
    root.add(tunnel);
    const arches = detailed ? 5 : 3;
    for (let i = 0; i < arches; i += 1) {
      const pz = -depth / 2 + (depth * i) / Math.max(1, arches - 1);
      addPost(root, -width / 2, pz, Math.min(height * 0.56, radius), metal);
      addPost(root, width / 2, pz, Math.min(height * 0.56, radius), metal);
    }
  } else if (object.kind === "shed" || object.kind === "chicken-coop") {
    const bodyHeight = object.kind === "chicken-coop" ? height * 0.68 : height * 0.78;
    addBox(root, width, bodyHeight, depth, object.kind === "shed" ? 0xa9825c : 0xb9986d, 0, bodyHeight / 2, 0, 0.92);
    const maxSide = Math.max(width, depth);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(maxSide * 0.72, height - bodyHeight + 0.14, 4), standard(0x665344, 0.88));
    roof.position.y = bodyHeight + (height - bodyHeight) / 2;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(width / maxSide, 1, depth / maxSide);
    root.add(roof);
    if (object.kind === "chicken-coop") {
      addPost(root, -width * 0.36, -depth * 0.36, bodyHeight * 0.35, timberDark);
      addPost(root, width * 0.36, -depth * 0.36, bodyHeight * 0.35, timberDark);
    }
  } else if (object.kind === "cold-frame") {
    addBox(root, width, Math.min(height, 0.28), depth, timber, 0, Math.min(height, 0.28) / 2, 0, 0.92);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(width * 0.96, 0.035, depth * 0.96), new THREE.MeshPhysicalMaterial({ color: 0xcce1db, transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false }));
    lid.position.set(0, Math.min(height, 0.34), 0);
    lid.rotation.z = -0.08;
    root.add(lid);
  } else if (object.kind === "compost-bin") {
    addBox(root, width, height, 0.08, timberDark, 0, height / 2, -depth / 2);
    addBox(root, width, height, 0.08, timberDark, 0, height / 2, depth / 2);
    addBox(root, 0.08, height, depth, timber, -width / 2, height / 2, 0);
    addBox(root, 0.08, height, depth, timber, width / 2, height / 2, 0);
    if (detailed) for (const y of [0.24, 0.5, 0.76]) addBox(root, width * 0.92, 0.045, 0.045, 0x9c815c, 0, Math.min(height - 0.08, height * y), depth / 2 + 0.015);
  } else if (object.kind === "water-tank" || object.kind === "rain-barrel") {
    const radius = Math.min(width, depth) / 2;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.01, height, detailed ? 18 : 12), standard(object.kind === "water-tank" ? 0x8fa7aa : 0x6e8890, 0.62));
    tank.position.y = height / 2;
    root.add(tank);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.035, detailed ? 18 : 12), standard(0x667a7f, 0.55));
    lid.position.y = height + 0.02;
    root.add(lid);
  } else if (object.kind === "potting-bench") {
    const topY = Math.min(height * 0.82, 1.0);
    addBox(root, width, 0.09, depth, timber, 0, topY, 0, 0.86);
    for (const px of [-width * 0.42, width * 0.42]) for (const pz of [-depth * 0.36, depth * 0.36]) addPost(root, px, pz, topY, timberDark);
    addBox(root, width * 0.86, 0.06, depth * 0.72, 0x9b7a56, 0, topY * 0.48, 0, 0.9);
  } else if (object.kind === "pergola") {
    for (const px of [-width / 2, width / 2]) for (const pz of [-depth / 2, depth / 2]) addPost(root, px, pz, height, timberDark);
    addBox(root, width + 0.12, 0.09, 0.09, timber, 0, height, -depth / 2);
    addBox(root, width + 0.12, 0.09, 0.09, timber, 0, height, depth / 2);
    const slats = detailed ? 7 : 4;
    for (let i = 0; i < slats; i += 1) addBox(root, 0.055, 0.055, depth + 0.18, 0xa9855f, -width / 2 + (width * i) / Math.max(1, slats - 1), height + 0.07, 0);
  } else if (object.kind === "garden-arch") {
    addPost(root, -width / 2, 0, height * 0.82, metal);
    addPost(root, width / 2, 0, height * 0.82, metal);
    const top = new THREE.Mesh(new THREE.TorusGeometry(width / 2, 0.035, 6, detailed ? 18 : 12, Math.PI), standard(metal, 0.55));
    top.rotation.z = Math.PI;
    top.position.y = height * 0.82;
    root.add(top);
    if (depth > 0.55) {
      const back = top.clone();
      back.position.z = depth / 2;
      root.add(back);
    }
  } else if (object.kind === "beehive") {
    const layers = detailed ? 4 : 3;
    for (let i = 0; i < layers; i += 1) addBox(root, width * (1 - i * 0.025), height / layers * 0.88, depth, i % 2 ? 0xd5b454 : 0xe1c66b, 0, 0.08 + (i + 0.5) * (height / layers * 0.88), 0, 0.8);
    addBox(root, width * 1.1, 0.06, depth * 1.1, 0x7c6845, 0, height + 0.03, 0, 0.9);
  }

  root.position.set(x, 0.02, z);
  root.rotation.y = -THREE.MathUtils.degToRad(object.rotationDeg || 0);
  shadows(root, detailed);
  setInspectable(root, object);
  group.add(root);
}
