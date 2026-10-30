# UniVerse Operations & Incident Response Runbook

## 1. Quick Start & Service Orchestration

### Prerequisites
- Node.js v20+ or v24+
- npm v10+
- SQLite3 CLI

### Environment Setup
```bash
# Clone and install dependencies
npm install

# Seed verified demo database fixtures
npm run seed
# or using explicit executable script:
./scripts/seed-demo
```

### Starting Services
```bash
# Start both Backend API (:3001) and Frontend Client (:5173) concurrently:
npm run dev

# Alternatively, run server and client individually:
npm run dev:server
npm run dev:client
```

### Verification & Health Check
```bash
# Run complete test suite (305 automated tests):
npm test

# Verify production builds:
npm run build

# Query backend health endpoint:
curl http://localhost:3001/api/health
```

---

## 2. Database Backup & Reset Operations

The primary SQLite database resides at `server/data/universe.db`.

### Clean Database Reset
```bash
# Safety guard strictly refuses execution in production environments
./scripts/reset-demo
```

### Live Database Hot Backup (Zero Downtime via SQLite VACUUM)
```bash
sqlite3 server/data/universe.db ".backup server/data/universe_backup_$(date +%Y%m%d_%H%M%S).db"
```

---

## 3. Incident Triage Procedures

### Incident A: Driver Overbooking or Race Condition
- **Symptom**: HTTP 409 Conflict returned on `POST /api/rides/book`.
- **Diagnosis**: Two commuters attempted to claim the final seat on offer `offerId` simultaneously.
- **Remediation**: The system automatically rejected the second commuter due to SQLite transaction atomicity (`CHECK(available_seats >= 0)`). Advise the commuter to query next available corridor match.

### Incident B: Exam Review Tribunal Backlog
- **Symptom**: Proctor observation queue depth exceeds 20 unreviewed packets.
- **Diagnosis**: Peak midterm examination window with automated DOM departure anomaly flags.
- **Remediation**: Navigate to `/login/proctor` or switch to `m.sundaram@campus.edu`. Filter observation queue by "High Severity", conduct double-blind review, input written rationale, and resolve tickets.
