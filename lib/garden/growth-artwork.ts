export const growthStages = [
  ["seed", "Seed"],
  ["first-sprout", "First sprout"],
  ["baby-plant", "Baby plant"],
  ["semi-mature", "Semi-mature"],
  ["pre-harvest", "Pre-harvest"],
  ["harvest", "Harvest"],
] as const;

export type GrowthStage = (typeof growthStages)[number][0];

export type GrowthArtwork = {
  status: "generated_qa_passed" | "needs_review" | "failed" | "verified";
  master: string;
  gallery: string;
  referenceUrl?: string;
  styleReference?: string;
  sourceFile?: string;
};

export type GrowthArtworkByStage = Partial<Record<GrowthStage, GrowthArtwork>>;
