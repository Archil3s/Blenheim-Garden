from pathlib import Path


def replace_once(path_str: str, old: str, new: str) -> None:
    path = Path(path_str)
    text = path.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"anchor not found in {path_str}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1))


def replace_section(path_str: str, start: str, end: str, new: str) -> None:
    path = Path(path_str)
    text = path.read_text()
    a = text.find(start)
    if a < 0:
        raise SystemExit(f"start marker not found in {path_str}: {start!r}")
    b = text.find(end, a)
    if b < 0:
        raise SystemExit(f"end marker not found in {path_str}: {end!r}")
    path.write_text(text[:a] + new + text[b:])


# Brighter, warmer cozy-game palette.
replace_once(
    "components/garden-3d-unified.tsx",
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
    '''const palette = {
  grass: 0x8fcb58,
  grassDark: 0x63a947,
  timber: 0xb9783f,
  timberLight: 0xda9a56,
  timberDark: 0x7a4728,
  timberCap: 0xe6ad66,
  soil: 0x67402a,
  mulch: 0xc99756,
  leaf: 0x4da24c,
  leafLight: 0x78c457,
  leafDark: 0x347a3e,
  stem: 0x4d803f,
  metal: 0xa8b6b2,
  path: 0xe8cf9f,
  pathDark: 0xc8a978,
};''',
)

# Chunkier beds with thicker, warmer boards like the target render.
replace_once(
    "components/garden-3d-unified.tsx",
    '''  const wallHeight = 0.3;
  const rail = 0.1;
  const post = 0.115;

  box(group, Math.max(0.08, width - 0.18), 0.17, Math.max(0.08, depth - 0.18), palette.soil, x, 0.18, z, 1);''',
    '''  const wallHeight = 0.34;
  const rail = 0.13;
  const post = 0.15;

  box(group, Math.max(0.08, width - 0.22), 0.21, Math.max(0.08, depth - 0.22), palette.soil, x, 0.205, z, 1);''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''  box(group, width + 0.15, 0.035, 0.055, palette.timberCap, x, wallHeight + 0.018, z - depth / 2, 0.82);
  box(group, width + 0.15, 0.035, 0.055, palette.timberCap, x, wallHeight + 0.018, z + depth / 2, 0.82);
  box(group, 0.055, 0.035, depth, palette.timberCap, x - width / 2, wallHeight + 0.018, z, 0.82);
  box(group, 0.055, 0.035, depth, palette.timberCap, x + width / 2, wallHeight + 0.018, z, 0.82);''',
    '''  box(group, width + 0.18, 0.055, 0.075, palette.timberCap, x, wallHeight + 0.028, z - depth / 2, 0.78);
  box(group, width + 0.18, 0.055, 0.075, palette.timberCap, x, wallHeight + 0.028, z + depth / 2, 0.78);
  box(group, 0.075, 0.055, depth, palette.timberCap, x - width / 2, wallHeight + 0.028, z, 0.78);
  box(group, 0.075, 0.055, depth, palette.timberCap, x + width / 2, wallHeight + 0.028, z, 0.78);

  // Thin highlight boards give the chunky timber a toy-like, hand-built edge.
  box(group, width - 0.08, 0.028, 0.018, palette.timberLight, x, wallHeight * 0.72, z - depth / 2 - rail * 0.46, 0.78);
  box(group, width - 0.08, 0.028, 0.018, palette.timberLight, x, wallHeight * 0.72, z + depth / 2 + rail * 0.46, 0.78);''',
)

