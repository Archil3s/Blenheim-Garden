export type PlantRenderMode = "artwork" | "geometry";

export function plantRenderMode(hasResolvedArtwork: boolean): PlantRenderMode {
  return hasResolvedArtwork ? "artwork" : "geometry";
}
