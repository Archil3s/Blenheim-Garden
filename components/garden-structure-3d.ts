import * as THREE from "three";
import type { PlannerStructure } from "@/lib/garden/planner-plan";
import { structurePreset } from "@/lib/garden/structure-catalog";

const GARDEN_WIDTH_CM = 900;
const GARDEN_HEIGHT_CM = 1080;

const PALETTE = {
  timber: 0xa96d3f,
  timberLight: 0xc98a52,
  timberDark: 0x74472d,
  roof: 0x59645f,
  roofEdge: 0x404945,
  metal: 0x8e9a99,
  metalLight: 0xb8c0c8,
  glass: 0xbfe6dd,
  plastic: 0xe1efea,
  soil: 0x65412d,
  waterTank: 0x78a4ae,
  waterTankDark: 0x537780,
};

function worldX(cm: number) {
  return cm / 100 - GARDEN_WIDTH_CM / 200;
}

function worldZ(cm: number) {
  return cm / 100 - GARDEN_HEIGHT_CM / 200;
}

function standard(color: number, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
}

function glassMaterial(color = PALETTE.glass, opacity = 0.3) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.18,
    metalness: 0,
    transmission: 0,
    thickness: 0.02,
    depthWrite: false,
    flatShading: true,
    side: THREE.DoubleSide,
  });
}

function addBox(
  root: THREE.Group,
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
    new THREE.BoxGeometry(Math.max(0.02, width), Math.max(0.02, height), Math.max(0.02, depth)),
    standard(color, roughness, metalness),
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function addPanel(
  root: THREE.Group,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.02, width), Math.max(0.012, height), Math.max(0.012, depth)),
    material,
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function addPost(root: THREE.Group, x: number, z: number, height: number, color = PALETTE.timberDark, baseY = 0) {
  return addBox(root, 0.075, height, 0.075, color, x, baseY + height / 2, z, 0.9);
}

function addCylinder(
  root: THREE.Group,
  radius: number,
  height: number,
  color: number,
  y = height / 2,
  segments = 16,
  roughness = 0.76,
  metalness = 0,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(0.02, radius), Math.max(0.02, radius), Math.max(0.02, height), segments),
    standard(color, roughness, metalness),
  );
  mesh.position.y = y;
  root.add(mesh);
  return mesh;
}

function addBeamBetween(
  root: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  thickness: number,
  color: number,
  roughness = 0.82,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.02, direction.length());
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, length, thickness),
    standard(color, roughness),
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  root.add(mesh);
  return mesh;
}

function addFramedDoor(
  root: THREE.Group,
  width: number,
  height: number,
  depth: number,
  slabColor: number,
  baseY = 0,
  zOffset = 0,
  detailed = true,
) {
  const z = depth / 2 + 0.027 + zOffset;
  addBox(root, width, height, 0.042, slabColor, 0, baseY + height / 2, z, 0.88);

  const frame = 0.055;
  addBox(root, frame, height + frame, 0.06, PALETTE.timberDark, -width / 2 - frame / 2, baseY + height / 2, z + 0.012, 0.9);
  addBox(root, frame, height + frame, 0.06, PALETTE.timberDark, width / 2 + frame / 2, baseY + height / 2, z + 0.012, 0.9);
  addBox(root, width + frame * 2, frame, 0.06, PALETTE.timberDark, 0, baseY + height + frame / 2, z + 0.012, 0.9);

  if (detailed) {
    const braceA = new THREE.Vector3(-width * 0.38, baseY + height * 0.18, z + 0.038);
    const braceB = new THREE.Vector3(width * 0.38, baseY + height * 0.82, z + 0.038);
    addBeamBetween(root, braceA, braceB, 0.045, PALETTE.timberLight, 0.88);
  }

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), standard(0xc4a15d, 0.32, 0.55));
  handle.position.set(width * 0.32, baseY + height * 0.52, z + 0.055);
  root.add(handle);
}

function addWindowFront(
  root: THREE.Group,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  detailed = true,
) {
  const glass = addPanel(root, width, height, 0.024, glassMaterial(0x9fc5c7, 0.58), x, y, z);
  glass.renderOrder = 3;
  const frame = 0.038;
  addBox(root, width + frame * 2, frame, 0.045, PALETTE.timberDark, x, y - height / 2, z + 0.015, 0.9);
  addBox(root, width + frame * 2, frame, 0.045, PALETTE.timberDark, x, y + height / 2, z + 0.015, 0.9);
  addBox(root, frame, height, 0.045, PALETTE.timberDark, x - width / 2, y, z + 0.015, 0.9);
  addBox(root, frame, height, 0.045, PALETTE.timberDark, x + width / 2, y, z + 0.015, 0.9);
  if (detailed) {
    addBox(root, frame * 0.65, height, 0.05, PALETTE.timberDark, x, y, z + 0.018, 0.9);
    addBox(root, width, frame * 0.65, 0.05, PALETTE.timberDark, x, y, z + 0.018, 0.9);
  }
  addBox(root, width + 0.09, 0.045, 0.09, PALETTE.timberLight, x, y - height / 2 - 0.035, z + 0.035, 0.9);
}

