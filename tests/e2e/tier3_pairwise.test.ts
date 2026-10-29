import { describe, it, expect, beforeEach } from 'vitest';
import { getTestClient, resetTestDb } from '../helpers/test_client';

describe('Tier 3: Cross-Module Interactions & Pairwise Integration', () => {
  beforeEach(() => {
    resetTestDb();
  });

  it('X01: Ride-Pooling booking directly feeds carbon savings into the Central Activity Stream', async () => {
    const client = await getTestClient();

    // 1. Create offer & request
    const off = await client.post('/api/rides/offers').send({
      driverId: 'drv-1',
      originNodeId: 'GATE_NORTH',
      destinationNodeId: 'GATE_SOUTH',
      departureTime: '09:00',
      totalSeats: 3,
      vehicleType: 'ELECTRIC_VEHICLE',
    });

    const req = await client.post('/api/rides/requests').send({
      passengerId: 'stu-1',
      originNodeId: 'DORM_NORTH',
      destinationNodeId: 'STUDENT_CTR',
      desiredTime: '09:00',
      seatsNeeded: 1,
    });

    // 2. Book ride
    const bookRes = await client.post('/api/rides/book').send({
      offerId: off.body.offerId,
      requestId: req.body.requestId,
      seatsBooked: 1,
    });
    expect(bookRes.status).toBe(201);
    const carbonSaved = bookRes.body.carbonSavedKg;

    // 3. Verify Central Activity Stream logs the booking with carbon metric
    const actRes = await client.get('/api/common/activity');
    expect(actRes.status).toBe(200);
    const bookingLog = actRes.body.find((a: any) => a.action === 'RIDE_BOOKED');
    expect(bookingLog).toBeDefined();
    expect(bookingLog.module).toBe('ride_pooling');
    expect(bookingLog.user_id).toBe('stu-1');
    expect(bookingLog.details).toContain(`${carbonSaved}kg CO2e avoided`);
  });

  it('X02: Mentorship Request in Academic Hub triggers shared in-app notification to Mentor', async () => {
    const client = await getTestClient();

    // 1. Mentee stu-1 requests mentor-1 (user Priya Patel: stu-2)
    const reqRes = await client.post('/api/hub/mentorship-requests').send({
      menteeId: 'stu-1',
      mentorId: 'mentor-1',
      topic: 'Distributed Systems & Database Internals',
      preferredSlot: 'Mon 16:00',
    });
    expect(reqRes.status).toBe(201);

    // 2. Verify mentor-1's user (stu-2) received an in-app notification
    const notifRes = await client.get('/api/common/notifications/stu-2');
    expect(notifRes.status).toBe(200);
    const reqNotif = notifRes.body.find((n: any) => n.title === 'New Mentorship Request');
    expect(reqNotif).toBeDefined();
    expect(reqNotif.message).toContain('Distributed Systems');
  });

  it('X03: Mentor accepting request delivers acceptance notification to Mentee', async () => {
    const client = await getTestClient();

    const reqRes = await client.post('/api/hub/mentorship-requests').send({
      menteeId: 'stu-3',
      mentorId: 'mentor-2',
      topic: 'Graph Algorithms & LeetCode Hard',
      preferredSlot: 'Tue 17:00',
    });
    const requestId = reqRes.body.requestId;

    // Mentor accepts
    const acceptRes = await client.patch(`/api/hub/mentorship-requests/${requestId}`).send({
      status: 'accepted',
      notes: 'Happy to connect! Let us meet at Central Library 3rd floor.',
    });
    expect(acceptRes.status).toBe(200);

    // Mentee stu-3 receives notification
    const notifRes = await client.get('/api/common/notifications/stu-3');
    expect(notifRes.status).toBe(200);
    const acceptNotif = notifRes.body.find((n: any) => n.title.includes('ACCEPTED'));
    expect(acceptNotif).toBeDefined();
    expect(acceptNotif.message).toContain('Central Library');
  });

  it('X04: Academic milestone completion dynamically recalculates student profile readiness score', async () => {
    const client = await getTestClient();

    // Check initial readiness
    const initialProfile = await client.get('/api/hub/profile/stu-1');
    const initialScore = initialProfile.body.readinessScore;

    // Toggle milestone m-3 (Operating Systems) to completed
    const toggle = await client.post('/api/hub/placement-milestones/stu-1/toggle').send({
      milestoneId: 'm-3',
    });
    expect(toggle.status).toBe(200);

    // Profile readiness score must increase
    const updatedProfile = await client.get('/api/hub/profile/stu-1');
    expect(updatedProfile.body.readinessScore).toBeGreaterThan(initialScore);
  });

  it('X05: Exam observable event ingestion broadcasts alert to Shared Activity Log with provenance tag', async () => {
    const client = await getTestClient();

    const eventRes = await client.post('/api/exams/events').send({
      examSessionId: 'exam-cs301',
      eventType: 'UNAUTHORIZED_PERSON',
      confidenceScore: 0.92,
      provenance: 'ACTUAL_INFERENCE',
    });
    expect(eventRes.status).toBe(201);

    const actRes = await client.get('/api/common/activity');
    expect(actRes.status).toBe(200);
    const examLog = actRes.body.find((a: any) => a.action === 'OBSERVATION_FLAGGED');
    expect(examLog).toBeDefined();
    expect(examLog.module).toBe('exam_monitoring');
    expect(examLog.details).toContain('ACTUAL_INFERENCE');
  });

  it('X06: Proctor review action creates immutable entry in Exam Audit Log', async () => {
    const client = await getTestClient();

    const eventRes = await client.post('/api/exams/events').send({
      examSessionId: 'exam-cs301',
      eventType: 'HEAD_POSE_DEVIATION',
      confidenceScore: 0.89,
      provenance: 'SIMULATED_EVENT',
    });
    const eventId = eventRes.body.eventId;

    // Proctor triage
    const reviewRes = await client.patch(`/api/exams/events/${eventId}/review`).send({
      action: 'DISMISS_FALSE_POSITIVE',
      proctorNotes: 'Candidate was adjusting webcam tilt angle',
      reviewerId: 'proctor-1',
    });
    expect(reviewRes.status).toBe(200);

    // Audit log verification
    const auditRes = await client.get('/api/exams/audit-log/exam-cs301');
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.length).toBeGreaterThanOrEqual(1);
    const record = auditRes.body[0];
    expect(record.event_id).toBe(eventId);
    expect(record.previous_status).toBe('PENDING_REVIEW');
    expect(record.new_status).toBe('DISMISS_FALSE_POSITIVE');
    expect(record.notes).toContain('webcam tilt');
  });

  it('X07: Digital Wellbeing browsing events directly influence final Deep Work Index when session is stopped', async () => {
    const client = await getTestClient();

    const start = await client.post('/api/wellbeing/sessions/start').send({
      userId: 'stu-1',
      targetDurationMins: 45,
    });
    const sessId = start.body.sessionId;

    // Ingest productive events
    await client.post('/api/wellbeing/events').send({
      sessionId: sessId,
      userId: 'stu-1',
      domain: 'github.com',
      durationSeconds: 1200,
    });
    await client.post('/api/wellbeing/events').send({
      sessionId: sessId,
      userId: 'stu-1',
      domain: 'stackoverflow.com',
      durationSeconds: 600,
    });

    const stopRes = await client.post(`/api/wellbeing/sessions/${sessId}/stop`);
    expect(stopRes.status).toBe(200);
    // Since all events were productive and zero context switches, DWI should be high (>= 75)
    expect(stopRes.body.analytics.deepWorkIndex).toBeGreaterThanOrEqual(75);
    expect(stopRes.body.analytics.contextSwitchCount).toBe(0);
  });

  it('X08: Sustainable Observatory Eco toggle modifies real-time PUE and reduces facility power consumption', async () => {
    const client = await getTestClient();

    // 1. Initial baseline telemetry (PUE 1.75)
    const baseTel = await client.get('/api/sustainability/telemetry');
    const basePower = baseTel.body.totalPowerWatts;

    // 2. Enable eco optimization
    await client.post('/api/sustainability/toggle-optimization').send({ enabled: true });

    // 3. New telemetry (PUE 1.20)
    const ecoTel = await client.get('/api/sustainability/telemetry');
    const ecoPower = ecoTel.body.totalPowerWatts;

    // Eco power must be significantly less than baseline power
    expect(ecoPower).toBeLessThan(basePower);
    expect(ecoTel.body.snapshots[0].pue).toBe(1.20);
  });
});
