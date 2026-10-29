# UniVerse: Role-Based Database, Authentication, Authorization & Workspace Audit
**System**: UniVerse Campus Operating Ecosystem  
**Audit Date**: October 30, 2026  
**Auditor**: Lead Security Architect & Integration Coordinator  
**Baseline Test Status**: 190 / 190 Passing across 12 test suites (Vitest v3.2.7, 2.40s)

---

## 1. Canonical Roles Currently Found & Definition Map

### 1.1 Existing Role Definitions in Codebase

| Location | Defined Type / Literal | Found Values | Notes |
| :--- | :--- | :--- | :--- |
| `server/src/types/common.types.ts:1` | `UserRole` | `'student' \| 'driver' \| 'proctor' \| 'admin'` | Core backend enum. Lacks explicit `faculty`/`ta_faculty` and `warden`. |
| `client/src/types/index.ts:1` | `UserRole` | `'student' \| 'driver' \| 'proctor' \| 'admin'` | Frontend mirror of backend enum. |
| `server/src/db/schema.sql:18` | `CHECK(role IN (...))` | `'student', 'driver', 'proctor', 'admin'` | SQLite table-level check constraint on `users.role`. |
| `server/src/services/auth.service.ts:24-34` | `DEMO_ACCOUNTS` | `student`, `driver`, `proctor`, `admin`, `faculty` | `faculty` was recently added as an alias mapping to `proctor` (`usr_proctor_1`). |
| `client/src/components/RoleSwitcher.tsx:16-56` | `roleConfigs` | `student`, `driver`, `proctor`, `admin` | Hardcoded UI configurations for the 4 primary roles. |

### 1.2 Discovered Ambiguous Labels & Cataloging

1. **`tax`**:
   - **Source**: `client/src/pages/AboutPrinciplesPage.tsx:41` (`tag: 'ECOSYSTEM: ZERO_COMMERCIAL_TAX'`).
   - **Finding**: `tax` is **NOT** a user role or persona. It is an economic principle tag denoting that the campus operating platform takes zero commercial commission from student rides or peer transactions. No user role named `tax` should exist.
2. **`faculty` / `ta` / `teaching_assistant`**:
   - **Source**: `client/src/pages/LoginPage.tsx:389` ("Faculty / Proctor (Dr. Patel)") and `server/src/services/auth.service.ts:26` (`faculty: { email: 'm.sundaram@campus.edu' }`).
   - **Finding**: Academic mentors and exam proctors have historically been grouped into either `student` (for peer mentors) or `proctor` (for faculty like Dr. Meenakshi Sundaram). To support genuine pedagogical and mentorship workflows without granting unmonitored examination proctoring or global admin rights, a canonical `ta_faculty` role must be formalized.
3. **`reviewer`**:
   - **Source**: `server/src/db/schema.sql:355` (`reviewer_id TEXT REFERENCES users(id)` in `observation_events`) and `server/src/routes/exams.routes.ts:119`.
   - **Finding**: `reviewer` is not an independent user role, but a functional attribute of an `exam_proctor` who is assigned to inspect and adjudicate flagged examination events.
4. **`warden` / `warden_campus_staff`**:
   - **Source**: Discovered during product requirement inspection; currently absent from `schema.sql` and `common.types.ts`.
   - **Finding**: Represents campus residential/operational staff. Must be registered as a reserved canonical role with strictly scoped campus operations permissions (facility observability, transit dispatch, zero access to student grades or exam observations).

---

## 2. Comprehensive Role Leaks & Vulnerability Inventory

### 2.1 Navigation & Presentation Tier Leaks (Client)

| Vulnerability ID | File Path & Lines | Vulnerability Description | Severity |
| :--- | :--- | :--- | :---: |
| **LEAK-UI-01** | `client/src/components/Navbar.tsx:61-163` | **Universal Navigation Exposure**: The navigation sidebar renders every group (Academic Hub, Transit, Sustainability, Focus/Wellbeing, Exam Review Tribunal, Algorithm Sandbox, Node Settings) to all users regardless of authenticated role. A student sees the Exam Tribunal and Node Settings. | **HIGH** |
| **LEAK-UI-02** | `client/src/components/Navbar.tsx:174-214` | **Unauthenticated Persona Switcher in Sidebar**: Footer provides buttons (`STU`, `DRV`, `PRC`, `ADM`) that trigger `switchRole(role)` which logs into demo accounts directly from the client without checking user authorization. | **HIGH** |
| **LEAK-UI-03** | `client/src/App.tsx:70-88` | **Unprotected Route Hierarchy**: Zero route guards (`RoleGate` or `ProtectedRoute`). A user or unauthenticated guest navigating directly to `/exams`, `/exam-monitor`, `/rides`, or `/settings` enters the pages directly. | **CRITICAL** |
| **LEAK-UI-04** | `client/src/components/Header.tsx:145-185` | **Unrestricted Role Switcher Dropdown**: Allows any authenticated user to switch role to student, driver, proctor, or admin by invoking `switchRole()` without checking if the user account holds that role. | **HIGH** |
| **LEAK-UI-05** | `client/src/pages/Dashboard.tsx:208-237` | **Cross-Role Dashboard Cards**: The default dashboard displays "Card 4: Exam Review Tribunal" and carpool dispatch timeline to all users, leaking pending exam packets to students. | **MEDIUM** |

