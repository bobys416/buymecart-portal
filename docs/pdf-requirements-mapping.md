# Buymecart.org (BSpark Digitized) — PDF Requirements-to-Frontend Mapping
**Authoritative Specification Mapping from 5-Page Source Document**

---

## 1. Executive Portal Hierarchy & URL Architecture

| Role / Entity | Designated Portal | Target Subdomain / Route | Onboarding Scope | Concurrency Rule |
|---|---|---|---|---|
| **Main Admin (CRM)** | Admin Portal | `admin.buymecart.org` (`/admin`) | Can onboard SD, AD, Retailer; exclusive approval rights for all | Standard administrative session |
| **Super Distributor (SD)** | Distributor Portal | `distributor.buymecart.org` (`/distributor?role=sd`) | Can onboard AD & Retailer; tracks AD performance & clears balance queries | **Strict 1 ID login at a time** (Note 5) |
| **Area Distributor (AD)** | Distributor Portal | `distributor.buymecart.org` (`/distributor?role=ad`) | Can initiate Retailer onboarding & KYC collection; hands over retailer kits | **Strict 1 ID login at a time** (Note 5) |
| **Retailer (Merchant)** | Retailer Portal | `retailer.buymecart.org` (`/retailer`) | Zero downstream onboarding rights (Note 2) | **Strict 1 ID login at a time** (Note 5) |

---

## 2. Page-by-Page Mapping from Original PDF

### PAGE 1: Top Navigation, Main Dashboard, Distributor Panel, Services & Notes
| PDF Section / Annotation | PDF Item / Note | Mapped Portal | Mapped Menu / Submenu | Screen Interaction & Features |
|---|---|---|---|---|
| **Top Operational Bar** | `Payout` | Admin & Retailer | Top Quick-Action / Header Bar | Quick-action trigger for single & bulk merchant payouts |
| **Top Operational Bar** | `Bulk Payment` | Admin & Retailer | Top Quick-Action / Header Bar | Batch payout file upload & validation interface |
| **(1) Main Dashboard** | `Details Panel` | Admin | `/admin/dashboard` | Centralized platform telemetry panel |
| | `Icons & Utility items` | Admin | `/admin/dashboard` | Service quick-launch widgets & platform status alerts |
| | `Banking Payments Mode` | Admin | `/admin/dashboard` | Breakdown by Net Banking, UPI, Cards, AEPS, DMT |
| | `Banking Product -> DMT, QKIK, DPMR/IMPS` | Admin | `/admin/dashboard` | Real-time throughput cards for money transfer & IMPS |
| | `Report` | Admin | `/admin/dashboard` | Aggregated revenue, gross volume, and commission summary |
| | `Transaction Update -> Overall, Categorised, Subjective` | Admin | `/admin/dashboard` | 3-way segmented transaction feed with state filters |
| **Distributor Panel & SD** | `(1) Payment Request (Bank Request for Payment list)` | Distributor (SD/AD) | `/distributor/payments?tab=requests` | Bank payment request submission & status list |
| | `(2) Payment Reversal (Refund Request, Nolimit)` | Distributor (SD/AD) | `/distributor/payments?tab=reversals` | No-limit refund escalation queue for channel partners |
| | `(3) Payment Transaction` | Distributor (SD/AD) | `/distributor/payments?tab=transactions` | Scoped downstream transactions list with status chips |
| | `(4) Payment check` | Distributor (SD/AD) | `/distributor/payments?tab=check` | UTR / RRN transaction verification inquiry tool |
| | `(5) Onboarding access` | Distributor (SD/AD) | `/distributor/onboarding` | Downstream merchant onboarding initiation portal |
| **Enabled Payments Services** | `Net Banking: APS, APES/IMPS, Retail, Corporate, Gateway, Aggregator` | Retailer & Admin | `/retailer/services`, `/admin/services` | Service catalogue & toggle controls |
| | `UPI: UPI ID, QR, Intent, Request/Deeplink, Credit, International` | Retailer & Admin | `/retailer/payments?mode=upi`, `/retailer/services` | Dynamic QR generator, VPA collect, Deeplink |
| | `Card Payment: Debit, Credit, Prepaid, Pay card` | Retailer & Admin | `/retailer/payments?mode=card`, `/retailer/services` | Mock PCI-tokenized card checkout interface |
| | `Bank Transfer: IMPS, NEFT, RTGS, Scheduled, Bulk, NACH, e-Mandate, AEPS, EMI, BBPS, Bookings, Recharge` | Retailer & Admin | `/retailer/payments?mode=transfer`, `/retailer/services` | Complete remittance, biller directory, recharge form |
| **Operational Notes** | `Note 1: No Logos on Transaction slips/receipts` | Retailer | `/retailer/receipts` | Neutral printable slip with NO platform or third-party logos |
| | `Note 2: Onboarding done by all except Retailer` | All Portals | Shell & Navigation | Onboarding hidden in Retailer portal; active in Admin & Dist |
| | `Note 3: Admin - only CRN onboarding & Tempered Plan` | Admin | `/admin/modifications?tab=commercial` | Exclusive Admin controls for commercial plan templates |
| | `Note 4: URL diff for Admin, SD/AD, Retailer` | Architecture | Host Routing / Shell | Portal switcher simulating independent subdomains |
| | `Note 5: 1 ID login at a time for SD/AD/Retailer` | Shell | Header / Security Badge | Single-session policy indicator & simulated active lock |

