# Buymecart - Phase 0 traceability matrix

| Requirement | Portal/screens | Planned API/module | Planned authoritative data | Validation |
|---|---|---|---|---|
| Three portals and SD/AD/Retailer scopes | Admin, Distributor, Retailer shells | Identity, Org/RBAC | users, roles, permissions, organizations, relationships, sessions | role/scope unit and Playwright tests |
| Onboarding and KYC approval | Admin compliance, SD/AD onboarding, Retailer profile | Onboarding/KYC | merchant profiles, KYC cases, documents, verification/approval history | form, workflow, access tests |
| Multiple payment services/providers | Admin services, Retailer initiation, Distributor availability | Provider registry, Transaction orchestration | providers, provider services, transactions, attempts, events | contract, idempotency, state-machine tests |
| Investigation, refunds, reversals | Admin transaction detail and support | Transactions, Refunds, Support/Audit | transaction events, provider attempts, refunds, tickets, audit events | lifecycle and authorization tests |
| Ledger and account reports | Admin financial reports, authorized channel views | Ledger, Reporting | accounts, journal entries/lines, snapshots, report jobs | debit=credit and reconciliation tests |
| Settlement/reconciliation | Admin settlement/reconciliation | Settlements | batches/items, reconciliation runs/exceptions | import, matching and exception tests |
| Tempered pricing | Admin commercial settings and pricing reports | Pricing | schedules, rules, overrides, versions, applied rule ref | deterministic calculation/version tests |
| Single active SD/AD/Retailer login | Account security | Identity/session security | sessions, security events | concurrent-session and revocation tests |
| Support and complaints | All portals, role-specific ticket lists | Support/notifications | tickets, messages, events, notifications | tenant scope and workflow tests |
| Operational dashboard | Admin master dashboard | Reporting/analytics | derived aggregates from authoritative modules | API aggregation and UI rendering tests |
