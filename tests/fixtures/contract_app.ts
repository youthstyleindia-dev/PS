import express, { Express, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { createTestDb } from './test_db';
import { CampusGraphOracle } from './algorithms/graph_oracle';
import { EnergyCarbonOracle } from './algorithms/energy_oracle';
import { PrivacyWellbeingOracle } from './algorithms/privacy_oracle';
import campusGraph from './campus_graph.json';

export function createContractApp(existingDb?: Database.Database): Express {
  const app = express();
  app.use(express.json());

  const db = existingDb || createTestDb(true);
  const graphOracle = new CampusGraphOracle();

  let ecoOptimizationEnabled = false;

  function genId(prefix: string): string {
    return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
  }

  // ----------------------------------------------------
  // COMMON & HEALTH
  // ----------------------------------------------------
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'UniVerse Campus Ecosystem API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  app.get('/api/common/activity', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const rows = db.prepare('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ?').all(limit);
    res.json(rows);
  });

  app.get('/api/common/notifications/:userId', (req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(rows);
  });

  // ----------------------------------------------------
  // MODULE A: ACADEMIC HUB
  // ----------------------------------------------------
  app.get('/api/hub/profile/:studentId', (req: Request, res: Response) => {
    const student = db.prepare('SELECT id, name, email, avatar, role, department, year_of_study, bio FROM users WHERE id = ?').get(req.params.studentId) as any;
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(req.params.studentId) as any;
    res.json({
      ...student,
      skills: profile?.skills ? JSON.parse(profile.skills) : [],
      interests: profile?.interests ? JSON.parse(profile.interests) : [],
      targetRole: profile?.target_role || null,
      readinessScore: profile?.readiness_score || 0,
      resumeUrl: profile?.resume_url || null,
    });
  });

  app.put('/api/hub/profile/:studentId', (req: Request, res: Response) => {
    const { skills, interests, targetRole, readinessScore, resumeUrl } = req.body;
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.studentId);
    if (!user) return res.status(404).json({ error: 'Student not found' });

    const existing = db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(req.params.studentId);
    if (existing) {
      db.prepare(`
        UPDATE student_profiles
        SET skills = COALESCE(?, skills),
            interests = COALESCE(?, interests),
            target_role = COALESCE(?, target_role),
            readiness_score = COALESCE(?, readiness_score),
            resume_url = COALESCE(?, resume_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        skills ? JSON.stringify(skills) : null,
        interests ? JSON.stringify(interests) : null,
        targetRole ?? null,
        readinessScore ?? null,
        resumeUrl ?? null,
        req.params.studentId
      );
    } else {
      db.prepare(`
        INSERT INTO student_profiles (user_id, skills, interests, target_role, readiness_score, resume_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        req.params.studentId,
        JSON.stringify(skills || []),
        JSON.stringify(interests || []),
        targetRole || null,
        readinessScore || 0,
        resumeUrl || null
      );
    }

    db.prepare(`
      INSERT INTO activity_log (id, user_id, module, action, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(genId('act'), req.params.studentId, 'academic_hub', 'PROFILE_UPDATED', 'Updated student skills and readiness profile');

    res.json({ success: true, message: 'Profile updated' });
  });

  app.get('/api/hub/placement-milestones/:studentId', (req: Request, res: Response) => {
    const milestones = db.prepare('SELECT * FROM placement_milestones WHERE student_id = ?').all(req.params.studentId) as any[];
    const total = milestones.length;
    const completedCount = milestones.filter((m) => m.completed === 1).length;
    const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    res.json({
      studentId: req.params.studentId,
      milestones,
      totalCount: total,
      completedCount,
      progressPct,
    });
  });

  app.post('/api/hub/placement-milestones/:studentId/toggle', (req: Request, res: Response) => {
    const { milestoneId } = req.body;
    if (!milestoneId) return res.status(400).json({ error: 'milestoneId is required' });

    const milestone = db.prepare('SELECT * FROM placement_milestones WHERE id = ? AND student_id = ?').get(milestoneId, req.params.studentId) as any;
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const newStatus = milestone.completed === 1 ? 0 : 1;
    const completedAt = newStatus === 1 ? new Date().toISOString() : null;

    db.prepare('UPDATE placement_milestones SET completed = ?, completed_at = ? WHERE id = ?').run(newStatus, completedAt, milestoneId);

    // Recalculate readiness score
    const all = db.prepare('SELECT completed FROM placement_milestones WHERE student_id = ?').all(req.params.studentId) as any[];
    const done = all.filter((m) => m.completed === 1).length;
    const newScore = Math.round((done / all.length) * 100);
    db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(newScore, req.params.studentId);

    res.json({ success: true, milestoneId, completed: newStatus === 1, readinessScore: newScore });
  });

  app.get('/api/hub/mentors', (req: Request, res: Response) => {
    const { skill, company } = req.query;
    let query = `
      SELECT m.id, m.user_id, u.name, u.email, u.avatar, m.company, m.available_slots, m.max_mentees, m.rating, sp.skills
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN student_profiles sp ON m.user_id = sp.user_id
    `;
    const params: any[] = [];
    if (company) {
      query += ` WHERE LOWER(m.company) LIKE ?`;
      params.push(`%${(company as string).toLowerCase()}%`);
    }

    const rows = db.prepare(query).all(...params) as any[];
    let formatted = rows.map((r) => ({
      ...r,
      availableSlots: JSON.parse(r.available_slots || '[]'),
      skills: JSON.parse(r.skills || '[]'),
    }));

    if (skill) {
      const s = (skill as string).toLowerCase();
      formatted = formatted.filter((m) => m.skills.some((sk: string) => sk.toLowerCase().includes(s)));
    }

    res.json(formatted);
  });

  app.post('/api/hub/mentorship-requests', (req: Request, res: Response) => {
    const { menteeId, mentorId, topic, preferredSlot } = req.body;
    if (!menteeId || !mentorId || !topic || !preferredSlot) {
      return res.status(400).json({ error: 'Missing required mentorship fields' });
    }

    // Check for duplicate pending
    const existing = db.prepare(`
      SELECT id FROM mentorship_requests WHERE mentee_id = ? AND mentor_id = ? AND status = 'pending'
    `).get(menteeId, mentorId);
    if (existing) {
      return res.status(409).json({ error: 'Duplicate pending mentorship request exists' });
    }

    const id = genId('req');
    db.prepare(`
      INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, menteeId, mentorId, topic, preferredSlot);

    // Notification to mentor
    const mentorUser = db.prepare('SELECT user_id FROM mentors WHERE id = ?').get(mentorId) as any;
    if (mentorUser) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, ?, ?, ?)
      `).run(genId('notif'), mentorUser.user_id, 'New Mentorship Request', `New request on ${topic}`, 'info');
    }

    res.status(201).json({ success: true, requestId: id, status: 'pending' });
  });

  app.get('/api/hub/mentorship-requests/:userId', (req: Request, res: Response) => {
    const sent = db.prepare(`
      SELECT mr.*, m.company, u.name as mentor_name
      FROM mentorship_requests mr
      JOIN mentors m ON mr.mentor_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE mr.mentee_id = ?
      ORDER BY mr.created_at DESC
    `).all(req.params.userId);

    const received = db.prepare(`
      SELECT mr.*, u.name as mentee_name, u.email as mentee_email
      FROM mentorship_requests mr
      JOIN mentors m ON mr.mentor_id = m.id
      JOIN users u ON mr.mentee_id = u.id
      WHERE m.user_id = ?
      ORDER BY mr.created_at DESC
    `).all(req.params.userId);

    res.json({ sent, received });
  });

  app.patch('/api/hub/mentorship-requests/:requestId', (req: Request, res: Response) => {
    const { status, notes } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    const reqRecord = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(req.params.requestId) as any;
    if (!reqRecord) return res.status(404).json({ error: 'Request not found' });

    db.prepare('UPDATE mentorship_requests SET status = ?, notes = ? WHERE id = ?').run(status, notes || null, req.params.requestId);

    // Notification to mentee
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(genId('notif'), reqRecord.mentee_id, `Mentorship Request ${status.toUpperCase()}`, notes || `Your request was ${status}`, status === 'accepted' ? 'success' : 'warning');

    res.json({ success: true, requestId: req.params.requestId, status, notes });
  });

  app.get('/api/hub/resources', (req: Request, res: Response) => {
    const { courseCode, category, query } = req.query;
    let sql = 'SELECT * FROM academic_resources WHERE 1=1';
    const params: any[] = [];

    if (courseCode) {
      sql += ' AND course_code = ?';
      params.push(courseCode);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (query) {
      sql += ' AND LOWER(title) LIKE ?';
      params.push(`%${(query as string).toLowerCase()}%`);
    }

    sql += ' ORDER BY downloads_count DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  app.post('/api/hub/resources', (req: Request, res: Response) => {
    const { title, courseCode, category, fileUrl, uploaderId } = req.body;
    if (!title || !courseCode || !category || !fileUrl || !uploaderId) {
      return res.status(400).json({ error: 'Missing required resource fields' });
    }

    const id = genId('res');
    db.prepare(`
      INSERT INTO academic_resources (id, title, course_code, category, file_url, uploader_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, courseCode, category, fileUrl, uploaderId);

    res.status(201).json({ success: true, resourceId: id });
  });

  app.post('/api/hub/resources/:resourceId/rate', (req: Request, res: Response) => {
    const { rating, userId } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const resource = db.prepare('SELECT id FROM academic_resources WHERE id = ?').get(req.params.resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const existing = db.prepare('SELECT id FROM resource_ratings WHERE resource_id = ? AND user_id = ?').get(req.params.resourceId, userId);
    if (existing) {
      db.prepare('UPDATE resource_ratings SET rating = ? WHERE resource_id = ? AND user_id = ?').run(rating, req.params.resourceId, userId);
    } else {
      db.prepare('INSERT INTO resource_ratings (id, resource_id, user_id, rating) VALUES (?, ?, ?, ?)').run(
        genId('rate'),
        req.params.resourceId,
        userId,
        rating
      );
    }

    // Recompute average
    const avgRow = db.prepare('SELECT AVG(rating) as avgR, COUNT(*) as cnt FROM resource_ratings WHERE resource_id = ?').get(req.params.resourceId) as any;
    const avgRating = Math.round(avgRow.avgR * 10) / 10;
    db.prepare('UPDATE academic_resources SET average_rating = ? WHERE id = ?').run(avgRating, req.params.resourceId);

    res.json({ success: true, resourceId: req.params.resourceId, averageRating: avgRating, totalRatings: avgRow.cnt });
  });

  // ----------------------------------------------------
  // MODULE B: RIDE-POOLING
  // ----------------------------------------------------
  app.get('/api/rides/graph', (req: Request, res: Response) => {
    const timeStr = (req.query.time as string) || '12:00';
    const congestion = graphOracle.getCongestionMultiplier(timeStr);
    res.json({
      nodes: campusGraph.nodes,
      edges: campusGraph.edges,
      liveCongestionMultiplier: congestion,
      activeTimeWindow: timeStr,
    });
  });

  app.post('/api/rides/offers', (req: Request, res: Response) => {
    const { driverId, originNodeId, destinationNodeId, departureTime, totalSeats, vehicleType } = req.body;
    if (!driverId || !originNodeId || !destinationNodeId || !departureTime || !totalSeats) {
      return res.status(400).json({ error: 'Missing required ride offer fields' });
    }
    if (totalSeats < 1) {
      return res.status(400).json({ error: 'Total seats must be at least 1' });
    }
    if (originNodeId === destinationNodeId) {
      return res.status(400).json({ error: 'Origin and destination cannot be identical' });
    }

    const path = graphOracle.findShortestPath(originNodeId, destinationNodeId, departureTime);
    if (!path) {
      return res.status(400).json({ error: 'Invalid origin or destination node' });
    }

    const id = genId('offer');
    db.prepare(`
      INSERT INTO ride_offers (id, driver_id, origin_node_id, destination_node_id, departure_time, total_seats, available_seats, vehicle_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(id, driverId, originNodeId, destinationNodeId, departureTime, totalSeats, totalSeats, vehicleType || 'PETROL_CAR');

    res.status(201).json({
      success: true,
      offerId: id,
      driverRoute: path.path,
      distanceKm: path.totalDistanceKm,
      timeMins: path.totalTimeMins,
      availableSeats: totalSeats,
    });
  });

  app.get('/api/rides/offers', (req: Request, res: Response) => {
    const offers = db.prepare(`
      SELECT ro.*, u.name as driver_name, u.avatar as driver_avatar
      FROM ride_offers ro
      JOIN users u ON ro.driver_id = u.id
      WHERE ro.status = 'open' AND ro.available_seats > 0
      ORDER BY ro.departure_time ASC
    `).all();
    res.json(offers);
  });

  app.post('/api/rides/requests', (req: Request, res: Response) => {
    const { passengerId, originNodeId, destinationNodeId, desiredTime, seatsNeeded, maxDetourRatio } = req.body;
    if (!passengerId || !originNodeId || !destinationNodeId || !desiredTime) {
      return res.status(400).json({ error: 'Missing required ride request fields' });
    }
    if (originNodeId === destinationNodeId) {
      return res.status(400).json({ error: 'Origin and destination cannot be identical' });
    }

    const path = graphOracle.findShortestPath(originNodeId, destinationNodeId, desiredTime);
    if (!path) {
      return res.status(400).json({ error: 'Invalid origin or destination node' });
    }

    const id = genId('req');
    db.prepare(`
      INSERT INTO ride_requests (id, passenger_id, origin_node_id, destination_node_id, desired_time, seats_needed, max_detour_ratio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, passengerId, originNodeId, destinationNodeId, desiredTime, seatsNeeded || 1, maxDetourRatio || 0.35);

    res.status(201).json({
      success: true,
      requestId: id,
      directDistanceKm: path.totalDistanceKm,
      directTimeMins: path.totalTimeMins,
      status: 'pending',
    });
  });

  app.post('/api/rides/match', (req: Request, res: Response) => {
    const { offerId, requestId } = req.body;
    if (!offerId || !requestId) {
      return res.status(400).json({ error: 'offerId and requestId are required' });
    }

    const offer = db.prepare('SELECT * FROM ride_offers WHERE id = ?').get(offerId) as any;
    const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
    if (!offer || !request) {
      return res.status(404).json({ error: 'Offer or request not found' });
    }

    const match = graphOracle.matchRide(
      {
        id: offer.id,
        driverId: offer.driver_id,
        originNodeId: offer.origin_node_id,
        destinationNodeId: offer.destination_node_id,
        departureTime: offer.departure_time,
        totalSeats: offer.total_seats,
        availableSeats: offer.available_seats,
        vehicleType: offer.vehicle_type,
      },
      {
        id: request.id,
        passengerId: request.passenger_id,
        originNodeId: request.origin_node_id,
        destinationNodeId: request.destination_node_id,
        desiredTime: request.desired_time,
        seatsNeeded: request.seats_needed,
        maxDetourRatio: request.max_detour_ratio,
      }
    );

    res.json(match);
  });

  app.post('/api/rides/book', (req: Request, res: Response) => {
    const { offerId, requestId, seatsBooked } = req.body;
    if (!offerId || !requestId) {
      return res.status(400).json({ error: 'offerId and requestId are required' });
    }

    const offer = db.prepare('SELECT * FROM ride_offers WHERE id = ?').get(offerId) as any;
    const request = db.prepare('SELECT * FROM ride_requests WHERE id = ?').get(requestId) as any;
    if (!offer || !request) return res.status(404).json({ error: 'Offer or request not found' });

    const seats = seatsBooked || request.seats_needed || 1;
    if (offer.available_seats < seats) {
      return res.status(400).json({ error: 'Insufficient available seats' });
    }

    const match = graphOracle.matchRide(
      {
        id: offer.id,
        driverId: offer.driver_id,
        originNodeId: offer.origin_node_id,
        destinationNodeId: offer.destination_node_id,
        departureTime: offer.departure_time,
        totalSeats: offer.total_seats,
        availableSeats: offer.available_seats,
        vehicleType: offer.vehicle_type,
      },
      {
        id: request.id,
        passengerId: request.passenger_id,
        originNodeId: request.origin_node_id,
        destinationNodeId: request.destination_node_id,
        desiredTime: request.desired_time,
        seatsNeeded: seats,
        maxDetourRatio: request.max_detour_ratio,
      }
    );

    if (!match.matched) {
      return res.status(400).json({ error: 'Ride match failed detour constraints', reason: match.reason });
    }

    const bookingId = genId('bk');
    const newSeats = offer.available_seats - seats;

    db.prepare('UPDATE ride_offers SET available_seats = ? WHERE id = ?').run(newSeats, offerId);
    db.prepare("UPDATE ride_requests SET status = 'booked' WHERE id = ?").run(requestId);

    const soloPassFare = 15.0 + 12.0 * (match.sharedKm || 1.0);
    const fareCharged = soloPassFare * 0.6;
    const driverEarnings = fareCharged * 0.85;

    db.prepare(`
      INSERT INTO ride_bookings (id, offer_id, request_id, seats_booked, shared_km, detour_km, carbon_saved_kg, fare_charged, driver_earnings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, offerId, requestId, seats, match.sharedKm, match.detourKm, match.carbonSavedKg, fareCharged, driverEarnings);

    // Activity log entry
    db.prepare(`
      INSERT INTO activity_log (id, user_id, module, action, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(genId('act'), request.passenger_id, 'ride_pooling', 'RIDE_BOOKED', `Booked pooled ride with ${match.carbonSavedKg}kg CO2e avoided`);

    res.status(201).json({
      success: true,
      bookingId,
      seatsRemaining: newSeats,
      sharedKm: match.sharedKm,
      carbonSavedKg: match.carbonSavedKg,
      fareCharged: Math.round(fareCharged * 100) / 100,
      driverEarnings: Math.round(driverEarnings * 100) / 100,
    });
  });

  // ----------------------------------------------------
  // MODULE C: SUSTAINABLE COMPUTING OBSERVATORY
  // ----------------------------------------------------
  app.get('/api/sustainability/services', (req: Request, res: Response) => {
    const services = db.prepare('SELECT * FROM workload_services').all();
    res.json(services);
  });

  app.post('/api/sustainability/workloads/:serviceId/scale', (req: Request, res: Response) => {
    const { targetRps, currentReplicas } = req.body;
    const svc = db.prepare('SELECT * FROM workload_services WHERE id = ?').get(req.params.serviceId);
    if (!svc) return res.status(404).json({ error: 'Service not found' });

    db.prepare(`
      UPDATE workload_services
      SET target_rps = COALESCE(?, target_rps),
          current_replicas = COALESCE(?, current_replicas)
      WHERE id = ?
    `).run(targetRps ?? null, currentReplicas ?? null, req.params.serviceId);

    res.json({ success: true, serviceId: req.params.serviceId, targetRps, currentReplicas });
  });

  app.get('/api/sustainability/telemetry', (req: Request, res: Response) => {
    const services = db.prepare('SELECT * FROM workload_services').all() as any[];
    const hour = req.query.hour ? parseInt(req.query.hour as string, 10) : new Date().getHours();
    const pue = ecoOptimizationEnabled ? 1.20 : 1.75;

    const snapshots = services.map((svc) => {
      const calc = EnergyCarbonOracle.computeTelemetry({
        serviceId: svc.id,
        rps: svc.target_rps,
        cpuPct: svc.cpu_pct,
        gpuPct: svc.gpu_pct,
        memoryMb: svc.memory_mb,
        replicas: svc.current_replicas,
        hourOfDay: hour,
        pue,
      });

      return {
        serviceId: svc.id,
        serviceName: svc.name,
        targetRps: svc.target_rps,
        latencyP50Ms: Math.round(25 + (svc.cpu_pct / 100) * 80),
        latencyP95Ms: Math.round(45 + (svc.cpu_pct / 100) * 160),
        cpuPct: svc.cpu_pct,
        gpuPct: svc.gpu_pct,
        replicas: svc.current_replicas,
        powerWatts: calc.facilityPowerWatts,
        energyKwhPerHour: calc.energyKwhPerHour,
        carbonGramsPerHour: calc.carbonGramsPerHour,
        gridCarbonIntensity: calc.gridCarbonIntensityGPerKwh,
        pue,
        provenance: 'ESTIMATED_METRIC',
      };
    });

    const totalPower = snapshots.reduce((a, b) => a + b.powerWatts, 0);
    const totalCarbon = snapshots.reduce((a, b) => a + b.carbonGramsPerHour, 0);

    res.json({
      snapshots,
      totalPowerWatts: totalPower,
      totalCarbonGramsPerHour: Math.round(totalCarbon * 10) / 10,
      ecoOptimizationActive: ecoOptimizationEnabled,
      provenanceDisclosures: {
        power: 'ESTIMATED_METRIC: Non-linear server model P(U) with facility PUE',
        carbon: 'ESTIMATED_METRIC: Diurnal regional grid carbon intensity profile',
        workload: 'SIMULATED_EVENT: Multi-service traffic profile',
      },
    });
  });

  app.get('/api/sustainability/scenarios', (req: Request, res: Response) => {
    const comparison = EnergyCarbonOracle.compareScenarios(
      { serviceId: 'srv-portal', rps: 300, cpuPct: 75.0, memoryMb: 16384, replicas: 4, hourOfDay: 19 },
      { serviceId: 'srv-portal', rps: 300, cpuPct: 45.0, memoryMb: 16384, replicas: 2, hourOfDay: 13 },
      24
    );
    res.json({
      baselineScenario: {
        name: 'Legacy Baseline (Unoptimized)',
        pue: 1.75,
        dailyKwh: comparison.baselineKwh,
        dailyCarbonGrams: comparison.baselineCarbonGrams,
        provenance: 'ESTIMATED_METRIC',
      },
      ecoOptimizedScenario: {
        name: 'UniVerse Eco-Scaled',
        pue: 1.20,
        dailyKwh: comparison.optimizedKwh,
        dailyCarbonGrams: comparison.optimizedCarbonGrams,
        provenance: 'ESTIMATED_METRIC',
      },
      savings: {
        dailyKwhSaved: comparison.kwhSaved,
        pctEnergySaved: comparison.pctEnergySaved,
        dailyCarbonAvoidedGrams: comparison.carbonAvoidedGrams,
        costSavedInr: comparison.costSavedInr,
      },
    });
  });

  app.post('/api/sustainability/toggle-optimization', (req: Request, res: Response) => {
    ecoOptimizationEnabled = req.body.enabled === true;
    res.json({ success: true, ecoOptimizationEnabled });
  });

  // ----------------------------------------------------
  // MODULE D: PRIVACY-AWARE DIGITAL WELLBEING
  // ----------------------------------------------------
  app.post('/api/wellbeing/sessions/start', (req: Request, res: Response) => {
    const { userId, targetDurationMins, goal } = req.body;
    if (!userId || !targetDurationMins) {
      return res.status(400).json({ error: 'userId and targetDurationMins are required' });
    }

    // Check existing active
    const active = db.prepare("SELECT id FROM focus_sessions WHERE user_id = ? AND status = 'active'").get(userId);
    if (active) {
      return res.status(409).json({ error: 'User already has an active focus session' });
    }

    const id = genId('sess');
    db.prepare(`
      INSERT INTO focus_sessions (id, user_id, target_duration_mins, goal, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(id, userId, targetDurationMins, goal || 'General Study');

    res.status(201).json({ success: true, sessionId: id, status: 'active', targetDurationMins });
  });

  app.post('/api/wellbeing/sessions/:sessionId/pause', (req: Request, res: Response) => {
    const { action } = req.body; // 'pause' | 'resume'
    const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (action === 'pause') {
      db.prepare("UPDATE focus_sessions SET status = 'paused' WHERE id = ?").run(req.params.sessionId);
    } else {
      db.prepare("UPDATE focus_sessions SET status = 'active' WHERE id = ?").run(req.params.sessionId);
    }

    res.json({ success: true, sessionId: req.params.sessionId, status: action === 'pause' ? 'paused' : 'active' });
  });

  app.post('/api/wellbeing/sessions/:sessionId/stop', (req: Request, res: Response) => {
    const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const events = db.prepare('SELECT * FROM browsing_events WHERE session_id = ?').all(req.params.sessionId) as any[];
    const totalSecs = events.reduce((a, b) => a + (b.duration_seconds || 0), 0) || 1800;

    const mappedEvents = events.map((e) => ({
      domain: e.domain,
      category: e.category,
      durationSeconds: e.duration_seconds || e.durationSeconds || 60,
    }));
    const stats = PrivacyWellbeingOracle.computeSessionAnalytics(totalSecs, session.paused_seconds || 0, mappedEvents);

    db.prepare(`
      UPDATE focus_sessions
      SET status = 'completed',
          end_time = CURRENT_TIMESTAMP,
          actual_duration_seconds = ?,
          deep_work_index = ?
      WHERE id = ?
    `).run(stats.totalSeconds, stats.deepWorkIndex, req.params.sessionId);

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      status: 'completed',
      analytics: stats,
    });
  });

  app.get('/api/wellbeing/sessions/:sessionId', (req: Request, res: Response) => {
    const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.sessionId) as any;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const events = db.prepare('SELECT * FROM browsing_events WHERE session_id = ?').all(req.params.sessionId) as any[];
    res.json({ session, events });
  });

  app.post('/api/wellbeing/events', (req: Request, res: Response) => {
    const { sessionId, userId, domain, durationSeconds } = req.body;
    if (!sessionId || !userId || !domain) {
      return res.status(400).json({ error: 'sessionId, userId, and domain are required' });
    }

    // Local-first sanitization invariant
    const sanitizedDomain = PrivacyWellbeingOracle.sanitizeUrlToHostname(domain);
    if (!sanitizedDomain) return res.status(400).json({ error: 'Invalid domain' });

    // Look up rule
    const rule = db.prepare('SELECT category FROM domain_rules WHERE user_id = ? AND domain_pattern = ?').get(userId, sanitizedDomain) as any;
    const category = rule ? rule.category : 'NEUTRAL';

    const id = 'ev-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO browsing_events (id, session_id, user_id, domain, category, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, userId, sanitizedDomain, category, durationSeconds || 60);

    res.status(201).json({
      success: true,
      eventId: id,
      sanitizedDomain,
      category,
      durationSeconds: durationSeconds || 60,
    });
  });

  app.get('/api/wellbeing/rules/:userId', (req: Request, res: Response) => {
    const rules = db.prepare('SELECT * FROM domain_rules WHERE user_id = ?').all(req.params.userId);
    res.json(rules);
  });

  app.post('/api/wellbeing/rules', (req: Request, res: Response) => {
    const { userId, domainPattern, category } = req.body;
    if (!userId || !domainPattern || !category) {
      return res.status(400).json({ error: 'userId, domainPattern, and category are required' });
    }
    if (!['PRODUCTIVE', 'DISTRACTING', 'NEUTRAL'].includes(category)) {
      return res.status(400).json({ error: 'Category must be PRODUCTIVE, DISTRACTING, or NEUTRAL' });
    }

    const cleanDomain = PrivacyWellbeingOracle.sanitizeUrlToHostname(domainPattern);
    const existing = db.prepare('SELECT id FROM domain_rules WHERE user_id = ? AND domain_pattern = ?').get(userId, cleanDomain);
    if (existing) {
      db.prepare('UPDATE domain_rules SET category = ? WHERE user_id = ? AND domain_pattern = ?').run(category, userId, cleanDomain);
    } else {
      db.prepare('INSERT INTO domain_rules (id, user_id, domain_pattern, category, is_custom) VALUES (?, ?, ?, ?, 1)').run(
        genId('rule'),
        userId,
        cleanDomain,
        category
      );
    }

    res.status(201).json({ success: true, domain: cleanDomain, category });
  });

  app.get('/api/wellbeing/cohort-aggregate', (req: Request, res: Response) => {
    const dept = (req.query.department as string) || 'Computer Science';
    const minCohort = parseInt(req.query.minCohort as string, 10) || 5;

    // Fetch cohort data
    const sessions = db.prepare(`
      SELECT fs.actual_duration_seconds, u.department
      FROM focus_sessions fs
      JOIN users u ON fs.user_id = u.id
      WHERE u.department = ? AND fs.status = 'completed'
    `).all(dept) as any[];

    const focusMinutes = sessions.map((s) => Math.round(s.actual_duration_seconds / 60));
    const result = PrivacyWellbeingOracle.computeCohortAggregate(dept, focusMinutes, minCohort, 0.8);
    res.json(result);
  });

  app.delete('/api/wellbeing/history/:userId', (req: Request, res: Response) => {
    const deletedEvents = db.prepare('DELETE FROM browsing_events WHERE user_id = ?').run(req.params.userId).changes;
    const deletedSessions = db.prepare('DELETE FROM focus_sessions WHERE user_id = ?').run(req.params.userId).changes;

    res.json({
      success: true,
      message: 'All browsing events and focus sessions purged permanently',
      deletedEventsCount: deletedEvents,
      deletedSessionsCount: deletedSessions,
    });
  });

  // ----------------------------------------------------
  // MODULE E: RESPONSIBLE EXAMINATION MONITORING
  // ----------------------------------------------------
  app.get('/api/exams/sessions', (req: Request, res: Response) => {
    const sessions = db.prepare(`
      SELECT es.*, u.name as student_name, u.email as student_email
      FROM exam_sessions es
      JOIN users u ON es.student_id = u.id
      ORDER BY es.scheduled_start ASC
    `).all();
    res.json(sessions);
  });

  app.post('/api/exams/sessions', (req: Request, res: Response) => {
    const { title, courseCode, studentId, scheduledStart, scheduledEnd } = req.body;
    if (!title || !courseCode || !studentId) {
      return res.status(400).json({ error: 'Missing title, courseCode, or studentId' });
    }

    const id = genId('exam');
    db.prepare(`
      INSERT INTO exam_sessions (id, title, course_code, student_id, scheduled_start, scheduled_end, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(id, title, courseCode, studentId, scheduledStart || new Date().toISOString(), scheduledEnd || new Date().toISOString());

    res.status(201).json({ success: true, examSessionId: id, status: 'scheduled' });
  });

  app.post('/api/exams/events', (req: Request, res: Response) => {
    const { examSessionId, eventType, confidenceScore, frameSnapshotUrl, provenance } = req.body;
    if (!examSessionId || !eventType || confidenceScore === undefined || !provenance) {
      return res.status(400).json({ error: 'Missing required exam event fields' });
    }

    if (!['ACTUAL_INFERENCE', 'SIMULATED_EVENT', 'ESTIMATED_METRIC'].includes(provenance)) {
      return res.status(400).json({ error: 'Invalid provenance tag. Must be ACTUAL_INFERENCE, SIMULATED_EVENT, or ESTIMATED_METRIC' });
    }

    const id = genId('exev');
    db.prepare(`
      INSERT INTO exam_events (id, exam_session_id, event_type, confidence_score, frame_snapshot_url, provenance, review_status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
    `).run(id, examSessionId, eventType, confidenceScore, frameSnapshotUrl || null, provenance);

    // Notify proctor
    db.prepare(`
      INSERT INTO activity_log (id, user_id, module, action, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(genId('act'), 'system', 'exam_monitoring', 'OBSERVATION_FLAGGED', `Observable event ${eventType} [${provenance}] flagged for review`);

    res.status(201).json({
      success: true,
      eventId: id,
      reviewStatus: 'PENDING_REVIEW',
      provenance,
      notice: 'OBSERVABLE EVENT DETECTED — REQUIRES HUMAN REVIEW. NO AUTOMATED PENALTY APPLIED.',
    });
  });

  app.get('/api/exams/events/:sessionId', (req: Request, res: Response) => {
    const events = db.prepare(`
      SELECT * FROM exam_events WHERE exam_session_id = ? ORDER BY timestamp DESC
    `).all(req.params.sessionId);
    res.json(events);
  });

  app.patch('/api/exams/events/:eventId/review', (req: Request, res: Response) => {
    const { action, proctorNotes, reviewerId } = req.body;
    if (!action || !proctorNotes || !reviewerId) {
      return res.status(400).json({ error: 'Action, proctorNotes, and reviewerId are mandatory for audit compliance' });
    }

    const validActions = ['DISMISS_FALSE_POSITIVE', 'DISMISS_BENIGN_BEHAVIOR', 'ESCALATE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be DISMISS_FALSE_POSITIVE, DISMISS_BENIGN_BEHAVIOR, or ESCALATE' });
    }

    const event = db.prepare('SELECT * FROM exam_events WHERE id = ?').get(req.params.eventId) as any;
    if (!event) return res.status(404).json({ error: 'Exam event not found' });

    db.prepare(`
      UPDATE exam_events
      SET review_status = ?,
          proctor_notes = ?,
          reviewer_id = ?,
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(action, proctorNotes, reviewerId, req.params.eventId);

    // Write to immutable audit log
    const auditId = genId('aud');
    db.prepare(`
      INSERT INTO exam_audit_log (id, event_id, exam_session_id, reviewer_id, previous_status, new_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId, req.params.eventId, event.exam_session_id, reviewerId, event.review_status, action, proctorNotes);

    res.json({
      success: true,
      eventId: req.params.eventId,
      previousStatus: event.review_status,
      newStatus: action,
      auditLogId: auditId,
      resolvedAt: new Date().toISOString(),
    });
  });

  app.get('/api/exams/audit-log/:sessionId', (req: Request, res: Response) => {
    const rows = db.prepare(`
      SELECT al.*, u.name as reviewer_name
      FROM exam_audit_log al
      JOIN users u ON al.reviewer_id = u.id
      WHERE al.exam_session_id = ?
      ORDER BY al.timestamp DESC
    `).all(req.params.sessionId);
    res.json(rows);
  });

  return app;
}
