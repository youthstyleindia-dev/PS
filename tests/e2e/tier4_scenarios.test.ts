import { describe, it, expect, beforeEach } from 'vitest';
import { getTestClient, resetTestDb } from '../helpers/test_client';

describe('Tier 4: Real-World End-to-End User Journeys', () => {
  beforeEach(() => {
    resetTestDb();
  });

  // =========================================================================
  // SCENARIO 1: COMPLETE STUDENT JOURNEY
  // =========================================================================
  it('Scenario 1: Student Journey — Placement Prep, Mentorship Request, Study Resources & Focus Session', async () => {
    const client = await getTestClient();

    // Step 1: Fetch initial student profile
    const profileRes = await client.get('/api/hub/profile/stu-1');
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.name).toBe('Aarav Sharma');
    expect(profileRes.body.readinessScore).toBe(50); // 2 of 4 milestones completed

    // Step 2: Update target role and skills
    const updateRes = await client.put('/api/hub/profile/stu-1').send({
      targetRole: 'Staff Distributed Systems Engineer',
      skills: ['TypeScript', 'C++', 'Go', 'Distributed Consensus', 'Kafka'],
    });
    expect(updateRes.status).toBe(200);

    // Step 3: Complete remaining milestones (m-3 and m-4) to reach 100% readiness
    await client.post('/api/hub/placement-milestones/stu-1/toggle').send({ milestoneId: 'm-3' });
    const toggleM4 = await client.post('/api/hub/placement-milestones/stu-1/toggle').send({ milestoneId: 'm-4' });
    expect(toggleM4.status).toBe(200);
    expect(toggleM4.body.readinessScore).toBe(100);

    const fullMilestones = await client.get('/api/hub/placement-milestones/stu-1');
    expect(fullMilestones.body.progressPct).toBe(100);

    // Step 4: Discover mentors and submit request to Priya Patel (Google)
    const mentorsRes = await client.get('/api/hub/mentors?company=Google');
    expect(mentorsRes.status).toBe(200);
    expect(mentorsRes.body.length).toBeGreaterThanOrEqual(1);
    const googleMentor = mentorsRes.body[0];

    const mentorReq = await client.post('/api/hub/mentorship-requests').send({
      menteeId: 'stu-1',
      mentorId: googleMentor.id,
      topic: 'System Architecture & Concurrency in Large Distributed Systems',
      preferredSlot: 'Mon 16:00',
    });
    expect(mentorReq.status).toBe(201);
    expect(mentorReq.body.status).toBe('pending');

    // Step 5: Search for CS301 exam resources and rate top resource
    const resources = await client.get('/api/hub/resources?courseCode=CS301');
    expect(resources.status).toBe(200);
    expect(resources.body.length).toBeGreaterThanOrEqual(1);
    const targetResource = resources.body[0];

    const rateRes = await client.post(`/api/hub/resources/${targetResource.id}/rate`).send({
      rating: 5,
      userId: 'stu-1',
    });
    expect(rateRes.status).toBe(200);
    expect(rateRes.body.averageRating).toBeGreaterThanOrEqual(4.0);

    // Step 6: Complete a productive study session with high Deep Work Index
    const sessionStart = await client.post('/api/wellbeing/sessions/start').send({
      userId: 'stu-1',
      targetDurationMins: 60,
      goal: 'CS301 Distributed Systems Preparation',
    });
    expect(sessionStart.status).toBe(201);
    const sessionId = sessionStart.body.sessionId;

    // Ingest productive research browsing events
    await client.post('/api/wellbeing/events').send({
      sessionId,
      userId: 'stu-1',
      domain: 'https://github.com/torvalds/linux',
      durationSeconds: 1800,
    });
    await client.post('/api/wellbeing/events').send({
      sessionId,
      userId: 'stu-1',
      domain: 'https://stackoverflow.com/questions/system-calls',
      durationSeconds: 1800,
    });

    const stopSession = await client.post(`/api/wellbeing/sessions/${sessionId}/stop`);
    expect(stopSession.status).toBe(200);
    expect(stopSession.body.analytics.deepWorkIndex).toBeGreaterThanOrEqual(80);
    expect(stopSession.body.analytics.contextSwitchCount).toBe(0);
  });

  // =========================================================================
  // SCENARIO 2: COMPLETE DRIVER JOURNEY
  // =========================================================================
  it('Scenario 2: Driver Journey — Morning Commute Offer, Passenger Pooling, Dynamic Detour & Eco-Savings', async () => {
    const client = await getTestClient();

    // Step 1: Inspect campus graph and live morning rush traffic
    const graphRes = await client.get('/api/rides/graph?time=08:30');
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.liveCongestionMultiplier).toBe(1.65);

    // Step 2: Driver Karan publishes morning EV commute from GATE_NORTH to GATE_SOUTH
    const offerRes = await client.post('/api/rides/offers').send({
      driverId: 'drv-1',
      originNodeId: 'GATE_NORTH',
      destinationNodeId: 'GATE_SOUTH',
      departureTime: '08:30',
      totalSeats: 3,
      vehicleType: 'ELECTRIC_VEHICLE',
    });
    expect(offerRes.status).toBe(201);
    const offerId = offerRes.body.offerId;
    expect(offerRes.body.availableSeats).toBe(3);

    // Step 3: Passenger stu-1 requests ride along compatible corridor
    const req1Res = await client.post('/api/rides/requests').send({
      passengerId: 'stu-1',
      originNodeId: 'DORM_NORTH',
      destinationNodeId: 'STUDENT_CTR',
      desiredTime: '08:30',
      seatsNeeded: 1,
      maxDetourRatio: 0.35,
    });
    expect(req1Res.status).toBe(201);
    const req1Id = req1Res.body.requestId;

    // Step 4: Match and book passenger 1
    const match1 = await client.post('/api/rides/match').send({ offerId, requestId: req1Id });
    expect(match1.status).toBe(200);
    expect(match1.body.matched).toBe(true);
    expect(match1.body.detourRatio).toBeLessThanOrEqual(0.35);

    const book1 = await client.post('/api/rides/book').send({
      offerId,
      requestId: req1Id,
      seatsBooked: 1,
    });
    expect(book1.status).toBe(201);
    expect(book1.body.seatsRemaining).toBe(2);

    // Step 5: Passenger stu-4 requests ride along the same remaining trajectory
    const req2Res = await client.post('/api/rides/requests').send({
      passengerId: 'stu-4',
      originNodeId: 'ACAD_QUAD',
      destinationNodeId: 'DORM_SOUTH',
      desiredTime: '08:35',
      seatsNeeded: 1,
      maxDetourRatio: 0.35,
    });
    expect(req2Res.status).toBe(201);
    const req2Id = req2Res.body.requestId;

    const book2 = await client.post('/api/rides/book').send({
      offerId,
      requestId: req2Id,
      seatsBooked: 1,
    });
    expect(book2.status).toBe(201);
    expect(book2.body.seatsRemaining).toBe(1);

    // Step 6: Verify total savings and shared distance
    expect(book1.body.carbonSavedKg + book2.body.carbonSavedKg).toBeGreaterThan(0);
    expect(book1.body.fareCharged).toBeGreaterThan(0);
    expect(book1.body.driverEarnings).toBeGreaterThan(0);

    // Step 7: Central activity log records both carpool bookings
    const activity = await client.get('/api/common/activity');
    const rideLogs = activity.body.filter((a: any) => a.action === 'RIDE_BOOKED');
    expect(rideLogs.length).toBeGreaterThanOrEqual(2);
  });

  // =========================================================================
  // SCENARIO 3: COMPLETE PROCTOR JOURNEY
  // =========================================================================
  it('Scenario 3: Proctor Journey — Exam Observation Ingestion, 3-Tier Provenance, HITL Triage & Audit Trail', async () => {
    const client = await getTestClient();

    // Step 1: Proctor accesses active exam sessions
    const sessions = await client.get('/api/exams/sessions');
    expect(sessions.status).toBe(200);
    const exam = sessions.body.find((e: any) => e.id === 'exam-cs301');
    expect(exam).toBeDefined();

    // Step 2: CV model emits ACTUAL_INFERENCE event (sustained head pose turn)
    const actualInference = await client.post('/api/exams/events').send({
      examSessionId: exam.id,
      eventType: 'HEAD_POSE_DEVIATION',
      confidenceScore: 0.94,
      frameSnapshotUrl: 'https://universe.edu/cv/frames/frame_0182.jpg',
      provenance: 'ACTUAL_INFERENCE',
    });
    expect(actualInference.status).toBe(201);
    expect(actualInference.body.reviewStatus).toBe('PENDING_REVIEW');
    expect(actualInference.body.provenance).toBe('ACTUAL_INFERENCE');
    expect(actualInference.body.notice).toContain('NO AUTOMATED PENALTY APPLIED');
    const ev1Id = actualInference.body.eventId;

    // Step 3: Benchmarking harness injects SIMULATED_EVENT (multi-person zone intrusion)
    const simulatedEvent = await client.post('/api/exams/events').send({
      examSessionId: exam.id,
      eventType: 'UNAUTHORIZED_PERSON',
      confidenceScore: 0.88,
      frameSnapshotUrl: 'https://universe.edu/cv/frames/frame_0210.jpg',
      provenance: 'SIMULATED_EVENT',
    });
    expect(simulatedEvent.status).toBe(201);
    expect(simulatedEvent.body.provenance).toBe('SIMULATED_EVENT');
    const ev2Id = simulatedEvent.body.eventId;

    // Step 4: Network telemetry emits ESTIMATED_METRIC (brief webcam frame drop)
    const estimatedMetric = await client.post('/api/exams/events').send({
      examSessionId: exam.id,
      eventType: 'FEED_LOST_METRIC',
      confidenceScore: 0.99,
      provenance: 'ESTIMATED_METRIC',
    });
    expect(estimatedMetric.status).toBe(201);
    expect(estimatedMetric.body.provenance).toBe('ESTIMATED_METRIC');
    const ev3Id = estimatedMetric.body.eventId;

    // Step 5: Proctor reviews Incident 1 (Head Turn): Dismisses as benign behavior
    const review1 = await client.patch(`/api/exams/events/${ev1Id}/review`).send({
      action: 'DISMISS_BENIGN_BEHAVIOR',
      proctorNotes: 'Student consulted approved physical scratch sheet on desk surface',
      reviewerId: 'proctor-1',
    });
    expect(review1.status).toBe(200);
    expect(review1.body.newStatus).toBe('DISMISS_BENIGN_BEHAVIOR');

    // Step 6: Proctor reviews Incident 2 (Multi-Person): Escalates to chief invigilator
    const review2 = await client.patch(`/api/exams/events/${ev2Id}/review`).send({
      action: 'ESCALATE',
      proctorNotes: 'Unidentified person entered the exam desk perimeter; requesting physical invigilator verification',
      reviewerId: 'proctor-1',
    });
    expect(review2.status).toBe(200);
    expect(review2.body.newStatus).toBe('ESCALATE');

    // Step 7: Proctor reviews Incident 3 (Feed Lost): Dismisses as transient network jitter
    const review3 = await client.patch(`/api/exams/events/${ev3Id}/review`).send({
      action: 'DISMISS_FALSE_POSITIVE',
      proctorNotes: 'Webcam reconnect confirmed within 800ms; benign network jitter',
      reviewerId: 'proctor-1',
    });
    expect(review3.status).toBe(200);
    expect(review3.body.newStatus).toBe('DISMISS_FALSE_POSITIVE');

    // Step 8: Verify immutable audit log reflects all 3 human decisions with timestamps
    const auditRes = await client.get(`/api/exams/audit-log/${exam.id}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.length).toBe(3);
    const actions = auditRes.body.map((a: any) => a.new_status);
    expect(actions).toContain('DISMISS_BENIGN_BEHAVIOR');
    expect(actions).toContain('ESCALATE');
    expect(actions).toContain('DISMISS_FALSE_POSITIVE');
  });

  // =========================================================================
  // SCENARIO 4: COMPLETE SYSTEM ADMINISTRATOR JOURNEY
  // =========================================================================
  it('Scenario 4: System Admin Journey — Telemetry Monitoring, Workload Scaling, Scenario Toggle & Power Savings', async () => {
    const client = await getTestClient();

    // Step 1: Admin lists all 3 campus workloads
    const servicesRes = await client.get('/api/sustainability/services');
    expect(servicesRes.status).toBe(200);
    expect(servicesRes.body.length).toBe(3);

    // Step 2: Query daytime telemetry snapshots during solar peak window (Hour 13)
    const daytimeTel = await client.get('/api/sustainability/telemetry?hour=13');
    expect(daytimeTel.status).toBe(200);
    expect(daytimeTel.body.snapshots[0].gridCarbonIntensity).toBe(190.0); // Clean solar
    expect(daytimeTel.body.provenanceDisclosures.power).toContain('ESTIMATED_METRIC');
    const initialPower = daytimeTel.body.totalPowerWatts;

    // Step 3: Scale AI GPU Cluster due to student ML model training demand surge
    const scaleRes = await client.post('/api/sustainability/workloads/srv-ai-gpu/scale').send({
      targetRps: 60,
      currentReplicas: 6,
    });
    expect(scaleRes.status).toBe(200);
    expect(scaleRes.body.targetRps).toBe(60);
    expect(scaleRes.body.currentReplicas).toBe(6);

    // Step 4: Compare Baseline (PUE 1.75) vs Eco-Scaled (PUE 1.20) scenarios
    const scenarioRes = await client.get('/api/sustainability/scenarios');
    expect(scenarioRes.status).toBe(200);
    expect(scenarioRes.body.savings.pctEnergySaved).toBeGreaterThanOrEqual(30.0);
    expect(scenarioRes.body.savings.costSavedInr).toBeGreaterThan(0);

    // Step 5: Toggle Eco Optimization ON
    const toggleRes = await client.post('/api/sustainability/toggle-optimization').send({
      enabled: true,
    });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.ecoOptimizationEnabled).toBe(true);

    // Step 6: Verify telemetry reflects updated eco PUE 1.20
    const ecoTel = await client.get('/api/sustainability/telemetry?hour=13');
    expect(ecoTel.status).toBe(200);
    expect(ecoTel.body.ecoOptimizationActive).toBe(true);
    expect(ecoTel.body.snapshots[0].pue).toBe(1.20);
  });
});
