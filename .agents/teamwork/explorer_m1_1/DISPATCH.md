# Task Assignment: Explorer M1.1 - Database Schema & Backend Architecture

Target: Investigate and detail exact schema specifications, SQLite indexes, seed fixtures, and Express server setup for M1 (Module A & Common Architecture).
Working Directory: /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_1
Original Request Path: /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md
Project Spec Path: /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md

## 2026-10-29T13:00:47Z
You are explorer_m1_1, working on Milestone 1: Core Platform & Academic Hub.
Your working directory is: /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_1
Original request path: /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md
Project plan path: /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md
Parent conversation ID: 5c79500e-0663-460b-8b92-210d35bc7398

MANDATORY FIRST STEP:
Read /Users/divya/Documents/Problem statement /.agents/teamwork/ORIGINAL_REQUEST.md and /Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md.
Also review the survey findings at:
- /Users/divya/Documents/Problem statement /.agents/teamwork/spec_miner_survey_1/handoff.md
- /Users/divya/Documents/Problem statement /.agents/teamwork/spec_miner_survey_2/handoff.md
- /Users/divya/Documents/Problem statement /.agents/teamwork/explorer_survey_3/handoff.md

YOUR TASK:
Formulate the exact technical strategy and implementation blueprint for:
1. Complete relational schema in SQLite using `better-sqlite3` (`server/src/db/schema.sql` and `connection.ts`):
   - Users & roles (student, driver, proctor, admin).
   - Module A: student profiles, skills, placement milestones, mentors, mentorship requests, academic resources, downloads, ratings.
   - Module B: campus nodes, edges, ride offers, ride requests, matches, bookings.
   - Module C: service workloads, telemetry snapshots, scenario configurations.
   - Module D: focus sessions, domain rules, browsing events, cohort aggregates.
   - Module E: exam sessions, observation events, 3-tier provenance, proctor reviews, immutable audit trail.
   - Shared activity log & notifications.
2. Comprehensive seed script (`server/src/db/seed.ts`):
   - Realistic students, mentors with available slots, academic resources across CS courses (DSA, OS, Networks, AI).
   - The 10 campus nodes and 22 road edges with coordinates and baseline distances/times.
   - Pre-configured service workloads and baseline vs eco parameters.
   - Standard domain rules (Productive, Distracting, Neutral).
   - Scheduled exam sessions and test proctor events.
3. Express server architecture (`server/src/index.ts`):
   - Port 3001, CORS configuration, JSON body parsing, request logging, error handling middleware, health check endpoint (`/api/health`).
   - Script runner setup in `package.json` using `tsx` (e.g. `"server": "tsx server/src/index.ts"`).

Output your full technical strategy report to `/Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_1/handoff.md`.
Maintain `progress.md`.
When done, call send_message to "5c79500e-0663-460b-8b92-210d35bc7398".
