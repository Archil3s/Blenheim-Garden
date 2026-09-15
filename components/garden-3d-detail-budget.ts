export function gardenDetailBudget(detailed: boolean, beds: number, plantGroups: number) {
  if (!detailed) return "compact" as const;
  if (beds > 30 || plantGroups > 90) return "balanced" as const;
  return "full" as const;
}
