"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TOMATO_GROWTH_STAGES, tomatoAssetPath, tomatoLodForDevice, type TomatoStage } from "@/lib/3d/tomato-assets";
import type { EnvironmentMode } from "@/components/garden-showcase-environment-v2";
import {
  createShowcaseBed,
  disposeShowcaseBed,
  SHOWCASE_TOMATO_PLACEMENTS,
  type ShowcaseMode,
} from "@/components/garden-showcase-model";

export function GardenShowcase() {
  const [mode, setMode] = useState<ShowcaseMode>("asset");
  const [environment, setEnvironment] = useState<EnvironmentMode>("v2");
  const [growthStage, setGrowthStage] = useState<TomatoStage>("fruiting");
  const [assetStatus, setAssetStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sceneError, setSceneError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const resetRef = useRef<() => void>(() => {});
  const inspectRef = useRef<() => void>(() => {});

  useEffect(() => {
    const parent = stageRef.current;
    if (!parent) return;
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: mobile ? "low-power" : "high-performance",
      });
    } catch {
      queueMicrotask(() => setSceneError("WebGL is not available on this device or browser. The model comparison requires hardware-accelerated 3D."));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-label", "Interactive raised bed model comparison");
    renderer.domElement.setAttribute("role", "img");
    parent.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const sky = environment === "v2" ? "#dfe8dc" : "#e8ede5";
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, environment === "v2" ? 13 : 10, environment === "v2" ? 28 : 20);

    const camera = new THREE.PerspectiveCamera(45, 1, .08, 50);
    const home = new THREE.Vector3(4.35, 3.35, 6.12);
    const target = new THREE.Vector3(0, .68, 0);
    camera.position.copy(home);
    camera.lookAt(target);

    const hemi = new THREE.HemisphereLight("#e0ecff", "#b4a087", 1.8);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#fff0cc", 2.85);
    sun.position.set(-3.5, 8, 4.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 22;
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -.00012;
    sun.shadow.normalBias = .022;
    scene.add(sun, sun.target);

    const cropBed = createShowcaseBed(mode, mobile, environment);
    scene.add(cropBed);

    let disposed = false;
    // Only GLB mode requests assets. This is a network-loaded glTF scene, never
    // a disguised runtime plant generator. Keep the original modes unchanged.
    if (mode === "asset") {
      const lod = tomatoLodForDevice(mobile);
      const url = tomatoAssetPath(growthStage, lod);
      const loader = new GLTFLoader();
      void loader.loadAsync(url).then(({ scene: tomato }) => {
        if (disposed) {
          tomato.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();
              material.dispose();
            }
          });
          return;
        }
        for (const point of SHOWCASE_TOMATO_PLACEMENTS) {
          const instance = tomato.clone(true);
          instance.position.set(point.x, .31, point.z);
          instance.rotation.y = point.seed * .21;
          instance.scale.setScalar(point.seed === 122 ? .93 : 1.03);
          instance.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          cropBed.add(instance);
        }
        parent.dataset.modelReady = growthStage;
        parent.dataset.modelLod = String(lod);
        queueMicrotask(() => setAssetStatus("ready"));
      }).catch((error: unknown) => {
        if (disposed) return;
        console.error("Tomato GLB load failed", error);
        queueMicrotask(() => {
          setAssetStatus("error");
          setSceneError("The tomato GLB could not be loaded. Check that the asset generator ran before the build.");
        });
      });
    }


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.enablePan = false;
    controls.minDistance = .55;
    controls.maxDistance = 11.5;
    controls.minPolarAngle = .16;
    controls.maxPolarAngle = 1.49;
    controls.target.copy(target);
    controls.update();
    resetRef.current = () => {
      camera.position.copy(home);
      controls.target.copy(target);
      controls.update();
    };
    inspectRef.current = () => {
      const height = growthStage === "seedling" ? .2 : growthStage === "vegetative" ? .77 : 1.35;
      const centre = new THREE.Vector3(-.43, .31 + height * .57, -.35);
      const offset = growthStage === "seedling"
        ? new THREE.Vector3(.42, .34, .63)
        : new THREE.Vector3(.91, .62, 1.05);
      camera.position.copy(centre).add(offset);
      controls.target.copy(centre);
      controls.update();
    };

    const resize = () => {
      if (!parent.isConnected) return;
      const width = Math.max(1, parent.clientWidth);
      const height = Math.max(1, parent.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();

    let raf = 0;
    let firstFrame = true;
    const frame = () => {
      controls.update();
      renderer.render(scene, camera);
      if (firstFrame) {
        parent.dataset.sceneReady = mode;
        parent.dataset.environmentReady = environment;
        firstFrame = false;
      }
      raf = requestAnimationFrame(frame);
    };
    frame();

    const canvas = renderer.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      queueMicrotask(() => setSceneError("The browser lost its WebGL context. Refresh this showcase to restart 3D."));
      cancelAnimationFrame(raf);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      resetRef.current = () => {};
      inspectRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener("webglcontextlost", onLost);
      disposeShowcaseBed(cropBed, mode);
      renderer.dispose();
      if (canvas.parentElement === parent) parent.removeChild(canvas);
      delete parent.dataset.sceneReady;
      delete parent.dataset.environmentReady;
      delete parent.dataset.modelReady;
      delete parent.dataset.modelLod;
    };
  }, [mode, growthStage, environment]);

  return (
    <main className="gs-page">
      <header className="gs-header">
        <Link className="gs-brand" href="/" aria-label="Blenheim Garden homepage"><span>bg.</span> BLENHEIM GARDEN</Link>
        <nav aria-label="Showcase navigation">
          <Link href="/3d">Live 3D garden</Link>
          <Link href="/planner">Garden planner</Link>
          <Link href="/">Overview</Link>
        </nav>
      </header>
      <div className="gs-wrap">
        <div className="gs-eyebrow">3D ENVIRONMENT STUDY · EDITION 02 / MARLBOROUGH</div>
        <div className="gs-heading">
          <div>
            <h1>One bed.<br/><em>Three ways to grow.</em></h1>
            <p>Compare the same 2 × 4 m raised bed in two environments. The new scene adds textured terrain, garden paths, detailed timber and surrounding vegetation. Keep the existing crop-model modes for reference.</p>
          </div>
          <div className="gs-project-note"><span>EXPERIMENT</span><strong>Not connected to saved plans</strong><p>This prototype cannot edit or overwrite your garden.</p></div>
        </div>

        <div className="gs-workspace">
          <section className="gs-viewer" aria-label="3D model viewer">
            <div className="gs-viewer-bar">
              <span>BED STUDY / 01</span>
              <div className="gs-mode-switch" role="group" aria-label="Rendering style">
                <button type="button" aria-pressed={mode === "classic"} onClick={() => {setSceneError(null); setMode("classic");}}>Current low-poly</button>
                <button type="button" aria-pressed={mode === "botanical"} onClick={() => {setSceneError(null); setMode("botanical");}}>Procedural study</button>
                <button type="button" aria-pressed={mode === "asset"} onClick={() => {setSceneError(null); setAssetStatus("loading"); setMode("asset");}}>Real GLB tomato</button>
              </div>
            </div>
            <div className="gs-environment-switch" role="group" aria-label="Garden environment">
              <div><strong>THE SURROUNDINGS</strong><span>Compare the same plants, bed dimensions and viewpoint.</span></div>
              <div className="gs-environment-actions">
                <button type="button" aria-pressed={environment === "current"} onClick={() => {setSceneError(null); setEnvironment("current"); setAssetStatus("loading");}}>Existing environment</button>
                <button type="button" aria-pressed={environment === "v2"} onClick={() => {setSceneError(null); setEnvironment("v2"); setAssetStatus("loading");}}>Environment V2</button>
              </div>
            </div>
            {mode === "asset" && <div className="gs-stage-picker">
              <label htmlFor="gs-tomato-stage">Tomato growth stage</label>
              <select id="gs-tomato-stage" value={growthStage} onChange={(event) => {setSceneError(null); setAssetStatus("loading"); setGrowthStage(event.target.value as TomatoStage);}}>
                {TOMATO_GROWTH_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
              </select>
              <span role="status">{assetStatus === "loading" ? "Loading GLB…" : assetStatus === "ready" ? "3D asset loaded" : "Asset unavailable"}</span>
            </div>}
            <div className="gs-stage" ref={stageRef} data-mode={mode} data-environment={environment}>
              {sceneError && <div className="gs-error" role="alert">{sceneError}</div>}
              <div className="gs-scene-caption" aria-hidden="true">2 × 4 M · TOMATO / PEA / STRAWBERRY</div>
            </div>
            <div className="gs-stage-footer">
              <span>Orbit the garden · Scroll or pinch to zoom</span>
              <div className="gs-camera-actions">
                {mode === "asset" && <button type="button" onClick={() => inspectRef.current()}>Inspect tomato close-up <span aria-hidden="true">↗</span></button>}
                <button type="button" onClick={() => resetRef.current()}>Reset camera <span aria-hidden="true">↺</span></button>
              </div>
            </div>
          </section>
          <aside className="gs-notes" aria-label="About the comparison">
            <div className="gs-notes-kicker">ENVIRONMENT REVIEW / 01–04</div>
            <div className="gs-environment-description">
              <strong>{environment === "v2" ? "ENVIRONMENT V2 — ACTIVE" : "EXISTING ENVIRONMENT — BASELINE"}</strong>
              <p>{environment === "v2"
                ? "New procedural terrain, gravel paths, timber grain, soil and mulch, drip irrigation, planted borders, a timber fence and greenhouse context. Instanced ground cover and hedge foliage keep the scene manageable on mobile."
                : "Original flat ground, simple stone paths and raised bed. Switch to Environment V2 above to compare the surroundings without changing plant-model type."}</p>
            </div>
            <h2>{mode === "asset" ? "The first real asset." : mode === "botanical" ? "More plant, less polygon." : "Where we started."}</h2>
            <p>{mode === "asset"
              ? "The tomato plants are now loaded from actual generated .glb files with an embedded leaf atlas. Select seedling, vegetative or fruiting to load a different real 3D asset. This is an original starter model, not a photorealistic Blender asset yet."
              : mode === "botanical"
                ? "This is the earlier procedural browser-generated study, kept intact as our baseline for improvement."
                : "These are the application's original generated low-poly plants, shown under the same lighting and in the same bed."}</p>
            <div className="gs-species">
              <div><span>01</span><div><strong>Tomato · Sungold</strong><p>Compound foliage, trusses, fruit shoulders and individual calyxes</p></div></div>
              <div><span>02</span><div><strong>Climbing pea</strong><p>Paired leaflets, spiralling tendrils and hanging pods on wire support</p></div></div>
              <div><span>03</span><div><strong>Strawberry</strong><p>Low crown, three-part leaves, drooping berries and surface seeds</p></div></div>
            </div>
            <div className="gs-material-note">
              <span>RENDERING NOTES</span>
              <p>{mode === "asset" ? "The starter tomato is a genuine glTF 2.0 GLB file, created at build time in three growth stages and three LODs. Phone view loads LOD1. Better scanned or Blender-authored textures and geometry are the next milestone." : "Procedural leaves, rough timber grain, soil particles and warm directional shadows; no external postprocessing package."}</p>
            </div>
          </aside>
        </div>
        <div className="gs-bottom">
          <div><span>WHAT TO JUDGE</span><h2>Do the surroundings feel like a real garden?</h2></div>
          <p>Compare surface detail, shadows, natural planting density, gravel edges, timber and background context. This uses original procedural textures and instanced vegetation—not photo-scanned materials or PlantGen-exported GLBs yet. Our target is still a convincing, editable landscape visualization.</p>
        </div>
        <footer className="gs-footer">
          <Link href="/3d">Return to live 3D garden ↗</Link>
          <span>ENVIRONMENT V2 STUDY · ISOLATED FROM SAVED GARDENS</span>
        </footer>
      </div>
    </main>
  );
}
