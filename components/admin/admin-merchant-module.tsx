"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck2,
  FileText,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { formatINR, mockKycCases, mockMerchants } from "@/lib/mock-data";
import { AgentRole, KYCCase, Merchant } from "@/lib/types";
import { MerchantKycDossier } from "@/components/admin/merchant-kyc-dossier";

interface AdminMerchantModuleProps {
  initialTab?: string;
}

export function AdminMerchantModule({ initialTab = "search" }: AdminMerchantModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [vkycCase, setVkycCase] = useState<KYCCase | null>(null);

  // Search filter state
  const searchParams = useSearchParams();
  const qParam = searchParams?.get?.("q") || "";
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [viewSearchTerm, setViewSearchTerm] = useState("");
  const [balanceSearchTerm, setBalanceSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    if (qParam) setSearchTerm(qParam);
  }, [qParam]);

  // Create Merchant Form state
  const [createSuccess, setCreateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    rmn: "",
    agentName: "",
    email: "",
    shopName: "",
    shopCategory: "Grocery & Financial Point",
    address: "",
    state: "Rajasthan",
    city: "Jaipur",
    country: "India",
    agentRole: "Retailer" as AgentRole,
    aadhaarNumber: "",
  });


  // Password resend confirmation state
  const [passwordSentTo, setPasswordSentTo] = useState<string | null>(null);

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.rmn.includes(searchTerm) ||
      m.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.aadhaarNumber.includes(searchTerm);
    const matchesRole = roleFilter === "All" || m.agentRole === roleFilter;
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rmn || !formData.agentName || !formData.shopName) return;

    const newMch: Merchant = {
      id: `MCH-00${merchants.length + 101}`,
      rmn: formData.rmn,
      agentName: formData.agentName,
      email: formData.email || `${formData.agentName.toLowerCase().replace(/\s+/g, ".")}@buymecart.in`,
      shopName: formData.shopName,
      shopCategory: formData.shopCategory,
      address: formData.address || "Main Market Road",
      city: formData.city,
      state: formData.state,
      country: formData.country,
      agentRole: formData.agentRole,
      aadhaarNumber: formData.aadhaarNumber || "XXXX-XXXX-9999",
      panNumber: "ABCDE1234F",
      status: "Active",
      balance: 10000,
      dailyCredit: 0,
      dailyDebit: 0,
      assignedAD: "AD-RAJ-01 (Vikram Patel)",
      assignedSD: "SD-NORTH-01 (Rajeev Mehta)",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setMerchants([newMch, ...merchants]);
    setCreateSuccess(true);
    setTimeout(() => {
      setCreateSuccess(false);
      setActiveTab("view");
    }, 1500);
  };

  const toggleMerchantStatus = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus = m.status === "Active" ? "Suspended" : "Active";
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 4 Module 2
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Merchant Operations
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Merchant Management</h1>
          <p className="text-xs text-slate-500">
            Search, create, verify KYC, assign channels, and manage merchant account lifecycles.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "search", label: "Search Merchant" },
            { id: "create", label: "Create Merchant" },
            { id: "create-kyc", label: "Create KYC (12-Pt)" },
            { id: "view", label: "View Merchant" },
            { id: "channel", label: "Merchant Channel" },
            { id: "passwords", label: "Password Resends" },
            { id: "activate", label: "Activate / Suspend" },
            { id: "balances", label: "Daily Balances" },
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

      {/* 1. SEARCH MERCHANT TAB */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="text-sm font-bold text-navy">Search & Filter Merchant Records</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex min-w-[280px] flex-1 items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-400 focus-within:border-navy focus-within:ring-1 focus-within:ring-navy transition">
                  <Search size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by RMN, Name, Store, or Aadhaar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs text-slate-800 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition shrink-0"
                >
                  <Search size={13} /> Search Merchant
                </button>
              </div>

              <div className="w-full sm:w-56">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700 bg-white"
                >
                  <option value="All">All Roles (C&F, Master, Dist, Retailer)</option>
                  <option value="C&F">C&F Agent</option>
                  <option value="Master Distributor">Master Distributor (SD)</option>
                  <option value="Distributor">Distributor (AD)</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>

              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-panel">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Agent RMN / Name</th>
                  <th className="px-5 py-3">Store Name & Category</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{m.agentName}</p>
                      <p className="font-mono text-xs text-slate-500">{m.rmn}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{m.shopName}</p>
                      <p className="text-xs text-slate-400">{m.shopCategory}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {m.agentRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {m.city}, {m.state}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {formatINR(m.balance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          m.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : m.status === "Pending Approval"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedMerchant(m)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                      >
                        <Eye size={14} /> View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CREATE MERCHANT TAB (Page 4 Exact Fields) */}
      {activeTab === "create" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Create Merchant Profile</h2>
            <p className="text-xs text-slate-500">
              Fields specified in Page 4: Agent RMN, Agent Name, Email, Store Name, Category, Address, State/City, Role, Aadhaar Number.
            </p>
          </div>

          <form onSubmit={handleCreateMerchant} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Agent RMN (Mobile Number) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={formData.rmn}
                  onChange={(e) => setFormData({ ...formData, rmn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Agent Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as per Aadhaar"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="merchant@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Shop / Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Storefront / commercial trade name"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Shop Category
                </label>
                <select
                  value={formData.shopCategory}
                  onChange={(e) => setFormData({ ...formData, shopCategory: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                >
                  <option>Grocery & Financial Point</option>
                  <option>Cyber Cafe & Banking Kiosk</option>
                  <option>Mobile Electronics & Recharge</option>
                  <option>Pharmacy & Utility Services</option>
                  <option>Hardware & Money Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Agent Role (Page 4 Roles) *
                </label>
                <select
                  value={formData.agentRole}
                  onChange={(e) => setFormData({ ...formData, agentRole: e.target.value as AgentRole })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-navy"
                >
                  <option value="Retailer">Retailer (Standard Merchant)</option>
                  <option value="Distributor">Distributor (Area Distributor)</option>
                  <option value="Master Distributor">Master Distributor (Super Distributor)</option>
                  <option value="C&F">C&F (Carrying & Forwarding Agent)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Physical Store Address *
                </label>
                <input
                  type="text"
                  placeholder="Shop number, street, landmark, area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Aadhaar Card Number *
                </label>
                <input
                  type="text"
                  placeholder="12-digit UID"
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            {createSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Merchant record created successfully in mock database.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                <Plus size={16} /> Save & Register Merchant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. CREATE MERCHANT KYC TAB (Full 12-Point KYC from Page 3 & Page 4) */}
      {activeTab === "create-kyc" && (
        <MerchantKycDossier />
      )}

      {/* 4. VIEW MERCHANT TAB */}
      {activeTab === "view" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
            <div>
              <h2 className="text-base font-bold text-navy">Active Merchant Registry</h2>
              <p className="text-xs text-slate-500">
                Detailed inspection of registered entities with authorized balance and KYC status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy transition">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search ID, Name, RMN..."
                  value={viewSearchTerm}
                  onChange={(e) => setViewSearchTerm(e.target.value)}
                  className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                />
                {viewSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setViewSearchTerm("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
              >
                <Search size={12} /> Search
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {merchants
              .filter((m) => {
                if (!viewSearchTerm) return true;
                const term = viewSearchTerm.toLowerCase();
                return (
                  m.id.toLowerCase().includes(term) ||
                  m.agentName.toLowerCase().includes(term) ||
                  m.shopName.toLowerCase().includes(term) ||
                  m.rmn.includes(term)
                );
              })
              .map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                      {m.id}
                    </span>
                    <h3 className="mt-2 font-bold text-navy">{m.shopName}</h3>
                    <p className="text-xs text-slate-500">{m.agentName} · {m.rmn}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-semibold">{m.agentRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available Balance:</span>
                    <span className="font-bold text-navy">{formatINR(m.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Super Distributor:</span>
                    <span className="truncate">{m.assignedSD}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Area Distributor:</span>
                    <span className="truncate">{m.assignedAD}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setSelectedMerchant(m)}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Inspect Profile
                  </button>
                  <button
                    onClick={() => toggleMerchantStatus(m.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      m.status === "Active"
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {m.status === "Active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MERCHANT CHANNEL (Hierarchy View from Page 2) */}
      {activeTab === "channel" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Merchant Channel Hierarchy Tree (Page 2)</h2>
            <p className="text-xs text-slate-500">
              Visualizes the confirmed organizational relationship: Admin (CRM) → Super Distributor (SD) → Area Distributor (AD) → Retailers.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {/* Level 1: Main Admin */}
            <div className="rounded-xl border-2 border-navy bg-navy/5 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-white">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 1 · Platform Root</p>
                  <h3 className="text-base font-bold text-navy">BUYMECART Admin / CRM Engine</h3>
                </div>
              </div>
            </div>

            {/* Level 2: Super Distributors */}
            <div className="ml-6 space-y-4 border-l-2 border-indigo-200 pl-6">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Tier 2 · Super Distributors (SD)
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <p className="font-bold text-navy">SD-NORTH-01: Rajeev Mehta</p>
                  <p className="text-xs text-slate-500">RMN: 9811002233 · Territory: North India</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>Assigned ADs: 4</span>
                    <span>Total Retailers: 28</span>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <p className="font-bold text-navy">SD-CENTRAL-01: Arun Singh</p>
                  <p className="text-xs text-slate-500">RMN: 9810098100 · Territory: Central India</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>Assigned ADs: 3</span>
                    <span>Total Retailers: 19</span>
                  </div>
                </div>
              </div>

              {/* Level 3: Area Distributors under SD-CENTRAL-01 */}
              <div className="ml-6 space-y-3 border-l-2 border-sky-200 pl-6">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Tier 3 · Area Distributors (AD) under SD-CENTRAL-01
                </p>
                <div className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">AD-ZONE-01: Sunil Verma</p>
                      <p className="text-xs text-slate-500">Assigned Territory (Zone-01) · 7 Retailers Assigned</p>
                    </div>
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                      Kit Handover Complete
                    </span>
                  </div>

                  {/* Level 4: Downstream Retailers */}
                  <div className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50 p-2 text-xs">
                    <div className="flex justify-between py-1 text-slate-700">
                      <span>• Sharma Digital (9876543210)</span>
                      <span className="text-emerald-600 font-semibold">Active</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-700">
                      <span>• Nisha Stores (9823456781)</span>
                      <span className="text-amber-600 font-semibold">Pending Approval</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PASSWORD RESENDS TAB (Page 4 Submenu) */}
      {activeTab === "passwords" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Password Resends & Credential Audit</h2>
            <p className="text-xs text-slate-500">
              Administrative tool to resend temporary passwords or trigger dual-factor authentication resets to agent RMNs.
            </p>
          </div>

          {passwordSentTo && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} /> Password reset dispatch sent to RMN: {passwordSentTo}
            </div>
          )}

          <div className="mt-5 divide-y divide-slate-100">
            {merchants.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-bold text-slate-800">{m.agentName} ({m.shopName})</p>
                  <p className="text-xs text-slate-400">RMN: {m.rmn} · Role: {m.agentRole}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPasswordSentTo(m.rmn)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <KeyRound size={14} /> Resend Password SMS
                  </button>
                  <button
                    onClick={() => setPasswordSentTo(m.email)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw size={14} /> Reset Portal Credential
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ACTIVATE MERCHANTS TAB (Page 4 Submenu) */}
      {activeTab === "activate" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy">Activate / Deactivate Merchant Terminals</h2>
            <p className="text-xs text-slate-500">
              Privileged control to instantaneously freeze or restore merchant services across banking rails.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {merchants.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy">{m.shopName}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        m.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Agent: {m.agentName} ({m.rmn}) · Created: {m.createdAt}
                  </p>
                </div>

                <button
                  onClick={() => toggleMerchantStatus(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    m.status === "Active"
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {m.status === "Active" ? "Deactivate Terminal" : "Activate Terminal"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. DAILY MERCHANTS BALANCE TAB (Page 4 Submenu) */}
      {activeTab === "balances" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">Daily Merchants Balance Ledger (Page 4)</h2>
              <p className="text-xs text-slate-500">
                Authoritative daily ledger reconciliation showing opening balance, daily credits, daily debits, and closing balance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy transition">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Merchant or RMN..."
                  value={balanceSearchTerm}
                  onChange={(e) => setBalanceSearchTerm(e.target.value)}
                  className="w-44 bg-transparent text-xs text-slate-800 outline-none"
                />
                {balanceSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setBalanceSearchTerm("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
              >
                <Search size={12} /> Search
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Merchant / RMN</th>
                  <th className="px-5 py-3">Opening Balance</th>
                  <th className="px-5 py-3 text-emerald-700">Daily Credits (+)</th>
                  <th className="px-5 py-3 text-rose-700">Daily Debits (-)</th>
                  <th className="px-5 py-3 font-bold">Closing Balance</th>
                  <th className="px-5 py-3">Settlement Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants
                  .filter((m) => {
                    if (!balanceSearchTerm) return true;
                    const term = balanceSearchTerm.toLowerCase();
                    return (
                      m.shopName.toLowerCase().includes(term) ||
                      m.rmn.includes(term) ||
                      m.agentName.toLowerCase().includes(term)
                    );
                  })
                  .map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{m.shopName}</p>
                      <p className="text-xs text-slate-400">{m.rmn}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600">
                      {formatINR(m.balance - m.dailyCredit + m.dailyDebit)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-600">
                      +{formatINR(m.dailyCredit)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-rose-600">
                      -{formatINR(m.dailyDebit)}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-navy">
                      {formatINR(m.balance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                        Balanced EOD
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Merchant Dossier Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-navy">Merchant Dossier: {selectedMerchant.id}</h3>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Agent Name:</span>
                <p className="font-bold text-slate-800">{selectedMerchant.agentName}</p>
              </div>
              <div>
                <span className="text-slate-400">Registered RMN:</span>
                <p className="font-bold text-slate-800">{selectedMerchant.rmn}</p>
              </div>
              <div>
                <span className="text-slate-400">Shop / Store:</span>
                <p className="font-bold text-slate-800">{selectedMerchant.shopName}</p>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="font-bold text-slate-800">{selectedMerchant.shopCategory}</p>
              </div>
              <div>
                <span className="text-slate-400">Role:</span>
                <p className="font-bold text-slate-800">{selectedMerchant.agentRole}</p>
              </div>
              <div>
                <span className="text-slate-400">Aadhaar (Masked):</span>
                <p className="font-bold text-slate-800">{selectedMerchant.aadhaarNumber}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Address:</span>
                <p className="font-bold text-slate-800">
                  {selectedMerchant.address}, {selectedMerchant.city}, {selectedMerchant.state}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMerchant(null)}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

