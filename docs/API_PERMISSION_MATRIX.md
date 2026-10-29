# UniVerse: Comprehensive API Permission Matrix
**Specification Version**: 2.0.0  
**Enforcement Boundary**: Server Route Controllers & Middleware

---

## 1. Authentication & Identity Endpoints (`/api/auth`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | `PUBLIC` | Enforces `role: 'student'` only. Rejects client-supplied privileged roles. | `400 BAD_REQUEST` | Public self-registration for students |
| `POST` | `/api/auth/login` | `PUBLIC` | Validates credentials against central identity store. | `401 UNAUTHORIZED` | Standard email + password authentication |
| `POST` | `/api/auth/login/:roleKey` | `PUBLIC` | Validates credentials AND verifies `roleKey` in user's active role assignments. | `403 ROLE_NOT_ASSIGNED` | Role-specific login entry point |
| `POST` | `/api/auth/demo-login` | `PUBLIC` (Dev Mode) | Issues demo token for pre-provisioned demo accounts only. Disabled in prod. | `403 FORBIDDEN` | Evaluator quick persona switch |
| `GET` | `/api/auth/me` | `AUTHENTICATED` | Derives identity from `req.user.id`. | `401 UNAUTHORIZED` | Get current authenticated user profile & roles |
| `PUT` | `/api/auth/profile` | `AUTHENTICATED` | Operates on `req.user.id`. | `401 UNAUTHORIZED` | Update own name, avatar, or bio |
| `POST` | `/api/auth/logout` | `AUTHENTICATED` | Revokes active session hash in `auth_sessions`. | `401 UNAUTHORIZED` | Secure session revocation |
| `POST` | `/api/auth/change-password` | `AUTHENTICATED` | Validates current password; revokes all existing sessions. | `401 UNAUTHORIZED` | Password rotation |
| `GET` | `/api/auth/sessions` | `AUTHENTICATED` | Scoped to `WHERE user_id = req.user.id`. | `401 UNAUTHORIZED` | List active sessions |
| `DELETE` | `/api/auth/sessions/:id` | `AUTHENTICATED` | Session must belong to `req.user.id`. | `403 FORBIDDEN` | Kill specific active session |
| `GET` | `/api/auth/audit` | `admin` | Global audit log. | `403 FORBIDDEN` | Security audit trail |

---

## 2. Academic & Placement Endpoints (`/api/hub`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/hub/profile/:studentId` | `student`, `ta_faculty`, `admin` | Must be own profile (`req.user.id === studentId`) OR faculty/admin. | `403 FORBIDDEN` | Read student profile & skill inventory |
| `PUT` | `/api/hub/profile/:studentId` | `student` | Strictly own profile (`req.user.id === studentId`). | `403 FORBIDDEN` | Update own skills, goals, resume URL |
| `GET` | `/api/hub/placement-milestones/:studentId` | `student`, `ta_faculty`, `admin` | Must be own milestones OR faculty/admin. | `403 FORBIDDEN` | Read placement milestones |
| `POST` | `/api/hub/placement-milestones/:studentId/toggle` | `student` | Strictly own milestones (`req.user.id === studentId`). | `403 FORBIDDEN` | Toggle completion status |
| `GET` | `/api/hub/mentors` | `student`, `ta_faculty`, `admin` | Public mentor directory. | `401 UNAUTHORIZED` | Search available mentors |
| `POST` | `/api/hub/mentorship-requests` | `student` | Requester must be `req.user.id`. | `403 FORBIDDEN` | Apply for mentorship |
| `GET` | `/api/hub/mentorship-requests/:userId` | `student`, `ta_faculty`, `admin` | Requester ID or Mentor ID must match `req.user.id`. | `403 FORBIDDEN` | View mentorship requests |
| `PATCH` | `/api/hub/mentorship-requests/:requestId` | `ta_faculty`, `admin` | Mentor must match `req.user.id` of request. | `403 FORBIDDEN` | Accept / reject mentorship request |
| `GET` | `/api/hub/resources` | `student`, `ta_faculty`, `admin` | Public approved catalog. | `401 UNAUTHORIZED` | Search academic resources |
| `POST` | `/api/hub/resources` | `ta_faculty`, `admin` | Source attribution set to `req.user.id`. | `403 FORBIDDEN` | Publish study material / lecture notes |
| `POST` | `/api/hub/resources/:id/rate` | `student`, `ta_faculty` | Reviewer ID set to `req.user.id`. Rating $\in [1, 5]$. | `403 FORBIDDEN` | Submit 5-star community rating |

