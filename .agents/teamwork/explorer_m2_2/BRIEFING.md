# BRIEFING — 2026-10-29T15:25:00Z

## Mission
Investigate and design Dial-a-Ride Problem (DARP) matching heuristic, environmental/economic formulas, database schemas, and endpoints for Milestone 2 Smart Campus Ride-Pooling.

## 🔒 My Identity
- Archetype: explorer
- Roles: Explorer, Algorithmic & Backend Investigator
- Working directory: /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_2
- Original parent: 5c79500e-0663-460b-8b92-210d35bc7398
- Milestone: Milestone 2 - Smart Campus Ride-Pooling

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify application code directly
- Multi-passenger insertion heuristic with seat capacity and time window checks
- Detour constraint <= 35% over direct shortest path
- Avoided CO2 emissions formula with provenance tag `[ESTIMATED METRIC]`
- Fare splitting & cost savings calculation
- Inspect tests/unit/graph_matching.test.ts and tests/fixtures/algorithms/graph_oracle.ts
- Inspect database schema for rides, ride_requests, ride_matches
- Produce turnkey specifications and code proposals in handoff.md

## Current Parent
- Conversation ID: 5c79500e-0663-460b-8b92-210d35bc7398
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `tests/unit/graph_matching.test.ts`
  - `tests/fixtures/algorithms/graph_oracle.ts`
  - `tests/fixtures/campus_graph.json`
  - `server/src/db/schema.sql`, `tests/fixtures/schema.sql`, `server/src/db/seed.ts`
  - `server/src/routes/rides.routes.ts`, `server/src/algorithms/graph_oracle.ts`
  - `client/src/pages/RidesPage.tsx`, `client/src/components/rides/CampusMapSvg.tsx`
  - Vitest test runs for unit and full ecosystem
- **Key findings**:
  - Mathematical formulas in `graph_oracle.ts` are verified by 9 passing unit tests and 4 integration tests.
  - Multi-passenger insertion heuristic evaluates chronological candidate positions $(i, j)$ on the route respecting seat capacity at every sub-leg.
  - Exact vehicle emission factors: Petrol (0.155 kg CO2e/km), EV (0.048 kg CO2e/km), Shuttle (0.032 kg CO2e/km), Cart (0.025 kg CO2e/km).
  - Provenance tag `[ESTIMATED METRIC]` must be explicitly added to returned payloads and activity logs.
  - Endpoints must support both `POST /api/rides/book` (for existing test suites) and `POST /api/rides/matches/:matchId/confirm` (for milestone requirement).
  - Encapsulate logic into `server/src/services/ride_matching.service.ts`.
- **Unexplored areas**: None within Module B scope.

## Key Decisions Made
- Deliver a complete, turnkey implementation proposal for `server/src/services/ride_matching.service.ts` and `server/src/routes/rides.routes.ts`.
- Maintain 100% backward compatibility with existing contract tests while adding ranked matching and match confirmation endpoints.

## Artifact Index
- DISPATCH.md — Dispatch instructions from orchestrator
- progress.md — Liveness heartbeat and progress log
- handoff.md — Turnkey investigation findings and architecture proposal