# Cream path with large flattened stepping stones rather than tiny pebbles.
replace_section(
    "components/garden-3d-unified.tsx",
    "function addPath(",
    "function addTrellis(",
    '''function addPath(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "path" }>, mobile: boolean) {
  const x1 = worldX(object.x1);
  const z1 = worldZ(object.y1);
  const x2 = worldX(object.x2);
  const z2 = worldZ(object.y2);
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.max(0.05, Math.hypot(dx, dz));
  const width = Math.max(0.2, object.widthCm / 100);
  const group = new THREE.Group();
  const angle = Math.atan2(dz, dx);

  const path = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, width), mat(palette.path, 1));
  path.position.set((x1 + x2) / 2, 0.018, (z1 + z2) / 2);
  path.rotation.y = -angle;
  path.receiveShadow = true;
  group.add(path);

  const stones = mobile ? Math.max(4, Math.floor(length * 0.9)) : Math.max(6, Math.floor(length * 1.35));
  for (let index = 0; index < stones; index += 1) {
    const t = (index + 0.5) / stones;
    const side = ((((index * 47) % 100) / 100) - 0.5) * width * 0.34;
    const radius = 0.085 + (index % 3) * 0.018;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), mat(index % 2 ? 0xd7bd8c : 0xf0d9aa, 1));
    stone.scale.set(1.18, 0.22, 0.9 + (index % 2) * 0.12);
    stone.position.set(x1 + dx * t - Math.sin(angle) * side, 0.052, z1 + dz * t + Math.cos(angle) * side);
    stone.rotation.y = (index * 0.71) % Math.PI;
    stone.castShadow = true;
    group.add(stone);
  }

  inspectable(group, { title: object.label || "Garden path", lines: [{ label: "Length", value: `${length.toFixed(1)} m` }, { label: "Width", value: `${object.widthCm} cm` }] });
  root.add(group);
}

''',
)

# Rounder, friendlier faceted tree.
replace_section(
    "components/garden-3d-unified.tsx",
    "function addTree(",
    "function addBoundary(",
    '''function addTree(root: THREE.Group, object: Extract<PlannerPlan["objects"][number], { type: "tree" }>, mobile: boolean) {
  const group = new THREE.Group();
  const x = worldX(object.x);
  const z = worldZ(object.y);
  const radius = Math.min(1.05, Math.max(0.34, object.diameterCm / 190));
  const trunkHeight = 0.8 + radius * 0.24;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.145, trunkHeight, 7), mat(0x7a4d2f, 1));
  trunk.position.set(x, trunkHeight / 2, z);
  trunk.castShadow = true;
  group.add(trunk);

  const crowns = mobile ? 4 : 7;
  for (let index = 0; index < crowns; index += 1) {
    const angle = (index / Math.max(1, crowns - 1)) * Math.PI * 2 + 0.35;
    const center = index === 0;
    const size = radius * (center ? 0.82 : 0.53 + (index % 2) * 0.06);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), mat(index % 3 === 0 ? 0x86c756 : index % 2 ? 0x5eaa49 : 0x73bb50, 0.98));
    crown.scale.set(1.02, center ? 0.92 : 0.82, 1.02);
    crown.position.set(
      x + (center ? 0 : Math.cos(angle) * radius * 0.34),
      trunkHeight + radius * (center ? 0.63 : 0.48 + (index % 3) * 0.08),
      z + (center ? 0 : Math.sin(angle) * radius * 0.34),
    );
    crown.castShadow = true;
    group.add(crown);
  }
  inspectable(group, { title: object.label || "Garden tree", lines: [{ label: "Canopy", value: `${(object.diameterCm / 100).toFixed(1)} m` }] });
  root.add(group);
}

''',
)

