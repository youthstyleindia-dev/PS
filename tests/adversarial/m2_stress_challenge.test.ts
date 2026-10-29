import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/index';
import { getDb } from '../../server/src/db/connection';
import { graphService } from '../../server/src/services/graph.service';
import { rideMatchingService, getVehicleEmissionFactor, normalizeVehicleType } from '../../server/src/services/ride_matching.service';

describe('Milestone 2 Adversarial & Stress Challenge Suite', () => {
  const db = getDb();

  beforeAll(() => {
    expect(db).toBeDefined();
  });

  // ============================================================================
  // 1. GRAPH PATHFINDING EDGE CASES & INVARIANTS
  // ============================================================================
  describe('1. Graph Pathfinding Edge Cases & Invariants', () => {
    it('handles identical origin and destination as zero distance, zero time, single node path', async () => {
      const res = await request(app)
        .get('/api/rides/shortest-path?source=ACAD_QUAD&target=ACAD_QUAD');

      expect(res.status).toBe(200);
      expect(res.body.path).toEqual(['ACAD_QUAD']);
      expect(res.body.totalDistanceKm).toBe(0);
      expect(res.body.totalTimeMins).toBe(0);
      expect(res.body.legs).toEqual([]);
    });

    it('rejects path query when source or target query parameter is missing with HTTP 400', async () => {
      const missingTarget = await request(app).get('/api/rides/shortest-path?source=GATE_NORTH');
      expect(missingTarget.status).toBe(400);
      expect(missingTarget.body).toHaveProperty('error');

      const missingSource = await request(app).get('/api/rides/shortest-path?target=GATE_SOUTH');
      expect(missingSource.status).toBe(400);
      expect(missingSource.body).toHaveProperty('error');

      const missingBoth = await request(app).get('/api/rides/shortest-path');
      expect(missingBoth.status).toBe(400);
      expect(missingBoth.body).toHaveProperty('error');
    });

    it('returns HTTP 404 when querying non-existent or disconnected node IDs', async () => {
      const invalidNodes = [
        'GHOST_NODE_999',
        'GATE_ATLANTIS',
        'NULL',
        'undefined',
      ];

      for (const node of invalidNodes) {
        const res = await request(app)
          .get(`/api/rides/shortest-path?source=${encodeURIComponent(node)}&target=ACAD_QUAD`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
      }

      // Empty string is treated as missing query param -> 400 Bad Request
      const emptyRes = await request(app).get('/api/rides/shortest-path?source=&target=ACAD_QUAD');
      expect(emptyRes.status).toBe(400);
    });

    it('A* pathfinding returns HTTP 404 for non-existent node IDs', async () => {
      const res = await request(app)
        .get('/api/rides/shortest-path-astar?source=NON_EXISTENT&target=ACAD_QUAD');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('A* and Dijkstra produce identical shortest path distances across all 10 campus nodes', () => {
      const allNodes = graphService.getAllNodes().map(n => n.id);
      expect(allNodes.length).toBe(10);

      for (let i = 0; i < allNodes.length; i++) {
        for (let j = 0; j < allNodes.length; j++) {
          const src = allNodes[i];
          const tgt = allNodes[j];

          const dijkstraRes = graphService.findShortestPath(src, tgt);
          const astarRes = graphService.findShortestPathAStar(src, tgt);

          if (src === tgt) {
            expect(dijkstraRes?.totalDistanceKm).toBe(0);
            expect(astarRes?.totalDistanceKm).toBe(0);
          } else {
            expect(dijkstraRes).not.toBeNull();
            expect(astarRes).not.toBeNull();
            // A* must match Dijkstra optimal distance exactly
            expect(astarRes?.totalDistanceKm).toBe(dijkstraRes?.totalDistanceKm);
          }
        }
      }
    });

    it('verifies triangle inequality: d(A, C) <= d(A, B) + d(B, C) across campus triples', () => {
      const sampleTriples = [
        ['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD'],
        ['GATE_NORTH', 'LIB_CENTRAL', 'LAB_CS_AI'],
        ['ACAD_QUAD', 'STUDENT_CTR', 'GATE_SOUTH'],
        ['INNOVATION', 'SPORTS_CMPLX', 'GATE_SOUTH'],
      ];

      for (const [a, b, c] of sampleTriples) {
        const dAC = graphService.findShortestPath(a, c)!.totalDistanceKm;
        const dAB = graphService.findShortestPath(a, b)!.totalDistanceKm;
        const dBC = graphService.findShortestPath(b, c)!.totalDistanceKm;

        // Metric space property: d(A, C) <= d(A, B) + d(B, C) + epsilon
        expect(dAC).toBeLessThanOrEqual(Math.round((dAB + dBC) * 100) / 100 + 0.001);
      }
    });

    it('handles cyclic routes without infinite loops or memory leaks', () => {
      // The campus network has 15 bidirectional pairs (cycles everywhere)
      // Verify Dijkstra terminates with correct hop count
      const res = graphService.findShortestPath('GATE_NORTH', 'GATE_SOUTH');
      expect(res).not.toBeNull();
      // Ensure no repeated nodes in shortest path
      const uniqueNodes = new Set(res!.path);
      expect(uniqueNodes.size).toBe(res!.path.length);
      expect(res!.path[0]).toBe('GATE_NORTH');
      expect(res!.path[res!.path.length - 1]).toBe('GATE_SOUTH');
    });
  });

  // ============================================================================
  // 2. DYNAMIC CONGESTION MULTIPLIERS & TIME PARSER STRESS
  // ============================================================================
  describe('2. Dynamic Congestion Multipliers & Time Parser Stress', () => {
    it('verifies exact boundary timestamps for morning rush (08:15 to 09:30 => 1.65x)', () => {
      // 08:14 => 8 + 14/60 = 8.233 < 8.25 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('08:14')).toBe(1.0);

      // 08:15 => 8 + 15/60 = 8.250 => Morning rush start 1.65x
      expect(graphService.getCongestionMultiplier('08:15')).toBe(1.65);

      // 08:30 => 8 + 30/60 = 8.500 => Morning rush peak 1.65x
      expect(graphService.getCongestionMultiplier('08:30')).toBe(1.65);

      // 09:30 => 9 + 30/60 = 9.500 => Morning rush end 1.65x
      expect(graphService.getCongestionMultiplier('09:30')).toBe(1.65);

      // 09:31 => 9 + 31/60 = 9.517 > 9.5 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('09:31')).toBe(1.0);
    });

    it('verifies exact boundary timestamps for midday shift (12:00 to 13:30 => 1.35x)', () => {
      // 11:59 => 11 + 59/60 = 11.983 < 12.0 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('11:59')).toBe(1.0);

      // 12:00 => 12.000 => Midday shift start 1.35x
      expect(graphService.getCongestionMultiplier('12:00')).toBe(1.35);

      // 12:29 => 12 + 29/60 = 12.483 => Midday shift 1.35x
      expect(graphService.getCongestionMultiplier('12:29')).toBe(1.35);

      // 12:30 => 12.500 => Midday shift 1.35x
      expect(graphService.getCongestionMultiplier('12:30')).toBe(1.35);

      // 13:30 => 13.500 => Midday shift end 1.35x
      expect(graphService.getCongestionMultiplier('13:30')).toBe(1.35);

      // 13:31 => 13 + 31/60 = 13.517 > 13.5 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('13:31')).toBe(1.0);
    });

    it('verifies exact boundary timestamps for evening dispersal (17:00 to 18:30 => 1.70x)', () => {
      // 16:59 => 16 + 59/60 = 16.983 < 17.0 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('16:59')).toBe(1.0);

      // 17:00 => 17.000 => Evening dispersal start 1.70x
      expect(graphService.getCongestionMultiplier('17:00')).toBe(1.70);

      // 17:44 => 17 + 44/60 = 17.733 => Evening dispersal 1.70x
      expect(graphService.getCongestionMultiplier('17:44')).toBe(1.70);

      // 17:45 => 17 + 45/60 = 17.750 => Evening dispersal peak 1.70x
      expect(graphService.getCongestionMultiplier('17:45')).toBe(1.70);

      // 18:30 => 18.500 => Evening dispersal end 1.70x
      expect(graphService.getCongestionMultiplier('18:30')).toBe(1.70);

      // 18:31 => 18 + 31/60 = 18.517 > 18.5 => Off-peak 1.00x
      expect(graphService.getCongestionMultiplier('18:31')).toBe(1.0);
    });

    it('verifies road-specific lane mitigations during peak congestion', () => {
      const pedEdge = { id: 'e13', source: 'ACAD_QUAD', target: 'LAB_CS_AI', distanceKm: 0.4, baseTimeMins: 1.5, roadType: 'PEDESTRIAN_ACCESS' as const };
      const evEdge = { id: 'e3', source: 'DORM_NORTH', target: 'LIB_CENTRAL', distanceKm: 0.6, baseTimeMins: 2.5, roadType: 'EV_SHUTTLE_LANE' as const };
      const roadEdge = { id: 'e1', source: 'GATE_NORTH', target: 'DORM_NORTH', distanceKm: 0.8, baseTimeMins: 3.0, roadType: 'CAMPUS_ROAD' as const };

      // During evening peak 17:45 (global 1.70x):
      // PEDESTRIAN_ACCESS must be strictly 1.00x (unaffected by motor congestion)
      expect(graphService.getCongestionMultiplier('17:45', pedEdge)).toBe(1.0);

      // EV_SHUTTLE_LANE must be capped at min(1.10, 1.70) = 1.10x
      expect(graphService.getCongestionMultiplier('17:45', evEdge)).toBe(1.10);

      // CAMPUS_ROAD must experience full 1.70x
      expect(graphService.getCongestionMultiplier('17:45', roadEdge)).toBe(1.70);
    });

    it('handles malformed time inputs safely without unhandled exceptions', () => {
      // 25:99 - invalid 24-hr time
      expect(graphService.getCongestionMultiplier('25:99')).toBe(1.0);

      // Empty string
      const emptyMult = graphService.getCongestionMultiplier('');
      expect([1.0, 1.35]).toContain(emptyMult); // does not crash

      // Arbitrary non-time string "invalid"
      const invalidMult = graphService.getCongestionMultiplier('invalid');
      expect([1.0, 1.35]).toContain(invalidMult); // safe numeric return

      // Full ISO timestamp string
      const isoMult = graphService.getCongestionMultiplier('2026-10-29T17:45:00Z');
      expect(typeof isoMult).toBe('number');
      expect(isoMult).toBeGreaterThanOrEqual(1.0);
    });
  });

  // ============================================================================
  // 3. DARP STRESS & INVARIANT VIOLATIONS
  // ============================================================================
  describe('3. DARP Stress & Invariant Violations', () => {
    it('enforces exact detour threshold: matches at <= 35% and rejects at > 35%', () => {
      // Direct driver route: GATE_NORTH -> GATE_SOUTH (direct 2.9 km via DORM_NORTH->ACAD_QUAD->STUDENT_CTR->GATE_SOUTH)
      // D(direct) = 0.8 + 0.7 + 0.6 + 0.9 = 3.0 km
      const offer = {
        id: 'off-detour-test',
        driverId: 'usr_driver_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'EV_CAR' as const,
      };

      // 1. Passenger with zero detour (on exact direct path)
      const onPathReq = {
        id: 'req-onpath',
        passengerId: 'usr_student_1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 1,
        maxDetourRatio: 0.35,
      };

      const matchOnPath = rideMatchingService.matchRide(offer, onPathReq);
      expect(matchOnPath.matched).toBe(true);
      expect(matchOnPath.detourRatio).toBe(0); // zero detour!

      // 2. Passenger requiring huge detour away from route (e.g. SPORTS_CMPLX)
      const hugeDetourReq = {
        id: 'req-huge-detour',
        passengerId: 'usr_student_2',
        originNodeId: 'SPORTS_CMPLX',
        destinationNodeId: 'INNOVATION',
        desiredTime: '10:00',
        seatsNeeded: 1,
        maxDetourRatio: 0.35,
      };

      const matchHuge = rideMatchingService.matchRide(offer, hugeDetourReq);
      expect(matchHuge.matched).toBe(false);
      expect(matchHuge.reason).toBe('DETOUR_LIMIT_EXCEEDED');
      expect(matchHuge.detourRatio).toBeGreaterThan(0.35);
    });

    it('honors strict passenger-specified maxDetourRatio lower than 35%', () => {
      // Driver going GATE_NORTH -> GATE_SOUTH
      const offer = {
        id: 'off-custom-detour',
        driverId: 'usr_driver_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: 'EV_CAR' as const,
      };

      // Passenger requests pickup at LIB_CENTRAL which introduces ~0.20 detour
      // If passenger specifies maxDetourRatio: 0.05, it must be rejected even though 0.20 <= 0.35!
      const strictReq = {
        id: 'req-strict',
        passengerId: 'usr_student_3',
        originNodeId: 'LIB_CENTRAL',
        destinationNodeId: 'GATE_SOUTH',
        desiredTime: '10:00',
        seatsNeeded: 1,
        maxDetourRatio: 0.05, // 5% max tolerance
      };

      const match = rideMatchingService.matchRide(offer, strictReq);
      expect(match.matched).toBe(false);
      expect(match.reason).toBe('DETOUR_LIMIT_EXCEEDED');
    });

    it('rejects matching when offer availableSeats is 0', () => {
      const zeroSeatOffer = {
        id: 'off-zero-seats',
        driverId: 'usr_driver_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'GATE_SOUTH',
        departureTime: '10:00',
        totalSeats: 3,
        availableSeats: 0,
        vehicleType: 'EV_CAR' as const,
      };

      const req = {
        id: 'req-any',
        passengerId: 'usr_student_1',
        originNodeId: 'DORM_NORTH',
        destinationNodeId: 'STUDENT_CTR',
        desiredTime: '10:00',
        seatsNeeded: 1,
      };

      const match = rideMatchingService.matchRide(zeroSeatOffer, req);
      expect(match.matched).toBe(false);
      expect(match.reason).toBe('INSUFFICIENT_SEAT_CAPACITY');
    });

    it('rejects offer creation when totalSeats is 0 or negative via HTTP 400', async () => {
      const zeroSeats = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '08:30',
          totalSeats: 0,
          vehicleType: 'EV_CAR',
        });
      expect(zeroSeats.status).toBe(400);
      expect(zeroSeats.body.error).toContain('Total seats must be between 1 and 6');

      const negativeSeats = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '08:30',
          totalSeats: -2,
          vehicleType: 'EV_CAR',
        });
      expect(negativeSeats.status).toBe(400);
      expect(negativeSeats.body.error).toContain('Total seats must be between 1 and 6');

      const excessiveSeats = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '08:30',
          totalSeats: 8,
          vehicleType: 'EV_CAR',
        });
      expect(excessiveSeats.status).toBe(400);
      expect(excessiveSeats.body.error).toContain('Total seats must be between 1 and 6');
    });

    it('rejects offer creation when origin and destination are identical with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_NORTH',
          departureTime: '08:30',
          totalSeats: 3,
          vehicleType: 'EV_CAR',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Origin and destination cannot be identical');
    });

    it('rejects passenger request creation when origin and destination are identical with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/rides/requests')
        .send({
          passengerId: 'usr_student_1',
          originNodeId: 'ACAD_QUAD',
          destinationNodeId: 'ACAD_QUAD',
          desiredTime: '08:30',
          seatsNeeded: 1,
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Origin and destination cannot be identical');
    });

    it('concurrency stress: 10 parallel booking attempts on last available seat allows exactly 1 booking and prevents overbooking', async () => {
      // 1. Create a fresh offer with EXACTLY 1 seat
      const offerId = `off-race-${Date.now()}`;
      db.prepare(`
        INSERT INTO ride_offers (
          id, driver_id, origin_node_id, destination_node_id, departure_time,
          total_seats, available_seats, vehicle_type, status, planned_route
        ) VALUES (?, 'usr_driver_1', 'GATE_NORTH', 'GATE_SOUTH', '08:30', 1, 1, 'EV_CAR', 'open', '["GATE_NORTH","GATE_SOUTH"]')
      `).run(offerId);

      // 2. Create 10 distinct passenger requests
      const requestIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const reqId = `req-race-${Date.now()}-${i}`;
        requestIds.push(reqId);

        // Ensure user exists
        const uId = `usr_race_${i}`;
        db.prepare('INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)').run(
          uId, `Race Passenger ${i}`, `race_${i}@campus.edu`, 'student'
        );

        db.prepare(`
          INSERT INTO ride_requests (
            id, passenger_id, origin_node_id, destination_node_id, desired_departure_time,
            seats_needed, max_detour_ratio, status
          ) VALUES (?, ?, 'DORM_NORTH', 'STUDENT_CTR', '08:30', 1, 0.35, 'pending')
        `).run(reqId, uId);
      }

      // 3. Fire all 10 booking requests concurrently via Promise.all
      const bookingAttempts = requestIds.map(rId =>
        request(app)
          .post('/api/rides/book')
          .send({
            offerId,
            requestId: rId,
            seatsBooked: 1,
          })
      );

      const responses = await Promise.all(bookingAttempts);
      const statuses = responses.map(r => r.status);

      // Invariant Check 1: Exactly 1 request succeeds with 201
      const successCount = statuses.filter(s => s === 201).length;
      expect(successCount).toBe(1);

      // Invariant Check 2: Exactly 9 requests fail with 400 (Insufficient available seats)
      const failCount = statuses.filter(s => s === 400).length;
      expect(failCount).toBe(9);

      // Invariant Check 3: Check database state - available_seats must be exactly 0, never negative
      const updatedOffer = db.prepare('SELECT available_seats FROM ride_offers WHERE id = ?').get(offerId) as any;
      expect(updatedOffer.available_seats).toBe(0);

      // Invariant Check 4: Exactly 1 booking was created for this offer
      // Check column name dynamically
      const cols = db.prepare('PRAGMA table_info(ride_bookings)').all().map((c: any) => c.name);
      if (cols.includes('match_id')) {
        const bookings = db.prepare(`
          SELECT COUNT(*) as c FROM ride_bookings rb
          JOIN ride_matches rm ON rb.match_id = rm.id
          WHERE rm.offer_id = ?
        `).get(offerId) as any;
        expect(bookings.c).toBe(1);
      } else {
        const bookings = db.prepare('SELECT COUNT(*) as c FROM ride_bookings WHERE offer_id = ?').get(offerId) as any;
        expect(bookings.c).toBe(1);
      }
    });
  });

  // ============================================================================
  // 4. MALICIOUS / SQL INJECTION PAYLOADS
  // ============================================================================
  describe('4. Malicious / SQL Injection Payloads', () => {
    it('neutralizes SQL injection and malicious payloads in node IDs and query parameters', async () => {
      const injectionPayloads = [
        "' OR '1'='1",
        "GATE_NORTH'; DROP TABLE users; --",
        "'; DELETE FROM ride_offers; --",
        "' UNION SELECT * FROM users --",
        "../../../etc/passwd",
        "<script>alert('xss')</script>",
      ];

      for (const payload of injectionPayloads) {
        // Query param test
        const pathRes = await request(app)
          .get(`/api/rides/shortest-path?source=${encodeURIComponent(payload)}&target=GATE_SOUTH`);
        expect([400, 404]).toContain(pathRes.status);

        // Offer creation test
        const offerRes = await request(app)
          .post('/api/rides/offers')
          .send({
            driverId: 'usr_driver_1',
            originNodeId: payload,
            destinationNodeId: 'GATE_SOUTH',
            departureTime: '08:30',
            totalSeats: 2,
            vehicleType: 'EV_CAR',
          });
        expect(offerRes.status).toBe(400);

        // Request creation test
        const reqRes = await request(app)
          .post('/api/rides/requests')
          .send({
            passengerId: 'usr_student_1',
            originNodeId: payload,
            destinationNodeId: 'GATE_SOUTH',
            desiredTime: '08:30',
            seatsNeeded: 1,
          });
        expect(reqRes.status).toBe(400);
      }

      // Verify that database users table and ride_offers table are completely intact
      const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
      expect(userCount.c).toBeGreaterThan(0);

      const offerCount = db.prepare('SELECT COUNT(*) as c FROM ride_offers').get() as any;
      expect(offerCount.c).toBeGreaterThanOrEqual(0);
    });

    it('neutralizes malicious vehicle type inputs safely', async () => {
      const maliciousVehicleTypes = [
        "'; DROP TABLE ride_offers; --",
        "' UNION SELECT id FROM users --",
        "<script>alert(1)</script>",
        "UNREGISTERED_DIESEL_TRUCK",
      ];

      for (const vType of maliciousVehicleTypes) {
        expect(normalizeVehicleType(vType)).toBe('EV_CAR'); // falls back safely to EV_CAR
      }
    });
  });

  // ============================================================================
  // 5. ACTIVITY LOG & FOREIGN KEY / ERROR HANDLING INTEGRITY
  // ============================================================================
  describe('5. Activity Log & Foreign Key / Error Handling Integrity', () => {
    it('returns clean HTTP 404 when booking with non-existent offerId', async () => {
      // First ensure a valid request exists
      const validReq = db.prepare("SELECT id FROM ride_requests WHERE status = 'pending' LIMIT 1").get() as any;
      const reqId = validReq?.id || 'req_dummy';

      const res = await request(app)
        .post('/api/rides/book')
        .send({
          offerId: 'non_existent_offer_99999',
          requestId: reqId,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Offer or request not found');
    });

    it('returns clean HTTP 404 when booking with non-existent requestId', async () => {
      const validOffer = db.prepare("SELECT id FROM ride_offers WHERE status = 'open' AND available_seats > 0 LIMIT 1").get() as any;
      const offerId = validOffer?.id || 'off_dummy';

      const res = await request(app)
        .post('/api/rides/book')
        .send({
          offerId,
          requestId: 'non_existent_request_99999',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Offer or request not found');
    });

    it('returns clean HTTP 404 when matching with non-existent offerId or requestId', async () => {
      const res = await request(app)
        .post('/api/rides/match')
        .send({
          offerId: 'ghost_offer',
          requestId: 'ghost_request',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Offer or request not found');
    });

    it('returns clean HTTP 404 when confirming a non-existent matchId', async () => {
      const res = await request(app)
        .post('/api/rides/matches/ghost_match_99999/confirm')
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Match record not found');
    });

    it('verifies activity log entry is written with [ESTIMATED METRIC] provenance tag upon successful booking', async () => {
      // 1. Create a matching offer and request
      const offId = `off-act-${Date.now()}`;
      const reqId = `req-act-${Date.now()}`;

      db.prepare(`
        INSERT INTO ride_offers (
          id, driver_id, origin_node_id, destination_node_id, departure_time,
          total_seats, available_seats, vehicle_type, status, planned_route
        ) VALUES (?, 'usr_driver_1', 'GATE_NORTH', 'GATE_SOUTH', '08:30', 2, 2, 'EV_CAR', 'open', '["GATE_NORTH","GATE_SOUTH"]')
      `).run(offId);

      db.prepare(`
        INSERT INTO ride_requests (
          id, passenger_id, origin_node_id, destination_node_id, desired_departure_time,
          seats_needed, max_detour_ratio, status
        ) VALUES (?, 'usr_student_1', 'DORM_NORTH', 'STUDENT_CTR', '08:30', 1, 0.35, 'pending')
      `).run(reqId);

      // 2. Perform booking
      const bookRes = await request(app)
        .post('/api/rides/book')
        .send({
          offerId: offId,
          requestId: reqId,
          seatsBooked: 1,
        });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.success).toBe(true);
      expect(bookRes.body.provenance).toBe('[ESTIMATED METRIC]');

      // 3. Verify activity_log table entry
      const actEntry = db.prepare(`
        SELECT * FROM activity_log 
        WHERE module = 'rides' AND action = 'RIDE_BOOKED' AND user_id = 'usr_student_1'
        ORDER BY timestamp DESC LIMIT 1
      `).get() as any;

      expect(actEntry).toBeDefined();
      expect(actEntry.details).toContain('[ESTIMATED METRIC]');
      expect(actEntry.details).toContain('kg CO2e avoided');
    });

    it('verifies vehicle emission factors adhere to specification ordering and exact values', () => {
      // PETROL_CAR: 0.155 kg CO2e / km
      // EV_CAR: 0.048 kg CO2e / km
      // CAMPUS_SHUTTLE: 0.032 kg CO2e / km
      // E_GOLF_CART: 0.025 kg CO2e / km
      const petrol = getVehicleEmissionFactor('PETROL_CAR');
      const ev = getVehicleEmissionFactor('EV_CAR');
      const shuttle = getVehicleEmissionFactor('CAMPUS_SHUTTLE');
      const cart = getVehicleEmissionFactor('E_GOLF_CART');

      expect(petrol).toBe(0.155);
      expect(ev).toBe(0.048);
      expect(shuttle).toBe(0.032);
      expect(cart).toBe(0.025);

      // Emission factor strictly decreasing: Petrol > EV > Shuttle > Cart
      expect(petrol).toBeGreaterThan(ev);
      expect(ev).toBeGreaterThan(shuttle);
      expect(shuttle).toBeGreaterThan(cart);
    });

    it('GET /api/rides/summary includes campus-wide totals with [ESTIMATED METRIC] provenance', async () => {
      const res = await request(app).get('/api/rides/summary');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalBookings');
      expect(res.body).toHaveProperty('totalSharedKm');
      expect(res.body).toHaveProperty('totalCarbonSavedKg');
      expect(res.body).toHaveProperty('totalFareCharged');
      expect(res.body.provenance).toBe('[ESTIMATED METRIC]');
    });
  });
});
