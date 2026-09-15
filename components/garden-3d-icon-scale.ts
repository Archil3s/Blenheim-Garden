import { cropVisualProfile } from "@/lib/garden/visual-3d-natural";

export function plantBillboardScale(crop: string, detailed: boolean, iconSize = 18) {
  const profile = cropVisualProfile(crop);
  const base = detailed ? 0.7 : 0.56;
  const userScale = Math.max(0.72, Math.min(1.35, iconSize / 18));
  const width = base * userScale * profile.scale * profile.spread;
  const height = base * userScale * profile.scale * profile.height;
  return { width, height };
}
