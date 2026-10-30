import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

/**
 * Get or create the singleton better-sqlite3 database connection.
 * Automatically enables WAL mode and foreign key constraints.
 */
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

  // High performance & transactional integrity pragmas
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('temp_store = MEMORY');

  return dbInstance;
}

/**
 * Initialize database schema by executing schema.sql.
 */
export function initDb(schemaPath?: string): Database.Database {
  const db = getDb();
  const searchPaths = [
    schemaPath,
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, 'schema.sql') : undefined,
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
    throw new Error(`Schema file not found in any of: ${searchPaths.join(', ')}`);
  }

  // Ensure auth columns and tables exist if database existed previously
  try {
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const colNames = new Set(userColumns.map(c => c.name));
    if (!colNames.has('password_hash')) {
      db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
    }
    if (!colNames.has('is_active')) {
      db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
    }
    if (!colNames.has('last_login')) {
      db.exec('ALTER TABLE users ADD COLUMN last_login TEXT');
    }
    if (!colNames.has('is_demo')) {
      db.exec('ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0');
    }

    try {
      const mentorColumns = db.prepare("PRAGMA table_info(mentors)").all() as Array<{ name: string }>;
      const mentorColNames = new Set(mentorColumns.map(c => c.name));
      if (!mentorColNames.has('topics')) {
        db.exec("ALTER TABLE mentors ADD COLUMN topics TEXT NOT NULL DEFAULT '[]'");
      }
      if (!mentorColNames.has('projects')) {
        db.exec("ALTER TABLE mentors ADD COLUMN projects TEXT NOT NULL DEFAULT '[]'");
      }
      if (!mentorColNames.has('preferred_format')) {
        db.exec("ALTER TABLE mentors ADD COLUMN preferred_format TEXT NOT NULL DEFAULT 'chat'");
      }
      if (!mentorColNames.has('weekly_capacity')) {
        db.exec("ALTER TABLE mentors ADD COLUMN weekly_capacity INTEGER NOT NULL DEFAULT 5");
      }
      if (!mentorColNames.has('graduation_year')) {
        db.exec("ALTER TABLE mentors ADD COLUMN graduation_year INTEGER");
      }
      if (!mentorColNames.has('is_approved')) {
        db.exec("ALTER TABLE mentors ADD COLUMN is_approved INTEGER NOT NULL DEFAULT 1");
      }
      if (!mentorColNames.has('is_demo')) {
        db.exec("ALTER TABLE mentors ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0");
      }
    } catch {
      // Table may not exist yet
    }
    db.exec(`
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
      CREATE TABLE IF NOT EXISTS exam_session_assignments (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        proctor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'revoked'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_session_proctor_active ON exam_session_assignments(session_id, proctor_id) WHERE status = 'active';

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

      INSERT OR IGNORE INTO vision_model_registry (
        id, model_key, model_name, model_version, artifact_filename, artifact_sha256,
        source_url, license_identifier, model_card_url, runtime_package, runtime_package_version
      ) VALUES
      (
        'mod_face_landmarker_v1',
        'face_landmarker',
        'MediaPipe Face Landmarker (Float16)',
        '1.0.0',
        'face_landmarker.task',
        '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
        'Apache-2.0',
        'https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker',
        '@mediapipe/tasks-vision',
        '1.2.0'
      ),
      (
        'mod_person_detector_v1',
        'person_detector',
        'MediaPipe EfficientDet-Lite0 Object Detector (Float16)',
        '1.0.0',
        'efficientdet_lite0.tflite',
        '4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993',
        'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite',
        'Apache-2.0',
        'https://developers.google.com/edge/mediapipe/solutions/vision/object_detector',
        '@mediapipe/tasks-vision',
        '1.2.0'
      );

      INSERT OR IGNORE INTO exam_vision_rule_versions (
        id, rule_key, version, configuration_json, author
      ) VALUES
      (
        'rule_head_turn_v1',
        'repeated_head_orientation_change',
        '1.0.0',
        '{"yawThresholdDegrees": 25, "pitchThresholdDegrees": 20, "minDwellSeconds": 0.6, "windowSeconds": 20, "qualifyingCount": 3, "cooldownSeconds": 30}',
        'SYSTEM'
      ),
      (
        'rule_restricted_region_v1',
        'person_detected_in_restricted_region',
        '1.0.0',
        '{"targetCategory": "person", "minDetectionScore": 0.50, "minDwellSeconds": 1.0, "cooldownSeconds": 30, "defaultRoi": {"x": 0.05, "y": 0.05, "w": 0.35, "h": 0.35}}',
        'SYSTEM'
      );
    `);

    // Backfill role_assignments for existing users if missing
    try {
      const existingUsers = db.prepare('SELECT id, role FROM users').all() as Array<{ id: string; role: string }>;
      for (const u of existingUsers) {
        const canonical = u.role === 'faculty' ? 'ta_faculty' : u.role;
        db.prepare(`
          INSERT OR IGNORE INTO role_assignments (id, user_id, role_key, status, reason)
          VALUES (?, ?, ?, 'active', 'Legacy user role backfill')
        `).run(`ra_${u.id}_${canonical}`, u.id, canonical);

        if (canonical === 'proctor') {
          // Proctors also possess academic faculty privileges
          db.prepare(`
            INSERT OR IGNORE INTO role_assignments (id, user_id, role_key, status, reason)
            VALUES (?, ?, 'ta_faculty', 'active', 'Faculty ombuds privileges for proctors')
          `).run(`ra_${u.id}_ta_faculty`, u.id);
        }
      }
    } catch {
      // Ignore if table not yet populated
    }

    // Migrate users table if check constraint missing newer canonical roles
    const userTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string } | undefined;
    if (userTableSql && !userTableSql.sql.includes('ta_faculty')) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE IF NOT EXISTS users_new (
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
        INSERT OR IGNORE INTO users_new SELECT * FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
      `);
      db.pragma('foreign_keys = ON');
    }

    // Migrate observation_events table if missing newer Mode 1 / Mode 2 CV event types
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='observation_events'").get() as { sql: string } | undefined;
    if (tableSql && !tableSql.sql.includes('RESTRICTED_ZONE_INCURSION')) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE IF NOT EXISTS observation_events_new (
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
        INSERT OR IGNORE INTO observation_events_new SELECT * FROM observation_events;
        DROP TABLE observation_events;
        ALTER TABLE observation_events_new RENAME TO observation_events;
        CREATE INDEX IF NOT EXISTS idx_observation_events_session ON observation_events(exam_session_id);
        CREATE INDEX IF NOT EXISTS idx_observation_events_status ON observation_events(review_status);
      `);
      db.pragma('foreign_keys = ON');
    }
  } catch (err) {
    // Table might not exist yet before first schema run
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS facility_issues (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id TEXT REFERENCES campus_locations(id) ON DELETE SET NULL,
        facility_name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('plumbing', 'electrical', 'internet_wifi', 'furniture', 'cleanliness', 'safety', 'other')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        urgency TEXT NOT NULL DEFAULT 'medium' CHECK(urgency IN ('low', 'medium', 'high', 'emergency')),
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'assigned', 'in_progress', 'resolved', 'rejected')),
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        resolution_notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_facility_issues_reporter ON facility_issues(reporter_id);
      CREATE INDEX IF NOT EXISTS idx_facility_issues_status ON facility_issues(status);
    `);
  } catch (err) {
    // Table might already exist
  }

  return db;
}

/**
 * Closes the active database connection. Useful for test teardowns.
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Execute a function within an immediate SQLite transaction.
 */
export function runInTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  const tx = db.transaction(() => fn(db));
  return tx.immediate();
}