function addWindowSide(
  root: THREE.Group,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  detailed = true,
) {
  const material = glassMaterial(0x9fc5c7, 0.58);
  const pane = new THREE.Mesh(new THREE.BoxGeometry(0.024, height, width), material);
  pane.position.set(x, y, z);
  pane.renderOrder = 3;
  root.add(pane);
  const frame = 0.038;
  addBox(root, 0.045, frame, width + frame * 2, PALETTE.timberDark, x + 0.015, y - height / 2, z, 0.9);
  addBox(root, 0.045, frame, width + frame * 2, PALETTE.timberDark, x + 0.015, y + height / 2, z, 0.9);
  addBox(root, 0.045, height, frame, PALETTE.timberDark, x + 0.015, y, z - width / 2, 0.9);
  addBox(root, 0.045, height, frame, PALETTE.timberDark, x + 0.015, y, z + width / 2, 0.9);
  if (detailed) {
    addBox(root, 0.05, height, frame * 0.65, PALETTE.timberDark, x + 0.018, y, z, 0.9);
    addBox(root, 0.05, frame * 0.65, width, PALETTE.timberDark, x + 0.018, y, z, 0.9);
  }
}

function addVerticalBattens(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean, baseY = 0) {
  const count = detailed ? Math.max(5, Math.min(10, Math.round(width / 0.38))) : Math.max(3, Math.min(6, Math.round(width / 0.6)));
  for (let i = 1; i < count; i += 1) {
    const x = -width / 2 + (width * i) / count;
    addBox(root, 0.025, height * 0.94, 0.026, PALETTE.timberLight, x, baseY + height * 0.5, depth / 2 + 0.016, 0.92);
    addBox(root, 0.025, height * 0.94, 0.026, PALETTE.timberDark, x, baseY + height * 0.5, -depth / 2 - 0.016, 0.92);
  }
  const sideCount = detailed ? Math.max(4, Math.min(8, Math.round(depth / 0.42))) : Math.max(2, Math.min(5, Math.round(depth / 0.65)));
  for (let i = 1; i < sideCount; i += 1) {
    const z = -depth / 2 + (depth * i) / sideCount;
    addBox(root, 0.026, height * 0.94, 0.025, PALETTE.timberLight, width / 2 + 0.016, baseY + height * 0.5, z, 0.92);
    addBox(root, 0.026, height * 0.94, 0.025, PALETTE.timberDark, -width / 2 - 0.016, baseY + height * 0.5, z, 0.92);
  }
}

function addGableEnd(root: THREE.Group, width: number, rise: number, baseY: number, z: number, color: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false });
  geometry.translate(0, 0, -0.0175);
  const mesh = new THREE.Mesh(geometry, standard(color, 0.9));
  mesh.position.set(0, baseY, z);
  root.add(mesh);
  return mesh;
}

function addGableRoof(
  root: THREE.Group,
  width: number,
  depth: number,
  baseY: number,
  rise: number,
  color: number,
  detailed: boolean,
) {
  const overhang = Math.min(0.2, Math.max(0.09, Math.min(width, depth) * 0.07));
  const halfSpan = width / 2 + overhang;
  const roofDepth = depth + overhang * 2;
  const slope = Math.hypot(halfSpan, rise);
  const angle = Math.atan2(rise, halfSpan);

  for (const side of [-1, 1] as const) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(slope, 0.055, roofDepth),
      standard(color, 0.9),
    );
    roof.position.set(side * halfSpan / 2, baseY + rise / 2, 0);
    roof.rotation.z = side === -1 ? angle : -angle;
    root.add(roof);

    if (detailed) {
      const seams = Math.max(3, Math.min(7, Math.round(roofDepth / 0.55)));
      for (let i = 1; i < seams; i += 1) {
        const z = -roofDepth / 2 + (roofDepth * i) / seams;
        const seam = addBox(root, slope * 0.96, 0.018, 0.022, PALETTE.roofEdge, side * halfSpan / 2, baseY + rise / 2 + 0.026, z, 0.78);
        seam.rotation.z = side === -1 ? angle : -angle;
      }
    }
  }

  addBox(root, 0.085, 0.085, roofDepth + 0.02, PALETTE.roofEdge, 0, baseY + rise + 0.025, 0, 0.82);
  for (const x of [-halfSpan, halfSpan]) {
    addBox(root, 0.075, 0.11, roofDepth, PALETTE.roofEdge, x, baseY + 0.02, 0, 0.86);
  }
}

