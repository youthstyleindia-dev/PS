# UniVerse — Database Architecture Specification

> **Document Version:** 2.0.0  
> **Target Architecture:** SQLite WAL Single-Store with Domain Isolation  
> **Engine:** `better-sqlite3` v11.8.1 with Transaction Boundaries & Pragma Hardening  

---

## 1. Architectural Overview & Storage Engine

UniVerse implements a unified relational data layer engineered for atomic transactions, sub-millisecond query latencies, and rigorous multi-role data boundaries. Built on SQLite 3 via `better-sqlite3`, the database is configured in Write-Ahead Logging (WAL) mode to permit high-concurrency non-blocking reads alongside serialized transactional writes.

```
+-------------------------------------------------------------------------------+
|                       UniVerse ConnectionManager Singleton                   |
|   Pragmas: journal_mode=WAL | foreign_keys=ON | synchronous=NORMAL            |
|            busy_timeout=5000ms | cache_size=-64000 (64MB)                     |
+-------------------------------------------------------------------------------+
       |                     |                    |                   |
       v                     v                    v                   v
+--------------+     +---------------+    +---------------+   +----------------+
|  Identity &  |     |   Academic    |    |  Smart Campus |   |   Exam Review  |
|  Governance  |     |   & Placement |    |  Transit Hub  |   |    Tribunal    |
|  users       |     |  student_prof |    |  ride_offers  |   |  exam_sessions |
|  role_assign |     |  placement_ms |    |  ride_reqs    |   |  exam_events   |
|  auth_sess   |     |  peer_mentors |    |  ride_matches |   |  exam_reviews  |
+--------------+     +---------------+    +---------------+   +----------------+
       |                                                              |
       +-------------------------+------------------------------------+
                                 |
                                 v
                     +------------------------+
                     |  Digital Wellbeing &   |
                     |  Sustainable Compute   |
                     |  focus_sessions        |
                     |  focus_daily_aggreg    |
                     |  energy_telemetry      |
                     +------------------------+
```

### Core Pragmas & Performance Safeguards
1. **`journal_mode = WAL`**: Readers do not block writers, and writers do not block readers. Read operations achieve sub-1ms response times even during heavy batch writes.
2. **`foreign_keys = ON`**: Strict relational integrity enforced by the SQLite database engine at all times. Cascading deletes and orphan record rejections are guaranteed at the storage level.
3. **`synchronous = NORMAL`**: Durable commits with reduced fsync churn, optimal for high-throughput campus workloads.
4. **`busy_timeout = 5000`**: Connection lock contention waits up to 5 seconds before raising an operational lock exception.

---

## 2. Multi-Role Data Ownership & Isolation Model

Data ownership is enforced at the database layer via strict foreign key relationships tied to the canonical `users.id` primary key:

### A. Student Intelligence Ownership
- **`student_profiles`**: Has 1-to-1 relationship with `users` (`user_id REFERENCES users(id) ON DELETE CASCADE`).
- **`placement_milestones`**: Scoped to `student_id REFERENCES users(id)`. Students can only mutate their own milestones.
- **`peer_mentorship`**: Bidirectional scoping with `mentor_id` and `mentee_id` referencing `users(id)`.

### B. Smart Transit Ride-Pooling
- **`ride_offers`**: Strictly owned by verified drivers (`driver_id REFERENCES users(id)`). The database enforces that only the driver who created an offer can mutate or cancel it.
- **`ride_requests`**: Owned by the requesting student/passenger (`rider_id REFERENCES users(id)`).
- **`ride_matches`**: Polyadic relationship joining `offer_id` and `request_id`, tracking detour distances, pickup times, and status (`proposed`, `accepted`, `completed`, `cancelled`).

### C. Digital Wellbeing Data Scoping
- **`focus_sessions`**: Strictly isolated to `user_id REFERENCES users(id)`. Querying another user's sessions returns 403 Forbidden.
- **`focus_daily_aggregates`**: Aggregated rollups computed client-side or on-the-fly to minimize persistent sensitive behavioral telemetry.
- **`focus_rules`**: Per-user filtering and blocked domain configurations tied to `user_id`.

### D. Responsible Examination Monitoring
- **`exam_sessions`**: Links `student_id` to `users(id)` and proctor assignment.
- **`exam_session_assignments`**: M-to-N join table assigning authorized proctors to specific exam sessions. A proctor can only review exam events for sessions they are actively assigned to.
- **`exam_events`**: Immutable observation stream tagged with `session_id`, `observable_event_type`, and timestamp.
- **`exam_reviews`**: Adjudication records containing `reviewer_id REFERENCES users(id)` (restricted to `proctor` or `admin`).

---

## 3. Cross-Store Relational Mapping & Role Persistence

Multi-role authorization is decoupled from the user's primary default role via the `role_assignments` table:

```sql
CREATE TABLE IF NOT EXISTS role_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL CHECK (role_key IN ('student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  granted_by_user_id TEXT REFERENCES users(id),
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME,
  expires_at DATETIME,
  reason TEXT,
  UNIQUE(user_id, role_key)
);
```

### Dual-Role Query Strategy
When a user authenticates, the system queries both `users.role` (the primary default persona) and all `active` rows in `role_assignments`:
```sql
SELECT DISTINCT role_key FROM role_assignments 
WHERE user_id = :userId AND status = 'active'
UNION
SELECT role FROM users 
WHERE id = :userId;
```
This guarantees zero privilege leaks and supports dual personas (e.g., Dr. Meenakshi Sundaram holding both `proctor` and `ta_faculty`).

---

## 4. Connection Lifecycle & Health Monitoring

The database connection is managed via `ConnectionManager` located at [`server/src/database/connection-manager.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/database/connection-manager.ts):

- **Singleton Pattern**: Guarantees a single open file descriptor across Express request handlers and automated test suites.
- **Health Verification**: Provides `healthCheck()` returning storage metrics, WAL size, page count, and schema version.
- **Clean Teardown**: Implements `close()` hooked into `SIGINT`/`SIGTERM` to flush WAL frames back to the main database file during container shutdown.
