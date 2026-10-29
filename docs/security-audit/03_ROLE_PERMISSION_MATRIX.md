# UniVerse — Canonical Role Permission & Route Matrix

> **Document:** `docs/security-audit/03_ROLE_PERMISSION_MATRIX.md`  
> **Status:** Canonical Matrix Specification  
> **Version:** 2.1.0  

---

## 1. Canonical Role Hierarchy & Definitions

| Role Identifier (Code) | Role Identifier (Standard) | Persona Scope | Allowed Sector Navigation |
| :--- | :--- | :--- | :--- |
| `student` | `STUDENT` | Matriculated student learner | `/app`, `/academic`, `/hub`, `/rides`, `/wellbeing`, `/settings` |
| `driver` | `TRANSIT_DRIVER` | Certified campus transit driver | `/app`, `/rides`, `/sustainability`, `/settings` |
| `proctor` | `EXAM_PROCTOR` | Appointed exam integrity review chair | `/app`, `/exams`, `/architecture`, `/settings` |
| `ta_faculty` | `TA` | Teaching assistant / faculty mentor | `/app`, `/academic`, `/hub`, `/rides`, `/sustainability`, `/settings` |
| `warden` | `WARDEN` | Campus residential and hostel staff | `/app`, `/rides`, `/sustainability`, `/settings` |
| `admin` | `SYSTEM_ADMIN` | IT operations and root enclave admin | `/app`, `/settings`, `/academic`, `/rides`, `/sustainability`, `/exams`, `/architecture` |

---

## 2. API Endpoint Authorization Matrix

| HTTP Method | API Endpoint Route | Permitted Roles | Resource Ownership / Scope Policy |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Unauthenticated) | Always forces `student` role; ignores client-submitted role fields |
| `POST` | `/api/auth/login` | Public (Unauthenticated) | Authenticates credentials, returns active role + assigned roles |
| `POST` | `/api/auth/login/:roleKey` | Public (Unauthenticated) | Validates user holds `:roleKey` in `role_assignments`, returns 403 if unassigned |
| `POST` | `/api/auth/demo-login` | Public (Demo Mode) | Issues signed token for pre-seeded test personas |
| `GET` | `/api/auth/me` | Authenticated (All Roles) | Returns verified profile, assigned roles, and scoped permission matrix |
| `PUT` | `/api/auth/profile` | Authenticated (All Roles) | Scoped strictly to caller's own user record (`req.user.sub`) |
| `POST` | `/api/auth/change-password` | Authenticated (All Roles) | Scoped strictly to caller's own user record (`req.user.sub`) |
| `POST` | `/api/auth/logout` | Authenticated (All Roles) | Invalidates active token hash in `auth_sessions` table |
| `GET` | `/api/auth/sessions` | Authenticated (All Roles) | Returns active sessions for `req.user.sub` |
| `DELETE` | `/api/auth/sessions/:sessionId` | Authenticated (All Roles) | Revokes session owned by `req.user.sub` or admin |
| `POST` | `/api/auth/roles/assign` | `admin` | Requires `admin` role clearance; logs security audit event |
| `POST` | `/api/auth/roles/revoke` | `admin` | Requires `admin` role clearance; logs security audit event |
| `GET` | `/api/users` | `admin` | Requires `admin` role clearance; lists users and assigned roles |
| `GET` | `/api/hub/profile/:studentId` | `student`, `ta_faculty`, `admin` | Non-admin/TA students can read only own profile or peer directory fields |
| `PUT` | `/api/hub/profile/:studentId` | `student`, `admin` | Requires resource owner (`studentId === req.user.sub`) |
| `GET` | `/api/hub/placement-milestones/:studentId` | `student`, `ta_faculty`, `admin` | Non-admin/TA students can view only own milestones |
| `POST` | `/api/hub/placement-milestones/:studentId/toggle` | `student`, `admin` | Requires resource owner (`studentId === req.user.sub`) |
| `GET` | `/api/hub/mentors` | All Roles | Search and discover active mentors and competencies |
| `POST` | `/api/hub/mentorship-requests` | `student`, `admin` | Mentee ID enforced to `req.user.sub` |
| `GET` | `/api/hub/mentorship-requests/:userId` | `student`, `ta_faculty`, `admin` | Caller must be the mentee, mentor, or admin |
| `PATCH` | `/api/hub/mentorship-requests/:requestId` | `ta_faculty`, `student`, `admin` | Only the assigned mentor can accept/reject |
| `GET` | `/api/rides/graph` | All Roles | Schematic campus transit graph |
| `GET` | `/api/rides/offers` | All Roles | Active carpool offers directory |
| `POST` | `/api/rides/offers` | `driver`, `admin` | Driver ID derived strictly from `req.user.sub` |
| `GET` | `/api/rides/requests` | `student`, `driver`, `admin` | Open ride request pool |
| `POST` | `/api/rides/requests` | `student`, `admin` | Passenger ID derived strictly from `req.user.sub` |
| `POST` | `/api/rides/matches/:matchId/confirm` | `student`, `driver`, `admin` | Atomic seat decrement with concurrency lock |
| `GET` | `/api/sustainability/telemetry` | All Roles | Live telemetry observability (clean energy and carbon) |
| `POST` | `/api/sustainability/workloads/:id/scale` | `admin` | Server cluster replica autoscaling |
| `POST` | `/api/sustainability/toggle-optimization` | `admin` | Energy optimization mode toggle |
| `POST` | `/api/wellbeing/sessions/start` | `student` | User ID derived strictly from `req.user.sub` |
| `POST` | `/api/wellbeing/sessions/:id/stop` | `student` | Caller must own session ID |
| `GET` | `/api/wellbeing/sessions/:sessionId` | `student` | Caller must own session ID |
| `GET` | `/api/wellbeing/sessions/user/:userId` | `student`, `admin` | Scoped strictly to `req.user.sub === userId` |
| `DELETE` | `/api/wellbeing/history/:userId` | `student`, `admin` | Right to erasure; scoped strictly to `req.user.sub` |
| `GET` | `/api/wellbeing/cohort-aggregate` | All Roles | Differential privacy query (Laplace noise $\varepsilon = 0.8$) |
| `GET` | `/api/exams/sessions` | `proctor`, `admin` | Session list |
| `POST` | `/api/exams/sessions` | `proctor`, `admin` | Session scheduling |
| `GET` | `/api/exams/pending-reviews` | `proctor`, `admin` | Filtered strictly by proctor's assigned sessions |
| `GET` | `/api/exams/events/:sessionId` | `proctor`, `admin` | Scoped strictly to assigned exam session |
| `PATCH` | `/api/exams/events/:eventId/review` | `proctor`, `admin` | Mandatory review notes and action code |
| `GET` | `/api/exams/audit-log/:sessionId` | `proctor`, `admin` | Immutable exam adjudication audit stream |
| `GET` | `/api/notifications` | Authenticated (All Roles) | Filtered strictly to `req.user.sub` |
| `GET` | `/api/activity` | Authenticated (All Roles) | User activity stream |
