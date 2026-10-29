## 2026-10-29T15:12:52Z
You are explorer_m2_3 (Roles: Explorer, Frontend & UI Investigator).
Your working directory is: /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_3

MANDATORY INSTRUCTIONS:
1. Read /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md first to understand the user request and requirements.
2. Read /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md to understand the architecture, Feature Inventory (Features 13, 14, 16, 17), and interface contracts.
3. Your mission for Milestone 2 (Smart Campus Ride-Pooling):
   - Investigate the client-side Ride Pooling implementation in `client/src/pages/RidePooling.tsx` and related services (`client/src/services/rides.service.ts`):
     * Interactive SVG / Canvas Campus Route Visualizer:
       - Displays the 10 campus nodes in a 2D layout with labels, coordinate positioning, and visual styling.
       - Renders network edges with color-coding based on live congestion multiplier $c(t)$ (green: 1.0x, yellow: 1.2-1.4x, orange/red: 1.5-1.7x).
       - Interactively highlights driver route (direct route in dotted/dashed or distinct color) vs matched pooled route (pickup pin, dropoff pin, detour segment).
       - Clickable nodes to select Origin / Destination easily.
     * Dual Role Workflows & Forms:
       - Driver tab / view: "Offer a Ride" form (departure time, vehicle type selector [EV, Gas, Scooter], seats available, starting location, destination, submit button). Active offers list with status (`open`, `in_progress`, `completed`).
       - Passenger tab / view: "Request a Ride" form (pickup location, dropoff location, earliest departure, latest arrival, seats needed, detour tolerance slider $\le 35\%$, submit button). Active requests list.
     * Match Results & Confirmation View:
       - Displays candidate matches returned by DARP matcher:
         * Driver name, vehicle type, departure time, seats left.
         * Detour % pill (`Detour: +14% (within 35% limit)`).
         * Carbon Saved badge with `[ESTIMATED METRIC]` (`🌱 -0.84 kg CO2e`).
         * Fare Split / Cost Savings (`💰 ₹35 / person - Saved ₹25`).
         * "Confirm & Join Pool" button that calls `/api/rides/matches/:id/confirm` with real-time UI feedback and toast.
     * Eco-Impact Summary Bar:
       - Total pooled campus trips, total kilometers shared, total $CO_2$ emissions avoided, and total money saved with `[ESTIMATED METRIC]` badges.
   - Inspect existing client styles, icons (lucide-react), and layout in `client/src/`:
     * Navigation in `client/src/components/Navigation.tsx`
     * Header in `client/src/components/Header.tsx`
     * Provenance badges in `client/src/components/ProvenanceBadge.tsx`
   - Design the complete React component architecture, state management hooks, SVG rendering math, and API service integration for `RidePooling.tsx`.
   - Provide concrete, turnkey React code proposals and test plan.
4. Output requirements:
   - Write your complete findings, UI specifications, proposed React component code, and test recommendations to `/Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m2_3/handoff.md`.
   - Update `progress.md` in your directory.
   - Send a concise completion message with your verdict and key findings back to the orchestrator.
Do NOT write or modify application code directly; produce thorough design specifications and concrete code snippets in your handoff report.
