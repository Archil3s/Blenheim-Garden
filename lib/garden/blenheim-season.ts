export const BLENHEIM_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type BlenheimSeasonStatus = "plant-now" | "sow-now" | "start-under-cover" | "maintain" | "wait";
export type BlenheimFrostRisk = "minimal" | "low" | "possible" | "high";

export type BlenheimCropGuidance = {
  crop: string;
  icon: string;
  status: BlenheimSeasonStatus;
  action: string;
  note: string;
  frostSensitive: boolean;
};

type CropSeason = {
  crop: string;
  icon: string;
  plantMonths?: number[];
  directSowMonths?: number[];
  underCoverMonths?: number[];
  maintainMonths?: number[];
  frostSensitive?: boolean;
  note: string;
};

// Month indexes are zero-based. Guidance is intentionally conservative for a
// home garden in Blenheim and keeps frost-tender crops protected in early spring.
// Source basis:
// - Tui Marlborough planting calendar: https://tuigarden.co.nz/planting-calendar/
// - Yates NZ August/September garden calendars: https://www.yates.co.nz/ideas-plans/garden-calendar/
// - NIWA / Earth Sciences NZ Marlborough climatology: https://niwa.co.nz/climate-and-weather/regional-climatologies/marlborough
const cropSeasons: CropSeason[] = [
  {
    crop: "Tomato",
    icon: "🍅",
    underCoverMonths: [7, 8, 9],
    plantMonths: [9, 10, 11, 0],
    frostSensitive: true,
    note: "Start seed warm and bright before planting out. Harden seedlings off and protect from late frost.",
  },
  {
    crop: "Strawberry",
    icon: "🍓",
    plantMonths: [4, 5, 6, 7, 8, 9],
    maintainMonths: [10, 11, 0, 1, 2, 3],
    note: "Winter to early spring is a strong establishment window. Keep crowns at soil level and mulch once settled.",
  },
  {
    crop: "Bean",
    icon: "🫘",
    plantMonths: [8, 9, 10, 11, 0, 1],
    frostSensitive: true,
    note: "Beans prefer warming soil. Direct sow once conditions are mild and keep young plants protected if frost is forecast.",
  },
  {
    crop: "Lettuce",
    icon: "🥬",
    plantMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    note: "Succession plant small batches. Give afternoon shade and steady moisture through hot Marlborough spells.",
  },
  {
    crop: "Pumpkin",
    icon: "🎃",
    underCoverMonths: [8, 9],
    plantMonths: [9, 10, 11],
    frostSensitive: true,
    note: "Raise seedlings under cover in spring, then plant out into warm soil after frost danger has eased.",
  },
  {
    crop: "Carrot",
    icon: "🥕",
    directSowMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    note: "Direct sow into loose soil and keep the seedbed evenly damp until emergence. Thin rather than transplant.",
  },
  {
    crop: "Broccoli",
    icon: "🥦",
    plantMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    maintainMonths: [10, 11, 0],
    note: "Cool conditions suit broccoli. Spring plantings do best before sustained summer heat arrives.",
  },
  {
    crop: "Raspberry",
    icon: "🔴",
    plantMonths: [5, 6, 7, 8, 9],
    maintainMonths: [10, 11, 0, 1, 2, 3, 4],
    note: "Plant dormant canes through winter and early spring. Give full sun, airflow and reliable support.",
  },
  {
    crop: "Blueberry",
    icon: "🫐",
    plantMonths: [5, 6, 7, 8, 9],
    maintainMonths: [10, 11, 0, 1, 2, 3, 4],
    note: "Winter and early spring are useful planting windows. Keep soil acidic, moisture-retentive and well drained.",
  },
  {
    crop: "Herbs",
    icon: "🌿",
    plantMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    underCoverMonths: [7, 8],
    note: "Parsley, chives and thyme handle cool conditions better; start basil warm under cover until frost risk passes.",
  },
];

const averageGroundFrostDays = [0, 0.1, 0.4, 1.5, 7.8, 12.8, 17.2, 11.9, 4.8, 2.1, 0.2, 0.3] as const;
const averageAirFrostDays = [0, 0, 0, 0.3, 1.8, 5.4, 9.3, 4.2, 0.6, 0.1, 0, 0] as const;

