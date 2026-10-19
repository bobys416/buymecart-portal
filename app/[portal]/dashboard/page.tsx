import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { AdminMasterDashboard } from "@/components/admin/admin-master-dashboard";
import { DistributorPortalView } from "@/components/distributor/distributor-portal-view";
import { RetailerPortalView } from "@/components/retailer/retailer-portal-view";

const validPortals = ["admin", "distributor", "retailer"] as const;

export default async function PortalDashboard({
  params,
}: {
  params: Promise<{ portal: string }>;
}) {
  const { portal } = await params;
  if (!validPortals.includes(portal as (typeof validPortals)[number])) notFound();
  const selected = portal as (typeof validPortals)[number];

  return (
    <PortalShell portal={selected}>
      {selected === "admin" && <AdminMasterDashboard />}
      {selected === "distributor" && <DistributorPortalView section="dashboard" />}
      {selected === "retailer" && <RetailerPortalView section="dashboard" />}
    </PortalShell>
  );
}
