export type CareKind = "fertiliser" | "spray";
export type CareProduct = { name: string; dilution: string };
export type CareEvent = {
  id: string;
  gardenId: string;
  kind: CareKind;
  occurredOn: string;
  products: CareProduct[];
  crops: string[];
  targets: string[];
  method: string;
  withholdingDays: number | null;
  notes: string;
  createdAt: string;
};

export function normalizeCareCrop(value: string) {
  const name = value.toLocaleLowerCase("en-NZ").trim().replace(/\s+/g, " ");
  if (/tomato(es)?/.test(name)) return "tomato";
  if (/chill?i(es|s)?|chile(s)?/.test(name)) return "chilli";
  if (/pumpkins?/.test(name)) return "pumpkin";
  return name.replace(/s$/, "");
}

export function appliesToCareTarget(event: CareEvent, crop: string, target: string) {
  if (!event.crops.some((name) => normalizeCareCrop(name) === normalizeCareCrop(crop))) return false;
  return event.targets.length === 0 || event.targets.includes(target);
}

export function lastCareForTarget(events: CareEvent[], crop: string, target: string) {
  const applicable = events.filter((event) => appliesToCareTarget(event, crop, target));
  return {
    fertiliser: applicable.find((event) => event.kind === "fertiliser"),
    spray: applicable.find((event) => event.kind === "spray"),
  };
}

export function newZealandCareDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return [value.year, value.month, value.day].join("-");
}

export function careDateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

export function careShortDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}
