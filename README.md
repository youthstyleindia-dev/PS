# UniVerse: An Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem

[![Tests](https://img.shields.io/badge/Tests-190%20Passing-brightgreen?style=flat-square)](./docs/TEST_PLAN.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?style=flat-square)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5-lightgrey?style=flat-square)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square)](https://www.sqlite.org/)
[![Design System](https://img.shields.io/badge/Design-Google%20Stitch%20Brutalism-003FE1?style=flat-square)](./docs/COMPONENT_REUSE_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> *"One Campus. Five Intelligent Systems."*  
> A unified, full-stack campus operating platform that helps students learn, connect, commute, and focus while making campus computing more sustainable and examination proctoring more responsible.

---

## 🚀 Quick Start (Zero Paid APIs Required)

UniVerse is completely self-contained and runs locally on macOS, Linux, or Windows without external paid cloud keys:

```bash
# 1. Clone & install root and client dependencies
npm install && cd client && npm install && cd ..

# 2. Run automated test suite (190 tests across 12 suites in ~1.7 seconds)
npm test

# 3. Seed SQLite database with deterministic campus data
npm run seed

# 4. Start concurrent development server (Client on :5173, Server on :3001)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🏛️ The Five Integrated Modules

UniVerse unites five specialized university systems under one cohesive Google Stitch collegiate brutalist design system (`#faf9f5` Warm Paper, `#1b1c1a` Ink Black, `#003fe1` Cobalt, zero-radius orthogonal borders):

### 1. Module A: Student Intelligence & Academic Hub (`/academic` or `/hub`)
- **Student Profile**: Tracks major, target roles, competency ratings, and placement goals.
- **Dynamic Placement Readiness**: Real-time progress percentage calculated dynamically from completed milestones (`completionPercent = completedTasks / totalTasks * 100`).
- **Peer Mentorship Discovery**: Search and filter senior student mentors by skill, company offer, and availability with cosine affinity ranking. Includes complete request workflow (`PENDING`, `ACCEPTED`, `DECLINED`).
- **Sovereign Curriculum Archive**: Searchable, categorized repository of course syllabi, past papers, and study resources.

### 2. Module B: Smart Campus Ride-Pooling (`/rides`)
- **Interactive SVG Campus Map**: Visualizes the 10-node campus topological network and 30 weighted edges with distance markers and congestion indicators.
- **Dijkstra Shortest Path Routing**: Calculates optimal paths adjusted dynamically for time-of-day traffic congestion ($c(t)$ multipliers).
- **Dial-a-Ride Insertion Matching**: Evaluates driver routes against passenger requests, strictly enforcing seat capacity and maximum detour ratio constraints ($\le 35\%$).
- **Avoided Carbon Accounting**: Calculates real shared distance, $40\%$ passenger cost savings, and avoided vehicle carbon emissions ($0.142\text{ kg CO}_2\text{e/km}$).

### 3. Module C: Sustainable Computing Observatory (`/sustainability`)
- **Green Cloud Telemetry**: Real-time observability across 3 campus services (*Academic API*, *Ride Dispatch Oracle*, *Resource Search*).
- **Non-Linear Server Power Model**: Computes power draw via:
  $$P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times (U/100)^{1.25}$$
- **Facility PUE Multiplier**: Single facility overhead factor (1.12 to 1.45) applied once.
- **Diurnal Solar Peak Scheduling**: Simulates scheduling heavy batch Slurm jobs (PyTorch/CUDA) during peak on-campus solar generation (10:00–14:00) to displace grid carbon.
- **Baseline vs. Eco-Optimized Comparison**: Toggle between baseline (PUE 1.75) and eco-optimized (PUE 1.20) showing $-45.9\%$ energy reduction.

### 4. Module D: Privacy-Aware Digital Wellbeing (`/wellbeing`)
- **Voluntary Focus Timer**: Deep work timer with Start, Pause, Resume, and Stop controls using true wall-clock timestamp differences.
- **Local Domain Classification Engine**: User-defined rules categorize domains as `Productive`, `Distracting`, or `Neutral`.
- **Zero-Telemetry Hostname Sanitization**: Client-side URL parser strips all paths, search tokens, passwords, and fragments before logging (`leetcode.com/problems/x?token=123` $\to$ `leetcode.com`).
- **Deep Work Index (DWI)**: Quantifies focus quality penalized by frequency of rapid context switching.
- **Differential Privacy Cohort Analytics**: Injects mathematical Laplace noise ($\epsilon = 0.8$, $\Delta f = 1.0$) into departmental focus statistics with small-cohort suppression ($k \ge 3$) to prevent deanonymization.
- **Right to Erasure**: Permanent 1-click database purge of all personal browsing and focus telemetry.

### 5. Module E: Responsible Examination Review (`/exams` or `/exam-monitor`)
- **Dual Operating Modes**:
  - **Mode 1 (Browser Session Telemetry)**: Deterministic stream of preconfigured session events (`BROWSER_TAB_BLUR`, `FULLSCREEN_DEPARTURE`).
  - **Mode 2 (Local Consented Visual-Event Adapter)**: Authorized browser webcam stream using local canvas boundary detection for `RESTRICTED_ZONE_INCURSION` and `MULTIPLE_OCCUPANTS_DETECTED`. Zero video recording or cloud uploads.
- **Human-in-the-Loop Proctor Audit**: Pending review queue where human proctors inspect observable cues, enter mandatory written audit rationale, and adjudicate outcomes (`DISMISS_FALSE_POSITIVE`, `ESCALATE_TO_INVIGILATOR`).
- **Immutable Audit Trail**: Append-only log (`exam_audit_log`) recording proctor ID, timestamp, and justification for every review action.
- **Strict Ethical AI Invariant**: Explicit disclaimers stating that observations are behavioural indicators requiring human review. Zero automated penalties.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (Strict), Vite 6, Tailwind CSS v4, Lucide Icons, Recharts, React Router v7 |
| **Design System** | Google Stitch Editorial Brutalism (`#faf9f5`, `#1b1c1a`, `#003fe1`, zero-radius orthogonal containers) |
| **Backend** | Node.js v18+, Express v5, TypeScript |
| **Database** | SQLite via `better-sqlite3` (WAL Mode, Foreign Key Cascades, 28 Relational Tables) |
| **Authentication** | Bcrypt (10 salt rounds), HMAC-SHA256 JWT, SQLite `auth_sessions`, `auth_audit_log` |
| **Testing** | Vitest v3, Supertest v7 (190 tests across 12 suites, unit, adversarial, e2e, integration) |

---

## 📊 Automated Test Suite (190 Tests · 100% Passing)

UniVerse features a comprehensive automated test matrix verifying all algorithms, boundary limits, and end-to-end user workflows:

```bash
npm test
```

```text
✓ tests/e2e/tier4_scenarios.test.ts (4 tests)
✓ tests/e2e/tier2_boundaries.test.ts (18 tests)
✓ tests/e2e/tier1_features.test.ts (33 tests)
✓ tests/integration/full_ecosystem.test.ts (20 tests)
✓ tests/adversarial/m1_stress_challenge.test.ts (21 tests)
✓ tests/adversarial/m2_stress_challenge.test.ts (28 tests)
✓ tests/unit/graph_matching.test.ts (13 tests)
✓ tests/unit/energy_carbon.test.ts (9 tests)
✓ tests/unit/privacy_dp.test.ts (10 tests)
✓ tests/e2e/tier3_pairwise.test.ts (8 tests)
✓ tests/adversarial/m2_ride_ui_stress.test.ts (14 tests)
✓ tests/unit/auth.test.ts (12 tests)

Test Files  12 passed (12)
Tests       190 passed (190)
Duration    ~1.70s
```

Detailed test documentation: [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md).

---

## 🧭 Application Routes

### Public & Narrative Portal
- `/` — Product Landing Page (Value proposition, 5 module highlights, orbital constellation SVG).
- `/how-it-works` — 3-Stage Visual Workflow Explainer (Discovery → Transit → Stewardship).
- `/about` — Principles & Ethos (Five Foundational Tenets, comparison matrix vs commercial SaaS).
- `/impact` — Audited Impact & ESG Telemetry ($-44.8\text{ kg CO}_2/\text{wk}$, $68.4\%$ solar compute shift).
- `/onboarding` — Collegiate Node Setup Wizard (3-step role and focus setup).
- `/login` — Campus NetID Sign-In & 1-Click Sandbox Persona Launcher.

### Authenticated Application Workspace
- `/app` — Ecosystem Command Center (Cross-module dashboard with live SQLite metrics and activity feed).
- `/academic` (or `/hub`) — Student Intelligence & Academic Placement Hub.
- `/rides` — Smart Campus Ride-Pooling with Interactive SVG Map.
- `/sustainability` — Sustainable Computing Observatory & Slurm Batch Scheduler.
- `/wellbeing` — Privacy-Preserving Focus Timer & Laplace DP Analytics.
- `/exams` (or `/exam-monitor`) — Responsible Examination Monitoring & Proctor Review Queue.
- `/architecture` — System Architecture Blueprint, Open-Source Reuse Audit, and Algorithm Sandboxes.
- `/settings` — Enclave Keys, Passphrase Management & Active Session Registry.

---

## 🎭 Demonstration Personas

UniVerse includes pre-seeded demonstration personas accessible via 1-click in `/login` or via the top role switcher:

1. **Aarav Sharma (`student`)**: Senior CS undergrad focusing on distributed systems and campus placements.
2. **Vikram Rao (`driver`)**: Campus commuter vanpool captain managing rides and detour envelopes.
3. **Dr. Meenakshi Sundaram (`proctor`)**: Chief examination proctor presiding over the responsible review tribunal.
4. **Campus Operations (`admin`)**: Infrastructure administrator managing cluster power caps and Slurm simulations.

---

## 📜 Full Documentation Suite

- **[Implementation Audit](docs/IMPLEMENTATION_AUDIT.md)**: Verified claims, actual test counts, and system baseline.
- **[Build Plan & Roadmap](docs/BUILD_PLAN.md)**: Engineering methodology, phases, and non-negotiable rules.
- **[Open-Source Component Reuse Report](docs/COMPONENT_REUSE_REPORT.md)**: Rigorous evaluation of ScholarOS, Proctora, Cloud Carbon Footprint, Focuser, and ExMAS.
- **[Third-Party & License Audit](docs/THIRD_PARTY_AND_LICENSE_AUDIT.md)**: Legal analysis, dependency audit, and attribution terms.
- **[Known Technical Limitations](docs/KNOWN_LIMITATIONS.md)**: Honest disclosure of model assumptions, simulations, and boundaries.
- **[System Architecture](docs/ARCHITECTURE.md)**: Full-stack diagrams, database schema relationships, and data flows.
- **[API Contracts](docs/API_CONTRACTS.md)**: Endpoints, types, request/response envelopes, and error codes.
- **[Relational Data Model](docs/DATA_MODEL.md)**: 28 normalized SQLite tables, WAL tuning, indexes, and constraints.
- **[Algorithm Derivations](docs/ALGORITHMS.md)**: Mathematical formulations, complexity proofs, and environmental equations.
- **[Test Plan & Matrix](docs/TEST_PLAN.md)**: Quality assurance matrix covering 190 automated tests.
- **[Team Assignments](docs/TEAM_ASSIGNMENTS.md)**: Multi-agent coordination matrix and actual task execution log.
- **[Judge Demo Script](docs/DEMO_SCRIPT.md)**: 8-step live walkthrough script for technical evaluators.
- **[Hackathon Pitch Deck](docs/PITCH.md)**: Presentation-ready pitch deck covering the problem, solution, technical innovation, and campus impact.

---

## 🔒 Responsible AI & Privacy Guarantees

1. **3-Tier Provenance Badging**: Every metric is labelled as `[ACTUAL INFERENCE]`, `[SIMULATED EVENT]`, or `[ESTIMATED METRIC]`.
2. **Zero Automated Punishment**: No student can ever be penalized automatically based on computer-vision model output.
3. **Differential Privacy Guarantee**: Departmental focus aggregates inject calibrated Laplace noise ($\epsilon = 0.8$, $\Delta f = 1.0$) to prevent tracking individual students.
4. **Right to Erasure**: Permanent deletion endpoint cleanses all personal focus sessions and browsing logs on demand.
5. **Zero Cloud Camera Uploads**: Webcam mode processes frames locally in browser canvas memory without recording or transmitting video to cloud servers.

---

## 🔧 Troubleshooting

- **Port in use (3001 or 5173)**: Kill existing node processes via `lsof -i :3001` or `lsof -i :5173`.
- **Database reset**: To re-seed the SQLite database with clean realistic fixtures, run `npm run seed`.

---

## ⚖️ License
MIT License. Developed for the Hackathon Technical Challenge.
