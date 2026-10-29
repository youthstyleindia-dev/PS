# Milestone 2 Independent Review & Adversarial Challenge Report

**Reviewer:** `reviewer_m2_1` (Roles: Reviewer, Algorithmic Critic)  
**Milestone:** M2 — Smart Campus Ride-Pooling (Features 12–18)  
**Date:** 2026-10-29  
**Verdict:** **APPROVE**  
**Build Status:** PASS (0 errors, TypeScript & Vite)  
**Test Suite:** 164/164 PASS (100% across all 10 test suites)  

---

## 1. Observation

### 1.1 Direct File Inspections & AST Verification
We independently inspected the full implementation artifacts for Milestone 2:
1. `server/src/types/rides.types.ts`:
   - Defines strict interfaces `CampusNode`, `CampusEdge`, `PathResult`, `RideOfferRecord`, `RideRequestRecord`, `MatchResult`, `BookingResult`, `GraphTopologyResponse`.
   - Mandatory provenance typing: `provenance: '[ESTIMATED METRIC]'` on lines 116 and 128.
2. `server/src/services/graph.service.ts`:
   - **Canonical Topology (Feature 12)**: 10 canonical nodes (`GATE_NORTH`, `GATE_SOUTH`, `ACAD_QUAD`, `LAB_CS_AI`, `LIB_CENTRAL`, `DORM_NORTH`, `DORM_SOUTH`, `STUDENT_CTR`, `INNOVATION`, `SPORTS_CMPLX`) loaded from `server/src/algorithms/campus_graph.json` with 2D coordinates in $[200, 800] \times [100, 900]$ and geo coordinates in `NODE_GEO_METADATA` (lines 10–21).
   - **Edge Network**: Exactly 30 directed edges (15 bidirectional pairs) with distance, base time, and road types (`CAMPUS_ROAD`, `EV_SHUTTLE_LANE`, `PEDESTRIAN_ACCESS`).
   - **Dynamic Congestion $c(t)$ (Feature 18)** (lines 58–106):
     * Morning rush ($t \in [8.25, 9.5]$, e.g., `08:30`): multiplier `1.65x`.
     * Midday shift ($t \in [12.0, 13.5]$, e.g., `12:30`): multiplier `1.35x`.
     * Evening peak ($t \in [17.0, 18.5]$, e.g., `17:45`): multiplier `1.70x`.
     * Off-peak normal: multiplier `1.00x`.
     * Lane-specific mitigations: `PEDESTRIAN_ACCESS` = `1.00x`, `EV_SHUTTLE_LANE` = $\min(1.10, c_{\text{global}}(t))$.
   - **Dijkstra Pathfinding (Feature 15)** (lines 108–196):
     * Single hop: `GATE_NORTH` $\to$ `DORM_NORTH` = 0.8 km, 3.0 min.
     * Multi-hop: `GATE_NORTH` $\to$ `ACAD_QUAD` = 1.5 km (via `DORM_NORTH`).
     * Identical node: `{ path: [node], totalDistanceKm: 0, totalTimeMins: 0, legs: [] }`.
     * Non-existent node: returns `null`.
   - **A\* Pathfinding** (lines 198–301):
     * Implements Euclidean distance heuristic ($h(u, v) \le d^*(u, v)$), admissible and consistent in metric coordinate space.
3. `server/src/services/ride_matching.service.ts`:
   - **DARP Ride Matching Heuristic (Feature 15)** (lines 69–208):
     * Computes direct routes $O_d \to D_d$ and $O_p \to D_p$.
     * Evaluates 3-leg pooled trajectory: $O_d \to O_p$ (leg 1), $O_p \to D_p$ (leg 2), $D_p \to D_d$ (leg 3).
     * Calculates detour distance $D_{detour} = \max(0, D_{pooled} - D_{direct\_driver})$ and ratio $\rho = D_{detour} / D_{direct\_driver}$.
     * Strictly enforces $\rho \le \min(\text{maxDetour}, 0.35)$ (rejects with `DETOUR_LIMIT_EXCEEDED` if exceeded).
     * Enforces seat capacity constraint (rejects with `INSUFFICIENT_SEAT_CAPACITY` if $S_{available} < S_{needed}$).
   - **Avoided Carbon Emissions & Vehicle Factors (Feature 16)** (lines 31–51, 180–185):
     * Avoided distance: $d_{avoided} = \max(0, d_{driver} + d_{passenger} - d_{pooled})$.
     * Emission factors: Petrol = $0.155\text{ kg CO}_2\text{e/km}$, EV = $0.048\text{ kg CO}_2\text{e/km}$, Shuttle = $0.032\text{ kg CO}_2\text{e/km}$, Cart = $0.025\text{ kg CO}_2\text{e/km}$.
     * Provenance tag: `provenance: '[ESTIMATED METRIC]'`.
   - **Fare Economics**:
     * $Fare_{solo} = 15.0 + 12.0 \cdot d_{passenger}$, $Fare_{pooled} = 0.60 \cdot Fare_{solo}$ (40% eco-discount), driver earnings = $0.85 \cdot Fare_{pooled}$.
   - **Concurrency & Database Persistence**:
     * Atomic SQLite transaction (`db.transaction()`, lines 306–367) updating `ride_offers.available_seats`, `ride_requests.status`, creating `ride_matches` and `ride_bookings`, and writing to `activity_log` with module `'rides'` and details including `[ESTIMATED METRIC]`.
