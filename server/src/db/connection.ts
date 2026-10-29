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
    `);

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
