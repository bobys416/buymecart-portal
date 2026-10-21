"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  DollarSign,
  Edit3,
  Layers,
  Percent,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { formatINR, mockMerchants, mockTemperedMarginSchedule } from "@/lib/mock-data";
import { TemperedMarginSchedule } from "@/lib/types";

interface AdminModificationsModuleProps {
  initialTab?: string;
}

export function AdminModificationsModule({ initialTab = "commercial" }: AdminModificationsModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // 1. Mobile Number Modification State (Page 5: Modify Mobile Number RMN / New AD RMN)
  const [mobileForm, setMobileForm] = useState({
    currentRMN: "9876543210",
    newRMN: "",
    otpVerified: false,
  });
  const [mobileSuccess, setMobileSuccess] = useState(false);

  // 2. Change Mapping State (Page 5: Change mapping Retailer RMN / New AD RMN)
  const [mappingForm, setMappingForm] = useState({
    retailerRMN: "9876543210",
    newAdRMN: "9123456789",
    reason: "Geographic territory re-alignment",
  });
  const [mappingSuccess, setMappingSuccess] = useState(false);

  // 3. Profile Modification State (Page 5: Agent RMN, Agent Name, Email ID, Shop Name, Shop Categ, Address)
  const [profileSearch, setProfileSearch] = useState("");
  const [profileSearchAlert, setProfileSearchAlert] = useState("");
  const [profileForm, setProfileForm] = useState({
    rmn: "9876543210",
    agentName: "Rajesh Kumar Sharma",
    email: "rajesh.sharma@sharmadigital.in",
    shopName: "Sharma Digital & Cyber Cafe",
    shopCategory: "Cyber Cafe & Banking Point",
    address: "Shop 4, Market Complex, Station Road, Jaipur",
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleProfileSearch = () => {
    if (!profileSearch.trim()) return;
    const q = profileSearch.trim().toLowerCase();
    const found = mockMerchants.find(
      (m) =>
        m.rmn.includes(q) ||
        m.agentName.toLowerCase().includes(q) ||
        m.shopName.toLowerCase().includes(q)
    );
    if (found) {
      setProfileForm({
        rmn: found.rmn,
        agentName: found.agentName,
        email: found.email,
        shopName: found.shopName,
        shopCategory: found.shopCategory,
        address: found.address,
      });
      setProfileSearchAlert("");
    } else {
      setProfileSearchAlert(`No merchant found matching "${profileSearch}".`);
    }
  };

  // 4. Tempered Margin Plan Editor State (Page 3 & Page 5)
  const [marginSchedule, setMarginSchedule] = useState<TemperedMarginSchedule>(mockTemperedMarginSchedule);
  const [commercialSuccess, setCommercialSuccess] = useState(false);

  // 5. Prime Product Management State (Page 5: Enable Payout Branch, Enable Payout 4/8 State, Enable IPCC, RazorPay, UPI)
  const [primeProducts, setPrimeProducts] = useState({
    payoutBranch: true,
    payoutFourEightState: true,
    ipccEnabled: false,
    unknownPayoutBranch: false,
    razorpayRouting: true,
    upiRouting: true,
  });

  // 6. Notification Broadcast State (Page 5: Update Notification)
  const [broadcastMessage, setBroadcastMessage] = useState(
    "Scheduled Bank Server Maintenance: SBI switch will undergo maintenance from 02:00 AM to 04:00 AM."
  );
  const [broadcastSent, setBroadcastSent] = useState(false);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 3 & 5 Module 3
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Modifications & Commercial Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Modifications & Commercial Engine</h1>
          <p className="text-xs text-slate-500">
            Configure the Tempered-Margin plan (₹7, ₹9, % variable), re-map retailer hierarchy, modify profiles, and manage Prime products.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "commercial", label: "Tempered Margin (Plan)" },
            { id: "mobile", label: "Modify Mobile (RMN)" },
            { id: "mapping", label: "Change Mapping" },
            { id: "profile", label: "Modify Profile" },
            { id: "commercial-template", label: "Commercial Templates" },
            { id: "service-templates", label: "Service Templates" },
            { id: "prime-products", label: "Prime Products (Payart/UPI)" },
            { id: "notifications", label: "Update Notification" },
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

      {/* 1. TEMPERED MARGIN PLAN TAB (Exact Page 3 Slabs) */}
      {activeTab === "commercial" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50 p-6 shadow-panel">
            <div className="flex items-center gap-2 text-sky-900">
              <Zap size={20} className="text-sky-700" />
              <h2 className="text-base font-extrabold">
                Tempered Margin Cost Schedule (Page 3 Specification)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Confirmed rules: Fixed ₹7 for ₹101–₹1,000, fixed ₹9 for ₹1,001–₹2,000, and percentage-based fee for &gt;₹2,000.
              <span className="font-bold text-navy"> No arbitrary global upper cap</span> (200000 was struck through in red in the original source document).
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Slabs Configuration Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel space-y-4">
              <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-2">
                Active Pricing Slabs (Versioned Schedule: {marginSchedule.id})
              </h3>

              {/* Tier 1: 101 - 1000 */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Slab 1 (₹101 to ₹1,000)</span>
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">Fixed Fee</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Service Charge:</span>
                  <span className="font-extrabold text-navy text-sm">₹{marginSchedule.tier1.feeRs} Rs</span>
                  <span className="text-slate-400">(Documented on Page 3: "101 --- 1000 --→ 7 Rs")</span>
                </div>
              </div>

              {/* Tier 2: 1001 - 2000 */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Slab 2 (₹1,001 to ₹2,000)</span>
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">Fixed Fee</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Service Charge:</span>
                  <span className="font-extrabold text-navy text-sm">₹{marginSchedule.tier2.feeRs} Rs</span>
                  <span className="text-slate-400">(Documented on Page 3: "1001 -- 2000 --→ 9 Rs")</span>
                </div>
              </div>

              {/* Tier 3: 2001+ Variable (No Cap) */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">Slab 3 (&gt; ₹2,000 — No Upper Cap)</span>
                  <span className="rounded bg-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-900">
                    Percentage Model
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-600">Default Variable Rate:</span>
                  <span className="font-extrabold text-navy text-sm">{(marginSchedule.tier3.percentage * 100).toFixed(2)}%</span>
                  <span className="text-slate-400">(Page 3 values: 0.2%, 0.3%, 0.35%, 0.5%)</span>
                </div>
              </div>

              {/* Service Percentage Overrides (Page 3 & Page 5) */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold uppercase text-slate-600">
                  Main Admin Configurable Overrides per Service
                </h4>
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(marginSchedule.serviceOverrides).map(([svc, rate]) => (
                    <div key={svc} className="flex items-center justify-between rounded bg-slate-50 p-2">
                      <span className="font-semibold text-slate-800">{svc}</span>
                      <span className="font-mono font-bold text-navy">{rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {commercialSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={16} /> Tempered Plan version updated and published prospective.
                </div>
              )}

              <button
                onClick={() => {
                  setCommercialSuccess(true);
                  setTimeout(() => setCommercialSuccess(false), 2000);
                }}
                className="w-full rounded-lg bg-navy py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Save & Publish Tempered Schedule Version
              </button>
            </div>

            {/* Live Pricing Simulator */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-2">
                Live Pricing Calculator
              </h3>
              <p className="mt-2 text-xs text-slate-500">Test how the tempered-margin engine charges transactions:</p>

              <div className="mt-4 space-y-3">
                {[500, 1500, 4500, 25000].map((amt) => {
                  const fee = amt <= 1000 ? 7 : amt <= 2000 ? 9 : Math.round(amt * 0.0035 * 100) / 100;
                  return (
                    <div key={amt} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{formatINR(amt)}</p>
                        <p className="text-[11px] text-slate-400">
                          {amt <= 1000 ? "Fixed Slab 1" : amt <= 2000 ? "Fixed Slab 2" : "0.35% Variable Slab"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-navy">{formatINR(fee)}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">Net: {formatINR(amt - fee)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODIFY MOBILE NUMBER TAB (Page 5: RMN / New AD RMN) */}
      {activeTab === "mobile" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 5 Submenu
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Modify Mobile Number (Agent RMN / New AD RMN)
            </h2>
            <p className="text-xs text-slate-500">
              Dual-OTP verified mobile number update for merchant and distributor accounts.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMobileSuccess(true);
            }}
            className="mt-5 max-w-lg space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Select Merchant / Agent</label>
              <select
                value={mobileForm.currentRMN}
                onChange={(e) => setMobileForm({ ...mobileForm, currentRMN: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
                {mockMerchants.map((m) => (
                  <option key={m.id} value={m.rmn}>
                    {m.agentName} ({m.shopName}) — Current RMN: {m.rmn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">New Mobile Number (RMN) *</label>
              <input
                type="tel"
                required
                placeholder="10-digit new mobile"
                value={mobileForm.newRMN}
                onChange={(e) => setMobileForm({ ...mobileForm, newRMN: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
              />
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Dual-OTP verification will be dispatched to both current RMN ({mobileForm.currentRMN}) and new RMN ({mobileForm.newRMN || "..."}) to prevent account takeover.
            </div>

            {mobileSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> RMN successfully updated in registry and SMS verification sent.
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Verify OTP & Update RMN
            </button>
          </form>
        </div>
      )}

      {/* 3. CHANGE MAPPING TAB (Page 5: Retailer RMN / New AD RMN) */}
      {activeTab === "mapping" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 5 Submenu
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Change Mapping: Retailer RMN → New AD RMN
            </h2>
            <p className="text-xs text-slate-500">
              Re-assign a downstream retailer from their existing Area Distributor to a new Area Distributor.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMappingSuccess(true);
            }}
            className="mt-5 max-w-lg space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Select Retailer to Transfer</label>
              <select
                value={mappingForm.retailerRMN}
                onChange={(e) => setMappingForm({ ...mappingForm, retailerRMN: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
                {mockMerchants.filter((m) => m.agentRole === "Retailer").map((m) => (
                  <option key={m.id} value={m.rmn}>
                    {m.shopName} ({m.rmn}) — Current AD: {m.assignedAD}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">New Target Area Distributor (AD)</label>
              <select
                value={mappingForm.newAdRMN}
                onChange={(e) => setMappingForm({ ...mappingForm, newAdRMN: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
                {mockMerchants.filter((m) => m.agentRole === "Distributor").map((m) => (
                  <option key={m.id} value={m.rmn}>
                    {m.agentName} ({m.shopName}) — RMN: {m.rmn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Re-mapping Reason</label>
              <input
                type="text"
                value={mappingForm.reason}
                onChange={(e) => setMappingForm({ ...mappingForm, reason: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
              </input>
            </div>

            {mappingSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Retailer mapping updated in hierarchy tree with immutable audit event.
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Reassign Retailer Downstream
            </button>
          </form>
        </div>
      )}

      {/* 4. MODIFY PROFILE (Page 5 Submenu) */}
      {activeTab === "profile" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">
                Modify Profile (Agent RMN, Agent Name, Email ID, Shop Name, Shop Categ, Address)
              </h2>
              <p className="text-xs text-slate-500">
                Search an existing merchant or retailer to load profile data and update registered parameters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search RMN, name, store..."
                  value={profileSearch}
                  onChange={(e) => {
                    setProfileSearch(e.target.value);
                    setProfileSearchAlert("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleProfileSearch();
                    }
                  }}
                  className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                />
                {profileSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileSearch("");
                      setProfileSearchAlert("");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear profile search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleProfileSearch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Profile
              </button>
            </div>
          </div>

          {profileSearchAlert && (
            <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center justify-between">
              <span>{profileSearchAlert}</span>
              <button
                type="button"
                onClick={() => setProfileSearchAlert("")}
                className="text-rose-500 hover:text-rose-800 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setProfileSuccess(true);
            }}
            className="mt-5 max-w-xl space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Agent Legal Name</label>
                <input
                  type="text"
                  value={profileForm.agentName}
                  onChange={(e) => setProfileForm({ ...profileForm, agentName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Email ID</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Shop Name</label>
                <input
                  type="text"
                  value={profileForm.shopName}
                  onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">Shop Category</label>
                <input
                  type="text"
                  value={profileForm.shopCategory}
                  onChange={(e) => setProfileForm({ ...profileForm, shopCategory: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600">Store Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Profile changes saved and updated in merchant record.
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Update Profile Record
            </button>
          </form>
        </div>
      )}

      {/* 5. PRIME PRODUCTS (Page 5: Payart & RazorPay / UPI) */}
      {activeTab === "prime-products" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 5 Submenu
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Manage Prime Product (Merge Payart & Manage yth / RazorPay / UPI)
            </h2>
            <p className="text-xs text-slate-500">
              Per Page 5: Enable Payout Branch, Enable Payout 4/8 State, Enable IPCC, Unknown Payout branch, RazorPay, UPI.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { id: "payoutBranch", label: "Enable Payout Branch", note: "Direct bank payout clearing" },
              { id: "payoutFourEightState", label: "Enable Payout 4/8 State", note: "Multi-state remittance routing" },
              { id: "ipccEnabled", label: "Enable IPCC", note: "Integrated Payment Clearing Center" },
              { id: "unknownPayoutBranch", label: "Unknown Payout Branch Fallback", note: "Default route for unclassified IFSCs" },
              { id: "razorpayRouting", label: "RazorPay Gateway Active", note: "Card & UPI Intent fallback" },
              { id: "upiRouting", label: "UPI Direct Switch (NPCI)", note: "Primary zero-cost retail rail" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-bold text-navy">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPrimeProducts({
                      ...primeProducts,
                      [item.id]: !primeProducts[item.id as keyof typeof primeProducts],
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    primeProducts[item.id as keyof typeof primeProducts]
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {primeProducts[item.id as keyof typeof primeProducts] ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. NOTIFICATION BROADCAST (Page 5 Submenu) */}
      {activeTab === "notifications" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Update System Notifications (Page 5)</h2>
            <p className="text-xs text-slate-500">Broadcast maintenance alerts and regulatory notices to SD/AD/Retailer portals.</p>
          </div>

          <div className="mt-5 max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Broadcast Notice Text</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-xs outline-none focus:border-sky-500"
              />
            </div>

            {broadcastSent && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Notification published to all portal headers.
              </div>
            )}

            <button
              onClick={() => {
                setBroadcastSent(true);
                setTimeout(() => setBroadcastSent(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Send size={15} /> Broadcast to Portals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