4. `server/src/routes/rides.routes.ts`:
   - Routes `/graph`, `/shortest-path`, `/shortest-path-astar`, `/offers`, `/requests`, `/match`, `/matches/:matchId/confirm`, `/book`, and `/summary` directly through service layer with robust input validation.
5. `client/src/components/rides/CampusMapSvg.tsx` & `client/src/pages/RidePooling.tsx`:
   - Interactive SVG campus visualization with live congestion edge colors, time-of-day scrubber, route overlays (pooled vs direct), node selection, role switching, DARP match card, and carbon telemetry.

### 1.2 Forensic Integrity Audit
We performed an adversarial search for integrity violations:
- **Hardcoded test outputs**: Searched codebase for test fixture IDs (`drv-1`, `stu-1`, `off-1`, `req-1`) and literal route outputs. Result: `server/src/services/` contains zero test-specific mocks, hardcoded lookup tables, or shortcuts.
- **Dummy/Facade implementations**: Verified that pathfinding traverses actual graph adjacency maps and computes dynamic edge weights based on time string parsing.
- **Bypassed algorithms**: Dijkstra and A* algorithms run genuine priority queues and set-based relaxations; DARP evaluates real 3-leg insertions.
- **Provenance label compliance**: Verified `[ESTIMATED METRIC]` is explicitly returned across all carbon emission outputs.

### 1.3 Verbatim Build and Test Execution Outputs

#### Command 1: Full-Stack Production Build (`npm run build`)
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
✓ built in 373ms
```
Exit code: **0**.

#### Command 2: Unit Graph Matching Test (`npx vitest run tests/unit/graph_matching.test.ts`)
```bash
$ npx vitest run tests/unit/graph_matching.test.ts

 RUN  v3.2.7 /Users/divya/Documents/Problem statement 

 ✓ tests/unit/graph_matching.test.ts (13 tests) 50ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Dijkstra Shortest Path Calculations > calculates direct single-hop path distance accurately 1ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Dijkstra Shortest Path Calculations > identifies the optimal multi-hop shortest path between distant campus nodes 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Dijkstra Shortest Path Calculations > handles identical origin and destination as a zero-distance path 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Dijkstra Shortest Path Calculations > returns null when querying non-existent or invalid node IDs 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Dijkstra Shortest Path Calculations > applies time-of-day dynamic congestion multipliers correctly 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > DARP Ride Matching Heuristics & Detour Ceilings > matches compatible passenger on driver route with low detour (< 35%) 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > DARP Ride Matching Heuristics & Detour Ceilings > rejects match when passenger pickup causes detour ratio > 35% 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > DARP Ride Matching Heuristics & Detour Ceilings > rejects pairing when available seats are fewer than seats needed 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > DARP Ride Matching Heuristics & Detour Ceilings > calculates lower avoided carbon for EV compared to petrol vehicle for identical routes 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Production Services Verification (GraphService & RideMatchingService) > GraphService exports canonical 10 nodes and 30 directed edges matching campus_graph.json 14ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Production Services Verification (GraphService & RideMatchingService) > GraphService calculates shortest path via A* heuristic matching Dijkstra 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Production Services Verification (GraphService & RideMatchingService) > GraphService normalizes INNOVATION_PARK alias to INNOVATION 0ms
   ✓ Algorithmic Unit Tests — Campus Graph & Ride Matching (Module B) > Production Services Verification (GraphService & RideMatchingService) > RideMatchingService evaluates all vehicle emission factors correctly with [ESTIMATED METRIC] 32ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  599ms
