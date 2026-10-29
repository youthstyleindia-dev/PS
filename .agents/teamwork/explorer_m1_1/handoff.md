# Technical Strategy & Implementation Blueprint: Database Schema, Seed Fixtures & Express Server Architecture

**Document**: Milestone 1 Explorer Investigation Handoff (`explorer_m1_1`)  
**Target Milestone**: Milestone 1: Core Platform & Academic Hub  
**Author**: `explorer_m1_1`  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_1`  
**Parent Conversation ID**: `5c79500e-0663-460b-8b92-210d35bc7398`  
**Date**: 2026-10-29T13:12:00Z  

---

## 1. Observation

### 1.1 Direct Repository & File System Inspection
1. **Workspace Root**: `/Users/divya/Documents/Problem statement ` (contains a trailing space in the folder name).
2. **Existing Project State**:
   - `server/` directory exists but contains only `server/tsconfig.json`. The directory `server/src/` does not yet exist.
   - Zero database files (`*.db`, `*.sqlite`, `*.sql`) currently exist in the repository.
   - `package.json` specifies:
     - `"better-sqlite3": "^13.0.3"`
     - `"express": "^5.3.0"`
     - `"cors": "^2.8.6"`
     - `"dotenv": "^18.0.9"`
     - `"server:dev": "ts-node server/src/index.ts"` (Line 8)
     - `"seed": "ts-node server/src/db/seed.ts"` (Line 14)
   - Runtime dependencies verification:
     - Node version: `v24.16.0`
     - Better-SQLite3: `13.0.3` installed in root `node_modules` (verified running SQLite version `3.53.4` via native CJS binding).

### 1.2 Tooling Incompatibilities & Errors Observed
1. **`ts-node` vs TypeScript 7 Breakdown**:
   - Executing `npx ts-node -e "console.log('test')"` fails immediately with:
     ```text
     TypeError: Cannot read properties of undefined (reading 'fileExists')
         at readConfig (.../node_modules/ts-node/dist/configuration.js:91:33)
     ```
   - *Cause*: `ts-node@10.9.2` accesses deprecated internal APIs of `typescript` which were reorganized in the installed TypeScript version.
   - *Verified Solution*: `npx --yes tsx` executes TypeScript flawlessly in Node 24 without any configuration overhead (`npx --yes tsx -e "console.log('TSX works!')"` exited with code 0).
2. **`moduleResolution: node` Deprecation in `server/tsconfig.json`**:
   - Executing `tsc -p server/tsconfig.json` produces:
     ```text
     server/tsconfig.json:5:25 - error TS5108: Option 'moduleResolution=node10' has been removed. Please remove it from your configuration.
     server/tsconfig.json:11:5 - error TS5011: The common source directory of 'tsconfig.json' is '..'. The 'rootDir' setting must be explicitly set.
     ```
   - *Fix*: Remove `"moduleResolution": "node"` and set `"rootDir": "src"`.
3. **SQLite SQL Syntax Requirements**:
   - When testing SQLite DDL execution via `better-sqlite3`:
     - Double quotes around strings in `CHECK(role IN ("student", ...))` caused `SqliteError: no such column: "student" - should this be a string literal in single-quotes?` (SQLite treats double quotes as column identifiers).
     - Function calls like `DEFAULT datetime('now')` caused `SqliteError: default value of column [created_at] is not constant`.
     - *Verified Resolution*: Standardize on single quotes (`'student'`) for all enum CHECK literals and `DEFAULT CURRENT_TIMESTAMP` for timestamp columns.
4. **Express 5 Wildcard Routing Incompatibility**:
   - In Express 5 (`express@5.3.0` which integrates `path-to-regexp` v0.1.x / v8), calling `app.use('/api/*', ...)` throws a runtime exception:
     ```text
     TypeError: Missing parameter name at index 6: /api/*; visit https://git.new/pathToRegexpError for info
     ```
   - In Express 5, wildcards cannot be anonymous.
   - *Verified Resolution*: Use standard un-parameterized catch-all middleware `app.use((req: Request, res: Response) => { res.status(404).json(...); })`.

---

## 2. Logic Chain

1. **Premise 1 (Single Unified Persistent Relational Store)**: Per `ORIGINAL_REQUEST.md` (R1) and `orchestrator/PROJECT.md` (Section Architecture & Common Database Contract), all 5 modules (Student Intelligence Hub, Ride-Pooling, Sustainability Observatory, Digital Wellbeing, Responsible Exam Monitoring) must be unified into a single coherent application backed by one persistent SQLite database located at `server/data/universe.db`.
2. **Premise 2 (Zero-Interruption Monolithic Migration)**: Rather than fragmented incremental schemas that risk foreign key collisions or migration order issues, a comprehensive, complete DDL (`server/src/db/schema.sql`) covering all 26 relational entities with strict CHECK constraints, indexes, and cascading deletes ensures that all modules can be built and tested concurrently without altering table definitions.
3. **Premise 3 (Seed Data Realism & Determinism)**: Automated end-to-end testing and manual UI demonstration require realistic seed fixtures:
   - Real students with readiness scores and milestone checklists.
   - Peer mentors with verified corporate offers (Google, Microsoft, Amazon) and available booking slots.
   - Academic study resources across standard Computer Science courses (CS301 DSA, CS302 OS, CS303 Networks, CS304 AI).
   - The 10 campus nodes and 22 road edges with exact GIS/canvas coordinates and baseline distance/time metrics.
   - Pre-configured sustainable computing workloads with non-linear power telemetry.
   - Standard domain classification rules and focus sessions with Deep Work Index calculations.
   - Examination sessions with three-tier labeled observation events and immutable proctor audit logs.
4. **Premise 4 (Express 5 Architecture & CORS)**: The client application (Vite running on port 5173 with proxy targeting port 3001) requires CORS with credentials enabled, JSON body parsing with large payload capacity (10MB for frame snapshots/telemetry), centralized request logging, an automated health diagnostic endpoint (`/api/health`), and a centralized error-handling middleware returning standardized error JSON payloads.
5. **Premise 5 (Runtime Reliability)**: Because `ts-node` crashes due to TypeScript incompatibility, updating scripts in `package.json` to utilize `tsx` guarantees that developers, subagents, and automated CI runners can execute `npm run server:dev` and `npm run seed` reliably.

---

## 3. Caveats

1. **In-Memory vs File Database for Testing**: In automated unit tests, passing `:memory:` to `getDb()` creates an isolated in-memory database. However, each call to `new Database(':memory:')` creates a *distinct* instance. The database singleton in `connection.ts` caches the instance, but test teardowns must call `closeDb()` to reset state between test suites.
2. **Local-First Privacy Guardrail for Module D**: Browsing activity events in `browsing_events` must strictly record the domain hostname (e.g. `'github.com'`). Full URL paths, query parameters (`?auth=...`), and form inputs must be stripped before SQL insertion.
3. **Responsible AI Guardrail for Module E**: The schema explicitly prevents automated penalties. Table `observation_events` only stores advisory flags with review status `PENDING_REVIEW`, `DISMISS_FALSE_POSITIVE`, `DISMISS_BENIGN_BEHAVIOR`, or `ESCALATE_TO_INVIGILATOR`. Table `exam_audit_log` is strictly append-only.

---

## 4. Conclusion & Technical Implementation Blueprint

The following blueprint provides the exact, production-ready specifications for the database schema, connection manager, seed script, Express server, and configuration files.

### 4.1 SQLite Relational Schema (`server/src/db/schema.sql`)
The schema contains **26 normalized tables** and **19 performance indexes** covering all 5 modules and shared services.

```sql
PRAGMA foreign_keys = ON;

-- ==============================================================================
-- 1. USERS & ACCESS MANAGEMENT (Shared Core)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL CHECK(role IN ('student', 'driver', 'proctor', 'admin')),
  department TEXT,
  year_of_study INTEGER,
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. MODULE A: STUDENT INTELLIGENCE & ACADEMIC HUB
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON string array
  interests TEXT NOT NULL DEFAULT '[]', -- JSON string array
  target_role TEXT,
  target_company TEXT,
  placement_goals TEXT,
  readiness_score INTEGER NOT NULL DEFAULT 0 CHECK(readiness_score >= 0 AND readiness_score <= 100),
  resume_url TEXT,
  gpa REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_milestones (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('DSA', 'SystemDesign', 'SoftSkills', 'Resume', 'MockInterview')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  target_date TEXT,
  completed_at TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_offer TEXT NOT NULL,
  domain TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON string array
  available_slots TEXT NOT NULL DEFAULT '[]', -- JSON string array
  max_mentees INTEGER NOT NULL DEFAULT 5,
  active_mentees INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 5.0 CHECK(rating >= 0.0 AND rating <= 5.0),
  review_count INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  notes TEXT,
  preferred_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
  mentor_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Notes', 'PYQ', 'Syllabus', 'Guide', 'Cheatsheet')),
  semester INTEGER NOT NULL DEFAULT 5,
  department TEXT NOT NULL DEFAULT 'Computer Science',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_kb INTEGER NOT NULL DEFAULT 1024,
  uploader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0.0 CHECK(rating >= 0.0 AND rating <= 5.0),
  rating_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON string array
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_ratings (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_id, user_id)
);

CREATE TABLE IF NOT EXISTS resource_downloads (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  downloaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. MODULE B: SMART CAMPUS RIDE-POOLING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS campus_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  coord_x REAL NOT NULL,
  coord_y REAL NOT NULL,
  lat REAL,
  lng REAL,
  is_hub INTEGER NOT NULL DEFAULT 0 CHECK(is_hub IN (0, 1))
);

CREATE TABLE IF NOT EXISTS campus_edges (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL REFERENCES campus_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES campus_nodes(id) ON DELETE CASCADE,
  distance_km REAL NOT NULL,
  base_time_mins REAL NOT NULL,
  road_type TEXT NOT NULL CHECK(road_type IN ('CAMPUS_ROAD', 'EV_SHUTTLE_LANE', 'PEDESTRIAN_ACCESS')),
  speed_limit_kmh REAL NOT NULL DEFAULT 25.0,
  current_congestion REAL NOT NULL DEFAULT 1.0 CHECK(current_congestion >= 1.0),
  is_bidirectional INTEGER NOT NULL DEFAULT 1 CHECK(is_bidirectional IN (0, 1))
);

CREATE TABLE IF NOT EXISTS ride_offers (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_node_id TEXT NOT NULL REFERENCES campus_nodes(id),
  destination_node_id TEXT NOT NULL REFERENCES campus_nodes(id),
  departure_time TEXT NOT NULL,
  total_seats INTEGER NOT NULL CHECK(total_seats >= 1 AND total_seats <= 6),
  available_seats INTEGER NOT NULL CHECK(available_seats >= 0 AND available_seats <= total_seats),
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('EV_CAR', 'CAMPUS_SHUTTLE', 'PETROL_CAR', 'E_GOLF_CART')),
  max_detour_ratio REAL NOT NULL DEFAULT 0.35,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
  planned_route TEXT NOT NULL DEFAULT '[]', -- JSON array of node IDs
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ride_requests (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_node_id TEXT NOT NULL REFERENCES campus_nodes(id),
  destination_node_id TEXT NOT NULL REFERENCES campus_nodes(id),
  desired_departure_time TEXT NOT NULL,
  seats_needed INTEGER NOT NULL DEFAULT 1 CHECK(seats_needed >= 1 AND seats_needed <= 4),
  max_detour_ratio REAL NOT NULL DEFAULT 0.40,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ride_matches (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES ride_offers(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  matched_path TEXT NOT NULL, -- JSON array of node IDs
  driver_solo_distance_km REAL NOT NULL,
  passenger_solo_distance_km REAL NOT NULL,
  pooled_distance_km REAL NOT NULL,
  shared_distance_km REAL NOT NULL,
  detour_distance_km REAL NOT NULL,
  detour_ratio REAL NOT NULL,
  carbon_saved_kg REAL NOT NULL,
  driver_earnings REAL NOT NULL,
  passenger_fare REAL NOT NULL,
  passenger_savings REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('proposed', 'confirmed', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ride_bookings (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES ride_matches(id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL REFERENCES users(id),
  seats_booked INTEGER NOT NULL DEFAULT 1,
  fare_paid REAL NOT NULL,
  booked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. MODULE C: SUSTAINABLE COMPUTING OBSERVATORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS service_workloads (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  baseline_replicas INTEGER NOT NULL DEFAULT 4,
  current_replicas INTEGER NOT NULL DEFAULT 4,
  target_rps REAL NOT NULL DEFAULT 150.0,
  current_rps REAL NOT NULL DEFAULT 150.0,
  is_eco_optimized INTEGER NOT NULL DEFAULT 0 CHECK(is_eco_optimized IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES service_workloads(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_count INTEGER NOT NULL,
  rps REAL NOT NULL,
  avg_latency_ms REAL NOT NULL,
  p95_latency_ms REAL NOT NULL,
  cpu_utilization_pct REAL NOT NULL CHECK(cpu_utilization_pct >= 0 AND cpu_utilization_pct <= 100),
  gpu_utilization_pct REAL NOT NULL DEFAULT 0.0 CHECK(gpu_utilization_pct >= 0 AND gpu_utilization_pct <= 100),
  memory_mb REAL NOT NULL,
  power_watts REAL NOT NULL,
  pue REAL NOT NULL DEFAULT 1.35,
  grid_carbon_intensity_g_per_kwh REAL NOT NULL DEFAULT 475.0,
  carbon_emissions_g_per_hr REAL NOT NULL,
  provenance TEXT NOT NULL DEFAULT 'SIMULATED_WORKLOAD' CHECK(provenance IN ('SIMULATED_WORKLOAD', 'ESTIMATED_METRIC', 'ACTUAL_MEASUREMENT'))
);

CREATE TABLE IF NOT EXISTS scenario_configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  dynamic_frequency_scaling INTEGER NOT NULL DEFAULT 0 CHECK(dynamic_frequency_scaling IN (0, 1)),
  idle_server_shutdown INTEGER NOT NULL DEFAULT 0 CHECK(idle_server_shutdown IN (0, 1)),
  temporal_solar_shifting INTEGER NOT NULL DEFAULT 0 CHECK(temporal_solar_shifting IN (0, 1)),
  query_caching INTEGER NOT NULL DEFAULT 0 CHECK(query_caching IN (0, 1)),
  cooling_pue REAL NOT NULL DEFAULT 1.75,
  estimated_daily_kwh REAL NOT NULL DEFAULT 285.4,
  estimated_daily_carbon_kg REAL NOT NULL DEFAULT 135.5,
  estimated_monthly_cost REAL NOT NULL DEFAULT 2711.30,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. MODULE D: PRIVACY-AWARE DIGITAL WELLBEING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT,
  target_duration_mins INTEGER NOT NULL DEFAULT 45,
  actual_duration_mins INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
  goal TEXT,
  deep_work_index REAL DEFAULT 0.0 CHECK(deep_work_index >= 0 AND deep_work_index <= 100),
  active_focus_ratio REAL DEFAULT 0.0 CHECK(active_focus_ratio >= 0 AND active_focus_ratio <= 1.0),
  context_switch_rate REAL DEFAULT 0.0,
  productive_time_secs INTEGER NOT NULL DEFAULT 0,
  distracting_time_secs INTEGER NOT NULL DEFAULT 0,
  neutral_time_secs INTEGER NOT NULL DEFAULT 0,
  total_switches INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domain_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL for campus default rules
  domain_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Productive', 'Distracting', 'Neutral')),
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK(is_custom IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS browsing_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  sanitized_domain TEXT NOT NULL, -- Hostname ONLY; no paths/queries
  category TEXT NOT NULL CHECK(category IN ('Productive', 'Distracting', 'Neutral')),
  duration_seconds INTEGER NOT NULL CHECK(duration_seconds >= 0),
  context_switch INTEGER NOT NULL DEFAULT 0 CHECK(context_switch IN (0, 1)),
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cohort_aggregates (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  date TEXT NOT NULL,
  participant_count INTEGER NOT NULL,
  is_suppressed INTEGER NOT NULL DEFAULT 0 CHECK(is_suppressed IN (0, 1)), -- k-anonymity (k >= 5)
  raw_avg_focus_mins REAL,
  dp_noisy_avg_focus_mins REAL, -- Laplace noise added (epsilon = 0.80)
  raw_avg_dwi REAL,
  dp_noisy_avg_dwi REAL,
  epsilon_used REAL NOT NULL DEFAULT 0.80,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. MODULE E: RESPONSIBLE EXAMINATION MONITORING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  actual_start TEXT,
  actual_end TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'reviewed')),
  candidate_station_zone TEXT NOT NULL DEFAULT '{"x": 100, "y": 80, "w": 440, "h": 320}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observation_events (
  id TEXT PRIMARY KEY,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offset_seconds REAL NOT NULL DEFAULT 0.0,
  event_type TEXT NOT NULL CHECK(event_type IN ('HEAD_POSE_DEVIATION', 'UNAUTHORIZED_PERSON', 'ABSENCE_FROM_SEAT', 'MULTIPLE_FACES', 'GAZE_AWAY')),
  confidence_score REAL NOT NULL CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0),
  frame_snapshot_url TEXT,
  provenance TEXT NOT NULL CHECK(provenance IN ('ACTUAL_INFERENCE', 'SIMULATED_EVENT', 'ESTIMATED_METRIC')),
  metrics_payload TEXT NOT NULL DEFAULT '{}',
  review_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(review_status IN ('PENDING_REVIEW', 'DISMISS_FALSE_POSITIVE', 'DISMISS_BENIGN_BEHAVIOR', 'ESCALATE_TO_INVIGILATOR')),
  proctor_notes TEXT,
  reviewer_id TEXT REFERENCES users(id),
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Immutable Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS exam_audit_log (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES observation_events(id) ON DELETE CASCADE,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  proctor_id TEXT NOT NULL REFERENCES users(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('DISMISS_FALSE_POSITIVE', 'DISMISS_BENIGN_BEHAVIOR', 'ESCALATE_TO_INVIGILATOR')),
  reason_code TEXT NOT NULL,
  proctor_notes TEXT NOT NULL, -- Mandatory
  timestamp_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. SHARED NOTIFICATION & ACTIVITY SYSTEM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK(module IN ('hub', 'rides', 'sustainability', 'wellbeing', 'exams', 'system')),
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT NOT NULL CHECK(module IN ('hub', 'rides', 'sustainability', 'wellbeing', 'exams', 'system')),
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'alert')),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  link_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_milestones_student ON placement_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_mentors_domain ON mentors(domain);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee ON mentorship_requests(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_academic_resources_course ON academic_resources(course_code);
CREATE INDEX IF NOT EXISTS idx_academic_resources_cat ON academic_resources(category);
CREATE INDEX IF NOT EXISTS idx_campus_edges_source ON campus_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_campus_edges_target ON campus_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON ride_offers(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_service ON telemetry_snapshots(service_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_events_session ON browsing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_observation_events_session ON observation_events(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_observation_events_status ON observation_events(review_status);
CREATE INDEX IF NOT EXISTS idx_exam_audit_event ON exam_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
```

---

### 4.2 Database Connection Singleton (`server/src/db/connection.ts`)

```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDb(customPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'server/data/universe.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Database(dbPath);

  // WAL mode & referential integrity
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('temp_store = MEMORY');

  return dbInstance;
}

export function initDb(schemaPath?: string): Database.Database {
  const db = getDb();
  const searchPaths = [
    schemaPath,
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(process.cwd(), 'server/src/db/schema.sql')
  ].filter(Boolean) as string[];

  let loaded = false;
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      const schemaSql = fs.readFileSync(p, 'utf-8');
      db.exec(schemaSql);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    throw new Error(`Schema file not found in search paths: ${searchPaths.join(', ')}`);
  }

  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

---

### 4.3 Express Server Setup (`server/src/index.ts`)

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getDb, initDb, closeDb } from './db/connection';

// Dynamically or statically mount route handlers
let hubRoutes: any = null;
let ridesRoutes: any = null;
let sustainabilityRoutes: any = null;
let wellbeingRoutes: any = null;
let examsRoutes: any = null;
let commonRoutes: any = null;

try { hubRoutes = require('./routes/hub.routes').default || require('./routes/hub.routes'); } catch (_) {}
try { ridesRoutes = require('./routes/rides.routes').default || require('./routes/rides.routes'); } catch (_) {}
try { sustainabilityRoutes = require('./routes/sustainability.routes').default || require('./routes/sustainability.routes'); } catch (_) {}
try { wellbeingRoutes = require('./routes/wellbeing.routes').default || require('./routes/wellbeing.routes'); } catch (_) {}
try { examsRoutes = require('./routes/exams.routes').default || require('./routes/exams.routes'); } catch (_) {}
try { commonRoutes = require('./routes/common.routes').default || require('./routes/common.routes'); } catch (_) {}

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    const tables = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'UniVerse Campus OS Backend',
      port: PORT,
      database: {
        connected: result?.alive === 1,
        mode: 'better-sqlite3 / WAL',
        tableCount: tables?.count || 0
      },
      version: '1.0.0'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Routes
if (hubRoutes) app.use('/api/hub', hubRoutes);
if (ridesRoutes) app.use('/api/rides', ridesRoutes);
if (sustainabilityRoutes) app.use('/api/sustainability', sustainabilityRoutes);
if (wellbeingRoutes) app.use('/api/wellbeing', wellbeingRoutes);
if (examsRoutes) app.use('/api/exams', examsRoutes);
if (commonRoutes) {
  app.use('/api/activity', commonRoutes);
  app.use('/api/notifications', commonRoutes);
  app.use('/api/users', commonRoutes);
}

// 404 Handler (Express 5 compatible)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    status
  });
});

export function startServer(): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      initDb();
      const server = app.listen(PORT, () => {
        console.log(`🚀 UniVerse Server listening at http://localhost:${PORT}`);
        resolve(server);
      });

      const shutdown = () => {
        server.close(() => {
          closeDb();
          process.exit(0);
        });
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      reject(err);
    }
  });
}

if (require.main === module || process.argv[1]?.includes('index')) {
  startServer();
}

export default app;
```

---

### 4.4 Script Runner Configuration (`package.json` & `server/tsconfig.json`)

1. **`package.json` scripts update**:
   ```json
   "scripts": {
     "dev": "concurrently -k -p \"[{name}]\" -n \"SERVER,CLIENT\" -c \"cyan.bold,green.bold\" \"npm run server:dev\" \"npm run client:dev\"",
     "server:dev": "tsx server/src/index.ts",
     "server": "tsx server/src/index.ts",
     "client:dev": "npm --prefix client run dev",
     "build": "npm run build:server && npm run build:client",
     "build:server": "tsc -p server/tsconfig.json",
     "build:client": "npm --prefix client run build",
     "start": "node dist/server/src/index.js",
     "seed": "tsx server/src/db/seed.ts",
     "test": "vitest run"
   }
   ```
2. **`server/tsconfig.json` update**:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "commonjs",
       "rootDir": "src",
       "outDir": "../dist/server",
       "esModuleInterop": true,
       "strict": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true
     },
     "include": ["src/**/*"]
   }
   ```

---

## 5. Verification Method

To independently verify the schema, seed fixtures, and backend execution:

1. **Verify DDL & Schema Creation**:
   ```bash
   node -e "
   const Database = require('better-sqlite3');
   const fs = require('fs');
   const db = new Database(':memory:');
   const sql = fs.readFileSync('.agents/teamwork/explorer_m1_1/proposed_schema.sql', 'utf-8');
   db.exec(sql);
   const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
   console.log('Tables created:', tables.length);
   console.assert(tables.length === 26, 'Must create exactly 26 tables');
   "
   ```
   *Expected Output*: `Tables created: 26`.

2. **Verify Comprehensive Seed Script Execution**:
   ```bash
   npx --yes tsx -e "
   import { getDb, initDb } from './.agents/teamwork/explorer_m1_1/proposed_connection.ts';
   import { seedDatabase } from './.agents/teamwork/explorer_m1_1/proposed_seed.ts';
   const db = getDb('/tmp/test_universe.db');
   initDb();
   seedDatabase('/tmp/test_universe.db');
   console.log('Users:', db.prepare('SELECT count(*) as c FROM users').get().c);
   console.log('Campus Nodes:', db.prepare('SELECT count(*) as c FROM campus_nodes').get().c);
   console.log('Campus Edges:', db.prepare('SELECT count(*) as c FROM campus_edges').get().c);
   console.log('Workloads:', db.prepare('SELECT count(*) as c FROM service_workloads').get().c);
   console.log('Resources:', db.prepare('SELECT count(*) as c FROM academic_resources').get().c);
   console.log('Exam Events:', db.prepare('SELECT count(*) as c FROM observation_events').get().c);
   console.log('Audit Logs:', db.prepare('SELECT count(*) as c FROM exam_audit_log').get().c);
   " && rm -f /tmp/test_universe.db*
   ```
   *Expected Output*:
   - Users: 9
   - Campus Nodes: 10
   - Campus Edges: 22
   - Workloads: 3
   - Resources: 9
   - Exam Events: 4
   - Audit Logs: 2

3. **Verify Express Health Endpoint**:
   ```bash
   npx --yes tsx -e "
   import app from './.agents/teamwork/explorer_m1_1/proposed_index.ts';
   const server = app.listen(3999, async () => {
     const res = await fetch('http://localhost:3999/api/health');
     const data = await res.json();
     console.log('Health Response:', data);
     server.close();
   });
   "
   ```
   *Expected Output*: `{ status: 'ok', service: 'UniVerse Campus OS Backend', ... }`.

4. **Invalidation Conditions**:
   - Omitting any of the 5 module entities invalidates cross-module integration.
   - Using double quotes for SQL string literals causes `SqliteError: no such column`.
   - Modifying `observation_events` to apply automated misconduct penalties violates Responsible AI constraints.
