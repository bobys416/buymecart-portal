# Buymecart / IBNK — Local Development & Testing Guide

**Version:** 1.0.0  
**Phase:** 8 — Local Execution & Team UAT  
**Applicability:** Windows / macOS / Linux  

---

## 1. System Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js**: `v20.x` or higher (`node -v`)
- **npm**: `v10.x` or higher (`npm -v`)
- **Python**: `3.11` or `3.12` (`python --version`)
- **Git**: Latest version

---

## 2. Quick Start (Automated One-Click)

The repository provides automated scripts to start and stop both the FastAPI backend and Next.js frontend concurrently.

### Starting Local Development
In PowerShell:
```powershell
.\start-dev.ps1
```
Or via npm scripts in separate terminals:
- **Terminal 1 (Backend):**
  ```powershell
  npm run backend:dev
  ```
- **Terminal 2 (Frontend):**
  ```powershell
  npm run dev
  ```

### Stopping Local Development
In PowerShell:
```powershell
.\stop-dev.ps1
```

---

## 3. Step-by-Step Manual Setup

### Step A: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```powershell
Copy-Item .env.example .env
```
Key development settings (already configured with safe development defaults):
```ini
ENVIRONMENT=development
DATABASE_URL=sqlite:///./buymecart_dev.db
ENABLE_LIVE_BANKING=False
PAYMENT_PROVIDER_MODE=sandbox
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Step B: Python Backend Virtual Environment
1. Create and activate a Python virtual environment:
   ```powershell
   python -m venv backend\.venv
   .\backend\.venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```

### Step C: Database Initialization & Migrations
Run the Alembic migration suite to establish the complete schema (including ledger, KYC, and BSpark banking tables):
```powershell
.\backend\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head
```

### Step D: Seed Synthetic Team UAT Accounts
Populate the database with predefined, isolated test users and merchant wallets:
```powershell
.\backend\.venv\Scripts\python.exe backend/scripts/seed_uat_users.py
```

### Step E: Install Frontend Dependencies
From the repository root:
```powershell
npm install
```

---

## 4. Verified Test Accounts for Team UAT

All test accounts use standardized sandbox passwords and are pre-linked in the hierarchy:

| Role | Login Identifier | Password | Hierarchy Position / Notes |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@buymecart.org` | `AdminPass#2026` | Root platform authority; full access to all portals and settings |
| **Super Distributor (Central)** | `sd.central@buymecart.org` | `SuperDistPass#2026` | Reports to Admin; manages Zone-01 Area Distributors |
| **Area Distributor (Zone 01)** | `ad.zone1@buymecart.org` | `AreaDistPass#2026` | Reports to SD Central; manages Store 01 Retailer |
| **Retailer (Store 01)** | `retailer.store1@buymecart.org` | `RetailerPass#2026` | Reports to AD Zone-01; **Initial Wallet: ₹50,000.00** |
| **Super Distributor (South)** | `sd.south@buymecart.org` | `SuperDistPass#2026` | Secondary isolated tree for cross-hierarchy testing |
| **Area Distributor (South 01)** | `ad.south1@buymecart.org` | `AreaDistPass#2026` | Reports to SD South |
| **Retailer (South 01)** | `retailer.south1@buymecart.org` | `RetailerPass#2026` | Reports to AD South 01; **Initial Wallet: ₹25,000.00** |

---

## 5. Application URLs & Health Checks

Once started:
- **Frontend Portal (Home / Directory):** `http://localhost:3000` (or `http://localhost:3001`)
- **Admin Portal Direct:** `http://localhost:3000/admin/dashboard`
- **Distributor Portal Direct:** `http://localhost:3000/distributor/dashboard`
- **Retailer Portal Direct:** `http://localhost:3000/retailer/dashboard`
- **Backend API Docs (Swagger):** `http://localhost:8000/api/v1/docs`
- **Backend Liveness Probe:** `http://localhost:8000/health`
- **Backend Readiness Probe:** `http://localhost:8000/ready`

---

## 6. Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```powershell
.\backend\.venv\Scripts\pytest.exe backend/tests -v
```
*Current Baseline:* **85 passed (100%)**

### Frontend Unit & Component Tests (vitest)
```powershell
npm test
```
*Current Baseline:* **103 passed (100%)**

### Production Build Validation
```powershell
npm run build
```
*Current Baseline:* **0 errors, clean Next.js 15 build**

---

## 7. Troubleshooting Guide

| Issue / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **Port 3000 already in use** | A previous Node process is running. | Next.js automatically switches to `http://localhost:3001`. Both ports are whitelisted in CORS. To terminate previous Node instances: `Get-Process node \| Stop-Process -Force`. |
| **Port 8000 already in use** | A previous Uvicorn process is running. | Find and terminate: `Get-Process python \| Stop-Process -Force`. |
| **Alembic migration error / table exists** | SQLite file schema conflict. | Delete `buymecart_dev.db`, rerun `alembic upgrade head`, and execute `seed_uat_users.py`. |
| **JWT Expired / 401 Unauthorized** | Access tokens expire in 60 minutes. | Re-authenticate via `POST /api/v1/auth/login` or refresh via `POST /api/v1/auth/refresh`. |
| **SSRF error when configuring provider** | Base URL points to an unapproved external or private IP. | Ensure host is added to `APPROVED_PROVIDER_HOSTS` in `backend/app/services/payment_provider.py`. |
