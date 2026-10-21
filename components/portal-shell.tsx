"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Bot,
  Brain,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Network,
  PackageCheck,
  Receipt,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  clearStoredSession,
  getStoredSession,
  ROLE_DISPLAY_NAMES,
  ROLE_HIERARCHY,
  UserSession,
  validatePortalAccess,
} from "@/lib/auth";
import { FloatingAiChatbot } from "@/components/ai/floating-ai-chatbot";

export type Portal =
  | "admin"
  | "super-distributor"
  | "area-distributor"
  | "retailer"
  | "distributor";

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

// 1. ADMIN NAVIGATION
const adminNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  {
    title: "Super Distributors",
    slug: "super-distributors",
    icon: Building2,
    submenus: [
      { label: "Directory & Performance", tab: "directory" },
      { label: "Create Super Distributor", tab: "create" },
      { label: "Roles & Limits Governance", tab: "permissions" },
      { label: "Funds & Commissions", tab: "funds" },
    ],
  },
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
    title: "Reports",
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
  {
    title: "API Integration & Management",
    slug: "api-management",
    icon: Network,
    submenus: [
      { label: "A. API Overview", tab: "overview" },
      { label: "B. API Provider Registry", tab: "providers" },
      { label: "C. API Connection Configuration", tab: "connections" },
      { label: "D. API Service Mapping", tab: "service-mapping" },
      { label: "E. API Testing & Sandbox", tab: "sandbox" },
      { label: "F. API Product Builder", tab: "products" },
      { label: "G. Developer & Client Management", tab: "clients" },
      { label: "H. API Analytics & Billing", tab: "analytics" },
      { label: "I. API Security & Audit", tab: "security" },
      { label: "J. API Keys & Services Manager", tab: "key-manager" },
    ],
  },
  {
    title: "AI Control Centre",
    slug: "ai-centre",
    icon: Brain,
    submenus: [
      { label: "1. AI Overview & Status", tab: "overview" },
      { label: "2. Admin AI Copilot", tab: "copilot" },
      { label: "3. Banking Risk & Fraud", tab: "risk-fraud" },
      { label: "4. AI Models & Runtime", tab: "models" },
      { label: "5. Agent Workflows", tab: "workflows" },
      { label: "6. MCP Servers & Tools", tab: "mcp-tools" },
      { label: "7. Privileged Approvals", tab: "approvals" },
      { label: "8. AI Policies & Permissions", tab: "policies" },
      { label: "9. AI Audit & Observability", tab: "audit-logs" },
    ],
  },
];

// 2. SUPER DISTRIBUTOR NAVIGATION
const superDistributorNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  { title: "Area Distributors (ADs)", slug: "ad-network", icon: Users },
  { title: "Subordinate Retailers", slug: "retailers", icon: Building2 },
  { title: "Clear Balance Queries", slug: "balance-queries", icon: Wallet },
  { title: "Escalate to Admin", slug: "escalations", icon: CircleHelp },
  { title: "Regional Commercials", slug: "commercials", icon: Zap },
];

// 3. AREA DISTRIBUTOR NAVIGATION
const areaDistributorNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  { title: "Retailer Onboarding", slug: "onboarding", icon: Users },
  { title: "Process KYC & vKYC", slug: "kyc-flow", icon: Video },
  { title: "Retailer Kit Handovers", slug: "kits", icon: PackageCheck },
  { title: "Retailer Network", slug: "network", icon: MapPin },
  { title: "Payment Queries", slug: "queries", icon: CircleHelp },
];

// 4. RETAILER NAVIGATION
const retailerNavigation: MenuItem[] = [
  { title: "Dashboard", slug: "dashboard", icon: Gauge },
  { title: "Start Payment", slug: "payments", icon: CreditCard },
  { title: "Enabled Services", slug: "services", icon: Landmark },
  { title: "Receipts", slug: "receipts", icon: Receipt },
  { title: "Transaction History", slug: "transactions", icon: FileText },
  { title: "Support Tickets", slug: "support", icon: CircleHelp },
  { title: "Account & Security", slug: "security", icon: ShieldCheck },
];

