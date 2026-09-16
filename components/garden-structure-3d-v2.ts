import * as THREE from "three";
import type { PlannerStructure } from "@/lib/garden/planner-plan";
import { structurePreset } from "@/lib/garden/structure-catalog";
import { addStructure3D as addStructure3DLegacy } from "./garden-structure-3d";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

const C = {
  timber: 0x9b704d,
  timberLight: 0xbc8a5f,
  timberDark: 0x62432f,
  timberCut: 0xd0a77d,
  roof: 0x4c5351,
  roofDark: 0x343a39,
  metal: 0x697774,
  metalLight: 0x98a6a1,
  aluminium: 0xaeb8b4,
  glass: 0xbddbd7,
  plastic: 0xdfece8,
  mesh: 0x798f87,
  soil: 0x4b3024,
  compost: 0x5d3b29,
  tank: 0x718b93,
  tankDark: 0x50676e,
  brass: 0xb78c43,
  white: 0xe7e7df,
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function material(color: number, roughness = 0.82, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function transparentMaterial(color: number, opacity: number, roughness = 0.24) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness,
    metalness: 0,
    transmission: 0.06,
    thickness: 0.018,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function box(
  root: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  color: number,
  x = 0,
  y = height / 2,
  z = 0,
  roughness = 0.82,
  metalness = 0,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.012, width), Math.max(0.012, height), Math.max(0.012, depth)),
    material(color, roughness, metalness),
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function panel(
  root: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.012, width), Math.max(0.012, height), Math.max(0.012, depth)),
    mat,
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function post(root: THREE.Object3D, x: number, z: number, height: number, color = C.timberDark, baseY = 0, size = 0.075) {
  return box(root, size, height, size, color, x, baseY + height / 2, z, 0.9);
}

function cylinder(
  root: THREE.Object3D,
  radius: number,
  height: number,
  color: number,
  x = 0,
  y = height / 2,
  z = 0,
  segments = 18,
  roughness = 0.72,
  metalness = 0,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(0.012, radius), Math.max(0.012, radius), Math.max(0.012, height), segments),
    material(color, roughness, metalness),
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function beamBetween(
  root: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
  thickness: number,
  color: number,
  roughness = 0.82,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.02, direction.length());
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, length, thickness), material(color, roughness));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  root.add(mesh);
  return mesh;
}

function torusHoop(root: THREE.Object3D, width: number, height: number, z: number, color: number, detailed: boolean, tube = 0.024) {
  const radius = width / 2;
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, detailed ? 8 : 6, detailed ? 40 : 24, Math.PI),
    material(color, 0.48, 0.16),
  );
  hoop.rotation.z = Math.PI;
  hoop.scale.y = Math.max(0.35, height / Math.max(0.1, radius));
  hoop.position.z = z;
  root.add(hoop);
  return hoop;
}

function addGableEnd(root: THREE.Object3D, width: number, rise: number, baseY: number, z: number, color: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false });
  geometry.translate(0, 0, -0.0175);
  const mesh = new THREE.Mesh(geometry, material(color, 0.9));
  mesh.position.set(0, baseY, z);
  root.add(mesh);
  return mesh;
}

function addGableRoof(
  root: THREE.Object3D,
  width: number,
  depth: number,
  baseY: number,
  rise: number,
  color: number,
  detailed: boolean,
  options?: { gutter?: boolean; corrugated?: boolean },
) {
  const overhang = Math.min(0.24, Math.max(0.12, Math.min(width, depth) * 0.075));
  const halfSpan = width / 2 + overhang;
  const roofDepth = depth + overhang * 2;
  const slope = Math.hypot(halfSpan, rise);
  const angle = Math.atan2(rise, halfSpan);

  for (const side of [-1, 1] as const) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.055, roofDepth), material(color, 0.9));
    roof.position.set(side * halfSpan / 2, baseY + rise / 2, 0);
    roof.rotation.z = side === -1 ? angle : -angle;
    root.add(roof);

    if (detailed) {
      const seamCount = options?.corrugated ? Math.max(5, Math.min(12, Math.round(roofDepth / 0.32))) : Math.max(3, Math.min(7, Math.round(roofDepth / 0.55)));
      for (let i = 1; i < seamCount; i += 1) {
        const z = -roofDepth / 2 + (roofDepth * i) / seamCount;
        const seam = box(root, slope * 0.97, 0.014, 0.018, C.roofDark, side * halfSpan / 2, baseY + rise / 2 + 0.029, z, 0.7, 0.06);
        seam.rotation.z = side === -1 ? angle : -angle;
      }
    }

    box(root, 0.055, 0.11, roofDepth, C.roofDark, side * halfSpan, baseY - 0.005, 0, 0.85);

    if (options?.gutter) {
      const gutter = cylinder(root, 0.032, roofDepth * 0.98, C.roofDark, side * halfSpan, baseY - 0.06, 0, detailed ? 14 : 10, 0.56, 0.18);
      gutter.rotation.x = Math.PI / 2;
    }
  }

  box(root, 0.09, 0.09, roofDepth + 0.02, C.roofDark, 0, baseY + rise + 0.025, 0, 0.8);
  return { halfSpan, roofDepth, slope, angle, overhang };
}

function addDownpipe(root: THREE.Object3D, x: number, z: number, fromY: number, toY = 0.08) {
  const height = Math.max(0.12, fromY - toY);
  const pipe = cylinder(root, 0.027, height, C.metal, x, toY + height / 2, z, 10, 0.5, 0.2);
  const shoe = cylinder(root, 0.029, 0.18, C.metal, x, toY + 0.04, z + 0.07, 10, 0.5, 0.2);
  shoe.rotation.x = Math.PI / 2;
  return pipe;
}