function includesMonth(months: number[] | undefined, monthIndex: number) {
  return Boolean(months?.includes(monthIndex));
}

export function getBlenheimFrost(monthIndex: number) {
  const safeMonth = Math.max(0, Math.min(11, monthIndex));
  const risk: BlenheimFrostRisk = [4, 5, 6, 7].includes(safeMonth)
    ? "high"
    : [8, 9].includes(safeMonth)
      ? "possible"
      : [3, 10].includes(safeMonth)
        ? "low"
        : "minimal";

  const message = risk === "high"
    ? "Frost is a normal part of the Blenheim winter. Keep frost cloth ready and avoid exposing tender summer crops."
    : risk === "possible"
      ? "Late frosts are still possible in Blenheim. Harden warm-season seedlings gradually and cover them when a frost is forecast."
      : risk === "low"
        ? "Frost risk is lower, but sheltered or low-lying sites can still be colder than the town average."
        : "Historical frost frequency is low. Watch short-range forecasts for unusual cold snaps.";

  return {
    risk,
    message,
    averageGroundFrostDays: averageGroundFrostDays[safeMonth],
    averageAirFrostDays: averageAirFrostDays[safeMonth],
  };
}

export function getBlenheimCropGuidance(monthIndex: number): BlenheimCropGuidance[] {
  const safeMonth = Math.max(0, Math.min(11, monthIndex));

  return cropSeasons.map((guide) => {
    if (includesMonth(guide.directSowMonths, safeMonth)) {
      return {
        crop: guide.crop,
        icon: guide.icon,
        status: "sow-now" as const,
        action: guide.frostSensitive && [8, 9].includes(safeMonth) ? "Direct sow with frost protection" : "Direct sow now",
        note: guide.note,
        frostSensitive: Boolean(guide.frostSensitive),
      };
    }

    if (includesMonth(guide.underCoverMonths, safeMonth) && !includesMonth(guide.plantMonths, safeMonth)) {
      return {
        crop: guide.crop,
        icon: guide.icon,
        status: "start-under-cover" as const,
        action: "Start under cover",
        note: guide.note,
        frostSensitive: Boolean(guide.frostSensitive),
      };
    }

    if (includesMonth(guide.plantMonths, safeMonth)) {
      return {
        crop: guide.crop,
        icon: guide.icon,
        status: "plant-now" as const,
        action: guide.frostSensitive && [8, 9].includes(safeMonth) ? "Plant with frost protection" : "Plant now",
        note: guide.note,
        frostSensitive: Boolean(guide.frostSensitive),
      };
    }

    if (includesMonth(guide.maintainMonths, safeMonth)) {
      return {
        crop: guide.crop,
        icon: guide.icon,
        status: "maintain" as const,
        action: "Maintain existing plants",
        note: guide.note,
        frostSensitive: Boolean(guide.frostSensitive),
      };
    }

    return {
      crop: guide.crop,
      icon: guide.icon,
      status: "wait" as const,
      action: "Wait for a better planting window",
      note: guide.note,
      frostSensitive: Boolean(guide.frostSensitive),
    };
  });
}

export function getBlenheimWeekTasks(monthIndex: number) {
  const frost = getBlenheimFrost(monthIndex);
  const guidance = getBlenheimCropGuidance(monthIndex);
  const direct = guidance.filter((item) => item.status === "sow-now").map((item) => item.crop);
  const plant = guidance.filter((item) => item.status === "plant-now").map((item) => item.crop);
  const undercover = guidance.filter((item) => item.status === "start-under-cover").map((item) => item.crop);
  const tasks: string[] = [];

  if (direct.length) tasks.push(`Direct sow: ${direct.join(", ")}.`);
  if (plant.length) tasks.push(`Plant or transplant: ${plant.join(", ")}.`);
  if (undercover.length) tasks.push(`Start under cover: ${undercover.join(", ")}.`);
  if (frost.risk === "high" || frost.risk === "possible") tasks.push("Keep frost cloth ready and check the forecast before exposing tender seedlings overnight.");
  tasks.push("Check soil moisture before watering; Marlborough can dry quickly once northwesterlies pick up.");

  return tasks;
}