function addGreenhouse(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const wallHeight = height * 0.68;
  const roofRise = Math.max(0.24, height - wallHeight);
  const frameColor = PALETTE.metal;
  const glass = glassMaterial(PALETTE.glass, detailed ? 0.24 : 0.3);
  const bayCount = detailed ? Math.max(4, Math.min(7, Math.round(depth / 0.75))) : 3;

  for (let i = 0; i <= bayCount; i += 1) {
    const z = -depth / 2 + (depth * i) / bayCount;
    addPost(root, -width / 2, z, wallHeight, frameColor);
    addPost(root, width / 2, z, wallHeight, frameColor);
    addBeamBetween(root, new THREE.Vector3(-width / 2, wallHeight, z), new THREE.Vector3(0, height, z), 0.035, frameColor, 0.55);
    addBeamBetween(root, new THREE.Vector3(width / 2, wallHeight, z), new THREE.Vector3(0, height, z), 0.035, frameColor, 0.55);
  }

  addBox(root, 0.045, 0.045, depth, frameColor, -width / 2, wallHeight, 0, 0.58);
  addBox(root, 0.045, 0.045, depth, frameColor, width / 2, wallHeight, 0, 0.58);
  addBox(root, 0.05, 0.05, depth, frameColor, 0, height, 0, 0.55);
  addBox(root, 0.04, 0.04, depth, frameColor, -width / 2, wallHeight * 0.5, 0, 0.58);
  addBox(root, 0.04, 0.04, depth, frameColor, width / 2, wallHeight * 0.5, 0, 0.58);

  const sideA = new THREE.Mesh(new THREE.PlaneGeometry(depth, wallHeight), glass.clone());
  sideA.rotation.y = Math.PI / 2;
  sideA.position.set(-width / 2 - 0.006, wallHeight / 2, 0);
  root.add(sideA);
  const sideB = sideA.clone();
  sideB.material = glass.clone();
  sideB.position.x = width / 2 + 0.006;
  root.add(sideB);

  for (const z of [-depth / 2 - 0.006, depth / 2 + 0.006]) {
    const front = new THREE.Mesh(new THREE.PlaneGeometry(width, wallHeight), glass.clone());
    front.position.set(0, wallHeight / 2, z);
    root.add(front);
  }

  const half = width / 2;
  const slope = Math.hypot(half, roofRise);
  const angle = Math.atan2(roofRise, half);
  for (const side of [-1, 1] as const) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.018, depth), glass.clone());
    roof.position.set(side * half / 2, wallHeight + roofRise / 2, 0);
    roof.rotation.z = side === -1 ? angle : -angle;
    root.add(roof);
  }

  const doorWidth = Math.min(0.86, width * 0.42);
  const doorHeight = Math.min(wallHeight * 0.88, height * 0.7);
  const doorZ = depth / 2 + 0.026;
  addBox(root, 0.045, doorHeight, 0.05, frameColor, -doorWidth / 2, doorHeight / 2, doorZ, 0.58);
  addBox(root, 0.045, doorHeight, 0.05, frameColor, doorWidth / 2, doorHeight / 2, doorZ, 0.58);
  addBox(root, doorWidth + 0.045, 0.045, 0.05, frameColor, 0, doorHeight, doorZ, 0.58);
  const door = addPanel(root, doorWidth * 0.92, doorHeight * 0.96, 0.022, glass.clone(), 0, doorHeight * 0.48, doorZ + 0.005);
  door.renderOrder = 4;

  if (detailed) {
    const ventWidth = Math.min(width * 0.26, 0.65);
    const vent = new THREE.Mesh(new THREE.BoxGeometry(ventWidth, 0.025, Math.min(depth * 0.22, 0.7)), glass.clone());
    vent.position.set(width * 0.16, height * 0.95, -depth * 0.18);
    vent.rotation.z = -angle + 0.18;
    root.add(vent);
  }

  glass.dispose();
}

function addPolytunnel(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const radius = width / 2;
  const archCount = detailed ? Math.max(5, Math.min(9, Math.round(depth / 0.75) + 1)) : 4;
  for (let i = 0; i < archCount; i += 1) {
    const z = -depth / 2 + (depth * i) / Math.max(1, archCount - 1);
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.026, 7, detailed ? 28 : 18, Math.PI),
      standard(PALETTE.metalLight, 0.5, 0.15),
    );
    hoop.rotation.z = Math.PI;
    hoop.scale.y = Math.max(0.48, height / radius);
    hoop.position.z = z;
    root.add(hoop);
  }
  addBox(root, 0.032, 0.032, depth, PALETTE.metalLight, 0, height, 0, 0.5, 0.15);
  addBox(root, 0.03, 0.03, depth, PALETTE.metalLight, -width * 0.43, height * 0.34, 0, 0.5, 0.15);
  addBox(root, 0.03, 0.03, depth, PALETTE.metalLight, width * 0.43, height * 0.34, 0, 0.5, 0.15);

  const cover = new THREE.MeshPhysicalMaterial({
    color: PALETTE.plastic,
    transparent: true,
    opacity: detailed ? 0.24 : 0.3,
    roughness: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.985, radius * 0.985, depth * 0.99, detailed ? 32 : 20, 1, true, 0, Math.PI),
    cover,
  );
  shell.rotation.x = Math.PI / 2;
  shell.position.y = Math.min(height * 0.5, radius * 0.9);
  root.add(shell);

  const doorWidth = Math.min(width * 0.35, 0.9);
  addBox(root, 0.035, height * 0.6, 0.04, PALETTE.metalLight, -doorWidth / 2, height * 0.3, depth / 2 + 0.02, 0.5, 0.15);
  addBox(root, 0.035, height * 0.6, 0.04, PALETTE.metalLight, doorWidth / 2, height * 0.3, depth / 2 + 0.02, 0.5, 0.15);
  addBox(root, doorWidth, 0.035, 0.04, PALETTE.metalLight, 0, height * 0.6, depth / 2 + 0.02, 0.5, 0.15);
}

