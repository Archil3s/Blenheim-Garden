from pathlib import Path


def replace_once(path_str: str, old: str, new: str) -> None:
    path = Path(path_str)
    text = path.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"anchor not found in {path_str}: {old[:80]!r}")
    path.write_text(text.replace(old, new, 1))


replace_once(
    "components/garden-3d-unified.tsx",
    '''const palette = {
  grass: 0x789b62,
  grassDark: 0x668951,
  timber: 0x9a6742,
  timberLight: 0xb18158,
  timberDark: 0x69452f,
  timberCap: 0xc08a5e,
  soil: 0x4b3024,
  mulch: 0xb58a54,
  leaf: 0x3e7d43,
  leafLight: 0x67a653,
  leafDark: 0x2f6638,
  stem: 0x557842,
  metal: 0x6f7976,
  path: 0xb4ad9b,
  pathDark: 0x858075,
};''',
    '''const palette = {
  grass: 0x79b85a,
  grassDark: 0x4f8f42,
  timber: 0xa96d3f,
  timberLight: 0xc98a52,
  timberDark: 0x74472d,
  timberCap: 0xd29a5d,
  soil: 0x65412d,
  mulch: 0xc69a5c,
  leaf: 0x4f9f50,
  leafLight: 0x76bb59,
  leafDark: 0x35783d,
  stem: 0x4f7b42,
  metal: 0x9ca9aa,
  path: 0xc8b18b,
  pathDark: 0x9b8668,
};''',
)

replace_once(
    "components/garden-3d-unified.tsx",
    'return new THREE.MeshStandardMaterial({ color, roughness, metalness });',
    'return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });',
)

replace_once(
    "components/garden-3d-unified.tsx",
    '''  gradient.addColorStop(0, "#72a8bf");
  gradient.addColorStop(0.52, "#c8dcda");
  gradient.addColorStop(1, "#efe3cb");''',
    '''  gradient.addColorStop(0, "#76b8df");
  gradient.addColorStop(0.52, "#c7e6e8");
  gradient.addColorStop(1, "#f6dfb7");''',
)

replace_once(
    "components/garden-3d-unified.tsx",
    '''  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, trunkHeight, 8), mat(0x755137, 1));''',
    '''  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, trunkHeight, 6), mat(0x765036, 1));''',
)

replace_once(
    "components/garden-3d-unified.tsx",
    '''    const crown = new THREE.Mesh(new THREE.SphereGeometry(radius * (index === 0 ? 0.82 : 0.62), 9, 7), mat(index % 2 ? 0x477a48 : 0x568c4f, 0.96));
    crown.scale.y = 0.76;''',
    '''    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * (index === 0 ? 0.82 : 0.62), 1), mat(index % 2 ? 0x4f964d : 0x67aa55, 0.96));
    crown.scale.set(1.08, 0.82, 1);''',
)

replace_once(
    "components/garden-crop-patch-3d.ts",
    '''const COLORS = {
  leaf: new THREE.Color(0x3f7e43),
  leafLight: new THREE.Color(0x69a856),
  leafDark: new THREE.Color(0x2e6639),
  leafBlue: new THREE.Color(0x4f7659),
  carrot: new THREE.Color(0xdc7629),
  beet: new THREE.Color(0x8d3150),
  radish: new THREE.Color(0xd94e66),
  onion: new THREE.Color(0xddd0a7),
};''',
    '''const COLORS = {
  leaf: new THREE.Color(0x4f9f50),
  leafLight: new THREE.Color(0x76bb59),
  leafDark: new THREE.Color(0x35783d),
  leafBlue: new THREE.Color(0x5c8c69),
  carrot: new THREE.Color(0xe8842f),
  beet: new THREE.Color(0x943653),
  radish: new THREE.Color(0xdf536c),
  onion: new THREE.Color(0xe6d2a8),
};''',
)

replace_once(
    "components/garden-crop-patch-3d.ts",
    'return new THREE.MeshStandardMaterial({ color, roughness: 0.88, side: THREE.DoubleSide });',
    'return new THREE.MeshStandardMaterial({ color, roughness: 0.92, side: THREE.DoubleSide, flatShading: true });',
)

replace_once(
    "components/garden-structure-3d.ts",
    '''const PALETTE = {
  timber: 0x9a6742,
  timberLight: 0xb18158,
  timberDark: 0x69452f,
  roof: 0x4f514d,
  roofEdge: 0x383b38,
  metal: 0x6f7976,
  metalLight: 0x8c9893,
  glass: 0xbfded4,
  plastic: 0xd7e8e3,
  soil: 0x4b3024,
  waterTank: 0x778f96,
  waterTankDark: 0x53676c,
};''',
    '''const PALETTE = {
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
};''',
)

replace_once(
    "components/garden-structure-3d.ts",
    'return new THREE.MeshStandardMaterial({ color, roughness, metalness });',
    'return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });',
)

replace_once(
    "components/garden-structure-3d.ts",
    '''    transmission: 0.08,
    thickness: 0.02,
    depthWrite: false,
    side: THREE.DoubleSide,''',
    '''    transmission: 0,
    thickness: 0.02,
    depthWrite: false,
    flatShading: true,
    side: THREE.DoubleSide,''',
)
