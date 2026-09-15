import * as THREE from "three";

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function makeSoilMaterial(seed = 1) {
  const base = new THREE.Color(0x563a2a);
  const lift = (seeded(seed) - 0.5) * 0.055;
  base.offsetHSL(0, 0.02, lift);
  return new THREE.MeshStandardMaterial({ color: base, roughness: 0.98, metalness: 0 });
}

export function makeTimberMaterial(seed = 1, dark = false) {
  const base = new THREE.Color(dark ? 0x715038 : 0x9a704d);
  base.offsetHSL((seeded(seed + 4) - 0.5) * 0.025, (seeded(seed + 7) - 0.5) * 0.08, (seeded(seed + 11) - 0.5) * 0.08);
  return new THREE.MeshStandardMaterial({ color: base, roughness: 0.9, metalness: 0 });
}

export function makePathMaterial(seed = 1) {
  const base = new THREE.Color(0xa59d89);
  base.offsetHSL(0, (seeded(seed + 13) - 0.5) * 0.05, (seeded(seed + 17) - 0.5) * 0.08);
  return new THREE.MeshStandardMaterial({ color: base, roughness: 0.96, metalness: 0 });
}

export function makeGrassMaterial(inner = true) {
  return new THREE.MeshStandardMaterial({
    color: inner ? 0x72925d : 0x5f804c,
    roughness: 0.96,
    metalness: 0,
  });
}

export function addContactShadow(parent: THREE.Group, radius: number, x: number, z: number, y = 0.205) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(0.035, radius), 16),
    new THREE.MeshBasicMaterial({ color: 0x2a211a, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, y, z);
  shadow.renderOrder = 0;
  parent.add(shadow);
  return shadow;
}
