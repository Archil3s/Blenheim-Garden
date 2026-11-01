"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createShowcaseBed,
  disposeShowcaseBed,
  type ShowcaseMode,
} from "@/components/garden-showcase-model";

export function GardenShowcase() {
  const [mode, setMode] = useState<ShowcaseMode>("botanical");
  const [sceneError, setSceneError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const resetRef = useRef<() => void>(() => {});

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
    scene.background = new THREE.Color("#e8ede5");
    scene.fog = new THREE.Fog("#e8ede5", 10, 20);

    const camera = new THREE.PerspectiveCamera(45, 1, .08, 50);
    const home = new THREE.Vector3(3.45, 2.8, 4.48);
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

    const cropBed = createShowcaseBed(mode, mobile);
    scene.add(cropBed);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.enablePan = false;
    controls.minDistance = 2.8;
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
      resetRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener("webglcontextlost", onLost);
      disposeShowcaseBed(cropBed, mode);
      renderer.dispose();
      if (canvas.parentElement === parent) parent.removeChild(canvas);
      delete parent.dataset.sceneReady;
    };
  }, [mode]);

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
        <div className="gs-eyebrow">3D MODEL STUDY · EDITION 01 / MARLBOROUGH</div>
        <div className="gs-heading">
          <div>
            <h1>One bed.<br/><em>Two ways to grow.</em></h1>
            <p>Compare the existing simplified models with a botanical prototype—same 2 × 4 m bed, planting arrangement, camera and light.</p>
          </div>
          <div className="gs-project-note"><span>EXPERIMENT</span><strong>Not connected to saved plans</strong><p>This prototype cannot edit or overwrite your garden.</p></div>
        </div>

        <div className="gs-workspace">
          <section className="gs-viewer" aria-label="3D model viewer">
            <div className="gs-viewer-bar">
              <span>BED STUDY / 01</span>
              <div className="gs-mode-switch" role="group" aria-label="Rendering style">
                <button type="button" aria-pressed={mode === "classic"} onClick={() => {setSceneError(null); setMode("classic");}}>Current low-poly</button>
                <button type="button" aria-pressed={mode === "botanical"} onClick={() => {setSceneError(null); setMode("botanical");}}>Botanical prototype</button>
              </div>
            </div>
            <div className="gs-stage" ref={stageRef} data-mode={mode}>
              {sceneError && <div className="gs-error" role="alert">{sceneError}</div>}
              <div className="gs-scene-caption" aria-hidden="true">2 × 4 M · TOMATO / PEA / STRAWBERRY</div>
            </div>
            <div className="gs-stage-footer">
              <span>Drag to orbit · Scroll or pinch to zoom</span>
              <button type="button" onClick={() => resetRef.current()}>Reset camera <span aria-hidden="true">↺</span></button>
            </div>
          </section>
          <aside className="gs-notes" aria-label="About the comparison">
            <div className="gs-notes-kicker">LOOK CLOSELY / 01–03</div>
            <h2>{mode === "botanical" ? "More plant, less polygon." : "Where we started."}</h2>
            <p>{mode === "botanical"
              ? "This is the first standalone procedural study of plant structure, leaf textures and natural materials—not the finished photorealistic GLB library."
              : "These are the application's existing generated low-poly plant models, shown under the same lighting and in the same bed."}</p>
            <div className="gs-species">
              <div><span>01</span><div><strong>Tomato · Sungold</strong><p>Compound foliage, trusses, fruit shoulders and individual calyxes</p></div></div>
              <div><span>02</span><div><strong>Climbing pea</strong><p>Paired leaflets, spiralling tendrils and hanging pods on wire support</p></div></div>
              <div><span>03</span><div><strong>Strawberry</strong><p>Low crown, three-part leaves, drooping berries and surface seeds</p></div></div>
            </div>
            <div className="gs-material-note">
              <span>RENDERING NOTES</span>
              <p>Procedural leaf textures, subtle surface curvature, rough timber grain, soil particles and warm directional shadows. No downloaded GLB assets or external postprocessing package yet.</p>
            </div>
          </aside>
        </div>
        <div className="gs-bottom">
          <div><span>WHAT TO JUDGE</span><h2>Does it finally read as a real garden?</h2></div>
          <p>Compare the leaf silhouettes, fruit placement, trellis growth, soil and timber. At normal garden distance these should feel more organic; close-up realism still needs dedicated textured assets and further refinement.</p>
        </div>
        <footer className="gs-footer">
          <Link href="/3d">Return to live 3D garden ↗</Link>
          <span>ISOLATED RENDERING PROTOTYPE · NO PERSISTENT DATA</span>
        </footer>
      </div>
    </main>
  );
}
