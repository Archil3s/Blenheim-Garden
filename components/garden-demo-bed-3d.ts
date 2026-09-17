import * as THREE from "three";

const timber = new THREE.MeshStandardMaterial({
  color: 0x9a6742,
  roughness: 0.68,
});
const timberEdge = new THREE.MeshStandardMaterial({
  color: 0x69452f,
  roughness: 0.92,
});
const soil = new THREE.MeshStandardMaterial({
  color: 0x4b3024,
  roughness: 1,
});
const gravel = new THREE.MeshStandardMaterial({
  color: 0xbda889,
  roughness: 1,
});
const leaf = new THREE.MeshStandardMaterial({
  color: 0x3e7d43,
  roughness: 0.64,
});
const leafLight = new THREE.MeshStandardMaterial({
  color: 0x67a653,
  roughness: 0.68,
});
const stem = new THREE.MeshStandardMaterial({
  color: 0x557842,
  roughness: 0.7,
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
    value = (value * 1664525 + 1013904223) >>> 0;
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

function curvedLeaf(
  width: number,
  length: number,
  curl: number,
  source: THREE.MeshStandardMaterial,
  segments = 10,
) {
  const geometry = new THREE.PlaneGeometry(1, 1, 4, segments);
  const positions = geometry.attributes.position;
  const colors: number[] = [];
  const baseColor = source.color.clone();
  for (let index = 0; index < positions.count; index += 1) {
    const across = positions.getX(index);
    const edge = Math.min(1, Math.abs(across) * 2);
    const t = positions.getY(index) + 0.5;
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.62);
    const serration = 1 + Math.sin(t * Math.PI * 12) * 0.045 * taper;
    const centreRidge = (1 - edge) * curl * 0.48;
    positions.setXYZ(
      index,
      across * width * taper * serration,
      t * length,
      Math.sin(Math.PI * t) * curl + centreRidge - edge * curl * 0.12,
    );

    const vertexColor = baseColor
      .clone()
      .offsetHSL(0, 0.025 * (1 - edge), 0.085 * (1 - edge) - 0.035 * edge);
    colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const leafMaterial = source.clone();
  leafMaterial.color.set(0xffffff);
  leafMaterial.vertexColors = true;
  leafMaterial.roughness = Math.min(leafMaterial.roughness, 0.66);
  leafMaterial.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, leafMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function curvedStem(
  height: number,
  leanX: number,
  leanZ: number,
  radius: number,
  source: THREE.Material,
) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(leanX * 0.2, height * 0.35, leanZ * 0.15),
    new THREE.Vector3(leanX * 0.65, height * 0.72, leanZ * 0.6),
    new THREE.Vector3(leanX, height, leanZ),
  ]);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 14, radius, 8, false),
    source.clone(),
  );
  mesh.castShadow = true;
  return mesh;
}

function animatePlant(
  root: THREE.Group,
  seed: number,
  baseScale: number,
  sway = 0.035,
) {
  const phase = (seed % 97) * 0.31;
  const start = performance.now() + (seed % 8) * 65;
  root.scale.setScalar(0.001);
  root.userData.updateArtwork = () => {
    const now = performance.now();
    const progress = THREE.MathUtils.clamp((now - start) / 720, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    root.scale.setScalar(Math.max(0.001, baseScale * eased));
    root.rotation.z = Math.sin(now * 0.00125 + phase) * sway;
    root.rotation.x = Math.cos(now * 0.0009 + phase) * sway * 0.32;
  };
}

function lettuce(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const red = seed % 3 === 1;
  const outerMaterial = red
    ? new THREE.MeshStandardMaterial({ color: 0x71333c, roughness: 0.72 })
    : leafLight;
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2 + random() * 0.18;
    const outer = curvedLeaf(
      0.24 + random() * 0.05,
      0.3 + random() * 0.07,
      0.055 + random() * 0.025,
      index % 3 ? outerMaterial : leaf,
    );
    outer.position.set(
      Math.cos(angle) * 0.045,
      0.02 + (index % 3) * 0.015,
      Math.sin(angle) * 0.045,
    );
    outer.rotation.set(0, -angle, index % 2 ? 0.82 : 1.02);
    root.add(outer);
  }
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    const inner = curvedLeaf(0.16, 0.23, 0.065, outerMaterial);
    inner.position.y = 0.06;
    inner.rotation.set(0, -angle, 0.48);
    root.add(inner);
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.92 + random() * 0.12, 0.026);
  return root;
}

function carrot(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const shoulder = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xe77b24, roughness: 0.42 }),
  );
  shoulder.scale.y = 0.7;
  shoulder.position.y = 0.025;
  root.add(shoulder);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const blade = curvedLeaf(
      0.035 + random() * 0.018,
      0.28 + random() * 0.13,
      0.035 + random() * 0.025,
      index % 2 ? leaf : leafLight,
      6,
    );
    blade.rotation.set(0, -angle, (random() - 0.5) * 0.34);
    root.add(blade);
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.92 + random() * 0.15, 0.045);
  return root;
}

