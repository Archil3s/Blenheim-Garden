"use client";

import { usePathname } from "next/navigation";
import { BlenheimCalendarBridge } from "@/components/blenheim-calendar-bridge";
import { CropRotationBridge } from "@/components/crop-rotation-bridge";
import { DeviceLayoutToggleBridge } from "@/components/device-layout-toggle-bridge";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import { GardenManagerBridge } from "@/components/garden-manager-bridge";
import { GardenMediaDialogBridge } from "@/components/garden-media-dialog-bridge";
import { GardenRecordsDialogBridge } from "@/components/garden-records-dialog-bridge";
import { GardenViewModeBridge } from "@/components/garden-view-mode-bridge";
import { GrowVegVisualPolishBridge } from "@/components/growveg-visual-polish-bridge";
import { NewPlantingSaveRefreshBridge } from "@/components/new-planting-save-refresh-bridge";
import { PlannerShortcutsBridge } from "@/components/planner-shortcuts-bridge";
import { SmartPlantingBridge } from "@/components/smart-planting-bridge";

export function PlannerBridges() {
  const pathname = usePathname();

  // The standalone WebGL companion is its own application surface. Planner bridges
  // stay off /3d, while the main planner gets an inline simulator-style 2D/3D switch.
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
      <GardenViewModeBridge />
      <SmartPlantingBridge />
      <DeviceLayoutToggleBridge />
    </>
  );
}