---

## 3. Smart Campus Transit Endpoints (`/api/rides`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/rides/graph` | `AUTHENTICATED` | Canonical graph nodes & edges with congestion $c(t)$. | `401 UNAUTHORIZED` | Spatial campus map topology |
| `GET` | `/api/rides/shortest-path` | `AUTHENTICATED` | Validates nodes against known campus graph. | `401 UNAUTHORIZED` | Dijkstra shortest path calculation |
| `GET` | `/api/rides/offers` | `AUTHENTICATED` | Active ride offers across campus. | `401 UNAUTHORIZED` | List published carpool itineraries |
| `POST` | `/api/rides/offers` | `driver`, `admin` | Driver ID derived from `req.user.id`. Rejects non-drivers. | `403 FORBIDDEN` | Driver publishes carpool itinerary |
| `GET` | `/api/rides/requests` | `driver`, `student`, `admin` | Drivers see matchable requests; students see own. | `401 UNAUTHORIZED` | List ride requests |
| `POST` | `/api/rides/requests` | `student`, `ta_faculty` | Passenger ID derived from `req.user.id`. | `403 FORBIDDEN` | Passenger posts ride request |
| `POST` | `/api/rides/match` | `AUTHENTICATED` | Executes Dial-a-Ride insertion algorithm with $\le 35\%$ detour. | `401 UNAUTHORIZED` | Run ride-pooling matcher |
| `POST` | `/api/rides/book` | `student`, `ta_faculty` | Passenger ID derived from `req.user.id`. Atomic seat deduction. | `403 FORBIDDEN` | Book seat in carpool offer |
| `GET` | `/api/rides/summary` | `AUTHENTICATED` | Aggregated campus transit & carbon offset metrics. | `401 UNAUTHORIZED` | Avoided carbon and transit totals |

---

## 4. Sustainable Computing Endpoints (`/api/sustainability`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/sustainability/services` | `AUTHENTICATED` | Service list with CPU/GPU utilization. | `401 UNAUTHORIZED` | Cluster service observability |
| `POST` | `/api/sustainability/workloads/:id/scale` | `admin` | Protected datacenter cluster scaling. | `403 FORBIDDEN` | Scale simulated compute nodes |
| `GET` | `/api/sustainability/telemetry` | `AUTHENTICATED` | Power ($P(U)$) and carbon emission telemetry. | `401 UNAUTHORIZED` | Power curve and CEA timeline |
| `GET` | `/api/sustainability/scenarios` | `AUTHENTICATED` | Baseline PUE 1.75 vs Eco PUE 1.20 comparison. | `401 UNAUTHORIZED` | Energy optimization sandbox |
| `POST` | `/api/sustainability/toggle-optimization` | `admin` | Toggles global energy optimization mode. | `403 FORBIDDEN` | Toggle cooling and consolidation |

---

