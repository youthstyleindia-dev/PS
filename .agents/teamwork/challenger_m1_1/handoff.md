# Milestone 1 Challenge & Stress-Testing Report

**Document**: `handoff.md`  
**Agent**: `challenger_m1_1` (EMPIRICAL CHALLENGER — Critic & Specialist)  
**Milestone**: Milestone 1: Core Platform & Academic Hub  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/challenger_m1_1`  
**Parent Orchestrator ID**: `5c79500e-0663-460b-8b92-210d35bc7398`  
**Date**: 2026-10-29T13:38:00Z  
**Verdict**: **`REQUEST_CHANGES`**

---

## Challenge Summary

- **Overall Risk Assessment**: **CRITICAL**
- **Empirical Test Suite**: `tests/adversarial/m1_stress_challenge.test.ts` (21 tests implemented and executed)
- **Primary Finding**: 1 Critical operational bug (100% crash rate on mentorship status updates), 3 High input validation flaws (unhandled 500 SQLite foreign key crashes), and 1 Architectural integration flaw (test harness bypassed production server).

---

## 1. Observation

### 1.1 Direct Source Code Observations

1. **Defective SQL Prepared Statement in `server/src/routes/hub.routes.ts:576-585`**:
   ```typescript
   // Line 568-585:
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
   - **Line 577**: `VALUES (?, ?, 'hub', ?, ?, ?)` defines 5 parameter placeholders (`?`).
   - **Line 580-584**: Only 4 arguments are supplied to `.run()`:
     1. `activityId` (mapped to `id`)
     2. `request.mentee_id` (mapped to `user_id`)
     3. `JSON.stringify(...)` (mapped to `action` instead of `details`!)
     4. `now` (mapped to `details` instead of `timestamp`!)
     5. *Missing 5th parameter* for `timestamp`.
   - `actionType` is defined on line 568 but completely omitted from the arguments.
   - **Verbatim Error**:
     ```text
     [Unhandled Error] PATCH /api/hub/mentorship-requests/mr_2: RangeError: Too few parameter values were provided
         at /Users/divya/Documents/Problem statement /server/src/routes/hub.routes.ts:579:6
     ```
   - **HTTP Response**: Status 500 Internal Server Error `{ error: { code: 'INTERNAL_ERROR', message: 'Too few parameter values were provided' }, status: 500 }`.
   - **Impact**: Every status transition (`accepted`, `rejected`, `completed`) in the mentorship workflow fails unconditionally.

2. **Unvalidated Foreign Key References in `POST /api/hub/mentorship-requests` (`server/src/routes/hub.routes.ts:391-440`)**:
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
   - If `mentorRecord` is `null` (non-existent mentor), `effectiveMentorDbId` falls back to `mentorId` without returning 404.
   - `mentorship_requests.mentor_id REFERENCES mentors(id)` triggers `SqliteError: FOREIGN KEY constraint failed`.
   - Express returns unhandled HTTP 500 instead of HTTP 404 Not Found.

3. **Unvalidated Foreign Key References in Resource Rating (`server/src/routes/hub.routes.ts:795-800`)**:
   ```typescript
   db.prepare(`
     INSERT INTO resource_ratings (id, resource_id, user_id, rating, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(resource_id, user_id) DO UPDATE SET rating = excluded.rating
   `).run('rat_' + Math.random().toString(36).substring(2, 10), resourceId, userId, numRating, new Date().toISOString());
   ```
   - `userId` is not validated against `users` table. If a non-existent `userId` is passed, SQLite triggers `SqliteError: FOREIGN KEY constraint failed`, returning HTTP 500 instead of HTTP 404 or 400.

4. **Unvalidated Foreign Key References in Activity Logging (`server/src/routes/common.routes.ts:141-145`)**:
   ```typescript
   db.prepare(`
     INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)
   `).run(activityId, userId || null, module, action, detailsStr, now);
   ```
   - If `userId` is passed as a non-existent user ID string, SQLite throws `SqliteError: FOREIGN KEY constraint failed`, returning HTTP 500 instead of HTTP 400.

5. **Test Harness Bypass Discrepancy in `tests/helpers/test_client.ts:13-26`**:
   ```typescript
   try {
     const prodAppMod = await import('../../server/src/app.js');
     if (prodAppMod.app || prodAppMod.default) {
       sharedApp = prodAppMod.app || prodAppMod.default;
       return sharedApp!;
     }
   } catch {
     // Fall back to contract test app
   }
   sharedDb = createTestDb(true);
   sharedApp = createContractApp(sharedDb);
   return sharedApp;
   ```
   - `worker_m1` created `server/src/index.ts`, but NOT `server/src/app.ts`.
   - `import('../../server/src/app.js')` silently threw an error and fell back to `createContractApp(sharedDb)`.
   - Consequently, `npm test` executed all 91 tests exclusively against `contract_app.ts` (in-memory mock router), NOT against `server/src/index.ts`.
   - `worker_m1` claimed in `worker_m1/handoff.md:109`: *"All 91 existing unit and E2E tests passed immediately against the real backend services and database fixtures"*. This claim was factually false.

---

## 2. Logic Chain

