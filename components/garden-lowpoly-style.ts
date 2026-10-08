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
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const mesh = enableCartoonShadow(new THREE.Mesh(geometry, lowPolyMaterial(color)));
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
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const samples = 16;
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples;
    const taper = Math.sin(Math.PI * t);
    const lobe = lobes > 0 ? 0.78 + Math.sin(t * Math.PI * lobes * 2) * 0.22 : 1;
    shape.lineTo(width * 0.5 * taper * lobe, length * t);
  }
  shape.lineTo(0, length);
  for (let i = samples; i >= 1; i -= 1) {
    const t = i / samples;
    const taper = Math.sin(Math.PI * t);
    const lobe = lobes > 0 ? 0.78 + Math.sin(t * Math.PI * lobes * 2) * 0.22 : 1;
    shape.lineTo(-width * 0.5 * taper * lobe, length * t);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 1).toNonIndexed();
  const position = geometry.getAttribute("position");
  const vertices = Array.from(position.array), colors: number[] = [];
  const fold = (x: number, y: number) => Math.sin(Math.PI * y / length) * width * .16 * (1 - Math.min(1, Math.abs(x) / (width / 2))) + Math.sin(y / length * Math.PI * 3) * width * .025;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i);
    vertices[i * 3 + 2] = fold(x, y);
    const shade = .78 + .22 * (1 - Math.min(1, Math.abs(x) / (width / 2))) + .12 * y / length;
    colors.push(shade, shade, shade);
  }
  for (let i = 0; i < 6; i += 1) {
    const y0 = length * i / 6, y1 = length * (i + 1) / 6, w = width * .009;
    for (const [x,y] of [[-w,y0],[w,y0],[-w,y1],[-w,y1],[w,y0],[w,y1]]) {
      vertices.push(x,y,fold(0,y) + .001); colors.push(1.24,1.24,1.08);
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(vertices.flatMap((_, i) => i % 3 === 0 ? [vertices[i] / width + .5, vertices[i + 1] / length] : []), 2));
  geometry.computeVertexNormals();
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
