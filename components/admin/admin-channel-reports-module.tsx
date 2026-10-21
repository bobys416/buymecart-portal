"use client";

import React, { useState } from "react";
import { Award, Building2, Download, Search, TrendingUp, Users, X } from "lucide-react";
import { formatINR } from "@/lib/mock-data";

export function AdminChannelReportsModule() {
  const [channelSearch, setChannelSearch] = useState("");
  const channelData = [
    {
      sdName: "Rajeev Mehta (SD-NORTH-01)",
      territory: "North India (Jaipur / Delhi)",
      adCount: 4,
      retailerCount: 28,
      grossVolume: 4250000,
      channelMargin: 17000,
      sdCommission: 5100,
    },
    {
      sdName: "Arun Singh (SD-CENTRAL-01)",
      territory: "Central India Division",
      adCount: 3,
      retailerCount: 19,
      grossVolume: 3120000,
      channelMargin: 12480,
      sdCommission: 3744,
    },
    {
      sdName: "Kishore Patil (SD-WEST-01)",
      territory: "Western Zone (Nagpur / Mumbai)",
      adCount: 5,
      retailerCount: 34,
      grossVolume: 5640000,
      channelMargin: 22560,
      sdCommission: 6768,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 3 & 5 Module 4
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Channel Hierarchy Reports
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Channel Distribution Reports</h1>
          <p className="text-xs text-slate-500">
            Hierarchical volume analytics, downstream performance, and channel commission allocations.
          </p>
        </div>

        <button
          onClick={() => alert("Channel statement exported.")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
        >
          <Download size={14} /> Export Channel Statement
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-bold uppercase text-slate-500">Total Channel Volume</p>
          <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(13010000)}</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">+18.4% monthly growth</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-bold uppercase text-slate-500">Total SD / AD Tiers</p>
          <p className="mt-2 text-2xl font-extrabold text-navy">3 SDs · 12 ADs</p>
          <p className="mt-1 text-xs text-slate-400">81 Active Retailers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-xs font-bold uppercase text-slate-500">Channel Commission Pool</p>
          <p className="mt-2 text-2xl font-extrabold text-navy">{formatINR(52040)}</p>
          <p className="mt-1 text-xs text-slate-400">Tempered margin allocation</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="text-sm font-bold text-navy">Super Distributor Channel Performance</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search SD name, territory..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="w-48 bg-transparent text-xs text-slate-800 outline-none"
              />
              {channelSearch && (
                <button
                  type="button"
                  onClick={() => setChannelSearch("")}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Clear channel search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <Search size={12} /> Search Channels
            </button>
          </div>
        </div>
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Super Distributor</th>
              <th className="px-5 py-3.5">Territory</th>
              <th className="px-5 py-3.5">AD Count</th>
              <th className="px-5 py-3.5">Retailers</th>
              <th className="px-5 py-3.5 font-bold">Gross Channel Volume</th>
              <th className="px-5 py-3.5 font-bold text-navy">SD Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {channelData
              .filter((c) => {
                if (!channelSearch) return true;
                const q = channelSearch.toLowerCase();
                return (
                  c.sdName.toLowerCase().includes(q) ||
                  c.territory.toLowerCase().includes(q)
                );
              })
              .map((c) => (
              <tr key={c.sdName} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-bold text-navy">{c.sdName}</td>
                <td className="px-5 py-4 text-xs text-slate-600">{c.territory}</td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-700">{c.adCount} ADs</td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-700">{c.retailerCount} Retailers</td>
                <td className="px-5 py-4 font-bold text-slate-900">{formatINR(c.grossVolume)}</td>
                <td className="px-5 py-4 font-extrabold text-emerald-700">{formatINR(c.sdCommission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

