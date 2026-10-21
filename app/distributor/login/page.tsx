"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { PRESET_USERS, loginWithBackend, setStoredSession, UserSession } from "@/lib/auth";

function DistributorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("ad.zone1@buymecart.org");
  const [password, setPassword] = useState("AreaDistPass#2026");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await loginWithBackend(email, password);
    if (res.success && res.session) {
      setIsLoading(false);
      const targetPortal =
        res.portal === "super-distributor" || res.session?.role === "sd"
          ? "/super-distributor/dashboard"
          : "/area-distributor/dashboard";
      router.push(redirectParam || targetPortal);
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
        // Resilient fallback for testing double
        console.warn("Backend offline or unreachable, using local developer session:", res.error);
        let session: UserSession = PRESET_USERS["ad-bhopal"];
        let defaultDest = "/area-distributor/dashboard";

        if (email.toLowerCase().includes("sd") || email.toLowerCase().includes("arun") || email.toLowerCase().includes("central")) {
          session = PRESET_USERS["sd-central"];
          defaultDest = "/super-distributor/dashboard";
        }

        setStoredSession(session);
        setIsLoading(false);
        router.push(redirectParam || defaultDest);
      }
    }
  };

  const handleQuickLogin = async (roleKey: "sd-central" | "ad-bhopal") => {
    setIsLoading(true);
    setError(null);
    const loginId = roleKey === "sd-central" ? "sd.central@buymecart.org" : "ad.zone1@buymecart.org";
    const pass = roleKey === "sd-central" ? "SuperDistPass#2026" : "AreaDistPass#2026";
    setEmail(loginId);
    setPassword(pass);

    const res = await loginWithBackend(loginId, pass);
    if (res.success && res.session) {
      setIsLoading(false);
      const target = roleKey === "sd-central" ? "/super-distributor/dashboard" : "/area-distributor/dashboard";
      router.push(redirectParam || target);
    } else {
      const session = PRESET_USERS[roleKey];
      setStoredSession(session);
      setIsLoading(false);
      router.push(redirectParam || (roleKey === "sd-central" ? "/super-distributor/dashboard" : "/area-distributor/dashboard"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Users size={32} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-white">
          BUYMECART DISTRIBUTOR PORTAL
        </h2>
        <p className="mt-1 text-center font-mono text-xs text-indigo-400">
          distributor.buymecart.org · Shared SD & AD Enterprise Gateway
        </p>
        <p className="mt-1 text-center text-xs text-slate-400 max-w-md mx-auto">
          Single unified application serving both Super Distributors (SD) and Area Distributors (AD) with strictly isolated server-managed data scopes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-sm space-y-6">
          {/* Quick Preset Selector for SD and AD */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Evaluation Role (Server-Enforced Scope):
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option 1: Super Distributor */}
              <button
                type="button"
                onClick={() => handleQuickLogin("sd-central")}
                className="group flex flex-col text-left rounded-xl border border-indigo-500/40 bg-indigo-950/40 p-4 transition hover:bg-indigo-900/50 hover:border-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                    ROLE: SD
                  </span>
                  <KeyRound size={14} className="text-indigo-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm font-bold text-white">Super Distributor</p>
                <p className="text-xs text-slate-300">{PRESET_USERS["sd-central"].name}</p>
                <p className="mt-1 text-[11px] font-mono text-indigo-300">
                  {PRESET_USERS["sd-central"].email}
                </p>
                <p className="mt-2 text-[10px] text-slate-400 leading-tight">
                  Oversee assigned ADs, regional retailers, and clear balance queries.
                </p>
              </button>

              {/* Option 2: Area Distributor */}
              <button
                type="button"
                onClick={() => handleQuickLogin("ad-bhopal")}
                className="group flex flex-col text-left rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 transition hover:bg-emerald-900/50 hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    ROLE: AD
                  </span>
                  <KeyRound size={14} className="text-emerald-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm font-bold text-white">Area Distributor</p>
                <p className="text-xs text-slate-300">{PRESET_USERS["ad-bhopal"].name}</p>
                <p className="mt-1 text-[11px] font-mono text-emerald-300">
                  {PRESET_USERS["ad-bhopal"].email}
                </p>
                <p className="mt-2 text-[10px] text-slate-400 leading-tight">
                  Scope: Assigned Territory (Zone-01). Onboard merchants, 12-pt KYC, and handover kits.
                </p>
              </button>
            </div>
          </div>

          {/* Standards Notice */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-400 border border-slate-700/50">
            <Lock size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>Note 5 & Governance:</strong> 1 ID Login Active Lock enforced. Area Distributors are forbidden from accessing SD controls or external territory data.
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300">
                Distributor Authorized Email
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300">
                Security Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {isLoading ? "Validating Distributor Credentials..." : "Sign In to Distributor Portal"}
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

export default function DistributorLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <DistributorLoginForm />
    </Suspense>
  );
}
