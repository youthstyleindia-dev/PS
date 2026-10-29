# UniVerse — Repository and Architecture Inventory (Read-Only Audit)

> **Document:** `docs/security-audit/01_REPOSITORY_INVENTORY.md`  
> **Audit Status:** Phase 1 Read-Only Inventory Complete  
> **Timestamp:** 2026-10-30T04:14:00+05:30  
> **Auditor:** Principal Application-Security Reviewer & Database Architect  

---

## 1. System Frameworks, Runtime Versions & Entry Points

### 1.1 Runtimes & Frameworks
| Layer | Technology | Manifest Version | Runtime Notes |
| :--- | :--- | :--- | :--- |
| **Node.js Runtime** | Node.js (macOS Darwin arm64) | `>= 20.x` | Monorepo structure, unified package scripts |
| **Backend Framework** | Express | `v5.3.0` | Strict JSON parser (limit 10MB), CORS, global auth token parser |
| **Database Engine** | SQLite 3 via `better-sqlite3` | `v13.0.3` | WAL mode, `foreign_keys = ON`, `synchronous = NORMAL` |
| **Frontend Framework** | React | `v19.0.0` | Functional components, Hooks, Context API |
| **Frontend Routing** | React Router DOM | `v7.1.5` | Declarative routing with `RoleGate` route guards |
| **Frontend Bundler** | Vite | `v6.2.0` | ES modules, Rolldown-backed build target, `@vitejs/plugin-react` |
| **CSS & Design System** | Tailwind CSS | `v4.0.0` | Google Stitch collegiate brutalist palette, CSS variables |
| **Testing Harness** | Vitest & Supertest | `vitest ^3.0.7`, `supertest ^7.3.1` | Unit, adversarial, E2E, and security test suites |

