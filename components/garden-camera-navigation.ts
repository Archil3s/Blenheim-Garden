import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Garden3DEditor } from "./use-garden-3d-editor";

export function installGardenCameraNavigation(camera: THREE.PerspectiveCamera, controls: OrbitControls, canvas: HTMLCanvasElement, getEditor: () => Garden3DEditor, invalidate: () => void) {
  const move = (x: number, y: number) => {
    const editor = getEditor();
    if (editor.cameraLocked) return;
    const forward = controls.target.clone().sub(camera.position); forward.y = 0;
    if (forward.lengthSq() < .0001) forward.set(0, 0, -1);
    forward.normalize(); const right = forward.clone().cross(new THREE.Vector3(0, 1, 0));
    const delta = right.multiplyScalar(x).addScaledVector(forward, y).multiplyScalar(Math.max(.15, camera.position.distanceTo(controls.target) * .07));
    camera.position.add(delta); controls.target.add(delta); controls.update(); invalidate();
  };
  const zoom = (closer: boolean) => {
    if (getEditor().cameraLocked) return;
    const offset = camera.position.clone().sub(controls.target), distance = THREE.MathUtils.clamp(offset.length() * (closer ? .8 : 1.25), controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(distance)); controls.update(); invalidate();
  };
  const action = (event: Event) => {
    const name = (event as CustomEvent<string>).detail;
    if (name === "pan" || name === "orbit") {
      controls.mouseButtons.LEFT = name === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
      controls.touches.ONE = name === "pan" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
      canvas.dataset.cameraGesture = name;
    } else if (name === "in" || name === "out") zoom(name === "in");
    else if (name === "left") move(-1, 0); else if (name === "right") move(1, 0);
    else if (name === "forward") move(0, 1); else if (name === "back") move(0, -1);
  };
  const key = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement)?.closest("input,textarea,select,dialog,[contenteditable=true]") || event.ctrlKey || event.metaKey || event.altKey || getEditor().interactionMode !== "navigate") return;
    const actions: Record<string, string> = { w: "forward", ArrowUp: "forward", s: "back", ArrowDown: "back", a: "left", ArrowLeft: "left", d: "right", ArrowRight: "right", "+": "in", "=": "in", "-": "out" };
    const name = actions[event.key] ?? actions[event.key.toLowerCase()];
    if (name) { event.preventDefault(); action(new CustomEvent("camera", { detail: name })); }
    else if (event.key === "Home") { event.preventDefault(); getEditor().fit(); }
    else if (event.key.toLowerCase() === "f") { event.preventDefault(); getEditor().focus(); }
  };
  canvas.dataset.cameraGesture = "orbit";
  canvas.addEventListener("garden-camera", action); window.addEventListener("keydown", key);
  return () => { canvas.removeEventListener("garden-camera", action); window.removeEventListener("keydown", key); };
}
