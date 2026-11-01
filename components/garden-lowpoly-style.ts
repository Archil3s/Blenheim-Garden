import * as THREE from "three";

export const LOWPOLY_COLORS = {
  woodLight: 0xb99363,
  woodMid: 0x94714f,
  woodDark: 0x655039,
  soil: 0x65412d,
  soilDark: 0x4b3024,
  grass: 0x83a36d,
  grassDark: 0x647f56,
  leaf: 0x477b4a,
  leafLight: 0x6d9858,
  leafDark: 0x315f3c,
  leafBlue: 0x5d7e6b,
  leafSilver: 0x829b86,
  stem: 0x55764a,
  stemDark: 0x405c3a,
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

/**
 * Low-cost sculpted leaf surface with a centre fold, gently curled outer margin
 * and tinted midrib. Keeps the existing low-poly plant interface, but avoids
 * flat triangle cut-outs. Geometry is new per leaf; material is shared.
 */
const botanicalLeafMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.83,
  metalness: 0,
  side: THREE.DoubleSide,
  flatShading: false,
});

export function makeCartoonLeaf(
  length: number = 0.24,
  width: number = 0.13,
  color: number = LOWPOLY_COLORS.leaf,
  lobes: number = 0,
) {
  const longitudinal = 10;
  const transverse = 4;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const baseColor = new THREE.Color(color);

  for (let row = 0; row <= longitudinal; row += 1) {
    const t = row / longitudinal;
    const envelope = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.79);
    const scallop = lobes > 0
      ? 0.79 + 0.21 * Math.cos(t * Math.PI * (lobes * 2 + 1)) ** 2
      : 1;

    for (let column = 0; column <= transverse; column += 1) {
      const side = (column / transverse) * 2 - 1;
      const edge = Math.abs(side);
      const across = side * width * 0.5 * envelope * scallop;
      const curling = Math.sin(Math.PI * t) * (0.013 * (1 - edge) - 0.009 * edge);
      const tipCurl = t * t * 0.018;
      positions.push(across, length * t, curling + tipCurl);

      // A muted midrib and subtler edges read as a folded living leaf,
      // rather than a single flat green polygon.
      const light = 0.055 * (1 - edge) - 0.043 * edge
        + 0.015 * Math.sin(Math.PI * t);
      const tint = baseColor.clone().offsetHSL(0, 0, light);
      colors.push(tint.r, tint.g, tint.b);
    }
  }

  for (let row = 0; row < longitudinal; row += 1) {
    for (let col = 0; col < transverse; col += 1) {
      const a = row * (transverse + 1) + col;
      const b = a + transverse + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return enableCartoonShadow(new THREE.Mesh(geometry, botanicalLeafMaterial));
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
