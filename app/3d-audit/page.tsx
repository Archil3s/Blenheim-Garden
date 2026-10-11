import { GardenAudit } from "@/components/garden-audit";
import catalogue from "@/lib/garden/audit-catalogue.generated.json";
import type { AuditCatalogue } from "@/lib/garden/audit-catalog";
import "./audit.css";

export const dynamic = "force-static";
export const metadata = { title: "3D visual audit · Blenheim Garden", robots: { index: false, follow: false } };

export default function AuditPage() {
  return <GardenAudit catalogue={catalogue as AuditCatalogue} />;
}
