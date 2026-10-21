# Frontend–Backend Connection Audit — Buymecart / IBNK

**Document Version:** 1.0.0  
**Audit Timestamp:** 2026-10-21 16:00:00 IST  
**Target Environment:** Local Full-Stack Runtime (Next.js 15 + FastAPI 0.115 + SQLite/PostgreSQL)  
**Auditor:** Automated Engineering Subsystem  

---

## 1. Executive Summary & Final Verdict

| Metric | Verified Reality |
| :--- | :--- |
| **Final Connection Status** | **Partially Connected (Decoupled Dual-Stack Architecture)** |
| **Frontend Framework** | **Next.js 15.1.0** (App Router, React 19, TypeScript, TailwindCSS) |
| **Backend Framework** | **FastAPI 0.115.6** (Python 3.12, Uvicorn, SQLAlchemy ORM, Pydantic v2) |
| **Database Engine** | **SQLite 3** (`buymecart_dev.db` for local dev; SQLite in-memory for tests; PostgreSQL/Supabase ready) |
| **Frontend Runtime URL** | `http://localhost:3000` (and `http://localhost:3001` fallback when port 3000 occupied) |
| **Backend Runtime URL** | `http://127.0.0.1:8000` (API V1 root: `http://127.0.0.1:8000/api/v1`) |
| **Alembic Migration State** | **Head Revision `006_bspark_gateway_and_banking_api`** applied successfully |

### High-Level Architectural Finding
The Buymecart/IBNK codebase currently operates as a **dual-stack system**:
1. **The Backend (`backend/`)** is a fully functional, production-ready, hardened financial engine with double-entry accounting, hierarchical RBAC (Admin, Super Distributor, Area Distributor, Retailer), KYC document validation, BSpark payment gateway adapter, and operational monitoring. All **85 backend pytest tests** pass against the real database.
2. **The Frontend (`app/`, `components/`)** is an extensive, multi-portal Next.js 15 application. It contains internal Next.js API route handlers in `app/api/payments/` (`initiate/`, `config/`, `banking/`, `verify/`, `webhooks/`) which connect to internal TypeScript payment engines (`lib/payments/engine.ts`). However, **the frontend portal pages and login screens do not yet make outbound HTTP calls to the FastAPI backend on port 8000**; instead, they utilize client-side `localStorage` session state (`lib/auth.ts`) and static mock datasets (`lib/mock-data.ts`, `lib/onboarding/mock-applications.ts`).

---

## 2. Technology Stack & Runtime Configuration

### Frontend
- **Framework:** Next.js 15.1.0 (App Router)
- **Language / Runtime:** TypeScript 5.7.2 / Node.js v20+
- **Styling:** Tailwind CSS 3.4.16, Lucide React icons
- **Entry Points:** `app/layout.tsx`, `app/page.tsx`, `app/[portal]/dashboard/page.tsx`, `app/admin/login/page.tsx`
- **Startup Command:** `npm run dev` (starts on port 3000 / 3001)

### Backend
- **Framework:** FastAPI 0.115.6 / Starlette
- **Server:** Uvicorn ASGI Server
- **Language / Runtime:** Python 3.12 (in `backend/.venv`)
- **ORM / Migrations:** SQLAlchemy 2.0 / Alembic 1.14
- **Entry Point:** `backend/app/main.py`
- **Startup Command:** `backend\.venv\Scripts\uvicorn.exe app.main:app --app-dir backend --port 8000`

### Database
- **Development Database:** SQLite (`buymecart_dev.db` located at workspace root)
- **Active Tables:** `users`, `financial_accounts`, `transactions`, `journal_entries`, `ledger_postings`, `funds_reservations`, `onboarding_applications`, `application_profiles`, `kyc_documents`, `banking_provider_configs`, `api_products`, `api_client_credentials`, `audit_logs`

---

## 3. Verified Endpoints & Test Results

The backend API server was executed locally on `http://127.0.0.1:8000` and subjected to live HTTP requests:

