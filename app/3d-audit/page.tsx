import { GardenAudit } from "@/components/garden-audit";
import { buildAuditCatalogue } from "@/lib/garden/audit-catalog-server";
import "./audit.css";

export const dynamic = "force-static";
export const metadata = { title: "3D visual audit · Blenheim Garden", robots: { index: false, follow: false } };

export default function AuditPage() {
  return <GardenAudit catalogue={buildAuditCatalogue()} />;
}
