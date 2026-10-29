# Project: UniVerse — Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem

## Architecture
UniVerse is structured as a unified, high-performance full-stack web application:
- **Client**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React icons, Recharts for analytics. Single unified application shell with responsive navigation, shared notification center, and role simulation switcher (Student, Driver, Proctor, Admin).
- **Server**: Node.js, Express 5, TypeScript (executed via `tsx`), RESTful API endpoints organized modularly under `/api`.
- **Database**: `better-sqlite3` embedded SQLite engine with WAL mode and foreign key constraints. Single unified database file (`server/data/universe.db`) with comprehensive seed fixtures.
- **Algorithms & Telemetry**:
  - Graph-based Dijkstra pathfinding and Dial-a-Ride insertion matching heuristic with dynamic time-of-day traffic weighting and detour bounds.
  - Three-tier provenance labeling architecture (`ACTUAL_INFERENCE`, `SIMULATED_EVENT`, `ESTIMATED_METRIC`) for Computer Vision exam observation and sustainability telemetry.
  - Non-linear power modeling ($P_{\text{idle}} + \Delta P \cdot U^\gamma$) with PUE factors and diurnal grid carbon curves.
  - Privacy-preserving digital wellbeing with local-first hostname sanitization, Laplace differential privacy ($\epsilon=0.80$), and $k$-anonymity ($k \ge 5$).

