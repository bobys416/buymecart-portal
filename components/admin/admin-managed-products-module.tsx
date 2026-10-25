"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  FileCheck2,
  Filter,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tag,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from "lucide-react";
import { formatINR, mockManagedProductSummaries, mockPaymentTransactions } from "@/lib/mock-data";
import { ManagedProductSummary } from "@/lib/types";

interface AdminManagedProductsModuleProps {
  initialTab?: string;
}

export function AdminManagedProductsModule({ initialTab = "transactions" }: AdminManagedProductsModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedSummary, setSelectedSummary] = useState<ManagedProductSummary | null>(null);

  // Search filter states
  const [operatorSearch, setOperatorSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");

  // Map products state
  const [mappingState, setMappingState] = useState([
    { operator: "Airtel", circle: "Rajasthan", vendor: "Payart Switch", status: "Active" },
    { operator: "Jio", circle: "Madhya Pradesh", vendor: "RazorPay UPI", status: "Active" },
    { operator: "MSEDCL", circle: "Maharashtra", vendor: "BillDesk Aggregator", status: "Active" },
    { operator: "AEPS UIDAI", circle: "National", vendor: "Fino Payments Bank", status: "Active" },
  ]);

  // PAN Coupons state
  const [couponCount, setCouponCount] = useState(1500);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 4 Module 4
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Managed Products
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Managed Products & Switch Routing</h1>
          <p className="text-xs text-slate-500">
            Route telecom/utility operators by circle, manage bank charges, PAN agents, and inspect online transactions.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "transactions", label: "Online Transactions (Table)" },
            { id: "map", label: "Map Products" },
            { id: "merge", label: "Merge Products" },
            { id: "circles", label: "Circlewise Products" },
            { id: "bank-accounts", label: "Bank Accounts" },
            { id: "bank-charges", label: "Bank Charges" },
            { id: "pan-agents", label: "Pending PAN Agents" },
            { id: "pan-coupons", label: "PAN Coupons" },
            { id: "signups", label: "User Signups" },
          ].map((tab) => (
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

      {/* 1. ONLINE TRANSACTION SUMMARY TABLE (Exact Page 4 Table Columns) */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
                  Page 4 Online Transaction Table
                </span>
                <h2 className="mt-1 text-base font-bold text-navy">
                  Operator Performance & Margin Breakdown Table
                </h2>
                <p className="font-mono text-xs text-slate-500">
                  Schema: Operator | Total | 5% | 7% | Succs | Unset | Fail | Pending | Refunded | Detail
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search operator, circle, vendor..."
                    value={operatorSearch}
                    onChange={(e) => setOperatorSearch(e.target.value)}
                    className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                  />
                  {operatorSearch && (
                    <button
                      type="button"
                      onClick={() => setOperatorSearch("")}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Clear operator search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Search size={12} /> Search Operators
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Total Volume</th>
                    <th className="px-4 py-3 text-sky-700">5% Slab Vol</th>
                    <th className="px-4 py-3 text-indigo-700">7% Slab Vol</th>
                    <th className="px-4 py-3 text-emerald-700">Succs</th>
                    <th className="px-4 py-3 text-slate-500">Unset</th>
                    <th className="px-4 py-3 text-rose-700">Fail</th>
                    <th className="px-4 py-3 text-amber-700">Pending</th>
                    <th className="px-4 py-3 text-purple-700">Refunded</th>
                    <th className="px-4 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockManagedProductSummaries
                    .filter((s) => {
                      if (!operatorSearch) return true;
                      const q = operatorSearch.toLowerCase();
                      return (
                        s.operator.toLowerCase().includes(q) ||
                        s.circle.toLowerCase().includes(q) ||
                        s.vendor.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                    <tr key={s.operator} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-navy">{s.operator}</p>
                        <p className="text-xs text-slate-400">{s.circle} · {s.vendor}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(s.totalVolume)}</td>
                      <td className="px-4 py-3.5 font-semibold text-sky-700">{formatINR(s.fivePercentVolume)}</td>
                      <td className="px-4 py-3.5 font-semibold text-indigo-700">{formatINR(s.sevenPercentVolume)}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600">{s.successfulCount}</td>
                      <td className="px-4 py-3.5 text-slate-400">{s.unsetCount}</td>
                      <td className="px-4 py-3.5 font-bold text-rose-600">{s.failedCount}</td>
                      <td className="px-4 py-3.5 font-bold text-amber-600">{s.pendingCount}</td>
                      <td className="px-4 py-3.5 font-bold text-purple-600">{s.refundedCount}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedSummary(s)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-200"
                        >
                          <Eye size={13} /> View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Transaction View (Page 4 Detail Table Columns) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  Page 4 Detail View Schema
                </span>
                <h3 className="mt-1 text-sm font-bold text-navy">
                  Operator | Stat | Date | OpID | Source | Response | Circle | User | Customer | TransID | Amount | Cat
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search TransID, OpID, User..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                  />
                  {txSearch && (
                    <button
                      type="button"
                      onClick={() => setTxSearch("")}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Clear tx search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Search size={12} /> Search Transactions
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Operator</th>
                    <th className="px-3 py-2.5">Stat</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">OpID</th>
                    <th className="px-3 py-2.5">Source / Resp</th>
                    <th className="px-3 py-2.5">Circle</th>
                    <th className="px-3 py-2.5">User (RMN)</th>
                    <th className="px-3 py-2.5">Customer</th>
                    <th className="px-3 py-2.5">TransID</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Cat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockPaymentTransactions
                    .filter((tx) => {
                      if (!txSearch) return true;
                      const q = txSearch.toLowerCase();
                      return (
                        tx.id.toLowerCase().includes(q) ||
                        tx.operator.toLowerCase().includes(q) ||
                        tx.rmn.includes(q) ||
                        tx.customerRef.toLowerCase().includes(q) ||
                        tx.circle.toLowerCase().includes(q) ||
                        tx.category.toLowerCase().includes(q)
                      );
                    })
                    .map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-2.5 font-bold text-navy">{tx.operator}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{tx.depositDate}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">OP-{tx.id.slice(-4)}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-700">{tx.vendor}</p>
                        <p className="text-[10px] text-slate-400">HTTP 200 / SUCCESS</p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{tx.circle}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{tx.rmn}</td>
                      <td className="px-3 py-2.5 text-slate-600">{tx.customerRef}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-sky-800">{tx.id}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{formatINR(tx.depositAmount)}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-sky-700">
                          {tx.category}
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

      {/* 2. MAP PRODUCTS (Page 4: Operator -> Circle -> Select Vendor) */}
      {activeTab === "map" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 4 Routing Rule
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Map Products: Operator + Circle → Select Vendor
            </h2>
            <p className="text-xs text-slate-500">
              Configure provider routing for bill payments, mobile recharges, and remittance switches.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {mappingState.map((m, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy">{m.operator}</p>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {m.circle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Routed to Vendor: <span className="font-bold text-sky-800">{m.vendor}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    defaultValue={m.vendor}
                    className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                  >
                    <option>Payart Switch</option>
                    <option>RazorPay UPI</option>
                    <option>BillDesk Aggregator</option>
                    <option>Fino Payments Bank</option>
                  </select>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    Active Route
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MERGE PRODUCTS (Page 4 Submenu) */}
      {activeTab === "merge" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Merge Products (All Utility Pay)</h2>
          <p className="text-xs text-slate-500">Combine multiple utility billers into unified merchant plans.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Electricity + Water Bundle", "Gas Pipeline + DTH Recharge", "Fastag + Broadband Bill", "Municipal Taxes + Rent Pay"].map((b) => (
              <div key={b} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <span className="text-xs font-bold text-slate-800">{b}</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Merged</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CIRCLEWISE PRODUCTS */}
      {activeTab === "circles" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Circlewise Products Directory (22 Telecom Circles)</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-semibold text-slate-700">
            {["Rajasthan", "Madhya Pradesh & CG", "Maharashtra & Goa", "Uttar Pradesh (East)", "Uttar Pradesh (West)", "Delhi NCR", "Bihar & Jharkhand", "Gujarat", "Karnataka", "Tamil Nadu", "West Bengal", "Punjab"].map((c) => (
              <div key={c} className="rounded border border-slate-200 p-2 text-center bg-slate-50">
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BANK ACCOUNTS & CHARGES */}
      {activeTab === "bank-accounts" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Manage Platform Bank Accounts (Nodal / Escrow)</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-bold text-navy">HDFC Bank — Nodal Escrow Account</p>
              <p className="text-xs text-slate-500">A/C: 50200019281029 · IFSC: HDFC0000060 · Balance: {formatINR(8450000)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-bold text-navy">State Bank of India — Settlement Pool</p>
              <p className="text-xs text-slate-500">A/C: 381029182910 · IFSC: SBIN0001048 · Balance: {formatINR(4210000)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bank-charges" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Manage Bank Charges & Provider Interchange Fees</h2>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b py-2"><span>UPI Switch Cost</span><span className="font-bold">₹0.00 / Free</span></div>
            <div className="flex justify-between border-b py-2"><span>IMPS Remittance Bank Fee</span><span className="font-bold">₹2.50 per Tx</span></div>
            <div className="flex justify-between border-b py-2"><span>AEPS Cash Withdrawal MDR</span><span className="font-bold">0.18% to NPCI</span></div>
            <div className="flex justify-between py-2"><span>Credit Card Interchange</span><span className="font-bold">0.90% to 1.40%</span></div>
          </div>
        </div>
      )}

      {/* 6. PAN AGENTS & PAN COUPONS */}
      {activeTab === "pan-agents" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Manage Pending PAN Agents (NSDL / UTI Agency)</h2>
          <div className="mt-4 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-slate-800">Sharma Digital (Rajesh Sharma)</p>
                <p className="text-slate-400">RMN: 9876543210 · Agency: NSDL e-Gov PSA</p>
              </div>
              <button className="rounded bg-navy px-3 py-1 font-bold text-white">Approve PSA ID</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pan-coupons" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Manage Pending PAN Coupons</h2>
          <p className="mt-2 text-xs text-slate-500">Current electronic coupon stock: <span className="font-bold text-navy">{couponCount} units</span></p>
          <button
            onClick={() => setCouponCount(couponCount + 500)}
            className="mt-4 rounded bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
          >
            Allocate +500 Coupons
          </button>
        </div>
      )}

      {/* 7. USER SIGNUPS */}
      {activeTab === "signups" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Manage User Signups (Self-Registration Queue)</h2>
          <p className="text-xs text-slate-500">Review self-registered merchant leads before assigning to Area Distributors.</p>
        </div>
      )}
    </div>
  );
}

