import * as THREE from "three";
import { LOWPOLY_COLORS as C, makeCartoonLeaf, makeCartoonSphere, makeCartoonStem } from "./garden-lowpoly-style";

export const BOTANICAL_PLANT_KINDS = ["achillea", "agastache", "ageratum", "agrostemma", "akeake", "alyssum", "amaranth", "angelica", "anise", "artichoke", "asparagus", "aster", "astragalus", "potato", "mint", "sage", "thyme", "chives", "brussels-sprout"] as const;
export type BotanicalKind = typeof BOTANICAL_PLANT_KINDS[number];

export function createBotanicalPlant(root: THREE.Group, kind: BotanicalKind, name: string, mobile: boolean) {
  const count = mobile ? 2 : 3;
  const ball = (x: number, y: number, z: number, radius: number, color: number, scale: [number, number, number] = [1, 1, 1]) => {
    const mesh = makeCartoonSphere(radius, color, radius < .04 ? 0 : mobile ? 0 : 1, scale);
    mesh.position.set(x, y, z); root.add(mesh); return mesh;
  };
  const stem = (x: number, z: number, height: number, radius = .005, color: number = C.stem) => {
    const mesh = makeCartoonStem(height, radius, color); mesh.position.set(x, height / 2, z); root.add(mesh);
  };
  const blade = (x: number, y: number, z: number, length: number, width: number, angle: number, color: number = C.leaf, pitch = .6, lobes = 0) => {
    const mesh = makeCartoonLeaf(length, width, color, lobes);
    mesh.position.set(x, y, z); mesh.rotation.set(pitch, angle, 0, "YXZ"); root.add(mesh);
  };
  const daisy = (x: number, y: number, z: number, color: number, radius: number, petals = 8) => {
    for (let i = 0; i < petals; i += 1) {
      const a = i * Math.PI * 2 / petals;
      const p = ball(x + Math.cos(a) * radius, y, z + Math.sin(a) * radius, radius * .55, color, [1.5, .25, .65]); p.rotation.y = -a;
    }
    ball(x, y + .006, z, radius * .5, C.flowerYellow, [1, .5, 1]);
  };
  if (kind === "asparagus" || kind === "chives") {
    const purple = /purple/.test(name);
    for (let i = 0; i < (mobile ? 5 : 9); i += 1) {
      const angle = i * 2.4, x = Math.cos(angle) * .07, z = Math.sin(angle) * .07;
      const h = kind === "chives" ? .3 + (i % 3) * .025 : .45 + (i % 3) * .08;
      stem(x, z, h, kind === "chives" ? .006 : .015, purple ? 0x796082 : C.leaf);
      if (kind === "asparagus") {
        ball(x, h, z, .021, purple ? 0x785173 : 0x759254, [.75, 1.8, .75]);
        for (let j = 1; j <= 4; j += 1) blade(x, h * j / 5, z, .04, .025, j * 2.4, purple ? 0x9a7791 : C.leafDark, .2);
      } else if (i % 3 === 0) ball(x, h, z, .028, C.flowerPurple);
    }
  } else if (kind === "artichoke") {
    stem(0, 0, .55, .025);
    for (let i = 0; i < (mobile ? 6 : 10); i += 1) blade(0, .08 + i % 3 * .05, 0, .4, .14, i * 2.4, C.leafSilver, 1.05, 5);
    for (let layer = 0; layer < 4; layer += 1) {
      const r = .075 - layer * .013;
      for (let i = 0; i < (mobile ? 5 : 8); i += 1) {
        const a = i * Math.PI * 2 / (mobile ? 5 : 8) + layer * .4;
        blade(Math.cos(a) * r, .45 + layer * .04, Math.sin(a) * r, .1, .055, a, layer % 2 ? C.leafBlue : C.leafSilver, .3);
      }
    }
  } else if (kind === "brussels-sprout") {
    stem(0, 0, .7, .028);
    for (let i = 0; i < (mobile ? 8 : 15); i += 1) {
      const a = i * 2.4, y = .1 + i * .032;
      ball(Math.cos(a) * .04, y, Math.sin(a) * .04, .028, C.cabbage);
    }
    for (let i = 0; i < 5; i += 1) blade(0, .62, 0, .22, .13, i * 1.26, C.leafBlue, .9, 2);
  } else if (kind === "akeake") {
    stem(0, 0, .8, .025, C.bark);
    for (let i = 0; i < (mobile ? 10 : 20); i += 1) {
      const a = i * 2.4, y = .25 + i % 7 * .065;
      stem(Math.cos(a) * .09, Math.sin(a) * .09, y, .005, C.bark);
      blade(Math.cos(a) * .12, y, Math.sin(a) * .12, .18, .035, a, /purple/.test(name) ? 0x705967 : C.leafDark, .5);
    }
  } else if (["mint", "sage", "thyme", "potato"].includes(kind)) {
    const small = kind === "thyme", height = small ? .16 : kind === "potato" ? .4 : .3;
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.4, x = Math.cos(a) * .07, z = Math.sin(a) * .07;
      stem(x, z, height, .006);
      for (let j = 1; j <= (mobile ? 2 : 4); j += 1) for (const side of [-1, 1]) {
        blade(x, height * j / 5, z, small ? .045 : .12, small ? .025 : kind === "sage" ? .045 : .065, a + side * Math.PI / 2, kind === "sage" ? C.leafSilver : C.leaf, 1.05, kind === "mint" ? 3 : 0);
      }
      if (kind === "potato") daisy(x, height, z, C.flowerWhite, .025, 5);
    }
  } else if (kind === "amaranth") {
    const red = /garnet|red/.test(name);
    stem(0, 0, .72, .014, red ? 0x8d4254 : C.stem);
    for (let i = 0; i < (mobile ? 5 : 8); i += 1) blade(0, .12 + i * .055, 0, .22, .11, i * 2.4, red ? (i % 2 ? 0x985269 : 0x714955) : C.leaf, .8);
    for (let i = 0; i < (mobile ? 5 : 10); i += 1) ball(Math.sin(i) * .02, .55 + i * .022, Math.cos(i) * .02, .035 - i * .002, red ? 0x94435d : 0x88974d);
  } else {
    const low = kind === "alyssum" || kind === "ageratum";
    const height = low ? .14 : kind === "angelica" ? .68 : .45;
    const spike = kind === "agastache" || kind === "astragalus";
    const umbel = kind === "angelica" || kind === "anise" || kind === "achillea";
    const color = kind === "ageratum" ? 0x9b88c1 : kind === "agrostemma" ? 0xd383b0 : kind === "aster" ? 0xb898cf : spike ? 0x8b69b5 : C.flowerWhite;
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.4, x = Math.cos(a) * (low ? .12 : .08), z = Math.sin(a) * (low ? .12 : .08), h = height * (1 - i % 3 * .1);
      stem(x, z, h, .005);
      for (let j = 1; j <= 3; j += 1) blade(x, h * j / 4, z, low ? .065 : .14, umbel ? .035 : .06, a + j * 2, C.leaf, .7, kind === "achillea" || kind === "anise" ? 5 : 0);
      if (spike) for (let j = 0; j < (mobile ? 5 : 9); j += 1) ball(x + Math.sin(j * 2.4) * .02, h + j * .015, z + Math.cos(j * 2.4) * .02, .018, color);
      else if (umbel) for (let j = 0; j < (mobile ? 3 : 6); j += 1) {
        const angle = j * 2.4, bx = x + Math.cos(angle) * .075, bz = z + Math.sin(angle) * .075;
        const start = new THREE.Vector3(x,h - .05,z), end = new THREE.Vector3(bx,h,bz), direction = end.clone().sub(start);
        const line = makeCartoonStem(direction.length(),.002,C.stem); line.position.copy(start).add(end).multiplyScalar(.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); root.add(line);
        daisy(bx, h, bz, kind === "angelica" ? 0xcbd48a : color, .012, 5);
      } else daisy(x, h, z, color, low ? .026 : .042, kind === "agrostemma" ? 5 : 10);
    }
  }
}
