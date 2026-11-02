import textures from "@/lib/garden/reference-textures.json";

type Frame = { src: string; atlasWidth: number; atlasHeight: number; x: number; y: number; w: number; h: number };
const frames: Record<string, Frame> = textures;

export function hasReferenceArt(code: string) { return Boolean(frames[code]); }

export function ReferenceArt({ code, className }: { code: string; className?: string }) {
  const frame = frames[code];
  if (!frame) return null;
  return <svg className={className} data-reference-art={code} aria-hidden="true"
    viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`} width="100%" height="100%"
    preserveAspectRatio="xMidYMid meet" overflow="hidden">
    <image href={frame.src} width={frame.atlasWidth} height={frame.atlasHeight} />
  </svg>;
}
