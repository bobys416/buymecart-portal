"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  Plus,
  Receipt,
  RefreshCcw,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { formatINR, mockMerchants } from "@/lib/mock-data";
import { getStoredSession, PRESET_USERS, UserSession } from "@/lib/auth";

interface AreaDistributorRecord {
  id: string;
  name: string;
  email: string;
  rmn: string;
  territory: string;
  assignedRetailers: number;
  allocatedFloat: number;
  currentBalance: number;
  status: "Verified ✓" | "Pending Review";
}

const initialAreaDistributors: AreaDistributorRecord[] = [
  {
    id: "AD-ZONE-01",
    name: "Sunil Verma",
    email: "sunil.ad@bspark.org",
    rmn: "9826019921",
    territory: "Zone-01 Territory",
    assignedRetailers: 7,
    allocatedFloat: 1500000,
    currentBalance: 420000,
    status: "Verified ✓",
  },
  {
    id: "AD-ZONE-02",
    name: "Kavita Jain",
    email: "kavita.ad@bspark.org",
    rmn: "9827012345",
    territory: "Zone-02 Territory",
    assignedRetailers: 8,
    allocatedFloat: 2000000,
    currentBalance: 810000,
    status: "Verified ✓",
  },
  {
    id: "AD-ZONE-03",
    name: "Praveen Chouhan",
    email: "praveen.ad@bspark.org",
    rmn: "9828098765",
    territory: "Zone-03 Territory",
    assignedRetailers: 4,
    allocatedFloat: 1000000,
    currentBalance: 290000,
    status: "Verified ✓",
  },
];

interface SuperDistributorViewProps {
  section?: string;
  tab?: string;
}

