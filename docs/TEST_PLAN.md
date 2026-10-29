# UniVerse: Comprehensive Test Plan & Verification Matrix

> **Testing Framework**: Vitest v3.2.7 + Supertest v7.3.1  
> **Database Engine**: In-memory and WAL-mode SQLite with Foreign Keys enabled  
> **Execution Command**: `npm test`  
> **Status**: **190 / 190 tests passing (100%) across 12 test suites in ~1.70s**  

---

## 1. Quality Assurance Philosophy

UniVerse adheres to an **anti-mocking, objective-verification** testing methodology. Rather than creating decorative mocks or stubbed responses, the test suite executes real queries against an active relational SQLite database (`better-sqlite3` with foreign keys enabled) and verifies mathematical invariants directly against the algorithmic oracles.

---

## 2. Test Execution Command

```bash
# Execute entire 190-test automated suite in ~1.7s
npm test
```

---

## 3. Test Suites Breakdown (190 Tests across 12 Suites)

| Suite File | Scope | Test Count | Pass Rate | Key Invariants Tested |
| :--- | :--- | :---: | :---: | :--- |
| **`tests/unit/auth.test.ts`** | Security & Auth Engine | **12** | **100%** | Salted Bcrypt 10-round password hashing, HMAC-SHA256 JWT claim verification, session registry revocation, audit logging, RBAC middleware. |
| **`tests/unit/graph_matching.test.ts`** | Module B Algorithms | **13** | **100%** | Dijkstra path optimality, congestion multipliers $c(t)$, Dial-a-Ride insertion, detour ratio ceiling $\le 35\%$, seat capacity enforcement. |
| **`tests/unit/energy_carbon.test.ts`** | Module C Algorithms | **9** | **100%** | Non-linear power model $P(U)$, single PUE facility scaling, diurnal regional grid carbon factor, baseline vs. optimized delta arithmetic. |
| **`tests/unit/privacy_dp.test.ts`** | Module D Algorithms | **10** | **100%** | Local URL hostname sanitization (stripping tokens/passwords/paths), Laplace noise injection symmetry, $k$-anonymity suppression ($k \ge 3$), Deep Work Index formulation. |
| **`tests/e2e/tier1_features.test.ts`** | Core Feature Workflows | **33** | **100%** | Student profile updates, milestone progress recalculations, mentor requests, ride offers, ride requests, focus session lifecycle, exam observation review. |
| **`tests/e2e/tier2_boundaries.test.ts`** | Boundaries & Limits | **18** | **100%** | Zero seats, negative capacity, out-of-bounds ratings ($[1, 5]$), disconnected graph nodes, extreme workload spikes, cohort suppression thresholds. |
| **`tests/e2e/tier3_pairwise.test.ts`** | Concurrency & Cross-Module | **8** | **100%** | Concurrent seat bookings, race conditions on duplicate mentorship requests, simultaneous milestone toggling, cross-module activity streaming. |
| **`tests/e2e/tier4_scenarios.test.ts`** | Multi-Step Journeys | **4** | **100%** | Complete student semester journey: profile prep $\to$ mentor mock interview $\to$ ride pool commute $\to$ focus study session $\to$ proctor-reviewed examination. |
| **`tests/adversarial/m1_stress_challenge.test.ts`** | Adversarial Security M1 | **21** | **100%** | SQL injection neutralization in search queries, oversized payloads, self-mentorship prevention, SQLite foreign key cascade deletions, CHECK constraints. |
| **`tests/adversarial/m2_stress_challenge.test.ts`** | Adversarial Security M2 | **28** | **100%** | Route manipulation resistance, overbooking race prevention, negative seat count rejection, wellbeing state machine tampering. |
| **`tests/adversarial/m2_ride_ui_stress.test.ts`** | Ride UI & Visualizer Stress | **14** | **100%** | Offline fallback structures, SVG map node coordinate integrity, detour envelope visual rendering, dynamic vehicle puck tracking. |
| **`tests/integration/full_ecosystem.test.ts`** | Express 5 Live HTTP | **20** | **100%** | Live HTTP requests over `supertest` verifying all endpoints across `/api/health`, `/api/auth`, `/api/hub`, `/api/rides`, `/api/sustainability`, `/api/wellbeing`, `/api/exams`. |
| **TOTAL** | **Full System** | **190** | **100%** | **All 190 tests passing cleanly in ~1.70s** |

---

## 4. Key Verification Invariants

### 4.1 Algorithmic Invariants
1. **Dijkstra Optimality**: Verified that no path returned by `dijkstra.algorithm.ts` has a distance greater than any alternative simple path on the campus graph.
2. **Detour Constraint**: Verified that candidate rides with $\text{Detour Ratio} > 0.35$ are rejected with reason code `EXCEEDS_DETOUR_TOLERANCE`.
3. **Conservation of Seats**: Verified that booking a seat decreases `available_seats` by exactly the requested quantity and rejects requests when `available_seats < seats_needed`.
4. **Differential Privacy Guarantee**: Evaluated Laplace noise draws showing mean zero error and confirmed that any cohort query with $n < k$ returns `isSuppressed: true`.

### 4.2 Security & Data Governance Invariants
1. **No URL Telemetry Leakage**: Tested with URLs containing sensitive query parameters (`?token=secret123#solution`); verified that the database only stores the clean hostname (`leetcode.com`).
2. **SQL Injection Resistance**: Tested malicious search inputs (`' OR '1'='1' --`) across course codes and mentor domains; confirmed queries are sanitized through parameterized SQLite statements.
3. **Proctor Audit Traceability**: Verified that resolving an exam event requires a non-empty proctor note and creates an immutable entry in `exam_audit_log`.
4. **Password Security**: Tested bcrypt 10-round salted hashing verifying that plaintext passwords cannot match altered hashes and rejecting passwords shorter than 8 characters.