function springOnion(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.028, 0.17, 14),
    new THREE.MeshStandardMaterial({ color: 0xe8dfbd, roughness: 0.76 }),
  );
  base.position.y = 0.085;
  base.castShadow = true;
  root.add(base);
  for (let index = 0; index < 5; index += 1) {
    const height = 0.31 + random() * 0.15;
    root.add(
      curvedStem(
        height,
        (random() - 0.5) * 0.13,
        (random() - 0.5) * 0.09,
        0.006,
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x2f8b3b : 0x4aa34a,
          roughness: 0.72,
        }),
      ),
    );
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.95 + random() * 0.12, 0.055);
  return root;
}

function spinach(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  for (let index = 0; index < 13; index += 1) {
    const angle = (index / 13) * Math.PI * 2 + random() * 0.16;
    const item = curvedLeaf(
      0.2 + random() * 0.05,
      0.26 + random() * 0.08,
      0.05 + random() * 0.025,
      index % 3 ? leaf : leafLight,
    );
    item.position.set(
      Math.cos(angle) * 0.025,
      0.025 + (index % 3) * 0.012,
      Math.sin(angle) * 0.025,
    );
    item.rotation.set(0, -angle, 0.74 + random() * 0.34);
    root.add(item);
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.92 + random() * 0.16, 0.03);
  return root;
}

function radish(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.064, 20, 14),
    new THREE.MeshStandardMaterial({ color: 0xc62d3e, roughness: 0.38 }),
  );
  bulb.scale.set(1, 0.86, 1);
  bulb.position.y = 0.052;
  bulb.castShadow = true;
  root.add(bulb);
  const rootTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.012, 0.065, 12),
    new THREE.MeshStandardMaterial({ color: 0xf1ddd0, roughness: 0.75 }),
  );
  rootTip.position.y = -0.005;
  root.add(rootTip);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const item = curvedLeaf(
      0.14 + random() * 0.04,
      0.25 + random() * 0.08,
      0.045,
      index % 2 ? leaf : leafLight,
    );
    item.position.y = 0.085;
    item.rotation.set(0, -angle, 0.42 + random() * 0.38);
    root.add(item);
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.92 + random() * 0.12, 0.036);
  return root;
}

