import { notFound } from "next/navigation";
import { PortalShell, Portal } from "@/components/portal-shell";
import { AdminMasterDashboard } from "@/components/admin/admin-master-dashboard";
import { SuperDistributorView } from "@/components/distributor/super-distributor-view";
import { AreaDistributorView } from "@/components/distributor/area-distributor-view";
import { DistributorPortalView } from "@/components/distributor/distributor-portal-view";
import { RetailerPortalView } from "@/components/retailer/retailer-portal-view";

const validPortals = [
  "admin",
  "super-distributor",
  "area-distributor",
  "retailer",
  "distributor",
] as const;

export default async function PortalDashboard({
  params,
}: {
  params: Promise<{ portal: string }>;
}) {
  const { portal } = await params;
  if (!validPortals.includes(portal as (typeof validPortals)[number])) notFound();
  const selected = portal as (typeof validPortals)[number];

  return (
    <PortalShell portal={selected as Portal}>
      {selected === "admin" && <AdminMasterDashboard />}
      {selected === "super-distributor" && <SuperDistributorView section="dashboard" />}
      {selected === "area-distributor" && <AreaDistributorView section="dashboard" />}
      {selected === "distributor" && <DistributorPortalView section="dashboard" />}
      {selected === "retailer" && <RetailerPortalView section="dashboard" />}
    </PortalShell>
  );
}
