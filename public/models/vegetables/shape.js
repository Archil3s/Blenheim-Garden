import * as THREE from "three";
const variants = new WeakMap();
export function plantShapeIndex(seed) {
    return Math.abs(Math.floor(seed)) % 3;
}
// One continuous deformation keeps fruit, pedicels and branches connected.
export function createPlantShape(template, shape) {
    const root = template.clone(true);
    root.userData.plantShape = shape;
    if (!shape)
        return root;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const height = Math.max(.05, box.max.y - box.min.y);
    root.traverse(node => {
        if (!(node instanceof THREE.Mesh))
            return;
        const geometry = node.geometry.clone(), positions = geometry.getAttribute("position");
        const inverse = node.matrixWorld.clone().invert(), p = new THREE.Vector3();
        for (let i = 0; i < positions.count; i++) {
            p.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
            const t = THREE.MathUtils.clamp((p.y - box.min.y) / height, 0, 1);
            const angle = (shape === 1 ? .28 : -.24) * t * t, x = p.x, z = p.z;
            const spread = 1 + (shape === 1 ? .12 : -.09) * t;
            p.x = (x * Math.cos(angle) - z * Math.sin(angle)) * spread + height * .035 * t * t;
            p.z = (x * Math.sin(angle) + z * Math.cos(angle)) * (2 - spread) - height * .025 * t * t;
            p.y += height * (shape === 1 ? -.035 : .045) * t * t;
            p.applyMatrix4(inverse);
            positions.setXYZ(i, p.x, p.y, p.z);
        }
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        node.geometry = geometry;
        node.userData.shapeOwnedGeometry = true;
    });
    return root;
}
export function sharedPlantShape(template, seed) {
    const shape = plantShapeIndex(seed);
    if (!shape)
        return template;
    let cached = variants.get(template);
    if (!cached) {
        cached = new Map();
        variants.set(template, cached);
    }
    let result = cached.get(shape);
    if (!result) {
        result = createPlantShape(template, shape);
        cached.set(shape, result);
    }
    return result;
}
export function releasePlantShape(root) {
    root.traverse(node => {
        if (node instanceof THREE.Mesh && node.userData.shapeOwnedGeometry)
            node.geometry.dispose();
    });
    root.removeFromParent();
}
