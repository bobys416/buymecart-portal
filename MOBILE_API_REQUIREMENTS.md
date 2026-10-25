# Mobile API Requirements

## Purpose

This document defines the API requirements for the mobile application so that the web and mobile experiences stay aligned with the same authoritative backend and ledger rules.

## Core principle

The mobile app must not implement a second financial system. It must call the same backend as the web portal and use the same wallet, auth, ledger, and role governance contracts.

## Required API contracts

### Authentication and session management

- Use the same authentication backend as the web portal
- Support access tokens and refresh tokens through secure storage
- Enforce session expiry and reauthentication for stale or revoked sessions
- Support biometric authentication as a convenience layer, not as a replacement for backend authorization
- Require attacker-resistant device token binding for push notifications when implemented

### Authorization and access control

- Role-based routing must be enforced server-side
- Retailer, area distributor, super distributor, and admin access must be validated in the same domain logic used by the web app
- Wallet and ledger visibility must remain scoped by organizational hierarchy and backend permissions

### Payment / wallet flows

- Payment initiation must require an idempotency key
- Wallet balances must be fetched from backend-owned ledger data
- Payment status polling must be supported for in-flight and pending transactions
- Financial actions must log server-side journal entries before confirmation
- No direct wallet crediting from the client side

### Transaction and ledger

- Transaction listing must be paginated
- Transaction detail endpoints must return consistent data across web and mobile
- Search/filtering should support field-based queries with server-side pagination
- Status values and state transitions must be harmonized across client apps

### KYC and identity

- Document uploads must use secure API endpoints with signed or authorized uploads
- KYC status should be part of the same user/profile contracts as the web app
- Upload flows must support mobile camera and photo library inputs

### Notification and lifecycle

- Push registration API must bind the device to the current user session
- Notification delivery must use backend-managed senders and not client-side state alone
- Offline queue actions must sync when network is restored
- Network errors and retry behavior must be deterministic and idempotent

## Required backend behaviors for mobile compatibility

| Requirement | Required backend behavior |
|---|---|
| Authentication consistency | Same JWT/session model for all clients |
| Role-based access | Same RBAC enforcement as web busi ness rules |
| API versioning | Keep a stable versioned API surface |
| Pagination | Required for ledger/transactions lists |
| Error handling | Standardize error payloads and machine-readable statuses |
| Idempotency | Required for payment and wallet mutating actions |
| Status polling | Required for pending payment/switch states |
| Secure file upload | Required for KYC and financial document workflows |
| Push registration | Required for mobile notifications |

## Recommended policy

The mobile client should remain a thin client on top of the FastAPI backend. It should display and submit logic driven by server-side validation, not mirror business rules locally without audit or security controls.

## Implementation notes

- Current `backend/app/main.py` already applies CORS and secure headers
- `backend/app/api/ledger.py` already provides core wallet and transaction APIs for mobile use
- The main phase-1 gap is productizing the mobile client so it consumes these endpoints in a secure, tested way without using temporary mock tokens in production