export function SuperDistributorView({
  section = "dashboard",
  tab,
}: SuperDistributorViewProps) {
  const resolveTab = (sec?: string, tb?: string) => {
    if (tb) return tb;
    if (sec && sec !== "dashboard") return sec;
    return "overview";
  };

  const [session, setSession] = useState<UserSession>(() =>
    getStoredSession("super-distributor") || PRESET_USERS["sd-central"]
  );
  const [activeTab, setActiveTab] = useState<string>(() => resolveTab(section, tab));

  useEffect(() => {
    const s = getStoredSession("super-distributor");
    if (s) setSession(s);
  }, []);

  useEffect(() => {
    setActiveTab(resolveTab(section, tab));
  }, [section, tab]);

  const [ads, setAds] = useState<AreaDistributorRecord[]>(initialAreaDistributors);
  const [adSearch, setAdSearch] = useState("");
  const [retailerSearch, setRetailerSearch] = useState("");

  // Onboard AD Form
  const [adForm, setAdForm] = useState({
    name: "",
    email: "",
    rmn: "",
    territory: "Zone-04 Territory",
    allocatedFloat: "1000000",
  });
  const [onboardSuccess, setOnboardSuccess] = useState(false);

  // Balance Query State
  const [balanceQueries, setBalanceQueries] = useState([
    {
      id: "BQ-8091",
      adId: "AD-ZONE-01",
      adName: "Sunil Verma",
      amount: 45000,
      issue: "Daily settlement discrepancy on evening batch payout",
      status: "Pending Action",
      timestamp: "Today, 11:20 AM",
    },
    {
      id: "BQ-8092",
      adId: "AD-ZONE-02",
      adName: "Kavita Jain",
      amount: 120000,
      issue: "Float limit replenishment request for festive recharge rush",
      status: "Pending Action",
      timestamp: "Today, 02:45 PM",
    },
  ]);

  // Escalation State
  const [escalationText, setEscalationText] = useState("");
  const [escalationCategory, setEscalationCategory] = useState("Settlement Discrepancy");
  const [escalations, setEscalations] = useState([
    {
      id: "ESC-901",
      subject: "Inter-bank switch settlement latency on corporate rail",
      status: "In Review by Admin",
      timestamp: "Yesterday",
    },
  ]);
  const [escalateSuccess, setEscalateSuccess] = useState(false);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: AreaDistributorRecord = {
      id: `AD-ZONE-0${ads.length + 1}`,
      name: adForm.name,
      email: adForm.email,
      rmn: adForm.rmn,
      territory: adForm.territory,
      assignedRetailers: 0,
      allocatedFloat: Number(adForm.allocatedFloat) || 1000000,
      currentBalance: 0,
      status: "Verified ✓",
    };

    setAds([newRecord, ...ads]);
    setOnboardSuccess(true);
    setAdForm({
      name: "",
      email: "",
      rmn: "",
      territory: "Zone-04 Territory",
      allocatedFloat: "1000000",
    });
    setTimeout(() => setOnboardSuccess(false), 4000);
  };

  const handleClearBalanceQuery = (id: string) => {
    setBalanceQueries(
      balanceQueries.map((q) => (q.id === id ? { ...q, status: "Cleared ✓" } : q))
    );
  };

  const handleEscalateToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationText.trim()) return;

    setEscalations([
      {
        id: `ESC-${Date.now().toString().slice(-4)}`,
        subject: escalationText,
        status: "Submitted to Admin",
        timestamp: "Just now",
      },
      ...escalations,
    ]);
    setEscalationText("");
    setEscalateSuccess(true);
    setTimeout(() => setEscalateSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#101C32] px-2.5 py-0.5 text-xs font-bold text-[#16B8A6]">
                SUPER DISTRIBUTOR PORTAL
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Tier 2: SD ({session.orgScope})
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101C32]">
              Super Distributor Command Console
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">
              Supervise assigned Area Distributors across {session.territory || "Central India Region"}, manage balance inquiries, allocate float limits, and scale subordinate retailer networks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("ad-network")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16B8A6] px-4 py-2.5 text-xs font-bold text-[#101C32] shadow-sm hover:bg-[#14a090] transition"
            >
              <UserPlus size={16} /> Onboard Area Distributor
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E2E8F0] pt-4">
          {[
            { id: "overview", label: "Regional Dashboard", icon: TrendingUp },
            { id: "payment-request", label: "Payment Request", icon: Landmark },
            { id: "payment-reversal", label: "Payment Reversal", icon: RefreshCcw },
            { id: "transactions", label: "Payment Transactions", icon: CreditCard },
            { id: "payment-check", label: "Payment Check", icon: ShieldCheck },
            { id: "ad-network", label: "Area Distributors (ADs)", icon: Users },
            { id: "retailers", label: "Subordinate Retailers", icon: Building2 },
            { id: "balance-queries", label: "Clear Balance Queries", icon: Wallet },
            { id: "escalations", label: "Escalate to Admin", icon: HelpCircle },
            { id: "commercials", label: "Regional Commercials", icon: Zap },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#101C32] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#16B8A6]" : "text-[#64748B]"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: REGIONAL DASHBOARD                                      */}
      {/* ============================================================== */}
      {(activeTab === "overview" || activeTab === "dashboard") && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Assigned Area Distributors
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">{ads.length} ADs</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">100% Operational</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Subordinate Retailers
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">19 Retailers</p>
              <p className="mt-1 text-xs text-[#64748B]">Across regional territory nodes</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Regional Network Volume
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">{formatINR(3120000)}</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">+12.8% this week</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Pending Balance Queries
              </span>
              <p className="mt-2 text-2xl font-black text-amber-600">
                {balanceQueries.filter((q) => q.status.includes("Pending")).length} Inquiries
              </p>
              <p className="mt-1 text-xs text-[#64748B]">SLA: 2 hours</p>
            </div>
          </div>

          {/* Quick Tasks Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-[#101C32] text-sm">Super Distributor Quick Actions</h3>
                <span className="text-[11px] font-mono text-[#64748B]">Permitted Actions Only</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setActiveTab("ad-network")}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-left hover:border-[#16B8A6] hover:bg-white transition group"
                >
                  <UserPlus size={18} className="text-[#16B8A6] mb-2 group-hover:scale-110 transition" />
                  <p className="font-bold text-[#101C32] text-xs">Onboard Area Distributor</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Register a new AD in assigned territory.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("balance-queries")}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-left hover:border-[#16B8A6] hover:bg-white transition group"
                >
                  <Wallet size={18} className="text-[#16B8A6] mb-2 group-hover:scale-110 transition" />
                  <p className="font-bold text-[#101C32] text-xs">Clear Balance Queries</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Resolve AD settlement inquiries.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("escalations")}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-left hover:border-[#16B8A6] hover:bg-white transition group"
                >
                  <HelpCircle size={18} className="text-[#16B8A6] mb-2 group-hover:scale-110 transition" />
                  <p className="font-bold text-[#101C32] text-xs">Escalate to Admin</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Route complex disputes to Root Admin.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("commercials")}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-left hover:border-[#16B8A6] hover:bg-white transition group"
                >
                  <Zap size={18} className="text-[#16B8A6] mb-2 group-hover:scale-110 transition" />
                  <p className="font-bold text-[#101C32] text-xs">Regional Margins</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    View commission override rates.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-[#101C32] text-sm">Active Area Distributors</h3>
                <Link
                  href="/super-distributor/ad-network"
                  className="text-xs font-bold text-[#16B8A6] hover:underline"
                >
                  View All ({ads.length})
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#101C32]">{ad.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">{ad.id}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{ad.territory} · {ad.assignedRetailers} Retailers</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {ad.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ONBOARD & VERIFY AREA DISTRIBUTORS                      */}
      {/* ============================================================== */}
      {activeTab === "ad-network" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-sm font-bold text-[#101C32]">Onboard Area Distributor</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Add a new downstream AD within your assigned territory.
            </p>

            {onboardSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                ✓ Area Distributor onboarded successfully.
              </div>
            )}

            <form onSubmit={handleCreateAd} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alok Sharma"
                  value={adForm.name}
                  onChange={(e) => setAdForm({ ...adForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ad.zone@bspark.org"
                  value={adForm.email}
                  onChange={(e) => setAdForm({ ...adForm, email: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Mobile Number (RMN)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={adForm.rmn}
                  onChange={(e) => setAdForm({ ...adForm, rmn: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Territory Assignment
                </label>
                <input
                  type="text"
                  required
                  value={adForm.territory}
                  onChange={(e) => setAdForm({ ...adForm, territory: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Allocated Float Limit (INR)
                </label>
                <input
                  type="number"
                  required
                  value={adForm.allocatedFloat}
                  onChange={(e) => setAdForm({ ...adForm, allocatedFloat: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-[#101C32] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
              >
                Onboard & Verify AD
              </button>
            </form>
          </div>

          {/* Directory */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-sm font-bold text-[#101C32]">Area Distributor Roster</h2>
                <p className="text-xs text-[#64748B]">
                  Subordinate ADs authorized under {session.orgScope}.
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-1.5 focus-within:border-[#16B8A6] focus-within:bg-white">
                <Search size={14} className="text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search AD..."
                  value={adSearch}
                  onChange={(e) => setAdSearch(e.target.value)}
                  className="w-40 bg-transparent text-xs text-[#101C32] outline-none"
                />
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#E2E8F0]">
              {ads
                .filter((ad) => {
                  if (!adSearch) return true;
                  const q = adSearch.toLowerCase();
                  return (
                    ad.name.toLowerCase().includes(q) ||
                    ad.id.toLowerCase().includes(q) ||
                    ad.territory.toLowerCase().includes(q)
                  );
                })
                .map((ad) => (
                  <div key={ad.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#101C32]">{ad.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">{ad.id}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {ad.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {ad.territory} · {ad.email} · {ad.rmn}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#101C32]">
                        {formatINR(ad.allocatedFloat)} Limit
                      </span>
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        Bal: {formatINR(ad.currentBalance)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SUBORDINATE RETAILERS                                   */}
      {/* ============================================================== */}
      {activeTab === "retailers" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101C32]">Subordinate Retailers Network</h2>
              <p className="text-xs text-[#64748B]">
                Aggregated view across all subordinate Area Distributors in your regional territory.
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-1.5 focus-within:border-[#16B8A6] focus-within:bg-white">
              <Search size={14} className="text-[#64748B]" />
              <input
                type="text"
                placeholder="Search retailers..."
                value={retailerSearch}
                onChange={(e) => setRetailerSearch(e.target.value)}
                className="w-44 bg-transparent text-xs text-[#101C32] outline-none"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Store & Retailer</th>
                  <th className="py-3 px-4">Assigned AD</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {[
                  { id: "MCH-01", name: "Sharma Digital Services", owner: "Rajesh Sharma", ad: "AD-ZONE-01", cat: "Telecom & AEPS", bal: 48500, status: "Active" },
                  { id: "MCH-02", name: "Metro Kirana & Remittance", owner: "Vinod Meena", ad: "AD-ZONE-01", cat: "Grocery & DMT", bal: 62400, status: "Active" },
                  { id: "MCH-03", name: "City Point FastPay", owner: "Nisha Patel", ad: "AD-ZONE-02", cat: "Recharge & BBPS", bal: 31200, status: "Active" },
                  { id: "MCH-04", name: "Express Money Mart", owner: "Sanjay Gupta", ad: "AD-ZONE-03", cat: "MicroATM & AEPS", bal: 78900, status: "Active" },
                ]
                  .filter((m) => {
                    if (!retailerSearch) return true;
                    const q = retailerSearch.toLowerCase();
                    return m.name.toLowerCase().includes(q) || m.owner.toLowerCase().includes(q) || m.ad.toLowerCase().includes(q);
                  })
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-[#F5F7FA]">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#101C32]">{r.name}</p>
                        <p className="text-[11px] text-[#64748B]">{r.owner}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#16B8A6]">{r.ad}</td>
                      <td className="py-3 px-4 text-[#64748B]">{r.cat}</td>
                      <td className="py-3 px-4 font-bold text-[#101C32]">{formatINR(r.bal)}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CLEAR BALANCE QUERIES                                   */}
      {/* ============================================================== */}
      {activeTab === "balance-queries" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm max-w-4xl">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-sm font-bold text-[#101C32]">Clear Balance Queries</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review and clear balance reconciliation inquiries submitted by subordinate Area Distributors.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {balanceQueries.map((query) => (
              <div
                key={query.id}
                className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#101C32]">{query.id}</span>
                    <span className="font-semibold text-[#101C32]">{query.adName}</span>
                    <span className="font-mono text-[10px] text-[#64748B]">({query.adId})</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">{query.issue}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Amount: <strong className="text-[#101C32]">{formatINR(query.amount)}</strong> · {query.timestamp}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {query.status.includes("Cleared") ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      {query.status}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClearBalanceQuery(query.id)}
                      className="rounded-xl bg-[#16B8A6] px-3.5 py-1.5 text-xs font-bold text-[#101C32] hover:bg-[#14a090] transition shadow-xs"
                    >
                      Clear Query ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: ESCALATE TO ADMIN                                       */}
      {/* ============================================================== */}
      {activeTab === "escalations" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Escalation Form */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#101C32]">Escalate Query to Admin Master</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Submit issues exceeding Super Distributor threshold directly to Root Admin.
            </p>

            {escalateSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                ✓ Query escalated to Admin Master console with SLA tracking.
              </div>
            )}

            <form onSubmit={handleEscalateToAdmin} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Query Category
                </label>
                <select
                  value={escalationCategory}
                  onChange={(e) => setEscalationCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none"
                >
                  <option value="Settlement Discrepancy">Settlement Discrepancy (NPCI/Bank Switch)</option>
                  <option value="Credit Limit Extension">Credit Limit Extension Request</option>
                  <option value="Compliance Exemption">Compliance / vKYC Special Clearance</option>
                  <option value="Technical Gateway Downtime">Technical Gateway Downtime</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Query Description & Remarks
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the transaction IDs, timestamps, or bank switch error codes..."
                  value={escalationText}
                  onChange={(e) => setEscalationText(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#101C32] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
              >
                Submit Escalation to Admin
              </button>
            </form>
          </div>

          {/* Active Escalations List */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#101C32]">Active Admin Escalations</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Status of submitted queries with Admin Master.
            </p>

            <div className="mt-4 space-y-3">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#101C32]">{esc.id}</span>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                      {esc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#101C32] mt-1 font-medium">{esc.subject}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">{esc.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: REGIONAL COMMERCIALS                                    */}
      {/* ============================================================== */}
      {activeTab === "commercials" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm max-w-4xl">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-sm font-bold text-[#101C32]">Regional Commercials & Performance</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Commission breakdown across subordinate AD circles under Super Distributor {session.orgScope}.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
            {ads.map((ad, idx) => (
              <div key={ad.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA]">
                <span className="font-bold text-[#64748B] uppercase">{ad.territory} ({ad.id})</span>
                <p className="mt-2 text-xl font-bold text-[#101C32]">
                  {formatINR(ad.allocatedFloat * 0.05 + 40000)} Vol
                </p>
                <p className="text-emerald-700 font-semibold mt-1">
                  ₹{((ad.allocatedFloat * 0.05 + 40000) * 0.005).toFixed(0)} SD Override (0.50%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PAYMENT REQUEST (PDF Page 1)                              */}
      {/* ============================================================== */}
      {activeTab === "payment-request" && (
        <div className="space-y-6 max-w-5xl">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal uppercase">PDF Page 1 Section 1</span>
                <h2 className="text-sm font-bold text-[#101C32]">Payment Request (Bank Request for Payment list of Bank)</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Authorize and dispatch bank payment requests across participating commercial banks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Payment Request dispatched to partner bank core.")}
                className="rounded-xl bg-[#101C32] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1a2d52] transition"
              >
                + New Bank Payment Request
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA]">
                <span className="text-[10px] text-slate-500 font-bold block">ICICI Corporate Bank</span>
                <p className="font-extrabold text-[#101C32] text-sm mt-1">₹4,85,000.00</p>
                <span className="text-[10px] text-emerald-600 font-semibold">12 Requests Cleared</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA]">
                <span className="text-[10px] text-slate-500 font-bold block">Axis Core Banking</span>
                <p className="font-extrabold text-[#101C32] text-sm mt-1">₹3,20,000.00</p>
                <span className="text-[10px] text-emerald-600 font-semibold">8 Requests Cleared</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA]">
                <span className="text-[10px] text-slate-500 font-bold block">State Bank of India</span>
                <p className="font-extrabold text-[#101C32] text-sm mt-1">₹6,90,000.00</p>
                <span className="text-[10px] text-emerald-600 font-semibold">18 Requests Cleared</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F7FA]">
                <span className="text-[10px] text-slate-500 font-bold block">HDFC Bank Direct</span>
                <p className="font-extrabold text-[#101C32] text-sm mt-1">₹2,40,000.00</p>
                <span className="text-[10px] text-emerald-600 font-semibold">5 Requests Cleared</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Target Bank</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Area Distributor</th>
                    <th className="p-3">Amount (INR)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#101C32]">BREQ-2026-901</td>
                    <td className="p-3">ICICI Corporate</td>
                    <td className="p-3 font-semibold text-teal">IMPS Immediate</td>
                    <td className="p-3">Sunil Verma (AD-ZONE-01)</td>
                    <td className="p-3 font-bold text-navy">₹1,50,000.00</td>
                    <td className="p-3"><span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold text-[10px]">PROCESSED ✓</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#101C32]">BREQ-2026-902</td>
                    <td className="p-3">State Bank of India</td>
                    <td className="p-3 font-semibold text-teal">RTGS High-Value</td>
                    <td className="p-3">Kavita Jain (AD-ZONE-02)</td>
                    <td className="p-3 font-bold text-navy">₹3,00,000.00</td>
                    <td className="p-3"><span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 font-bold text-[10px]">IN TRANSIT</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PAYMENT REVERSAL (PDF Page 1: Refund Request, Nolimit)    */}
      {/* ============================================================== */}
      {activeTab === "payment-reversal" && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-4">
              <span className="text-[10px] font-bold text-rose-600 uppercase">PDF Page 1 Section 2</span>
              <h2 className="text-sm font-bold text-[#101C32]">Payment Reversal (Refund Request, Nolimit)</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Full-reserve refund authorization with zero artificial caps for failed or disputed merchant payouts.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Reversal authorization submitted to Core Ledger with idempotency key.");
              }}
              className="mt-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Transaction ID / UTR</label>
                  <input
                    type="text"
                    defaultValue="BMC-TXN-20261019-994"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-semibold text-navy outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Refund Amount (INR - No Limit)</label>
                  <input
                    type="number"
                    defaultValue="45000"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-navy outline-none focus:border-teal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Reversal Reason & Justification</label>
                <textarea
                  rows={3}
                  defaultValue="Beneficiary bank account credited twice during network switch timeout; authorized reverse debit to merchant wallet."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-navy outline-none focus:border-teal"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  Authorize Full Reversal (Zero Limit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PAYMENT TRANSACTIONS (PDF Page 1)                         */}
      {/* ============================================================== */}
      {activeTab === "transactions" && (
        <div className="space-y-6 max-w-5xl">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal uppercase">PDF Page 1 Section 3</span>
                <h2 className="text-sm font-bold text-[#101C32]">Payment Transactions & Updates</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Transaction Update: Overall · Categorised (DMT, QKIK, DPMR/IMPS) · Subjective.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-4">
                <span className="text-[10px] font-bold uppercase text-slate-500">1. Overall Update</span>
                <p className="mt-1 text-2xl font-black text-navy">{formatINR(3120000)}</p>
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">1,240 Total Network Transactions</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-4">
                <span className="text-[10px] font-bold uppercase text-slate-500">2. Categorised Products</span>
                <p className="mt-1 text-xs font-bold text-navy">DMT · QKIK · DPMR/IMPS · AEPS</p>
                <p className="mt-1 text-[11px] text-slate-500">99.4% Instant Gateway Settlement</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F5F7FA] p-4">
                <span className="text-[10px] font-bold uppercase text-slate-500">3. Subjective Status</span>
                <p className="mt-1 text-sm font-bold text-emerald-700">Healthy Operation</p>
                <p className="mt-1 text-[11px] text-slate-500">Zero active freeze alerts in circle</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PAYMENT CHECK (PDF Page 1 Section 4)                      */}
      {/* ============================================================== */}
      {activeTab === "payment-check" && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-4">
              <span className="text-[10px] font-bold text-teal uppercase">PDF Page 1 Section 4</span>
              <h2 className="text-sm font-bold text-[#101C32]">Payment Check & UTR Verification Radar</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Instant inquiry and bank confirmation check for downstream Area Distributors and Retailers.
              </p>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Bank Reference Number, TxID, or UTR..."
                  defaultValue="UTR-20261019-994821"
                  className="flex-1 rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-semibold text-navy outline-none focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => alert("Payment Verified: Status SUCCESS · UTR Confirmed by Axis Core.")}
                  className="rounded-xl bg-[#101C32] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1a2d52] transition"
                >
                  Check Payment
                </button>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Verified Payment State</span>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-navy">
                  <div>Status: <strong className="text-emerald-700">SUCCESS ✓</strong></div>
                  <div>Amount: <strong>₹25,000.00</strong></div>
                  <div>Bank: <strong>Axis Core</strong></div>
                  <div>Mode: <strong>IMPS</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