```
Exit code: **0**.

#### Command 3: Milestone 2 Adversarial Stress Suite (`npx vitest run tests/adversarial/m2_stress_challenge.test.ts`)
```bash
$ npx vitest run tests/adversarial/m2_stress_challenge.test.ts

 RUN  v3.2.7 /Users/divya/Documents/Problem statement 

 ✓ tests/adversarial/m2_stress_challenge.test.ts (28 tests) 61ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > handles identical origin and destination as zero distance, zero time, single node path 13ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > rejects path query when source or target query parameter is missing with HTTP 400 5ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > returns HTTP 404 when querying non-existent or disconnected node IDs 5ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > A* pathfinding returns HTTP 404 for non-existent node IDs 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > A* and Dijkstra produce identical shortest path distances across all 10 campus nodes 5ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > verifies triangle inequality: d(A, C) <= d(A, B) + d(B, C) across campus triples 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 1. Graph Pathfinding Edge Cases & Invariants > handles cyclic routes without infinite loops or memory leaks 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 2. Dynamic Congestion Multipliers & Time Parser Stress > verifies exact boundary timestamps for morning rush (08:15 to 09:30 => 1.65x) 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 2. Dynamic Congestion Multipliers & Time Parser Stress > verifies exact boundary timestamps for midday shift (12:00 to 13:30 => 1.35x) 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 2. Dynamic Congestion Multipliers & Time Parser Stress > verifies exact boundary timestamps for evening dispersal (17:00 to 18:30 => 1.70x) 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 2. Dynamic Congestion Multipliers & Time Parser Stress > verifies road-specific lane mitigations during peak congestion 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 2. Dynamic Congestion Multipliers & Time Parser Stress > handles malformed time inputs safely without unhandled exceptions 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > enforces exact detour threshold: matches at <= 35% and rejects at > 35% 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > honors strict passenger-specified maxDetourRatio lower than 35% 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > rejects matching when offer availableSeats is 0 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > rejects offer creation when totalSeats is 0 or negative via HTTP 400 6ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > rejects offer creation when origin and destination are identical with HTTP 400 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > rejects passenger request creation when origin and destination are identical with HTTP 400 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 3. DARP Stress & Invariant Violations > concurrency stress: 10 parallel booking attempts on last available seat allows exactly 1 booking and prevents overbooking 8ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 4. Malicious / SQL Injection Payloads > neutralizes SQL injection and malicious payloads in node IDs and query parameters 9ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 4. Malicious / SQL Injection Payloads > neutralizes malicious vehicle type inputs safely 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > returns clean HTTP 404 when booking with non-existent offerId 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > returns clean HTTP 404 when booking with non-existent requestId 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > returns clean HTTP 404 when matching with non-existent offerId or requestId 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > returns clean HTTP 404 when confirming a non-existent matchId 1ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > verifies activity log entry is written with [ESTIMATED METRIC] provenance tag upon successful booking 2ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > verifies vehicle emission factors adhere to specification ordering and exact values 0ms
   ✓ Milestone 2 Adversarial & Stress Challenge Suite > 5. Activity Log & Foreign Key / Error Handling Integrity > GET /api/rides/summary includes campus-wide totals with [ESTIMATED METRIC] provenance 1ms

 Test Files  1 passed (1)
      Tests  28 passed (28)
   Duration  583ms
```
Exit code: **0**.

#### Command 4: Complete Test Suite (`npm test`)
```bash
$ npm test

> universe-campus-os@1.0.0 test
> vitest run

 RUN  v3.2.7 /Users/divya/Documents/Problem statement 

 ✓ tests/e2e/tier3_pairwise.test.ts (8 tests) 126ms
 ✓ tests/e2e/tier4_scenarios.test.ts (4 tests) 257ms
 ✓ tests/integration/full_ecosystem.test.ts (20 tests) 166ms
 ✓ tests/e2e/tier2_boundaries.test.ts (18 tests) 305ms
 ✓ tests/adversarial/m1_stress_challenge.test.ts (21 tests) 217ms
 ✓ tests/adversarial/m2_stress_challenge.test.ts (28 tests) 211ms
 ✓ tests/e2e/tier1_features.test.ts (33 tests) 353ms
 ✓ tests/unit/graph_matching.test.ts (13 tests) 12ms
 ✓ tests/unit/privacy_dp.test.ts (10 tests) 3ms
 ✓ tests/unit/energy_carbon.test.ts (9 tests) 84ms

 Test Files  10 passed (10)
      Tests  164 passed (164)
   Start at  21:28:27
   Duration  1.69s
