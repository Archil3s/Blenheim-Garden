export type CropVisualProfile = {
  scale: number;
  height: number;
  spread: number;
  jitterCm: number;
  rotationDeg: number;
  contactRadius: number;
};

const DEFAULT_PROFILE: CropVisualProfile = {
  scale: 1,
  height: 1,
  spread: 1,
  jitterCm: 3,
  rotationDeg: 12,
  contactRadius: 0.1,
};

export function cropVisualProfile(crop: string): CropVisualProfile {
  const name = crop.toLowerCase();
  if (name.includes("strawber")) return { scale: 0.78, height: 0.58, spread: 1.18, jitterCm: 2, rotationDeg: 18, contactRadius: 0.13 };
  if (name.includes("lettuce")) return { scale: 0.84, height: 0.62, spread: 1.12, jitterCm: 2, rotationDeg: 22, contactRadius: 0.13 };
  if (name.includes("pumpkin") || name.includes("squash") || name.includes("zucchini") || name.includes("courgette")) return { scale: 1.18, height: 0.7, spread: 1.42, jitterCm: 4, rotationDeg: 24, contactRadius: 0.2 };
  if (name.includes("corn") || name.includes("maize")) return { scale: 1.08, height: 1.55, spread: 0.82, jitterCm: 2, rotationDeg: 8, contactRadius: 0.09 };
  if (name.includes("tomato")) return { scale: 1.08, height: 1.3, spread: 1, jitterCm: 3, rotationDeg: 10, contactRadius: 0.12 };
  if (name.includes("runner bean") || name.includes("climbing bean") || name.includes("pole bean") || name.includes("pea")) return { scale: 1.02, height: 1.42, spread: 0.9, jitterCm: 2, rotationDeg: 9, contactRadius: 0.09 };
  if (name.includes("bean")) return { scale: 0.94, height: 1.02, spread: 1, jitterCm: 3, rotationDeg: 14, contactRadius: 0.1 };
  if (name.includes("broccoli") || name.includes("cauliflower") || name.includes("cabbage") || name.includes("kale")) return { scale: 1.02, height: 0.92, spread: 1.14, jitterCm: 3, rotationDeg: 18, contactRadius: 0.14 };
  if (name.includes("carrot") || name.includes("onion") || name.includes("garlic") || name.includes("leek")) return { scale: 0.76, height: 0.82, spread: 0.82, jitterCm: 1.5, rotationDeg: 16, contactRadius: 0.07 };
  if (name.includes("blueber") || name.includes("raspber") || name.includes("currant")) return { scale: 1.06, height: 1.18, spread: 1.08, jitterCm: 3, rotationDeg: 12, contactRadius: 0.13 };
  if (name.includes("potato")) return { scale: 0.98, height: 0.96, spread: 1.08, jitterCm: 3, rotationDeg: 16, contactRadius: 0.12 };
  if (name.includes("basil") || name.includes("parsley") || name.includes("thyme") || name.includes("herb")) return { scale: 0.8, height: 0.78, spread: 1.02, jitterCm: 2, rotationDeg: 22, contactRadius: 0.09 };
  return DEFAULT_PROFILE;
}

/** Stable pseudo-random 0..1 value: natural variation without plants jumping between renders. */
export function stableVariation(seed: string, index: number, channel = 0): number {
  let h = 2166136261 >>> 0;
  const input = `${seed}:${index}:${channel}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967295;
}

export function naturalPlantTransform(crop: string, seed: string, index: number) {
  const profile = cropVisualProfile(crop);
  const signed = (channel: number) => stableVariation(seed, index, channel) * 2 - 1;
  const scaleVariation = 0.92 + stableVariation(seed, index, 3) * 0.16;
  return {
    offsetXCm: signed(0) * profile.jitterCm,
    offsetZCm: signed(1) * profile.jitterCm,
    rotationY: signed(2) * profile.rotationDeg * (Math.PI / 180),
    scaleX: profile.scale * profile.spread * scaleVariation,
    scaleY: profile.scale * profile.height * scaleVariation,
    scaleZ: profile.scale * profile.spread * scaleVariation,
    contactRadius: profile.contactRadius * scaleVariation,
  };
}

export function isClimbingCrop(crop: string) {
  const name = crop.toLowerCase();
  return name.includes("runner bean") || name.includes("climbing bean") || name.includes("pole bean") || name.includes("pea") || name.includes("cucumber");
}
