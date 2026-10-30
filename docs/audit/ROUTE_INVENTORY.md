# UniVerse Campus OS — Route Inventory & Navigation Contract

**Audited:** 2026-10-30  
**Scope:** Client React Router definitions and Server Express endpoints.

---

## 1. Public & Unauthenticated Routes (Frontend)

| Path | Component | Purpose | Auth Required | Expected Access |
|---|---|---|---|---|
| `/` | `LandingPage` | Public manifesto, ecosystem overview, node setup CTA | No | All visitors |
| `/architecture` | `ArchitecturePage` | Mathematical models, system invariants, architecture | **No (Fixed)** | All visitors & all roles |
| `/how-it-works` | `HowItWorksPage` | Interactive explainer for 5 core collegiate modules | No | All visitors |
| `/impact` | `ImpactPage` | Avoided carbon calculation methodology and metrics | No | All visitors |
| `/about` | `AboutPrinciplesPage` | Institutional ethics, DP $\epsilon=0.80$, zero-tax ethos | No | All visitors |
| `/onboarding` | `OnboardingPage` | Interactive scholar node initialization wizard | No | All visitors |
| `/login` | `LoginPage` | Standard authentication portal | No | All visitors |
| `/login/:roleKey` | `LoginPage` | Direct role-specific login portal (e.g. `/login/driver`) | No | All visitors |

---

## 2. Authenticated Role Workspaces (Frontend)

| Route Path | Allowed Roles | Workspace Purpose | Primary Data Entity |
|---|---|---|---|
| `/app` | `student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin` | Main operational dashboard scoped by role | Aggregated overview |
| `/feed` | `student`, `ta_faculty`, `warden`, `admin` | Campus social layer, Q&A, project updates, announcements | `feed_posts`, `communities` |
| `/academic` | `student`, `ta_faculty`, `admin` | Placement readiness, skill radar, study materials | `placement_records`, `academic_resources` |
| `/mentors` | `student`, `ta_faculty`, `admin` | Senior mentor search, match explanations, request form | `mentors`, `mentorship_requests` |
| `/mentorship/messages` | `student`, `ta_faculty` | Accepted 1-on-1 private mentorship chat channel | `mentorship_conversations` |
| `/rides` | `student`, `driver`, `ta_faculty`, `warden`, `admin` | Graph ride-pooling visualizer, corridor search, booking | `ride_offers`, `campus_nodes` |
| `/driver/trips` | `driver`, `admin` | Driver dispatch, route lifecycle, passenger manifest | `ride_offers`, `ride_bookings` |
| `/sustainability` | `student`, `driver`, `ta_faculty`, `warden`, `admin` | Slurm HPC carbon observatory, energy grid telemetry | `service_workloads`, `telemetry_snapshots` |
| `/wellbeing` | `student` | Sovereign focus timer, domain blocker, DP cohort stats | `focus_sessions`, `browsing_events` |
| `/exams` | `proctor`, `admin` | Responsible examination review tribunal & CV timeline | `exam_sessions`, `observation_events` |
| `/facilities` | `warden`, `admin` | Hostel/campus facility maintenance issue triage | `facility_issues`, `campus_locations` |
| `/admin` | `admin` | Central user directory, role assignment, audit explorer | `users`, `role_assignments`, `auth_audit_log` |
| `/settings` | All authenticated | Security enclave, active sessions, credential keys | `auth_sessions`, `users` |

---

## 3. Server API Routes Inventory

### 3.1 Authentication & RBAC (`/api/auth`)
- `POST /api/auth/register` — Register student account with bcrypt password hashing
- `POST /api/auth/login` — Email/password login with JWT token issuance
- `POST /api/auth/login/:roleKey` — Enforce login matching a specific active role assignment
- `POST /api/auth/demo-login` — Direct demo persona authentication for evaluation
- `GET /api/auth/me` — Read authenticated user profile, permissions, and active roles
- `POST /api/auth/logout` — Terminate session and record security audit log
- `POST /api/auth/role/assign` — Admin: Grant role assignment with justification
- `POST /api/auth/role/revoke` — Admin: Revoke role assignment with justification

### 3.2 Academic Hub & Placement (`/api/hub`)
- `GET /api/hub/profile/:studentId` — Retrieve student skill profile and target role
- `PUT /api/hub/profile/:studentId` — Update own skill radar and placement objectives
- `GET /api/hub/milestones/:studentId` — Retrieve placement preparation milestones
- `POST /api/hub/milestones` — Create new placement milestone
- `PATCH /api/hub/milestones/:id/toggle` — Mark placement milestone complete/incomplete
- `GET /api/hub/resources` — Filter and list verified academic syllabus resources
- `POST /api/hub/resources` — Faculty/Student: Publish curriculum study material
- `POST /api/hub/resources/:id/rate` — Submit peer rating for academic resource

