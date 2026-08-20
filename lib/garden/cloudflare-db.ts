import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Result<T> = {
  results?: T[];
  success?: boolean;
  meta?: Record<string, unknown>;
};

export type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  first: <T = Record<string, unknown>>(columnName?: string) => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  run: () => Promise<D1Result<unknown>>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
  batch: <T = unknown>(statements: D1PreparedStatementLike[]) => Promise<T[]>;
};

export type R2ObjectBodyLike = {
  body: ReadableStream<Uint8Array>;
  size?: number;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  };
};

export type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream<Uint8Array> | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        contentDisposition?: string;
        cacheControl?: string;
      };
    },
  ) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectBodyLike | null>;
  delete: (key: string) => Promise<void>;
};

type GardenBindings = {
  DB?: D1DatabaseLike;
  GARDEN_MEDIA?: R2BucketLike;
  GARDEN_WRITE_TOKEN?: string;
};

function getGardenBindings(): GardenBindings {
  const { env } = getCloudflareContext();
  return env as GardenBindings;
}

export function getGardenDb(): D1DatabaseLike {
  const db = getGardenBindings().DB;

  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not available.");
  }

  return db;
}

export function getGardenMediaBucket(): R2BucketLike {
  const bucket = getGardenBindings().GARDEN_MEDIA;

  if (!bucket) {
    throw new Error("Cloudflare R2 binding GARDEN_MEDIA is not available.");
  }

  return bucket;
}

export function getGardenWriteToken(): string | null {
  const token = getGardenBindings().GARDEN_WRITE_TOKEN;
  return typeof token === "string" && token.length > 0 ? token : null;
}
