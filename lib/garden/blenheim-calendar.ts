export type BlenheimFrostRisk = "high" | "moderate" | "low" | "minimal";
export type BlenheimActionStatus = "now" | "protected" | "soon" | "wait";
export type BlenheimActionScope = "today" | "week";

export type BlenheimFrostSnapshot = {
  month: number;
  monthName: string;
  averageGroundFrostDays: number;
  risk: BlenheimFrostRisk;
  summary: string;
};

export type BlenheimGardenAction = {
  id: string;
  crop?: string;
  icon: string;
  status: BlenheimActionStatus;
  title: string;
  detail: string;
};

type CropWindow = {
  crop: string;
  icon: string;
  directSow?: number[];
  protectedSow?: number[];
  plantOut?: number[];
  establish?: number[];
  tender?: boolean;
  directDetail?: string;
  protectedDetail?: string;
  plantOutDetail?: string;
  establishDetail?: string;
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Mean monthly ground-frost days for Blenheim, 1991–2020.
 * Source: NIWA climate averages (also published through Figure.NZ).
 */
export const BLENHEIM_GROUND_FROST_DAYS = [
  0,
  0,
  0.08,
  1,
  4.83,
  11.16,
  14,
  9.64,
  4.32,
  2.21,
  0.6,
  0,
] as const;

export const BLENHEIM_CALENDAR_SOURCES = [
  {
    label: "NIWA / Earth Sciences NZ — Marlborough climatology",
    href: "https://niwa.co.nz/climate-and-weather/regional-climatologies/marlborough",
  },
  {
    label: "NIWA — 1991–2020 mean ground-frost days",
    href: "https://niwa.co.nz/climate-and-weather/mean-number-days-ground-frost",
  },
  {
    label: "Tui — New Zealand vegetable planting calendar",
    href: "https://tuigarden.co.nz/media/1420/vegetable-growing-guide.pdf",
  },
  {
    label: "Yates NZ — seasonal garden calendar",
    href: "https://www.yates.co.nz/ideas-plans/garden-calendar/yearly/",
  },
] as const;

const CROP_WINDOWS: CropWindow[] = [
  {
    crop: "Tomato",
    icon: "🍅",
    protectedSow: [7, 8, 9],
    plantOut: [10, 11, 0],
    tender: true,
    protectedDetail: "Start seed warm and bright under cover so sturdy plants are ready once outdoor frost risk has eased.",
    plantOutDetail: "Harden plants off first, then transplant into a sunny bed only when the short-range forecast is frost-free.",
  },
  {
    crop: "Strawberry",
    icon: "🍓",
    establish: [5, 6, 7, 8],
    establishDetail: "Plant or tidy crowns now, remove dead leaves and keep flower trusses protected on frosty nights.",
  },
  {
    crop: "Bean",
    icon: "🫘",
    directSow: [9, 10, 11, 0, 1],
    tender: true,
    directDetail: "Direct sow into warming soil. In Blenheim, delay if a cold snap or ground frost is forecast.",
  },
  {
    crop: "Lettuce",
    icon: "🥬",
    directSow: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    directDetail: "Sow a short row for succession harvests. Keep the seed bed evenly moist while seedlings establish.",
  },
  {
    crop: "Pumpkin",
    icon: "🎃",
    protectedSow: [8, 9],
    plantOut: [10, 11, 0],
    tender: true,
    protectedDetail: "Start seed under cover in individual pots; keep seedlings warm and avoid planting outside into cold soil.",
    plantOutDetail: "Move outside after hardening off, once the frost forecast is clear and the soil has properly warmed.",
  },
  {
    crop: "Carrot",
    icon: "🥕",
    directSow: [0, 1, 2, 6, 7, 8, 9, 10, 11],
    directDetail: "Direct sow shallowly into fine, loose soil and keep the surface consistently damp through germination.",
  },
  {
    crop: "Broccoli",
    icon: "🥦",
    directSow: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    directDetail: "Sow or plant cool-tolerant broccoli now. Protect young plants from slugs, birds and strong drying winds.",
  },
  {
    crop: "Raspberry",
    icon: "🔴",
    establish: [5, 6, 7, 8],
    establishDetail: "Winter to early spring is a useful establishment window. Tie canes in, remove weak growth and mulch the root zone.",
  },
  {
    crop: "Blueberry",
    icon: "🫐",
    establish: [5, 6, 7, 8],
    establishDetail: "Establish while conditions are cool. Keep the root zone acidic, mulched and evenly moist.",
  },
];

function riskForDays(days: number): BlenheimFrostRisk {
  if (days >= 6) return "high";
  if (days >= 2) return "moderate";
  if (days >= 0.5) return "low";
  return "minimal";
}

export function blenheimFrostForMonth(month: number): BlenheimFrostSnapshot {
  const safeMonth = ((month % 12) + 12) % 12;
  const averageGroundFrostDays = BLENHEIM_GROUND_FROST_DAYS[safeMonth];
  const risk = riskForDays(averageGroundFrostDays);
  const summary =
    risk === "high"
      ? "Ground frosts are common. Keep tomatoes, pumpkins, beans and other tender growth protected."
      : risk === "moderate"
        ? "Frosts still occur regularly. Harden tender crops off carefully and use the forecast before planting out."
        : risk === "low"
          ? "Occasional ground frost is still possible. Warm-season crops can move outside, but keep a cold-night backup."
          : "Ground frost is uncommon this month, although an unusual cold snap is still possible.";

  return {
    month: safeMonth,
    monthName: MONTH_NAMES[safeMonth],
    averageGroundFrostDays,
    risk,
    summary,
  };
}

function monthDistance(from: number, candidates: number[]) {
  let best = 12;
  for (const candidate of candidates) {
    const distance = (candidate - from + 12) % 12;
    if (distance < best) best = distance;
  }
  return best;
}

function warmSeasonStatus(frost: BlenheimFrostSnapshot): BlenheimActionStatus {
  if (frost.risk === "high") return "wait";
  if (frost.risk === "moderate") return "soon";
  return "now";
}

function herbAction(month: number): BlenheimGardenAction {
  if (month === 8 || month === 9) {
    return {
      id: `herbs-protected-${month}`,
      crop: "Herbs",
      icon: "🌿",
      status: "protected",
      title: "Start basil under cover; sow hardy herbs outside",
      detail: "Parsley, chives and thyme can handle cooler conditions. Keep basil warm until nights are reliably mild.",
    };
  }
  if ([10, 11, 0, 1, 2].includes(month)) {
    return {
      id: `herbs-warm-${month}`,
      crop: "Herbs",
      icon: "🌿",
      status: "now",
      title: "Keep a succession of herbs moving",
      detail: "Basil and other warmth-loving herbs can grow outside; keep parsley, chives and thyme in regular succession too.",
    };
  }
  return {
    id: `herbs-cool-${month}`,
    crop: "Herbs",
    icon: "🌿",
    status: "now",
    title: "Focus on cool-tolerant herbs",
    detail: "Parsley, chives and thyme are the useful choices now. Hold basil for a warmer protected sowing window.",
  };
}

function actionForCrop(profile: CropWindow, month: number, frost: BlenheimFrostSnapshot): BlenheimGardenAction | null {
  if (profile.directSow?.includes(month)) {
    const status = profile.tender ? warmSeasonStatus(frost) : "now";
    return {
      id: `${profile.crop.toLowerCase()}-direct-${month}`,
      crop: profile.crop,
      icon: profile.icon,
      status,
      title: status === "wait" ? `Hold outdoor ${profile.crop.toLowerCase()} sowing` : `Sow ${profile.crop.toLowerCase()} now`,
      detail: status === "wait"
        ? `The normal sowing window is open, but ${frost.monthName} frost risk is still ${frost.risk}. Wait for a frost-free forecast and warmer soil.`
        : profile.directDetail ?? `Sow ${profile.crop.toLowerCase()} now.`,
    };
  }

  if (profile.protectedSow?.includes(month)) {
    return {
      id: `${profile.crop.toLowerCase()}-protected-${month}`,
      crop: profile.crop,
      icon: profile.icon,
      status: "protected",
      title: `Start ${profile.crop.toLowerCase()} under cover`,
      detail: profile.protectedDetail ?? `Start ${profile.crop.toLowerCase()} in a protected position.`,
    };
  }

  if (profile.establish?.includes(month)) {
    return {
      id: `${profile.crop.toLowerCase()}-establish-${month}`,
      crop: profile.crop,
      icon: profile.icon,
      status: "now",
      title: `Work on ${profile.crop.toLowerCase()} now`,
      detail: profile.establishDetail ?? `This is a useful establishment window for ${profile.crop.toLowerCase()}.`,
    };
  }

  if (profile.plantOut?.includes(month)) {
    const status = profile.tender ? warmSeasonStatus(frost) : "now";
    return {
      id: `${profile.crop.toLowerCase()}-plantout-${month}`,
      crop: profile.crop,
      icon: profile.icon,
      status,
      title: status === "now" ? `Plant ${profile.crop.toLowerCase()} outside` : `Keep ${profile.crop.toLowerCase()} protected a little longer`,
      detail: status === "now"
        ? profile.plantOutDetail ?? `Plant ${profile.crop.toLowerCase()} outside now.`
        : `${profile.plantOutDetail ?? `Prepare to plant ${profile.crop.toLowerCase()} outside.`} Current ${frost.monthName} ground-frost risk is ${frost.risk}.`,
    };
  }

  const nextWindows = [...(profile.directSow ?? []), ...(profile.protectedSow ?? []), ...(profile.establish ?? []), ...(profile.plantOut ?? [])];
  const distance = nextWindows.length ? monthDistance(month, nextWindows) : 12;
  if (distance <= 2) {
    const target = MONTH_NAMES[(month + distance) % 12];
    return {
      id: `${profile.crop.toLowerCase()}-soon-${month}`,
      crop: profile.crop,
      icon: profile.icon,
      status: "soon",
      title: `Prepare for ${profile.crop.toLowerCase()}`,
      detail: `Its next useful Blenheim window starts around ${target}. Prepare the bed, seed, supports or frost protection now.`,
    };
  }

  return null;
}

const STATUS_ORDER: Record<BlenheimActionStatus, number> = {
  now: 0,
  protected: 1,
  soon: 2,
  wait: 3,
};

export function blenheimGardenActions(date: Date, scope: BlenheimActionScope): BlenheimGardenAction[] {
  const month = date.getMonth();
  const frost = blenheimFrostForMonth(month);
  const actions: BlenheimGardenAction[] = [];

  if (frost.averageGroundFrostDays >= 0.5) {
    actions.push({
      id: `frost-${month}`,
      icon: "❄️",
      status: frost.risk === "high" || frost.risk === "moderate" ? "now" : "soon",
      title: "Check frost protection",
      detail: `Blenheim averages about ${frost.averageGroundFrostDays.toFixed(1)} ground-frost days in ${frost.monthName}. ${frost.summary}`,
    });
  }

  for (const profile of CROP_WINDOWS) {
    const action = actionForCrop(profile, month, frost);
    if (action) actions.push(action);
  }
  actions.push(herbAction(month));

  actions.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.title.localeCompare(b.title));

  if (scope === "today") {
    const practical = actions.filter((action) => action.status === "now" || action.status === "protected");
    const caution = actions.find((action) => action.status === "soon" || action.status === "wait");
    return [...practical.slice(0, 5), ...(caution ? [caution] : [])].slice(0, 6);
  }

  return actions.slice(0, 10);
}