function addShed(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const bodyHeight = height * 0.74;
  const rise = Math.max(0.28, height - bodyHeight);
  addBox(root, width, bodyHeight, depth, 0x9d7350, 0, bodyHeight / 2, 0, 0.94);
  addVerticalBattens(root, width, depth, bodyHeight, detailed);
  addGableEnd(root, width, rise, bodyHeight, depth / 2 + 0.002, 0x8e6648);
  addGableEnd(root, width, rise, bodyHeight, -depth / 2 - 0.002, 0x79553d);
  addGableRoof(root, width, depth, bodyHeight, rise, PALETTE.roof, detailed);

  addBox(root, width * 0.88, 0.09, 0.11, PALETTE.timberDark, 0, 0.055, -depth * 0.38, 0.92);
  addBox(root, width * 0.88, 0.09, 0.11, PALETTE.timberDark, 0, 0.055, depth * 0.38, 0.92);

  addFramedDoor(root, Math.min(0.84, width * 0.4), bodyHeight * 0.78, depth, 0x76573e, 0, 0, detailed);
  addWindowFront(root, -width * 0.27, bodyHeight * 0.62, depth / 2 + 0.028, Math.min(0.5, width * 0.22), Math.min(0.44, bodyHeight * 0.3), detailed);
  if (detailed) {
    addWindowSide(root, width / 2 + 0.026, bodyHeight * 0.58, -depth * 0.12, Math.min(0.5, depth * 0.28), Math.min(0.42, bodyHeight * 0.28), true);
  }
}

function addChickenCoop(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const legHeight = Math.min(0.38, height * 0.22);
  const bodyHeight = height * 0.52;
  const bodyBase = legHeight;
  const roofRise = Math.max(0.22, height - bodyBase - bodyHeight);

  for (const x of [-width * 0.38, width * 0.38]) {
    for (const z of [-depth * 0.34, depth * 0.34]) addPost(root, x, z, legHeight, PALETTE.timberDark);
  }
  addBox(root, width, bodyHeight, depth, 0xb38c60, 0, bodyBase + bodyHeight / 2, 0, 0.92);
  addVerticalBattens(root, width, depth, bodyHeight, detailed, bodyBase);
  addGableEnd(root, width, roofRise, bodyBase + bodyHeight, depth / 2 + 0.002, 0xa27b55);
  addGableEnd(root, width, roofRise, bodyBase + bodyHeight, -depth / 2 - 0.002, 0x8c6749);
  addGableRoof(root, width, depth, bodyBase + bodyHeight, roofRise, 0x5d5248, detailed);

  const popWidth = Math.min(width * 0.3, 0.48);
  const popHeight = Math.min(bodyHeight * 0.52, 0.52);
  addBox(root, popWidth, popHeight, 0.035, 0x725038, 0, bodyBase + popHeight / 2 + 0.04, depth / 2 + 0.025, 0.9);
  addBox(root, popWidth * 0.92, 0.045, depth * 0.6, 0x8d6948, 0, legHeight * 0.38, depth * 0.62, 0.9);
  const rampRun = Math.min(0.9, depth * 0.65);
  const rampDrop = Math.max(0.08, bodyBase);
  const rampLength = Math.hypot(rampRun, rampDrop);
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(0.42, width * 0.28), 0.045, rampLength),
    standard(0x8f6a49, 0.92),
  );
  ramp.position.set(0, bodyBase / 2 + 0.06, depth / 2 + rampRun / 2);
  ramp.rotation.x = Math.atan2(rampDrop, rampRun);
  root.add(ramp);
  if (detailed) {
    for (let i = -2; i <= 2; i += 1) {
      const cleat = addBox(root, Math.min(0.4, width * 0.26), 0.028, 0.035, 0x6d4b35, 0, 0, 0, 0.94);
      cleat.position.copy(ramp.position);
      cleat.rotation.x = ramp.rotation.x;
      const offset = (i / 5) * rampLength;
      cleat.position.y -= Math.sin(ramp.rotation.x) * offset;
      cleat.position.z += Math.cos(ramp.rotation.x) * offset;
    }
  }

  const nestDepth = Math.min(0.36, depth * 0.24);
  addBox(root, width * 0.48, bodyHeight * 0.36, nestDepth, 0x9d7754, width * 0.26, bodyBase + bodyHeight * 0.42, -depth / 2 - nestDepth / 2, 0.92);
  const nestRoof = addBox(root, width * 0.52, 0.05, nestDepth * 1.18, 0x5f554b, width * 0.26, bodyBase + bodyHeight * 0.62, -depth / 2 - nestDepth / 2, 0.88);
  nestRoof.rotation.x = -0.08;

  if (detailed) {
    addWindowFront(root, -width * 0.28, bodyBase + bodyHeight * 0.63, depth / 2 + 0.027, Math.min(0.34, width * 0.18), Math.min(0.3, bodyHeight * 0.28), true);
  }
}

function addColdFrame(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const baseHeight = Math.min(height * 0.72, 0.34);
  const wall = Math.min(0.08, Math.min(width, depth) * 0.08);
  addBox(root, width, baseHeight, wall, PALETTE.timber, 0, baseHeight / 2, -depth / 2 + wall / 2, 0.92);
  addBox(root, width, baseHeight * 0.82, wall, PALETTE.timberDark, 0, baseHeight * 0.41, depth / 2 - wall / 2, 0.92);
  addBox(root, wall, baseHeight, depth, PALETTE.timber, -width / 2 + wall / 2, baseHeight / 2, 0, 0.92);
  addBox(root, wall, baseHeight, depth, PALETTE.timberDark, width / 2 - wall / 2, baseHeight / 2, 0, 0.92);
  addBox(root, width - wall * 2, 0.035, depth - wall * 2, PALETTE.soil, 0, 0.05, 0, 1);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(width * 0.97, 0.035, depth * 0.97), glassMaterial(0xcce1db, 0.48));
  lid.position.set(0, baseHeight + 0.035, 0);
  lid.rotation.x = -0.08;
  root.add(lid);
  addBox(root, width * 0.98, 0.045, 0.045, PALETTE.timberDark, 0, baseHeight + 0.055, -depth / 2, 0.9);
  addBox(root, width * 0.98, 0.045, 0.045, PALETTE.timberDark, 0, baseHeight + 0.055, depth / 2, 0.9);
  if (detailed) addBox(root, 0.045, 0.045, depth * 0.95, PALETTE.timberDark, 0, baseHeight + 0.07, 0, 0.9);
}

