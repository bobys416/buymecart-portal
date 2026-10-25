"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/mock-data";

const walletSummary = {
  main: 245000,
  cashout: 78500,
  credits: 38900,
  debits: 18250,
  pendingRequests: 3,
};

const serviceShortcuts = [
  { name: "DMT", count: "18", status: "Live" },
  { name: "PPI DMT", count: "09", status: "Live" },
  { name: "Quick Pay", count: "12", status: "Live" },
  { name: "AEPS", count: "07", status: "Live" },
  { name: "Mobile", count: "24", status: "Live" },
  { name: "DTH", count: "06", status: "Live" },
  { name: "Utility", count: "15", status: "Live" },
  { name: "Bill Pay", count: "11", status: "Live" },
  { name: "Electricity", count: "13", status: "Live" },
  { name: "FASTag", count: "04", status: "Live" },
];

const recentTransactions = [
  { id: "TXN-786251", service: "Prepaid Recharge", customer: "9812345678", amount: 499, status: "Successful", mode: "Credit" },
  { id: "TXN-786102", service: "DMT", customer: "Anoop Verma", amount: 7500, status: "Pending", mode: "Debit" },
  { id: "TXN-785933", service: "Electricity", customer: "EE-2045", amount: 2140, status: "Successful", mode: "Debit" },
  { id: "TXN-785810", service: "BBPS", customer: "BGL-221", amount: 1650, status: "Failed", mode: "Debit" },
];

const paymentAccountCards = [
  { bank: "HDFC Bank", holder: "Rajesh Kumar Sharma", masked: "**** 4792", ifsc: "HDFC0001298", method: "IMPS" },
  { bank: "ICICI Bank", holder: "Rajesh Kumar Sharma", masked: "**** 1189", ifsc: "ICIC0001842", method: "NEFT" },
  { bank: "SBI", holder: "Rajesh Kumar Sharma", masked: "**** 7703", ifsc: "SBIN0007541", method: "RTGS" },
];

const paymentRequests = [
  { id: "PR-2048", amount: 25000, mode: "IMPS", status: "Under Review", date: "2026-10-23" },
  { id: "PR-2041", amount: 18000, mode: "NEFT", status: "Approved", date: "2026-10-20" },
  { id: "PR-2032", amount: 7500, mode: "Bank Transfer", status: "Settled", date: "2026-10-18" },
];

const ledgerEntries = [
  { id: "LGR-92041", requestId: "PR-2048", reference: "UTR-884721", retailer: "Rajesh Kumar Sharma", service: "Payment Request", debit: 0, credit: 25000, particulars: "Wallet top-up approved", previous: 158900, closing: 183900, date: "2026-10-23", status: "Successful" },
  { id: "LGR-92021", requestId: "TXN-786251", reference: "INV-4591", retailer: "Rajesh Kumar Sharma", service: "Recharge", debit: 499, credit: 0, particulars: "Prepaid mobile recharge", previous: 159399, closing: 158900, date: "2026-10-23", status: "Successful" },
  { id: "LGR-91988", requestId: "TXN-785933", reference: "BILL-2026", retailer: "Rajesh Kumar Sharma", service: "Electricity", debit: 2140, credit: 0, particulars: "Power bill settlement", previous: 173100, closing: 170960, date: "2026-10-22", status: "Successful" },
  { id: "LGR-91951", requestId: "TXN-785810", reference: "BBPS-441", retailer: "Rajesh Kumar Sharma", service: "BBPS", debit: 1650, credit: 0, particulars: "FASTag bill payment", previous: 172750, closing: 171100, date: "2026-10-21", status: "Failed" },
];

const marginRows = [
  { service: "DMT Remittance", type: "Percentage", value: "0.40%", range: "₹1,000 - ₹1,00,000", effective: "2026-10-01" },
  { service: "AEPS Cash Withdrawal", type: "Percentage", value: "0.35%", range: "₹100 - ₹20,000", effective: "2026-10-01" },
  { service: "Prepaid Recharge", type: "Fixed", value: "₹2.50", range: "All values", effective: "2026-10-01" },
  { service: "BBPS Utility", type: "Percentage", value: "0.25%", range: "₹100 - ₹50,000", effective: "2026-10-01" },
];

