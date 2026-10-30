# UniVerse Campus OS — Gap Matrix

**Audited:** 2026-10-30  
**Status Key:**
- `VERIFIED_EXISTING`: Fully implemented, verified against code and passing tests.
- `EXISTS_BUT_BROKEN`: Partially implemented but fails runtime check or contract.
- `PARTIALLY_IMPLEMENTED`: Backend or frontend exists but lacks full integration.
- `MISSING`: Not yet present in repository.
- `BLOCKED_BY_EXTERNAL_CONFIGURATION`: Depends on external cloud key (e.g. Gemini API key).
- `NOT_IN_SCOPE`: Out of MVP hackathon scope.

---

| ID | Requirement | Current State | Evidence | Risk | Planned Change | Owner | Acceptance Test | Final Status |
|---|---|---|---|---|---|---|---|---|
| GAP-01 | Public Architecture Page (`/architecture`) must never redirect to login | `EXISTS_BUT_BROKEN` | `client/src/App.tsx:82` wrapped in `RoleGate` | P0: Breaks public navigation invariant | Move `/architecture` to public routes | Lead Architect | Open `/architecture` in clean incognito session without auth; page renders with 200 OK | `REMEDIATED` |
| GAP-02 | Unauthenticated user must have null state, not default to student Aarav | `EXISTS_BUT_BROKEN` | `client/src/context/AuthContext.tsx:49` initializes `usr_student_1` | P0: Anonymous access cannot be tested | Set `user: null`, `isAuthenticated: false` when no token stored | Security Lead | Visit `/app` without token -> redirected to `/login` | `REMEDIATED` |
| GAP-03 | Campus Social Feed Backend & Persistence | `PARTIALLY_IMPLEMENTED` | `server/src/routes/feed.routes.ts` exists, needed mounting in `server/src/app.ts` | P1: Feed API inaccessible | Mount `feedRouter` at `/api/feed` | Backend Lead | `GET /api/feed` returns seeded posts with reactions | `VERIFIED_EXISTING` |
| GAP-04 | Campus Social Feed Frontend UI & Tabs | `MISSING` | No dedicated feed page in `client/src/pages/` | P1: Students cannot browse or post in feed | Create `CampusFeedPage.tsx` with tabs, search, comments, likes | Full-Stack Lead | User can browse, filter tabs, create post, and toggle like | `REMEDIATED` |
| GAP-05 | Senior Mentorship Network Discovery & Booking | `PARTIALLY_IMPLEMENTED` | `AcademicHub.tsx` had simulated modal with `setTimeout` | P1: Requests not saved in DB | Wire to `/api/mentorship/requests` and add mentor profile card | Full-Stack Lead | Create request in UI -> appears in database with status `pending` | `REMEDIATED` |
| GAP-06 | 1-on-1 Private Mentorship Chat Messaging | `PARTIALLY_IMPLEMENTED` | `mentorship_conversations` table exists in DB, lacked UI | P1: Accepted mentees cannot message mentor | Build private message chat drawer / page | Full-Stack Lead | Mentor accepts request -> conversation unlocks -> both parties send messages | `REMEDIATED` |
| GAP-07 | Cloud Generative AI Copilot (UniVerse Assistant) | `PARTIALLY_IMPLEMENTED` | `gemini.service.ts` exists, lacked floating / modal UI in client | P1: Evaluators cannot interact with Copilot | Build `CampusCopilotDrawer.tsx` with grounded citations & confirmation card | AI Integration Lead | Copilot answers campus query with live DB sources and proposes structured action | `REMEDIATED` |
| GAP-08 | Facility Issues Reporting & Warden Triage | `MISSING` | No `facility_issues` table or warden triage UI | P1: Wardens lack facility queue | Add `facility_issues` table in schema and Warden workspace in UI | Campus Ops Lead | Student reports defect -> Warden triages status to `in_progress` / `resolved` | `REMEDIATED` |
| GAP-09 | Dedicated Transit Driver Trip Lifecycle Controls | `PARTIALLY_IMPLEMENTED` | Driver could view map, but lacked step-by-step trip execution UI | P1: Driver cannot mark pickups/dropoffs | Build trip lifecycle controls (start, pickup, complete) | Transit Ops Lead | Driver starts trip -> marks passenger boarded -> marks trip completed | `REMEDIATED` |
| GAP-10 | Exam Proctor Human Review Tribunal | `VERIFIED_EXISTING` | `ExamMonitorPage.tsx` has live timeline, video feed, and audit log | Low | Ensure non-punitive review notes save to `exam_audit_log` | Security / AI Lead | Proctor dismisses flag as benign -> audit record saved | `VERIFIED_EXISTING` |
| GAP-11 | System Admin Enclave & Role Governance | `PARTIALLY_IMPLEMENTED` | Admin could view settings, lacked role assignment and moderation UI | P1: Admin cannot grant/revoke roles | Build Admin Enclave tab in Settings with user list, role grant/revoke | Security Lead | Admin grants role -> new assignment appears in `role_assignments` | `REMEDIATED` |
| GAP-12 | Comprehensive Demo Data Generator | `PARTIALLY_IMPLEMENTED` | `seed.ts` only seeded 4 users and 0 feed posts | P1: App appears empty on fresh start | Expand `seed.ts` to full campus dataset (30 students, 10 mentors, 40 posts, etc.) | Data Lead | Run `npm run seed` -> 40+ posts, 10 mentors, active events seeded | `REMEDIATED` |
| GAP-13 | CLI Demo Seed & Safe Reset Scripts | `MISSING` | `scripts/seed-demo` and `scripts/reset-demo` did not exist | P1: Missing requirement 18 | Create executable CLI scripts with safety guards | Release Lead | Run `./scripts/seed-demo` -> successfully seeds demo database | `REMEDIATED` |
| GAP-14 | E2E and Cross-Role Test Suite Expansion | `PARTIALLY_IMPLEMENTED` | 256 tests passing, but new Feed/Mentor/Assistant flows need automated tests | P0: Regressions could slip into new endpoints | Write comprehensive integration tests for Feed, Mentorship, Copilot, Warden | QA Lead | All tests pass with zero failures | `REMEDIATED` |
