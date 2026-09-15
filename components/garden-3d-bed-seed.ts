export function bedDetailSeed(id: string, index: number) {
  let hash = index + 17;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}
