import * as THREE from "three";
import {
  LOWPOLY_COLORS as C,
  enableCartoonShadow,
  lowPolyMaterial,
  makeCartoonLeaf,
  makeCartoonSphere,
  makeCartoonStem,
} from "@/components/garden-lowpoly-style";

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

function seeded(seed: number) {
  let value = (Math.floor(seed * 2654435761) ^ 0x9e3779b9) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function add(root: THREE.Object3D, mesh: THREE.Object3D, x = 0, y = 0, z = 0) {
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function branch(
  root: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius = 0.018,
  color = C.stemDark,
) {
  const direction = to.clone().sub(from);
  const length = direction.length();
  if (length < 0.001) return;
  const mesh = makeCartoonStem(length, radius, color, 6);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  root.add(mesh);
}

function leaf(
  root: THREE.Object3D,
  length: number,
  width: number,
  color: number,
  position: THREE.Vector3,
  yaw: number,
  pitch = Math.PI * 0.36,
  lobes = 0,
  scale = 1,
) {
  const mesh = makeCartoonLeaf(length, width, color, lobes);
  mesh.position.copy(position);
  mesh.rotation.order = "YXZ";
  mesh.rotation.set(pitch, yaw, 0);
  mesh.scale.setScalar(scale);
  root.add(mesh);
  return mesh;
}

function fruit(
  root: THREE.Object3D,
  radius: number,
  color: number,
  position: THREE.Vector3,
  scale: [number, number, number] = [1, 1, 1],
  detail = 1,
) {
  const mesh = makeCartoonSphere(radius, color, detail, scale);
  mesh.position.copy(position);
  root.add(mesh);
  return mesh;
}

function flower(root: THREE.Object3D, position: THREE.Vector3, color = C.flowerYellow, size = 0.028) {
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    const petal = makeCartoonSphere(size, color, 0, [1.15, 0.45, 0.75]);
    petal.position.set(position.x + Math.cos(a) * size * 0.8, position.y, position.z + Math.sin(a) * size * 0.8);
    petal.rotation.y = -a;
    root.add(petal);
  }
  fruit(root, size * 0.42, 0xb7832d, position, [1, 0.55, 1], 0);
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

function createTomato(root: THREE.Group, name: string, mobile: boolean, rand: () => number) {
  const height = 0.82 + rand() * 0.16;
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0), 0.028);

  const stake = enableCartoonShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, height + 0.2, 5), lowPolyMaterial(C.woodDark)),
  );
  stake.position.set(-0.07, (height + 0.2) * 0.5, 0.02);
  root.add(stake);

  const leafLevels = mobile ? 3 : 5;
  for (let level = 0; level < leafLevels; level += 1) {
    const y = 0.2 + level * (height * 0.12);
    const baseYaw = level * 2.25 + rand() * 0.35;
    for (const side of [0, Math.PI]) {
      const yaw = baseYaw + side;
      const tip = new THREE.Vector3(Math.cos(yaw) * 0.22, y + 0.055, Math.sin(yaw) * 0.22);
      branch(root, new THREE.Vector3(0, y, 0), tip, 0.008, C.stem);
      leaf(root, 0.2, 0.105, level % 2 ? C.leaf : C.leafDark, tip, yaw - Math.PI / 2, Math.PI * 0.42, 2, 1.05);
      if (!mobile) {
        leaf(root, 0.12, 0.065, C.leafLight, tip.clone().multiply(new THREE.Vector3(0.72, 1, 0.72)), yaw + 0.65, Math.PI * 0.42, 1, 0.9);
      }
    }
  }

  const cherry = /cherry|grape/.test(name);
  const roma = /roma|plum|paste/.test(name);
  const color = tomatoColor(name);
  const clusters = mobile ? 1 : 2;
  for (let cluster = 0; cluster < clusters; cluster += 1) {
    const y = 0.36 + cluster * 0.23;
    const yaw = 0.7 + cluster * 2.15;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.14, y - 0.03, Math.sin(yaw) * 0.14);
    branch(root, new THREE.Vector3(0, y, 0), tip, 0.006, C.stem);
    const count = cherry ? (mobile ? 4 : 6) : mobile ? 2 : 4;
    for (let i = 0; i < count; i += 1) {
      const a = yaw + (i - (count - 1) / 2) * 0.4;
      const r = cherry ? 0.035 : 0.055;
      fruit(
        root,
        r,
        color,
        new THREE.Vector3(tip.x + Math.cos(a) * 0.065, y - 0.07 - i * 0.01, tip.z + Math.sin(a) * 0.065),
        roma ? [0.82, 1.28, 0.82] : [1, 1, 1],
      );
    }
  }
  if (!mobile) flower(root, new THREE.Vector3(0.08, height * 0.8, 0.03), C.flowerYellow, 0.025);
}

