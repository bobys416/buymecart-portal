"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCode,
  FileJson,
  Filter,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Network,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Webhook,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  mockApiProviders,
  mockConnectionConfigs,
  mockServiceMappings,
  mockApiProducts,
  mockApiClients,
  mockUsageMetrics,
  mockSecurityAuditLogs,
  mockApiKeys,
  validateSsrfSafeUrl,
} from "@/lib/api-management/mock-data";
import {
  ApiClientAccount,
  ApiConnectionConfig,
  ApiKeyRecord,
  ApiProduct,
  ApiProvider,
  ApiServiceMapping,
  AuthMethod,
  HttpMethod,
} from "@/lib/api-management/types";
import { formatINR } from "@/lib/mock-data";

interface AdminApiManagementModuleProps {
  initialTab?: string;
}

export function AdminApiManagementModule({ initialTab = "overview" }: AdminApiManagementModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Core Data States
  const [providers, setProviders] = useState<ApiProvider[]>(mockApiProviders);
  const [connections, setConnections] = useState<ApiConnectionConfig[]>(mockConnectionConfigs);
  const [services, setServices] = useState<ApiServiceMapping[]>(mockServiceMappings);
  const [products, setProducts] = useState<ApiProduct[]>(mockApiProducts);
  const [clients, setClients] = useState<ApiClientAccount[]>(mockApiClients);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(mockApiKeys);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [providerCategoryFilter, setProviderCategoryFilter] = useState("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");

  // Feedback Notification Banner
  const [actionNotification, setActionNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "warning" | "error" = "success") => {
    setActionNotification({ type, message });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // -------------------------------------------------------------
  // TAB B: PROVIDER REGISTRY ACTIONS & STATE
  // -------------------------------------------------------------
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProviderData, setNewProviderData] = useState({
    name: "",
    category: "banking_rail" as const,
    description: "",
    websiteUrl: "",
    docsUrl: "",
    environment: "sandbox" as const,
    contactEmail: "",
    supportedServicesInput: "",
  });

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const urlValidation = validateSsrfSafeUrl(newProviderData.websiteUrl);
    if (!urlValidation.safe) {
      showNotification(`Security Alert: ${urlValidation.reason}`, "error");
      return;
    }

    const newProvider: ApiProvider = {
      id: `prov-${Date.now().toString().slice(-6)}`,
      name: newProviderData.name,
      category: newProviderData.category,
      description: newProviderData.description,
      websiteUrl: newProviderData.websiteUrl,
      docsUrl: newProviderData.docsUrl || newProviderData.websiteUrl,
      environment: newProviderData.environment,
      status: "pending_approval",
      healthStatus: "unmonitored",
      lastHealthCheck: new Date().toISOString(),
      averageLatencyMs: 120,
      uptimePercentage: 99.5,
      supportedServices: newProviderData.supportedServicesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      contactEmail: newProviderData.contactEmail,
      productionApproved: false,
    };

    setProviders([newProvider, ...providers]);
    setShowAddProviderModal(false);
    showNotification(
      `Provider "${newProvider.name}" registered in Sandbox. Maker-Checker signoff required for production.`
    );
    setNewProviderData({
      name: "",
      category: "banking_rail",
      description: "",
      websiteUrl: "",
      docsUrl: "",
      environment: "sandbox",
      contactEmail: "",
      supportedServicesInput: "",
    });
  };

  const handleToggleProviderStatus = (id: string) => {
    const target = providers.find((p) => p.id === id);
    if (!target) return;

    if (target.environment === "production" && target.status === "inactive" && !target.productionApproved) {
      showNotification(
        "Security Guard: Unapproved production banking rails cannot be toggled active without compliance signoff.",
        "error"
      );
      return;
    }

    const nextStatus = target.status === "active" ? "inactive" : "active";
    setProviders(providers.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    showNotification(`Provider "${target.name}" status updated to ${nextStatus.toUpperCase()}.`);
  };

  // -------------------------------------------------------------
  // TAB C: CONNECTION CONFIGURATION STATE
  // -------------------------------------------------------------
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(connections[0]?.id || "");
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId) || connections[0];

  // -------------------------------------------------------------
  // TAB D: SERVICE MAPPING STATE
  // -------------------------------------------------------------
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || "");
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  // -------------------------------------------------------------
  // TAB E: SANDBOX TESTER STATE
  // -------------------------------------------------------------
  const [testEndpoint, setTestEndpoint] = useState<string>("/payments/imps/transfer");
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
        accountNumber: "99201004561234",
        ifsc: "SBIN0001234",
        amount: 2500,
        customerRef: "SANDBOX-REF-001",
        purpose: "DMT Payout Simulation",
      },
      null,
      2
    )
  );
  const [testExecuting, setTestExecuting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    latencyMs: number;
    schemaValid: boolean;
    responseBody: any;
    timestamp: string;
  } | null>(null);

  const handleExecuteSandboxTest = () => {
    setTestExecuting(true);
    setTestResult(null);

    setTimeout(() => {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch {
        parsed = { raw: testPayload };
      }

      setTestResult({
        status: 200,
        latencyMs: Math.floor(65 + Math.random() * 85),
        schemaValid: true,
        responseBody: {
          success: true,
          status: "SUCCESSFUL_SIMULATION",
          bankUtr: `TEST-UTR-${Date.now().toString().slice(-8)}`,
          networkRrn: `RRN${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          settledAt: new Date().toISOString(),
          environment: "sandbox_isolated",
          simulatedPayload: parsed,
          notice: "Sanitized Sandbox Execution · Zero Real Capital Dispatched",
        },
        timestamp: new Date().toLocaleTimeString(),
      });
      setTestExecuting(false);
      showNotification("Sandbox call executed successfully against partner simulator.");
    }, 800);
  };

  // -------------------------------------------------------------
  // TAB F: PRODUCT BUILDER STATE
  // -------------------------------------------------------------
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    slug: "",
    version: "v1.0",
    description: "",
    rateLimitRpm: 1000,
    dailyQuota: 500000,
    pricingModelRef: "STATUTORY_TEMPERED_MARGIN_TIER_1",
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: ApiProduct = {
      id: `prod-bmc-${Date.now().toString().slice(-6)}`,
      name: newProductData.name,
      slug: newProductData.slug || newProductData.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      version: newProductData.version,
      description: newProductData.description,
      includedServiceIds: ["PAY_UPI_COLLECT"],
      includedServicesCount: 1,
      authRequirements: ["Bearer Token", "IP Allowlist"],
      rateLimitRpm: Number(newProductData.rateLimitRpm),
      dailyQuota: Number(newProductData.dailyQuota),
      pricingModelRef: newProductData.pricingModelRef,
      publicationStatus: "draft",
      sandboxAvailable: true,
      productionAvailable: false,
      developerDocsSnippet: `curl -X POST https://api.buymecart.org/${newProductData.version}/${newProductData.slug} \\\n  -H 'Authorization: Bearer <TOKEN>'`,
      subscribersCount: 0,
    };

    setProducts([newProd, ...products]);
    setShowAddProductModal(false);
    showNotification(`API Product "${newProd.name}" created as DRAFT.`);
  };

  // -------------------------------------------------------------
  // TAB G: DEVELOPER / CLIENT MANAGEMENT STATE
  // -------------------------------------------------------------
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState<{
    clientName: string;
    organization: string;
    contactEmail: string;
    rateLimitTier: ApiClientAccount["rateLimitTier"];
    ipAllowlistInput: string;
  }>({
    clientName: "",
    organization: "",
    contactEmail: "",
    rateLimitTier: "Growth",
    ipAllowlistInput: "",
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newCli: ApiClientAccount = {
      id: `cli-${Date.now().toString().slice(-6)}`,
      clientName: newClientData.clientName,
      organization: newClientData.organization,
      contactEmail: newClientData.contactEmail,
      clientId: `bmc_client_${newClientData.clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`,
      clientSecretMasked: `kms://vault/bmc-clients/${newClientData.clientName.toLowerCase().slice(0, 5)}/sec-hash-masked`,
      subscribedProductIds: ["prod-bmc-bharatqr"],
      status: "active",
      rateLimitTier: newClientData.rateLimitTier,
      ipAllowlist: newClientData.ipAllowlistInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      totalCallsThisMonth: 0,
      monthlyQuota: newClientData.rateLimitTier === "Enterprise High Volume" ? 5000000 : 1000000,
      joinedDate: new Date().toISOString().split("T")[0],
    };

    setClients([newCli, ...clients]);
    setShowAddClientModal(false);
    showNotification(`Client "${newCli.clientName}" registered with KMS credential reference.`);
  };

  // -------------------------------------------------------------
  // TAB J: API KEY & SERVICE MANAGER HANDLERS & MODAL STATES
  // -------------------------------------------------------------
  const [showUpdateKeyModal, setShowUpdateKeyModal] = useState(false);
  const [selectedKeyToUpdate, setSelectedKeyToUpdate] = useState<ApiKeyRecord | null>(null);
  const [newKeySecretValue, setNewKeySecretValue] = useState("");
  const [newKmsArnRef, setNewKmsArnRef] = useState("");
  const [keyUpdateReason, setKeyUpdateReason] = useState("Routine security rotation / compliance refresh");

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    internalServiceId: "",
    internalServiceName: "",
    serviceCategory: "Collections",
    providerId: "prov-razorpay",
    endpointPath: "/v1/charges",
    httpMethod: "POST" as HttpMethod,
    pricingPlanRef: "STATUTORY_TEMPERED_MARGIN_TIER_1",
    eligibilityRolesInput: "admin, super_distributor, area_distributor, retailer",
  });

  const handleOpenKeyUpdateModal = (key: ApiKeyRecord) => {
    setSelectedKeyToUpdate(key);
    setNewKmsArnRef(key.kmsArnRef);
    setNewKeySecretValue("");
    setShowUpdateKeyModal(true);
  };

  const handleSubmitKeyUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyToUpdate) return;

    const maskedSnippet = newKeySecretValue
      ? `${newKeySecretValue.slice(0, 8)}********${newKeySecretValue.slice(-4)}`
      : selectedKeyToUpdate.maskedKey;

    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === selectedKeyToUpdate.id
          ? {
              ...k,
              maskedKey: maskedSnippet,
              kmsArnRef: newKmsArnRef || k.kmsArnRef,
              lastRotated: new Date().toISOString(),
              status: "active",
            }
          : k
      )
    );

    setShowUpdateKeyModal(false);
    showNotification(
      `API Key for "${selectedKeyToUpdate.providerName}" (${selectedKeyToUpdate.keyLabel}) successfully rotated. Vault reference updated.`
    );
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceData.internalServiceId || !newServiceData.internalServiceName) return;

    const provider = providers.find((p) => p.id === newServiceData.providerId);
    const roles = newServiceData.eligibilityRolesInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const newSvc: ApiServiceMapping = {
      id: `map-${Date.now().toString().slice(-6)}`,
      internalServiceId: newServiceData.internalServiceId.toUpperCase(),
      internalServiceName: newServiceData.internalServiceName,
      serviceCategory: newServiceData.serviceCategory,
      providerId: newServiceData.providerId,
      providerName: provider ? provider.name : "Custom Partner Switch",
      endpointId: `ep-custom-${Date.now().toString().slice(-4)}`,
      endpointPath: newServiceData.endpointPath,
      httpMethod: newServiceData.httpMethod,
      isActive: true,
      eligibilityRoles: roles.length > 0 ? roles : ["admin"],
      pricingPlanRef: newServiceData.pricingPlanRef,
      sandboxTested: true,
      sandboxApprovedAt: new Date().toISOString(),
      productionReady: true,
      inputValidationRules: ["parameters must be non-empty"],
      fieldTransformations: [],
    };

    setServices([newSvc, ...services]);
    setShowAddServiceModal(false);
    showNotification(
      `New API Service "${newSvc.internalServiceName}" (${newSvc.internalServiceId}) successfully provisioned!`
    );
    setNewServiceData({
      internalServiceId: "",
      internalServiceName: "",
      serviceCategory: "Collections",
      providerId: "prov-razorpay",
      endpointPath: "/v1/charges",
      httpMethod: "POST",
      pricingPlanRef: "STATUTORY_TEMPERED_MARGIN_TIER_1",
      eligibilityRolesInput: "admin, super_distributor, area_distributor, retailer",
    });
  };

  const handleToggleServiceStatus = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    const target = services.find((s) => s.id === id);
    showNotification(
      `Service "${target?.internalServiceName}" status toggled to ${!target?.isActive ? "ACTIVE" : "INACTIVE"}.`
    );
  };

  const handleDeleteService = (id: string) => {
    const target = services.find((s) => s.id === id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    showNotification(`Service "${target?.internalServiceName}" removed from catalog.`);
  };

  // Navigation Submenus Array
  const submenus = [
    { id: "overview", label: "A. API Overview" },
    { id: "providers", label: "B. Provider Registry" },
    { id: "connections", label: "C. Connection Config" },
    { id: "service-mapping", label: "D. Service Mapping" },
    { id: "sandbox", label: "E. Testing & Sandbox" },
    { id: "products", label: "F. API Product Builder" },
    { id: "clients", label: "G. Developer & Client Mgmt" },
    { id: "analytics", label: "H. Analytics & Billing" },
    { id: "security", label: "I. Security & Audit" },
    { id: "key-manager", label: "J. API Keys & Services Manager" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              Admin Gateway & Open Banking
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → API Platform Management
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">
            API Integration & API Business Management
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise orchestration of banking rails, third-party payment adapters, service schemas, developer products, and API billing.
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

      {/* Global Action Notification Banner */}
      {actionNotification && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs font-semibold shadow-sm transition ${
            actionNotification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : actionNotification.type === "warning"
              ? "border border-amber-200 bg-amber-50 text-amber-900"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotification.type === "success" && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
            {actionNotification.type === "warning" && <AlertTriangle size={16} className="text-amber-600 shrink-0" />}
            {actionNotification.type === "error" && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            <span>{actionNotification.message}</span>
          </div>
          <button
            onClick={() => setActionNotification(null)}
            className="text-slate-500 hover:text-slate-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Security Notice Callout */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950">
        <div className="flex items-center gap-2 font-bold text-sky-900">
          <ShieldCheck size={16} className="text-sky-700" />
          <span>Buymecart Zero-Trust API Architecture & Statutory Compliance</span>
        </div>
        <p className="mt-1 text-slate-700">
          • <strong>KMS Vault References:</strong> Plain-text API secrets, tokens, or private keys are never stored in frontend code or client state.
          • <strong>Production Activation Guard:</strong> Unapproved production switches cannot be toggled without dual-admin maker-checker signoff.
          • <strong>SSRF Isolation:</strong> Outbound test endpoints are strictly validated against internal VPC CIDRs, metadata IP 169.254.169.254, and non-HTTPS protocols.
        </p>
      </div>

      {/* ========================================================= */}
      {/* TAB A: API OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Configured Providers</span>
                <span className="rounded-full bg-indigo-50 p-2 text-indigo-600">
                  <Server size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">{providers.length}</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {providers.filter((p) => p.status === "active").length} Active
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {providers.filter((p) => p.environment === "production").length} Production ·{" "}
                {providers.filter((p) => p.environment === "sandbox").length} Sandbox
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Overall Success Rate</span>
                <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Activity size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">100.0%</span>
                <span className="text-xs font-semibold text-slate-500">Live Health</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Zero Failures · All Upstream Switches Operational
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">P95 Network Latency</span>
                <span className="rounded-full bg-sky-50 p-2 text-sky-600">
                  <Clock size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">88 ms</span>
                <span className="text-xs font-semibold text-emerald-600">Direct CBS Rail</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Sub-100ms threshold maintained across ICICI & SBI
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">API Gateway Daily Volume</span>
                <span className="rounded-full bg-purple-50 p-2 text-purple-600">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">0</span>
                <span className="text-xs font-semibold text-slate-500">Req / Day</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Est. Platform Billing: {formatINR(0)}
              </p>
            </div>
          </div>

          {/* Provider Health Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Provider Health & Connection Telemetry</h2>
                <p className="text-xs text-slate-500">
                  Real-time status checks across all configured upstream banking and payment switches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showNotification("Refreshed all upstream API ping diagnostics.")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw size={13} />
                  <span>Check Switches</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 p-3.5 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-navy">{p.name}</h3>
                      <span className="text-[10px] font-mono uppercase text-slate-500">
                        {p.category.replace("_", " ")}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Environment:</span>
                      <p className="font-semibold capitalize text-slate-800">{p.environment}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Latency:</span>
                      <p className="font-semibold text-slate-800">{p.averageLatencyMs} ms</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Uptime:</span>
                      <p className="font-semibold text-emerald-700">{p.uptimePercentage}%</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Production Auth:</span>
                      <p className="font-semibold text-slate-800">
                        {p.productionApproved ? "Approved ✓" : "Pending ⏳"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Alerts & Recent Events */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Operational Alerts */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertCircle className="text-amber-600" size={18} />
                <h3 className="text-sm font-bold text-navy">Operational API Alerts</h3>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <div className="flex items-center justify-between font-bold">
                    <span>Stripe Gateway Pending Production Signoff</span>
                    <span className="text-[10px] text-amber-700">Sandbox Only</span>
                  </div>
                  <p className="mt-1 text-slate-700">
                    Stripe cross-border international processing is configured in Sandbox. Dual maker-checker verification needed before live credit card disbursement.
                  </p>
                </div>

                <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>KMS Vault Key Rotation Scheduled</span>
                    <span className="text-[10px] text-sky-700">In 12 Days</span>
                  </div>
                  <p className="mt-1 text-slate-700">
                    Automated rotation scheduled for ICICI Open Banking mTLS certificate key reference <code>kms://vault/bmc-prod/banking/...</code>.
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>NPCI BBPS Central Node Operating Normally</span>
                    <span className="text-[10px] text-emerald-700">99.91% Uptime</span>
                  </div>
                  <p className="mt-1 text-slate-700">
                    All electricity and telecom biller queues are synchronizing with sub-second response times.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Integration Events */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="text-navy" size={18} />
                <h3 className="text-sm font-bold text-navy">Recent Gateway & Schema Events</h3>
              </div>

              <div className="mt-4 divide-y divide-slate-100 text-xs">
                {mockSecurityAuditLogs.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{evt.description}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Admin: {evt.adminEmail}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{evt.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB B: PROVIDER REGISTRY */}
      {/* ========================================================= */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Upstream API Provider Registry</h2>
                <p className="text-xs text-slate-500">
                  Register, configure, and maintain connections to banking switches, payment gateways, and KYC identity authorities.
                </p>
              </div>

              <button
                onClick={() => setShowAddProviderModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={14} />
                <span>Register New Provider</span>
              </button>
            </div>

            {/* Filter Controls */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus-within:border-navy focus-within:bg-white focus-within:ring-1 focus-within:ring-navy transition">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search providers by name, category, or supported service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>

              <select
                value={providerCategoryFilter}
                onChange={(e) => setProviderCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-navy"
              >
                <option value="all">All Categories</option>
                <option value="banking_rail">Core Banking Rails</option>
                <option value="payment_gateway">Payment Gateways</option>
                <option value="identity_verification">KYC & Identity</option>
                <option value="bbps_switch">NPCI BBPS Central Switch</option>
              </select>
            </div>

            {/* Providers Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Provider Name & Category</th>
                    <th className="p-3">Environment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Health & Latency</th>
                    <th className="p-3">Supported Services</th>
                    <th className="p-3">Production Approval</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providers
                    .filter((p) => {
                      if (providerCategoryFilter !== "all" && p.category !== providerCategoryFilter) {
                        return false;
                      }
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        p.category.toLowerCase().includes(q) ||
                        p.supportedServices.some((s) => s.toLowerCase().includes(q))
                      );
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{p.name}</div>
                          <span className="font-mono text-[10px] uppercase text-slate-500">
                            {p.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.environment === "production"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.environment.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{p.averageLatencyMs} ms</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Uptime: {p.uptimePercentage}%
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {p.supportedServices.slice(0, 2).map((s, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                            {p.supportedServices.length > 2 && (
                              <span className="text-[10px] text-slate-500">
                                +{p.supportedServices.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {p.productionApproved ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 size={12} />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock size={12} />
                              <span>Pending Signoff</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleProviderStatus(p.id)}
                              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                                p.status === "active"
                                  ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {p.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <a
                              href={p.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1 text-slate-400 hover:text-navy"
                              title="Provider Documentation"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Register New Provider */}
          {showAddProviderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy">Register New API Provider</h3>
                  <button onClick={() => setShowAddProviderModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateProvider} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700">Provider Name</label>
                    <input
                      type="text"
                      required
                      value={newProviderData.name}
                      onChange={(e) => setNewProviderData({ ...newProviderData, name: e.target.value })}
                      placeholder="e.g. Yes Bank Corporate IMPS Gateway"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700">Category</label>
                      <select
                        value={newProviderData.category}
                        onChange={(e) => setNewProviderData({ ...newProviderData, category: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      >
                        <option value="banking_rail">Core Banking Rail</option>
                        <option value="payment_gateway">Payment Gateway</option>
                        <option value="identity_verification">Identity / KYC Verification</option>
                        <option value="bbps_switch">NPCI BBPS Central Switch</option>
                        <option value="telecom_utility">Telecom / Utility API</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700">Environment</label>
                      <select
                        value={newProviderData.environment}
                        onChange={(e) => setNewProviderData({ ...newProviderData, environment: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      >
                        <option value="sandbox">Sandbox (Testing)</option>
                        <option value="production">Production (Requires Signoff)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Base Website URL (HTTPS)</label>
                    <input
                      type="url"
                      required
                      value={newProviderData.websiteUrl}
                      onChange={(e) => setNewProviderData({ ...newProviderData, websiteUrl: e.target.value })}
                      placeholder="https://developer.partnerbank.com"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Supported Services (Comma-separated)</label>
                    <input
                      type="text"
                      value={newProviderData.supportedServicesInput}
                      onChange={(e) => setNewProviderData({ ...newProviderData, supportedServicesInput: e.target.value })}
                      placeholder="e.g. IMPS Payout, Penny Drop, Virtual Account"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Primary Technical Contact Email</label>
                    <input
                      type="email"
                      required
                      value={newProviderData.contactEmail}
                      onChange={(e) => setNewProviderData({ ...newProviderData, contactEmail: e.target.value })}
                      placeholder="api-team@partnerbank.com"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddProviderModal(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-navy px-4 py-2 font-bold text-white shadow-sm hover:bg-slate-800"
                    >
                      Save & Register Provider
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB C: CONNECTION CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === "connections" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">API Connection & Protocol Configuration</h2>
                <p className="text-xs text-slate-500">
                  Configure base URLs, KMS credential vaults, schema mappings, retry policies, and webhook handlers.
                </p>
              </div>

              {/* Provider Connection Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Active Connection:</span>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-navy outline-none focus:border-navy"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.providerName} ({c.environment.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedConnection && (
              <div className="mt-6 space-y-6">
                {/* Protocol & Vault Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Gateway & Authentication Protocol
                    </h3>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base URL:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedConnection.baseUrl}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Authentication Method:</span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                          {selectedConnection.authMethod.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Environment:</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedConnection.environment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KMS Credential Vault Card */}
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Secure Credential Storage (AWS KMS)
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <Lock size={12} />
                        <span>Zero Plain-Text</span>
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500">Managed Vault Reference:</span>
                        <div className="mt-1 flex items-center justify-between rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-800">
                          <span className="truncate">{selectedConnection.credentialRef}</span>
                          <Copy
                            size={14}
                            className="shrink-0 cursor-pointer text-slate-500 hover:text-navy"
                            onClick={() => showNotification("KMS reference copied to clipboard.")}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Last Rotated:</span>
                        <span>{new Date(selectedConnection.credentialLastRotated).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const key = apiKeys.find((k) => k.providerId === selectedConnection.providerId) || apiKeys[0];
                            handleOpenKeyUpdateModal(key);
                          }}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                        >
                          <KeyRound size={13} />
                          <span>Update / Rotate Connection Secret</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endpoints Configured */}
                <div>
                  <h3 className="text-sm font-bold text-navy">Configured Endpoints & Schema Maps</h3>
                  <div className="mt-3 space-y-3">
                    {selectedConnection.endpoints.map((ep) => (
                      <div
                        key={ep.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                                ep.method === "POST"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="font-mono text-xs font-bold text-navy">{ep.path}</span>
                            <span className="text-xs text-slate-500">({ep.name})</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>Timeout: {ep.timeoutMs}ms</span>
                            <span>•</span>
                            <span>Retries: {ep.retryCount}x</span>
                            <span>•</span>
                            <span>Signature: {ep.requiresSignature ? "Required" : "None"}</span>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">{ep.description}</p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[11px]">
                          <div className="rounded bg-white p-2 border border-slate-200">
                            <span className="font-bold text-slate-600">Request Schema Pattern:</span>
                            <p className="mt-0.5 font-mono text-slate-800">{ep.requestSchemaSummary}</p>
                          </div>
                          <div className="rounded bg-white p-2 border border-slate-200">
                            <span className="font-bold text-slate-600">Response Schema Pattern:</span>
                            <p className="mt-0.5 font-mono text-slate-800">{ep.responseSchemaSummary}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Mapping Table */}
                <div>
                  <h3 className="text-sm font-bold text-navy">Provider Error Code to Buymecart Translation</h3>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-semibold text-slate-600">
                        <tr>
                          <th className="p-2.5">Upstream Provider Code</th>
                          <th className="p-2.5">Internal Buymecart Code</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Automated Engine Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedConnection.errorMappings.map((err, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-semibold text-rose-700">{err.providerCode}</td>
                            <td className="p-2.5 font-mono font-bold text-navy">{err.internalCode}</td>
                            <td className="p-2.5 text-slate-600">{err.description}</td>
                            <td className="p-2.5">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  err.action === "retry"
                                    ? "bg-amber-100 text-amber-800"
                                    : err.action === "flag_suspicious"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {err.action.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB D: SERVICE MAPPING */}
      {/* ========================================================= */}
      {activeTab === "service-mapping" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Internal Service to Provider Endpoint Mapping</h2>
                <p className="text-xs text-slate-500">
                  Maps internal Buymecart transaction services (UPI, DMT, BBPS, PAN) to underlying upstream banking switches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                  Tempered Margin Engine Decoupled
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Plus size={14} />
                  <span>+ Add API Service</span>
                </button>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Internal Service</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Mapped Provider & Endpoint</th>
                    <th className="p-3">Authorized Roles</th>
                    <th className="p-3">Pricing Ref</th>
                    <th className="p-3">Sandbox Test</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-bold text-navy">{svc.internalServiceName}</div>
                        <span className="font-mono text-[10px] text-slate-500">{svc.internalServiceId}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {svc.serviceCategory}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{svc.providerName}</div>
                        <span className="font-mono text-[10px] text-sky-700">
                          {svc.httpMethod} {svc.endpointPath}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {svc.eligibilityRoles.map((r, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-semibold text-indigo-700">
                          {svc.pricingPlanRef}
                        </span>
                      </td>
                      <td className="p-3">
                        {svc.sandboxTested ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 size={12} />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Clock size={12} />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            svc.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {svc.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleServiceStatus(svc.id)}
                          className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                            svc.isActive
                              ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {svc.isActive ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB E: TESTING & SANDBOX */}
      {/* ========================================================= */}
      {activeTab === "sandbox" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="text-navy" size={18} />
                  <h2 className="text-base font-bold text-navy">API Testing & Sandbox Console</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Safely validate request schemas, mock partner responses, and test error handling without touching live funds.
                </p>
              </div>

              <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                Sandbox Mode (Simulated Payouts Only)
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Request Builder Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Target Endpoint</label>
                  <select
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs text-slate-800 outline-none focus:border-navy"
                  >
                    <option value="/payments/imps/transfer">POST /payments/imps/transfer (ICICI IMPS Payout)</option>
                    <option value="/verification/penny-drop">POST /verification/penny-drop (Penny Drop Account Validation)</option>
                    <option value="/orders">POST /orders (Razorpay Order Init)</option>
                    <option value="/pan/verify-comprehensive">POST /pan/verify-comprehensive (Protean PAN Check)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">JSON Request Payload (Sanitized)</label>
                    <span className="text-[11px] text-slate-400">Schema validated</span>
                  </div>
                  <textarea
                    rows={8}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-800 outline-none focus:border-navy"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Headers: <code>X-Client-Id: BMC_SANDBOX</code>
                  </span>
                  <button
                    onClick={handleExecuteSandboxTest}
                    disabled={testExecuting}
                    className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Play size={13} className={testExecuting ? "animate-spin" : ""} />
                    <span>{testExecuting ? "Dispatching..." : "Execute Sandbox Test"}</span>
                  </button>
                </div>
              </div>

              {/* Response Inspector */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-mono text-xs font-bold text-emerald-400">Response Inspector</span>
                  {testResult && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono font-bold text-emerald-300">
                        {testResult.status} OK
                      </span>
                      <span className="text-slate-400">{testResult.latencyMs}ms</span>
                    </div>
                  )}
                </div>

                {testResult ? (
                  <div className="mt-3">
                    <pre className="max-h-72 overflow-y-auto font-mono text-[11px] text-emerald-300">
                      {JSON.stringify(testResult.responseBody, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="mt-12 text-center text-xs text-slate-500">
                    Click &quot;Execute Sandbox Test&quot; to inspect partner switch response and schema validation.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB F: API PRODUCT BUILDER */}
      {/* ========================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Exposed API Products & Developer Catalog</h2>
                <p className="text-xs text-slate-500">
                  Package internal banking and payment rails into commercial API products exposed to authorized corporate fintech clients.
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={14} />
                <span>Define New API Product</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {products.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-navy">{p.name}</h3>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                          {p.version}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{p.description}</p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.publicationStatus === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.publicationStatus === "review_pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.publicationStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="text-slate-500">Rate Limit:</span>
                      <p className="font-semibold text-slate-800">{p.rateLimitRpm} RPM</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Daily Quota:</span>
                      <p className="font-semibold text-slate-800">{p.dailyQuota.toLocaleString()} calls</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Subscribers:</span>
                      <p className="font-semibold text-navy">{p.subscribersCount} Client Apps</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Pricing Plan:</span>
                      <p className="font-mono text-[10px] font-bold text-indigo-700">{p.pricingModelRef}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded bg-slate-50 p-2 text-[11px]">
                    <span className="font-semibold text-slate-700">Developer cURL Preview:</span>
                    <pre className="mt-1 overflow-x-auto font-mono text-[10px] text-slate-800">
                      {p.developerDocsSnippet}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal: Create API Product */}
          {showAddProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy">Define Commercial API Product</h3>
                  <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700">Product Title</label>
                    <input
                      type="text"
                      required
                      value={newProductData.name}
                      onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                      placeholder="e.g. Buymecart Instant Payouts Engine"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700">API Version</label>
                      <input
                        type="text"
                        value={newProductData.version}
                        onChange={(e) => setNewProductData({ ...newProductData, version: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700">Rate Limit (RPM)</label>
                      <input
                        type="number"
                        value={newProductData.rateLimitRpm}
                        onChange={(e) => setNewProductData({ ...newProductData, rateLimitRpm: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Commercial Description</label>
                    <textarea
                      rows={3}
                      required
                      value={newProductData.description}
                      onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                      placeholder="Describes the product for corporate API clients..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-navy px-4 py-2 font-bold text-white shadow-sm hover:bg-slate-800"
                    >
                      Save API Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB G: DEVELOPER & CLIENT MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">Corporate Clients & Developer Applications</h2>
                <p className="text-xs text-slate-500">
                  Manage registered business accounts, issue credentials via KMS vault references, and monitor subscription quotas.
                </p>
              </div>

              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={14} />
                <span>Register Client Application</span>
              </button>
            </div>

            {/* Clients Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Client App & Organization</th>
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Credential Reference (KMS)</th>
                    <th className="p-3">Quota Tier</th>
                    <th className="p-3">Calls This Month</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="text-slate-300" size={32} />
                          <p className="font-semibold text-slate-700">No developer client applications registered yet</p>
                          <p className="text-xs text-slate-400">Click &quot;Register Client Application&quot; to issue corporate API credentials.</p>
                          <button
                            onClick={() => setShowAddClientModal(true)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                          >
                            <Plus size={13} /> + Register Client Application
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clients.map((cli) => (
                      <tr key={cli.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{cli.clientName}</div>
                          <span className="text-[10px] text-slate-500">{cli.organization}</span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-800">{cli.clientId}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                            <Lock size={11} className="text-emerald-600" />
                            <span>{cli.clientSecretMasked}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            {cli.rateLimitTier}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{cli.totalCallsThisMonth.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-500">
                            of {cli.monthlyQuota.toLocaleString()} quota
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              cli.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : cli.status === "pending_kyc"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {cli.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => showNotification(`Rotated KMS credentials for client "${cli.clientName}".`)}
                            className="rounded border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Rotate Secret
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Register Client Application */}
          {showAddClientModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy">Register Developer Client App</h3>
                  <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateClient} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700">Application Name</label>
                    <input
                      type="text"
                      required
                      value={newClientData.clientName}
                      onChange={(e) => setNewClientData({ ...newClientData, clientName: e.target.value })}
                      placeholder="e.g. Apex Merchant Checkout"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">Organization / Legal Entity</label>
                    <input
                      type="text"
                      required
                      value={newClientData.organization}
                      onChange={(e) => setNewClientData({ ...newClientData, organization: e.target.value })}
                      placeholder="e.g. Apex Retail Solutions Pvt Ltd"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-slate-700">Contact Email</label>
                      <input
                        type="email"
                        required
                        value={newClientData.contactEmail}
                        onChange={(e) => setNewClientData({ ...newClientData, contactEmail: e.target.value })}
                        placeholder="dev@client.com"
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700">Quota Tier</label>
                      <select
                        value={newClientData.rateLimitTier}
                        onChange={(e) => setNewClientData({ ...newClientData, rateLimitTier: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                      >
                        <option value="Starter">Starter (50K / mo)</option>
                        <option value="Growth">Growth (1M / mo)</option>
                        <option value="Enterprise High Volume">Enterprise High Volume (5M+ / mo)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700">IP Allowlist (CIDRs / IPs comma-separated)</label>
                    <input
                      type="text"
                      value={newClientData.ipAllowlistInput}
                      onChange={(e) => setNewClientData({ ...newClientData, ipAllowlistInput: e.target.value })}
                      placeholder="e.g. 103.21.244.0/24, 49.207.180.12"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-navy px-4 py-2 font-bold text-white shadow-sm hover:bg-slate-800"
                    >
                      Register & Issue Secret
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB H: ANALYTICS & BILLING */}
      {/* ========================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-navy">API Consumption, Latency & Metered Billing</h2>
                <p className="text-xs text-slate-500">
                  Granular usage telemetry across all client applications with estimated platform billing.
                </p>
              </div>

              <span className="text-xs text-slate-500">
                Billing Cycle: <strong>October 2026 (Live Meter)</strong>
              </span>
            </div>

            {/* Daily Usage Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total Requests</th>
                    <th className="p-3">Successful</th>
                    <th className="p-3">Failed / Retried</th>
                    <th className="p-3">Average Latency</th>
                    <th className="p-3 text-right">Billable Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockUsageMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No API consumption telemetry recorded yet</p>
                        <p className="text-xs text-slate-400">Metered traffic will automatically appear as developer clients execute requests.</p>
                      </td>
                    </tr>
                  ) : (
                    mockUsageMetrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-semibold text-slate-800">{m.date}</td>
                        <td className="p-3 font-bold text-navy">{m.totalRequests.toLocaleString()}</td>
                        <td className="p-3 text-emerald-700 font-semibold">{m.successfulRequests.toLocaleString()}</td>
                        <td className="p-3 text-rose-700 font-semibold">{m.failedRequests.toLocaleString()}</td>
                        <td className="p-3 font-mono">{m.avgLatencyMs} ms</td>
                        <td className="p-3 text-right font-bold text-navy">{formatINR(m.billableAmountInr)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <strong>Notice on Final Settlement:</strong> All indicated billable amounts represent frontend telemetry estimates. Official financial invoices and GST deductions are verified by the central clearing ledger during EOD batch execution.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB I: API SECURITY & AUDIT */}
      {/* ========================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-navy" size={18} />
                <h2 className="text-base font-bold text-navy">API Security, Vault Rotation & Administrative Audit Trail</h2>
              </div>
              <p className="text-xs text-slate-500">
                Permanent immutable log of authentication failures, rate limit events, KMS secret rotations, and production authorizations.
              </p>
            </div>

            {/* Audit Log Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Timestamp (UTC)</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Event Description</th>
                    <th className="p-3">Admin / Principal</th>
                    <th className="p-3">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockSecurityAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No security audit events recorded yet</p>
                        <p className="text-xs text-slate-400">Administrative rotations, authorization signoffs, and WAF blocks will be logged here.</p>
                      </td>
                    </tr>
                  ) : (
                    mockSecurityAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold uppercase text-slate-700">
                          {log.category.replace("_", " ")}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              log.severity === "critical"
                                ? "bg-rose-100 text-rose-800"
                                : log.severity === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{log.description}</td>
                        <td className="p-3 font-mono text-[11px] text-sky-700">{log.adminEmail}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{log.ipAddress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB J: API KEYS & SERVICES MANAGER */}
      {/* ========================================================= */}
      {activeTab === "key-manager" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="text-navy" size={20} />
                  <h2 className="text-base font-bold text-navy">
                    API Keys, Secret Vault & Services Management
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Update API keys, rotate cryptographic certificates, manage KMS vault references, and provision new internal API services on the fly.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Plus size={14} />
                  <span>+ Add Any API Service</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] font-semibold text-slate-500">Monitored API Keys</span>
                <p className="text-lg font-bold text-navy">
                  {apiKeys.length} Keys ({apiKeys.filter((k) => k.status === "active").length} Active)
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] font-semibold text-slate-500">Provisioned Services</span>
                <p className="text-lg font-bold text-navy">
                  {services.length} Services ({services.filter((s) => s.isActive).length} Enabled)
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] font-semibold text-slate-500">Production Key Vaults</span>
                <p className="text-lg font-bold text-purple-700">
                  {apiKeys.filter((k) => k.environment === "production").length} Production ARNs
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[11px] font-semibold text-slate-500">Encryption Standard</span>
                <p className="text-lg font-bold text-emerald-700">AWS KMS AES-256 GCM</p>
              </div>
            </div>
          </div>

          {/* Section 1: API Keys & Secrets Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-navy">Upstream Provider API Keys, Tokens & Certificates</h3>
                <p className="text-xs text-slate-500">
                  Secure cryptographic credentials used by Buymecart to connect to ICICI, SBI, Razorpay, Stripe, and Protean.
                </p>
              </div>

              <span className="rounded bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                Zero Plain-Text Policy Enforced
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Provider & Key Label</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Env</th>
                    <th className="p-3">Current Masked Credential</th>
                    <th className="p-3">Managed KMS Vault ARN</th>
                    <th className="p-3">Last Rotated</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <KeyRound className="text-slate-300" size={32} />
                          <p className="font-semibold text-slate-700">No API keys provisioned yet</p>
                          <p className="text-xs text-slate-400">Add an upstream provider API key or connection secret to get started.</p>
                          <button
                            onClick={() => setShowAddServiceModal(true)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                          >
                            <Plus size={13} /> + Provision API Service / Key
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy">{key.providerName}</div>
                          <span className="text-[11px] text-slate-600">{key.keyLabel}</span>
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700 uppercase">
                            {key.keyType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              key.environment === "production"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {key.environment.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-800">{key.maskedKey}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                            <Lock size={11} className="text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[200px]">{key.kmsArnRef}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(key.lastRotated).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {key.status.toUpperCase()}
                          </span>
                        </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenKeyUpdateModal(key)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:border-navy hover:text-navy transition"
                        >
                          <KeyRound size={12} />
                          <span>Update Key</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Services Catalog & Creator Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div>
                <h3 className="text-sm font-bold text-navy">Internal API Services Catalog & Dynamic Provisioning</h3>
                <p className="text-xs text-slate-500">
                  Provision new services, map endpoints, and manage role permissions across all transactional channels.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddServiceModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={14} />
                <span>+ Provision New Service</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Service Code & Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Mapped Provider & Endpoint</th>
                    <th className="p-3">Pricing Reference</th>
                    <th className="p-3">Authorized Roles</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-bold text-navy">{svc.internalServiceName}</div>
                        <span className="font-mono text-[10px] text-slate-500">{svc.internalServiceId}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {svc.serviceCategory}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{svc.providerName}</div>
                        <span className="font-mono text-[10px] text-sky-700">
                          {svc.httpMethod} {svc.endpointPath}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] font-semibold text-indigo-700">
                        {svc.pricingPlanRef}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {svc.eligibilityRoles.map((r, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            svc.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {svc.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceStatus(svc.id)}
                            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                              svc.isActive
                                ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {svc.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(svc.id)}
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            title="Remove Service"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: UPDATE / ROTATE API KEY MODAL */}
      {/* ========================================================= */}
      {showUpdateKeyModal && selectedKeyToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy">Update / Rotate API Key & Secret</h3>
                <p className="text-xs text-slate-500">
                  {selectedKeyToUpdate.providerName} · {selectedKeyToUpdate.keyLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateKeyModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitKeyUpdate} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-500">Current Key Reference:</span>
                <p className="font-mono font-bold text-slate-800">{selectedKeyToUpdate.maskedKey}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-500 truncate">{selectedKeyToUpdate.kmsArnRef}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700">
                  New API Key / Secret Value (Optional / Encrypted into KMS)
                </label>
                <input
                  type="password"
                  value={newKeySecretValue}
                  onChange={(e) => setNewKeySecretValue(e.target.value)}
                  placeholder="Paste new raw key or leave blank to only update KMS ARN..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                />
                <span className="text-[10px] text-slate-400">
                  Raw values are masked immediately and stored as cryptographic KMS vault references.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700">AWS KMS Vault ARN Reference</label>
                <input
                  type="text"
                  required
                  value={newKmsArnRef}
                  onChange={(e) => setNewKmsArnRef(e.target.value)}
                  placeholder="kms://vault/bmc-prod/provider/key-ref-id"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Change Reason / Audit Justification</label>
                <input
                  type="text"
                  required
                  value={keyUpdateReason}
                  onChange={(e) => setKeyUpdateReason(e.target.value)}
                  placeholder="e.g. Scheduled quarterly rotation / emergency revocation"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                <strong>Security Guard:</strong> Rotating this key updates downstream runtime adapters immediately. A permanent record of this rotation is logged in the administrative audit trail.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateKeyModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-navy px-4 py-2 font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  Authorize & Rotate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PROVISION NEW API SERVICE MODAL */}
      {/* ========================================================= */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy">Provision New Buymecart API Service</h3>
                <p className="text-xs text-slate-500">
                  Register any payment, payout, KYC, or utility service and map it to an upstream provider.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-4 space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700">Internal Service Code</label>
                  <input
                    type="text"
                    required
                    value={newServiceData.internalServiceId}
                    onChange={(e) =>
                      setNewServiceData({
                        ...newServiceData,
                        internalServiceId: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    placeholder="e.g. BBPS_FASTAG_RECHARGE"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700">Service Category</label>
                  <select
                    value={newServiceData.serviceCategory}
                    onChange={(e) =>
                      setNewServiceData({ ...newServiceData, serviceCategory: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                  >
                    <option value="Collections">Collections (UPI / Cards / NetBanking)</option>
                    <option value="Payouts & Remittance">Payouts & Remittance (IMPS / NEFT)</option>
                    <option value="Compliance & KYC">Compliance & KYC Verification</option>
                    <option value="Utility & BBPS">Utility & BBPS Services</option>
                    <option value="Banking Rail">Core Banking Rail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Service Display Name</label>
                <input
                  type="text"
                  required
                  value={newServiceData.internalServiceName}
                  onChange={(e) =>
                    setNewServiceData({ ...newServiceData, internalServiceName: e.target.value })
                  }
                  placeholder="e.g. National FASTag Electronic Toll Recharge"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700">Mapped Upstream Provider</label>
                  <select
                    value={newServiceData.providerId}
                    onChange={(e) =>
                      setNewServiceData({ ...newServiceData, providerId: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.environment.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700">HTTP Method</label>
                  <select
                    value={newServiceData.httpMethod}
                    onChange={(e) =>
                      setNewServiceData({ ...newServiceData, httpMethod: e.target.value as HttpMethod })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Endpoint Path</label>
                <input
                  type="text"
                  required
                  value={newServiceData.endpointPath}
                  onChange={(e) =>
                    setNewServiceData({ ...newServiceData, endpointPath: e.target.value })
                  }
                  placeholder="/v2/toll/fastag/recharge"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700">Pricing Plan Reference</label>
                  <input
                    type="text"
                    required
                    value={newServiceData.pricingPlanRef}
                    onChange={(e) =>
                      setNewServiceData({ ...newServiceData, pricingPlanRef: e.target.value })
                    }
                    placeholder="STATUTORY_TEMPERED_MARGIN_TIER_1"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700">Authorized Roles (Comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={newServiceData.eligibilityRolesInput}
                    onChange={(e) =>
                      setNewServiceData({ ...newServiceData, eligibilityRolesInput: e.target.value })
                    }
                    placeholder="admin, super_distributor, area_distributor, retailer"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-950">
                <strong>Architecture Notice:</strong> Provider integration is decoupled from the statutory tempered-margin pricing schedule. Margin rules remain governed by platform commercial templates.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-navy px-4 py-2 font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  Provision & Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

