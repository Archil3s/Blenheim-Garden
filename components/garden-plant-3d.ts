import * as THREE from "three";

type PlantKind =
  | "tomato"
  | "strawberry"
  | "blueberry"
  | "raspberry"
  | "pumpkin"
  | "zucchini"
  | "cucumber"
  | "melon"
  | "lettuce"
  | "spinach"
  | "chard"
  | "broccoli"
  | "cauliflower"
  | "cabbage"
  | "kale"
  | "bush-bean"
  | "climbing-bean"
  | "pea"
  | "broad-bean"
  | "carrot"
  | "beet"
  | "radish"
  | "onion"
  | "garlic"
  | "leek"
  | "corn"
  | "pepper"
  | "basil"
  | "rosemary"
  | "parsley"
  | "dill"
  | "leafy";

const C = {
  stem: 0x4d713d,
  stemDark: 0x3e5f35,
  leaf: 0x3f7e43,
  leafLight: 0x67a756,
  leafDark: 0x2e6639,
  leafBlue: 0x4f7659,
  leafSilver: 0x6f8a69,
  tomato: 0xcf4639,
  tomatoYellow: 0xe1b83e,
  tomatoOrange: 0xe9852f,
  tomatoPurple: 0x6d3b52,
  strawberry: 0xd84046,
  blueberry: 0x4e609c,
  raspberry: 0xc93d60,
  pumpkin: 0xdc7d27,
  cucumber: 0x477a3d,
  courgette: 0x507944,
  melon: 0xb8a85d,
  broccoli: 0x3d7040,
  cauliflower: 0xddd6b4,
  pepperRed: 0xcb4638,
  pepperYellow: 0xe6bc3f,
  pepperOrange: 0xea7d2c,
  bean: 0x4f843e,
  pea: 0x70a14d,
  carrot: 0xdd7628,
  beet: 0x8d2f4f,
  radish: 0xd84c62,
  onion: 0xd9c89a,
  garlic: 0xe4dcc1,
  corn: 0xe2bd45,
  flowerYellow: 0xf0c84a,
  flowerWhite: 0xf1ead8,
  flowerPurple: 0x8d6db1,
};

function material(color: number, roughness = 0.82, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshStandardMaterial({ color, roughness, side });
}

function seeded(seed: number) {
  let value = (Math.floor(seed * 9973) ^ 0x6d2b79f5) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function meshShadow(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}

function sphere(
  root: THREE.Object3D,
  color: number,
  radius: number,
  x: number,
  y: number,
  z: number,
  scale: [number, number, number] = [1, 1, 1],
  detail = 8,
) {
  const mesh = meshShadow(new THREE.Mesh(new THREE.SphereGeometry(radius, detail, Math.max(5, detail - 2)), material(color, 0.76)));
  mesh.position.set(x, y, z);
  mesh.scale.set(...scale);
  root.add(mesh);
  return mesh;
}

function branch(
  root: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  color = C.stem,
  segments = 7,
) {
  const direction = to.clone().sub(from);
  const length = direction.length();
  if (length < 0.001) return null;
  const mesh = meshShadow(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.76, radius, length, segments), material(color, 0.92)));
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  root.add(mesh);
  return mesh;
}

function leafGeometry(length: number, width: number, lobes = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const samples = 7;
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples;
    const taper = Math.sin(Math.PI * t);
    const lobe = lobes > 0 ? 0.78 + 0.22 * Math.sin(t * Math.PI * lobes * 2) : 1;
    shape.lineTo(width * 0.5 * taper * lobe, length * t);
  }
  shape.lineTo(0, length);
  for (let index = samples; index >= 1; index -= 1) {
    const t = index / samples;
    const taper = Math.sin(Math.PI * t);
    const lobe = lobes > 0 ? 0.78 + 0.22 * Math.sin(t * Math.PI * lobes * 2) : 1;
    shape.lineTo(-width * 0.5 * taper * lobe, length * t);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 2);
}

function leaf(
  root: THREE.Object3D,
  length: number,
  width: number,
  color: number,
  x: number,
  y: number,
  z: number,
  yaw = 0,
  pitch = Math.PI * 0.38,
  roll = 0,
  lobes = 0,
) {
  const mesh = meshShadow(new THREE.Mesh(leafGeometry(length, width, lobes), material(color, 0.88, THREE.DoubleSide)));
  mesh.position.set(x, y, z);
  mesh.rotation.order = "YXZ";
  mesh.rotation.set(pitch, yaw, roll);
  root.add(mesh);
  return mesh;
}

