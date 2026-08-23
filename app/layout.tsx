import type { Metadata, Viewport } from "next";
import { BlenheimCalendarBridge } from "@/components/blenheim-calendar-bridge";
import { CropRotationBridge } from "@/components/crop-rotation-bridge";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import { GardenManagerBridge } from "@/components/garden-manager-bridge";
import { GardenMediaDialogBridge } from "@/components/garden-media-dialog-bridge";
import { GardenRecordsDialogBridge } from "@/components/garden-records-dialog-bridge";
import { GrowVegVisualPolishBridge } from "@/components/growveg-visual-polish-bridge";
import { NewPlantingSaveRefreshBridge } from "@/components/new-planting-save-refresh-bridge";
import { PlannerShortcutsBridge } from "@/components/planner-shortcuts-bridge";
import "./globals.css";
import "./planner-interactions.css";
import "./growveg-workspace.css";
import "./tree-scaling.css";
import "./growveg-v4.css";
import "./blenheim-calendar.css";
import "./crop-rotation.css";
import "./production-polish.css";
import "./growveg-visual-polish.css";
import "./garden-manager.css";

export const metadata: Metadata = {
  title: "Blenheim Garden",
  description: "A visual garden planner for seasonal growing in Blenheim, Marlborough.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#19a97b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ">
      <body>
        {children}
        <EditKeyDialogBridge />
        <NewPlantingSaveRefreshBridge />
        <BlenheimCalendarBridge />
        <CropRotationBridge />
        <GardenMediaDialogBridge />
        <GardenRecordsDialogBridge />
        <PlannerShortcutsBridge />
        <GrowVegVisualPolishBridge />
        <GardenManagerBridge />
      </body>
    </html>
  );
}
