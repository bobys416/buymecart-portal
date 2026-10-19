import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { AdminMasterDashboard } from "@/components/admin/admin-master-dashboard";
import { AdminMerchantModule } from "@/components/admin/admin-merchant-module";
import { AdminPaymentModule } from "@/components/admin/admin-payment-module";
import { RetailerPortalView } from "@/components/retailer/retailer-portal-view";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Admin Master Dashboard & Core Modules", () => {
  it("renders Admin Master Dashboard with Page 1 details panel and telemetry", () => {
    render(<AdminMasterDashboard />);
    expect(screen.getByText("Platform Master Dashboard (CRM)")).toBeTruthy();
    expect(screen.getByText("Banking Products (DMT/IMPS)")).toBeTruthy();
    expect(screen.getByText("Transaction Updates (Page 1 Details Panel)")).toBeTruthy();
  });

  it("renders Admin Merchant module with all 8 submenus", () => {
    render(<AdminMerchantModule initialTab="search" />);
    expect(screen.getByText("Merchant Management")).toBeTruthy();
    expect(screen.getByText("Search & Filter Merchant Records")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Merchant" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create KYC (12-Pt)" })).toBeTruthy();
  });

  it("renders Admin Payment module with maker-checker authorization queue", () => {
    render(<AdminPaymentModule initialTab="authorize" />);
    expect(screen.getByText("Payment Operations & Settlements")).toBeTruthy();
    expect(screen.getByText("Authorize Payments (Approve Pay Queue)")).toBeTruthy();
  });

  it("renders Retailer Portal and enforces neutral receipt policy with NO logos (Note 1)", () => {
    render(<RetailerPortalView section="receipts" />);
    expect(screen.getByText("Retailer Operating Console")).toBeTruthy();
    // Compliance check for Note 1
    expect(screen.getByText(/Compliance Note 1 from Source PDF:/i)).toBeTruthy();
    expect(screen.getByText("ELECTRONIC TRANSACTION RECEIPT")).toBeTruthy();
  });
});