function strapLeaf(
  root: THREE.Object3D,
  length: number,
  width: number,
  color: number,
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  bend = 0,
) {
  const geometry = new THREE.PlaneGeometry(width, length, 1, 3);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const localY = positions.getY(index) / length + 0.5;
    positions.setZ(index, Math.sin(localY * Math.PI) * bend);
  }
  geometry.computeVertexNormals();
  const mesh = meshShadow(new THREE.Mesh(geometry, material(color, 0.9, THREE.DoubleSide)));
  mesh.position.set(x, y + length * 0.5, z);
  mesh.rotation.order = "YXZ";
  mesh.rotation.set(pitch, yaw, 0);
  root.add(mesh);
  return mesh;
}

function flower(root: THREE.Object3D, x: number, y: number, z: number, color = C.flowerYellow, size = 0.026) {
  sphere(root, color, size, x, y, z, [1.25, 0.5, 1.25], 7);
  sphere(root, 0xb37e27, size * 0.36, x, y + size * 0.22, z, [1, 0.5, 1], 6);
}

function tomatoColor(name: string) {
  if (/purple|black|indigo/.test(name)) return C.tomatoPurple;
  if (/yellow|gold/.test(name)) return C.tomatoYellow;
  if (/orange/.test(name)) return C.tomatoOrange;
  return C.tomato;
}

function pepperColor(name: string) {
  if (/yellow|gold/.test(name)) return C.pepperYellow;
  if (/orange/.test(name)) return C.pepperOrange;
  return C.pepperRed;
}

function compoundLeaf(root: THREE.Object3D, origin: THREE.Vector3, yaw: number, scale: number, color = C.leaf) {
  const direction = new THREE.Vector3(Math.cos(yaw) * 0.22 * scale, 0.045 * scale, Math.sin(yaw) * 0.22 * scale);
  const tip = origin.clone().add(direction);
  branch(root, origin, tip, 0.007 * scale, C.stemDark, 5);
  for (let index = 0; index < 3; index += 1) {
    const t = 0.35 + index * 0.25;
    const p = origin.clone().lerp(tip, t);
    leaf(root, 0.11 * scale, 0.055 * scale, index % 2 ? C.leafLight : color, p.x, p.y, p.z, yaw + Math.PI * 0.5, Math.PI * 0.46, 0, 1);
    leaf(root, 0.105 * scale, 0.052 * scale, color, p.x, p.y, p.z, yaw - Math.PI * 0.5, Math.PI * 0.46, 0, 1);
  }
  leaf(root, 0.12 * scale, 0.058 * scale, C.leafLight, tip.x, tip.y, tip.z, yaw, Math.PI * 0.46, 0, 1);
}

function createTomato(root: THREE.Group, name: string, mobile: boolean, rand: () => number) {
  const height = 0.82 + rand() * 0.28;
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.015, height, -0.012), 0.024, C.stemDark, 8);
  const levels = mobile ? 3 : 5;
  for (let index = 0; index < levels; index += 1) {
    const y = 0.22 + index * (height * 0.13);
    const yaw = index * 2.37 + rand() * 0.4;
    compoundLeaf(root, new THREE.Vector3(0, y, 0), yaw, 0.82 + rand() * 0.2, index % 2 ? C.leaf : C.leafDark);
    compoundLeaf(root, new THREE.Vector3(0, y + 0.035, 0), yaw + Math.PI, 0.72 + rand() * 0.18, C.leafLight);
  }
  const fruitColor = tomatoColor(name);
  const cherry = /cherry|grape/.test(name);
  const roma = /roma|plum|paste/.test(name);
  const clusters = mobile ? 1 : 2;
  for (let c = 0; c < clusters; c += 1) {
    const y = 0.34 + c * 0.26 + rand() * 0.04;
    const yaw = 0.8 + c * 2.1;
    const clusterBase = new THREE.Vector3(0, y, 0);
    const clusterTip = new THREE.Vector3(Math.cos(yaw) * 0.14, y - 0.04, Math.sin(yaw) * 0.14);
    branch(root, clusterBase, clusterTip, 0.005, C.stem, 5);
    const count = cherry ? (mobile ? 4 : 7) : mobile ? 2 : 4;
    for (let index = 0; index < count; index += 1) {
      const a = yaw + (index - (count - 1) / 2) * 0.32;
      const r = cherry ? 0.028 : 0.047;
      sphere(root, fruitColor, r, clusterTip.x + Math.cos(a) * 0.055, y - 0.05 - index * 0.012, clusterTip.z + Math.sin(a) * 0.055, roma ? [0.82, 1.28, 0.82] : [1, 1, 1], 9);
    }
  }
  if (!mobile) {
    flower(root, 0.07, height * 0.77, 0.04, C.flowerYellow, 0.022);
    flower(root, -0.06, height * 0.82, -0.03, C.flowerYellow, 0.02);
  }
}

