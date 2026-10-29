# UniVerse Security Remediation Changelog & Audit Log

> **Date:** October 30, 2026  
> **Lead Auditor & Security Architect:** Antigravity Principal Engineering Agent  
> **Audit Status:** Remediated & Verified  
> **Scope:** Full-Stack Repository (Backend Controllers, Middleware, Data Services, Tests)

---

## 1. Summary of Remediated Defects

| Defect ID | Severity | Module | Affected File | Status | Verification Suite |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **SEC-01** | CRITICAL | Digital Wellbeing | `server/src/routes/wellbeing.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-02** | CRITICAL | Campus Mobility | `server/src/services/ride_matching.service.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-03** | HIGH | Exam Monitoring | `server/src/routes/exams.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-04** | HIGH | Exam Monitoring | `server/src/routes/exams.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-05** | HIGH | Academic Hub | `server/src/routes/hub.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-06** | HIGH | Common Services | `server/src/routes/common.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-07** | MEDIUM | Campus Mobility | `server/src/routes/rides.routes.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-08** | MEDIUM | Auth & Identity | `server/src/services/auth.service.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-09** | MEDIUM | Authorization | `server/src/authorization/require-role.ts`, `resource-scope.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |
| **SEC-10** | LOW | Role Architecture | `server/src/authorization/role.types.ts` | **RESOLVED** | `tests/security/audit_remediation.test.ts` |

---

## 2. Detailed Remediation Details

### SEC-01: Focus Session Horizontal Privilege Escalation (IDOR)
- **Vulnerability:** Unfiltered lookup `SELECT * FROM focus_sessions WHERE id = ?` allowed any authenticated user to read or modify any other student's focus sessions.
- **Remediation:** 
  - Added strict ownership validation (`req.user.sub === session.user_id || isAdmin`) to `GET /api/wellbeing/sessions/:sessionId` and `POST /api/wellbeing/sessions/:sessionId/stop`.
  - Added `requireResourceOwner('userId')` to `GET /api/wellbeing/sessions/user/:userId`.
- **Files Modified:** `server/src/routes/wellbeing.routes.ts:54-150`
- **Result:** Non-owners receive `403 FORBIDDEN` with error code `'FORBIDDEN'`.

---

### SEC-02: Non-Atomic Seat Decrement & Booking Race Condition
- **Vulnerability:** `confirmAndBookRide` checked seat availability outside the database transaction, then executed an unconditional `UPDATE ride_offers SET available_seats = ?`, allowing concurrent requests to overbook available capacity.
- **Remediation:**
  - Wrapped the entire confirmation workflow inside a single SQLite transaction.
  - Implemented atomic guarded decrement:
    ```sql
    UPDATE ride_offers 
    SET available_seats = available_seats - ? 
    WHERE id = ? AND available_seats >= ?
    ```
  - If `changes === 0`, throws `INSUFFICIENT_SEATS` error before creating booking or match records.
- **Files Modified:** `server/src/services/ride_matching.service.ts:259-380`
- **Result:** Capacity cannot be oversold under concurrent execution.

---

### SEC-03: Unauthenticated Exam Session Creation
- **Vulnerability:** `POST /api/exams/sessions` lacked authorization middleware, allowing unauthenticated callers or students to schedule exam sessions.
- **Remediation:** Added `requireRole('proctor', 'admin')` middleware to `POST /api/exams/sessions`.
- **Files Modified:** `server/src/routes/exams.routes.ts:43`
- **Result:** Unauthenticated callers receive 401; students receive 403. Only appointed proctors and admins can schedule sessions.

---

### SEC-04: Proctor Queue Assignment-Scoped Isolation
- **Vulnerability:** `GET /api/exams/pending-reviews` returned all unreviewed observation events across the entire campus, allowing any proctor to monitor examination sessions they were not assigned to.
- **Remediation:** 
  - If caller is a proctor (not an administrator), query `exam_session_assignments` for active assignments matching `proctor_id = req.user.sub`.
  - Filter `observation_events` strictly by assigned `exam_session_id`s.
  - If no active assignments exist for the proctor, return an empty array `[]`.
- **Files Modified:** `server/src/routes/exams.routes.ts:96-125`
- **Result:** Proctors inspect observations only for students in sessions assigned to them.

---

### SEC-05: Mentorship Request Cross-Account Snooping and Modification
- **Vulnerability:** `GET /api/hub/mentorship-requests/:userId` and `PATCH /api/hub/mentorship-requests/:requestId` permitted any caller to read requests and update acceptance status.
- **Remediation:**
  - Attached `requireResourceOwner('userId')` to `GET /api/hub/mentorship-requests/:userId`.
  - In `PATCH /api/hub/mentorship-requests/:requestId`, verified that caller owns the mentor record (`mentor.user_id === req.user.sub`) or is an administrator.
- **Files Modified:** `server/src/routes/hub.routes.ts:483, 560-575`
- **Result:** Only the mentee or assigned mentor can view and transition request statuses.

---

### SEC-06: Notification Snooping via Query Parameter Tampering
- **Vulnerability:** `GET /api/notifications` read `userId` from `req.query.userId` directly, defaulting to `usr_student_1`. Any student could snoop on administrator or peer notifications by supplying `?userId=usr_victim`.
- **Remediation:** 
  - Forced `targetUserId = req.user.sub` for all non-admin users regardless of query parameters.
  - Only administrators can query other users' notification feeds.
- **Files Modified:** `server/src/routes/common.routes.ts:175-195`
- **Result:** Notification feeds are cryptographically locked to the bearer token identity.

---

### SEC-07: Ride Request Passenger Identity Spoofing
- **Vulnerability:** `POST /api/rides/requests` accepted `passengerId` in the JSON body without checking if it matched the authenticated caller's identity.
- **Remediation:**
  - If `req.user` is present and not an admin, validated `passengerId === req.user.sub`.
  - Rejects mismatched requests with `403 FORBIDDEN` and error code `'FORBIDDEN'`.
- **Files Modified:** `server/src/routes/rides.routes.ts:215-265`
- **Result:** Users can only create ride requests under their own verified identity.

---

### SEC-08: Over-Privileged Permission Matrix in `AuthService.getMe`
- **Vulnerability:** `getMe()` statically returned `canAccessWellbeing: true` and `canAccessAcademicHub: true` to all personas, including transit drivers and proctors.
- **Remediation:**
  - Implemented dynamic role evaluation respecting both `users.role` and `role_assignments` table.
  - Scoped `canAccessWellbeing` strictly to `student` and `admin`.
  - Scoped `canOfferRides` strictly to `driver` and `admin`.
  - Scoped `canAccessProctorConsole` strictly to `proctor` and `admin`.
- **Files Modified:** `server/src/services/auth.service.ts:565-585`
- **Result:** Client portals receive accurate, least-privilege capability manifests.

---

### SEC-09: Ambient Test Auth Bypass in Authorization Middleware
- **Vulnerability:** Authorization middleware checked `process.env.NODE_ENV === 'test' && !req.headers.authorization` to allow legacy contract test executions, creating an accidental bypass vector if `NODE_ENV=test` were set in non-local environments.
- **Remediation:**
  - Gated the bypass behind an explicit opt-in environment flag: `process.env.ENABLE_CONTRACT_TEST_BYPASS === 'true'`.
  - Configured this flag in `vitest.config.ts` for unit test runners only.
- **Files Modified:** `server/src/authorization/require-role.ts:24`, `server/src/authorization/resource-scope.ts:24, 87`, `vitest.config.ts:8`
- **Result:** Tests with missing headers are blocked unless explicitly configured in local harness.

---

### SEC-10: Upper-case Canonical Role Identifier Aliasing
- **Vulnerability:** Canonical uppercase role identifiers (`STUDENT`, `TA`, `WARDEN`, `TRANSIT_DRIVER`, `EXAM_PROCTOR`, `SYSTEM_ADMIN`) lacked mappings in `LEGACY_ROLE_MAP`.
- **Remediation:** Added uppercase role aliases mapping directly to canonical internal identifiers.
- **Files Modified:** `server/src/authorization/role.types.ts:94-110`
- **Result:** Seamless compatibility between uppercase prompt specifications and internal role identifiers.
