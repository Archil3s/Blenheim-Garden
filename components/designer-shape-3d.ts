import * as THREE from "three";
import type { PlannerShape } from "@/lib/garden/planner-plan";

export function addDesignerShape3D(parent: THREE.Group, shape: PlannerShape) {
  const width = shape.widthCm / 100, height = shape.heightCm / 100;
  const points: THREE.Vector2[] = shape.shape === "ellipse"
    ? Array.from({ length: 48 }, (_, index) => { const angle = index / 48 * Math.PI * 2; return new THREE.Vector2(Math.cos(angle) * width / 2, Math.sin(angle) * height / 2); })
    : shape.shape === "triangle"
      ? [new THREE.Vector2(0, -height / 2), new THREE.Vector2(width / 2, height / 2), new THREE.Vector2(-width / 2, height / 2)]
      : shape.shape === "line"
        ? [new THREE.Vector2(-width / 2, 0), new THREE.Vector2(width / 2, 0)]
        : [new THREE.Vector2(-width / 2, -height / 2), new THREE.Vector2(width / 2, -height / 2), new THREE.Vector2(width / 2, height / 2), new THREE.Vector2(-width / 2, height / 2)];
  const root = new THREE.Group();
  root.position.set(shape.x / 100 - 4.5, shape.behind ? 0.025 : 0.04, shape.y / 100 - 5.4);
  root.rotation.y = -shape.rotationDeg * Math.PI / 180;
  if (shape.fill !== "none" && shape.shape !== "line") {
    const polygon = new THREE.Shape(points);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(polygon), new THREE.MeshBasicMaterial({ color: shape.fill, side: THREE.DoubleSide, transparent: true, opacity: .7, depthWrite: false }));
    mesh.rotation.x = Math.PI / 2;
    root.add(mesh);
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, .004, point.y)));
  const lineMaterial = new THREE.LineBasicMaterial({ color: shape.stroke });
  root.add(shape.shape === "line" ? new THREE.Line(geometry, lineMaterial) : new THREE.LineLoop(geometry, lineMaterial));
  root.traverse((object) => { object.userData.planSelection = { kind: "object", id: shape.id }; });
  parent.add(root);
}
