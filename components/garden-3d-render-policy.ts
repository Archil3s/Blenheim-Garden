export function gardenRenderPolicy(detailed: boolean, plantGroups: number) {
  const dense = plantGroups > 80;
  return {
    representativeCap: detailed ? (dense ? 10 : 14) : 7,
    addContactShadows: detailed && !dense,
    addSoilDetail: detailed && !dense,
    addGroundDetail: detailed,
    addWoodDetail: detailed,
    addTrellisNetting: detailed,
    addTreeBranches: detailed,
  };
}
