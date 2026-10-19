"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  Filter,
  KeyRound,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatINR, mockPaymentTransactions, mockMerchants } from "@/lib/mock-data";
import { PaymentTransaction, TransactionStatus } from "@/lib/types";

interface AdminPaymentModuleProps {
  initialTab?: string;
}

export function AdminPaymentModule({ initialTab = "authorize" }: AdminPaymentModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(mockPaymentTransactions);

  // Authorize Payments queue state
  const [authorizedIds, setAuthorizedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  // Initiate Payment Form state (Page 4 Exact Fields)
  const [initiateData, setInitiateData] = useState({
    agentRMN: "9876543210",
    bank: "State Bank of India",
    payMode: "IMPS",
    bankRefNo: "",
    depositDate: new Date().toISOString().split("T")[0],
    depositAmount: "",
    paymentRemarks: "",
    paymentPassword: "",
  });
  const [initiateSuccess, setInitiateSuccess] = useState(false);

  // Refund / Reversal state
  const [refundTxId, setRefundTxId] = useState("");
  const [refundReason, setRefundReason] = useState("Customer cancellation / Bank double debit");
  const [refundProcessed, setRefundProcessed] = useState<string | null>(null);

  // Settlement approval state
  const [settlementApproved, setSettlementApproved] = useState(false);

  // Filters for payment report
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const pendingApprovals = transactions.filter(
    (t) => (t.status === "Pending" || t.requiresAuthorization) && !authorizedIds.includes(t.id) && !rejectedIds.includes(t.id)
  );

  const reversedTransactions = transactions.filter((t) => t.status === "Refunded" || refundProcessed === t.id);

  const handleAuthorize = (id: string) => {
    setAuthorizedIds([...authorizedIds, id]);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Successful", requiresAuthorization: false } : t))
    );
  };

  const handleReject = (id: string) => {
    setRejectedIds([...rejectedIds, id]);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Failed", requiresAuthorization: false } : t))
    );
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiateData.depositAmount || !initiateData.bankRefNo) return;

    const amount = Number(initiateData.depositAmount);
    const newTx: PaymentTransaction = {
      id: `BMC-INIT-${Date.now().toString().slice(-6)}`,
      rmn: initiateData.agentRMN,
      retailerName: "Admin Direct Credit",
      service: `Admin Deposit (${initiateData.payMode})`,
      payMode: initiateData.payMode,
      bank: initiateData.bank,
      bankRefNo: initiateData.bankRefNo,
      depositDate: initiateData.depositDate,
      depositAmount: amount,
      calculatedFee: 0,
      netSettlement: amount,
      status: "Successful",
      operator: "Central Settlement",
      circle: "Headquarters",
      vendor: "Internal Pool Account",
      customerRef: "ADMIN-TOPUP",
      category: "Payout",
      paymentRemarks: initiateData.paymentRemarks || "Manual Bank Deposit Credit",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTransactions([newTx, ...transactions]);
    setInitiateSuccess(true);
    setTimeout(() => {
      setInitiateSuccess(false);
      setActiveTab("report");
    }, 1500);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTxId) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === refundTxId ? { ...t, status: "Refunded" } : t))
    );
    setRefundProcessed(refundTxId);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 4 Module 3
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Payment Operations
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Payment Operations & Settlements</h1>
          <p className="text-xs text-slate-500">
            Authorize high-value transactions, process reversals, initiate deposits, and monitor network settlements.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "authorize", label: "Authorize Payments" },
            { id: "reverse", label: "Reverse (Refund)" },
            { id: "initiate", label: "Initiate Payments" },
            { id: "report", label: "Payment Report" },
            { id: "status-report", label: "Status Report" },
            { id: "reversal-report", label: "Reversal Report" },
            { id: "settlement", label: "Approve Settlement" },
            { id: "network-report", label: "Network Report" },
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

      {/* 1. AUTHORIZE PAYMENTS TAB (Maker-Checker Queue) */}
      {activeTab === "authorize" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-navy" size={18} />
              <h2 className="text-base font-bold text-navy">
                Authorize Payments (Approve Pay Queue)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Maker-checker administrative authorization for high-value remittances, DMT transfers, and flagged transactions.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {pendingApprovals.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-bold text-slate-700">All payment authorizations cleared</p>
                <p className="text-xs text-slate-400">No pending maker-checker payment requests.</p>
              </div>
            ) : (
              pendingApprovals.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy">{tx.id}</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        {tx.service}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      Amount: {formatINR(tx.depositAmount)} · Retailer: {tx.retailerName} ({tx.rmn})
                    </p>
                    <p className="text-xs text-slate-500">
                      Bank Ref: {tx.bankRefNo} · Mode: {tx.payMode} · Operator: {tx.operator}
                    </p>
                    <p className="text-xs italic text-slate-600">Remarks: "{tx.paymentRemarks}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(tx.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleAuthorize(tx.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={14} /> Authorize & Release
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. REVERSE PAYMENTS (REFUND) TAB (Page 4 Submenu) */}
      {activeTab === "reverse" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Reverse Payments & Refund Management</h2>
            <p className="text-xs text-slate-500">
              Per Page 1 & 4 specifications: Authorized refund processing with No-Limit handling and full ledger reversal audit.
            </p>
          </div>

          <form onSubmit={handleProcessRefund} className="mt-5 max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Select Transaction to Reverse</label>
              <select
                value={refundTxId}
                onChange={(e) => setRefundTxId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-800"
              >
                <option value="">-- Choose Transaction Reference --</option>
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.retailerName} — {formatINR(t.depositAmount)} ({t.service}) [{t.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Reversal Reason / Ground</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
                <option>Customer cancellation / Bank double debit</option>
                <option>Switch timeout (UIDAI / NPCI Failure)</option>
                <option>Fraud dispute / Chargeback escalation</option>
                <option>Beneficiary bank credit failure</option>
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-bold text-slate-700">Financial Integrity Note:</span> Reversals create balanced compensating double-entry ledger lines. Posted historical bank responses are never overwritten.
            </div>

            {refundProcessed && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Transaction {refundProcessed} marked as Refunded and compensating ledger entry posted.
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              <RefreshCcw size={15} /> Execute Authorized Reversal
            </button>
          </form>
        </div>
      )}

      {/* 3. INITIATE PAYMENTS TAB (Page 4 Exact Form Fields) */}
      {activeTab === "initiate" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 4 Exact Fields
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">Initiate Platform Payment / Deposit Credit</h2>
            <p className="text-xs text-slate-500">
              Fields: Agent RMN, Bank, Pay Mode, Bank Reference Number, Deposit Date, Deposit Amount, Payment Remarks, Payment Passwords.
            </p>
          </div>

          <form onSubmit={handleInitiatePayment} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Agent RMN *</label>
                <input
                  type="tel"
                  required
                  value={initiateData.agentRMN}
                  onChange={(e) => setInitiateData({ ...initiateData, agentRMN: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Bank *</label>
                <select
                  value={initiateData.bank}
                  onChange={(e) => setInitiateData({ ...initiateData, bank: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                >
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Bank of Baroda</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Pay Mode *</label>
                <select
                  value={initiateData.payMode}
                  onChange={(e) => setInitiateData({ ...initiateData, payMode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                >
                  <option>IMPS (Instant)</option>
                  <option>NEFT</option>
                  <option>RTGS</option>
                  <option>UPI Bank Transfer</option>
                  <option>Cash Deposit Slip</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Bank Reference Number *</label>
                <input
                  type="text"
                  required
                  placeholder="UTR / RRN from counterparty bank"
                  value={initiateData.bankRefNo}
                  onChange={(e) => setInitiateData({ ...initiateData, bankRefNo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Deposit Date *</label>
                <input
                  type="date"
                  required
                  value={initiateData.depositDate}
                  onChange={(e) => setInitiateData({ ...initiateData, depositDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Deposit Amount (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={initiateData.depositAmount}
                  onChange={(e) => setInitiateData({ ...initiateData, depositAmount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-bold text-navy outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600">Payment Remarks</label>
                <input
                  type="text"
                  placeholder="Remarks for accounting ledger..."
                  value={initiateData.paymentRemarks}
                  onChange={(e) => setInitiateData({ ...initiateData, paymentRemarks: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Payment Passwords (MFA) *</label>
                <div className="relative mt-1">
                  <input
                    type="password"
                    required
                    placeholder="Enter admin authorization PIN"
                    value={initiateData.paymentPassword}
                    onChange={(e) => setInitiateData({ ...initiateData, paymentPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-8 text-xs outline-none focus:border-sky-500"
                  />
                  <KeyRound size={14} className="absolute right-2.5 top-3 text-slate-400" />
                </div>
              </div>
            </div>

            {initiateSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Payment initiated and credited to merchant ledger account.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Send size={15} /> Confirm & Post Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. PAYMENT REPORT TAB */}
      {activeTab === "report" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">Comprehensive Payment Transaction Report</h2>
              <p className="text-xs text-slate-500">Authoritative payment ledger across all channels and rails.</p>
            </div>
            <button
              onClick={() => alert("Mock CSV Export: buymecart-payments-report.csv generated.")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Tx Ref / Date</th>
                  <th className="px-5 py-3">Retailer / RMN</th>
                  <th className="px-5 py-3">Mode & Bank</th>
                  <th className="px-5 py-3">Bank Ref No</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Tempered Fee</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{t.id}</p>
                      <p className="text-xs text-slate-400">{t.depositDate} · {t.timestamp}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{t.retailerName}</p>
                      <p className="text-xs text-slate-400">{t.rmn}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700">{t.payMode}</p>
                      <p className="text-xs text-slate-400">{t.bank}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{t.bankRefNo}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{formatINR(t.depositAmount)}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{formatINR(t.calculatedFee)}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STATUS REPORT TAB */}
      {activeTab === "status-report" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Successful Payments", count: transactions.filter((t) => t.status === "Successful").length, tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
            { label: "Pending Authorizations", count: transactions.filter((t) => t.status === "Pending").length, tone: "border-amber-200 bg-amber-50 text-amber-800" },
            { label: "Failed Switch Attempts", count: transactions.filter((t) => t.status === "Failed").length, tone: "border-rose-200 bg-rose-50 text-rose-800" },
            { label: "Disputed / Chargebacks", count: transactions.filter((t) => t.status === "Disputed").length, tone: "border-purple-200 bg-purple-50 text-purple-800" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-5 shadow-panel ${item.tone}`}>
              <p className="text-xs font-bold uppercase">{item.label}</p>
              <p className="mt-2 text-3xl font-extrabold">{item.count}</p>
              <p className="mt-1 text-xs opacity-80">Tracked in live sandbox</p>
            </div>
          ))}
        </div>
      )}

      {/* 6. REVERSAL REPORT TAB */}
      {activeTab === "reversal-report" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Reversal & Refund History Report</h2>
            <p className="text-xs text-slate-500">Audit log of all reversed payments and refunded transactions.</p>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {reversedTransactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No reversals executed yet.</p>
            ) : (
              reversedTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-700">{t.id}</span>
                    <p className="text-sm font-semibold text-slate-800">{t.retailerName} — {formatINR(t.depositAmount)}</p>
                    <p className="text-xs text-slate-400">Bank: {t.bank} ({t.bankRefNo})</p>
                  </div>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                    Reversed & Balanced
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. APPROVE SETTLEMENT TAB (Page 4 Submenu) */}
      {activeTab === "settlement" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Approve Settlement (Settlement Trans)</h2>
            <p className="text-xs text-slate-500">Batch review and clearance of end-of-day bank settlement files.</p>
          </div>

          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-sky-200 px-2 py-0.5 text-xs font-bold text-sky-900">Batch: SETTLE-20261019-EOD</span>
                <h3 className="mt-1 text-base font-bold text-navy">Daily Nodal Settlement Batch</h3>
                <p className="text-xs text-slate-600">Total Merchants: 6 · Total Settlement: {formatINR(348000)}</p>
              </div>

              <button
                onClick={() => setSettlementApproved(true)}
                disabled={settlementApproved}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition ${
                  settlementApproved ? "bg-emerald-600" : "bg-navy hover:bg-slate-800"
                }`}
              >
                {settlementApproved ? "Settlement Batch Dispatched ✓" : "Authorize Settlement Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NETWORK PAYMENT REPORT TAB (Page 4 Submenu) */}
      {activeTab === "network-report" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Network Payment Report (By SD & AD Hierarchy)</h2>
            <p className="text-xs text-slate-500">Volume aggregation broken down across distribution tiers.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-navy">SD-NORTH-01 (Rajeev Mehta)</h3>
              <p className="text-xs text-slate-500">Northern Zone Channel</p>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-xs">
                <span>Total Processed:</span>
                <span className="font-bold">{formatINR(246840)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-navy">SD-CENTRAL-01 (Arun Singh)</h3>
              <p className="text-xs text-slate-500">Central Zone Channel</p>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-xs">
                <span>Total Processed:</span>
                <span className="font-bold">{formatINR(101200)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