function addFramedDoor(
  root: THREE.Object3D,
  width: number,
  height: number,
  z: number,
  baseY: number,
  slabColor: number,
  detailed: boolean,
  frameColor = C.timberDark,
) {
  box(root, width, height, 0.045, slabColor, 0, baseY + height / 2, z, 0.9);
  const f = 0.055;
  box(root, f, height + f, 0.065, frameColor, -width / 2 - f / 2, baseY + height / 2, z + 0.012, 0.88);
  box(root, f, height + f, 0.065, frameColor, width / 2 + f / 2, baseY + height / 2, z + 0.012, 0.88);
  box(root, width + f * 2, f, 0.065, frameColor, 0, baseY + height + f / 2, z + 0.012, 0.88);

  if (detailed) {
    beamBetween(
      root,
      new THREE.Vector3(-width * 0.4, baseY + height * 0.15, z + 0.04),
      new THREE.Vector3(width * 0.4, baseY + height * 0.84, z + 0.04),
      0.042,
      C.timberLight,
      0.88,
    );
    for (const y of [baseY + height * 0.26, baseY + height * 0.72]) {
      box(root, 0.022, 0.085, 0.035, C.metal, -width / 2 + 0.03, y, z + 0.055, 0.46, 0.3);
    }
  }

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), material(C.brass, 0.3, 0.5));
  handle.position.set(width * 0.33, baseY + height * 0.52, z + 0.06);
  root.add(handle);
}

function addFrontWindow(root: THREE.Object3D, x: number, y: number, z: number, width: number, height: number, detailed: boolean, frameColor = C.timberDark) {
  const glass = panel(root, width, height, 0.022, transparentMaterial(0x9fc8cb, 0.55), x, y, z);
  glass.renderOrder = 3;
  const f = 0.035;
  box(root, width + f * 2, f, 0.048, frameColor, x, y - height / 2, z + 0.012, 0.88);
  box(root, width + f * 2, f, 0.048, frameColor, x, y + height / 2, z + 0.012, 0.88);
  box(root, f, height, 0.048, frameColor, x - width / 2, y, z + 0.012, 0.88);
  box(root, f, height, 0.048, frameColor, x + width / 2, y, z + 0.012, 0.88);
  if (detailed) {
    box(root, f * 0.65, height, 0.05, frameColor, x, y, z + 0.016, 0.88);
    box(root, width, f * 0.65, 0.05, frameColor, x, y, z + 0.016, 0.88);
  }
  box(root, width + 0.09, 0.045, 0.09, C.timberLight, x, y - height / 2 - 0.035, z + 0.032, 0.9);
}

function addVerticalCladding(root: THREE.Object3D, width: number, depth: number, height: number, baseY: number, detailed: boolean) {
  const frontCount = detailed ? Math.max(6, Math.min(14, Math.round(width / 0.28))) : Math.max(4, Math.round(width / 0.5));
  for (let i = 1; i < frontCount; i += 1) {
    const x = -width / 2 + (width * i) / frontCount;
    box(root, 0.018, height * 0.96, 0.026, i % 2 ? C.timberLight : C.timberDark, x, baseY + height / 2, depth / 2 + 0.017, 0.93);
    box(root, 0.018, height * 0.96, 0.026, i % 2 ? C.timberDark : C.timberLight, x, baseY + height / 2, -depth / 2 - 0.017, 0.93);
  }
  const sideCount = detailed ? Math.max(5, Math.min(12, Math.round(depth / 0.3))) : Math.max(3, Math.round(depth / 0.55));
  for (let i = 1; i < sideCount; i += 1) {
    const z = -depth / 2 + (depth * i) / sideCount;
    box(root, 0.026, height * 0.96, 0.018, i % 2 ? C.timberLight : C.timberDark, width / 2 + 0.017, baseY + height / 2, z, 0.93);
    box(root, 0.026, height * 0.96, 0.018, i % 2 ? C.timberDark : C.timberLight, -width / 2 - 0.017, baseY + height / 2, z, 0.93);
  }
}

