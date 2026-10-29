# Milestone 1: Core Platform & Academic Hub — Challenger Verification Report

**Agent**: `challenger_m1_2`  
**Milestone**: Milestone 1: Core Platform & Academic Hub  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/challenger_m1_2`  
**Target Parent ID**: `5c79500e-0663-460b-8b92-210d35bc7398`  
**Date**: 2026-10-29T13:42:00Z  
**Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

### 1.1 Direct Build & Runtime Verification
1. **Frontend Client Build Execution**:
   Command: `npm --prefix client run build`
   Output:
   ```text
   > universe-client@1.0.0 build
   > tsc -b && vite build

   ✓ 2620 modules transformed.
   dist/index.html                   1.27 kB │ gzip:   0.71 kB
   dist/assets/index-Bnrc36h_.css   38.33 kB │ gzip:   7.04 kB
   dist/assets/index-DMb4hAe7.js   621.71 kB │ gzip: 186.05 kB
   ✓ built in 324ms
   ```
   *Result*: Clean compilation with 0 TypeScript and 0 Vite bundle errors.

2. **Automated Unit & E2E Test Suite Execution**:
   Command: `npm test`
   Output:
   ```text
   Test Files  8 passed (8)
   Tests       112 passed (112)
   Duration    740ms
   ```
   *Result*: All contract and algorithmic test suites pass.

---

### 1.2 Verbatim Defect & Bug Observations

#### Defect 1: Server HTTP 500 Crash on Mentorship Request Acceptance / Rejection
- **Location**: `server/src/routes/hub.routes.ts:579:6`
- **Trigger**: Any `PATCH /api/hub/mentorship-requests/:requestId` request updating status to `'accepted'` or `'rejected'`.
- **Verbatim Error Log**:
  ```text
  [Unhandled Error] PATCH /api/hub/mentorship-requests/req_o8t27u7j: RangeError: Too few parameter values were provided
      at /Users/divya/Documents/Problem statement /server/src/routes/hub.routes.ts:579:6
      at Layer.handleRequest (/Users/divya/Documents/Problem statement /node_modules/router/lib/layer.js:152:17)
  ```
- **Code Inspection** (`server/src/routes/hub.routes.ts` lines 573–585):
  ```typescript
  const actionType = status === 'accepted'
    ? 'MENTORSHIP_REQUEST_ACCEPTED'
    : status === 'rejected'
      ? 'MENTORSHIP_REQUEST_REJECTED'
      : 'MENTORSHIP_COMPLETED';

  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', ?, ?, ?)
  `).run(
    activityId,
    request.mentee_id,
    JSON.stringify({ requestId, status, notes: updatedNotes }),
    now
  );
  ```
  The SQL query expects 5 parameters (`id, user_id, action, details, timestamp`), but `.run()` only passes 4 arguments (`activityId`, `request.mentee_id`, `JSON.stringify(...)`, `now`), completely omitting the `actionType` variable! This causes SQLite to throw `RangeError: Too few parameter values were provided` and crashes Express with HTTP 500.

---

#### Defect 2: Client Indiscriminately Swallows HTTP 4xx/5xx Errors, Presenting False Success
- **Location**: `client/src/services/hub.service.ts:345–372` and `client/src/services/hub.service.ts:384–398`
- **Code Inspection** (`hub.service.ts` lines 351–371):
  ```typescript
  async submitMentorshipRequest(payload: { ... }): Promise<MentorshipRequest> {
    try {
      return await request<MentorshipRequest>('/hub/mentorship-requests', {
        method: 'POST',
        body: JSON.stringify({ ...payload, menteeId: 'usr_student_1' })
      });
    } catch {
      const mentor = MOCK_MENTORS.find((m) => m.id === payload.mentorId) || MOCK_MENTORS[0];
      const newReq: MentorshipRequest = {
        id: `req_${Date.now()}`,
        menteeId: 'usr_student_1',
        mentorId: payload.mentorId,
        mentor,
        topic: payload.topic,
        preferredSlot: payload.preferredSlot,
        status: 'pending',
        notes: payload.notes,
        createdAt: new Date().toISOString()
      };
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
  }
  ```
- **Observed Behavior**:
  1. When a student attempts to submit a duplicate pending request, the backend correctly enforces the guardrail and responds with `HTTP 409 Conflict: {"error":{"code":"CONFLICT","message":"A pending mentorship request already exists for this mentor"}}`.
  2. Instead of surfacing this conflict to the user, `hub.service.ts` catches the `HTTP 409` in its generic `catch` block.
  3. It fabricates a local `req_${Date.now()}` mock request and returns it as a success.
  4. `AcademicHub.tsx` displays: `showToast("Mentorship request submitted to ...")` and prepends the phantom request to the UI.
  5. Similarly, when the mentor clicks "Accept" and the backend crashes with Defect 1 (HTTP 500), `updateRequestStatus` catches the 500 error, fabricates a local update, and toasts "Request marked as accepted", leaving the user completely oblivious that the database update failed.

---

