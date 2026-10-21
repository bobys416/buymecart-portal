/**
 * BuyMeCart + IBNK AI Platform Type Definitions
 * Architecture: Self-hosted open-weight AI runtime (Ollama / vLLM compatible),
 * Model Context Protocol (MCP) server & tool integrations,
 * and Maker-Checker Privileged Action Governance.
 *
 * NOTE: Strict Frontend Boundary - All demonstration data is clearly flagged as synthetic.
 * Zero reliance on paid commercial LLM APIs (No OpenAI/Anthropic/Gemini keys required).
 */

export type AiRuntimeType = "ollama" | "vllm" | "llamacpp" | "custom_local";

export interface AiRuntimeStatus {
  endpoint: string;
  runtimeType: AiRuntimeType;
  status: "connected" | "degraded" | "offline";
  version: string;
  gpuDevice: string;
  vramUsedGb: number;
  vramTotalGb: number;
  cpuUtilizationPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  activeContextTokens: number;
  lastPingTimestamp: string;
}

export interface AiModel {
  id: string;
  name: string;
  parameterSize: string;
  quantization: string;
  contextWindowTokens: number;
  status: "ready" | "loading" | "standby" | "error";
  inferenceSpeedTokPerSec: number;
  family: string;
  isDefault: boolean;
  temperature: number;
  topP: number;
}

export interface CopilotToolActivity {
  toolName: string;
  mcpServer: string;
  inputParams: Record<string, any>;
  status: "running" | "completed" | "failed";
  outputSnippet?: string;
  durationMs: number;
}

export interface CopilotProposedAction {
  id: string;
  title: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  requiresPrivilegedApproval: boolean;
  affectedEntityId: string;
  payloadSummary: string;
  status: "proposed" | "submitted_for_approval" | "executed" | "dismissed";
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolsUsed?: CopilotToolActivity[];
  proposedAction?: CopilotProposedAction;
  suggestedFollowUps?: string[];
  isSyntheticDemo: boolean;
}

export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskCaseStatus = "Pending" | "Under Review" | "Escalated" | "Cleared" | "Flagged";

export interface BankingRiskCase {
  id: string;
  caseRef: string;
  transactionId: string;
  retailerName: string;
  amountInr: number;
  serviceCategory: string;
  riskScore: number; // 0 - 100
  severity: RiskSeverity;
  reasonCodes: string[];
  status: RiskCaseStatus;
  detectedAt: string;
  reviewerNotes: string[];
  assignedReviewer?: string;
  deviceId: string;
  ipAddress: string;
  modelVersion: string;
  falsePositiveFlag: boolean;
}

export type WorkflowStatus = "idle" | "running" | "completed" | "failed" | "needs_approval";

export interface WorkflowStep {
  stepIndex: number;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  toolInvoked?: string;
  durationMs: number;
  outputSummary?: string;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  category: "Banking Diagnostic" | "Reconciliation" | "Security & Fraud" | "Compliance & API";
  description: string;
  status: WorkflowStatus;
  lastExecutedAt: string;
  steps: WorkflowStep[];
  failureDetails?: string;
  proposedAction?: string;
  requiresHumanApproval: boolean;
  executionCount: number;
}

export type McpPermissionLevel = "read_only" | "write_capable" | "privileged_action";

export interface McpTool {
  id: string;
  name: string;
  description: string;
  category: string;
  permissionLevel: McpPermissionLevel;
  enabled: boolean;
  requiresApproval: boolean;
  schemaSummary: string;
  totalInvocations: number;
  avgLatencyMs: number;
}

export interface McpServer {
  id: string;
  name: string;
  category: string;
  transport: "stdio" | "sse";
  endpointOrCommand: string;
  status: "connected" | "disconnected" | "error";
  tools: McpTool[];
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  actionCode: string;
  actionTitle: string;
  requesterType: "Agentic AI Workflow" | "Administrator" | "Compliance Copilot";
  requesterName: string;
  targetTenant: string;
  targetResource: string;
  proposedChangesSummary: string;
  riskLevel: RiskSeverity;
  warningNote: string;
  requestedAt: string;
  expiresAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  auditCorrelationId: string;
}

export interface AiPolicyTier {
  tierNumber: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  scope: string;
  humanApprovalRequired: boolean;
  allowedActions: string[];
  prohibitedActions: string[];
  maxDailyRuns: number;
}

export interface AiAuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: "model_inference" | "tool_invocation" | "approval_decision" | "policy_violation" | "workflow_run";
  severity: "info" | "warning" | "critical";
  description: string;
  durationMs: number;
  correlationId: string;
  isSynthetic: boolean;
}

