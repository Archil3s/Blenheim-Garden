import * as THREE from "three";

export type PlantGrowthPhase = "seedling" | "leafy" | "flowering" | "mature";

export function plantPhaseForScale(scale: number): PlantGrowthPhase {
  return scale < .45 ? "seedling" : scale < .7 ? "leafy" : scale < .94 ? "flowering" : "mature";
}

function organ(mesh: THREE.Mesh) {
  if (mesh.userData.plantPart) return mesh.userData.plantPart;
  const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
  if (material.side === THREE.DoubleSide) return "leaf";
  if (material.map && material.roughness < .5) return "fruit";
  const hsl = { h: 0, s: 0, l: 0 }; material.color?.getHSL(hsl);
  if (hsl.s > .5 && hsl.l > .18 && hsl.h < .115) return "fruit";
  return hsl.s > .5 && hsl.l > .4 && hsl.h < .2 ? "flower" : "stem";
}

function seedling(template: THREE.Group, crop: string, mobile: boolean) {
  const root = new THREE.Group();
  const narrow = /onion|garlic|leek|chive|corn|asparagus/i.test(crop);
  let leafMaterial: THREE.Material | undefined;
  let lightest = -1;
  template.traverse(node => {
    if (!(node instanceof THREE.Mesh) || organ(node) !== "leaf") return;
    const candidate = (Array.isArray(node.material) ? node.material[0] : node.material) as THREE.MeshStandardMaterial;
    const color = candidate.color, lightness = color ? color.r * .2126 + color.g * .7152 + color.b * .0722 : 0;
    if (lightness > lightest) { lightest = lightness; leafMaterial = candidate; }
  });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x77994b, roughness: .8 });
  const foliage = leafMaterial ?? new THREE.MeshStandardMaterial({ color: 0x659342, side: THREE.DoubleSide, roughness: .75 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.004, .006, .14, 7), stemMaterial);
  stem.position.y = .07; stem.userData = { plantPart: "stem", growthOwnedGeometry: true, growthOwnedMaterial: true }; root.add(stem);
  for (let i = 0; i < (narrow ? 4 : 5); i++) {
    const length = narrow ? .16 + i % 2 * .025 : i < 2 ? .09 : .12 - i * .008;
    const width = narrow ? .011 : i < 2 ? .042 : .055, rows = mobile ? 12 : 22, columns = mobile ? 6 : 10;
    const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      const t = row / rows, u = col / columns, a = u * 2 - 1, envelope = Math.sin(Math.PI * t) ** .75;
      vertices.push(a * width * .5 * envelope, length * t, .028 * t * t + width * .14 * (1 - a * a) * envelope); uv.push(u, t);
      if (row < rows && col < columns) { const k = row * (columns + 1) + col; indices.push(k, k + 1, k + columns + 1, k + 1, k + columns + 2, k + columns + 1); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    const colors = new Uint8Array(vertices.length); colors.fill(255);
    geometry.setAttribute("color", new THREE.Uint8BufferAttribute(colors, 3, true));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, foliage); mesh.position.y = narrow ? .025 : .09 + i * .011;
    mesh.rotation.set(narrow ? .22 : i < 2 ? 1.04 : .55, i < 2 ? i * Math.PI : i * 2.399963, .04 * Math.sin(i));
    mesh.userData = { plantPart: "leaf", growthOwnedGeometry: true, growthOwnedMaterial: !leafMaterial, sharedPlantResources: false, sharedPlantMaterials: !!leafMaterial };
    root.add(mesh);
  }
  return root;
}

// Returned previews share mature assets; only seedling geometry/materials are owned.
export function createPlantGrowthPreview(template: THREE.Group, crop: string, phase: PlantGrowthPhase, mobile = false) {
  const root = phase === "seedling" ? seedling(template, crop, mobile) : template.clone(true);
  root.traverse(node => { if (node instanceof THREE.Mesh && !node.userData.plantPart) node.userData.plantPart = organ(node); });
  if (phase === "leafy" || phase === "flowering") {
    const remove: THREE.Object3D[] = [];
    root.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      const part = organ(node);
      if (part === "fruit" || phase === "leafy" && part === "flower") remove.push(node);
    });
    remove.forEach(node => node.removeFromParent());
  }
  if (phase !== "mature") {
    const bounds = new THREE.Box3().setFromObject(root);
    if (!bounds.isEmpty()) root.position.y -= bounds.min.y;
  }
  root.userData.growthPhase = phase;
  return root;
}

export function releasePlantGrowthPreview(root: THREE.Group) {
  const materials = new Set<THREE.Material>();
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    if (node.userData.growthOwnedGeometry) node.geometry.dispose();
    if (node.userData.growthOwnedMaterial) for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  for (const material of materials) material.dispose();
  root.removeFromParent();
}
