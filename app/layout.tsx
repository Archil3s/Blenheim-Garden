import type { Metadata, Viewport } from "next";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import { GardenMediaDialogBridge } from "@/components/garden-media-dialog-bridge";
import { GardenRecordsDialogBridge } from "@/components/garden-records-dialog-bridge";
import { PlantingStyleDialogBridge } from "@/components/planting-style-dialog-bridge";
import { PlantPlacementBridge } from "@/components/plant-placement-bridge";
import "./globals.css";
import "./planner-interactions.css";
import "./growveg-workspace.css";
import "./planting-style.css";
import "./plant-placement.css";
import "./tree-scaling.css";

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
        <GardenMediaDialogBridge />
        <GardenRecordsDialogBridge />
        <PlantingStyleDialogBridge />
        <PlantPlacementBridge />
      </body>
    </html>
  );
}