function addGreenhouse(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const wallHeight = Math.max(height * 0.64, height - Math.max(0.55, width * 0.26));
  const roofRise = Math.max(0.28, height - wallHeight);
  const frame = C.aluminium;
  const glass = transparentMaterial(C.glass, detailed ? 0.2 : 0.27, 0.2);
  const bays = detailed ? Math.max(4, Math.min(9, Math.round(depth / 0.62))) : Math.max(3, Math.min(5, Math.round(depth / 0.9)));

  box(root, width + 0.05, 0.09, 0.065, frame, 0, 0.045, -depth / 2, 0.5, 0.22);
  box(root, width + 0.05, 0.09, 0.065, frame, 0, 0.045, depth / 2, 0.5, 0.22);
  box(root, 0.065, 0.09, depth, frame, -width / 2, 0.045, 0, 0.5, 0.22);
  box(root, 0.065, 0.09, depth, frame, width / 2, 0.045, 0, 0.5, 0.22);

  for (let i = 0; i <= bays; i += 1) {
    const z = -depth / 2 + (depth * i) / bays;
    post(root, -width / 2, z, wallHeight, frame, 0.07, 0.042);
    post(root, width / 2, z, wallHeight, frame, 0.07, 0.042);
    beamBetween(root, new THREE.Vector3(-width / 2, wallHeight + 0.07, z), new THREE.Vector3(0, height + 0.07, z), 0.035, frame, 0.5);
    beamBetween(root, new THREE.Vector3(width / 2, wallHeight + 0.07, z), new THREE.Vector3(0, height + 0.07, z), 0.035, frame, 0.5);
  }

  for (const x of [-width / 2, width / 2]) {
    box(root, 0.04, 0.04, depth, frame, x, wallHeight * 0.5, 0, 0.52, 0.22);
    box(root, 0.045, 0.045, depth, frame, x, wallHeight + 0.07, 0, 0.52, 0.22);
  }
  box(root, 0.05, 0.05, depth, frame, 0, height + 0.07, 0, 0.48, 0.25);

  for (const x of [-width / 2 - 0.008, width / 2 + 0.008]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, wallHeight), glass.clone());
    side.rotation.y = Math.PI / 2;
    side.position.set(x, wallHeight / 2 + 0.07, 0);
    root.add(side);
  }
  for (const z of [-depth / 2 - 0.008, depth / 2 + 0.008]) {
    const end = new THREE.Mesh(new THREE.PlaneGeometry(width, wallHeight), glass.clone());
    end.position.set(0, wallHeight / 2 + 0.07, z);
    root.add(end);
  }

  const half = width / 2;
  const slope = Math.hypot(half, roofRise);
  const angle = Math.atan2(roofRise, half);
  for (const side of [-1, 1] as const) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.018, depth), glass.clone());
    roof.position.set(side * half / 2, wallHeight + roofRise / 2 + 0.07, 0);
    roof.rotation.z = side === -1 ? angle : -angle;
    root.add(roof);
  }

  const doorWidth = Math.min(0.92, width * 0.42);
  const doorHeight = Math.min(wallHeight * 0.9, height * 0.72);
  const doorZ = depth / 2 + 0.028;
  box(root, doorWidth + 0.06, 0.045, 0.07, frame, 0, 0.095, doorZ, 0.5, 0.22);
  box(root, 0.045, doorHeight, 0.055, frame, -doorWidth / 2, 0.07 + doorHeight / 2, doorZ, 0.5, 0.22);
  box(root, 0.045, doorHeight, 0.055, frame, doorWidth / 2, 0.07 + doorHeight / 2, doorZ, 0.5, 0.22);
  box(root, doorWidth, 0.045, 0.055, frame, 0, 0.07 + doorHeight, doorZ, 0.5, 0.22);
  box(root, doorWidth, 0.032, 0.055, frame, 0, 0.07 + doorHeight * 0.52, doorZ + 0.005, 0.5, 0.22);
  const doorPane = panel(root, doorWidth * 0.9, doorHeight * 0.94, 0.018, glass.clone(), 0, 0.07 + doorHeight * 0.5, doorZ - 0.004);
  doorPane.renderOrder = 4;

  if (detailed) {
    const ventWidth = Math.min(0.62, width * 0.26);
    const ventDepth = Math.min(0.75, depth * 0.22);
    const vent = new THREE.Mesh(new THREE.BoxGeometry(ventWidth, 0.025, ventDepth), glass.clone());
    vent.position.set(width * 0.18, height * 0.91, -depth * 0.16);
    vent.rotation.z = -angle + 0.18;
    root.add(vent);
    box(root, ventWidth, 0.025, 0.025, frame, width * 0.18, height * 0.91 + 0.035, -depth * 0.16 - ventDepth / 2, 0.5, 0.2).rotation.z = -angle + 0.18;

    const benchHeight = Math.min(0.72, wallHeight * 0.52);
    box(root, width * 0.32, 0.055, depth * 0.72, C.timberLight, -width * 0.31, benchHeight, 0, 0.88);
    for (const z of [-depth * 0.29, depth * 0.29]) post(root, -width * 0.31, z, benchHeight, C.timberDark, 0, 0.05);
  }

  for (const side of [-1, 1]) {
    const gutter = cylinder(root, 0.025, depth, frame, side * (width / 2 + 0.015), wallHeight + 0.03, 0, 10, 0.5, 0.2);
    gutter.rotation.x = Math.PI / 2;
  }
  addDownpipe(root, width / 2 + 0.02, depth / 2 - 0.04, wallHeight + 0.03, 0.08);
  glass.dispose();
}

function addPolytunnel(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const archCount = detailed ? Math.max(6, Math.min(11, Math.round(depth / 0.58) + 1)) : Math.max(4, Math.min(6, Math.round(depth / 0.9) + 1));
  for (let i = 0; i < archCount; i += 1) {
    const z = -depth / 2 + (depth * i) / Math.max(1, archCount - 1);
    torusHoop(root, width, height, z, C.metalLight, detailed, 0.025);
  }

  box(root, 0.034, 0.034, depth, C.metalLight, 0, height, 0, 0.48, 0.16);
  for (const x of [-width * 0.43, width * 0.43]) box(root, 0.03, 0.03, depth, C.metalLight, x, height * 0.34, 0, 0.48, 0.16);

  const cover = transparentMaterial(C.plastic, detailed ? 0.2 : 0.28, 0.32);
  const radius = width / 2;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.985, radius * 0.985, depth * 0.99, detailed ? 36 : 24, 1, true, 0, Math.PI),
    cover.clone(),
  );
  shell.rotation.x = Math.PI / 2;
  shell.position.y = Math.min(height * 0.5, radius * 0.9);
  root.add(shell);

  for (const x of [-width / 2, width / 2]) {
    box(root, 0.055, 0.11, depth, C.timberDark, x, 0.055, 0, 0.92);
    const rollTube = cylinder(root, 0.024, depth * 0.92, C.metal, x * 0.98, height * 0.22, 0, 10, 0.5, 0.2);
    rollTube.rotation.x = Math.PI / 2;
  }

  const doorWidth = Math.min(0.92, width * 0.36);
  const doorHeight = Math.min(height * 0.72, 1.9);
  const frontZ = depth / 2 + 0.025;
  box(root, 0.038, doorHeight, 0.045, C.metalLight, -doorWidth / 2, doorHeight / 2, frontZ, 0.48, 0.16);
  box(root, 0.038, doorHeight, 0.045, C.metalLight, doorWidth / 2, doorHeight / 2, frontZ, 0.48, 0.16);
  box(root, doorWidth, 0.038, 0.045, C.metalLight, 0, doorHeight, frontZ, 0.48, 0.16);
  const door = panel(root, doorWidth * 0.94, doorHeight * 0.94, 0.018, cover.clone(), 0, doorHeight * 0.48, frontZ + 0.004);
  door.renderOrder = 4;
  box(root, 0.015, doorHeight * 0.9, 0.022, 0x6e7d79, 0, doorHeight * 0.49, frontZ + 0.018, 0.5, 0.1);

  if (detailed) {
    beamBetween(root, new THREE.Vector3(-width * 0.42, 0.1, -depth / 2), new THREE.Vector3(0, height * 0.86, -depth / 2), 0.025, C.metalLight, 0.5);
    beamBetween(root, new THREE.Vector3(width * 0.42, 0.1, -depth / 2), new THREE.Vector3(0, height * 0.86, -depth / 2), 0.025, C.metalLight, 0.5);
  }

  cover.dispose();
}

