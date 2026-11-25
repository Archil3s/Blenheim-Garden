export type RecordedPlanting = {
  id: string; area_id: string | null; crop_name: string; crop_icon: string | null; variety: string | null;
  status: "active" | "planned" | "finished"; sow_date: string | null; transplant_date: string | null; first_harvest: string | null; recorded_in_season: number;
};

export type SeasonResultsData = {
  plantings: RecordedPlanting[];
  harvests: { id: string; planting_id: string; harvested_on: string; weight_g: number | null; quantity: number | null; unit: string | null }[];
  photos: { id: string; date: string; caption: string | null; url: string }[];
};

export const nzSeasons = [
  { name: "Summer", month: 12 }, { name: "Autumn", month: 3 }, { name: "Winter", month: 6 }, { name: "Spring", month: 9 },
] as const;

export function nzSeasonRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const until = new Date(Date.UTC(year, month + 2, 0)).toISOString().slice(0, 10);
  return { from, until };
}

export function seasonOfPlanningDate(date: string) {
  const month = Number(date.slice(5, 7)), year = Number(date.slice(0, 4));
  return { year: month < 3 ? year - 1 : year, month: month < 3 || month === 12 ? 12 : Math.floor(month / 3) * 3 };
}
