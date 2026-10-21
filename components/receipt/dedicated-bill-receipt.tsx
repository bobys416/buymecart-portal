"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  Info,
  Printer,
  Receipt as ReceiptIcon,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { formatINR } from "@/lib/mock-data";

export type ReceiptPaperFormat = "a4" | "thermal-80mm" | "thermal-58mm";

export interface DedicatedBillReceiptData {
  receiptNumber?: string;
  transactionRef?: string;
  rrn?: string;
  bankRefNo?: string;
  serviceName?: string;
  serviceType?: string;
  billerName?: string;
  retailerName?: string;
  retailerCode?: string;
  customerIdentifier?: string;
  customerRef?: string;
  billAmount?: number;
  baseAmount?: number;
  serviceFee?: number;
  temperedMarginFee?: number;
  totalPaid?: number;
  depositAmount?: number;
  calculatedFee?: number;
  status?: string;
  timestamp?: string;
  depositDate?: string;
  supportPhone?: string;
  supportEmail?: string;
  neutralWatermark?: string;
}

export interface DedicatedBillReceiptProps {
  receipt: DedicatedBillReceiptData;
  initialFormat?: ReceiptPaperFormat;
  onClose?: () => void;
  showActions?: boolean;
}

export function DedicatedBillReceipt({
  receipt,
  initialFormat = "a4",
  onClose,
  showActions = true,
}: DedicatedBillReceiptProps) {
  const [format, setFormat] = useState<ReceiptPaperFormat>(initialFormat);
  const [copied, setCopied] = useState(false);

  // Safe field resolution
  const txId = receipt.transactionRef || receipt.receiptNumber || "TX-PENDING";
  const rrn = receipt.rrn || receipt.bankRefNo || "Pending UTR";
  const service = receipt.billerName || receipt.serviceName || receipt.serviceType || "BBPS Bill Payment Service";
  const rawCustomer = receipt.customerIdentifier || receipt.customerRef || "Customer Walk-in";
  
  // Mask customer phone/ref for privacy
  const maskedCustomer =
    rawCustomer.length > 5
      ? `${rawCustomer.slice(0, 2)}****${rawCustomer.slice(-4)}`
      : rawCustomer;

  const baseAmt = receipt.baseAmount ?? receipt.billAmount ?? receipt.depositAmount ?? 0;
  const fee = receipt.serviceFee ?? receipt.temperedMarginFee ?? receipt.calculatedFee ?? 0;
  const totalAmt = receipt.totalPaid ?? (baseAmt + fee);

  const statusText = (receipt.status || "SUCCESS").toUpperCase();
  const dateStr = receipt.timestamp || (receipt.depositDate ? `${receipt.depositDate}` : new Date().toLocaleString("en-IN"));
  const retailer = receipt.retailerName || "Authorized Merchant Point (Kendra)";
  const retailerCode = receipt.retailerCode || "BC-ZONE-01-401";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopySummary = () => {
    const summary = `BUYMECART · IBNK RECEIPT
Receipt No: ${receipt.receiptNumber || txId}
Tx ID: ${txId}
Bank UTR/RRN: ${rrn}
Service: ${service}
Customer: ${maskedCustomer}
Amount: ₹${baseAmt.toFixed(2)}
Fee: ₹${fee.toFixed(2)}
Total Paid: ₹${totalAmt.toFixed(2)}
Status: ${statusText}
Date: ${dateStr}
Compliance: Note 1 Neutral Receipt (RBI PSS Act Compliant)`;

    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive print CSS class based on format
  const layoutClass =
    format === "thermal-58mm"
      ? "receipt-layout-58mm"
      : format === "thermal-80mm"
      ? "receipt-layout-80mm"
      : "receipt-layout-a4";

  // Container styling for on-screen preview
  const previewWidthClass =
    format === "thermal-58mm"
      ? "max-w-[280px]"
      : format === "thermal-80mm"
      ? "max-w-[360px]"
      : "max-w-xl";

  return (
    <div className="flex flex-col items-center w-full">
      {/* On-Screen Action Bar & Format Switcher (HIDDEN DURING PRINT) */}
      {showActions && (
        <div className="no-print w-full max-w-xl mb-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormat("a4")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                format === "a4"
                  ? "bg-[#101C32] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard A4
            </button>
            <button
              type="button"
              onClick={() => setFormat("thermal-80mm")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                format === "thermal-80mm"
                  ? "bg-[#101C32] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setFormat("thermal-58mm")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                format === "thermal-58mm"
                  ? "bg-[#101C32] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              58mm Thermal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              title="Copy receipt summary"
            >
              <Copy size={13} />
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              id="btn-print-bill-receipt"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-[#16B8A6] text-[#101C32] hover:bg-teal-400 shadow-sm transition"
            >
              <Printer size={14} />
              Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED PRINTABLE RECEIPT CONTAINER (VISIBLE TO PRINTER) */}
      <div
        id="dedicated-printable-receipt"
        className={`w-full ${previewWidthClass} ${layoutClass} bg-white text-slate-900 shadow-md sm:rounded-xl border border-slate-200 p-5 font-sans`}
      >
        {/* Neutral Header (Note 1 Compliance - Strict absence of sponsor/bank logos) */}
        <div className="text-center border-b border-dashed border-slate-300 pb-3">
          <div className="inline-block rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-xs font-black tracking-wider uppercase">
            BUYMECART &middot; IBNK
          </div>
          <h2 className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-800">
            ELECTRONIC TRANSACTION RECEIPT
          </h2>
          <p className="text-[10px] text-slate-500 font-mono">
            Neutral Customer Copy (Whitelabel) &middot; Note 1 Compliant
          </p>
        </div>

        {/* Kendra / Merchant Details */}
        <div className="py-2.5 border-b border-dashed border-slate-200 text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Authorized Kendra:</span>
            <span className="font-semibold text-slate-800 text-right">{retailer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Merchant Code:</span>
            <span className="font-mono text-slate-700">{retailerCode}</span>
          </div>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt No:</span>
            <span className="font-mono font-bold text-slate-900 receipt-mono-field">
              {receipt.receiptNumber || `REC-${txId.slice(-8)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Transaction Ref:</span>
            <span className="font-mono text-slate-800 receipt-mono-field">{txId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Bank RRN / UTR:</span>
            <span className="font-mono font-bold text-slate-900 receipt-mono-field">{rrn}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Service / Biller:</span>
            <span className="font-semibold text-slate-800 text-right">{service}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Customer Ref:</span>
            <span className="font-mono text-slate-800 receipt-mono-field">{maskedCustomer}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Date &amp; Time:</span>
            <span className="text-slate-800 text-right">{dateStr}</span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-500">Status:</span>
            <span
              className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                statusText === "SUCCESS" || statusText === "COMPLETED"
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              <CheckCircle2 size={12} /> {statusText}
            </span>
          </div>
        </div>

        {/* Statutory Financial Breakdown */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Bill / Principal Amount:</span>
            <span className="font-mono font-semibold">{formatINR(baseAmt)}</span>
          </div>

          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>Statutory Tempered Fee:</span>
            <span className="font-mono">{formatINR(fee)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total Customer Debit:</span>
            <span className="text-base text-emerald-800 font-mono receipt-mono-field">
              {formatINR(totalAmt)}
            </span>
          </div>
        </div>

        {/* Note 1 Whitelabel Compliance & Support Footer */}
        <div className="mt-3 pt-2 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
            {receipt.neutralWatermark || "BUYMECART_IBNK_NEUTRAL_RECEIPT_V1"}
          </p>
          <p className="leading-tight">
            Generated by Authorized Business Correspondent &middot; RBI PSS Act Compliant
          </p>
          <p className="text-[9px] text-slate-400">
            Helpline: {receipt.supportPhone || "+91 1800 200 4265"} &middot; {receipt.supportEmail || "support@buymecart.org"}
          </p>
        </div>
      </div>

      {/* Printer Configuration Notice (Screen Only) */}
      <div className="no-print mt-3 text-center text-[11px] text-slate-500 max-w-sm">
        <p className="flex items-center justify-center gap-1">
          <Info size={12} className="text-slate-400 shrink-0" />
          <span>Printer paper settings (A4 / 80mm / 58mm) are controlled via your browser or thermal printer driver dialog.</span>
        </p>
      </div>
    </div>
  );
}
