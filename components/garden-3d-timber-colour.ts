export function timberBoardColour(index: number) {
  const palette = [0x9a704d, 0x8e6647, 0xa37853, 0x805c41, 0x966b49];
  return palette[Math.abs(index) % palette.length];
}
