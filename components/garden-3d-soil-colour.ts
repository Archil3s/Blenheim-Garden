export function bedSoilColour(index: number) {
  const palette = [0x563a2a, 0x5d3e2c, 0x503629, 0x62422f];
  return palette[Math.abs(index) % palette.length];
}
