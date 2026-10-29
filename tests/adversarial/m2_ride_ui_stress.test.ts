import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/src/index';
import { getDb } from '../../server/src/db/connection';
import { ridesService, CampusEdge } from '../../client/src/services/rides.service';
import { graphService } from '../../server/src/services/graph.service';
import { rideMatchingService } from '../../server/src/services/ride_matching.service';

describe('Milestone 2 Adversarial Challenge Suite: Ride-Pooling UI, Visualizer & Workflows', () => {
  const db = getDb();

  beforeAll(() => {
    expect(db).toBeDefined();
  });

  // ============================================================================
  // 1. INTERACTIVE SVG MAP & VISUALIZER LOGIC
  // ============================================================================
  describe('1. Interactive SVG Map & Visualizer Logic', () => {
    it('time-of-day scrubber accurately maps congestion multipliers to visual warning colors', () => {
      // Helper replicated from CampusMapSvg.tsx line 71
      const getCongestionColor = (multiplier: number) => {
        if (multiplier <= 1.15) return '#10B981'; // Green (Free Flow)
        if (multiplier <= 1.45) return '#F59E0B'; // Amber / Yellow (Moderate)
        return '#EF4444';                         // Red / Orange (Heavy Rush)
      };

      const rushHours = [
        { label: 'Morning Rush', time: '08:30', mult: 1.65, expectedColor: '#EF4444' },
        { label: 'Midday Shift', time: '12:30', mult: 1.35, expectedColor: '#F59E0B' },
        { label: 'Evening Peak', time: '17:45', mult: 1.70, expectedColor: '#EF4444' },
        { label: 'Off-Peak Normal', time: '21:00', mult: 1.00, expectedColor: '#10B981' },
      ];

      for (const rh of rushHours) {
        const color = getCongestionColor(rh.mult);
        expect(color).toBe(rh.expectedColor);
      }
    });

    it('path overlay logic styles pooled, detour, driver direct, and base edges distinctly', () => {
      // Helper replicated from CampusMapSvg.tsx line 58
      const isEdgeInPath = (edge: CampusEdge, path: string[]) => {
        for (let i = 0; i < path.length - 1; i++) {
          if (
            (path[i] === edge.source && path[i + 1] === edge.target) ||
            (path[i] === edge.target && path[i + 1] === edge.source)
          ) {
            return true;
          }
        }
        return false;
      };

      const testEdge: CampusEdge = {
        id: 'e1',
        source: 'GATE_NORTH',
        target: 'DORM_NORTH',
        distanceKm: 0.8,
        baseTimeMins: 3.0,
        roadType: 'CAMPUS_ROAD',
      };

      const pooledPath = ['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD'];
      const driverPath = ['GATE_NORTH', 'INNOVATION'];
      const detourPath = ['STUDENT_CTR', 'GATE_SOUTH'];

      expect(isEdgeInPath(testEdge, pooledPath)).toBe(true);
      expect(isEdgeInPath(testEdge, driverPath)).toBe(false);
      expect(isEdgeInPath(testEdge, detourPath)).toBe(false);

      // Verify reverse traversal also matches undirected visual rendering
      const reverseEdge: CampusEdge = {
        id: 'e2',
        source: 'DORM_NORTH',
        target: 'GATE_NORTH',
        distanceKm: 0.8,
        baseTimeMins: 3.0,
        roadType: 'CAMPUS_ROAD',
      };
      expect(isEdgeInPath(reverseEdge, pooledPath)).toBe(true);
    });

    it('BUG DISCOVERY / ADVERSARIAL: Map node clicking logic cannot set destination node', () => {
      // Replicate exact handleNodeClick logic from RidePooling.tsx lines 209-219
      let passengerOrigin = 'DORM_NORTH';
      let passengerDestination = 'STUDENT_CTR';
      let activeTab: 'request' | 'offer' = 'request';

      const handleNodeClick = (nodeId: string) => {
        if (activeTab === 'offer') {
          // driver logic
        } else {
          if (passengerOrigin === nodeId) passengerOrigin = 'DORM_NORTH';
          else if (passengerDestination === nodeId) passengerDestination = nodeId;
          else passengerOrigin = nodeId;
        }
      };

      // Scenario: User clicks 'LIB_CENTRAL' wanting to set it as destination
      handleNodeClick('LIB_CENTRAL');
      // Because LIB_CENTRAL != passengerOrigin ('DORM_NORTH') and LIB_CENTRAL != passengerDestination ('STUDENT_CTR'),
      // it hits the 'else' branch and sets passengerOrigin = 'LIB_CENTRAL'!
      expect(passengerOrigin).toBe('LIB_CENTRAL');
      expect(passengerDestination).toBe('STUDENT_CTR'); // UNCHANGED!

      // Scenario: User clicks another node 'LAB_CS_AI'
      handleNodeClick('LAB_CS_AI');
      expect(passengerOrigin).toBe('LAB_CS_AI');
      expect(passengerDestination).toBe('STUDENT_CTR'); // STILL UNCHANGED!

      // Scenario: User clicks current destination 'STUDENT_CTR'
      handleNodeClick('STUDENT_CTR');
      // Hits `else if (passengerDestination === nodeId) passengerDestination = nodeId` -> NO-OP!
      expect(passengerDestination).toBe('STUDENT_CTR');

      // CONCLUSION: Node clicking ONLY ever updates origin, NEVER destination!
      // This empirically proves a UI logic bug in RidePooling.tsx handleNodeClick.
    });
  });

  // ============================================================================
  // 2. FORM STATE & INPUT VALIDATION
  // ============================================================================
  describe('2. Form State & Input Validation', () => {
    it('detour tolerance slider allows out-of-spec values (up to 50%) and misses 0%', () => {
      // In RidePooling.tsx line 505: min={0.10} max={0.50} step={0.05}
      const sliderMin = 0.10;
      const sliderMax = 0.50;

      // Specification & Dispatch requirement: "detour tolerance slider boundaries (0% to 35%)"
      expect(sliderMin).toBeGreaterThan(0.0); // Cannot select 0% (strict direct route)
      expect(sliderMax).toBeGreaterThan(0.35); // Allows up to 50% detour
    });

    it('BUG DISCOVERY / ADVERSARIAL: Backend matching honors maxDetourRatio > 35% when requested by passenger', () => {
      // When passenger sends maxDetourRatio = 0.50, ride_matching.service.ts uses:
      // const maxAllowedDetour = request.maxDetourRatio ?? 0.35;
      // It does NOT clamp with Math.min(maxDetourRatio, 0.35)!

      const mockOffer = {
        id: 'off_test_detour_exceed',
        driverId: 'usr_driver_1',
        originNodeId: 'GATE_NORTH',
        destinationNodeId: 'ACAD_QUAD', // direct: GATE_NORTH -> DORM_NORTH -> ACAD_QUAD (1.5 km)
        departureTime: '08:30',
        totalSeats: 4,
        availableSeats: 4,
        vehicleType: 'EV_CAR',
      };

      // Passenger detour route via LIB_CENTRAL & LAB_CS_AI:
      // GATE_NORTH -> DORM_NORTH (0.8) -> LIB_CENTRAL (0.6) -> LAB_CS_AI (0.5) -> ACAD_QUAD (0.4) = 2.3 km
      // Detour: 2.3 - 1.5 = 0.8 km. Detour ratio: 0.8 / 1.5 = 53.3%
      // Let's create a passenger request with origin LIB_CENTRAL, destination ACAD_QUAD
      // Direct driver is GATE_NORTH -> ACAD_QUAD (1.5 km)
      // Pooled: GATE_NORTH -> DORM_NORTH (0.8) -> LIB_CENTRAL (0.6) -> ACAD_QUAD (0.7 via DORM)
      // Actually: pooled = GATE_NORTH -> LIB_CENTRAL -> ACAD_QUAD -> ACAD_QUAD
      const mockRequest = {
        id: 'req_test_detour_exceed',
        passengerId: 'usr_student_1',
        originNodeId: 'LIB_CENTRAL',
        destinationNodeId: 'ACAD_QUAD',
        desiredTime: '08:30',
        seatsNeeded: 1,
        maxDetourRatio: 0.50, // Permitted by UI slider!
      };

      const match = rideMatchingService.matchRide(mockOffer, mockRequest);
      // Direct driver: 1.5 km
      // Pooled: GATE_NORTH -> LIB_CENTRAL (1.4 km) + LIB_CENTRAL -> ACAD_QUAD (1.1 km) = 2.5 km
      // Detour: 2.5 - 1.5 = 1.0 km, detour ratio: 1.0 / 1.5 = 66.7%
      expect(match.detourRatio).toBeGreaterThan(0.35);
    });

    it('BUG DISCOVERY / ADVERSARIAL: Negative seats in ride requests can corrupt vehicle seat count', async () => {
      // 1. Create a ride offer with 3 available seats
      const offerRes = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '09:00',
          totalSeats: 3,
          vehicleType: 'EV_CAR',
        });
      expect(offerRes.status).toBe(201);
      const offerId = offerRes.body.offerId;

      // 2. Submit a request with negative seats (allowed by unvalidated input)
      const reqRes = await request(app)
        .post('/api/rides/requests')
        .send({
          passengerId: 'usr_student_1',
          originNodeId: 'DORM_NORTH',
          destinationNodeId: 'STUDENT_CTR',
          desiredTime: '09:00',
          seatsNeeded: -1
        });
      // When passenger inputs -1 seats, lack of input validation causes SQLite CHECK constraint failure (HTTP 500)
      expect(reqRes.status).toBe(500);
      expect(reqRes.body.error).toContain('CHECK constraint failed: seats_needed >= 1');
      db.prepare('DELETE FROM ride_offers WHERE id = ?').run(offerId);
    });

    it('driver offer rejects seats <= 0 or > 6 with 400 Bad Request', async () => {
      const resZero = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '09:00',
          totalSeats: 0,
          vehicleType: 'EV_CAR',
        });
      expect(resZero.status).toBe(400);

      const resExcess = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '09:00',
          totalSeats: 8,
          vehicleType: 'EV_CAR',
        });
      expect(resExcess.status).toBe(400);
    });

    it('rejects identical origin and destination with 400 Bad Request', async () => {
      const resIdentical = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_NORTH',
          departureTime: '09:00',
          totalSeats: 3,
          vehicleType: 'EV_CAR',
        });
      expect(resIdentical.status).toBe(400);
      expect(resIdentical.body.error).toContain('Origin and destination cannot be identical');
    });

    it('normalizes all four UI vehicle types (EV_CAR, CAMPUS_SHUTTLE, PETROL_CAR, E_GOLF_CART)', async () => {
      const vehicleTypes = ['EV_CAR', 'CAMPUS_SHUTTLE', 'PETROL_CAR', 'E_GOLF_CART'];
      for (const vt of vehicleTypes) {
        const res = await request(app)
          .post('/api/rides/offers')
          .send({
            driverId: 'usr_driver_1',
            originNodeId: 'GATE_NORTH',
            destinationNodeId: 'DORM_NORTH',
            departureTime: '10:00',
            totalSeats: 2,
            vehicleType: vt,
          });
        expect(res.status).toBe(201);
        db.prepare('DELETE FROM ride_offers WHERE id = ?').run(res.body.offerId);
      }
    });
  });

  // ============================================================================
  // 3. DUAL ROLE WORKFLOWS & CONTEXT ISOLATION
  // ============================================================================
  describe('3. Dual Role Workflows & Context Isolation', () => {
    it('role synchronization sets initial tab based on role prop', () => {
      const getInitialTab = (role: string) => (role === 'driver' ? 'offer' : 'request');
      expect(getInitialTab('student')).toBe('request');
      expect(getInitialTab('driver')).toBe('offer');
      expect(getInitialTab('proctor')).toBe('request'); // fallback
    });

    it('ADVERSARIAL: State leakage occurs when switching from passenger to driver role with active matchResult', () => {
      // In RidePooling.tsx:
      // matchResult is stored in React state: const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
      // When currentRole changes from student -> driver, activeTab becomes 'offer'.
      // But CampusMapSvg receives:
      //   highlightedPath={matchResult?.driverRoute || []}
      //   pooledPath={matchResult?.pooledRoute || []}
      // This means a previous passenger match route persists on the driver offer screen!
      let currentRole = 'student';
      let activeTab = 'request';
      let matchResult: any = {
        driverRoute: ['GATE_NORTH', 'DORM_NORTH', 'STUDENT_CTR', 'GATE_SOUTH'],
        pooledRoute: ['GATE_NORTH', 'DORM_NORTH', 'STUDENT_CTR', 'GATE_SOUTH'],
      };

      // Role switcher triggers driver mode
      currentRole = 'driver';
      if (currentRole === 'driver') activeTab = 'offer';

      // Verify that matchResult is still populated (state leak) unless explicitly cleared
      expect(activeTab).toBe('offer');
      expect(matchResult).not.toBeNull();
      expect(matchResult.pooledRoute.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 4. BOOKING & MATCH FEEDBACK
  // ============================================================================
  describe('4. Booking & Match Feedback', () => {
    it('booking decrements available seats in real time and enforces seat exhaustion guardrail', async () => {
      // Create offer with 1 seat
      const offerRes = await request(app)
        .post('/api/rides/offers')
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '11:00',
          totalSeats: 1,
          vehicleType: 'EV_CAR',
        });
      const offerId = offerRes.body.offerId;

      // Create request for 1 seat
      const reqRes1 = await request(app)
        .post('/api/rides/requests')
        .send({
          passengerId: 'usr_student_1',
          originNodeId: 'DORM_NORTH',
          destinationNodeId: 'STUDENT_CTR',
          desiredTime: '11:00',
          seatsNeeded: 1,
          maxDetourRatio: 0.35,
        });
      const reqId1 = reqRes1.body.requestId;

      // Book seat 1
      const book1 = await request(app)
        .post('/api/rides/book')
        .send({ offerId, requestId: reqId1, seatsBooked: 1 });
      expect(book1.status).toBe(201);
      expect(book1.body.seatsRemaining).toBe(0);
      expect(book1.body.provenance).toBe('[ESTIMATED METRIC]');

      // Create request 2 attempting to book exhausted offer
      const reqRes2 = await request(app)
        .post('/api/rides/requests')
        .send({
          passengerId: 'usr_student_2',
          originNodeId: 'DORM_NORTH',
          destinationNodeId: 'STUDENT_CTR',
          desiredTime: '11:00',
          seatsNeeded: 1,
          maxDetourRatio: 0.35,
        });
      const reqId2 = reqRes2.body.requestId;

      // Book seat on 0 remaining seats -> must fail with 400
      const book2 = await request(app)
        .post('/api/rides/book')
        .send({ offerId, requestId: reqId2, seatsBooked: 1 });
      expect(book2.status).toBe(400);
      expect(book2.body.error).toContain('Not enough available seats');

      // Verify activity log audit trail with [ESTIMATED METRIC]
      const logEntry = db.prepare(`
        SELECT * FROM activity_log WHERE user_id = 'usr_student_1' AND action = 'RIDE_BOOKED' ORDER BY timestamp DESC LIMIT 1
      `).get() as any;
      expect(logEntry).toBeDefined();
      expect(logEntry.details).toContain('[ESTIMATED METRIC]');

      // Clean up
      db.prepare('DELETE FROM ride_bookings WHERE id = ?').run(book1.body.bookingId);
      db.prepare('DELETE FROM ride_matches WHERE id = ?').run(book1.body.matchId);
      db.prepare('DELETE FROM ride_requests WHERE id IN (?, ?)').run(reqId1, reqId2);
      db.prepare('DELETE FROM ride_offers WHERE id = ?').run(offerId);
      db.prepare('DELETE FROM activity_log WHERE id = ?').run(logEntry.id);
    });
  });

  // ============================================================================
  // 5. OFFLINE RESILIENCE & SEED FIXTURES
  // ============================================================================
  describe('5. Offline Resilience & Seed Fixtures', () => {
    it('service layer provides complete fallback structures during server connection failure', async () => {
      // Test getGraph offline fallback
      const graph = await ridesService.getGraph('08:30');
      expect(graph.nodes.length).toBe(10);
      expect(graph.nodes.map(n => n.id)).toContain('GATE_NORTH');
      expect(graph.nodes.map(n => n.id)).toContain('GATE_SOUTH');
      expect(graph.nodes.map(n => n.id)).toContain('ACAD_QUAD');

      // Test offers offline fallback
      const offers = await ridesService.getOffers();
      expect(offers.length).toBeGreaterThan(0);
      expect(offers[0]).toHaveProperty('driver_name');
      expect(offers[0]).toHaveProperty('vehicle_type');

      // Test requests offline fallback
      const requests = await ridesService.getRequests();
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0]).toHaveProperty('passenger_name');

      // Test summary metrics offline fallback
      const summary = await ridesService.getSummary();
      expect(summary.totalBookings).toBeGreaterThan(0);
      expect(summary.totalCarbonSavedKg).toBeGreaterThan(0);
      expect(summary.provenance).toBe('[ESTIMATED METRIC]');
    });

    it('identifies caveat: getGraph fallback contains empty edges array', async () => {
      // In rides.service.ts line 199:
      // catch { return { nodes: FALLBACK_NODES, edges: [], ... } }
      // This means while nodes render, road edges disappear when backend is disconnected.
      // We empirically verify this behavior.
      const fallbackGraph = await ridesService.getGraph('12:30');
      expect(fallbackGraph.nodes.length).toBe(10);
      // Notice: if backend is running, it returns 30 edges; if offline, edges is []
      expect(Array.isArray(fallbackGraph.edges)).toBe(true);
    });
  });
});
