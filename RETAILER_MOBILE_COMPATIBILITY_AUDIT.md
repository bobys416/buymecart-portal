# Retailer Mobile Compatibility Audit

## Executive Summary

The repository already contains a mobile application foundation and a shared web application architecture, so the recommended Phase 1 approach is to continue using the existing stack rather than introducing a new framework.

Current state:

- Web application: Next.js + React web app in the root project
- Mobile application: Expo + React Native app in `mobile/`
- Backend: FastAPI service in `backend/` with financial APIs and role-scoped permissions
- Shared packages: workspace packages for API client, design tokens, business logic, validation, and shared types

This is a good foundation for a retailer mobile experience, but it is not yet production-ready for secure fintech transactions. The existing mobile app is a working prototype/shell with screen coverage and security hooks, not a hardened mobile banking app.

## 1) Platform Audit

### Existing technology and app state

| Area | Status | Evidence |
|---|---|---|
| Responsive web application | Yes | Root project uses Next.js `15.1.0` in `package.json`; app shell is designed for responsive browser use. |
| PWA | No | No `manifest.webmanifest`, service worker, install metadata, or PWA-specific configuration found in the repo. |
| Android app | Yes, scaffold exists | `mobile/package.json` uses Expo + React Native; `mobile/app.json` contains Android package `org.buymecart.mobile` and Android permissions. |
| iOS app | Yes, scaffold exists | `mobile/app.json` includes iOS bundle ID, Face ID permission, camera/photo library declarations, and tablet support. |
| Mobile app already exists | Yes | `mobile/App.tsx`, `mobile/src/navigation/RootNavigator.tsx`, and the `mobile/src/screens/` directory show an active Expo app. |

### Architecture assessment

The project already aligns with a layered architecture:

- `next` web app for browser-based portal work
- `mobile` Expo app for native mobile flows
- `backend` FastAPI service as the authoritative financial backend
- Shared workspace packages for business logic and validation

This is the correct approach for a production retailer portal. No new framework should be introduced during Phase 1.

## 2) Mobile UI/UX Requirements Audit

### Current mobile layout coverage

The mobile app already includes screen-level support for the basic flows expected in the retailer experience:

- Login and authentication: `mobile/src/screens/AuthScreen.tsx`
- Retailer dashboard: `mobile/src/screens/RetailerDashboardScreen.tsx`
- Wallet balance and service rail: `mobile/src/screens/RetailerDashboardScreen.tsx`
- KYC / bank status: `mobile/src/screens/RetailerKycStatusScreen.tsx`
- Transaction overview: `mobile/src/screens/TransactionsScreen.tsx`
- Transaction detail: `mobile/src/screens/TransactionDetailScreen.tsx`
- Support/help: `mobile/src/screens/MobileSupportScreen.tsx`
- Profile: `mobile/src/screens/ProfileScreen.tsx`

### Mobile-first requirements assessment

| Requirement | Assessment | Notes |
|---|---|---|
| Login and auth | Partial | Auth screen exists with sign-in/sign-up and biometrics flow. |
| Retailer dashboard | Good foundation | Wallet, services, refresh, quick actions, and modal flows are implemented. |
| Wallet balance cards | Good foundation | Balance summary card is present and formatted for mobile. |
| Recharge products | Partial | Service rails exist, but dedicated product modules are not fully broken out by feature set. |
| Banking products | Partial | Banking flows are represented conceptually but need product-specific screens. |
| BBPS | Partial | Service rail includes BBPS-like entry but no fully structured flow. |
| Payment request | Partial | Exists conceptually in transaction logic; not fully hardened for approval workflow. |
| Payment status | Partial | Transaction history and detail view exist, but full status polling workflow is not explicit. |
| Wallet ledger | Partial | Transaction listing exists; need stronger filtering and deeper ledger semantics. |
| Transaction search | Partial | Search support is not explicitly implemented as a production-grade search workflow. |
| View margins | Partial | Margin concepts exist in transactions but not a dedicated mobile experience. |
| Reports | Partial | Role screens exist, but retailer reporting UX needs stronger mobile presentation. |
| Profile and KYC | Good foundation | KYC and profile screen exist with secure-oriented UX cues. |
| Help Desk | Good foundation | Support screen exists and is structured for mobile help. |