function createStrawberry(root: THREE.Group, mobile: boolean, rand: () => number) {
  const crowns = mobile ? 2 : 3;
  for (let crown = 0; crown < crowns; crown += 1) {
    const center = new THREE.Vector3((crown - 1) * 0.055, 0.025, (rand() - 0.5) * 0.05);
    for (let i = 0; i < 4; i += 1) {
      const yaw = (i / 4) * Math.PI * 2 + crown * 0.55;
      const tip = center.clone().add(new THREE.Vector3(Math.cos(yaw) * 0.09, 0.11 + rand() * 0.025, Math.sin(yaw) * 0.09));
      branch(root, center, tip, 0.006, C.stem);
      leaf(root, 0.13, 0.085, i % 2 ? C.leaf : C.leafLight, tip, yaw - Math.PI / 2, Math.PI * 0.46, 2, 1.05);
    }
  }
  const berries = mobile ? 2 : 5;
  for (let i = 0; i < berries; i += 1) {
    const yaw = i * 1.47 + rand() * 0.25;
    const p = new THREE.Vector3(Math.cos(yaw) * (0.08 + rand() * 0.05), 0.055, Math.sin(yaw) * (0.08 + rand() * 0.05));
    branch(root, new THREE.Vector3(0, 0.09, 0), p, 0.0045, C.stem);
    fruit(root, 0.038, C.strawberry, p, [0.95, 1.25, 0.95]);
  }
  if (!mobile) flower(root, new THREE.Vector3(-0.05, 0.13, 0.08), C.flowerWhite, 0.022);
}

function createBerry(root: THREE.Group, kind: "blueberry" | "raspberry", mobile: boolean, rand: () => number) {
  const raspberry = kind === "raspberry";
  const canes = mobile ? 3 : raspberry ? 5 : 6;
  const height = raspberry ? 0.68 : 0.5;
  for (let i = 0; i < canes; i += 1) {
    const yaw = (i / canes) * Math.PI * 2 + rand() * 0.2;
    const base = new THREE.Vector3((rand() - 0.5) * 0.05, 0, (rand() - 0.5) * 0.05);
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.12, height * (0.8 + rand() * 0.25), Math.sin(yaw) * 0.12);
    branch(root, base, tip, raspberry ? 0.011 : 0.012, raspberry ? C.bark : C.stemDark);
    for (let l = 1; l <= (mobile ? 2 : 3); l += 1) {
      const t = l / 4;
      const p = base.clone().lerp(tip, t);
      leaf(root, raspberry ? 0.13 : 0.11, raspberry ? 0.07 : 0.06, l % 2 ? C.leaf : C.leafLight, p, yaw + (l % 2 ? 1.1 : -1.1), Math.PI * 0.4, raspberry ? 2 : 0);
    }
    if (i % 2 === 0) {
      const berryColor = raspberry ? C.raspberry : C.blueberry;
      const berryCount = mobile ? 3 : 5;
      for (let b = 0; b < berryCount; b += 1) {
        const angle = (b / berryCount) * Math.PI * 2;
        fruit(root, raspberry ? 0.025 : 0.021, berryColor, tip.clone().add(new THREE.Vector3(Math.cos(angle) * 0.04, -0.03 - (b % 2) * 0.02, Math.sin(angle) * 0.04)), raspberry ? [1, 1.1, 1] : [1, 1, 1], 0);
      }
    }
  }
}

