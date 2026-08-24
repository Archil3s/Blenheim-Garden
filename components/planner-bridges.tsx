"use client";

import { usePathname } from "next/navigation";
import { BlenheimCalendarBridge } from "@/components/blenheim-calendar-bridge";
import { CropRotationBridge } from "@/components/crop-rotation-bridge";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import { GardenManagerBridge } from "@/components/garden-manager-bridge";
import { GardenMediaDialogBridge } from "@/components/garden-media-dialog-bridge";
import { GardenRecordsDialogBridge } from "@/components/garden-records-dialog-bridge";
import { GrowVegVisualPolishBridge } from "@/components/growveg-visual-polish-bridge";
import { NewPlantingSaveRefreshBridge } from "@/components/new-planting-save-refresh-bridge";
import { PlannerShortcutsBridge } from "@/components/planner-shortcuts-bridge";

export function PlannerBridges() {
  const pathname = usePathname();

  // The WebGL companion is its own application surface. The planner bridges below
  // install DOM observers, keyboard handlers, dialogs, and planner-specific polish
  // against the 2D workspace. Keeping them off /3d prevents unrelated 2D runtime
  // code from crashing or repeatedly mutating the WebGL page.
  if (pathname?.startsWith("/3d")) return null;

  return (
    <>
      <EditKeyDialogBridge />
      <NewPlantingSaveRefreshBridge />
      <BlenheimCalendarBridge />
      <CropRotationBridge />
      <GardenMediaDialogBridge />
      <GardenRecordsDialogBridge />
      <PlannerShortcutsBridge />
      <GrowVegVisualPolishBridge />
      <GardenManagerBridge />
    </>
  );
}