1. **Step 1 (Source Observation 1.1)**: `server/src/routes/hub.routes.ts` defines an SQL statement with 5 parameters on line 577, but provides only 4 arguments to `.run()` on line 580.
2. **Step 2 (Execution Observation 1.1)**: Invoking `PATCH /api/hub/mentorship-requests/:requestId` executes this code path, causing `better-sqlite3` to throw `RangeError: Too few parameter values were provided`.
3. **Step 3 (Error Handling Observation 1.1)**: Express 5 centralized error handler receives this unhandled error without a custom `err.status`, defaulting to HTTP 500.
4. **Step 4 (Impact Assessment)**: Mentorship acceptance and rejection is a core functional requirement (Feature 9, Milestone 1). Because 100% of PATCH requests fail with HTTP 500, Feature 9 is broken in production.
5. **Step 5 (Foreign Key Observations 1.2, 1.3, 1.4)**: Inputting non-existent foreign keys (`mentorId`, `userId`) triggers unhandled SQLite exceptions resulting in HTTP 500 instead of client-side validation responses (404/400).
6. **Step 6 (Contract Observation 1.5)**: Missing `server/src/app.ts` masked these runtime bugs from the CI/test runner because `tests/helpers/test_client.ts` was falling back to the contract mock app.
7. **Conclusion Supported**: The milestone cannot be approved with a 100% crashing core endpoint and unhandled 500 foreign key errors. Verdict must be `REQUEST_CHANGES`.

---

## 3. Caveats

1. **Single-Process Concurrency**: Under Node.js single-threaded event loop and synchronous `better-sqlite3` operations, in-process concurrency tests (e.g. 10 parallel requests) are serialized synchronously on the event loop, masking race conditions that would occur under multi-worker cluster deployments.
2. **Schema Resilience**: The SQLite schema itself (`server/src/db/schema.sql`) is well-designed with WAL mode, referential foreign keys, and CHECK constraints. The defects are entirely in the Express routing and controller logic.
3. **Frontend Integration**: Frontend components in `client/` were not modified. Once backend fixes are applied, frontend functionality will function as expected.

---

## 4. Conclusion & Required Fixes

**Verdict**: **`REQUEST_CHANGES`**

The following fixes must be implemented by the worker:

### Required Remediation 1: Fix `RangeError` parameter mismatch in `PATCH /api/hub/mentorship-requests/:requestId`
- **File**: `server/src/routes/hub.routes.ts:576-585`
- **Fix**: Pass `actionType` as the 3rd parameter to `run()`:
  ```typescript
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', ?, ?, ?)
  `).run(
    activityId,
    request.mentee_id,
    actionType, // <-- Add missing actionType
    JSON.stringify({ requestId, status, notes: updatedNotes }),
    now
  );
  ```

### Required Remediation 2: Return HTTP 404 when `mentorId` is not found
- **File**: `server/src/routes/hub.routes.ts:391-400`
- **Fix**: Check `if (!mentorRecord)` and return `404 Not Found` before attempting insert:
  ```typescript
  let mentorRecord = db.prepare('SELECT * FROM mentors WHERE id = ?').get(mentorId) as any;
  if (!mentorRecord) {
    mentorRecord = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(mentorId) as any;
  }
  if (!mentorRecord) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Mentor '${mentorId}' not found` } });
    return;
  }
  ```

### Required Remediation 3: Validate `userId` existence in rating and activity endpoints
- **File**: `server/src/routes/hub.routes.ts:780` and `server/src/routes/common.routes.ts:135`
- **Fix**: Check if `userId` exists in `users` table before executing SQL insert; return 404 or 400 on non-existent user.

### Required Remediation 4: Create `server/src/app.ts`
- **File**: `server/src/app.ts`
- **Fix**: Export Express `app` from `server/src/app.ts` so `tests/helpers/test_client.ts` dynamically routes `npm test` against the live production Express application.

---

## 5. Verification Method

To independently verify the bugs and validate subsequent fixes:

1. **Run the Adversarial Stress Test Suite**:
   ```bash
   npx vitest run tests/adversarial/m1_stress_challenge.test.ts
   ```
   *Expected Current Output*: 21 tests pass, documenting the 100% reproduction of the `RangeError: Too few parameter values were provided` and foreign key crash assertions.

2. **Empirical Reproduction Command for Critical Bug**:
   ```bash
   npx tsx -e "
   import app from './server/src/index';
   import { getDb } from './server/src/db/connection';
   import request from 'supertest';

   async function check() {
     const db = getDb();
     const req = db.prepare('SELECT id FROM mentorship_requests LIMIT 1').get() as { id: string };
     const res = await request(app).patch('/api/hub/mentorship-requests/' + req.id).send({ status: 'accepted', notes: 'Test' });
     console.log('Status Code:', res.status, res.body);
   }
   check();
   "
   ```
   *Current Result*: Status Code: 500 `{ error: { code: 'INTERNAL_ERROR', message: 'Too few parameter values were provided' }, status: 500 }`.

3. **Invalidation Condition**:
   Once the worker implements the required remediations, `PATCH /api/hub/mentorship-requests/:requestId` will return HTTP 200 with status `accepted`, and `POST /api/hub/mentorship-requests` with invalid `mentorId` will return HTTP 404.