function createRosette(root: THREE.Group, kind: "lettuce" | "spinach" | "chard", mobile: boolean, rand: () => number) {
  const layers = mobile ? 2 : 3;
  for (let layer = 0; layer < layers; layer += 1) {
    const count = 5 + layer * 2;
    const radius = 0.03 + layer * 0.045;
    for (let i = 0; i < count; i += 1) {
      const yaw = (i / count) * Math.PI * 2 + layer * 0.35;
      const p = new THREE.Vector3(Math.cos(yaw) * radius, 0.025 + layer * 0.02, Math.sin(yaw) * radius);
      const color = kind === "chard" ? C.leafBlue : i % 3 === 0 ? C.leafLight : i % 2 ? C.leaf : C.leafDark;
      const width = kind === "spinach" ? 0.075 : kind === "chard" ? 0.09 : 0.12;
      leaf(root, 0.17 + layer * 0.025, width, color, p, yaw - Math.PI / 2, 1.0 - layer * 0.12, kind === "lettuce" ? 2 : 0, 1 + rand() * 0.08);
    }
  }
  if (kind === "lettuce") fruit(root, 0.09, 0x8fc66d, new THREE.Vector3(0, 0.09, 0), [1.25, 0.72, 1.25], 1);
}

function createBrassica(root: THREE.Group, kind: "broccoli" | "cauliflower" | "cabbage" | "kale", mobile: boolean, rand: () => number) {
  const height = kind === "kale" ? 0.48 : 0.3;
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0), 0.026, C.stemDark);
  const leaves = mobile ? 5 : kind === "kale" ? 9 : 7;
  for (let i = 0; i < leaves; i += 1) {
    const yaw = (i / leaves) * Math.PI * 2 + (i % 2) * 0.3;
    const y = 0.08 + (kind === "kale" ? i * 0.035 : (i % 3) * 0.025);
    const p = new THREE.Vector3(Math.cos(yaw) * 0.08, y, Math.sin(yaw) * 0.08);
    leaf(root, kind === "kale" ? 0.23 : 0.25, 0.13, i % 2 ? C.leafBlue : C.leafDark, p, yaw - Math.PI / 2, kind === "kale" ? 0.72 : 0.9, kind === "kale" ? 4 : 2, 1 + rand() * 0.08);
  }
  if (kind === "broccoli") {
    for (let i = 0; i < (mobile ? 5 : 9); i += 1) {
      const a = (i / 9) * Math.PI * 2;
      fruit(root, 0.06, C.broccoli, new THREE.Vector3(Math.cos(a) * 0.045, height + 0.035 + (i % 2) * 0.025, Math.sin(a) * 0.045), [1.15, 0.9, 1.15], 1);
    }
  } else if (kind === "cauliflower") {
    fruit(root, 0.115, C.cauliflower, new THREE.Vector3(0, height + 0.045, 0), [1.15, 0.8, 1.15], 1);
  } else if (kind === "cabbage") {
    fruit(root, 0.14, C.cabbage, new THREE.Vector3(0, 0.17, 0), [1.15, 0.85, 1.15], 1);
  }
}

