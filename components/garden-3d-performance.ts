export function representativePlantCap(detailed: boolean, requested: number) {
  const hardCap = detailed ? 14 : 7;
  if (!Number.isFinite(requested) || requested <= 0) return 1;
  return Math.max(1, Math.min(hardCap, Math.round(requested)));
}

export function shouldAddFineDetail(detailed: boolean, visiblePlantGroups: number) {
  return detailed && visiblePlantGroups <= 80;
}
