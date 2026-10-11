import * as THREE from "three";

export const LOWPOLY_COLORS = {
  woodLight: 0xc98a52,
  woodMid: 0xa96d3f,
  woodDark: 0x74472d,
  soil: 0x65412d,
  soilDark: 0x4b3024,
  grass: 0x79b85a,
  grassDark: 0x4f8f42,
  leaf: 0x4f9f50,
  leafLight: 0x76bb59,
  leafDark: 0x35783d,
  leafBlue: 0x5c8c69,
  leafSilver: 0x789680,
  stem: 0x4f7b42,
  stemDark: 0x3c6035,
  tomato: 0xe14d3f,
  tomatoYellow: 0xf1c64c,
  tomatoOrange: 0xee8a36,
  tomatoPurple: 0x77445c,
  strawberry: 0xe23f4d,
  blueberry: 0x5868ad,
  raspberry: 0xd64a68,
  pumpkin: 0xe4832f,
  cucumber: 0x4b9148,
  courgette: 0x578e4f,
  melon: 0xc2ac61,
  broccoli: 0x477d48,
  cauliflower: 0xeee2bf,
  cabbage: 0x72a661,
  carrot: 0xe8842f,
  beet: 0x943653,
  radish: 0xdf536c,
  onion: 0xe6d2a8,
  garlic: 0xeee5c9,
  corn: 0xf0c34e,
  pepperRed: 0xdb493d,
  pepperYellow: 0xf0c44c,
  pepperOrange: 0xef8936,
  bean: 0x579748,
  pea: 0x79ad51,
  flowerYellow: 0xf3ce55,
  flowerWhite: 0xf5eedc,
  flowerPurple: 0x9474bd,
  bark: 0x765036,
  path: 0xc8b18b,
  metal: 0xb8c0c8,
  glass: 0xbfe6dd,
} as const;

const botanicalMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

export function botanicalMaterial(source: THREE.MeshStandardMaterial) {
  const key = source.uuid;
  let material = botanicalMaterialCache.get(key);
  if (!material) {
    material = source.clone();
    material.flatShading = false;
    material.roughness = 0.64;
    material.vertexColors = source.vertexColors;
    botanicalMaterialCache.set(key, material);
  }
  return material;
}

const roundedMaterialCache = new Map<number, THREE.MeshStandardMaterial>();

