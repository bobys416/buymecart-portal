"use client";

import React, { useEffect, useState } from "react";
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
  KeyRound,
  Layers,
  Lock,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TrendingUp,
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
} from "@/lib/mock-data";
import { getStoredSession, PRESET_USERS, UserSession } from "@/lib/auth";

interface AreaDistributorViewProps {
  section?: string;
  tab?: string;
}

export function AreaDistributorView({
  section = "dashboard",
  tab,
}: AreaDistributorViewProps) {
  const resolveTab = (sec?: string, tb?: string) => {
    if (tb) return tb;
    if (sec && sec !== "dashboard") return sec;
    return "overview";
  };

  const [session, setSession] = useState<UserSession>(() =>
    getStoredSession("area-distributor") || PRESET_USERS["ad-bhopal"]
  );
  const [activeTab, setActiveTab] = useState<string>(() => resolveTab(section, tab));

  useEffect(() => {
    const s = getStoredSession("area-distributor");
    if (s) setSession(s);
  }, []);

  useEffect(() => {
    setActiveTab(resolveTab(section, tab));
  }, [section, tab]);

  // Retailer Onboarding Form State
  const [onboardForm, setOnboardForm] = useState({
    applicantName: "",
    rmn: "",
    shopName: "",
    shopAddress: "",
    geoCoords: "28.6139° N, 77.2090° E (Territory Zone)",
    vkycDone: false,
  });
  const [onboardSubmitted, setOnboardSubmitted] = useState(false);

  // Hardware Kits State
  const [kits, setKits] = useState(
    mockKitHandovers.length > 0
      ? mockKitHandovers
      : [
          {
            retailerId: "RET-ZONE-01",
            retailerName: "Sharma Digital Services",
            rmn: "9826012345",
            kitNumber: "KIT-2026-9021",
            handoverStatus: "Delivered" as const,
            qrCodeIssued: true,
            microAtmIssued: true,
            biometricScannerIssued: true,
            handoverDate: "2026-01-15",
          },
          {
            retailerId: "RET-ZONE-02",
            retailerName: "Metro Kirana Mart",
            rmn: "9826054321",
            kitNumber: "KIT-2026-9022",
            handoverStatus: "In Transit" as const,
            qrCodeIssued: true,
            microAtmIssued: false,
            biometricScannerIssued: true,
            handoverDate: "2026-01-20",
          },
          {
            retailerId: "RET-ZONE-03",
            retailerName: "Nisha Telecom & Payments",
            rmn: "9826098765",
            kitNumber: "KIT-2026-9023",
            handoverStatus: "Pending Dispatch" as const,
            qrCodeIssued: true,
            microAtmIssued: false,
            biometricScannerIssued: false,
            handoverDate: "Pending",
          },
        ]
  );

  // Retailer Network Search
  const [networkSearch, setNetworkSearch] = useState("");

  // Payment Query Escalation
  const [paymentQueryText, setPaymentQueryText] = useState("");
  const [queryEscalated, setQueryEscalated] = useState(false);

  // vKYC Simulation
  const [vkycRecording, setVkycRecording] = useState(false);
  const [vkycCompleted, setVkycCompleted] = useState(false);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardSubmitted(true);
    setTimeout(() => {
      setOnboardSubmitted(false);
      setOnboardForm({
        applicantName: "",
        rmn: "",
        shopName: "",
        shopAddress: "",
        geoCoords: "28.6139° N, 77.2090° E (Territory Zone)",
        vkycDone: false,
      });
    }, 4000);
  };

  const handleStartVkyc = () => {
    setVkycRecording(true);
    setTimeout(() => {
      setVkycRecording(false);
      setVkycCompleted(true);
      setOnboardForm((prev) => ({ ...prev, vkycDone: true }));
    }, 3000);
  };

  const handleEscalateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentQueryText.trim()) return;
    setQueryEscalated(true);
    setTimeout(() => {
      setQueryEscalated(false);
      setPaymentQueryText("");
    }, 3000);
  };

  const handleKitHandoverUpdate = (kitNum: string) => {
    setKits(
      kits.map((k) =>
        k.kitNumber === kitNum
          ? {
              ...k,
              handoverStatus: "Delivered",
              microAtmIssued: true,
              biometricScannerIssued: true,
            }
          : k
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#101C32] px-2.5 py-0.5 text-xs font-bold text-[#16B8A6]">
                AREA DISTRIBUTOR PORTAL
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Tier 3: AD ({session.orgScope})
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101C32]">
              Area Distributor Workspace
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">
              Onboard local storefronts, collect 12-point KYC & 30-second vKYC, handover serialized hardware kits, and support retailers in {session.territory || "Assigned Territory (Zone-01)"}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("onboarding")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16B8A6] px-4 py-2.5 text-xs font-bold text-[#101C32] shadow-sm hover:bg-[#14a090] transition"
            >
              <UserPlus size={16} /> Onboard Retailer
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E2E8F0] pt-4">
          {[
            { id: "overview", label: "AD Dashboard", icon: TrendingUp },
            { id: "onboarding", label: "Retailer Onboarding", icon: UserPlus },
            { id: "kyc-flow", label: "Process KYC & vKYC", icon: Video },
            { id: "kits", label: "Retailer Kit Handovers", icon: PackageCheck },
            { id: "network", label: "Retailer Network", icon: Building2 },
            { id: "queries", label: "Payment Queries", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#101C32] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#16B8A6]" : "text-[#64748B]"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: AD DASHBOARD                                            */}
      {/* ============================================================== */}
      {(activeTab === "overview" || activeTab === "dashboard") && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                My Retailer Network
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">7 Retailers</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Scoped to {session.orgScope}</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Today's Territory Volume
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">{formatINR(84200)}</p>
              <p className="mt-1 text-xs text-[#64748B]">{session.territory || "Zone-01 Territory"}</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                AD Margin Earned
              </span>
              <p className="mt-2 text-2xl font-black text-emerald-700">{formatINR(1240)}</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Credit to AD float</p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Kit Handover Status
              </span>
              <p className="mt-2 text-2xl font-black text-[#101C32]">2/3 Delivered</p>
              <p className="mt-1 text-xs text-[#64748B]">1 Kit Pending Dispatch</p>
            </div>
          </div>

          {/* Downstream Retailers Table Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-[#101C32] text-sm">
                  Downstream Retailers (Assigned Territory)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Area Distributor {session.name} has access strictly to registered storefronts within assigned territory.
                </p>
              </div>
              <span className="rounded bg-[#F5F7FA] px-2 py-1 text-xs font-mono font-bold text-[#64748B] border border-[#E2E8F0]">
                Scope: {session.orgScope}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] text-[#64748B] uppercase font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Storefront</th>
                    <th className="py-3 px-4">Proprietor & Mobile</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Hardware Kit</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {[
                    { id: "RET-01", name: "Sharma Digital Services", owner: "Rajesh Sharma", rmn: "9826012345", cat: "Recharge & DMT", kit: "Delivered ✓", status: "Active" },
                    { id: "RET-02", name: "Metro Kirana & General", owner: "Vinod Meena", rmn: "9826054321", cat: "Grocery & BBPS", kit: "In Transit", status: "Active" },
                    { id: "RET-03", name: "Nisha Telecom Center", owner: "Nisha Patel", rmn: "9826098765", cat: "AEPS Cash Point", kit: "Pending", status: "Active" },
                  ].map((r) => (
                    <tr key={r.id} className="hover:bg-[#F5F7FA]">
                      <td className="py-3 px-4 font-bold text-[#101C32]">{r.name}</td>
                      <td className="py-3 px-4">
                        <p className="text-[#101C32]">{r.owner}</p>
                        <p className="text-[10px] text-[#64748B] font-mono">{r.rmn}</p>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{r.cat}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            r.kit.includes("Delivered")
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.kit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {r.status}
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

      {/* ============================================================== */}
      {/* TAB 2: RETAILER ONBOARDING                                     */}
      {/* ============================================================== */}
      {activeTab === "onboarding" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm max-w-2xl">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-sm font-bold text-[#101C32]">Onboard Retailer Storefront</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Initiate onboarding for a local storefront merchant in {session.territory || "Assigned Territory"}.
            </p>
          </div>

          {onboardSubmitted && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              ✓ Retailer onboarding dossier initiated and sent for 12-point KYC collection.
            </div>
          )}

          <form onSubmit={handleOnboardSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Merchant / Proprietor Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={onboardForm.applicantName}
                onChange={(e) => setOnboardForm({ ...onboardForm, applicantName: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Registered Mobile Number (RMN)
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit primary mobile"
                value={onboardForm.rmn}
                onChange={(e) => setOnboardForm({ ...onboardForm, rmn: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Storefront / Business Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kumar Digital & Remittance Center"
                value={onboardForm.shopName}
                onChange={(e) => setOnboardForm({ ...onboardForm, shopName: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Shop Address & Ward
              </label>
              <textarea
                rows={2}
                required
                placeholder="Complete street address within territory..."
                value={onboardForm.shopAddress}
                onChange={(e) => setOnboardForm({ ...onboardForm, shopAddress: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-2.5 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Geo-Location Coordinates
              </label>
              <input
                type="text"
                readOnly
                value={onboardForm.geoCoords}
                className="w-full rounded-xl border border-[#E2E8F0] bg-slate-100 px-3 py-2 text-xs text-[#64748B] font-mono outline-none cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#101C32] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
            >
              Submit Retailer Onboarding Record
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: KYC & VIDEO KYC                                         */}
      {/* ============================================================== */}
      {activeTab === "kyc-flow" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 12-Pt KYC Checklist */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#101C32]">12-Point KYC Checklist</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verify documents before dispatching physical hardware kits.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              {[
                { label: "1. Mobile OTP Authenticated", verified: true },
                { label: "2. Email OTP Verified", verified: true },
                { label: "3. Aadhaar Verification via UIDAI Offline XML", verified: true },
                { label: "4. PAN NSDL Real-Time Name Matching", verified: true },
                { label: "5. MSME Udyam Registration (Optional)", verified: false },
                { label: "6. Bank Account Penny-Drop Verification", verified: true },
                { label: "7. Cancelled Cheque / Passbook Image", verified: true },
                { label: "8. Geo-Tagged Merchant Storefront Photograph", verified: true },
                { label: "9. Employee / Agent Verification Selfie", verified: true },
                { label: "10. Merchant Physical Signature Capture", verified: true },
                { label: "11. Biometric Fingerprint Template", verified: true },
                { label: "12. 30-Second Live vKYC Recording", verified: vkycCompleted },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-2.5"
                >
                  <span className="text-[#101C32] font-medium">{item.label}</span>
                  {item.verified ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 text-[11px]">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 30s vKYC Recorder Simulator */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#101C32]">30-Second Live vKYC Recorder</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Applicant must recite their full name, business address, and dynamic OTP to the camera.
            </p>

            <div className="mt-4 rounded-xl border border-dashed border-[#16B8A6] bg-[#F5F7FA] p-6 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#101C32] text-[#16B8A6]">
                <Video size={24} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#101C32]">
                  Recite Prompt: "I am Rajesh Sharma, Sharma Digital Store"
                </p>
                <p className="text-[11px] font-mono text-[#64748B] mt-1">
                  Dynamic Verification Code: <strong className="text-[#16B8A6]">492-019</strong>
                </p>
              </div>

              {vkycRecording ? (
                <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Recording in progress (30s live stream)...</span>
                </div>
              ) : vkycCompleted ? (
                <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} /> vKYC Video Captured & Hash Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartVkyc}
                  className="rounded-xl bg-[#16B8A6] px-5 py-2 text-xs font-bold text-[#101C32] hover:bg-[#14a090] transition shadow-xs"
                >
                  Start 30s Recording Test
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: RETAILER KIT HANDOVERS                                  */}
      {/* ============================================================== */}
      {activeTab === "kits" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-sm font-bold text-[#101C32]">Retailer Hardware Kit Handover</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Track serialized kit deployment (QR Standee, MicroATM, Biometric Scanner).
            </p>
          </div>

          <div className="mt-4 divide-y divide-[#E2E8F0]">
            {kits.map((kit) => (
              <div
                key={kit.kitNumber}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#101C32]">{kit.retailerName}</span>
                    <span className="font-mono text-[10px] text-[#64748B]">{kit.kitNumber}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Mobile: {kit.rmn} · Handover Date: {kit.handoverDate}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className={kit.qrCodeIssued ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      • QR Standee
                    </span>
                    <span className={kit.microAtmIssued ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      • MicroATM
                    </span>
                    <span className={kit.biometricScannerIssued ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      • Biometric Scanner
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      kit.handoverStatus === "Delivered"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : kit.handoverStatus === "In Transit"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {kit.handoverStatus}
                  </span>

                  {kit.handoverStatus !== "Delivered" && (
                    <button
                      onClick={() => handleKitHandoverUpdate(kit.kitNumber)}
                      className="rounded-lg bg-[#101C32] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1a2d52] transition"
                    >
                      Confirm Delivery ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: RETAILER NETWORK DIRECTORY                              */}
      {/* ============================================================== */}
      {activeTab === "network" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#101C32]">Retailer Network Directory</h2>
              <p className="text-xs text-[#64748B]">
                Registered merchants strictly under Area Distributor {session.orgScope}.
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-1.5 focus-within:border-[#16B8A6] focus-within:bg-white">
              <Search size={14} className="text-[#64748B]" />
              <input
                type="text"
                placeholder="Search store, owner, mobile..."
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="w-48 bg-transparent text-xs text-[#101C32] outline-none"
              />
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#E2E8F0]">
            {[
              { id: "RET-01", name: "Sharma Digital Services", owner: "Rajesh Sharma", rmn: "9826012345", addr: "Main Bazaar Ward 4", bal: 48500 },
              { id: "RET-02", name: "Metro Kirana Mart", owner: "Vinod Meena", rmn: "9826054321", addr: "Station Road Corner", bal: 62400 },
              { id: "RET-03", name: "Nisha Telecom & Payments", owner: "Nisha Patel", rmn: "9826098765", addr: "Near Bus Terminal", bal: 31200 },
            ]
              .filter((r) => {
                if (!networkSearch) return true;
                const q = networkSearch.toLowerCase();
                return r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.rmn.includes(q);
              })
              .map((r) => (
                <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#101C32]">{r.name}</span>
                      <span className="font-mono text-[10px] text-[#64748B]">({r.id})</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Proprietor: {r.owner} · RMN: {r.rmn} · {r.addr}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#101C32]">{formatINR(r.bal)}</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Active Float</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: PAYMENT & SUPPORT QUERIES                               */}
      {/* ============================================================== */}
      {activeTab === "queries" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm max-w-xl">
          <h2 className="text-sm font-bold text-[#101C32]">Submit Payment / Settlement Query</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Escalate unresolved retailer transaction queries to your Super Distributor ({session.assignedSD || "SD-CENTRAL-01"}).
          </p>

          {queryEscalated && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              ✓ Query submitted to Super Distributor balance query queue.
            </div>
          )}

          <form onSubmit={handleEscalateQuery} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Transaction ID or UTR Reference
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TXN-2026-9021"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-xs text-[#101C32] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                Query Details & Retailer Remarks
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe transaction date, retailer name, and reason for escalation..."
                value={paymentQueryText}
                onChange={(e) => setPaymentQueryText(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-2.5 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#101C32] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
            >
              Submit Query to Super Distributor
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
