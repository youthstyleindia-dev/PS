import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireRole } from '../middleware/auth.middleware.js';

export const commonRouter = Router();

// ==========================================
// 1. HEALTH CHECK
// ==========================================

/**
 * GET /api/health
 * Active database ping and server status
 */
commonRouter.get('/health', (_req: Request, res: Response): void => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    const tables = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as { count: number };

    if (!result || result.alive !== 1) {
      throw new Error('Database ping check failed');
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'UniVerse Campus OS Backend',
      uptime: Math.round(process.uptime() * 100) / 100,
      database: {
        connected: true,
        mode: 'better-sqlite3 / WAL',
        tableCount: tables?.count || 0
      },
      version: '1.0.0'
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      database: {
        connected: false,
        error: err.message || 'Database unavailable'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// 2. ACTIVITY LOG & NOTIFICATION CENTER
// ==========================================

/**
 * GET /api/activity
 * Fetch cross-module activity stream with limit, offset, and module filters
 */
commonRouter.get('/activity', (req: Request, res: Response): void => {
  const { limit = '50', offset = '0', module, userId } = req.query;
  const db = getDb();

  const numLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
  const numOffset = Math.max(0, parseInt(String(offset), 10) || 0);

  let sql = `
    SELECT 
      a.id, a.user_id as userId, u.name as userName, u.avatar as userAvatar,
      a.module, a.action, a.details, a.timestamp
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (module) {
    sql += ' AND a.module = ?';
    params.push(String(module).toLowerCase().trim());
  }

  if (userId) {
    sql += ' AND a.user_id = ?';
    params.push(String(userId).trim());
  }

  sql += ' ORDER BY a.timestamp DESC LIMIT ? OFFSET ?';
  params.push(numLimit, numOffset);

  const rows = db.prepare(sql).all(...params) as any[];

  const activities = rows.map(r => {
    let parsedDetails = r.details;
    try {
      if (typeof r.details === 'string' && (r.details.startsWith('{') || r.details.startsWith('['))) {
        parsedDetails = JSON.parse(r.details);
      }
    } catch {
      // keep as string
    }
    return {
      ...r,
      details: parsedDetails
    };
  });

  const countRow = db.prepare('SELECT COUNT(*) as total FROM activity_log').get() as { total: number };

  res.json({
    total: countRow.total,
    limit: numLimit,
    offset: numOffset,
    activities
  });
});

/**
 * POST /api/activity
 * Log an activity event
 */
commonRouter.post('/', (req: Request, res: Response): void => {
  const { userId, module, action, details } = req.body;
  const db = getDb();

  if (!module || !action) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Fields "module" and "action" are required' } });
    return;
  }

  const validModules = ['hub', 'rides', 'sustainability', 'wellbeing', 'exams', 'system'];
  if (!validModules.includes(module)) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Field "module" must be one of: ${validModules.join(', ')}`
      }
    });
    return;
  }

  // Validate userId existence if provided
  if (userId) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `User '${userId}' not found`
        }
      });
      return;
    }
  }

  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(activityId, userId || null, module, action, detailsStr, now);

  res.status(201).json({
    id: activityId,
    userId: userId || null,
    module,
    action,
    details: details || null,
    timestamp: now
  });
});

/**
 * GET /api/notifications
 * Fetch notifications for user
 */
commonRouter.get('/notifications', (req: Request, res: Response): void => {
  const { userId = 'usr_student_1' } = req.query;
  const db = getDb();

  const notifications = db.prepare(`
    SELECT id, user_id as userId, title, message, module, type, is_read as isRead, link_url as linkUrl, created_at as createdAt
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as any[];

  res.json({
    total: notifications.length,
    unreadCount: notifications.filter(n => !n.isRead).length,
    notifications
  });
});

// ==========================================
// 3. USERS & ROLES SIMULATION
// ==========================================

/**
 * GET /api/users
 * List users with role and department filters
 */
commonRouter.get('/users', requireRole('admin'), (req: Request, res: Response): void => {
  const { role, department } = req.query;
  const db = getDb();

  let sql = 'SELECT id, name, email, avatar, role, department, year_of_study as yearOfStudy, bio, created_at as createdAt FROM users WHERE 1=1';
  const params: any[] = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(String(role).toLowerCase().trim());
  }

  if (department) {
    sql += ' AND LOWER(department) = LOWER(?)';
    params.push(String(department).trim());
  }

  sql += ' ORDER BY name ASC';
  const users = db.prepare(sql).all(...params);

  res.json({
    total: users.length,
    users
  });
});

/**
 * GET /api/users/:userId
 * Fetch user by ID with attached role profile
 */
commonRouter.get('/users/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const db = getDb();

  const user = db.prepare(`
    SELECT id, name, email, avatar, role, department, year_of_study as yearOfStudy, bio, created_at as createdAt
    FROM users
    WHERE id = ?
  `).get(userId) as any;

  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User '${userId}' not found` } });
    return;
  }

  // Attach student profile if student
  if (user.role === 'student') {
    const studentProfile = db.prepare('SELECT target_role, placement_goals, skills, interests, resume_url, readiness_score, gpa FROM student_profiles WHERE user_id = ?').get(userId) as any;
    if (studentProfile) {
      user.studentProfile = {
        targetRole: studentProfile.target_role,
        placementGoals: studentProfile.placement_goals,
        skills: JSON.parse(studentProfile.skills || '[]'),
        interests: JSON.parse(studentProfile.interests || '[]'),
        resumeUrl: studentProfile.resume_url,
        readinessScore: studentProfile.readiness_score,
        gpa: studentProfile.gpa
      };
    }
  }

  // Attach mentor profile if user is a mentor
  const mentorProfile = db.prepare('SELECT id, company_offer, domain, skills, available_slots, max_mentees, rating FROM mentors WHERE user_id = ?').get(userId) as any;
  if (mentorProfile) {
    user.mentorProfile = {
      mentorProfileId: mentorProfile.id,
      companyOffer: mentorProfile.company_offer,
      domain: mentorProfile.domain,
      skills: JSON.parse(mentorProfile.skills || '[]'),
      availableSlots: JSON.parse(mentorProfile.available_slots || '[]'),
      maxMentees: mentorProfile.max_mentees,
      rating: mentorProfile.rating
    };
  }

  res.json(user);
});
