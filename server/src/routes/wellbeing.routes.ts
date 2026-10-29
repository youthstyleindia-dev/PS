import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { PrivacyWellbeingOracle } from '../algorithms/privacy_oracle.js';

export const wellbeingRouter = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Map category to schema Title Case
function toTitleCaseCategory(cat: string): 'Productive' | 'Distracting' | 'Neutral' {
  const upper = (cat || '').toUpperCase();
  if (upper === 'PRODUCTIVE') return 'Productive';
  if (upper === 'DISTRACTING') return 'Distracting';
  return 'Neutral';
}

// POST /api/wellbeing/sessions/start
wellbeingRouter.post('/sessions/start', (req: Request, res: Response) => {
  const { userId, targetDurationMins, goal } = req.body;
  if (!userId || !targetDurationMins) {
    return res.status(400).json({ error: 'userId and targetDurationMins are required' });
  }

  const db = getDb();
  // Check for existing active session
  const active = db.prepare("SELECT id FROM focus_sessions WHERE user_id = ? AND status = 'active'").get(userId);
  if (active) {
    return res.status(409).json({ error: 'User already has an active focus session' });
  }

  const id = genId('sess');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO focus_sessions (id, user_id, start_time, target_duration_mins, goal, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(id, userId, now, targetDurationMins, goal || 'Deep Work Study Session');

  // Activity log
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(genId('act'), userId, 'wellbeing', 'FOCUS_STARTED', `Started ${targetDurationMins}m focus session: ${goal || 'General Study'}`);

  res.status(201).json({ success: true, sessionId: id, status: 'active', targetDurationMins });
});

// POST /api/wellbeing/sessions/:sessionId/pause
wellbeingRouter.post('/sessions/:sessionId/pause', (req: Request, res: Response) => {
  const { action } = req.body; // 'pause' | 'resume'
  const db = getDb();
  const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const newStatus = action === 'pause' ? 'paused' : 'active';
  db.prepare('UPDATE focus_sessions SET status = ? WHERE id = ?').run(newStatus, req.params.sessionId);

  res.json({ success: true, sessionId: req.params.sessionId, status: newStatus });
});

// POST /api/wellbeing/sessions/:sessionId/stop
wellbeingRouter.post('/sessions/:sessionId/stop', (req: Request, res: Response) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const events = db.prepare('SELECT * FROM browsing_events WHERE session_id = ?').all(req.params.sessionId) as any[];
  const totalSecs = events.reduce((a, b) => a + (b.duration_seconds || 0), 0) || (session.target_duration_mins * 60);

  const mappedEvents = events.map((e) => ({
    domain: e.sanitized_domain || e.domain,
    category: (e.category || 'Neutral').toUpperCase() as any,
    durationSeconds: e.duration_seconds || 60,
  }));
  const stats = PrivacyWellbeingOracle.computeSessionAnalytics(totalSecs, 0, mappedEvents);

  const actualMins = Math.round(stats.totalSeconds / 60);
  db.prepare(`
    UPDATE focus_sessions
    SET status = 'completed',
        end_time = CURRENT_TIMESTAMP,
        actual_duration_mins = ?,
        deep_work_index = ?,
        productive_time_secs = ?,
        distracting_time_secs = ?,
        neutral_time_secs = ?
    WHERE id = ?
  `).run(actualMins, stats.deepWorkIndex, stats.productiveSeconds, stats.distractingSeconds, stats.neutralSeconds, req.params.sessionId);

  // Activity log
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(genId('act'), session.user_id, 'wellbeing', 'FOCUS_COMPLETED', `Completed focus session with Deep Work Index ${stats.deepWorkIndex}%`);

  res.json({
    success: true,
    sessionId: req.params.sessionId,
    status: 'completed',
    analytics: stats,
  });
});

// GET /api/wellbeing/sessions/:sessionId
wellbeingRouter.get('/sessions/:sessionId', (req: Request, res: Response) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const events = db.prepare('SELECT * FROM browsing_events WHERE session_id = ? ORDER BY timestamp ASC').all(req.params.sessionId) as any[];
  res.json({ session, events });
});

