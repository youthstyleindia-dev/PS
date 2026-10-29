import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getDb } from './db/connection.js';
import { hubRouter } from './routes/hub.routes.js';
import { commonRouter } from './routes/common.routes.js';

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
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Explicit health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    const tables = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as { count: number };

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
app.use('/api/hub', hubRouter);
app.use('/api/activity', commonRouter);
app.use('/api/notifications', commonRouter);
app.use('/api/users', commonRouter);
app.use('/api', commonRouter);

// 404 Handler (Express 5 compatible - without invalid regex wildcards)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal Server Error'
    },
    status
  });
});

export { app };
export default app;