---

### PAGE 2: Hierarchy, Approvals & Role Responsibilities
| PDF Section / Diagram | PDF Item | Mapped Portal | Mapped Menu / Submenu | Screen Interaction & Features |
|---|---|---|---|---|
| **Organizational Tree** | `Admin -> SD -> AD -> Retailer` | Admin & Distributor | `/admin/merchants?tab=channel`, `/distributor/network` | Interactive visual hierarchy tree and drilldown table |
| **Approval Flow** | `for Approval -> Arrow up to Admin CRM` | Admin | `/admin/compliance?tab=pending-onboarding` | Approval queue for AD-submitted merchant onboardings |
| **Features of AD** | `(1) Onboard Retailer / Merchant (Initiate)` | Distributor (AD view) | `/distributor/onboarding?tab=initiate` | AD-led merchant initiation wizard |
| | `(2) Send Request for Approval to Admin Portal` | Distributor (AD view) | `/distributor/onboarding?tab=status` | Track status of submissions sent to Admin for approval |
| | `(3) Process KYC (info/docs, Video KYC, Digital footprint)` | Distributor (AD view) | `/distributor/onboarding?tab=kyc` | Document capture & 30s Video KYC recorder simulator |
| | `(4) Geographical location` | Distributor (AD view) | `/distributor/onboarding?tab=geo` | Geo-tagging capture (Lat/Long & shop premises) |
| | `(5) Request for Payments related Queries to SD & Admin` | Distributor (AD view) | `/distributor/support?tab=raise` | Query escalation to Super Distributor & Admin |
| | `(6) Handover Kit to Retailers` | Distributor (AD view) | `/distributor/network?tab=kits` | Physical/digital starter kit issuance tracker |
| **Features of SD** | `(1) Onboard Area Distributors and increase scale` | Distributor (SD view) | `/distributor/network?tab=onboard-ad` | Area Distributor recruitment & onboarding form |
| | `(2) Verify ADs and Track work & Activity` | Distributor (SD view) | `/distributor/network?tab=ad-list` | AD activity audit table, retailer counts, and volume |
| | `(3) Request out for Payment Queries to Admin for Approval`| Distributor (SD view) | `/distributor/support?tab=escalations` | SD payment query escalation console |
| | `(4) Clear all Queries Related to Balance for AD & Retailers` | Distributor (SD view) | `/distributor/balance?tab=queries` | Subordinate balance resolution workspace |
| **Features of ADMIN (CRM)** | `(1) Overall control on SD/AD/Ret` | Admin | `/admin/merchants` | Global network management & hierarchy controls |
| | `(2) Process Approve SD/AD/Ret Onboarding & Payments` | Admin | `/admin/compliance`, `/admin/payments?tab=authorize` | One-click approval / rejection with audit trail |
| | `(3) Activate and Deactivate SD/AD/Ret services & Accounts` | Admin | `/admin/merchants?tab=activate`, `/admin/compliance?tab=auth-products` | Granular toggle switches for accounts & services |
| | `(4) Approve Payments and Track everything` | Admin | `/admin/payments`, `/admin/dashboard` | Master payment orchestration and ledger monitoring |

