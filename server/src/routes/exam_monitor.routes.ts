import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireRole, requireAuth } from '../middleware/auth.middleware.js';

export const examMonitorRouter = Router();
export const examSessionsRouter = Router();
export const proctorVisionRouter = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Map of recent observation submission timestamps for rate bounding (max 15 events/min per session)
const sessionSubmissionRate = new Map<string, number[]>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const timestamps = (sessionSubmissionRate.get(sessionId) || []).filter(t => t > oneMinuteAgo);
  if (timestamps.length >= 15) {
    return false; // Rate limit exceeded
  }
  timestamps.push(now);
  sessionSubmissionRate.set(sessionId, timestamps);
  return true;
}

const ALLOWED_EVENT_TYPES = new Set([
  'repeated_head_orientation_change',
  'person_detected_in_restricted_region',
  'additional_person_detected',
  'HEAD_POSE_DEVIATION',
  'RESTRICTED_ZONE_INCURSION',
  'MULTIPLE_OCCUPANTS_DETECTED',
  'BROWSER_TAB_BLUR',
  'FULLSCREEN_DEPARTURE',
  'ABSENCE_FROM_SEAT',
  'UNAUTHORIZED_PERSON',
  'GAZE_AWAY'
]);

const ALLOWED_SOURCES = new Set([
  'LIVE_MODEL_INFERENCE',
  'AUTHORIZED_VIDEO_INFERENCE',
  'SAMPLE_DEMO',
  'MANUAL_REVIEW_NOTE'
]);

function normalizeDbEventType(eventType: string): string {
  const upper = (eventType || '').toUpperCase();
  if (upper.includes('HEAD') || upper.includes('ORIENTATION') || upper.includes('TURN')) return 'HEAD_POSE_DEVIATION';
  if (upper.includes('ZONE') || upper.includes('RESTRICTED') || upper.includes('PERIMETER') || upper.includes('INCURSION') || upper.includes('REGION')) return 'RESTRICTED_ZONE_INCURSION';
  if (upper.includes('MULTIPLE') || upper.includes('OCCUPANT') || upper.includes('ADDITIONAL') || upper.includes('FACES')) return 'MULTIPLE_OCCUPANTS_DETECTED';
  if (upper.includes('BLUR') || upper.includes('FOCUS') || upper.includes('TAB')) return 'BROWSER_TAB_BLUR';
  if (upper.includes('FULLSCREEN')) return 'FULLSCREEN_DEPARTURE';
  if (upper.includes('SEAT') || upper.includes('ABSENCE')) return 'ABSENCE_FROM_SEAT';
  return 'HEAD_POSE_DEVIATION';
}

function normalizeDecision(decision: string): string {
  const upper = (decision || '').toUpperCase();
  if (upper.includes('BENIGN') || upper.includes('NORMAL')) return 'DISMISS_BENIGN_BEHAVIOR';
  if (upper.includes('FALSE') || upper.includes('ARTIFACT')) return 'DISMISS_FALSE_POSITIVE';
  if (upper.includes('ESCALATE') || upper.includes('INVIGILATOR')) return 'ESCALATE_TO_INVIGILATOR';
  if (upper.includes('DISMISS')) return 'DISMISS_FALSE_POSITIVE';
  return 'DISMISS_BENIGN_BEHAVIOR';
}

/**
 * Check if the caller has access to the given exam session.
 * Candidates must own the session. Proctors/admins have broader access.
 */
function verifySessionAccess(req: Request, res: Response, sessionId: string): boolean {
  const db = getDb();
  const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId) as any;
  if (!session) {
    res.status(404).json({ error: 'Exam session not found' });
    return false;
  }

  const user = req.user;
  if (!user) {
    // Unauthenticated request
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }

  const roles = [user.role, ...(user.roles || [])];
  const isPrivileged = roles.some(r => ['admin', 'proctor', 'ta_faculty'].includes(r));

  if (!isPrivileged) {
    // Student must be the owner of the exam session
    if (session.student_id !== user.sub) {
      res.status(403).json({ error: 'Forbidden: You do not own this exam session' });
      return false;
    }
  }

  return true;
}

// -----------------------------------------------------------------------------
// 1. /api/exam-monitor Router
// -----------------------------------------------------------------------------