function createStrawberry(root: THREE.Group, mobile: boolean, rand: () => number) {
  const crowns = mobile ? 2 : 3;
  for (let crown = 0; crown < crowns; crown += 1) {
    const cx = (crown - 1) * 0.055;
    const cz = (rand() - 0.5) * 0.05;
    for (let index = 0; index < 3; index += 1) {
      const yaw = index * (Math.PI * 2 / 3) + crown * 0.7;
      const stemTop = new THREE.Vector3(cx + Math.cos(yaw) * 0.07, 0.12 + rand() * 0.025, cz + Math.sin(yaw) * 0.07);
      branch(root, new THREE.Vector3(cx, 0.02, cz), stemTop, 0.006, C.stem, 5);
      for (let leaflet = -1; leaflet <= 1; leaflet += 1) {
        leaf(root, 0.095, 0.07, leaflet === 0 ? C.leafLight : C.leaf, stemTop.x, stemTop.y, stemTop.z, yaw + leaflet * 0.55, Math.PI * 0.46, 0, 2);
      }
    }
  }
  const berryCount = mobile ? 2 : 4;
  for (let index = 0; index < berryCount; index += 1) {
    const yaw = index * 1.77 + 0.4;
    const x = Math.cos(yaw) * (0.08 + rand() * 0.05);
    const z = Math.sin(yaw) * (0.08 + rand() * 0.05);
    branch(root, new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(x, 0.055, z), 0.004, C.stem, 5);
    sphere(root, C.strawberry, 0.032 + rand() * 0.007, x, 0.045, z, [0.9, 1.25, 0.9], 8);
  }
  if (!mobile) flower(root, -0.04, 0.1, 0.08, C.flowerWhite, 0.022);
}

function createBerryShrub(root: THREE.Group, kind: "blueberry" | "raspberry", mobile: boolean, rand: () => number) {
  const isRaspberry = kind === "raspberry";
  const caneCount = mobile ? 3 : isRaspberry ? 5 : 6;
  const height = isRaspberry ? 0.72 : 0.52;
  for (let cane = 0; cane < caneCount; cane += 1) {
    const yaw = (cane / caneCount) * Math.PI * 2 + rand() * 0.3;
    const base = new THREE.Vector3((rand() - 0.5) * 0.08, 0, (rand() - 0.5) * 0.08);
    const tip = new THREE.Vector3(Math.cos(yaw) * (0.08 + rand() * 0.08), height * (0.78 + rand() * 0.25), Math.sin(yaw) * (0.08 + rand() * 0.08));
    branch(root, base, tip, isRaspberry ? 0.011 : 0.009, isRaspberry ? 0x6e6548 : 0x5d6844, 6);
    const leafCount = mobile ? 2 : 4;
    for (let index = 0; index < leafCount; index += 1) {
      const t = 0.28 + index * 0.17;
      const p = base.clone().lerp(tip, t);
      const leafYaw = yaw + (index % 2 ? 1.1 : -1.1);
      leaf(root, isRaspberry ? 0.095 : 0.075, isRaspberry ? 0.052 : 0.038, index % 2 ? C.leafLight : C.leafBlue, p.x, p.y, p.z, leafYaw, Math.PI * 0.45, 0, isRaspberry ? 2 : 0);
    }
    if (cane % 2 === 0) {
      const berryColor = isRaspberry ? C.raspberry : C.blueberry;
      const cluster = tip.clone().multiplyScalar(0.94);
      for (let berry = 0; berry < (mobile ? 3 : 5); berry += 1) {
        const a = berry * 2.1;
        sphere(root, berryColor, isRaspberry ? 0.024 : 0.018, cluster.x + Math.cos(a) * 0.025, cluster.y - berry * 0.012, cluster.z + Math.sin(a) * 0.025, [1, isRaspberry ? 1.12 : 1, 1], 7);
      }
    }
  }
}

