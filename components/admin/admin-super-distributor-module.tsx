"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  KeyRound,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { formatINR } from "@/lib/mock-data";

interface SuperDistributor {
  id: string;
  name: string;
  companyName: string;
  email: string;
  rmn: string;
  territory: string;
  authorizedLimit: number;
  currentBalance: number;
  activeAdCount: number;
  downstreamRetailers: number;
  monthlyVolume: number;
  commissionEarned: number;
  status: "Active" | "Suspended" | "Pending Review";
  mfaRequired: boolean;
  maxSingleAdLimit: number;
  createdAt: string;
}

const initialSuperDistributors: SuperDistributor[] = [
  {
    id: "SD-CENTRAL-01",
    name: "Arun Singh",
    companyName: "Central Spark FinTech Pvt Ltd",
    email: "arun.sd@bspark.org",
    rmn: "9826019921",
    territory: "Central India Region",
    authorizedLimit: 25000000,
    currentBalance: 8450000,
    activeAdCount: 8,
    downstreamRetailers: 142,
    monthlyVolume: 48500000,
    commissionEarned: 145500,
    status: "Active",
    mfaRequired: true,
    maxSingleAdLimit: 2500000,
    createdAt: "2025-06-15",
  },
  {
    id: "SD-WEST-01",
    name: "Kishore Patil",
    companyName: "Western Nexus Payments Ltd",
    email: "kishore.sd@bspark.org",
    rmn: "9819283741",
    territory: "Western Zone Division",
    authorizedLimit: 30000000,
    currentBalance: 12200000,
    activeAdCount: 12,
    downstreamRetailers: 215,
    monthlyVolume: 62400000,
    commissionEarned: 187200,
    status: "Active",
    mfaRequired: true,
    maxSingleAdLimit: 3000000,
    createdAt: "2025-08-20",
  },
  {
    id: "SD-SOUTH-01",
    name: "Priya Nair",
    companyName: "Deccan Financial Rails Ltd",
    email: "priya.sd@bspark.org",
    rmn: "9740192834",
    territory: "Southern Zone Division",
    authorizedLimit: 20000000,
    currentBalance: 6100000,
    activeAdCount: 6,
    downstreamRetailers: 98,
    monthlyVolume: 34100000,
    commissionEarned: 102300,
    status: "Active",
    mfaRequired: true,
    maxSingleAdLimit: 2000000,
    createdAt: "2025-11-04",
  },
];

interface AdminSuperDistributorModuleProps {
  initialTab?: string;
}

