# UniVerse — Database Migration & Schema Evolution Guide

> **Target Version:** Schema v2.0.0 (Multi-Role RBAC Support)  
> **Engine:** SQLite 3 WAL Mode with Table-Swap Idempotent Evolution  

---

## 1. Migration Philosophy & Idempotency

UniVerse database migrations are engineered to be:
1. **Fully Idempotent**: Running the migration sequence multiple times produces identical results with no duplicate records or state corruption.
2. **Data-Preserving**: Existing user records, profiles, ride matches, and audit logs are never dropped or overwritten during schema upgrades.
3. **Automated at Boot**: Managed through [`server/src/db/connection.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/db/connection.ts) during server startup, eliminating manual migration CLI steps.

---

## 2. Table-Swap Pattern for SQLite CHECK Constraints

### The Problem
SQLite does not support `ALTER TABLE ... ALTER COLUMN` or modifying existing `CHECK` constraints in place. When adding new canonical roles (`ta_faculty`, `warden`) to the `users` table, a simple `ALTER TABLE` fails with `SqliteError`.

### The Solution: 12-Step Atomic Table Swap
During startup, `server/src/db/connection.ts` inspects `sqlite_master` for the current table definition. If `ta_faculty` is missing from the check constraint:

```sql
-- 1. Create modernized table schema with expanded CHECK constraint
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT,
  role TEXT NOT NULL CHECK(role IN ('student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin', 'faculty')),
  department TEXT,
  year_of_study INTEGER,
  bio TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate existing user records preserving all UUIDs and passwords
INSERT OR IGNORE INTO users_new (
  id, name, email, password_hash, avatar, role, department, year_of_study, bio, is_active, last_login, created_at, updated_at
)
SELECT 
  id, name, email, password_hash, avatar, role, department, year_of_study, bio, is_active, last_login, created_at, updated_at
FROM users;

-- 3. Atomically replace the legacy table
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- 4. Re-establish performance indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 3. Backfill of `role_assignments`

Following the table update, the migration automatically provisions active role assignments for all existing accounts in `users`:

```sql
INSERT OR IGNORE INTO role_assignments (id, user_id, role_key, status, granted_at, reason)
SELECT 
  'ra_' || id || '_' || role || '_auto',
  id,
  CASE WHEN role = 'faculty' THEN 'ta_faculty' ELSE role END,
  'active',
  created_at,
  'Automated migration: backfilled from users table'
FROM users;
```

This guarantees that:
- Any pre-existing user can immediately log into the role-specific workspace matching their registered persona.
- Dual-role permissions (e.g., proctors who are also faculty) are granted without manual database surgery.

---

## 4. Proctor Assignment Backfill for Module E

For exam sessions in `exam_sessions`, the migration guarantees active proctor assignments:
```sql
INSERT OR IGNORE INTO exam_session_assignments (id, session_id, proctor_id, status)
SELECT 
  'esa_' || s.id || '_' || u.id,
  s.id,
  u.id,
  'active'
FROM exam_sessions s
JOIN users u ON u.role IN ('proctor', 'admin');
```

---

## 5. Verification & Health Check

You can verify database status and migration integrity at any time via the health check endpoint:

```bash
curl http://localhost:3001/api/health
```

Expected response payload:
```json
{
  "status": "healthy",
  "database": {
    "engine": "better-sqlite3",
    "journal_mode": "wal",
    "foreign_keys": "on",
    "tables_count": 25,
    "users_count": 8,
    "active_role_assignments": 10
  }
}
```

---

## 6. Backup, Recovery & Rollback

### Live Hot Backup
Because SQLite WAL mode supports non-blocking concurrent reads, backups can be taken without taking the server offline:
```bash
sqlite3 server/data/universe.db ".backup 'server/data/backups/universe_backup_$(date +%Y%m%d%H%M%S).db'"
```

### Rollback Procedure
If rollback is required:
1. Stop the application server (`killall node`).
2. Restore the backup file to `server/data/universe.db`.
3. Remove `-shm` and `-wal` auxiliary files:
   ```bash
   rm -f server/data/universe.db-shm server/data/universe.db-wal
   ```
4. Restart the server (`npm run dev:server`).