function createCucurbit(root: THREE.Group, kind: "pumpkin" | "zucchini" | "cucumber" | "melon", mobile: boolean, rand: () => number) {
  const vineLength = kind === "cucumber" ? 0.55 : kind === "pumpkin" ? 0.5 : 0.36;
  const segments = mobile ? 3 : 5;
  let previous = new THREE.Vector3(0, 0.035, 0);
  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments;
    const next = new THREE.Vector3(vineLength * t, 0.04 + Math.sin(t * Math.PI) * 0.015, Math.sin(t * 4.7) * 0.08);
    branch(root, previous, next, 0.009, C.stem, 6);
    const yaw = index * 2.2;
    const lobes = kind === "cucumber" ? 2 : 4;
    leaf(root, kind === "pumpkin" ? 0.25 : 0.19, kind === "pumpkin" ? 0.21 : 0.16, index % 2 ? C.leafDark : C.leaf, next.x, next.y, next.z, yaw, Math.PI * 0.49, 0, lobes);
    previous = next;
  }
  if (kind === "pumpkin") {
    sphere(root, C.pumpkin, 0.115, 0.18, 0.085, -0.05, [1.25, 0.76, 1.16], 10);
  } else if (kind === "zucchini") {
    sphere(root, C.courgette, 0.07, 0.17, 0.095, -0.035, [0.72, 0.72, 2.2], 9).rotation.y = Math.PI * 0.28;
  } else if (kind === "cucumber") {
    sphere(root, C.cucumber, 0.052, 0.29, 0.1, 0.045, [0.75, 0.75, 2.25], 9).rotation.y = Math.PI * 0.2;
  } else {
    sphere(root, C.melon, 0.1, 0.2, 0.08, -0.04, [1.12, 0.9, 1.12], 10);
  }
  if (!mobile) flower(root, 0.34, 0.09, 0.07, C.flowerYellow, 0.03);
}

function createRosette(root: THREE.Group, kind: "lettuce" | "spinach" | "chard", mobile: boolean, rand: () => number) {
  if (kind === "chard") {
    const count = mobile ? 6 : 10;
    for (let index = 0; index < count; index += 1) {
      const yaw = (index / count) * Math.PI * 2;
      const stemColor = index % 3 === 0 ? 0xb94656 : index % 3 === 1 ? 0xe0ba45 : 0xe7e1cc;
      const tip = new THREE.Vector3(Math.cos(yaw) * 0.1, 0.28 + rand() * 0.08, Math.sin(yaw) * 0.1);
      branch(root, new THREE.Vector3(0, 0, 0), tip.clone().multiplyScalar(0.75), 0.012, stemColor, 5);
      leaf(root, 0.22, 0.115, index % 2 ? C.leafDark : C.leaf, tip.x, tip.y * 0.62, tip.z, yaw, Math.PI * 0.28, 0, 1);
    }
    return;
  }
  const outer = mobile ? 7 : kind === "lettuce" ? 13 : 10;
  const inner = mobile ? 4 : 7;
  for (let index = 0; index < outer; index += 1) {
    const yaw = (index / outer) * Math.PI * 2;
    const radius = kind === "lettuce" ? 0.11 : 0.085;
    leaf(root, kind === "lettuce" ? 0.19 : 0.17, kind === "lettuce" ? 0.13 : 0.085, index % 2 ? C.leafLight : C.leaf, Math.cos(yaw) * radius, 0.02, Math.sin(yaw) * radius, yaw, Math.PI * 0.38, 0, kind === "lettuce" ? 2 : 0);
  }
  for (let index = 0; index < inner; index += 1) {
    const yaw = (index / inner) * Math.PI * 2 + 0.25;
    leaf(root, kind === "lettuce" ? 0.15 : 0.13, kind === "lettuce" ? 0.105 : 0.07, C.leafLight, Math.cos(yaw) * 0.045, 0.065, Math.sin(yaw) * 0.045, yaw, Math.PI * 0.22, 0, kind === "lettuce" ? 2 : 0);
  }
}