function addShed(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const bodyHeight = height * 0.73;
  const rise = Math.max(0.3, height - bodyHeight);

  for (const x of [-width * 0.34, width * 0.34]) for (const z of [-depth * 0.34, depth * 0.34]) {
    box(root, 0.22, 0.08, 0.22, 0x8b8d87, x, 0.04, z, 0.98);
  }
  box(root, width * 0.9, 0.11, 0.12, C.timberDark, 0, 0.095, -depth * 0.34, 0.94);
  box(root, width * 0.9, 0.11, 0.12, C.timberDark, 0, 0.095, depth * 0.34, 0.94);

  box(root, width, bodyHeight, depth, 0x9b7353, 0, 0.13 + bodyHeight / 2, 0, 0.95);
  addVerticalCladding(root, width, depth, bodyHeight, 0.13, detailed);
  addGableEnd(root, width, rise, 0.13 + bodyHeight, depth / 2 + 0.002, 0x8c6449);
  addGableEnd(root, width, rise, 0.13 + bodyHeight, -depth / 2 - 0.002, 0x76513b);
  const roof = addGableRoof(root, width, depth, 0.13 + bodyHeight, rise, C.roof, detailed, { gutter: true, corrugated: true });
  addDownpipe(root, roof.halfSpan, depth / 2 - 0.04, 0.13 + bodyHeight - 0.04, 0.1);

  const doorWidth = Math.min(0.9, width * 0.4);
  const doorHeight = bodyHeight * 0.78;
  addFramedDoor(root, doorWidth, doorHeight, depth / 2 + 0.032, 0.13, 0x76543d, detailed);
  addFrontWindow(root, -width * 0.28, 0.13 + bodyHeight * 0.63, depth / 2 + 0.034, Math.min(0.5, width * 0.22), Math.min(0.44, bodyHeight * 0.3), detailed);

  if (detailed) {
    box(root, Math.min(0.75, width * 0.34), 0.04, 0.16, C.timberLight, width * 0.2, 0.13 + bodyHeight * 0.3, depth / 2 + 0.1, 0.9);
    for (const x of [width * 0.08, width * 0.32]) box(root, 0.025, 0.19, 0.025, C.metal, x, 0.13 + bodyHeight * 0.22, depth / 2 + 0.12, 0.5, 0.2);
  }
}

function addChickenCoop(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const legHeight = Math.min(0.4, height * 0.22);
  const bodyHeight = height * 0.5;
  const bodyBase = legHeight;
  const rise = Math.max(0.24, height - bodyBase - bodyHeight);

  for (const x of [-width * 0.38, width * 0.38]) for (const z of [-depth * 0.34, depth * 0.34]) post(root, x, z, legHeight, C.timberDark, 0, 0.075);
  box(root, width, bodyHeight, depth, 0xb28a60, 0, bodyBase + bodyHeight / 2, 0, 0.94);
  addVerticalCladding(root, width, depth, bodyHeight, bodyBase, detailed);
  addGableEnd(root, width, rise, bodyBase + bodyHeight, depth / 2 + 0.002, 0x9c754f);
  addGableEnd(root, width, rise, bodyBase + bodyHeight, -depth / 2 - 0.002, 0x866145);
  addGableRoof(root, width, depth, bodyBase + bodyHeight, rise, 0x5a5149, detailed, { gutter: false, corrugated: false });

  const popWidth = Math.min(0.48, width * 0.28);
  const popHeight = Math.min(0.5, bodyHeight * 0.5);
  box(root, popWidth, popHeight, 0.035, 0x704d36, 0, bodyBase + popHeight / 2 + 0.04, depth / 2 + 0.03, 0.9);

  const run = Math.min(0.92, depth * 0.62);
  const drop = Math.max(0.08, bodyBase);
  const rampLength = Math.hypot(run, drop);
  const ramp = box(root, Math.min(0.42, width * 0.28), 0.045, rampLength, 0x8e6748, 0, bodyBase / 2 + 0.06, depth / 2 + run / 2, 0.92);
  ramp.rotation.x = Math.atan2(drop, run);
  if (detailed) {
    for (let i = -2; i <= 2; i += 1) {
      const cleat = box(root, Math.min(0.39, width * 0.26), 0.026, 0.035, C.timberDark, 0, 0, 0, 0.94);
      cleat.position.copy(ramp.position);
      cleat.rotation.x = ramp.rotation.x;
      const off = (i / 5) * rampLength;
      cleat.position.y -= Math.sin(ramp.rotation.x) * off;
      cleat.position.z += Math.cos(ramp.rotation.x) * off;
    }
  }

  const nestDepth = Math.min(0.38, depth * 0.24);
  box(root, width * 0.5, bodyHeight * 0.36, nestDepth, 0x987052, width * 0.24, bodyBase + bodyHeight * 0.42, -depth / 2 - nestDepth / 2, 0.92);
  const nestLid = box(root, width * 0.54, 0.05, nestDepth * 1.16, C.roofDark, width * 0.24, bodyBase + bodyHeight * 0.63, -depth / 2 - nestDepth / 2, 0.86);
  nestLid.rotation.x = -0.09;

  if (detailed) {
    const meshW = Math.min(width * 0.34, 0.55);
    const meshH = Math.min(bodyHeight * 0.38, 0.42);
    const mx = -width * 0.26;
    const my = bodyBase + bodyHeight * 0.62;
    const mz = depth / 2 + 0.034;
    addFrontWindow(root, mx, my, mz, meshW, meshH, false, C.timberDark);
    for (let i = -2; i <= 2; i += 1) box(root, 0.012, meshH * 0.9, 0.015, C.mesh, mx + (meshW * i) / 5, my, mz + 0.036, 0.52, 0.08);
    for (let i = -1; i <= 1; i += 1) box(root, meshW * 0.9, 0.012, 0.015, C.mesh, mx, my + (meshH * i) / 3, mz + 0.036, 0.52, 0.08);
  }
}