const ticketRows = [
  { id: "TKT-18421", subject: "UTR mismatch on bill payment", status: "In Progress", type: "Transaction Related", created: "2026-10-22" },
  { id: "TKT-18402", subject: "Request for account update", status: "Open", type: "Service Related", created: "2026-10-21" },
];

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    Successful: "bg-emerald-100 text-emerald-800",
    Pending: "bg-amber-100 text-amber-800",
    Failed: "bg-rose-100 text-rose-800",
    Approved: "bg-emerald-100 text-emerald-800",
    "Under Review": "bg-sky-100 text-sky-800",
    Settled: "bg-emerald-100 text-emerald-800",
    "In Progress": "bg-amber-100 text-amber-800",
    Open: "bg-sky-100 text-sky-800",
    Closed: "bg-slate-100 text-slate-700",
  };

  const className = palette[status] ?? "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Retailer Portal</p>
        <h2 className="mt-2 text-2xl font-bold text-[#101F55]">{title}</h2>
      </div>
      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">{subtitle}</div>
    </div>
  );
}

export function RetailerPortalView({ section = "dashboard" }: { section?: string }) {
  const normalized = (section || "dashboard").toLowerCase().replace(/_/g, "-");
  const [requestAmount, setRequestAmount] = useState("25000");
  const [requestMode, setRequestMode] = useState("IMPS");
  const [requestReference, setRequestReference] = useState("UTR-20891");
  const [requestSaved, setRequestSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLedger = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return ledgerEntries;
    return ledgerEntries.filter((entry) =>
      [entry.id, entry.requestId, entry.reference, entry.service, entry.retailer].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [searchTerm]);

  if (normalized === "receipts") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-panel md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">PDF Page 1 Retailer Portal</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Note 5: 1 ID Login Active Lock (Single-Session)</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-[#101F55]">Retailer Operating Console</h1>
            <p className="mt-0.5 text-xs text-slate-600">Terminal Node: <span className="font-bold">Sharma Digital (RMN: 9876543210)</span> · Jaipur, Rajasthan.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Wallet size={20} /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Wallet</p>
              <p className="text-xl font-extrabold text-[#101F55]">{formatINR(walletSummary.main)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Compliance Note 1 from Source PDF:</p>
          <h3 className="mt-2 text-3xl font-black tracking-wide text-[#101F55]">ELECTRONIC TRANSACTION RECEIPT</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Retailer</p>
              <p className="mt-2 text-lg font-bold text-slate-800">Rajesh Kumar Sharma</p>
              <p className="text-sm text-slate-600">Sharma Digital · Jaipur</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Transaction</p>
              <p className="mt-2 text-lg font-bold text-slate-800">TXN-786251</p>
              <p className="text-sm text-slate-600">Prepaid Recharge · {formatINR(499)}</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            This receipt is generated without platform branding, as required for neutral provider handouts. UTR and details remain visible for audit and customer clarity.
          </div>
        </div>
      </div>
    );
  }

  const navTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "payment-request", label: "Payment Request" },
    { id: "payment-status", label: "Payment Status" },
    { id: "wallet-ledger", label: "Wallet Ledger" },
    { id: "search-transaction", label: "Search Transaction" },
    { id: "view-margins", label: "View Margins" },
    { id: "reports", label: "Reports" },
    { id: "support", label: "Support" },
    { id: "security", label: "Profile & Security" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-panel md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Retailer Portal</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Role: Retailer</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-[#101F55]">Retailer Operating Console</h1>
          <p className="mt-0.5 text-xs text-slate-600">Sharma Digital · Jaipur, Rajasthan · Retailer account</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Wallet size={20} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Wallet</p>
            <p className="text-xl font-extrabold text-[#101F55]">{formatINR(walletSummary.main)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-panel">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              normalized === tab.id ? "bg-[#101F55] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {normalized === "dashboard" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><p className="text-xs font-bold uppercase text-slate-500">Main Wallet</p><p className="mt-4 text-3xl font-black text-[#101F55]">{formatINR(walletSummary.main)}</p><p className="mt-2 text-xs text-emerald-600">+{formatINR(walletSummary.credits)} today</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><p className="text-xs font-bold uppercase text-slate-500">Cashout Wallet</p><p className="mt-4 text-3xl font-black text-[#101F55]">{formatINR(walletSummary.cashout)}</p><p className="mt-2 text-xs text-slate-500">Available for settlement</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><p className="text-xs font-bold uppercase text-slate-500">Today’s Credit</p><p className="mt-4 text-3xl font-black text-[#101F55]">{formatINR(walletSummary.credits)}</p><p className="mt-2 text-xs text-emerald-600">Verified transactions</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><p className="text-xs font-bold uppercase text-slate-500">Pending Requests</p><p className="mt-4 text-3xl font-black text-[#101F55]">{walletSummary.pendingRequests}</p><p className="mt-2 text-xs text-amber-600">Awaiting approval</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <SectionHeader title="Service shortcuts" subtitle="Authorized services" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {serviceShortcuts.map((service) => (
                  <div key={service.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{service.name}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{service.status}</span>
                    </div>
                    <p className="mt-3 text-xl font-black text-[#101F55]">{service.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <SectionHeader title="Status summary" subtitle="Operations" />
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Successful</p><p className="mt-2 text-2xl font-black text-emerald-700">{recentTransactions.filter((item) => item.status === "Successful").length}</p></div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Pending</p><p className="mt-2 text-2xl font-black text-amber-700">{recentTransactions.filter((item) => item.status === "Pending").length}</p></div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Failed</p><p className="mt-2 text-2xl font-black text-rose-700">{recentTransactions.filter((item) => item.status === "Failed").length}</p></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Recent transactions" subtitle="Live ledger" />
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-800">{txn.id}</td>
                      <td className="px-4 py-3 text-slate-700">{txn.service}</td>
                      <td className="px-4 py-3 text-slate-700">{txn.customer}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(txn.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                      <td className="px-4 py-3 text-slate-700">{txn.mode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {normalized === "payment-request" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Payment Request" subtitle="Verify before settlement" />
            <div className="mt-5 space-y-4">
              {paymentAccountCards.map((card) => (
                <div key={card.ifsc} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-800">{card.bank}</p>
                      <p className="text-sm text-slate-600">{card.holder}</p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{card.method}</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p><span className="font-semibold">Account:</span> {card.masked}</p>
                    <p><span className="font-semibold">IFSC:</span> {card.ifsc}</p>
                  </div>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#080080] px-4 py-2 text-sm font-semibold text-white">Request Load <span>→</span></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Load request" subtitle="Bank to wallet" />
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Amount<input value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <label className="block text-sm font-semibold text-slate-700">Payment mode<select value={requestMode} onChange={(e) => setRequestMode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"><option>IMPS</option><option>NEFT</option><option>UPI</option><option>Bank Transfer</option></select></label>
              <label className="block text-sm font-semibold text-slate-700">Reference / UTR<input value={requestReference} onChange={(e) => setRequestReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <button onClick={() => setRequestSaved(true)} className="w-full rounded-lg bg-[#080080] px-4 py-3 text-sm font-semibold text-white">Submit payment request</button>
              {requestSaved && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18} />Request created successfully. It is now under verification and will reflect in Payment Status after approval.</div>}
            </div>
          </div>
        </div>
      )}

      {normalized === "payment-status" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <SectionHeader title="Payment Status" subtitle="Verification tracking" />
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(item.amount)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.mode}</td>
                    <td className="px-4 py-3 text-slate-700">{item.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {normalized === "wallet-ledger" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <SectionHeader title="Wallet Ledger" subtitle="Immutable ledger" />
          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><CalendarRange size={14} className="text-slate-500" /><span className="text-sm text-slate-600">From date</span></div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><CalendarRange size={14} className="text-slate-500" /><span className="text-sm text-slate-600">To date</span></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><Search size={14} className="text-slate-500" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search ledger" className="bg-transparent text-sm outline-none" /></div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Debit</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{entry.id}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.requestId}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.service}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.debit ? formatINR(entry.debit) : "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.credit ? formatINR(entry.credit) : "-"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(entry.closing)}</td>
                    <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {normalized === "search-transaction" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <SectionHeader title="Search Transaction" subtitle="Filter by reference or date" />
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <input placeholder="Transaction ID" className="rounded-lg border border-slate-300 px-3 py-2.5" />
            <input placeholder="Customer number" className="rounded-lg border border-slate-300 px-3 py-2.5" />
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2.5" />
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#080080] px-4 py-2.5 text-sm font-semibold text-white"><Search size={14} />Search</button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><Download size={14} />Export</button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="px-4 py-3">Transaction ID</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Provider Ref</th></tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{txn.id}</td>
                    <td className="px-4 py-3 text-slate-700">{txn.service}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(txn.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{txn.customer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {normalized === "view-margins" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <SectionHeader title="View Margins" subtitle="Read-only commission engine" />
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="px-4 py-3">Service Name</th><th className="px-4 py-3">Commission Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Range</th><th className="px-4 py-3">Effective Date</th></tr>
              </thead>
              <tbody>
                {marginRows.map((row) => (
                  <tr key={row.service} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.service}</td>
                    <td className="px-4 py-3 text-slate-700">{row.type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.value}</td>
                    <td className="px-4 py-3 text-slate-700">{row.range}</td>
                    <td className="px-4 py-3 text-slate-700">{row.effective}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {normalized === "reports" && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><div className="flex items-center gap-3"><FileText className="text-[#101F55]" size={18} /><p className="font-bold text-slate-800">Wallet Ledger</p></div><p className="mt-3 text-sm text-slate-600">Download daily ledger and balance statements.</p><button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#080080] px-3 py-2 text-sm font-semibold text-white"><Download size={14} />Export</button></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><div className="flex items-center gap-3"><Landmark className="text-[#101F55]" size={18} /><p className="font-bold text-slate-800">Recharge Reports</p></div><p className="mt-3 text-sm text-slate-600">Review successful, failed, and pending recharges.</p><button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#080080] px-3 py-2 text-sm font-semibold text-white"><Download size={14} />Export</button></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel"><div className="flex items-center gap-3"><CreditCard className="text-[#101F55]" size={18} /><p className="font-bold text-slate-800">Banking Reports</p></div><p className="mt-3 text-sm text-slate-600">Check DMT, AEPS, biller, and settlement summaries.</p><button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#080080] px-3 py-2 text-sm font-semibold text-white"><Download size={14} />Export</button></div>
        </div>
      )}

      {normalized === "support" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Create ticket" subtitle="Help desk" />
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Ticket category<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"><option>Transaction Related</option><option>Service Related</option><option>Payment Related</option></select></label>
              <label className="block text-sm font-semibold text-slate-700">Transaction ID<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="TXN-786251" /></label>
              <label className="block text-sm font-semibold text-slate-700">Issue description<textarea className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#080080] px-4 py-2.5 text-sm font-semibold text-white"><Ticket size={14} />Raise support ticket</button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="My tickets" subtitle="Status" />
            <div className="mt-5 space-y-3">
              {ticketRows.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-800">{ticket.id}</p><StatusBadge status={ticket.status} /></div>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{ticket.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">{ticket.type} · {ticket.created}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {normalized === "security" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Profile & security" subtitle="Account details" />
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p><span className="font-semibold text-slate-800">Business name:</span> Sharma Digital</p><p className="mt-2"><span className="font-semibold text-slate-800">Contact:</span> +91 98765 43210</p><p className="mt-2"><span className="font-semibold text-slate-800">KYC status:</span> <span className="text-emerald-700">Verified</span></p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p><span className="font-semibold text-slate-800">Bank account:</span> HDFC Bank • ****4792</p><p className="mt-2"><span className="font-semibold text-slate-800">MFA status:</span> Enabled</p><p className="mt-2"><span className="font-semibold text-slate-800">Session policy:</span> Single-session active</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <SectionHeader title="Security posture" subtitle="Operational view" />
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><BadgeCheck size={16} />Role-based access and approval checks enabled</div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><ShieldCheck size={16} />Sensitive details remain masked</div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><AlertCircle size={16} />Wallet credit requires approval and settlement verification</div>
            </div>
          </div>
        </div>
      )}

      {!['dashboard','payment-request','payment-status','wallet-ledger','search-transaction','view-margins','reports','support','security','receipts'].includes(normalized) && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Retailer module</p>
          <h3 className="mt-3 text-2xl font-bold text-[#101F55]">{section}</h3>
          <p className="mt-2 text-sm text-slate-600">This retailer workspace is ready for the requested business workflow.</p>
        </div>
      )}
    </div>
  );
}