function createBrassica(root: THREE.Group, kind: "broccoli" | "cauliflower" | "cabbage" | "kale", mobile: boolean, rand: () => number) {
  const outer = mobile ? 6 : 9;
  for (let index = 0; index < outer; index += 1) {
    const yaw = (index / outer) * Math.PI * 2;
    const radius = kind === "kale" ? 0.11 : 0.13;
    leaf(root, kind === "kale" ? 0.22 : 0.2, kind === "kale" ? 0.1 : 0.13, index % 2 ? C.leafBlue : C.leafDark, Math.cos(yaw) * radius, 0.06 + rand() * 0.025, Math.sin(yaw) * radius, yaw, kind === "kale" ? Math.PI * 0.28 : Math.PI * 0.4, 0, kind === "kale" ? 4 : 2);
  }
  if (kind === "cabbage") {
    for (let ring = 0; ring < (mobile ? 2 : 3); ring += 1) {
      const count = 6 - ring;
      for (let index = 0; index < count; index += 1) {
        const yaw = (index / count) * Math.PI * 2 + ring * 0.25;
        leaf(root, 0.14 - ring * 0.015, 0.11 - ring * 0.01, 0x6b9564, Math.cos(yaw) * (0.07 - ring * 0.015), 0.1 + ring * 0.035, Math.sin(yaw) * (0.07 - ring * 0.015), yaw, Math.PI * 0.12, 0, 1);
      }
    }
    return;
  }
  if (kind === "kale") {
    branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.34, 0), 0.022, C.stemDark, 7);
    return;
  }
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.22, 0), 0.025, C.stemDark, 7);
  const headColor = kind === "cauliflower" ? C.cauliflower : C.broccoli;
  const headCount = mobile ? 7 : 13;
  for (let index = 0; index < headCount; index += 1) {
    const a = index * 2.399;
    const r = 0.018 + Math.sqrt(index / headCount) * 0.075;
    sphere(root, headColor, kind === "cauliflower" ? 0.034 : 0.029, Math.cos(a) * r, 0.235 + (1 - r / 0.1) * 0.025, Math.sin(a) * r, [1, 0.84, 1], 7);
  }
}

function createLegume(root: THREE.Group, kind: "bush-bean" | "climbing-bean" | "pea" | "broad-bean", mobile: boolean, rand: () => number) {
  const climbing = kind === "climbing-bean" || kind === "pea";
  const height = climbing ? (kind === "pea" ? 0.92 : 1.15) : kind === "broad-bean" ? 0.72 : 0.48;
  const stems = mobile ? 2 : climbing ? 3 : 4;
  for (let stemIndex = 0; stemIndex < stems; stemIndex += 1) {
    const yawBase = stemIndex * 2.1;
    const tip = new THREE.Vector3(Math.cos(yawBase) * (climbing ? 0.05 : 0.11), height * (0.85 + rand() * 0.18), Math.sin(yawBase) * (climbing ? 0.05 : 0.11));
    branch(root, new THREE.Vector3(0, 0, 0), tip, kind === "broad-bean" ? 0.012 : 0.009, C.stem, 6);
    const levels = mobile ? 3 : 5;
    for (let level = 0; level < levels; level += 1) {
      const t = 0.22 + level * 0.14;
      const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), tip, t);
      const yaw = yawBase + level * 1.7;
      if (kind === "pea") {
        leaf(root, 0.075, 0.045, C.leafLight, p.x, p.y, p.z, yaw, Math.PI * 0.43, 0, 0);
        leaf(root, 0.07, 0.04, C.leaf, p.x, p.y, p.z, yaw + Math.PI, Math.PI * 0.43, 0, 0);
      } else {
        for (const delta of [-0.45, 0, 0.45]) leaf(root, 0.095, 0.055, delta === 0 ? C.leafLight : C.leaf, p.x, p.y, p.z, yaw + delta, Math.PI * 0.43, 0, 1);
      }
    }
  }
  const podCount = mobile ? 2 : 4;
  for (let index = 0; index < podCount; index += 1) {
    const yaw = index * 1.8 + 0.3;
    const y = height * (0.35 + (index % 3) * 0.13);
    const podColor = kind === "pea" ? C.pea : C.bean;
    const pod = sphere(root, podColor, 0.025, Math.cos(yaw) * 0.11, y, Math.sin(yaw) * 0.11, [0.65, kind === "broad-bean" ? 2.6 : 2.0, 0.65], 7);
    pod.rotation.z = 0.25 * Math.sin(yaw);
  }
  if (climbing && !mobile) {
    const tendril = new THREE.TorusGeometry(0.035, 0.003, 4, 12, Math.PI * 1.5);
    const mesh = new THREE.Mesh(tendril, material(C.stem, 0.9));
    mesh.position.set(0.04, height * 0.83, 0.01);
    mesh.rotation.x = Math.PI * 0.5;
    root.add(mesh);
  }
}

