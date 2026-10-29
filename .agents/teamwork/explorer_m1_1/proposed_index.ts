import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

let getDb: any;
let initDb: any;
let closeDb: any;

try {
  const conn = require('./db/connection');
  getDb = conn.getDb;
  initDb = conn.initDb;
  closeDb = conn.closeDb;
} catch (_) {
  const conn = require('./proposed_connection');
  getDb = conn.getDb;
  initDb = conn.initDb;
  closeDb = conn.closeDb;
}

// Import route modules (to be implemented in server/src/routes/)
// For modular initialization, route files can be imported dynamically or conditionally
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

// ------------------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE
// ------------------------------------------------------------------------------
app.use(cors({
  origin: true, // Reflect request origin (or specify 'http://localhost:5173')
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// ------------------------------------------------------------------------------
// 2. HEALTH CHECK & SYSTEM DIAGNOSTICS
// ------------------------------------------------------------------------------
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

// ------------------------------------------------------------------------------
// 3. API ROUTE REGISTRATION
// ------------------------------------------------------------------------------
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

// ------------------------------------------------------------------------------
// 4. 404 & ERROR HANDLING MIDDLEWARE
// ------------------------------------------------------------------------------
// Catch-all 404 handler (Express 5 compatible - no unnamed wildcard paths)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method,
    hint: 'Check /api/health for system status and active routes'
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    status
  });
});

// ------------------------------------------------------------------------------
// 5. SERVER INITIALIZATION & LIFECYCLE
// ------------------------------------------------------------------------------
export function startServer(): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Auto-initialize DB schema on launch
      initDb();
      console.log('✅ SQLite database schema verified & ready.');

      const server = app.listen(PORT, () => {
        console.log(`🚀 UniVerse Server active and listening at http://localhost:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);
        resolve(server);
      });

      // Graceful Shutdown Handlers
      const shutdown = () => {
        console.log('\n🛑 Shutting down UniVerse Server gracefully...');
        server.close(() => {
          closeDb();
          console.log('✅ Database connection closed. Server terminated.');
          process.exit(0);
        });
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      console.error('❌ Server failed to start:', err);
      reject(err);
    }
  });
}

// Auto-run if executed as entry point
if (require.main === module || process.argv[1]?.includes('index')) {
  startServer();
}

export default app;