### 2.2 Server-Side Route & API Authorization Leaks (Backend)

| Vulnerability ID | File Path & Lines | Endpoint & Method | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :---: |
| **LEAK-API-01** | `server/src/routes/exams.routes.ts:30` | `GET /api/exams/sessions` | **Unauthenticated Exam Session Query**: Any user or anonymous caller can enumerate all active and past examination sessions and student rosters. Missing `requireAuth` and `requireRole('proctor', 'admin')`. | **CRITICAL** |
| **LEAK-API-02** | `server/src/routes/exams.routes.ts:95` | `GET /api/exams/pending-reviews` | **Unauthenticated Proctor Queue**: Students can inspect observation packets, event types, and confidence scores for ongoing exams. Missing role authorization. | **CRITICAL** |
| **LEAK-API-03** | `server/src/routes/exams.routes.ts:118` | `PATCH /api/exams/events/:eventId/review` | **Arbitrary Proctor Determination**: Anyone can submit review decisions (`DISMISS_FALSE_POSITIVE`, `ESCALATE_TO_INVIGILATOR`) and spoof `reviewerId`. Missing session ownership and role check. | **CRITICAL** |
| **LEAK-API-04** | `server/src/routes/wellbeing.routes.ts:116` | `GET /api/wellbeing/sessions/user/:userId` | **Horizontal Focus Log IDOR**: Any authenticated or unauthenticated student can read another student's detailed focus duration, active sessions, and productivity metrics. | **CRITICAL** |
| **LEAK-API-05** | `server/src/routes/wellbeing.routes.ts:207` | `DELETE /api/wellbeing/history/:userId` | **Unchecked Deletion IDOR**: Any caller can wipe another user's entire focus history and browsing logs by passing their `userId`. | **CRITICAL** |
| **LEAK-API-06** | `server/src/routes/hub.routes.ts:92` | `PUT /api/hub/profile/:studentId` | **Unrestricted Profile Mutation IDOR**: Any caller can overwrite any student's placement goals, resume URL, skills, and target companies without verifying that `req.user.id === studentId`. | **CRITICAL** |
| **LEAK-API-07** | `server/src/routes/hub.routes.ts:217` | `POST /api/hub/placement-milestones/:studentId/toggle` | **Milestone Manipulation IDOR**: Any user can mark another student's placement preparation milestones as completed or incomplete. | **HIGH** |
| **LEAK-API-08** | `server/src/routes/rides.routes.ts:114` | `POST /api/rides/offers` | **Driver Privilege Bypass**: Any student can create official driver route offers without possessing the `driver` role, spoofing `driverId`. | **HIGH** |
| **LEAK-API-09** | `server/src/routes/sustainability.routes.ts:17` | `POST /api/sustainability/workloads/:serviceId/scale` | **Unauthorized Workload Scaling**: Students or unauthenticated users can trigger backend compute node scaling. | **HIGH** |
| **LEAK-API-10** | `server/src/routes/common.routes.ts:200` | `GET /api/users` | **Unrestricted User Enumeration**: Returns all registered users with emails, roles, departments, and avatars without authentication or admin check. | **MEDIUM** |

---

## 3. Authentication & Session Weaknesses

1. **Client-Controlled Self-Registration Privilege Escalation**:
   - In `server/src/services/auth.service.ts:154-156`:
     ```ts
     const role: UserRole = dto.role && ['student', 'driver', 'proctor', 'admin'].includes(dto.role)
       ? dto.role
       : 'student';
     ```
   - **Vulnerability**: Any public caller submitting a POST to `/api/auth/register` with `{"role": "admin"}` or `{"role": "proctor"}` is granted full system administrator or proctor privileges!
2. **Missing Distinct Login Policy Enforcement**:
   - `POST /api/auth/login` accepts any valid credentials and logs in the user regardless of entry point. There is no validation that a user attempting to sign in through a driver or proctor portal actually holds that role grant.
3. **Overly Broad Demo Fallback**:
   - `POST /api/auth/demo-login` issues signed JWTs for any requested role (`student`, `driver`, `proctor`, `admin`) to anyone who calls it, bypassing password authentication completely. While useful for local demonstrations, it lacks environment gating and allows arbitrary role assumption.
4. **Token Storage in `localStorage`**:
   - Client stores JWT token under `universe_auth_token` in `localStorage`, which is vulnerable to XSS exfiltration if third-party scripts were introduced.
5. **Session Revocation Incompleteness**:
   - While `auth_sessions` table exists, endpoints in `hub.routes.ts`, `rides.routes.ts`, `exams.routes.ts`, `wellbeing.routes.ts`, and `sustainability.routes.ts` do not even call `authenticate` middleware, so revoked sessions or missing tokens are never validated on those routes!

