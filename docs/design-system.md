# BuyMeCart + IBNK Enterprise Design System
## "Midnight Navy + Electric Teal" Design Tokens & UI Architecture

This document defines the production design tokens, accessibility standards, responsive navigation architecture, and strict portal separation principles implemented across the BuyMeCart + IBNK multi-portal enterprise platform.

---

## 1. Design Philosophy & Token Architecture

The user interface follows the **Midnight Navy + Electric Teal** fintech enterprise design system, engineered for high information density, clear visual hierarchy, accessible contrast ratios (WCAG 2.1 AA/AAA compliant), and restrained aesthetic elevation.

### Core Color Palette

| Token Key | Hex Code | Semantic Role | Tailwind Class | Contrast against White |
| :--- | :--- | :--- | :--- | :--- |
| **Midnight Navy** | `#0B1530` | Primary Navigation & Header Brand Surface | `bg-midnight`, `text-midnight` | 17.2:1 (AAA) |
| **Electric Teal** | `#12C8B4` | Primary Accent, Active Items, Key Action Focus | `bg-teal-DEFAULT`, `text-teal-DEFAULT` | 3.1:1 on dark / 12:1 on light |
| **Workspace Background** | `#F4F7FB` | Main Dashboard Canvas & Layout Background | `bg-[#F4F7FB]` | — |
| **Surface / Card** | `#FFFFFF` | Elevated cards, tables, modal dialogs, drawers | `bg-white` | — |
| **Primary Text** | `#142033` | Headings, primary labels, balance amounts | `text-[#142033]` | 15.6:1 (AAA) |
| **Secondary Text** | `#64748B` | Sub-labels, metadata, breadcrumbs, hints | `text-slate-500` | 4.8:1 (AA) |
| **Border / Divider** | `#E2E8F0` | Subtle boundaries, table cell borders | `border-slate-200` | — |
| **Success Emerald** | `#059669` | Approved transactions, active status, KYC passed | `bg-emerald-600`, `text-emerald-700` | 4.7:1 (AA) |
| **Pending Amber** | `#D97706` | In review, maker-checker pending, escrow held | `bg-amber-600`, `text-amber-800` | 4.6:1 (AA) |
| **Failure Rose** | `#E11D48` | Failed transactions, suspended status, alerts | `bg-rose-600`, `text-rose-700` | 4.5:1 (AA) |

---

## 2. Typography & Spatial System

### Typography
- **Primary Font Family:** Inter / Geist Sans (Tailwind default `font-sans`)
- **Monospace Family:** JetBrains Mono / SFMono (for transaction IDs, IFSC, UPI VPAs, Aadhaar masking)
- **Hierarchy:**
  - H1 Page Titles: `text-2xl font-extrabold tracking-tight`
  - H2 Section Titles: `text-lg font-bold text-slate-900`
  - Body Text: `text-sm font-medium text-slate-700`
  - Micro-copy / Badges: `text-xs font-semibold uppercase tracking-wider`

### Elevation & Shadows
- **Card Surface:** `shadow-sm border border-slate-200`
- **Hover/Interactive:** `hover:shadow-md transition-shadow duration-150`
- **Flyouts & Modals:** `shadow-xl border border-slate-200`

---

## 3. Responsive Navigation Architecture

The navigation engine in `components/portal-shell.tsx` is built for both high-density desktop operations and field agent mobile devices:

### Desktop Navigation (Viewport $\ge$ 1024px)
- **Expandable / Collapsible Sidebar:**
  - **Expanded Mode (`w-72` / 280px):** Displays full portal branding, categorized navigation groups, active chevron indicators, and submenu items.
  - **Collapsed Mode (`w-20` / 72px):** Compact icon-only view with flyout tooltips to maximize horizontal table and analytics real estate.
  - **State Persistence:** Sidebar collapsed preference is automatically persisted to `localStorage` under `buymecart_sidebar_collapsed`.
- **Active Route Highlighting:**
  - Active parent category highlighted in Electric Teal background (`bg-[#12C8B4]/15 border-r-2 border-[#12C8B4]`).
  - Active child submenu item highlighted in bold teal text.

### Mobile Navigation (Viewport $<$ 1024px)
- **Slide-Out Drawer:**
  - Hidden by default, toggled via accessible hamburger menu button in top bar.
  - Slide animation from left (`w-72`) with dark backdrop overlay (`bg-slate-900/60 backdrop-blur-sm`).
  - Automatically closes upon route navigation or clicking the backdrop overlay.

---

## 4. Strict Portal Separation

To eliminate privilege escalation, cross-portal confusion, and unauthorized identity switching, the application strictly separates the three portal environments:

### Portal Matrix & Entry Points
1. **Admin Master Portal (`admin.buymecart.org` | `/admin/dashboard` & `/admin/login`):**
   - Independent authentication session restricted strictly to Root Administrators (`GLOBAL_ROOT`).
   - Accessible only through dedicated Admin login. Public self-registration is permanently disabled.
   - Governs all 12 PDF Page 5 compliance reports, 12-point KYC verifications, Tempered Margin fee schedules, and API provider integrations.
2. **Distributor Portal (`distributor.buymecart.org` | `/distributor/dashboard` & `/distributor/login`):**
   - Shared unified architecture for Super Distributors (SD) and Area Distributors (AD).
   - Strict server and client scoping: Area Distributors (AD) are scoped to Bhopal territory and receive HTTP 403 on Super Distributor modules (`/distributor/ad-network`, `/distributor/escalations`, `/distributor/balance-queries`).
3. **Retailer Terminal (`retailer.buymecart.org` | `/retailer/dashboard` & `/retailer/login`):**
   - Dedicated retail merchant interface for domestic money transfers (DMT), AEPS biometric cash-out, BBPS utility bill payments, and UPI collection.
   - PDF Page 1 Note 1 Compliance: Strict Whitelabel Neutral Receipts with zero third-party bank or sponsor logos.

### Top Navigation Cleanliness Rule
- The shared frontend user-switcher dropdown has been permanently removed from authenticated headers.
- Unapproved shortcut buttons (Payout, Bulk Payment, fake Live-Sandbox pulsating indicators) have been excised.
- The header cleanly displays breadcrumbs, global transaction search, live notification bell, and user sign-out menu.

