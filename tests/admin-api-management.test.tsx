import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AdminApiManagementModule } from "@/components/admin/admin-api-management-module";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/api-management",
}));

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

describe("Admin API Integration & API Business Management Module", () => {
  it("renders the module header and all 9 submenus correctly", () => {
    render(<AdminApiManagementModule initialTab="overview" />);

    expect(screen.getByText("API Integration & API Business Management")).toBeTruthy();
    expect(screen.getByText("A. API Overview")).toBeTruthy();
    expect(screen.getByText("B. Provider Registry")).toBeTruthy();
    expect(screen.getByText("C. Connection Config")).toBeTruthy();
    expect(screen.getByText("D. Service Mapping")).toBeTruthy();
    expect(screen.getByText("E. Testing & Sandbox")).toBeTruthy();
    expect(screen.getByText("F. API Product Builder")).toBeTruthy();
    expect(screen.getByText("G. Developer & Client Mgmt")).toBeTruthy();
    expect(screen.getByText("H. Analytics & Billing")).toBeTruthy();
    expect(screen.getByText("I. Security & Audit")).toBeTruthy();
  });

  it("renders Tab A (API Overview) with KPI cards and provider health", () => {
    render(<AdminApiManagementModule initialTab="overview" />);

    expect(screen.getByText("Configured Providers")).toBeTruthy();
    expect(screen.getByText("Overall Success Rate")).toBeTruthy();
    expect(screen.getByText("P95 Network Latency")).toBeTruthy();
    expect(screen.getByText("Provider Health & Connection Telemetry")).toBeTruthy();
  });

  it("renders Tab B (Provider Registry) and displays core banking providers", () => {
    render(<AdminApiManagementModule initialTab="providers" />);

    expect(screen.getByText("Upstream API Provider Registry")).toBeTruthy();
    expect(screen.getAllByText("ICICI Bank Corporate Open Banking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("State Bank of India (SBI) Host-to-Host CBS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Razorpay Financial Technology Platform").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Register New Provider/i })).toBeTruthy();
  });

  it("renders Tab C (Connection Config) with AWS KMS credential vault references", () => {
    render(<AdminApiManagementModule initialTab="connections" />);

    expect(screen.getByText("API Connection & Protocol Configuration")).toBeTruthy();
    expect(screen.getByText("Secure Credential Storage (AWS KMS)")).toBeTruthy();
    expect(screen.getByText("Zero Plain-Text")).toBeTruthy();
    expect(screen.getByText("Configured Endpoints & Schema Maps")).toBeTruthy();
  });

  it("renders Tab D (Service Mapping) with internal service identifiers", () => {
    render(<AdminApiManagementModule initialTab="service-mapping" />);

    expect(screen.getByText("Internal Service to Provider Endpoint Mapping")).toBeTruthy();
    expect(screen.getByText("NPCI Unified UPI QR & Intent Collect")).toBeTruthy();
    expect(screen.getByText("PAY_UPI_COLLECT")).toBeTruthy();
    expect(screen.getByText("Direct Domestic Remittance (DMT 24x7)")).toBeTruthy();
    expect(screen.getByText("DMT_IMPS_TRANSFER")).toBeTruthy();
  });

  it("renders Tab E (Testing & Sandbox) and executes sanitized sandbox simulation", () => {
    render(<AdminApiManagementModule initialTab="sandbox" />);

    expect(screen.getByText("API Testing & Sandbox Console")).toBeTruthy();
    expect(screen.getByText(/Sandbox Mode/i)).toBeTruthy();

    const executeBtn = screen.getByRole("button", { name: /Execute Sandbox Test/i });
    expect(executeBtn).toBeTruthy();
    fireEvent.click(executeBtn);
  });

  it("renders Tab F (Product Builder) with commercial fintech API catalog", () => {
    render(<AdminApiManagementModule initialTab="products" />);

    expect(screen.getByText("Exposed API Products & Developer Catalog")).toBeTruthy();
    expect(screen.getByText("Buymecart Unified Corporate Payouts API")).toBeTruthy();
    expect(screen.getByText("BharatQR & Dynamic Merchant UPI Suite")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Define New API Product/i })).toBeTruthy();
  });

  it("renders Tab G (Developer & Client Management) with clean initial empty state and registration button", () => {
    render(<AdminApiManagementModule initialTab="clients" />);

    expect(screen.getByText("Corporate Clients & Developer Applications")).toBeTruthy();
    expect(screen.getByText(/No developer client applications registered yet/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Register Client Application/i }).length).toBeGreaterThan(0);
  });

  it("renders Tab H (Analytics & Billing) with metered usage telemetry", () => {
    render(<AdminApiManagementModule initialTab="analytics" />);

    expect(screen.getByText("API Consumption, Latency & Metered Billing")).toBeTruthy();
    expect(screen.getByText(/October 2026/i)).toBeTruthy();
  });

  it("renders Tab I (Security & Audit) with clean initial state for audit events", () => {
    render(<AdminApiManagementModule initialTab="security" />);

    expect(screen.getByText("API Security, Vault Rotation & Administrative Audit Trail")).toBeTruthy();
    expect(screen.getByText(/No security audit events recorded yet/i)).toBeTruthy();
  });
});