### 3.3 Mentorship Network (`/api/mentors` & `/api/mentorship`)
- `GET /api/mentors` — Search approved senior mentors with skill/domain filters
- `GET /api/mentors/:mentorId` — Retrieve mentor profile with available slots and topics
- `GET /api/mentorship/requests` — List mentorship requests for current user (student or mentor)
- `POST /api/mentorship/requests` — Submit new mentorship request
- `PATCH /api/mentorship/requests/:requestId` — Accept, decline, or propose alternate slot
- `GET /api/mentorship/conversations/:conversationId` — Retrieve private message transcript
- `POST /api/mentorship/conversations/:conversationId/messages` — Send message in active conversation

### 3.4 Campus Social Feed (`/api/feed`)
- `GET /api/feed` — Feed list with tab filters (`for_you`, `questions`, `projects`, `events`, etc.)
- `POST /api/feed/posts` — Create a new campus post
- `GET /api/feed/posts/:postId` — Fetch single post with comments and reactions
- `PATCH /api/feed/posts/:postId` — Author edit post
- `DELETE /api/feed/posts/:postId` — Author or Admin delete post
- `POST /api/feed/posts/:postId/reactions` — Toggle like/reaction
- `POST /api/feed/posts/:postId/comments` — Add comment or reply
- `POST /api/feed/posts/:postId/bookmarks` — Toggle bookmark
- `POST /api/feed/posts/:postId/reports` — Report inappropriate content to moderation queue

### 3.5 Campus Operations & Facilities (`/api/campus`)
- `GET /api/campus/directory` — Campus buildings, labs, libraries, hostels
- `GET /api/campus/events` — Upcoming campus events & workshops
- `POST /api/campus/events/:eventId/rsvp` — Register / cancel RSVP for campus event
- `GET /api/campus/communities` — List student societies and clubs
- `POST /api/campus/communities/:communityId/join` — Join or leave campus community
- `GET /api/campus/announcements` — Official university and department notices
- `GET /api/campus/facilities/issues` — Warden/Student: Query facility maintenance issues
- `POST /api/campus/facilities/issues` — Student: Report facility maintenance defect
- `PATCH /api/campus/facilities/issues/:issueId` — Warden: Triage and update issue status

### 3.6 Smart Ride-Pooling (`/api/rides`)
- `GET /api/rides/graph` — Retrieve campus graph topology with Dijkstra edge weights
- `GET /api/rides/offers` — Search available vehicle route offers
- `POST /api/rides/offers` — Driver: Publish route offer with seat capacity and corridor
- `PATCH /api/rides/offers/:offerId/status` — Driver: Start, pickup, dropoff, complete trip
- `POST /api/rides/requests` — Passenger: Submit ride request
- `POST /api/rides/match` — Graph algorithm: Compute optimal multi-hop passenger pooling
- `POST /api/rides/book` — Reserve confirmed seat with atomic capacity check

### 3.7 Sustainable Computing (`/api/sustainability`)
- `GET /api/sustainability/metrics` — Avoided carbon metrics and PUE telemetry
- `GET /api/sustainability/workloads` — Slurm HPC queue status and carbon-aware dispatch
- `POST /api/sustainability/simulate` — Execute energy scenario comparison simulation

### 3.8 Digital Wellbeing (`/api/wellbeing`)
- `GET /api/wellbeing/sessions` — Retrieve private focus sessions for authenticated user
- `POST /api/wellbeing/sessions` — Record completed local focus session
- `GET /api/wellbeing/cohort` — Retrieve DP $\epsilon=0.80$ noisy cohort aggregations
- `DELETE /api/wellbeing/data` — Sovereign data erasure (irrevocably purge browsing data)

### 3.9 Responsible Examination Monitoring (`/api/exams` & `/api/exam-monitor`)
- `GET /api/exams/sessions` — Proctor: List assigned examination sessions
- `GET /api/exams/sessions/:id/observations` — Proctor: Stream observation event queue
- `POST /api/exams/observations/:id/review` — Proctor: Human-in-the-loop review disposition
- `GET /api/exams/audit` — Immutable audit log of all proctor dispositions

### 3.10 Cloud Generative AI Copilot (`/api/assistant`)
- `GET /api/assistant/conversations` — Retrieve assistant conversation threads
- `POST /api/assistant/conversations` — Start a new assistant conversation
- `POST /api/assistant/conversations/:id/messages` — Send query; grounds response in live DB
- `POST /api/assistant/actions/:id/confirm` — Explicit user confirmation before executing any write
