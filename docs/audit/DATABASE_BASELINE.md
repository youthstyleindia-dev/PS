# UniVerse Campus OS — Database Baseline & Schema Architecture

**Audited:** 2026-10-30  
**Storage Engine:** SQLite 3 (`better-sqlite3` v13.0.3)  
**Location:** `server/data/universe.db` (Production/Development) / In-Memory (Test Suite)

---

## 1. Engine Configuration & Pragmas

UniVerse uses a robust embedded relational database architecture optimized for concurrency, low latency, and ACID transaction safety:

- **Journal Mode:** `PRAGMA journal_mode = WAL;` (Write-Ahead Logging permits simultaneous readers while a write transaction commits).
- **Foreign Keys:** `PRAGMA foreign_keys = ON;` (Strict referential integrity enabled on every connection).
- **Synchronous:** `PRAGMA synchronous = NORMAL;` (Protects against filesystem corruption without unnecessary I/O stalls).
- **Temp Store:** `PRAGMA temp_store = MEMORY;` (Accelerates in-memory sorting and graph matching joins).
- **Busy Timeout:** 5000ms busy timeout configured to gracefully queue concurrent write transactions under load.

---

## 2. Table Classification & Domain Ownership

### 2.1 Identity & Access Enclave
- `users`: Core identity credentials, bcrypt password hashes, department, year of study.
- `role_assignments`: Multi-role RBAC grants with grantor attribution and revocation timestamps.
- `role_invitations`: Time-limited cryptographic invitation tokens.
- `auth_sessions`: Active JWT sessions with device metadata.
- `auth_audit_log`: Security events (logins, failed attempts, role elevations).
- `password_reset_tokens`: Hashed password reset tokens.

### 2.2 Academic Hub & Placement
- `student_profiles`: Skill radars, placement objectives, readiness scores, sanitized resumes.
- `placement_milestones`: Discrete DSA, system design, and behavioral tasks.
- `placement_records`: Anonymized historical campus placement recruitment records.
- `academic_resources`: Open syllabus materials, lecture notes, cheatsheets, past papers.
- `resource_ratings` & `resource_downloads`: P2P community curation metrics.

### 2.3 Peer Mentorship Network
- `mentors`: Approved senior student mentors, expertise tags, weekly capacity, ratings.
- `mentorship_requests`: P2P requests with proposed topic, preferred slot, and status.
- `mentorship_conversations`: Authenticated 1-on-1 private messaging channels.
- `mentorship_messages`: Sanitized text messages restricted to authorized participants.

### 2.4 Campus Social Feed & Communities
- `feed_posts`: Categorized posts (general, question, project, event, announcement, resource, ride).
- `feed_comments`: Hierarchical discussion comments and replies.
- `feed_reactions`: Unique user reaction ledger preventing duplicate likes.
- `feed_bookmarks`: Private saved posts.
- `feed_follows`: Peer follow relationships.
- `feed_reports`: Moderation report queue for community safety.
- `communities` & `community_memberships`: Interest-based campus clubs and groups.
- `campus_events` & `event_registrations`: Academic workshops and hackathons with capacity tracking.
- `campus_announcements`: Official university administrative notices.

### 2.5 Campus Operations & Facilities
- `campus_locations`: Canonical map nodes, buildings, labs, hostels, transit stops.
- `facility_issues`: Hostel/infrastructure defect reports with urgency and triage status.

### 2.6 Smart Ride-Pooling
- `campus_nodes` & `campus_edges`: Topological graph representation of campus transit routes.
- `ride_offers`: Driver route corridors, departure times, and seat capacity.
- `ride_requests`: Student mobility search queries and pickup/drop-off nodes.
- `ride_matches`: Dijkstra-computed multi-hop passenger pairings.
- `ride_bookings`: Confirmed passenger reservations with atomic capacity decrements.

### 2.7 Sustainable Computing
- `service_workloads`: Campus cluster HPC Slurm jobs and compute intensity.
- `telemetry_snapshots`: Carbon intensity (gCO₂/kWh), PUE, and grid renewable mix.
- `scenario_configurations`: Clean energy simulation parameters.

### 2.8 Digital Wellbeing (Sovereign & Private)
- `focus_sessions`: Deep work intervals and calculated Deep Work Index (DWI).
- `domain_rules`: Local distraction filter rules.
- `browsing_events`: Sanitized browsing duration without raw URLs or tracking cookies.
- `cohort_aggregates`: Differential Privacy ($\epsilon=0.80$) aggregated statistics with $k < 5$ suppression.

### 2.9 Responsible Examination Monitoring
- `exam_sessions`: Assigned examination sessions and candidate envelopes.
- `exam_session_assignments`: Proctor assignment mapping.
- `observation_events`: Timestamped CV observations (head pose, gaze away, unauthorized person) with provenance labels (`ACTUAL_INFERENCE`, `SIMULATED_EVENT`, `ESTIMATED_METRIC`).
- `exam_audit_log`: Immutable log of proctor review dispositions (`DISMISS_BENIGN_BEHAVIOR`, `DISMISS_FALSE_POSITIVE`, `CONFIRM_SUSPICIOUS`).
- `vision_model_registry`: Model versioning and hashes.
- `exam_vision_consents`: Student explicit exam privacy consent records.

### 2.10 Cloud Generative AI Copilot
- `assistant_conversations`: Private assistant chat sessions.
- `assistant_messages`: Prompt and response exchanges with grounded citations.
- `assistant_action_confirmations`: Proposed actions requiring explicit user confirmation.
- `assistant_usage_daily`: Bounded daily request quotas.

---

## 3. Database Migration & Backup Strategy

1. **Pre-Migration Backup:**
   - Command: `cp server/data/universe.db server/data/universe.db.backup-$(date +%s)`
2. **Deterministic Seed & Reset:**
   - `scripts/seed-demo` populates realistic, fictional student, mentor, driver, warden, proctor, and admin data.
   - `scripts/reset-demo` wipes transient records while enforcing `NODE_ENV === 'development' || NODE_ENV === 'test'`.