function createRootCrop(root: THREE.Group, kind: "carrot" | "beet" | "radish", mobile: boolean, rand: () => number) {
  const rootColor = kind === "carrot" ? C.carrot : kind === "beet" ? C.beet : C.radish;
  const visibleY = kind === "carrot" ? -0.02 : 0.005;
  sphere(root, rootColor, kind === "carrot" ? 0.055 : 0.065, 0, visibleY, 0, kind === "carrot" ? [0.78, 1.65, 0.78] : [1, 0.9, 1], 8);
  const fronds = mobile ? 5 : kind === "carrot" ? 10 : 8;
  for (let index = 0; index < fronds; index += 1) {
    const yaw = (index / fronds) * Math.PI * 2 + rand() * 0.2;
    const length = kind === "carrot" ? 0.24 + rand() * 0.08 : 0.18 + rand() * 0.07;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.065, length, Math.sin(yaw) * 0.065);
    branch(root, new THREE.Vector3(0, 0.025, 0), tip, 0.0045, C.stem, 5);
    if (kind === "carrot") {
      for (let leaflet = 1; leaflet <= 3; leaflet += 1) {
        const t = 0.35 + leaflet * 0.15;
        const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0.025, 0), tip, t);
        leaf(root, 0.035, 0.014, C.leafLight, p.x, p.y, p.z, yaw + Math.PI * 0.5, Math.PI * 0.48, 0, 1);
        leaf(root, 0.035, 0.014, C.leaf, p.x, p.y, p.z, yaw - Math.PI * 0.5, Math.PI * 0.48, 0, 1);
      }
    } else {
      leaf(root, 0.13, kind === "beet" ? 0.07 : 0.06, kind === "beet" ? C.leafDark : C.leaf, tip.x * 0.55, tip.y * 0.55, tip.z * 0.55, yaw, Math.PI * 0.33, 0, 1);
    }
  }
}

function createAllium(root: THREE.Group, kind: "onion" | "garlic" | "leek", mobile: boolean, rand: () => number) {
  if (kind !== "leek") {
    sphere(root, kind === "garlic" ? C.garlic : C.onion, kind === "garlic" ? 0.065 : 0.06, 0, 0.02, 0, kind === "garlic" ? [1.05, 0.78, 1.05] : [1, 0.95, 1], 8);
    if (kind === "garlic" && !mobile) {
      for (let index = 0; index < 5; index += 1) {
        const a = index * Math.PI * 0.4;
        branch(root, new THREE.Vector3(0, 0.015, 0), new THREE.Vector3(Math.cos(a) * 0.052, 0.045, Math.sin(a) * 0.052), 0.003, 0xc7b995, 4);
      }
    }
  }
  const blades = mobile ? 4 : kind === "leek" ? 7 : 6;
  for (let index = 0; index < blades; index += 1) {
    const yaw = (index / blades) * Math.PI * 2 + rand() * 0.12;
    const length = kind === "leek" ? 0.48 + rand() * 0.08 : 0.32 + rand() * 0.08;
    strapLeaf(root, length, kind === "leek" ? 0.035 : 0.022, kind === "leek" ? 0x4f8058 : 0x4e8b52, Math.cos(yaw) * 0.018, kind === "leek" ? 0.04 : 0.045, Math.sin(yaw) * 0.018, yaw, 0.05 + rand() * 0.16, 0.018);
  }
  if (kind === "leek") sphere(root, 0xe3e0c4, 0.038, 0, 0.055, 0, [0.9, 1.8, 0.9], 7);
}

function createCorn(root: THREE.Group, mobile: boolean, rand: () => number) {
  const height = 1.12 + rand() * 0.22;
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0), 0.022, 0x52733d, 8);
  const leaves = mobile ? 5 : 8;
  for (let index = 0; index < leaves; index += 1) {
    const y = 0.2 + index * (height * 0.075);
    const yaw = index * 2.35;
    strapLeaf(root, 0.42 - index * 0.012, 0.055, index % 2 ? C.leafDark : C.leafLight, 0, y, 0, yaw, Math.PI * 0.25, 0.045);
  }
  sphere(root, C.corn, 0.04, 0.045, height * 0.58, 0, [0.8, 2.2, 0.8], 8);
  const tasselBase = new THREE.Vector3(0, height, 0);
  if (!mobile) {
    for (let index = 0; index < 6; index += 1) {
      const yaw = index * Math.PI / 3;
      branch(root, tasselBase, new THREE.Vector3(Math.cos(yaw) * 0.11, height + 0.16, Math.sin(yaw) * 0.11), 0.0035, 0xb99e58, 4);
    }
  }
}

