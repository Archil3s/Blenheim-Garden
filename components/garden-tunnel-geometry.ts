import * as THREE from "three";

class UprightArch extends THREE.Curve<THREE.Vector3> {
  constructor(private width: number, private height: number, private tube: number) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = Math.PI * t;
    return target.set(
      (this.width / 2 - this.tube) * Math.cos(angle),
      this.tube + (this.height - 2 * this.tube) * Math.sin(angle),
      0,
    );
  }
}

export function tunnelHoopGeometry(width: number, height: number, tube: number, detailed: boolean) {
  return new THREE.TubeGeometry(new UprightArch(width, height, tube), detailed ? 40 : 24, tube, detailed ? 8 : 6, false);
}

export function tunnelCoverGeometry(width: number, height: number, depth: number, detailed: boolean) {
  const segments = detailed ? 40 : 24;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let side = 0; side < 2; side += 1) {
    for (let i = 0; i <= segments; i += 1) {
      const angle = Math.PI * i / segments;
      positions.push(width / 2 * Math.cos(angle), height * Math.sin(angle), (side - .5) * depth);
      uvs.push(i / segments, side);
    }
  }
  for (let i = 0; i < segments; i += 1) {
    const back = i + segments + 1;
    indices.push(i, back, i + 1, i + 1, back, back + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
