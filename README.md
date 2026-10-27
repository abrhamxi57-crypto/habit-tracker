# HabitFlow 🚀

> **HabitFlow** is a modern, high-performance, offline-first Progressive Web Application (PWA) and backend service designed for habit tracking, streak management, behavioral consistency analytics, and deterministic productivity insights.

Built with an obsidian command-center aesthetic, HabitFlow gives users a comprehensive view of their habits with GitHub-style contribution heatmaps, weekly matrix tracking, offline two-way synchronization, and deep statistical analytics.

---

## ✨ Key Features

### 1. 🖥️ Command-Center Dark Aesthetic
- **Visual Design:** Tailored obsidian palette (`#0f1115`, `#131619`, `#1a1d22`) accented by radiant lilac (`#b78af7`) and amber (`#e8b95c`).
- **52-Week Activity Heatmap:** GitHub-style annual contribution grid tracking daily completion density with dynamic hover tooltips.
- **Full-Width Weekly Matrix:** 7-day responsive matrix with day-specific circular badges, color-coded habit icons, progress fractions, and interactive checkmarks.
- **Calendar & Matrix Modes:** Seamless toggle between the wide weekly matrix and full 31-day month view.

### 2. 📴 Offline-First Architecture (PWA + IndexedDB)
- **Zero-Latency UI:** All habit interactions (completing, toggling, editing) write instantly to local IndexedDB via **Dexie.js**.
- **Service Worker Caching:** Powered by **Workbox**, precaching application shells and assets for seamless offline operation.
- **Automatic Two-Way Synchronization:** Background synchronization engine replays pending operations and resolves conflicts with the central server upon network reconnection.

### 3. 🧠 Pure Domain Streak Engine
- **Timezone Awareness:** Normalized UTC calculation against user local timezones.
- **Custom Schedules & Rest Days:** Habits with flexible frequencies (e.g. 5 days/week or custom days like Mon/Wed/Fri) never penalize designated rest days.
- **Streak Freezes:** Configurable freeze buffers preserve historical momentum when unexpected disruptions happen.

### 4. 🔍 Explainable Deterministic Insights Engine
- Generates transparent, actionable behavioral feedback (peak completion windows, weekend drop-off detection, habit correlation pairs) using deterministic statistical modeling—**100% private, with zero reliance on opaque third-party AI APIs**.

### 5. 🛡️ Secure Authentication & Rate Limiting
- **Dual-Token Auth:** Standard JWT access tokens (short-lived) + refresh tokens with bcrypt password hashing.
- **Sliding-Window Rate Limiting:** In-memory distributed token bucket preventing brute-force and credential stuffing.
- **Guest / Demo Mode:** Ready to test immediately with built-in realistic demo data.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, date-fns, Recharts |
| **Local Storage & PWA** | Dexie.js (IndexedDB), Workbox, Vite PWA Plugin |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Database & ORM** | PostgreSQL 16 (production), SQLite (local dev), SQLAlchemy 2.0, Alembic migrations |
| **Container & Proxy** | Docker, Docker Compose, Nginx (Alpine) |

---

## 📂 Project Architecture

```plaintext
HabitFlow/
├── backend/
│   ├── alembic/              # Database migration versions
│   ├── app/
│   │   ├── api/              # REST Routers (auth, habits, logs, analytics, insights, reminders, sync)
│   │   ├── core/             # Config, security, rate limiting, logging
│   │   ├── db/               # SQLAlchemy engine & session factory
│   │   ├── models/           # Relational models (User, Habit, Schedule, Completion, Reminder, Sync)
│   │   ├── schemas/          # Pydantic v2 request/response contracts
│   │   ├── services/         # Streak calculation, insights engine, reminders
│   │   └── seed.py           # Demo data seeder
│   ├── tests/                # Automated pytest test suite
│   ├── Dockerfile            # Multi-stage unprivileged backend container
│   ├── entrypoint.sh         # Auto-migration & uvicorn entrypoint
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, dashboard, analytics, habits, auth modal
│   │   ├── db/               # Dexie IndexedDB client schema
│   │   ├── pages/            # Dashboard, Analytics, Insights, Settings
│   │   ├── services/         # Habit service, streak calculations, sync, auth
│   │   ├── types/            # TypeScript domain interfaces
│   │   └── index.css         # Command-center styling & design system
│   ├── tests/                # Vitest test suite
│   ├── nginx.conf            # Production reverse proxy & caching rules
│   ├── Dockerfile            # Multi-stage production Nginx container
│   └── package.json          # Node dependencies & scripts
│
├── docker-compose.yml        # Orchestration (Postgres + Backend + Frontend/Nginx)
├── DEPLOYMENT.md             # Production deployment guide
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Option 1: Local Development (Quickest)

#### 1. Start Backend:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

### Option 2: Docker Compose (Production Environment)

Run the entire isolated multi-container stack (PostgreSQL + FastAPI + Nginx + React):

```bash
docker compose up --build
```
*(If prompted for socket permissions on Linux, run with `sudo docker compose up --build` or add your user to the `docker` group).*

- Application is immediately accessible at: **`http://localhost`**

---

## 🧪 Running Tests

### Backend Unit & Integration Tests:
```bash
cd backend
python3 -m pytest -v
```

### Frontend Tests & Type Checking:
```bash
cd frontend
npm run test
npm run build
```

---

## 📄 License
MIT License. Built with ❤️ for consistency and habit mastery.
