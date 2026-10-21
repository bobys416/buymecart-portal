import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AdminAiCentreModule } from "@/components/admin/admin-ai-centre-module";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/ai-centre",
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

describe("Admin AI Centre & Financial Intelligence Module", () => {
  it("renders the module header and all 9 submenus correctly", () => {
    render(<AdminAiCentreModule initialTab="overview" />);

    expect(screen.getByText("IBNK AI Control Centre & Financial Intelligence")).toBeTruthy();
    expect(screen.getByText("1. AI Overview & Control Centre")).toBeTruthy();
    expect(screen.getByText("2. Admin AI Copilot")).toBeTruthy();
    expect(screen.getByText("3. Banking Risk & Fraud Centre")).toBeTruthy();
    expect(screen.getByText("4. AI Models & Local Runtime")).toBeTruthy();
    expect(screen.getByText("5. Agent Workflows")).toBeTruthy();
    expect(screen.getByText("6. MCP Servers & Tool Registry")).toBeTruthy();
    expect(screen.getByText("7. Privileged Approval Centre")).toBeTruthy();
    expect(screen.getByText("8. AI Policies & Permissions")).toBeTruthy();
    expect(screen.getByText("9. AI Audit & Observability")).toBeTruthy();
  });

  it("renders Tab 1 (AI Overview & Control Centre) with hardware telemetry and KPI metrics", () => {
    render(<AdminAiCentreModule initialTab="overview" />);

    expect(screen.getByText("Self-Hosted Runtime & Hardware Telemetry")).toBeTruthy();
    expect(screen.getByText("Inference Accelerator")).toBeTruthy();
    expect(screen.getByText("Host CPU Utilization")).toBeTruthy();
    expect(screen.getByText("Host System RAM")).toBeTruthy();
    expect(screen.getByText("Active Context Memory")).toBeTruthy();
    expect(screen.getByText("Autonomous Agent Workflows")).toBeTruthy();
    expect(screen.getByText("Recent AI & Security Events")).toBeTruthy();
  });

  it("renders Tab 2 (Admin AI Copilot) and handles prompt submission", () => {
    render(<AdminAiCentreModule initialTab="copilot" />);

    expect(screen.getByText("IBNK Admin AI Copilot")).toBeTruthy();
    expect(
      screen.getByPlaceholderText(/investigate order #, check switch latency/i)
    ).toBeTruthy();

    const input = screen.getByPlaceholderText(/investigate order #, check switch latency/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    fireEvent.change(input, { target: { value: "Investigate ICICI IMPS webhook status" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("Investigate ICICI IMPS webhook status")).toBeTruthy();
  });

  it("renders Tab 3 (Banking Risk & Fraud Centre) with clean zero dummy data empty state", () => {
    render(<AdminAiCentreModule initialTab="risk-fraud" />);

    expect(screen.getByText("Banking Risk & Fraud Intelligence Centre")).toBeTruthy();
    expect(screen.getByText("Synthetic Demonstration Scenarios Only")).toBeTruthy();
    expect(screen.getByText("No active banking risk cases detected")).toBeTruthy();
    expect(
      screen.getByText(/Transaction radar telemetry is currently clean with zero flagged anomalies/i)
    ).toBeTruthy();
  });

  it("renders Tab 4 (AI Models & Local Runtime) and triggers local node connection test", () => {
    render(<AdminAiCentreModule initialTab="models" />);

    expect(screen.getByText("Self-Hosted AI Models & Local Runtime Engine")).toBeTruthy();
    expect(screen.getByText("Local Runtime Node Configuration")).toBeTruthy();
    expect(screen.getByText("Configured Open-Weight Model Weights")).toBeTruthy();

    const testBtn = screen.getByRole("button", { name: /Test Local Node Connection/i });
    expect(testBtn).toBeTruthy();
    fireEvent.click(testBtn);

    expect(screen.getByText(/Local inference endpoint connection test passed/i)).toBeTruthy();
  });

  it("renders Tab 5 (Agent Workflows) and allows running a workflow simulation", () => {
    render(<AdminAiCentreModule initialTab="workflows" />);

    expect(screen.getByText("Agentic AI Operational Workflows")).toBeTruthy();

    const runButtons = screen.getAllByRole("button", { name: /Run Workflow/i });
    expect(runButtons.length).toBeGreaterThan(0);

    fireEvent.click(runButtons[0]);
    expect(screen.getByText(/started step execution/i)).toBeTruthy();
  });

  it("renders Tab 6 (MCP Servers & Tool Registry) and allows toggling a tool", () => {
    render(<AdminAiCentreModule initialTab="mcp-tools" />);

    expect(screen.getByText("Model Context Protocol (MCP) Server & Tool Mesh")).toBeTruthy();

    const toggleButtons = screen.getAllByRole("button", { name: /ENABLED|DISABLED/i });
    expect(toggleButtons.length).toBeGreaterThan(0);

    const firstToggle = toggleButtons[0];
    const initialText = firstToggle.textContent;
    fireEvent.click(firstToggle);

    expect(screen.getByText(/Tool .* state toggled\./i)).toBeTruthy();
  });

  it("renders Tab 7 (Privileged Approval Centre) with zero dummy data empty state", () => {
    render(<AdminAiCentreModule initialTab="approvals" />);

    expect(screen.getByText("Maker-Checker Privileged Action Approval Centre")).toBeTruthy();
    expect(screen.getByText("No pending privileged actions")).toBeTruthy();
    expect(
      screen.getByText(/The Maker-Checker approval queue is clear\. High-impact operations requiring dual-signoff will appear here\./i)
    ).toBeTruthy();
  });

  it("renders Tab 8 (AI Policies & Permissions) with 4-tier matrix", () => {
    render(<AdminAiCentreModule initialTab="policies" />);

    expect(screen.getByText("AI Governance Policies & 4-Tier Permission Matrix")).toBeTruthy();
    expect(screen.getAllByText(/MAKER-CHECKER REQUIRED|AUTONOMOUS ALLOWED/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Allowed Actions:/i).length).toBe(4);
    expect(screen.getAllByText(/Prohibited Actions:/i).length).toBe(4);
  });

  it("renders Tab 9 (AI Audit & Observability) with audit events and export button", () => {
    render(<AdminAiCentreModule initialTab="audit-logs" />);

    expect(screen.getByText("AI Activity, Model Inference & Observability Logs")).toBeTruthy();
    expect(screen.getByText("Timestamp (UTC)")).toBeTruthy();
    expect(screen.getByText("Correlation ID")).toBeTruthy();

    const exportBtn = screen.getByRole("button", { name: /Export Audit Log/i });
    expect(exportBtn).toBeTruthy();
    fireEvent.click(exportBtn);

    expect(screen.getByText(/Simulated export of AI Observability logs to CSV/i)).toBeTruthy();
  });
});
