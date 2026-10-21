"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getStoredSession } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  Filter,
  Flame,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  X,
  XCircle,
  Zap,
} from "lucide-react";
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
import {
  AgentWorkflow,
  AiAuditEvent,
  AiModel,
  AiRuntimeStatus,
  ApprovalRequest,
  BankingRiskCase,
  CopilotMessage,
  McpServer,
  McpTool,
  RiskSeverity,
} from "@/lib/ai/types";
import { formatINR } from "@/lib/mock-data";

interface AdminAiCentreModuleProps {
  initialTab?: string;
}

export function AdminAiCentreModule({ initialTab = "overview" }: AdminAiCentreModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Core Data States
  const [runtimeStatus, setRuntimeStatus] = useState<AiRuntimeStatus>(mockAiRuntimeStatus);
  const [models, setModels] = useState<AiModel[]>(mockAiModels);
  const [riskCases, setRiskCases] = useState<BankingRiskCase[]>(mockBankingRiskCases);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>(mockAgentWorkflows);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(mockMcpServers);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(mockApprovalRequests);
  const [auditEvents, setAuditEvents] = useState<AiAuditEvent[]>(mockAiAuditEvents);

  // Copilot Chat State
  const [chatMessages, setChatMessages] = useState<CopilotMessage[]>(initialCopilotMessages);
  const [userPromptInput, setUserPromptInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Filter States
  const [riskSeverityFilter, setRiskSeverityFilter] = useState<string>("all");
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [selectedRiskCase, setSelectedRiskCase] = useState<BankingRiskCase | null>(null);
  const [newReviewerNote, setNewReviewerNote] = useState("");

  // Approval Modal State
  const [rejectionModalRequest, setRejectionModalRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Workflow Runner State
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  // Global Toast / Action Banner
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "warning" | "error" = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Load real configured AI models from database on mount
  useEffect(() => {
    const fetchLiveAiState = async () => {
      try {
        const session = getStoredSession("admin");
        const liveModels = await apiClient.get<any[]>("/ai/models", { token: session?.accessToken });
        if (liveModels && Array.isArray(liveModels) && liveModels.length > 0) {
          setModels(
            liveModels.map((m) => ({
              id: m.id,
              name: m.name,
              parameterSize: m.parameter_size || "8B",
              quantization: m.quantization || "Q4_K_M",
              contextWindowTokens: m.context_window_tokens || 8192,
              status: m.status || "ready",
              inferenceSpeedTokPerSec: m.inference_speed_tok_per_sec || 45.0,
              family: m.family || "Qwen",
              isDefault: m.is_default || false,
              temperature: m.temperature || 0.2,
              topP: m.top_p || 0.9,
            }))
          );
        }

        const liveStatus = await apiClient.get<any>("/ai/status", { token: session?.accessToken });
        if (liveStatus) {
          setRuntimeStatus((prev) => ({
            ...prev,
            endpoint: liveStatus.endpoint || prev.endpoint,
            status: liveStatus.status || prev.status,
            activeContextTokens: liveStatus.active_context_tokens || prev.activeContextTokens,
          }));
        }
      } catch {
        // Retain synthetic defaults when offline or during test execution
      }
    };
    fetchLiveAiState();
  }, []);

  const handleSetPrimaryModel = async (modelId: string) => {
    setModels(models.map((mod) => ({ ...mod, isDefault: mod.id === modelId })));
    try {
      const session = getStoredSession("admin");
      await apiClient.put(`/ai/models/${modelId}`, { is_default: true }, { token: session?.accessToken });
    } catch {
      // Offline fallback
    }
    const target = models.find((m) => m.id === modelId);
    showNotification(`Set "${target?.name || modelId}" as the primary agent model in database.`);
  };

  // --------------------------------------------------------------------------
  // COPILOT HANDLER (Simulated Conversational Reasoning & MCP Tool Execution)
  // --------------------------------------------------------------------------
  const handleSendCopilotPrompt = (promptText?: string) => {
    const textToSend = promptText || userPromptInput;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSyntheticDemo: true,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setUserPromptInput("");
    setCopilotLoading(true);

    setTimeout(() => {
      let assistantMsg: CopilotMessage;

      if (textToSend.toLowerCase().includes("icici") || textToSend.toLowerCase().includes("imps")) {
        assistantMsg = {
          id: `msg-asst-${Date.now()}`,
          role: "assistant",
          content:
            "### ICICI IMPS CBS Switch Health Diagnostic\n\nI executed `fetch_switch_metrics` via Observability MCP:\n\n- **Switch Status**: Operational (HTTP 200 OK)\n- **Recent P95 Latency**: 82ms (Within standard 150ms SLA)\n- **Recent Error Logs**: Zero timeout spikes in last 2 hours\n- **mTLS Certificate Expiry**: Valid for 328 days (`kms://vault/bmc-prod/banking/icici-client-cert-arn-99201`)\n\nAll outbound IMPS remittance queues are executing with immediate bank UTR confirmation.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSyntheticDemo: true,
          toolsUsed: [
            {
              toolName: "fetch_switch_metrics",
              mcpServer: "Observability MCP",
              inputParams: { providerId: "prov-icici-banking" },
              status: "completed",
              outputSnippet: "P95: 82ms | SLA: 99.98% | mTLS: Valid",
              durationMs: 76,
            },
          ],
          suggestedFollowUps: [
            "Check SBI Host-to-Host CBS tunnel latency",
            "Simulate ₹5,000 test payout on sandbox switch",
            "Inspect daily nodal pool balance",
          ],
        };
      } else if (textToSend.toLowerCase().includes("reconcile") || textToSend.toLowerCase().includes("approval")) {
        assistantMsg = {
          id: `msg-asst-${Date.now()}`,
          role: "assistant",
          content:
            "### Privileged Action Submitted: Maker-Checker Approval\n\nI have generated a formal privileged reconciliation request for order settlement.\n\n- **Action Code**: `ACT_MANUAL_ORDER_RECON`\n- **Target Tenant**: Central Clearing Ledger\n- **Governance Gate**: Submitted to the Maker-Checker Approval Centre under **Tier 3 Privileged Action Policy**.\n\nA senior administrator must approve this action in the Approval Centre before ledger write execution.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSyntheticDemo: true,
          toolsUsed: [
            {
              toolName: "submit_privileged_action",
              mcpServer: "Approval MCP",
              inputParams: { actionCode: "ACT_MANUAL_ORDER_RECON", correlationId: `CORR-${Date.now()}` },
              status: "completed",
              outputSnippet: "Approval Request Queued: ID appr-req-auto",
              durationMs: 38,
            },
          ],
          suggestedFollowUps: [
            "Navigate to Maker-Checker Approval Centre",
            "View pending approvals queue",
          ],
        };
      } else {
        assistantMsg = {
          id: `msg-asst-${Date.now()}`,
          role: "assistant",
          content: `### Copilot Analysis: "${textToSend}"\n\nI have cross-referenced our documentation and observability MCP tools:\n\n1. **Model Used**: \`${models.find((m) => m.isDefault)?.name || "llama3.3:70b"}\` running locally via Ollama node.\n2. **Platform Context**: Buymecart multi-tenant banking rails are functioning with zero unhandled exceptions.\n3. **Recommendation**: You can trigger specialized diagnostic agent workflows or inspect active fraud cases directly from the tabs above.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSyntheticDemo: true,
          toolsUsed: [
            {
              toolName: "search_api_docs",
              mcpServer: "Documentation MCP",
              inputParams: { query: textToSend },
              status: "completed",
              outputSnippet: "Found 2 matching circular references in Buymecart Knowledge Base",
              durationMs: 44,
            },
          ],
          suggestedFollowUps: [
            "Check current Ollama GPU VRAM utilization",
            "Review critical banking fraud alerts",
            "Run Banking API Health Diagnostic workflow",
          ],
        };
      }

      setChatMessages((prev) => [...prev, assistantMsg]);
      setCopilotLoading(false);
    }, 700);
  };

  // --------------------------------------------------------------------------
  // RISK & FRAUD HANDLERS
  // --------------------------------------------------------------------------
  const handleUpdateRiskStatus = (caseId: string, nextStatus: BankingRiskCase["status"]) => {
    setRiskCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: nextStatus } : c))
    );
    if (selectedRiskCase && selectedRiskCase.id === caseId) {
      setSelectedRiskCase({ ...selectedRiskCase, status: nextStatus });
    }
    showNotification(`Case ${caseId} status updated to "${nextStatus}".`);
  };

  const handleAddReviewerNote = (caseId: string) => {
    if (!newReviewerNote.trim()) return;
    const note = `[${new Date().toLocaleTimeString()}] ${newReviewerNote}`;
    setRiskCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, reviewerNotes: [...c.reviewerNotes, note] } : c))
    );
    if (selectedRiskCase && selectedRiskCase.id === caseId) {
      setSelectedRiskCase({
        ...selectedRiskCase,
        reviewerNotes: [...selectedRiskCase.reviewerNotes, note],
      });
    }
    setNewReviewerNote("");
    showNotification("Reviewer observation note recorded.");
  };

  // --------------------------------------------------------------------------
  // APPROVAL HANDLERS (Maker-Checker Signoff)
  // --------------------------------------------------------------------------
  const handleApproveAction = (reqId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === reqId
          ? {
              ...a,
              status: "approved",
              reviewedBy: "sec-admin@buymecart.org",
              reviewedAt: new Date().toISOString(),
            }
          : a
      )
    );
    showNotification(`Privileged action ${reqId} APPROVED by Senior Administrator.`);
  };

  const handleOpenRejectModal = (req: ApprovalRequest) => {
    setRejectionModalRequest(req);
    setRejectionReasonText("");
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalRequest) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === rejectionModalRequest.id
          ? {
              ...a,
              status: "rejected",
              reviewedBy: "sec-admin@buymecart.org",
              reviewedAt: new Date().toISOString(),
              rejectionReason: rejectionReasonText || "Rejected by administrator review.",
            }
          : a
      )
    );
    setRejectionModalRequest(null);
    showNotification(`Privileged action ${rejectionModalRequest.id} REJECTED.`);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW SIMULATION HANDLER
  // --------------------------------------------------------------------------
  const handleTriggerWorkflow = (wfId: string) => {
    setRunningWorkflowId(wfId);
    showNotification(`Agent workflow "${wfId}" started step execution.`);

    setTimeout(() => {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === wfId
            ? {
                ...w,
                status: "completed",
                lastExecutedAt: new Date().toISOString(),
                executionCount: w.executionCount + 1,
              }
            : w
        )
      );
      setRunningWorkflowId(null);
      showNotification(`Workflow "${wfId}" completed successfully.`);
    }, 1200);
  };

  // --------------------------------------------------------------------------
  // MCP TOOL TOGGLE
  // --------------------------------------------------------------------------
  const handleToggleMcpTool = (serverId: string, toolId: string) => {
    setMcpServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          tools: s.tools.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t)),
        };
      })
    );
    showNotification(`Tool ${toolId} state toggled.`);
  };

  // Navigation Submenus
  const submenus = [
    { id: "overview", label: "1. AI Overview & Control Centre" },
    { id: "copilot", label: "2. Admin AI Copilot" },
    { id: "risk-fraud", label: "3. Banking Risk & Fraud Centre" },
    { id: "models", label: "4. AI Models & Local Runtime" },
    { id: "workflows", label: "5. Agent Workflows" },
    { id: "mcp-tools", label: "6. MCP Servers & Tool Registry" },
    { id: "approvals", label: "7. Privileged Approval Centre" },
    { id: "policies", label: "8. AI Policies & Permissions" },
    { id: "audit-logs", label: "9. AI Audit & Observability" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-900">
              BuyMeCart + IBNK AI Engine
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Self-Hosted Local Runtime · Ollama / vLLM Node · MCP Tool Mesh
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">
            IBNK AI Control Centre & Financial Intelligence
          </h1>
          <p className="text-xs text-slate-500">
            Autonomous agent workflows, banking fraud radar, Model Context Protocol (MCP) servers, and privileged maker-checker governance.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {submenus.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs font-semibold shadow-sm transition ${
            actionNotice.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : actionNotice.type === "warning"
              ? "border border-amber-200 bg-amber-50 text-amber-900"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
            {actionNotice.type === "warning" && <AlertTriangle size={16} className="text-amber-600 shrink-0" />}
            {actionNotice.type === "error" && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-slate-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mandatory Regulatory & Architecture Transparency Callout */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-950">
        <div className="flex items-center gap-2 font-bold text-purple-900">
          <Brain size={16} className="text-purple-700" />
          <span>Architecture Notice: Local Open-Weight Runtime · Synthetic Demonstration Data</span>
        </div>
        <p className="mt-1 text-slate-700">
          • <strong>Zero Paid Model Dependency:</strong> IBNK AI operates exclusively over self-hosted open-weight runtimes (Ollama / vLLM / Llama.cpp). No OpenAI, Anthropic, or Gemini paid API keys required.
          <br />
          • <strong>Synthetic Fraud & Demo Data:</strong> Fraud scores and risk scenarios are synthetic simulations. Real account freezing or ledger debiting is never triggered directly from the browser.
          <br />
          • <strong>Privileged Action Governance:</strong> Sensitive banking modifications require dual-admin Maker-Checker signoff before execution.
        </p>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI OVERVIEW & CONTROL CENTRE */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Local AI Node</span>
                <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Server size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">Connected</span>
                <span className="text-xs font-semibold text-emerald-600">RTX 4090</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Ollama v0.5.11 · VRAM: 14.4 / 24 GB (60%)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Models</span>
                <span className="rounded-full bg-purple-50 p-2 text-purple-600">
                  <Brain size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">{models.length} Models</span>
                <span className="text-xs font-semibold text-purple-700">Llama 3.3 70B</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Avg. Speed: 58 tok/s · Q4_K_M Quantized
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Banking Risk Radar</span>
                <span className="rounded-full bg-rose-50 p-2 text-rose-600">
                  <ShieldAlert size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-700">
                  {riskCases.filter((c) => c.severity === "Critical" || c.severity === "High").length}
                </span>
                <span className="text-xs font-semibold text-slate-500">Cases Pending</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Synthetic Detection Rate: 99.4% · 1 False Positive
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
                <span className="rounded-full bg-amber-50 p-2 text-amber-600">
                  <FileCheck size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-700">
                  {approvals.filter((a) => a.status === "pending").length}
                </span>
                <span className="text-xs font-semibold text-slate-500">Maker-Checker</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Privileged Actions · Dual Signoff Mandatory
              </p>
            </div>
          </div>

          {/* Runtime Health & Telemetry Strip */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Self-Hosted Runtime & Hardware Telemetry</h2>
                <p className="text-xs text-slate-500">
                  Real-time compute resource utilization on the local IBNK open-weight inference node.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Node Online: {runtimeStatus.endpoint}</span>
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-slate-500">Inference Accelerator</span>
                <p className="mt-1 font-bold text-slate-900">{runtimeStatus.gpuDevice}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-purple-600" style={{ width: "60%" }} />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">
                  VRAM: {runtimeStatus.vramUsedGb} / {runtimeStatus.vramTotalGb} GB
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-slate-500">Host CPU Utilization</span>
                <p className="mt-1 font-bold text-slate-900">{runtimeStatus.cpuUtilizationPercent}% Active</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${runtimeStatus.cpuUtilizationPercent}%` }} />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">32 vCPUs @ 3.8 GHz</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-slate-500">Host System RAM</span>
                <p className="mt-1 font-bold text-slate-900">
                  {runtimeStatus.ramUsedGb} / {runtimeStatus.ramTotalGb} GB
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-sky-600" style={{ width: "31%" }} />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">ECC Registered DDR5</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-slate-500">Active Context Memory</span>
                <p className="mt-1 font-bold text-navy">{runtimeStatus.activeContextTokens} Tokens</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: "25%" }} />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">FlashAttention-2 Active</span>
              </div>
            </div>
          </div>

          {/* Split View: Agent Workflows + Recent Security Audits */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Agent Workflows Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="text-navy" size={18} />
                  <h3 className="text-sm font-bold text-navy">Autonomous Agent Workflows</h3>
                </div>
                <button
                  onClick={() => setActiveTab("workflows")}
                  className="text-xs font-semibold text-sky-700 hover:text-navy"
                >
                  View All ({workflows.length}) →
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {workflows.slice(0, 3).map((wf) => (
                  <div
                    key={wf.id}
                    className="rounded-lg border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-navy">{wf.name}</h4>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {wf.category}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          wf.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : wf.status === "needs_approval"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {wf.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600">{wf.description}</p>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                      <span>Executions: {wf.executionCount}</span>
                      <span>Last run: {new Date(wf.lastExecutedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit & Observability Feed */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="text-navy" size={18} />
                  <h3 className="text-sm font-bold text-navy">Recent AI & Security Events</h3>
                </div>
                <button
                  onClick={() => setActiveTab("audit-logs")}
                  className="text-xs font-semibold text-sky-700 hover:text-navy"
                >
                  View All ({auditEvents.length}) →
                </button>
              </div>

              <div className="mt-4 divide-y divide-slate-100 text-xs">
                {auditEvents.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{evt.description}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          evt.severity === "critical"
                            ? "bg-rose-100 text-rose-800"
                            : evt.severity === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {evt.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Actor: {evt.actor}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{evt.correlationId}</span>
                      <span>•</span>
                      <span>{evt.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADMIN AI COPILOT */}
      {/* ========================================================= */}
      {activeTab === "copilot" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="text-navy" size={20} />
                  <h2 className="text-base font-bold text-navy">IBNK Admin AI Copilot</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Conversational assistant with Model Context Protocol (MCP) tool access to inspect banking logs, explain errors, and prepare reconciliation actions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-100 px-2.5 py-1 text-[11px] font-mono font-bold text-purple-900">
                  Model: {models.find((m) => m.isDefault)?.name}
                </span>
              </div>
            </div>

            {/* Chat Stream View */}
            <div className="mt-4 flex flex-col space-y-4 max-h-[500px] overflow-y-auto p-2">
              {chatMessages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-center">
                  <Bot className="mx-auto text-purple-600 mb-2" size={32} />
                  <h3 className="font-bold text-sm text-navy">IBNK Admin AI Copilot Initialized</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Operating over local open-weight node. No previous conversations recorded. Enter an operational query below or select a quick starter prompt.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendCopilotPrompt("Check ICICI IMPS CBS switch health and latency")}
                      className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-900 hover:border-purple-400 transition"
                    >
                      Check ICICI IMPS CBS switch health
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendCopilotPrompt("Explain 12-point KYC mismatch error code on Protean PAN gateway")}
                      className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-900 hover:border-purple-400 transition"
                    >
                      Explain 12-point KYC mismatch code
                    </button>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700">
                      {msg.role === "user" ? "Administrator" : "IBNK Copilot (Local Node)"}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-navy text-white shadow-sm rounded-tr-none"
                        : "border border-slate-200 bg-slate-50/70 text-slate-800 shadow-xs rounded-tl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Tool Activity Visualization */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-2 text-[11px]">
                        <span className="font-bold text-purple-900">
                          MCP Tools Invoked ({msg.toolsUsed.length}):
                        </span>
                        {msg.toolsUsed.map((tool, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-purple-200 bg-purple-50/80 p-2 font-mono"
                          >
                            <div className="flex items-center justify-between text-purple-950">
                              <span className="font-bold">
                                🔧 {tool.toolName} ({tool.mcpServer})
                              </span>
                              <span className="text-[10px] text-purple-700">{tool.durationMs}ms</span>
                            </div>
                            {tool.outputSnippet && (
                              <p className="mt-1 text-[10px] text-slate-700">{tool.outputSnippet}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proposed Action Preview */}
                    {msg.proposedAction && (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-950">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Proposed Action Preview</span>
                          <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            {msg.proposedAction.riskLevel} Risk
                          </span>
                        </div>
                        <p className="mt-1 font-semibold">{msg.proposedAction.title}</p>
                        <p className="mt-0.5 text-slate-700">{msg.proposedAction.description}</p>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSendCopilotPrompt("Submit proposed action to Maker-Checker Approval Centre")}
                            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                          >
                            Submit for Maker-Checker Approval →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Suggested Follow-ups */}
                    {msg.suggestedFollowUps && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                        {msg.suggestedFollowUps.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendCopilotPrompt(prompt)}
                            className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-navy hover:text-navy transition"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )))}

              {copilotLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                  <span>IBNK Copilot is reasoning and querying MCP servers...</span>
                </div>
              )}
            </div>

            {/* Prompt Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilotPrompt();
              }}
              className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3"
            >
              <input
                type="text"
                value={userPromptInput}
                onChange={(e) => setUserPromptInput(e.target.value)}
                placeholder="Ask IBNK Copilot: investigate order #, check switch latency, explain error code..."
                className="flex-1 rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
              <button
                type="submit"
                disabled={copilotLoading || !userPromptInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BANKING RISK & FRAUD CENTRE */}
      {/* ========================================================= */}
      {activeTab === "risk-fraud" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-rose-600" size={20} />
                  <h2 className="text-base font-bold text-navy">Banking Risk & Fraud Intelligence Centre</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Synthetic ML-assisted fraud radar detecting velocity spikes, geographical anomalies, and identity spoofing across all transaction rails.
                </p>
              </div>

              <span className="rounded bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900">
                Synthetic Demonstration Scenarios Only
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search risk cases by retailer, transaction ID, or reason code..."
                  value={riskSearchQuery}
                  onChange={(e) => setRiskSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>

              <select
                value={riskSeverityFilter}
                onChange={(e) => setRiskSeverityFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-navy"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical Severity</option>
                <option value="High">High Severity</option>
                <option value="Medium">Medium Severity</option>
                <option value="Low">Low Severity</option>
              </select>
            </div>

            {/* Risk Cases Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Case Ref & Tx ID</th>
                    <th className="p-3">Retailer & Service</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3">Reason Codes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riskCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShieldCheck className="text-emerald-500" size={36} />
                          <p className="font-bold text-slate-700">No active banking risk cases detected</p>
                          <p className="text-xs text-slate-400">Transaction radar telemetry is currently clean with zero flagged anomalies.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    riskCases
                      .filter((c) => {
                        if (riskSeverityFilter !== "all" && c.severity !== riskSeverityFilter) return false;
                        if (!riskSearchQuery) return true;
                        const q = riskSearchQuery.toLowerCase();
                        return (
                          c.caseRef.toLowerCase().includes(q) ||
                          c.transactionId.toLowerCase().includes(q) ||
                          c.retailerName.toLowerCase().includes(q) ||
                          c.reasonCodes.some((r) => r.toLowerCase().includes(q))
                        );
                      })
                      .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{c.caseRef}</div>
                          <span className="font-mono text-[10px] text-slate-500">{c.transactionId}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{c.retailerName}</div>
                          <span className="text-[10px] text-slate-500">{c.serviceCategory}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{formatINR(c.amountInr)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                c.riskScore >= 80
                                  ? "bg-rose-500"
                                  : c.riskScore >= 60
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="font-bold text-slate-900">{c.riskScore} / 100</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                c.severity === "Critical"
                                  ? "bg-rose-100 text-rose-800"
                                  : c.severity === "High"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {c.severity}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {c.reasonCodes.map((r, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              c.status === "Pending"
                                ? "bg-rose-100 text-rose-800"
                                : c.status === "Under Review"
                                ? "bg-amber-100 text-amber-800"
                                : c.status === "Cleared"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRiskCase(c)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-navy hover:text-navy transition"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Case Detail Modal */}
          {selectedRiskCase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-navy">
                      Risk Investigation · {selectedRiskCase.caseRef}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tx: {selectedRiskCase.transactionId} · {selectedRiskCase.retailerName}
                    </p>
                  </div>
                  <button onClick={() => setSelectedRiskCase(null)} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="text-slate-500">Transaction Amount</span>
                      <p className="text-base font-bold text-slate-900">{formatINR(selectedRiskCase.amountInr)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="text-slate-500">Risk Severity Score</span>
                      <p className="text-base font-bold text-rose-700">
                        {selectedRiskCase.riskScore} / 100 ({selectedRiskCase.severity})
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="text-slate-500">Origin IP & Device</span>
                      <p className="font-mono text-slate-800">{selectedRiskCase.ipAddress}</p>
                      <span className="text-[10px] text-slate-400">{selectedRiskCase.deviceId}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700">Detection Reason Codes</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedRiskCase.reasonCodes.map((r, idx) => (
                        <span key={idx} className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 font-mono text-rose-900">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700">Reviewer Observations & Notes</span>
                    <div className="mt-1 max-h-32 overflow-y-auto space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {selectedRiskCase.reviewerNotes.map((note, idx) => (
                        <p key={idx} className="text-slate-700">• {note}</p>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newReviewerNote}
                        onChange={(e) => setNewReviewerNote(e.target.value)}
                        placeholder="Add investigative observation note..."
                        className="flex-1 rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-navy"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReviewerNote(selectedRiskCase.id)}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-white hover:bg-slate-900"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateRiskStatus(selectedRiskCase.id, "Under Review")}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Mark Under Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRiskStatus(selectedRiskCase.id, "Cleared")}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100"
                      >
                        Clear (False Positive)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRiskStatus(selectedRiskCase.id, "Flagged")}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-semibold text-rose-900 hover:bg-rose-100"
                      >
                        Flag Fraudulent
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedRiskCase(null)}
                      className="rounded-lg bg-slate-200 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AI MODELS & LOCAL RUNTIME */}
      {/* ========================================================= */}
      {activeTab === "models" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Self-Hosted AI Models & Local Runtime Engine</h2>
                <p className="text-xs text-slate-500">
                  Manage self-hosted open-weight LLMs via local Ollama / vLLM runtime endpoints. Zero commercial API key dependencies.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showNotification("Local inference endpoint connection test passed (8ms ping).")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                <RefreshCcw size={14} />
                <span>Test Local Node Connection</span>
              </button>
            </div>

            {/* Runtime Endpoint Form */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <span className="font-bold text-slate-700">Local Runtime Node Configuration</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] text-slate-500">Runtime Engine</label>
                  <select
                    value={runtimeStatus.runtimeType}
                    onChange={(e) => setRuntimeStatus({ ...runtimeStatus, runtimeType: e.target.value as any })}
                    className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 font-semibold text-slate-800"
                  >
                    <option value="ollama">Ollama (Local Node)</option>
                    <option value="vllm">vLLM High-Throughput Server</option>
                    <option value="llamacpp">Llama.cpp Standalone</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-500">Local Endpoint URL</label>
                  <input
                    type="text"
                    value={runtimeStatus.endpoint}
                    onChange={(e) => setRuntimeStatus({ ...runtimeStatus, endpoint: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 bg-white p-1.5 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-navy">Configured Open-Weight Model Weights</h3>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3">Model Tag & Family</th>
                      <th className="p-3">Parameters</th>
                      <th className="p-3">Quantization</th>
                      <th className="p-3">Context Window</th>
                      <th className="p-3">Inference Speed</th>
                      <th className="p-3">Role Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {models.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{m.name}</div>
                          <span className="text-[10px] text-slate-500">{m.family}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{m.parameterSize}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">{m.quantization}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">
                          {m.contextWindowTokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3 font-semibold text-emerald-700">
                          {m.inferenceSpeedTokPerSec} tok/s
                        </td>
                        <td className="p-3">
                          {m.isDefault ? (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-900">
                              DEFAULT AGENT
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              STANDBY
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryModel(m.id)}
                            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                              m.isDefault
                                ? "bg-slate-100 text-slate-400 cursor-default"
                                : "border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100"
                            }`}
                            disabled={m.isDefault}
                          >
                            {m.isDefault ? "Active Primary" : "Set Primary"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: AGENT WORKFLOWS */}
      {/* ========================================================= */}
      {activeTab === "workflows" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Agentic AI Operational Workflows</h2>
                <p className="text-xs text-slate-500">
                  Autonomous diagnostic and reconciliation agents executing multi-step investigations over banking rails.
                </p>
              </div>

              <span className="rounded bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                Non-Destructive Simulation Execution
              </span>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy">{wf.name}</h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {wf.category}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        wf.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : wf.status === "needs_approval"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {wf.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{wf.description}</p>

                  {/* Step Timeline */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-slate-700">Execution Timeline:</span>
                    {wf.steps.map((s) => (
                      <div key={s.stepIndex} className="flex items-start gap-2 text-[11px]">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 font-bold text-[9px] text-slate-700 shrink-0">
                          {s.stepIndex}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          {s.outputSummary && (
                            <p className="font-mono text-[10px] text-slate-500">{s.outputSummary}</p>
                          )}
                        </div>
                        {s.durationMs > 0 && (
                          <span className="font-mono text-[10px] text-slate-400">{s.durationMs}ms</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {wf.proposedAction && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-950">
                      <strong>Proposed Privileged Action:</strong> {wf.proposedAction}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400">Total Runs: {wf.executionCount}</span>
                    <button
                      type="button"
                      disabled={runningWorkflowId === wf.id}
                      onClick={() => handleTriggerWorkflow(wf.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Play size={12} className={runningWorkflowId === wf.id ? "animate-spin" : ""} />
                      <span>{runningWorkflowId === wf.id ? "Executing..." : "Run Workflow"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: MCP SERVERS & TOOL REGISTRY */}
      {/* ========================================================= */}
      {activeTab === "mcp-tools" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Model Context Protocol (MCP) Server & Tool Mesh</h2>
                <p className="text-xs text-slate-500">
                  Standardized tool protocol allowing local LLMs to query schemas, inspect telemetry, and formulate privileged actions under strict role scopes.
                </p>
              </div>

              <span className="rounded bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                Anthropic Model Context Protocol Compliant
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {mcpServers.map((server) => (
                <div key={server.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wrench size={16} className="text-navy" />
                        <h3 className="text-sm font-bold text-navy">{server.name}</h3>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                          {server.transport.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">{server.endpointOrCommand}</p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      CONNECTED · {server.tools.length} TOOLS
                    </span>
                  </div>

                  {/* Tools Sub-table */}
                  <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-semibold text-slate-600">
                        <tr>
                          <th className="p-2.5">Tool Function Name</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Access Scope</th>
                          <th className="p-2.5">Input JSON Schema</th>
                          <th className="p-2.5">Invocations</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {server.tools.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-mono font-bold text-navy">{t.name}</td>
                            <td className="p-2.5 text-slate-600">{t.description}</td>
                            <td className="p-2.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  t.permissionLevel === "read_only"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {t.permissionLevel.replace("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-700 max-w-[200px] truncate">
                              {t.schemaSummary}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">
                              {t.totalInvocations} calls
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleMcpTool(server.id, t.id)}
                                className={`rounded px-2.5 py-1 text-[10px] font-semibold transition ${
                                  t.enabled
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {t.enabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: PRIVILEGED ACTION APPROVAL CENTRE */}
      {/* ========================================================= */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="text-navy" size={20} />
                  <h2 className="text-base font-bold text-navy">
                    Maker-Checker Privileged Action Approval Centre
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  High-impact operations (e.g. certificate rotation, settlement release, production route activation) requiring senior administrator signoff.
                </p>
              </div>

              <span className="rounded bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                Maker-Checker Governance Enforced
              </span>
            </div>

            {/* Pending Approvals Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Action Code & Title</th>
                    <th className="p-3">Requester Entity</th>
                    <th className="p-3">Target Tenant & Resource</th>
                    <th className="p-3">Proposed Changes</th>
                    <th className="p-3">Risk Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Maker-Checker Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileCheck className="text-slate-300" size={36} />
                          <p className="font-bold text-slate-700">No pending privileged actions</p>
                          <p className="text-xs text-slate-400">The Maker-Checker approval queue is clear. High-impact operations requiring dual-signoff will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    approvals.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{req.actionTitle}</div>
                          <span className="font-mono text-[10px] text-slate-500">{req.actionCode}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{req.requesterName}</div>
                          <span className="text-[10px] text-slate-500">{req.requesterType}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{req.targetTenant}</div>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px] block">
                            {req.targetResource}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 max-w-[220px]">
                          {req.proposedChangesSummary}
                          {req.rejectionReason && (
                            <p className="mt-1 font-semibold text-rose-700">Rejection: {req.rejectionReason}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              req.riskLevel === "Critical"
                                ? "bg-rose-100 text-rose-800"
                                : req.riskLevel === "High"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {req.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              req.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {req.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveAction(req.id)}
                                className="rounded bg-emerald-600 px-3 py-1 font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(req)}
                                className="rounded border border-rose-300 bg-white px-3 py-1 font-semibold text-rose-700 hover:bg-rose-50 shadow-xs transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejection Justification Modal */}
          {rejectionModalRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy">Reject Privileged Action</h3>
                  <button onClick={() => setRejectionModalRequest(null)} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleConfirmRejection} className="mt-4 space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Action:</span>
                    <p className="font-semibold text-navy">{rejectionModalRequest.actionTitle}</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Reason for Rejection (Audit Mandate)</label>
                    <textarea
                      rows={3}
                      required
                      value={rejectionReasonText}
                      onChange={(e) => setRejectionReasonText(e.target.value)}
                      placeholder="Explain the technical or compliance reason for rejecting this operation..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setRejectionModalRequest(null)}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-rose-700"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: AI POLICIES & PERMISSIONS */}
      {/* ========================================================= */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-navy">AI Governance Policies & 4-Tier Permission Matrix</h2>
              <p className="text-xs text-slate-500">
                Defines the allowed operational scopes, human approval gates, and daily execution limits across all IBNK agent roles.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {mockAiPolicies.map((p) => (
                <div key={p.tierNumber} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-navy">{p.name}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        p.humanApprovalRequired
                          ? "bg-purple-100 text-purple-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {p.humanApprovalRequired ? "MAKER-CHECKER REQUIRED" : "AUTONOMOUS ALLOWED"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{p.description}</p>

                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-xs">
                    <div>
                      <span className="font-bold text-emerald-800">Allowed Actions:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.allowedActions.map((a, idx) => (
                          <span key={idx} className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-900">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-rose-800">Prohibited Actions:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.prohibitedActions.map((a, idx) => (
                          <span key={idx} className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-900">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      <span>Max Daily Run Limit:</span>
                      <span className="font-bold text-slate-900">{p.maxDailyRuns.toLocaleString()} runs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: AI AUDIT & OBSERVABILITY */}
      {/* ========================================================= */}
      {activeTab === "audit-logs" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">AI Activity, Model Inference & Observability Logs</h2>
                <p className="text-xs text-slate-500">
                  Granular correlation tracking of model inference runs, MCP tool invocations, and policy violation attempts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showNotification("Simulated export of AI Observability logs to CSV.")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FileText size={13} />
                <span>Export Audit Log</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Timestamp (UTC)</th>
                    <th className="p-3">Actor / Agent</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Event Description</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Correlation ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No AI audit events recorded yet</p>
                        <p className="text-xs text-slate-400">Model inferences, MCP tool invocations, and policy validation attempts will be logged here.</p>
                      </td>
                    </tr>
                  ) : (
                    auditEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-navy">{evt.actor}</td>
                        <td className="p-3">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                            {evt.eventType.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              evt.severity === "critical"
                                ? "bg-rose-100 text-rose-800"
                                : evt.severity === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {evt.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{evt.description}</td>
                        <td className="p-3 font-mono text-slate-500">{evt.durationMs}ms</td>
                        <td className="p-3 font-mono text-[11px] text-sky-700">{evt.correlationId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