function addCompostBin(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) addPost(root, x, z, height, PALETTE.timberDark);
  const slats = detailed ? 7 : 5;
  const slatH = height / (slats * 1.45);
  for (let i = 0; i < slats; i += 1) {
    const y = slatH * 0.7 + (height - slatH) * i / Math.max(1, slats - 1);
    addBox(root, width, slatH, 0.045, i % 2 ? PALETTE.timber : PALETTE.timberLight, 0, y, -depth / 2, 0.94);
    addBox(root, 0.045, slatH, depth, i % 2 ? PALETTE.timberDark : PALETTE.timber, -width / 2, y, 0, 0.94);
    addBox(root, 0.045, slatH, depth, i % 2 ? PALETTE.timber : PALETTE.timberLight, width / 2, y, 0, 0.94);
    if (i < slats - 1) addBox(root, width * 0.92, slatH, 0.045, PALETTE.timber, 0, y, depth / 2, 0.94);
  }
  addBox(root, width * 0.9, 0.05, depth * 0.86, 0x3d3024, 0, height * 0.16, 0, 1);
}

function addWaterContainer(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean, barrel: boolean) {
  const radius = Math.min(width, depth) / 2;
  const bodyColor = barrel ? 0x657f87 : PALETTE.waterTank;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.96, radius, height, detailed ? 28 : 16),
    standard(bodyColor, 0.58),
  );
  body.position.y = height / 2;
  root.add(body);

  const ribCount = detailed ? (barrel ? 5 : 7) : 3;
  for (let i = 1; i <= ribCount; i += 1) {
    const y = (height * i) / (ribCount + 1);
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.97, barrel ? 0.018 : 0.012, 6, detailed ? 28 : 16),
      standard(PALETTE.waterTankDark, 0.45, 0.15),
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    root.add(band);
  }

  addCylinder(root, radius * 0.88, 0.045, PALETTE.waterTankDark, height + 0.022, detailed ? 24 : 14, 0.55, 0.1);
  const tapStem = addCylinder(root, 0.026, 0.16, 0xb48e4f, height * 0.2, 10, 0.35, 0.55);
  tapStem.rotation.x = Math.PI / 2;
  tapStem.position.set(0, height * 0.2, depth / 2 + 0.08);
  const tapHandle = addBox(root, 0.1, 0.025, 0.025, 0xb48e4f, 0, height * 0.25, depth / 2 + 0.12, 0.35, 0.55);
  tapHandle.rotation.z = 0.1;

  if (!barrel && detailed) {
    const inlet = addCylinder(root, 0.07, 0.12, 0x535f62, height * 0.91, 12, 0.5, 0.15);
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-radius * 0.72, height * 0.91, 0);
  }
}

function addPottingBench(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const topY = Math.min(height * 0.74, 0.92);
  addBox(root, width, 0.09, depth, PALETTE.timber, 0, topY, 0, 0.88);
  for (const x of [-width * 0.42, width * 0.42]) for (const z of [-depth * 0.36, depth * 0.36]) addPost(root, x, z, topY, PALETTE.timberDark);
  addBox(root, width * 0.88, 0.065, depth * 0.72, PALETTE.timberLight, 0, topY * 0.44, 0, 0.92);
  addBox(root, width * 0.92, height - topY, 0.055, PALETTE.timberDark, 0, topY + (height - topY) / 2, -depth / 2 + 0.03, 0.92);
  addBox(root, width * 0.96, 0.08, depth * 0.32, PALETTE.timberLight, 0, height - 0.05, -depth * 0.28, 0.9);
  if (detailed) {
    for (const x of [-width * 0.28, 0, width * 0.28]) addBox(root, 0.018, Math.max(0.12, height - topY - 0.12), 0.025, 0x8c7657, x, topY + (height - topY) * 0.52, -depth / 2 - 0.004, 0.9);
    const tray = addBox(root, width * 0.34, 0.045, depth * 0.42, 0x626c66, width * 0.22, topY + 0.065, 0, 0.7);
    tray.position.y = topY + 0.065;
  }
}

function addPergola(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) addPost(root, x, z, height, PALETTE.timberDark);
  addBox(root, width + 0.16, 0.11, 0.1, PALETTE.timber, 0, height, -depth / 2, 0.88);
  addBox(root, width + 0.16, 0.11, 0.1, PALETTE.timber, 0, height, depth / 2, 0.88);
  const rafters = detailed ? 9 : 5;
  for (let i = 0; i < rafters; i += 1) {
    const x = -width / 2 + (width * i) / Math.max(1, rafters - 1);
    addBox(root, 0.065, 0.075, depth + 0.24, PALETTE.timberLight, x, height + 0.09, 0, 0.88);
  }
  if (detailed) {
    for (const x of [-width / 2, width / 2]) {
      addBeamBetween(root, new THREE.Vector3(x, height * 0.76, -depth / 2), new THREE.Vector3(x, height, -depth * 0.28), 0.05, PALETTE.timberLight, 0.9);
      addBeamBetween(root, new THREE.Vector3(x, height * 0.76, depth / 2), new THREE.Vector3(x, height, depth * 0.28), 0.05, PALETTE.timberLight, 0.9);
    }
  }
}