---

## 4. Database Ownership & Isolation Problems

1. **Single Flat Role Column without Role Grant History**:
   - `users.role TEXT CHECK(role IN ('student', 'driver', 'proctor', 'admin'))` allows only a single role per user.
   - Users cannot have secondary roles (e.g., a Student who is also an approved Campus Transit Driver or TA).
   - No `role_assignments` table exists to record who granted the role, when it was granted, expiration timestamps, or revocation status.
2. **Missing Exam Assignment Mapping**:
   - `exam_sessions` has no proctor assignment table. Any proctor can see all exam sessions rather than only those assigned to their invigilation schedule.
3. **Missing Resource Scope in SQL Queries**:
   - Queries across routes query by URL parameter directly (`WHERE user_id = ?`) without binding the authenticated user's ID (`req.user.id`).
4. **Shared Entity Race Conditions**:
   - `rides.routes.ts` updates `booked_seats` on ride offers without atomic transaction verification, allowing concurrent overbooking beyond vehicle capacity.

---

## 5. Existing Tests & Baseline Reproduction

The test harness was executed via `npm test` (`vitest run`):

```text
✓ tests/e2e/tier3_pairwise.test.ts (8 tests)
✓ tests/e2e/tier4_scenarios.test.ts (4 tests)
✓ tests/e2e/tier2_boundaries.test.ts (18 tests)
✓ tests/e2e/tier1_features.test.ts (33 tests)
✓ tests/adversarial/m1_stress_challenge.test.ts (21 tests)
✓ tests/adversarial/m2_stress_challenge.test.ts (28 tests)
✓ tests/unit/graph_matching.test.ts (13 tests)
✓ tests/unit/privacy_dp.test.ts (10 tests)
✓ tests/unit/energy_carbon.test.ts (9 tests)
✓ tests/adversarial/m2_ride_ui_stress.test.ts (14 tests)
✓ tests/integration/full_ecosystem.test.ts (20 tests)
✓ tests/unit/auth.test.ts (12 tests)

Test Files  12 passed (12)
     Tests  190 passed (190)
  Duration  2.40s
```

**Observation**: All 190 tests pass because existing tests test isolated happy paths or algorithmic functions, but **none of the existing suites test cross-role permission denials or negative authorization attacks** (e.g. testing whether a student token is rejected on `GET /api/exams/pending-reviews`).

---

## 6. Prioritized Remediation Plan

1. **Phase 1: Canonical Role Registry & Permission Model (Checkpoint A)**:
   - Establish `docs/ROLE_CATALOG.md`, `docs/ROLE_PERMISSION_MATRIX.md`, and `docs/API_PERMISSION_MATRIX.md`.
   - Update `server/src/types/common.types.ts` and `client/src/types/index.ts` with canonical roles (`student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`).
2. **Phase 2: Database Schema & Role Assignments Migration (Checkpoint B)**:
   - Add `role_assignments`, `role_invitations`, `password_reset_tokens`, and `exam_session_assignments` tables.
   - Run safe, non-destructive migration that preserves all existing user records and populates `role_assignments` from existing `users.role`.
   - Implement `ConnectionManager` for domain database abstraction.
3. **Phase 3: Server-Side Authentication & Authorization Middleware (Checkpoint B)**:
   - Enforce `requireAuth` on all non-public endpoints.
   - Implement `requireRole(...roles)` and `requirePermission(perm)`.
   - Implement resource scope verification (`requireResourceOwner`).
   - Fix registration privilege escalation: public registration is strictly constrained to `student`.
   - Implement role-specific login validation: authenticating via `/login/driver` verifies the user possesses the `driver` role.
4. **Phase 4: Frontend Role Workspaces & Navigation Shell (Checkpoint C)**:
   - Create `client/src/navigation/navigationByRole.ts` with explicit navigation maps for each role.
   - Create `client/src/navigation/RoleSidebar.tsx` and role-aware `AppShell`.
   - Implement `RoleGate.tsx` and `PermissionGate.tsx` to guard all routes in `App.tsx`.
   - Create role-specific dashboard views: Student, Driver, Proctor, TA/Faculty, Warden, Admin.
   - Implement dedicated role login entry points (`/login/student`, `/login/driver`, `/login/proctor`, `/login/admin`, `/login/faculty`, `/login/warden`).
   - Add `AccessDeniedPage` (403 Forbidden).
5. **Phase 5: Resource Ownership & Query Scoping (Checkpoint D)**:
   - Bind queries in `hub.routes.ts`, `rides.routes.ts`, `wellbeing.routes.ts`, and `exams.routes.ts` to `req.user.id`.
6. **Phase 6: Comprehensive Role Matrix & Negative Security Test Suite (Checkpoint E)**:
   - Create `tests/security/role_matrix.test.ts` verifying negative authorization, horizontal data isolation, role escalations, and unassigned role login rejections.
   - Ensure all 190 existing tests continue to pass without regression.
7. **Phase 7: Full Documentation Handoff (Checkpoint F)**:
   - Publish all required documentation files and test results.
