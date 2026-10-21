# BuyMeCart + IBNK Unified Mobile Architecture
## Android & iOS React Native Application Engine (`mobile/`)

This document outlines the multi-platform mobile application architecture for BuyMeCart + IBNK, encompassing the React Native codebase, shared monorepo packages, offline-first data model, biometrics, and zero dummy data philosophy.

---

## 1. Multi-Platform Monorepo Architecture

The mobile application is located in `mobile/` and is built using React Native with Expo SDK 52, TypeScript, and modern component architecture. It operates alongside the Next.js web application through shared packages in `packages/`.

```
buymecart-platform/
├── app/                        # Next.js 15 App Router Web Portals
├── components/                 # Web UI Components & Modules
├── packages/                   # Cross-Platform Shared Packages
│   ├── shared-types/           # TypeScript domain entities & contracts
│   ├── business-logic/         # Statutory Margin calculations, validators
│   ├── design-tokens/          # Midnight Navy + Electric Teal color tokens
│   ├── validation/             # Zod validation schemas
│   └── api-client/             # Platform-agnostic API client with offline queue
├── mobile/                     # React Native + Expo Application
│   ├── app.json                # App identity: org.buymecart.mobile
│   ├── package.json            # React Native dependencies
│   ├── tsconfig.json           # Native TypeScript configuration
│   ├── App.tsx                 # Application root & authentication state
│   └── src/
│       ├── components/         # Native UI widgets, EmptyState, Receipts
│       ├── navigation/         # Tab & Stack navigators
│       ├── screens/            # Commerce, IBNK, & AI Operations screens
│       └── services/           # Secure storage, Biometrics, Offline sync
```

---

## 2. App Identifiers & Bundle Configurations

- **Application Name:** `BuyMeCart + IBNK`
- **Android Package:** `org.buymecart.mobile`
- **iOS Bundle Identifier:** `org.buymecart.mobile`
- **Target OS Versions:** Android 10+ (API Level 29+), iOS 15.0+
- **Orientation:** Portrait locked for operational handheld POS & smartphone stability

---

## 3. Shared Packages Integration

The mobile application consumes verified logic directly from the shared packages layer:

1. **`@buymecart/shared-types`**: Single source of truth for domain models including `User`, `Product`, `Order`, `DmtTransferPayload`, `AepsTransactionPayload`, `NeutralReceiptData`, `RiskCase`, and `AiTelemetrySummary`.
2. **`@buymecart/business-logic`**: Shared financial computation engine including:
   - `calculateTemperedMarginFee(amount)`: PDF Page 3 statutory formula:
     - Slab 1 (₹100–₹1,000): Fixed ₹3.50 fee
     - Slab 2 (₹1,001–₹2,000): Fixed ₹5.00 fee
     - Slab 3+ (>₹2,000): Variable 0.45% uncapped
   - Validators: `validateUPIVpa`, `validateIFSC`, `validateAccountNumber`, `validateIndianMobile`.
   - `generateNeutralReceipt`: Note 1 compliant neutral whitelabel receipt data generator.
3. **`@buymecart/design-tokens`**: Unified theme tokens ensuring identical visual fidelity between mobile and web (`#0B1530` Midnight Navy, `#12C8B4` Electric Teal).
4. **`@buymecart/validation`**: Zod schemas for input validation before network dispatch.
5. **`@buymecart/api-client`**: Handles JWT bearer management, offline queueing, and network state detection.

---

## 4. Mobile Screen Directory & Functional Modules

The mobile app implements 17 dedicated screens organized into functional navigators:

### A. Authentication & Onboarding
- `OnboardingScreen`: Platform features, biometric quick login setup.
- `AuthScreen`: Phone number / password authentication with OTP fallback.
- `ForgotPasswordScreen`: Aadhaar-linked OTP password recovery.

### B. Retail E-Commerce
- `HomeScreen`: Product catalog, quick actions, promotional balance.
- `ProductDetailScreen`: Product specifications, inventory availability, cart additions.
- `CartCheckoutScreen`: Cart breakdown with live Tempered Margin calculations and shipping entry.
- `OrderTrackingScreen`: Order status milestones (Pending, Packed, Shipped, Delivered).

### C. IBNK Digital Financial Services
- `IbnkOverviewScreen`: Financial services launcher (DMT, AEPS, BBPS, UPI, Micro-ATM).
- `TransactionsScreen`: Searchable, filterable transaction history with status filters.
- `TransactionDetailScreen`: Full transaction breakdown, UTR reference, dispute filing.
- `ServiceStatusScreen`: Live gateway uptime telemetry (NPCI, Banks, Billers).
- `DisputeRequestScreen`: Chargeback and failed transaction resolution submission.

### D. AI Copilot & Risk Review (Section 10)
- `MobileAiDashboardScreen`: System health, inference latency, anomaly scores, local runtime status.
- `MobileAiAlertsScreen`: High-priority fraud and transaction anomaly notifications.
- `MobileRiskReviewScreen`: Maker-checker risk case review, flagged transaction approvals.
- `MobileApprovalsScreen`: Pending payout and bulk transfer dual-authorization.
- `MobileAiSupportAssistantScreen`: Natural language operational assistant powered by local AI runtime.

---

## 5. Note 1 Neutral Whitelabel Receipt Engine

In accordance with PDF Page 1 Note 1, the mobile component `mobile/src/components/ReceiptView.tsx`:
- Strictly renders BuyMeCart and IBNK platform identifiers.
- Excludes all third-party sponsor logos, acquiring bank logos (e.g. SBI, HDFC, ICICI), and promotional marketing.
- Renders statutory audit metadata: Transaction Reference ID, UTR, Terminal ID, Agent ID, Date/Time, Beneficiary Masked Account, Amount, Service Fee, and NPCI Response Code.

---

## 6. Offline-First Resilience & Biometric Dual-Auth

- **Offline Mutation Queue:** Requests made without network connectivity are encrypted and queued in local SQLite storage. When connectivity resumes, `OfflineManager` processes the queue sequentially with idempotent request headers.
- **Biometric Integration:** Uses `expo-local-authentication` to support Fingerprint, Face ID, and device credential fallback for privileged actions (approvals > ₹50,000, password changes, maker-checker authorization).
- **Zero Dummy Data:** When network stores are empty, screens render high-contrast, informative `EmptyState` views with clear actionable instructions rather than misleading placeholder data.

