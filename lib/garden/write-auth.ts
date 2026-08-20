import { getGardenWriteToken } from "@/lib/garden/cloudflare-db";

export function authoriseGardenWrite(request: Request) {
  const configured = getGardenWriteToken();
  if (!configured) {
    return { ok: false as const, status: 503, error: "Garden cloud writes are not configured yet." };
  }

  const header = request.headers.get("authorization");
  const supplied = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied !== configured) {
    return { ok: false as const, status: 401, error: "Garden edit key is missing or incorrect." };
  }

  return { ok: true as const };
}