```
Exit code: **0**.

---

## 2. Logic Chain

1. **Topological Completeness & Geometric Coherence**:
   - Observations 1.1(1) and 1.1(2) confirm 10 canonical nodes and 30 directed edges.
   - All node pairs ($10 \times 10 = 100$ combinations) were evaluated via A* and Dijkstra (`m2_stress_challenge.test.ts:71`). A* distance equals Dijkstra distance in all 100 cases, verifying that Euclidean heuristic $h(u, v) \le d^*(u, v)$ is strictly admissible and optimal.
   - Triangle inequality $d(A, C) \le d(A, B) + d(B, C)$ was formally verified across campus triples, demonstrating a consistent metric space.
2. **Dynamic Time-of-Day Congestion Mechanics**:
   - The piecewise function for $c(t)$ in `graph.service.ts` was tested across boundary minutes: 08:14 (1.00x), 08:15 (1.65x), 08:30 (1.65x), 09:30 (1.65x), 09:31 (1.00x), 11:59 (1.00x), 12:00 (1.35x), 12:30 (1.35x), 13:30 (1.35x), 13:31 (1.00x), 16:59 (1.00x), 17:00 (1.70x), 17:45 (1.70x), 18:30 (1.70x), and 18:31 (1.00x).
   - Lane mitigations for `PEDESTRIAN_ACCESS` (1.00x) and `EV_SHUTTLE_LANE` ($\min(1.10, c)$) correctly decouple non-vehicular and dedicated bus transit corridors from traffic delays.
3. **Dial-a-Ride Problem (DARP) Feasibility**:
   - For any pair of offer $O_d \to D_d$ and request $O_p \to D_p$, the detour ratio $\rho = (D_{pooled} - D_{direct\_driver}) / D_{direct\_driver}$ is calculated.
   - When detour exceeds 35%, `DETOUR_LIMIT_EXCEEDED` is returned.
   - When a passenger specifies a stricter custom bound (e.g., $\le 5\%$), the engine respects the tighter constraint.
   - When driver available seats are 0, matching immediately terminates with `INSUFFICIENT_SEAT_CAPACITY`.
4. **Avoided Carbon Modeling & Provenance Transparency**:
   - Formula $\Delta CO_2 = \max(0, d_{driver} + d_{passenger} - d_{pooled}) \times EF_{vehicle}$ properly rounds to 2 decimal places.
   - Vehicle emission factor ordering $\text{Petrol } (0.155) > \text{EV } (0.048) > \text{Shuttle } (0.032) > \text{Cart } (0.025)\text{ kg CO}_2\text{e/km}$ matches environmental physics.
   - Provenance tag `[ESTIMATED METRIC]` is verified in TypeScript types, API JSON responses, and centralized `activity_log` rows.
5. **Concurrency Safety & Race Condition Protection**:
   - In `m2_stress_challenge.test.ts:399`, 10 simultaneous booking attempts were dispatched against a single available seat using `Promise.all`.
   - Exactly 1 request returned HTTP 201 (`success: true`), while 9 returned HTTP 400 (`Insufficient available seats`).
   - SQLite atomic transaction ensured `available_seats` remained at exactly 0 without negative balances or phantom allocations.

---

## 3. Caveats

1. **Non-Planar Shortest Paths**: In the event that a user queries non-contiguous campus zones, Dijkstra will find paths through intermediate hubs. If a graph disconnection were introduced, the service gracefully returns `null` and the API returns HTTP 404.
2. **Time Format Parsing**: The dynamic congestion engine parses ISO 8601 strings, `HH:MM` 24-hour strings, and falls back to off-peak (1.00x) or midday (1.35x) on malformed inputs without throwing unhandled exceptions.

---

## 4. Conclusion

The Milestone 2 implementation for Smart Campus Ride-Pooling has been thoroughly reviewed and adversarially stress-tested. The work exhibits zero integrity violations, no hardcoded cheats or facade logic, rigorous algorithmic implementation of Dijkstra, A*, and DARP heuristics, dynamic congestion weighting, proper carbon estimation with mandatory provenance labeling, and atomic transactional database safety.

**Explicit Verdict: APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this assessment:
```bash
# 1. Full build verification
npm run build

# 2. Algorithmic unit tests
npx vitest run tests/unit/graph_matching.test.ts

# 3. Adversarial stress challenge suite (28 tests)
npx vitest run tests/adversarial/m2_stress_challenge.test.ts

# 4. Complete test suite across all 10 suites (164 tests)
npm test
```

### Invalidation Conditions
- Any failure in `npm run build` or `npm test`.
- Any modification that bypasses Dijkstra/A* path calculation or uses static distance lookup tables.
- Omission of `[ESTIMATED METRIC]` in carbon emission responses or activity logs.
- Detour ratio permitting rides with detour $> 35\%$.