function createCucurbit(root: THREE.Group, kind: "pumpkin" | "zucchini" | "cucumber" | "melon", mobile: boolean, rand: () => number) {
  const vineLength = kind === "pumpkin" || kind === "melon" ? 0.5 : 0.34;
  const vineEnd = new THREE.Vector3(vineLength, 0.035, 0.06);
  branch(root, new THREE.Vector3(-vineLength * 0.45, 0.025, -0.02), vineEnd, 0.012, C.stemDark);
  const leaves = mobile ? 4 : 7;
  for (let i = 0; i < leaves; i += 1) {
    const t = i / Math.max(1, leaves - 1);
    const x = -vineLength * 0.4 + t * vineLength * 1.3;
    const yaw = i % 2 ? 0.9 : -0.9;
    leaf(root, 0.22, 0.18, i % 2 ? C.leaf : C.leafLight, new THREE.Vector3(x, 0.08 + rand() * 0.02, (i % 2 ? 1 : -1) * 0.07), yaw, 0.95, 5, 1.05);
  }
  const count = mobile ? 1 : kind === "cucumber" ? 3 : 2;
  for (let i = 0; i < count; i += 1) {
    const x = -0.05 + i * 0.16;
    const z = i % 2 ? 0.08 : -0.07;
    if (kind === "pumpkin") fruit(root, 0.115, C.pumpkin, new THREE.Vector3(x, 0.07, z), [1.25, 0.78, 1.25], 1);
    else if (kind === "zucchini") {
      const f = fruit(root, 0.055, C.courgette, new THREE.Vector3(x, 0.08, z), [0.75, 2.15, 0.75], 1);
      f.rotation.z = Math.PI * 0.42;
    } else if (kind === "cucumber") {
      const f = fruit(root, 0.045, C.cucumber, new THREE.Vector3(x, 0.1, z), [0.72, 2.3, 0.72], 1);
      f.rotation.z = Math.PI * 0.48;
    } else fruit(root, 0.1, C.melon, new THREE.Vector3(x, 0.07, z), [1.12, 0.9, 1.12], 1);
  }
}

function createBean(root: THREE.Group, kind: "bush-bean" | "climbing-bean" | "pea" | "broad-bean", mobile: boolean, rand: () => number) {
  const climbing = kind === "climbing-bean" || kind === "pea";
  const height = climbing ? 0.76 : kind === "broad-bean" ? 0.58 : 0.4;
  if (climbing) {
    const pole = enableCartoonShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, height + 0.22, 5), lowPolyMaterial(C.woodDark)));
    pole.position.set(0.05, (height + 0.22) * 0.5, 0.02);
    root.add(pole);
  }
  const stems = mobile ? 2 : climbing ? 3 : 4;
  for (let s = 0; s < stems; s += 1) {
    const yaw = (s / stems) * Math.PI * 2;
    const tip = new THREE.Vector3(Math.cos(yaw) * (climbing ? 0.06 : 0.13), height * (0.82 + rand() * 0.18), Math.sin(yaw) * (climbing ? 0.06 : 0.13));
    branch(root, new THREE.Vector3(0, 0, 0), tip, 0.01, C.stemDark);
    for (let i = 1; i <= (mobile ? 2 : 3); i += 1) {
      const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), tip, i / 4);
      leaf(root, 0.13, 0.075, i % 2 ? C.leaf : C.leafLight, p, yaw + (i % 2 ? 1.1 : -1.1), Math.PI * 0.42, kind === "pea" ? 0 : 1);
    }
    if (s % 2 === 0) {
      const podColor = kind === "pea" ? C.pea : C.bean;
      const pod = fruit(root, 0.032, podColor, tip.clone().add(new THREE.Vector3(0.02, -0.12, 0)), [0.7, 2.5, 0.7], 1);
      pod.rotation.z = 0.25;
    }
  }
}

function createRootCrop(root: THREE.Group, kind: "carrot" | "beet" | "radish", mobile: boolean, rand: () => number) {
  const color = kind === "carrot" ? C.carrot : kind === "beet" ? C.beet : C.radish;
  const shape: [number, number, number] = kind === "carrot" ? [0.78, 1.55, 0.78] : kind === "radish" ? [1, 0.9, 1] : [1.05, 0.86, 1.05];
  fruit(root, kind === "carrot" ? 0.065 : 0.072, color, new THREE.Vector3(0, 0.015, 0), shape, 1);
  const tops = mobile ? 5 : kind === "carrot" ? 9 : 7;
  for (let i = 0; i < tops; i += 1) {
    const yaw = (i / tops) * Math.PI * 2 + rand() * 0.15;
    const p = new THREE.Vector3(Math.cos(yaw) * 0.035, 0.045, Math.sin(yaw) * 0.035);
    leaf(root, kind === "carrot" ? 0.19 : 0.16, kind === "carrot" ? 0.035 : 0.07, i % 2 ? C.leafLight : C.leaf, p, yaw, 0.34 + rand() * 0.18, kind === "carrot" ? 3 : 1, 0.95 + rand() * 0.12);
  }
}

