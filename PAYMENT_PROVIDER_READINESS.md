# BSpark Payment Gateway & Banking Provider Readiness Register

**Document Version:** 1.0.0  
**Phase:** 7.6 Acceptance Testing & Readiness Audit  
**Date:** 2026-10-21  
**Project:** Buymecart / IBNK High-Security Core Fintech Platform  
**Compliance Standard:** RBI Master Directions on Payment Aggregators and Payment Gateways (PA/PG)  

---

## 1. Provider Register Matrix

| Field | 1. BSpark Universal Gateway (Native Rail) | 2. Mock Switch Adapter (Deterministic Engine) | 3. ICICI Bank Corporate Internet Banking (CIB) | 4. State Bank of India CBS API |
| :--- | :--- | :--- | :--- | :--- |
| **Provider Role** | Primary Internal Payment Orchestrator & Native Gateway | Deterministic Test Double for CI/CD & Local Execution | Upstream Settlement & Payout Rail (Planned) | Upstream Settlement & Bulk Clearing Rail (Planned) |
| **Official Documentation Status** | **Complete** (Internal architecture & payment contract specification) | **Complete** (Deterministic test double specification) | **Blocked** (Awaiting bank execution of API non-disclosure agreement & official API pack) | **Blocked** (Awaiting formal bank corporate partnership agreement) |
| **Sandbox Access Status** | **Active & Verified Locally** (`http://localhost:8000/api/v1/banking-api`) | **Active & Verified** in test suites | **Blocked** (Awaiting UAT net banking portal credentials from bank) | **Blocked** (Awaiting staging VPN/SFTP credentials) |
| **Credentials Configured** | **Yes** (Referenced via KMS: `kms://vault/bspark/gateway/sandbox/api_key`) | **Yes** (Deterministic test secrets configured) | **No** (Pending corporate bank issuance) | **No** (Pending corporate bank issuance) |
| **Supported Services** | Collection (UPI/Cards), Payouts (IMPS/NEFT), Penny Drop (Account Verification), Status Inquiry, Partial Refunds, Webhooks, Settlement Reports | Complete simulation of all 7 capabilities + fault injection (timeouts, failures, amount tampering) | Payouts (IMPS/NEFT/RTGS), Account Verification, Balance Inquiry | Bulk Payouts, Account Statement, Settlement File Clearing |
| **Adapter Implementation Status** | **Implemented** (`BSparkGatewayAdapter` in `payment_provider.py`) | **Implemented** (`MockBankingProviderAdapter` in `payment_provider.py`) | **Planned / Scaffolded Contract** (`ProviderRegistry` capability hooks ready) | **Planned / Scaffolded Contract** (`ProviderRegistry` capability hooks ready) |
| **Callback Verification Status** | **Verified** (HMAC-SHA256 signature verification & idempotent payload hashing) | **Verified** (Simulated signature validation & replay detection) | **Blocked** (Pending bank callback specification & certificate format) | **Blocked** (Pending bank callback specification & SFTP encryption keys) |
| **Test Results** | **85 / 85 pytest tests passed; 103 / 103 vitest tests passed** | **14 / 14 reconciliation tests passed; 8 / 8 banking API tests passed** | **Pending upstream credentials** (Not tested against live bank API) | **Pending upstream credentials** (Not tested against live bank API) |
| **Outstanding Blockers** | None for internal orchestration; awaiting production corporate bank contracts for external settlement | None | 1. Corporate Internet Banking API agreement<br>2. Production Client mTLS Certificate & RSA Public Key<br>3. Outbound static IP whitelisting with bank firewall | 1. Bank host-to-host connectivity agreement<br>2. SFTP / Direct VPN tunnel configuration<br>3. Staging environment credentials |
| **Production Approval Status** | **Approved for Internal Gateway & Staging Orchestration** | **Approved for Testing & CI/CD Only** (Disabled in production) | **HOLD** (Awaiting regulatory, legal, and bank approvals) | **HOLD** (Awaiting regulatory, legal, and bank approvals) |

---

## 2. Core Architectural Invariants

### Invariant 1: Proprietary BSpark Gateway Preservation
In accordance with explicit business instructions, **BSpark's native payment gateway is preserved as the application-facing orchestrator**. Third-party aggregators (Razorpay / Cashfree) do not replace BSpark. Upstream commercial banks operate as underlying payment rails routed through BSpark adapters.

### Invariant 2: Capability-Based Routing
Provider routing is governed by declared capabilities (`COLLECTION`, `PAYOUT`, `ACCOUNT_VERIFICATION`, `STATUS_INQUIRY`, `REFUND`, `WEBHOOK`, `SETTLEMENT_REPORT`). No route is assigned to an upstream provider that lacks explicit declared support for that rail.

### Invariant 3: Zero Blind Failover
If an outbound payment request times out or returns an uncertain HTTP response, **the transaction status is marked `UNKNOWN` and locked**. The system **never** automatically reroutes the payment to an alternative banking rail without first verifying the terminal state of the initial request via provider status query or reconciliation.

### Invariant 4: Zero Plaintext Credential Storage
All provider credentials stored in `banking_provider_configs` must use KMS or HashiCorp Vault references (e.g., `kms://vault/bspark/...`). Plaintext API keys, passwords, and private keys are strictly rejected at the schema validation boundary.

### Invariant 5: SSRF Protection
Outbound provider endpoints are validated against an explicit hostname whitelist (`APPROVED_PROVIDER_HOSTS`). Internal private IP addresses and cloud metadata services (`169.254.169.254`, `metadata.google.internal`) are unconditionally blocked.

---

## 3. Production Activation Checklist (For Phase 9)

Prior to enabling live commercial banking rails:
- [ ] Finalize corporate bank agreements with ICICI Bank and State Bank of India.
- [ ] Procure static public IP addresses for the production egress gateway.
- [ ] Exchange mTLS client certificates and RSA keys with banking partners.
- [ ] Complete formal end-to-end UAT in the bank's staging/sandbox environment.
- [ ] Complete external VAPT (Vulnerability Assessment and Penetration Testing).
- [ ] Obtain formal sign-off from Chief Information Security Officer (CISO) and Compliance Officer.
