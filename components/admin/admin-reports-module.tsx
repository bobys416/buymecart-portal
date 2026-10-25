"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Layers,
  Search,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { formatINR, mockPaymentTransactions, mockMerchants } from "@/lib/mock-data";

interface AdminReportsModuleProps {
  initialTab?: string;
}

export function AdminReportsModule({ initialTab = "account-ledger" }: AdminReportsModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedRMN, setSelectedRMN] = useState<string>("All");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "2026-10-01", end: "2026-10-19" });

  const reportTabs = [
    { id: "account-ledger", label: "1. Account Ledger (RMN)" },
    { id: "wallet-ledger", label: "2. View Wallet Ledger" },
    { id: "view-transactions", label: "3. View Transactions" },
    { id: "aeps-transactions", label: "4. AEPS Transactions" },
    { id: "aeps-wallet-settlement", label: "5. AEPS Wallet Settlement" },
    { id: "dmt-transactions", label: "6. DMT Transactions" },
    { id: "card-transactions", label: "7. Credit Card Reports" },
    { id: "aeps-bank-settlement", label: "8. AEPS Bank Settlement" },
    { id: "dmt-ppi", label: "9. DMT PPI Transactions" },
    { id: "dmt-fino", label: "10. DMT Fino Transactions" },
    { id: "payout-report", label: "11. Payout Report" },
    { id: "pa-report", label: "12. PA & UPI PA Report" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 5 Module 2
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Authoritative Reports Suite (12 Reports)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Authoritative Financial Reports</h1>
          <p className="text-xs text-slate-500">
            Exportable double-entry ledger summaries, AEPS/DMT transaction sheets, and settlement batches.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={() => alert(`Exporting ${activeTab}.csv with date range ${dateRange.start} to ${dateRange.end}`)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
        >
          <Download size={14} /> Export CSV Statement
        </button>
      </div>

      {/* 12-Report Submenu Grid Tabs (Page 5 Exact 12 Reports) */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar (Dates / Agent RMN from Page 5 specification) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Freeform Search Bar with explicit Search Reports button */}
          <div className="flex flex-1 min-w-[260px] items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy transition">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search TxID, UTR, Beneficiary, or Service..."
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 outline-none"
              />
              {reportSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReportSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition shrink-0"
            >
              <Search size={12} /> Search Reports
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Filter by Agent RMN:</span>
            <select
              value={selectedRMN}
              onChange={(e) => setSelectedRMN(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 bg-white"
            >
              <option value="All">All Registered RMNs</option>
              {mockMerchants.map((m) => (
                <option key={m.id} value={m.rmn}>
                  {m.rmn} ({m.shopName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">From:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-lg border border-slate-300 p-1 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">To:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-lg border border-slate-300 p-1 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Active Report Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-navy">
            {reportTabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative append-only rows filtered for period {dateRange.start} to {dateRange.end}.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tx Ref / Date</th>
                <th className="px-4 py-3">Agent RMN / Merchant</th>
                <th className="px-4 py-3">Service Rail</th>
                <th className="px-4 py-3">Bank Ref / UTR</th>
                <th className="px-4 py-3 font-bold">Gross Amount</th>
                <th className="px-4 py-3">Tempered Margin</th>
                <th className="px-4 py-3 font-bold text-navy">Net Settlement</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockPaymentTransactions
                .filter((tx) => {
                  const matchesRmn = selectedRMN === "All" || tx.rmn === selectedRMN;
                  if (!matchesRmn) return false;
                  if (!reportSearchQuery) return true;
                  const q = reportSearchQuery.toLowerCase();
                  return (
                    tx.id.toLowerCase().includes(q) ||
                    tx.bankRefNo.toLowerCase().includes(q) ||
                    tx.service.toLowerCase().includes(q) ||
                    tx.retailerName.toLowerCase().includes(q) ||
                    tx.rmn.includes(q)
                  );
                })
                .map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs">
                    <p className="font-bold text-navy">{tx.id}</p>
                    <p className="text-slate-400">{tx.depositDate} · {tx.timestamp}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-semibold text-slate-800">{tx.retailerName}</p>
                    <p className="font-mono text-slate-400">{tx.rmn}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-medium text-slate-700">{tx.service}</p>
                    <p className="text-slate-400">{tx.payMode}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{tx.bankRefNo}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatINR(tx.depositAmount)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatINR(tx.calculatedFee)}</td>
                  <td className="px-4 py-3 font-extrabold text-navy">{formatINR(tx.netSettlement)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

