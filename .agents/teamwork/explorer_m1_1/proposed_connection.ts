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
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, 'proposed_schema.sql'),
    path.resolve(process.cwd(), 'server/src/db/schema.sql'),
    path.resolve(process.cwd(), '.agents/teamwork/explorer_m1_1/proposed_schema.sql')
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
