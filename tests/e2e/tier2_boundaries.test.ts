import { describe, it, expect, beforeEach } from 'vitest';
import { getTestClient, resetTestDb } from '../helpers/test_client';

describe('Tier 2: Boundary, Limit & Corner Case Verification', () => {
  beforeEach(() => {
    resetTestDb();
  });

  // =========================================================================
  // RIDE-POOLING BOUNDARIES & LIMITS
  // =========================================================================
  describe('Ride-Pooling Boundary Conditions', () => {
    it('B01: rejects ride offer when origin and destination nodes are identical', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/rides/offers').send({
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_NORTH', // Identical
        departureTime: '10:00',
        totalSeats: 3,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('identical');
    });

    it('B02: rejects ride request when origin and destination nodes are identical', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/rides/requests').send({
        passengerId: 'stu-1',
        originNodeId: 'ACAD_QUAD',
        destinationNodeId: 'ACAD_QUAD', // Identical
        desiredTime: '10:00',
        seatsNeeded: 1,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('identical');
    });

    it('B03: rejects ride offer with zero or negative seat count', async () => {
      const client = await getTestClient();
      const resZero = await client.post('/api/rides/offers').send({
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 0,
      });
      expect(resZero.status).toBe(400);

      const resNeg = await client.post('/api/rides/offers').send({
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: -2,
      });
      expect(resNeg.status).toBe(400);
    });

    it('B04: rejects ride offer between non-existent campus nodes', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/rides/offers').send({
        driverId: 'drv-1',
        originNodeId: 'NON_EXISTENT_STATION',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid origin or destination');
    });

    it('B05: rejects ride booking when requested seats exceed driver available capacity', async () => {
      const client = await getTestClient();
      const off = await client.post('/api/rides/offers').send({
        driverId: 'drv-1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 1, // Only 1 seat
      });

      const req = await client.post('/api/rides/requests').send({
        passengerId: 'stu-1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 2, // Needs 2
      });

      const book = await client.post('/api/rides/book').send({
        offerId: off.body.offerId,
        requestId: req.body.requestId,
        seatsBooked: 2,
      });
      expect(book.status).toBe(400);
      expect(book.body.error).toContain('Insufficient available seats');
    });

    it('B06: handles zero active ride offers gracefully with empty array', async () => {
      const client = await getTestClient();
      const res = await client.get('/api/rides/offers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  // =========================================================================
  // EXAM MONITORING BOUNDARIES & PROVENANCE INTEGRITY
  // =========================================================================
  describe('Exam Monitoring Provenance & Guardrails', () => {
    it('B07: rejects exam event with missing or invalid provenance classification', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/exams/events').send({
        examSessionId: 'exam-cs301',
        eventType: 'HEAD_POSE_DEVIATION',
        confidenceScore: 0.9,
        provenance: 'UNVERIFIED_CUSTOM_TAG', // Invalid
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid provenance tag');
    });

    it('B08: supports ESTIMATED_METRIC for camera feed loss without autonomous disqualification', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/exams/events').send({
        examSessionId: 'exam-cs301',
        eventType: 'FEED_LOST_METRIC',
        confidenceScore: 0.99,
        provenance: 'ESTIMATED_METRIC',
      });
      expect(res.status).toBe(201);
      expect(res.body.reviewStatus).toBe('PENDING_REVIEW');
      expect(res.body.notice).toContain('NO AUTOMATED PENALTY APPLIED');
    });

    it('B09: rejects proctor review resolution when mandatory notes or reviewer ID are omitted', async () => {
      const client = await getTestClient();
      const ev = await client.post('/api/exams/events').send({
        examSessionId: 'exam-cs301',
        eventType: 'HEAD_POSE_DEVIATION',
        confidenceScore: 0.85,
        provenance: 'ACTUAL_INFERENCE',
      });
      const eventId = ev.body.eventId;

      // Missing notes
      const noNotes = await client.patch(`/api/exams/events/${eventId}/review`).send({
        action: 'DISMISS_FALSE_POSITIVE',
        reviewerId: 'proctor-1',
      });
      expect(noNotes.status).toBe(400);
      expect(noNotes.body.error).toContain('mandatory');

      // Missing reviewerId
      const noReviewer = await client.patch(`/api/exams/events/${eventId}/review`).send({
        action: 'DISMISS_FALSE_POSITIVE',
        proctorNotes: 'Lighting artifact caused false detection',
      });
      expect(noReviewer.status).toBe(400);
    });

    it('B10: returns 404 when querying events or audit log for non-existent exam session', async () => {
      const client = await getTestClient();
      const events = await client.get('/api/exams/events/non-existent-exam');
      expect(events.status).toBe(200);
      expect(events.body).toEqual([]);

      const audit = await client.get('/api/exams/audit-log/non-existent-exam');
      expect(audit.status).toBe(200);
      expect(audit.body).toEqual([]);
    });
  });

  // =========================================================================
  // DIGITAL WELLBEING PRIVACY BOUNDARIES
  // =========================================================================
  describe('Digital Wellbeing Privacy Guardrails & Edge Cases', () => {
    it('B11: prevents user from starting multiple concurrent active focus sessions', async () => {
      const client = await getTestClient();
      const first = await client.post('/api/wellbeing/sessions/start').send({
        userId: 'stu-1',
        targetDurationMins: 45,
      });
      expect(first.status).toBe(201);

      // Attempt second concurrent active session
      const second = await client.post('/api/wellbeing/sessions/start').send({
        userId: 'stu-1',
        targetDurationMins: 60,
      });
      expect(second.status).toBe(409);
      expect(second.body.error).toContain('already has an active focus session');
    });

    it('B12: suppresses cohort aggregate metrics when department has fewer than 5 students (k-anonymity)', async () => {
      const client = await getTestClient();
      // 'Electrical Eng' has only 1 student in seed data (stu-3)
      const res = await client.get('/api/wellbeing/cohort-aggregate?department=Electrical+Eng&minCohort=5');
      expect(res.status).toBe(200);
      expect(res.body.isSuppressed).toBe(true);
      expect(res.body.suppressionReason).toContain('INSUFFICIENT_COHORT_SIZE');
    });

    it('B13: thoroughly sanitizes deeply nested URLs and SQL-like strings in browsing events', async () => {
      const client = await getTestClient();
      const start = await client.post('/api/wellbeing/sessions/start').send({
        userId: 'stu-4',
        targetDurationMins: 30,
      });
      const sessId = start.body.sessionId;

      const ev = await client.post('/api/wellbeing/events').send({
        sessionId: sessId,
        userId: 'stu-4',
        domain: "https://secure.bank.com:8443/login?user=admin'--#token=123",
        durationSeconds: 60,
      });
      expect(ev.status).toBe(201);
      expect(ev.body.sanitizedDomain).toBe('secure.bank.com');
      expect(ev.body.sanitizedDomain).not.toContain('login');
      expect(ev.body.sanitizedDomain).not.toContain('admin');
    });

    it('B14: handles user history purge when user has zero existing browsing records without crashing', async () => {
      const client = await getTestClient();
      const res = await client.delete('/api/wellbeing/history/user-without-history');
      expect(res.status).toBe(200);
      expect(res.body.deletedEventsCount).toBe(0);
      expect(res.body.deletedSessionsCount).toBe(0);
    });
  });

  // =========================================================================
  // ACADEMIC HUB & WORKLOAD BOUNDARIES
  // =========================================================================
  describe('Academic Hub & Sustainability Edge Cases', () => {
    it('B15: rejects resource rating strictly outside 1 to 5 range', async () => {
      const client = await getTestClient();
      const zeroRate = await client.post('/api/hub/resources/res-1/rate').send({
        rating: 0,
        userId: 'stu-1',
      });
      expect(zeroRate.status).toBe(400);

      const sixRate = await client.post('/api/hub/resources/res-1/rate').send({
        rating: 6,
        userId: 'stu-1',
      });
      expect(sixRate.status).toBe(400);
    });

    it('B16: returns 404 when querying non-existent student profile', async () => {
      const client = await getTestClient();
      const res = await client.get('/api/hub/profile/non-existent-student');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('B17: rejects duplicate pending mentorship requests to the same mentor', async () => {
      const client = await getTestClient();
      const first = await client.post('/api/hub/mentorship-requests').send({
        menteeId: 'stu-1',
        mentorId: 'mentor-1',
        topic: 'First attempt',
        preferredSlot: 'Mon 16:00',
      });
      expect(first.status).toBe(201);

      const duplicate = await client.post('/api/hub/mentorship-requests').send({
        menteeId: 'stu-1',
        mentorId: 'mentor-1',
        topic: 'Duplicate attempt',
        preferredSlot: 'Mon 16:00',
      });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error).toContain('Duplicate pending');
    });

    it('B18: returns 404 when scaling an unknown service workload', async () => {
      const client = await getTestClient();
      const res = await client.post('/api/sustainability/workloads/unknown-service-xyz/scale').send({
        targetRps: 500,
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
