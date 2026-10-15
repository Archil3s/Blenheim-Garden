import * as THREE from "three";
import type { Garden3DEditor } from "./use-garden-3d-editor";
import { accessIssues, blenheimSun, designFootprints, footprintCorners, shadowFootprints } from "@/lib/garden/garden-design";
import { areaPlants, rowPlants } from "@/lib/garden/plan-editing";
import { gardenDimensions } from "@/lib/garden/garden-dimensions";
import { surfaceAt } from "@/lib/garden/planting-surfaces";

type Runtime = { scene: THREE.Scene; renderer: THREE.WebGLRenderer; mobile: boolean; needsRender?: boolean };
export function updateGardenDesignOverlay(runtime: Runtime, editor: Garden3DEditor) {
  const stamp = JSON.stringify([editor.displayPlan, editor.accessVisible, editor.spacingVisible, editor.sunPreview, editor.comparisonPlan]);
  const previous = runtime.scene.getObjectByName("garden-design-overlays");
  if (previous?.userData.stamp === stamp) return;
  if (previous) { previous.traverse((o) => { if (o instanceof THREE.Mesh || o instanceof THREE.Line) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); } }); previous.removeFromParent(); }
  const root = new THREE.Group(); root.name = "garden-design-overlays"; root.userData.stamp = stamp; runtime.scene.add(root);
  const line = (points: { x: number; y: number }[], color: number, height = .06) => {
    const mesh = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x / 100 - 4.5, height, p.y / 100 - 5.4))), new THREE.LineBasicMaterial({ color, depthTest: false })); mesh.renderOrder = 60; root.add(mesh);
  };
  if (editor.accessVisible) for (const issue of accessIssues(editor.displayPlan)) {
    if (issue.from && issue.to) { line([issue.from, issue.to], 0xffc44d); for (const p of [issue.from, issue.to]) line([{ x: p.x - 10, y: p.y - 10 }, { x: p.x + 10, y: p.y + 10 }], 0xffc44d); }
    else { const f = designFootprints(editor.displayPlan).find((f) => f.id === issue.id); if (f) { const c = footprintCorners(f); line([...c, c[0]], 0xffc44d, f.height / 100 + .07); } }
  }
  let rings = 0;
  if (editor.spacingVisible) for (const group of [...editor.displayPlan.plantingAreas.map((a) => ({ spacing: a.spacingCm, points: areaPlants(editor.displayPlan, a) })), ...editor.displayPlan.rows.map((r) => ({ spacing: r.spacingCm, points: rowPlants(r) }))]) {
    const circle = new THREE.InstancedMesh(new THREE.RingGeometry(group.spacing / 200 - .007, group.spacing / 200 + .007, 24), new THREE.MeshBasicMaterial({ color: 0xc8f0ab, side: THREE.DoubleSide, transparent: true, opacity: .6, depthTest: false }), group.points.length);
    const dummy = new THREE.Object3D(); dummy.rotation.x = -Math.PI / 2;
    group.points.forEach((p, index) => { dummy.position.set(p.x / 100 - 4.5, (surfaceAt(editor.displayPlan, p)?.height ?? .01) + .025, p.y / 100 - 5.4); dummy.updateMatrix(); circle.setMatrixAt(index, dummy.matrix); rings++; });
    circle.instanceMatrix.needsUpdate = true; root.add(circle);
  }
  if (editor.comparisonPlan) for (const f of designFootprints(editor.comparisonPlan, true)) { const c = footprintCorners(f); line([...c, c[0]], 0x70c3ff, f.height / 100 + .1); }
  const sunLight = runtime.scene.children.find((o): o is THREE.DirectionalLight => o instanceof THREE.DirectionalLight);
  const dims = gardenDimensions(editor.displayPlan);
  if (sunLight) {
    if (editor.sunPreview.enabled) {
      const sun = blenheimSun(editor.sunPreview.date, editor.sunPreview.hour, editor.displayPlan.designSettings?.northDeg ?? 0);
      const center = new THREE.Vector3(dims.width / 200 - 4.5, 0, dims.height / 200 - 5.4);
      sunLight.target.position.copy(center); if (!sunLight.target.parent) runtime.scene.add(sunLight.target);
      sunLight.position.copy(center).add(new THREE.Vector3(sun.x * 30, Math.max(.2, sun.height * 30), sun.y * 30)); sunLight.intensity = sun.altitude > 0 ? runtime.mobile ? 1.75 : 2.55 : .15;
      const bound = Math.max(dims.width, dims.height) / 100; sunLight.shadow.camera.left = -bound; sunLight.shadow.camera.right = bound; sunLight.shadow.camera.top = bound; sunLight.shadow.camera.bottom = -bound; sunLight.shadow.camera.updateProjectionMatrix();
      for (const { footprint: f, delta } of shadowFootprints(editor.displayPlan, editor.sunPreview.date, editor.sunPreview.hour)) {
        const corners = footprintCorners(f), points = [...corners, ...corners.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y }))];
        const hull = convexHull(points), shape = new THREE.Shape(hull.map((p) => new THREE.Vector2(p.x / 100 - 4.5, -(p.y / 100 - 5.4))));
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0x384b77, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false })); mesh.rotation.x = -Math.PI / 2; mesh.position.y = .008; root.add(mesh);
      }
      const bearing = (editor.displayPlan.designSettings?.northDeg ?? 0) * Math.PI / 180;
      line([{ x: dims.width / 2, y: 0 }, { x: dims.width / 2 + Math.sin(bearing) * 100, y: -Math.cos(bearing) * 100 }], 0xfff4cb);
      runtime.renderer.domElement.dataset.sunElevation = sun.altitude.toFixed(2);
    } else { sunLight.position.set(-7.5, 11.5, 6.5); sunLight.target.position.set(0, 0, 0); sunLight.intensity = runtime.mobile ? 1.75 : 2.55; delete runtime.renderer.domElement.dataset.sunElevation; }
  }
  runtime.renderer.domElement.dataset.accessIssues = editor.accessVisible ? String(accessIssues(editor.displayPlan).length) : "0";
  runtime.renderer.domElement.dataset.spacingRings = String(rings);
  runtime.renderer.domElement.dataset.comparison = String(!!editor.comparisonPlan);
  runtime.needsRender = true;
}
function convexHull(points: { x: number; y: number }[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y), cross = (o: typeof points[number], a: typeof o, b: typeof o) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: typeof points = [], upper: typeof points = [];
  for (const p of sorted) { while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...sorted].reverse()) { while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop(); upper.push(p); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
