export function plantRenderSeed(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? "")).join(":");
}
