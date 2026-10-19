"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  HelpCircle,
  Landmark,
  Layers,
  Printer,
  QrCode,
  Radio,
  Receipt,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Ticket,
  Wallet,
  Zap,
} from "lucide-react";
import {
  calculateTemperedMarginFee,
  formatINR,
  mockPaymentTransactions,
} from "@/lib/mock-data";
import { PaymentTransaction } from "@/lib/types";

interface RetailerPortalViewProps {
  section?: string;
}

export function RetailerPortalView({ section = "dashboard" }: RetailerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<string>(section);

  // Payment Initiation Form State
  const [initForm, setInitForm] = useState({
    service: "UPI Collect (QR / Intent)",
    mode: "UPI",
    amount: "1500",
    customerRef: "INV-CUST-9901",
    beneficiaryName: "Rajesh Kumar",
    remarks: "Store checkout payment",
  });
  const [calculatedQuote, setCalculatedQuote] = useState(() =>
    calculateTemperedMarginFee(1500, "UPI Collect")
  );
  const [txSuccess, setTxSuccess] = useState<PaymentTransaction | null>(null);

  // Selected Transaction for Printable Receipt (Strictly No Logos)
  const [receiptTx, setReceiptTx] = useState<PaymentTransaction | null>(
    mockPaymentTransactions[0]
  );

  const handleAmountChange = (amtStr: string) => {
    setInitForm({ ...initForm, amount: amtStr });
    const num = Number(amtStr) || 0;
    setCalculatedQuote(calculateTemperedMarginFee(num, initForm.service));
  };

  const handleInitiateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(initForm.amount);
    const newTx: PaymentTransaction = {
      id: `BMC-${Date.now().toString().slice(-8)}`,
      rmn: "9876543210",
      retailerName: "Sharma Digital",
      service: initForm.service,
      payMode: initForm.mode,
      bank: "NPCI / Partner Bank",
      bankRefNo: `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      depositDate: new Date().toISOString().split("T")[0],
      depositAmount: amt,
      calculatedFee: calculatedQuote.fee,
      netSettlement: amt - calculatedQuote.fee,
      status: "Successful",
      operator: "Instant Switch",
      circle: "Rajasthan Circle",
      vendor: "DemoPay",
      customerRef: initForm.customerRef,
      category: "Retail Transaction",
      paymentRemarks: initForm.remarks,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTxSuccess(newTx);
    setReceiptTx(newTx);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Security Badge */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-panel md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              PDF Page 1 Retailer Portal
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Note 5: 1 ID Login Active Lock (Single-Session)
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">Retailer Operating Console</h1>
          <p className="mt-0.5 text-xs text-slate-600">
            Terminal Node: <span className="font-bold">Sharma Digital (RMN: 9876543210)</span> · Jaipur, Rajasthan.
          </p>
        </div>

        {/* Balance Badge */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Wallet</p>
            <p className="text-xl font-extrabold text-navy">{formatINR(84500)}</p>
          </div>
        </div>
      </div>

      {/* Submenu Navigation Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { id: "dashboard", label: "Dashboard Overview" },
          { id: "payments", label: "Start Payment (Initiate)" },
          { id: "services", label: "Enabled Services (Page 1)" },
          { id: "receipts", label: "Transaction Slip / Receipt (No Logos)" },
          { id: "transactions", label: "Transaction History" },
          { id: "support", label: "Support Ticket" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Today's Transactions</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">14 Slips</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">100% Success Rate</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Today's Collection</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(38400)}</p>
              <p className="mt-1 text-xs text-slate-400">Via UPI & AEPS</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Total Margin Retained</span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">{formatINR(342)}</p>
              <p className="mt-1 text-xs text-slate-400">Tempered margin scheme</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Assigned Area Distributor</span>
              <p className="mt-2 text-sm font-bold text-slate-800">AD-RAJ-01 (Vikram Patel)</p>
              <p className="mt-1 text-xs text-slate-400">Kit Handover Complete ✓</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. START PAYMENT WITH TEMPERED MARGIN QUOTE (Page 1) */}
      {activeTab === "payments" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-navy">Initiate Retail Customer Transaction</h2>
              <p className="text-xs text-slate-500">
                Collect payments via UPI, AEPS Aadhaar Pay, Cards, Net Banking, or DMT Remittance.
              </p>
            </div>

            <form onSubmit={handleInitiateTx} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Select Service Rail *</label>
                <select
                  value={initForm.service}
                  onChange={(e) => {
                    setInitForm({ ...initForm, service: e.target.value });
                    setCalculatedQuote(
                      calculateTemperedMarginFee(Number(initForm.amount) || 0, e.target.value)
                    );
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-bold text-navy"
                >
                  <option value="UPI Collect (QR / Intent)">UPI Collect (Dynamic QR / Intent)</option>
                  <option value="AEPS Cash Withdrawal">AEPS (Aadhaar Pay / Cash Withdrawal)</option>
                  <option value="DMT Money Transfer">DMT (Domestic Remittance - IMPS/NEFT)</option>
                  <option value="BBPS Electricity Bill">BBPS Utility Bill Payment</option>
                  <option value="Credit Card Payment">Credit / Debit Card Checkout</option>
                  <option value="Recharge (Mobile/DTH)">Mobile / DTH Recharge</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600">Transaction Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={initForm.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-extrabold text-navy outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600">Customer Reference / Invoice</label>
                  <input
                    type="text"
                    value={initForm.customerRef}
                    onChange={(e) => setInitForm({ ...initForm, customerRef: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Transaction Remarks</label>
                <input
                  type="text"
                  value={initForm.remarks}
                  onChange={(e) => setInitForm({ ...initForm, remarks: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              {txSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Transaction Successful: {txSuccess.id}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Bank UTR: {txSuccess.bankRefNo} · Slip available in Receipts tab.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-navy py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Execute Demo Payment
              </button>
            </form>
          </div>

          {/* Tempered-Margin Fee Breakdown Box */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-6 shadow-panel">
            <h3 className="font-bold text-navy flex items-center gap-1.5 text-sm">
              <Zap size={16} className="text-sky-700" /> Tempered Margin Calculation
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Calculated live based on Page 3 pricing slabs:
            </p>

            <div className="mt-4 space-y-2 rounded-lg bg-white p-3.5 text-xs border border-sky-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Amount:</span>
                <span className="font-bold text-slate-800">{formatINR(Number(initForm.amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pricing Formula Applied:</span>
                <span className="font-mono text-sky-800 font-semibold">{calculatedQuote.method}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-500">Platform Charge:</span>
                <span className="font-bold text-rose-600">{formatINR(calculatedQuote.fee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-extrabold text-navy">
                <span>Net Credit to Settlement:</span>
                <span className="text-emerald-700 font-bold">
                  {formatINR((Number(initForm.amount) || 0) - calculatedQuote.fee)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Slab Rules: ₹101–₹1,000 → Flat ₹7 | ₹1,001–₹2,000 → Flat ₹9 | &gt;₹2,000 → Variable % without cap.
            </p>
          </div>
        </div>
      )}

      {/* 3. ENABLED SERVICES CATALOGUE (Page 1 Enabled Payments Services) */}
      {activeTab === "services" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              PDF Page 1 Enabled Payments Services
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">Enabled Services Catalogue</h2>
            <p className="text-xs text-slate-500">
              All payment modes documented in the original specification catalogue.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { category: "Net Banking", modes: ["APS", "APES / IMPS", "Retail Net Banking", "Corporate Net Banking", "Bank Checkout Gateway", "Aggregator"] },
              { category: "UPI Payments", modes: ["UPI ID", "Dynamic QR", "UPI Intent", "Request / Deeplink", "Credit on UPI", "International UPI"] },
              { category: "Card Payments", modes: ["Debit Card", "Credit Card", "Prepaid Card", "Pay Card"] },
              { category: "Remittance & Bills", modes: ["IMPS / NEFT / RTGS", "UPI Bank Transfer", "Scheduled Bank Transfer", "Bulk Bank Transfer", "NACH / e-Mandate", "AEPS (Aadhaar Pay)", "EMI Collection", "BBPS All Bills", "Bookings (Flight/Train/Movies)", "Recharge (Mobile/DTH)"] },
            ].map((cat) => (
              <div key={cat.category} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider">{cat.category}</h3>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {cat.modes.map((m) => (
                    <li key={m} className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TRANSACTION SLIP / RECEIPT (STRICTLY NO LOGOS - NOTE 1) */}
      {activeTab === "receipts" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <span className="font-bold">Compliance Note 1 from Source PDF:</span> "No Logos on Transaction slips/receipts".
            This receipt generator renders a neutral, whitelabel format omitting any merchant, bank, or platform logos.
          </div>

          {/* Printable Slip Container */}
          <div className="mx-auto max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-panel font-mono text-xs text-slate-800">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <p className="font-bold text-sm tracking-wider uppercase">ELECTRONIC TRANSACTION RECEIPT</p>
              <p className="text-[11px] text-slate-500">Neutral Customer Copy (Whitelabel)</p>
            </div>

            <div className="mt-4 space-y-2 border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Tx Reference:</span>
                <span className="font-bold">{receiptTx?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{receiptTx?.depositDate} {receiptTx?.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Rail:</span>
                <span>{receiptTx?.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Ref (UTR):</span>
                <span>{receiptTx?.bankRefNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Reference:</span>
                <span>{receiptTx?.customerRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Status:</span>
                <span className="font-bold text-emerald-700">{receiptTx?.status}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>Transaction Amount:</span>
                <span className="font-bold">{formatINR(receiptTx?.depositAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Tempered Fee:</span>
                <span>{formatINR(receiptTx?.calculatedFee || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>Total Paid:</span>
                <span>{formatINR(receiptTx?.depositAmount || 0)}</span>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] text-slate-400">
              <p>Generated by Authorized Business Correspondent Point</p>
              <p>For support queries, contact customer care with the Tx Reference</p>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Neutral Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TRANSACTION HISTORY */}
      {activeTab === "transactions" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Retailer Transaction Records</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockPaymentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 text-xs">
                    <td className="px-4 py-3 font-bold text-navy">{tx.id}</td>
                    <td className="px-4 py-3">{tx.service}</td>
                    <td className="px-4 py-3 font-bold">{formatINR(tx.depositAmount)}</td>
                    <td className="px-4 py-3">{formatINR(tx.calculatedFee)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setReceiptTx(tx);
                          setActiveTab("receipts");
                        }}
                        className="font-semibold text-sky-700 hover:underline"
                      >
                        Receipt Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUPPORT TICKET */}
      {activeTab === "support" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Raise Support Ticket or Refund Request</h2>
          <p className="text-xs text-slate-500">Escalate transaction issues directly to Area Distributor and Admin.</p>
          <div className="mt-4 max-w-lg space-y-3 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-600">Complaint Type</label>
              <select className="mt-1 w-full rounded border p-2">
                <option>Transaction Related (Double debit / Pending)</option>
                <option>Payment Related (Settlement mismatch)</option>
                <option>Service Related (AEPS device timeout)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600">Transaction ID</label>
              <input type="text" placeholder="e.g. BMC-20261019-01" className="mt-1 w-full rounded border p-2 font-mono" />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600">Remarks</label>
              <textarea rows={3} placeholder="Customer issue description..." className="mt-1 w-full rounded border p-2" />
            </div>
            <button
              onClick={() => alert("Ticket submitted to Area Distributor & Admin Helpdesk.")}
              className="rounded bg-navy px-4 py-2 font-bold text-white"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