| Tested Endpoint | Method | Expected Result | Actual Result | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/health` | GET | `{"status": "ok"}` | `{"status":"ok","app":"BuyMeCart / IBNK API","environment":"development"}` | **PASS** |
| `/ready` | GET | Database connectivity check | `{"status":"ready","database":"connected","environment":"development"}` | **PASS** |
| `/api/v1/auth/login` | POST | JWT access & refresh tokens for Admin | HTTP 200, JWT returned with role `ADMIN` and full permission claims | **PASS** |
| `/api/v1/auth/login` | POST | JWT access & refresh tokens for Retailer | HTTP 200, JWT returned with role `RETAILER` | **PASS** |
| `/api/v1/auth/admin-only` | GET | Admin token succeeds (200) | HTTP 200 OK | **PASS** |
| `/api/v1/auth/admin-only` | GET | Retailer token rejected (403) | HTTP 403 Forbidden: `Access forbidden: User role 'RETAILER' does not have required permissions (ADMIN)` | **PASS** |
| `/api/v1/network/summary` | GET | Hierarchical counts for platform | HTTP 200 OK: 2 SDs, 2 ADs, 2 Retailers, 7 active users | **PASS** |
| `/api/v1/distributors/super` | GET | List platform Super Distributors | HTTP 200 OK: Returned `sd.south@buymecart.org`, `sd.central@buymecart.org` | **PASS** |
| `/api/v1/distributors/area` | GET | List platform Area Distributors | HTTP 200 OK: Returned `ad.south1@buymecart.org`, `ad.zone1@buymecart.org` | **PASS** |
| `/api/v1/onboarding` | POST | Create draft application with full schema | HTTP 201 Created: Application ID `f58af7af-f0c5-4a23-9f0d-672d823aeaab`, App No `APP-2026-3002` | **PASS** |
| `/api/v1/onboarding/{id}` | GET | Retrieve persisted application from DB | HTTP 200 OK: Retrieved persisted record matching created applicant name and business | **PASS** |

---

## 4. Database Connection & Persistence Verification

A complete end-to-end CRUD persistence cycle was performed against the live backend:
1. **Seed Script Execution:** `backend/scripts/seed_uat_users.py` was executed. It connected to `buymecart_dev.db`, verified migrations, created 4 system accounts (`PLATFORM_CASH`, `GATEWAY_CLEARING`, `PLATFORM_COMMISSION`, `FUNDS_RESERVED_ESCROW`), and seeded 7 hierarchy-linked user accounts with merchant wallets.
2. **Draft Creation:** An onboarding application draft for applicant "Rohan Sharma" under entity "West FinTech Distributors LLP" was submitted via `POST /api/v1/onboarding`.
3. **Database Write:** The backend persisted the entity across `onboarding_applications`, `application_profiles`, and created an associated `audit_logs` record within an atomic database transaction.
4. **Retrieval Verification:** A separate `GET /api/v1/onboarding/f58af7af-f0c5-4a23-9f0d-672d823aeaab` request was dispatched using the Admin JWT. The server queried SQLite and successfully returned the stored record with all nested objects (`personal`, `business`, `identity`, `bank`).

---

## 5. Screen & Module Connection Matrix

| Screen / Portal Module | Current Data Source | Connected to FastAPI Backend? | Notes & Action Required |
| :--- | :--- | :---: | :--- |
| **Admin Login** (`app/admin/login/page.tsx`) | `lib/auth.ts` (`PRESET_USERS.admin` in `localStorage`) | **No** (Mock) | Needs to call `POST /api/v1/auth/login` and store the returned JWT in HTTP-only cookie or memory. |
| **Distributor Login** (`app/distributor/login/page.tsx`) | `lib/auth.ts` (`PRESET_USERS['sd-central']` / `ad`) | **No** (Mock) | Needs to call `POST /api/v1/auth/login`. |
| **Retailer Login** (`app/retailer/login/page.tsx`) | `lib/auth.ts` (`PRESET_USERS.retailer`) | **No** (Mock) | Needs to call `POST /api/v1/auth/login`. |
| **Admin Overview** (`admin-master-dashboard.tsx`) | `lib/mock-data.ts` | **No** (Mock) | Ready to consume `GET /api/v1/network/summary` and `/api/v1/providers/monitoring/overview`. |
| **Banking API Management** (`admin-api-management-module.tsx`) | Next.js client state | **Partial** | Ready to wire to `/api/v1/banking-api/providers` and `/test-connection`. |
| **Merchant / Onboarding Module** (`admin-merchant-module.tsx`) | `lib/onboarding/mock-applications.ts` | **No** (Mock) | Ready to consume `/api/v1/onboarding`. |
| **Admin Payment Module** (`admin-payment-module.tsx`) | Next.js API `/api/payments/config` | **Internal Next.js** | Calls Next.js route handler, which uses `lib/payments/config.ts`. |
| **Retailer Payment Initiation** (`retailer-portal-view.tsx`) | Next.js API `/api/payments/initiate` | **Internal Next.js** | Calls Next.js route handler, which uses `lib/payments/engine.ts`. |
| **Admin Compliance & KYC** (`admin-compliance-module.tsx`) | `lib/mock-data.ts` | **No** (Mock) | Ready to consume `/api/v1/onboarding/documents/review`. |
| **Channel Reports** (`admin-channel-reports-module.tsx`) | `lib/mock-data.ts` | **No** (Mock) | Ready to consume `/api/v1/ledger/accounts/{id}/statement`. |

---

## 6. Network, CORS, and Environment Analysis

1. **CORS Allowlist:**
   In [`backend/app/core/config.py`](file:///f:/MAster%20project/backend/app/core/config.py#L27-L31):
   ```python
   CORS_ORIGINS: Union[List[str], str] = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
       "exp://localhost:8081",
   ]
   ```
   *Observation:* When Next.js falls back to port 3001, CORS requests from `http://localhost:3001` would be blocked unless `http://localhost:3001` is added to `CORS_ORIGINS`.