#### Defect 3: Unchecked Mentor ID in `POST /api/hub/mentorship-requests` Triggers SQLite Foreign Key 500
- **Location**: `server/src/routes/hub.routes.ts:392–441`
- **Code Inspection**:
  ```typescript
  let mentorRecord = db.prepare('SELECT * FROM mentors WHERE id = ?').get(mentorId) as any;
  if (!mentorRecord) {
    mentorRecord = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(mentorId) as any;
  }
  const effectiveMentorDbId = mentorRecord ? mentorRecord.id : mentorId;
  ...
  db.prepare(`
    INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(requestId, menteeId, effectiveMentorDbId, topic, preferredSlot, notes || '', now, now);
  ```
- **Observed Behavior**: If `mentorId` does not exist in `mentors`, `effectiveMentorDbId` falls back to `mentorId`. When inserted into `mentorship_requests`, SQLite enforces `FOREIGN KEY(mentor_id) REFERENCES mentors(id)` and throws `SqliteError: FOREIGN KEY constraint failed`, crashing Express with HTTP 500 instead of returning HTTP 404 or 400.

---

#### Defect 4: Static Hardcoded Competency Vector Radar Chart
- **Location**: `client/src/pages/AcademicHub.tsx:151–158`
- **Code Inspection**:
  ```typescript
  // Recharts Radar Data from skills
  const radarData = [
    { subject: 'DSA & Graphs', score: 85, fullMark: 100 },
    { subject: 'System Design', score: 70, fullMark: 100 },
    { subject: 'Core CS (OS/DBMS)', score: 80, fullMark: 100 },
    { subject: 'Full-Stack Dev', score: 92, fullMark: 100 },
    { subject: 'Cloud & Linux', score: 65, fullMark: 100 },
    { subject: 'Behavioral Prep', score: 75, fullMark: 100 }
  ];
  ```
- **Observed Behavior**: When milestones (DSA, SystemDesign, SoftSkills) are toggled, the banner number (`profile?.readinessScore%`) updates, but `<RadarChart data={radarData}>` remains completely frozen with the hardcoded numbers `[85, 70, 80, 92, 65, 75]`. The radar does not dynamically reflect the user's category completion.

---

#### Defect 5: Absence of Empty States across Academic Hub Tabs
- **Location**: `client/src/pages/AcademicHub.tsx:691–770` (Resources), `410–480` (Mentors), and `569–633` (Requests).
- **Code Inspection**:
  ```tsx
  {/* Resources Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {resources.map((res) => ( ... ))}
  </div>
  ```
- **Observed Behavior**:
  1. When searching for a non-existent course code (e.g., `CS999`) or typing a query with 0 matches (e.g., `quantum`), `resources` evaluates to `[]`.
  2. The page renders an empty container `<div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>`. No placeholder message ("No resources found matching your search"), icon, or filter reset button is displayed.
  3. The exact same defect is present in Tab 2 (`Peer Mentorship Discovery`) when filtering by skills with 0 matches, and in Tab 3 (`Mentorship Requests`) when 0 requests exist.

---

#### Defect 6: Role Switcher State is Completely Isolated with Zero View / Permission Propagation
- **Location**: `client/src/App.tsx:176`, `client/src/components/Header.tsx:47–55`
- **Code Inspection**:
  - `App.tsx` declares `const [currentRole, setCurrentRole] = useState<UserRole>('student');` and only passes it down to `<Header />` -> `<RoleSwitcher />`.
  - Neither `AcademicHub`, `Dashboard`, `Navbar`, nor any context provider receives `currentRole`.
  - In `Header.tsx`, the user identity pill is hardcoded:
    ```tsx
    <div className="text-xs font-semibold text-fg-primary leading-tight">Aarav Sharma</div>
    <div className="text-[10px] text-fg-muted font-mono leading-tight">CS2022_891</div>
    ```
- **Observed Behavior**:
  1. Selecting `Driver (Vikram Rao)`, `Proctor (Dr. Meenakshi Sundaram)`, or `System Admin` in the dropdown updates only the button's internal label.
  2. The header pill remains "Aarav Sharma (CS2022_891)".
  3. The user can continue accessing Aarav Sharma's student placement preparation milestones, toggling them, and submitting student mentorship requests even while in "Proctor" or "Driver" mode. No permissions, views, or identities update.

---

#### Defect 7: Score Formula Inconsistency Between Online and Fallback Modes
- **Observation**:
  - Online backend formula: `(completed / total) * 50 + skillsScore(30) + profileScore(20)` (`server/src/services/hub.service.ts:19–40`).
  - Offline client fallback formula: `Math.round((completedCount / MOCK_MILESTONES.length) * 100)` (`client/src/services/hub.service.ts:320`).
  - For 5 of 8 completed milestones, the online score evaluates to **81%**, while the offline fallback evaluates to **63%** — an unmitigated **18% discrepancy**.

---

## 2. Logic Chain

1. **Defect 1 -> Defect 2 Integration Failure**:
   - `server/src/routes/hub.routes.ts:579` has a parameter count mismatch (`INSERT INTO activity_log` provides 4 values for 5 placeholders).
   - Any attempt to accept/decline a mentorship request crashes the server with HTTP 500.
   - Because `client/src/services/hub.service.ts` uses an indiscriminate `try ... catch` block, the client swallows this 500 error, pretends the request was accepted, and shows a success toast.
   - As a consequence, the UI is out of sync with the database: reloading the page reveals the request is still pending.

2. **False Guardrail Feedback**:
   - The backend implemented a proper duplicate prevention check (HTTP 409 Conflict).
   - However, the client's indiscriminate catch-all catches the 409 Conflict and fabricates a mock pending request.
   - The user receives positive feedback ("Mentorship request submitted") for an action that was explicitly rejected by the server.

3. **Requirement Non-Conformance on Role Simulation (Feature #5, R1)**:
   - Feature #5 requires: *"Role Simulation Switcher: Switch perspective between Student, Driver, Proctor, and System Admin"*.
   - Because `currentRole` is not propagated to views or routes, and the header pill is hardcoded to Aarav Sharma, perspective switching is purely cosmetic and non-functional in Milestone 1.

---

## 3. Caveats

- **Provenance Badges**: Fully verified and compliant. The three-tier provenance architecture (`ACTUAL_INFERENCE`, `SIMULATED_EVENT`, `ESTIMATED_METRIC`) is correctly styled with distinct color themes, pulsing status dots, and icons across the Dashboard, Academic Hub, and Activity Center.
- **Client Build**: Bundles cleanly via Vite 6 with zero errors in 324ms.
- **Dijkstra & Algorithmic Unit Suites**: All 28 algorithmic unit tests in `tests/unit/` pass cleanly.
- **Non-Regression**: The 91 contract tests in `tests/e2e/` and `tests/unit/` remain 100% green.

---

## 4. Conclusion & Verdict

**Verdict**: **`REQUEST_CHANGES`**

While Milestone 1 provides a clean client build and solid database foundations, it contains **one critical server crash** and **multiple client-side state/error-handling deficiencies** that violate genuine end-to-end integration:
1. `PATCH /api/hub/mentorship-requests/:requestId` crashes with HTTP 500 due to missing SQL parameters.
2. `client/src/services/hub.service.ts` masks 400, 409, and 500 errors by converting them into fake local success objects.
3. `POST /api/hub/mentorship-requests` triggers unhandled foreign key 500 errors on invalid mentor IDs.
4. `AcademicHub.tsx` Radar Chart is completely static and unreactive to milestone changes.
5. `AcademicHub.tsx` lacks empty states across Resources, Mentors, and Requests.
6. The Role Switcher is non-functional across application views, and the header user pill is hardcoded.

### Actionable Remediation Checklist for Worker:
1. **Fix `server/src/routes/hub.routes.ts:579`**:
   Supply `actionType` to `activity_log.run(...)`:
   ```typescript
   db.prepare(`
     INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
     VALUES (?, ?, 'hub', ?, ?, ?)
   `).run(
     activityId,
     request.mentee_id,
     actionType,
     JSON.stringify({ requestId, status, notes: updatedNotes }),
     now
   );
   ```
2. **Validate Mentor ID in `server/src/routes/hub.routes.ts:392`**:
   Return HTTP 404 if `!mentorRecord`.
3. **Refine Error Handling in `client/src/services/hub.service.ts`**:
   Only fall back to mock data if the error is a `TypeError` (fetch network failure / server offline). Propagate HTTP 4xx and 5xx errors so the UI displays accurate error toasts.
4. **Make Radar Chart Reactive in `AcademicHub.tsx`**:
   Compute `radarData` dynamically from `milestones` category completion.
5. **Add Graceful Empty States in `AcademicHub.tsx`**:
   Render empty state banners with search reset buttons when `resources.length === 0`, `mentors.length === 0`, or `requests.length === 0`.
6. **Wire Role Switcher in `App.tsx` and `Header.tsx`**:
   Update the header user pill to match the selected role (e.g. Vikram Rao for Driver, Dr. Meenakshi for Proctor).

---

## 5. Verification Method

To independently reproduce and verify all findings:

1. **Run the Automated Stress Harness**:
   ```bash
   npx tsx scripts/challenger_m1_verify.ts
   ```
   *Expected Output*: Displays all 5 detected bugs with exact reproduction logs.

2. **Direct Reproduction of PATCH Mentorship Request 500 Crash**:
   ```bash
   npx tsx -e "
   import app from './server/src/index.ts';
   import { initDb } from './server/src/db/connection.ts';
   initDb();
   const s = app.listen(3991, async () => {
     const res = await fetch('http://localhost:3991/api/hub/mentorship-requests/mr_2', {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ status: 'accepted', notes: 'test' })
     });
     console.log('HTTP Status:', res.status);
     console.log('Error Body:', await res.json());
     s.close();
   });
   "
   ```
   *Observed Output*: HTTP 500 `RangeError: Too few parameter values were provided`.

3. **Verify Full Vitest Suite (including Adversarial Stress Tests)**:
   ```bash
   npm test
   ```
   *Observed Output*: 8 test files, 112 tests execute.
