# UniVerse Campus OS — Audit Baseline

**Date:** 2026-10-30  
**Repository Branch:** main  
**Lead Architect & Audit Team:** Antigravity System Architecture  
**Workspace:** `/Users/divya/Documents/Problem statement`

---

## 1. Executive Summary

UniVerse is an integrated campus operating environment uniting six major modules:
1. Student Intelligence & Academic Placement Hub
2. Graph-Optimized Smart Campus Ride-Pooling
3. Sustainable Computing & Avoided Emissions Observatory
4. Privacy-Preserving Sovereign Digital Wellbeing ($\epsilon=0.80$ Differential Privacy)
5. Responsible Examination Monitoring (Non-punitive Human-in-the-Loop review)
6. Campus Social Feed, Communities, Events & P2P Mentorship Network

Prior development established strong individual algorithms (e.g. Dijkstra topological ride routing, Laplace DP noise mechanism, Slurm energy carbon oracle, and computer vision head-pose/gaze inference). However, an end-to-end audit reveals distinct operational gaps in routing, cross-role separation, unauthenticated accessibility, UI integration, demo seeding, and missing administrative/operational endpoints.

This baseline establishes verified facts through reproducible tests and code inspection.

---

## 2. Environment & Repository Status

- **Node.js Environment:** Node.js v20+ / tsx v4.23.15 / Vite v6.4.5
- **Backend Framework:** Express v5.3.0 with TypeScript v5.8.2
- **Database Engine:** SQLite 3 via `better-sqlite3` v13.0.3 running in Write-Ahead Logging (`WAL`) mode with explicit foreign keys enabled.
- **Frontend Framework:** React 19 / TypeScript / Vite / Tailwind CSS with Material Design / Stitch design system.
- **Test Framework:** Vitest v3.0.7 / Supertest v7.3.1.
- **Baseline Test Suite Status:**
  - 16 Test Files, 256 Tests Passing (as of baseline audit).
  - Clean TypeScript compilation for both `server` (`tsc -p server/tsconfig.json`) and `client` (`tsc -b && vite build`).

---

## 3. High-Priority Confirmed Defects (P0 Baseline)

### 3.1 Public Navigation Defect: `/architecture` Protected Behind RoleGate
- **File:** `client/src/App.tsx`, lines 82, 24-26
- **Evidence:** `<Route path="/architecture" element={<RoleGate allowedRoles={['student', 'ta_faculty', 'proctor', 'warden', 'admin']}><ArchitecturePage /></RoleGate>} />`
- **Violation:** Section 3.1 & Section 12 explicit contract: *"Public Architecture must remain public. Visiting `/architecture` must never redirect to Sign In."*
- **Current Behavior:** Unauthenticated users visiting `/architecture` are redirected to `/login`. Transit drivers (`driver` role) are barred with 403 Access Denied.
- **Remediation Plan:** Move `/architecture` outside `RoleGate` as a public standalone route alongside `/`, `/how-it-works`, `/impact`, and `/about`.

### 3.2 Unauthenticated State Default Persona Leak
- **File:** `client/src/context/AuthContext.tsx`, lines 49-61, 197-208, 224
- **Evidence:** `user` state initialized to `{ id: 'usr_student_1', name: 'Aarav Sharma', role: 'student', ... }` even when `localStorage.getItem('universe_auth_token')` is `null`. `logout()` sets `user` back to `usr_student_1`.
- **Violation:** Unauthenticated visitors are treated as logged in as `usr_student_1`. Anonymous users cannot test unauthenticated states or role gates.
- **Remediation Plan:** Initialize `user: null` and `isAuthenticated: false` when no token or saved user session exists in `localStorage`. Only authenticated sessions or explicit demo persona selections should populate `user`.

### 3.3 Missing Client Workspaces for Feed, Mentorship, Warden, Faculty, Driver, and Admin
- **File:** `client/src/App.tsx`, `client/src/navigation/navigationByRole.ts`
- **Evidence:** The client lacked dedicated pages/components for:
  - Campus Feed & Communities (`/feed`)
  - Senior Mentorship discovery, request submission, and private messaging (`/mentors`, `/mentorship`)
  - Warden facility issues queue & status updater (`/facilities`)
  - Driver trip lifecycle execution (`/driver/trips`)
  - System Admin user management, role grant/revoke, and audit logs (`/admin`)
  - Interactive Campus Copilot (AI chat assistant grounded in campus database)
- **Remediation Plan:** Create cohesive, role-scoped workspace components adhering to Material 3 / Stitch tokens, wire them to backend REST endpoints, and mount respective routes.

### 3.4 Unmounted Backend Endpoints
- **File:** `server/src/app.ts`
- **Evidence:** `feedRouter`, `mentorRouter`, `campusRouter`, and `assistantRouter` were newly drafted in `server/src/routes/` but required full route mounting on `/api/feed`, `/api/mentors`, `/api/mentorship`, `/api/campus`, `/api/assistant`.
- **Remediation Plan:** Ensure all sub-routers are mounted, validated, and covered by automated integration test suites.

### 3.5 Database Demo Seed Deficit
- **File:** `server/src/db/seed.ts`
- **Evidence:** Live database held 0 `feed_posts`, 0 `communities`, 0 `campus_events`, 0 `campus_locations`, and only 3 mentors.
- **Violation:** Section 18 requirement for:
  - 30 fictional student profiles
  - 10 fictional senior mentors (at least 4 ML/AI)
  - 5 faculty/TA profiles
  - 2 wardens
  - 3 transit drivers
  - 2 exam proctors
  - 1-2 system admin accounts
  - 40 campus posts across all categories
  - 50 comments/replies
  - 6 communities
  - 12 events, 20 resources, 10 rides on connected graph
- **Remediation Plan:** Extend `seed.ts` and add CLI utilities `scripts/seed-demo` and `scripts/reset-demo`.

---

## 4. Operational Safety & Integrity Directives

1. **Deny-by-Default:** Every protected endpoint requires `requireAuth` and explicit `requireRole` or permission scope.
2. **Transaction Isolation:** All multi-step database mutations (such as ride seat booking, mentor request status updates, and proctor triage) must execute inside `db.transaction()`.
3. **Differential Privacy Guarantee:** Wellbeing analytics must enforce Laplace noise ($\epsilon=0.80$) and suppress any cohort where $k < 5$.
4. **Non-punitive AI Observation:** No computer vision observation event may automatically apply student disciplinary actions; human proctor review remains mandatory.
