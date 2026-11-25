import { blenheimFrostForMonth } from "./blenheim-calendar";
import type { BedGrowingConditions } from "./bed-growing-conditions";

export type RegionalForecastDay = { date: string; min: number; max: number };

export function plantingWeather(crop: string, date: string, exposure: BedGrowingConditions["temperature"], days: RegionalForecastDay[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const warm = /tomato|capsicum|chilli|pumpkin|bean|cucumber|courgette/i.test(crop);
  const cool = /lettuce|peas|broccoli|radish|spinach|kale/i.test(crop);
  const threshold = exposure === "cool" ? 5 : 3;
  const heatThreshold = exposure === "hot" ? 26 : 29;
  function risk(day: RegionalForecastDay) {
    if (day.min <= threshold && (warm || day.min <= 0)) return "cold";
    if (day.max >= heatThreshold && (cool || day.max >= 32)) return "heat";
  }
  function runRisk(index: number) {
    return days.slice(index, index + 3).map(risk).find(Boolean);
  }
  const i = days.findIndex(day => day.date === date);
  if (i >= 0) {
    const warning = runRisk(i);
    const next = warning ? days.slice(i + 1).findIndex((_, index) =>
      i + index + 3 < days.length && !runRisk(i + index + 1)) : -1;
    return {
      forecast: days[i],
      next: next >= 0 ? days[i + next + 1].date : undefined,
      advice: warning === "cold" ? "Cold nights in the regional forecast. Wait or keep the crop under frost protection."
        : warning === "heat" ? "Heat in the regional forecast. Wait or use shade and water while plants establish."
          : "No strong heat or cold signal in the available nearby forecast days. Check the soil and local conditions before planting.",
    };
  }
  const frost = blenheimFrostForMonth(Number(date.slice(5, 7)) - 1);
  return {
    forecast: undefined, next: undefined,
    advice: warm && (exposure === "cool" || frost.risk === "high" || frost.risk === "moderate")
      ? "Seasonal frost risk or a frost-prone bed. Start under cover where suitable and wait to plant out until soil is warm and nights are frost-free."
      : cool && (exposure === "hot" || exposure === "heated") ? "This bed may run hot. Plan shade or ventilate cover, or choose a cooler planting date."
        : frost.summary,
  };
}
