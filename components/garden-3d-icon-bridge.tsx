"use client";

import { useEffect } from "react";
import * as THREE from "three";
import {
  plantIconFor,
  plantIconUv,
} from "@/lib/garden/plant-icon-registry";

type InspectorItem = {
  title?: string;
  subtitle?: string;
  lines?: Array<{ label: string; value: string }>;
};

type RenderRecord = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
};

type IconGlobals = typeof globalThis & {
  __blenheimPlantIconRenderers?: Map<THREE.Scene, RenderRecord>;
  __blenheimPlantIconRenderPatched?: boolean;
};

const globals = globalThis as IconGlobals;
const renderers = globals.__blenheimPlantIconRenderers ?? new Map<THREE.Scene, RenderRecord>();
globals.__blenheimPlantIconRenderers = renderers;

if (!globals.__blenheimPlantIconRenderPatched) {
  const originalRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render = function patchedRender(scene: THREE.Object3D, camera: THREE.Camera) {
    if (scene instanceof THREE.Scene) renderers.set(scene, { renderer: this, camera });
    return originalRender.call(this, scene, camera);
  } as typeof THREE.WebGLRenderer.prototype.render;
  globals.__blenheimPlantIconRenderPatched = true;
}

function isPlantingRoot(object: THREE.Object3D): object is THREE.Group {
  if (!(object instanceof THREE.Group) || object.userData.selectionRoot !== object) return false;
  const inspect = object.userData.inspect as InspectorItem | undefined;
  return Boolean(inspect?.title && inspect.lines?.some((line) => line.label === "Pattern"));
}

function disposeIcon(sprite: THREE.Sprite) {
  const material = sprite.material;
  material.map?.dispose();
  material.dispose();
  sprite.removeFromParent();
}

function attachIcon(root: THREE.Group, onTextureReady: () => void) {
  const inspect = root.userData.inspect as InspectorItem | undefined;
  const icon = plantIconFor(inspect?.title, inspect?.subtitle);
  if (!icon) return false;

  const existing = root.children.find((child) => child.userData.gardenPlantIconSprite === true);
  if (existing instanceof THREE.Sprite && existing.userData.gardenPlantIconSlug === icon.slug) return false;
  if (existing instanceof THREE.Sprite) disposeIcon(existing);

  const plantGroups = root.children.filter((child): child is THREE.Group => child instanceof THREE.Group);
  let x = 0;
  let z = 0;

  if (plantGroups.length > 0) {
    for (const plant of plantGroups) {
      x += plant.position.x;
      z += plant.position.z;
    }
    x /= plantGroups.length;
    z /= plantGroups.length;
  } else {
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return false;
    const centre = box.getCenter(new THREE.Vector3());
    x = centre.x;
    z = centre.z;
  }

  const texture = new THREE.TextureLoader().load(icon.src, onTextureReady);
  const uv = plantIconUv(icon);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.repeat.set(uv.repeatX, uv.repeatY);
  texture.offset.set(uv.offsetX, uv.offsetY);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.025,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = `plant-icon:${icon.slug}`;
  sprite.position.set(x, 1.34, z);
  sprite.scale.set(0.62, 0.62, 1);
  sprite.renderOrder = 40;
  sprite.userData.gardenPlantIconSprite = true;
  sprite.userData.gardenPlantIconSrc = icon.src;
  sprite.userData.gardenPlantIconSlug = icon.slug;
  root.add(sprite);
  root.userData.gardenPlantIcon = icon.slug;
  return true;
}

function decorateScenes() {
  for (const [scene, record] of renderers) {
    const roots: THREE.Group[] = [];
    scene.traverse((object) => {
      if (isPlantingRoot(object)) roots.push(object);
    });

    let changed = false;
    const render = () => record.renderer.render(scene, record.camera);
    for (const root of roots) changed = attachIcon(root, render) || changed;
    if (changed) record.renderer.render(scene, record.camera);
  }
}

export function Garden3DIconBridge() {
  useEffect(() => {
    decorateScenes();
    const timer = window.setInterval(decorateScenes, 450);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
