import textures from "@/lib/garden/reference-textures.json";
import { referenceObject } from "@/lib/garden/reference-objects";
import { ReferenceArt } from "./reference-art";
import { useId } from "react";

type Frame = { src: string; atlasWidth: number; atlasHeight: number; x: number; y: number; w: number; h: number };
const frames: Record<string, Frame> = textures;

function slice(code: string | null | undefined, x: number, y: number, w: number, h: number) {
  if (!code) return null;
  const frame = frames[code];
  if (!frame || w <= 0 || h <= 0) return null;
  return <svg key={code} x={x} y={y} width={w} height={h}
    viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`} preserveAspectRatio="none" overflow="hidden">
    <image href={frame.src} width={frame.atlasWidth} height={frame.atlasHeight} />
  </svg>;
}

export function ReferenceObjectArt({ kind, widthCm, depthCm }: { kind: string; widthCm?: number; depthCm?: number }) {
  const patternId = useId().replaceAll(":", "");
  const object = referenceObject(kind);
  if (!object) return null;
  const sprite = object.shape.sprite;
  if (sprite.type === "THREE_SLICE" && sprite.names && !Array.isArray(sprite.names)) {
    const code = sprite.names.M;
    if (!code) return null;
    const width = widthCm ?? object.shape.initialWidth, height = depthCm ?? object.shape.initialHeight;
    const tileW = sprite.width ?? width, tileH = sprite.height ?? height;
    return <svg data-reference-object={object.code} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><pattern id={patternId} width={tileW} height={tileH} patternUnits="userSpaceOnUse">{slice(code, 0, 0, tileW, tileH)}</pattern></defs>
      <rect width={width} height={height} fill={`url(#${patternId})`} />
    </svg>;
  }
  if (sprite.type !== "NINE_SLICE" || !sprite.names || Array.isArray(sprite.names)) {
    const code = sprite.name ?? (Array.isArray(sprite.names) ? sprite.names[0] : object.code);
    return <ReferenceArt code={code} />;
  }
  const names = sprite.names;
  const width = widthCm ?? object.shape.initialWidth, height = depthCm ?? object.shape.initialHeight;
  const mx = Math.min(width / 2, sprite.marginWidth ?? 0), my = Math.min(height / 2, sprite.marginHeight ?? 0);
  const middleW = width - 2 * mx, middleH = height - 2 * my;
  return <svg data-reference-object={object.code} viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
    {slice(names.M, mx, my, middleW, middleH)}
    {slice(names.T, mx, 0, middleW, my)}{slice(names.B, mx, height - my, middleW, my)}
    {slice(names.L, 0, my, mx, middleH)}{slice(names.R, width - mx, my, mx, middleH)}
    {slice(names.TL, 0, 0, mx, my)}{slice(names.TR, width - mx, 0, mx, my)}
    {slice(names.BL, 0, height - my, mx, my)}{slice(names.BR, width - mx, height - my, mx, my)}
  </svg>;
}
