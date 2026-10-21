import React from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  KeyRound,
  Lock,
  MapPin,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Zap,
} from "lucide-react";

export default function MultiPortalDirectory() {
  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-[#16B8A6] selection:text-white">
      {/* Executive Header */}
      <header className="border-b border-slate-800/80 bg-[#101C32]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-[#16B8A6] to-sky-500 text-white font-black text-lg shadow-lg shadow-teal-500/20">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-white text-base">BUYMECART.ORG</span>
                <span className="rounded bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 text-[10px] font-mono text-teal-300 font-bold">
                  IBNK Core Banking Switch
                </span>
              </div>
              <p className="text-xs text-slate-400">Four-Portal Fintech Enterprise Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Lock size={12} /> Note 5: Single ID Session Lock Enforced
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-300">
              <ShieldCheck size={12} /> Note 1: Neutral Receipt Active
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-teal-500/30 px-3 py-1 text-xs text-teal-300 font-semibold shadow-sm">
            <ShieldCheck size={14} className="text-[#16B8A6]" />
            Strict Role-Based Security Boundary &middot; Zero Unauthenticated Access
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            BuyMeCart Financial Services Platform
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Enterprise multi-portal architecture providing segregated governance of administrators, super distributors, area distributors, and retail merchant desks. Every session is authenticated and verified before dashboard entry.
          </p>
        </div>

        {/* 4 Dedicated Role-Specific Portals Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Portal 1: Admin Master Portal */}
          <div className="flex flex-col rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 via-slate-900 to-[#101C32] p-6 shadow-xl relative overflow-hidden group hover:border-sky-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="rounded bg-sky-500/20 border border-sky-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-sky-300">
                PORTAL 1: ADMIN
              </span>
              <span className="text-[11px] font-mono text-slate-400">admin.buymecart.org</span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-sky-400" />
              Admin Master Portal
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Centralized command console with root authority over SD creation, multi-bank routing, limits, and system audits.
            </p>

            <div className="mt-5 space-y-2 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Governance Scope:</p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <span>Create & oversee Super Distributors</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <span>Configure roles, permissions & limits</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <span>Merchant Management & 12-Pt KYC</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <span>Payment engine, settlements & refunds</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <span>12 statutory reports (Ledger to UPI PA)</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/admin/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/30"
              >
                <KeyRound size={14} /> Admin Login
              </Link>
            </div>
          </div>

          {/* Portal 2: Super Distributor Portal */}
          <div className="flex flex-col rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-[#101C32] p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-300">
                PORTAL 2: SUPER DIST
              </span>
              <span className="text-[11px] font-mono text-slate-400">sd.buymecart.org</span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-indigo-400" />
              Super Distributor Portal
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Regional network management console for onboarding ADs, managing regional float, and overseeing commissions.
            </p>

            <div className="mt-5 space-y-2 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regional Authority:</p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span>Onboard & verify Area Distributors</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span>Total allocated float pool (₹8,45,000)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span>Clear distributor balance queries</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span>Regional volume & performance KPIs</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span>Commission settlements & ledger feed</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/super-distributor/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
              >
                <KeyRound size={14} /> Super Distributor Login
              </Link>
            </div>
          </div>

          {/* Portal 3: Area Distributor Portal */}
          <div className="flex flex-col rounded-2xl border border-teal-500/30 bg-gradient-to-b from-teal-950/40 via-slate-900 to-[#101C32] p-6 shadow-xl relative overflow-hidden group hover:border-teal-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="rounded bg-teal-500/20 border border-teal-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-teal-300">
                PORTAL 3: AREA DIST
              </span>
              <span className="text-[11px] font-mono text-slate-400">ad.buymecart.org</span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-white flex items-center gap-2">
              <MapPin size={20} className="text-[#16B8A6]" />
              Area Distributor Portal
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Territory field operations desk for onboarding merchant storefronts, document collection, and kit handover.
            </p>

            <div className="mt-5 space-y-2 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Territory Scope (Zone-01):</p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-400 mt-0.5 shrink-0" />
                  <span>Onboard local retailers & merchants</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-400 mt-0.5 shrink-0" />
                  <span>12-Pt KYC collection & verification</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-400 mt-0.5 shrink-0" />
                  <span>Welcome Kit & biometric device handover</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-400 mt-0.5 shrink-0" />
                  <span>Local float allocation & balance top-ups</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-400 mt-0.5 shrink-0" />
                  <span>Strict territory boundary enforcement</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/area-distributor/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#16B8A6] px-4 py-2.5 text-xs font-bold text-[#101C32] hover:bg-teal-400 transition shadow-lg shadow-teal-500/20"
              >
                <KeyRound size={14} /> Area Distributor Login
              </Link>
            </div>
          </div>

          {/* Portal 4: Retailer Portal */}
          <div className="flex flex-col rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-[#101C32] p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 transition">
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-300">
                PORTAL 4: RETAILER
              </span>
              <span className="text-[11px] font-mono text-slate-400">retailer.buymecart.org</span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-white flex items-center gap-2">
              <Store size={20} className="text-emerald-400" />
              Retailer / Merchant
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Authorized Point-of-Sale merchant terminal for AEPS cashout, DMT transfers, and BBPS utility bill payments.
            </p>

            <div className="mt-5 space-y-2 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Point-of-Sale Rails:</p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>AEPS Cash Withdrawal & Inquiry</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>DMT Transfer (PPI / Fino Rail)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>BBPS Utility Bill Payments</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Note 1 Neutral Receipts (Zero Bank Logos)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Tempered Margin Fee Retained Live</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/retailer/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
              >
                <KeyRound size={14} /> Retailer Login
              </Link>
            </div>
          </div>
        </div>

        {/* Compliance & Architectural Guarantees Footer */}
        <div className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Source PDF Requirements Compliance Verification
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-[#101C32] p-4">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-400" /> Note 1: Neutral Receipt
              </p>
              <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                Customer transaction slips strictly exclude third-party or banking sponsor logos, preserving pure whitelabel integrity.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#101C32] p-4">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Lock size={14} className="text-amber-400" /> Note 5: 1 ID Session Lock
              </p>
              <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                Enforces single concurrent active session per ID across all 4 portals with immediate termination of older session tokens.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#101C32] p-4">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Zap size={14} className="text-sky-400" /> Page 3: Tempered Margins
              </p>
              <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                Tiered pricing: ₹7 (₹101–1k), ₹9 (₹1k–2k), variable percentage for &gt;₹2,000 without artificial ceiling caps.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#101C32] p-4">
              <p className="font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-indigo-400" /> Page 5: 12 Master Reports
              </p>
              <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                Complete audit trails: Account Ledger, Wallet Ledger, Transactions, AEPS, DMT PPI/Fino, and PA UPI.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
