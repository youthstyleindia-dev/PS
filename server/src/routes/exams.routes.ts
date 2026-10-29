import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireRole, requireAssignedExamSession } from '../middleware/auth.middleware.js';

export const examsRouter = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function normalizeEventType(type: string): string {
  const upper = (type || '').toUpperCase();
  if (upper.includes('HEAD') || upper.includes('POSE') || upper.includes('TURN')) return 'HEAD_POSE_DEVIATION';
  if (upper.includes('ZONE') || upper.includes('RESTRICTED') || upper.includes('PERIMETER') || upper.includes('INCURSION')) return 'RESTRICTED_ZONE_INCURSION';
  if (upper.includes('MULTIPLE') || upper.includes('OCCUPANT') || upper.includes('SECOND') || upper.includes('FACES')) return 'MULTIPLE_OCCUPANTS_DETECTED';
  if (upper.includes('BLUR') || upper.includes('FOCUS') || upper.includes('TAB') || upper.includes('WINDOW')) return 'BROWSER_TAB_BLUR';
  if (upper.includes('FULLSCREEN') || upper.includes('FULL_SCREEN')) return 'FULLSCREEN_DEPARTURE';
  if (upper.includes('SEAT') || upper.includes('ABSENCE')) return 'ABSENCE_FROM_SEAT';
  if (upper.includes('UNAUTHORIZED') || upper.includes('PERSON')) return 'UNAUTHORIZED_PERSON';
  return 'GAZE_AWAY';
}

function normalizeAction(action: string): string {
  const upper = (action || '').toUpperCase();
  if (upper.includes('FALSE') || upper.includes('POSITIVE')) return 'DISMISS_FALSE_POSITIVE';
  if (upper.includes('BENIGN') || upper.includes('NORMAL')) return 'DISMISS_BENIGN_BEHAVIOR';
  return 'ESCALATE_TO_INVIGILATOR';
}

// GET /api/exams/sessions
examsRouter.get('/sessions', requireRole('proctor', 'admin'), (_req: Request, res: Response) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT es.*, u.name as student_name, u.email as student_email
    FROM exam_sessions es
    JOIN users u ON es.student_id = u.id
    ORDER BY es.scheduled_start ASC
  `).all();
  res.json(sessions);
});

// POST /api/exams/sessions
examsRouter.post('/sessions', (req: Request, res: Response) => {
  const { title, courseId, courseCode, studentId, scheduledStart, scheduledEnd } = req.body;
  if (!title || (!courseId && !courseCode) || !studentId) {
    return res.status(400).json({ error: 'Missing title, courseId, or studentId' });
  }

  const db = getDb();
  const id = genId('exam');
  db.prepare(`
    INSERT INTO exam_sessions (id, title, course_id, student_id, scheduled_start, scheduled_end, status)
    VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
  `).run(id, title, courseId || courseCode, studentId, scheduledStart || new Date().toISOString(), scheduledEnd || new Date().toISOString());

  res.status(201).json({ success: true, examSessionId: id, status: 'scheduled' });
});

// POST /api/exams/events
examsRouter.post('/events', (req: Request, res: Response) => {
  const { examSessionId, eventType, confidenceScore, frameSnapshotUrl, provenance } = req.body;
  if (!examSessionId || !eventType || confidenceScore === undefined || !provenance) {
    return res.status(400).json({ error: 'Missing required exam event fields' });
  }

  if (!['ACTUAL_INFERENCE', 'SIMULATED_EVENT', 'ESTIMATED_METRIC'].includes(provenance)) {
    return res.status(400).json({ error: 'Invalid provenance tag. Must be ACTUAL_INFERENCE, SIMULATED_EVENT, or ESTIMATED_METRIC' });
  }

  const normalizedEvent = normalizeEventType(eventType);
  const db = getDb();
  const id = genId('exev');
  db.prepare(`
    INSERT INTO observation_events (id, exam_session_id, event_type, confidence_score, frame_snapshot_url, provenance, review_status)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
  `).run(id, examSessionId, normalizedEvent, confidenceScore, frameSnapshotUrl || null, provenance);

  // Notify proctor in activity (use null for user_id to satisfy foreign key)
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, null, ?, ?, ?)
  `).run(genId('act'), 'exams', 'OBSERVATION_FLAGGED', `Observable event ${normalizedEvent} [${provenance}] flagged for proctor review`);

  res.status(201).json({
    success: true,
    eventId: id,
    eventType: normalizedEvent,
    reviewStatus: 'PENDING_REVIEW',
    provenance,
    notice: 'OBSERVABLE EVENT FLAGGED FOR HUMAN REVIEW ONLY. ZERO AUTOMATED DISCIPLINARY ACTION. NO AUTOMATED PENALTY APPLIED.',
    ethicalNotice: 'OBSERVABLE EVENT FLAGGED FOR HUMAN REVIEW ONLY. ZERO AUTOMATED DISCIPLINARY ACTION. NO AUTOMATED PENALTY APPLIED.',
  });
});