function addColdFrame(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const frontH = Math.max(0.16, Math.min(height * 0.52, 0.28));
  const backH = Math.max(frontH + 0.08, Math.min(height * 0.82, 0.48));
  const wall = Math.min(0.085, Math.min(width, depth) * 0.08);
  const lidAngle = Math.atan2(backH - frontH, depth);
  const lidLength = Math.hypot(depth, backH - frontH);

  box(root, width, backH, wall, C.timber, 0, backH / 2, -depth / 2 + wall / 2, 0.92);
  box(root, width, frontH, wall, C.timberDark, 0, frontH / 2, depth / 2 - wall / 2, 0.92);
  box(root, wall, (frontH + backH) / 2, depth, C.timber, -width / 2 + wall / 2, (frontH + backH) / 4, 0, 0.92);
  box(root, wall, (frontH + backH) / 2, depth, C.timberDark, width / 2 - wall / 2, (frontH + backH) / 4, 0, 0.92);
  box(root, Math.max(0.05, width - wall * 2), 0.035, Math.max(0.05, depth - wall * 2), C.soil, 0, frontH * 0.55, 0, 1);

  const lid = new THREE.Group();
  const glass = panel(lid, width * 0.94, 0.02, lidLength * 0.96, transparentMaterial(C.glass, 0.42), 0, 0, 0);
  glass.renderOrder = 4;
  box(lid, width, 0.05, 0.05, C.timberLight, 0, 0, -lidLength / 2, 0.9);
  box(lid, width, 0.05, 0.05, C.timberLight, 0, 0, lidLength / 2, 0.9);
  box(lid, 0.05, 0.05, lidLength, C.timberLight, -width / 2, 0, 0, 0.9);
  box(lid, 0.05, 0.05, lidLength, C.timberLight, width / 2, 0, 0, 0.9);
  if (detailed) box(lid, 0.038, 0.04, lidLength * 0.94, C.timberDark, 0, 0.012, 0, 0.9);
  lid.rotation.x = -lidAngle;
  lid.position.set(0, (frontH + backH) / 2 + 0.035, 0);
  root.add(lid);

  if (detailed) {
    for (const x of [-width * 0.25, width * 0.25]) box(root, 0.06, 0.025, 0.035, C.metal, x, backH + 0.02, -depth / 2 + 0.07, 0.46, 0.25);
  }
}

function addCompostBin(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const postSize = 0.075;
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) post(root, x, z, height, C.timberDark, 0, postSize);

  const slats = detailed ? Math.max(6, Math.min(10, Math.round(height / 0.14))) : Math.max(4, Math.round(height / 0.2));
  const slatH = Math.min(0.09, height / (slats * 1.35));
  for (let i = 0; i < slats; i += 1) {
    const y = ((i + 0.7) / slats) * height;
    box(root, width, slatH, 0.045, i % 2 ? C.timber : C.timberLight, 0, y, -depth / 2, 0.94);
    box(root, 0.045, slatH, depth, i % 2 ? C.timberLight : C.timber, -width / 2, y, 0, 0.94);
    box(root, 0.045, slatH, depth, i % 2 ? C.timber : C.timberLight, width / 2, y, 0, 0.94);
    if (i < Math.ceil(slats * 0.62)) box(root, width * 0.9, slatH, 0.04, C.timberDark, 0, y, depth / 2, 0.94);
  }

  const mound = new THREE.Mesh(new THREE.SphereGeometry(Math.min(width, depth) * 0.34, detailed ? 12 : 8, detailed ? 8 : 6), material(C.compost, 1));
  mound.scale.set(width / Math.min(width, depth) * 0.78, 0.46, depth / Math.min(width, depth) * 0.78);
  mound.position.set(0, Math.min(height * 0.42, 0.38), 0);
  root.add(mound);
  if (detailed) {
    for (const [x, y, z] of [[-0.12, 0.34, 0.08], [0.14, 0.29, -0.06], [0.02, 0.4, 0.02]] as const) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 5), material(0x68734a, 1));
      leaf.scale.set(1.5, 0.2, 0.65);
      leaf.position.set(x, y, z);
      root.add(leaf);
    }
  }
}