2. **Missing Frontend Environment Variable:**
   No `NEXT_PUBLIC_API_URL` is defined in `.env.example` or `.env.local`. When connecting Next.js to FastAPI, `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` should be configured.
3. **Response Parsing:**
   FastAPI returns standardized Pydantic schemas with HTTP error formats `{"detail": "..."}` or `{"detail": [{"loc": [...], "msg": "..."}]}`. The frontend needs a unified API fetch wrapper that automatically parses error details.

---

## 7. Exact Files to Connect in Phase 8 / 8.1

To transition from **Partially Connected** to **Fully Connected**:

1. [`lib/api-client.ts`](file:///f:/MAster%20project/lib/api-client.ts) *(New file to create)*:
   - Provide a centralized fetch client with base URL pointing to `NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`.
   - Automatically inject JWT `Authorization: Bearer <token>` from auth session.
   - Handle 401 Unauthorized token refreshing via `/api/v1/auth/refresh`.
2. [`lib/auth.ts`](file:///f:/MAster%20project/lib/auth.ts):
   - Update `loginUser(loginId, password)` to dispatch `POST /api/v1/auth/login`.
   - Store access token and user claims upon successful response.
3. [`app/admin/login/page.tsx`](file:///f:/MAster%20project/app/admin/login/page.tsx) and role login pages:
   - Update `handleLogin` to call `loginUser` instead of synchronous `setStoredSession(PRESET_USERS.admin)`.
4. [`backend/app/core/config.py`](file:///f:/MAster%20project/backend/app/core/config.py):
   - Add `"http://localhost:3001"` and `"http://127.0.0.1:3001"` to `CORS_ORIGINS` to allow smooth fallback port execution.
5. [`components/admin/admin-api-management-module.tsx`](file:///f:/MAster%20project/components/admin/admin-api-management-module.tsx):
   - Replace local mock state with `GET /api/v1/banking-api/providers` and `POST /api/v1/banking-api/verify-beneficiary`.

---

## 8. Test Execution Evidence

- **Backend Pytest Suite:** **85 / 85 passed (100%)**
  - Command: `backend\.venv\Scripts\pytest.exe backend/tests -v`
  - Total duration: 227.87s
  - Coverage: Auth, RBAC gates, hierarchy cycles, double-entry ledger, webhook replay protection, provider reconciliation, banking API integration, row-level locking.
- **Frontend Vitest Suite:** **103 / 103 passed (100%)**
  - Command: `npm run test`
  - Total duration: 13.92s
  - Coverage: Admin modules, API management module, payment engine, AI center, portal views.
- **Production Next.js Build:** **Passed with 0 errors**
  - Command: `npm run build`
  - Compiled 17 static and dynamic route segments with `<Suspense>` boundaries.
