import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public/models/vegetables");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route("http://vegetables.local/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" });
    if (url.pathname.startsWith("/models/")) return route.fulfill({ contentType: "model/gltf-binary", body: fs.readFileSync(path.join(root, "public", url.pathname)) });
    let target;
    if (url.pathname === "/three") target = path.join(root, "node_modules/three/build/three.module.js");
    else if (url.pathname === "/three.core.js") target = path.join(root, "node_modules/three/build/three.core.js");
    else if (url.pathname.startsWith("/three/addons/")) target = path.join(root, "node_modules/three/examples/jsm", url.pathname.slice(14));
    else target = path.join(root, url.pathname.replace(/^\//, "").replace(/\.js$/, ".ts"));
    let code = fs.readFileSync(target, "utf8");
    if (target.endsWith(".ts")) code = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
    code = code.replace(/(["'])three\1/g, '"/three"').replace(/(["'])three\/addons\//g, "$1/three/addons/").replace(/(["'])@\//g, "$1/");
    code = code.replace(/(from\s+["'])([^"']+)(["'])/g, (all, a, b, c) => a + b + (!b.endsWith(".js") && b !== "/three" ? ".js" : "") + c);
    await route.fulfill({ contentType: "application/javascript", body: code });
  });
  await page.goto("http://vegetables.local/");
  const catalog = await page.evaluate(async () => {
    const THREE = await import("/three");
    const { GLTFExporter } = await import("/three/addons/exporters/GLTFExporter.js");
    const { GLTFLoader } = await import("/three/addons/loaders/GLTFLoader.js");
    const { mergeVertices } = await import("/three/addons/utils/BufferGeometryUtils.js");
    const { createDetailedVegetable } = await import("/components/garden-vegetable-geometry.js");
    const { vegetableModels } = await import("/lib/garden/vegetable-model-catalog.js");
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(512, 512); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4df, 0x416039, 2.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 3); sun.position.set(-3, 5, 4); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd3e9ff, .8); fill.position.set(3, 2, -3); scene.add(fill);
    const exporter = new GLTFExporter();
    window.exportVegetable = async (model, mobile) => {
      const plant = model.kind === "tomato" ? (await new GLTFLoader().loadAsync(mobile ? model.mobile : model.desktop)).scene : createDetailedVegetable(model, mobile);
      if (model.kind !== "tomato") plant.traverse(object => {
        if (!object.isMesh) return;
        const original = object.geometry;
        object.geometry = mergeVertices(original, .00001);
        original.dispose();
      });
      const box = new THREE.Box3().setFromObject(plant), size = box.getSize(new THREE.Vector3());
      let triangles = 0, meshes = 0, textured = 0;
      plant.traverse(object => {
        if (!object.isMesh) return;
        meshes++; triangles += (object.geometry.index?.count ?? object.geometry.getAttribute("position").count) / 3;
        if ((Array.isArray(object.material) ? object.material : [object.material]).some(m => m.map)) textured++;
        const positions = object.geometry.getAttribute("position").array;
        if (!Array.from(positions).every(Number.isFinite)) throw new Error("Nonfinite vertices: " + model.id);
      });
      if (box.isEmpty() || box.min.y < -.0001 || !triangles || !textured) throw new Error("Invalid plant: " + model.id);
      let encoded = null;
      if (model.kind !== "tomato") {
        const binary = await exporter.parseAsync(plant, { binary: true, maxTextureSize: 256 });
        const bytes = new Uint8Array(binary);
        let string = ""; for (let i = 0; i < bytes.length; i += 16384) string += String.fromCharCode(...bytes.subarray(i, i + 16384));
        encoded = btoa(string);
      }
      const center = box.getCenter(new THREE.Vector3()), span = Math.max(size.x, size.y, size.z) * 1.24;
      const camera = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, .01, 30);
      camera.position.copy(center).add(new THREE.Vector3(1.2, 1.1, 3).normalize().multiplyScalar(5)); camera.lookAt(center);
      scene.add(plant); renderer.render(scene, camera);
      const thumbnail = renderer.domElement.toDataURL("image/webp", .94);
      scene.remove(plant);
      plant.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
      return { encoded, thumbnail, triangles, meshes, textured, dimensions: [size.x, size.y, size.z] };
    };
    return vegetableModels;
  });
  const manifest = [];
  for (const model of catalog) {
    const stats = {};
    for (const mobile of [false, true]) {
      const result = await page.evaluate(({ model, mobile }) => window.exportVegetable(model, mobile), { model, mobile });
      const url = mobile ? model.mobile : model.desktop;
      if (result.encoded) fs.writeFileSync(path.join(root, "public", url), Buffer.from(result.encoded, "base64"));
      if (!mobile) fs.writeFileSync(path.join(output, model.id + ".webp"), Buffer.from(result.thumbnail.split(",")[1], "base64"));
      stats[mobile ? "mobile" : "desktop"] = { triangles: result.triangles, meshes: result.meshes, textured: result.textured, dimensions: result.dimensions, bytes: fs.statSync(path.join(root, "public", url)).size };
    }
    manifest.push({ ...model, thumbnail: `/models/vegetables/${model.id}.webp`, stats });
    console.log(model.id + " · " + stats.desktop.triangles + "/" + stats.mobile.triangles + " triangles");
  }
  fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Exported ${manifest.length} models covering ${new Set(manifest.map(m => m.crop)).size} vegetable types.`);
} finally {
  await browser.close();
}
