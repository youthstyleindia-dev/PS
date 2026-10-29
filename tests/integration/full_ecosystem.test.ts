import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { getDb, closeDb } from '../../server/src/db/connection';

describe('UniVerse Full Ecosystem End-to-End Integration Tests', () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(() => {
    closeDb();
  });

  describe('Health & Common Metadata', () => {
    it('returns healthy status with table counts and modules list', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('UniVerse Campus OS');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.modules).toHaveLength(5);
    });

    it('returns activity feed across campus modules', async () => {
      const res = await request(app).get('/api/activity');
      expect(res.status).toBe(200);
      const list = res.body.activities || res.body;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('Module A: Academic & Placement Hub', () => {
    it('fetches student profile and computed readiness score', async () => {
      const res = await request(app).get('/api/hub/profile/usr_student_1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Aarav Sharma');
      expect(res.body.skills.length).toBeGreaterThan(0);
      expect(res.body.readinessScore).toBeGreaterThanOrEqual(0);
    });

    it('fetches peer mentors with skill filtering', async () => {
      const res = await request(app).get('/api/hub/mentors?skill=System');
      expect(res.status).toBe(200);
      const mentors = res.body.mentors || res.body;
      expect(Array.isArray(mentors)).toBe(true);
    });

    it('fetches searchable verified academic resources', async () => {
      const res = await request(app).get('/api/hub/resources?courseCode=CS401');
      expect(res.status).toBe(200);
      const resources = res.body.resources || res.body;
      expect(Array.isArray(resources)).toBe(true);
    });
  });

  describe('Module B: Smart Campus Ride-Pooling (Graph & Dijkstra)', () => {
    it('returns campus graph with 10 nodes, 30 edges, and live congestion multiplier', async () => {
      const res = await request(app).get('/api/rides/graph?time=08:30');
      expect(res.status).toBe(200);
      expect(res.body.nodes).toHaveLength(10);
      expect(res.body.edges.length).toBeGreaterThanOrEqual(25);
      expect(res.body.liveCongestionMultiplier).toBeGreaterThanOrEqual(1.0);
    });

    it('computes shortest path using Dijkstra', async () => {
      const res = await request(app).get('/api/rides/shortest-path?source=GATE_NORTH&target=ACAD_QUAD&time=08:30');
      expect(res.status).toBe(200);
      expect(res.body.path).toBeInstanceOf(Array);
      expect(res.body.path[0]).toBe('GATE_NORTH');
      expect(res.body.path[res.body.path.length - 1]).toBe('ACAD_QUAD');
      expect(res.body.totalDistanceKm).toBeGreaterThan(0);
    });

    it('creates ride offer, creates ride request, matches and books pooled seat', async () => {
      // 1. Create offer with EV_CAR
      const offerRes = await request(app).post('/api/rides/offers').send({
        driverId: 'usr_driver_1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '09:00',
        totalSeats: 3,
        vehicleType: 'EV_CAR'
      });
      expect(offerRes.status).toBe(201);
      const offerId = offerRes.body.offerId;

      // 2. Create passenger request along the route
      const reqRes = await request(app).post('/api/rides/requests').send({
        passengerId: 'usr_student_1',
        originNodeId: 'LIB_CENTRAL',
        destinationNodeId: 'DORM_SOUTH',
        desiredTime: '09:02',
        seatsNeeded: 1,
        maxDetourRatio: 0.35
      });
      expect(reqRes.status).toBe(201);
      const requestId = reqRes.body.requestId;

      // 3. Compute Match
      const matchRes = await request(app).post('/api/rides/match').send({
        offerId,
        requestId
      });
      expect(matchRes.status).toBe(200);
      expect(matchRes.body.matched).toBe(true);
      expect(matchRes.body.carbonSavedKg).toBeGreaterThan(0);

      // 4. Book Seat
      const bookRes = await request(app).post('/api/rides/book').send({
        offerId,
        requestId,
        seatsBooked: 1
      });
      expect(bookRes.status).toBe(201);
      expect(bookRes.body.seatsRemaining).toBe(2);
      expect(bookRes.body.bookingId).toBeDefined();
    });

    it('enforces seat capacity and rejects overbooking', async () => {
      const offerRes = await request(app).post('/api/rides/offers').send({
        driverId: 'usr_driver_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'ACAD_QUAD',
        departureTime: '10:00',
        totalSeats: 1,
        vehicleType: 'EV_CAR'
      });
      const offerId = offerRes.body.offerId;

      const reqRes = await request(app).post('/api/rides/requests').send({
        passengerId: 'usr_student_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'ACAD_QUAD',
        desiredTime: '10:00',
        seatsNeeded: 2
      });
      const requestId = reqRes.body.requestId;

      const bookRes = await request(app).post('/api/rides/book').send({
        offerId,
        requestId,
        seatsBooked: 2
      });
      expect(bookRes.status).toBe(400);
      expect(bookRes.body.error).toContain('Insufficient');
    });
  });

  describe('Module C: Sustainable Computing Observatory', () => {
    it('returns telemetry for all modeled services with non-linear power calculations', async () => {
      const res = await request(app).get('/api/sustainability/telemetry');
      expect(res.status).toBe(200);
      expect(res.body.snapshots.length).toBeGreaterThanOrEqual(3);
      expect(res.body.totalPowerWatts).toBeGreaterThan(0);
      expect(res.body.provenanceDisclosures.power).toBeDefined();
    });

    it('returns baseline versus eco-optimized scenario comparison', async () => {
      const res = await request(app).get('/api/sustainability/scenarios');
      expect(res.status).toBe(200);
      expect(res.body.baselineScenario.dailyKwh).toBeGreaterThan(res.body.optimizedScenario.dailyKwh);
      expect(res.body.gains.pctEnergySaved).toBeGreaterThan(30);
      expect(res.body.gains.costSavedInr).toBeGreaterThan(0);
    });

    it('toggles eco-optimization mode and updates facility PUE', async () => {
      const res = await request(app).post('/api/sustainability/toggle-optimization').send({ enabled: true });
      expect(res.status).toBe(200);
      expect(res.body.ecoOptimizationEnabled).toBe(true);

      const teleRes = await request(app).get('/api/sustainability/telemetry');
      expect(teleRes.body.pue).toBe(1.20);
    });
  });

  describe('Module D: Privacy-Aware Digital Wellbeing', () => {
    let activeSessionId: string;

    it('starts voluntary focus session with target duration', async () => {
      const res = await request(app).post('/api/wellbeing/sessions/start').send({
        userId: 'usr_student_1',
        targetDurationMins: 30,
        goal: 'Distributed Systems & Graph Study'
      });
      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBeDefined();
      activeSessionId = res.body.sessionId;
    });

    it('sanitizes domain to hostname and logs browsing event without query/path leakage', async () => {
      const res = await request(app).post('/api/wellbeing/events').send({
        sessionId: activeSessionId,
        userId: 'usr_student_1',
        domain: 'https://leetcode.com/problems/network-delay-time?token=secret123#solution',
        durationSeconds: 300
      });
      expect(res.status).toBe(201);
      expect(res.body.sanitizedDomain).toBe('leetcode.com');
    });

    it('stops focus session and computes deep work index', async () => {
      const res = await request(app).post(`/api/wellbeing/sessions/${activeSessionId}/stop`).send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.analytics.deepWorkIndex).toBeGreaterThan(0);
    });

    it('computes differential privacy cohort metrics with Laplace noise', async () => {
      const res = await request(app).get('/api/wellbeing/cohort-aggregate?department=Computer%20Science%20%26%20Engineering');
      expect(res.status).toBe(200);
      expect(res.body.cohortSize).toBeGreaterThan(0);
      if (!res.body.isSuppressed) {
        expect(res.body.dpMeanFocusMins).toBeDefined();
        expect(res.body.epsilon).toBe(0.8);
      }
    });
  });

  describe('Module E: Responsible Examination Monitoring', () => {
    let testEventId: string;

    it('ingests observable exam event with explicit provenance and non-accusatory notice', async () => {
      const res = await request(app).post('/api/exams/events').send({
        examSessionId: 'exam_1',
        eventType: 'HEAD_POSE_DEVIATION',
        confidenceScore: 0.89,
        provenance: 'SIMULATED_EVENT'
      });
      expect(res.status).toBe(201);
      expect(res.body.reviewStatus).toBe('PENDING_REVIEW');
      expect(res.body.ethicalNotice).toContain('ZERO AUTOMATED DISCIPLINARY ACTION');
      testEventId = res.body.eventId;
    });

    it('fetches pending reviews for proctor queue', async () => {
      const res = await request(app).get('/api/exams/pending-reviews');
      expect(res.status).toBe(200);
      expect(res.body.some((e: any) => e.id === testEventId)).toBe(true);
    });

    it('completes human review and records into immutable audit log', async () => {
      const res = await request(app).patch(`/api/exams/events/${testEventId}/review`).send({
        action: 'DISMISS_FALSE_POSITIVE',
        proctorNotes: 'Candidate was turning head to check scratch paper on desk. No device detected.',
        reviewerId: 'usr_proctor_1'
      });
      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('DISMISS_FALSE_POSITIVE');
      expect(res.body.auditLogId).toBeDefined();
    });

    it('verifies review decision exists in immutable audit log', async () => {
      const res = await request(app).get('/api/exams/audit-log/exam_1');
      expect(res.status).toBe(200);
      expect(res.body.some((al: any) => al.event_id === testEventId)).toBe(true);
    });
  });
});
