import * as THREE from "three";
const clocks = new WeakMap();
const originals = new WeakMap();
const declarations = `
uniform float gardenBreezeTime;
uniform float gardenBreezeStrength;
uniform mat4 gardenBreezeLocal;
uniform mat4 gardenBreezeInverse;
vec3 gardenBend(vec3 vertex) {
  vec3 p = (gardenBreezeLocal * vec4(vertex, 1.0)).xyz;
  float phase = 0.0;
  #ifdef USE_INSTANCING
    vec3 anchor = (instanceMatrix * gardenBreezeInverse * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    phase = anchor.x * 1.7 + anchor.z * .8;
  #endif
  float height = clamp(p.y, 0.0, 2.0);
  float wave = sin(gardenBreezeTime * 1.3 + p.y * .8 + phase) * .75
    + sin(gardenBreezeTime * 2.1 + p.y * 1.7 + phase) * .25;
  p.x += wave * height * height * .008 * gardenBreezeStrength;
  p.z += sin(gardenBreezeTime * 1.1 + p.y) * height * height * .004 * gardenBreezeStrength;
  return (gardenBreezeInverse * vec4(p, 1.0)).xyz;
}`;
export function updatePlantBreeze(root, seconds, enabled) {
    let clock = clocks.get(root);
    if (!clock) {
        clock = { time: { value: 0 }, strength: { value: 0 } };
        clocks.set(root, clock);
    }
    const { time, strength } = clock;
    time.value = seconds;
    strength.value = enabled ? 1 : 0;
    if (!enabled)
        return;
    root.updateMatrixWorld(true);
    root.traverse(node => {
        if (!(node instanceof THREE.Mesh) || originals.has(node) || !node.userData.plantPart && !node.userData.sharedTomatoResources)
            return;
        const original = node.material;
        const local = node.userData.breezeLocal ? new THREE.Matrix4().fromArray(node.userData.breezeLocal) : node.matrixWorld.clone();
        const inverse = local.clone().invert();
        const patch = (material) => {
            material.onBeforeCompile = shader => {
                Object.assign(shader.uniforms, { gardenBreezeTime: time, gardenBreezeStrength: strength, gardenBreezeLocal: { value: local }, gardenBreezeInverse: { value: inverse } });
                shader.vertexShader = declarations + "\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed = gardenBend(transformed);");
            };
            material.customProgramCacheKey = () => "garden-breeze-v1";
            return material;
        };
        originals.set(node, { material: original, culled: node.frustumCulled });
        node.material = Array.isArray(original) ? original.map(material => patch(material.clone())) : patch(original.clone());
        node.customDepthMaterial = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }));
        // Deformation is centimetres at most; keep conservative bounds for frustum culling.
        node.frustumCulled = false;
    });
}
export function releasePlantBreeze(root) {
    root.traverse(node => {
        if (!(node instanceof THREE.Mesh) || !originals.has(node))
            return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material])
            material.dispose();
        node.customDepthMaterial?.dispose();
        node.customDepthMaterial = undefined;
        const original = originals.get(node);
        node.material = original.material;
        node.frustumCulled = original.culled;
        originals.delete(node);
    });
}
