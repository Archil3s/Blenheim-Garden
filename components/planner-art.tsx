"use client";

import dynamic from "next/dynamic";

export const PlannerPlantArt = dynamic(() => import("./plant-art").then(module => module.PlantArt), { ssr: false });
export const PlannerObjectArt = dynamic(() => import("./reference-object-art").then(module => module.ReferenceObjectArt), { ssr: false });
