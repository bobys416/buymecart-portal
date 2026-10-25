# BuyMeCart / IBNK Platform - Docker Desktop Setup & Runtime Guide

## 1. Architecture Overview
This multi-tier fintech architecture is packaged for local execution on **Docker Desktop** (WSL2 / Linux containers) and native Windows development.

```
                           [Host Browser: localhost:3000]
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
     +-----------------------+                    +-----------------------+
     |  Next.js 15 Frontend  |                    |  FastAPI 0.156 Backend |
     |  (Container: frontend)|                    |  (Container: backend) |
     |  Port: 3000:3000      |                    |  Port: 8000:8000      |
     +-----------+-----------+                    +-----------+-----------+
                 | (Internal Bridge)                          |
                 +------------------ http://backend:8000 -----+
                                                              |
                                           +------------------+------------------+
                                           |                                     |
                                           v                                     v
                                +---------------------+               +---------------------+
                                |  buymecart-backend  |               |  buymecart-backend  |
                                |     -data volume    |               |   -storage volume   |
                                | (/app/data/*.db)    |               | (/app/storage/docs) |
                                +---------------------+               +---------------------+
```

---

## 2. Prerequisites
1. **Docker Desktop for Windows** (v24+ with WSL2 backend enabled).
2. Minimum 4GB RAM allocated to Docker WSL2.
3. Ports `8000`, `3000`, and `8081` available on `localhost`.

---

## 3. Quick Start (Docker Desktop)

### Step 1: Build & Launch All Containers
From the workspace root (`F:\MAster project`):
```powershell
docker compose up -d --build
```

### Step 2: Verify Container Health
```powershell
docker compose ps
```
Both `buymecart-backend` and `buymecart-frontend` should show status `Up (healthy)`.

### Step 3: Verify Backend Health Endpoints
```powershell
# Health status
Invoke-RestMethod -Uri "http://localhost:8000/health"

# Detailed readiness & database connectivity
Invoke-RestMethod -Uri "http://localhost:8000/ready"

# Test Machine Learning scoring engine
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/ml/fraud-score" -Method Post -ContentType "application/json" -Body '{"amount": 45000, "payment_mode": "DMT", "hour_of_day": 2, "ticket_size_multiplier": 3.5, "burst_count_10m": 5, "geo_distance_km": 150}'
```

### Step 4: Access Application Portals
- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
  - Admin Portal: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
  - Super Distributor Portal: [http://localhost:3000/super-distributor/dashboard](http://localhost:3000/super-distributor/dashboard)
  - Area Distributor Portal: [http://localhost:3000/area-distributor/dashboard](http://localhost:3000/area-distributor/dashboard)
  - Retailer Portal: [http://localhost:3000/retailer/dashboard](http://localhost:3000/retailer/dashboard)
- **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Specifications**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Pre-Configured UAT Accounts
The backend automatically executes database migrations (`alembic upgrade head`) and seeds 7 synthetic UAT accounts on container launch:

| Role | Login ID | Default Password | Territory / Scope |
| :--- | :--- | :--- | :--- |
| **Admin Master** | `admin@buymecart.org` | `AdminPass#2026` | Root System Control |
| **Super Distributor** | `sd.central@buymecart.org` | `SuperDistPass#2026` | Central India Region |
| **Area Distributor** | `ad.zone1@buymecart.org` | `AreaDistPass#2026` | Zone-01 Bhopal / MP |
| **Retailer** | `retailer.store1@buymecart.org` | `RetailerPass#2026` | Sharma Digital (₹50,000 float) |
| **Cross-SD (South)** | `sd.south@buymecart.org` | `SuperDistPass#2026` | Southern Region |
| **Cross-AD (South)** | `ad.south1@buymecart.org` | `AreaDistPass#2026` | Zone-South-01 |
| **Cross-Retailer** | `retailer.south1@buymecart.org` | `RetailerPass#2026` | Metro South (₹25,000 float) |

---

## 5. Persistent Volumes & Data Retention
All databases and uploaded KYC documentation are stored in Docker managed named volumes:
- `buymecart-backend-data`: Mounted to `/app/data` inside the backend container. Holds the SQLite database file (`buymecart_dev.db`).
- `buymecart-backend-storage`: Mounted to `/app/storage`. Holds encrypted KYC documents and video recordings.

To inspect persistent volumes:
```powershell
docker volume ls
docker volume inspect buymecart-backend-data
```

---

## 6. Container Commands & Troubleshooting

### View Container Logs
```powershell
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend
```

### Run Commands Inside Containers
```powershell
# Run a Python shell inside backend container
docker compose exec backend python

# Re-run migrations manually
docker compose exec backend alembic upgrade head

# Re-seed synthetic UAT users
docker compose exec backend python scripts/seed_uat_users.py
```

### Stop Containers
```powershell
# Stop without destroying data volumes
docker compose down

# Stop and wipe persistent data volumes (clean reset)
docker compose down -v
```

---

## 7. Native Host Runtime (Alternative Without Docker)
If you prefer running services directly on your host machine:

### Terminal 1: Backend
```powershell
.\backend\.venv\Scripts\uvicorn.exe app.main:app --app-dir backend --reload --port 8000
```

### Terminal 2: Frontend
```powershell
npm.cmd run dev
```

### Terminal 3: Mobile (Expo React Native)
```powershell
npm.cmd --prefix mobile run start
```
