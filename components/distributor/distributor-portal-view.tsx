"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import {
  formatINR,
  mockKitHandovers,
  mockKycCases,
  mockMerchants,
  mockPaymentTransactions,
} from "@/lib/mock-data";

interface DistributorPortalViewProps {
  section?: string;
}

export function DistributorPortalView({ section = "dashboard" }: DistributorPortalViewProps) {
  // Role switcher: Super Distributor (SD) vs. Area Distributor (AD)
  const [distributorRole, setDistributorRole] = useState<"sd" | "ad">("ad");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // AD: Onboard Retailer State (Page 2 AD Features 1, 2, 3, 4)
  const [adOnboardForm, setAdOnboardForm] = useState({
    applicantName: "",
    rmn: "",
    shopName: "",
    shopAddress: "",
    geoCoords: "23.2599° N, 77.4126° E (Bhopal)",
    vkycDone: false,
  });
  const [adOnboardSubmitted, setAdOnboardSubmitted] = useState(false);

  // AD: Kit Handover State (Page 2 AD Feature 6)
  const [kits, setKits] = useState(mockKitHandovers);

  // SD: Onboard AD State (Page 2 SD Feature 1)
  const [sdOnboardForm, setSdOnboardForm] = useState({
    adName: "",
    adRmn: "",
    territory: "Indore South",
  });
  const [sdOnboardSuccess, setSdOnboardSuccess] = useState(false);

  // Balance Query State (Page 2 SD Feature 4: Clear all queries related to balance)
  const [balanceQueryResolved, setBalanceQueryResolved] = useState(false);

  // Payment Query Escalation (Page 2 AD Feature 5 & SD Feature 3)
  const [paymentQueryText, setPaymentQueryText] = useState("");
  const [queryEscalated, setQueryEscalated] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Bar with Role Switcher (SD vs AD) */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 shadow-panel md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              PDF Page 1 & 2 Distributor Portal
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Note 5: 1 ID Login Active Lock
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">
            {distributorRole === "sd" ? "Super Distributor (SD) Command View" : "Area Distributor (AD) Workspace"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {distributorRole === "sd"
              ? "Oversee Area Distributors, scale regional network, and clear balance queries."
              : "Initiate merchant onboarding, collect 12-point KYC & 30s vKYC, and handover kits."}
          </p>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white p-1 shadow-sm">
          <span className="px-2 text-xs font-bold text-slate-500">Active Role:</span>
          <button
            onClick={() => {
              setDistributorRole("ad");
              setActiveTab("overview");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              distributorRole === "ad" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-navy"
            }`}
          >
            Area Distributor (AD)
          </button>
          <button
            onClick={() => {
              setDistributorRole("sd");
              setActiveTab("overview");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              distributorRole === "sd" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-navy"
            }`}
          >
            Super Distributor (SD)
          </button>
        </div>
      </div>

      {/* Role-Specific Secondary Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {distributorRole === "ad" ? (
          <>
            {[
              { id: "overview", label: "AD Dashboard" },
              { id: "onboard-retailer", label: "1. Onboard Retailer (Initiate)" },
              { id: "kyc-flow", label: "3. Process KYC & 30s vKYC" },
              { id: "kits", label: "6. Handover Kit to Retailers" },
              { id: "requests", label: "Payment Requests & Checks" },
              { id: "query", label: "5. Payment Queries (To SD/Admin)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.id ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </>
        ) : (
          <>
            {[
              { id: "overview", label: "SD Dashboard" },
              { id: "ad-network", label: "1. Onboard & Verify ADs" },
              { id: "retailers-scope", label: "Subordinate Retailers" },
              { id: "balance-queries", label: "4. Clear Balance Queries" },
              { id: "escalations", label: "3. Escalate Queries to Admin" },
              { id: "commercials", label: "Commission & Statements" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.id ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* AREA DISTRIBUTOR (AD) SCREENS                                  */}
      {/* ============================================================== */}

      {distributorRole === "ad" && activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">My Retailer Network</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">7 Retailers</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">6 Active · 1 Pending KYC</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Today's Territory Volume</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(84200)}</p>
              <p className="text-xs text-slate-400 mt-1">Across 18 transactions</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">AD Margin Earned</span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">{formatINR(1240)}</p>
              <p className="text-xs text-slate-400 mt-1">Credit to AD balance</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Kit Handover Status</span>
              <p className="mt-2 text-2xl font-extrabold text-sky-700">6/7 Delivered</p>
              <p className="text-xs text-slate-400 mt-1">1 Kit Pending Dispatch</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
            <h3 className="font-bold text-navy">Assigned Downstream Retailers (Scoped to AD-MP-02)</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {mockMerchants.filter((m) => m.agentRole === "Retailer").map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-slate-800">{m.shopName}</p>
                    <p className="text-xs text-slate-500">{m.agentName} · RMN: {m.rmn} · {m.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-navy text-xs">{formatINR(m.balance)}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AD Feature 1 & 2: Onboard Retailer & Send for Approval */}
      {distributorRole === "ad" && activeTab === "onboard-retailer" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 AD Feature (1) & (2)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Onboard Retailer / Merchant & Send Request for Approval to Admin Portal
            </h2>
            <p className="text-xs text-slate-500">
              Through their Area Distributor Account, AD initiates registration and submits directly to Admin CRM.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAdOnboardSubmitted(true);
            }}
            className="mt-5 max-w-xl space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Applicant Full Name *</label>
              <input
                type="text"
                required
                placeholder="Name as per Aadhaar"
                value={adOnboardForm.applicantName}
                onChange={(e) => setAdOnboardForm({ ...adOnboardForm, applicantName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Mobile Number (RMN) *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={adOnboardForm.rmn}
                  onChange={(e) => setAdOnboardForm({ ...adOnboardForm, rmn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Shop / Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Storefront name"
                  value={adOnboardForm.shopName}
                  onChange={(e) => setAdOnboardForm({ ...adOnboardForm, shopName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">
                Geographical Location (Page 2 AD Feature 4)
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs">
                <MapPin size={16} className="text-sky-600" />
                <span className="font-semibold text-slate-700">{adOnboardForm.geoCoords}</span>
                <span className="ml-auto text-[11px] font-bold text-emerald-600">GPS Locked ✓</span>
              </div>
            </div>

            {adOnboardSubmitted && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Request for Approval of Merchant sent to Admin Portal via Area Distributor Account!
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Submit to Admin Portal for Approval
            </button>
          </form>
        </div>
      )}

      {/* AD Feature 6: Handover Kit to Retailers */}
      {distributorRole === "ad" && activeTab === "kits" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 AD Feature (6)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">Handover Kit to Retailers Tracker</h2>
            <p className="text-xs text-slate-500">
              Issue and record QR codes, micro-ATMs, and biometric scanners to authorized retailers.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Retailer / Store</th>
                  <th className="px-5 py-3">Kit Serial Number</th>
                  <th className="px-5 py-3">QR Code</th>
                  <th className="px-5 py-3">Micro-ATM</th>
                  <th className="px-5 py-3">Biometric Device</th>
                  <th className="px-5 py-3">Handover Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kits.map((k) => (
                  <tr key={k.retailerId} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{k.retailerName}</p>
                      <p className="text-xs text-slate-400">{k.rmn}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">{k.kitNumber}</td>
                    <td className="px-5 py-3.5 text-xs">{k.qrCodeIssued ? "Issued ✓" : "Pending"}</td>
                    <td className="px-5 py-3.5 text-xs">{k.microAtmIssued ? "Issued ✓" : "None"}</td>
                    <td className="px-5 py-3.5 text-xs">{k.biometricScannerIssued ? "Issued ✓" : "None"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          k.handoverStatus === "Delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {k.handoverStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AD Feature 5: Request for Payments related Queries to SD & Admin */}
      {distributorRole === "ad" && activeTab === "query" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 AD Feature (5)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Request for Payment Related Queries to Super Distributor (& Admin)
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQueryEscalated(true);
            }}
            className="mt-5 max-w-lg space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Escalate Query To</label>
              <select className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs">
                <option>Super Distributor: SD-CENTRAL-01 (Arun Singh)</option>
                <option>Direct to Main Admin CRM Helpdesk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Query Details</label>
              <textarea
                rows={3}
                required
                placeholder="Explain the payment / balance issue..."
                value={paymentQueryText}
                onChange={(e) => setPaymentQueryText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              />
            </div>

            {queryEscalated && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Query escalated to Super Distributor and Admin for clearance.
              </div>
            )}

            <button type="submit" className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white">
              Dispatch Escalation Query
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUPER DISTRIBUTOR (SD) SCREENS                                 */}
      {/* ============================================================== */}

      {distributorRole === "sd" && activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Assigned Area Distributors</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">3 ADs</p>
              <p className="text-xs text-slate-400 mt-1">Bhopal, Indore, Ujjain</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Total Downstream Retailers</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">19 Retailers</p>
              <p className="text-xs text-slate-400 mt-1">Across 3 regional circles</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">SD Network Volume</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(3120000)}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">+12.8% this week</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Pending Balance Queries</span>
              <p className="mt-2 text-2xl font-extrabold text-amber-700">1 Item</p>
              <p className="text-xs text-slate-400 mt-1">Needs SD clearance</p>
            </div>
          </div>
        </div>
      )}

      {/* SD Feature 4: Clear all Queries Related to Balance for AD & Retailers */}
      {distributorRole === "sd" && activeTab === "balance-queries" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 SD Feature (4)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Clear All Queries Related to Balance for AD & Retailers
            </h2>
            <p className="text-xs text-slate-500">
              Resolve subordinate wallet disputes, unblock liquidity, and authorize channel ledger adjustments.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-navy">AD-MP-02 (Sunil Verma) — Liquidity Top-up Query</p>
                  <p className="text-xs text-slate-500">
                    Retailer Nisha Stores processed ₹6,200 DMT remittance; pending bank confirmation.
                  </p>
                </div>
                <button
                  onClick={() => setBalanceQueryResolved(true)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition ${
                    balanceQueryResolved ? "bg-emerald-600" : "bg-navy hover:bg-slate-800"
                  }`}
                >
                  {balanceQueryResolved ? "Balance Cleared ✓" : "Clear Balance Query"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