function addWaterContainer(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean, barrel: boolean) {
  const radius = Math.min(width, depth) / 2;
  const segments = detailed ? 28 : 18;
  const body = cylinder(root, radius, height, barrel ? 0x6f765d : C.tank, 0, height / 2, 0, segments, 0.62, 0.04);
  body.scale.x = width / Math.max(0.01, Math.min(width, depth));
  body.scale.z = depth / Math.max(0.01, Math.min(width, depth));

  const ribCount = barrel ? 3 : 5;
  for (let i = 1; i <= ribCount; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.985, 0.018, 6, segments), material(C.tankDark, 0.46, 0.22));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = (height * i) / (ribCount + 1);
    ring.scale.x = body.scale.x;
    ring.scale.y = body.scale.z;
    root.add(ring);
  }

  cylinder(root, radius * 0.78, 0.055, C.tankDark, 0, height + 0.026, 0, segments, 0.54, 0.12);
  cylinder(root, radius * 0.16, 0.045, C.tankDark, 0, height + 0.065, 0, 14, 0.52, 0.16);

  const tapY = Math.min(height * 0.28, 0.42);
  const stem = cylinder(root, 0.025, 0.18, C.brass, 0, tapY, radius + 0.07, 10, 0.38, 0.45);
  stem.rotation.x = Math.PI / 2;
  const handle = box(root, 0.16, 0.022, 0.03, C.brass, 0, tapY + 0.09, radius + 0.15, 0.38, 0.45);
  handle.rotation.y = Math.PI / 4;

  if (detailed && !barrel) {
    const inlet = cylinder(root, 0.035, height * 0.32, C.metal, -radius * 0.55, height * 0.86, 0, 12, 0.48, 0.18);
    inlet.rotation.z = Math.PI / 2;
    const overflow = cylinder(root, 0.028, 0.18, C.metal, radius * 0.72, height * 0.78, 0, 10, 0.48, 0.18);
    overflow.rotation.z = Math.PI / 2;
  }
}

function addPottingBench(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const workY = Math.min(height * 0.55, 0.9);
  const leg = 0.065;
  for (const x of [-width * 0.43, width * 0.43]) for (const z of [-depth * 0.36, depth * 0.36]) post(root, x, z, workY, C.timberDark, 0, leg);
  box(root, width, 0.075, depth, C.timberLight, 0, workY, 0, 0.88);
  box(root, width * 0.9, 0.055, depth * 0.82, C.timber, 0, workY * 0.33, 0, 0.92);
  box(root, width * 0.92, height - workY, 0.055, C.timber, 0, workY + (height - workY) / 2, -depth / 2 + 0.03, 0.92);
  box(root, width * 0.72, 0.055, depth * 0.36, C.timberLight, 0, height * 0.88, -depth * 0.3, 0.9);

  if (detailed) {
    box(root, width * 0.42, 0.035, depth * 0.52, C.metal, -width * 0.2, workY + 0.055, 0, 0.56, 0.16);
    box(root, width * 0.37, 0.018, depth * 0.46, C.soil, -width * 0.2, workY + 0.078, 0, 1);
    box(root, width * 0.72, 0.035, 0.035, C.metal, 0, height * 0.72, -depth / 2 - 0.012, 0.5, 0.18);
    for (const x of [-width * 0.22, 0, width * 0.22]) {
      const hook = cylinder(root, 0.012, 0.16, C.metal, x, height * 0.64, -depth / 2 - 0.04, 8, 0.48, 0.18);
      hook.rotation.x = Math.PI / 2;
    }
  }
}

function addPergola(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const postInsetX = width * 0.43;
  const postInsetZ = depth * 0.43;
  for (const x of [-postInsetX, postInsetX]) for (const z of [-postInsetZ, postInsetZ]) post(root, x, z, height, C.timberDark, 0, 0.1);

  for (const z of [-postInsetZ, postInsetZ]) {
    box(root, width + 0.24, 0.11, 0.085, C.timber, 0, height - 0.02, z, 0.9);
    box(root, width + 0.24, 0.07, 0.055, C.timberLight, 0, height + 0.07, z, 0.9);
  }
  const rafters = detailed ? Math.max(6, Math.min(12, Math.round(width / 0.42))) : Math.max(4, Math.round(width / 0.65));
  for (let i = 0; i < rafters; i += 1) {
    const x = -width / 2 + (width * i) / Math.max(1, rafters - 1);
    box(root, 0.055, 0.075, depth + 0.26, C.timberLight, x, height + 0.11, 0, 0.9);
  }

  if (detailed) {
    for (const x of [-postInsetX, postInsetX]) {
      beamBetween(root, new THREE.Vector3(x, height * 0.72, -postInsetZ), new THREE.Vector3(x * 0.72, height - 0.02, -postInsetZ), 0.055, C.timberLight, 0.9);
      beamBetween(root, new THREE.Vector3(x, height * 0.72, postInsetZ), new THREE.Vector3(x * 0.72, height - 0.02, postInsetZ), 0.055, C.timberLight, 0.9);
    }

    const latticeX = -postInsetX;
    for (let i = 1; i < 6; i += 1) box(root, 0.018, height * 0.68, 0.018, C.timberLight, latticeX, height * 0.38, -postInsetZ + (depth * 0.86 * i) / 6, 0.9);
    for (let i = 1; i < 5; i += 1) box(root, 0.018, 0.018, depth * 0.82, C.timberLight, latticeX, (height * 0.68 * i) / 5, 0, 0.9);
  }
}

function addGardenArch(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean, color = C.timberDark, metalArch = false) {
  const sideX = width / 2;
  const uprightH = Math.max(0.35, height - width / 2);
  const postColor = metalArch ? C.metal : color;
  post(root, -sideX, -depth / 2, uprightH, postColor, 0, metalArch ? 0.045 : 0.07);
  post(root, sideX, -depth / 2, uprightH, postColor, 0, metalArch ? 0.045 : 0.07);
  post(root, -sideX, depth / 2, uprightH, postColor, 0, metalArch ? 0.045 : 0.07);
  post(root, sideX, depth / 2, uprightH, postColor, 0, metalArch ? 0.045 : 0.07);

  for (const z of [-depth / 2, depth / 2]) {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(width / 2, metalArch ? 0.025 : 0.04, 7, detailed ? 30 : 20, Math.PI),
      material(postColor, metalArch ? 0.5 : 0.88, metalArch ? 0.16 : 0),
    );
    arch.rotation.z = Math.PI;
    arch.position.set(0, uprightH, z);
    root.add(arch);
  }

  const rungs = detailed ? 7 : 4;
  for (let i = 1; i <= rungs; i += 1) {
    const t = i / (rungs + 1);
    box(root, 0.022, 0.022, depth, metalArch ? C.mesh : C.timberLight, -sideX, uprightH * t, 0, 0.55, metalArch ? 0.08 : 0);
    box(root, 0.022, 0.022, depth, metalArch ? C.mesh : C.timberLight, sideX, uprightH * t, 0, 0.55, metalArch ? 0.08 : 0);
  }

  if (detailed) {
    for (const a of [-0.62, 0, 0.62]) {
      const x = Math.sin(a) * width * 0.42;
      const y = uprightH + Math.cos(a) * width * 0.42;
      box(root, 0.022, 0.022, depth, metalArch ? C.mesh : C.timberLight, x, y, 0, 0.55, metalArch ? 0.08 : 0);
    }
  }
}

