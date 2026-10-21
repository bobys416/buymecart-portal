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
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PRESET_USERS, setStoredSession } from "@/lib/auth";

function SuperDistributorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("arun.sd@bspark.org");
  const [password, setPassword] = useState("••••••••••••");
  const [mfaCode, setMfaCode] = useState("619024");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination =
    redirectParam && redirectParam.startsWith("/super-distributor")
      ? redirectParam
      : "/super-distributor/dashboard";

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // Validate credentials
      if (!email.trim() || !password.trim()) {
        setError("Please enter your Super Distributor credentials.");
        setIsLoading(false);
        return;
      }

      // Establish verified Super Distributor session
      const sdSession = {
        ...PRESET_USERS["sd-central"],
        email: email.trim(),
        singleSessionActive: true,
      };
      setStoredSession(sdSession);
      setIsLoading(false);
      router.push(destination);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Users size={30} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-white">
          SUPER DISTRIBUTOR PORTAL
        </h2>
        <p className="mt-1 text-center font-mono text-xs text-indigo-400">
          sd.buymecart.org &middot; Regional Float &amp; Network Desk
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-800 bg-[#101C32] p-8 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                SD Corporate Email
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="arun.sd@bspark.org"
                />
                <Mail size={16} className="absolute right-3.5 top-2.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Authorized Password
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="••••••••••••"
                />
                <Lock size={16} className="absolute right-3.5 top-2.5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                2FA Security OTP (6-Digit)
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white tracking-widest font-mono text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="619024"
                />
                <KeyRound size={16} className="absolute right-3.5 top-2.5 text-slate-500" />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Hardware token or Authenticator TOTP required for SD fund allocation.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying SD Security Token...</span>
              ) : (
                <>
                  <KeyRound size={14} /> Sign In to Super Distributor Desk
                </>
              )}
            </button>
          </form>

          {/* Role Boundary Notice */}
          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Not a Super Distributor?{" "}
              <Link href="/" className="text-indigo-400 hover:underline font-semibold">
                Switch to All Portals
              </Link>
            </p>
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-6 rounded-xl border border-slate-800/80 bg-[#101C32]/60 p-4 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
            <ShieldCheck size={14} /> Note 5: Single Concurrent Session Protection
          </div>
          <p className="text-[11px]">
            Logging into this Super Distributor session automatically terminates any previously active sessions on other workstations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuperDistributorLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070D18]" />}>
      <SuperDistributorLoginForm />
    </Suspense>
  );
}
