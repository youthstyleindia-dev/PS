# UniVerse Security & Operations Runbook

> **Scope:** Production Operations, High-Availability Deployment, Incident Response, & Security Runbooks  
> **Target Audience:** Site Reliability Engineers, Platform Administrators, & Security Response Teams  

---

## 1. System Architecture & Entry Points

UniVerse is composed of:
1. **Frontend SPA:** React 19 + TypeScript + Vite + Tailwind CSS (`client/`)
2. **Backend Application:** Node.js + Express 5 + Better-SQLite3 (`server/`)
3. **Database:** SQLite 3 in WAL mode located at `server/data/universe.db`

### Service Ports & Environment
- **Express Backend:** `http://localhost:3001` (API Base: `/api`)
- **Vite Frontend Dev Server:** `http://localhost:5173`
- **Health Check Endpoint:** `GET /health` (`http://localhost:3001/health`)
- **API Overview Endpoint:** `GET /api`

---

## 2. Standard Operating Procedures (SOP)

### 2.1 Starting the Application Stack
```bash
# Start both server and client concurrently
npm run dev

# Or start services independently
npm run server:dev  # Terminal 1 (Express API on :3001)
npm run client:dev  # Terminal 2 (Vite Client on :5173)
```

### 2.2 Building for Production
```bash
# Compiles server TypeScript and client Vite assets
npm run build

# Runs production server
npm start
```

### 2.3 Executing Verification & Regression Test Suites
```bash
# Execute entire 229-test automated test suite
npm test

# Run security regression suite exclusively
npx vitest run tests/security/audit_remediation.test.ts

# Run role boundary matrix tests
npx vitest run tests/security/role_matrix.test.ts
```

---

## 3. Database Operations & Disaster Recovery

### 3.1 Live Backup (Non-Blocking)
Because UniVerse runs SQLite in Write-Ahead Log (`WAL`) mode with `busy_timeout = 5000`, backups can be taken without locking read or write transactions:

```bash
# Perform online hot backup using SQLite CLI
sqlite3 server/data/universe.db ".backup 'server/data/backups/universe_backup_$(date +%Y%m%d_%H%M%S).db'"
```

### 3.2 Restoration Procedure
```bash
# 1. Stop backend service
kill -TERM $(pgrep -f "tsx.*index.ts")

# 2. Archive corrupted or damaged database
mv server/data/universe.db server/data/universe.db.corrupt_$(date +%s)
rm -f server/data/universe.db-wal server/data/universe.db-shm

# 3. Restore from verified snapshot
cp server/data/backups/universe_backup_latest.db server/data/universe.db

# 4. Verify integrity
sqlite3 server/data/universe.db "PRAGMA integrity_check;"
# Must output: ok

# 5. Restart service
npm run dev
```

### 3.3 Safe Database Seeding (Development Only)
> [!CAUTION]
> Never run seed commands in production without an offline database backup.

```bash
npm run seed
```

---

## 4. Role Management & Access Control Procedures

### 4.1 Canonical Roles
- `STUDENT`: Collegiate academic records, ride pooling, private focus wellbeing.
- `TA`: Course moderation and mentorship duties.
- `WARDEN`: Facility overview, transit monitoring, campus advisories.
- `TRANSIT_DRIVER`: Ride offers, route execution, passenger pickup confirmation.
- `EXAM_PROCTOR`: Invigilates assigned exam sessions; reviews observable incident events.
- `SYSTEM_ADMIN`: Platform configuration, user management, audit review.

### 4.2 Emergency Account Lockout Procedure
If a credential or session token is compromised:
```bash
# Set account to inactive via SQLite
sqlite3 server/data/universe.db "UPDATE users SET is_active = 0 WHERE email = 'compromised_user@campus.edu';"

# Revoke all active role assignments
sqlite3 server/data/universe.db "UPDATE role_assignments SET status = 'revoked', revoked_at = datetime('now'), reason = 'Security incident emergency revocation' WHERE user_id = (SELECT id FROM users WHERE email = 'compromised_user@campus.edu');"
```

### 4.3 Assigning a Privileged Role (Administrator Action)
```bash
# Example: Assigning EXAM_PROCTOR role to a verified instructor
sqlite3 server/data/universe.db "INSERT INTO role_assignments (id, user_id, role_key, status, granted_by_user_id, granted_at, reason) VALUES ('asgn_' || hex(randomblob(6)), 'usr_target_id', 'proctor', 'active', 'usr_admin_1', datetime('now'), 'Authorized departmental proctoring appointment');"
```

---

## 5. Security Incident Response Playbooks

### Playbook A: Horizontal IDOR or Data Leak Detected
1. **Identify Request Logs:** Inspect `server/data/universe.db` table `activity_log` for unauthorized accesses.
2. **Revoke Sessions:** Rotate `JWT_SECRET` in `.env` immediately:
   ```bash
   # Generate high-entropy 256-bit secret
   openssl rand -hex 32
   ```
3. **Restart Service:** Restart Express to invalidate all active JWT bearer tokens immediately.
4. **Run Security Test:** Execute `npx vitest run tests/security/audit_remediation.test.ts` to verify middleware guards.

### Playbook B: Concurrent Seat Overselling Alert
1. **Check Negative Available Seats:**
   ```bash
   sqlite3 server/data/universe.db "SELECT id, driver_id, total_seats, available_seats FROM ride_offers WHERE available_seats < 0;"
   ```
2. **Review Seat Decrement Transaction:** Confirm that `server/src/services/ride_matching.service.ts` uses the guarded atomic decrement:
   ```sql
   UPDATE ride_offers SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?
   ```
3. **Reconcile Bookings:** Re-tally bookings per offer:
   ```sql
   UPDATE ride_offers 
   SET available_seats = total_seats - (SELECT coalesce(sum(seats_booked), 0) FROM ride_bookings WHERE offer_id = ride_offers.id)
   WHERE id = 'affected_offer_id';
   ```

### Playbook C: Exam Observation Queue Cross-Contamination
1. **Verify Session Assignments:**
   ```bash
   sqlite3 server/data/universe.db "SELECT * FROM exam_session_assignments WHERE proctor_id = 'usr_proctor_id';"
   ```
2. **Verify Assignment Filter in Endpoint:** Confirm `server/src/routes/exams.routes.ts` enforces `AND oe.exam_session_id IN (sessionIds)`.
