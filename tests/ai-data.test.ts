import { describe, expect, it } from "vitest";
import {
  initialCopilotMessages,
  mockAgentWorkflows,
  mockAiAuditEvents,
  mockAiModels,
  mockAiPolicies,
  mockAiRuntimeStatus,
  mockApprovalRequests,
  mockBankingRiskCases,
  mockMcpServers,
} from "@/lib/ai/mock-data";

describe("BuyMeCart + IBNK AI Platform Data Models & Governance Policies", () => {
  describe("Local Open-Weight AI Runtime Status", () => {
    it("reports local Ollama / vLLM runtime node telemetry with zero commercial API keys", () => {
      expect(mockAiRuntimeStatus.endpoint).toMatch(/^http:\/\/localhost/);
      expect(mockAiRuntimeStatus.status).toBe("connected");
      expect(mockAiRuntimeStatus.vramTotalGb).toBe(24.0);
      expect(mockAiRuntimeStatus.gpuDevice).toContain("RTX 4090");
    });

    it("verifies self-hosted model catalog and default agent model", () => {
      expect(mockAiModels.length).toBeGreaterThanOrEqual(4);

      const defaultModel = mockAiModels.find((m) => m.isDefault);
      expect(defaultModel).toBeDefined();
      expect(defaultModel?.name).toContain("llama3.3:70b");
      expect(defaultModel?.contextWindowTokens).toBeGreaterThanOrEqual(8192);

      const coderModel = mockAiModels.find((m) => m.name.includes("qwen"));
      expect(coderModel).toBeDefined();
      expect(coderModel?.contextWindowTokens).toBe(32768);
    });
  });

  describe("Clean Zero-State Verification (Zero Dummy Records)", () => {
    it("verifies zero pre-populated banking risk cases, copilot chat, approvals, and audit logs", () => {
      expect(mockBankingRiskCases).toHaveLength(0);
      expect(initialCopilotMessages).toHaveLength(0);
      expect(mockApprovalRequests).toHaveLength(0);
      expect(mockAiAuditEvents).toHaveLength(0);
    });
  });

  describe("Autonomous Agent Workflows", () => {
    it("contains 6 diagnostic and reconciliation workflows with step timelines", () => {
      expect(mockAgentWorkflows.length).toBe(6);

      mockAgentWorkflows.forEach((wf) => {
        expect(wf.steps.length).toBeGreaterThan(0);
        expect(["Banking Diagnostic", "Reconciliation", "Security & Fraud", "Compliance & API"]).toContain(
          wf.category
        );
      });

      const bankHealth = mockAgentWorkflows.find((w) => w.id === "wf-bank-health");
      expect(bankHealth?.status).toBe("completed");
      expect(bankHealth?.steps[0].toolInvoked).toBe("probe_endpoint");
    });
  });

  describe("Model Context Protocol (MCP) Server & Tool Mesh", () => {
    it("registers all 6 required logical MCP servers", () => {
      expect(mockMcpServers.length).toBe(6);

      const serverNames = mockMcpServers.map((s) => s.name);
      expect(serverNames.some((n) => n.includes("Documentation"))).toBe(true);
      expect(serverNames.some((n) => n.includes("Observability"))).toBe(true);
      expect(serverNames.some((n) => n.includes("Reconciliation"))).toBe(true);
      expect(serverNames.some((n) => n.includes("API Registry"))).toBe(true);
      expect(serverNames.some((n) => n.includes("Privileged Action"))).toBe(true);
      expect(serverNames.some((n) => n.includes("Restricted Financial"))).toBe(true);
    });

    it("verifies read-only versus write-capable classification on tools", () => {
      mockMcpServers.forEach((s) => {
        expect(s.tools.length).toBeGreaterThan(0);
        s.tools.forEach((t) => {
          expect(["read_only", "write_capable", "privileged_action"]).toContain(t.permissionLevel);
          expect(t.schemaSummary).toBeDefined();
        });
      });
    });
  });

  describe("4-Tier AI Governance Policy Matrix", () => {
    it("defines clear permissions, allowed actions, and execution limits", () => {
      expect(mockAiPolicies).toHaveLength(4);

      const tier1 = mockAiPolicies.find((p) => p.tierNumber === 1);
      expect(tier1?.humanApprovalRequired).toBe(false);
      expect(tier1?.allowedActions).toContain("search_api_docs");
      expect(tier1?.prohibitedActions).toContain("execute_payout");

      const tier3 = mockAiPolicies.find((p) => p.tierNumber === 3);
      expect(tier3?.humanApprovalRequired).toBe(true);
      expect(tier3?.allowedActions).toContain("submit_privileged_action");
    });
  });
});