function addBeehive(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const standH = Math.min(0.22, height * 0.16);
  for (const x of [-width * 0.34, width * 0.34]) for (const z of [-depth * 0.28, depth * 0.28]) post(root, x, z, standH, C.timberDark, 0, 0.055);
  box(root, width * 0.9, 0.055, depth * 0.88, C.timberDark, 0, standH, 0, 0.9);

  const boxCount = detailed ? 4 : 3;
  const boxHeight = Math.max(0.12, (height - standH - 0.12) / boxCount);
  for (let i = 0; i < boxCount; i += 1) {
    const y = standH + 0.04 + boxHeight * (i + 0.5);
    box(root, width * (1 - i * 0.012), boxHeight * 0.94, depth * (1 - i * 0.012), i % 2 ? 0xcba36c : 0xb78b55, 0, y, 0, 0.9);
    if (detailed) {
      box(root, width * 0.34, 0.04, 0.035, C.timberDark, 0, y, depth / 2 + 0.02, 0.9);
      box(root, width * 0.34, 0.04, 0.035, C.timberDark, 0, y, -depth / 2 - 0.02, 0.9);
    }
  }
  const roofY = standH + 0.04 + boxHeight * boxCount + 0.055;
  box(root, width * 1.08, 0.09, depth * 1.08, C.roof, 0, roofY, 0, 0.86);
  box(root, width * 0.76, 0.035, depth * 0.26, C.timberLight, 0, standH + 0.045, depth * 0.55, 0.9);
  box(root, width * 0.45, 0.028, 0.035, C.timberDark, 0, standH + 0.085, depth / 2 + 0.028, 0.9);
}

function addArchTunnel(root: THREE.Group, width: number, depth: number, height: number, color: number, detailed: boolean, cover?: { color: number; opacity: number }) {
  const hoops = detailed ? Math.max(5, Math.min(9, Math.round(depth / 0.6) + 1)) : Math.max(3, Math.min(5, Math.round(depth / 0.9) + 1));
  for (let i = 0; i < hoops; i += 1) torusHoop(root, width, height, -depth / 2 + (depth * i) / Math.max(1, hoops - 1), color, detailed, 0.02);

  box(root, 0.024, 0.024, depth, color, 0, height, 0, 0.5, 0.1);
  for (const x of [-width * 0.43, width * 0.43]) box(root, 0.02, 0.02, depth, color, x, height * 0.34, 0, 0.5, 0.1);

  if (cover) {
    const radius = width / 2;
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.99, radius * 0.99, depth * 0.98, detailed ? 28 : 18, 1, true, 0, Math.PI),
      transparentMaterial(cover.color, cover.opacity, 0.5),
    );
    shell.rotation.x = Math.PI / 2;
    shell.scale.y = Math.max(0.35, height / Math.max(radius, 0.1));
    shell.position.y = Math.min(height * 0.5, radius * 0.9);
    root.add(shell);
  }
}

function addAFrameTrellis(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const diagonal = Math.hypot(width / 2, height);
  for (const z of [-depth / 2, depth / 2]) for (const side of [-1, 1] as const) {
    const leg = box(root, 0.065, diagonal, 0.065, C.timber, side * width / 4, height / 2, z, 0.88);
    leg.rotation.z = side * Math.atan2(width / 2, height);
  }
  box(root, 0.075, 0.075, depth + 0.08, C.timberDark, 0, height, 0, 0.9);

  const rows = detailed ? 7 : 4;
  for (let i = 1; i <= rows; i += 1) {
    const ratio = i / (rows + 1);
    const y = height * ratio;
    const span = Math.max(0.08, width * (1 - ratio));
    for (const z of [-depth / 2, depth / 2]) box(root, span, 0.018, 0.018, C.mesh, 0, y, z, 0.5, 0.08);
  }
  if (detailed) {
    const strings = 5;
    for (let i = 1; i < strings; i += 1) {
      const z = -depth / 2 + (depth * i) / strings;
      beamBetween(root, new THREE.Vector3(-width / 2, 0.06, z), new THREE.Vector3(0, height, z), 0.012, C.mesh, 0.5);
      beamBetween(root, new THREE.Vector3(width / 2, 0.06, z), new THREE.Vector3(0, height, z), 0.012, C.mesh, 0.5);
    }
  }
}

