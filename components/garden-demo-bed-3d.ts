import * as THREE from "three";

const timber = new THREE.MeshStandardMaterial({
  color: 0x9a6742,
  roughness: 0.86,
});
const timberEdge = new THREE.MeshStandardMaterial({
  color: 0x69452f,
  roughness: 0.92,
});
const soil = new THREE.MeshStandardMaterial({
  color: 0x4b3024,
  roughness: 1,
});
const mulch = new THREE.MeshStandardMaterial({
  color: 0xb58a54,
  roughness: 0.96,
});
const leaf = new THREE.MeshStandardMaterial({
  color: 0x3e7d43,
  roughness: 0.82,
});
const leafLight = new THREE.MeshStandardMaterial({
  color: 0x67a653,
  roughness: 0.86,
});
const stem = new THREE.MeshStandardMaterial({
  color: 0x557842,
  roughness: 0.9,
});
const redFruit = new THREE.MeshStandardMaterial({
  color: 0xc83f35,
  roughness: 0.62,
});
const strawberryFruit = new THREE.MeshStandardMaterial({
  color: 0xd8444b,
  roughness: 0.68,
});
const metal = new THREE.MeshStandardMaterial({
  color: 0x6f7976,
  roughness: 0.48,
  metalness: 0.32,
});

type InspectItem = {
  title: string;
  subtitle?: string;
  lines: Array<{ label: string; value: string }>;
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = value * 1664525 + 1013904223 >>> 0;
    return value / 0x100000000;
  };
}

function box(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material.clone(),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function inspectable(root: THREE.Object3D, item: InspectItem) {
  root.traverse((object) => {
    if (!object.userData.inspect) {
      object.userData.inspect = item;
      object.userData.selectionRoot = root;
    }
  });
}

function addLeafRing(
  root: THREE.Group,
  count: number,
  radius: number,
  y: number,
  scale: number,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 * scale, 10, 7),
      (index % 2 ? leaf : leafLight).clone(),
    );
    mesh.scale.set(1.6, 0.24, 0.82);
    mesh.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    );
    mesh.rotation.y = -angle;
    mesh.rotation.z = index % 2 ? -0.18 : 0.18;
    mesh.castShadow = true;
    root.add(mesh);
  }
}

function tomato(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 1.35, 8),
    stem.clone(),
  );
  stalk.position.y = 0.675;
  stalk.rotation.z = (random() - 0.5) * 0.07;
  root.add(stalk);
  addLeafRing(root, 7, 0.22, 0.5, 1.08);
  addLeafRing(root, 6, 0.2, 0.82, 0.95);
  addLeafRing(root, 5, 0.15, 1.12, 0.78);
  for (let index = 0; index < 6; index += 1) {
    const angle = index / 6 * Math.PI * 2;
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.065 + random() * 0.014, 12, 9),
      redFruit.clone(),
    );
    fruit.position.set(
      Math.cos(angle) * 0.13,
      0.55 + index % 3 * 0.13,
      Math.sin(angle) * 0.13,
    );
    fruit.castShadow = true;
    root.add(fruit);
  }
  root.rotation.y = random() * Math.PI * 2;
  root.scale.setScalar(0.94 + random() * 0.12);
  inspectable(root, {
    title: "Roma tomato",
    subtitle: "Mature fruiting plant",
    lines: [
      { label: "Spacing", value: "50 cm" },
      { label: "Mature height", value: "1.4 m" },
      { label: "Support", value: "Stake or trellis" },
    ],
  });
  return root;
}

function lettuce(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  addLeafRing(root, 12, 0.13, 0.08, 1.25);
  addLeafRing(root, 8, 0.07, 0.15, 0.95);
  root.rotation.y = random() * Math.PI * 2;
  root.scale.setScalar(0.94 + random() * 0.1);
  inspectable(root, {
    title: "Lettuce",
    subtitle: "Mature compact head",
    lines: [
      { label: "Spacing", value: "28 cm" },
      { label: "Mature spread", value: "30 cm" },
    ],
  });
  return root;
}

function carrot(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  for (let index = 0; index < 8; index += 1) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.32 + random() * 0.08, 6),
      (index % 2 ? leaf : leafLight).clone(),
    );
    const angle = index / 8 * Math.PI * 2;
    blade.position.set(
      Math.cos(angle) * 0.045,
      0.17,
      Math.sin(angle) * 0.045,
    );
    blade.rotation.z = (random() - 0.5) * 0.32;
    blade.castShadow = true;
    root.add(blade);
  }
  inspectable(root, {
    title: "Carrot",
    subtitle: "Root crop foliage",
    lines: [
      { label: "Spacing", value: "7 cm" },
      { label: "Visible", value: "Foliage above soil" },
    ],
  });
  return root;
}

function strawberry(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  addLeafRing(root, 9, 0.11, 0.08, 0.9);
  for (let index = 0; index < 3; index += 1) {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 7),
      strawberryFruit.clone(),
    );
    fruit.scale.set(0.86, 1.18, 0.86);
    fruit.position.set(
      (random() - 0.5) * 0.22,
      0.07,
      (random() - 0.5) * 0.22,
    );
    fruit.castShadow = true;
    root.add(fruit);
  }
  root.rotation.y = random() * Math.PI * 2;
  inspectable(root, {
    title: "Strawberry",
    subtitle: "Fruiting groundcover",
    lines: [
      { label: "Spacing", value: "35 cm" },
      { label: "Mature spread", value: "35 cm" },
    ],
  });
  return root;
}