function createPepper(root: THREE.Group, name: string, mobile: boolean, rand: () => number) {
  const trunkTop = new THREE.Vector3(0, 0.34, 0);
  branch(root, new THREE.Vector3(0, 0, 0), trunkTop, 0.018, C.stemDark, 7);
  const branchCount = mobile ? 3 : 5;
  for (let index = 0; index < branchCount; index += 1) {
    const yaw = (index / branchCount) * Math.PI * 2;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.17, 0.5 + rand() * 0.08, Math.sin(yaw) * 0.17);
    branch(root, trunkTop, tip, 0.009, C.stem, 6);
    leaf(root, 0.14, 0.06, index % 2 ? C.leafLight : C.leaf, tip.x * 0.78, tip.y - 0.08, tip.z * 0.78, yaw, Math.PI * 0.4, 0, 0);
    if (index % 2 === 0) {
      const elongated = /chilli|chili|cayenne/.test(name);
      const fruit = sphere(root, pepperColor(name), elongated ? 0.034 : 0.05, tip.x * 0.72, tip.y - 0.14, tip.z * 0.72, elongated ? [0.7, 1.8, 0.7] : [1, 1.25, 1], 8);
      fruit.rotation.z = 0.08 * Math.sin(yaw);
    }
  }
}

function createHerb(root: THREE.Group, kind: "basil" | "rosemary" | "parsley" | "dill" | "leafy", mobile: boolean, rand: () => number) {
  if (kind === "rosemary") {
    const stems = mobile ? 4 : 7;
    for (let stemIndex = 0; stemIndex < stems; stemIndex += 1) {
      const yaw = (stemIndex / stems) * Math.PI * 2;
      const tip = new THREE.Vector3(Math.cos(yaw) * 0.09, 0.34 + rand() * 0.08, Math.sin(yaw) * 0.09);
      branch(root, new THREE.Vector3(0, 0, 0), tip, 0.006, 0x665f43, 5);
      for (let index = 1; index <= (mobile ? 3 : 5); index += 1) {
        const t = index / 6;
        const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), tip, t);
        strapLeaf(root, 0.055, 0.009, C.leafSilver, p.x, p.y, p.z, yaw + Math.PI * 0.5, Math.PI * 0.46, 0);
        strapLeaf(root, 0.055, 0.009, C.leafBlue, p.x, p.y, p.z, yaw - Math.PI * 0.5, Math.PI * 0.46, 0);
      }
    }
    return;
  }
  if (kind === "dill") {
    const stems = mobile ? 3 : 5;
    for (let stemIndex = 0; stemIndex < stems; stemIndex += 1) {
      const yaw = stemIndex * 2.1;
      const height = 0.42 + rand() * 0.12;
      const tip = new THREE.Vector3(Math.cos(yaw) * 0.06, height, Math.sin(yaw) * 0.06);
      branch(root, new THREE.Vector3(0, 0, 0), tip, 0.0045, C.stem, 5);
      for (let level = 1; level <= (mobile ? 2 : 4); level += 1) {
        const t = level / 5;
        const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), tip, t);
        for (const delta of [-0.55, 0.55]) strapLeaf(root, 0.09, 0.007, C.leafLight, p.x, p.y, p.z, yaw + delta, Math.PI * 0.47, 0.005);
      }
    }
    return;
  }
  const stems = mobile ? 4 : kind === "parsley" ? 8 : 6;
  for (let index = 0; index < stems; index += 1) {
    const yaw = (index / stems) * Math.PI * 2;
    const height = kind === "basil" ? 0.28 + rand() * 0.08 : 0.2 + rand() * 0.06;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.08, height, Math.sin(yaw) * 0.08);
    branch(root, new THREE.Vector3(0, 0, 0), tip, 0.0055, C.stem, 5);
    const lobes = kind === "parsley" ? 4 : kind === "leafy" ? 2 : 0;
    leaf(root, kind === "basil" ? 0.115 : 0.1, kind === "basil" ? 0.07 : 0.065, index % 2 ? C.leafLight : C.leaf, tip.x * 0.7, tip.y * 0.67, tip.z * 0.7, yaw, Math.PI * 0.38, 0, lobes);
    if (kind === "basil") leaf(root, 0.1, 0.06, C.leafDark, tip.x * 0.55, tip.y * 0.82, tip.z * 0.55, yaw + Math.PI, Math.PI * 0.38, 0, 0);
  }
}

