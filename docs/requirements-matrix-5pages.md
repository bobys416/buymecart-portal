# Buymecart.org — Full 5-Page Requirements-to-Portal Matrix
**Authoritative Source-of-Truth Mapping from `buymecart.org bspark_digitized.pdf`**

---

## 1. Architectural Model & Portal Segmentation

| Portal | Target URL | Authorized Roles | Access Scope & Organizational Boundary | Dedicated Entry Point |
|---|---|---|---|---|
| **Admin Portal** | `admin.buymecart.org` (`/admin`) | `admin`, `compliance_officer`, `finance_officer` | Platform-wide root access; exclusive control over SDs, ADs, Retailers, CRN onboarding, Tempered Margin plans, settlements, bank routing, and audit logs. | `/admin/login` |
| **Distributor Portal** | `distributor.buymecart.org` (`/distributor`) | `sd` (Super Distributor), `ad` (Area Distributor) | **Shared portal and common layout with server-verified role scoping.**<br>• `sd`: Oversees assigned ADs, regional retailers, clears balance queries, escalates queries to Admin.<br>• `ad`: Scoped strictly to assigned geographical area (e.g. Bhopal); initiates retailer onboarding, collects 12-point KYC & 30s vKYC, handovers kits, submits payment queries.<br>• **Enforcement:** AD cannot access SD management screens or other AD territories. | `/distributor/login` |
| **Retailer Portal** | `retailer.buymecart.org` (`/retailer`) | `retailer` (Merchant) | Scoped strictly to merchant terminal (`MCH-00101`). Enabled payment services, transaction history, neutral receipts (**strictly NO logos**), support tickets. Zero downstream onboarding rights. | `/retailer/login` |

---

## 2. Page-by-Page Feature Mapping Matrix

