# BUYMECART.ORG — BSpark Digitized
## Comprehensive Five-Page Requirements-to-Portal Matrix (`docs/portal-requirements-matrix.md`)

This requirements matrix provides an exhaustive, page-by-page mapping of all specifications, handwritten notes, workflows, and compliance mandates from `buymecart.org bspark_digitized.pdf` into the three production-grade portals.

---

## 1. Architectural Distribution Matrix

| PDF Source | Portal | Role & Permitted Actions | Sidebar Menu & Submenu | Page Route / Workflow | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page 1: Header** | Admin | Root Admin: Global Telemetry, Payout, Bulk Payment | Top Action Bar | `/admin/dashboard` | **Complete** · Fully Implemented |
| **Page 1: Master Flow** | Admin | Root Admin: Telemetry, 3-Way Tx Feed (Overall, Categorised, Subjective) | Dashboard | `/admin/dashboard` | **Complete** · Interactive Filters |
| **Page 1: Merchant Menu** | Admin | Root Admin: Search & Filter merchants | Merchant → Search Merchant | `/admin/merchants?tab=search` | **Complete** · Search & Filter Table |
| **Page 1: Merchant Menu** | Admin | Root Admin: Onboard new merchant/channel | Merchant → Create Merchant | `/admin/merchants?tab=create` | **Complete** · 6-Step Creation Form |
| **Page 1: Merchant Menu** | Admin | Root Admin: 12-Pt KYC verification & vKYC | Merchant → Create Merchant KYC | `/admin/merchants?tab=create-kyc` | **Complete** · 12-Pt KYC & 30s vKYC |
| **Page 1: Merchant Menu** | Admin | Root Admin: Comprehensive profile inspection | Merchant → View Merchant | `/admin/merchants?tab=view` | **Complete** · Profile & Balances |
| **Page 1: Merchant Menu** | Admin | Root Admin: Hierarchy & downline inspection | Merchant → Merchant Channel | `/admin/merchants?tab=channel` | **Complete** · Tree Hierarchy View |
| **Page 1: Merchant Menu** | Admin | Root Admin: Credential resets & audit log | Merchant → Password Resends | `/admin/merchants?tab=passwords` | **Complete** · Dual-Audit Resend Log |
| **Page 1: Merchant Menu** | Admin | Root Admin: One-click status toggle & lock | Merchant → Activate Merchants | `/admin/merchants?tab=activate` | **Complete** · Instant Status Toggles |
| **Page 1: Merchant Menu** | Admin | Root Admin: Daily closing ledger balances | Merchant → Daily Merchants Balance | `/admin/merchants?tab=balances` | **Complete** · Credit/Debit Ledgers |
| **Page 1: Payment Menu** | Admin | Root Admin: Maker-Checker approval queue | Payment → Authorize Payments | `/admin/payments?tab=authorize` | **Complete** · Two-Person Rule Queue |
| **Page 1: Payment Menu** | Admin | Root Admin: Two-step refund/reversal queue | Payment → Reverse Payments | `/admin/payments?tab=reverse` | **Complete** · Bank Ref & Reason Log |
| **Page 1: Payment Menu** | Admin | Root Admin: Payout initiation with auth | Payment → Initiate Payments | `/admin/payments?tab=initiate` | **Complete** · Live Fee Calculator |
| **Page 1: Payment Menu** | Admin | Root Admin: Gateway and channel settlement | Payment → Approve Settlement | `/admin/payments?tab=settlement` | **Complete** · Node Reconciliation |
| **Page 1: Payment Menu** | Admin | Root Admin: Payment status, reversal, network reports | Payment → Reports (3 views) | `/admin/payments?tab=report` | **Complete** · Tabular Audits |
| **Page 1: Managed Products** | Admin | Root Admin: Matrix of products & fee slabs | Managed Products → Online Transactions | `/admin/managed-products?tab=transactions` | **Complete** · Slabs Table (5% & 7%) |
| **Page 1: Managed Products** | Admin | Root Admin: Product mapping & merging | Managed Products → Map Products | `/admin/managed-products?tab=map` | **Complete** · Mapping Rule Config |
| **Page 1: Managed Products** | Admin | Root Admin: Circle & regional routing | Managed Products → Circlewise Products | `/admin/managed-products?tab=circles` | **Complete** · Telecom Circle Filter |
| **Page 1: Managed Products** | Admin | Root Admin: Bank charges & routing accounts | Managed Products → Manage Bank Accounts | `/admin/managed-products?tab=bank-accounts` | **Complete** · IMPS/NEFT Switch Config |
| **Page 1: Managed Products** | Admin | Root Admin: NSDL/UTI PAN agents & coupons | Managed Products → PAN Agents / Coupons | `/admin/managed-products?tab=pan-agents` | **Complete** · Allocation Ledgers |
| **Page 1: Compliance** | Admin | Root Admin: Approvals for AD-submitted merchants | Compliance → Pending Onboarding | `/admin/compliance?tab=pending-onboarding` | **Complete** · 12-Pt KYC Verifier |
| **Page 1: Compliance** | Admin | Root Admin: Payout & PA merchant verification | Compliance → Payout / PA Merchants | `/admin/compliance?tab=payout-merchants` | **Complete** · Product Authorizations |
| **Page 1: Compliance** | Admin | Root Admin: AEPS biometric status & daily active | Compliance → AEPS Status | `/admin/compliance?tab=aeps-status` | **Complete** · Biometric Health Telemetry |
| **Page 1: Modifications** | Admin | Root Admin: Master Tempered Margin plan editor | Modifications → Tempered Margin | `/admin/modifications?tab=commercial` | **Complete** · Slabs & Overrides |
| **Page 1: Modifications** | Admin | Root Admin: Dual-OTP RMN modification | Modifications → Modify Mobile (RMN) | `/admin/modifications?tab=mobile` | **Complete** · Current & New RMN OTP |
| **Page 1: Modifications** | Admin | Root Admin: Remap retailer to new SD/AD | Modifications → Change Mapping | `/admin/modifications?tab=mapping` | **Complete** · Downline Reassignment |
| **Page 1: Modifications** | Admin | Root Admin: Prime products configuration | Modifications → Prime Products | `/admin/modifications?tab=prime-products` | **Complete** · Payart, Razorpay, UPI |
| **Page 1: Modifications** | Admin | Root Admin: Broadcast operational notices | Modifications → Update Notification | `/admin/modifications?tab=notifications` | **Complete** · Live Banner Dispatch |
| **Page 1: Support** | Admin | Root Admin: Complaint ticket resolution | Support → Open / Book / Status | `/admin/support?tab=open` | **Complete** · 4 Complaint Types |
| **Page 1: Channel Reports** | Admin | Root Admin: Regional volume & commission | Channel Reports | `/admin/channel-reports` | **Complete** · SD/AD Performance |
| **Page 2: SD Feature 1** | Distributor | Super Distributor (SD): Onboard AD partners | SD Navigation → Onboard & Verify ADs | `/distributor/ad-network` | **Complete** · Multi-Circle Onboard |
| **Page 2: SD Feature 2** | Distributor | Super Distributor (SD): Verify AD credentials | SD Navigation → Onboard & Verify ADs | `/distributor/ad-network` | **Complete** · Credential Verification |
| **Page 2: SD Feature 3** | Distributor | Super Distributor (SD): Escalate queries to Admin | SD Navigation → Escalate Queries | `/distributor/escalations` | **Complete** · Priority Ticket Bridge |
| **Page 2: SD Feature 4** | Distributor | Super Distributor (SD): Clear balance queries | SD Navigation → Clear Balance Queries | `/distributor/balance-queries` | **Complete** · Liquidity Resolution |
| **Page 2: AD Feature 1** | Distributor | Area Distributor (AD): Onboard Retailer | AD Navigation → Onboard Retailer | `/distributor/onboarding` | **Complete** · Retailer Registration |
| **Page 2: AD Feature 2** | Distributor | Area Distributor (AD): Submit to Admin Approval | AD Navigation → Onboard Retailer | `/distributor/onboarding` | **Complete** · Dispatch to Compliance |
| **Page 2: AD Feature 3** | Distributor | Area Distributor (AD): 12-Pt KYC & 30s vKYC | AD Navigation → Process KYC | `/distributor/kyc-flow` | **Complete** · Live vKYC Simulator |
| **Page 2: AD Feature 4** | Distributor | Area Distributor (AD): GPS coordinates capture | AD Navigation → Onboard Retailer | `/distributor/onboarding` | **Complete** · Geo-Tag Validation |
| **Page 2: AD Feature 5** | Distributor | Area Distributor (AD): Request payment queries | AD Navigation → Payment Queries | `/distributor/queries` | **Complete** · Query Dispatch Form |
| **Page 2: AD Feature 6** | Distributor | Area Distributor (AD): Handover kits to retailers | AD Navigation → Handover Retailer Kits | `/distributor/kits` | **Complete** · QR, MATM & Bio Sample |
| **Page 2: AD Scoping** | Distributor | Area Distributor (AD): Strict Bhopal scope (403) | All routes | `/distributor/*` | **Complete** · HTTP 403 on SD views |
| **Page 3: Tempered Plan** | Retailer & Admin | Retailer: Dynamic fee computation engine | Start Payment & Modifications | `/retailer/payments` | **Complete** · Slabs 1, 2, 3+ No Cap |
| **Page 3: Note 1** | Retailer | Retailer: Generate neutral receipts (NO logos) | Receipts (No Logo) | `/retailer/receipts` | **Complete** · Strict Whitelabel Format |
| **Page 4: 12-Point KYC** | Admin & AD | 12 mandatory documents + 30s video KYC | Merchant KYC & Process KYC | `/admin/merchants?tab=create-kyc` | **Complete** · 12 Items + Video OTP |
| **Page 5: Report 1** | Admin | Root Admin: Account Ledger (by RMN) | Reports → 1. Account Ledger | `/admin/reports?tab=account-ledger` | **Complete** · Date + RMN Filter |
| **Page 5: Report 2** | Admin | Root Admin: View Wallet Ledger | Reports → 2. View Wallet Ledger | `/admin/reports?tab=wallet-ledger` | **Complete** · Opening/Closing Balance |
| **Page 5: Report 3** | Admin | Root Admin: View All Transactions | Reports → 3. View Transactions | `/admin/reports?tab=view-transactions` | **Complete** · Bank Ref & Status Filter |
| **Page 5: Report 4** | Admin | Root Admin: AEPS Transactions | Reports → 4. AEPS Transactions | `/admin/reports?tab=aeps-transactions` | **Complete** · Cash-Out & Aadhar Pay |
| **Page 5: Report 5** | Admin | Root Admin: AEPS Wallet Settlement | Reports → 5. AEPS Wallet Settlement | `/admin/reports?tab=aeps-wallet-settlement`| **Complete** · Merchant Settlement |
| **Page 5: Report 6** | Admin | Root Admin: DMT Transactions | Reports → 6. DMT Transactions | `/admin/reports?tab=dmt-transactions` | **Complete** · Sender RMN & Beneficiary |
| **Page 5: Report 7** | Admin | Root Admin: Credit Card Reports | Reports → 7. Credit Card Reports | `/admin/reports?tab=card-transactions`| **Complete** · Visa/Mastercard/RuPay |
| **Page 5: Report 8** | Admin | Root Admin: AEPS Bank Settlement | Reports → 8. AEPS Bank Settlement | `/admin/reports?tab=aeps-bank-settlement` | **Complete** · Nodal Account Transfer |
| **Page 5: Report 9** | Admin | Root Admin: DMT PPI Transactions | Reports → 9. DMT PPI Transactions | `/admin/reports?tab=dmt-ppi` | **Complete** · Prepaid Instrument Log |
| **Page 5: Report 10** | Admin | Root Admin: DMT Fino Transactions | Reports → 10. DMT Fino Transactions | `/admin/reports?tab=dmt-fino` | **Complete** · Fino Payments Bank Feed |
| **Page 5: Report 11** | Admin | Root Admin: Payout Report | Reports → 11. Payout Report | `/admin/reports?tab=payout-report` | **Complete** · Direct Payout Batches |
| **Page 5: Report 12** | Admin | Root Admin: PA & UPI PA Report | Reports → 12. PA & UPI PA Report | `/admin/reports?tab=pa-report` | **Complete** · Payment Aggregator Logs |
| **Note 5 Compliance** | All Portals | Single Active Session Lock (1 ID 1 Login) | Authentication & Shell | `/admin/login`, `/distributor/login`, `/retailer/login` | **Complete** · Session Management |