# Complete post-and-rail fence on all four sides and decorative edge details.
replace_section(
    "components/garden-3d-unified.tsx",
    "function addBoundary(",
    "function buildGarden(",
    '''function addBoundary(root: THREE.Group, mobile: boolean) {
  const width = GARDEN_WIDTH_CM / 100;
  const depth = GARDEN_HEIGHT_CM / 100;
  const sidePosts = mobile ? 10 : 16;
  const endPosts = mobile ? 8 : 13;
  const fence = 0x9b653a;
  const fenceLight = 0xc08449;

  const addPost = (x: number, z: number) => {
    box(root, 0.085, 0.58, 0.085, fence, x, 0.29, z, 0.95);
    box(root, 0.105, 0.035, 0.105, fenceLight, x, 0.595, z, 0.85);
  };

  for (let index = 0; index < sidePosts; index += 1) {
    const t = index / Math.max(1, sidePosts - 1);
    const z = -depth / 2 + depth * t;
    addPost(-width / 2, z);
    addPost(width / 2, z);
  }
  for (let index = 1; index < endPosts - 1; index += 1) {
    const t = index / Math.max(1, endPosts - 1);
    const x = -width / 2 + width * t;
    addPost(x, -depth / 2);
    addPost(x, depth / 2);
  }

  for (const y of [0.23, 0.43]) {
    box(root, width + 0.04, 0.055, 0.055, fenceLight, 0, y, -depth / 2, 0.9);
    box(root, width + 0.04, 0.055, 0.055, fenceLight, 0, y, depth / 2, 0.9);
    box(root, 0.055, 0.055, depth + 0.04, fenceLight, -width / 2, y, 0, 0.9);
    box(root, 0.055, 0.055, depth + 0.04, fenceLight, width / 2, y, 0, 0.9);
  }
}

function addGardenDecor(root: THREE.Group, mobile: boolean) {
  const width = GARDEN_WIDTH_CM / 100;
  const depth = GARDEN_HEIGHT_CM / 100;
  const tufts = mobile ? 18 : 48;
  for (let index = 0; index < tufts; index += 1) {
    const alongSide = index % 2 === 0;
    const t = ((index * 37) % 100) / 100;
    const side = index % 4 < 2 ? -1 : 1;
    const x = alongSide ? side * (width / 2 - 0.18) : -width / 2 + 0.2 + t * (width - 0.4);
    const z = alongSide ? -depth / 2 + 0.2 + t * (depth - 0.4) : side * (depth / 2 - 0.18);
    const tuft = new THREE.Group();
    for (let blade = 0; blade < 3; blade += 1) {
      const grass = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11 + blade * 0.016, 5), mat(blade % 2 ? 0x6dac49 : 0x80bf50, 1));
      grass.position.set(x + (blade - 1) * 0.025, 0.05, z + ((blade * 17) % 3 - 1) * 0.018);
      grass.rotation.z = (blade - 1) * 0.12;
      grass.castShadow = true;
      tuft.add(grass);
    }
    root.add(tuft);

    if (!mobile && index % 5 === 0) {
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.12, 5), mat(0x4d8b42, 1));
      stem.position.set(x + 0.04, 0.06, z - 0.02);
      flower.add(stem);
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = petal * Math.PI * 0.4;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), mat(0xf8f0cf, 1));
        p.scale.set(1.3, 0.45, 0.8);
        p.position.set(x + 0.04 + Math.cos(angle) * 0.018, 0.125, z - 0.02 + Math.sin(angle) * 0.018);
        flower.add(p);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.01, 5, 4), mat(0xf0c34e, 1));
      center.position.set(x + 0.04, 0.126, z - 0.02);
      flower.add(center);
      root.add(flower);
    }
  }
}

''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''function buildGarden(root: THREE.Group, plan: PlannerPlan, mobile: boolean) {
  addBoundary(root, mobile);''',
    '''function buildGarden(root: THREE.Group, plan: PlannerPlan, mobile: boolean) {
  addBoundary(root, mobile);
  addGardenDecor(root, mobile);''',
)

