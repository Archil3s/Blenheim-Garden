import type { Metadata, Viewport } from "next";
import { BlenheimSeasonGuide } from "@/components/blenheim-season-guide";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import { GardenMediaDialogBridge } from "@/components/garden-media-dialog-bridge";
import { GardenRecordsDialogBridge } from "@/components/garden-records-dialog-bridge";
import { NewPlantingSaveRefreshBridge } from "@/components/new-planting-save-refresh-bridge";
import { SeasonPlannerActionBridge } from "@/components/season-planner-action-bridge";
import "./globals.css";
import "./planner-interactions.css";
import "./growveg-workspace.css";
import "./tree-scaling.css";
import "./growveg-v4.css";
import "./planner-ux-polish.css";
import "./planting-flow-polish.css";
import "./growveg-hover-info.css";
import "./blenheim-season-guide.css";

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
        <BlenheimSeasonGuide />
        <SeasonPlannerActionBridge />
        <EditKeyDialogBridge />
        <NewPlantingSaveRefreshBridge />
        <GardenMediaDialogBridge />
        <GardenRecordsDialogBridge />
      </body>
    </html>
  );
}