---

## 2. Identified Ambiguities & Clarifications Table

| # | Exact PDF Location | Documented Handwriting / Term | Architectural Implementation | Clarification Query for Stakeholder |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | Page 1, Managed Products Table | Handwritten column header reading `Succs` vs `Unset` | Implemented `Succs` as Success Count, `Unset` as Unsettled Pending Settlement. | Confirm if `Unset` represents unsettled batches or unassigned operator routes. |
| **Q2** | Page 1, Compliance Menu | Handwritten label resembling `PA Merchants` | Implemented as Payment Aggregator (PA) Onboarded Merchants with escrow routing. | Confirm if `PA` signifies Payment Aggregator or Partner Agent. |
| **Q3** | Page 2, Note 5 | *"1 ID login at a time"* | Enforced automated session invalidation on previous active token upon login across all 3 portals. | Confirm whether multi-factor session handoff should send SMS OTP to existing session. |
| **Q4** | Page 3, Tempered Plan Slabs | Percentage slab *"Above 2,000 variable %"* | Implemented 0.45% default fee with 0 upper ceiling cap and configurable operator overrides. | Verify if maximum cap of ₹15 or ₹25 is mandated by RBI on specific domestic money transfers. |
| **Q5** | Page 4, 30s Video KYC | Handwritten instruction for randomized prompt | Implemented dynamic prompt requiring applicant full name, storefront GPS, and SMS OTP reading. | Confirm if video KYC storage retention policy is 5 years or 10 years per FIU-IND guidelines. |
| **Q6** | Page 5, Report 12 | Handwritten *"PA & UPI PA Report"* | Implemented separate aggregations for Card Payment Aggregator and UPI Payment Aggregator. | Confirm if Bharat QR aggregations should be bundled under Report 12 or Report 3. |

---

## 3. Dedicated Local Entry Points & Portals Architecture

1. **Admin Master Portal:**
   - Production Domain: `admin.buymecart.org`
   - Local Route: `/admin/dashboard` & `/admin/login`
   - Identity: `admin@buymecart.org` (`GLOBAL_ROOT`)
2. **Distributor Portal (Shared SD & AD):**
   - Production Domain: `distributor.buymecart.org`
   - Local Route: `/distributor/dashboard` & `/distributor/login`
   - Super Distributor Identity: `arun.sd@bspark.org` (`SD-CENTRAL-01`)
   - Area Distributor Identity: `sunil.ad@bspark.org` (`AD-MP-02`) — Restricted strictly to Bhopal with HTTP 403 on SD sections.
3. **Retailer Terminal:**
   - Production Domain: `retailer.buymecart.org`
   - Local Route: `/retailer/dashboard` & `/retailer/login`
   - Identity: `rajesh.sharma@sharmadigital.in` (`MCH-00101`) — Note 1 Neutral Receipts without any external logos.
