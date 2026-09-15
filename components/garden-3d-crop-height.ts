import { cropVisualProfile } from "@/lib/garden/visual-3d-natural";

export function cropSoilY(crop: string, usesArtwork: boolean) {
  const profile = cropVisualProfile(crop);
  if (usesArtwork) return 0.19 + Math.min(0.045, (profile.height - 0.6) * 0.025);
  return 0.205;
}

export function cropLabelY(crop: string, detailed: boolean) {
  const profile = cropVisualProfile(crop);
  const base = detailed ? 0.9 : 0.75;
  return base + Math.max(0, profile.height - 1) * 0.28;
}
