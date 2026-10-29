-- ==============================================================================
-- UniVerse Campus OS: Complete Relational SQLite Schema
-- Target Engine: better-sqlite3 (WAL Mode, Foreign Keys Enabled)
-- Modules: Shared Core, Module A, Module B, Module C, Module D, Module E
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. USERS & ACCESS MANAGEMENT (Shared Core)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT,
  role TEXT NOT NULL CHECK(role IN ('student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin', 'faculty')),
  department TEXT,
  year_of_study INTEGER,
  bio TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL CHECK(role_key IN ('student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
  granted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  revoked_at TEXT,
  reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_assignments_active ON role_assignments(user_id, role_key) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS role_invitations (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  role_key TEXT NOT NULL CHECK(role_key IN ('student', 'driver', 'proctor', 'ta_faculty', 'warden', 'admin')),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  is_revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. MODULE A: STUDENT INTELLIGENCE & ACADEMIC HUB
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON array of strings or skill objects
  interests TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
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
  category TEXT NOT NULL CHECK(category IN ('DSA', 'SystemDesign', 'SoftSkills', 'Resume', 'MockInterview', 'Core CS', 'Projects', 'Fundamentals', 'FullStack')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  target_date TEXT,
  completed_at TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placement_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  academic_year TEXT NOT NULL,
  program TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT NOT NULL,
  placement_category TEXT,
  company_profile TEXT,
  ctc_lpa REAL,
  cgpa REAL,
  category_inferred TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_placement_records_email ON placement_records(email);
CREATE INDEX IF NOT EXISTS idx_placement_records_branch ON placement_records(branch);
CREATE INDEX IF NOT EXISTS idx_placement_records_status ON placement_records(status);
CREATE INDEX IF NOT EXISTS idx_placement_records_year ON placement_records(academic_year);

CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_offer TEXT NOT NULL,
  domain TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  available_slots TEXT NOT NULL DEFAULT '[]', -- JSON array of string slots
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
  category TEXT NOT NULL CHECK(category IN ('Notes', 'PYQ', 'Syllabus', 'Guide', 'Cheatsheet', 'Reference')),
  semester INTEGER NOT NULL DEFAULT 5,
  department TEXT NOT NULL DEFAULT 'Computer Science',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_kb INTEGER NOT NULL DEFAULT 1024,
  uploader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0.0 CHECK(rating >= 0.0 AND rating <= 5.0),
  rating_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array of tags
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

-- ------------------------------------------------------------------------------
-- 3. MODULE B: SMART CAMPUS RIDE-POOLING
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. MODULE C: SUSTAINABLE COMPUTING OBSERVATORY
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. MODULE D: PRIVACY-AWARE DIGITAL WELLBEING
-- ------------------------------------------------------------------------------
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
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL indicates global campus default rule
  domain_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Productive', 'Distracting', 'Neutral')),
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK(is_custom IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS browsing_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  sanitized_domain TEXT NOT NULL, -- Hostname ONLY; strict prohibition of query params, paths, tokens
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

-- ------------------------------------------------------------------------------
-- 6. MODULE E: RESPONSIBLE EXAMINATION MONITORING
-- ------------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS exam_session_assignments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  proctor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'revoked'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_session_proctor_active ON exam_session_assignments(session_id, proctor_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS observation_events (
  id TEXT PRIMARY KEY,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offset_seconds REAL NOT NULL DEFAULT 0.0,
  event_type TEXT NOT NULL CHECK(event_type IN ('HEAD_POSE_DEVIATION', 'UNAUTHORIZED_PERSON', 'ABSENCE_FROM_SEAT', 'MULTIPLE_FACES', 'GAZE_AWAY', 'RESTRICTED_ZONE_INCURSION', 'MULTIPLE_OCCUPANTS_DETECTED', 'BROWSER_TAB_BLUR', 'FULLSCREEN_DEPARTURE')),
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

-- Vision Model Registry (ML Provenance and Checksums)
CREATE TABLE IF NOT EXISTS vision_model_registry (
  id TEXT PRIMARY KEY,
  model_key TEXT NOT NULL CHECK(model_key IN ('face_landmarker', 'person_detector')),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  artifact_filename TEXT NOT NULL,
  artifact_sha256 TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license_identifier TEXT NOT NULL,
  model_card_url TEXT NOT NULL,
  runtime_package TEXT NOT NULL,
  runtime_package_version TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Vision Consents (Voluntary, Revocable, Metadata Only)
CREATE TABLE IF NOT EXISTS exam_vision_consents (
  id TEXT PRIMARY KEY,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  candidate_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  consent_status TEXT NOT NULL CHECK(consent_status IN ('granted', 'declined', 'withdrawn')),
  explanation_version TEXT NOT NULL DEFAULT 'v1.0',
  granted_at TEXT,
  withdrawn_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Observation Rule Versions
CREATE TABLE IF NOT EXISTS exam_vision_rule_versions (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  version TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  effective_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Observation Lifecycle Audit
CREATE TABLE IF NOT EXISTS exam_observation_audit (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL REFERENCES observation_events(id) ON DELETE CASCADE,
  exam_session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. SHARED NOTIFICATION & ACTIVITY SYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
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