---

### PAGE 3: Admin Modules List, 12-Point KYC & Tempered Margin Engine
| PDF Section | PDF Item / Specification | Mapped Portal | Mapped Menu / Submenu | Screen Interaction & Features |
|---|---|---|---|---|
| **Admin Module List** | `Homepage` | Admin | `/admin/dashboard` | Centralized master telemetry dashboard |
| | `Merchant` | Admin | `/admin/merchants` | Full merchant lifecycle management module |
| | `Payments` | Admin | `/admin/payments` | Payment operations, authorizations & settlements |
| | `Manage Products` | Admin | `/admin/managed-products` | Product mapping, circles, vendors, bank accounts |
| | `Compliance` | Admin | `/admin/compliance` | KYC review, accounts, PA/Payout approvals |
| | `Reports` | Admin | `/admin/reports` | Comprehensive 12-report financial suite |
| | `Channel Report` | Admin | `/admin/channel-reports` | Channel volume, distributor shares, hierarchy stats |
| | `Support` | Admin | `/admin/support` | Dispute ticketing and helpdesk operations |
| | `Modifications (Updates)` | Admin | `/admin/modifications` | Profile, RMN, Commercials & Service template updates |
| **Roles Legend** | `EK, PO, SD, AD, RT` | Admin | `/admin/merchants?tab=roles` | Role assignment matrix (Executive, Partner, SD, AD, RT) |
| **12-Point KYC Process** | `1. Name` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Primary merchant legal & trade name inputs |
| | `2. Address / shop address` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Registered address and physical storefront address |
| | `3. Aadhaar & PAN Card` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | ID numbers with masked preview & OCR status |
| | `4. MSME / Udyam` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Udyam registration number and certificate upload |
| | `5. Mobile number (OTP verification)` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | RMN field with simulated SMS OTP verification |
| | `6. Email Address (OTP verification)` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Email field with simulated Email OTP verification |
| | `7. Cancelled cheque / Bank statement` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Bank account verification & document preview |
| | `8. 30 sec Video KYC (vKYC)` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Interactive video KYC simulator with playback & checklist |
| | `9. Merchant Selfie` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Live merchant photo capture & face match indicator |
| | `10. Employee with selfie` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Joint verification photo of field executive with merchant |
| | `11. Shop photo` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Storefront image with signboard visible |
| | `12. Signature / Thumbs` | Admin & Dist (AD) | Merchant KYC Form / Reviewer | Digital signature pad and biometric thumb capture mock |
| **Tempered Margin Cost** | `101 - 1000 -> 7 Rs` | Admin & Retailer | `/admin/modifications?tab=commercial`, `/retailer/services` | Flat ₹7 fee calculation engine for ₹101–₹1,000 |
| | `1001 - 2000 -> 9 Rs` | Admin & Retailer | `/admin/modifications?tab=commercial`, `/retailer/services` | Flat ₹9 fee calculation engine for ₹1,001–₹2,000 |
| | `2001 - [No Cap] -> 0.2%, 0.3%, 0.35%, 0.5%` | Admin & Retailer | `/admin/modifications?tab=commercial`, `/retailer/services` | Percentage slabs (0.2%–0.5%) without arbitrary upper cap |

---