## 5. Private Digital Wellbeing Endpoints (`/api/wellbeing`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/wellbeing/sessions/start` | `student` | Owner derived from `req.user.id`. | `403 FORBIDDEN` | Start focus session |
| `POST` | `/api/wellbeing/sessions/:id/pause` | `student` | Session must belong to `req.user.id`. | `403 FORBIDDEN` | Pause active focus session |
| `POST` | `/api/wellbeing/sessions/:id/stop` | `student` | Session must belong to `req.user.id`. | `403 FORBIDDEN` | Terminate focus session |
| `GET` | `/api/wellbeing/sessions/user/:userId` | `student` | Strictly `req.user.id === userId`. Block other users. | `403 FORBIDDEN` | Inspect own focus sessions |
| `POST` | `/api/wellbeing/events` | `student` | User ID derived from `req.user.id`. Hostname sanitized. | `403 FORBIDDEN` | Log focus browsing event |
| `GET` | `/api/wellbeing/rules/:userId` | `student` | Strictly `req.user.id === userId`. | `403 FORBIDDEN` | Get personal domain rules |
| `POST` | `/api/wellbeing/rules` | `student` | User ID derived from `req.user.id`. | `403 FORBIDDEN` | Add personal domain rule |
| `GET` | `/api/wellbeing/cohort-aggregate` | `AUTHENTICATED` | Applies Laplace Differential Privacy ($\epsilon=0.8, k \ge 3$). | `401 UNAUTHORIZED` | Anonymized department aggregates |
| `DELETE` | `/api/wellbeing/history/:userId` | `student` | Strictly `req.user.id === userId`. Permanent database purge. | `403 FORBIDDEN` | GDPR/DPDP Right to Erasure |

---

## 6. Responsible Examination Review Endpoints (`/api/exams`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/exams/sessions` | `proctor`, `admin` | Proctors see assigned sessions; Admins see all. Students blocked. | `403 FORBIDDEN` | List active exam sessions |
| `POST` | `/api/exams/sessions` | `admin`, `proctor` | Creates new exam session. | `403 FORBIDDEN` | Schedule examination session |
| `POST` | `/api/exams/events` | `AUTHENTICATED` | Ingests observation cues (Mode 1 demo or Mode 2 local CV). | `401 UNAUTHORIZED` | Post observation incident |
| `GET` | `/api/exams/pending-reviews` | `proctor`, `admin` | Shows unadjudicated observation events for assigned sessions. | `403 FORBIDDEN` | Proctor review queue |
| `GET` | `/api/exams/events/:sessionId` | `proctor`, `admin` | Session must be assigned to proctor via assignments. | `403 FORBIDDEN` | Read events for session |
| `PATCH` | `/api/exams/events/:id/review`| `proctor`, `admin` | Session must be assigned to proctor. Reviewer ID = `req.user.id`. | `403 FORBIDDEN` | Submit proctor review determination |
| `GET` | `/api/exams/audit-log/:sessionId`| `proctor`, `admin` | Session must be assigned to proctor OR user is admin. | `403 FORBIDDEN` | Immutable proctor audit log |

---

## 7. Campus Common & Admin Endpoints (`/api/`)

| Method | Path | Required Role / Clearance | Resource Scope Rule | Denial Response | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | `PUBLIC` | Health status and database connectivity. | None | Application health check |
| `GET` | `/api/activity` | `AUTHENTICATED` | Campus activity stream. | `401 UNAUTHORIZED` | Central activity drawer |
| `GET` | `/api/notifications` | `AUTHENTICATED` | Filtered strictly to `WHERE user_id = req.user.id`. | `401 UNAUTHORIZED` | Personal notifications |
| `GET` | `/api/users` | `admin` | Only administrators can enumerate user directory. | `403 FORBIDDEN` | User management directory |
| `GET` | `/api/users/:userId` | `AUTHENTICATED` | Must be `req.user.id === userId` OR `req.user.role === 'admin'`. | `403 FORBIDDEN` | User detail inspect |
| `POST` | `/api/admin/roles/assign` | `admin` | Assigns canonical role to user; writes to `role_assignments`. | `403 FORBIDDEN` | Grant user role |
| `POST` | `/api/admin/roles/revoke` | `admin` | Revokes role from user; updates `role_assignments`. | `403 FORBIDDEN` | Revoke user role |
