# Dispatch: Worker Milestone 2 (Smart Campus Ride-Pooling)
- Working Directory: /Users/divya/Documents/Problem statement /.agents/teamwork/worker_m2
- Milestone: M2 — Smart Campus Ride-Pooling
- Target Files:
  - `server/src/services/graph.service.ts`
  - `server/src/services/ride_matching.service.ts`
  - `server/src/routes/rides.routes.ts`
  - `client/src/services/rides.service.ts`
  - `client/src/components/rides/CampusMapSvg.tsx`
  - `client/src/pages/RidePooling.tsx`
  - `client/src/pages/RidesPage.tsx`

## 2026-10-29T15:29:22Z
You are worker_m2 (Role: Worker Milestone 2).
Your working directory is: /Users/divya/Documents/Problem statement /.agents/teamwork/worker_m2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. Read /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md first to understand user requirements.
2. Read /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md to understand the architecture, Feature Inventory (Features 12 to 18), and interface contracts.
3. Ingest the turnkey code designs and specifications prepared by the 3 Explorers:
   - /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_1/handoff.md (Graph model, 10 canonical nodes, 30 directed edges, dynamic congestion factors, Dijkstra/A* pathing)
   - /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_2/handoff.md (DARP matching heuristic, detour <= 35%, avoided CO2 and fare split formulas, Express routes)
   - /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_3/handoff.md (React UI, interactive SVG campus map, booking forms, match cards, eco-impact bar)

YOUR EXCLUSIVE FILE OWNERSHIP:
- `server/src/services/graph.service.ts` (create)
- `server/src/services/ride_matching.service.ts` (create)
- `server/src/routes/rides.routes.ts` (replace/update with complete implementation)
- `client/src/services/rides.service.ts` (create/update)
- `client/src/components/rides/CampusMapSvg.tsx` (update/enhance)
- `client/src/pages/RidePooling.tsx` (create/update)
- `client/src/pages/RidesPage.tsx` (ensure it imports/re-exports RidePooling or is completely consistent)

SPECIFIC IMPLEMENTATION TASKS:
1. `server/src/services/graph.service.ts`:
   - Define the 10 canonical campus nodes (`GATE_NORTH`, `GATE_SOUTH`, `ACAD_QUAD`, `LAB_CS_AI`, `LIB_CENTRAL`, `DORM_NORTH`, `DORM_SOUTH`, `STUDENT_CTR`, `INNOVATION`, `SPORTS_CMPLX`) with 2D coordinates for visualizer and geo lat/lng.
   - Define the 30 directed edges (15 bidirectional pairs) matching `campus_graph.json` and passing `tests/e2e/tier1_features.test.ts:165` (`edges.length === 30`).
   - Implement dynamic time-of-day edge congestion weighting $c(t)$:
     * Morning rush (08:30): multiplier 1.65x
     * Midday shift (12:30): multiplier 1.35x
     * Evening dispersal (17:45): multiplier 1.70x
     * Off-peak: multiplier 1.00x
   - Implement Dijkstra / A* pathfinder returning distance, congestion-adjusted travel time, and intermediate node path.

2. `server/src/services/ride_matching.service.ts`:
   - Implement DARP matching evaluating driver ride offers vs passenger ride requests.
   - Enforce detour ratio constraint: $DetourRatio = (Distance_{pooled} / Distance_{direct}) - 1.0 \le 0.35$. Reject with `DETOUR_LIMIT_EXCEEDED` if exceeded.
   - Enforce seat capacity constraint: reject with `INSUFFICIENT_SEAT_CAPACITY` if requested seats > available seats.
   - Calculate avoided carbon emissions $\Delta CO_2 = (d_{driver} + d_{passenger} - d_{pooled}) \times EF_{vehicle}$ (Petrol: 0.155, EV: 0.048, Shuttle: 0.032, Cart: 0.025 kg CO2e/km). Tag with `[ESTIMATED METRIC]`.
   - Calculate fare split: solo fare = $15.0 + 12.0 \cdot d$, pooled fare = $0.6 \cdot Fare_{solo}$ (40% discount), driver earnings = $0.85 \cdot Fare_{pooled}$.

3. `server/src/routes/rides.routes.ts`:
   - Implement all required endpoints using SQLite (`server/data/universe.db` via `getDb()`):
     * `GET /api/rides/graph`: returns `{ nodes, edges, liveCongestionMultiplier }`.
     * `GET /api/rides/offers`: list offers from `ride_offers`.
     * `POST /api/rides/offers`: insert offer into `ride_offers`.
     * `GET /api/rides/requests`: list requests from `ride_requests`.
     * `POST /api/rides/requests`: insert request into `ride_requests`.
     * `POST /api/rides/match`: run DARP matching on pending requests vs available rides; return candidate matches with detour %, carbon saved, and fare.
     * `POST /api/rides/matches/:matchId/confirm` and `POST /api/rides/book`: confirm booking, decrement available seats, record in `ride_bookings` / `ride_matches`, and log to `activity_log`.
     * Validate foreign keys, node existence, and input constraints returning HTTP 400 or 404 cleanly.

4. `client/src/services/rides.service.ts`:
   - Full API client with typed methods and graceful fallback if backend is offline.

5. `client/src/components/rides/CampusMapSvg.tsx`:
   - Interactive SVG campus map with the 10 nodes, congestion-colored edges (Green <=1.15x, Yellow 1.2-1.45x, Red >=1.5x), time-of-day scrubber toolbar, route overlay rendering (driver direct vs pooled vs detour), and clickable node selection.

6. `client/src/pages/RidePooling.tsx` & `client/src/pages/RidesPage.tsx`:
   - Dual-role forms: Driver "Offer a Ride" and Passenger "Request a Ride" with detour tolerance slider $\le 35\%$.
   - DARP match cards with detour % pill, `[ESTIMATED METRIC]` carbon badge, fare split savings, and one-click confirm button.
   - Eco-impact summary bar (total campus trips, shared km, CO2 avoided, money saved).

VERIFICATION REQUIREMENTS:
- Run `npm run build` — both server (`tsc`) and client (`vite`) must compile with 0 errors.
- Run `npm test` — all test suites (including `tests/unit/graph_matching.test.ts` and `tests/e2e/tier1_features.test.ts`) must pass 100%.
- Document all build and test command outputs verbatim in your `handoff.md`.
- Send a completion message with your verdict and findings back to the orchestrator.

## 2026-10-29T15:41:02Z
**Context**: Milestone 2 Implementation (Smart Campus Ride-Pooling)
**Content**: Please provide a status update on your implementation progress across `graph.service.ts`, `ride_matching.service.ts`, `rides.routes.ts`, and `RidePooling.tsx`. Remember to update your `progress.md` with your current step and timestamp.
**Action**: Reply with your current status and progress.