## Code Layout
```
/Users/divya/Documents/Problem statement /
├── client/
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx                      # App entry point
│   │   ├── App.tsx                       # Router & layout provider
│   │   ├── index.css                     # Tailwind v4 theme tokens
│   │   ├── components/                   # Shared UI (Navigation, Header, ActivityDrawer, RoleSwitcher, Badges)
│   │   │   ├── Navbar.tsx
│   │   │   ├── ActivityCenter.tsx
│   │   │   ├── RoleSwitcher.tsx
│   │   │   └── ProvenanceBadge.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx             # Unified landing overview
│   │   │   ├── AcademicHub.tsx           # Module A: Profiles, Placement & Resources
│   │   │   ├── RidePooling.tsx           # Module B: Campus Graph & Detour Matching
│   │   │   ├── Sustainability.tsx        # Module C: Telemetry, Power & Carbon Observatory
│   │   │   ├── Wellbeing.tsx             # Module D: Focus Session & Privacy Analytics
│   │   │   └── ExamMonitoring.tsx        # Module E: CV Observation & Proctor Dashboard
│   │   ├── services/                     # Typed API client services
│   │   └── types/                        # Shared TypeScript interface models
├── server/
│   ├── src/
│   │   ├── index.ts                      # Express app entry & HTTP listener (Port 3001)
│   │   ├── db/
│   │   │   ├── connection.ts             # better-sqlite3 singleton & migration runner
│   │   │   ├── schema.sql                # Complete relational schema
│   │   │   └── seed.ts                   # Realistic campus seed data
│   │   ├── routes/
│   │   │   ├── hub.routes.ts             # Module A API routes
│   │   │   ├── rides.routes.ts           # Module B API routes
│   │   │   ├── sustainability.routes.ts  # Module C API routes
│   │   │   ├── wellbeing.routes.ts       # Module D API routes
│   │   │   ├── exams.routes.ts           # Module E API routes
│   │   │   └── common.routes.ts          # Activity, notifications & health
│   │   ├── services/
│   │   │   ├── graph.service.ts          # Dijkstra, A*, DARP ride matching & detour engine
│   │   │   ├── energy.service.ts         # Power, PUE & carbon intensity computation
│   │   │   ├── privacy.service.ts        # Sanitization, Laplace DP & k-anonymity
│   │   │   └── exam.service.ts           # Video ingestion, event labeling & audit logging
│   │   └── types/                        # Backend data interfaces
├── tests/                                # Automated verification test suite
│   ├── e2e/                              # End-to-end integration tests (Vitest + Supertest)
│   │   ├── tier1_features.test.ts        # ≥5 tests per feature
│   │   ├── tier2_boundaries.test.ts      # Corner cases, empty states, limits
│   │   ├── tier3_pairwise.test.ts        # Cross-module feature interactions
│   │   └── tier4_scenarios.test.ts       # Realistic end-to-end user workflows
│   ├── unit/                             # Algorithmic correctness tests
│   │   ├── graph_matching.test.ts        # Dijkstra, detour bounds, seat capacity
│   │   ├── energy_carbon.test.ts         # Power model, PUE, grid intensity formulas
│   │   └── privacy_dp.test.ts            # Laplace noise variance, URL sanitization
│   └── fixtures/                         # Deterministic test fixtures & mock video clips
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Unified Landing Dashboard | Aggregated campus status across all 5 modules with quick actions | M1 | Survey |
| 2 | Consistent Navigation & UX | Unified sidebar/header with responsive theme and routing | M1 | Survey |
| 3 | Shared Data Architecture | Relational schema in SQLite linking users, roles, sessions, and activity | M1 | Survey |
| 4 | Activity & Notification Center | Centralized event stream for ride matches, mentorship, and proctor alerts | M1 | Survey |
| 5 | Role Simulation Switcher | Switch perspective between Student, Driver, Proctor, and System Admin | M1 | Survey |
| 6 | Student Profile Management | Student profile with skills, interests, placement goals, readiness score | M1 | Survey |
| 7 | Placement Preparation Dashboard | Progress tracking across DSA, system design, mock interviews, milestones | M1 | Survey |
| 8 | Peer Mentor Discovery | Search/filter mentors by skill, domain, and target company with ratings | M1 | Survey |
| 9 | Mentorship Request Workflow | Send and manage mentorship requests with notes, slots, accept/reject | M1 | Survey |
| 10 | Academic Resource Repository | Searchable library of study materials, PYQs, and lecture notes by course | M1 | Survey |
| 11 | Resource Upload & Rating | Upload study resource metadata, track downloads, and submit ratings | M1 | Survey |
| 12 | Campus Location Graph Model | 10 canonical campus nodes, 22 edges with distance, time, and road types | M2 | Survey |
| 13 | Driver Ride Offer Creation | Driver publishes route, departure time, seats, and vehicle type | M2 | Survey |
| 14 | Passenger Ride Request | Passenger requests pooled ride specifying origin, destination, detour bound | M2 | Survey |
| 15 | Graph-Based Route Matching | Dijkstra shortest path + DARP insertion matching enforcing detour $\le 35\%$ | M2 | Survey |
| 16 | Shared Distance & Eco-Savings | Calculates shared km, avoided carbon emissions (kg CO2e), and fare savings | M2 | Survey |
| 17 | Interactive Campus Route Visualizer | SVG/Canvas visual map showing campus network, active routes, and pickup points | M2 | Survey |
| 18 | Dynamic Congestion Weighting | Time-of-day edge congestion multipliers (morning, midday, evening rush) | M2 | Survey |
| 19 | Multi-Service Workload Simulator | Simulates 3 services: Academic Portal, AI GPU Compute, and IoT Ingestion | M3 | Survey |
| 20 | Telemetry Metrics Capture | Captures request throughput (RPS), p50/p95 latency, CPU/GPU, memory | M3 | Survey |
| 21 | Energy Consumption Modeling | Dynamic non-linear power model $P(U) = P_{\text{idle}} + \Delta P \cdot U^\gamma$ with PUE | M3 | Survey |
| 22 | Dynamic Grid Carbon Estimation | Emissions tracking using diurnal grid carbon curves (190g solar to 680g peaker) | M3 | Survey |
| 23 | Scenario Comparison (Baseline vs Eco) | Side-by-side analysis of unoptimized vs eco-scaled configurations (% kWh/CO2 saved) | M3 | Survey |
| 24 | Transparent Provenance Disclosures | Visual indicator badges: `[SIMULATED WORKLOAD]` and `[ESTIMATED METRIC]` | M3 | Survey |
| 25 | User-Controlled Focus Session | Session lifecycle controls: Start, Pause, Resume, Stop with duration timer | M4 | Survey |
| 26 | Rule-Based Event Categorization | Categorizes browsing activity into Productive, Distracting, Neutral | M4 | Survey |
| 27 | Focus Analytics & Context Switcher | Tracks focus time, context switch rate ($CSR$), and Deep Work Index ($DWI$) | M4 | Survey |
| 28 | Local-First Domain Sanitization | Aggregates domain hostnames only; strictly strips paths, queries, credentials | M4 | Survey |
| 29 | Laplace Differential Privacy | Calibrated Laplace noise ($\epsilon=0.80$) added to cohort aggregate metrics | M4 | Survey |
| 30 | Cohort k-Anonymity Suppression | Suppresses cohort statistics if participant count $k < 5$ | M4 | Survey |
| 31 | Data Inspection & Instant Purge | User interface to audit all logged records and permanently purge with 1 click | M4 | Survey |
| 32 | Multi-Source Video Ingestion | Pipeline supporting authorized sample exam video clips and live webcam feed | M5 | Survey |
| 33 | CV Person & Pose Detection | Detects student presence, facial orientation, and workstation boundaries | M5 | Survey |
| 34 | Head Pose Deviation Detector | Flags sustained/repeated head turn away from exam ($|\text{yaw}| > 35^\circ$ for $>2.5\text{s}$) | M5 | Survey |
| 35 | Multi-Person & Zone Intrusion | Flags entry of multiple persons or intrusion into candidate workstation zone | M5 | Survey |
| 36 | Absence from Desk Detector | Flags continuous absence of candidate from exam station ($>5.0\text{s}$) | M5 | Survey |
| 37 | Three-Tier Provenance Tagging | Strict tagging: `[ACTUAL_INFERENCE]`, `[SIMULATED_EVENT]`, `[ESTIMATED_METRIC]` | M5 | Survey |
| 38 | Non-Punitive Proctor Dashboard | Human-in-the-loop triage: review clip, dismiss (false positive/benign), or escalate | M5 | Survey |
| 39 | Zero-Autonomous-Penalty Guardrail | Hard architectural constraint prohibiting auto-disqualification or penalties | M5 | Survey |
| 40 | Immutable Proctor Audit Trail | Append-only SQLite audit log recording all proctor reviews with mandatory notes | M5 | Survey |

*(Feature Inventory cross-check: 40 identified features across 5 modules, all strictly assigned to Milestones M1 to M5.)*

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Platform & Academic Hub | Database schema, seed fixtures, Express server skeleton, React shell with navigation & role switcher, and Module A (Student Profile, Placement Dashboard, Mentorship, Resources) | none | DONE |
| M2 | Smart Campus Ride-Pooling | 10-node campus graph, Dijkstra/A* pathing, dynamic congestion, DARP insertion ride matching, detour/carbon/cost calculation, interactive SVG map visualizer | M1 | PLANNED |
| M3 | Sustainable Computing Observatory | 3 workload simulators (Portal, AI GPU, IoT), telemetry collection, non-linear power model, diurnal grid carbon curve, baseline vs eco comparison, transparent badges | M1 | PLANNED |
| M4 | Privacy-Aware Digital Wellbeing | Focus session lifecycle, hostname-only sanitization, categorization rules, CSR & DWI metrics, Laplace differential privacy ($\epsilon=0.80$), $k$-anonymity, data inspection & purge | M1 | PLANNED |
| M5 | Responsible Examination Monitoring | Video/webcam ingestion, Edge CV head pose & zone intrusion detection, 3-tier provenance labeling, zero auto-penalty guardrail, proctor review dashboard, immutable audit log | M1 | PLANNED |
| M6 | Full System Integration & 100% E2E Pass | Phase 1: 100% pass on E2E test suite (Tiers 1-4). Phase 2: Adversarial coverage hardening (Tier 5) with Challenger, Worker, Reviewer, and Forensic Auditor | M1, M2, M3, M4, M5, E2E | PLANNED |

## Parallel Track: E2E Testing Track
| # | Track Name | Scope | Dependencies | Status |
|---|------------|-------|-------------|--------|
| E2E | Opaque-Box E2E Testing Suite | Test harness (Vitest, Supertest), Tier 1 feature coverage (≥5/feature), Tier 2 boundaries/corners, Tier 3 pairwise cross-module combinations, Tier 4 realistic scenarios. Publishes `TEST_READY.md`. | none | DONE |

## Interface Contracts
### Common & Database ↔ All Modules
- SQLite DB Path: `server/data/universe.db`
- Connection export: `import { getDb } from '../db/connection.js';`
- User Schema: `id, name, email, avatar, role, department, year_of_study, bio`
- Role types: `'student' | 'driver' | 'proctor' | 'admin'`
- Activity Log: `INSERT INTO activity_log (id, user_id, module, action, details, timestamp)`

### Module A (Academic Hub) API
- `GET /api/hub/profile/:studentId` -> Student profile, skills, readiness score
- `PUT /api/hub/profile/:studentId` -> Update skills, placement goals
- `GET /api/hub/placement-milestones/:studentId` -> Milestone checklist & progress %
- `POST /api/hub/placement-milestones/:studentId/toggle` -> Toggle milestone completion
- `GET /api/hub/mentors?skill=&company=` -> Filtered mentors with slots
- `POST /api/hub/mentorship-requests` -> Submit request `{ menteeId, mentorId, topic, preferredSlot }`
- `GET /api/hub/mentorship-requests/:userId` -> User's sent & received requests
- `PATCH /api/hub/mentorship-requests/:requestId` -> Update status `{ status: 'accepted' | 'rejected', notes }`
- `GET /api/hub/resources?courseCode=&category=&query=` -> Search academic resources
- `POST /api/hub/resources` -> Upload resource metadata `{ title, courseCode, category, fileUrl, uploaderId }`
- `POST /api/hub/resources/:resourceId/rate` -> Rate resource `{ rating: 1-5 }`

### Module B (Ride-Pooling) API
- `GET /api/rides/graph` -> 10-node campus topology, edges, coordinates & live congestion
- `POST /api/rides/offers` -> Driver ride creation `{ driverId, originNodeId, destinationNodeId, departureTime, totalSeats, vehicleType }`
- `GET /api/rides/offers` -> List active driver offers
- `POST /api/rides/requests` -> Passenger ride request `{ passengerId, originNodeId, destinationNodeId, desiredTime, seatsNeeded, maxDetourRatio }`
- `POST /api/rides/match` -> Run DARP matching for a request or offer -> `{ matched: boolean, driverRoute, passengerRoute, detourKm, sharedKm, carbonSavedKg, fareSavings }`
- `POST /api/rides/book` -> Confirm ride booking and decrement available seats

### Module C (Sustainable Computing) API
- `GET /api/sustainability/services` -> List 3 simulated workloads with current RPS & replica status
- `POST /api/sustainability/workloads/:serviceId/scale` -> Adjust target RPS or replica count
- `GET /api/sustainability/telemetry` -> Real-time snapshots (RPS, latency p50/p95, CPU%, GPU%, Power W, Carbon g/h)
- `GET /api/sustainability/scenarios` -> Side-by-side comparison: Baseline vs Eco-Optimized metrics
- `POST /api/sustainability/toggle-optimization` -> Enable/disable eco levers (autoscaling, solar shifting, caching)

### Module D (Digital Wellbeing) API
- `POST /api/wellbeing/sessions/start` -> Start session `{ userId, targetDurationMins, goal }`
- `POST /api/wellbeing/sessions/:sessionId/pause` -> Pause/resume session
- `POST /api/wellbeing/sessions/:sessionId/stop` -> Stop session & compute final DWI score
- `GET /api/wellbeing/sessions/:sessionId` -> Session summary & stats
- `POST /api/wellbeing/events` -> Ingest browsing domain event `{ sessionId, domain, durationSeconds }` (local sanitization applied)
- `GET /api/wellbeing/rules/:userId` -> Get domain classification rules (Productive, Distracting, Neutral)
- `POST /api/wellbeing/rules` -> Create/update domain category rule
- `GET /api/wellbeing/cohort-aggregate?department=&minCohort=5` -> Laplace DP aggregate focus metrics
- `DELETE /api/wellbeing/history/:userId` -> Complete permanent user data purge

### Module E (Examination Monitoring) API
- `GET /api/exams/sessions` -> List scheduled/active exam sessions
- `POST /api/exams/sessions` -> Start or join exam session
- `POST /api/exams/events` -> Ingest observation event `{ examSessionId, eventType, confidenceScore, frameSnapshotUrl, provenance: 'ACTUAL_INFERENCE' | 'SIMULATED_EVENT' | 'ESTIMATED_METRIC' }`
- `GET /api/exams/events/:sessionId` -> Get timestamped event feed with confidence & provenance tags
- `PATCH /api/exams/events/:eventId/review` -> Proctor resolution `{ action: 'DISMISS_FALSE_POSITIVE' | 'DISMISS_BENIGN_BEHAVIOR' | 'ESCALATE', proctorNotes, reviewerId }`
- `GET /api/exams/audit-log/:sessionId` -> Immutable proctor audit trail
