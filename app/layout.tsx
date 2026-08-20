import type { Metadata, Viewport } from "next";
import { EditKeyDialogBridge } from "@/components/edit-key-dialog-bridge";
import "./globals.css";
import "./planner-interactions.css";
import "./growveg-workspace.css";

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
      </body>
    </html>
  );
}