function addGardenArch(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean, color = PALETTE.metal) {
  const legHeight = height * 0.72;
  for (const z of [-depth / 2, depth / 2]) {
    addPost(root, -width / 2, z, legHeight, color);
    addPost(root, width / 2, z, legHeight, color);
    const top = new THREE.Mesh(new THREE.TorusGeometry(width / 2, 0.032, 7, detailed ? 24 : 14, Math.PI), standard(color, 0.55, 0.12));
    top.rotation.z = Math.PI;
    top.scale.y = Math.max(0.55, (height - legHeight) / (width / 2));
    top.position.set(0, legHeight, z);
    root.add(top);
  }
  const rungCount = detailed ? 5 : 3;
  for (let i = 0; i < rungCount; i += 1) {
    const x = -width / 2 + (width * i) / Math.max(1, rungCount - 1);
    addBox(root, 0.024, 0.024, depth, color, x, legHeight, 0, 0.55, 0.12);
  }
  if (detailed) {
    for (const side of [-1, 1]) for (const z of [-depth / 2, depth / 2]) {
      for (const y of [height * 0.22, height * 0.44, height * 0.64]) addBox(root, width * 0.18, 0.018, 0.018, color, side * width * 0.41, y, z, 0.55, 0.12);
    }
  }
}

function addBeehive(root: THREE.Group, width: number, depth: number, height: number, detailed: boolean) {
  const standH = Math.min(0.16, height * 0.15);
  addBox(root, width * 0.9, 0.06, depth * 0.92, PALETTE.timberDark, 0, standH, 0, 0.92);
  for (const x of [-width * 0.33, width * 0.33]) addPost(root, x, 0, standH, PALETTE.timberDark);
  const layers = detailed ? 4 : 3;
  const boxH = (height - standH - 0.1) / layers;
  for (let i = 0; i < layers; i += 1) {
    const y = standH + boxH * (i + 0.5);
    addBox(root, width * (1 - i * 0.02), boxH * 0.92, depth, i % 2 ? 0xd5b454 : 0xe1c66b, 0, y, 0, 0.82);
    addBox(root, width * 0.18, 0.035, 0.055, 0x8f7443, 0, y, depth / 2 + 0.035, 0.85);
  }
  addBox(root, width * 1.12, 0.07, depth * 1.12, 0x6b665c, 0, height - 0.02, 0, 0.9);
  addBox(root, width * 0.78, 0.035, depth * 0.34, 0xc4a15c, 0, standH + 0.025, depth / 2 + depth * 0.16, 0.86);
}

function addArchTunnel(
  root: THREE.Group,
  width: number,
  depth: number,
  height: number,
  color: number,
  detailed: boolean,
  cover?: { color: number; opacity: number },
) {
  const radius = Math.max(0.12, width / 2);
  const arches = detailed ? 7 : 4;
  for (let i = 0; i < arches; i += 1) {
    const z = -depth / 2 + (depth * i) / Math.max(1, arches - 1);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 6, detailed ? 24 : 14, Math.PI), standard(color, 0.56, 0.1));
    arch.rotation.z = Math.PI;
    arch.scale.y = Math.max(0.35, height / radius);
    arch.position.z = z;
    root.add(arch);
  }
  addBox(root, 0.035, 0.035, depth, color, -width / 2, 0.035, 0, 0.6, 0.1);
  addBox(root, 0.035, 0.035, depth, color, width / 2, 0.035, 0, 0.6, 0.1);
  addBox(root, 0.035, 0.035, depth, color, 0, height, 0, 0.6, 0.1);

  if (cover) {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.985, radius * 0.985, depth * 0.99, detailed ? 28 : 16, 1, true, 0, Math.PI),
      new THREE.MeshPhysicalMaterial({
        color: cover.color,
        transparent: true,
        opacity: cover.opacity,
        roughness: 0.5,
        metalness: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    shell.rotation.x = Math.PI / 2;
    shell.scale.y = Math.max(0.35, height / radius);
    shell.position.y = Math.min(height * 0.46, radius * 0.8);
    root.add(shell);
  }
}