const leafMaterialCache = new Map<number, THREE.MeshStandardMaterial>();

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function lowPolyMaterial(
  color: number,
  options: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
  } = {},
) {
  const roughness = options.roughness ?? 0.9;
  const metalness = options.metalness ?? 0;
  const transparent = options.transparent ?? false;
  const opacity = options.opacity ?? 1;
  const side = options.side ?? THREE.FrontSide;
  const key = `${color}:${roughness}:${metalness}:${transparent ? 1 : 0}:${opacity}:${side}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const created = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent,
    opacity,
    side,
    flatShading: true,
  });
  materialCache.set(key, created);
  return created;
}

export function lowPolyGlassMaterial(color: number = LOWPOLY_COLORS.glass) {
  return lowPolyMaterial(color, {
    roughness: 0.24,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
}

export function enableCartoonShadow<T extends THREE.Mesh>(mesh: T) {
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}

export function makeCartoonSphere(
  radius: number,
  color: number,
  detail: number = 1,
  scale: [number, number, number] = [1, 1, 1],
) {
  const geometry = detail === 0 ? new THREE.IcosahedronGeometry(radius, 0) : new THREE.SphereGeometry(radius, detail > 1 ? 20 : 14, detail > 1 ? 14 : 10);
  const positions = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i) / radius, z = positions.getZ(i) / radius;
    const shade = .88 + .12 * y + .06 * z;
    colors.push(shade, shade, shade);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  let material = roundedMaterialCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: .6, vertexColors: true });
    roundedMaterialCache.set(color, material);
  }
  const mesh = enableCartoonShadow(new THREE.Mesh(geometry, material));
  mesh.scale.set(...scale);
  return mesh;
}

export function makeCartoonStem(
  height: number,
  radius: number = 0.025,
  color: number = LOWPOLY_COLORS.stemDark,
  segments: number = 6,
) {
  return enableCartoonShadow(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.82, radius, height, segments),
      lowPolyMaterial(color),
    ),
  );
}

export function makeCartoonLeaf(
  length: number = 0.24,
  width: number = 0.13,
  color: number = LOWPOLY_COLORS.leaf,
  lobes: number = 0,
) {
  const samples = 16;
  const vertices: number[] = [], colors: number[] = [];
  const fold = (x: number, y: number) => Math.sin(Math.PI * y / length) * width * .24 * (1 - Math.min(1, Math.abs(x) / (width / 2))) + Math.sin(y / length * Math.PI * 3) * width * .045;
  const edge = (t: number) => width * .5 * Math.sin(Math.PI * t) * (lobes > 0 ? .78 + Math.sin(t * Math.PI * lobes * 2) * .22 : 1);
  const addSurfaceVertex = (t: number, across: number) => {
    const x = across * edge(t), y = t * length;
    vertices.push(x, y, fold(x, y));
    const shade = .73 + .32 * (1 - Math.abs(across)) + .13 * t;
    colors.push(shade, shade, shade * .94);
  };
  // Interior rows bend the whole leaf rather than a fan of long flat triangles.
  const rows = 12, columns = 6;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const t0 = row / rows, t1 = (row + 1) / rows;
    const a0 = column / columns * 2 - 1, a1 = (column + 1) / columns * 2 - 1;
    for (const [t, across] of [[t0,a0],[t0,a1],[t1,a0],[t1,a0],[t0,a1],[t1,a1]]) addSurfaceVertex(t, across);
  }
  const geometry = new THREE.BufferGeometry();
  const ribbon = (x0: number, y0: number, x1: number, y1: number, width: number, shade: number) => {
    const dx = x1 - x0, dy = y1 - y0;
    const distance = Math.hypot(dx, dy);
    if (!distance) return;
    const nx = -dy / distance * width, ny = dx / distance * width;
    const segments = Math.max(1, Math.ceil(distance / (length / 12)));
    for (let step = 0; step < segments; step += 1) {
      const a = step / segments, b = (step + 1) / segments;
      const ax = x0 + dx * a, ay = y0 + dy * a;
      const bx = x0 + dx * b, by = y0 + dy * b;
      for (const offset of [-.0015, .0015]) for (const [x, y] of [[ax-nx,ay-ny],[ax+nx,ay+ny],[bx-nx,by-ny],[bx-nx,by-ny],[ax+nx,ay+ny],[bx+nx,by+ny]]) {
        vertices.push(x, y, fold(x, y) + offset);
        colors.push(shade, shade, shade * .83);
      }
    }
  };
  ribbon(0, .01 * length, 0, .96 * length, width * .014, 1.4);
  for (const side of [-1, 1]) {
    for (let i = 1; i < 6; i += 1) {
      const t = i / 7;
      ribbon(0, length * t, side * width * .39 * Math.sin(Math.PI * (t + .12)), length * (t + .12), width * .007, 1.22);
    }
    for (let i = 0; i < samples; i += 1) {
      const edge = (t: number) => side * width * .5 * Math.sin(Math.PI * t) * (lobes > 0 ? .78 + Math.sin(t * Math.PI * lobes * 2) * .22 : 1);
      const t0 = i / samples, t1 = (i + 1) / samples;
      ribbon(edge(t0), length * t0, edge(t1), length * t1, width * .009, .47);
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(vertices.flatMap((_, i) => i % 3 === 0 ? [vertices[i] / width + .5, vertices[i + 1] / length] : []), 2));
  const normals: number[] = [];
  const epsilon = Math.min(length, width) * .001;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], y = vertices[i + 1];
    const dx = (fold(x + epsilon, y) - fold(x - epsilon, y)) / (2 * epsilon);
    const dy = (fold(x, y + epsilon) - fold(x, y - epsilon)) / (2 * epsilon);
    const normal = new THREE.Vector3(-dx, -dy, 1).normalize();
    normals.push(normal.x, normal.y, normal.z);
  }
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  let material = leafMaterialCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: .8, side: THREE.DoubleSide, vertexColors: true });
    leafMaterialCache.set(color, material);
  }
  const mesh = enableCartoonShadow(new THREE.Mesh(geometry, material));
  return mesh;
}

export function makeRoundedBlock(
  width: number,
  height: number,
  depth: number,
  color: number,
) {
  // A bevelled box would add a large vertex cost to every bed/structure. A low-segment
  // box with flat shading keeps the same clean cartoon language at planner scale.
  return enableCartoonShadow(
    new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), lowPolyMaterial(color)),
  );
}
