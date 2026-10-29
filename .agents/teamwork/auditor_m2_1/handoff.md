# Forensic Audit Report: Milestone 2 (Smart Campus Ride-Pooling)

**Auditor:** `auditor_m2_1` (Role: Forensic Auditor)  
**Target:** Milestone 2 (Features 12–18: Smart Campus Ride-Pooling)  
**Work Product:** 
- `server/src/services/graph.service.ts`
- `server/src/services/ride_matching.service.ts`
- `server/src/routes/rides.routes.ts`
- `client/src/services/rides.service.ts`
- `client/src/components/rides/CampusMapSvg.tsx`
- `client/src/pages/RidePooling.tsx`
- `server/data/universe.db`
- `tests/unit/graph_matching.test.ts`

**Profile:** General Project (Mode: `development`)  
**Verdict:** **CLEAN**

---

## Forensic Audit Summary

| Phase # | Forensic Verification Check | Result | Details |
|---|---|:---:|---|
| Phase 1 | Hardcoded Test Results Detection | **PASS** | 0 test-specific short-circuits, static answer mappings, or bypassed algorithm checks found in codebase. |
| Phase 2 | Facade / Dummy Implementation Detection | **PASS** | Dijkstra, A*, DARP heuristic, carbon emissions ($avoidedKm \times efKg$), and fare splits are genuine algorithmic implementations. |
| Phase 3 | Pre-populated Artifact Detection | **PASS** | Clean workspace; no stale logs, pre-baked results, or fabricated attestation files found (`find` returned 0 files). |
| Phase 4 | Task Shortcuts & Mock Delegation | **PASS** | SQLite database `server/data/universe.db` actively enforces foreign keys (`PRAGMA foreign_keys = ON`), parameterized queries (`?`), and transactional seat decrements. |
| Phase 5 | Fabricated Verification Outputs | **PASS** | Independent full build (`tsc` + `vite`) and test run (`vitest`) completed cleanly on machine: 136/136 tests passing (100%). |
| Provenance | Transparency & Ethical Guardrails | **PASS** | `[ESTIMATED METRIC]` tags displayed on all eco/fare metrics; 0 autonomous student penalties or disciplinary actions exist in modules. |

---

## 1. Observation

### 1.1 Source Code Inspection
1. **Graph & Pathfinding Engine (`server/src/services/graph.service.ts`)**:
   - Lines 38–56: Graph initialized dynamically from `campus_graph.json` into `this.nodes` (Map), `this.edges` (Array of 30 directed edges), and `this.adj` (Adjacency list Map).
   - Lines 65–106: Dynamic time-of-day congestion function `getCongestionMultiplier(timeStr, edge)` evaluates rush hour intervals:
     * Morning rush ($[8.25, 9.5]$ hours): $1.65\times$
     * Midday shift ($[12.0, 13.5]$ hours): $1.35\times$
     * Evening dispersal ($[17.0, 18.5]$ hours): $1.70\times$
     * Off-peak: $1.00\times$
     * Lane mitigations: `PEDESTRIAN_ACCESS` = $1.00\times$, `EV_SHUTTLE_LANE` = $\min(1.10, c_{\text{global}})$.
   - Lines 111–196: Genuine Dijkstra pathfinding algorithm maintaining `dist` map, `prev` map, `visited` set, relaxation loop, and backtracking reconstruction with distance and time rounding.
   - Lines 201–301: Genuine A* pathfinding algorithm utilizing 2D Euclidean coordinate distance heuristic ($h(u) = \sqrt{(x_u - x_{target})^2 + (y_u - y_{target})^2} \times 0.0014\text{ km}$) with `gScore`, `fScore`, `openSet`, and `closedSet`.
   - Node normalization: `INNOVATION_PARK` alias normalized to `INNOVATION`.