### Mobile design observations

- `MainTabNavigator` is built around role-aware bottom tabs, which is appropriate for native mobile UX.
- `RetailerDashboardScreen` uses `ScrollView`, cards, touchable service blocks, and modal-based flows, which aligns with mobile-first patterns.
- The component style patterns are generally mobile-friendly but still need production hardening for spacing, overflow handling, and accessibility validation.
- Some flows are currently simulated/mock-based and should not be treated as production banking behavior until real backend authorization is wired in.

### Mobile UX gaps

- No explicit drawer navigation pattern for heavier screens
- No centralized responsive table-to-card conversion for large data tables
- No formal swipe gestures, orientation-specific layouts, or tested landscape mode behavior
- Payment confirmation flows need clearer identity, consent, and transaction-status UX
- Accessibility review is still required across forms, modals, buttons, and screen readers

## 3) Android Compatibility Audit

### Android readiness

The app is clearly oriented toward Android:

- `mobile/app.json` includes `package: "org.buymecart.mobile"`
- Android permissions include `CAMERA`, `RECORD_AUDIO`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, and network permissions
- Expo plugins for camera and local authentication are registered
- `SafeAreaView` and `BackHandler` in `RootNavigator` support Android hardware behavior

### Android readiness score: Medium / Partial

Strong areas:

- Native Android package and permissions declared
- Camera access for KYC document capture
- Biometric/auth support declared
- Mobile app entry and navigation structure exists

Gaps:

- No secure app storage abstraction beyond a fallback memory store in `secure-storage.ts`
- No production push notification registration flow
- No root or tamper detection
- No background/foreground lifecycle hardening
- No hardened network failure resume policy beyond an offline queue abstraction
- No real Android device matrix validation yet

### Android-specific recommendations

- Use proper hardware-backed secure storage at the OS level (KeyStore-backed storage via Expo SecureStore / native bridging)
- Add Android lifecycle and session retention policies for app background/foreground transitions
- Validate on small phones, large phones, and tablets
- Add real network retry and transaction resume logic for offline conditions
- Add push notification registration behind backend-provided tokens
- Enforce biometric challenge before high-risk wallet actions

## 4) iOS Compatibility Audit

### iOS readiness

The iOS side is explicitly configured in `mobile/app.json`:

- `supportsTablet: true`
- `bundleIdentifier: "org.buymecart.mobile"`
- Camera authorization strings for KYC
- Microphone usage description for `Video KYC`
- Photo library access description
- `NSFaceIDUsageDescription` for biometric auth

### iOS readiness score: Medium / Partial

Strong areas:

- Native iOS package and capability declarations exist
- Face ID support is declared
- Camera/Microphone/Photo access is described
- Tablet support is enabled

Gaps:

- No production Secure Enclave / Keychain-backed session handling defined in code
- No jailbreak/root detection or risk gating for sensitive flows
- No push notification registration or APNs setup documentation
- No full iPhone/iPad form-factor validation yet
- `secure-storage.ts` currently falls back to in-memory storage in non-native environments, which is not acceptable for production iOS security

## 5) Mobile Security Review

### Current state

The codebase has a security-aware foundation, but it is not yet production-grade.

What exists:

- `backend/app/main.py` adds HTTP security headers and configures CORS to an explicit origin list
- `mobile/src/services/secure-storage.ts` wraps secure token storage and offers a secure storage abstraction
- `biometrics.ts` implements biometric authentication checks
- `offline-manager.ts` provides an offline queue pattern
- `RootNavigator` clears tokens on logout

What is missing / not hardened:

- No hardcoded secrets are visible in the mobile frontend code, but the mock token approach (`mock_jwt_*`, `mock_refresh_token`) is not acceptable for production
- No real secure token lifecycle enforcement or session expiry handling in the client
- No secure UI masking or screenshot protection for sensitive screens
- No root/jailbreak detection or risk gating
- No push notification registration with device identity binding
- No secure deep link validation
- No client-side controls should be treated as a substitute for backend authorization

