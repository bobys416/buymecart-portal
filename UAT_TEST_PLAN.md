# Buymecart / IBNK — Team User Acceptance Testing (UAT) Plan

**Document Version:** 1.0.0  
**Phase:** 8 — Team UAT & Acceptance Verification  
**Environment:** Staging / Local Sandbox Environment  
**Execution Window:** Pre-Phase 9 AWS Deployment  
**Financial Policy:** Zero Live Transactions · Sandbox & Synthetic Data Only  

---

## 1. Test Execution Protocol

1. **Safety Rule:** Never input real customer bank account numbers, personal Aadhaar/PAN cards, or live credit/debit cards during testing.
2. **Account Scoping:** Only execute tests using the designated test credentials listed in [`LOCAL_SETUP.md`](file:///f:/MAster%20project/LOCAL_SETUP.md).
3. **Defect Logging:** Record all failures or unexpected behaviors in [`UAT_DEFECT_LOG.md`](file:///f:/MAster%20project/UAT_DEFECT_LOG.md).
4. **Idempotency Rule:** Verify that refreshing pages or re-clicking submission buttons does not produce duplicated financial transactions or multiple onboarding applications.

---

## 2. Test Case Register

### Journey 1: Admin Privileged Operations

| Test ID | Module | Pre-conditions | Test Steps | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-ADM-01** | Authentication | Server running | 1. Navigate to `/admin/login`<br>2. Sign in with `admin@buymecart.org` / `AdminPass#2026`<br>3. Verify redirect to `/admin/dashboard` | Login succeeds; dashboard displays Root Administrator profile with all 11 system permissions. | [ ] PASS<br>[ ] FAIL |
| **UAT-ADM-02** | Network Overview | Logged in as Admin | 1. Navigate to Network Hierarchy section.<br>2. Inspect SD and AD counts. | Real-time counts match database state (2 SDs, 2 ADs, 2 Retailers). | [ ] PASS<br>[ ] FAIL |
| **UAT-ADM-03** | KYC Review | Logged in as Admin | 1. Navigate to Merchant / KYC queue.<br>2. Select pending application.<br>3. Review documents and click "Approve". | Status transitions to `APPROVED`; audit log records admin user ID and timestamp. | [ ] PASS<br>[ ] FAIL |
| **UAT-ADM-04** | Banking Provider Mgmt | Logged in as Admin | 1. Navigate to Banking API Management (`/admin/api-management`).<br>2. Run connection test against BSpark Gateway.<br>3. Verify latency and status. | Connection returns HTTP 200, latency displayed in ms, zero secret leakage in response. | [ ] PASS<br>[ ] FAIL |
| **UAT-ADM-05** | Penny Drop Testing | Logged in as Admin | 1. In API Management, open Penny Drop tool.<br>2. Enter Account `99201004561234`, IFSC `ICIC0000001`.<br>3. Click "Verify Account". | Verification succeeds; bank reference and account name match returned. | [ ] PASS<br>[ ] FAIL |
| **UAT-ADM-06** | Ledger Audit | Logged in as Admin | 1. Open Ledger & Reconciliation section.<br>2. Query transaction journal entries. | Every posted journal balances (Sum of Debits == Sum of Credits to 4 decimal places). | [ ] PASS<br>[ ] FAIL |

---

### Journey 2: Super Distributor (SD) Operations

| Test ID | Module | Pre-conditions | Test Steps | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-SD-01** | Authentication | Server running | 1. Navigate to `/distributor/login`<br>2. Sign in as `sd.central@buymecart.org` / `SuperDistPass#2026` | Login succeeds; redirected to SD dashboard with Central Region territory scope. | [ ] PASS<br>[ ] FAIL |
| **UAT-SD-02** | Scoped Network | Logged in as SD Central | 1. View network subordinates list. | Only displays Area Distributors and Retailers assigned under Central Region (e.g. `ad.zone1`). South network accounts are hidden. | [ ] PASS<br>[ ] FAIL |
| **UAT-SD-03** | Area Dist Onboarding | Logged in as SD Central | 1. Click "Onboard Area Distributor".<br>2. Complete Personal, Business, Identity, and Bank forms.<br>3. Submit application. | Application draft created with parent ID locked to SD Central's ID. Server validates hierarchy. | [ ] PASS<br>[ ] FAIL |
| **UAT-SD-04** | Privilege Isolation | Logged in as SD Central | 1. Attempt navigating directly to `/admin/api-management` or `/admin/dashboard`. | Access denied with HTTP 403 Forbidden or automatic redirection to SD portal. | [ ] PASS<br>[ ] FAIL |

---

### Journey 3: Area Distributor (AD) Operations

| Test ID | Module | Pre-conditions | Test Steps | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-AD-01** | Authentication | Server running | 1. Navigate to `/distributor/login`<br>2. Sign in as `ad.zone1@buymecart.org` / `AreaDistPass#2026` | Login succeeds; redirected to AD dashboard for Zone-01. | [ ] PASS<br>[ ] FAIL |
| **UAT-AD-02** | Retailer Onboarding | Logged in as AD Zone-01 | 1. Click "Onboard Retailer Store".<br>2. Input merchant store details.<br>3. Upload sample KYC documents (JPEG/PDF).<br>4. Submit draft. | Application persists with status `SUBMITTED`. Documents validated for file type magic bytes. | [ ] PASS<br>[ ] FAIL |
| **UAT-AD-03** | Boundary Protection | Logged in as AD Zone-01 | 1. Attempt onboarding another Super Distributor or Area Distributor. | Forbidden. Server rejects applicant roles other than `RETAILER`. | [ ] PASS<br>[ ] FAIL |

---

### Journey 4: Retailer Operations

| Test ID | Module | Pre-conditions | Test Steps | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-RET-01** | Authentication | Server running | 1. Navigate to `/retailer/login`<br>2. Sign in as `retailer.store1@buymecart.org` / `RetailerPass#2026` | Login succeeds; Retailer dashboard displays merchant wallet balance (₹50,000.00). | [ ] PASS<br>[ ] FAIL |
| **UAT-RET-02** | Payment Initiation | Logged in as Retailer | 1. Click "New Transaction".<br>2. Enter Amount ₹1,500.00, Customer Ref `CUST-901`.<br>3. Select UPI / BSpark Gateway.<br>4. Submit payment. | UPI QR code and deep-link generated; tempered margin fee correctly calculated; wallet balance reserved. | [ ] PASS<br>[ ] FAIL |
| **UAT-RET-03** | Receipt Generation | Payment complete | 1. View completed transaction in transaction list.<br>2. Click "View Receipt" / "Download". | Formatted merchant receipt displays with statutory GST breakdown, BSpark UTR, and masked customer phone. | [ ] PASS<br>[ ] FAIL |
| **UAT-RET-04** | Balance Overdraft Prevention | Logged in as Retailer | 1. Attempt initiating payout of ₹60,000.00 (wallet balance is ₹50,000.00). | Transaction rejected with "Insufficient available funds". Wallet balance remains unchanged. | [ ] PASS<br>[ ] FAIL |

---

### Journey 5: Cross-Cutting & Security Resilience

| Test ID | Module | Pre-conditions | Test Steps | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-SEC-01** | Brute Force Protection | Server running | 1. Attempt 35 rapid failed logins from same client IP. | Rate limiter engages with HTTP 429 Too Many Requests. | [ ] PASS<br>[ ] FAIL |
| **UAT-SEC-02** | Session Expiry | Authenticated user | 1. Invalidate JWT token or wait for expiration.<br>2. Dispatched API call to protected endpoint. | HTTP 401 Unauthorized returned; user prompted to re-authenticate. | [ ] PASS<br>[ ] FAIL |
| **UAT-SEC-03** | Callback Replay Defense | Server running | 1. Send simulated provider webhook payload.<br>2. Re-send exact same webhook with same idempotency key and signature. | Second callback processed idempotently; zero duplicate ledger entries created. | [ ] PASS<br>[ ] FAIL |
| **UAT-SEC-04** | Partial Refund Balancing | Confirmed transaction | 1. Execute partial refund of ₹500 on ₹1,500 transaction.<br>2. Execute second partial refund of ₹500.<br>3. Attempt third refund of ₹600. | First two succeed; third is rejected (exceeds remaining balance). Balanced journals posted for each. | [ ] PASS<br>[ ] FAIL |
| **UAT-SEC-05** | Mobile Responsiveness | Multiple devices | 1. Resize browser viewport to 375px (iPhone) and 768px (iPad).<br>2. Navigate dashboards and tables. | Layout collapses gracefully; navigation menus fold into drawer; tables support horizontal scroll. | [ ] PASS<br>[ ] FAIL |
