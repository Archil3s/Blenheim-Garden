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

function addCylinder(root: THREE.Group, radius: number, height: number, color: number, y = height / 2, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.02, radius), Math.max(0.02, radius), Math.max(0.02, height), segments), standard(color, 0.76));
  mesh.position.y = y;
  root.add(mesh);
  return mesh;
}

function addArchTunnel(root: THREE.Group, width: number, depth: number, height: number, color: number, detailed: boolean, cover?: { color: number; opacity: number }) {
  const radius = Math.max(0.12, width / 2);
  const arches = detailed ? 6 : 4;
  for (let i = 0; i < arches; i += 1) {
    const z = -depth / 2 + (depth * i) / Math.max(1, arches - 1);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 6, detailed ? 24 : 14, Math.PI), standard(color, 0.56));
    arch.rotation.z = Math.PI;
    arch.scale.y = Math.max(0.35, height / radius);
    arch.position.z = z;
    root.add(arch);
  }
  addBox(root, 0.035, 0.035, depth, color, -width / 2, 0.035, 0, 0.6);
  addBox(root, 0.035, 0.035, depth, color, width / 2, 0.035, 0, 0.6);
  addBox(root, 0.035, 0.035, depth, color, 0, height, 0, 0.6);
  if (cover) {
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.98, Math.max(0.08, height * 0.96), depth * 0.98),
      new THREE.MeshPhysicalMaterial({ color: cover.color, transparent: true, opacity: cover.opacity, roughness: 0.45, metalness: 0, depthWrite: false, side: THREE.DoubleSide }),
    );
    shell.position.y = height * 0.48;
    root.add(shell);
  }
}

function addFramedCover(root: THREE.Group, width: number, depth: number, height: number, coverColor: number, opacity: number, detailed: boolean) {
  const frameColor = 0x71847b;
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) addPost(root, x, z, height, frameColor);
  addBox(root, width, 0.04, 0.04, frameColor, 0, height, -depth / 2, 0.62);
  addBox(root, width, 0.04, 0.04, frameColor, 0, height, depth / 2, 0.62);
  addBox(root, 0.04, 0.04, depth, frameColor, -width / 2, height, 0, 0.62);
  addBox(root, 0.04, 0.04, depth, frameColor, width / 2, height, 0, 0.62);
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.99, 0.025, depth * 0.99),
    new THREE.MeshPhysicalMaterial({ color: coverColor, transparent: true, opacity, roughness: detailed ? 0.52 : 0.68, depthWrite: false, side: THREE.DoubleSide }),
  );
  cover.position.y = height + 0.02;
  root.add(cover);
}

