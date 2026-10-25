"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Clock,
  FileText,
  LifeBuoy,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Ticket,
  X,
} from "lucide-react";
import { mockSupportTickets, mockPaymentTransactions } from "@/lib/mock-data";
import { SupportTicket } from "@/lib/types";

interface AdminSupportModuleProps {
  initialTab?: string;
}

export function AdminSupportModule({ initialTab = "open" }: AdminSupportModuleProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [tickets, setTickets] = useState<SupportTicket[]>(mockSupportTickets);
  const [ticketSearch, setTicketSearch] = useState("");

  // Book Ticket Form State (Page 4 Exact Fields: Complaint Type, Complaint Category, Transaction ID, Remarks)
  const [bookForm, setBookForm] = useState({
    complaintType: "Payment Related" as const,
    complaintCategory: "Disputed Transaction / Chargeback",
    transactionId: "BMC-20261019-04",
    remarks: "",
  });
  const [bookSuccess, setBookSuccess] = useState(false);

  const handleBookTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTkt: SupportTicket = {
      id: `TCK-${Date.now().toString().slice(-4)}`,
      ticketNumber: `TKT-20261019-${Math.floor(10 + Math.random() * 90)}`,
      complaintType: bookForm.complaintType,
      complaintCategory: bookForm.complaintCategory,
      transactionId: bookForm.transactionId,
      portalRole: "admin",
      raisedBy: "Main Admin Helpdesk",
      rmn: "9876543210",
      subject: `${bookForm.complaintCategory} - Ref: ${bookForm.transactionId}`,
      remarks: bookForm.remarks || "Administrative escalation initiated.",
      status: "Open",
      priority: "High",
      createdAt: "Just now",
      slaRemaining: "4h 00m",
    };

    setTickets([newTkt, ...tickets]);
    setBookSuccess(true);
    setTimeout(() => {
      setBookSuccess(false);
      setActiveTab("open");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              PDF Page 4 Module 5
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Main Admin CRM → Support & Dispute Resolution
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-navy">Support & Ticket Operations</h1>
          <p className="text-xs text-slate-500">
            Track operational queries, resolve chargeback disputes, and manage bank complaints.
          </p>
        </div>

        {/* Submenu Tabs Navigation */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: "open", label: "Open Tickets" },
            { id: "book", label: "Book Ticket" },
            { id: "status", label: "Ticket Status" },
            { id: "list", label: "Ticket List" },
            { id: "contact", label: "Update Contact Us" },
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

      {/* 1. OPEN TICKETS TAB */}
      {activeTab === "open" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">Open & High-Priority Disputes</h2>
              <p className="text-xs text-slate-500">Live SLA tickets pending administrative review or banking clearance.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search ticket #, subject, raised by..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                />
                {ticketSearch && (
                  <button
                    type="button"
                    onClick={() => setTicketSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear ticket search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Tickets
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {tickets
              .filter((t) => t.status === "Open" || t.status === "In Progress")
              .filter((t) => {
                if (!ticketSearch) return true;
                const q = ticketSearch.toLowerCase();
                return (
                  t.ticketNumber.toLowerCase().includes(q) ||
                  t.subject.toLowerCase().includes(q) ||
                  t.raisedBy.toLowerCase().includes(q) ||
                  t.rmn.includes(q) ||
                  t.complaintType.toLowerCase().includes(q) ||
                  t.remarks.toLowerCase().includes(q)
                );
              })
              .map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy">{t.ticketNumber}</span>
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                      {t.complaintType}
                    </span>
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                      SLA: {t.slaRemaining}
                    </span>
                  </div>
                  <h3 className="mt-1 font-bold text-slate-800">{t.subject}</h3>
                  <p className="text-xs text-slate-500">Raised by: {t.raisedBy} ({t.rmn})</p>
                  <p className="mt-1 text-xs italic text-slate-600">Remarks: "{t.remarks}"</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {t.status}
                  </span>
                  <button
                    onClick={() => {
                      setTickets((prev) =>
                        prev.map((item) => (item.id === t.id ? { ...item, status: "Resolved", slaRemaining: "Completed" } : item))
                      );
                    }}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. BOOK TICKET TAB (Page 4 Exact Fields: Complaint Type, Complaint Category, Transaction ID, Remarks) */}
      {activeTab === "book" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3">
            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              Page 4 Exact Schema
            </span>
            <h2 className="mt-1 text-base font-bold text-navy">
              Book Ticket: Complaint Type → Category → Transaction ID → Remarks
            </h2>
            <p className="text-xs text-slate-500">
              Complaint Types: Transaction Related | Service Related | Payment Related.
            </p>
          </div>

          <form onSubmit={handleBookTicket} className="mt-5 max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Complaint Type *</label>
              <select
                value={bookForm.complaintType}
                onChange={(e) =>
                  setBookForm({ ...bookForm, complaintType: e.target.value as typeof bookForm.complaintType })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-navy"
              >
                <option value="Transaction Related">Transaction Related</option>
                <option value="Service Related">Service Related</option>
                <option value="Payment Related">Payment Related</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Complaint Category *</label>
              <select
                value={bookForm.complaintCategory}
                onChange={(e) => setBookForm({ ...bookForm, complaintCategory: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              >
                <option>Disputed Transaction / Chargeback</option>
                <option>Bank Server Timeout (UIDAI / NPCI)</option>
                <option>Pending Beneficiary Settlement</option>
                <option>Biometric Scanner Driver Issue</option>
                <option>Wallet Balance Mismatch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Associated Transaction ID</label>
              <select
                value={bookForm.transactionId}
                onChange={(e) => setBookForm({ ...bookForm, transactionId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono"
              >
                {mockPaymentTransactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.id} — {tx.retailerName} ({tx.service})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600">Customer & Bank Remarks *</label>
              <textarea
                rows={3}
                required
                placeholder="Detailed explanation of the issue, customer statement, and bank response..."
                value={bookForm.remarks}
                onChange={(e) => setBookForm({ ...bookForm, remarks: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-xs outline-none focus:border-sky-500"
              />
            </div>

            {bookSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Support ticket created and assigned to operations SLA queue.
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Ticket size={15} /> Book Ticket in System
            </button>
          </form>
        </div>
      )}

      {/* 3. TICKET LIST TAB */}
      {activeTab === "list" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy">All Support Tickets Archive</h2>
              <p className="text-xs text-slate-500">Historical repository of all merchant and banking dispute tickets.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search archive tickets..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-48 bg-transparent text-xs text-slate-800 outline-none"
                />
                {ticketSearch && (
                  <button
                    type="button"
                    onClick={() => setTicketSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear archive search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Search size={12} /> Search Archive
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {tickets
              .filter((t) => {
                if (!ticketSearch) return true;
                const q = ticketSearch.toLowerCase();
                return (
                  t.ticketNumber.toLowerCase().includes(q) ||
                  t.subject.toLowerCase().includes(q) ||
                  t.raisedBy.toLowerCase().includes(q) ||
                  t.status.toLowerCase().includes(q) ||
                  t.remarks.toLowerCase().includes(q)
                );
              })
              .map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-navy">{t.ticketNumber}</p>
                  <p className="text-xs text-slate-700">{t.subject}</p>
                  <p className="text-[11px] text-slate-400">Created: {t.createdAt} · Raised By: {t.raisedBy}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  t.status === "Resolved"
                    ? "bg-emerald-100 text-emerald-800"
                    : t.status === "Open"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. UPDATE CONTACT US TAB (Page 4 Submenu) */}
      {activeTab === "contact" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-base font-bold text-navy">Update Contact Us Coordinates</h2>
          <div className="mt-4 max-w-lg space-y-3 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-600">Helpdesk Phone</label>
              <input type="text" defaultValue="1800-BUYME-CART (Toll Free)" className="mt-1 w-full rounded border p-2" />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600">Escalation Email</label>
              <input type="text" defaultValue="support@buymecart.org" className="mt-1 w-full rounded border p-2" />
            </div>
            <button className="rounded bg-navy px-4 py-2 font-bold text-white">Save Coordinates</button>
          </div>
        </div>
      )}
    </div>
  );
}