function createAllium(root: THREE.Group, kind: "onion" | "garlic" | "leek", mobile: boolean, rand: () => number) {
  if (kind !== "leek") {
    fruit(root, kind === "garlic" ? 0.072 : 0.068, kind === "garlic" ? C.garlic : C.onion, new THREE.Vector3(0, 0.025, 0), kind === "garlic" ? [1.08, 0.76, 1.08] : [1, 0.92, 1], 1);
  } else {
    fruit(root, 0.045, C.garlic, new THREE.Vector3(0, 0.07, 0), [0.9, 1.9, 0.9], 0);
  }
  const blades = mobile ? 4 : kind === "leek" ? 7 : 6;
  for (let i = 0; i < blades; i += 1) {
    const yaw = (i / blades) * Math.PI * 2 + rand() * 0.12;
    const height = kind === "leek" ? 0.45 : 0.3;
    const blade = enableCartoonShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.013, height, 2, 5), lowPolyMaterial(i % 2 ? C.leaf : C.leafLight)));
    blade.position.set(Math.cos(yaw) * 0.025, height * 0.55 + 0.05, Math.sin(yaw) * 0.025);
    blade.rotation.z = (rand() - 0.5) * 0.28;
    blade.rotation.y = yaw;
    root.add(blade);
  }
}

function createCorn(root: THREE.Group, mobile: boolean, rand: () => number) {
  const height = 1.02 + rand() * 0.14;
  branch(root, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0), 0.028, C.stemDark);
  const leaves = mobile ? 5 : 7;
  for (let i = 0; i < leaves; i += 1) {
    const yaw = i * 2.35;
    leaf(root, 0.42, 0.075, i % 2 ? C.leaf : C.leafLight, new THREE.Vector3(0, 0.17 + i * 0.09, 0), yaw, 0.52, 0, 1.05);
  }
  fruit(root, 0.05, C.corn, new THREE.Vector3(0.055, height * 0.58, 0), [0.85, 2.15, 0.85], 1);
  if (!mobile) {
    for (let i = 0; i < 5; i += 1) {
      const yaw = (i / 5) * Math.PI * 2;
      branch(root, new THREE.Vector3(0, height, 0), new THREE.Vector3(Math.cos(yaw) * 0.1, height + 0.14, Math.sin(yaw) * 0.1), 0.0035, 0xb79a54);
    }
  }
}

function createPepper(root: THREE.Group, name: string, mobile: boolean, rand: () => number) {
  const top = new THREE.Vector3(0, 0.34, 0);
  branch(root, new THREE.Vector3(0, 0, 0), top, 0.02, C.stemDark);
  const branches = mobile ? 3 : 5;
  for (let i = 0; i < branches; i += 1) {
    const yaw = (i / branches) * Math.PI * 2;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.17, 0.47 + rand() * 0.06, Math.sin(yaw) * 0.17);
    branch(root, top, tip, 0.009, C.stem);
    leaf(root, 0.16, 0.075, i % 2 ? C.leaf : C.leafLight, tip.clone().multiply(new THREE.Vector3(0.82, 1, 0.82)), yaw - Math.PI / 2, Math.PI * 0.42);
    if (i % 2 === 0) {
      const chilli = /chilli|chili|cayenne/.test(name);
      const f = fruit(root, chilli ? 0.036 : 0.055, pepperColor(name), tip.clone().add(new THREE.Vector3(0, -0.13, 0)), chilli ? [0.72, 2.0, 0.72] : [1, 1.28, 1], 1);
      f.rotation.z = chilli ? 0.15 : 0;
    }
  }
}