function addRaisedBed(root: THREE.Group, width: number, depth: number, height: number, wallColor: number, soilColor = 0x4e3d2b) {
  addBox(root, width, height, depth, wallColor, 0, height / 2, 0, 0.9);
  addBox(root, width * 0.88, 0.035, depth * 0.82, soilColor, 0, height + 0.02, 0, 1);
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
  const height = Math.max(0.08, object.heightCm / 100);
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
    addBox(root, 0.055, 0.055, depth, 0x71847d, 0, height, 0, 0.7);
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
  } else if (
    object.kind === "cattle-panel-arch" || object.kind === "bean-arch" || object.kind === "cucumber-arch" ||
    object.kind === "hoop-arch" || object.kind === "low-hoop-frame" || object.kind === "row-cover-hoops"
  ) {
    const frameColor = object.kind === "cattle-panel-arch" ? 0x697b77 : object.kind === "bean-arch" ? 0x718a65 : 0x778984;
    addArchTunnel(root, width, depth, height, frameColor, detailed);
    if (object.kind === "cattle-panel-arch" && detailed) {
      const gridRows = 5;
      for (let i = 1; i < gridRows; i += 1) addBox(root, width * 0.88, 0.018, 0.018, 0x778682, 0, (height * i) / gridRows, -depth / 2 + 0.02, 0.5);
    }
  } else if (object.kind === "a-frame-trellis") {
    const diagonal = Math.hypot(width / 2, height);
    for (const side of [-1, 1]) {
      const beam = addBox(root, 0.07, diagonal, depth, timber, side * width / 4, height / 2, 0, 0.82);
      beam.rotation.z = side * Math.atan2(width / 2, height);
    }
    addBox(root, 0.08, 0.08, depth + 0.08, timberDark, 0, height, 0, 0.85);
  } else if (object.kind === "insect-net-tunnel") {
    addArchTunnel(root, width, depth, height, 0x78958b, detailed, { color: 0xd6ebe4, opacity: 0.18 });
  } else if (object.kind === "frost-cloth-tunnel") {
    addArchTunnel(root, width, depth, height, 0x889792, detailed, { color: 0xf1f1e9, opacity: 0.3 });
  } else if (object.kind === "cloche") {
    addArchTunnel(root, width, depth, height, 0x7f928c, detailed, { color: 0xddebe7, opacity: 0.34 });
  } else if (object.kind === "bird-net-frame") {
    addFramedCover(root, width, depth, height, 0xb6d2c2, 0.16, detailed);
    if (detailed) {
      addBox(root, 0.025, height, depth, 0x76917e, -width / 2, height / 2, 0, 0.6);
      addBox(root, 0.025, height, depth, 0x76917e, width / 2, height / 2, 0, 0.6);
    }
  } else if (object.kind === "shade-cloth-frame") {
    addFramedCover(root, width, depth, height, 0x55705e, 0.42, detailed);
  } else if (object.kind === "pot") {
    const radius = Math.min(width, depth) / 2;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, height, detailed ? 18 : 12), standard(0x9d624b, 0.88));
    pot.position.y = height / 2;
    root.add(pot);
    addCylinder(root, radius * 0.72, 0.025, 0x4c3b2d, height + 0.012, detailed ? 18 : 12);
  } else if (object.kind === "grow-bag") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x535e59, height / 2, detailed ? 14 : 10);
    addCylinder(root, radius * 0.84, 0.025, 0x493a2c, height + 0.012, detailed ? 14 : 10);
  } else if (object.kind === "half-barrel") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x89643e, height / 2, detailed ? 18 : 12);
    addCylinder(root, radius * 0.84, 0.03, 0x49392a, height + 0.016, detailed ? 18 : 12);
    addBox(root, width * 1.02, 0.025, 0.035, 0x5f5a51, 0, height * 0.48, depth / 2 + 0.01, 0.55);
  } else if (object.kind === "planter-box" || object.kind === "trough-planter") {
    addRaisedBed(root, width, depth, height, object.kind === "trough-planter" ? 0x8c7356 : 0xa6815d);
  } else if (object.kind === "wicking-bed") {
    addRaisedBed(root, width, depth, height, 0x73878e);
    addBox(root, width * 0.94, height * 0.18, depth * 0.9, 0x8ca8b2, 0, height * 0.12, 0, 0.6);
  } else if (object.kind === "seed-tray") {
    addBox(root, width, Math.max(0.04, height), depth, 0x59665f, 0, Math.max(0.04, height) / 2, 0, 0.75);
    if (detailed) {
      const cols = 5;
      const rows = 3;
      for (let col = 0; col < cols; col += 1) for (let row = 0; row < rows; row += 1) {
        const cell = addCylinder(root, Math.min(width / cols, depth / rows) * 0.22, 0.018, 0x4c3b2d, Math.max(0.04, height) + 0.012, 8);
        cell.position.x = -width * 0.4 + (width * 0.8 * col) / (cols - 1);
        cell.position.z = -depth * 0.34 + (depth * 0.68 * row) / (rows - 1);
      }
    }
  } else if (object.kind === "raised-bed-timber" || object.kind === "raised-bed-square") {
    addRaisedBed(root, width, depth, height, 0x9c7854);
  } else if (object.kind === "raised-bed-corrugated") {
    addRaisedBed(root, width, depth, height, 0x8d9a9d);
    if (detailed) {
      for (let i = 1; i < 6; i += 1) addBox(root, 0.018, height * 0.92, depth + 0.01, 0xb5bfc1, -width / 2 + (width * i) / 6, height / 2, 0, 0.55);
    }
  } else if (object.kind === "raised-bed-round") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x8f9c9d, height / 2, detailed ? 22 : 14);
    addCylinder(root, radius * 0.82, 0.035, 0x4d3d2c, height + 0.018, detailed ? 22 : 14);
  } else if (object.kind === "keyhole-bed") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x9b7c59, height / 2, detailed ? 24 : 16);
    addCylinder(root, radius * 0.78, 0.035, 0x4d3d2c, height + 0.018, detailed ? 24 : 16);
    addCylinder(root, radius * 0.18, height * 0.72, 0x78664e, height * 0.72 / 2, detailed ? 16 : 10);
    addBox(root, radius * 0.42, height * 1.02, radius * 0.9, 0x6f604a, 0, height * 0.5, radius * 0.68, 0.9);
  }

  root.position.set(x, 0.02, z);
  root.rotation.y = -THREE.MathUtils.degToRad(object.rotationDeg || 0);
  shadows(root, detailed);
  setInspectable(root, object);
  group.add(root);
}