### PAGE 4: Admin Portal Deep Submenus (Merchant, Payments, Managed Products, Support)
| PDF Module | PDF Submenu / Field Item | Mapped Submenu Route / Tab | Screen Interactions & Form Fields |
|---|---|---|---|
| **Merchant** | `Search Merchant` | `/admin/merchants?tab=search` | Search by RMN, Name, Store, Aadhaar, Role, State |
| | `Create Merchant` | `/admin/merchants?tab=create` | RMN, Name, Email, Store Name, Category, Address, State/City, Role (C&F, Master Dist, Dist), Aadhaar |
| | `Create Merchant KYC` | `/admin/merchants?tab=create-kyc` | Full 12-point KYC form with file uploads & 30s vKYC |
| | `View Merchant` | `/admin/merchants?tab=view` | Comprehensive merchant dossier with status chips |
| | `Merchant Channel` | `/admin/merchants?tab=channel` | Upstream SD/AD mapping and downstream network view |
| | `Password Resends` | `/admin/merchants?tab=passwords` | Secure password reset & credential dispatch log |
| | `Activate Merchants` | `/admin/merchants?tab=activate` | Status toggle (Active, Suspended, Inactive) with reason |
| | `Daily Merchants Balance` | `/admin/merchants?tab=balances` | Ledger balance, opening/closing, daily credit/debit totals |
| **Payment** | `Authorize Payments (Approve Pay)` | `/admin/payments?tab=authorize` | Maker-checker approval queue for high-value / flagged payments |
| | `Reverse Payments (Refund)` | `/admin/payments?tab=reverse` | Refund initiation & reversal processing console |
| | `Initiate Payments` | `/admin/payments?tab=initiate` | Agent RMN, Bank, Pay Mode, Bank Ref No, Deposit Date, Deposit Amount, Remarks, Passwords |
| | `Payment Report` | `/admin/payments?tab=report` | Comprehensive chronological payment transaction ledger |
| | `Payment Status Report` | `/admin/payments?tab=status-report` | Breakdown by status: Success, Pending, Failed, Disputed |
| | `Reversal Report` | `/admin/payments?tab=reversal-report` | Log of all refunded and reversed transactions |
| | `Approve Settlement (Settlement Trans)` | `/admin/payments?tab=settlement` | Batch settlement run review and authorization |
| | `Network Payment Report` | `/admin/payments?tab=network-report` | Volume aggregated by SD, AD, and Retailer branches |
| **Managed Products** | `Merge Products (All Utility Pay)` | `/admin/managed-products?tab=merge` | Utility payment product bundle manager |
| | `Circlewise Products` | `/admin/managed-products?tab=circles` | Telecom / utility circle configuration (22 circles) |
| | `Map Products (Operator, Circle, Vendor)` | `/admin/managed-products?tab=map` | Routing rules: Operator + Circle -> Selected Vendor |
| | `Manage Bank Accounts` | `/admin/managed-products?tab=bank-accounts` | Platform settlement & pool account registry |
| | `Manage Bank Charges` | `/admin/managed-products?tab=bank-charges` | Interchange & provider fee configuration |
| | `Manage Pending Pan Agents` | `/admin/managed-products?tab=pan-agents` | NSDL/UTI PAN agency onboarding approval queue |
| | `Manage Pending Pan Coupons` | `/admin/managed-products?tab=pan-coupons` | PAN card electronic coupon stock allocation |
| | `Manage User Sign up` | `/admin/managed-products?tab=signups` | Self-registered user vetting & tier assignment |
| | `Online Transaction Summary Table` | `/admin/managed-products?tab=transactions` | Operator \| Total \| 5% \| 7% \| Success \| Unset \| Fail \| Pending \| Refunded \| Detail |
| | `Transaction Detail Columns` | `/admin/managed-products?tab=transactions` | Operator, Status, Date, OpID, Source, Response, Circle, User, Customer, TransID, Amount, Category |
| **Support** | `Open Tickets` | `/admin/support?tab=open` | Real-time queue of open and in-progress tickets |
| | `Book Ticket` | `/admin/support?tab=book` | Form: Complaint Type (Transaction / Service / Payment), Category, Transaction ID, Remarks |
| | `Ticket Status` | `/admin/support?tab=status` | Ticket SLA countdown, state badge, assignees |
| | `Ticket List` | `/admin/support?tab=list` | Historical archive of all resolved and closed tickets |
| | `Update Contact Us` | `/admin/support?tab=contact` | Helpdesk phone, escalation email, WhatsApp support numbers |

---

