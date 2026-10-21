import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { AdminMasterDashboard } from "@/components/admin/admin-master-dashboard";
import { AdminSuperDistributorModule } from "@/components/admin/admin-super-distributor-module";
import { AdminMerchantModule } from "@/components/admin/admin-merchant-module";
import { AdminPaymentModule } from "@/components/admin/admin-payment-module";
import { AdminManagedProductsModule } from "@/components/admin/admin-managed-products-module";
import { AdminComplianceModule } from "@/components/admin/admin-compliance-module";
import { AdminReportsModule } from "@/components/admin/admin-reports-module";
import { AdminModificationsModule } from "@/components/admin/admin-modifications-module";
import { AdminSupportModule } from "@/components/admin/admin-support-module";
import { AdminChannelReportsModule } from "@/components/admin/admin-channel-reports-module";
import { AdminApiManagementModule } from "@/components/admin/admin-api-management-module";
import { AdminAiCentreModule } from "@/components/admin/admin-ai-centre-module";
import { DistributorPortalView } from "@/components/distributor/distributor-portal-view";
import { SuperDistributorView } from "@/components/distributor/super-distributor-view";
import { AreaDistributorView } from "@/components/distributor/area-distributor-view";
import { RetailerPortalView } from "@/components/retailer/retailer-portal-view";

const portals = [
  "admin",
  "super-distributor",
  "area-distributor",
  "retailer",
  "distributor",
] as const;

export default async function PortalSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ portal: string; section: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { portal, section } = await params;
  const { tab } = await searchParams;

  if (!portals.includes(portal as (typeof portals)[number])) notFound();
  const selectedPortal = portal as (typeof portals)[number];

  // Admin Portal Modules
  if (selectedPortal === "admin") {
    switch (section) {
      case "dashboard":
        return (
          <PortalShell portal="admin">
            <AdminMasterDashboard />
          </PortalShell>
        );
      case "super-distributors":
      case "super-distributor":
        return (
          <PortalShell portal="admin">
            <AdminSuperDistributorModule initialTab={tab || "directory"} />
          </PortalShell>
        );
      case "merchants":
        return (
          <PortalShell portal="admin">
            <AdminMerchantModule initialTab={tab || "search"} />
          </PortalShell>
        );
      case "payments":
        return (
          <PortalShell portal="admin">
            <AdminPaymentModule initialTab={tab || "authorize"} />
          </PortalShell>
        );
      case "managed-products":
        return (
          <PortalShell portal="admin">
            <AdminManagedProductsModule initialTab={tab || "transactions"} />
          </PortalShell>
        );
      case "compliance":
        return (
          <PortalShell portal="admin">
            <AdminComplianceModule initialTab={tab || "pending-onboarding"} />
          </PortalShell>
        );
      case "reports":
        return (
          <PortalShell portal="admin">
            <AdminReportsModule initialTab={tab || "account-ledger"} />
          </PortalShell>
        );
      case "modifications":
        return (
          <PortalShell portal="admin">
            <AdminModificationsModule initialTab={tab || "commercial"} />
          </PortalShell>
        );
      case "support":
        return (
          <PortalShell portal="admin">
            <AdminSupportModule initialTab={tab || "open"} />
          </PortalShell>
        );
      case "channel-reports":
        return (
          <PortalShell portal="admin">
            <AdminChannelReportsModule />
          </PortalShell>
        );
      case "api-management":
        return (
          <PortalShell portal="admin">
            <AdminApiManagementModule initialTab={tab || "overview"} />
          </PortalShell>
        );
      case "ai-centre":
      case "ibnk-ai":
        return (
          <PortalShell portal="admin">
            <AdminAiCentreModule initialTab={tab || "overview"} />
          </PortalShell>
        );
      default:
        notFound();
    }
  }

  // Super Distributor Portal Modules
  if (selectedPortal === "super-distributor") {
    return (
      <PortalShell portal="super-distributor">
        <SuperDistributorView section={section} tab={tab} />
      </PortalShell>
    );
  }

  // Area Distributor Portal Modules
  if (selectedPortal === "area-distributor") {
    return (
      <PortalShell portal="area-distributor">
        <AreaDistributorView section={section} tab={tab} />
      </PortalShell>
    );
  }

  // Distributor Portal Modules (Legacy Shared Route)
  if (selectedPortal === "distributor") {
    return (
      <PortalShell portal="distributor">
        <DistributorPortalView section={section} tab={tab} />
      </PortalShell>
    );
  }

  // Retailer Portal Modules
  if (selectedPortal === "retailer") {
    return (
      <PortalShell portal="retailer">
        <RetailerPortalView section={section} />
      </PortalShell>
    );
  }

  notFound();
}
