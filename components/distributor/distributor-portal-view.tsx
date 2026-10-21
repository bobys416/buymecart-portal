"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  LogOut,
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
  X,
  Zap,
} from "lucide-react";
import {
  formatINR,
  mockKitHandovers,
  mockKycCases,
  mockMerchants,
  mockPaymentTransactions,
} from "@/lib/mock-data";
import { getStoredSession, hasPermission, PRESET_USERS, UserSession } from "@/lib/auth";

interface DistributorPortalViewProps {
  section?: string;
  tab?: string;
}

export function DistributorPortalView({ section = "dashboard", tab }: DistributorPortalViewProps) {
  const resolveTab = (sec?: string, tb?: string) => {
    if (tb) return tb;
    if (sec && sec !== "dashboard") return sec;
    return "overview";
  };

  // Session strictly retrieved from server/client auth storage
  const [session, setSession] = useState<UserSession>(() => getStoredSession("distributor") || PRESET_USERS["ad-bhopal"]);
  const [activeTab, setActiveTab] = useState<string>(() => resolveTab(section, tab));

  useEffect(() => {
    const s = getStoredSession("distributor");
    if (s) setSession(s);
  }, []);

  useEffect(() => {
    setActiveTab(resolveTab(section, tab));
  }, [section, tab]);

  const isSD = session?.role === "sd";
  const isAD = session?.role === "ad";

  // AD: Onboard Retailer State (Page 2 AD Features 1, 2, 4)
  const [adOnboardForm, setAdOnboardForm] = useState({
    applicantName: "",
    rmn: "",
    shopName: "",
    shopAddress: "",
    geoCoords: "28.6139° N, 77.2090° E (Territory Zone)",
    vkycDone: false,
  });
  const [adOnboardSubmitted, setAdOnboardSubmitted] = useState(false);

  // AD: Kit Handover State (Page 2 AD Feature 6)
  const [kits, setKits] = useState(mockKitHandovers);

  // SD: Onboard AD State (Page 2 SD Feature 1)
  const [sdOnboardForm, setSdOnboardForm] = useState({
    adName: "",
    adRmn: "",
    territory: "Indore South (MP-03)",
  });
  const [sdOnboardSuccess, setSdOnboardSuccess] = useState(false);

  // Balance Query State (Page 2 SD Feature 4: Clear all queries related to balance)
  const [balanceQueryResolved, setBalanceQueryResolved] = useState(false);

  // Payment Query Escalation (Page 2 AD Feature 5 & SD Feature 3)
  const [paymentQueryText, setPaymentQueryText] = useState("");
  const [queryEscalated, setQueryEscalated] = useState(false);

  // Search filter states across distributor workspaces
  const searchParams = useSearchParams();
  const qParam = searchParams?.get?.("q") || "";
  const [networkSearch, setNetworkSearch] = useState(qParam);
  const [kitSearch, setKitSearch] = useState("");
  const [adSearch, setAdSearch] = useState("");
  const [downlineSearch, setDownlineSearch] = useState("");
  const [balanceSearch, setBalanceSearch] = useState("");

  useEffect(() => {
    if (qParam) setNetworkSearch(qParam);
  }, [qParam]);

  // Territory data scoping:
  // AD Sunil Verma is strictly scoped to Assigned Territory (Zone-01).
  // SD Arun Singh oversees all Central Region territories.
  const visibleRetailers = mockMerchants.filter((m) => {
    if (m.agentRole !== "Retailer") return false;
    if (isAD && m.assignedAD && m.assignedAD !== session.orgScope) {
      return false;
    }
    if (networkSearch) {
      const q = networkSearch.toLowerCase();
      return (
        m.shopName.toLowerCase().includes(q) ||
        m.agentName.toLowerCase().includes(q) ||
        m.rmn.includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    return true; // SD sees all subordinate retailers
  });

  // Check if current requested section requires SD privileges
  const sdOnlySections = ["ad-network", "balance-queries", "escalations", "commercials", "retailers"];
  const isForbiddenForAD = isAD && sdOnlySections.includes(activeTab);

  if (isForbiddenForAD) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-300 bg-red-50/70 p-8 shadow-panel">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-600 text-white shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div>
              <span className="rounded bg-red-200 px-2.5 py-0.5 text-xs font-black uppercase text-red-900 tracking-wider">
                HTTP 403 Forbidden · Organizational Scope Violation
              </span>
              <h2 className="mt-2 text-xl font-black text-red-950">
                Access Denied: Super Distributor Privileges Required
              </h2>
              <p className="mt-2 text-xs text-red-900 leading-relaxed max-w-2xl">
                Under Buymecart Governance Rules and Note 5 Security Architecture, Area Distributors (AD) are strictly prohibited from accessing Super Distributor (SD) operational oversight, cross-territory network management, and balance clearance controls.
              </p>

              <div className="mt-4 rounded-xl border border-red-200 bg-white p-4 max-w-xl text-xs space-y-1.5">
                <p className="font-bold text-slate-800">Active Identity Verification Context:</p>
                <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
                  <p>User: <strong className="text-navy">{session.name}</strong> ({session.email})</p>
                  <p>Enforced Role: <span className="font-bold text-amber-700">Area Distributor (AD)</span></p>
                  <p>Assigned Territory Scope: <strong className="text-slate-800">{session.territory || "Assigned Territory (Zone-01)"}</strong></p>
                  <p>Attempted Section: <code className="text-red-700 bg-red-50 px-1 rounded">{activeTab}</code></p>
                  <p>Required Permission: <code className="text-red-700 bg-red-50 px-1 rounded">distributor:sd</code></p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("overview")}
                  className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  ← Return to My Authorized AD Workspace
                </button>
                <Link
                  href="/distributor/login"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Sign In with Super Distributor Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner displaying Server-Verified Identity (NO BROWSER ROLE TOGGLE) */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 shadow-panel md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              PDF Page 1 & 2 Distributor Portal
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Verified Session: {session.name} ({isSD ? "Super Distributor" : "Area Distributor"})
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Note 5: 1 ID Active Lock
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">
            {isSD ? "Super Distributor (SD) Command View" : "Area Distributor (AD) Workspace"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {isSD
              ? `Supervising Central Region ADs, scaling subordinate retailer network, and clearing balance queries.`
              : `Assigned Territory: ${session.territory || "Assigned Territory (Zone-01)"}. Onboard retailers, collect 12-point KYC & 30s vKYC, and handover kits.`}
          </p>
        </div>

        {/* Identity & Scope Status Pill (Read-Only Server Identity) */}
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white px-3.5 py-2 shadow-sm text-xs">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Authenticated Scope</span>
            <span className="font-extrabold text-navy">{session.orgScope}</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-200" />
          <Link
            href="/distributor/login"
            className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-200 transition"
            title="Switch between SD and AD accounts via dedicated authentication entry point"
          >
            <KeyRound size={13} /> Switch Account
          </Link>
        </div>
      </div>

      {/* Role-Specific Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {isAD ? (
          <>
            {[
              { id: "overview", label: "AD Dashboard" },
              { id: "onboarding", label: "1. Onboard Retailer (AD)" },
              { id: "kyc-flow", label: "3. Process KYC & 30s vKYC" },
              { id: "kits", label: "6. Handover Kit to Retailers" },
              { id: "network", label: "Retailer Network" },
              { id: "queries", label: "5. Payment Queries (To SD/Admin)" },
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
              { id: "retailers", label: "Subordinate Retailers" },
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

      {isAD && (activeTab === "overview" || activeTab === "dashboard") && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">My Retailer Network</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">{visibleRetailers.length} Retailers</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Scoped to {session.orgScope || "AD-ZONE-01"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Today's Territory Volume</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(84200)}</p>
              <p className="text-xs text-slate-400 mt-1">Assigned Territory (Zone-01)</p>
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-navy">Downstream Retailers (Assigned Territory)</h3>
                <p className="text-xs text-slate-500">
                  Area Distributor Sunil Verma has access only to registered storefronts within assigned territory.
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-600">
                Scope: {session.orgScope || "AD-ZONE-01"}
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {visibleRetailers.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-slate-800">{m.shopName}</p>
                    <p className="text-xs text-slate-500">
                      {m.agentName} · RMN: {m.rmn} · <span className="font-semibold text-navy">{m.city}</span>
                    </p>
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
      {isAD && activeTab === "onboarding" && (
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

      {/* AD Feature 3: Process KYC & 30s vKYC */}
      {isAD && activeTab === "kyc-flow" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 AD Feature (3)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">Collect 12-Point KYC & 30-Second Video Verification</h2>
            <p className="text-xs text-slate-500">
              AD must collect physical documents, capture storefront photo, and conduct 30s live video verification.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-xs uppercase text-slate-700">12 Mandatory Document Items</h4>
              <ul className="mt-2 text-xs space-y-1 text-slate-600">
                <li>1. Aadhaar Card (Front/Back) ✓</li>
                <li>2. PAN Card Verification ✓</li>
                <li>3. Bank Cancelled Cheque / Passbook ✓</li>
                <li>4. Shop Establishment / Trade License ✓</li>
                <li>5. Live GPS Coordinates Captured ✓</li>
                <li>6. Storefront Photo with Signage ✓</li>
                <li>7. Interior Counter Photo ✓</li>
                <li>8. Biometric Fingerprint Sample ✓</li>
              </ul>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase text-indigo-900 flex items-center gap-1.5">
                  <Video size={16} className="text-indigo-600" /> 30-Second Live vKYC Recorder
                </h4>
                <p className="mt-2 text-xs text-slate-600">
                  Applicant must state full name, shop address, and read randomized security OTP into the camera.
                </p>
              </div>
              <div className="mt-4 rounded-lg bg-white p-3 text-center border border-indigo-100">
                <span className="text-xs font-mono font-bold text-indigo-700">Prompt: "I am Rajesh Sharma, Sharma Digital Store"</span>
                <button
                  type="button"
                  className="mt-3 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Start 30s Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AD Feature 6: Handover Kit to Retailers */}
      {isAD && activeTab === "kits" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                Page 2 AD Feature (6)
              </span>
              <h2 className="mt-1 text-base font-bold text-navy">Handover Kit to Retailers Tracker</h2>
              <p className="text-xs text-slate-500">
                Issue and record QR codes, micro-ATMs, and biometric scanners to authorized retailers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Kit #, Store, RMN..."
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                />
                {kitSearch && (
                  <button
                    type="button"
                    onClick={() => setKitSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Kits
              </button>
            </div>
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
                {kits
                  .filter((k) => {
                    if (!kitSearch) return true;
                    const q = kitSearch.toLowerCase();
                    return (
                      k.retailerName.toLowerCase().includes(q) ||
                      k.kitNumber.toLowerCase().includes(q) ||
                      k.rmn.includes(q)
                    );
                  })
                  .map((k) => (
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

      {/* AD Feature: Retailer Network Screen */}
      {isAD && activeTab === "network" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">Retailer Network (Assigned Territory)</h2>
              <p className="text-xs text-slate-500">
                Only retail stores registered under Area Distributor Sunil Verma ({session.orgScope || "AD-ZONE-01"}) are visible.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search store, owner, RMN..."
                  value={networkSearch}
                  onChange={(e) => setNetworkSearch(e.target.value)}
                  className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                />
                {networkSearch && (
                  <button
                    type="button"
                    onClick={() => setNetworkSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Retailers
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {visibleRetailers.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="font-bold text-slate-800">{m.shopName}</p>
                  <p className="text-xs text-slate-500">
                    Proprietor: {m.agentName} · RMN: {m.rmn} · City: {m.city} · Code: {m.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">{formatINR(m.balance)}</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AD Feature 5: Request for Payments related Queries to SD & Admin */}
      {isAD && activeTab === "queries" && (
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

      {isSD && (activeTab === "overview" || activeTab === "dashboard") && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
              <span className="text-xs font-bold uppercase text-slate-500">Assigned Area Distributors</span>
              <p className="mt-2 text-2xl font-extrabold text-navy">3 ADs</p>
              <p className="text-xs text-slate-400 mt-1">Zone 01, Zone 02, Zone 03</p>
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

      {/* SD Feature 1 & 2: Onboard & Verify ADs */}
      {isSD && activeTab === "ad-network" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 SD Feature (1) & (2)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Create, Onboard & Verify Area Distributors (AD)
            </h2>
            <p className="text-xs text-slate-500">
              Super Distributors appoint and verify AD partners across regional territories.
            </p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSdOnboardSuccess(true);
              }}
              className="space-y-3"
            >
              <h3 className="text-xs font-bold uppercase text-slate-700">Appoint New Area Distributor</h3>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">AD Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Mishra"
                  value={sdOnboardForm.adName}
                  onChange={(e) => setSdOnboardForm({ ...sdOnboardForm, adName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">AD Mobile (RMN)</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={sdOnboardForm.adRmn}
                  onChange={(e) => setSdOnboardForm({ ...sdOnboardForm, adRmn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Assigned Territory</label>
                <input
                  type="text"
                  value={sdOnboardForm.territory}
                  onChange={(e) => setSdOnboardForm({ ...sdOnboardForm, territory: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              {sdOnboardSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 size={16} /> New AD appointed and verified in Central SD Network!
                </div>
              )}
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">
                Register & Verify AD
              </button>
            </form>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <h3 className="text-xs font-bold uppercase text-slate-700">Current Assigned ADs</h3>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 focus-within:border-navy">
                    <Search size={13} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search AD name, code, territory..."
                      value={adSearch}
                      onChange={(e) => setAdSearch(e.target.value)}
                      className="w-36 bg-transparent text-xs text-slate-800 outline-none"
                    />
                    {adSearch && (
                      <button
                        type="button"
                        onClick={() => setAdSearch("")}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Clear AD search"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                  >
                    <Search size={11} /> Search ADs
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {[
                  { id: "AD-ZONE-01", name: "Sunil Verma", territory: "Zone-01 Territory · 7 Retailers", status: "Verified ✓" },
                  { id: "AD-ZONE-02", name: "Kavita Jain", territory: "Zone-02 Territory · 8 Retailers", status: "Verified ✓" },
                  { id: "AD-ZONE-03", name: "Praveen Chouhan", territory: "Zone-03 Territory · 4 Retailers", status: "Verified ✓" },
                ]
                  .filter((ad) => {
                    if (!adSearch) return true;
                    const q = adSearch.toLowerCase();
                    return (
                      ad.name.toLowerCase().includes(q) ||
                      ad.id.toLowerCase().includes(q) ||
                      ad.territory.toLowerCase().includes(q)
                    );
                  })
                  .map((ad) => (
                    <div key={ad.id} className="rounded-lg bg-white p-3 border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-navy">{ad.name} ({ad.id})</p>
                        <p className="text-slate-500 text-[11px]">{ad.territory}</p>
                      </div>
                      <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                        {ad.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SD: Subordinate Retailers */}
      {isSD && activeTab === "retailers" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">All Subordinate Retailers (Central Region)</h2>
              <p className="text-xs text-slate-500">
                Aggregated view across all subordinate Area Distributors across regional territory circles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search downline store, proprietor, RMN..."
                  value={downlineSearch}
                  onChange={(e) => setDownlineSearch(e.target.value)}
                  className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                />
                {downlineSearch && (
                  <button
                    type="button"
                    onClick={() => setDownlineSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear downline search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Downline
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {mockMerchants
              .filter((m) => m.agentRole === "Retailer")
              .filter((m) => {
                if (!downlineSearch) return true;
                const q = downlineSearch.toLowerCase();
                return (
                  m.shopName.toLowerCase().includes(q) ||
                  m.agentName.toLowerCase().includes(q) ||
                  m.rmn.includes(q) ||
                  m.city.toLowerCase().includes(q) ||
                  m.id.toLowerCase().includes(q)
                );
              })
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-slate-800">{m.shopName}</p>
                    <p className="text-xs text-slate-500">
                      {m.agentName} · RMN: {m.rmn} · City: {m.city} · Code: {m.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">{formatINR(m.balance)}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SD Feature 4: Clear all Queries Related to Balance for AD & Retailers */}
      {isSD && activeTab === "balance-queries" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search queries, AD, shop..."
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                />
                {balanceSearch && (
                  <button
                    type="button"
                    onClick={() => setBalanceSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear balance search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Queries
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              {
                id: "Q-BAL-1",
                adCode: "AD-MP-02 (Sunil Verma)",
                title: "Liquidity Top-up Query",
                desc: "Retailer Nisha Stores processed ₹6,200 DMT remittance; pending bank confirmation.",
              },
            ]
              .filter((qItem) => {
                if (!balanceSearch) return true;
                const q = balanceSearch.toLowerCase();
                return (
                  qItem.adCode.toLowerCase().includes(q) ||
                  qItem.title.toLowerCase().includes(q) ||
                  qItem.desc.toLowerCase().includes(q)
                );
              })
              .map((qItem) => (
                <div key={qItem.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-navy">{qItem.adCode} — {qItem.title}</p>
                      <p className="text-xs text-slate-500">{qItem.desc}</p>
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
              ))}
          </div>
        </div>
      )}

      {/* SD Feature 3: Escalate Queries to Admin */}
      {isSD && activeTab === "escalations" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
              Page 2 SD Feature (3)
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Escalate Unresolved Queries to Main Admin CRM
            </h2>
            <p className="text-xs text-slate-500">
              Direct escalation channel for Super Distributors to Root Administration for banking reconciliation and technical interventions.
            </p>
          </div>
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs text-slate-700 font-semibold">Open Escalation Tickets to Admin:</p>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-navy">ESC-2026-904 · DMT Node Timeouts (SBI Gateway)</p>
                <p className="text-slate-500 text-[11px]">Submitted by SD Arun Singh · Assigned to Admin Tech Ops</p>
              </div>
              <span className="rounded-full bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[10px]">
                Under Review
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SD: Regional Commercials */}
      {isSD && activeTab === "commercials" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Regional Commercials & Performance</h2>
            <p className="text-xs text-slate-500">
              Commission breakdown across subordinate AD circles under Central Region Super Distributor.
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-500 uppercase">Zone 01 (AD-ZONE-01)</span>
              <p className="mt-2 text-xl font-bold text-navy">{formatINR(84200)} Vol</p>
              <p className="text-emerald-700 font-semibold mt-1">₹421 SD Override</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-500 uppercase">Indore (AD-MP-01)</span>
              <p className="mt-2 text-xl font-bold text-navy">{formatINR(142000)} Vol</p>
              <p className="text-emerald-700 font-semibold mt-1">₹710 SD Override</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-500 uppercase">Ujjain (AD-MP-04)</span>
              <p className="mt-2 text-xl font-bold text-navy">{formatINR(36000)} Vol</p>
              <p className="text-emerald-700 font-semibold mt-1">₹180 SD Override</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
