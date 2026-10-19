# Buymecart - unresolved requirements register

| ID | Decision needed | Impact | Proposed approver | Required before |
|---|---|---|---|---|
| BR-01 | Percentage slab boundaries and applicable services | Pricing calculation and UI | Commercial owner | Activating pricing |
| BR-02 | Fee rounding, tax, refund/reversal commission treatment | Ledger and receipts | Finance/tax owner | Backend financial rules |
| BR-03 | SD/AD/retailer commission-share formula and eligibility | Commission allocation/reporting | Commercial owner | Commission engine |
| BR-04 | Wallet, payout, settlement, and legal funds-flow model | Ledger account design and settlement lifecycle | Finance/legal owner | Ledger/settlements |
| BR-05 | Approved banks/providers, API contracts, routing/fallback policy | Adapter implementation and service availability | Integration owner | Provider integration |
| BR-06 | Provider, rail, account, regulatory, and risk limits | Validation and risk controls | Compliance/integration owner | Transaction enablement |
| BR-07 | Refund eligibility, approvers, time limits, and proof | Refund workflow | Operations/compliance owner | Refund enablement |
| BR-08 | KYC data fields, consent, video-KYC process, retention, and residency | Onboarding UX, storage and access control | Compliance/legal owner | Live KYC collection |
| BR-09 | Roles and permission matrix, including CRM/RMN and support powers | Server-side authorization | Product/security owner | Backend RBAC |
| BR-10 | Receipt content and branding policy | Receipt generator | Product/compliance owner | Receipt production |
| BR-11 | Reporting definitions, report cadence, and data retention | Report jobs and operational reporting | Operations/finance owner | Backend reporting |
| BR-12 | Production availability/capacity, RPO/RTO, AWS region, and monitoring ownership | Infrastructure architecture | Engineering/operations owner | Cloud phase |