2. **DARP Ride Matching Engine (`server/src/services/ride_matching.service.ts`)**:
   - Lines 37–51: Vehicle emissions factors defined as:
     * `PETROL_CAR`: $0.155\text{ kg CO}_2\text{e/km}$
     * `EV_CAR`: $0.048\text{ kg CO}_2\text{e/km}$
     * `CAMPUS_SHUTTLE`: $0.032\text{ kg CO}_2\text{e/km}$
     * `E_GOLF_CART`: $0.025\text{ kg CO}_2\text{e/km}$
   - Lines 72–208: DARP insertion matching algorithm evaluates:
     * Seat capacity check: `if (seatsAvailable < seatsNeeded) return { matched: false, reason: 'INSUFFICIENT_SEAT_CAPACITY' }`
     * Driver direct path: $O_d \to D_d$
     * Passenger direct path: $O_p \to D_p$
     * Pooled trajectory: $O_d \to O_p \to D_p \to D_d$
     * Detour calculation: $detourKm = \max(0, D_{pooled} - D_{direct\_driver})$
     * Detour ratio: $detourRatio = detourKm / D_{direct\_driver}$
     * Detour boundary check: `if (detourRatio > maxAllowedDetour) return { matched: false, reason: 'DETOUR_LIMIT_EXCEEDED' }`
     * Avoided distance: $\max(0, D_{direct\_driver} + D_{direct\_passenger} - D_{pooled})$
     * Avoided carbon: $avoidedKm \times efKg$
     * Solo fare: $15.0 + 12.0 \times D_{direct\_passenger}$
     * Pooled fare: $SoloFare \times 0.60$ (40% discount)
     * Driver subsidy/earnings: $PooledFare \times 0.85$
     * Provenance tag: `provenance: '[ESTIMATED METRIC]'`.
   - Lines 259–382: `confirmAndBookRide()` executes an atomic SQLite transaction decrements seats, updates request status to `'completed'`, writes to `ride_matches` and `ride_bookings`, and logs to `activity_log` with module `'rides'` and details `Booked pooled ride with ${match.carbonSavedKg}kg CO2e avoided [ESTIMATED METRIC]`.

3. **Database Relational Architecture (`server/data/universe.db` & `schema.sql`)**:
   - Foreign key constraints active (`PRAGMA foreign_keys = 1`).
   - Tables: `campus_nodes` (11 rows), `campus_edges` (22 rows), `ride_offers` (30 rows), `ride_requests` (29 rows), `ride_matches` (14 rows), `ride_bookings` (13 rows), `activity_log` (124 rows).
   - Foreign key violation test: Inserting an invalid `driver_id` into `ride_offers` failed with `FOREIGN KEY constraint failed`.

4. **Frontend Architecture & UX Integrity**:
   - `client/src/components/rides/CampusMapSvg.tsx`: Renders 10 canonical campus nodes and 30 edges. Clickable node selection for origin/destination, time scrubber (08:30, 12:30, 17:45, 21:00) with dynamic congestion coloring (Green $\le 1.15$, Amber $\le 1.45$, Red $> 1.45$), and route overlays (Driver direct, pooled trajectory, detour segments).
   - `client/src/pages/RidePooling.tsx`: 3 functional workflows (Passenger Request & Match, Driver Offer Publish, Browse All Active Pools). Displays `<ProvenanceBadge type="ESTIMATED_METRIC" label="ESTIMATED" size="sm" />` for avoided emissions and fare discounts.
   - Zero autonomous student penalty or disciplinary logic exists across the entire project.

---

## 2. Logic Chain

1. **Premise 1: Algorithmic Authenticity (Phase 1 & Phase 2)**:
   - If Dijkstra and A* pathfinding are implemented with real relaxation loops, Euclidean heuristics, and dynamic congestion multipliers rather than returning static path fixtures, the pathfinding engine is authentic.
   - We verified that querying paths between arbitrary nodes (`GATE_NORTH` $\to$ `GATE_SOUTH`) calculates $3.0\text{ km}$ across both Dijkstra and A*, that identical nodes return $0\text{ km}$, and that invalid nodes return `null`.
   - We verified that the DARP heuristic calculates $(D_{pooled} - D_{direct})/D_{direct}$, rejects paths exceeding $35\%$ detour tolerance with `DETOUR_LIMIT_EXCEEDED`, and enforces seat capacity.
   - Conclusion: No facade or hardcoded test shortcuts exist.

2. **Premise 2: State Persistence & Data Integrity (Phase 3 & Phase 4)**:
   - If the application writes state to SQLite via parameterized queries, respects foreign key constraints, wraps seat decrements in atomic transactions, and logs to `activity_log`, the database integration is authentic.
   - We tested that invalid foreign keys fail immediately (`FOREIGN KEY constraint failed`), that overbooking requests fail with HTTP 400, and that booking decrements available seats atomically.
   - Conclusion: SQLite persistence is genuine and secure.

3. **Premise 3: Empirical Verification & Test Suite Passing (Phase 5)**:
   - Both server and client compile with 0 TypeScript/build errors.
   - Independent execution of `npm test` runs 136 tests across 9 test suites with 100% pass rate.
   - Conclusion: The test suite verifies real behavior and passes without fabrication.

4. **Premise 4: Transparency & Ethical Guardrails**:
   - `ORIGINAL_REQUEST.md` mandates transparent provenance tagging (`[ESTIMATED METRIC]`) and zero autonomous student disciplinary penalties.
   - Both requirements are 100% satisfied across frontend and backend.

---

## 3. Caveats