function addFramedNet(root: THREE.Group, width: number, depth: number, height: number, color: number, opacity: number, detailed: boolean) {
  const frame = C.metal;
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) post(root, x, z, height, frame, 0, 0.045);
  box(root, width, 0.035, 0.035, frame, 0, height, -depth / 2, 0.55, 0.12);
  box(root, width, 0.035, 0.035, frame, 0, height, depth / 2, 0.55, 0.12);
  box(root, 0.035, 0.035, depth, frame, -width / 2, height, 0, 0.55, 0.12);
  box(root, 0.035, 0.035, depth, frame, width / 2, height, 0, 0.55, 0.12);

  const net = transparentMaterial(color, opacity, 0.62);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), net.clone());
  top.rotation.x = -Math.PI / 2;
  top.position.y = height + 0.01;
  root.add(top);
  for (const z of [-depth / 2, depth / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(width, height), net.clone());
    p.position.set(0, height / 2, z);
    root.add(p);
  }
  for (const x of [-width / 2, width / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), net.clone());
    p.rotation.y = Math.PI / 2;
    p.position.set(x, height / 2, 0);
    root.add(p);
  }

  if (detailed) {
    beamBetween(root, new THREE.Vector3(-width / 2, 0.04, depth / 2 + 0.012), new THREE.Vector3(width / 2, height, depth / 2 + 0.012), 0.018, frame, 0.55);
    beamBetween(root, new THREE.Vector3(width / 2, 0.04, -depth / 2 - 0.012), new THREE.Vector3(-width / 2, height, -depth / 2 - 0.012), 0.018, frame, 0.55);
    for (let i = 1; i < 5; i += 1) box(root, width, 0.01, 0.012, C.mesh, 0, (height * i) / 5, depth / 2 + 0.02, 0.6);
  }
  net.dispose();
}

function inspectAndFinish(group: THREE.Group, root: THREE.Group, object: PlannerStructure, detailed: boolean) {
  const preset = structurePreset(object.kind);
  root.position.set(worldX(object.x), 0.02, worldZ(object.y));
  root.rotation.y = -THREE.MathUtils.degToRad(object.rotationDeg || 0);
  const inspect = {
    title: object.label || preset.label,
    subtitle: `${preset.label} · detailed structure`,
    lines: [
      { label: "Footprint", value: `${(object.widthCm / 100).toFixed(1)} × ${(object.depthCm / 100).toFixed(1)} m` },
      { label: "Height", value: `${(object.heightCm / 100).toFixed(1)} m` },
      { label: "Rotation", value: `${Math.round(object.rotationDeg || 0)}°` },
    ],
  };
  root.traverse((item) => {
    item.userData.inspect = inspect;
    item.userData.selectionRoot = root;
    if (item instanceof THREE.Mesh) {
      item.castShadow = detailed;
      item.receiveShadow = detailed;
    }
  });
  group.add(root);
}

const V2_KINDS = new Set([
  "greenhouse",
  "polytunnel",
  "shed",
  "chicken-coop",
  "cold-frame",
  "compost-bin",
  "water-tank",
  "rain-barrel",
  "potting-bench",
  "pergola",
  "garden-arch",
  "beehive",
  "cattle-panel-arch",
  "bean-arch",
  "cucumber-arch",
  "hoop-arch",
  "low-hoop-frame",
  "row-cover-hoops",
  "a-frame-trellis",
  "insect-net-tunnel",
  "frost-cloth-tunnel",
  "cloche",
  "bird-net-frame",
  "shade-cloth-frame",
]);

export function addStructure3D(group: THREE.Group, object: PlannerStructure, detailed: boolean) {
  if (!V2_KINDS.has(object.kind)) {
    addStructure3DLegacy(group, object, detailed);
    return;
  }

  const root = new THREE.Group();
  const width = Math.max(0.3, object.widthCm / 100);
  const depth = Math.max(0.3, object.depthCm / 100);
  const height = Math.max(0.08, object.heightCm / 100);

  if (object.kind === "greenhouse") addGreenhouse(root, width, depth, height, detailed);
  else if (object.kind === "polytunnel") addPolytunnel(root, width, depth, height, detailed);
  else if (object.kind === "shed") addShed(root, width, depth, height, detailed);
  else if (object.kind === "chicken-coop") addChickenCoop(root, width, depth, height, detailed);
  else if (object.kind === "cold-frame") addColdFrame(root, width, depth, height, detailed);
  else if (object.kind === "compost-bin") addCompostBin(root, width, depth, height, detailed);
  else if (object.kind === "water-tank" || object.kind === "rain-barrel") addWaterContainer(root, width, depth, height, detailed, object.kind === "rain-barrel");
  else if (object.kind === "potting-bench") addPottingBench(root, width, depth, height, detailed);
  else if (object.kind === "pergola") addPergola(root, width, depth, height, detailed);
  else if (object.kind === "garden-arch") addGardenArch(root, width, depth, height, detailed, C.timberDark, false);
  else if (object.kind === "beehive") addBeehive(root, width, depth, height, detailed);
  else if (object.kind === "a-frame-trellis") addAFrameTrellis(root, width, depth, height, detailed);
  else if (object.kind === "bird-net-frame") addFramedNet(root, width, depth, height, 0xb8d8c7, 0.16, detailed);
  else if (object.kind === "shade-cloth-frame") addFramedNet(root, width, depth, height, 0x4e6656, 0.43, detailed);
  else if (object.kind === "insect-net-tunnel") addArchTunnel(root, width, depth, height, 0x78958b, detailed, { color: 0xd8eee5, opacity: 0.17 });
  else if (object.kind === "frost-cloth-tunnel") addArchTunnel(root, width, depth, height, 0x879590, detailed, { color: 0xf2f0e8, opacity: 0.31 });
  else if (object.kind === "cloche") addArchTunnel(root, width, depth, height, 0x82938e, detailed, { color: 0xe0eeea, opacity: 0.34 });
  else if (object.kind === "cattle-panel-arch" || object.kind === "bean-arch" || object.kind === "cucumber-arch") {
    addGardenArch(root, width, depth, height, detailed, object.kind === "bean-arch" ? 0x718963 : C.metal, true);
  } else if (object.kind === "hoop-arch" || object.kind === "low-hoop-frame" || object.kind === "row-cover-hoops") {
    addArchTunnel(root, width, depth, height, C.metalLight, detailed);
  }

  inspectAndFinish(group, root, object, detailed);
}
