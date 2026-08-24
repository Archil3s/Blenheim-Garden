import type { Metadata, Viewport } from "next";
import { PlannerBridges } from "@/components/planner-bridges";
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
import "./garden-3d-preview.css";

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
        <PlannerBridges />
      </body>
    </html>
  );
}