- **Off-Peak Default Fallback**: If an unparseable time string is passed to `getCongestionMultiplier()`, the system falls back to $1.00\times$ (off-peak normal), which is a defensive design decision.
- **Node Aliasing**: In SQLite seed data, `INNOVATION_PARK` exists as a legacy alias; `graphService.normalizeNodeId()` normalizes this to canonical `INNOVATION` seamlessly.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 2 (Smart Campus Ride-Pooling) fully satisfies all requirements of `ORIGINAL_REQUEST.md` and `PROJECT.md`:
1. Canonical 10-node, 30-edge campus graph model.
2. Dynamic time-of-day edge congestion weighting ($1.65\times$, $1.35\times$, $1.70\times$, $1.00\times$).
3. Authentic Dijkstra and A* shortest path calculation.
4. Genuine DARP insertion heuristic enforcing detour bounds $\le 35\%$ and seat capacity.
5. Accurate avoided carbon ($kg\text{ CO}_2\text{e}$) and fare economics calculation.
6. Interactive SVG map visualizer with dynamic edge coloring and time scrubbing.
7. Atomic SQLite booking transactions and activity logging.
8. Complete `[ESTIMATED METRIC]` provenance tagging and ethical guardrail compliance.
9. 100% pass rate on full automated test suite (136/136 tests).

---

## 5. Verification Method

### 5.1 Independent Build Verification Output
```bash
$ npm run build

> universe-campus-os@1.0.0 build
> npm run build:server && npm run build:client

> universe-campus-os@1.0.0 build:server
> tsc -p server/tsconfig.json

> universe-campus-os@1.0.0 build:client
> npm --prefix client run build

> universe-client@1.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
✓ 2631 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   1.27 kB │ gzip:   0.71 kB
dist/assets/index-rPUzMquy.css   54.24 kB │ gzip:   9.50 kB
dist/assets/index-BSnllsVG.js   848.45 kB │ gzip: 237.67 kB
✓ built in 446ms
```

### 5.2 Independent Test Suite Verification Output
```bash
$ npm test

> universe-campus-os@1.0.0 test
> vitest run

 RUN  v3.2.7 /Users/divya/Documents/Problem statement 

 ✓ tests/unit/graph_matching.test.ts (13 tests) 64ms
 ✓ tests/unit/energy_carbon.test.ts (9 tests) 3ms
 ✓ tests/e2e/tier3_pairwise.test.ts (8 tests) 91ms
 ✓ tests/e2e/tier4_scenarios.test.ts (4 tests) 104ms
 ✓ tests/e2e/tier2_boundaries.test.ts (18 tests) 115ms
 ✓ tests/e2e/tier1_features.test.ts (33 tests) 198ms
 ✓ tests/integration/full_ecosystem.test.ts (20 tests) 105ms
 ✓ tests/adversarial/m1_stress_challenge.test.ts (21 tests) 130ms
 ✓ tests/unit/privacy_dp.test.ts (10 tests) 3ms

 Test Files  9 passed (9)
      Tests  136 passed (136)
   Start at  21:25:51
   Duration  926ms (transform 648ms, setup 0ms, collect 2.31s, tests 813ms, environment 1ms, prepare 1.01s)
```

### 5.3 Live E2E Empirical Verification Script
```bash
$ npx tsx -e "
import request from 'supertest';
import app from './server/src/index';

async function testLive() {
  const g = await request(app).get('/api/rides/graph?time=08:30');
  const sp = await request(app).get('/api/rides/shortest-path?source=GATE_NORTH&target=GATE_SOUTH&time=08:30');
  const off = await request(app).post('/api/rides/offers').send({
    driverId: 'usr_driver_1', originNodeId: 'GATE_NORTH', destinationNodeId: 'GATE_SOUTH',
    departureTime: '08:30', totalSeats: 3, vehicleType: 'EV_CAR'
  });
  const req = await request(app).post('/api/rides/requests').send({
    passengerId: 'usr_student_1', originNodeId: 'DORM_NORTH', destinationNodeId: 'STUDENT_CTR',
    desiredTime: '08:35', seatsNeeded: 1, maxDetourRatio: 0.35
  });
  const m = await request(app).post('/api/rides/match').send({ offerId: off.body.offerId, requestId: req.body.requestId });
  const b = await request(app).post('/api/rides/book').send({ offerId: off.body.offerId, requestId: req.body.requestId, seatsBooked: 1 });
  console.log('Booked ID:', b.body.bookingId, 'Seats remaining:', b.body.seatsRemaining, 'Provenance:', m.body.provenance);
}
testLive();
"
# Output: Booked ID: bk-1793289497257-742248 Seats remaining: 2 Provenance: [ESTIMATED METRIC]
```
