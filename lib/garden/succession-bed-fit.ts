import type { bedGrowingContext } from "./bed-growing-conditions";

type CropNeeds = { sun?: boolean; climate?: "warm" | "cool"; support?: boolean; evenWater?: boolean; room?: boolean };
const needsByCrop: Record<string, CropNeeds> = {
  Tomato: { sun: true, climate: "warm", evenWater: true },
  "Capsicum / chilli": { sun: true, climate: "warm", evenWater: true },
  Pumpkin: { sun: true, climate: "warm", room: true, evenWater: true },
  Beans: { sun: true, climate: "warm" },
  Peas: { climate: "cool", support: true },
  Lettuce: { climate: "cool", evenWater: true },
  Carrot: { evenWater: true },
  Beetroot: { evenWater: true },
  Radish: { climate: "cool", evenWater: true },
  Spinach: { climate: "cool", evenWater: true },
  Kale: { climate: "cool" },
  Cucumber: { sun: true, climate: "warm", evenWater: true },
  Broccoli: { sun: true, climate: "cool", evenWater: true },
};

export function successionBedFit(crop: string, variety: string, context: ReturnType<typeof bedGrowingContext>, bedMonth: number) {
  const needs = needsByCrop[crop] ?? {};
  const { light, temperature, support, moisture } = context.conditions;
  const strengths: string[] = [], cautions: string[] = [];
  let issues = 0;
  const issue = (detail: string) => { cautions.push(detail); issues++; };
  if (light === "shade") issue("Mostly shaded beds may give little growth or yield.");
  else if (light === "partial") {
    if (needs.sun) issue("This crop grows best in full sun.");
    else strengths.push("Tolerates part shade.");
  } else if (light === "sun" && needs.sun) strengths.push("Full sun suits this crop.");
  if (temperature === "cool" && needs.climate === "warm") issue("Wait for warm soil and frost-free conditions.");
  if ((temperature === "hot" || temperature === "heated") && needs.climate === "warm") strengths.push("Warmth suits this crop.");
  if ((temperature === "hot" || temperature === "heated") && needs.climate === "cool") {
    if ([11, 12, 1, 2, 3].includes(bedMonth) || temperature === "heated") issue("Heat can reduce quality. Choose a cooler spot or provide shade and ventilation.");
    else cautions.push("Watch for heat on sunny days.");
  }
  if (temperature === "cool" && needs.climate === "cool") strengths.push("Prefers cooler growing conditions.");
  const climbing = needs.support || /climbing|runner|pole|indeterminate/.test(variety.toLowerCase());
  if (climbing) {
    if (support === "yes") strengths.push("Climbing support is available.");
    else if (support === "no") issue("Add climbing support or choose a bush variety.");
    else cautions.push("Check whether this variety needs climbing support.");
  } else if (crop === "Beans") {
    cautions.push(support === "yes" ? "The trellis can take climbing beans." : "Choose a bush bean for a bed without support.");
  } else if (crop === "Tomato") cautions.push("Check staking or caging needs for the variety.");
  if (moisture === "wet") issue("Improve drainage before sowing or transplanting.");
  if (moisture === "dry" && needs.evenWater) issue("Keep the root zone evenly moist while it establishes.");
  if (moisture === "even" && needs.evenWater) strengths.push("Even moisture suits this crop.");
  if (needs.room) {
    if (context.width < 100) issue("Choose a compact variety or give the vines space outside the bed.");
    else cautions.push("Allow space for vines beyond the plant’s base.");
  }
  return { issues, strengths, cautions };
}
