# Buymecart / BSpark Digitized - Phase 0 architecture review

**Status:** Ready for design approval. No application code, schema migration, integration, or deployment has been performed.

## Evidence reviewed

- The five-page source brief, `buymecart.org bspark_digitized.pdf`.
- The supplied master prompt.
- The current workspace (`F:\MAster project`), which is empty: no repository, application, package manifest, environment file, schema, migration, or existing implementation was found.

## Requirement reconciliation

The PDF and master prompt agree on a three-portal product and the hierarchy Main Admin -> Super Distributor (SD) -> Area Distributor (AD) -> Retailer. The source adds these requirements to preserve in discovery and design:

- Separate URLs for Admin, Distributor (SD and AD), and Retailer; no logos on transaction slips/receipts.
- SD/AD/Retailer must have only one active login session per user at a time.
- Distributor-led onboarding: AD can initiate retailer/merchant onboarding; SD can onboard and oversee ADs; Admin approves and manages activation.
- KYC evidence includes identity/address proof, PAN/Aadhaar, Udyam where applicable, mobile/email OTP verification, shop and merchant/employee photographs, signature/thumb capture, location, and 30-second video KYC. Data collection must be confirmed against the applicable legal and provider requirements before implementation.
- Service catalogue candidates include UPI, cards, bank transfers (IMPS/NEFT/RTGS), DMT, AEPS, e-mandates/NACH, BBPS, recharge, travel/bookings, payout, bulk payment, and utility services. These are candidates, not enabled integrations.
- Admin operating areas include merchant management, payments, product/provider configuration, compliance, reports, channel reporting, support, notifications, commercial configuration, and investigation.

The PDF describes a ₹7 fee from ₹101-₹1,000 and ₹9 from ₹1,001-₹2,000. It lists percentage values (0.2, 0.3, 0.35, 0.4, 0.45, and 0.5) but does not establish their slab mapping, units, service applicability, tax, rounding, or revenue-sharing. They must remain configuration candidates, not executable production rules.

## Recommended product architecture

Start with a modular monolith with strict internal module boundaries. A Next.js TypeScript application should serve three host-aware portal shells, while a FastAPI application owns all authorization, business logic, integrations, and audit trails. PostgreSQL is the authoritative store; Redis is used only for cache, rate limiting, distributed locks, and short-lived coordination; a durable worker queue handles asynchronous work.

```
admin.buymecart.org       distributor.buymecart.org       retailer.buymecart.org
                                  |
                        Next.js portal application
                                  |
                  versioned, authenticated FastAPI API
                                  |
 Identity | Org/RBAC | Onboarding/KYC | Services/Providers | Transactions
 Pricing  | Ledger   | Refunds        | Settlements        | Support/Audit
                                  |
            PostgreSQL (authoritative) + Redis + durable workers
                                  |
        documented bank/provider sandbox adapters (after approval only)
```

### Architectural decisions

1. **One authoritative migration owner:** SQLAlchemy 2.x models and Alembic migrations. There is no Prisma schema in the empty workspace. Do not introduce Prisma for the same tables.
2. **Portal isolation:** host routing drives presentation only; every API request derives authorization server-side from a signed session, role, organization, and hierarchy scope. A hidden UI control is never authorization.
3. **Financial integrity:** transactions, provider attempts/events, and double-entry journal entries are distinct records. Posted journal lines are append-only. Corrections are authorized compensating entries, never edits.
4. **Provider boundary:** provider adapters implement a common interface with idempotency, signed-webhook verification, status inquiry, timeout normalization, reconciliation import, and health checks. No provider endpoint, credential, or response model is invented.
5. **Data minimization:** documents and biometric/video evidence are metadata plus encrypted object-store references; sensitive files are never stored in frontend bundles or logs. The retention and access policy requires approval.
6. **Security baseline:** MFA for privileged roles, rotation/revocation-aware sessions, one active session policy where required, secure cookies, CSRF protection for cookie-authenticated mutations, rate limiting, immutable audit events, and least-privilege service/database roles.

## Proposed directory structure

```
apps/
  web/                         # Next.js portal UI and host routing
    app/(admin|distributor|retailer)/
    components/ features/ lib/ tests/
  api/                         # FastAPI modular monolith
    app/modules/{identity,org,onboarding,providers,transactions,pricing,ledger,refunds,settlements,support,reports,audit}/
    app/core/ app/workers/ tests/
packages/
  contracts/                   # versioned OpenAPI-generated TS client/types
  ui/                          # accessible shared design system
infra/
  compose/                     # local-only Compose configuration
docs/
  decisions/ requirements/ runbooks/
```

## Phase 1 design scope

Build only a realistic, clearly labelled mock frontend and typed API contracts:

- Admin: master dashboard, transaction investigation, KYC/onboarding queues, providers/services, pricing, settlement/reconciliation monitoring, support, reports, roles, and audit history.
- Distributor: role-sensitive SD/AD dashboards, subordinate scope visibility, retailer/onboarding management, service availability, authorized ledger/transaction views, support, and commercial reporting.
- Retailer: onboarding, services, mock transaction initiation, history/receipts, balance view, ticket/refund request, profile/security.
- Shared: responsive app shell, accessibility, status states, search/filter/sort/pagination, confirmation flows, mock-data source labels, Zod-validated forms, and frontend tests.

## Delivery plan and approval gates

1. **Approval now:** approve this architecture, screen scope, and unresolved-decision register.
2. **Phase 1:** scaffold the web workspace; implement the mock portals, design system, typed contracts, test coverage, and local setup documentation; then hold a design review.
3. **Approval after design review:** authorize backend/database work.
4. **Phase 2:** confirm ERD, migrations, RBAC, transaction state machine, ledger, audit, support, and API tests. Present the data and API design before any financial integration.
5. **Approval before integration:** connect only approved official provider sandbox contracts and perform security/performance/recovery testing.
6. **Approval before production:** prepare and review AWS infrastructure; deploy only with explicit production approval.

## Key risks and mitigations

- **Unconfirmed funds flow / wallet semantics:** do not model balances as customer funds or post settlement semantics until legal and operating models are signed off.
- **Ambiguous commercial rules:** versioned pricing configuration must stay inactive until slabs, rounding, tax, refunds, provider cost treatment, and channel allocation are approved.
- **KYC privacy and legal exposure:** validate the exact document, video-KYC, consent, retention, and data-residency policy before collecting live evidence.
- **Provider uncertainty:** maintain a capability registry; only expose services backed by approved contracts and provider limits.
- **Admin correction risk:** use workflow approvals, immutable audit events, and compensating records; never overwrite provider-confirmed outcomes.

## Approval requested

Approve Phase 1 frontend-only implementation, or provide changes to the architecture and the unresolved decisions in `requirements-register.md`. Backend/database, real provider connectivity, cloud deployment, and any real financial action remain explicitly out of scope pending later approval.
