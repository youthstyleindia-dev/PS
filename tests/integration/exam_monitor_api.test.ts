import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';
import { getDb, initDb } from '../../server/src/db/connection';

describe('Integration Test Suite: Module E Vision Monitor API & Security Guardrails', () => {
  let student1Token: string;
  let student2Token: string;
  let driverToken: string;
  let proctorToken: string;
  let adminToken: string;

  const candidate1Id = 'usr_student_1';
  const candidate2Id = 'usr_student_2';
  const testExamSessionId = 'exam_test_vision_001';

  beforeAll(() => {
    initDb();
    const db = getDb();

    // Ensure users exist
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, department)
      VALUES (?, ?, ?, ?, ?)
    `).run(candidate1Id, 'Aarav Sharma', 'aarav.sharma@campus.edu', 'student', 'CSE');

    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, department)
      VALUES (?, ?, ?, ?, ?)
    `).run(candidate2Id, 'Diya Patel', 'diya.patel@campus.edu', 'student', 'CSE');

    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, department)
      VALUES (?, ?, ?, ?, ?)
    `).run('usr_proctor_1', 'Dr. Meenakshi Sundaram', 'm.sundaram@campus.edu', 'proctor', 'CSE');

    // Create a known exam session owned by candidate1
    db.prepare(`
      INSERT OR REPLACE INTO exam_sessions (id, course_id, title, student_id, scheduled_start, scheduled_end, status)
      VALUES (?, 'CS301', 'Distributed Algorithms Midterm', ?, '2026-10-30T10:00:00Z', '2026-10-30T12:00:00Z', 'scheduled')
    `).run(testExamSessionId, candidate1Id);

    student1Token = AuthService.signToken({
      id: candidate1Id,
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma'
    });

    student2Token = AuthService.signToken({
      id: candidate2Id,
      email: 'diya.patel@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Diya Patel'
    });

    driverToken = AuthService.signToken({
      id: 'usr_driver_1',
      email: 'driver@campus.edu',
      role: 'driver',
      roles: ['driver'],
      name: 'Vikram Rao'
    });

    proctorToken = AuthService.signToken({
      id: 'usr_proctor_1',
      email: 'm.sundaram@campus.edu',
      role: 'proctor',
      roles: ['proctor', 'ta_faculty'],
      name: 'Dr. Meenakshi Sundaram'
    });

    adminToken = AuthService.signToken({
      id: 'usr_admin_1',
      email: 'admin@campus.edu',
      role: 'admin',
      roles: ['admin'],
      name: 'System Admin'
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Capabilities & Health Endpoints
  // ---------------------------------------------------------------------------
  describe('1. System Capabilities & Model Registry Integrity', () => {
    it('GET /api/exam-monitor/capabilities returns local-browser mode and models', async () => {
      const res = await request(app).get('/api/exam-monitor/capabilities');
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('local-browser');
      expect(res.body.localInferenceOnly).toBe(true);
      expect(res.body.audioMonitoringEnabled).toBe(false); // Strict Non-Negotiable
      expect(res.body.videoRetentionEnabled).toBe(false);
      expect(res.body.models).toBeInstanceOf(Array);
      expect(res.body.models.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/exam-monitor/health returns ok status and registered model counts', async () => {
      const res = await request(app).get('/api/exam-monitor/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.inferencePipeline).toBe('browser-edge-mediapipe');
      expect(res.body.modelsRegistered).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Candidate Voluntary Vision Consent Flow
  // ---------------------------------------------------------------------------
  describe('2. Candidate Voluntary Vision Consent Flow', () => {
    it('allows authenticated session owner to record granted consent', async () => {
      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/vision-consent`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ consentStatus: 'granted', explanationVersion: 'v1.0' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.consentStatus).toBe('granted');
    });

    it('rejects invalid consentStatus values with HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/vision-consent`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ consentStatus: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('consentStatus');
    });

    it('blocks Candidate B from recording consent on Candidate A session with HTTP 403', async () => {
      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/vision-consent`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ consentStatus: 'granted' });

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Observation Ingestion & Privacy Guardrails
  // ---------------------------------------------------------------------------
  describe('3. Observation Metadata Ingestion & Privacy Guardrails', () => {
    it('STRICT PRIVACY GUARANTEE: rejects payload containing raw image/video data with HTTP 400', async () => {
      const invasivePayload = {
        eventId: 'obs_violating_1',
        eventType: 'repeated_head_orientation_change',
        source: 'LIVE_MODEL_INFERENCE',
        frame: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...', // Prohibited
        occurredAt: new Date().toISOString()
      };

      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send(invasivePayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('PRIVACY_VIOLATION');
    });

    it('successfully stores factual observation metadata and returns PENDING_REVIEW', async () => {
      const validPayload = {
        eventId: 'obs_head_valid_101',
        eventType: 'repeated_head_orientation_change',
        source: 'LIVE_MODEL_INFERENCE',
        occurredAt: new Date().toISOString(),
        modelKey: 'face_landmarker',
        modelVersion: '1.0.0',
        modelScore: null,
        ruleKey: 'rule_head_turn_v1',
        ruleVersion: '1.0.0',
        signalMetadata: {
          qualifying_turn_count: 3,
          max_abs_yaw_delta_degrees: 32.5,
          tracking_quality_status: 'GOOD'
        }
      };

      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.eventId).toBe('obs_head_valid_101');
      expect(res.body.reviewStatus).toBe('PENDING_REVIEW');
      expect(res.body.ethicalDisclaimer).toContain('ZERO AUTOMATED DISCIPLINARY PENALTY');
    });

    it('enforces idempotency: submitting same eventId twice does not create duplicate rows', async () => {
      const duplicatePayload = {
        eventId: 'obs_idempotent_test_01',
        eventType: 'person_detected_in_restricted_region',
        source: 'LIVE_MODEL_INFERENCE',
        occurredAt: new Date().toISOString(),
        modelScore: 0.86,
        ruleKey: 'rule_restricted_region_v1',
        ruleVersion: '1.0.0',
        signalMetadata: { region_name: 'Restricted Entry Frustum', dwell_seconds: 1.5 }
      };

      // First submission
      const res1 = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send(duplicatePayload);
      expect(res1.status).toBe(201);

      // Duplicate submission
      const res2 = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send(duplicatePayload);

      expect(res2.status).toBe(200);
      expect(res2.body.idempotent).toBe(true);
      expect(res2.body.eventId).toBe('obs_idempotent_test_01');
    });

    it('blocks Candidate B from submitting observations to Candidate A session with HTTP 403', async () => {
      const res = await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          eventId: 'obs_rogue_01',
          eventType: 'repeated_head_orientation_change',
          source: 'LIVE_MODEL_INFERENCE'
        });

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Proctor Review Workflow & Mandatory Audit Notes
  // ---------------------------------------------------------------------------
  describe('4. Proctor Review Authorization & Mandatory Audit Notes', () => {
    let reviewTargetObsId: string;

    beforeAll(async () => {
      reviewTargetObsId = 'obs_review_target_999';
      await request(app)
        .post(`/api/exam-sessions/${testExamSessionId}/observations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          eventId: reviewTargetObsId,
          eventType: 'person_detected_in_restricted_region',
          source: 'LIVE_MODEL_INFERENCE',
          modelScore: 0.88,
          ruleKey: 'rule_restricted_region_v1',
          ruleVersion: '1.0.0',
          signalMetadata: { dwell_seconds: 1.2 }
        });
    });

    it('blocks unauthorized roles (student, driver) from accessing proctor review with HTTP 403', async () => {
      const resStudent = await request(app)
        .post(`/api/proctor/observations/${reviewTargetObsId}/review`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ decision: 'DISMISS_BENIGN_BEHAVIOR', reviewNote: 'Student trying to review themselves' });
      expect(resStudent.status).toBe(403);

      const resDriver = await request(app)
        .post(`/api/proctor/observations/${reviewTargetObsId}/review`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ decision: 'DISMISS_BENIGN_BEHAVIOR', reviewNote: 'Driver trying to review' });
      expect(resDriver.status).toBe(403);
    });

    it('rejects proctor review submission if review note is blank or too short (< 5 chars) with HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/proctor/observations/${reviewTargetObsId}/review`)
        .set('Authorization', `Bearer ${proctorToken}`)
        .send({ decision: 'DISMISS_BENIGN_BEHAVIOR', reviewNote: 'ok' }); // Only 2 chars

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('mandatory for audit compliance');
    });

    it('successfully processes proctor review with meaningful note and appends to immutable audit trail', async () => {
      const res = await request(app)
        .post(`/api/proctor/observations/${reviewTargetObsId}/review`)
        .set('Authorization', `Bearer ${proctorToken}`)
        .send({
          decision: 'DISMISS_BENIGN_BEHAVIOR',
          reviewNote: 'Observed person in background was identified as exam floor invigilator verifying candidate seat assignment; benign action confirmed.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newStatus).toBe('DISMISS_BENIGN_BEHAVIOR');
      expect(res.body.auditLogId).toBeDefined();

      // Verify immutable audit log in SQLite
      const db = getDb();
      const auditEntry = db.prepare('SELECT * FROM exam_audit_log WHERE event_id = ?').get(reviewTargetObsId) as any;
      expect(auditEntry).toBeDefined();
      expect(auditEntry.proctor_id).toBe('usr_proctor_1');
      expect(auditEntry.proctor_notes).toContain('exam floor invigilator');
    });
  });
});
