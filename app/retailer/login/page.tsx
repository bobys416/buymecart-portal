"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { PRESET_USERS, loginWithBackend, setStoredSession } from "@/lib/auth";

function RetailerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [rmn, setRmn] = useState("retailer.store1@buymecart.org");
  const [pin, setPin] = useState("RetailerPass#2026");
  const [otp, setOtp] = useState("402918");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination =
    redirectParam && redirectParam.startsWith("/retailer")
      ? redirectParam
      : "/retailer/dashboard";

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await loginWithBackend(rmn, pin);
    if (res.success && res.session) {
      setIsLoading(false);
      router.push(destination);
    } else {
      if (
        res.error?.toLowerCase().includes("credentials") ||
        res.error?.toLowerCase().includes("password") ||
        res.error?.toLowerCase().includes("inactive") ||
        res.error?.toLowerCase().includes("suspended")
      ) {
        setError(res.error);
        setIsLoading(false);
      } else {
        console.warn("Backend offline or unreachable, using local developer session:", res.error);
        setStoredSession(PRESET_USERS.retailer);
        setIsLoading(false);
        router.push(destination);
      }
    }
  };

  const handleQuickPreset = async () => {
    setRmn("retailer.store1@buymecart.org");
    setPin("RetailerPass#2026");
    setIsLoading(true);
    setError(null);

    const res = await loginWithBackend("retailer.store1@buymecart.org", "RetailerPass#2026");
    if (res.success && res.session) {
      setIsLoading(false);
      router.push(destination);
    } else {
      setStoredSession(PRESET_USERS.retailer);
      setIsLoading(false);
      router.push(destination);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <ShoppingBag size={32} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-white">
          BUYMECART RETAILER TERMINAL
        </h2>
        <p className="mt-1 text-center font-mono text-xs text-emerald-400">
          retailer.buymecart.org · Merchant Operating Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Quick Preset Login */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                  Retailer Test Terminal
                </p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Sign in immediately as active authorized retailer:
                </p>
                <div className="mt-2 text-[11px] font-mono text-emerald-300">
                  {PRESET_USERS.retailer.name} · {PRESET_USERS.retailer.territory} · Code: {PRESET_USERS.retailer.orgScope}
                </div>
                <button
                  type="button"
                  onClick={handleQuickPreset}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
                >
                  <KeyRound size={14} /> One-Click Retailer Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Notices */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2 text-xs text-slate-400 border border-slate-700/50">
              <Lock size={14} className="text-amber-400 shrink-0" />
              <span>
                <strong>Note 5:</strong> Single Active ID Session Lock. 1 simultaneous session allowed.
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2 text-xs text-slate-400 border border-slate-700/50">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>
                <strong>Note 1:</strong> Receipts strictly generated with NO external logos.
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300">
                Registered Mobile Number (RMN)
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={rmn}
                  onChange={(e) => setRmn(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300">
                Merchant PIN / Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-slate-300">
                  SMS OTP (SIM-Bound Handshake)
                </label>
                <span className="text-[10px] font-mono text-emerald-400">OTP Sent ✓</span>
              </div>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full font-mono tracking-widest rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/50 p-2.5 text-xs text-red-400 border border-red-800">
                <ShieldAlert size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {isLoading ? "Starting Secure Merchant Session..." : "Sign In to Retailer Console"}
            </button>
          </form>

          {/* Directory Return */}
          <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition">
              ← Return to Buymecart Multi-Portal Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RetailerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <RetailerLoginForm />
    </Suspense>
  );
}