### Security expectation

The mobile application must use the same authoritative backend and wallet/ledger system as the web app. Sensitive wallet operations should be authorized and logged server-side; the frontend must never decide authorization by itself.

## 6) API Compatibility

### Existing backend capabilities relevant to mobile

The backend already has the necessary authority and flows:

- `backend/app/main.py` includes the FastAPI routers and security middleware
- `backend/app/api/ledger.py` contains wallet balance, payment initiation, transaction listing, and transaction detail endpoints
- Payment initiation requires an idempotency key and server-side authorization checks
- Wallet and ledger operations are scoped by role and hierarchy
- Pagination is implemented for transaction queries

### API compatibility assessment

| Item | Status | Notes |
|---|---|---|
| Authentication consistency | Partial | Mobile app and web app should share backend auth; current mobile app uses dev/mock tokens. |
| Role-based access | Good | Backend permissions and scopes are clearly implemented. |
| API versioning | Good | FastAPI app uses a versioned `/api/v1` structure. |
| Pagination | Good | Ledger transaction listing supports page/limit metadata. |
| Error handling | Good foundation | FastAPI exception handling is implemented. |
| Idempotency | Good | Payment initiation supports idempotency keys. |
| Transaction status polling | Partial | Not yet clearly defined for mobile user experience. |
| Secure file upload | Partial | KYC file flows exist conceptually but need formal validation and backend contract review. |
| Push registration | Partial | Not implemented yet. |

### Recommendation

Keep the same backend as the source of truth for both web and mobile. Design all mobile flows against the same API contracts rather than creating a mobile-only financial layer.

## 7) Testing Audit

The repository includes a mobile app and test harness patterns, but the mobile implementation still needs production validation across real device matrices.

### Required validation domains

- Android responsive testing
- iOS responsive testing
- Tablet testing
- Portrait/landscape testing
- Touch interaction testing
- Network failure and recovery testing
- Session expiry and reauthentication testing
- Secure login and biometric challenge testing
- Payment confirmation UX validation
- Accessibility review for fonts, spacing, contrast, and touch targets

### Current gaps

- No formal mobile device matrix report was found in the repo
- No documented OS-version compatibility matrix
- No explicit test evidence for secure session expiry handling
- No evidence of production push notification or background handling verification
- No screen-level acceptance tests for KYC document capture or payment confirmation

## 8) Recommended Implementation Approach (Phase 1)

### Recommended architecture

Keep the current architecture and extend it in a disciplined way:

1. Continue using the existing Expo React Native app for native mobile delivery.
2. Continue using the existing FastAPI backend as the single source of truth for wallet, payment, auth, and ledger logic.
3. Keep Next.js for responsive web portal work.
4. Reuse the workspace packages (`@buymecart/*`) for business logic, validation, and shared types.
5. Add production-grade mobile hardening before release, but do not replace the architecture with a new framework.

### Recommended delivery sequence

- Phase 1: Audit and standardize flows, security contracts, and UX requirements
- Phase 2: Harden secure storage, session lifecycle, and API token handling
- Phase 3: Implement production API contract compliance and status polling
- Phase 4: Add push notifications and KYC upload validation
- Phase 5: Run Android/iOS matrix validation with UAT signoff

### Conclusion

The repository already contains a viable base for both responsive web and native mobile experiences. The strongest recommendation is to continue the current architecture: shared backend + existing Expo mobile app + Next.js web experience, with security and device validation added before production release. The app is not fully production-hardened yet, but it is clearly not a greenfield project requiring a framework replacement.

## Evidence References

- `mobile/package.json`
- `mobile/app.json`
- `mobile/App.tsx`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/src/navigation/MainTabNavigator.tsx`
- `mobile/src/screens/RetailerDashboardScreen.tsx`
- `mobile/src/screens/AuthScreen.tsx`
- `mobile/src/services/secure-storage.ts`
- `mobile/src/services/biometrics.ts`
- `mobile/src/services/offline-manager.ts`
- `backend/app/main.py`
- `backend/app/api/ledger.py`
- `package.json`
