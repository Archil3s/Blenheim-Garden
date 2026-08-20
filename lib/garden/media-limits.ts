export const GARDEN_MEDIA_LIMITS = {
  maxTotalBytes: 2 * 1024 * 1024 * 1024,
  maxPhotoBytes: 6 * 1024 * 1024,
  maxVideoBytes: 25 * 1024 * 1024,
  maxFiles: 500,
} as const;

export const GARDEN_MEDIA_TYPES = {
  photo: new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]),
  video: new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
} as const;

export type GardenMediaKind = keyof typeof GARDEN_MEDIA_TYPES;

export function classifyGardenMedia(contentType: string): GardenMediaKind | null {
  if (GARDEN_MEDIA_TYPES.photo.has(contentType)) return "photo";
  if (GARDEN_MEDIA_TYPES.video.has(contentType)) return "video";
  return null;
}

export function maxBytesForGardenMedia(kind: GardenMediaKind) {
  return kind === "photo" ? GARDEN_MEDIA_LIMITS.maxPhotoBytes : GARDEN_MEDIA_LIMITS.maxVideoBytes;
}

export function extensionForGardenMedia(contentType: string) {
  switch (contentType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/heic": return "heic";
    case "image/heif": return "heif";
    case "video/mp4": return "mp4";
    case "video/webm": return "webm";
    case "video/quicktime": return "mov";
    default: return "bin";
  }
}