// GET /api/exams/pending-reviews
examsRouter.get('/pending-reviews', requireRole('proctor', 'admin'), (_req: Request, res: Response) => {
  const db = getDb();
  const events = db.prepare(`
    SELECT oe.*, es.title as exam_title, es.course_id as course_code, u.name as student_name
    FROM observation_events oe
    JOIN exam_sessions es ON oe.exam_session_id = es.id
    JOIN users u ON es.student_id = u.id
    WHERE oe.review_status = 'PENDING_REVIEW'
    ORDER BY oe.timestamp DESC
  `).all();
  res.json(events);
});

// GET /api/exams/events/:sessionId
examsRouter.get('/events/:sessionId', requireAssignedExamSession('sessionId'), (req: Request, res: Response) => {
  const db = getDb();
  const events = db.prepare(`
    SELECT * FROM observation_events WHERE exam_session_id = ? ORDER BY timestamp DESC
  `).all(req.params.sessionId);
  res.json(events);
});

// PATCH /api/exams/events/:eventId/review
examsRouter.patch('/events/:eventId/review', requireRole('proctor', 'admin'), (req: Request, res: Response) => {
  const { action, proctorNotes, reviewerId } = req.body;
  if (!action || !proctorNotes || !reviewerId) {
    return res.status(400).json({ error: 'Action, proctorNotes, and reviewerId are mandatory for audit compliance' });
  }

  const effectiveReviewer = (req.user && req.user.sub) ? req.user.sub : reviewerId;
  const normalizedAction = normalizeAction(action);
  const db = getDb();
  const event = db.prepare('SELECT * FROM observation_events WHERE id = ?').get(req.params.eventId) as any;
  if (!event) return res.status(404).json({ error: 'Exam event not found' });

  db.prepare(`
    UPDATE observation_events
    SET review_status = ?,
        proctor_notes = ?,
        reviewer_id = ?,
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(normalizedAction, proctorNotes, effectiveReviewer, req.params.eventId);

  // Write to immutable audit log
  const auditId = genId('aud');
  db.prepare(`
    INSERT INTO exam_audit_log (id, event_id, exam_session_id, proctor_id, previous_status, new_status, action, reason_code, proctor_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(auditId, req.params.eventId, event.exam_session_id, effectiveReviewer, event.review_status, normalizedAction, normalizedAction, 'PROCTOR_REVIEW', proctorNotes);

  // Log activity
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(genId('act'), effectiveReviewer, 'exams', 'OBSERVATION_REVIEWED', `Observation ${event.event_type} reviewed: ${normalizedAction}`);

  res.status(200).json({
    success: true,
    eventId: req.params.eventId,
    previousStatus: event.review_status,
    newStatus: normalizedAction,
    auditLogId: auditId,
    resolvedAt: new Date().toISOString(),
  });
});

// GET /api/exams/audit-log/:sessionId
examsRouter.get('/audit-log/:sessionId', requireAssignedExamSession('sessionId'), (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT al.*, u.name as reviewer_name
    FROM exam_audit_log al
    JOIN users u ON al.proctor_id = u.id
    WHERE al.exam_session_id = ?
    ORDER BY al.timestamp_utc DESC
  `).all(req.params.sessionId);
  res.json(rows);
});