function addFramedCover(root: THREE.Group, width: number, depth: number, height: number, coverColor: number, opacity: number, detailed: boolean) {
  const frameColor = PALETTE.metal;
  for (const x of [-width / 2, width / 2]) for (const z of [-depth / 2, depth / 2]) addPost(root, x, z, height, frameColor);
  addBox(root, width, 0.04, 0.04, frameColor, 0, height, -depth / 2, 0.62, 0.1);
  addBox(root, width, 0.04, 0.04, frameColor, 0, height, depth / 2, 0.62, 0.1);
  addBox(root, 0.04, 0.04, depth, frameColor, -width / 2, height, 0, 0.62, 0.1);
  addBox(root, 0.04, 0.04, depth, frameColor, width / 2, height, 0, 0.62, 0.1);

  const cover = new THREE.MeshPhysicalMaterial({
    color: coverColor,
    transparent: true,
    opacity,
    roughness: detailed ? 0.58 : 0.7,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), cover.clone());
  top.rotation.x = -Math.PI / 2;
  top.position.y = height + 0.015;
  root.add(top);
  for (const z of [-depth / 2, depth / 2]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cover.clone());
    side.position.set(0, height / 2, z);
    root.add(side);
  }
  for (const x of [-width / 2, width / 2]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), cover.clone());
    side.rotation.y = Math.PI / 2;
    side.position.set(x, height / 2, 0);
    root.add(side);
  }
  cover.dispose();

  if (detailed) {
    addBox(root, 0.025, height, depth, frameColor, -width / 2, height / 2, 0, 0.6, 0.1);
    addBox(root, 0.025, height, depth, frameColor, width / 2, height / 2, 0, 0.6, 0.1);
  }
}

