# UniVerse — Security Findings & Risk Report (Phase 7 Pre-Remediation)

> **Document:** `docs/security-audit/02_FINDINGS.md`  
> **Status:** Completed Read-Only Audit Findings  
> **Standard:** OWASP Top 10 API Security Risks (BOLA, Broken Object Property Level Auth, Race Conditions)  

---

## 1. Summary of Audit Findings

| Finding ID | Severity | Status | Category | Affected File / Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | Confirmed | BOLA / IDOR & PII Exposure | `server/src/routes/wellbeing.routes.ts:107` (`GET /api/wellbeing/sessions/:sessionId`) |
| **SEC-02** | **CRITICAL** | Confirmed | Concurrency / Race Condition | `server/src/services/ride_matching.service.ts:265` (`confirmAndBookRide`) |
| **SEC-03** | **HIGH** | Confirmed | Broken Access Control | `server/src/routes/exams.routes.ts:43` (`POST /api/exams/sessions`) |
| **SEC-04** | **HIGH** | Confirmed | Proctor Isolation Leak | `server/src/routes/exams.routes.ts:96` (`GET /api/exams/pending-reviews`) |
| **SEC-05** | **HIGH** | Confirmed | BOLA / Mentorship Request Leak | `server/src/routes/hub.routes.ts:483` (`GET /api/hub/mentorship-requests/:userId`) |
| **SEC-06** | **HIGH** | Confirmed | Notification Snooping | `server/src/routes/common.routes.ts:175` (`GET /api/notifications`) |
| **SEC-07** | **MEDIUM** | Confirmed | User Impersonation | `server/src/routes/rides.routes.ts:215` (`POST /api/rides/requests`) |
| **SEC-08** | **MEDIUM** | Confirmed | Excessive Permission Exposure | `server/src/services/auth.service.ts:567` (`AuthService.getMe`) |
| **SEC-09** | **MEDIUM** | Confirmed | Test Auth Bypass Risk | `server/src/authorization/require-role.ts:24` (Bypass on `NODE_ENV=test`) |
| **SEC-10** | **LOW** | Potential Risk | Incomplete Admin Workflow | `server/src/db/schema.sql:42` (Missing invitation endpoints) |

---

## 2. Detailed Finding Specifications

---