function createHerb(root: THREE.Group, kind: "basil" | "rosemary" | "parsley" | "dill" | "leafy", mobile: boolean, rand: () => number) {
  const stems = mobile ? 4 : kind === "parsley" ? 8 : 6;
  for (let i = 0; i < stems; i += 1) {
    const yaw = (i / stems) * Math.PI * 2;
    const height = kind === "rosemary" ? 0.36 : kind === "dill" ? 0.42 : 0.25 + rand() * 0.07;
    const tip = new THREE.Vector3(Math.cos(yaw) * 0.075, height, Math.sin(yaw) * 0.075);
    branch(root, new THREE.Vector3(0, 0, 0), tip, kind === "rosemary" ? 0.006 : 0.005, kind === "rosemary" ? C.bark : C.stem);
    if (kind === "rosemary") {
      for (let j = 1; j <= (mobile ? 2 : 4); j += 1) {
        const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), tip, j / 5);
        leaf(root, 0.07, 0.018, j % 2 ? C.leafSilver : C.leafBlue, p, yaw + Math.PI / 2, Math.PI * 0.48);
        leaf(root, 0.07, 0.018, C.leafBlue, p, yaw - Math.PI / 2, Math.PI * 0.48);
      }
    } else if (kind === "dill") {
      leaf(root, 0.15, 0.04, C.leafLight, tip.clone().multiply(new THREE.Vector3(0.72, 0.72, 0.72)), yaw, 0.4, 4);
    } else {
      leaf(root, kind === "basil" ? 0.13 : 0.11, kind === "basil" ? 0.08 : 0.07, i % 2 ? C.leaf : C.leafLight, tip.clone().multiply(new THREE.Vector3(0.72, 0.75, 0.72)), yaw - Math.PI / 2, Math.PI * 0.38, kind === "parsley" ? 4 : kind === "leafy" ? 2 : 0);
    }
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

export function createLowpolyPlant3D(
  crop: string,
  variety: string | null | undefined,
  mobile: boolean,
  seedValue: number,
) {
  const root = new THREE.Group();
  const name = `${crop} ${variety ?? ""}`.toLowerCase();
  const kind = inferKind(crop, variety);
  const rand = seeded(seedValue + crop.length * 31 + (variety?.length ?? 0) * 17);

  if (kind === "tomato") createTomato(root, name, mobile, rand);
  else if (kind === "strawberry") createStrawberry(root, mobile, rand);
  else if (kind === "blueberry" || kind === "raspberry") createBerry(root, kind, mobile, rand);
  else if (kind === "pumpkin" || kind === "zucchini" || kind === "cucumber" || kind === "melon") createCucurbit(root, kind, mobile, rand);
  else if (kind === "lettuce" || kind === "spinach" || kind === "chard") createRosette(root, kind, mobile, rand);
  else if (kind === "broccoli" || kind === "cauliflower" || kind === "cabbage" || kind === "kale") createBrassica(root, kind, mobile, rand);
  else if (kind === "bush-bean" || kind === "climbing-bean" || kind === "pea" || kind === "broad-bean") createBean(root, kind, mobile, rand);
  else if (kind === "carrot" || kind === "beet" || kind === "radish") createRootCrop(root, kind, mobile, rand);
  else if (kind === "onion" || kind === "garlic" || kind === "leek") createAllium(root, kind, mobile, rand);
  else if (kind === "corn") createCorn(root, mobile, rand);
  else if (kind === "pepper") createPepper(root, name, mobile, rand);
  else createHerb(root, kind === "basil" || kind === "rosemary" || kind === "parsley" || kind === "dill" ? kind : "leafy", mobile, rand);

  const variation = 0.93 + rand() * 0.14;
  root.scale.setScalar(variation);
  root.rotation.y = (rand() - 0.5) * 0.22;
  root.userData.lowPolyPlant = true;
  root.userData.crop = crop;
  root.userData.variety = variety ?? "";
  return root;
}