export function AdminSuperDistributorModule({
  initialTab = "directory",
}: AdminSuperDistributorModuleProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [superDistributors, setSuperDistributors] = useState<SuperDistributor[]>(
    initialSuperDistributors
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSd, setSelectedSd] = useState<SuperDistributor | null>(null);

  // New SD Form State
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    rmn: "",
    territory: "",
    authorizedLimit: "10000000",
    maxSingleAdLimit: "1500000",
    commissionTier: "standard",
    mfaRequired: true,
  });
  const [createSuccess, setCreateSuccess] = useState(false);

  // Limit Adjustment Modal
  const [adjustingSd, setAdjustingSd] = useState<SuperDistributor | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [newMaxAdLimit, setNewMaxAdLimit] = useState("");
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  const filteredSds = superDistributors.filter((sd) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sd.name.toLowerCase().includes(q) ||
      sd.companyName.toLowerCase().includes(q) ||
      sd.id.toLowerCase().includes(q) ||
      sd.territory.toLowerCase().includes(q) ||
      sd.rmn.includes(q)
    );
  });

  const handleCreateSd = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `SD-${formData.territory.slice(0, 3).toUpperCase() || "NEW"}-${String(
      superDistributors.length + 1
    ).padStart(2, "0")}`;

    const newSd: SuperDistributor = {
      id: newId,
      name: formData.name,
      companyName: formData.companyName,
      email: formData.email,
      rmn: formData.rmn,
      territory: formData.territory,
      authorizedLimit: Number(formData.authorizedLimit) || 10000000,
      currentBalance: 0,
      activeAdCount: 0,
      downstreamRetailers: 0,
      monthlyVolume: 0,
      commissionEarned: 0,
      status: "Active",
      mfaRequired: formData.mfaRequired,
      maxSingleAdLimit: Number(formData.maxSingleAdLimit) || 1500000,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setSuperDistributors([newSd, ...superDistributors]);
    setCreateSuccess(true);
    setFormData({
      name: "",
      companyName: "",
      email: "",
      rmn: "",
      territory: "",
      authorizedLimit: "10000000",
      maxSingleAdLimit: "1500000",
      commissionTier: "standard",
      mfaRequired: true,
    });
    setTimeout(() => setCreateSuccess(false), 4000);
  };

  const handleSaveLimits = () => {
    if (!adjustingSd) return;
    setSuperDistributors(
      superDistributors.map((sd) =>
        sd.id === adjustingSd.id
          ? {
              ...sd,
              authorizedLimit: Number(newLimit) || sd.authorizedLimit,
              maxSingleAdLimit: Number(newMaxAdLimit) || sd.maxSingleAdLimit,
            }
          : sd
      )
    );
    setAdjustSuccess(true);
    setTimeout(() => {
      setAdjustSuccess(false);
      setAdjustingSd(null);
    }, 1500);
  };

  const toggleStatus = (id: string) => {
    setSuperDistributors(
      superDistributors.map((sd) => {
        if (sd.id !== id) return sd;
        return {
          ...sd,
          status: sd.status === "Active" ? "Suspended" : "Active",
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#101C32] px-2.5 py-0.5 text-xs font-bold text-[#16B8A6]">
                ROOT GOVERNANCE
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Tier 1 Role Hierarchy: Admin → Super Distributor
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101C32]">
              Super Distributor Management Console
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">
              Configure role boundaries, authorized credit limits, commission schedules, and supervise all regional Super Distributors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("create")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16B8A6] px-4 py-2.5 text-xs font-bold text-[#101C32] shadow-sm hover:bg-[#14a090] transition"
            >
              <Plus size={16} /> Onboard Super Distributor
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E2E8F0] pt-4">
          {[
            { id: "directory", label: "Super Distributor Directory", icon: Users },
            { id: "create", label: "Create Super Distributor", icon: UserPlus },
            { id: "permissions", label: "Roles & Limits Configuration", icon: Shield },
            { id: "funds", label: "Fund & Commission Monitoring", icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#101C32] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#16B8A6]" : "text-[#64748B]"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DIRECTORY & PERFORMANCE                                 */}
      {/* ============================================================== */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Active Super Distributors
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">
                {superDistributors.filter((s) => s.status === "Active").length} Entities
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">100% Identity Verified</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Authorized Limit
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">
                {formatINR(
                  superDistributors.reduce((acc, curr) => acc + curr.authorizedLimit, 0)
                )}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Multi-tier bank backed</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Subordinate Network
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">
                {superDistributors.reduce((acc, curr) => acc + curr.activeAdCount, 0)} ADs ·{" "}
                {superDistributors.reduce((acc, curr) => acc + curr.downstreamRetailers, 0)} Retailers
              </p>
              <p className="mt-1 text-xs text-[#16B8A6] font-semibold">Hierarchical Mapping</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Monthly Volume
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">
                {formatINR(
                  superDistributors.reduce((acc, curr) => acc + curr.monthlyVolume, 0)
                )}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">+14.2% Month-over-Month</p>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-[#101C32] text-sm">Super Distributor Directory</h3>
                <p className="text-xs text-[#64748B]">
                  View authorized credentials, territory assignment, and limit utilization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-1.5 focus-within:border-[#16B8A6] focus-within:bg-white transition">
                  <Search size={14} className="text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search SD, territory, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 bg-transparent text-xs text-[#101C32] placeholder-[#64748B] outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-[#64748B] hover:text-[#101C32]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] text-[#64748B] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Entity ID & Name</th>
                    <th className="py-3 px-4">Territory Scope</th>
                    <th className="py-3 px-4">Authorized Limit</th>
                    <th className="py-3 px-4">Current Balance</th>
                    <th className="py-3 px-4">Subordinate ADs</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredSds.map((sd) => (
                    <tr key={sd.id} className="hover:bg-[#F5F7FA]/70 transition">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#101C32]">{sd.name}</span>
                            <span className="rounded bg-[#F5F7FA] px-1.5 py-0.5 font-mono text-[10px] text-[#64748B] border border-[#E2E8F0]">
                              {sd.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{sd.companyName}</p>
                          <p className="text-[10px] font-mono text-[#64748B]">{sd.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#101C32]">
                        {sd.territory}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#101C32]">
                          {formatINR(sd.authorizedLimit)}
                        </span>
                        <p className="text-[10px] text-[#64748B]">
                          Max AD: {formatINR(sd.maxSingleAdLimit)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">
                        {formatINR(sd.currentBalance)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#101C32]">{sd.activeAdCount} ADs</span>
                        <p className="text-[10px] text-[#64748B]">
                          {sd.downstreamRetailers} Retailers
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            sd.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {sd.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingSd(sd);
                              setNewLimit(String(sd.authorizedLimit));
                              setNewMaxAdLimit(String(sd.maxSingleAdLimit));
                            }}
                            className="rounded-lg border border-[#E2E8F0] p-1.5 text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32] transition"
                            title="Adjust Limits"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => toggleStatus(sd.id)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              sd.status === "Active"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {sd.status === "Active" ? "Suspend" : "Activate"}
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

      {/* ============================================================== */}
      {/* TAB 2: CREATE SUPER DISTRIBUTOR                                */}
      {/* ============================================================== */}
      {activeTab === "create" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm max-w-3xl">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-base font-bold text-[#101C32]">
              Onboard New Super Distributor
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Establish a new regional Tier-2 entity with designated operating territory and authorized banking fund boundaries.
            </p>
          </div>

          {createSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Success:</strong> Super Distributor successfully onboarded. Credentials and security keys generated.
              </span>
            </div>
          )}

          <form onSubmit={handleCreateSd} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Proprietor / Representative Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Registered Corporate Entity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexus MultiPay Services LLP"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Official Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="sd.corporate@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Registered Mobile Number (RMN)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit primary contact"
                  value={formData.rmn}
                  onChange={(e) => setFormData({ ...formData, rmn: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Assigned Geographic Territory
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northern Zone Division"
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Authorized Credit Limit (INR)
                </label>
                <input
                  type="number"
                  required
                  value={formData.authorizedLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, authorizedLimit: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Max Single AD Allocation Limit (INR)
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxSingleAdLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, maxSingleAdLimit: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101C32] uppercase tracking-wider mb-1">
                  Commission Margin Slab
                </label>
                <select
                  value={formData.commissionTier}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionTier: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white transition"
                >
                  <option value="standard">Standard Tier (0.30% SD Gross Override)</option>
                  <option value="enterprise">Enterprise Tier (0.35% High Volume)</option>
                  <option value="prime">Prime Strategic (Custom Volume Slabs)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 flex items-center gap-3">
              <input
                type="checkbox"
                id="mfa"
                checked={formData.mfaRequired}
                onChange={(e) => setFormData({ ...formData, mfaRequired: e.target.checked })}
                className="h-4 w-4 rounded border-[#E2E8F0] text-[#16B8A6] focus:ring-[#16B8A6]"
              />
              <label htmlFor="mfa" className="text-xs text-[#101C32]">
                <strong className="font-semibold">Enforce Mandatory Hardware / Authenticator MFA:</strong> Require two-factor authentication on every SD login.
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#101C32] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
              >
                Create Super Distributor Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ROLES & LIMITS CONFIGURATION                            */}
      {/* ============================================================== */}
      {activeTab === "permissions" && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#101C32]">
              Tier 2 Governance Policy & Operational Boundaries
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Strict parameters governing actions permitted to Super Distributors under the four-portal hierarchy.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "1. Area Distributor Onboarding & Verification",
                  description:
                    "Super Distributors are permitted to initiate, verify, and monitor Area Distributors strictly within their assigned territorial boundaries.",
                  status: "Authorized",
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
                {
                  title: "2. Fund Allocation to Downline ADs",
                  description:
                    "Permitted within configured Max Single AD Limit. Super Distributors cannot allocate funds exceeding their own authorized liquid balance.",
                  status: "Authorized with Limits",
                  badge: "bg-sky-50 text-sky-700 border-sky-200",
                },
                {
                  title: "3. Direct Retailer Transaction Execution",
                  description:
                    "Forbidden. Super Distributors supervise the distribution network and clear balance queries; they cannot initiate end-user financial transactions.",
                  status: "Strictly Prohibited",
                  badge: "bg-rose-50 text-rose-700 border-rose-200",
                },
                {
                  title: "4. Cross-Territory Scope Inspection",
                  description:
                    "Forbidden. Super Distributors are isolated strictly to their assigned geographic territory and downstream entities.",
                  status: "Enforced Isolation",
                  badge: "bg-amber-50 text-amber-700 border-amber-200",
                },
                {
                  title: "5. Query Escalation to Admin Master",
                  description:
                    "Authorized. Super Distributors can escalate unresolved settlement disputes and commercial balance adjustments directly to Root Admin.",
                  status: "Authorized",
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
              ].map((policy, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#101C32] text-xs">{policy.title}</p>
                    <p className="text-[11px] text-[#64748B]">{policy.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${policy.badge}`}
                  >
                    {policy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: FUND & COMMISSION MONITORING                            */}
      {/* ============================================================== */}
      {activeTab === "funds" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Active Fund Float
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">{formatINR(26750000)}</p>
              <p className="mt-1 text-xs text-[#64748B]">Across all active Super Distributors</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Commissions Accrued (MTD)
              </span>
              <p className="mt-2 text-2xl font-black text-emerald-700">{formatINR(435000)}</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Ready for settlement</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Pending Balance Queries
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">0 Escalations</p>
              <p className="mt-1 text-xs text-[#64748B]">All queries cleared by SD network</p>
            </div>
          </div>
        </div>
      )}

      {/* Limit Adjustment Modal */}
      {adjustingSd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101C32]/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#101C32]">Adjust Authorized Limits</h3>
                <p className="text-[11px] text-[#64748B]">{adjustingSd.name} ({adjustingSd.id})</p>
              </div>
              <button
                onClick={() => setAdjustingSd(null)}
                className="text-[#64748B] hover:text-[#101C32]"
              >
                <X size={16} />
              </button>
            </div>

            {adjustSuccess && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700 font-semibold">
                ✓ Limits updated successfully.
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Authorized Total Floating Limit (INR)
                </label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Max Single AD Allocation Limit (INR)
                </label>
                <input
                  type="number"
                  value={newMaxAdLimit}
                  onChange={(e) => setNewMaxAdLimit(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setAdjustingSd(null)}
                className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLimits}
                className="rounded-xl bg-[#101C32] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52]"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