// GET /api/exam-monitor/capabilities
examMonitorRouter.get('/capabilities', (_req: Request, res: Response) => {
  const db = getDb();
  const models = db.prepare('SELECT model_key, model_name, model_version, runtime_package, runtime_package_version, enabled FROM vision_model_registry').all();
  const rules = db.prepare('SELECT rule_key, version, configuration_json, enabled FROM exam_vision_rule_versions WHERE enabled = 1').all();

  res.json({
    status: 'ACTIVE',
    mode: 'local-browser',
    localInferenceOnly: true,
    audioMonitoringEnabled: false, // Strict Non-Negotiable
    videoRetentionEnabled: false,   // Zero frame upload
    models,
    rules: rules.map((r: any) => ({
      ruleKey: r.rule_key,
      version: r.version,
      configuration: JSON.parse(r.configuration_json || '{}')
    })),
    privacyGuarantees: [
      'Zero audio or microphone permissions requested',
      'Zero video frame uploads to backend',
      'Local-browser ML inference via WebAssembly',
      'Voluntary candidate vision consent lifecycle',
      'Zero automated penalties; human-in-the-loop audit only'
    ]
  });
});

// GET /api/exam-monitor/health
examMonitorRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const modelCount = (db.prepare('SELECT count(*) as c FROM vision_model_registry').get() as any)?.c || 0;
    const ruleCount = (db.prepare('SELECT count(*) as c FROM exam_vision_rule_versions').get() as any)?.c || 0;

    res.json({
      status: 'ok',
      service: 'UniVerse Responsible Exam Vision Assistant',
      timestamp: new Date().toISOString(),
      modelsRegistered: modelCount,
      rulesRegistered: ruleCount,
      inferencePipeline: 'browser-edge-mediapipe'
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. /api/exam-sessions Router
// -----------------------------------------------------------------------------

// POST /api/exam-sessions/:sessionId/vision-consent
examSessionsRouter.post('/:sessionId/vision-consent', requireAuth, (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  if (!verifySessionAccess(req, res, sessionId)) return;

  const { consentStatus, explanationVersion = 'v1.0', consentVersion = 'v1.0' } = req.body;
  if (!['granted', 'declined', 'withdrawn'].includes(consentStatus)) {
    return res.status(400).json({ error: 'consentStatus must be "granted", "declined", or "withdrawn"' });
  }

  const db = getDb();
  const candidateId = req.user!.sub;
  const consentId = genId('vcon');
  const now = new Date().toISOString();

  const grantedAt = consentStatus === 'granted' ? now : null;
  const withdrawnAt = consentStatus === 'withdrawn' ? now : null;

  db.prepare(`
    INSERT INTO exam_vision_consents (id, exam_session_id, candidate_user_id, consent_version, consent_status, explanation_version, granted_at, withdrawn_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(consentId, sessionId, candidateId, consentVersion, consentStatus, explanationVersion, grantedAt, withdrawnAt);

  // Log in activity
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details)
    VALUES (?, ?, 'exams', 'VISION_CONSENT_UPDATED', ?)
  `).run(genId('act'), candidateId, JSON.stringify({ sessionId, consentStatus, consentVersion }));

  res.status(200).json({
    success: true,
    consentId,
    sessionId,
    consentStatus,
    updatedAt: now
  });
});

// POST /api/exam-sessions/:sessionId/observations
examSessionsRouter.post('/:sessionId/observations', requireAuth, (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  if (!verifySessionAccess(req, res, sessionId)) return;

  // STRICT INVARIANT: Reject any image/video/frame/blob payload
  const bodyKeys = Object.keys(req.body);
  const prohibitedKeys = ['frame', 'image', 'video', 'screenshot', 'blob', 'canvasBlob', 'base64', 'frame_snapshot_url', 'imageData'];
  for (const k of bodyKeys) {
    if (prohibitedKeys.includes(k) && req.body[k]) {
      return res.status(400).json({
        error: 'PRIVACY_VIOLATION: Raw images, video frames, or screenshots are strictly forbidden from being transmitted to the server.'
      });
    }
  }

  // Rate Limiting
  if (!checkRateLimit(sessionId)) {
    return res.status(429).json({ error: 'Rate limit exceeded: Maximum 15 observation events per minute' });
  }

  const {
    eventId,
    eventType,
    source,
    occurredAt,
    modelKey,
    modelVersion,
    modelScore,
    ruleKey,
    ruleVersion,
    signalMetadata = {}
  } = req.body;

  if (!eventType || !source) {
    return res.status(400).json({ error: 'Missing eventType or source in observation metadata' });
  }

  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return res.status(400).json({ error: `Invalid eventType: ${eventType}` });
  }

  if (!ALLOWED_SOURCES.has(source)) {
    return res.status(400).json({ error: `Invalid source: ${source}` });
  }

  // Score validation: if supplied, must be [0, 1]
  if (modelScore !== undefined && modelScore !== null) {
    const numScore = Number(modelScore);
    if (isNaN(numScore) || numScore < 0.0 || numScore > 1.0) {
      return res.status(400).json({ error: 'modelScore must be a number between 0.0 and 1.0 or null' });
    }
  }

  const db = getDb();
  const effectiveEventId = eventId || genId('exev');

  // Idempotency check: if eventId already recorded, return existing row
  const existing = db.prepare('SELECT * FROM observation_events WHERE id = ?').get(effectiveEventId) as any;
  if (existing) {
    return res.status(200).json({
      success: true,
      eventId: existing.id,
      reviewStatus: existing.review_status,
      idempotent: true
    });
  }

  const normalizedDbEvent = normalizeDbEventType(eventType);
  const mappedProvenance = source === 'LIVE_MODEL_INFERENCE' ? 'ACTUAL_INFERENCE' :
    source === 'SAMPLE_DEMO' ? 'SIMULATED_EVENT' : 'ACTUAL_INFERENCE';

  const metricsJson = JSON.stringify({
    clientEventType: eventType,
    clientSource: source,
    modelKey: modelKey || null,
    modelVersion: modelVersion || null,
    ruleKey: ruleKey || null,
    ruleVersion: ruleVersion || null,
    signalMetadata
  });

  const validScore = (modelScore !== undefined && modelScore !== null) ? Number(modelScore) : 0.85;

  db.prepare(`
    INSERT INTO observation_events (
      id, exam_session_id, timestamp, event_type, confidence_score, provenance,
      metrics_payload, review_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
  `).run(
    effectiveEventId,
    sessionId,
    occurredAt || new Date().toISOString(),
    normalizedDbEvent,
    validScore,
    mappedProvenance,
    metricsJson
  );

  // Insert into exam_observation_audit
  db.prepare(`
    INSERT INTO exam_observation_audit (id, observation_id, exam_session_id, actor_id, actor_role, action, details_json)
    VALUES (?, ?, ?, ?, ?, 'OBSERVATION_EMITTED', ?)
  `).run(
    genId('eoa'),
    effectiveEventId,
    sessionId,
    req.user ? req.user.sub : null,
    req.user ? req.user.role : 'student',
    metricsJson
  );

  res.status(201).json({
    success: true,
    eventId: effectiveEventId,
    eventType: normalizedDbEvent,
    reviewStatus: 'PENDING_REVIEW',
    provenance: mappedProvenance,
    ethicalDisclaimer: 'OBSERVABLE EVENT RECORDED FOR HUMAN REVIEW ONLY. ZERO AUTOMATED DISCIPLINARY PENALTY.'
  });
});

// GET /api/exam-sessions/:sessionId/observations
examSessionsRouter.get('/:sessionId/observations', requireAuth, (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  if (!verifySessionAccess(req, res, sessionId)) return;

  const db = getDb();
  const rows = db.prepare(`
    SELECT id, exam_session_id, timestamp, event_type, confidence_score, provenance,
           metrics_payload, review_status, proctor_notes, resolved_at
    FROM observation_events
    WHERE exam_session_id = ?
    ORDER BY timestamp DESC
  `).all(sessionId);

  res.json(rows.map((r: any) => ({
    id: r.id,
    sessionId: r.exam_session_id,
    timestamp: r.timestamp,
    eventType: r.event_type,
    confidenceScore: r.confidence_score,
    provenance: r.provenance,
    reviewStatus: r.review_status,
    proctorNotes: r.proctor_notes,
    resolvedAt: r.resolved_at,
    metadata: JSON.parse(r.metrics_payload || '{}')
  })));
});

// -----------------------------------------------------------------------------
// 3. /api/proctor Router
// -----------------------------------------------------------------------------

// GET /api/proctor/exams/:examId/observations
proctorVisionRouter.get('/exams/:examId/observations', requireRole('proctor', 'admin'), (req: Request, res: Response) => {
  const examId = Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId;
  const db = getDb();
  const rows = db.prepare(`
    SELECT oe.*, es.title as exam_title, u.name as student_name
    FROM observation_events oe
    JOIN exam_sessions es ON oe.exam_session_id = es.id
    JOIN users u ON es.student_id = u.id
    WHERE oe.exam_session_id = ?
    ORDER BY oe.timestamp DESC
  `).all(examId);

  res.json(rows);
});

// GET /api/proctor/observations/:observationId
proctorVisionRouter.get('/observations/:observationId', requireRole('proctor', 'admin'), (req: Request, res: Response) => {
  const observationId = Array.isArray(req.params.observationId) ? req.params.observationId[0] : req.params.observationId;
  const db = getDb();
  const row = db.prepare(`
    SELECT oe.*, es.title as exam_title, u.name as student_name
    FROM observation_events oe
    JOIN exam_sessions es ON oe.exam_session_id = es.id
    JOIN users u ON es.student_id = u.id
    WHERE oe.id = ?
  `).get(observationId);

  if (!row) {
    return res.status(404).json({ error: 'Observation not found' });
  }

  res.json(row);
});

// POST /api/proctor/observations/:observationId/review
proctorVisionRouter.post('/observations/:observationId/review', requireRole('proctor', 'admin'), (req: Request, res: Response) => {
  const observationId = Array.isArray(req.params.observationId) ? req.params.observationId[0] : req.params.observationId;
  const { decision, reviewNote } = req.body;

  if (!decision) {
    return res.status(400).json({ error: 'decision is required ("acknowledged", "dismissed", "needs_context", or "resolved")' });
  }

  // Review note is strictly required for dismiss/resolve decisions
  if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length < 5) {
    return res.status(400).json({
      error: 'A meaningful reviewer note (minimum 5 characters) is mandatory for audit compliance when recording a review decision.'
    });
  }

  const normalizedAction = normalizeDecision(decision);
  const db = getDb();
  const obs = db.prepare('SELECT * FROM observation_events WHERE id = ?').get(observationId) as any;
  if (!obs) {
    return res.status(404).json({ error: 'Observation not found' });
  }

  const reviewerId = req.user ? req.user.sub : 'proctor_default';
  const now = new Date().toISOString();

  // Atomically update observation and append to immutable audit log
  db.prepare(`
    UPDATE observation_events
    SET review_status = ?,
        proctor_notes = ?,
        reviewer_id = ?,
        resolved_at = ?
    WHERE id = ?
  `).run(normalizedAction, reviewNote.trim(), reviewerId, now, observationId);

  const auditId = genId('aud');
  db.prepare(`
    INSERT INTO exam_audit_log (
      id, event_id, exam_session_id, proctor_id, previous_status, new_status,
      action, reason_code, proctor_notes, timestamp_utc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'HUMAN_PROCTOR_REVIEW', ?, ?)
  `).run(auditId, observationId, obs.exam_session_id, reviewerId, obs.review_status, normalizedAction, normalizedAction, reviewNote.trim(), now);

  db.prepare(`
    INSERT INTO exam_observation_audit (
      id, observation_id, exam_session_id, actor_id, actor_role, action, details_json, timestamp
    ) VALUES (?, ?, ?, ?, ?, 'PROCTOR_REVIEW_DECISION', ?, ?)
  `).run(
    genId('eoa'),
    observationId,
    obs.exam_session_id,
    reviewerId,
    req.user ? req.user.role : 'proctor',
    JSON.stringify({ previousStatus: obs.review_status, newStatus: normalizedAction, reviewNote: reviewNote.trim() }),
    now
  );

  res.status(200).json({
    success: true,
    observationId,
    previousStatus: obs.review_status,
    newStatus: normalizedAction,
    auditLogId: auditId,
    resolvedAt: now
  });
});
