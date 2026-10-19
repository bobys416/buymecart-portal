import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { AdminMerchantModule } from "@/components/admin/admin-merchant-module";
import { AdminPaymentModule } from "@/components/admin/admin-payment-module";
import { AdminManagedProductsModule } from "@/components/admin/admin-managed-products-module";
import { AdminComplianceModule } from "@/components/admin/admin-compliance-module";
import { AdminReportsModule } from "@/components/admin/admin-reports-module";
import { AdminModificationsModule } from "@/components/admin/admin-modifications-module";
import { AdminSupportModule } from "@/components/admin/admin-support-module";
import { AdminChannelReportsModule } from "@/components/admin/admin-channel-reports-module";
import { DistributorPortalView } from "@/components/distributor/distributor-portal-view";
import { RetailerPortalView } from "@/components/retailer/retailer-portal-view";

const portals = ["admin", "distributor", "retailer"] as const;

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
      default:
        notFound();
    }
  }

  // Distributor Portal Modules
  if (selectedPortal === "distributor") {
    return (
      <PortalShell portal="distributor">
        <DistributorPortalView section={section} />
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
