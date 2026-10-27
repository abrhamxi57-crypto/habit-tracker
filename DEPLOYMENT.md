# HabitFlow Production Deployment & Operations Guide

This guide documents the procedures for deploying, maintaining, backing up, and troubleshooting the HabitFlow Progressive Web App (PWA) and backend service.

---

## 1. Architecture Overview

* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite PWA, Workbox, Dexie (IndexedDB local store).
* **Reverse Proxy / Web Server:** Nginx 1.27 Alpine providing HTTP gzip compression, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`), non-cached PWA service-worker lifecycle, and API proxying.
* **Backend:** FastAPI, Python 3.12, SQLAlchemy 2, Pydantic v2, Alembic, Bcrypt, PyJWT.
* **Database:** PostgreSQL 16 (or SQLite in local zero-dependency development).

---

## 2. Pre-Deployment Checklist

- [ ] Copy `.env.example` to `.env` on the host machine.
- [ ] Generate a cryptographically secure 32-byte secret key: `openssl rand -hex 32` and assign to `SECRET_KEY`.
- [ ] Set a strong database password for `POSTGRES_PASSWORD`.
- [ ] Configure `CORS_ORIGINS` to match your production domain(s).
- [ ] Confirm DNS records point to your server IP.
- [ ] Ensure ports 80 and 443 are open on your host firewall.

---

## 3. Local Development

### Running with Docker Compose (Recommended)
```bash
# 1. Clone repository and set up environment
cp .env.example .env

# 2. Build and launch services
docker compose up --build -d

# 3. View real-time container logs
docker compose logs -f

# 4. Access application
# Frontend: http://localhost
# Backend health: http://localhost/api/health
```

### Running Locally without Docker
#### Backend:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
python3 -m alembic upgrade head

# Seed optional development data
python3 -m app.seed

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
# Vite runs at: http://localhost:5173 (proxies /api to backend)
```

---

## 4. Production Deployment Procedures

### Single-Server Docker Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Verify environment variables in .env
cat .env

# 3. Build and launch containers
docker compose -f docker-compose.yml up --build -d

# 4. Verify service health
docker compose ps
# Both habitflow-backend, habitflow-frontend, and habitflow-postgres should show "healthy"
```

### Database Migrations
Migrations run automatically upon backend container startup via `entrypoint.sh`.
To run migrations manually or verify status inside the container:
```bash
# Check current migration revision
docker compose exec backend python3 -m alembic current

# Upgrade to latest revision
docker compose exec backend python3 -m alembic upgrade head

# Downgrade by one revision (if rollback needed)
docker compose exec backend python3 -m alembic downgrade -1
```

---

## 5. Backup & Recovery Procedures

### Automated Database Backup
To create a timestamped PostgreSQL dump:
```bash
# Backup command
docker compose exec -t postgres pg_dump -U habitflow -F c habitflow > backup_habitflow_$(date +%Y%m%d_%H%M%S).dump

# Verify backup size
ls -lh backup_habitflow_*.dump
```

### Database Restoration
```bash
# 1. Stop backend container to avoid active write conflicts
docker compose stop backend

# 2. Restore database from backup file
cat backup_habitflow_20261027_100000.dump | docker compose exec -T postgres pg_restore -U habitflow -d habitflow --clean --if-exists

# 3. Restart backend
docker compose start backend

# 4. Verify database health
docker compose exec backend python3 -m alembic current
```

---

## 6. Safe PWA Updates & Cache Management

PWA updates must be deployed without stranding users with stale application shells:

1. **Service Worker Lifetime:**
   * Nginx serves `sw.js`, `registerSW.js`, and `manifest.webmanifest` with headers:
     `Cache-Control: no-cache, no-store, must-revalidate`.
   * Browsers check the service worker file byte-for-byte upon each visit.
2. **Fingerprinted Assets:**
   * JavaScript and CSS bundles are fingerprinted by Vite (e.g., `index-GKkOMhM_.js`) and cached immutably for 1 year.
3. **Data Protection:**
   * Service worker caches **only static assets** (HTML shell, scripts, styles, icons).
   * **API responses, tokens, and personal data are strictly excluded** from service-worker runtime caching, preventing privacy leaks or out-of-sync personal records.

---

## 7. Rollback Procedures

If an unexpected regression is detected post-deployment:

```bash
# 1. Roll back to previous git commit / docker image
git checkout <PREVIOUS_STABLE_COMMIT_HASH>

# 2. Revert database migration if the new migration introduced breaking schema changes
docker compose exec backend python3 -m alembic downgrade -1

# 3. Rebuild containers
docker compose up --build -d

# 4. Verify system health
curl -f http://localhost/api/health
```

---

## 8. Troubleshooting Guidance

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| `502 Bad Gateway` | Backend container starting or unhealthy | Check `docker compose logs backend` to inspect startup trace. |
| `429 Too Many Requests` | Rate limit exceeded on auth endpoint | The sliding window limiter allows 30 requests/min. Wait 60s or configure `RATE_LIMIT_SENSITIVE_PER_MINUTE`. |
| Database connection error | PostgreSQL container not ready | Verify `pg_isready` healthcheck with `docker compose ps postgres`. |
| PWA not updating | Stale browser cache | Hard reload (`Ctrl + Shift + R`) or click "Update available" prompt in the app header. |
| CORS Origin blocked | Client origin not in whitelist | Add client domain to `CORS_ORIGINS` in `.env` and restart backend. |
