# Buymecart platform - Phase 1 frontend

This is an intentionally frontend-only Next.js prototype. It uses typed mock data and labels all financial and operational values as demo data. It does not connect to a bank, payment provider, database, wallet, ledger, or production system.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/admin/dashboard`. Alternate portal shells are available at `/distributor/dashboard` and `/retailer/dashboard`.

## Phase boundaries

Backend/database work, provider adapters, real financial processing, and deployment require the approvals recorded in `docs/phase-0-architecture-review.md`.
