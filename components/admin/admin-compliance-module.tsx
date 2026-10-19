"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
  Video,
  XCircle,
} from "lucide-react";
import { mockKycCases, mockMerchants } from "@/lib/mock-data";
import { KYCCase } from "@/lib/types";

interface AdminComplianceModuleProps {
  initialTab?: string;
}

export function AdminComplianceModule({ initialTab = "pending-onboarding" }: AdminComplianceModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [kycCases, setKycCases] = useState<KYCCase[]>(mockKycCases);
  const [inspectingKyc, setInspectingKyc] = useState<KYCCase | null>(null);
  const [approvedCaseIds, setApprovedCaseIds] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedCaseIds([...approvedCaseIds, id]);
    setKycCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Approved" } : c))
    );
  };

  const handleReject = (id: string) => {
    setKycCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Rejected" } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 5 Module 1
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Compliance & KYC Operations
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Compliance & KYC Clearance</h1>
          <p className="text-xs text-slate-500">
            Adjudicate 12-point KYC submissions, 30-sec video KYC, merchant payout clearances, and AEPS bank terminal states.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "pending-onboarding", label: "Pending Onboarding" },
            { id: "pending-accounts", label: "Pending Accounts" },
            { id: "kyc-list", label: "KYC List" },
            { id: "account-list", label: "Account List" },
            { id: "auth-products", label: "Authorize Products" },
            { id: "payout-merchants", label: "Payout Merchants" },
            { id: "pa-merchants", label: "PA Merchants" },
            { id: "upload-account", label: "Upload Account" },
            { id: "upload-docs", label: "Upload Docs" },
            { id: "location", label: "Modify Location" },
            { id: "aeps-status", label: "AEPS Status" },
            { id: "activity", label: "Daily Activation" },
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

      {/* 1. PENDING ONBOARDING TAB (From AD Flow in Page 2) */}
      {activeTab === "pending-onboarding" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">
              Pending Onboarding Approvals (Submitted by Area Distributors)
            </h2>
            <p className="text-xs text-slate-500">
              Per Page 2: AD initiates onboarding and sends request for approval to Admin Portal through their AD account.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {kycCases.filter((c) => c.status === "Pending Compliance" && !approvedCaseIds.includes(c.id)).length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-bold text-slate-700">No pending onboardings awaiting approval</p>
              </div>
            ) : (
              kycCases
                .filter((c) => c.status === "Pending Compliance" && !approvedCaseIds.includes(c.id))
                .map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy">{caseItem.id}</span>
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
                          {caseItem.submittedByAD}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-800">{caseItem.applicantName}</h3>
                      <p className="text-xs text-slate-500">
                        RMN: {caseItem.rmn} · Shop: {caseItem.shopAddress}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                          30s vKYC: {caseItem.videoKycStatus} ({caseItem.videoKycDurationSec}s)
                        </span>
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                          Udyam: {caseItem.msmeUdyamNumber}
                        </span>
                        <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                          Bank A/C: {caseItem.bankAccountNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectingKyc(caseItem)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={14} /> Inspect 12-Pt KYC
                      </button>
                      <button
                        onClick={() => handleReject(caseItem.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(caseItem.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={14} /> Approve & Activate
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 2. KYC LIST TAB (Full Dossiers) */}
      {activeTab === "kyc-list" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Authoritative KYC Dossier Directory</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {kycCases.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-slate-800">{c.applicantName} ({c.id})</p>
                  <p className="text-xs text-slate-500">Submitted by {c.submittedByAD} on {c.submissionDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    c.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {c.status}
                  </span>
                  <button
                    onClick={() => setInspectingKyc(c)}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    View Checklist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUTHORIZE MERCHANT PRODUCTS (Page 5 Submenu) */}
      {activeTab === "auth-products" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Authorize Merchant Products (Rail Enablement)</h2>
          <p className="text-xs text-slate-500">Grant or revoke specific transaction modes for compliant merchants.</p>
          <div className="mt-4 space-y-3">
            {mockMerchants.slice(0, 3).map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-navy">{m.shopName}</p>
                  <span className="text-xs font-semibold text-slate-500">{m.agentRole}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {["UPI Collect (Enabled)", "AEPS Cash Withdrawal (Enabled)", "DMT Remittance (Enabled)", "BBPS Utility (Enabled)", "Credit Card Checkout (Pending)"].map((r) => (
                    <span key={r} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AEPS ONBOARDING SYSTEM STATUS (Page 5 Submenu) */}
      {activeTab === "aeps-status" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">AEPS Onboarding System Status (NPCI & UIDAI)</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3 bg-emerald-50 text-emerald-800">
              <p className="font-bold">NPCI Bank Switch Link</p>
              <p className="text-xs mt-1">Operational (99.98% Latency &lt; 210ms)</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-emerald-50 text-emerald-800">
              <p className="font-bold">UIDAI Auth Server</p>
              <p className="text-xs mt-1">Operational (Biometric token active)</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-sky-50 text-sky-800">
              <p className="font-bold">Terminal ID (BC) Quota</p>
              <p className="text-xs mt-1">1,420 Active Registered Terminals</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. DAILY ACTIVATION TELEMETRY (Page 5 Submenu) */}
      {activeTab === "activity" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Merchant Activity & Daily Activation (Page 5)</h2>
          <p className="text-xs text-slate-500">Tracks first transaction milestone post onboarding approval.</p>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b py-2">
              <span>Sharma Digital (Jaipur)</span>
              <span className="font-bold text-emerald-600">Activated · 14 Transactions today</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span>Khan Enterprise (Lucknow)</span>
              <span className="font-bold text-emerald-600">Activated · 8 Transactions today</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Nisha Stores (Bhopal)</span>
              <span className="font-bold text-amber-600">Awaiting First Transaction</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected 12-Pt KYC Inspection Modal */}
      {inspectingKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-navy">
                12-Point KYC Verification Dossier: {inspectingKyc.id}
              </h3>
              <button
                onClick={() => setInspectingKyc(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">1. Applicant Legal Name</p>
                <p className="font-bold text-slate-800">{inspectingKyc.applicantName}</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">2. Shop / Store Address</p>
                <p className="font-bold text-slate-800">{inspectingKyc.shopAddress}</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">3. Aadhaar & PAN</p>
                <p className="font-bold text-slate-800">{inspectingKyc.aadhaarNumber} / {inspectingKyc.panNumber}</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">4. MSME / Udyam</p>
                <p className="font-bold text-slate-800">{inspectingKyc.msmeUdyamNumber}</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">5 & 6. Mobile & Email OTP</p>
                <p className="font-bold text-emerald-600">Both Dual-OTP Verified ✓</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">7. Bank Account & IFSC</p>
                <p className="font-bold text-slate-800">{inspectingKyc.bankAccountNumber} ({inspectingKyc.ifscCode})</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">8. 30-Sec Video KYC (vKYC)</p>
                <p className="font-bold text-emerald-600">Recorded ({inspectingKyc.videoKycDurationSec}s) · Verified ✓</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">9 & 10. Selfies</p>
                <p className="font-bold text-slate-800">Merchant + Field Staff Co-Selfie Attached</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">11. Storefront Photo</p>
                <p className="font-bold text-slate-800">GPS Geo-Tagged Signboard Photo Verified</p>
              </div>
              <div className="rounded bg-slate-50 p-2.5">
                <p className="text-slate-400">12. Signature & Thumb</p>
                <p className="font-bold text-emerald-600">Biometric Template Captured ✓</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                onClick={() => setInspectingKyc(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(inspectingKyc.id);
                  setInspectingKyc(null);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Sign Off & Approve Merchant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