export function PortalShell({
  portal,
  children,
}: {
  portal: Portal;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Dropdown open states for accordion items
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    "super-distributors": true,
    merchants: true,
    payments: false,
    "managed-products": false,
    compliance: false,
    reports: false,
    modifications: false,
    support: false,
    "api-management": false,
    "ai-centre": false,
  });

  // Resolve session and sidebar preferences
  useEffect(() => {
    const activeSession = getStoredSession(portal);
    setSession(activeSession);
    setAuthChecked(true);

    try {
      const savedCollapse = localStorage.getItem("buymecart_sidebar_collapsed");
      if (savedCollapse === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignore
    }
  }, [portal]);

  // Mobile drawer Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("buymecart_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleDropdown = (slug: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const q = encodeURIComponent(globalSearch.trim());
    if (portal === "admin") {
      router.push(`/admin/merchants?tab=search&q=${q}`);
    } else if (portal === "super-distributor") {
      router.push(`/super-distributor/retailers?q=${q}`);
    } else if (portal === "area-distributor") {
      router.push(`/area-distributor/network?q=${q}`);
    } else {
      router.push(`/retailer/transactions?q=${q}`);
    }
  };

  const handleLogout = () => {
    clearStoredSession(portal);
    router.push(`/${portal}/login`);
  };

  // Determine current navigation based on portal
  let currentNav: MenuItem[] = adminNavigation;
  if (portal === "super-distributor") {
    currentNav = superDistributorNavigation;
  } else if (portal === "area-distributor") {
    currentNav = areaDistributorNavigation;
  } else if (portal === "retailer") {
    currentNav = retailerNavigation;
  } else if (portal === "distributor") {
    currentNav =
      session?.role === "sd" ? superDistributorNavigation : areaDistributorNavigation;
  }

  const portalDetails = {
    admin: {
      name: "Admin Master Portal",
      roleBadge: "Root Administrator",
      host: "admin.buymecart.org",
      badgeColor: "bg-[#101C32] text-[#16B8A6] border border-[#16B8A6]/30",
    },
    "super-distributor": {
      name: "Super Distributor Portal",
      roleBadge: "Super Distributor (SD)",
      host: "sd.buymecart.org",
      badgeColor: "bg-[#101C32] text-[#16B8A6] border border-[#16B8A6]/30",
    },
    "area-distributor": {
      name: "Area Distributor Portal",
      roleBadge: "Area Distributor (AD)",
      host: "ad.buymecart.org",
      badgeColor: "bg-[#101C32] text-[#16B8A6] border border-[#16B8A6]/30",
    },
    retailer: {
      name: "Retailer Portal",
      roleBadge: "Merchant Operator",
      host: "retailer.buymecart.org",
      badgeColor: "bg-[#101C32] text-[#16B8A6] border border-[#16B8A6]/30",
    },
    distributor: {
      name: "Distributor Portal",
      roleBadge: session?.role === "sd" ? "Super Distributor (SD)" : "Area Distributor (AD)",
      host: "distributor.buymecart.org",
      badgeColor: "bg-[#101C32] text-[#16B8A6] border border-[#16B8A6]/30",
    },
  }[portal];

  const userInitials = session?.name
    ? session.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "BM";

  // Derive active breadcrumb parts
  // Derive active breadcrumb parts
  const pathParts = pathname.split("/").filter(Boolean);
  const activeSectionSlug = pathParts[1] || "dashboard";
  const activeMenuItem = currentNav.find((m) => m.slug === activeSectionSlug);
  const activeSubItem = activeMenuItem?.submenus?.find((s) => s.tab === currentTab);

  // Check role-based route guard
  const authValidation = authChecked ? validatePortalAccess(session, portal) : { authorized: false };

  // =========================================================
  // 1. MINIMAL LOADING / SPLASH STATE (Prevent Content Flash)
  // =========================================================
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#101C32] text-white flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#16B8A6] to-sky-400 flex items-center justify-center shadow-lg shadow-teal-500/30 animate-pulse">
            <Lock size={22} className="text-[#101C32]" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">
              BUYMECART · IBNK SECURITY
            </h2>
            <p className="text-xs text-teal-300 font-mono mt-1">
              Verifying session identity & role authorizations...
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-[#16B8A6] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // 2. UNAUTHENTICATED REDIRECT STATE (No Valid Session)
  // =========================================================
  if (authChecked && !session) {
    const loginPath = `/${portal}/login`;
    const targetUrl = `${pathname}${currentTab ? `?tab=${currentTab}` : ""}`;
    const redirectUrl = `${loginPath}?redirect=${encodeURIComponent(targetUrl)}`;

    if (typeof window !== "undefined") {
      router.replace(redirectUrl);
    }

    return (
      <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-[#101C32] p-8 shadow-2xl text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-[#16B8A6] border border-teal-500/30">
            <KeyRound size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Protected content on the {portalDetails.name} requires verified credentials. Redirecting to the secure sign-in portal...
          </p>
          <div className="pt-2">
            <Link
              href={redirectUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8A6] px-5 py-2.5 text-xs font-bold text-[#101C32] hover:bg-teal-400 transition"
            >
              Sign In to {portalDetails.roleBadge}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // 3. UNAUTHORIZED ROLE SCREEN (Role-Aware Security Boundary)
  // =========================================================
  if (authChecked && !authValidation.authorized) {
    const userRoleDisplay = session?.role
      ? ROLE_DISPLAY_NAMES[session.role]
      : "Unauthenticated";
    const userPortal = session?.portal || "retailer";

    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#101C32] flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert size={36} />
          </div>

          <div>
            <span className="rounded bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 uppercase tracking-wide">
              Security Boundary Restriction
            </span>
            <h1 className="mt-3 text-xl font-black text-[#101C32]">
              Access Denied: Role Authorization Required
            </h1>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              {authValidation.reason}
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-xs text-left space-y-2">
            <p className="font-bold text-[#101C32]">Active Session Identity:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#64748B]">
              <span>Name: <strong className="text-[#101C32]">{session?.name}</strong></span>
              <span>Active Role: <strong className="text-rose-700">{userRoleDisplay}</strong></span>
              <span>Scope: <strong className="text-[#101C32]">{session?.orgScope}</strong></span>
              <span>Attempted Portal: <strong className="text-[#101C32]">{portal}</strong></span>
            </div>
            <div className="mt-2 border-t border-[#E2E8F0] pt-2 text-[10px] text-[#64748B]">
              <strong>Enforced Hierarchy:</strong> Admin → Super Distributor → Area Distributor → Retailer. Client-side role elevation is strictly prohibited.
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href={`/${userPortal}/dashboard`}
              className="rounded-xl bg-[#101C32] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
            >
              Return to Authorized {userRoleDisplay} Portal
            </Link>
            <Link
              href={`/${portal}/login`}
              className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs font-bold text-[#101C32] hover:bg-[#F5F7FA] transition"
            >
              Sign In as {portalDetails.roleBadge}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#101C32] flex flex-col antialiased">
      {/* ========================================================= */}
      {/* TOP BAR / RESPONSIVE HEADER                               */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-6 shadow-xs">
        {/* Left: Brand & Portal Identifier */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32] lg:hidden transition"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href={`/${portal}/dashboard`} className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#101C32] text-[#16B8A6] shadow-sm font-black">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-[#101C32] text-sm">
                  BUYMECART
                </span>
                <span className="hidden sm:inline-block rounded bg-[#F5F7FA] px-1.5 py-0.5 font-mono text-[10px] text-[#64748B] font-bold border border-[#E2E8F0]">
                  {portalDetails.host}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium hidden sm:block">
                {portalDetails.name}
              </p>
            </div>
          </Link>

          {/* Breadcrumb Context */}
          <div className="hidden xl:flex items-center gap-1.5 pl-4 ml-4 border-l border-[#E2E8F0] text-xs text-[#64748B]">
            <span className="font-semibold text-[#101C32] capitalize">{portal.replace("-", " ")}</span>
            <span>/</span>
            <span className="font-medium">{activeMenuItem?.title || "Dashboard"}</span>
            {activeSubItem && (
              <>
                <span>/</span>
                <span className="font-bold text-[#16B8A6]">{activeSubItem.label}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <form
            onSubmit={handleGlobalSearch}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] pl-3 pr-1 py-1 focus-within:border-[#16B8A6] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#16B8A6] transition"
          >
            <Search size={14} className="text-[#64748B] shrink-0" />
            <input
              type="text"
              placeholder={
                portal === "admin"
                  ? "Search SD, Merchant, TxID, UTR..."
                  : portal === "super-distributor"
                  ? "Search Area Distributor, Retailer..."
                  : portal === "area-distributor"
                  ? "Search Retailer Storefront, RMN..."
                  : "Search TxID, UTR, Service..."
              }
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#101C32] placeholder-[#64748B] outline-none"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch("")}
                className="text-[#64748B] hover:text-[#101C32] p-1"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-[#101C32] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#1a2d52] transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right: Notifications & Current User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#101C32] transition"
              aria-label="View notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#16B8A6]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <h4 className="text-xs font-bold text-[#101C32]">System Notifications</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold">Switch Operational</span>
                </div>
                <div className="py-6 text-center text-xs text-[#64748B]">
                  <p className="font-semibold text-[#101C32]">All systems operating normally</p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    No pending security alerts or system outages recorded.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Authenticated User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0] rounded-xl p-1 hover:bg-[#F5F7FA] transition text-left"
              aria-label="User profile menu"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-[#101C32] truncate max-w-[140px]">
                  {session?.name || portalDetails.roleBadge}
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-[#64748B]">
                  <span className="font-semibold text-[#16B8A6]">{portalDetails.roleBadge}</span>
                </div>
              </div>

              <div
                className="grid h-8 w-8 place-items-center rounded-full bg-[#101C32] text-[#16B8A6] text-xs font-bold shadow-xs border border-[#16B8A6]/40"
                title={session?.name || portal}
              >
                {userInitials}
              </div>
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xl z-50">
                <div className="border-b border-[#E2E8F0] pb-2 mb-2">
                  <p className="text-xs font-bold text-[#101C32]">{session?.name || portalDetails.name}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{session?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-[#F5F7FA] px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] border border-[#E2E8F0]">
                      Scope: {session?.orgScope || "GLOBAL_ROOT"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut size={14} />
                  <span>Sign Out of {portalDetails.name}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN LAYOUT (SIDEBAR + WORKSPACE)                         */}
      {/* ========================================================= */}
      <div className="flex flex-1 relative">
        {/* Mobile Backdrop Overlay (Tap to Dismiss) */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-16 z-20 bg-[#101C32]/50 backdrop-blur-xs lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            fixed inset-y-0 left-0 top-16 z-30 flex flex-col justify-between border-r border-[#1e2e4a] bg-[#101C32] text-white shadow-xl transition-all duration-300 ease-in-out
            lg:static lg:min-h-[calc(100vh-4rem)]
            ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}
          `}
        >
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {/* Sidebar Scope Header */}
            <div className={`px-2 ${sidebarCollapsed ? "text-center" : ""}`}>
              {!sidebarCollapsed ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#16B8A6]">
                      {portalDetails.roleBadge}
                    </span>
                    {session?.orgScope && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                        {session.orgScope}
                      </span>
                    )}
                  </div>
                  {session?.territory && (
                    <p className="mt-1 text-[11px] text-slate-300 flex items-center gap-1 font-medium truncate">
                      <MapPin size={11} className="text-[#16B8A6] shrink-0" />
                      <span className="truncate">{session.territory}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex justify-center" title={`${portalDetails.roleBadge} (${session?.orgScope || ""})`}>
                  <span className="rounded-full bg-[#16B8A6]/20 p-1.5 text-[#16B8A6]">
                    <ShieldCheck size={16} />
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Items List */}
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const hasSub = item.submenus && item.submenus.length > 0;
                const isSectionActive = pathname.startsWith(`/${portal}/${item.slug}`);
                const isOpen = openDropdowns[item.slug] ?? isSectionActive;

                if (!hasSub) {
                  return (
                    <div key={item.title} className="relative group">
                      <Link
                        href={`/${portal}/${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                          sidebarCollapsed ? "justify-center" : ""
                        } ${
                          isSectionActive
                            ? "bg-[#16B8A6] text-[#101C32] font-bold shadow-sm"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </Link>

                      {/* Tooltip on Collapsed Sidebar */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[#101C32] px-2.5 py-1 text-xs font-bold text-white shadow-lg border border-white/20">
                          {item.title}
                        </div>
                      )}
                    </div>
                  );
                }

                // Accordion Item with Submenus
                return (
                  <div key={item.title} className="space-y-1 relative group">
                    <div
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        sidebarCollapsed ? "justify-center" : ""
                      } ${
                        isSectionActive
                          ? "bg-white/15 text-white font-bold border-l-4 border-[#16B8A6]"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Link
                        href={`/${portal}/${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 flex-1 ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 ${isSectionActive ? "text-[#16B8A6]" : "text-slate-300"}`}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                      </Link>

                      {!sidebarCollapsed && (
                        <button
                          onClick={() => toggleDropdown(item.slug)}
                          className="p-1 text-slate-400 hover:text-white"
                          aria-label={`Toggle ${item.title}`}
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Tooltip for Collapsed Sidebar */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 w-52 rounded-xl bg-[#101C32] p-2 shadow-2xl border border-white/20">
                        <p className="px-2 py-1 text-xs font-bold text-[#16B8A6] border-b border-white/10 mb-1">
                          {item.title}
                        </p>
                        <div className="space-y-1">
                          {item.submenus!.map((sub) => (
                            <Link
                              key={sub.label}
                              href={`/${portal}/${item.slug}?tab=${sub.tab}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-lg px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Nested Submenu */}
                    {!sidebarCollapsed && isOpen && (
                      <div className="ml-4 space-y-0.5 border-l border-white/20 pl-3 pt-1 pb-1">
                        {item.submenus!.map((sub) => {
                          const isSubActive =
                            pathname === `/${portal}/${item.slug}` &&
                            (currentTab === sub.tab ||
                              (!currentTab && sub.tab === item.submenus![0].tab));

                          return (
                            <Link
                              key={sub.label}
                              href={`/${portal}/${item.slug}?tab=${sub.tab}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                                isSubActive
                                  ? "bg-[#16B8A6] text-[#101C32] font-bold shadow-xs"
                                  : "text-slate-300 hover:bg-white/10 hover:text-white"
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
          </div>

          {/* Desktop Collapse / Expand Toggle Bar */}
          <div className="hidden lg:flex items-center justify-between border-t border-white/10 p-3">
            {!sidebarCollapsed && (
              <span className="text-[11px] text-slate-400 font-medium">Collapse Navigation</span>
            )}
            <button
              onClick={toggleSidebarCollapse}
              className={`rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition ${
                sidebarCollapsed ? "w-full flex justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </aside>

        {/* Workspace Main Content */}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ========================================================= */}
      {/* FLOATING AI ASSISTANT CHATBOT                             */}
      {/* ========================================================= */}
      <FloatingAiChatbot session={session} portal={portal} />
    </div>
  );
}