// GET /api/wellbeing/sessions/user/:userId
wellbeingRouter.get('/sessions/user/:userId', (req: Request, res: Response) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY start_time DESC
  `).all(req.params.userId);
  res.json(sessions);
});

// POST /api/wellbeing/events
wellbeingRouter.post('/events', (req: Request, res: Response) => {
  const { sessionId, userId, domain, durationSeconds } = req.body;
  if (!sessionId || !userId || !domain) {
    return res.status(400).json({ error: 'sessionId, userId, and domain are required' });
  }

  // Local-first sanitization invariant
  const sanitizedDomain = PrivacyWellbeingOracle.sanitizeUrlToHostname(domain);
  if (!sanitizedDomain) return res.status(400).json({ error: 'Invalid domain' });

  const db = getDb();
  // Look up rule
  const rule = db.prepare('SELECT category FROM domain_rules WHERE user_id = ? AND domain_pattern = ?').get(userId, sanitizedDomain) as any;
  const rawCat = rule ? rule.category : 'Neutral';
  const category = toTitleCaseCategory(rawCat);

  const id = genId('ev');
  db.prepare(`
    INSERT INTO browsing_events (id, session_id, sanitized_domain, category, duration_seconds)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, sessionId, sanitizedDomain, category, durationSeconds || 60);

  res.status(201).json({
    success: true,
    eventId: id,
    sanitizedDomain,
    category,
    durationSeconds: durationSeconds || 60,
  });
});

// GET /api/wellbeing/rules/:userId
wellbeingRouter.get('/rules/:userId', (req: Request, res: Response) => {
  const db = getDb();
  const rules = db.prepare('SELECT * FROM domain_rules WHERE user_id = ? OR user_id IS NULL').all(req.params.userId);
  res.json(rules);
});

// POST /api/wellbeing/rules
wellbeingRouter.post('/rules', (req: Request, res: Response) => {
  const { userId, domainPattern, category } = req.body;
  if (!userId || !domainPattern || !category) {
    return res.status(400).json({ error: 'userId, domainPattern, and category are required' });
  }

  const titleCategory = toTitleCaseCategory(category);
  const cleanDomain = PrivacyWellbeingOracle.sanitizeUrlToHostname(domainPattern);
  const db = getDb();
  const existing = db.prepare('SELECT id FROM domain_rules WHERE user_id = ? AND domain_pattern = ?').get(userId, cleanDomain);
  if (existing) {
    db.prepare('UPDATE domain_rules SET category = ? WHERE user_id = ? AND domain_pattern = ?').run(titleCategory, userId, cleanDomain);
  } else {
    db.prepare('INSERT INTO domain_rules (id, user_id, domain_pattern, category, is_custom) VALUES (?, ?, ?, ?, 1)').run(
      genId('rule'),
      userId,
      cleanDomain,
      titleCategory
    );
  }

  res.status(201).json({ success: true, domain: cleanDomain, category: titleCategory });
});

// GET /api/wellbeing/cohort-aggregate
wellbeingRouter.get('/cohort-aggregate', (req: Request, res: Response) => {
  const dept = (req.query.department as string) || 'Computer Science & Engineering';
  const minCohort = parseInt(req.query.minCohort as string, 10) || 3;

  const db = getDb();
  const sessions = db.prepare(`
    SELECT fs.actual_duration_mins, u.department
    FROM focus_sessions fs
    JOIN users u ON fs.user_id = u.id
    WHERE (u.department = ? OR u.department LIKE ?) AND fs.status = 'completed'
  `).all(dept, `%${dept}%`) as any[];

  const focusMinutes = sessions.map((s) => s.actual_duration_mins || 30);
  const result = PrivacyWellbeingOracle.computeCohortAggregate(dept, focusMinutes, minCohort, 0.8);
  res.json(result);
});

// DELETE /api/wellbeing/history/:userId
wellbeingRouter.delete('/history/:userId', (req: Request, res: Response) => {
  const db = getDb();
  const userSessions = db.prepare('SELECT id FROM focus_sessions WHERE user_id = ?').all(req.params.userId) as any[];
  const sessionIds = userSessions.map((s) => s.id);

  let deletedEvents = 0;
  for (const sid of sessionIds) {
    deletedEvents += db.prepare('DELETE FROM browsing_events WHERE session_id = ?').run(sid).changes;
  }
  const deletedSessions = db.prepare('DELETE FROM focus_sessions WHERE user_id = ?').run(req.params.userId).changes;

  res.json({
    success: true,
    message: 'All browsing events and focus sessions purged permanently under privacy right to erasure',
    deletedEventsCount: deletedEvents,
    deletedSessionsCount: deletedSessions,
  });
});
