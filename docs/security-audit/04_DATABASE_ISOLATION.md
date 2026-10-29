# UniVerse — Database Isolation & Storage Architecture

> **Document:** `docs/security-audit/04_DATABASE_ISOLATION.md`  
> **Status:** Architecture Review & Isolation Guidelines  
> **Version:** 2.1.0  

---

## 1. Storage Topology & Engine Verification

The storage layer is unified on SQLite 3 with Write-Ahead Logging (WAL) via `better-sqlite3`. Every connection opened through `server/src/db/connection.ts` and `ConnectionManager` enforces five mandatory database pragmas:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA temp_store = MEMORY;
```

### Verification Against Multi-Connection Edge Cases
1. **Busy Contention**: The 5000ms `busy_timeout` guarantees that concurrent writes during intense batch updates queue transparently rather than throwing `SQLITE_BUSY`.
2. **Foreign Key Guarantees**: `foreign_keys = ON` is executed on every initialized connection to ensure child table orphans are blocked at the engine level.
3. **Prepared Statements**: All SQL queries across routers and services use parameterized prepared statements (`db.prepare(...).run/get/all(...)`), providing 100% protection against SQL injection.

---

## 2. Multi-Role Data Domain Isolation Model

```
+---------------------------------------------------------------------------------+
|                         CENTRAL IDENTITY AUTHORITY                              |
|                   users  •  role_assignments  •  auth_sessions                  |
+---------------------------------------------------------------------------------+
       |                        |                         |                      |
       v                        v                         v                      v
+------------------+   +-------------------+   +--------------------+   +-------------------+
|  ACADEMIC DOMAIN |   |  MOBILITY DOMAIN  |   |  WELLBEING DOMAIN  |   |  EXAM TRIBUNAL    |
| student_profiles |   | ride_offers       |   | focus_sessions     |   | exam_sessions     |
| placement_ms     |   | ride_requests     |   | browsing_events    |   | exam_session_asgn |
| mentors          |   | ride_matches      |   | domain_rules       |   | observ_events     |
| mentorship_reqs  |   | ride_bookings     |   | cohort_aggregates  |   | exam_audit_log    |
| academic_res     |   | campus_edges      |   | (Laplace DP ε=0.8) |   | (Append-Only Log) |
+------------------+   +-------------------+   +--------------------+   +-------------------+
```

### Domain Data Isolation Invariants

1. **Digital Wellbeing Isolation**:
   - `focus_sessions` and `browsing_events` are foreign-keyed strictly to `users(id)`.
   - Hostname sanitization strips query parameters, URLs, and authentication tokens before insertion into `browsing_events`.
   - **Cross-Role Barrier**: Proctors, Drivers, Wardens, and Teaching Assistants have ZERO query access to another user's browsing events or raw focus records.

2. **Exam Tribunal Isolation**:
   - `exam_sessions` stores scheduled and active exam administrations.
   - `exam_session_assignments` links proctors to their authorized sessions.
   - **Proctor Boundary**: A proctor can only view candidate observations for sessions explicitly assigned to them in `exam_session_assignments`.

3. **Smart Mobility Isolation**:
   - `ride_offers` is strictly owned by verified drivers (`driver_id REFERENCES users(id)`).
   - `ride_requests` is owned by passenger students (`passenger_id REFERENCES users(id)`).
   - Only confirmed passengers and drivers can view match details.

---

## 3. Concurrency & Atomic Seat Allocation Design

To address **SEC-02** (the seat overselling race condition), the seat decrement and booking transaction must execute atomically:

```typescript
const executeBooking = db.transaction(() => {
  // Atomic decrement: only succeeds if available_seats >= requested seats
  const updateResult = db.prepare(`
    UPDATE ride_offers 
    SET available_seats = available_seats - ? 
    WHERE id = ? AND available_seats >= ?
  `).run(seats, offerId, seats);

  if (updateResult.changes === 0) {
    throw new Error('INSUFFICIENT_SEATS: Concurrent reservation detected or seats exhausted');
  }

  // Create match and booking record atomically within the same transaction...
});
```

This guarantees that two simultaneous requests for the final seat cannot both decrement the counter; the second request encounters `changes === 0` and rolls back immediately with HTTP 409 Conflict.
