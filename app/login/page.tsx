"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { getStoredSession } from "@/lib/auth";

function UniversalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  // Auto-redirect if already logged in to any portal
  useEffect(() => {
    const adminSession = getStoredSession("admin");
    if (adminSession) {
      router.replace(redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin/dashboard");
      return;
    }
    const sdSession = getStoredSession("super-distributor");
    if (sdSession) {
      router.replace(redirectParam && redirectParam.startsWith("/super-distributor") ? redirectParam : "/super-distributor/dashboard");
      return;
    }
    const adSession = getStoredSession("area-distributor");
    if (adSession) {
      router.replace(redirectParam && redirectParam.startsWith("/area-distributor") ? redirectParam : "/area-distributor/dashboard");
      return;
    }
    const retailerSession = getStoredSession("retailer");
    if (retailerSession) {
      router.replace(redirectParam && redirectParam.startsWith("/retailer") ? redirectParam : "/retailer/dashboard");
      return;
    }
  }, [router, redirectParam]);

  const portals = [
    {
      title: "Admin Master Portal",
      role: "System Administrator",
      description: "Root console for SD creation, multi-bank routing, limits, and system audits.",
      icon: Building2,
      color: "sky",
      badge: "admin.buymecart.org",
      href: `/admin/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
      btnText: "Admin Login",
      btnClass: "bg-sky-600 hover:bg-sky-500 text-white",
    },
    {
      title: "Super Distributor Portal",
      role: "Super Distributor (SD)",
      description: "Regional network management, Area Distributor onboarding, and pool float.",
      icon: Users,
      color: "indigo",
      badge: "sd.buymecart.org",
      href: `/super-distributor/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
      btnText: "Super Distributor Login",
      btnClass: "bg-indigo-600 hover:bg-indigo-500 text-white",
    },
    {
      title: "Area Distributor Portal",
      role: "Area Distributor (AD)",
      description: "Territory field desk for retailer onboarding, 12-Pt KYC, and kit handover.",
      icon: MapPin,
      color: "teal",
      badge: "ad.buymecart.org",
      href: `/area-distributor/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
      btnText: "Area Distributor Login",
      btnClass: "bg-[#16B8A6] hover:bg-teal-400 text-[#101C32]",
    },
    {
      title: "Retailer / Merchant Portal",
      role: "Merchant Operator",
      description: "Storefront POS terminal for AEPS cashout, DMT, and BBPS utility bills.",
      icon: Store,
      color: "emerald",
      badge: "retailer.buymecart.org",
      href: `/retailer/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`,
      btnText: "Retailer Login",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-xs text-teal-300 font-semibold mb-3">
          <ShieldCheck size={14} className="text-[#16B8A6]" />
          Encrypted Authentication Entry Point
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Select Your Authorized Portal to Sign In
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Four distinct role-based portals with zero unauthenticated dashboard access. Select your assigned organization role below.
        </p>
      </div>

      <div className="mt-8 max-w-4xl mx-auto w-full grid gap-4 sm:grid-cols-2">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-800 bg-[#101C32] p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">{p.badge}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-teal-300 font-mono font-bold">
                    {p.role}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-white flex items-center gap-2">
                  <Icon size={18} className="text-[#16B8A6]" />
                  {p.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{p.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <Link
                  href={p.href}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${p.btnClass}`}
                >
                  <KeyRound size={14} /> {p.btnText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition">
          &larr; Return to BuyMeCart Directory
        </Link>
      </div>
    </div>
  );
}

export default function UniversalLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <UniversalLoginForm />
    </Suspense>
  );
}
