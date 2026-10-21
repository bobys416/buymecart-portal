"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileSpreadsheet,
  Filter,
  Landmark,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  formatINR,
  mockKycCases,
  mockPaymentTransactions,
  mockMerchants,
  providers,
  trend,
} from "@/lib/mock-data";
import { apiClient } from "@/lib/api-client";
import { getStoredSession } from "@/lib/auth";

export function AdminMasterDashboard() {
  const [activeFeedTab, setActiveFeedTab] = useState<"overall" | "categorised" | "subjective">("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Quick stats calculations
  const totalVolume = mockPaymentTransactions.reduce((acc, t) => acc + t.depositAmount, 0);
  const successfulTxCount = mockPaymentTransactions.filter((t) => t.status === "Successful").length;
  const pendingTxCount = mockPaymentTransactions.filter((t) => t.status === "Pending" || t.status === "Disputed").length;
  const activeMerchantsCount = mockMerchants.filter((m) => m.status === "Active").length;
  const pendingKycCount = mockKycCases.filter((k) => k.status === "Pending Compliance").length;

  // Real Backend Network & Telemetry State
  const [networkStats, setNetworkStats] = useState<{
    superDistributors: number;
    areaDistributors: number;
    retailers: number;
    activeUsers: number;
  } | null>(null);

  const [monitoringStats, setMonitoringStats] = useState<{
    submittedKyc: number;
    underReviewKyc: number;
    pendingTxns: number;
    unknownTxns: number;
  } | null>(null);

  React.useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const session = getStoredSession("admin");
        if (session?.accessToken) {
          const netRes = await apiClient.get<any>("/network/summary", { token: session.accessToken });
          if (netRes) {
            setNetworkStats({
              superDistributors: netRes.super_distributors_count ?? 2,
              areaDistributors: netRes.area_distributors_count ?? 2,
              retailers: netRes.retailers_count ?? 2,
              activeUsers: netRes.active_users_count ?? 7,
            });
          }

          const monRes = await apiClient.get<any>("/providers/monitoring/overview", { token: session.accessToken });
          if (monRes) {
            setMonitoringStats({
              submittedKyc: monRes.kyc_backlog?.submitted_count ?? 0,
              underReviewKyc: monRes.kyc_backlog?.under_review_count ?? 0,
              pendingTxns: monRes.unresolved_transactions?.pending_count ?? 0,
              unknownTxns: monRes.unresolved_transactions?.unknown_count ?? 0,
            });
          }
        }
      } catch {
        // Retain fallback data if offline
      }
    };
    fetchTelemetry();
  }, []);

  const filteredTransactions = mockPaymentTransactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.retailerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.rmn.includes(searchQuery);
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    if (activeFeedTab === "categorised") {
      return matchesSearch && matchesStatus && t.category === "Utility Pay";
    }
    if (activeFeedTab === "subjective") {
      return matchesSearch && matchesStatus && (t.status === "Pending" || t.status === "Disputed");
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Platform Master Dashboard Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-card md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#0B1530] text-[#12C8B4] px-2.5 py-0.5 text-xs font-bold border border-[#12C8B4]/30">
              Admin Master Console
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              Multi-Bank Routing · Tempered Margin Plan Active
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1530]">
            Platform Master Dashboard (CRM)
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Centralized platform command console with complete oversight over SDs, ADs, Retailers, and transaction flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/modifications?tab=commercial"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F4F7FB] px-3.5 py-2 text-xs font-bold text-[#0B1530] hover:bg-slate-100 transition"
          >
            <Zap size={15} className="text-[#12C8B4]" /> Tempered Plan (Page 3)
          </Link>
          <Link
            href="/admin/merchants?tab=search"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B1530] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#142040] transition"
          >
            <Users size={15} className="text-[#12C8B4]" /> Manage Merchants
          </Link>
        </div>
      </div>

      {/* Details Panel: Banking Products & Modes (Page 1) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Gross Volume
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <WalletCards size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(totalVolume)}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <TrendingUp size={14} className="mr-1" /> +14.2% vs yesterday
            </span>
            <span>{mockPaymentTransactions.length} demo records</span>
          </div>
        </div>

        {/* Metric 2: Banking Products DMT / QKIK / DPMR */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Banking Products (DMT/IMPS)
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Landmark size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-navy">
            {formatINR(mockPaymentTransactions.filter((t) => t.payMode === "IMPS" || t.payMode === "NEFT").reduce((s, t) => s + t.depositAmount, 0))}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">DMT</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">QKIK</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">DPMR/IMPS</span>
          </div>
        </div>

        {/* Metric 3: Active Channel Network */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Channel Network (SD/AD/RT)
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-navy">
            {networkStats ? `${networkStats.superDistributors + networkStats.areaDistributors + networkStats.retailers} Nodes` : `${mockMerchants.length} Nodes`}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{networkStats ? `${networkStats.activeUsers} Verified Accounts` : `${activeMerchantsCount} Active`}</span>
            <Link href="/admin/merchants" className="font-semibold text-sky-700 hover:underline">
              Manage network →
            </Link>
          </div>
        </div>

        {/* Metric 4: Compliance & Approvals Pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Compliance Approvals
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <Clock3 size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">
            {monitoringStats ? `${monitoringStats.submittedKyc + monitoringStats.underReviewKyc} Cases` : `${pendingKycCount} Cases`}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Includes 30s vKYC</span>
            <Link href="/admin/compliance?tab=pending-onboarding" className="font-semibold text-amber-800 hover:underline">
              Review queue →
            </Link>
          </div>
        </div>
      </section>

      {/* Chart & Provider Sandbox Health (Page 1) */}
      <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-navy">Transaction Volume Trend</h2>
              <p className="text-xs text-slate-500">Weekly throughput across all payment modes (INR)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">
                INR Currency Slabs
              </span>
            </div>
          </div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Area type="monotone" dataKey="volume" stroke="#0284c7" strokeWidth={2.5} fill="url(#volFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between px-2 text-xs text-slate-400">
            {trend.map((t) => (
              <span key={t.day} className="font-medium">
                {t.day} ({formatINR(t.volume)})
              </span>
            ))}
          </div>
        </div>

        {/* Banking Provider Status & Routing (Page 1 & 4) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-navy">Banking Providers & Switches</h2>
              <p className="text-xs text-slate-500">Multi-bank gateway health and uptime</p>
            </div>
            <Link
              href="/admin/managed-products?tab=map"
              className="text-xs font-semibold text-sky-700 hover:underline"
            >
              Map Routes
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {providers.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-3.5 first:pt-1">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">Availability: {p.uptime}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    p.state === "Operational"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {p.state}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Enabled Rails Registry:</p>
            <p className="mt-1 leading-relaxed text-slate-500">
              UPI (QR/Intent), Net Banking (Retail/Corp), IMPS/NEFT, AEPS Aadhaar Pay, BBPS Bills, DMT Fino.
            </p>
          </div>
        </div>
      </section>

      {/* Transaction Update Section: Overall, Categorised, Subjective (Page 1) */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-navy">Transaction Updates (Page 1 Details Panel)</h2>
              <p className="text-xs text-slate-500">
                Segmented real-time operational feeds with status and category controls
              </p>
            </div>

            {/* 3-Way Segmented Tabs (Overall, Categorised, Subjective from Page 1) */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setActiveFeedTab("overall")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeFeedTab === "overall" ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"
                }`}
              >
                Overall Feed ({mockPaymentTransactions.length})
              </button>
              <button
                onClick={() => setActiveFeedTab("categorised")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeFeedTab === "categorised" ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"
                }`}
              >
                Categorised (Utility Pay)
              </button>
              <button
                onClick={() => setActiveFeedTab("subjective")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeFeedTab === "subjective" ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"
                }`}
              >
                Subjective (Action Needed)
              </button>
            </div>
          </div>

          {/* Search & Filter Bar with explicit Search Button */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex min-w-[260px] flex-1 items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 focus-within:border-navy focus-within:bg-white focus-within:ring-1 focus-within:ring-navy transition">
                <Search size={16} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference, retailer, RMN, or service..."
                  className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  // Re-triggers filtering explicitly
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={13} /> Search
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="All">All States</option>
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Disputed">Disputed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Reference / Time</th>
                <th className="px-5 py-3.5">Retailer (RMN)</th>
                <th className="px-5 py-3.5">Service & Mode</th>
                <th className="px-5 py-3.5">Provider / Switch</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Tempered Fee</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy">{tx.id}</p>
                      <p className="text-xs text-slate-400">{tx.timestamp} · {tx.depositDate}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{tx.retailerName}</p>
                      <p className="text-xs text-slate-500">{tx.rmn}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">{tx.service}</span>
                      <p className="text-xs text-slate-400">{tx.payMode}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-700">{tx.vendor}</p>
                      <p className="font-mono text-[11px] text-slate-400">{tx.bankRefNo}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatINR(tx.depositAmount)}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                      {formatINR(tx.calculatedFee)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          tx.status === "Successful"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "Pending"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : tx.status === "Failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/payments?tab=authorize`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Inspect <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>Showing {filteredTransactions.length} of {mockPaymentTransactions.length} records</span>
          <Link href="/admin/payments?tab=report" className="font-semibold text-sky-700 hover:underline">
            View full authoritative payment ledger →
          </Link>
        </div>
      </section>

      {/* Quick Payout Modal (Page 1 Top Bar Action) */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="text-navy" size={20} />
                <h3 className="text-lg font-bold text-navy">Initiate Direct Merchant Payout</h3>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-bold">Phase 1 Mock Execution:</p>
                <p>This validates local inputs and limits; no actual bank funds will be transferred.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Select Merchant</label>
                <select className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs">
                  {mockMerchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.shopName} ({m.rmn}) — Balance: {formatINR(m.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600">Payout Mode</label>
                  <select className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs">
                    <option>IMPS (Instant)</option>
                    <option>NEFT (Batch)</option>
                    <option>RTGS (High-Value)</option>
                    <option>UPI Payout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600">Amount (INR)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    defaultValue="5000"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Administrative Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Daily wallet settlement clearance"
                  defaultValue="Daily wallet settlement"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              {payoutSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={16} /> Payout instruction verified and submitted to mock queue.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => setPayoutSuccess(true)}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Authorize Payout Instruction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

