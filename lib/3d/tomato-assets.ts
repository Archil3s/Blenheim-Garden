/** Static asset paths emitted by scripts/3d/generate-tomato-assets.mjs.
 * These are actual glTF 2.0 binary files in public/, not JSON mock models. */
export type TomatoStage = "seedling" | "vegetative" | "fruiting";
export type TomatoLod = 0 | 1 | 2;

export const TOMATO_GROWTH_STAGES: ReadonlyArray<{ value: TomatoStage; label: string }> = [
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative" },
  { value: "fruiting", label: "Fruiting" },
];

export function tomatoAssetPath(stage: TomatoStage, lod: TomatoLod) {
  return `/assets/plants/tomato/${stage}/lod${lod}.glb`;
}

/** Initial budget: small devices request the simplified asset, not a full-resolution desktop mesh. */
export function tomatoLodForDevice(mobile: boolean): TomatoLod {
  return mobile ? 1 : 0;
}

export const TOMATO_ASSET_MANIFEST = "/assets/plants/tomato/manifest.json";