### PAGE 1: Navigation Details, Main Dashboard, Services & Critical Notes
| PDF Item / Annotation | Correct Portal | Authorized Role | Navigation Item / Submenu | Page / Workflow Route | Required Permission | Implementation Status | Notes & Ambiguity Identification |
|---|---|---|---|---|---|---|---|
| **Top Bar: Payout** | Admin | `admin` | Header Quick-Action | `/admin/payments?tab=initiate` | `payment:payout:create` | ✅ Implemented | Instant merchant wallet payout clearance modal |
| **Top Bar: Bulk Payment** | Admin | `admin` | Header Quick-Action | `/admin/payments?tab=settlement` | `payment:bulk:process` | ✅ Implemented | Batch settlement file dispatch |
| **Main Dashboard: Details Panel** | Admin | `admin` | `Dashboard` | `/admin/dashboard` | `admin:dashboard:view` | ✅ Implemented | Telemetry overview |
| **Utility Items & Icons** | Admin | `admin` | `Dashboard` | `/admin/dashboard` | `admin:dashboard:view` | ✅ Implemented | Service widgets and operational alerts |
| **Banking Payments Mode** | Admin & Retailer | `admin`, `retailer` | `Dashboard` / `Enabled Services` | `/admin/dashboard`, `/retailer/services` | `services:view` | ✅ Implemented | Breakdown of active rails |
| **Banking Product -> DMT, QKIK, DPMR/IMPS** | Admin | `admin` | `Dashboard` | `/admin/dashboard` | `admin:dashboard:view` | ✅ Implemented | Real-time banking product cards |
| **Reports Suite** | Admin | `admin` | `Reports` | `/admin/reports` | `reports:view` | ✅ Implemented | 12 specific financial statements |
| **Transaction Update: Overall, Categorised, Subjective** | Admin | `admin` | `Dashboard` | `/admin/dashboard` | `transactions:view` | ✅ Implemented | 3-way segmented transaction feed |
| **Distributor: Payment Request** | Distributor | `sd`, `ad` | `Payment Requests` | `/distributor/payments?tab=requests` | `distributor:payment:request` | ✅ Implemented | Bank payment request list |
| **Distributor: Payment Reversal (Refund, No-Limit)** | Distributor | `sd`, `ad` | `Payment Requests` | `/distributor/payments?tab=reversals` | `distributor:refund:request` | ✅ Implemented | Refund escalation without arbitrary cap |
| **Distributor: Payment Transaction** | Distributor | `sd`, `ad` | `Transactions` | `/distributor/payments?tab=transactions` | `distributor:tx:view` | ✅ Implemented | Scoped subordinate transactions |
| **Distributor: Payment Check** | Distributor | `sd`, `ad` | `Payment Requests` | `/distributor/payments?tab=check` | `distributor:tx:verify` | ✅ Implemented | UTR / RRN lookup tool |
| **Distributor: Onboarding Access** | Distributor | `sd`, `ad` | `Onboard Retailer` | `/distributor/onboarding` | `merchant:onboard:initiate` | ✅ Implemented | Permitted for SD and AD |
| **Enabled Payments Services: Net Banking (APS, APES/IMPS, Retail, Corporate, Gateway, Aggregator)** | Retailer & Admin | `admin`, `retailer` | `Enabled Services` | `/retailer/services`, `/admin/services` | `services:view` | ✅ Implemented | Full catalogue of payment modes |
| **UPI (ID, QR, Intent, Request/Deeplink, Credit, Int'l)** | Retailer & Admin | `admin`, `retailer` | `Start Payment` / `Services` | `/retailer/payments`, `/retailer/services` | `payment:initiate` | ✅ Implemented | Dynamic QR & Intent collection |
| **Card Payment (Debit, Credit, Prepaid, Pay card)** | Retailer & Admin | `admin`, `retailer` | `Start Payment` / `Services` | `/retailer/payments`, `/retailer/services` | `payment:initiate` | ✅ Implemented | Card checkout mock |
| **Bank Transfer (IMPS, NEFT, RTGS, Bulk, Scheduled, NACH, e-Mandate, AEPS, EMI, BBPS, Booking, Recharge)** | Retailer & Admin | `admin`, `retailer` | `Start Payment` / `Services` | `/retailer/payments`, `/retailer/services` | `payment:initiate` | ✅ Implemented | Remittances, bills, recharges |
| **Note 1: No Logos on Transaction slips/receipts** | Retailer | `retailer` | `Receipts (No Logo)` | `/retailer/receipts` | `receipts:view` | ✅ Implemented | **Strict compliance:** neutral layout omitting all brand logos |
| **Note 2: Onboarding done by all except Retailer** | All | `admin`, `sd`, `ad` | Shell navigation | Route guards | `merchant:onboard` | ✅ Implemented | Hidden in Retailer Portal; active in Admin & Distributor |
| **Note 3: Admin - only CRN onboarding & Tempered Plan** | Admin | `admin` | `Modifications` | `/admin/modifications?tab=commercial` | `commercial:manage` | ✅ Implemented | Exclusive Admin pricing plan controls |
| **Note 4: URL diff for Admin, SD/AD, Retailer** | All | All roles | Routing architecture | Host/Path entry points | Public | ✅ Implemented | 3 independent URLs and login portals |
| **Note 5: 1 ID login at a time for SD/AD/Retailer** | All | `sd`, `ad`, `retailer` | Session guard | All authenticated routes | `session:active` | ✅ Implemented | Single-session active indicator & concurrency check |

---

### PAGE 2: Organizational Hierarchy, Approvals & Role Responsibilities
| PDF Item / Diagram | Correct Portal | Authorized Role | Navigation Item / Submenu | Page / Workflow Route | Required Permission | Implementation Status | Notes & Ambiguity Identification |
|---|---|---|---|---|---|---|---|
| **Organizational Tree: Admin -> SD -> AD -> Retailer** | Admin & Dist | `admin`, `sd` | `Merchant Channel` / `Network` | `/admin/merchants?tab=channel`, `/distributor/network` | `network:view` | ✅ Implemented | 4-tier visual hierarchy tree |
| **Arrow "for Approval" -> Admin CRM** | Admin | `admin` | `Compliance` | `/admin/compliance?tab=pending-onboarding` | `compliance:approve` | ✅ Implemented | AD onboarding submission approval queue |
| **AD Feature 1: Onboard Retailer / Merchant (Initiate)** | Distributor | `ad` | `Onboard Retailer` | `/distributor/onboarding?tab=initiate` | `merchant:onboard:initiate` | ✅ Implemented | Retailer registration form |
| **AD Feature 2: Send Request for Approval to Admin Portal** | Distributor | `ad` | `Onboard Retailer` | `/distributor/onboarding?tab=status` | `merchant:onboard:submit` | ✅ Implemented | Submission status tracker |
| **AD Feature 3: Process KYC (Info/docs, Video KYC, Digital footprint)** | Distributor | `ad` | `Process KYC` | `/distributor/onboarding?tab=kyc` | `kyc:collect` | ✅ Implemented | Document capture & 30s vKYC simulation |
| **AD Feature 4: Geographical location** | Distributor | `ad` | `Process KYC` | `/distributor/onboarding?tab=geo` | `kyc:geo:capture` | ✅ Implemented | GPS coordinates locked to shop |
| **AD Feature 5: Request for Payments related Queries to SD (& Admin)** | Distributor | `ad` | `Support & Queries` | `/distributor/support?tab=raise` | `query:raise` | ✅ Implemented | Query escalation form |
| **AD Feature 6: Handover Kit to Retailers** | Distributor | `ad` | `Handover Kits` | `/distributor/network?tab=kits` | `kits:handover` | ✅ Implemented | QR code, micro-ATM, biometric scanner status |
| **SD Feature 1: Onboard Area distributors and increase scale** | Distributor | `sd` (SD Only!) | `Onboard & Verify ADs` | `/distributor/network?tab=onboard-ad` | `network:ad:manage` | ✅ Implemented | Forbidden to AD role |
| **SD Feature 2: Verify ADs and Track work & Activity** | Distributor | `sd` (SD Only!) | `Onboard & Verify ADs` | `/distributor/network?tab=ad-list` | `network:ad:verify` | ✅ Implemented | Activity audit table |
| **SD Feature 3: Request out for Payment Queries to Admin for Approval** | Distributor | `sd` | `Support & Queries` | `/distributor/support?tab=escalations` | `query:escalate` | ✅ Implemented | SD escalation queue |
| **SD Feature 4: Clear all Queries Related to Balance for AD & Retailers** | Distributor | `sd` (SD Only!) | `Clear Balance Queries` | `/distributor/balance?tab=queries` | `balance:clear` | ✅ Implemented | Subordinate liquidity clearance |
| **ADMIN Feature 1: Overall control on SD/AD/Ret** | Admin | `admin` | `Merchant` | `/admin/merchants` | `admin:root` | ✅ Implemented | Master management console |
| **ADMIN Feature 2: Process Approve SD/AD/Ret Onboarding & Payments** | Admin | `admin` | `Compliance` / `Payment` | `/admin/compliance`, `/admin/payments` | `admin:approve` | ✅ Implemented | Maker-checker approval actions |
| **ADMIN Feature 3: Activate and Deactivate SD/AD/Ret services & Accounts** | Admin | `admin` | `Merchant` / `Compliance` | `/admin/merchants?tab=activate` | `admin:toggle_status` | ✅ Implemented | Granular terminal freeze toggles |
| **ADMIN Feature 4: Approve Payments and Track everything** | Admin | `admin` | `Dashboard` / `Payment` | `/admin/dashboard`, `/admin/payments` | `admin:root` | ✅ Implemented | Master telemetry & ledger |

---

### PAGE 3: Admin Menu Modules, Roles, 12-Pt KYC & Tempered Margin Slabs
| PDF Item | Correct Portal | Authorized Role | Navigation Item / Submenu | Page / Workflow Route | Required Permission | Implementation Status | Notes & Ambiguity Identification |
|---|---|---|---|---|---|---|---|
| **Admin Module: Homepage** | Admin | `admin` | `Dashboard` | `/admin/dashboard` | `admin:dashboard:view` | ✅ Implemented | Telemetry dashboard |
| **Admin Module: Merchant (Approve Merchant)** | Admin | `admin` | `Merchant` | `/admin/merchants` | `merchant:manage` | ✅ Implemented | Directory & dossier approvals |
| **Admin Module: Payments** | Admin | `admin` | `Payment` | `/admin/payments` | `payment:manage` | ✅ Implemented | Authorizations & settlements |
| **Admin Module: Manage Products** | Admin | `admin` | `Managed Products` | `/admin/managed-products` | `products:manage` | ✅ Implemented | Routing, circles, vendor mapping |
| **Admin Module: Compliance** | Admin | `admin` | `Compliance` | `/admin/compliance` | `compliance:manage` | ✅ Implemented | KYC, AEPS status, activations |
| **Admin Module: Reports** | Admin | `admin` | `Reports` | `/admin/reports` | `reports:view` | ✅ Implemented | 12 specific statements |
| **Admin Module: Channel Report** | Admin | `admin` | `Channel Reports` | `/admin/channel-reports` | `channel:view` | ✅ Implemented | SD/AD hierarchy performance |
| **Admin Module: Support** | Admin | `admin` | `Support` | `/admin/support` | `support:manage` | ✅ Implemented | Dispute ticketing |
| **Admin Module: Modifications (Updates)** | Admin | `admin` | `Modifications` | `/admin/modifications` | `modifications:manage` | ✅ Implemented | RMN, mapping, commercials, prime products |
| **Role Codes: EK, PO, SD, AD, RT** | Admin | `admin` | `Merchant` | `/admin/merchants?tab=roles` | `roles:view` | ✅ Implemented | Executive, Partner, SD, AD, Retailer |
| **12-Point KYC Process (Items 1 to 12)** | Admin & Dist (AD) | `admin`, `ad` | `Create KYC` / `Process KYC` | `/admin/merchants?tab=create-kyc`, `/distributor/onboarding?tab=kyc` | `kyc:manage` | ✅ Implemented | Name, address, Aadhaar, PAN, MSME/Udyam, Dual OTP, Cheque, 30s vKYC, Selfies, Shop photo, Signature/Thumb |
| **Tempered Margin: ₹101 - ₹1,000 -> ₹7** | Admin & Retailer | `admin`, `retailer` | `Modifications` / `Start Payment` | `/admin/modifications?tab=commercial`, `/retailer/payments` | `commercial:view` | ✅ Implemented | Fixed ₹7 fee |
| **Tempered Margin: ₹1,001 - ₹2,000 -> ₹9** | Admin & Retailer | `admin`, `retailer` | `Modifications` / `Start Payment` | `/admin/modifications?tab=commercial`, `/retailer/payments` | `commercial:view` | ✅ Implemented | Fixed ₹9 fee |
| **Tempered Margin: > ₹2,000 -> Variable % (No Upper Cap)** | Admin & Retailer | `admin`, `retailer` | `Modifications` / `Start Payment` | `/admin/modifications?tab=commercial`, `/retailer/payments` | `commercial:view` | ✅ Implemented | Slabs: 0.2%, 0.3%, 0.35%, 0.5%; 200000 crossed out in red ink |

---

### PAGE 4: Admin Portal Deep Modules
| PDF Item / Submenu | Correct Portal | Authorized Role | Navigation Item / Submenu | Page / Workflow Route | Required Permission | Implementation Status | Notes & Ambiguity Identification |
|---|---|---|---|---|---|---|---|
| **Merchant: Search Merchant** | Admin | `admin` | `Merchant` → `Search Merchant` | `/admin/merchants?tab=search` | `merchant:view` | ✅ Implemented | Filter by RMN, Name, Store, Aadhaar |
| **Merchant: Create Merchant** | Admin | `admin` | `Merchant` → `Create Merchant` | `/admin/merchants?tab=create` | `merchant:create` | ✅ Implemented | Agent RMN, Name, Email, Store, Cat, Address, Role, Aadhaar |
| **Merchant: Create Merchant KYC** | Admin | `admin` | `Merchant` → `Create KYC` | `/admin/merchants?tab=create-kyc` | `kyc:create` | ✅ Implemented | 12-point KYC with 30s vKYC |
| **Merchant: View Merchant** | Admin | `admin` | `Merchant` → `View Merchant` | `/admin/merchants?tab=view` | `merchant:view` | ✅ Implemented | Profile inspection |
| **Merchant: Merchant Channel** | Admin | `admin` | `Merchant` → `Merchant Channel` | `/admin/merchants?tab=channel` | `merchant:channel:view` | ✅ Implemented | Visual tree |
| **Merchant: Password Resends** | Admin | `admin` | `Merchant` → `Password Resends` | `/admin/merchants?tab=passwords` | `merchant:credentials` | ✅ Implemented | Credential dispatch audit |
| **Merchant: Activate Merchants** | Admin | `admin` | `Merchant` → `Activate Merchants` | `/admin/merchants?tab=activate` | `merchant:activate` | ✅ Implemented | Active/Suspended toggle |
| **Merchant: Daily Merchants Balance** | Admin | `admin` | `Merchant` → `Daily Balances` | `/admin/merchants?tab=balances` | `ledger:view` | ✅ Implemented | Opening, credit, debit, closing |
| **Payment: Authorize Payments (Approve Pay)** | Admin | `admin` | `Payment` → `Authorize Payments` | `/admin/payments?tab=authorize` | `payment:authorize` | ✅ Implemented | High-value authorization queue |
| **Payment: Reverse Payments (Refund)** | Admin | `admin` | `Payment` → `Reverse Payments` | `/admin/payments?tab=reverse` | `payment:refund` | ✅ Implemented | Reversal processor |
| **Payment: Initiate Payments** | Admin | `admin` | `Payment` → `Initiate Payments` | `/admin/payments?tab=initiate` | `payment:initiate` | ✅ Implemented | RMN, Bank, Mode, Ref No, Date, Amount, Remarks, Passwords |
| **Payment: Reports (Report, Status, Reversal, Settlement, Network)** | Admin | `admin` | `Payment` → Reports submenus | `/admin/payments?tab=...` | `payment:reports` | ✅ Implemented | 5 distinct payment reporting submenus |
| **Managed Products: Summary Table** | Admin | `admin` | `Managed Products` → `Online Tx` | `/admin/managed-products?tab=transactions` | `products:view` | ✅ Implemented | `Operator \| Total \| 5% \| 7% \| Succs \| Unset \| Fail \| Pending \| Refunded \| Detail` |
| **Managed Products: Detail View** | Admin | `admin` | `Managed Products` → `Online Tx` | `/admin/managed-products?tab=transactions` | `products:view` | ✅ Implemented | `Operator \| Stat \| Date \| OpID \| Source \| Response \| Circle \| User \| Customer \| TransID \| Amount \| Cat` |
| **Managed Products: Map Products (Operator, Circle, Vendor)** | Admin | `admin` | `Managed Products` → `Map Products` | `/admin/managed-products?tab=map` | `products:map` | ✅ Implemented | Routing rule configuration |
| **Managed Products: Merge, Circles, Bank Accounts, Charges, PAN, Signups** | Admin | `admin` | `Managed Products` submenus | `/admin/managed-products?tab=...` | `products:manage` | ✅ Implemented | Full submodule set |
| **Support: Open, Book, Status, List, Update Contact Us** | Admin | `admin` | `Support` submenus | `/admin/support?tab=...` | `support:manage` | ✅ Implemented | Complaint Type (Transaction, Service, Payment), Category, TxID, Remarks |

---

### PAGE 5: Compliance, 12 Reports & Modifications
| PDF Item / Submenu | Correct Portal | Authorized Role | Navigation Item / Submenu | Page / Workflow Route | Required Permission | Implementation Status | Notes & Ambiguity Identification |
|---|---|---|---|---|---|---|---|
| **Compliance: Pending Onboarding & Accounts, KYC List, Account List** | Admin | `admin` | `Compliance` submenus | `/admin/compliance?tab=...` | `compliance:manage` | ✅ Implemented | Queue of submissions from ADs |
| **Compliance: Authorize Products, Payout/PA Merchants, AEPS Status, Daily Activation** | Admin | `admin` | `Compliance` submenus | `/admin/compliance?tab=...` | `compliance:manage` | ✅ Implemented | Merchant rail authorizations |
| **Reports: 12 Specific Reports (Page 5)** | Admin | `admin` | `Reports` → 12 Submenus | `/admin/reports?tab=...` | `reports:view` | ✅ Implemented | Account ledger by RMN, Wallet ledger, Transactions, AEPS, DMT, Card, Settlements, Payout, PA |
| **Modifications: Modify Mobile Number (RMN / New AD RMN)** | Admin | `admin` | `Modifications` → `Modify Mobile` | `/admin/modifications?tab=mobile` | `merchant:modify` | ✅ Implemented | Dual-OTP simulated mobile change |
| **Modifications: Change Mapping (Retailer RMN / New AD RMN)** | Admin | `admin` | `Modifications` → `Change Mapping` | `/admin/modifications?tab=mapping` | `merchant:remap` | ✅ Implemented | Transfer retailer to new AD |
| **Modifications: Modify Profile** | Admin | `admin` | `Modifications` → `Modify Profile` | `/admin/modifications?tab=profile` | `merchant:modify` | ✅ Implemented | Name, Email, Shop, Category, Address |
| **Modifications: Commercials & Templates** | Admin | `admin` | `Modifications` → `Commercial` | `/admin/modifications?tab=commercial` | `commercial:manage` | ✅ Implemented | Tempered margin editor |
| **Modifications: Manage Prime Product (Payart & RazorPay / UPI)** | Admin | `admin` | `Modifications` → `Prime Products` | `/admin/modifications?tab=prime-products` | `products:prime` | ✅ Implemented | Payout Branch, IPCC, 4/8 State, RazorPay, UPI |
| **Modifications: Update Notification** | Admin | `admin` | `Modifications` → `Notifications` | `/admin/modifications?tab=notifications` | `notifications:manage` | ✅ Implemented | Broadcast alerts |
| **Channel Reports** | Admin | `admin` | `Channel Reports` | `/admin/channel-reports` | `channel:view` | ✅ Implemented | SD/AD leaderboard & volume |

---

## 3. Ambiguities Identified in Source PDF

1. **Page 3 Role Legend "EK" & "PO":**
   - *Observation:* Handwritten abbreviations on the left margin: `EK`, `PO`, `SD`, `AD`, `RT`.
   - *Status:* Preserved as role types: `EK` (Executive / Field Staff), `PO` (Partner / Payment Officer), `SD` (Super Distributor), `AD` (Area Distributor), `RT` (Retailer).
2. **Page 5 "merge payart" and "manage yth":**
   - *Observation:* Handwritten note branching from Prime Product: `merge payart` with sub-items (Enable Payout Branch, Enable Payout 4/8 State, Enable IPCC, Unknown Payout branch) and `manage yth` pointing to `RazorPay` and `UPI`.
   - *Status:* Explicitly implemented in the Prime Products configuration panel with discrete switches.
3. **Page 3 Slabs Red Strikethrough:**
   - *Observation:* "2001 - 200000" has "200000" crossed out in red ink, next to variable percentage rates 0.2%, 0.3%, 0.35%, 0.5%.
   - *Status:* Strictly followed: **No global upper transaction cap** is imposed. Slabs 1 and 2 use fixed ₹7 and ₹9; >₹2,000 uses variable percentages.
