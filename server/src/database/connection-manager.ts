import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface DomainHealthStatus {
  domain: string;
  databasePath: string;
  connected: boolean;
  walEnabled: boolean;
  foreignKeysEnabled: boolean;
  tablesCount: number;
  lastChecked: string;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private primaryDb: Database.Database | null = null;
  private readonly dbPath: string;

  private constructor(customPath?: string) {
    this.dbPath = customPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'server/data/universe.db');
  }

  public static getInstance(customPath?: string): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(customPath);
    }
    return ConnectionManager.instance;
  }

  public getDatabase(): Database.Database {
    if (this.primaryDb) {
      return this.primaryDb;
    }

    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.primaryDb = new Database(this.dbPath);

    // Apply high performance & ACID integrity pragmas
    this.primaryDb.pragma('journal_mode = WAL');
    this.primaryDb.pragma('foreign_keys = ON');
    this.primaryDb.pragma('synchronous = NORMAL');
    this.primaryDb.pragma('busy_timeout = 5000');
    this.primaryDb.pragma('temp_store = MEMORY');

    return this.primaryDb;
  }

  public getHealth(): Record<string, DomainHealthStatus> {
    const db = this.getDatabase();
    const now = new Date().toISOString();

    const getDomainHealth = (domain: string, tableSample: string): DomainHealthStatus => {
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`).get(tableSample) as { count: number };
        const totalTables = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'`).get() as { count: number };
        const fk = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>;
        const jm = db.pragma('journal_mode') as Array<{ journal_mode: string }>;

        return {
          domain,
          databasePath: this.dbPath,
          connected: row.count > 0,
          walEnabled: (jm[0]?.journal_mode || '').toLowerCase() === 'wal',
          foreignKeysEnabled: fk[0]?.foreign_keys === 1,
          tablesCount: totalTables.count,
          lastChecked: now
        };
      } catch (err) {
        return {
          domain,
          databasePath: this.dbPath,
          connected: false,
          walEnabled: false,
          foreignKeysEnabled: false,
          tablesCount: 0,
          lastChecked: now
        };
      }
    };

    return {
      identity: getDomainHealth('identity', 'users'),
      academic: getDomainHealth('academic', 'student_profiles'),
      mobility: getDomainHealth('mobility', 'campus_edges'),
      sustainability: getDomainHealth('sustainability', 'service_workloads'),
      wellbeing: getDomainHealth('wellbeing_private', 'focus_sessions'),
      examination: getDomainHealth('examination_restricted', 'exam_sessions'),
      audit: getDomainHealth('security_audit', 'auth_audit_log')
    };
  }

  public close(): void {
    if (this.primaryDb) {
      this.primaryDb.close();
      this.primaryDb = null;
    }
  }
}