function addCropSign(root: THREE.Group, z: number, lines: string[]) {
  root.add(box(0.04, 0.5, 0.04, timberEdge, 1.16, 0.45, z));
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return;
  const gradient = context.createLinearGradient(0, 0, 512, 256);
  gradient.addColorStop(0, "#d58f49");
  gradient.addColorStop(0.5, "#efbc72");
  gradient.addColorStop(1, "#c77b3a");
  context.fillStyle = gradient;
  context.fillRect(10, 16, 492, 224);
  context.strokeStyle = "#704322";
  context.lineWidth = 10;
  context.strokeRect(10, 16, 492, 224);
  context.fillStyle = "#382015";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${lines.length > 1 ? 54 : 64}px Arial`;
  lines.forEach((line, index) => {
    context.fillText(line, 256, lines.length === 1 ? 130 : 92 + index * 74);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true }),
  );
  sprite.position.set(1.16, 0.71, z);
  sprite.scale.set(0.54, 0.27, 1);
  root.add(sprite);
}

function climbingBean(seed: number) {
  const random = seededRandom(seed);
  const root = new THREE.Group();
  const height = 1.55 + random() * 0.22;
  root.add(
    curvedStem(
      height,
      (random() - 0.5) * 0.18,
      (random() - 0.5) * 0.12,
      0.012,
      stem,
    ),
  );
  for (let index = 0; index < 11; index += 1) {
    const angle = index * 1.82 + random() * 0.2;
    const y = 0.18 + (index * (height - 0.28)) / 11;
    const item = curvedLeaf(
      0.17 + random() * 0.04,
      0.22 + random() * 0.05,
      0.045,
      index % 3 ? leaf : leafLight,
    );
    item.position.set(Math.cos(angle) * 0.07, y, Math.sin(angle) * 0.055);
    item.rotation.set(0, -angle, index % 2 ? 0.2 : -0.2);
    root.add(item);
    if (index % 3 === 1) {
      const pod = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.019, 0.15, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x5f984d, roughness: 0.46 }),
      );
      pod.position.set(
        Math.cos(angle + 0.5) * 0.08,
        y - 0.05,
        Math.sin(angle + 0.5) * 0.06,
      );
      pod.rotation.z = 0.2 + random() * 0.28;
      pod.castShadow = true;
      root.add(pod);
    }
  }
  root.rotation.y = random() * Math.PI * 2;
  animatePlant(root, seed, 0.96 + random() * 0.09, 0.022);
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

export function addDemonstrationBed3D(group: THREE.Group, mobile: boolean) {
  const root = new THREE.Group();
  const width = 2;
  const depth = 4;
  const wallHeight = 0.34;
  const rail = 0.13;

  root.add(box(2.2, 0.025, 6.4, gravel, 2.05, 0.005, 0.25));
  const environmentRandom = seededRandom(0x51a9e1);
  for (let index = 0; index < (mobile ? 30 : 72); index += 1) {
    const pebble = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.025 + environmentRandom() * 0.04, 0),
      new THREE.MeshStandardMaterial({
        color:
          index % 3 === 0 ? 0xe0cfb6 : index % 3 === 1 ? 0xa99274 : 0xc2ad91,
        roughness: 1,
      }),
    );
    pebble.scale.y = 0.55;
    pebble.position.set(
      1.08 + environmentRandom() * 1.8,
      0.03,
      -2.65 + environmentRandom() * 5.9,
    );
    pebble.rotation.y = environmentRandom() * Math.PI;
    root.add(pebble);
  }
  if (!mobile) {
    for (let index = 0; index < 20; index += 1) {
      root.add(
        box(0.22, 1.08, 0.065, timberEdge, -4.5 + index * 0.48, 0.54, -4.05),
      );
    }
    root.add(box(9.8, 0.1, 0.08, timberEdge, 0, 0.32, -4.02));
    root.add(box(9.8, 0.1, 0.08, timberEdge, 0, 0.82, -4.02));
    for (let index = 0; index < 15; index += 1) {
      const shrub = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.48 + environmentRandom() * 0.24, 1),
        (index % 2 ? leaf : leafLight).clone(),
      );
      shrub.scale.set(1.2, 1.3, 0.72);
      shrub.position.set(
        -5 + index * 0.72,
        0.7,
        -4.35 - environmentRandom() * 0.25,
      );
      root.add(shrub);
    }
  }

  root.add(box(width - 0.18, 0.22, depth - 0.18, soil, 0, 0.16, 0));
  root.add(
    box(width + rail, wallHeight, rail, timber, 0, wallHeight / 2, -depth / 2),
  );
  root.add(
    box(
      width + rail,
      wallHeight,
      rail,
      timberEdge,
      0,
      wallHeight / 2,
      depth / 2,
    ),
  );
  root.add(box(rail, wallHeight, depth, timber, -width / 2, wallHeight / 2, 0));
  root.add(
    box(rail, wallHeight, depth, timberEdge, width / 2, wallHeight / 2, 0),
  );
  root.add(
    box(
      width + 0.1,
      0.055,
      rail + 0.05,
      timber,
      0,
      wallHeight + 0.02,
      -depth / 2,
    ),
  );
  root.add(
    box(
      width + 0.1,
      0.055,
      rail + 0.05,
      timber,
      0,
      wallHeight + 0.02,
      depth / 2,
    ),
  );
  root.add(
    box(rail + 0.05, 0.055, depth, timber, -width / 2, wallHeight + 0.02, 0),
  );
  root.add(
    box(rail + 0.05, 0.055, depth, timber, width / 2, wallHeight + 0.02, 0),
  );
  addTrellis(root);

  const density = mobile ? 0.68 : 1;

  const addGrid = (
    count: number,
    columns: number,
    z: number,
    spacingX: number,
    spacingZ: number,
    makePlant: (seed: number, index: number) => THREE.Object3D,
    seed: number,
  ) => {
    const total = Math.max(columns, Math.round(count * density));
    for (let index = 0; index < total; index += 1) {
      const plant = makePlant(seed + index, index);
      const row = Math.floor(index / columns);
      const column = index % columns;
      plant.position.set(
        (column - (columns - 1) / 2) * spacingX +
          (row % 2 ? spacingX * 0.2 : 0),
        0.27,
        z + row * spacingZ,
      );
      root.add(plant);
    }
  };

  addGrid(22, 11, 1.48, 0.16, 0.19, springOnion, 100);
  addGrid(14, 7, 0.88, 0.255, 0.25, spinach, 220);
  addGrid(24, 12, 0.18, 0.145, 0.19, carrot, 340);
  addGrid(20, 10, -0.46, 0.18, 0.2, radish, 470);
  addGrid(12, 6, -1.08, 0.3, 0.27, lettuce, 590);
  addGrid(8, 8, -1.72, 0.23, 0.1, climbingBean, 720);

  addCropSign(root, -1.68, ["BEANS", "CLIMBING"]);
  addCropSign(root, -1.02, ["LETTUCE", "MIXED"]);
  addCropSign(root, -0.4, ["RADISH"]);
  addCropSign(root, 0.27, ["CARROT"]);
  addCropSign(root, 0.98, ["SPINACH"]);
  addCropSign(root, 1.62, ["SPRING", "ONIONS"]);

  inspectable(root, {
    title: "2 × 4 m demonstration bed",
    subtitle: "Reference-style mixed vegetable planting",
    lines: [
      { label: "Size", value: "2.0 × 4.0 m" },
      { label: "Planting", value: "6 dense crop bands" },
      { label: "Support", value: "Bamboo bean trellis" },
    ],
  });
  root.userData.hideSelectionBox = true;
  group.add(root);
  return root;
}
