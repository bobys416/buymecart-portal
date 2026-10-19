"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gauge,
  Landmark,
  Layers,
  Lock,
  Menu,
  Receipt,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type Portal = "admin" | "distributor" | "retailer";

interface SubMenuItem {
  label: string;
  tab: string;
}

interface MenuItem {
  title: string;
  slug: string;
  icon: React.ElementType;
  submenus?: SubMenuItem[];
}

const adminNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  {
    title: "Merchant",
    slug: "merchants",
    icon: Users,
    submenus: [
      { label: "Search Merchant", tab: "search" },
      { label: "Create Merchant", tab: "create" },
      { label: "Create Merchant KYC", tab: "create-kyc" },
      { label: "View Merchant", tab: "view" },
      { label: "Merchant Channel", tab: "channel" },
      { label: "Password Resends", tab: "passwords" },
      { label: "Activate Merchants", tab: "activate" },
      { label: "Daily Merchants Balance", tab: "balances" },
    ],
  },
  {
    title: "Payment",
    slug: "payments",
    icon: CreditCard,
    submenus: [
      { label: "Authorize Payments", tab: "authorize" },
      { label: "Reverse Payments (Refund)", tab: "reverse" },
      { label: "Initiate Payments", tab: "initiate" },
      { label: "Payment Report", tab: "report" },
      { label: "Payment Status Report", tab: "status-report" },
      { label: "Reversal Report", tab: "reversal-report" },
      { label: "Approve Settlement", tab: "settlement" },
      { label: "Network Payment Report", tab: "network-report" },
    ],
  },
  {
    title: "Managed Products",
    slug: "managed-products",
    icon: Layers,
    submenus: [
      { label: "Online Transactions (Table)", tab: "transactions" },
      { label: "Map Products", tab: "map" },
      { label: "Merge Products", tab: "merge" },
      { label: "Circlewise Products", tab: "circles" },
      { label: "Manage Bank Accounts", tab: "bank-accounts" },
      { label: "Manage Bank Charges", tab: "bank-charges" },
      { label: "Manage Pending PAN Agents", tab: "pan-agents" },
      { label: "Manage Pending PAN Coupons", tab: "pan-coupons" },
      { label: "Manage User Sign up", tab: "signups" },
    ],
  },
  {
    title: "Compliance",
    slug: "compliance",
    icon: ShieldCheck,
    submenus: [
      { label: "Pending Onboarding", tab: "pending-onboarding" },
      { label: "Pending Accounts", tab: "pending-accounts" },
      { label: "KYC List (12-Pt)", tab: "kyc-list" },
      { label: "Account List", tab: "account-list" },
      { label: "Authorize Products", tab: "auth-products" },
      { label: "Payout Merchants", tab: "payout-merchants" },
      { label: "PA Merchants", tab: "pa-merchants" },
      { label: "Modify Location", tab: "location" },
      { label: "AEPS Status", tab: "aeps-status" },
      { label: "Merchant Activity", tab: "activity" },
    ],
  },
  {
    title: "Reports (12 Reports)",
    slug: "reports",
    icon: FileText,
    submenus: [
      { label: "1. Account Ledger (RMN)", tab: "account-ledger" },
      { label: "2. View Wallet Ledger", tab: "wallet-ledger" },
      { label: "3. View Transactions", tab: "view-transactions" },
      { label: "4. AEPS Transactions", tab: "aeps-transactions" },
      { label: "5. AEPS Wallet Settlement", tab: "aeps-wallet-settlement" },
      { label: "6. DMT Transactions", tab: "dmt-transactions" },
      { label: "7. Credit Card Reports", tab: "card-transactions" },
      { label: "8. AEPS Bank Settlement", tab: "aeps-bank-settlement" },
      { label: "9. DMT PPI Transactions", tab: "dmt-ppi" },
      { label: "10. DMT Fino Transactions", tab: "dmt-fino" },
      { label: "11. Payout Report", tab: "payout-report" },
      { label: "12. PA & UPI PA Report", tab: "pa-report" },
    ],
  },
  {
    title: "Modifications",
    slug: "modifications",
    icon: Zap,
    submenus: [
      { label: "Tempered Margin (Plan)", tab: "commercial" },
      { label: "Modify Mobile (RMN)", tab: "mobile" },
      { label: "Change Mapping", tab: "mapping" },
      { label: "Modify Profile", tab: "profile" },
      { label: "Commercial Templates", tab: "commercial-template" },
      { label: "Service Templates", tab: "service-templates" },
      { label: "Prime Products (Payart/UPI)", tab: "prime-products" },
      { label: "Update Notification", tab: "notifications" },
    ],
  },
  {
    title: "Support",
    slug: "support",
    icon: CircleHelp,
    submenus: [
      { label: "Open Tickets", tab: "open" },
      { label: "Book Ticket", tab: "book" },
      { label: "Ticket Status", tab: "status" },
      { label: "Ticket List", tab: "list" },
      { label: "Update Contact Us", tab: "contact" },
    ],
  },
  { title: "Channel Reports", slug: "channel-reports", icon: TrendingUp },
];

const distributorNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  { title: "Onboard Retailer (AD)", slug: "onboarding", icon: UserPlusIcon },
  { title: "Retailer Network", slug: "network", icon: Users },
  { title: "Payment Requests", slug: "payments", icon: CreditCard },
  { title: "Clear Balance Queries", slug: "balance", icon: Wallet },
  { title: "Commercials & Share", slug: "commercials", icon: Zap },
  { title: "Support & Escalations", slug: "support", icon: CircleHelp },
];

const retailerNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  { title: "Start Payment", slug: "payments", icon: CreditCard },
  { title: "Enabled Services", slug: "services", icon: Landmark },
  { title: "Receipts (No Logo)", slug: "receipts", icon: Receipt },
  { title: "Transaction History", slug: "transactions", icon: FileText },
  { title: "Support Tickets", slug: "support", icon: CircleHelp },
  { title: "Account & Security", slug: "security", icon: ShieldCheck },
];

function UserPlusIcon(props: any) {
  return <Users {...props} />;
}

export function PortalShell({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "";

  // Dropdown open states for modules
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    merchants: true,
    payments: true,
    "managed-products": false,
    compliance: false,
    reports: false,
    modifications: false,
    support: false,
  });

  const toggleDropdown = (slug: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const currentNav =
    portal === "admin"
      ? adminNavigation
      : portal === "distributor"
      ? distributorNavigation
      : retailerNavigation;

  const portalDetails = {
    admin: {
      name: "Admin Master Portal",
      roleBadge: "CRM Platform Root",
      accent: "bg-sky-600",
      host: "admin.buymecart.org",
    },
    distributor: {
      name: "Distributor Portal",
      roleBadge: "Shared SD / AD",
      accent: "bg-indigo-600",
      host: "distributor.buymecart.org",
    },
    retailer: {
      name: "Retailer Portal",
      roleBadge: "Merchant Operator",
      accent: "bg-emerald-600",
      host: "retailer.buymecart.org",
    },
  }[portal];

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#152238]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className={`grid h-9 w-9 place-items-center rounded-lg ${portalDetails.accent} text-white shadow-sm`}>
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-navy text-sm">BUYMECART</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] text-slate-600 font-bold">
                  {portalDetails.host}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{portalDetails.name}</p>
            </div>
          </div>
        </div>

        {/* Center / Action Bar: Top Triggers (Page 1 Header) */}
        <div className="hidden xl:flex items-center gap-2.5">
          <Link
            href="/admin/payments?tab=initiate"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <Send size={13} className="text-navy" /> Payout
          </Link>
          <Link
            href="/admin/payments?tab=settlement"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <FileSpreadsheet size={13} className="text-navy" /> Bulk Payment
          </Link>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
            DEMO DATA · PHASE 1
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Lock size={12} className="text-slate-500" /> 1 ID Login Lock (Note 5)
          </span>
        </div>

        {/* Right: Portal Switcher Pill & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <Link
              href="/admin/dashboard"
              className={`rounded px-2.5 py-1 transition ${
                portal === "admin" ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:text-navy"
              }`}
            >
              Admin
            </Link>
            <Link
              href="/distributor/dashboard"
              className={`rounded px-2.5 py-1 transition ${
                portal === "distributor" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-navy"
              }`}
            >
              Distributor
            </Link>
            <Link
              href="/retailer/dashboard"
              className={`rounded px-2.5 py-1 transition ${
                portal === "retailer" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-navy"
              }`}
            >
              Retailer
            </Link>
          </div>

          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white">
            {portal === "admin" ? "AD" : portal === "distributor" ? "SD" : "RT"}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } fixed inset-y-0 left-0 top-16 z-30 w-72 border-r border-slate-200 bg-white p-4 shadow-xl overflow-y-auto lg:static lg:block lg:min-h-[calc(100vh-4rem)] lg:w-72 lg:p-4 lg:shadow-none`}
        >
          <div className="mb-4 px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {portalDetails.roleBadge} Modules
            </p>
          </div>

          <nav className="space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const hasSub = item.submenus && item.submenus.length > 0;
              const isSectionActive = pathname.startsWith(`/${portal}/${item.slug}`);
              const isOpen = openDropdowns[item.slug] ?? isSectionActive;

              if (!hasSub) {
                return (
                  <Link
                    key={item.title}
                    href={`/${portal}/${item.slug}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      isSectionActive
                        ? "bg-navy text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-navy"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.title}</span>
                  </Link>
                );
              }

              // Accordion Item with Submenus
              return (
                <div key={item.title} className="space-y-1">
                  <div
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      isSectionActive
                        ? "bg-slate-100 text-navy font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-navy"
                    }`}
                  >
                    <Link
                      href={`/${portal}/${item.slug}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Icon size={17} className={isSectionActive ? "text-navy" : "text-slate-500"} />
                      <span>{item.title}</span>
                    </Link>
                    <button
                      onClick={() => toggleDropdown(item.slug)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      aria-label={`Toggle ${item.title}`}
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>

                  {/* Submenu Dropdown Items */}
                  {isOpen && (
                    <div className="ml-5 space-y-0.5 border-l-2 border-slate-200 pl-3 pt-1 pb-1">
                      {item.submenus!.map((sub) => {
                        const isSubActive =
                          pathname === `/${portal}/${item.slug}` &&
                          (currentTab === sub.tab || (!currentTab && sub.tab === item.submenus![0].tab));

                        return (
                          <Link
                            key={sub.label}
                            href={`/${portal}/${item.slug}?tab=${sub.tab}`}
                            className={`block rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                              isSubActive
                                ? "bg-navy text-white font-bold shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-navy"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer in Sidebar */}
          <div className="mt-8 border-t border-slate-200 px-3 pt-4 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-600">BSpark Digitized Engine</p>
            <p className="mt-0.5">Tempered Plan (Margin) active</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
