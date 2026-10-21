"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  Layers,
  Lock,
  MapPin,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Ticket,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  calculateTemperedMarginFee,
  formatINR,
  mockPaymentTransactions,
} from "@/lib/mock-data";
import { PaymentTransaction } from "@/lib/types";
import { DedicatedBillReceipt } from "@/components/receipt/dedicated-bill-receipt";
import { apiClient } from "@/lib/api-client";
import { getStoredSession } from "@/lib/auth";

interface RetailerPortalViewProps {
  section?: string;
}

export function RetailerPortalView({ section = "dashboard" }: RetailerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<string>(section);

  useEffect(() => {
    if (section) setActiveTab(section);
  }, [section]);

  // Search filter states across transactions & receipts
  const searchParams = useSearchParams();
  const qParam = searchParams?.get?.("q") || "";
  const [txSearchTerm, setTxSearchTerm] = useState(qParam);
  const [txStatusFilter, setTxStatusFilter] = useState("All");
  const [receiptSearchTerm, setReceiptSearchTerm] = useState("");
  const [receiptAlert, setReceiptAlert] = useState("");

  useEffect(() => {
    if (qParam) setTxSearchTerm(qParam);
  }, [qParam]);

  // Multi-gateway payment engine states (UPI, Razorpay, Banking API, Stripe)
  const [selectedGateway, setSelectedGateway] = useState<"upi" | "razorpay" | "banking" | "stripe">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<any | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Penny drop beneficiary verification state for Banking API
  const [pennyDropForm, setPennyDropForm] = useState({
    accountNumber: "912345678901",
    ifsc: "SBIN0001234",
    name: "Rajesh Kumar Sharma",
  });
  const [pennyDropResult, setPennyDropResult] = useState<any | null>(null);
  const [pennyDropLoading, setPennyDropLoading] = useState(false);

  // Stripe card simulator state
  const [stripeCardForm, setStripeCardForm] = useState({
    cardNumber: "4242 •••• •••• 4242",
    expiry: "12/28",
    cvc: "888",
  });

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Live Wallet Balance and Persistent Transaction Records
  const [walletBalance, setWalletBalance] = useState<number>(50000);
  const [transactionsList, setTransactionsList] = useState<PaymentTransaction[]>(mockPaymentTransactions);

  const fetchWalletAndTransactions = async () => {
    try {
      const session = getStoredSession("retailer");
      if (session?.accessToken) {
        const walletRes = await apiClient.get<any>("/ledger/wallet", { token: session.accessToken });
        if (walletRes && walletRes.available_balance !== undefined) {
          setWalletBalance(Number(walletRes.available_balance));
        }

        const txRes = await apiClient.get<any>("/ledger/transactions", { token: session.accessToken });
        if (txRes && Array.isArray(txRes.items) && txRes.items.length > 0) {
          const mapped: PaymentTransaction[] = txRes.items.map((t: any) => ({
            id: t.transaction_reference || String(t.id),
            rmn: "9876543210",
            retailerName: "Sharma Digital",
            service: `${t.payment_rail} Transfer`,
            payMode: t.payment_rail,
            bank: "Core Banking Switch",
            bankRefNo: t.provider_transaction_id || `UTR-${String(t.id).slice(0, 8)}`,
            depositDate: t.created_at ? t.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            depositAmount: Number(t.amount),
            calculatedFee: Number(t.fee || 0),
            netSettlement: Number(t.net_amount || t.amount),
            status: t.state === "SUCCESS" ? "Successful" : t.state === "FAILED" ? "Failed" : "Pending",
            operator: "Core Ledger Switch",
            circle: "Rajasthan Circle",
            vendor: "BuyMeCart Native Rail",
            customerRef: t.idempotency_key,
            category: "Ledger Transaction",
            paymentRemarks: t.remarks || "Direct Transfer",
            timestamp: t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          }));
          setTransactionsList([...mapped, ...mockPaymentTransactions]);
        }
      }
    } catch {
      // Retain fallback data if offline
    }
  };

  useEffect(() => {
    fetchWalletAndTransactions();
  }, []);

  // Selected Transaction for Printable Receipt (Strictly No Logos)
  const [receiptTx, setReceiptTx] = useState<PaymentTransaction | null>(
    mockPaymentTransactions[0]
  );

  const handleReceiptSearch = () => {
    if (!receiptSearchTerm.trim()) {
      setReceiptAlert("Please enter a Transaction Reference ID or Bank UTR to search.");
      return;
    }
    const q = receiptSearchTerm.trim().toLowerCase();
    const found = mockPaymentTransactions.find(
      (tx) =>
        tx.id.toLowerCase().includes(q) ||
        tx.bankRefNo.toLowerCase().includes(q) ||
        tx.customerRef.toLowerCase().includes(q)
    );
    if (found) {
      setReceiptTx(found);
      setReceiptAlert("");
    } else {
      setReceiptAlert(`No transaction receipt found matching "${receiptSearchTerm}". Try selecting from recent slips.`);
    }
  };

  const handleAmountChange = (amtStr: string) => {
    setInitForm({ ...initForm, amount: amtStr });
    const num = Number(amtStr) || 0;
    setCalculatedQuote(calculateTemperedMarginFee(num, initForm.service));
  };

  const handleVerifyPennyDrop = async () => {
    setPennyDropLoading(true);
    try {
      const res = await fetch("/api/payments/banking/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pennyDropForm),
      });
      const data = await res.json();
      setPennyDropResult(data);
    } catch (e) {
      console.error("Penny drop call failed:", e);
    } finally {
      setPennyDropLoading(false);
    }
  };

  const handleInitiateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setGeneratedOrder(null);
    setTxSuccess(null);

    const amt = Number(initForm.amount) || 0;
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: selectedGateway,
          amount: amt,
          customerRef: initForm.customerRef,
          customerName: initForm.beneficiaryName,
          serviceCategory: initForm.service,
          remarks: initForm.remarks,
          beneficiaryAccount: pennyDropForm.accountNumber,
          beneficiaryIfsc: pennyDropForm.ifsc,
          beneficiaryName: pennyDropForm.name,
        }),
      });
      const data = await res.json();
      if (data.order) {
        setGeneratedOrder(data.order);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Real Verification & Provider Settlement Handler (No fabricated success)
  const handleVerifyPayment = async (customPayload?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    customUtr?: string;
  }) => {
    if (!generatedOrder) return;
    setIsVerifying(true);
    setVerificationNotice(null);

    const amt = Number(initForm.amount) || 0;
    try {
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: selectedGateway,
          orderId: generatedOrder.orderId,
          amount: amt,
          razorpayOrderId: customPayload?.razorpayOrderId || generatedOrder.razorpayOrderId,
          razorpayPaymentId: customPayload?.razorpayPaymentId,
          razorpaySignature: customPayload?.razorpaySignature,
          bankUtr: customPayload?.customUtr || generatedOrder.bankUtr,
          stripePaymentIntentId: generatedOrder.stripePaymentIntentId,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData && verifyData.success) {
        const gatewayVendors: Record<string, string> = {
          upi: "NPCI UPI Switch",
          razorpay: "Razorpay Payments Ltd",
          banking: "Direct CBS (IMPS)",
          stripe: "Stripe Card Gateway",
        };

        const confirmedTx: PaymentTransaction = {
          id: generatedOrder.orderId,
          rmn: "9876543210",
          retailerName: "Sharma Digital",
          service: `${initForm.service} (${selectedGateway.toUpperCase()})`,
          payMode: selectedGateway.toUpperCase(),
          bank:
            selectedGateway === "banking"
              ? "Direct CBS (IMPS)"
              : selectedGateway === "upi"
              ? "NPCI / ICICI VPA"
              : selectedGateway === "razorpay"
              ? "Razorpay Gateway"
              : "Stripe Global",
          bankRefNo: verifyData.bankRefNo || generatedOrder.bankUtr || `UTR${Date.now().toString().slice(-8)}`,
          depositDate: new Date().toISOString().split("T")[0],
          depositAmount: amt,
          calculatedFee: calculatedQuote.fee,
          netSettlement: amt - calculatedQuote.fee,
          status: "Successful",
          operator: "Verified Rail Switch",
          circle: "Rajasthan Circle",
          vendor: gatewayVendors[selectedGateway] || "National Switch",
          customerRef: initForm.customerRef,
          category: "Retail Transaction",
          paymentRemarks: initForm.remarks,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setTxSuccess(confirmedTx);
        setReceiptTx(confirmedTx);
        setGeneratedOrder(null);
        setVerificationNotice(`Payment verified successfully via ${selectedGateway.toUpperCase()} rail. Bank Reference / UTR: ${confirmedTx.bankRefNo}`);
        fetchWalletAndTransactions();
      } else {
        setVerificationNotice(
          verifyData?.message || "Payment is pending authorization at provider switch. Awaiting customer confirmation and bank webhook."
        );
      }
    } catch (err: any) {
      setVerificationNotice(err.message || "Failed to contact payment verification service.");
    } finally {
      setIsVerifying(false);
    }
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
            <p className="text-xl font-extrabold text-navy">{formatINR(walletBalance)}</p>
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
          { id: "security", label: "Account & Security" },
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

      {/* 2. START PAYMENT WITH MULTI-GATEWAY ENGINE (Page 1) */}
      {activeTab === "payments" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-navy">Initiate Retail Customer Transaction</h2>
                  <p className="text-xs text-slate-500">
                    Switch between UPI, Razorpay, Banking API (IMPS), or Stripe Card Gateway.
                  </p>
                </div>
                <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                  Unified Gateway Engine
                </span>
              </div>

              {/* Gateway Selector Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: "upi", label: "NPCI UPI", sub: "Dynamic QR & Intent", icon: QrCode },
                  { id: "razorpay", label: "Razorpay", sub: "NetBanking & Cards", icon: Landmark },
                  { id: "banking", label: "Banking API", sub: "Direct IMPS / NEFT", icon: Building },
                  { id: "stripe", label: "Stripe", sub: "Global Cards", icon: CreditCard },
                ].map((gw) => {
                  const Icon = gw.icon;
                  const isSelected = selectedGateway === gw.id;
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => {
                        setSelectedGateway(gw.id as any);
                        setGeneratedOrder(null);
                        setTxSuccess(null);
                      }}
                      className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                        isSelected
                          ? "border-navy bg-navy/5 ring-1 ring-navy"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-navy text-xs">
                        <Icon size={14} className={isSelected ? "text-navy" : "text-slate-400"} />
                        <span>{gw.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5">{gw.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleInitiateTx} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Select Service Category *</label>
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
                    min="1"
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

              {/* Gateway Specific Input Fields */}
              {selectedGateway === "banking" && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-indigo-900 flex items-center gap-1.5">
                      <Building size={14} className="text-indigo-600" /> Core Banking IMPS / Beneficiary Rail
                    </span>
                    <button
                      type="button"
                      onClick={handleVerifyPennyDrop}
                      disabled={pennyDropLoading}
                      className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
                    >
                      {pennyDropLoading ? "Validating CBS..." : "Verify A/C (Penny Drop)"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">A/C Number</label>
                      <input
                        type="text"
                        value={pennyDropForm.accountNumber}
                        onChange={(e) => setPennyDropForm({ ...pennyDropForm, accountNumber: e.target.value })}
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">IFSC Code</label>
                      <input
                        type="text"
                        value={pennyDropForm.ifsc}
                        onChange={(e) => setPennyDropForm({ ...pennyDropForm, ifsc: e.target.value })}
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-mono uppercase"
                      />
                    </div>
                  </div>

                  {pennyDropResult && (
                    <div className={`rounded p-2 text-xs ${pennyDropResult.valid ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                      <p className="font-bold">
                        {pennyDropResult.valid ? `Verified: ${pennyDropResult.registeredName} (${pennyDropResult.bankName})` : "Invalid Account or IFSC"}
                      </p>
                      <p className="text-[10px] mt-0.5">CBS Match Score: {pennyDropResult.matchScore}% · PND Ref: {pennyDropResult.verificationUtr}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedGateway === "stripe" && (
                <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3.5 space-y-2">
                  <span className="text-xs font-bold uppercase text-purple-900 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-purple-600" /> Stripe Card Elements (Domestic & International)
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-600">Card Number</label>
                      <input
                        type="text"
                        value={stripeCardForm.cardNumber}
                        onChange={(e) => setStripeCardForm({ ...stripeCardForm, cardNumber: e.target.value })}
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600">Expiry / CVC</label>
                      <input
                        type="text"
                        value={`${stripeCardForm.expiry} · ${stripeCardForm.cvc}`}
                        readOnly
                        className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Transaction Remarks</label>
                <input
                  type="text"
                  value={initForm.remarks}
                  onChange={(e) => setInitForm({ ...initForm, remarks: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              {/* Active Generated Order / Gateway Session Sheet */}
              {generatedOrder && (
                <div className="rounded-xl border border-navy/20 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-navy text-xs">
                      Active Gateway Session: <strong className="font-mono text-sky-800">{generatedOrder.orderId}</strong>
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                      {generatedOrder.gateway} · {generatedOrder.status}
                    </span>
                  </div>

                  {/* UPI QR Display */}
                  {generatedOrder.gateway === "upi" && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-lg border border-slate-200">
                      {generatedOrder.upiQrCodeDataUrl && (
                        <img
                          src={generatedOrder.upiQrCodeDataUrl}
                          alt="Dynamic UPI QR Code"
                          className="h-32 w-32 rounded border border-slate-200 shadow-xs"
                        />
                      )}
                      <div className="space-y-1.5 text-xs text-left w-full">
                        <p className="font-bold text-navy">Scan with Any UPI App</p>
                        <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM or Bank App</p>
                        <p className="font-mono text-[11px] bg-slate-100 p-1.5 rounded truncate">
                          VPA: <strong>{generatedOrder.upiVpa}</strong>
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (generatedOrder.upiDeepLink) {
                                navigator.clipboard.writeText(generatedOrder.upiDeepLink);
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300"
                          >
                            <Copy size={12} /> {copiedUpi ? "Copied UPI Link!" : "Copy Intent URI"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment()}
                            disabled={isVerifying}
                            className="inline-flex items-center gap-1 rounded bg-sky-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-sky-800 disabled:opacity-50"
                          >
                            <RefreshCw size={13} className={isVerifying ? "animate-spin" : ""} />
                            {isVerifying ? "Verifying Switch..." : "Check Payment Status"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment({ customUtr: `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}` })}
                            disabled={isVerifying}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} /> [Sandbox] Verify Test Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Razorpay Sheet */}
                  {generatedOrder.gateway === "razorpay" && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                      <p className="font-bold text-navy">Razorpay Order Created</p>
                      <p className="font-mono text-slate-600 text-[11px]">
                        Order ID: <strong>{generatedOrder.razorpayOrderId}</strong> · Key: {generatedOrder.razorpayKeyId}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerifyPayment()}
                          disabled={isVerifying}
                          className="inline-flex items-center gap-1.5 rounded bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={isVerifying ? "animate-spin" : ""} />
                          {isVerifying ? "Checking Razorpay..." : "Query Gateway Status"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyPayment({
                            razorpayOrderId: generatedOrder.razorpayOrderId,
                            razorpayPaymentId: `pay_test_${Date.now().toString().slice(-8)}`,
                            razorpaySignature: "sandbox_simulated_sig_ok",
                          })}
                          disabled={isVerifying}
                          className="inline-flex items-center gap-1.5 rounded bg-sky-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-800 disabled:opacity-50"
                        >
                          <Landmark size={14} /> [Sandbox] Authorize & Verify Signature
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stripe Sheet */}
                  {generatedOrder.gateway === "stripe" && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                      <p className="font-bold text-navy">Stripe PaymentIntent Created</p>
                      <p className="font-mono text-slate-600 text-[11px]">
                        Intent: <strong>{generatedOrder.stripePaymentIntentId}</strong> · Secret: Secured
                      </p>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment()}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 rounded bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isVerifying ? "animate-spin" : ""} />
                        {isVerifying ? "Checking 3DS Status..." : "Verify 3D Secure Card Settlement"}
                      </button>
                    </div>
                  )}

                  {/* Banking Sheet */}
                  {generatedOrder.gateway === "banking" && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                      <p className="font-bold text-emerald-800">CBS IMPS Transfer Ready</p>
                      <p className="text-[11px] text-slate-600">
                        Beneficiary: {generatedOrder.beneficiaryName} · UTR: <strong className="font-mono">{generatedOrder.bankUtr}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment({ customUtr: generatedOrder.bankUtr })}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Building size={14} /> Verify Core Banking Settlement
                      </button>
                    </div>
                  )}

                  {verificationNotice && (
                    <div className="rounded-lg bg-sky-50 border border-sky-200 p-2.5 text-xs text-sky-900 font-medium">
                      {verificationNotice}
                    </div>
                  )}
                </div>
              )}

              {txSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" /> Transaction Successful: {txSuccess.id}
                    </p>
                    <span className="font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      UTR: {txSuccess.bankRefNo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Payment settled through {txSuccess.vendor}. Neutral whitelabel customer receipt generated.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("receipts")}
                    className="inline-flex items-center gap-1 rounded bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Receipt size={13} /> View Neutral Receipt Slip (No Logos)
                  </button>
                </div>
              )}

              {!generatedOrder && !txSuccess && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-lg bg-navy py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  {isProcessing ? "Connecting to Gateway Engine..." : `Initiate Payment via ${selectedGateway.toUpperCase()}`}
                </button>
              )}
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

          {/* Receipts Search & Quick Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Find Transaction Receipt Slip
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter Transaction Reference ID (e.g. BMC-101) or Bank UTR to generate neutral customer slip.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search TxID or UTR..."
                    value={receiptSearchTerm}
                    onChange={(e) => {
                      setReceiptSearchTerm(e.target.value);
                      setReceiptAlert("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleReceiptSearch();
                      }
                    }}
                    className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                  />
                  {receiptSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSearchTerm("");
                        setReceiptAlert("");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Clear receipt search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReceiptSearch}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Search size={12} /> Search Receipt
                </button>
              </div>
            </div>

            {receiptAlert && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center justify-between">
                <span>{receiptAlert}</span>
                <button
                  type="button"
                  onClick={() => setReceiptAlert("")}
                  className="text-rose-500 hover:text-rose-800 font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Quick chips for recent receipts */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">Recent Slips:</span>
              {mockPaymentTransactions.slice(0, 4).map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => {
                    setReceiptTx(tx);
                    setReceiptAlert("");
                    setReceiptSearchTerm(tx.id);
                  }}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-mono transition border ${
                    receiptTx?.id === tx.id
                      ? "bg-navy text-white border-navy"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {tx.id} ({tx.service.split(" ")[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Dedicated Bill Receipt Component (Isolated Print Layout & Multiple Widths) */}
          <div className="mx-auto max-w-2xl">
            <DedicatedBillReceipt
              receipt={{
                receiptNumber: receiptTx ? `REC-${receiptTx.id.slice(-8)}-${(receiptTx.bankRefNo || "0000").slice(-4)}` : "REC-DMT-100200",
                transactionRef: receiptTx?.id || "TX-BMC-100200",
                rrn: receiptTx?.bankRefNo || "419876543210",
                serviceName: receiptTx?.service || "BBPS Bill Payment",
                billerName: receiptTx?.service || "BBPS Service Provider",
                customerIdentifier: receiptTx?.customerRef || "+91 98765 43210",
                billAmount: receiptTx?.depositAmount || 0,
                calculatedFee: receiptTx?.calculatedFee || 0,
                totalPaid: (receiptTx?.depositAmount || 0) + (receiptTx?.calculatedFee || 0),
                status: receiptTx?.status || "SUCCESS",
                depositDate: receiptTx?.depositDate,
                timestamp: receiptTx?.timestamp,
                retailerName: "Patel Digital Kendra",
                retailerCode: "RET-MP-01",
                neutralWatermark: "BUYMECART_IBNK_NEUTRAL_RECEIPT_V1",
              }}
            />
          </div>
        </div>
      )}

      {/* 5. TRANSACTION HISTORY */}
      {activeTab === "transactions" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">Retailer Transaction Records</h2>
              <p className="text-xs text-slate-500">
                Live ledger of completed, pending, and refunded transactions at this merchant terminal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search TxID, UTR, Service, Ref..."
                  value={txSearchTerm}
                  onChange={(e) => setTxSearchTerm(e.target.value)}
                  className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                />
                {txSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setTxSearchTerm("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-navy"
              >
                <option value="All">All Statuses</option>
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Transactions
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {(txSearchTerm || txStatusFilter !== "All") && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              <span>
                Filtered by:{" "}
                {txSearchTerm && <strong className="text-navy">"{txSearchTerm}"</strong>}
                {txSearchTerm && txStatusFilter !== "All" && " · "}
                {txStatusFilter !== "All" && <span>Status: <strong>{txStatusFilter}</strong></span>}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTxSearchTerm("");
                  setTxStatusFilter("All");
                }}
                className="font-semibold text-rose-600 hover:underline"
              >
                Reset Filter
              </button>
            </div>
          )}

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
                {transactionsList
                  .filter((tx) => {
                    if (txStatusFilter !== "All" && tx.status !== txStatusFilter) return false;
                    if (!txSearchTerm) return true;
                    const q = txSearchTerm.toLowerCase();
                    return (
                      tx.id.toLowerCase().includes(q) ||
                      tx.service.toLowerCase().includes(q) ||
                      tx.bankRefNo.toLowerCase().includes(q) ||
                      tx.customerRef.toLowerCase().includes(q) ||
                      tx.payMode.toLowerCase().includes(q)
                    );
                  })
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 text-xs">
                      <td className="px-4 py-3 font-bold text-navy">{tx.id}</td>
                      <td className="px-4 py-3">{tx.service}</td>
                      <td className="px-4 py-3 font-bold">{formatINR(tx.depositAmount)}</td>
                      <td className="px-4 py-3">{formatINR(tx.calculatedFee)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            tx.status === "Successful"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "Pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setReceiptTx(tx);
                            setReceiptSearchTerm(tx.id);
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

      {/* 7. ACCOUNT & SECURITY (Single-Session & Hardware Locks) */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-navy px-2 py-0.5 text-[11px] font-bold text-teal">
                    STOREFRONT TERMINAL ID: TRM-2026-9021
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    Active & Bound ✓
                  </span>
                </div>
                <h2 className="mt-2 text-base font-bold text-navy">Merchant Account & Terminal Security</h2>
                <p className="text-xs text-slate-500">
                  Strict single-session enforcement, geo-fenced hardware bindings, and compliance status.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Account Profile Card */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-navy text-sm border-b border-slate-200 pb-2">
                  <Building size={16} className="text-teal" />
                  <span>Store & Operator Identity</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">Business Name</span>
                    <p className="font-semibold text-navy">Sharma Digital Store</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">Registered Mobile (RMN)</span>
                    <p className="font-mono font-semibold text-navy">+91 98260 12345</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">Assigned Territory</span>
                    <p className="font-semibold text-navy">Zone-01 Territory</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">Area Distributor</span>
                    <p className="font-semibold text-navy">AD-ZONE-01 (Sunil Verma)</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">KYC Status</span>
                    <p className="font-semibold text-emerald-700">12-Point KYC Verified ✓</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400">vKYC Verification</span>
                    <p className="font-semibold text-emerald-700">30s Video KYC Complete ✓</p>
                  </div>
                </div>
              </div>

              {/* Hardware & Terminal Binding */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-navy text-sm border-b border-slate-200 pb-2">
                  <Smartphone size={16} className="text-teal" />
                  <span>Hardware & Terminal Lock</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Micro-ATM Handover Serial</span>
                    <span className="font-mono font-bold text-navy">MATM-HYP-9021-X</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Biometric Scanner Device</span>
                    <span className="font-mono font-bold text-navy">MANTRA-MFS100-8802</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Dynamic QR Serial</span>
                    <span className="font-mono font-bold text-navy">QR-STAND-2026-9021</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Geo-Fence Lock</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <MapPin size={12} /> Bound to Store Coordinates
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note 5 Compliance: Single-Session & Auth Rules */}
            <div className="mt-6 rounded-lg border border-teal/30 bg-teal/5 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-navy text-sm">
                <Lock size={16} className="text-teal" />
                <span>Note 5 Single-Session Governance Active</span>
              </div>
              <p className="mt-1 text-slate-600">
                To prevent fraud and duplicate debits, your terminal account allows only one active session at any given moment. Logging in from another browser or device automatically revokes access on this terminal.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded bg-white border border-slate-200 px-2.5 py-1 font-semibold text-slate-700">
                  Current Session: Valid until 24-hour expiration
                </span>
                <span className="rounded bg-white border border-slate-200 px-2.5 py-1 font-semibold text-slate-700">
                  Auto-Lock: 15 minutes of inactivity
                </span>
                <span className="rounded bg-white border border-slate-200 px-2.5 py-1 font-semibold text-slate-700">
                  Biometric Two-Factor Required on AEPS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