# Warmer sky/light, less foggy, more isometric camera, richer grass accents.
replace_once(
    "components/garden-3d-unified.tsx",
    '''  gradient.addColorStop(0, "#76b8df");
  gradient.addColorStop(0.52, "#c7e6e8");
  gradient.addColorStop(1, "#f6dfb7");''',
    '''  gradient.addColorStop(0, "#79c6ee");
  gradient.addColorStop(0.56, "#c9e9ef");
  gradient.addColorStop(1, "#ffe4b5");''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''      renderer.toneMappingExposure = mobile ? 1.02 : 1.08;''',
    '''      renderer.toneMappingExposure = mobile ? 1.06 : 1.14;''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''    scene.background = sky ?? new THREE.Color(0xcbded7);
    scene.fog = new THREE.Fog(0xb9cecc, 18, 32);
    scene.add(new THREE.HemisphereLight(0xf8fff8, 0x6e5b47, 1.55));

    const sun = new THREE.DirectionalLight(0xffefd2, mobile ? 1.6 : 2.3);
    sun.position.set(-6, 10, 7);''',
    '''    scene.background = sky ?? new THREE.Color(0xcbeaf0);
    scene.fog = new THREE.Fog(0xd6e7d5, 23, 40);
    scene.add(new THREE.HemisphereLight(0xfffdf1, 0x6d7347, 1.72));

    const sun = new THREE.DirectionalLight(0xffdda2, mobile ? 1.75 : 2.55);
    sun.position.set(-7.5, 11.5, 6.5);''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''    if (!mobile) {
      for (let index = 0; index < 90; index += 1) {
        const gx = ((index * 67) % 900) / 100 - 4.5;
        const gz = ((index * 113) % 1080) / 100 - 5.4;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09 + (index % 4) * 0.012, 4), mat(index % 2 ? 0x638d52 : 0x719b5d, 1));
        blade.position.set(gx, 0.03, gz);
        scene.add(blade);
      }
    }

    const camera = new THREE.PerspectiveCamera(mobile ? 44 : 38, 1, 0.1, 60);
    camera.position.set(mobile ? 7.7 : 8.7, mobile ? 8.2 : 8.6, mobile ? 11.4 : 12.2);''',
    '''    if (!mobile) {
      for (let index = 0; index < 150; index += 1) {
        const gx = ((index * 67) % 900) / 100 - 4.5;
        const gz = ((index * 113) % 1080) / 100 - 5.4;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.085 + (index % 4) * 0.014, 5), mat(index % 3 === 0 ? 0x70b84c : index % 2 ? 0x7dc654 : 0x65aa47, 1));
        blade.position.set(gx, 0.035, gz);
        blade.rotation.z = (((index * 19) % 11) - 5) * 0.025;
        scene.add(blade);
      }
    }

    const camera = new THREE.PerspectiveCamera(mobile ? 42 : 34, 1, 0.1, 60);
    camera.position.set(mobile ? 7.5 : 8.4, mobile ? 9.2 : 10.4, mobile ? 12.2 : 13.6);''',
)
replace_once(
    "components/garden-3d-unified.tsx",
    '''    runtime.camera.position.set(runtime.mobile ? 7.7 : 8.7, runtime.mobile ? 8.2 : 8.6, runtime.mobile ? 11.4 : 12.2);''',
    '''    runtime.camera.position.set(runtime.mobile ? 7.5 : 8.4, runtime.mobile ? 9.2 : 10.4, runtime.mobile ? 12.2 : 13.6);''',
)

# Fuller crop beds and slightly larger hero plants.
replace_once(
    "components/garden-crop-patch-3d.ts",
    '''    const cap = options.mobile ? 42 : 110;''',
    '''    const cap = options.mobile ? 54 : 150;''',
)
replace_once(
    "components/garden-crop-patch-3d.ts",
    '''  if (/tomato/.test(name)) return Math.min(options.mobile ? 8 : 18, planned);
  if (/corn|maize/.test(name)) return Math.min(options.mobile ? 12 : 28, planned);
  if (/broccoli|cauliflower|cabbage|kale/.test(name)) return Math.min(options.mobile ? 12 : 30, planned);
  if (/strawber/.test(name)) return Math.min(options.mobile ? 18 : 46, planned);
  if (/bean|pea/.test(name)) return Math.min(options.mobile ? 14 : 34, planned);
  return Math.min(options.mobile ? 12 : 26, planned);''',
    '''  if (/tomato/.test(name)) return Math.min(options.mobile ? 10 : 24, planned);
  if (/corn|maize/.test(name)) return Math.min(options.mobile ? 18 : 40, planned);
  if (/broccoli|cauliflower|cabbage|kale/.test(name)) return Math.min(options.mobile ? 16 : 38, planned);
  if (/strawber/.test(name)) return Math.min(options.mobile ? 24 : 64, planned);
  if (/bean|pea/.test(name)) return Math.min(options.mobile ? 18 : 44, planned);
  return Math.min(options.mobile ? 16 : 34, planned);''',
)
replace_once(
    "components/garden-crop-patch-3d.ts",
    '''    const variation = point.scale * (0.94 + rand() * 0.12);''',
    '''    const variation = point.scale * (1.02 + rand() * 0.14);''',
)
replace_once(
    "components/garden-crop-patch-3d.ts",
    '''  const leavesPerPlant = options.mobile ? 5 : 7;''',
    '''  const leavesPerPlant = options.mobile ? 6 : 9;''',
)
replace_once(
    "components/garden-crop-patch-3d.ts",
    '''  const geometry = leafShape(0.15, 0.085);''',
    '''  const geometry = leafShape(0.17, 0.1);''',
)

print("Applied cozy isometric garden style")