### SEC-01: Horizontal IDOR & Private Telemetry Leak in Focus Sessions
- **Severity**: **CRITICAL**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `GET /api/wellbeing/sessions/:sessionId`
- **File & Line**: [`server/src/routes/wellbeing.routes.ts#L107-L114`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/wellbeing.routes.ts#L107-L114)
- **Reproduction Steps**:
  1. Authenticate as Student A (`aarav.sharma@campus.edu`).
  2. Query `GET /api/wellbeing/sessions/sess_other_student` for a session belonging to Student B.
  3. Server returns full session details, deep work index, and raw browsing history.
- **Root Cause**: Handler executes raw SQL query by `sessionId` without verifying that `req.user.sub === session.user_id`.
- **Impact**: Cross-user horizontal data leakage of private browsing activity, violating Module D privacy guarantees.
- **Recommended Remediation**:
  Extract session owner from database and enforce ownership check `if (session.user_id !== req.user.sub && !isAdmin) return res.status(403).json(...)`.

---

### SEC-02: Race Condition in Available Ride Seat Decrement
- **Severity**: **CRITICAL**
- **Status**: **CONFIRMED DEFECT**
- **Affected Function**: `rideMatchingService.confirmAndBookRide`
- **File & Line**: [`server/src/services/ride_matching.service.ts#L265-L310`](file:///Users/divya/Documents/Problem%20statement%20/server/src/services/ride_matching.service.ts#L265-L310)
- **Reproduction Steps**:
  1. Identify an open ride offer with `available_seats = 1`.
  2. Send two concurrent POST requests to `/api/rides/matches/:matchId/confirm` simultaneously.
  3. Both requests evaluate `if (offer.available_seats < seats)` before either transaction commits.
  4. Both update `available_seats = 0` and insert confirmed bookings.
- **Root Cause**: The seat availability check is detached from the atomic database update.
- **Impact**: Overselling vehicle seats beyond maximum physical capacity.
- **Recommended Remediation**:
  Execute an atomic conditional update: `UPDATE ride_offers SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?`. Check `info.changes === 0` to immediately reject concurrent race attempts with HTTP 409 Conflict.

---

### SEC-03: Unauthenticated Examination Session Injection
- **Severity**: **HIGH**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `POST /api/exams/sessions`
- **File & Line**: [`server/src/routes/exams.routes.ts#L43-L57`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/exams.routes.ts#L43-L57)
- **Reproduction Steps**:
  1. Make an unauthenticated POST request to `/api/exams/sessions` with `{ title, studentId, courseId }`.
  2. Session is successfully provisioned and inserted into `exam_sessions`.
- **Root Cause**: Missing `requireRole('admin', 'proctor')` middleware on the session creation route.
- **Impact**: Unauthenticated actors can forge examination schedules and student assignments.
- **Recommended Remediation**: Protect route with `requireRole('admin', 'proctor')`.

---

### SEC-04: Unfiltered Proctor Review Queue Exposure
- **Severity**: **HIGH**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `GET /api/exams/pending-reviews`
- **File & Line**: [`server/src/routes/exams.routes.ts#L96-L107`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/exams.routes.ts#L96-L107)
- **Reproduction Steps**:
  1. Authenticate as Proctor A (`usr_proctor_1`), who is assigned ONLY to Session #1.
  2. Call `GET /api/exams/pending-reviews`.
  3. The response returns all pending events across Session #1, Session #2, and Session #3.
- **Root Cause**: The SQL query does not join `exam_session_assignments` to filter by `proctor_id`.
- **Impact**: Proctors can view candidates and incident video cues for exams they were not authorized to invigilate.
- **Recommended Remediation**:
  If caller is not `admin`, join `exam_session_assignments esa ON es.id = esa.session_id AND esa.proctor_id = :proctorId AND esa.status = 'active'`.

---

### SEC-05: Horizontal Information Leak in Mentorship Requests
- **Severity**: **HIGH**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `GET /api/hub/mentorship-requests/:userId` and `PATCH /api/hub/mentorship-requests/:requestId`
- **File & Line**: [`server/src/routes/hub.routes.ts#L483-L600`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/hub.routes.ts#L483-L600)
- **Reproduction Steps**:
  1. Authenticate as Student A.
  2. Request `GET /api/hub/mentorship-requests/usr_student_2`.
  3. Server exposes Student B's sent and received mentorship requests, private notes, and mentor discussion.
  4. Send a `PATCH /api/hub/mentorship-requests/:requestId` to accept or reject an inquiry without being the assigned mentor.
- **Root Cause**: Lack of ownership check on `:userId` and `:requestId`.
- **Impact**: Unauthorized reading of student conversations and unauthorized modification of mentor appointments.
- **Recommended Remediation**:
  Enforce `requireResourceOwner('userId')` on the GET route and verify that `req.user.sub === mentor.user_id` on the PATCH route.

---

### SEC-06: Notification Snooping via Unvalidated Query Parameter
- **Severity**: **HIGH**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `GET /api/notifications`
- **File & Line**: [`server/src/routes/common.routes.ts#L175-L191`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/common.routes.ts#L175-L191)
- **Reproduction Steps**:
  1. Call `GET /api/notifications?userId=usr_driver_1`.
  2. Server returns all driver notifications without checking caller identity.
- **Root Cause**: Handler reads `userId` from `req.query` without verifying authentication or matching `req.user.sub`.
- **Impact**: Sensitive alerts (ride details, exam alerts, administrative notifications) leaked to unauthorized callers.
- **Recommended Remediation**:
  Derive user identity strictly from `req.user.sub`. If caller is admin, allow `?userId=...` override; otherwise force `userId = req.user.sub`.

---

### SEC-07: Unauthenticated Passenger Ride Request Spoofing
- **Severity**: **MEDIUM**
- **Status**: **CONFIRMED DEFECT**
- **Affected Route**: `POST /api/rides/requests`
- **File & Line**: [`server/src/routes/rides.routes.ts#L215-L273`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/rides.routes.ts#L215-L273)
- **Reproduction Steps**:
  1. Send POST to `/api/rides/requests` with `{ passengerId: 'usr_student_2', ... }`.
  2. Request is created on behalf of Student 2 without verifying the token matches Student 2.
- **Root Cause**: Accepts `passengerId` from body instead of authenticating the passenger.
- **Impact**: Request spoofing and unauthorized booking creation.
- **Recommended Remediation**:
  Apply `requireAuth` and override `passengerId = req.user.sub`.

---

### SEC-08: Excessive Permission Disclosure in User Profile Payload
- **Severity**: **MEDIUM**
- **Status**: **CONFIRMED DEFECT**
- **Affected Method**: `AuthService.getMe`
- **File & Line**: [`server/src/services/auth.service.ts#L567-L576`](file:///Users/divya/Documents/Problem%20statement%20/server/src/services/auth.service.ts#L567-L576)
- **Root Cause**: Returns `canAccessWellbeing: true` to all personas, including proctors and drivers.
- **Impact**: Confuses frontend guards and communicates incorrect privilege assertions.
- **Recommended Remediation**:
  Set `canAccessWellbeing: user.role === 'student' || user.role === 'admin'`.

---

### SEC-09: Unauthenticated Test Environment Bypass
- **Severity**: **MEDIUM**
- **Status**: **CONFIRMED DEFECT**
- **Affected Middleware**: `require-role.ts:24`, `resource-scope.ts:24`
- **Root Cause**: `if (process.env.NODE_ENV === 'test' && !req.headers.authorization) return next();`
- **Impact**: If a staging or integration environment sets `NODE_ENV=test`, access control is entirely disabled.
- **Recommended Remediation**:
  Ensure tests supply valid synthetic bearer tokens, and eliminate ambient environment bypasses in production authorization middleware.
