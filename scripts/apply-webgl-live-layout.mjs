import fs from "node:fs";

const file = "components/garden-webgl.tsx";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing ${label}`);
  source = source.replace(needle, replacement);
}

replaceOnce(
`type Runtime = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  sun: THREE.DirectionalLight;
};`,
`type Runtime = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  sun: THREE.DirectionalLight;
  scene: THREE.Scene;
  content: THREE.Group;
};`,
"Runtime type",
);

for (const name of ["addBed", "addPath", "addTrellis", "addTree", "addPlantingArea", "addRow"]) {
  source = source.replace(`function ${name}(scene: THREE.Scene`, `function ${name}(scene: THREE.Object3D`);
}
source = source.replace("function disposeScene(scene: THREE.Scene)", "function disposeScene(scene: THREE.Object3D)");

const disposeMarker = "function disposeScene(scene: THREE.Object3D) {";
if (!source.includes("function addFixedGardenFeatures(")) {
  const helpers = `function addFixedGardenFeatures(scene: THREE.Object3D) {
  // These two measured overlays are still hard-coded in the 2D planner rather than PlannerPlan.
  // Mirror their exact 2D percentages here so the garden footprint stays visually consistent.
  const berry = {
    x: GARDEN_WIDTH_CM * 0.07,
    y: GARDEN_HEIGHT_CM * 0.028,
    w: GARDEN_WIDTH_CM * 0.86,
    h: GARDEN_HEIGHT_CM * 0.085,
  };
  const berryBed = new THREE.Mesh(
    new THREE.BoxGeometry(berry.w / 100, 0.055, berry.h / 100),
    new THREE.MeshStandardMaterial({ color: 0x718b5d, roughness: 1, transparent: true, opacity: 0.72 }),
  );
  berryBed.position.set(worldX(berry.x + berry.w / 2), 0.035, worldZ(berry.y + berry.h / 2));
  berryBed.receiveShadow = true;
  inspectable(berryBed, {
    title: "Berry / cane strip",
    subtitle: "Fixed garden feature",
    lines: [{ label: "Size", value: `${(berry.w / 100).toFixed(1)} × ${(berry.h / 100).toFixed(1)} m` }],
  });
  scene.add(berryBed);

  const caneCrops = ["Raspberry", "Raspberry", "Raspberry", "Raspberry"];
  caneCrops.forEach((crop, index) => {
    const plant = createPlant(crop, 0.76);
    const t = (index + 1) / (caneCrops.length + 1);
    plant.position.set(worldX(berry.x + berry.w * t), 0.12, worldZ(berry.y + berry.h / 2));
    inspectable(plant, {
      title: index === 3 ? "Blackberry" : "Raspberry",
      subtitle: "Berry / cane strip",
      lines: [],
    });
    scene.add(plant);
  });

  const north = {
    x: GARDEN_WIDTH_CM * 0.12,
    y: GARDEN_HEIGHT_CM * 0.12,
    w: GARDEN_WIDTH_CM * 0.34,
    h: GARDEN_HEIGHT_CM * 0.30,
  };
  const material = new THREE.MeshStandardMaterial({ color: 0x8e775e, roughness: 0.95, transparent: true, opacity: 0.7 });
  const x = worldX(north.x + north.w / 2);
  const z = worldZ(north.y + north.h / 2);
  const w = north.w / 100;
  const d = north.h / 100;
  const thickness = 0.025;
  const addRail = (rw, rd, rx, rz) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.025, rd), material);
    rail.position.set(rx, 0.035, rz);
    scene.add(rail);
  };
  addRail(w, thickness, x, z - d / 2);
  addRail(w, thickness, x, z + d / 2);
  addRail(thickness, d, x - w / 2, z);
  addRail(thickness, d, x + w / 2, z);
}

function addTextLabel(scene: THREE.Object3D, object: Extract<PlannerPlan["objects"][number], { type: "text" }>) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.roundRect(8, 22, 496, 84, 18);
  context.fill();
  context.fillStyle = "#344a41";
  context.font = "700 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(object.text, 256, 64, 470);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  const scale = Math.max(0.55, object.fontSize / 13);
  sprite.scale.set(2.4 * scale, 0.6 * scale, 1);
  sprite.position.set(worldX(object.x), 0.42, worldZ(object.y));
  inspectable(sprite, { title: object.text, subtitle: "Garden label", lines: [] });
  scene.add(sprite);
}

`;
  source = source.replace(disposeMarker, helpers + disposeMarker);
}

const startMarker = `  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !plan) return;`;
const endMarker = `

  useEffect(() => {
    const sun = runtimeRef.current?.sun;`;
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Could not locate WebGL renderer effect");

const newEffects = `  // Create the WebGL renderer once. Live plan edits update only the scene content group,
  // preserving the camera, controls and GPU context while the user drags in the 2D planner.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce5df);
    scene.fog = new THREE.Fog(0xdce5df, 18, 30);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(8.2, 9.2, 11.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 3.5;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.48;

    scene.add(new THREE.HemisphereLight(0xf6fbf7, 0x786a56, 1.35));
    const sun = new THREE.DirectionalLight(0xfff4d8, 2.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 13.2),
      new THREE.MeshStandardMaterial({ color: 0x8da56f, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(10.8, 54, 0x93a29a, 0xb9c4bd);
    grid.position.y = 0.005;
    (grid.material as THREE.Material).opacity = 0.28;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const content = new THREE.Group();
    scene.add(content);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          if (object.userData.inspect) {
            setInspector(object.userData.inspect as InspectorItem);
            return;
          }
          object = object.parent;
        }
      }
    };
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    runtimeRef.current = { camera, controls, renderer, sun, scene, content };
    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      runtimeRef.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !plan) return;
    const content = runtime.content;
    disposeScene(content);
    content.clear();

    addFixedGardenFeatures(content);
    for (const bed of plan.beds) addBed(content, bed, viewMode, activeByBed.get(bed.id));
    for (const object of plan.objects) {
      if (object.type === "path") addPath(content, object);
      if (object.type === "trellis") addTrellis(content, object);
      if (object.type === "tree") addTree(content, object);
      if (object.type === "text") addTextLabel(content, object);
    }
    for (const area of plan.plantingAreas) {
      const bed = plan.beds.find((candidate) => candidate.id === area.bedId);
      if (bed) addPlantingArea(content, bed, area);
    }
    for (const row of plan.rows) addRow(content, row);
  }, [plan, viewMode, activeByBed]);`;

source = source.slice(0, start) + newEffects + source.slice(end);

source = source.replace(
  "Mirrors the exact in-memory 2D design, including unsaved moves and resizing. Save still controls D1 persistence.",
  "Mirrors the live 2D geometry without resetting your 3D camera, including the fixed berry/cane and north-zone layout. Save still controls D1 persistence.",
);

fs.writeFileSync(file, source);

const contextFile = "PROJECT_CONTEXT.md";
let context = fs.readFileSync(contextFile, "utf8");
if (!context.includes("Persistent WebGL runtime")) {
  context += `\n\n### Persistent WebGL runtime\n\nLive planner updates now rebuild only the WebGL garden-content group rather than recreating the renderer/camera. This preserves the user's 3D viewpoint during 2D dragging and avoids repeated WebGL-context creation. The hard-coded 2D berry/cane strip and north-zone outline are mirrored with the same percentage geometry, and text layout objects render as WebGL sprites.\n`;
  fs.writeFileSync(contextFile, context);
}

for (const path of ["scripts/apply-webgl-live-layout.mjs", ".github/workflows/apply-webgl-live-layout.yml"]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
