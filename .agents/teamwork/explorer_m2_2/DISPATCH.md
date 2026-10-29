## 2026-10-29T15:12:41Z
You are explorer_m2_2 (Roles: Explorer, Algorithmic & Backend Investigator).
Your working directory is: /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_2

MANDATORY INSTRUCTIONS:
1. Read /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md first to understand the user request and requirements.
2. Read /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md to understand the architecture, Feature Inventory (Features 13, 14, 15, 16), and interface contracts.
3. Your mission for Milestone 2 (Smart Campus Ride-Pooling):
   - Investigate the Dial-a-Ride Problem (DARP) matching heuristic and algorithms:
     * Driver ride offers: origin, destination, departure time window, available seats, vehicle type (EV car, gas car, e-scooter/bike).
     * Passenger ride requests: pickup node, dropoff node, earliest departure, latest arrival, requested seats, detour tolerance bound.
     * Detour constraint: Maximum allowable detour <= 35% over direct shortest path:
       DetourRatio = (Distance_pooled / Distance_direct) - 1.0 <= 0.35
     * Multi-passenger insertion heuristic: evaluating optimal pickup and dropoff insertion points along the driver's route respecting vehicle seat capacity and chronological time windows.
   - Investigate the Environmental & Economic calculations:
     * Shared distance calculation (km).
     * Avoided carbon emissions formula:
       Delta CO2 = (Distance_solo_passenger + Distance_solo_driver - Distance_pooled) * EmissionFactor_vehicle
       (e.g., standard car emission factor ~= 0.171 kg CO2e / km, EV ~= 0.045 kg CO2e / km).
     * Fare splitting & cost savings formula:
       Proportional distance cost split with eco-discount.
     * All environmental and savings metrics MUST carry the [ESTIMATED METRIC] provenance tag.
   - Inspect existing test fixtures:
     * tests/unit/graph_matching.test.ts
     * tests/fixtures/algorithms/graph_matching.ts
     * Review the exact formula implementations in test fixtures and make sure the production service is 100% compatible.
   - Inspect existing database schema and seed fixtures:
     * Tables rides, ride_requests, ride_matches in server/data/universe.db / server/src/db/schema.sql.
   - Design the exact architecture and endpoints for server/src/routes/rides.routes.ts:
     * GET /api/rides/graph -> Return nodes, edges, current congestion weights.
     * GET /api/rides/offers & POST /api/rides/offers -> Driver ride offer creation and listing.
     * GET /api/rides/requests & POST /api/rides/requests -> Passenger request creation and listing.
     * POST /api/rides/match -> Run DARP matching on pending requests vs available rides; returns ranked matches, detour percentage, shared km, CO2 avoided, and fare split.
     * POST /api/rides/matches/:matchId/confirm -> Confirm match, update seats, write activity log.
   - Provide concrete, turnkey implementation code proposals for server/src/services/ride_matching.service.ts and server/src/routes/rides.routes.ts.
4. Output requirements:
   - Write your complete findings, mathematical formulas, route specifications, proposed code, and verification plan to /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_2/handoff.md.
   - Update progress.md in your directory.
   - Send a concise completion message with your verdict and key findings back to the orchestrator.
Do NOT write or modify application code directly; produce thorough design specifications and concrete code snippets in your handoff report.