function inferKind(crop: string, variety?: string | null): PlantKind {
  const name = `${crop} ${variety ?? ""}`.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("strawber")) return "strawberry";
  if (name.includes("blueber")) return "blueberry";
  if (name.includes("raspber")) return "raspberry";
  if (name.includes("pumpkin") || name.includes("butternut") || name.includes("buttercup") || name.includes("kabocha") || name.includes("kamo kamo")) return "pumpkin";
  if (name.includes("zucchini") || name.includes("courgette") || name.includes("scallopini")) return "zucchini";
  if (name.includes("cucumber") || name.includes("gherkin")) return "cucumber";
  if (name.includes("melon") || name.includes("watermelon")) return "melon";
  if (name.includes("lettuce")) return "lettuce";
  if (name.includes("spinach")) return "spinach";
  if (name.includes("silverbeet") || name.includes("chard")) return "chard";
  if (name.includes("broccoli") || name.includes("broccolini")) return "broccoli";
  if (name.includes("cauliflower") || name.includes("broccoflower")) return "cauliflower";
  if (name.includes("cabbage") || name.includes("brussels")) return "cabbage";
  if (name.includes("kale")) return "kale";
  if (name.includes("broad bean") || name.includes("fava")) return "broad-bean";
  if (name.includes("pea")) return "pea";
  if (name.includes("bean")) return /climb|runner|pole|yard|winged/.test(name) ? "climbing-bean" : "bush-bean";
  if (name.includes("carrot")) return "carrot";
  if (name.includes("beet")) return "beet";
  if (name.includes("radish") || name.includes("daikon") || name.includes("turnip")) return "radish";
  if (name.includes("garlic")) return "garlic";
  if (name.includes("leek")) return "leek";
  if (name.includes("onion") || name.includes("shallot")) return "onion";
  if (name.includes("corn") || name.includes("maize")) return "corn";
  if (name.includes("pepper") || name.includes("chilli") || name.includes("chili") || name.includes("capsicum")) return "pepper";
  if (name.includes("basil")) return "basil";
  if (name.includes("rosemary")) return "rosemary";
  if (name.includes("parsley") || name.includes("coriander") || name.includes("cilantro")) return "parsley";
  if (name.includes("dill") || name.includes("fennel")) return "dill";
  return "leafy";
}

export function createGardenPlant3D(crop: string, variety: string | null | undefined, mobile: boolean, seedValue: number) {
  const root = new THREE.Group();
  const name = `${crop} ${variety ?? ""}`.toLowerCase();
  const kind = inferKind(crop, variety);
  const rand = seeded(seedValue + crop.length * 31 + (variety?.length ?? 0) * 17);

  if (kind === "tomato") createTomato(root, name, mobile, rand);
  else if (kind === "strawberry") createStrawberry(root, mobile, rand);
  else if (kind === "blueberry" || kind === "raspberry") createBerryShrub(root, kind, mobile, rand);
  else if (kind === "pumpkin" || kind === "zucchini" || kind === "cucumber" || kind === "melon") createCucurbit(root, kind, mobile, rand);
  else if (kind === "lettuce" || kind === "spinach" || kind === "chard") createRosette(root, kind, mobile, rand);
  else if (kind === "broccoli" || kind === "cauliflower" || kind === "cabbage" || kind === "kale") createBrassica(root, kind, mobile, rand);
  else if (kind === "bush-bean" || kind === "climbing-bean" || kind === "pea" || kind === "broad-bean") createLegume(root, kind, mobile, rand);
  else if (kind === "carrot" || kind === "beet" || kind === "radish") createRootCrop(root, kind, mobile, rand);
  else if (kind === "onion" || kind === "garlic" || kind === "leek") createAllium(root, kind, mobile, rand);
  else if (kind === "corn") createCorn(root, mobile, rand);
  else if (kind === "pepper") createPepper(root, name, mobile, rand);
  else createHerb(root, kind === "basil" || kind === "rosemary" || kind === "parsley" || kind === "dill" ? kind : "leafy", mobile, rand);

  const scaleVariation = 0.92 + rand() * 0.16;
  root.scale.setScalar(scaleVariation);
  root.rotation.y = rand() * Math.PI * 2;
  return root;
}