### PAGE 5: Compliance, 12 Reports & Modifications
| PDF Module | PDF Submenu Item | Mapped Submenu Route / Tab | Screen Interactions & Form Fields |
|---|---|---|---|
| **Compliance** | `Pending Onboarding` | `/admin/compliance?tab=pending-onboarding` | Unverified merchant cases awaiting compliance sign-off |
| | `Pending Accounts` | `/admin/compliance?tab=pending-accounts` | Bank account penny-drop / verification queue |
| | `KYC List` | `/admin/compliance?tab=kyc-list` | Directory of verified, rejected & pending KYC dossiers |
| | `Account List` | `/admin/compliance?tab=account-list` | Approved merchant bank settlement accounts |
| | `Authorize Merchant Products` | `/admin/compliance?tab=auth-products` | Enable/disable specific payment rails per merchant |
| | `Payout Merchants` | `/admin/compliance?tab=payout-merchants` | Merchants cleared for direct bank payout operations |
| | `PA Merchants` | `/admin/compliance?tab=pa-merchants` | Payment Aggregator merchant compliance register |
| | `Upload Account` | `/admin/compliance?tab=upload-account` | Bulk account upload via CSV with validation errors |
| | `Upload Onboarding documents` | `/admin/compliance?tab=upload-docs` | Compliance officer evidence upload & audit attachment |
| | `Modify location` | `/admin/compliance?tab=location` | Storefront GPS coordinate & jurisdiction correction |
| | `AEPS Onboarding System Status` | `/admin/compliance?tab=aeps-status` | Bank NPCI/UIDAI AEPS terminal onboard status |
| | `Merchant Activity -> Daily Activation` | `/admin/compliance?tab=activity` | First-transaction tracker & daily activation analytics |
| **Reports (12 Specific)** | `1. Account ledger (Dates / Agent RMN)` | `/admin/reports?tab=account-ledger` | Authoritative debit/credit ledger filtered by RMN & dates |
| | `2. View ledger (Wallet / Dates / Agent RMN)` | `/admin/reports?tab=wallet-ledger` | Rolling wallet balance ledger with transaction references |
| | `3. View Transactions (Dates/C.No/T.ID/Op/Vendor/Stat)`| `/admin/reports?tab=view-transactions` | Multi-filter transaction search grid |
| | `4. View AEPS Transaction` | `/admin/reports?tab=aeps-transactions` | AEPS cash withdrawal, balance enquiry & mini-statement logs |
| | `5. AEPS Wallet settlement Reports` | `/admin/reports?tab=aeps-wallet-settlement` | AEPS sub-wallet to main wallet balance movement |
| | `6. DMT Transaction` | `/admin/reports?tab=dmt-transactions` | Domestic Money Transfer beneficiary remittances |
| | `7. Credit Card Transactions Reports` | `/admin/reports?tab=card-transactions` | Credit card checkout, settlement and MDR records |
| | `8. AEPS Bank Settlement reports` | `/admin/reports?tab=aeps-bank-settlement` | Remittance to merchant linked bank account via nodal bank |
| | `9. DMT PPI Transactions` | `/admin/reports?tab=dmt-ppi` | Prepaid Payment Instrument wallet-to-bank transactions |
| | `10. DMT Fino Transactions` | `/admin/reports?tab=dmt-fino` | Fino Payments Bank integration transaction logs |
| | `11. Payout Report` | `/admin/reports?tab=payout-report` | Batch and instantaneous merchant payout statements |
| | `12. PA Transaction Report & UPI PA Report` | `/admin/reports?tab=pa-report` | Payment Aggregator gateway volume & UPI PA breakdown |
| **Modifications** | `Modify Mobile Number (RMN / New AD RMN)` | `/admin/modifications?tab=mobile` | Secure RMN update workflow with dual-OTP simulation |
| | `Change mapping (Retailer -> New AD RMN)` | `/admin/modifications?tab=mapping` | Transfer retailer downstream ownership between ADs |
| | `Modify Profile (Name, Email, Shop, Category, Address)`| `/admin/modifications?tab=profile` | Administrative merchant profile edits |
| | `Modify Commercial & Create Commercial` | `/admin/modifications?tab=commercial` | Tempered margin editor (₹7/₹9 fixed + % overrides) |
| | `Create Commercial Template` | `/admin/modifications?tab=commercial-template` | Reusable pricing schedule templates |
| | `Modify / Check Service Template` | `/admin/modifications?tab=service-templates` | Service enablement bundle assignment |
| | `Manage Prime Product (Payart & RazorPay/UPI)` | `/admin/modifications?tab=prime-products` | Payout branch rules (IPCC, 4/8 State, RazorPay, UPI) |
| | `Update Notification` | `/admin/modifications?tab=notifications` | System-wide broadcast notice authoring tool |
| **Channel Reports** | `Channel Performance Reports` | `/admin/channel-reports` | Hierarchical volume, margin breakdown, SD/AD leaderboard |