### 1.2 Entry Points
- **Backend Server Entry**: [`server/src/index.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/index.ts) -> invokes [`server/src/app.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/app.ts) listening on port 3001 (or `process.env.PORT`).
- **Database Initialization**: [`server/src/db/connection.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/db/connection.ts) and [`server/src/database/connection-manager.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/database/connection-manager.ts).
- **Database Seeder**: [`server/src/db/seed.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/db/seed.ts).
- **Frontend Client Entry**: [`client/src/main.tsx`](file:///Users/divya/Documents/Problem%20statement%20/client/src/main.tsx) mounting [`client/src/App.tsx`](file:///Users/divya/Documents/Problem%20statement%20/client/src/App.tsx) to root DOM.
- **Client Auth Provider**: [`client/src/context/AuthContext.tsx`](file:///Users/divya/Documents/Problem%20statement%20/client/src/context/AuthContext.tsx).

---

## 2. Route Groups & API Surface Inventory

### 2.1 Backend API Route Mounting (`server/src/app.ts`)
| Base Route Path | Router Module | Core Domain Scope |
| :--- | :--- | :--- |
| `/api/auth` | `authRouter` ([`server/src/routes/auth.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/auth.routes.ts)) | Identity, Login, Role Entry Points, Profiles, Roles, Sessions |
| `/api/hub` | `hubRouter` ([`server/src/routes/hub.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/hub.routes.ts)) | Module A: Academic Hub, Student Profiles, Milestones, Mentors |
| `/api/rides` | `ridesRouter` ([`server/src/routes/rides.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/rides.routes.ts)) | Module B: Topology Graph, Driver Offers, Requests, DARP Matching |
| `/api/sustainability` | `sustainabilityRouter` ([`server/src/routes/sustainability.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/sustainability.routes.ts)) | Module C: Workload Observability, Telemetry, Scenarios |
| `/api/wellbeing` | `wellbeingRouter` ([`server/src/routes/wellbeing.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/wellbeing.routes.ts)) | Module D: Focus Sessions, Domain Rules, DP Cohort Aggregates |
| `/api/exams` | `examsRouter` ([`server/src/routes/exams.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/exams.routes.ts)) | Module E: Exam Sessions, Event Incursions, Proctor Adjudication |
| `/api/activity` | `commonRouter` ([`server/src/routes/common.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/common.routes.ts)) | Shared Activity Ledger Stream |
| `/api/notifications` | `commonRouter` ([`server/src/routes/common.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/common.routes.ts)) | User Notification Center |
| `/api/users` | `commonRouter` ([`server/src/routes/common.routes.ts`](file:///Users/divya/Documents/Problem%20statement%20/server/src/routes/common.routes.ts)) | Administrator User & Role Directory |
| `/api/health` | Standalone endpoint (`server/src/app.ts`) | Engine & SQLite table health ping |

---

## 3. Authentication & Session Architecture

### 3.1 Token Mechanism & Session State
- **Signing Algorithm**: HMAC-SHA256 (`jsonwebtoken` v9.0.3).
- **Secret Key**: `process.env.JWT_SECRET` with fallback `'universe-super-secret-campus-os-jwt-key-2026'`.
- **Token Claims Payload**:
  - `sub`: Canonical user UUID (`users.id`).
  - `email`: Normalized user email.
  - `role`: Active session role (`student`, `driver`, `proctor`, `ta_faculty`, `warden`, `admin`).
  - `roles`: Comprehensive array of active assigned roles (`role_assignments`).
  - `name`: Display name.
  - `department`: Academic department.
  - `iat`, `exp`: 7 days expiration (604,800 seconds).
- **Session Revocation Tracking**: Every token issuance generates a SHA-256 digest recorded in `auth_sessions`. On incoming requests, `authenticate` middleware in `server/src/authorization/require-auth.ts` verifies that `is_revoked = 0` and `expires_at > CURRENT_TIMESTAMP`.
- **Client Storage Mechanism**: Client maintains JWT token in `localStorage` under key `universe_auth_token` and user profile under `universe_auth_user`. No HTTP cookies are currently utilized; authorization is conveyed strictly via HTTP `Authorization: Bearer <token>` header.
- **Password Hashing**: Salted Bcrypt with cost factor 10 (`bcryptjs` v3.0.3).
- **Identified Gaps**:
  - Missing refresh token rotation (7-day static JWT without separate refresh token).
  - Schema tables `password_reset_tokens` and `role_invitations` exist in `schema.sql` but currently lack active API endpoints in `auth.routes.ts`.
  - MFA metadata is not yet captured or enforced for `admin`.

---

## 4. Role Taxonomy & Canonical Mappings

### 4.1 Canonical Roles in Codebase vs. Audit Spec
The audit mission specifies exact canonical role identifiers:
- `STUDENT`
- `TA` (Teaching Assistant / Faculty support)
- `WARDEN`
- `TRANSIT_DRIVER`
- `EXAM_PROCTOR`
- `SYSTEM_ADMIN`

In the existing codebase, roles were historically modeled in lowercase:
- `student` -> Maps to `STUDENT`
- `driver` -> Maps to `TRANSIT_DRIVER`
- `proctor` -> Maps to `EXAM_PROCTOR`
- `ta_faculty` -> Maps to `TA` (and Teaching Faculty)
- `warden` -> Maps to `WARDEN`
- `admin` -> Maps to `SYSTEM_ADMIN`

### 4.2 Ambiguous & Legacy Identifiers Identified
- `tax`: Investigated in [`client/src/pages/AboutPrinciplesPage.tsx`](file:///Users/divya/Documents/Problem%20statement%20/client/src/pages/AboutPrinciplesPage.tsx#L55). It represents an economic metric string: `"ECOSYSTEM: ZERO_COMMERCIAL_TAX"`. It is NOT a user role.
- `reviewer`: Defined as an attribute `reviewer_id` in `observation_events` and `exam_audit_log`, representing the assigned `EXAM_PROCTOR`.
- `faculty` / `ta`: Normalized to `ta_faculty` in `LEGACY_ROLE_MAP`.

---

## 5. Database Engines, Schema Catalog & Isolation

- **Engine**: SQLite 3 using `better-sqlite3`.
- **Database File**: `server/data/universe.db` (and disposable test databases in `tests/`).
- **Pragmas**: `journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL`, `busy_timeout = 5000`.
- **Active Table Count**: 25 relational tables + 19 B-tree indexes.
- **Transaction Boundaries**:
  - `seed.ts`: executes entire seed in `db.transaction()`.
  - `rideMatchingService.confirmAndBookRide`: transaction wraps booking insertion and seat decrement. (Note: potential race condition identified where `available_seats` check is executed prior to transaction entry).

---

## 6. Frontend Navigation & Role Gate Configuration

### 6.1 Route Guards (`client/src/App.tsx`)
| Route Path | Allowed Roles | Component Guarded |
| :--- | :--- | :--- |
| `/app` | All 6 roles | `Dashboard` (with role-scoped widgets) |
| `/academic`, `/hub` | `student`, `ta_faculty`, `admin` | `AcademicHub` |
| `/rides` | `student`, `driver`, `ta_faculty`, `warden`, `admin` | `RidesPage` |
| `/sustainability` | `student`, `driver`, `ta_faculty`, `warden`, `admin` | `SustainabilityPage` |
| `/wellbeing` | `student` | `WellbeingPage` |
| `/exams`, `/exam-monitor` | `proctor`, `admin` | `ExamMonitorPage` |
| `/settings` | All 6 roles | `SettingsPage` (Admin enclave conditionally rendered) |
| `/architecture` | `student`, `ta_faculty`, `proctor`, `warden`, `admin` | `ArchitecturePage` |
| `/login`, `/login/:roleKey`| Public | `LoginPage` |

---

## 7. Package Scripts & Build Warnings

- `npm run dev`: Concurrently runs server (`tsx watch server/src/index.ts`) and client (`vite`).
- `npm run build`: Executes `build:server` (`tsc -p server/tsconfig.json`) and `build:client` (`tsc -b && vite build`).
  - *Warning noticed*: Vite warns chunks `> 500 kB` (`dist/assets/index-*.js` ~621kB minified). Non-blocking production chunk size suggestion.
- `npm test`: Executes `vitest run` across all test suites.
- `npm run seed`: Executes deterministic database fixture seeder.
