export const GARDEN_ID = "blenheim-garden" as const;

export const STORAGE_BINDINGS = {
  database: "DB",
  media: "GARDEN_MEDIA",
} as const;

export type GardenTargetType = "garden" | "bed" | "row" | "planting";
export type MediaTargetType = GardenTargetType | "harvest";
export type PlantingStatus = "planned" | "active" | "finished";
export type TaskStatus = "open" | "done" | "dismissed";
export type MediaType = "photo" | "video";

export type GardenRecord = {
  id: string;
  name: string;
  year: number;
  timezone: string;
  canvasWidthCm: number;
  canvasHeightCm: number;
};

export type BedRecord = {
  id: string;
  gardenId: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  sortOrder: number;
};

export type PlantingRowRecord = {
  id: string;
  gardenId: string;
  x1Cm: number;
  y1Cm: number;
  x2Cm: number;
  y2Cm: number;
};

export type PlantingRecord = {
  id: string;
  gardenId: string;
  bedId?: string | null;
  rowId?: string | null;
  cropName: string;
  cropIcon?: string | null;
  variety?: string | null;
  spacingCm?: number | null;
  estimatedCount?: number | null;
  status: PlantingStatus;
  sowDate?: string | null;
  germinatedDate?: string | null;
  transplantDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
};

export type MediaRecord = {
  id: string;
  gardenId: string;
  plantingId?: string | null;
  targetType: MediaTargetType;
  targetId: string;
  r2Key: string;
  mediaType: MediaType;
  fileName: string;
  contentType: string;
  sizeBytes?: number | null;
  capturedAt?: string | null;
  caption?: string | null;
};

export type HarvestRecord = {
  id: string;
  gardenId: string;
  plantingId?: string | null;
  harvestedOn: string;
  weightG?: number | null;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
};

export type GardenTaskRecord = {
  id: string;
  gardenId: string;
  targetType?: GardenTargetType | null;
  targetId?: string | null;
  title: string;
  dueOn?: string | null;
  status: TaskStatus;
  notes?: string | null;
};

export type GardenPlanPayload = {
  garden: GardenRecord;
  beds: BedRecord[];
  rows: PlantingRowRecord[];
  plantings: PlantingRecord[];
};
