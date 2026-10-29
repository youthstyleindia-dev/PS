-- UniVerse Schema Definition for Tests & Production

PRAGMA foreign_keys = ON;

-- 1. Users and Authentication / Profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL CHECK(role IN ('student', 'driver', 'proctor', 'admin')),
  department TEXT NOT NULL,
  year_of_study INTEGER DEFAULT 1,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Module A: Student Profiles & Placement
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY,
  skills TEXT DEFAULT '[]', -- JSON string array
  interests TEXT DEFAULT '[]', -- JSON string array
  target_role TEXT,
  readiness_score INTEGER DEFAULT 0 CHECK(readiness_score BETWEEN 0 AND 100),
  resume_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS placement_milestones (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('DSA', 'SystemDesign', 'CoreCS', 'SoftSkills', 'MockInterview')),
  completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  company TEXT NOT NULL,
  available_slots TEXT DEFAULT '[]', -- JSON string array
  max_mentees INTEGER DEFAULT 5,
  rating REAL DEFAULT 5.0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL,
  mentor_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  preferred_slot TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS academic_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Notes', 'PYQ', 'Syllabus', 'Guide')),
  file_url TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  downloads_count INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resource_ratings (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_id, user_id),
  FOREIGN KEY (resource_id) REFERENCES academic_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Module B: Ride-Pooling
CREATE TABLE IF NOT EXISTS ride_offers (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  origin_node_id TEXT NOT NULL,
  destination_node_id TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  total_seats INTEGER NOT NULL CHECK(total_seats >= 1),
  available_seats INTEGER NOT NULL CHECK(available_seats >= 0),
  vehicle_type TEXT DEFAULT 'PETROL_CAR' CHECK(vehicle_type IN ('PETROL_CAR', 'ELECTRIC_VEHICLE', 'E_SHUTTLE')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ride_requests (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  origin_node_id TEXT NOT NULL,
  destination_node_id TEXT NOT NULL,
  desired_time TEXT NOT NULL,
  seats_needed INTEGER DEFAULT 1 CHECK(seats_needed >= 1),
  max_detour_ratio REAL DEFAULT 0.35,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'booked', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ride_bookings (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  seats_booked INTEGER NOT NULL,
  shared_km REAL NOT NULL,
  detour_km REAL NOT NULL,
  carbon_saved_kg REAL NOT NULL,
  fare_charged REAL NOT NULL,
  driver_earnings REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES ride_offers(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES ride_requests(id) ON DELETE CASCADE
);

-- Module C: Sustainable Computing Observatory
CREATE TABLE IF NOT EXISTS workload_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  baseline_replicas INTEGER DEFAULT 2,
  current_replicas INTEGER DEFAULT 2,
  target_rps INTEGER DEFAULT 100,
  cpu_pct REAL DEFAULT 45.0,
  gpu_pct REAL DEFAULT 0.0,
  memory_mb INTEGER DEFAULT 8192
);

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  rps INTEGER NOT NULL,
  latency_p50_ms REAL NOT NULL,
  latency_p95_ms REAL NOT NULL,
  cpu_pct REAL NOT NULL,
  power_watts REAL NOT NULL,
  carbon_g_per_hour REAL NOT NULL,
  provenance TEXT DEFAULT 'ESTIMATED_METRIC',
  FOREIGN KEY (service_id) REFERENCES workload_services(id) ON DELETE CASCADE
);

-- Module D: Privacy-Aware Digital Wellbeing
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  target_duration_mins INTEGER NOT NULL,
  actual_duration_seconds INTEGER DEFAULT 0,
  paused_seconds INTEGER DEFAULT 0,
  goal TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
  deep_work_index INTEGER DEFAULT 0 CHECK(deep_work_index BETWEEN 0 AND 100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS domain_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('PRODUCTIVE', 'DISTRACTING', 'NEUTRAL')),
  is_custom INTEGER DEFAULT 1,
  UNIQUE(user_id, domain_pattern),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS browsing_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('PRODUCTIVE', 'DISTRACTING', 'NEUTRAL')),
  duration_seconds INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Module E: Responsible Examination Monitoring
CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  student_id TEXT NOT NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_events (
  id TEXT PRIMARY KEY,
  exam_session_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL,
  confidence_score REAL NOT NULL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
  frame_snapshot_url TEXT,
  provenance TEXT NOT NULL CHECK(provenance IN ('ACTUAL_INFERENCE', 'SIMULATED_EVENT', 'ESTIMATED_METRIC')),
  review_status TEXT DEFAULT 'PENDING_REVIEW' CHECK(review_status IN ('PENDING_REVIEW', 'DISMISS_FALSE_POSITIVE', 'DISMISS_BENIGN_BEHAVIOR', 'ESCALATE')),
  proctor_notes TEXT,
  reviewer_id TEXT,
  resolved_at DATETIME,
  FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_audit_log (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  exam_session_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES exam_events(id) ON DELETE CASCADE
);

-- Common & Integration Architecture
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'urgent')),
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