function climbingBean(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const vine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 1.55, 7),
    stem.clone(),
  );
  vine.position.y = 0.775;
  vine.rotation.z = (random() - 0.5) * 0.12;
  root.add(vine);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * 1.9;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 9, 6),
      (index % 2 ? leaf : leafLight).clone(),
    );
    mesh.scale.set(1.45, 0.23, 0.76);
    mesh.position.set(
      Math.cos(angle) * 0.1,
      0.24 + index * 0.16,
      Math.sin(angle) * 0.08,
    );
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    root.add(mesh);
  }
  inspectable(root, {
    title: "Climbing bean",
    subtitle: "Trellis-trained vine",
    lines: [
      { label: "Spacing", value: "18 cm" },
      { label: "Mature height", value: "1.8 m" },
      { label: "Support", value: "Vertical mesh" },
    ],
  });
  return root;
}

function addTrellis(root: THREE.Group) {
  const trellis = new THREE.Group();
  for (const x of [-0.86, 0, 0.86]) {
    trellis.add(box(0.045, 1.85, 0.045, timberEdge, x, 0.925, -1.72));
  }
  for (const y of [0.35, 0.7, 1.05, 1.4, 1.75]) {
    trellis.add(box(1.76, 0.018, 0.018, metal, 0, y, -1.72));
  }
  for (const x of [-0.58, -0.29, 0.29, 0.58]) {
    trellis.add(box(0.014, 1.42, 0.014, metal, x, 1.03, -1.72));
  }
  inspectable(trellis, {
    title: "Bean trellis",
    subtitle: "1.8 m vertical support",
    lines: [
      { label: "Width", value: "1.8 m" },
      { label: "Material", value: "Timber and wire" },
    ],
  });
  root.add(trellis);
}

function addMulch(root: THREE.Group, mobile: boolean) {
  root.add(box(1.72, 0.018, 3.7, mulch, 0, 0.255, 0));
  const count = mobile ? 36 : 90;
  const random = seededRandom(0x2a4bed);
  for (let index = 0; index < count; index += 1) {
    const straw = box(
      0.1 + random() * 0.14,
      0.009,
      0.012,
      mulch,
      (random() - 0.5) * 1.58,
      0.268,
      (random() - 0.5) * 3.55,
    );
    straw.rotation.y = random() * Math.PI;
    root.add(straw);
  }
}

export function addDemonstrationBed3D(
  group: THREE.Group,
  mobile: boolean,
) {
  const root = new THREE.Group();
  const width = 2;
  const depth = 4;
  const wallHeight = 0.28;
  const rail = 0.1;

  root.add(box(width - 0.18, 0.18, depth - 0.18, soil, 0, 0.16, 0));
  root.add(box(width + rail, wallHeight, rail, timber, 0, wallHeight / 2, -depth / 2));
  root.add(box(width + rail, wallHeight, rail, timberEdge, 0, wallHeight / 2, depth / 2));
  root.add(box(rail, wallHeight, depth, timber, -width / 2, wallHeight / 2, 0));
  root.add(box(rail, wallHeight, depth, timberEdge, width / 2, wallHeight / 2, 0));
  addMulch(root, mobile);
  addTrellis(root);

  const tomatoes = [
    [-0.58, -1.08],
    [0.12, -1.08],
    [0.62, -0.62],
  ] as const;
  tomatoes.forEach(([x, z], index) => {
    const plant = tomato(100 + index);
    plant.position.set(x, 0.27, z);
    root.add(plant);
  });

  const beans = [-0.72, -0.36, 0, 0.36, 0.72];
  beans.forEach((x, index) => {
    const plant = climbingBean(220 + index);
    plant.position.set(x, 0.27, -1.62);
    root.add(plant);
  });

  const lettuces = [
    [-0.62, 0.08],
    [-0.18, 0.08],
    [0.3, 0.08],
    [0.68, 0.36],
    [-0.42, 0.52],
  ] as const;
  lettuces.forEach(([x, z], index) => {
    const plant = lettuce(320 + index);
    plant.position.set(x, 0.27, z);
    root.add(plant);
  });

  const strawberries = [
    [-0.64, 1.46],
    [-0.18, 1.46],
    [0.3, 1.46],
    [0.68, 1.18],
  ] as const;
  strawberries.forEach(([x, z], index) => {
    const plant = strawberry(420 + index);
    plant.position.set(x, 0.27, z);
    root.add(plant);
  });

  const carrotCount = mobile ? 10 : 18;
  for (let index = 0; index < carrotCount; index += 1) {
    const plant = carrot(520 + index);
    plant.position.set(
      -0.74 + index % 6 * 0.28,
      0.27,
      0.82 + Math.floor(index / 6) * 0.22,
    );
    root.add(plant);
  }

  inspectable(root, {
    title: "2 × 4 m demonstration bed",
    subtitle: "Real-scale mixed vegetable benchmark",
    lines: [
      { label: "Size", value: "2.0 × 4.0 m" },
      { label: "Planting", value: "Tomato, lettuce, carrot, strawberry, bean" },
      { label: "Surface", value: "Soil with straw mulch" },
    ],
  });
  group.add(root);
  return root;
}