function addRaisedBed(root: THREE.Group, width: number, depth: number, height: number, wallColor: number, soilColor = PALETTE.soil) {
  const wall = Math.max(0.055, Math.min(0.11, Math.min(width, depth) * 0.09));
  addBox(root, width, height, wall, wallColor, 0, height / 2, -depth / 2 + wall / 2, 0.9);
  addBox(root, width, height, wall, wallColor, 0, height / 2, depth / 2 - wall / 2, 0.9);
  addBox(root, wall, height, depth - wall * 2, wallColor, -width / 2 + wall / 2, height / 2, 0, 0.9);
  addBox(root, wall, height, depth - wall * 2, wallColor, width / 2 - wall / 2, height / 2, 0, 0.9);
  addBox(root, Math.max(0.05, width - wall * 2), 0.05, Math.max(0.05, depth - wall * 2), soilColor, 0, height * 0.78, 0, 1);
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

  if (object.kind === "greenhouse") {
    addGreenhouse(root, width, depth, height, detailed);
  } else if (object.kind === "polytunnel") {
    addPolytunnel(root, width, depth, height, detailed);
  } else if (object.kind === "shed") {
    addShed(root, width, depth, height, detailed);
  } else if (object.kind === "chicken-coop") {
    addChickenCoop(root, width, depth, height, detailed);
  } else if (object.kind === "cold-frame") {
    addColdFrame(root, width, depth, height, detailed);
  } else if (object.kind === "compost-bin") {
    addCompostBin(root, width, depth, height, detailed);
  } else if (object.kind === "water-tank" || object.kind === "rain-barrel") {
    addWaterContainer(root, width, depth, height, detailed, object.kind === "rain-barrel");
  } else if (object.kind === "potting-bench") {
    addPottingBench(root, width, depth, height, detailed);
  } else if (object.kind === "pergola") {
    addPergola(root, width, depth, height, detailed);
  } else if (object.kind === "garden-arch") {
    addGardenArch(root, width, depth, height, detailed);
  } else if (object.kind === "beehive") {
    addBeehive(root, width, depth, height, detailed);
  } else if (
    object.kind === "cattle-panel-arch" || object.kind === "bean-arch" || object.kind === "cucumber-arch" ||
    object.kind === "hoop-arch" || object.kind === "low-hoop-frame" || object.kind === "row-cover-hoops"
  ) {
    const frameColor = object.kind === "cattle-panel-arch" ? 0x697b77 : object.kind === "bean-arch" ? 0x718a65 : 0x778984;
    addArchTunnel(root, width, depth, height, frameColor, detailed);
    if (detailed && (object.kind === "cattle-panel-arch" || object.kind === "bean-arch" || object.kind === "cucumber-arch")) {
      const gridRows = 5;
      for (let i = 1; i < gridRows; i += 1) {
        const y = (height * i) / gridRows;
        addBox(root, width * 0.9, 0.016, 0.016, 0x7d8d87, 0, y, -depth / 2 + 0.025, 0.52, 0.08);
        addBox(root, width * 0.9, 0.016, 0.016, 0x7d8d87, 0, y, depth / 2 - 0.025, 0.52, 0.08);
      }
    }
  } else if (object.kind === "a-frame-trellis") {
    const diagonal = Math.hypot(width / 2, height);
    for (const zz of [-depth / 2, depth / 2]) for (const side of [-1, 1]) {
      const beam = addBox(root, 0.07, diagonal, 0.07, PALETTE.timber, side * width / 4, height / 2, zz, 0.84);
      beam.rotation.z = side * Math.atan2(width / 2, height);
    }
    addBox(root, 0.08, 0.08, depth + 0.08, PALETTE.timberDark, 0, height, 0, 0.86);
    const rows = detailed ? [0.22, 0.38, 0.54, 0.7, 0.84] : [0.32, 0.58, 0.8];
    for (const ratio of rows) {
      const y = height * ratio;
      const span = Math.max(0.08, width * (1 - ratio));
      addBox(root, span, 0.024, 0.024, PALETTE.metal, 0, y, -depth / 2, 0.52, 0.08);
      addBox(root, span, 0.024, 0.024, PALETTE.metal, 0, y, depth / 2, 0.52, 0.08);
    }
  } else if (object.kind === "insect-net-tunnel") {
    addArchTunnel(root, width, depth, height, 0x78958b, detailed, { color: 0xd6ebe4, opacity: 0.17 });
  } else if (object.kind === "frost-cloth-tunnel") {
    addArchTunnel(root, width, depth, height, 0x889792, detailed, { color: 0xf1f1e9, opacity: 0.3 });
  } else if (object.kind === "cloche") {
    addArchTunnel(root, width, depth, height, 0x7f928c, detailed, { color: 0xddebe7, opacity: 0.34 });
  } else if (object.kind === "bird-net-frame") {
    addFramedCover(root, width, depth, height, 0xb6d2c2, 0.16, detailed);
  } else if (object.kind === "shade-cloth-frame") {
    addFramedCover(root, width, depth, height, 0x55705e, 0.42, detailed);
  } else if (object.kind === "pot") {
    const radius = Math.min(width, depth) / 2;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, height, detailed ? 20 : 12), standard(0x9d624b, 0.9));
    pot.position.y = height / 2;
    root.add(pot);
    addCylinder(root, radius * 0.72, 0.025, PALETTE.soil, height + 0.012, detailed ? 20 : 12, 1);
    addCylinder(root, radius * 0.98, 0.035, 0xb37759, height * 0.86, detailed ? 20 : 12, 0.9);
  } else if (object.kind === "grow-bag") {
    const radius = Math.min(width, depth) / 2;
    const bag = addCylinder(root, radius, height, 0x535e59, height / 2, detailed ? 16 : 10, 0.96);
    bag.scale.x = 0.94;
    addCylinder(root, radius * 0.84, 0.025, PALETTE.soil, height + 0.012, detailed ? 16 : 10, 1);
  } else if (object.kind === "half-barrel") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x89643e, height / 2, detailed ? 22 : 14, 0.9);
    addCylinder(root, radius * 0.84, 0.03, PALETTE.soil, height + 0.016, detailed ? 22 : 14, 1);
    for (const y of [height * 0.3, height * 0.7]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.98, 0.014, 5, detailed ? 22 : 14), standard(0x5f5a51, 0.5, 0.2));
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      root.add(band);
    }
  } else if (object.kind === "planter-box" || object.kind === "trough-planter") {
    addRaisedBed(root, width, depth, height, object.kind === "trough-planter" ? 0x8c7356 : 0xa6815d);
  } else if (object.kind === "wicking-bed") {
    addRaisedBed(root, width, depth, height, 0x73878e);
    addBox(root, width * 0.94, height * 0.18, depth * 0.9, 0x8ca8b2, 0, height * 0.12, 0, 0.62);
    const pipe = addCylinder(root, 0.025, height * 0.82, 0x5f747b, height * 0.55, 10, 0.55, 0.12);
    pipe.position.x = width * 0.38;
    pipe.position.z = depth * 0.32;
  } else if (object.kind === "seed-tray") {
    addBox(root, width, Math.max(0.04, height), depth, 0x59665f, 0, Math.max(0.04, height) / 2, 0, 0.78);
    if (detailed) {
      const cols = 5;
      const rows = 3;
      for (let col = 0; col < cols; col += 1) for (let row = 0; row < rows; row += 1) {
        const cell = addCylinder(root, Math.min(width / cols, depth / rows) * 0.22, 0.018, PALETTE.soil, Math.max(0.04, height) + 0.012, 8, 1);
        cell.position.x = -width * 0.4 + (width * 0.8 * col) / (cols - 1);
        cell.position.z = -depth * 0.34 + (depth * 0.68 * row) / (rows - 1);
      }
    }
  } else if (object.kind === "raised-bed-timber" || object.kind === "raised-bed-square") {
    addRaisedBed(root, width, depth, height, PALETTE.timber);
  } else if (object.kind === "raised-bed-corrugated") {
    addRaisedBed(root, width, depth, height, 0x8d9a9d);
    const corrugations = detailed ? 9 : 5;
    for (let i = 1; i < corrugations; i += 1) {
      const xx = -width / 2 + (width * i) / corrugations;
      addBox(root, 0.015, height * 0.9, 0.02, 0xb5bfc1, xx, height / 2, depth / 2 + 0.008, 0.55, 0.1);
      addBox(root, 0.015, height * 0.9, 0.02, 0xb5bfc1, xx, height / 2, -depth / 2 - 0.008, 0.55, 0.1);
    }
  } else if (object.kind === "raised-bed-round") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x8f9c9d, height / 2, detailed ? 24 : 16, 0.68, 0.06);
    addCylinder(root, radius * 0.82, 0.035, PALETTE.soil, height + 0.018, detailed ? 24 : 16, 1);
  } else if (object.kind === "keyhole-bed") {
    const radius = Math.min(width, depth) / 2;
    addCylinder(root, radius, height, 0x9b7c59, height / 2, detailed ? 26 : 16, 0.9);
    addCylinder(root, radius * 0.78, 0.035, PALETTE.soil, height + 0.018, detailed ? 26 : 16, 1);
    addCylinder(root, radius * 0.18, height * 0.72, 0x78664e, height * 0.36, detailed ? 16 : 10, 0.9);
    addBox(root, radius * 0.42, height * 1.02, radius * 0.9, 0x6f604a, 0, height * 0.5, radius * 0.68, 0.9);
  }

  root.position.set(x, 0.02, z);
  root.rotation.y = -THREE.MathUtils.degToRad(object.rotationDeg || 0);
  shadows(root, detailed);
  setInspectable(root, object);
  group.add(root);
}
