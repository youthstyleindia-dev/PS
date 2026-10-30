# UniVerse: An Intelligent, Sustainable, and Privacy-Aware Campus Operating System

[![Tests](https://img.shields.io/badge/Tests-283%20Passing%20(20%20Suites)-brightgreen?style=flat-square)](./docs/exam-ml/TEST_RESULTS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?style=flat-square)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5-lightgrey?style=flat-square)](https://expressjs.com/)
[![Google Gen AI](https://img.shields.io/badge/Google%20Gen%20AI-%40google%2Fgenai%20v2.32-007fff?style=flat-square)](https://github.com/google-gemini/deprecations)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square)](https://www.sqlite.org/)
[![RBAC](https://img.shields.io/badge/RBAC-7%20Roles%20Enforced-orange?style=flat-square)](./docs/ROLE_PERMISSION_MATRIX.md)
[![Privacy-First Vision](https://img.shields.io/badge/Vision%20Privacy-Zero%20Raw%20Frames-brightgreen?style=flat-square)](./docs/exam-ml/PRIVACY_AND_CONSENT.md)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> *"One Campus. One Connected Experience."*  
> A complete, full-stack campus operating platform that unifies academic readiness, senior Machine Learning mentorship, a grounded cloud AI copilot, real-time community feeds, smart ride-pooling, sustainable computing, sovereign wellbeing, and ethical human-in-the-loop examination monitoring.

---

## 🚀 Quick Start

UniVerse runs completely self-contained on macOS, Linux, or Windows with SQLite WAL persistence:

```bash
# 1. Install root and client dependencies
npm install && cd client && npm install && cd ..

# 2. Run automated test suite (283 tests across 20 suites in ~6 seconds)
npm test

# 3. Seed synthetic demo dataset with verified senior mentors and campus feeds
npm run db:reset:demo

# 4. Verify synthetic dataset invariants and table integrity
npm run db:verify

# 5. Start concurrent development server (Client on :5173, Server on :3001)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🔐 Demo Personas & Credentials

All accounts use pre-seeded password: **`universe2026`** (or `CampusPass123!`). Every persona is locked into its authorized workspace:

| Persona | Role | Email | Focus & Specialization | Authorized Workspaces |
| :--- | :--- | :--- | :--- | :--- |
| **Aarav Mehta** | `student` | `aarav.mehta@campus.edu` | Year 2 CSE; ML research & internship prep | Scholar Workspace, Feed, Mentors, Copilot, Carpool, Focus |
| **Riya Shah** | `student` (Mentor) | `riya.shah@campus.edu` | Year 4 CSE; Incoming ML Engineer at Google DeepMind | Senior Mentorship Network, Feed, Private Chat Enclave |
| **Kabir Patel** | `student` (Mentor) | `kabir.patel@campus.edu` | Year 4 CSE; Incoming Systems Engineer at Microsoft | Senior Mentorship Network, Slurm HPC, Distributed Systems |
| **Neha Rao** | `student` (Mentor) | `neha.rao@campus.edu` | Year 4 AI & DS; Data Scientist at AWS | NLP & Transformers, Mentorship Commons |
| **Diya Patel** | `student` (Mentor) | `diya.patel@campus.edu` | Year 4 CSE; LeetCode 150 & Full-Stack | Placement Readiness, Peer Code Review |
| **Dr. Priya Patel** | `ta_faculty` | `dr.patel@campus.edu` | AI Lab Director; Graduate Mentor | Faculty Overview, Announcements, Course Publisher |
| **Vikram Rao** | `driver` | `vikram.rao@campus.edu` | Transit Driver; EV Carpool Captain | Transit Dispatch, Route Publishing, Avoided $CO_2$ |
| **Prof. M. Sundaram** | `proctor` | `m.sundaram@campus.edu` | Exam Integrity Tribunal Chair | Human Review Tribunal, Audit Trail, No Auto-Disqualification |
| **Campus Warden** | `warden` | `warden@campus.edu` | Residential & Safety Warden | Residential Hall Overview, Campus Notices, Transit Safety |
| **IT Administrator** | `admin` | `admin@campus.edu` | Root System Operations | System Governance, Slurm Telemetry, Audit Logs |

---

## 🏛️ Full Campus Operating Environment

UniVerse unites the entire university experience under the Google Stitch editorial collegiate identity (`#FAF9F5` Warm Paper, `#1B1C1A` Ink Black, `#003FE1` Cobalt, zero-radius orthogonal borders):

### 1. Community & Campus Feed (`/feed`)
- **Categorized Feeds:** Filter between Academic, Mobility, Wellbeing, Sustainability, and Official Notices.
- **Structured Post Types:** Announcements, Questions, Opportunities, Project Updates, and Discussions.
- **Server Role Guards:** Only verified Faculty, Wardens, or Admins can post official announcements (students receive `403 Forbidden`).
- **Interactive Engagement:** Idempotent likes, nested comments, personal bookmarks, and moderation flags.

### 2. Senior Mentorship Network (`/mentors`)
- **Explainable Match Ranking:** Matches underclassmen with experienced seniors in Machine Learning, PyTorch, Systems, and DSA using explainable scoring.
- **Mentorship Request State Machine:** Send guidance requests with preferred slots; mentors can accept or decline with notes.
- **Auto-Provisioned Private Chat:** Accepting a request automatically creates a private conversation channel strictly isolated from third parties (`403 Forbidden`).

### 3. UniVerse AI / Campus Copilot (`/assistant` & Floating Pill)
- **Official Google Gen AI SDK:** Powered by `@google/genai` (v2.32.0) with model `gemini-2.5-flash`.
- **Grounded Campus Retrieval (RAG):** Context is pulled in real time from authorized SQLite tables across mentors, events, resources, feeds, directory, and carpools. Never hallucinates fake institutional policies or non-existent seniors.
- **Two-Phase Action Confirmations:** When asked to take an action (e.g. register for an event or request a mentor), the AI emits a `<<<PROPOSED_ACTION:...>>>` card. The server holds it pending until the user explicitly clicks **"Confirm & Execute"**.
- **Transparent Offline Fallback:** If `GEMINI_API_KEY` is not configured, the copilot explicitly badges itself as *Local Offline Grounding* rather than faking live cloud AI.

### 4. Campus Events & Guild Communities (`/events`)
- **Event RSVPs:** Live capacity tracking and one-click RSVP toggles for AI workshops, hackathons, and research talks.
- **Student Guilds & Clubs:** Discover and join active student communities (AI Club, ACM Chapter, Green Campus).
- **Facilities Directory:** Search campus buildings, AI labs, libraries, and operating hours.

### 5. Smart Campus Ride-Pooling (`/rides`)
- **Topological Campus Map:** 10-node campus graph with 30 directed edges and peak-hour congestion multipliers.
- **Dijkstra Shortest Path:** Fast topological routing with maximum detour constraints ($\le 35\%$).
- **Carbon Accounting:** Calculates avoided vehicle emissions ($0.142\text{ kg CO}_2\text{e/km}$) and $40\%$ passenger savings.

### 6. Sustainable Computing Observatory (`/sustainability`)
- **Non-Linear Server Power Model:** $P(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times (U/100)^{1.25}$.
- **Slurm Solar Scheduling:** Schedules heavy CUDA/PyTorch training during campus solar peak hours (10:00–14:00).
- **Eco-Optimization Comparison:** Baseline PUE 1.75 vs. Eco PUE 1.20 showing $-45.9\%$ energy reduction.

### 7. Sovereign Digital Wellbeing (`/wellbeing`)
- **Voluntary Focus Timer:** Pomodoro sessions tracking deep work index without surveillance.
- **Zero-Telemetry Hostname Sanitization:** URL parser strips all query strings and private tokens.
- **Laplace Differential Privacy:** Adds mathematical noise ($\varepsilon = 0.8$, $\Delta f = 1.0$) with small cohort suppression ($k \ge 3$) to prevent individual deanonymization.
- **GDPR Right to Erasure:** 1-click database purge of all personal focus records.

### 8. Responsible Examination Review (`/exams`)
- **Ethical Human-in-the-Loop Tribunal:** Observable client events (browser blur, full-screen departure, orientation dwell) are recorded with non-accusatory notices.
- **Zero Algorithmic Disqualifications:** Evaluators must submit a written rationale before resolving incidents.

---

## 🧪 Comprehensive Verification & Test Matrix

UniVerse includes 20 comprehensive automated test suites covering every tier:

```bash
npm test
```

```
Test Files  20 passed (20)
Tests       283 passed (283)
Time        ~6.1 seconds
```

1. `tests/unit/auth.test.ts` (12 tests) — Password hashing, JWT signing, role resolution.
2. `tests/security/role_matrix.test.ts` (25 tests) — Role isolation across 6 canonical personas.
3. `tests/e2e/tier1_features.test.ts` (33 tests) — Core module read/write workflows.
4. `tests/e2e/tier2_boundaries.test.ts` (18 tests) — Boundary conditions and edge cases.
5. `tests/adversarial/m1_stress_challenge.test.ts` (21 tests) — Concurrency, SQL injection shielding, foreign key cascade deletions.
6. `tests/adversarial/m2_stress_challenge.test.ts` (28 tests) — Dijkstra graph invariants and atomic booking decrement.
7. `tests/e2e/tier3_pairwise.test.ts` (8 tests) — Inter-module combinatorial interactions.
8. `tests/e2e/tier4_scenarios.test.ts` (4 tests) — End-to-end multi-persona user journeys.
9. `tests/integration/full_ecosystem.test.ts` (20 tests) — Connected full-campus integration.
10. `tests/e2e/campus_feed.test.ts` (8 tests) — Feed creation, announcement privilege guards, likes, comments, bookmarks.
11. `tests/integration/exam_monitor_api.test.ts` (12 tests) — Exam observation ingestion and audit trail.
12. `tests/security/audit_remediation.test.ts` (14 tests) — Atomic seat exhaustion and security fixes.
13. `tests/e2e/senior_mentorship.test.ts` (6 tests) — ML search filters, explainable match breakdown, request/acceptance, private chat.
14. `tests/adversarial/m2_ride_ui_stress.test.ts` (14 tests) — Ride UI resilience and offline fallbacks.
15. `tests/security/role_isolation_matrix.test.ts` (8 tests) — 7-role zero-escalation matrix.
16. `tests/e2e/campus_copilot.test.ts` (5 tests) — Grounded retrieval, action cards, conversation isolation, injection defense.
17. `tests/unit/graph_matching.test.ts` (13 tests) — Dijkstra shortest path & DARP matching.
18. `tests/unit/exam_vision_algorithms.test.ts` (15 tests) — Vision dwell & bounded angle evaluation.
19. `tests/unit/privacy_dp.test.ts` (10 tests) — Laplace noise & differential privacy guarantee.
20. `tests/unit/energy_carbon.test.ts` (9 tests) — Non-linear SPECpower & avoided carbon equations.

---

## 📖 Complete Documentation Sitemap

- [Live Demonstration Script (10–12 Mins)](./docs/FULL_CAMPUS_DEMO_SCRIPT.md)
- [System Architecture Specification](./docs/ARCHITECTURE.md)
- [Relational SQLite Data Model](./docs/DATA_MODEL.md)
- [Role & Permission Matrix](./docs/ROLE_PERMISSION_MATRIX.md)
- [Cloud Generative AI & Grounding](./docs/CLOUD_AI.md)
- [Campus Feed & Senior Mentorship](./docs/FEED_AND_MENTORSHIP.md)
- [Synthetic Seed Dataset Specification](./docs/SEED_DATA.md)
- [API Contracts & Endpoints](./docs/API_CONTRACTS.md)
- [Test Plan & Verification Topology](./docs/TEST_PLAN.md)
- [Third Party & License Notices](./docs/THIRD_PARTY_AND_LICENSE_AUDIT.md)

---

## 📜 License

UniVerse is licensed under the [MIT License](LICENSE).
All external repositories evaluated are documented in [docs/COMPONENT_REUSE_REPORT.md](./docs/COMPONENT_REUSE_REPORT.md).
